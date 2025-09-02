/* eslint-disable max-len, indent */
/**
 * Tenant Database Migration - Enhanced Models for Fee Management
 * Creates tables for tenant-specific fee management and custom field values
 */

const { DataTypes } = require('sequelize');
const { logger } = require('../utils/logger');

async function up(queryInterface, _Sequelize) {
   const transaction = await queryInterface.sequelize.transaction();

   // Idempotency helpers
   async function tableExists(tableName) {
      const [rows] = await queryInterface.sequelize.query(
         'SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?',
         { replacements: [tableName], transaction }
      );
      return Number(rows[0].c) > 0;
   }

   async function indexExists(tableName, indexName) {
      const [rows] = await queryInterface.sequelize.query(
         'SELECT COUNT(*) AS c FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?',
         { replacements: [tableName, indexName], transaction }
      );
      return Number(rows[0].c) > 0;
   }

   try {
      logger.info('Starting tenant database migration - enhanced fee management tables');

      // 1. Create CustomFieldValues table
      if (!(await tableExists('custom_field_values'))) {
         await queryInterface.createTable(
            'custom_field_values',
            {
               id: {
                  type: DataTypes.INTEGER,
                  primaryKey: true,
                  autoIncrement: true,
               },
               entity_type: {
                  type: DataTypes.ENUM('student', 'school', 'teacher', 'parent', 'class', 'fee_structure'),
                  allowNull: false,
                  comment: 'Type of entity this value belongs to',
               },
               entity_id: {
                  type: DataTypes.INTEGER,
                  allowNull: false,
                  comment: 'ID of the specific entity (student_id, school_id, etc.)',
               },
               field_name: {
                  type: DataTypes.STRING(100),
                  allowNull: false,
                  comment: 'Custom field name (from system TenantCustomFields table)',
               },
               field_value: {
                  type: DataTypes.TEXT,
                  allowNull: true,
                  comment: 'Actual field value stored as text (JSON for complex types)',
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
                  comment: 'Field type for proper value parsing',
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
      }

      // 2. Create StudentFeeAssignments table
      if (!(await tableExists('student_fee_assignments'))) {
         await queryInterface.createTable(
            'student_fee_assignments',
            {
               id: {
                  type: DataTypes.INTEGER,
                  primaryKey: true,
                  autoIncrement: true,
               },
               student_id: {
                  type: DataTypes.INTEGER,
                  allowNull: false,
                  references: {
                     model: 'students',
                     key: 'id',
                  },
                  onDelete: 'CASCADE',
                  onUpdate: 'CASCADE',
               },
               fee_configuration_id: {
                  type: DataTypes.INTEGER,
                  allowNull: false,
                  comment: 'Reference to fee_configurations table in system DB',
               },
               academic_year: {
                  type: DataTypes.STRING(10),
                  allowNull: false,
                  comment: 'Academic year this assignment is for',
               },
               calculated_fee_structure: {
                  type: DataTypes.JSON,
                  allowNull: false,
                  defaultValue: {},
                  comment: 'Calculated fee structure based on configuration and student profile',
               },
               individual_adjustments: {
                  type: DataTypes.JSON,
                  allowNull: false,
                  defaultValue: {},
                  comment: 'Individual fee adjustments for this student',
               },
               discount_approvals: {
                  type: DataTypes.JSON,
                  allowNull: false,
                  defaultValue: {},
                  comment: 'Approved discounts for this student',
               },
               payment_overrides: {
                  type: DataTypes.JSON,
                  allowNull: true,
                  comment: 'Payment schedule overrides if any',
               },
               is_structure_locked: {
                  type: DataTypes.BOOLEAN,
                  defaultValue: false,
                  comment: 'Whether fee structure can still be modified',
               },
               lock_reason: {
                  type: DataTypes.TEXT,
                  allowNull: true,
                  comment: 'Reason for locking the fee structure',
               },
               locked_by: {
                  type: DataTypes.INTEGER,
                  allowNull: true,
                  comment: 'User who locked the fee structure',
               },
               locked_at: {
                  type: DataTypes.DATE,
                  allowNull: true,
                  comment: 'When the fee structure was locked',
               },
               is_active: {
                  type: DataTypes.BOOLEAN,
                  defaultValue: true,
                  comment: 'Whether this assignment is currently active',
               },
               notes: {
                  type: DataTypes.TEXT,
                  allowNull: true,
                  comment: 'Additional notes about this fee assignment',
               },
               assigned_by: {
                  type: DataTypes.INTEGER,
                  allowNull: false,
                  comment: 'User who created this assignment',
               },
               last_updated_by: {
                  type: DataTypes.INTEGER,
                  allowNull: false,
                  comment: 'User who last modified this assignment',
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
      }

      // 3. Create FeeTransactions table
      if (!(await tableExists('fee_transactions'))) {
         await queryInterface.createTable(
            'fee_transactions',
            {
               id: {
                  type: DataTypes.INTEGER,
                  primaryKey: true,
                  autoIncrement: true,
               },
               student_id: {
                  type: DataTypes.INTEGER,
                  allowNull: false,
                  references: {
                     model: 'students',
                     key: 'id',
                  },
                  onDelete: 'CASCADE',
                  onUpdate: 'CASCADE',
               },
               fee_assignment_id: {
                  type: DataTypes.INTEGER,
                  allowNull: true,
                  references: {
                     model: 'student_fee_assignments',
                     key: 'id',
                  },
                  onDelete: 'SET NULL',
                  onUpdate: 'CASCADE',
               },
               academic_year: {
                  type: DataTypes.STRING(10),
                  allowNull: false,
               },
               transaction_number: {
                  type: DataTypes.STRING(50),
                  allowNull: false,
                  unique: true,
                  comment: 'Unique transaction identifier',
               },
               receipt_number: {
                  type: DataTypes.STRING(50),
                  allowNull: true,
                  unique: true,
                  comment: 'Receipt number for this transaction',
               },
               transaction_type: {
                  type: DataTypes.ENUM('payment', 'adjustment', 'reversal', 'refund'),
                  allowNull: false,
                  defaultValue: 'payment',
                  comment: 'Type of transaction',
               },
               payment_method: {
                  type: DataTypes.ENUM('cash', 'online', 'cheque', 'dd', 'card', 'upi', 'netbanking'),
                  allowNull: false,
                  comment: 'Method of payment',
               },
               total_amount: {
                  type: DataTypes.DECIMAL(10, 2),
                  allowNull: false,
                  comment: 'Total transaction amount',
               },
               fee_breakdown: {
                  type: DataTypes.JSON,
                  allowNull: false,
                  defaultValue: {},
                  comment: 'Breakdown of fees paid in this transaction',
               },
               transaction_date: {
                  type: DataTypes.DATE,
                  allowNull: false,
                  defaultValue: DataTypes.NOW,
                  comment: 'Date and time of transaction',
               },
               balance_before: {
                  type: DataTypes.DECIMAL(10, 2),
                  allowNull: true,
                  comment: 'Outstanding balance before this transaction',
               },
               balance_after: {
                  type: DataTypes.DECIMAL(10, 2),
                  allowNull: true,
                  comment: 'Outstanding balance after this transaction',
               },
               payment_reference: {
                  type: DataTypes.STRING(100),
                  allowNull: true,
                  comment: 'External payment reference (bank ref, cheque no, etc.)',
               },
               bank_details: {
                  type: DataTypes.JSON,
                  allowNull: true,
                  comment: 'Bank details for online/cheque payments',
               },
               processed_by: {
                  type: DataTypes.INTEGER,
                  allowNull: false,
                  comment: 'User who processed this transaction',
               },
               is_reversed: {
                  type: DataTypes.BOOLEAN,
                  defaultValue: false,
                  comment: 'Whether this transaction has been reversed',
               },
               reversal_reason: {
                  type: DataTypes.TEXT,
                  allowNull: true,
                  comment: 'Reason for transaction reversal',
               },
               reversed_by: {
                  type: DataTypes.INTEGER,
                  allowNull: true,
                  comment: 'User who reversed this transaction',
               },
               reversed_at: {
                  type: DataTypes.DATE,
                  allowNull: true,
                  comment: 'When the transaction was reversed',
               },
               original_transaction_id: {
                  type: DataTypes.INTEGER,
                  allowNull: true,
                  references: {
                     model: 'fee_transactions',
                     key: 'id',
                  },
                  onDelete: 'SET NULL',
                  onUpdate: 'CASCADE',
                  comment: 'Original transaction ID for reversals',
               },
               transaction_notes: {
                  type: DataTypes.TEXT,
                  allowNull: true,
                  comment: 'Additional notes about this transaction',
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
      }

      // Add indexes for better performance
      if (!(await indexExists('custom_field_values', 'idx_custom_values_entity'))) {
         await queryInterface.addIndex('custom_field_values', ['entity_type', 'entity_id'], {
            transaction,
            name: 'idx_custom_values_entity',
         });
      }

      if (!(await indexExists('custom_field_values', 'idx_custom_values_field'))) {
         await queryInterface.addIndex('custom_field_values', ['field_name', 'entity_id'], {
            transaction,
            name: 'idx_custom_values_field',
         });
      }

      if (!(await indexExists('student_fee_assignments', 'idx_fee_assignment_student_year'))) {
         await queryInterface.addIndex('student_fee_assignments', ['student_id', 'academic_year'], {
            transaction,
            name: 'idx_fee_assignment_student_year',
         });
      }

      if (!(await indexExists('student_fee_assignments', 'idx_fee_assignment_config'))) {
         await queryInterface.addIndex('student_fee_assignments', ['fee_configuration_id'], {
            transaction,
            name: 'idx_fee_assignment_config',
         });
      }

      if (!(await indexExists('student_fee_assignments', 'idx_fee_assignment_active_year'))) {
         await queryInterface.addIndex('student_fee_assignments', ['is_active', 'academic_year'], {
            transaction,
            name: 'idx_fee_assignment_active_year',
         });
      }

      if (!(await indexExists('fee_transactions', 'idx_fee_transaction_student_year'))) {
         await queryInterface.addIndex('fee_transactions', ['student_id', 'academic_year'], {
            transaction,
            name: 'idx_fee_transaction_student_year',
         });
      }

      if (!(await indexExists('fee_transactions', 'idx_fee_transaction_number'))) {
         await queryInterface.addIndex('fee_transactions', ['transaction_number'], {
            transaction,
            name: 'idx_fee_transaction_number',
         });
      }

      if (!(await indexExists('fee_transactions', 'idx_fee_transaction_date_type'))) {
         await queryInterface.addIndex('fee_transactions', ['transaction_date', 'transaction_type'], {
            transaction,
            name: 'idx_fee_transaction_date_type',
         });
      }

      if (!(await indexExists('fee_transactions', 'idx_fee_transaction_status'))) {
         await queryInterface.addIndex('fee_transactions', ['is_reversed', 'transaction_type'], {
            transaction,
            name: 'idx_fee_transaction_status',
         });
      }

      // Add unique constraints
      if (!(await indexExists('custom_field_values', 'unique_field_value_per_entity'))) {
         await queryInterface.addConstraint('custom_field_values', {
            fields: ['entity_type', 'entity_id', 'field_name'],
            type: 'unique',
            name: 'unique_field_value_per_entity',
            transaction,
         });
      }

      if (!(await indexExists('student_fee_assignments', 'unique_active_assignment_per_student_year'))) {
         await queryInterface.addConstraint('student_fee_assignments', {
            fields: ['student_id', 'academic_year', 'is_active'],
            type: 'unique',
            name: 'unique_active_assignment_per_student_year',
            transaction,
            where: {
               is_active: true,
            },
         });
      }

      await transaction.commit();
      logger.info('Tenant database migration completed successfully');

      return {
         success: true,
         tables_created: ['custom_field_values', 'student_fee_assignments', 'fee_transactions'],
         indexes_created: [
            'idx_custom_values_entity',
            'idx_custom_values_field',
            'idx_fee_assignment_student_year',
            'idx_fee_assignment_config',
            'idx_fee_assignment_active_year',
            'idx_fee_transaction_student_year',
            'idx_fee_transaction_number',
            'idx_fee_transaction_date_type',
            'idx_fee_transaction_status',
         ],
         constraints_added: ['unique_field_value_per_entity', 'unique_active_assignment_per_student_year'],
      };
   } catch (error) {
      await transaction.rollback();
      logger.error('Tenant database migration failed', {
         error: error.message,
         stack: error.stack,
      });
      throw error;
   }
}

async function down(queryInterface, _Sequelize) {
   const transaction = await queryInterface.sequelize.transaction();

   try {
      logger.info('Rolling back tenant database migration');

      // Drop tables in reverse order to handle foreign key constraints
      await queryInterface.dropTable('fee_transactions', { transaction });
      await queryInterface.dropTable('student_fee_assignments', { transaction });
      await queryInterface.dropTable('custom_field_values', { transaction });

      await transaction.commit();
      logger.info('Tenant database migration rolled back successfully');
   } catch (error) {
      await transaction.rollback();
      logger.error('Tenant database rollback failed', {
         error: error.message,
         stack: error.stack,
      });
      throw error;
   }
}

module.exports = { up, down };
