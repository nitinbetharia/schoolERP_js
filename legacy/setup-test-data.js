/**
 * Create test trust and run tenant migration
 * This ensures we have at least one tenant to migrate
 */

const { dbManager } = require('../models/database');
const { logger, logSystem } = require('../utils/logger');

async function createTestTrustAndMigrate() {
   try {
      logSystem('Creating test trust for migration...');
      
      const systemDB = await dbManager.getSystemDB();
      
      // Check if test trust already exists
      const [existingTrusts] = await systemDB.query(`
         SELECT id, trust_name, trust_code 
         FROM trusts 
         WHERE trust_code = 'test_trust'
      `);
      
      if (existingTrusts.length === 0) {
         // Create test trust
         await systemDB.query(`
            INSERT INTO trusts (
               trust_name, 
               trust_code, 
               subdomain, 
               contact_email, 
               contact_phone, 
               address, 
               database_name,
               status,
               setup_completed_at,
               created_at,
               updated_at
            ) VALUES (
               'Test Educational Trust',
               'test_trust',
               'test-trust',
               'admin@test-trust.edu',
               '9999999999',
               '123 Test Street, Test Area, Test City, Test State - 123456',
               'school_erp_trust_test_trust',
               'ACTIVE',
               NOW(),
               NOW(),
               NOW()
            )
         `);
         logSystem('✅ Test trust created successfully');
      } else {
         logSystem('⏭️  Test trust already exists');
      }
      
      // Now run the migration for the test tenant
      const migrationScript = require('./migrate-enhanced-database');
      
      // Get available tenants (should include our test trust now)
      const tenants = await migrationScript.getAvailableTenants();
      logSystem(`Found ${tenants.length} tenants: ${tenants.map(t => t.code).join(', ')}`);
      
      // Run tenant migrations for all available tenants
      for (const tenant of tenants) {
         try {
            logSystem(`Running tenant migration for: ${tenant.name} (${tenant.code})`);
            const result = await migrationScript.migrateTenantDatabase(tenant.code);
            logSystem(`✅ Tenant migration completed for: ${tenant.code}`);
            console.log('Migration result:', JSON.stringify(result, null, 2));
         } catch (error) {
            logSystem(`❌ Tenant migration failed for: ${tenant.code} - ${error.message}`);
            console.error('Migration error:', error);
         }
      }
      
      return { success: true, tenants };
      
   } catch (error) {
      logger.error('Error in createTestTrustAndMigrate', {
         error: error.message,
         stack: error.stack
      });
      throw error;
   }
}

// Run if executed directly
if (require.main === module) {
   createTestTrustAndMigrate()
      .then((result) => {
         console.log('\n✅ Test trust creation and tenant migration completed!');
         console.log('Result:', JSON.stringify(result, null, 2));
         
         // Close database connections
         dbManager.closeAllConnections().then(() => {
            process.exit(0);
         });
      })
      .catch((error) => {
         console.error('\n❌ Failed:', error.message);
         
         // Close database connections
         dbManager.closeAllConnections().then(() => {
            process.exit(1);
         });
      });
}

module.exports = { createTestTrustAndMigrate };
