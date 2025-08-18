/**
 * Enhanced Database Setup Script
 * Creates comprehensive multi-tenant structure with all missing components
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

class DatabaseSetup {
  constructor() {
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      masterDatabase: process.env.DB_MASTER_NAME || 'school_erp_master',
      defaultTrustDb: 'school_erp_trust_default'
    };

    this.schemaFile = path.join(__dirname, 'database-schema.sql');
  }

  async getConnection(database = null) {
    const connectionConfig = {
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      multipleStatements: true
    };

    if (database) {
      connectionConfig.database = database;
    }

    return await mysql.createConnection(connectionConfig);
  }

  async validateEnvironment() {
    if (!process.env.DB_HOST || !process.env.DB_USER) {
      throw new Error('Missing required database configuration. Please check your .env file.');
    }

    if (!fs.existsSync(this.schemaFile)) {
      throw new Error(`Database schema file not found: ${this.schemaFile}`);
    }
  }

  async createDatabases() {
    console.log('📁 Creating databases...');
    const connection = await this.getConnection();

    try {
      // Create master database
      await connection.execute(`
        CREATE DATABASE IF NOT EXISTS \`${this.config.masterDatabase}\` 
        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
      `);
      console.log(`  ✅ Master database: ${this.config.masterDatabase}`);

      // Create default trust database
      await connection.execute(`
        CREATE DATABASE IF NOT EXISTS \`${this.config.defaultTrustDb}\` 
        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
      `);
      console.log(`  ✅ Default trust database: ${this.config.defaultTrustDb}`);

      return true;
    } finally {
      await connection.end();
    }
  }

  async executeSchemaFile() {
    console.log('🗄️  Creating database schema from file...');

    const sqlContent = fs.readFileSync(this.schemaFile, 'utf8');
    const sections = this.parseSQLSections(sqlContent);

    for (const section of sections) {
      if (section.database && section.sql) {
        console.log(`  📋 Executing schema for: ${section.database}`);
        const connection = await this.getConnection(section.database);

        try {
          const statements = section.sql
            .split(';')
            .filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'));

          for (const statement of statements) {
            if (statement.trim()) {
              await connection.execute(statement.trim());
            }
          }
        } finally {
          await connection.end();
        }
      }
    }

    console.log('  ✅ Database schema created successfully');
  }

  parseSQLSections(sqlContent) {
    const sections = [];
    let currentSection = { database: null, sql: '' };

    const lines = sqlContent.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check for database creation/use statements
      const createDbMatch = trimmedLine.match(/CREATE DATABASE.*\`(.+?)\`/i);
      const useDbMatch = trimmedLine.match(/USE \`(.+?)\`/i);

      if (createDbMatch || useDbMatch) {
        // Save previous section if it has content
        if (currentSection.database && currentSection.sql.trim()) {
          sections.push({ ...currentSection });
        }

        // Start new section
        const dbName = createDbMatch ? createDbMatch[1] : useDbMatch[1];
        currentSection = { database: dbName, sql: line + '\n' };
      } else {
        currentSection.sql += line + '\n';
      }
    }

    // Add the last section
    if (currentSection.database && currentSection.sql.trim()) {
      sections.push(currentSection);
    }

    // If no database sections found, create sections for both databases
    if (sections.length === 0) {
      const masterSection = sqlContent.substring(0, sqlContent.indexOf('-- TRUST DATABASE SCHEMA'));
      const trustSection = sqlContent.substring(sqlContent.indexOf('-- TRUST DATABASE SCHEMA'));

      sections.push({ database: this.config.masterDatabase, sql: masterSection });
      if (trustSection.trim()) {
        sections.push({ database: this.config.defaultTrustDb, sql: trustSection });
      }
    }

    return sections;
  }

  async insertSeedData() {
    console.log('🌱 Inserting seed data...');

    // Insert master database seed data
    await this.insertMasterSeedData();

    // Insert trust database seed data
    await this.insertTrustSeedData();

    console.log('  ✅ Seed data inserted successfully');
  }

  async insertMasterSeedData() {
    console.log('  📊 Master database seed data...');
    const connection = await this.getConnection(this.config.masterDatabase);

    try {
      const hashedPassword = await bcrypt.hash('nitin@123', 10);

      // Insert system user
      await connection.execute(
        `
        INSERT INTO system_users (username, email, password, first_name, last_name, role, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
        password = VALUES(password), updated_at = NOW()
      `,
        ['nitin', 'nitin@gmail.com', hashedPassword, 'Nitin', 'Admin', 'SUPER_ADMIN', 'ACTIVE']
      );

      // Insert default trust
      await connection.execute(
        `
        INSERT INTO trusts (trust_name, trust_code, database_name, admin_email, contact_phone, address, city, state, pincode, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
        admin_email = VALUES(admin_email), updated_at = NOW()
      `,
        [
          'Default School Trust',
          'DEFAULT',
          this.config.defaultTrustDb,
          'nitin@gmail.com',
          '+91-9876543210',
          '123 Education Street',
          'Demo City',
          'Demo State',
          '123456',
          'ACTIVE'
        ]
      );

      // Insert system configuration
      const systemConfigs = [
        ['SYSTEM_NAME', 'School ERP System', 'STRING', 'Application name'],
        ['SYSTEM_VERSION', '1.0.0', 'STRING', 'Current system version'],
        ['MAINTENANCE_MODE', 'false', 'BOOLEAN', 'System maintenance mode'],
        ['DEFAULT_LANGUAGE', 'en', 'STRING', 'Default system language'],
        ['SESSION_TIMEOUT', '3600', 'NUMBER', 'Session timeout in seconds'],
        ['PASSWORD_MIN_LENGTH', '8', 'NUMBER', 'Minimum password length'],
        ['BACKUP_RETENTION_DAYS', '30', 'NUMBER', 'Backup retention period'],
        ['EMAIL_NOTIFICATIONS_ENABLED', 'true', 'BOOLEAN', 'Enable email notifications'],
        ['SMS_NOTIFICATIONS_ENABLED', 'false', 'BOOLEAN', 'Enable SMS notifications'],
        ['MULTI_TENANT_ENABLED', 'true', 'BOOLEAN', 'Enable multi-tenant support'],
        ['DEFAULT_TIMEZONE', 'Asia/Kolkata', 'STRING', 'Default system timezone'],
        ['CURRENCY_CODE', 'INR', 'STRING', 'Default currency code'],
        ['DATE_FORMAT', 'DD/MM/YYYY', 'STRING', 'Default date format'],
        ['ACADEMIC_YEAR_START_MONTH', '4', 'NUMBER', 'Academic year start month (April = 4)']
      ];

      for (const [key, value, type, description] of systemConfigs) {
        await connection.execute(
          `
          INSERT INTO system_config (config_key, config_value, data_type, description, created_at, updated_at)
          VALUES (?, ?, ?, ?, NOW(), NOW())
          ON DUPLICATE KEY UPDATE
          config_value = VALUES(config_value), updated_at = NOW()
        `,
          [key, value, type, description]
        );
      }

      console.log('    ✅ System user and configuration inserted');
    } finally {
      await connection.end();
    }
  }

  async insertTrustSeedData() {
    console.log('  🏫 Trust database seed data...');
    const connection = await this.getConnection(this.config.defaultTrustDb);

    try {
      const hashedPassword = await bcrypt.hash('nitin@123', 10);

      // Insert admin user for the trust
      await connection.execute(
        `
        INSERT INTO users (first_name, last_name, email, phone, password, role, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
        password = VALUES(password), updated_at = NOW()
      `,
        ['Nitin', 'Admin', 'nitin@gmail.com', '+91-9876543210', hashedPassword, 'ADMIN', 'ACTIVE']
      );

      // Insert trust configuration
      const trustConfigs = [
        ['TRUST_NAME', 'Default School Trust', 'STRING', 'Trust/School name'],
        ['ACADEMIC_YEAR', '2024-25', 'STRING', 'Current academic year'],
        ['CURRENCY', 'INR', 'STRING', 'Default currency'],
        ['TIME_ZONE', 'Asia/Kolkata', 'STRING', 'Trust timezone'],
        ['STUDENT_ID_PREFIX', 'STU', 'STRING', 'Student ID prefix'],
        ['FEE_LATE_FINE_PERCENTAGE', '2', 'NUMBER', 'Late fee fine percentage'],
        ['ADMISSION_OPEN', 'true', 'BOOLEAN', 'Admission process open'],
        ['ONLINE_PAYMENT_ENABLED', 'true', 'BOOLEAN', 'Enable online payments'],
        ['SMS_ENABLED', 'false', 'BOOLEAN', 'Enable SMS notifications'],
        ['EMAIL_ENABLED', 'true', 'BOOLEAN', 'Enable email notifications'],
        ['BACKUP_ENABLED', 'true', 'BOOLEAN', 'Enable automatic backups'],
        ['REPORT_AUTO_GENERATION', 'true', 'BOOLEAN', 'Enable automatic report generation']
      ];

      for (const [key, value, type, description] of trustConfigs) {
        await connection.execute(
          `
          INSERT INTO trust_config (config_key, config_value, data_type, description, created_at, updated_at)
          VALUES (?, ?, ?, ?, NOW(), NOW())
          ON DUPLICATE KEY UPDATE
          config_value = VALUES(config_value), updated_at = NOW()
        `,
          [key, value, type, description]
        );
      }

      console.log('    ✅ Trust configuration inserted');
    } finally {
      await connection.end();
    }
  }

  async validateSetup() {
    console.log('🔍 Validating database setup...');

    try {
      // Check master database
      const masterConnection = await this.getConnection(this.config.masterDatabase);
      const [masterTables] = await masterConnection.execute('SHOW TABLES');
      await masterConnection.end();

      // Check trust database
      const trustConnection = await this.getConnection(this.config.defaultTrustDb);
      const [trustTables] = await trustConnection.execute('SHOW TABLES');
      await trustConnection.end();

      console.log(`  ✅ Master database: ${masterTables.length} tables`);
      console.log(`  ✅ Trust database: ${trustTables.length} tables`);

      return true;
    } catch (error) {
      console.error('  ❌ Validation failed:', error.message);
      return false;
    }
  }

  async performSetup(options = {}) {
    console.log('🚀 Starting enhanced database setup...');
    console.log(
      `🔗 Connecting to MySQL at ${this.config.host}:${this.config.port} as ${this.config.user}...`
    );

    try {
      // Validate environment
      await this.validateEnvironment();

      // Test connection
      const testConnection = await this.getConnection();
      await testConnection.execute('SELECT 1');
      await testConnection.end();
      console.log('✅ Connected to MySQL server');

      // Perform setup steps
      if (!options.seedOnly) {
        await this.createDatabases();
        await this.executeSchemaFile();
      }

      if (!options.migrateOnly) {
        await this.insertSeedData();
      }

      // Validate setup
      await this.validateSetup();

      console.log('\n🎉 Enhanced database setup completed successfully!');
      console.log('\n📋 System Information:');
      console.log(`  Master Database: ${this.config.masterDatabase}`);
      console.log(`  Default Trust DB: ${this.config.defaultTrustDb}`);
      console.log('\n🔑 Default login credentials:');
      console.log('  Email: nitin@gmail.com');
      console.log('  Password: nitin@123');
      console.log('\n📋 Next steps:');
      console.log('  1. Run: npm run dev');
      console.log('  2. Visit: http://localhost:3000');
      console.log('  3. Use the credentials above to login');

      return true;
    } catch (error) {
      console.error('❌ Database setup failed:', error.message);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    migrateOnly: args.includes('--migrate-only'),
    seedOnly: args.includes('--seed-only')
  };

  const setup = new DatabaseSetup();

  try {
    await setup.performSetup(options);
    process.exit(0);
  } catch (error) {
    console.error('Setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DatabaseSetup;
