/**
 * Core System Database Migration - Essential Tables
 * Creates core tables that the enhanced migrations depend on
 */

const { DataTypes } = require('sequelize');
const { logger } = require('../utils/logger');

async function up(queryInterface, _Sequelize) {
   const transaction = await queryInterface.sequelize.transaction();

   try {
      logger.info('Starting core system database migration - essential tables');

      // 1. Create Trusts table (if not exists)
      await queryInterface.createTable(
         'trusts',
         {
            id: {
               type: DataTypes.INTEGER,
               primaryKey: true,
               autoIncrement: true,
               comment: 'Primary key for trust',
            },
            trust_name: {
               type: DataTypes.STRING(200),
               allowNull: false,
               comment: 'Official name of the educational trust',
            },
            trust_code: {
               type: DataTypes.STRING(20),
               allowNull: false,
               unique: true,
               comment: 'Unique code for trust identification',
            },
            subdomain: {
               type: DataTypes.STRING(50),
               allowNull: false,
               unique: true,
               comment: 'Subdomain for tenant access',
            },
            contact_email: {
               type: DataTypes.STRING(255),
               allowNull: false,
               unique: true,
               comment: 'Primary contact email for the trust',
            },
            contact_phone: {
               type: DataTypes.STRING(20),
               allowNull: false,
               comment: 'Primary contact phone number',
            },
            address: {
               type: DataTypes.TEXT,
               allowNull: false,
               comment: 'Complete address of trust headquarters',
            },
            database_name: {
               type: DataTypes.STRING(100),
               allowNull: false,
               unique: true,
               comment: 'Database name for tenant data isolation',
            },
            status: {
               type: DataTypes.ENUM('PENDING_SETUP', 'ACTIVE', 'SUSPENDED', 'INACTIVE'),
               defaultValue: 'PENDING_SETUP',
               comment: 'Current operational status of the trust',
            },
            setup_completed_at: {
               type: DataTypes.DATE,
               allowNull: true,
               comment: 'Timestamp when initial setup was completed',
            },
            created_at: {
               type: DataTypes.DATE,
               allowNull: false,
               defaultValue: DataTypes.NOW,
            },
            updated_at: {
               type: DataTypes.DATE,
               allowNull: false,
               defaultValue: DataTypes.NOW,
            },
         },
         {
            transaction,
            engine: 'InnoDB',
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
         }
      );

      // 2. Create SystemUsers table
      await queryInterface.createTable(
         'system_users',
         {
            id: {
               type: DataTypes.INTEGER,
               primaryKey: true,
               autoIncrement: true,
            },
            trust_id: {
               type: DataTypes.INTEGER,
               allowNull: false,
               references: {
                  model: 'trusts',
                  key: 'id',
               },
               onDelete: 'CASCADE',
               onUpdate: 'CASCADE',
            },
            username: {
               type: DataTypes.STRING(100),
               allowNull: false,
               unique: true,
            },
            email: {
               type: DataTypes.STRING(255),
               allowNull: false,
               unique: true,
               validate: {
                  isEmail: true,
               },
            },
            password_hash: {
               type: DataTypes.STRING(255),
               allowNull: false,
            },
            first_name: {
               type: DataTypes.STRING(100),
               allowNull: false,
            },
            last_name: {
               type: DataTypes.STRING(100),
               allowNull: false,
            },
            role: {
               type: DataTypes.ENUM(
                  'SYSTEM_ADMIN',
                  'TRUST_ADMIN',
                  'SCHOOL_ADMIN',
                  'PRINCIPAL',
                  'TEACHER',
                  'STAFF',
                  'STUDENT'
               ),
               allowNull: false,
            },
            is_active: {
               type: DataTypes.BOOLEAN,
               defaultValue: true,
            },
            last_login: {
               type: DataTypes.DATE,
               allowNull: true,
            },
            login_attempts: {
               type: DataTypes.INTEGER,
               defaultValue: 0,
            },
            locked_until: {
               type: DataTypes.DATE,
               allowNull: true,
            },
            created_at: {
               type: DataTypes.DATE,
               allowNull: false,
               defaultValue: DataTypes.NOW,
            },
            updated_at: {
               type: DataTypes.DATE,
               allowNull: false,
               defaultValue: DataTypes.NOW,
            },
         },
         {
            transaction,
            engine: 'InnoDB',
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
         }
      );

      // 3. Create SystemAuditLog table
      await queryInterface.createTable(
         'system_audit_logs',
         {
            id: {
               type: DataTypes.INTEGER,
               primaryKey: true,
               autoIncrement: true,
            },
            user_id: {
               type: DataTypes.INTEGER,
               allowNull: true,
               references: {
                  model: 'system_users',
                  key: 'id',
               },
               onDelete: 'SET NULL',
            },
            trust_id: {
               type: DataTypes.INTEGER,
               allowNull: true,
               references: {
                  model: 'trusts',
                  key: 'id',
               },
               onDelete: 'SET NULL',
            },
            action: {
               type: DataTypes.STRING(100),
               allowNull: false,
            },
            entity_type: {
               type: DataTypes.STRING(50),
               allowNull: true,
            },
            entity_id: {
               type: DataTypes.INTEGER,
               allowNull: true,
            },
            old_values: {
               type: DataTypes.JSON,
               allowNull: true,
            },
            new_values: {
               type: DataTypes.JSON,
               allowNull: true,
            },
            ip_address: {
               type: DataTypes.STRING(45),
               allowNull: true,
            },
            user_agent: {
               type: DataTypes.TEXT,
               allowNull: true,
            },
            created_at: {
               type: DataTypes.DATE,
               allowNull: false,
               defaultValue: DataTypes.NOW,
            },
         },
         {
            transaction,
            engine: 'InnoDB',
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
         }
      );

      // Add indexes for performance
      await queryInterface.addIndex('trusts', ['trust_code'], {
         transaction,
         name: 'idx_trusts_code',
      });

      await queryInterface.addIndex('trusts', ['subdomain'], {
         transaction,
         name: 'idx_trusts_subdomain',
      });

      await queryInterface.addIndex('trusts', ['status'], {
         transaction,
         name: 'idx_trusts_status',
      });

      await queryInterface.addIndex('system_users', ['trust_id', 'role'], {
         transaction,
         name: 'idx_system_users_trust_role',
      });

      await queryInterface.addIndex('system_users', ['username'], {
         transaction,
         name: 'idx_system_users_username',
      });

      await queryInterface.addIndex('system_users', ['email'], {
         transaction,
         name: 'idx_system_users_email',
      });

      await queryInterface.addIndex('system_audit_logs', ['user_id', 'created_at'], {
         transaction,
         name: 'idx_audit_user_time',
      });

      await queryInterface.addIndex('system_audit_logs', ['trust_id', 'created_at'], {
         transaction,
         name: 'idx_audit_trust_time',
      });

      await transaction.commit();
      logger.info('Core system database migration completed successfully');

      return {
         success: true,
         tables_created: ['trusts', 'system_users', 'system_audit_logs'],
         indexes_created: [
            'idx_trusts_code',
            'idx_trusts_subdomain',
            'idx_trusts_status',
            'idx_system_users_trust_role',
            'idx_system_users_username',
            'idx_system_users_email',
            'idx_audit_user_time',
            'idx_audit_trust_time',
         ],
      };
   } catch (error) {
      await transaction.rollback();
      logger.error('Core system database migration failed', {
         error: error.message,
         stack: error.stack,
      });
      throw error;
   }
}

async function down(queryInterface, _Sequelize) {
   const transaction = await queryInterface.sequelize.transaction();

   try {
      logger.info('Rolling back core system database migration');

      // Drop tables in reverse order to handle foreign key constraints
      await queryInterface.dropTable('system_audit_logs', { transaction });
      await queryInterface.dropTable('system_users', { transaction });
      await queryInterface.dropTable('trusts', { transaction });

      await transaction.commit();
      logger.info('Core system database migration rolled back successfully');
   } catch (error) {
      await transaction.rollback();
      logger.error('Core system database rollback failed', {
         error: error.message,
         stack: error.stack,
      });
      throw error;
   }
}

module.exports = { up, down };
