const DatabaseVersionManager = require('./DatabaseVersionManager');
const { logger } = require('../utils/logger');
const { Sequelize } = require('sequelize');
const config = require('../config/database');

/**
 * Comprehensive Database Migration with Proper Versioning
 * This script handles both system and tenant database migrations with proper version tracking
 */

class ComprehensiveMigration {
   constructor() {
      this.versionManager = new DatabaseVersionManager();
      this.systemDb = null;
      this.migrationStartTime = Date.now();
   }

   async initialize() {
      await this.versionManager.initialize();
      this.systemDb = new Sequelize({
         ...config.system,
         logging: false
      });
      await this.systemDb.authenticate();
   }

   /**
    * System Database Migration to v2.0.0
    */
   async migrateSystemDatabase() {
      const startTime = Date.now();
      
      try {
         logger.info('Starting system database migration...');
         await this.versionManager.startMigration('system', null, '2.0.0');

         // Check current version
         const currentVersion = await this.versionManager.getCurrentVersion('system');
         logger.info(`System database current version: ${currentVersion}`);

         // Apply system migrations based on current version
         if (currentVersion === '1.0.0') {
            await this.applySystemMigration_1_1_0();
         }
         
         if (['1.0.0', '1.1.0'].includes(currentVersion)) {
            await this.applySystemMigration_2_0_0();
         }

         // Complete migration
         await this.versionManager.completeMigration('system', null, '2.0.0');
         
         const executionTime = Date.now() - startTime;
         await this.versionManager.recordMigration(
            'system', null, 'system_migration_2_0_0', '2.0.0', 
            'schema', 'success', executionTime
         );

         logger.info(`System database migration completed in ${executionTime}ms`);
         return { success: true, executionTime };

      } catch (error) {
         const executionTime = Date.now() - startTime;
         await this.versionManager.failMigration('system', null, error.message);
         await this.versionManager.recordMigration(
            'system', null, 'system_migration_2_0_0', '2.0.0', 
            'schema', 'failed', executionTime, error.message
         );
         
         logger.error('System database migration failed:', error);
         throw error;
      }
   }

   /**
    * Apply system migration for version 1.1.0
    */
   async applySystemMigration_1_1_0() {
      logger.info('Applying system migration v1.1.0...');

      // Check if TenantConfigurations table exists
      const [tables] = await this.systemDb.query("SHOW TABLES LIKE 'TenantConfigurations'");
      
      if (tables.length === 0) {
         await this.systemDb.query(`
            CREATE TABLE TenantConfigurations (
               id INT PRIMARY KEY AUTO_INCREMENT,
               trust_id INT NOT NULL,
               student_config JSON NOT NULL DEFAULT '{}',
               school_config JSON NOT NULL DEFAULT '{}',
               academic_config JSON NOT NULL DEFAULT '{}',
               feature_flags JSON NOT NULL DEFAULT '{}',
               is_active BOOLEAN DEFAULT TRUE,
               version INT DEFAULT 1,
               created_by INT,
               last_updated_by INT,
               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
               updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
               
               FOREIGN KEY (trust_id) REFERENCES Trusts(id) ON DELETE CASCADE,
               UNIQUE KEY unique_trust_config (trust_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
         `);
         logger.info('TenantConfigurations table created');
      }
   }

