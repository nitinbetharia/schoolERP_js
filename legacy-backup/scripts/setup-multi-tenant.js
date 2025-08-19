const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../config/logger');

/**
 * Multi-Tenant Database Setup Script
 * Creates proper separation between system and trust databases
 */

const SYSTEM_DB = 'school_erp_system';
const DEFAULT_TRUST_DB = 'school_erp_trust_default';

const dbConfig = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '', // Will be prompted if not set
  charset: 'utf8mb4'
};

class MultiTenantSetup {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      this.connection = await mysql.createConnection(dbConfig);
      logger.info('Connected to MySQL server');
      console.log('✅ Connected to MySQL server');
    } catch (error) {
      logger.error('Failed to connect to MySQL:', error);
      console.error('❌ Failed to connect to MySQL:', error.message);
      throw error;
    }
  }

  async createSystemDatabase() {
    try {
      console.log('🔧 Creating System Database...');

      // Read system database schema
      const schemaPath = path.join(__dirname, 'system-database-schema.sql');
      const schema = await fs.readFile(schemaPath, 'utf8');

      // Execute schema
      const statements = schema.split(';').filter(stmt => stmt.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          await this.connection.execute(statement);
        }
      }

      console.log('✅ System database created successfully');
      logger.info('System database created successfully');
    } catch (error) {
      console.error('❌ Failed to create system database:', error.message);
      logger.error('Failed to create system database:', error);
      throw error;
    }
  }

  async createTrustDatabase(trustCode = 'default', trustName = 'Default Trust') {
    try {
      const dbName = `school_erp_trust_${trustCode}`;
      console.log(`🏢 Creating Trust Database: ${dbName}...`);

      // Create database
      await this.connection.execute(
        `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      await this.connection.execute(`USE \`${dbName}\``);

      // Read trust database template
      const templatePath = path.join(__dirname, 'trust-database-template.sql');
      let template = await fs.readFile(templatePath, 'utf8');

      // Replace variables
      template = template.replace(/{trust_code}/g, trustCode);
      template = template.replace(/{trust_name}/g, trustName);

      // Execute template
      const statements = template.split(';').filter(stmt => stmt.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          await this.connection.execute(statement);
        }
      }

      console.log(`✅ Trust database ${dbName} created successfully`);
      logger.info(`Trust database ${dbName} created successfully`);

      return dbName;
    } catch (error) {
      console.error(`❌ Failed to create trust database: ${error.message}`);
      logger.error('Failed to create trust database:', error);
      throw error;
    }
  }

  async registerTrust(trustCode, trustName, adminEmail, dbName) {
    try {
      console.log(`📝 Registering trust in system database...`);

      await this.connection.execute(`USE \`${SYSTEM_DB}\``);

      // Check if super admin exists
      const [admins] = await this.connection.execute(
        'SELECT id FROM system_users WHERE role = "SUPER_ADMIN" LIMIT 1'
      );

      let createdBy = 1;
      if (admins.length === 0) {
        // Create default super admin
        await this.connection.execute(`
          INSERT INTO system_users (username, email, password_hash, first_name, last_name, role, is_active)
          VALUES ('superadmin', 'admin@schoolerp.com', '$2b$10$dummy.hash.for.setup', 'Super', 'Admin', 'SUPER_ADMIN', 1)
        `);
        createdBy = 1;
      } else {
        createdBy = admins[0].id;
      }

      // Register trust
      await this.connection.execute(
        `
        INSERT INTO trusts (
          trust_name, trust_code, subdomain, contact_email,
          database_name, database_status, created_by
        ) VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?)
      `,
        [trustName, trustCode, trustCode, adminEmail, dbName, createdBy]
      );

      console.log(`✅ Trust registered successfully`);
      logger.info(`Trust ${trustCode} registered successfully`);
    } catch (error) {
      console.error(`❌ Failed to register trust: ${error.message}`);
      logger.error('Failed to register trust:', error);
      throw error;
    }
  }

  async setupEnhancedReporting(trustCode = 'default') {
    try {
      const dbName = `school_erp_trust_${trustCode}`;
      console.log(`📊 Setting up Enhanced Reporting Framework in ${dbName}...`);

      await this.connection.execute(`USE \`${dbName}\``);

      // Read enhanced reports schema
      const reportsSchemaPath = path.join(__dirname, 'enhanced-reports-schema.sql');
      const schema = await fs.readFile(reportsSchemaPath, 'utf8');

      // Execute schema
      const statements = schema.split(';').filter(stmt => stmt.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          await this.connection.execute(statement);
        }
      }

      console.log(`✅ Enhanced Reporting Framework setup completed`);
      logger.info(`Enhanced Reporting Framework setup completed for ${trustCode}`);
    } catch (error) {
      console.error(`❌ Failed to setup Enhanced Reporting: ${error.message}`);
      logger.error('Failed to setup Enhanced Reporting:', error);
      throw error;
    }
  }

  async createDefaultAdminUser(trustCode = 'default') {
    try {
      const dbName = `school_erp_trust_${trustCode}`;
      console.log(`👤 Creating default admin user in ${dbName}...`);

      await this.connection.execute(`USE \`${dbName}\``);

      // Create default academic year
      await this.connection.execute(`
        INSERT IGNORE INTO academic_years (year_name, start_date, end_date, is_current, status)
        VALUES ('2024-25', '2024-04-01', '2025-03-31', 1, 'ACTIVE')
      `);

      // Create default school
      await this.connection.execute(`
        INSERT IGNORE INTO schools (school_name, school_code, status)
        VALUES ('Default School', 'SCH001', 'ACTIVE')
      `);

      // Create admin user
      await this.connection.execute(`
        INSERT IGNORE INTO users (
          employee_id, first_name, last_name, email, 
          password_hash, role, status, school_id
        ) VALUES (
          'ADMIN001', 'Trust', 'Admin', 'admin@${trustCode}.com',
          '$2b$10$dummy.hash.for.setup', 'TRUST_ADMIN', 'ACTIVE', 1
        )
      `);

      console.log(`✅ Default admin user created: admin@${trustCode}.com`);
      logger.info(`Default admin user created for trust ${trustCode}`);
    } catch (error) {
      console.error(`❌ Failed to create admin user: ${error.message}`);
      logger.error('Failed to create admin user:', error);
      throw error;
    }
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
      console.log('✅ Database connection closed');
      logger.info('Database connection closed');
    }
  }

  async setupComplete() {
    try {
      await this.connect();

      console.log('🚀 Starting Multi-Tenant Database Setup...\n');

      // Step 1: Create System Database
      await this.createSystemDatabase();

      // Step 2: Create Default Trust Database
      const defaultTrustDb = await this.createTrustDatabase('default', 'Default Trust');

      // Step 3: Register Trust in System
      await this.registerTrust('default', 'Default Trust', 'admin@default.com', defaultTrustDb);

      // Step 4: Setup Enhanced Reporting
      await this.setupEnhancedReporting('default');

      // Step 5: Create Default Admin
      await this.createDefaultAdminUser('default');

      console.log('\n🎉 Multi-Tenant Database Setup Completed Successfully!');
      console.log('\n📋 Setup Summary:');
      console.log(`   System Database: ${SYSTEM_DB}`);
      console.log(`   Default Trust Database: ${defaultTrustDb}`);
      console.log(`   Default Admin: admin@default.com`);
      console.log(`   Enhanced Reporting: ✅ Enabled`);
      console.log('\n🔗 Next Steps:');
      console.log('   1. Update application configuration to use new database structure');
      console.log('   2. Implement tenant resolution middleware');
      console.log('   3. Update connection pooling for multi-database access');

      logger.info('Multi-tenant database setup completed successfully');
    } catch (error) {
      console.error('\n💥 Setup failed:', error.message);
      logger.error('Multi-tenant setup failed:', error);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new MultiTenantSetup();
  setup.setupComplete().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = MultiTenantSetup;
