#!/usr/bin/env node

/**
 * Migrate System Database Script
 * Runs migrations on the system database using standardized configuration
 */

const config = require('../config');
const dbUtil = require('../utils/database-util');
const path = require('path');
const fs = require('fs').promises;

class SystemDbMigrator {
  constructor() {
    this.migrationsDir = path.join(__dirname, 'migrations', 'system');
    this.migrationTable = '_migrations';
  }

  async ensureMigrationTable() {
    const connection = await dbUtil.getSystemConnection();

    try {
      // Create migrations table if it doesn't exist
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS ${this.migrationTable} (
          id INT AUTO_INCREMENT PRIMARY KEY,
          migration_name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_migration_name (migration_name)
        )
      `);

      console.log('✅ Migration table ready');
    } finally {
      await connection.end();
    }
  }

  async getExecutedMigrations() {
    const connection = await dbUtil.getSystemConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT migration_name FROM ${this.migrationTable} ORDER BY executed_at`
      );
      return rows.map(row => row.migration_name);
    } finally {
      await connection.end();
    }
  }

  async getPendingMigrations() {
    try {
      // Get all migration files
      const files = await fs.readdir(this.migrationsDir);
      const migrationFiles = files.filter(file => file.endsWith('.sql')).sort();

      // Get executed migrations
      const executed = await this.getExecutedMigrations();

      // Find pending migrations
      const pending = migrationFiles.filter(file => {
        const migrationName = path.basename(file, '.sql');
        return !executed.includes(migrationName);
      });

      return pending;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('⚠️  Migrations directory not found, creating it...');
        await fs.mkdir(this.migrationsDir, { recursive: true });
        return [];
      }
      throw error;
    }
  }

  async executeMigration(migrationFile) {
    const migrationPath = path.join(this.migrationsDir, migrationFile);
    const migrationName = path.basename(migrationFile, '.sql');

    console.log(`  📄 Executing: ${migrationName}`);

    const connection = await dbUtil.getSystemConnection();

    try {
      // Execute the migration file
      await dbUtil.executeSqlFile(connection, migrationPath);

      // Record the migration as executed
      await connection.execute(`INSERT INTO ${this.migrationTable} (migration_name) VALUES (?)`, [
        migrationName
      ]);

      console.log(`  ✅ Completed: ${migrationName}`);
    } finally {
      await connection.end();
    }
  }

  async runMigrations() {
    try {
      const systemDbName = config.getSystemDbName();

      console.log('🔄 System Database Migrations');
      console.log('=============================');
      console.log(`Database: ${systemDbName}`);
      console.log('');

      // Check if system database exists
      const exists = await dbUtil.databaseExists(systemDbName);
      if (!exists) {
        throw new Error(`System database does not exist: ${systemDbName}. Run setup first.`);
      }

      // Ensure migration table exists
      await this.ensureMigrationTable();

      // Get pending migrations
      const pending = await this.getPendingMigrations();

      if (pending.length === 0) {
        console.log('✅ No pending migrations');
        return;
      }

      console.log(`Found ${pending.length} pending migration(s):`);
      pending.forEach(file => console.log(`  - ${file}`));
      console.log('');

      // Execute each migration
      for (const migrationFile of pending) {
        await this.executeMigration(migrationFile);
      }

      console.log(`\n✅ All ${pending.length} migration(s) completed successfully!`);
    } catch (error) {
      console.error(`❌ Migration failed: ${error.message}`);
      throw error;
    }
  }

  async getMigrationStatus() {
    try {
      const systemDbName = config.getSystemDbName();

      console.log('📊 System Migration Status');
      console.log('==========================');
      console.log(`Database: ${systemDbName}`);
      console.log('');

      // Check if database exists
      const exists = await dbUtil.databaseExists(systemDbName);
      if (!exists) {
        console.log('❌ System database does not exist');
        return;
      }

      // Ensure migration table exists
      await this.ensureMigrationTable();

      // Get executed and pending migrations
      const executed = await this.getExecutedMigrations();
      const pending = await this.getPendingMigrations();

      console.log(`Executed migrations: ${executed.length}`);
      if (executed.length > 0) {
        executed.forEach(migration => console.log(`  ✅ ${migration}`));
      }

      console.log(`\nPending migrations: ${pending.length}`);
      if (pending.length > 0) {
        pending.forEach(migration => console.log(`  ⏳ ${migration}`));
      }

      if (pending.length === 0) {
        console.log('\n🎉 Database is up to date!');
      } else {
        console.log('\n⚠️  Run migrations to update database');
      }
    } catch (error) {
      console.error(`❌ Status check failed: ${error.message}`);
      throw error;
    }
  }

  async createMigration(name) {
    try {
      if (!name) {
        throw new Error('Migration name is required');
      }

      // Ensure migrations directory exists
      await fs.mkdir(this.migrationsDir, { recursive: true });

      // Generate timestamp
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:]/g, '')
        .replace('T', '_')
        .substring(0, 15);

      const migrationName = `${timestamp}_${name}`;
      const migrationFile = `${migrationName}.sql`;
      const migrationPath = path.join(this.migrationsDir, migrationFile);

      // Create migration template
      const template = `-- Migration: ${migrationName}
-- Created: ${new Date().toISOString()}
-- Description: ${name}

-- Add your migration SQL here
-- Example:
-- CREATE TABLE example (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   name VARCHAR(255) NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- ALTER TABLE existing_table ADD COLUMN new_column VARCHAR(100);

-- Remember to test your migration before running it in production!
`;

      await fs.writeFile(migrationPath, template);

      console.log('📝 Migration created successfully!');
      console.log(`File: ${migrationPath}`);
      console.log('\nEdit the file to add your SQL statements.');
    } catch (error) {
      console.error(`❌ Migration creation failed: ${error.message}`);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const migrator = new SystemDbMigrator();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
System Database Migration Script
===============================

Usage:
  node migrate-system-database.js [options]

Options:
  --run                   Run pending migrations (default)
  --status                Show migration status
  --create=<name>         Create new migration file
  --help, -h              Show this help

Examples:
  node migrate-system-database.js
  node migrate-system-database.js --status
  node migrate-system-database.js --create="add_user_roles_table"
`);
    return;
  }

  try {
    if (args.includes('--status')) {
      await migrator.getMigrationStatus();
    } else if (args.some(arg => arg.startsWith('--create='))) {
      const createArg = args.find(arg => arg.startsWith('--create='));
      const name = createArg.split('=')[1];
      await migrator.createMigration(name);
    } else {
      await migrator.runMigrations();
    }
  } catch (error) {
    console.error(`\n❌ Operation failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = SystemDbMigrator;