   /**
    * Apply system migration for version 2.0.0
    */
   async applySystemMigration_2_0_0() {
      logger.info('Applying system migration v2.0.0...');

      // Check if FeeConfigurations table exists
      const [feeConfigTables] = await this.systemDb.query("SHOW TABLES LIKE 'FeeConfigurations'");
      
      if (feeConfigTables.length === 0) {
         await this.systemDb.query(`
            CREATE TABLE FeeConfigurations (
               id INT PRIMARY KEY AUTO_INCREMENT,
               trust_id INT NOT NULL,
               name VARCHAR(200) NOT NULL,
               description TEXT,
               fee_components JSON NOT NULL DEFAULT '{}',
               discount_policies JSON NOT NULL DEFAULT '{}',
               payment_schedule JSON NOT NULL DEFAULT '{}',
               is_active BOOLEAN DEFAULT TRUE,
               version INT DEFAULT 1,
               created_by INT,
               last_updated_by INT,
               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
               updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
               
               FOREIGN KEY (trust_id) REFERENCES Trusts(id) ON DELETE CASCADE,
               INDEX idx_trust_fee_config (trust_id),
               INDEX idx_active_fee_configs (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
         `);
         logger.info('FeeConfigurations table created');
      }

      // Check if TenantCustomFields table exists
      const [customFieldsTables] = await this.systemDb.query("SHOW TABLES LIKE 'TenantCustomFields'");
      
      if (customFieldsTables.length === 0) {
         await this.systemDb.query(`
            CREATE TABLE TenantCustomFields (
               id INT PRIMARY KEY AUTO_INCREMENT,
               trust_id INT NOT NULL,
               entity_type ENUM('student', 'teacher', 'school', 'class') NOT NULL,
               field_name VARCHAR(100) NOT NULL,
               field_label VARCHAR(200) NOT NULL,
               field_type ENUM('text', 'number', 'decimal', 'boolean', 'date', 'datetime', 'email', 'phone', 'url', 'textarea', 'select') NOT NULL,
               field_options JSON DEFAULT NULL,
               validation_rules JSON DEFAULT NULL,
               display_options JSON DEFAULT NULL,
               is_required BOOLEAN DEFAULT FALSE,
               is_active BOOLEAN DEFAULT TRUE,
               display_order INT DEFAULT 0,
               field_group VARCHAR(100) DEFAULT 'general',
               created_by INT,
               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
               updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
               
               FOREIGN KEY (trust_id) REFERENCES Trusts(id) ON DELETE CASCADE,
               UNIQUE KEY unique_tenant_field (trust_id, entity_type, field_name),
               INDEX idx_entity_fields (trust_id, entity_type),
               INDEX idx_active_fields (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
         `);
         logger.info('TenantCustomFields table created');
      }
   }

   /**
    * Migrate a single tenant database
    */
   async migrateTenantDatabase(tenantCode, trustId, databaseName) {
      const startTime = Date.now();
      
      try {
         logger.info(`Starting tenant migration for ${tenantCode} (${databaseName})...`);
         
         // Check if tenant can be migrated
         const canMigrate = await this.versionManager.canMigrateTenant(tenantCode, '2.0.0');
         if (!canMigrate.canMigrate) {
            throw new Error(`Cannot migrate tenant: ${canMigrate.reason}`);
         }

         await this.versionManager.startMigration('tenant', tenantCode, '2.0.0');

         // Connect to tenant database
         const tenantDb = new Sequelize({
            ...config.tenant,
            database: databaseName,
            logging: false
         });

         await tenantDb.authenticate();

         // Check current version
         const currentVersion = await this.versionManager.getCurrentVersion('tenant', tenantCode);
         logger.info(`Tenant ${tenantCode} current version: ${currentVersion}`);

         // Apply tenant migrations based on current version
         if (currentVersion === '1.0.0') {
            await this.applyTenantMigration_1_1_0(tenantDb, tenantCode);
         }
         
         if (['1.0.0', '1.1.0'].includes(currentVersion)) {
            await this.applyTenantMigration_2_0_0(tenantDb, tenantCode);
         }

         await tenantDb.close();

         // Complete migration
         await this.versionManager.completeMigration('tenant', tenantCode, '2.0.0');
         
         const executionTime = Date.now() - startTime;
         await this.versionManager.recordMigration(
            'tenant', tenantCode, 'tenant_migration_2_0_0', '2.0.0', 
            'schema', 'success', executionTime
         );

         logger.info(`Tenant ${tenantCode} migration completed in ${executionTime}ms`);
         return { success: true, executionTime };

      } catch (error) {
         const executionTime = Date.now() - startTime;
         await this.versionManager.failMigration('tenant', tenantCode, error.message);
         await this.versionManager.recordMigration(
            'tenant', tenantCode, 'tenant_migration_2_0_0', '2.0.0', 
            'schema', 'failed', executionTime, error.message
         );
         
         logger.error(`Tenant ${tenantCode} migration failed:`, error);
         throw error;
      }
   }

   /**
    * Apply tenant migration for version 1.1.0
    */
   async applyTenantMigration_1_1_0(tenantDb, tenantCode) {
      logger.info(`Applying tenant migration v1.1.0 for ${tenantCode}...`);

      // Check if CustomFieldValues table exists
      const [tables] = await tenantDb.query("SHOW TABLES LIKE 'CustomFieldValues'");
      
      if (tables.length === 0) {
         await tenantDb.query(`
            CREATE TABLE CustomFieldValues (
               id INT PRIMARY KEY AUTO_INCREMENT,
               entity_type ENUM('student', 'teacher', 'school', 'class') NOT NULL,
               entity_id INT NOT NULL,
               field_name VARCHAR(100) NOT NULL,
               field_value TEXT,
               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
               updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
               
               UNIQUE KEY unique_entity_field (entity_type, entity_id, field_name),
               INDEX idx_entity_values (entity_type, entity_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
         `);
         logger.info(`CustomFieldValues table created for ${tenantCode}`);
      }
   }

