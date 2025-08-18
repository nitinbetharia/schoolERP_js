const fs = require('fs').promises;
const path = require('path');
const db = require('./database-service');
const logger = require('../../config/logger');

class MigrationService {
  constructor() {
    this.migrationsPath = path.join(__dirname, '../../scripts/migrations');
  }

  async runMigrations(databaseType = 'master', trustCode = null) {
    try {
      const migrations = await this.getMigrations(databaseType);
      
      for (const migration of migrations) {
        await this.runMigration(migration, databaseType, trustCode);
      }
      
      logger.info(`Migrations completed for ${databaseType}`);
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }

  async getMigrations(databaseType) {
    const migrationDir = path.join(this.migrationsPath, databaseType);
    
    try {
      const files = await fs.readdir(migrationDir);
      return files
        .filter(file => file.endsWith('.sql'))
        .sort()
        .map(file => ({
          name: file,
          path: path.join(migrationDir, file)
        }));
    } catch (error) {
      logger.info(`No migrations found for ${databaseType}`);
      return [];
    }
  }

  async runMigration(migration, databaseType, trustCode) {
    try {
      const sql = await fs.readFile(migration.path, 'utf8');
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          if (databaseType === 'master') {
            await db.querySystem(statement);
          } else {
            await db.queryTrust(trustCode, statement);
          }
        }
      }
      
      await this.recordMigration(migration.name, databaseType, trustCode);
      logger.info(`Migration completed: ${migration.name}`);
    } catch (error) {
      console.error(`Migration failed: ${migration.name}`, error);
      throw error;
    }
  }

  async recordMigration(migrationName, databaseType, trustCode) {
    const sql = `
      INSERT INTO migration_versions (version, description, executed_at) 
      VALUES (?, ?, NOW())
      ON DUPLICATE KEY UPDATE executed_at = NOW()
    `;
    
    if (databaseType === 'master') {
      await db.querySystem(sql, [migrationName, `${databaseType} migration`]);
    } else {
      await db.queryTrust(trustCode, sql, [migrationName, `${databaseType} migration`]);
    }
  }

  async createTrustDatabase(trustCode) {
    try {
      const databaseName = `school_erp_trust_${trustCode}`;
      
      // Create database
      await db.createDatabase(databaseName);
      
      // Initialize connection
      await db.initTrust(trustCode);
      
      // Run trust schema migrations
      await this.runMigrations('trust', trustCode);
      
      logger.info(`Trust database created and initialized: ${trustCode}`);
      return true;
    } catch (error) {
      console.error(`Failed to create trust database: ${trustCode}`, error);
      throw error;
    }
  }
}

module.exports = new MigrationService();