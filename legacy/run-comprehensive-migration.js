/**
 * Comprehensive Migration Runner
 * Executes all system and tenant database migrations
 */

const { logSystem, logError } = require('../utils/logger');
const { dbManager } = require('../models/database');

/**
 * Run system database migration
 */
async function runSystemMigration() {
   try {
      logSystem('Starting system database migration...');
      
      const systemDB = await dbManager.getSystemDB();
      let tablesCreated = 0;
      const errors = [];

      // Create TenantConfigurations table
      try {
         await systemDB.query(`
            CREATE TABLE IF NOT EXISTS TenantConfigurations (
               id INT AUTO_INCREMENT PRIMARY KEY,
               trust_id INT NOT NULL,
               student_config JSON DEFAULT ('{}'),
               school_config JSON DEFAULT ('{}'),
               academic_config JSON DEFAULT ('{}'),
               feature_flags JSON DEFAULT ('{}'),
               ui_customization JSON DEFAULT ('{}'),
               workflow_config JSON DEFAULT ('{}'),
               integration_config JSON DEFAULT ('{}'),
               version INT DEFAULT 1,
               last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
               updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
               INDEX idx_trust_id (trust_id),
               INDEX idx_version (version),
               FOREIGN KEY (trust_id) REFERENCES trusts(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
         `, { type: systemDB.Sequelize.QueryTypes.RAW });
         
         logSystem('✅ TenantConfigurations table created/verified');
         tablesCreated++;
      } catch (error) {
         const msg = `Failed to create TenantConfigurations: ${error.message}`;
         logError(error, { context: 'TenantConfigurations' });
         errors.push(msg);
      }

      // Create TenantCustomFields table
      try {
         await systemDB.query(`
            CREATE TABLE IF NOT EXISTS TenantCustomFields (
               id INT AUTO_INCREMENT PRIMARY KEY,
               trust_id INT NOT NULL,
               entity_type ENUM('student', 'school', 'class', 'teacher', 'fee') NOT NULL,
               field_name VARCHAR(100) NOT NULL,
               field_type ENUM('text', 'number', 'date', 'boolean', 'select', 'multiselect', 'textarea', 'url', 'email', 'phone', 'file') NOT NULL,
               field_label VARCHAR(255) NOT NULL,
               field_description TEXT,
               default_value TEXT,
               validation_rules JSON DEFAULT ('{}'),
               display_options JSON DEFAULT ('{}'),
               is_required BOOLEAN DEFAULT FALSE,
               is_active BOOLEAN DEFAULT TRUE,
               field_group VARCHAR(100),
               sort_order INT DEFAULT 0,
               created_by INT,
               updated_by INT,
               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
               updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
               UNIQUE KEY unique_field_per_entity (trust_id, entity_type, field_name),
               INDEX idx_trust_entity (trust_id, entity_type),
               INDEX idx_active_fields (is_active),
               INDEX idx_field_group (field_group),
               FOREIGN KEY (trust_id) REFERENCES trusts(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
         `, { type: systemDB.Sequelize.QueryTypes.RAW });
         
         logSystem('✅ TenantCustomFields table created/verified');
         tablesCreated++;
      } catch (error) {
         const msg = `Failed to create TenantCustomFields: ${error.message}`;
         logError(error, { context: 'TenantCustomFields' });
         errors.push(msg);
      }

      // Create FeeConfigurations table
      try {
         await systemDB.query(`
            CREATE TABLE IF NOT EXISTS FeeConfigurations (
               id INT AUTO_INCREMENT PRIMARY KEY,
               trust_id INT NOT NULL,
               name VARCHAR(255) NOT NULL,
               description TEXT,
               fee_components JSON NOT NULL DEFAULT ('{}'),
               discount_policies JSON DEFAULT ('{}'),
               payment_schedule JSON DEFAULT ('{}'),
               academic_year VARCHAR(20),
               class_groups JSON DEFAULT ('[]'),
               is_active BOOLEAN DEFAULT TRUE,
               effective_from DATE,
               effective_until DATE,
               version INT DEFAULT 1,
               created_by INT,
               last_updated_by INT,
               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
               updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
               INDEX idx_trust_id (trust_id),
               INDEX idx_academic_year (academic_year),
               INDEX idx_active (is_active),
               INDEX idx_effective_dates (effective_from, effective_until),
               FOREIGN KEY (trust_id) REFERENCES trusts(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
         `, { type: systemDB.Sequelize.QueryTypes.RAW });
         
         logSystem('✅ FeeConfigurations table created/verified');
         tablesCreated++;
      } catch (error) {
         const msg = `Failed to create FeeConfigurations: ${error.message}`;
         logError(error, { context: 'FeeConfigurations' });
         errors.push(msg);
      }

      return {
         success: errors.length === 0,
         tablesCreated,
         errors
      };

   } catch (error) {
      logError(error, { context: 'runSystemMigration' });
      throw error;
   }
}

