#!/usr/bin/env node

/**
 * Q&A Compliant System Database Setup
 * Creates the system database with all required tables
 * Following Q5 (Multi-tenant strategy) and Q29 (JSON config)
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config/index');

async function setupSystemDatabase() {
  console.log('🔧 Setting up System Database');
  console.log('='.repeat(50));

  try {
    // Get database configuration from Q29 compliant config
    const dbConfig = config.get('database');

    console.log(`📊 Database Host: ${dbConfig.connection.host}`);
    console.log(`📊 System Database: ${dbConfig.system.name}`);

    // Connect to MySQL server (without specifying database)
    const sequelize = new Sequelize(
      '', // No database initially
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: dbConfig.connection.host,
        port: dbConfig.connection.port,
        dialect: 'mysql',
        logging: false
      }
    );

    await sequelize.authenticate();
    console.log('✅ Connected to MySQL server');

    // Create system database if it doesn't exist
    await sequelize.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.system.name}\` 
      CHARACTER SET ${dbConfig.system.charset} 
      COLLATE ${dbConfig.system.collation}`);

    console.log(`✅ System database created/verified: ${dbConfig.system.name}`);

    await sequelize.close();

    // Now connect to the system database
    const systemSequelize = new Sequelize(
      dbConfig.system.name,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: dbConfig.connection.host,
        port: dbConfig.connection.port,
        dialect: 'mysql',
        logging: sql => console.log(`📝 SQL: ${sql.substring(0, 80)}...`)
      }
    );

    await systemSequelize.authenticate();
    console.log('✅ Connected to system database');

    // Read and execute system database schema
    const schemaPath = path.join(__dirname, 'system-database-schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');

    console.log('📋 Creating system tables...');

    // Clean and split schema into individual statements
    let cleanSchema = schema
      .replace(/--.*$/gm, '') // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/CREATE DATABASE[^;]*;/gi, '') // Remove CREATE DATABASE statements
      .replace(/USE[^;]*;/gi, '') // Remove USE statements
      .trim();

    // Split on semicolons and filter empty statements
    const statements = cleanSchema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 10); // Ignore very short statements

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`  Executing statement ${i + 1}/${statements.length}...`);
          await systemSequelize.query(statement);
        } catch (error) {
          // Ignore table already exists errors
          if (!error.message.includes('already exists')) {
            console.warn(`⚠️  Warning executing statement ${i + 1}: ${error.message}`);
            console.warn(`   Statement: ${statement.substring(0, 100)}...`);
          }
        }
      }
    }

    // Verify tables were created
    const [tables] = await systemSequelize.query('SHOW TABLES');

    console.log('✅ System database setup complete!');
    console.log(`📋 Created ${tables.length} tables:`);

    const expectedTables = [
      'system_config',
      'system_users',
      'trusts',
      'trust_subscriptions',
      'migration_versions',
      'system_audit_logs',
      'system_sessions'
    ];

    expectedTables.forEach(expectedTable => {
      const exists = tables.some(row => {
        const tableName = row[Object.keys(row)[0]];
        return tableName === expectedTable;
      });
      const status = exists ? '✅' : '❌';
      console.log(`  ${status} ${expectedTable}`);
    });

    // Create initial system configuration
    console.log('\\n📋 Setting up initial system configuration...');

    const initialConfig = [
      {
        config_key: 'system_version',
        config_value: '1.0.0',
        data_type: 'STRING',
        description: 'System version'
      },
      {
        config_key: 'maintenance_mode',
        config_value: 'false',
        data_type: 'BOOLEAN',
        description: 'System maintenance mode'
      },
      {
        config_key: 'max_trusts',
        config_value: '100',
        data_type: 'NUMBER',
        description: 'Maximum number of trusts allowed'
      },
      {
        config_key: 'default_theme',
        config_value: 'default',
        data_type: 'STRING',
        description: 'Default theme for new trusts'
      }
    ];

    for (const configItem of initialConfig) {
      try {
        await systemSequelize.query(
          'INSERT IGNORE INTO system_config (config_key, config_value, data_type, description) VALUES (?, ?, ?, ?)',
          {
            replacements: [
              configItem.config_key,
              configItem.config_value,
              configItem.data_type,
              configItem.description
            ]
          }
        );
      } catch (error) {
        console.warn(`⚠️  Warning setting config ${configItem.config_key}: ${error.message}`);
      }
    }

    console.log('✅ Initial system configuration created');

    await systemSequelize.close();

    console.log('\\n🎉 SYSTEM DATABASE SETUP COMPLETE!');
    console.log('✅ All system tables created');
    console.log('✅ Initial configuration set');
    console.log('✅ Ready for tenant database creation');
  } catch (error) {
    console.error('❌ System database setup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupSystemDatabase();
}

module.exports = { setupSystemDatabase };