   /**
    * Apply tenant migration for version 2.0.0
    */
   async applyTenantMigration_2_0_0(tenantDb, tenantCode) {
      logger.info(`Applying tenant migration v2.0.0 for ${tenantCode}...`);

      // Check if StudentFeeAssignments table exists
      const [feeAssignmentTables] = await tenantDb.query("SHOW TABLES LIKE 'StudentFeeAssignments'");
      
      if (feeAssignmentTables.length === 0) {
         await tenantDb.query(`
            CREATE TABLE StudentFeeAssignments (
               id INT PRIMARY KEY AUTO_INCREMENT,
               student_id INT NOT NULL,
               fee_configuration_id INT NOT NULL,
               academic_year VARCHAR(20) NOT NULL,
               calculated_fee_structure JSON DEFAULT '{}',
               individual_adjustments JSON DEFAULT '{}',
               discount_approvals JSON DEFAULT '{}',
               payment_overrides JSON DEFAULT '{}',
               is_structure_locked BOOLEAN DEFAULT FALSE,
               is_active BOOLEAN DEFAULT TRUE,
               assigned_by INT,
               last_updated_by INT,
               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
               updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
               
               FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
               UNIQUE KEY unique_student_academic_year (student_id, academic_year),
               INDEX idx_academic_year (academic_year),
               INDEX idx_fee_configuration (fee_configuration_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
         `);
         logger.info(`StudentFeeAssignments table created for ${tenantCode}`);
      }

      // Check if FeeTransactions table exists
      const [feeTransactionTables] = await tenantDb.query("SHOW TABLES LIKE 'FeeTransactions'");
      
      if (feeTransactionTables.length === 0) {
         await tenantDb.query(`
            CREATE TABLE FeeTransactions (
               id INT PRIMARY KEY AUTO_INCREMENT,
               student_id INT NOT NULL,
               fee_assignment_id INT,
               academic_year VARCHAR(20) NOT NULL,
               transaction_number VARCHAR(50) UNIQUE NOT NULL,
               receipt_number VARCHAR(50) UNIQUE,
               transaction_type ENUM('payment', 'adjustment', 'reversal') DEFAULT 'payment',
               payment_method ENUM('cash', 'online', 'cheque', 'dd', 'card') NOT NULL,
               total_amount DECIMAL(10,2) NOT NULL,
               fee_breakdown JSON DEFAULT '{}',
               transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
               balance_before DECIMAL(10,2),
               balance_after DECIMAL(10,2),
               processed_by INT,
               is_reversed BOOLEAN DEFAULT FALSE,
               reversal_reason TEXT,
               reversed_by INT,
               reversed_at TIMESTAMP NULL,
               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
               updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
               
               FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
               FOREIGN KEY (fee_assignment_id) REFERENCES StudentFeeAssignments(id) ON DELETE SET NULL,
               INDEX idx_student_transactions (student_id, academic_year),
               INDEX idx_transaction_number (transaction_number),
               INDEX idx_transaction_date (transaction_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
         `);
         logger.info(`FeeTransactions table created for ${tenantCode}`);
      }

      // Update Students table to add fee-related columns if they don't exist
      try {
         await tenantDb.query("ALTER TABLE Students ADD COLUMN transport_required BOOLEAN DEFAULT FALSE");
         logger.info(`Added transport_required column to Students table for ${tenantCode}`);
      } catch (error) {
         // Column already exists, ignore
      }

      try {
         await tenantDb.query("ALTER TABLE Students ADD COLUMN hostel_required BOOLEAN DEFAULT FALSE");
         logger.info(`Added hostel_required column to Students table for ${tenantCode}`);
      } catch (error) {
         // Column already exists, ignore
      }

      try {
         await tenantDb.query("ALTER TABLE Students ADD COLUMN father_annual_income DECIMAL(12,2)");
         logger.info(`Added father_annual_income column to Students table for ${tenantCode}`);
      } catch (error) {
         // Column already exists, ignore
      }

      try {
         await tenantDb.query("ALTER TABLE Students ADD COLUMN mother_annual_income DECIMAL(12,2)");
         logger.info(`Added mother_annual_income column to Students table for ${tenantCode}`);
      } catch (error) {
         // Column already exists, ignore
      }
   }

