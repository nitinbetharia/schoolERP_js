/* eslint-disable max-len, quotes, indent */
/**
 * Core Tenant Database Migration - Essential Tables
 * Creates core tables that every tenant database needs
 */

const { DataTypes } = require('sequelize');
const { logger } = require('../utils/logger');

async function up(queryInterface, _Sequelize) {
   const transaction = await queryInterface.sequelize.transaction();

   // Helper checkers for idempotency
   async function tableExists(tableName) {
      const [rows] = await queryInterface.sequelize.query(
         `SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?`,
         { replacements: [tableName], transaction }
      );
      return Number(rows[0].c) > 0;
   }

   async function indexExists(tableName, indexName) {
      const [rows] = await queryInterface.sequelize.query(
         `SELECT COUNT(*) AS c FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
         { replacements: [tableName, indexName], transaction }
      );
      return Number(rows[0].c) > 0;
   }

   try {
      logger.info('Starting core tenant database migration - essential tables');

      // 1. Create Users table (base user table for students, teachers, etc.)
      if (!(await tableExists('users'))) {
         await queryInterface.createTable(
            'users',
            {
               id: {
                  type: DataTypes.INTEGER,
                  primaryKey: true,
                  autoIncrement: true,
               },
               username: {
                  type: DataTypes.STRING(100),
                  allowNull: false,
                  unique: true,
               },
               email: {
                  type: DataTypes.STRING(255),
                  allowNull: true,
                  unique: true,
               },
               password_hash: {
                  type: DataTypes.STRING(255),
                  allowNull: true,
               },
               first_name: {
                  type: DataTypes.STRING(100),
                  allowNull: false,
               },
               last_name: {
                  type: DataTypes.STRING(100),
                  allowNull: false,
               },
               middle_name: {
                  type: DataTypes.STRING(100),
                  allowNull: true,
               },
               user_type: {
                  type: DataTypes.ENUM('STUDENT', 'TEACHER', 'STAFF', 'PARENT'),
                  allowNull: false,
               },
               is_active: {
                  type: DataTypes.BOOLEAN,
                  defaultValue: true,
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

      // 2. Create Schools table
      if (!(await tableExists('schools'))) {
         await queryInterface.createTable(
            'schools',
            {
               id: {
                  type: DataTypes.INTEGER,
                  primaryKey: true,
                  autoIncrement: true,
               },
               name: {
                  type: DataTypes.STRING(200),
                  allowNull: false,
               },
               code: {
                  type: DataTypes.STRING(20),
                  allowNull: false,
                  unique: true,
               },
               address: {
                  type: DataTypes.TEXT,
                  allowNull: false,
               },
               phone: {
                  type: DataTypes.STRING(20),
                  allowNull: true,
               },
               email: {
                  type: DataTypes.STRING(255),
                  allowNull: true,
               },
               board_affiliation: {
                  type: DataTypes.ENUM('CBSE', 'CISCE', 'STATE_BOARD', 'INTERNATIONAL'),
                  allowNull: false,
               },
               school_type: {
                  type: DataTypes.ENUM('PRIMARY', 'SECONDARY', 'HIGHER_SECONDARY', 'NURSERY', 'MIXED'),
                  allowNull: false,
               },
               is_active: {
                  type: DataTypes.BOOLEAN,
                  defaultValue: true,
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

      // 3. Create Classes table
      if (!(await tableExists('classes'))) {
         await queryInterface.createTable(
            'classes',
            {
               id: {
                  type: DataTypes.INTEGER,
                  primaryKey: true,
                  autoIncrement: true,
               },
               school_id: {
                  type: DataTypes.INTEGER,
                  allowNull: false,
                  references: {
                     model: 'schools',
                     key: 'id',
                  },
                  onDelete: 'CASCADE',
                  onUpdate: 'CASCADE',
               },
               name: {
                  type: DataTypes.STRING(50),
                  allowNull: false,
               },
               code: {
                  type: DataTypes.STRING(20),
                  allowNull: false,
               },
               level: {
                  type: DataTypes.ENUM('NURSERY', 'PRIMARY', 'SECONDARY', 'HIGHER_SECONDARY'),
                  allowNull: false,
               },
               class_order: {
                  type: DataTypes.INTEGER,
                  allowNull: false,
               },
               max_students: {
                  type: DataTypes.INTEGER,
                  defaultValue: 40,
               },
               is_active: {
                  type: DataTypes.BOOLEAN,
                  defaultValue: true,
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

      // 4. Create Sections table
      if (!(await tableExists('sections'))) {
         await queryInterface.createTable(
            'sections',
            {
               id: {
                  type: DataTypes.INTEGER,
                  primaryKey: true,
                  autoIncrement: true,
               },
               class_id: {
                  type: DataTypes.INTEGER,
                  allowNull: false,
                  references: {
                     model: 'classes',
                     key: 'id',
                  },
                  onDelete: 'CASCADE',
                  onUpdate: 'CASCADE',
               },
               name: {
                  type: DataTypes.STRING(10),
                  allowNull: false,
               },
               max_students: {
                  type: DataTypes.INTEGER,
                  defaultValue: 40,
               },
               class_teacher_id: {
                  type: DataTypes.INTEGER,
                  allowNull: true,
                  references: {
                     model: 'users',
                     key: 'id',
                  },
                  onDelete: 'SET NULL',
                  onUpdate: 'CASCADE',
               },
               is_active: {
                  type: DataTypes.BOOLEAN,
                  defaultValue: true,
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

      // 5. Create AcademicYears table
      if (!(await tableExists('academic_years'))) {
         await queryInterface.createTable(
            'academic_years',
            {
               id: {
                  type: DataTypes.INTEGER,
                  primaryKey: true,
                  autoIncrement: true,
               },
               year_name: {
                  type: DataTypes.STRING(20),
                  allowNull: false,
                  unique: true,
               },
               start_date: {
                  type: DataTypes.DATEONLY,
                  allowNull: false,
               },
               end_date: {
                  type: DataTypes.DATEONLY,
                  allowNull: false,
               },
               is_current: {
                  type: DataTypes.BOOLEAN,
                  defaultValue: false,
               },
               is_active: {
                  type: DataTypes.BOOLEAN,
                  defaultValue: true,
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

      // 6. Create Students table
      if (!(await tableExists('students'))) {
         await queryInterface.createTable(
            'students',
            {
               id: {
                  type: DataTypes.INTEGER,
                  primaryKey: true,
                  autoIncrement: true,
               },
               user_id: {
                  type: DataTypes.INTEGER,
                  allowNull: false,
                  unique: true,
                  references: {
                     model: 'users',
                     key: 'id',
                  },
                  onDelete: 'CASCADE',
                  onUpdate: 'CASCADE',
               },
               admission_number: {
                  type: DataTypes.STRING(50),
                  allowNull: false,
                  unique: true,
               },
               roll_number: {
                  type: DataTypes.STRING(20),
                  allowNull: true,
               },
               school_id: {
                  type: DataTypes.INTEGER,
                  allowNull: false,
                  references: {
                     model: 'schools',
                     key: 'id',
                  },
                  onDelete: 'RESTRICT',
                  onUpdate: 'CASCADE',
               },
               class_id: {
                  type: DataTypes.INTEGER,
                  allowNull: true,
                  references: {
                     model: 'classes',
                     key: 'id',
                  },
                  onDelete: 'SET NULL',
                  onUpdate: 'CASCADE',
               },
               section_id: {
                  type: DataTypes.INTEGER,
                  allowNull: true,
                  references: {
                     model: 'sections',
                     key: 'id',
                  },
                  onDelete: 'SET NULL',
                  onUpdate: 'CASCADE',
               },
               date_of_birth: {
                  type: DataTypes.DATEONLY,
                  allowNull: false,
               },
               gender: {
                  type: DataTypes.ENUM('MALE', 'FEMALE', 'OTHER'),
                  allowNull: false,
               },
               blood_group: {
                  type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
                  allowNull: true,
               },
               admission_date: {
                  type: DataTypes.DATEONLY,
                  allowNull: false,
               },
               academic_year: {
                  type: DataTypes.STRING(20),
                  allowNull: false,
               },
               student_status: {
                  type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED', 'DROPPED_OUT'),
                  defaultValue: 'ACTIVE',
               },
               is_active: {
                  type: DataTypes.BOOLEAN,
                  defaultValue: true,
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

      // Add indexes for performance
      if (!(await indexExists('users', 'idx_users_type_active'))) {
         await queryInterface.addIndex('users', ['user_type', 'is_active'], {
            transaction,
            name: 'idx_users_type_active',
         });
      }

      if (!(await indexExists('schools', 'idx_schools_code'))) {
         await queryInterface.addIndex('schools', ['code'], {
            transaction,
            name: 'idx_schools_code',
         });
      }

      if (!(await indexExists('schools', 'idx_schools_board'))) {
         await queryInterface.addIndex('schools', ['board_affiliation'], {
            transaction,
            name: 'idx_schools_board',
         });
      }

      if (!(await indexExists('classes', 'idx_classes_school_level'))) {
         await queryInterface.addIndex('classes', ['school_id', 'level'], {
            transaction,
            name: 'idx_classes_school_level',
         });
      }

      if (!(await indexExists('sections', 'idx_sections_class'))) {
         await queryInterface.addIndex('sections', ['class_id'], {
            transaction,
            name: 'idx_sections_class',
         });
      }

      if (!(await indexExists('academic_years', 'idx_academic_years_current'))) {
         await queryInterface.addIndex('academic_years', ['is_current'], {
            transaction,
            name: 'idx_academic_years_current',
         });
      }

      if (!(await indexExists('students', 'idx_students_admission'))) {
         await queryInterface.addIndex('students', ['admission_number'], {
            transaction,
            name: 'idx_students_admission',
         });
      }

      if (!(await indexExists('students', 'idx_students_school_class_section'))) {
         await queryInterface.addIndex('students', ['school_id', 'class_id', 'section_id'], {
            transaction,
            name: 'idx_students_school_class_section',
         });
      }

      if (!(await indexExists('students', 'idx_students_year_status'))) {
         await queryInterface.addIndex('students', ['academic_year', 'student_status'], {
            transaction,
            name: 'idx_students_year_status',
         });
      }

      // Add unique constraints
      if (!(await indexExists('classes', 'unique_class_per_school'))) {
         await queryInterface.addConstraint('classes', {
            fields: ['school_id', 'name'],
            type: 'unique',
            name: 'unique_class_per_school',
            transaction,
         });
      }

      if (!(await indexExists('sections', 'unique_section_per_class'))) {
         await queryInterface.addConstraint('sections', {
            fields: ['class_id', 'name'],
            type: 'unique',
            name: 'unique_section_per_class',
            transaction,
         });
      }

      await transaction.commit();
      logger.info('Core tenant database migration completed successfully');

      return {
         success: true,
         tables_created: ['users', 'schools', 'classes', 'sections', 'academic_years', 'students'],
         indexes_created: [
            'idx_users_type_active',
            'idx_schools_code',
            'idx_schools_board',
            'idx_classes_school_level',
            'idx_sections_class',
            'idx_academic_years_current',
            'idx_students_admission',
            'idx_students_school_class_section',
            'idx_students_year_status',
         ],
         constraints_added: ['unique_class_per_school', 'unique_section_per_class'],
      };
   } catch (error) {
      await transaction.rollback();
      logger.error('Core tenant database migration failed', {
         error: error.message,
         stack: error.stack,
      });
      throw error;
   }
}

async function down(queryInterface, _Sequelize) {
   const transaction = await queryInterface.sequelize.transaction();

   try {
      logger.info('Rolling back core tenant database migration');

      // Drop tables in reverse order to handle foreign key constraints
      await queryInterface.dropTable('students', { transaction });
      await queryInterface.dropTable('academic_years', { transaction });
      await queryInterface.dropTable('sections', { transaction });
      await queryInterface.dropTable('classes', { transaction });
      await queryInterface.dropTable('schools', { transaction });
      await queryInterface.dropTable('users', { transaction });

      await transaction.commit();
      logger.info('Core tenant database migration rolled back successfully');
   } catch (error) {
      await transaction.rollback();
      logger.error('Core tenant database rollback failed', {
         error: error.message,
         stack: error.stack,
      });
      throw error;
   }
}

module.exports = { up, down };
