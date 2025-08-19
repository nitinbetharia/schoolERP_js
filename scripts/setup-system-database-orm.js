const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/index');
const logger = require('../config/logger');

/**
 * Q&A Compliant System Database Setup
 * Uses Sequelize ORM (Q1) with proper async/await (Q57) and try-catch (Q58)
 */

async function setupSystemDatabase() {
  try {
    const dbConfig = config.get('database');

    // Get credentials directly from environment (Q29 compliant)
    const dbUser = process.env.DB_USER;
    const dbPassword = process.env.DB_PASSWORD;

    if (!dbUser || !dbPassword) {
      throw new Error('Database credentials not found in environment variables');
    }

    // Create connection to MySQL server (not specific database)
    const masterSequelize = new Sequelize({
      dialect: 'mysql',
      host: dbConfig.connection.host,
      port: dbConfig.connection.port,
      username: dbUser,
      password: dbPassword,
      logging: msg => logger.info('SQL: ' + msg),
      pool: dbConfig.pool
    });

    logger.info('🚀 Setting up System Database (ORM-based)');
    logger.info(`📍 Database Host: ${dbConfig.connection.host}`);
    logger.info(`📍 System Database: ${dbConfig.system.name}`);

    // Test connection
    await masterSequelize.authenticate();
    logger.info('✅ Connected to MySQL server');

    // Create system database
    await masterSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.system.name}\` 
      CHARACTER SET ${dbConfig.system.charset} 
      COLLATE ${dbConfig.system.collation}`);
    logger.info(`✅ System database created/verified: ${dbConfig.system.name}`);

    // Connect to system database
    const systemSequelize = new Sequelize({
      dialect: 'mysql',
      host: dbConfig.connection.host,
      port: dbConfig.connection.port,
      database: dbConfig.system.name,
      username: dbUser,
      password: dbPassword,
      logging: msg => logger.info('SQL: ' + msg),
      pool: dbConfig.pool,
      define: {
        charset: dbConfig.system.charset,
        collate: dbConfig.system.collation,
        underscored: true,
        timestamps: true
      }
    });

    await systemSequelize.authenticate();
    logger.info('✅ Connected to system database');

    logger.info('📋 Creating system tables using Sequelize models...');

    // System Config Model (Q12 compliance)
    const SystemConfig = systemSequelize.define(
      'system_config',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        config_key: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true
        },
        config_value: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        data_type: {
          type: DataTypes.ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON'),
          defaultValue: 'STRING'
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        is_editable: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        }
      },
      {
        tableName: 'system_config',
        underscored: true,
        indexes: [{ fields: ['config_key'] }]
      }
    );

    // System Users Model
    const SystemUser = systemSequelize.define(
      'system_user',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        username: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true
        },
        password_hash: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        first_name: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        last_name: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        role: {
          type: DataTypes.ENUM('SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEVELOPER'),
          defaultValue: 'SYSTEM_ADMIN'
        },
        permissions: {
          type: DataTypes.JSON,
          allowNull: true
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        },
        last_login: {
          type: DataTypes.DATE,
          allowNull: true
        },
        failed_login_attempts: {
          type: DataTypes.INTEGER,
          defaultValue: 0
        },
        locked_until: {
          type: DataTypes.DATE,
          allowNull: true
        }
      },
      {
        tableName: 'system_users',
        underscored: true,
        indexes: [{ fields: ['role'] }, { fields: ['is_active'] }]
      }
    );

    // Trusts Model
    const Trust = systemSequelize.define(
      'trust',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        trust_name: {
          type: DataTypes.STRING(200),
          allowNull: false
        },
        trust_code: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true
        },
        contact_person: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        phone: {
          type: DataTypes.STRING(20),
          allowNull: true
        },
        address: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        database_name: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        status: {
          type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'),
          defaultValue: 'ACTIVE'
        },
        subscription_plan: {
          type: DataTypes.STRING(50),
          defaultValue: 'BASIC'
        },
        max_schools: {
          type: DataTypes.INTEGER,
          defaultValue: 1
        },
        max_students: {
          type: DataTypes.INTEGER,
          defaultValue: 500
        }
      },
      {
        tableName: 'trusts',
        underscored: true,
        indexes: [{ fields: ['trust_code'] }, { fields: ['status'] }]
      }
    );

    // Sync all models
    await systemSequelize.sync({ force: false });
    logger.info('✅ All system tables created/verified');

    // Insert initial configuration
    await SystemConfig.findOrCreate({
      where: { config_key: 'system_version' },
      defaults: {
        config_key: 'system_version',
        config_value: '1.0.0',
        data_type: 'STRING',
        description: 'Current system version',
        is_editable: false
      }
    });

    await SystemConfig.findOrCreate({
      where: { config_key: 'maintenance_mode' },
      defaults: {
        config_key: 'maintenance_mode',
        config_value: 'false',
        data_type: 'BOOLEAN',
        description: 'System maintenance mode flag',
        is_editable: true
      }
    });

    logger.info('✅ Initial system configuration created');

    // Close connections
    await systemSequelize.close();
    await masterSequelize.close();

    logger.info('\n🎉 SYSTEM DATABASE SETUP COMPLETE!');
    logger.info('✅ All system tables created');
    logger.info('✅ Initial configuration set');
    logger.info('✅ Ready for tenant database creation');

    return true;
  } catch (error) {
    logger.error('System database setup failed', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  setupSystemDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = setupSystemDatabase;
