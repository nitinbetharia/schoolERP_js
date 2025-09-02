/**
 * Schema Fix Migration - Fix Model vs Migration Inconsistencies
 * This migration fixes the inconsistencies found between models and migrations
 */

const { DataTypes } = require('sequelize');
const { logger } = require('../utils/logger');

async function up(queryInterface, _Sequelize) {
   const transaction = await queryInterface.sequelize.transaction();

   try {
      logger.info('Starting schema fix migration - resolving model vs migration inconsistencies');

      // Check if we're working with a tenant database (no 'trusts' table)
      const tables = await queryInterface.showAllTables();
      const isTenantDB = !tables.includes('trusts');

      if (isTenantDB) {
         logger.info('Detected tenant database - applying tenant-specific fixes');

         // 1. Fix classes table - ensure level is ENUM not INTEGER
         try {
            // Check current column type
            const classesTable = await queryInterface.describeTable('classes');

            if (classesTable.level && classesTable.level.type.includes('int')) {
               logger.info('Fixing classes.level field - changing from INTEGER to ENUM');

               // First add the new column
               await queryInterface.addColumn(
                  'classes',
                  'level_temp',
                  {
                     type: DataTypes.ENUM('NURSERY', 'PRIMARY', 'SECONDARY', 'HIGHER_SECONDARY'),
                     allowNull: true,
                  },
                  { transaction }
               );

               // Update data based on integer values (if any exists)
               // This is a rough mapping - adjust as needed for your data
               await queryInterface.sequelize.query(
                  `UPDATE classes SET level_temp = 
                     CASE 
                        WHEN level = 0 THEN 'NURSERY'
                        WHEN level >= 1 AND level <= 5 THEN 'PRIMARY' 
                        WHEN level >= 6 AND level <= 10 THEN 'SECONDARY'
                        WHEN level >= 11 THEN 'HIGHER_SECONDARY'
                        ELSE 'PRIMARY'
                     END`,
                  { transaction }
               );

               // Drop old column and rename new one
               await queryInterface.removeColumn('classes', 'level', { transaction });
               await queryInterface.renameColumn('classes', 'level_temp', 'level', { transaction });

               // Make it NOT NULL
               await queryInterface.changeColumn(
                  'classes',
                  'level',
                  {
                     type: DataTypes.ENUM('NURSERY', 'PRIMARY', 'SECONDARY', 'HIGHER_SECONDARY'),
                     allowNull: false,
                  },
                  { transaction }
               );
            }
         } catch (error) {
            logger.warn('Classes level field may already be correct:', error.message);
         }

         // 2. Add missing fields to schools table if they don't exist
         try {
            const schoolsTable = await queryInterface.describeTable('schools');

            // Add missing fields
            const fieldsToAdd = [
               { name: 'city', type: DataTypes.STRING(100), allowNull: true },
               { name: 'state', type: DataTypes.STRING(100), allowNull: true },
               { name: 'postal_code', type: DataTypes.STRING(20), allowNull: true },
               { name: 'website', type: DataTypes.STRING(500), allowNull: true },
               { name: 'principal_name', type: DataTypes.STRING(200), allowNull: true },
               { name: 'principal_phone', type: DataTypes.STRING(15), allowNull: true },
               { name: 'principal_email', type: DataTypes.STRING(255), allowNull: true },
               { name: 'established_year', type: DataTypes.INTEGER, allowNull: true },
               { name: 'board_affiliation_details', type: DataTypes.JSON, allowNull: true },
               { name: 'affiliation_number', type: DataTypes.STRING(50), allowNull: true },
               { name: 'registration_number', type: DataTypes.STRING(50), allowNull: true },
            ];

            for (const field of fieldsToAdd) {
               if (!schoolsTable[field.name]) {
                  logger.info(`Adding missing field: schools.${field.name}`);
                  await queryInterface.addColumn(
                     'schools',
                     field.name,
                     {
                        type: field.type,
                        allowNull: field.allowNull,
                     },
                     { transaction }
                  );
               }
            }
         } catch (error) {
            logger.warn('Error adding missing school fields:', error.message);
         }

         // 3. Add missing fields to classes table if they don't exist
         try {
            const classesTable = await queryInterface.describeTable('classes');

            const fieldsToAdd = [
               { name: 'current_strength', type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
               { name: 'subjects', type: DataTypes.JSON, allowNull: true },
               { name: 'class_teacher_id', type: DataTypes.INTEGER, allowNull: true },
               { name: 'room_number', type: DataTypes.STRING(50), allowNull: true },
               { name: 'description', type: DataTypes.TEXT, allowNull: true },
            ];

            for (const field of fieldsToAdd) {
               if (!classesTable[field.name]) {
                  logger.info(`Adding missing field: classes.${field.name}`);
                  await queryInterface.addColumn(
                     'classes',
                     field.name,
                     {
                        type: field.type,
                        allowNull: field.allowNull,
                        defaultValue: field.defaultValue,
                     },
                     { transaction }
                  );
               }
            }
         } catch (error) {
            logger.warn('Error adding missing class fields:', error.message);
         }
      }

      await transaction.commit();
      logger.info('Schema fix migration completed successfully');
   } catch (error) {
      await transaction.rollback();
      logger.error('Schema fix migration failed:', error);
      throw error;
   }
}

async function down(queryInterface, _Sequelize) {
   const transaction = await queryInterface.sequelize.transaction();

   try {
      logger.info('Rolling back schema fix migration');

      // Check if we're working with a tenant database
      const tables = await queryInterface.showAllTables();
      const isTenantDB = !tables.includes('trusts');

      if (isTenantDB) {
         // Remove added fields (in reverse order)
         const fieldsToRemove = [
            'classes.description',
            'classes.room_number',
            'classes.class_teacher_id',
            'classes.subjects',
            'classes.current_strength',
            'schools.registration_number',
            'schools.affiliation_number',
            'schools.board_affiliation_details',
            'schools.established_year',
            'schools.principal_email',
            'schools.principal_phone',
            'schools.principal_name',
            'schools.website',
            'schools.postal_code',
            'schools.state',
            'schools.city',
         ];

         for (const field of fieldsToRemove) {
            const [table, column] = field.split('.');
            try {
               await queryInterface.removeColumn(table, column, { transaction });
               logger.info(`Removed field: ${field}`);
            } catch (error) {
               logger.warn(`Could not remove field ${field}:`, error.message);
            }
         }
      }

      await transaction.commit();
      logger.info('Schema fix migration rollback completed');
   } catch (error) {
      await transaction.rollback();
      logger.error('Schema fix migration rollback failed:', error);
      throw error;
   }
}

module.exports = { up, down };