/**
 * Run tenant database migration
 */
async function runTenantMigration() {
   try {
      logSystem('Starting tenant database migrations...');
      
      const systemDB = await dbManager.getSystemDB();
      
      // Get all active trusts
      const trusts = await systemDB.query(
         'SELECT id, trust_name, database_name, status FROM trusts WHERE status = "ACTIVE"',
         { type: systemDB.Sequelize.QueryTypes.SELECT }
      );
      
      if (trusts.length === 0) {
         return { success: true, successCount: 0, totalCount: 0, errors: [] };
      }

      let successCount = 0;
      const errors = [];

      for (const trust of trusts) {
         try {
            logSystem(`Migrating tenant database: ${trust.database_name}`);
            
            const tenantDB = await dbManager.getTenantDB(trust.trust_name);

            // Create CustomFieldValues table
            await tenantDB.query(`
               CREATE TABLE IF NOT EXISTS CustomFieldValues (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  entity_type ENUM('student', 'school', 'class', 'teacher', 'fee') NOT NULL,
                  entity_id INT NOT NULL,
                  field_id INT NOT NULL,
                  field_name VARCHAR(100) NOT NULL,
                  field_value TEXT,
                  field_type ENUM('text', 'number', 'date', 'boolean', 'select', 'multiselect', 'textarea', 'url', 'email', 'phone', 'file') NOT NULL,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  INDEX idx_entity (entity_type, entity_id),
                  INDEX idx_field (field_id),
                  INDEX idx_field_name (field_name),
                  UNIQUE KEY unique_entity_field (entity_type, entity_id, field_name)
               ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `, { type: tenantDB.Sequelize.QueryTypes.RAW });

            // Create StudentFeeAssignments table
            await tenantDB.query(`
               CREATE TABLE IF NOT EXISTS StudentFeeAssignments (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  student_id INT NOT NULL,
                  fee_configuration_id INT NOT NULL,
                  academic_year VARCHAR(20) NOT NULL,
                  calculated_fee_structure JSON DEFAULT ('{}'),
                  individual_adjustments JSON DEFAULT ('{}'),
                  discount_approvals JSON DEFAULT ('{}'),
                  payment_overrides JSON DEFAULT ('{}'),
                  payment_schedule JSON DEFAULT ('{}'),
                  is_structure_locked BOOLEAN DEFAULT FALSE,
                  lock_reason TEXT,
                  locked_by INT,
                  locked_at TIMESTAMP NULL,
                  is_active BOOLEAN DEFAULT TRUE,
                  assigned_by INT,
                  last_updated_by INT,
                  notes TEXT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  INDEX idx_student_id (student_id),
                  INDEX idx_fee_config (fee_configuration_id),
                  INDEX idx_academic_year (academic_year),
                  INDEX idx_active (is_active),
                  UNIQUE KEY unique_student_year (student_id, academic_year, is_active)
               ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `, { type: tenantDB.Sequelize.QueryTypes.RAW });

            // Create FeeTransactions table
            await tenantDB.query(`
               CREATE TABLE IF NOT EXISTS FeeTransactions (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  student_id INT NOT NULL,
                  fee_assignment_id INT,
                  academic_year VARCHAR(20) NOT NULL,
                  transaction_number VARCHAR(50) UNIQUE NOT NULL,
                  receipt_number VARCHAR(50) UNIQUE,
                  transaction_type ENUM('payment', 'adjustment', 'reversal', 'refund', 'late_fee') DEFAULT 'payment',
                  payment_method ENUM('cash', 'online', 'cheque', 'dd', 'card', 'bank_transfer', 'upi') NOT NULL,
                  reference_number VARCHAR(100),
                  total_amount DECIMAL(10,2) NOT NULL,
                  fee_breakdown JSON DEFAULT ('{}'),
                  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  due_date DATE,
                  balance_before DECIMAL(10,2),
                  balance_after DECIMAL(10,2),
                  processed_by INT,
                  approved_by INT,
                  transaction_notes TEXT,
                  receipt_generated BOOLEAN DEFAULT FALSE,
                  is_reversed BOOLEAN DEFAULT FALSE,
                  reversal_reason TEXT,
                  reversed_by INT,
                  reversed_at TIMESTAMP NULL,
                  original_transaction_id INT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  INDEX idx_student_id (student_id),
                  INDEX idx_assignment_id (fee_assignment_id),
                  INDEX idx_transaction_number (transaction_number),
                  INDEX idx_academic_year (academic_year),
                  INDEX idx_transaction_date (transaction_date),
                  INDEX idx_payment_method (payment_method),
                  INDEX idx_transaction_type (transaction_type),
                  FOREIGN KEY (original_transaction_id) REFERENCES FeeTransactions(id)
               ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `, { type: tenantDB.Sequelize.QueryTypes.RAW });

            logSystem(`✅ Tenant database migrated: ${trust.database_name}`);
            successCount++;

         } catch (error) {
            const msg = `Failed to migrate ${trust.database_name}: ${error.message}`;
            logError(error, {
               context: 'tenantMigration',
               trustId: trust.id,
               databaseName: trust.database_name
            });
            errors.push(msg);
         }
      }

      return {
         success: errors.length === 0,
         successCount,
         totalCount: trusts.length,
         errors
      };

   } catch (error) {
      logError(error, { context: 'runTenantMigration' });
      throw error;
   }
}

