#!/usr/bin/env node

/**
 * Database Reset Script
 * Comprehensive database reset system for School ERP multi-tenant architecture
 * WARNING: This script will permanently delete all data!
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const readline = require('readline');

// Load configuration
require('dotenv').config();

class DatabaseReset {
  constructor() {
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      masterDatabase: process.env.DB_MASTER_NAME || 'school_erp_master'
    };

    this.schemaFile = path.join(__dirname, 'database-schema.sql');
  }

  /**
   * Create confirmation prompt
   */
  async confirmReset(resetType = 'FULL') {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise(resolve => {
      console.log('\n⚠️  WARNING: DATABASE RESET OPERATION ⚠️');
      console.log('==========================================');
      console.log(`Reset Type: ${resetType}`);
      console.log('This operation will:');

      if (resetType === 'FULL') {
        console.log('  • DROP all databases (master + all trusts)');
        console.log('  • DELETE all data permanently');
        console.log('  • RECREATE database structure');
        console.log('  • INSERT default seed data');
      } else if (resetType === 'STRUCTURE') {
        console.log('  • DROP and RECREATE all tables');
        console.log('  • PRESERVE database connections');
        console.log('  • DELETE all data permanently');
        console.log('  • RECREATE table structure');
      } else if (resetType === 'DATA') {
        console.log('  • TRUNCATE all tables');
        console.log('  • PRESERVE table structure');
        console.log('  • DELETE all data permanently');
        console.log('  • INSERT default seed data');
      }

      console.log('\n❌ THIS OPERATION CANNOT BE UNDONE! ❌');
      console.log('Make sure you have a recent backup before proceeding.\n');

      rl.question(
        'Are you absolutely sure you want to continue? Type "RESET CONFIRMED" to proceed: ',
        answer => {
          rl.close();
          resolve(answer === 'RESET CONFIRMED');
        }
      );
    });
  }

  /**
   * Get connection without database selection
   */
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

  /**
   * Get all trust databases from master database
   */
  async getTrustDatabases() {
    try {
      const connection = await this.getConnection(this.config.masterDatabase);

      const [rows] = await connection.execute(
        'SELECT id, trust_code, database_name FROM trusts WHERE status = ?',
        ['ACTIVE']
      );

      await connection.end();
      return rows;
    } catch (error) {
      console.log('Could not fetch trust databases (master DB might not exist)');
      return [];
    }
  }

  /**
   * Drop all databases
   */
  async dropAllDatabases() {
    console.log('Dropping all databases...');
    const connection = await this.getConnection();

    try {
      // Get all trust databases first
      const trustDatabases = await this.getTrustDatabases();

      // Drop all trust databases
      for (const trust of trustDatabases) {
        console.log(`  Dropping trust database: ${trust.database_name}`);
        await connection.execute(`DROP DATABASE IF EXISTS \`${trust.database_name}\``);
      }

      // Drop master database
      console.log(`  Dropping master database: ${this.config.masterDatabase}`);
      await connection.execute(`DROP DATABASE IF EXISTS \`${this.config.masterDatabase}\``);

      console.log('✅ All databases dropped successfully');
      return true;
    } catch (error) {
      console.error('❌ Error dropping databases:', error.message);
      return false;
    } finally {
      await connection.end();
    }
  }

  /**
   * Execute SQL file
   */
  async executeSQLFile(filePath, database = null) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`SQL file not found: ${filePath}`);
    }

    const sqlContent = fs.readFileSync(filePath, 'utf8');
    const connection = await this.getConnection(database);

    try {
      // Split SQL content by database sections
      const sections = this.parseSQLSections(sqlContent);

      for (const section of sections) {
        if (section.database && section.sql) {
          console.log(`  Executing SQL for: ${section.database}`);

          // Create database if it doesn't exist
          if (section.database !== database) {
            await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${section.database}\` 
                            CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
            await connection.execute(`USE \`${section.database}\``);
          }

          // Execute SQL statements
          const statements = section.sql.split(';').filter(stmt => stmt.trim());
          for (const statement of statements) {
            if (statement.trim()) {
              await connection.execute(statement);
            }
          }
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Error executing SQL file:', error.message);
      throw error;
    } finally {
      await connection.end();
    }
  }

  /**
   * Parse SQL file into database sections
   */
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

    // If no database sections found, treat as single section
    if (sections.length === 0) {
      sections.push({ database: this.config.masterDatabase, sql: sqlContent });
    }

    return sections;
  }

  /**
   * Insert seed data
   */
  async insertSeedData() {
    console.log('Inserting seed data...');
    const connection = await this.getConnection(this.config.masterDatabase);

    try {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('nitin@123', 10);

      // Insert system user
      const [userResult] = await connection.execute(
        `
                INSERT INTO system_users (username, email, password, role, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
                ON DUPLICATE KEY UPDATE
                password = VALUES(password), updated_at = NOW()
            `,
        ['nitin', 'nitin@gmail.com', hashedPassword, 'SUPER_ADMIN', 'ACTIVE']
      );

      console.log('  ✅ System user created/updated: nitin@gmail.com');

      // Insert default trust
      const [trustResult] = await connection.execute(
        `
                INSERT INTO trusts (trust_name, trust_code, database_name, admin_email, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
                ON DUPLICATE KEY UPDATE
                admin_email = VALUES(admin_email), updated_at = NOW()
            `,
        ['Default Trust', 'DEFAULT', 'school_erp_trust_default', 'nitin@gmail.com', 'ACTIVE']
      );

      const trustId = trustResult.insertId || 1;
      console.log('  ✅ Default trust created/updated');

      // Insert system configuration
      const configs = [
        ['SYSTEM_NAME', 'School ERP System', 'STRING', 'Application name'],
        ['SYSTEM_VERSION', '1.0.0', 'STRING', 'Current system version'],
        ['MAINTENANCE_MODE', 'false', 'BOOLEAN', 'System maintenance mode'],
        ['DEFAULT_LANGUAGE', 'en', 'STRING', 'Default system language'],
        ['SESSION_TIMEOUT', '3600', 'NUMBER', 'Session timeout in seconds'],
        ['PASSWORD_MIN_LENGTH', '8', 'NUMBER', 'Minimum password length'],
        ['BACKUP_RETENTION_DAYS', '30', 'NUMBER', 'Backup retention period'],
        ['EMAIL_NOTIFICATIONS_ENABLED', 'true', 'BOOLEAN', 'Enable email notifications'],
        ['SMS_NOTIFICATIONS_ENABLED', 'false', 'BOOLEAN', 'Enable SMS notifications']
      ];

      for (const [key, value, type, description] of configs) {
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

      console.log('  ✅ System configuration inserted/updated');

      // Create trust database and insert trust-specific data
      await this.createTrustDatabase('school_erp_trust_default', trustId);

      return true;
    } catch (error) {
      console.error('❌ Error inserting seed data:', error.message);
      throw error;
    } finally {
      await connection.end();
    }
  }

  /**
   * Create trust database with initial data
   */
  async createTrustDatabase(databaseName, trustId) {
    console.log(`  Creating trust database: ${databaseName}`);
    const connection = await this.getConnection();

    try {
      // Create database
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` 
                CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

      await connection.execute(`USE \`${databaseName}\``);

      // Read and execute trust schema from the main schema file
      const schemaContent = fs.readFileSync(this.schemaFile, 'utf8');
      const trustSchemaStart = schemaContent.indexOf('-- TRUST DATABASE SCHEMA');
      const trustSchemaEnd = schemaContent.indexOf('-- END TRUST DATABASE SCHEMA');

      if (trustSchemaStart !== -1 && trustSchemaEnd !== -1) {
        const trustSchema = schemaContent.substring(trustSchemaStart, trustSchemaEnd);
        const statements = trustSchema
          .split(';')
          .filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'));

        for (const statement of statements) {
          if (statement.trim()) {
            await connection.execute(statement.trim());
          }
        }
      }

      // Insert default admin user for the trust
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('nitin@123', 10);

      await connection.execute(
        `
                INSERT INTO users (first_name, last_name, email, password, role, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
            `,
        ['Nitin', 'Admin', 'nitin@gmail.com', hashedPassword, 'ADMIN', 'ACTIVE']
      );

      // Insert trust configuration
      const trustConfigs = [
        ['TRUST_NAME', 'Default Trust', 'STRING', 'Trust/School name'],
        ['ACADEMIC_YEAR', '2024-25', 'STRING', 'Current academic year'],
        ['CURRENCY', 'INR', 'STRING', 'Default currency'],
        ['TIME_ZONE', 'Asia/Kolkata', 'STRING', 'Trust timezone'],
        ['STUDENT_ID_PREFIX', 'STU', 'STRING', 'Student ID prefix'],
        ['FEE_LATE_FINE_PERCENTAGE', '2', 'NUMBER', 'Late fee fine percentage'],
        ['ADMISSION_OPEN', 'true', 'BOOLEAN', 'Admission process open'],
        ['ONLINE_PAYMENT_ENABLED', 'true', 'BOOLEAN', 'Enable online payments']
      ];

      for (const [key, value, type, description] of trustConfigs) {
        await connection.execute(
          `
                    INSERT INTO trust_config (config_key, config_value, data_type, description, created_at, updated_at)
                    VALUES (?, ?, ?, ?, NOW(), NOW())
                `,
          [key, value, type, description]
        );
      }

      console.log(`  ✅ Trust database created: ${databaseName}`);
      return true;
    } catch (error) {
      console.error(`❌ Error creating trust database ${databaseName}:`, error.message);
      throw error;
    } finally {
      await connection.end();
    }
  }

  /**
   * Perform full reset
   */
  async performFullReset() {
    console.log('\n🔄 Starting FULL database reset...');

    try {
      // Step 1: Drop all databases
      await this.dropAllDatabases();

      // Step 2: Execute schema file to recreate structure
      console.log('Recreating database structure...');
      await this.executeSQLFile(this.schemaFile);

      // Step 3: Insert seed data
      await this.insertSeedData();

      console.log('\n✅ FULL database reset completed successfully!');
      console.log('Default login credentials:');
      console.log('  Email: nitin@gmail.com');
      console.log('  Password: nitin@123');

      return true;
    } catch (error) {
      console.error('\n❌ Full reset failed:', error.message);
      return false;
    }
  }

  /**
   * Perform structure reset (drop tables, keep databases)
   */
  async performStructureReset() {
    console.log('\n🔄 Starting STRUCTURE reset...');

    try {
      const connection = await this.getConnection();

      // Get all databases
      const trustDatabases = await this.getTrustDatabases();
      const allDatabases = [
        this.config.masterDatabase,
        ...trustDatabases.map(t => t.database_name)
      ];

      // Drop all tables in each database
      for (const dbName of allDatabases) {
        console.log(`  Resetting structure for: ${dbName}`);

        await connection.execute(`USE \`${dbName}\``);

        // Get all tables
        const [tables] = await connection.execute('SHOW TABLES');

        // Disable foreign key checks
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

        // Drop all tables
        for (const table of tables) {
          const tableName = Object.values(table)[0];
          await connection.execute(`DROP TABLE IF EXISTS \`${tableName}\``);
        }

        // Re-enable foreign key checks
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
      }

      await connection.end();

      // Recreate structure
      console.log('Recreating table structure...');
      await this.executeSQLFile(this.schemaFile);

      // Insert seed data
      await this.insertSeedData();

      console.log('\n✅ STRUCTURE reset completed successfully!');
      return true;
    } catch (error) {
      console.error('\n❌ Structure reset failed:', error.message);
      return false;
    }
  }

  /**
   * Perform data reset (truncate tables, keep structure)
   */
  async performDataReset() {
    console.log('\n🔄 Starting DATA reset...');

    try {
      const connection = await this.getConnection();

      // Get all databases
      const trustDatabases = await this.getTrustDatabases();
      const allDatabases = [
        this.config.masterDatabase,
        ...trustDatabases.map(t => t.database_name)
      ];

      // Truncate all tables in each database
      for (const dbName of allDatabases) {
        console.log(`  Clearing data for: ${dbName}`);

        await connection.execute(`USE \`${dbName}\``);

        // Disable foreign key checks
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

        // Get all tables
        const [tables] = await connection.execute('SHOW TABLES');

        // Truncate all tables
        for (const table of tables) {
          const tableName = Object.values(table)[0];
          await connection.execute(`TRUNCATE TABLE \`${tableName}\``);
        }

        // Re-enable foreign key checks
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
      }

      await connection.end();

      // Insert seed data
      await this.insertSeedData();

      console.log('\n✅ DATA reset completed successfully!');
      return true;
    } catch (error) {
      console.error('\n❌ Data reset failed:', error.message);
      return false;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const resetType = (args[0] || 'full').toUpperCase();
  const skipConfirmation = args.includes('--force') || args.includes('-f');

  const reset = new DatabaseReset();

  // Validate reset type
  if (!['FULL', 'STRUCTURE', 'DATA'].includes(resetType)) {
    console.log('Usage: node reset-database.js [full|structure|data] [--force]');
    console.log('');
    console.log('Reset types:');
    console.log('  full      - Drop all databases and recreate from scratch (default)');
    console.log('  structure - Drop all tables and recreate structure');
    console.log('  data      - Truncate all tables but keep structure');
    console.log('');
    console.log('Options:');
    console.log('  --force   - Skip confirmation prompt (USE WITH CAUTION!)');
    process.exit(1);
  }

  try {
    // Get confirmation unless forced
    if (!skipConfirmation) {
      const confirmed = await reset.confirmReset(resetType);
      if (!confirmed) {
        console.log('\n❌ Reset operation cancelled by user.');
        process.exit(0);
      }
    }

    // Perform reset based on type
    let success = false;
    switch (resetType) {
      case 'FULL':
        success = await reset.performFullReset();
        break;
      case 'STRUCTURE':
        success = await reset.performStructureReset();
        break;
      case 'DATA':
        success = await reset.performDataReset();
        break;
    }

    if (success) {
      console.log('\n🎉 Database reset operation completed successfully!');
      process.exit(0);
    } else {
      console.log('\n💥 Database reset operation failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Reset script error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DatabaseReset;
