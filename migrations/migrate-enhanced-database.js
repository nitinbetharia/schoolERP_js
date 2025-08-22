/**
 * Comprehensive Database Migration Script
 * Handles both system and tenant database migrations for enhanced ERP features
 */

const { logger, logSystem, logError } = require('../utils/logger');
const { dbManager } = require('../models/database');

// Import migration files
const systemMigration = require('./001-create-system-enhanced-tables');
const tenantMigration = require('./002-create-tenant-enhanced-tables');

/**
 * Run system database migration
 */
async function migrateSystemDatabase() {
   try {
      logSystem('Starting system database migration...');
      
      const systemDB = await dbManager.getSystemDB();
      const queryInterface = systemDB.getQueryInterface();
      
      // Run system migration
      const result = await systemMigration.up(queryInterface, systemDB.Sequelize);
      
      logSystem('System database migration completed successfully');
      return result;
      
   } catch (error) {
      logError(error, { context: 'migrateSystemDatabase' });
      throw error;
   }
}

/**
 * Run tenant database migration for a specific tenant
 */
async function migrateTenantDatabase(tenantCode) {
   try {
      logSystem(`Starting tenant database migration for: ${tenantCode}`);
      
      const tenantDB = await dbManager.getTenantDB(tenantCode);
      const queryInterface = tenantDB.getQueryInterface();
      
      // Run tenant migration
      const result = await tenantMigration.up(queryInterface, tenantDB.Sequelize);
      
      logSystem(`Tenant database migration completed for: ${tenantCode}`);
      return result;
      
   } catch (error) {
      logError(error, { context: 'migrateTenantDatabase', tenantCode });
      throw error;
   }
}

/**
 * Check if migrations have already been run
 */
async function checkMigrationStatus() {
   try {
      const systemDB = await dbManager.getSystemDB();
      
      // Check if the new tables exist
      const [tables] = await systemDB.query(`
         SELECT TABLE_NAME 
         FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME IN ('tenant_configurations', 'tenant_custom_fields', 'fee_configurations')
      `);
      
      return {
         systemMigrationNeeded: tables.length < 3,
         existingSystemTables: tables.map(row => row.TABLE_NAME)
      };
      
   } catch (error) {
      logError(error, { context: 'checkMigrationStatus' });
      return { systemMigrationNeeded: true, existingSystemTables: [] };
   }
}

/**
 * Get list of available tenants for migration
 */
async function getAvailableTenants() {
   try {
      const systemDB = await dbManager.getSystemDB();
      
      // Get all trusts from system database
      const [trusts] = await systemDB.query(`
         SELECT id, trust_name as name, trust_code as code 
         FROM trusts 
         WHERE status = 'ACTIVE'
         ORDER BY trust_name
      `);
      
      return trusts;
      
   } catch (error) {
      logError(error, { context: 'getAvailableTenants' });
      return [];
   }
}

/**
 * Run complete migration process
 */
