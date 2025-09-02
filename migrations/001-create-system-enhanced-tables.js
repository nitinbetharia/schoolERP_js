/**
 * System Database Migration - Enhanced Multi-Tenant Configuration
 * Creates tables for tenant configuration and fee management
 */

const { DataTypes } = require('sequelize');
const { logger } = require('../utils/logger');

async function up(queryInterface, _Sequelize) {
   const transaction = await queryInterface.sequelize.transaction();

   try {
      logger.info('Starting system database migration - enhanced configuration tables');

      // 1. Create TenantConfigurations table
      await queryInterface.createTable(
         'tenant_configurations',
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
            student_config: {
               type: DataTypes.JSON,
               allowNull: false,
               defaultValue: {},
            },
            school_config: {
               type: DataTypes.JSON,
               allowNull: false,
               defaultValue: {},
            },
            academic_config: {
               type: DataTypes.JSON,
               allowNull: false,
               defaultValue: {},
            },
            system_preferences: {
               type: DataTypes.JSON,
               allowNull: false,
               defaultValue: {},
            },
            feature_flags: {
               type: DataTypes.JSON,
               allowNull: false,
               defaultValue: {},
            },
            validation_rules: {
               type: DataTypes.JSON,
               allowNull: false,
               defaultValue: {},
            },
            is_active: {
               type: DataTypes.BOOLEAN,
               defaultValue: true,
               comment: 'Whether this configuration is active',
            },
            version: {
               type: DataTypes.INTEGER,
               defaultValue: 1,
               comment: 'Configuration version for change tracking',
            },
            last_modified_by: {
               type: DataTypes.INTEGER,
               allowNull: true,
               comment: 'User ID who last modified this configuration',
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

      // 2. Create TenantCustomFields table
      await queryInterface.createTable(
         'tenant_custom_fields',
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
            entity_type: {
               type: DataTypes.ENUM('student', 'school', 'teacher', 'parent', 'class', 'fee_structure'),
               allowNull: false,
               comment: 'Entity this custom field applies to',
            },
            field_name: {
               type: DataTypes.STRING(100),
               allowNull: false,
            },
            field_type: {
               type: DataTypes.ENUM(
                  'text',
                  'number',
                  'date',
                  'datetime',
                  'dropdown',
                  'checkbox',
                  'textarea',
                  'email',
                  'phone',
                  'url',
                  'file'
               ),
               allowNull: false,
               comment: 'Data type of the field',
            },
            field_label: {
               type: DataTypes.STRING(200),
               allowNull: false,
            },
            field_description: {
               type: DataTypes.TEXT,
               allowNull: true,
            },
            field_options: {
               type: DataTypes.JSON,
               allowNull: true,
               comment: 'Options for dropdown/multi-select fields',
            },
            validation_rules: {
               type: DataTypes.JSON,
               allowNull: true,
               comment: 'Field validation rules',
            },
            display_options: {
               type: DataTypes.JSON,
               allowNull: true,
               comment: 'Display preferences and UI options',
            },
            is_required: {
               type: DataTypes.BOOLEAN,
               defaultValue: false,
            },
            is_active: {
               type: DataTypes.BOOLEAN,
               defaultValue: true,
            },
            display_order: {
               type: DataTypes.INTEGER,
               defaultValue: 0,
            },
            field_group: {
               type: DataTypes.STRING(100),
               allowNull: true,
               comment: 'Grouping for form organization',
            },
            created_by: {
               type: DataTypes.INTEGER,
               allowNull: false,
            },
            last_updated_by: {
               type: DataTypes.INTEGER,
               allowNull: false,
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

      // 3. Create FeeConfigurations table
      await queryInterface.createTable(
         'fee_configurations',
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
            name: {
               type: DataTypes.STRING(200),
               allowNull: false,
               comment: 'Fee configuration name/title',
            },
            description: {
               type: DataTypes.TEXT,
               allowNull: true,
               comment: 'Detailed description of fee structure',
            },
            fee_components: {
               type: DataTypes.JSON,
               allowNull: false,
               defaultValue: {},
               comment: 'Fee component definitions with amounts and rules',
            },
            discount_policies: {
               type: DataTypes.JSON,
               allowNull: false,
               defaultValue: {},
               comment: 'Discount policies and conditions',
            },
            payment_schedule: {
               type: DataTypes.JSON,
               allowNull: false,
               defaultValue: {},
               comment: 'Payment schedule configuration',
            },
            applicable_classes: {
               type: DataTypes.JSON,
               allowNull: true,
               comment: 'Classes this fee structure applies to',
            },
            academic_year: {
               type: DataTypes.STRING(10),
               allowNull: false,
               comment: 'Academic year this configuration is for',
            },
            is_active: {
               type: DataTypes.BOOLEAN,
               defaultValue: true,
            },
            is_default: {
               type: DataTypes.BOOLEAN,
               defaultValue: false,
               comment: 'Default fee structure for new admissions',
            },
            version: {
               type: DataTypes.INTEGER,
               defaultValue: 1,
               comment: 'Version number for tracking changes',
            },
            effective_from: {
               type: DataTypes.DATE,
               allowNull: true,
               comment: 'Date from which this configuration is effective',
            },
            effective_until: {
               type: DataTypes.DATE,
               allowNull: true,
               comment: 'Date until which this configuration is valid',
            },
            created_by: {
               type: DataTypes.INTEGER,
               allowNull: false,
            },
            last_updated_by: {
               type: DataTypes.INTEGER,
               allowNull: false,
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

      // Add indexes for better performance
      await queryInterface.addIndex('tenant_configurations', ['trust_id'], {
         transaction,
         name: 'idx_tenant_config_trust',
      });

      await queryInterface.addIndex('tenant_configurations', ['is_active'], {
         transaction,
         name: 'idx_tenant_config_active',
      });

      await queryInterface.addIndex('tenant_custom_fields', ['trust_id', 'entity_type'], {
         transaction,
         name: 'idx_custom_fields_trust_entity',
      });

      await queryInterface.addIndex('tenant_custom_fields', ['entity_type', 'is_active'], {
         transaction,
         name: 'idx_custom_fields_entity_active',
      });

      await queryInterface.addIndex('fee_configurations', ['trust_id', 'academic_year'], {
         transaction,
         name: 'idx_fee_config_trust_year',
      });

      await queryInterface.addIndex('fee_configurations', ['is_active', 'is_default'], {
         transaction,
         name: 'idx_fee_config_active_default',
      });

      // Add unique constraints
      await queryInterface.addConstraint('tenant_configurations', {
         fields: ['trust_id'],
         type: 'unique',
         name: 'unique_tenant_config_per_trust',
         transaction,
      });

      await queryInterface.addConstraint('tenant_custom_fields', {
         fields: ['trust_id', 'entity_type', 'field_name'],
         type: 'unique',
         name: 'unique_field_per_entity_per_trust',
         transaction,
      });

      await queryInterface.addConstraint('fee_configurations', {
         fields: ['trust_id', 'name', 'academic_year'],
         type: 'unique',
         name: 'unique_fee_config_name_per_trust_year',
         transaction,
      });

      await transaction.commit();
      logger.info('System database migration completed successfully');

      return {
         success: true,
         tables_created: ['tenant_configurations', 'tenant_custom_fields', 'fee_configurations'],
         indexes_created: [
            'idx_tenant_config_trust',
            'idx_tenant_config_active',
            'idx_custom_fields_trust_entity',
            'idx_custom_fields_entity_active',
            'idx_fee_config_trust_year',
            'idx_fee_config_active_default',
         ],
         constraints_added: [
            'unique_tenant_config_per_trust',
            'unique_field_per_entity_per_trust',
            'unique_fee_config_name_per_trust_year',
         ],
      };
   } catch (error) {
      await transaction.rollback();
      logger.error('System database migration failed', {
         error: error.message,
         stack: error.stack,
      });
      throw error;
   }
}

async function down(queryInterface, _Sequelize) {
   const transaction = await queryInterface.sequelize.transaction();

   try {
      logger.info('Rolling back system database migration');

      // Drop tables in reverse order to handle foreign key constraints
      await queryInterface.dropTable('fee_configurations', { transaction });
      await queryInterface.dropTable('tenant_custom_fields', { transaction });
      await queryInterface.dropTable('tenant_configurations', { transaction });

      await transaction.commit();
      logger.info('System database migration rolled back successfully');
   } catch (error) {
      await transaction.rollback();
      logger.error('System database rollback failed', {
         error: error.message,
         stack: error.stack,
      });
      throw error;
   }
}

module.exports = { up, down };