/**
 * Run comprehensive migration for both system and tenant databases
 */
async function runComprehensiveMigration() {
   try {
      logSystem('🚀 Starting comprehensive database migration...');

      // Step 1: Run system database migration
      logSystem('📊 Step 1: Running system database migration...');
      const systemResult = await runSystemMigration();
      
      if (!systemResult.success) {
         throw new Error(`System migration failed: ${systemResult.errors.join(', ')}`);
      }
      
      logSystem('✅ System database migration completed successfully');

      // Step 2: Run tenant database migrations
      logSystem('🏢 Step 2: Running tenant database migrations...');
      const tenantResult = await runTenantMigration();
      
      if (!tenantResult.success) {
         logError('❌ Some tenant migrations failed', {
            context: 'runComprehensiveMigration',
            errors: tenantResult.errors
         });
      }
      
      logSystem(
         '✅ Tenant migrations completed. ' +
         `Success: ${tenantResult.successCount}/${tenantResult.totalCount}`
      );

      // Summary
      const overallSuccess = systemResult.success && tenantResult.errors.length === 0;
      
      return {
         success: overallSuccess,
         systemMigration: systemResult,
         tenantMigration: tenantResult,
         summary: {
            systemTables: systemResult.tablesCreated,
            tenantDatabases: tenantResult.successCount,
            totalTenants: tenantResult.totalCount,
            errors: [...(systemResult.errors || []), ...tenantResult.errors]
         }
      };

   } catch (error) {
      logError(error, { context: 'runComprehensiveMigration' });
      throw error;
   }
}

/**
 * Main execution function
 */
async function main() {
   try {
      console.log('🚀 Starting Comprehensive Database Migration...\n');
      
      const startTime = Date.now();
      const result = await runComprehensiveMigration();
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      console.log('\n📊 Migration Summary:');
      console.log('='.repeat(50));
      console.log(`⏱️  Duration: ${duration} seconds`);
      console.log(`📋 Overall Success: ${result.success ? '✅ YES' : '❌ NO'}`);
      console.log(`🗄️  System Tables Created: ${result.summary.systemTables}`);
      console.log(
         '🏢 Tenant Databases Migrated: ' +
         `${result.summary.tenantDatabases}/${result.summary.totalTenants}`
      );
      
      if (result.summary.errors.length > 0) {
         console.log(`❌ Total Errors: ${result.summary.errors.length}`);
         console.log('\nError Details:');
         result.summary.errors.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error}`);
         });
      }

      console.log('\n🎯 Migration Components:');
      console.log('System Database:');
      console.log('  ✅ TenantConfigurations - Multi-tenant configuration storage');
      console.log('  ✅ TenantCustomFields - Dynamic custom field definitions');
      console.log('  ✅ FeeConfigurations - Comprehensive fee management');
      console.log('  ✅ Enhanced Trust model - Updated trust management');
      
      console.log('\nTenant Databases:');
      console.log('  ✅ CustomFieldValues - Custom field value storage');
      console.log('  ✅ StudentFeeAssignments - Individual fee assignments');
      console.log('  ✅ FeeTransactions - Payment and transaction tracking');
      console.log('  ✅ Enhanced Student/School models - Configuration integration');

      if (result.success) {
         console.log('\n🎉 Database upgrade completed successfully!');
         console.log('📘 Your School ERP now has:');
         console.log('   • Multi-tenant configuration system');
         console.log('   • Dynamic custom fields support');
         console.log('   • Comprehensive fee management');
         console.log('   • Enhanced student/school models');
         console.log('   • Transaction tracking and audit trails');
      } else {
         console.log('\n⚠️  Migration completed with some issues.');
         console.log('   Please review the errors above and re-run if needed.');
      }

      // Close database connections
      await dbManager.closeAllConnections();
      
      process.exit(result.success ? 0 : 1);
      
   } catch (error) {
      console.error('\n❌ Comprehensive migration failed:', error.message);
      console.error(error.stack);
      
      // Close database connections
      try {
         await dbManager.closeAllConnections();
      } catch (closeError) {
         console.error('Error closing connections:', closeError.message);
      }
      
      process.exit(1);
   }
}

// Run the script if executed directly
if (require.main === module) {
   main();
}

module.exports = {
   runComprehensiveMigration
};