   /**
    * Run comprehensive migration for all databases
    */
   async runMigration() {
      try {
         logger.info('🚀 Starting Comprehensive Database Migration with Version Control...');

         // Step 1: Migrate system database
         logger.info('\n📊 Step 1: Migrating System Database...');
         await this.migrateSystemDatabase();

         // Step 2: Get all tenants that need migration
         logger.info('\n📋 Step 2: Identifying tenants for migration...');
         const tenantsNeedingMigration = await this.versionManager.getTenantsNeedingMigration('2.0.0');
         
         if (tenantsNeedingMigration.length === 0) {
            logger.info('No tenants need migration');
         } else {
            logger.info(`Found ${tenantsNeedingMigration.length} tenants that need migration`);

            // Step 3: Migrate tenants in batches
            logger.info('\n🏢 Step 3: Migrating tenant databases...');
            
            const batchSize = 3;
            let successCount = 0;
            let failureCount = 0;

            for (let i = 0; i < tenantsNeedingMigration.length; i += batchSize) {
               const batch = tenantsNeedingMigration.slice(i, i + batchSize);
               logger.info(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(tenantsNeedingMigration.length / batchSize)}`);

               const batchPromises = batch.map(async (tenant) => {
                  try {
                     await this.migrateTenantDatabase(tenant.code, tenant.id, tenant.database_name);
                     return { tenant: tenant.code, success: true };
                  } catch (error) {
                     logger.error(`Failed to migrate tenant ${tenant.code}:`, error.message);
                     return { tenant: tenant.code, success: false, error: error.message };
                  }
               });

               const batchResults = await Promise.allSettled(batchPromises);
               
               batchResults.forEach(result => {
                  if (result.status === 'fulfilled') {
                     if (result.value.success) {
                        successCount++;
                     } else {
                        failureCount++;
                     }
                  } else {
                     failureCount++;
                  }
               });

               // Add small delay between batches
               if (i + batchSize < tenantsNeedingMigration.length) {
                  await new Promise(resolve => setTimeout(resolve, 1000));
               }
            }

            logger.info(`\n📈 Migration Summary: ${successCount} successful, ${failureCount} failed`);
         }

         // Step 4: Show final status
         logger.info('\n🎯 Step 4: Final Migration Status...');
         const finalStatus = await this.versionManager.getMigrationStatus();
         
         logger.info('System Database Status:');
         logger.info(`  Current Version: ${finalStatus.system.current_version}`);
         logger.info(`  Target Version: ${finalStatus.system.target_version}`);
         logger.info(`  Needs Migration: ${finalStatus.system.needs_migration}`);

         logger.info('\nTenant Database Status:');
         finalStatus.tenants.forEach(tenant => {
            logger.info(`  ${tenant.name} (${tenant.code}):`);
            logger.info(`    Current: ${tenant.current_version}, Target: ${tenant.target_version}`);
            logger.info(`    Status: ${tenant.migration_status}, Needs Migration: ${tenant.needs_migration}`);
         });

         const totalMigrationTime = Date.now() - this.migrationStartTime;
         logger.info(`\n✅ Comprehensive migration completed in ${totalMigrationTime}ms`);

         return {
            success: true,
            executionTime: totalMigrationTime,
            systemMigrated: true,
            tenantsMigrated: successCount,
            tenantsFailedMigration: failureCount,
            finalStatus
         };

      } catch (error) {
         logger.error('❌ Comprehensive migration failed:', error);
         throw error;
      }
   }

   /**
    * Clean up resources
    */
   async cleanup() {
      try {
         if (this.systemDb) {
            await this.systemDb.close();
         }
         await this.versionManager.close();
         logger.info('Migration cleanup completed');
      } catch (error) {
         logger.error('Error during cleanup:', error);
      }
   }
}

/**
 * Main execution function
 */
async function main() {
   const migration = new ComprehensiveMigration();

   try {
      await migration.initialize();
      const result = await migration.runMigration();
      
      logger.info('\n🎉 Database upgrade completed successfully!');
      logger.info(`Total time: ${result.executionTime}ms`);
      logger.info(`System migrated: ${result.systemMigrated}`);
      logger.info(`Tenants successfully migrated: ${result.tenantsMigrated}`);
      
      if (result.tenantsFailedMigration > 0) {
         logger.warn(`Tenants failed migration: ${result.tenantsFailedMigration}`);
      }

   } catch (error) {
      logger.error('❌ Migration failed:', error);
      process.exit(1);
   } finally {
      await migration.cleanup();
   }
}

// Run migration if this file is executed directly
if (require.main === module) {
   main();
}

module.exports = ComprehensiveMigration;