async function runCompleteMigration() {
   const migrationResults = {
      systemMigration: null,
      tenantMigrations: [],
      errors: []
   };
   
   try {
      logSystem('🚀 Starting comprehensive database migration...');
      
      // Check migration status
      const status = await checkMigrationStatus();
      logSystem(`Migration status check: ${JSON.stringify(status, null, 2)}`);
      
      // Run system migration if needed
      if (status.systemMigrationNeeded) {
         logSystem('📊 Running system database migration...');
         migrationResults.systemMigration = await migrateSystemDatabase();
         logSystem('✅ System database migration completed');
      } else {
         logSystem('⏭️  System database migration already completed');
         migrationResults.systemMigration = { 
            success: true, 
            message: 'Already migrated',
            existing_tables: status.existingSystemTables
         };
      }
      
      // Get available tenants
      const tenants = await getAvailableTenants();
      logSystem(`Found ${tenants.length} tenants for migration: ${tenants.map(t => t.code).join(', ')}`);
      
      // Run tenant migrations
      if (tenants.length > 0) {
         logSystem('🏢 Running tenant database migrations...');
         
         for (const tenant of tenants) {
            try {
               logSystem(`Migrating tenant: ${tenant.name} (${tenant.code})`);
               const result = await migrateTenantDatabase(tenant.code);
               
               migrationResults.tenantMigrations.push({
                  tenantCode: tenant.code,
                  tenantName: tenant.name,
                  success: true,
                  result
               });
               
               logSystem(`✅ Tenant migration completed: ${tenant.code}`);
               
            } catch (error) {
               logError(error, { 
                  context: 'tenantMigration', 
                  tenantCode: tenant.code,
                  tenantName: tenant.name
               });
               
               migrationResults.errors.push({
                  tenantCode: tenant.code,
                  tenantName: tenant.name,
                  error: error.message,
                  stack: error.stack
               });
               
               migrationResults.tenantMigrations.push({
                  tenantCode: tenant.code,
                  tenantName: tenant.name,
                  success: false,
                  error: error.message
               });
            }
         }
      } else {
         logSystem('⚠️  No tenants found for migration');
      }
      
      // Generate summary
      const successfulMigrations = migrationResults.tenantMigrations.filter(t => t.success);
      const failedMigrations = migrationResults.tenantMigrations.filter(t => !t.success);
      
      logSystem('\n📈 Migration Summary:');
      logSystem(`✅ System migration: ${migrationResults.systemMigration?.success ? 'Success' : 'Failed'}`);
      logSystem(`✅ Successful tenant migrations: ${successfulMigrations.length}`);
      logSystem(`❌ Failed tenant migrations: ${failedMigrations.length}`);
      
      if (failedMigrations.length > 0) {
         logSystem('Failed migrations:');
         failedMigrations.forEach(fm => {
            logSystem(`  - ${fm.tenantName} (${fm.tenantCode}): ${fm.error}`);
         });
      }
      
      return migrationResults;
      
   } catch (error) {
      logError(error, { context: 'runCompleteMigration' });
      migrationResults.errors.push({
         context: 'general',
         error: error.message,
         stack: error.stack
      });
      throw error;
   }
}

/**
 * Rollback migrations (for testing/development)
 */
async function rollbackMigrations() {
   try {
      logSystem('🔄 Starting migration rollback...');
      
      // Get available tenants first
      const tenants = await getAvailableTenants();
      
      // Rollback tenant migrations
      for (const tenant of tenants) {
         try {
            logSystem(`Rolling back tenant: ${tenant.code}`);
            const tenantDB = await dbManager.getTenantDB(tenant.code);
            const queryInterface = tenantDB.getQueryInterface();
            await tenantMigration.down(queryInterface, tenantDB.Sequelize);
            logSystem(`✅ Tenant rollback completed: ${tenant.code}`);
         } catch (error) {
            logError(error, { context: 'tenantRollback', tenantCode: tenant.code });
         }
      }
      
      // Rollback system migration
      const systemDB = await dbManager.getSystemDB();
      const queryInterface = systemDB.getQueryInterface();
      await systemMigration.down(queryInterface, systemDB.Sequelize);
      
      logSystem('✅ Migration rollback completed');
      
   } catch (error) {
      logError(error, { context: 'rollbackMigrations' });
      throw error;
   }
}

// Export functions
module.exports = {
   migrateSystemDatabase,
   migrateTenantDatabase,
   runCompleteMigration,
   rollbackMigrations,
   checkMigrationStatus,
   getAvailableTenants
};

// Run migration if this file is executed directly
if (require.main === module) {
   const command = process.argv[2];
   
   if (command === 'rollback') {
      rollbackMigrations()
         .then(() => {
            console.log('\n✅ Migration rollback completed successfully!');
            process.exit(0);
         })
         .catch((error) => {
            console.error('\n❌ Migration rollback failed:', error.message);
            process.exit(1);
         });
   } else {
      runCompleteMigration()
         .then((results) => {
            console.log('\n✅ Database migration completed successfully!');
            console.log('\n📊 Final Results:');
            console.log(JSON.stringify(results, null, 2));
            
            // Close database connections
            dbManager.closeAllConnections().then(() => {
               process.exit(results.errors.length > 0 ? 1 : 0);
            });
         })
         .catch((error) => {
            console.error('\n❌ Database migration failed:', error.message);
            
            // Close database connections
            dbManager.closeAllConnections().then(() => {
               process.exit(1);
            });
         });
   }
}
