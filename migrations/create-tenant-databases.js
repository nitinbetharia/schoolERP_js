/**
 * Create Tenant Databases Script
 * Creates the actual MySQL databases for trusts before migration
 */

const { logSystem, logError } = require('../utils/logger');
const { dbManager } = require('../models/system/database');

/**
 * Create tenant databases for all active trusts
 */
async function createTenantDatabases() {
   try {
      logSystem('Starting tenant database creation process...');

      const systemDB = await dbManager.getSystemDB();

      // Get all active trusts
      const trusts = await systemDB.query(
         'SELECT id, trust_name, database_name, status FROM trusts WHERE status = "ACTIVE"',
         { type: systemDB.Sequelize.QueryTypes.SELECT }
      );

      if (trusts.length === 0) {
         logSystem('No active trusts found');
         return { success: true, created: 0, existing: 0 };
      }

      logSystem(`Found ${trusts.length} active trusts`);

      let created = 0;
      const existing = 0;
      const errors = [];

      for (const trust of trusts) {
         try {
            logSystem(`Creating database: ${trust.database_name}`);

            // Try to create the database
            await systemDB.query(
               `CREATE DATABASE IF NOT EXISTS \`${trust.database_name}\` 
                CHARACTER SET utf8mb4 
                COLLATE utf8mb4_unicode_ci`,
               { type: systemDB.Sequelize.QueryTypes.RAW }
            );

            // Check if database was created or already existed
            const [result] = await systemDB.query(`SHOW DATABASES LIKE '${trust.database_name}'`, {
               type: systemDB.Sequelize.QueryTypes.SELECT,
            });

            if (result) {
               logSystem(`✅ Database ready: ${trust.database_name}`);
               created++;
            } else {
               logError(`Failed to create database: ${trust.database_name}`);
               errors.push(`Failed to create ${trust.database_name}`);
            }
         } catch (error) {
            logError(error, {
               context: 'createTenantDatabase',
               trustId: trust.id,
               databaseName: trust.database_name,
            });
            errors.push(`${trust.database_name}: ${error.message}`);
         }
      }

      const result = {
         success: errors.length === 0,
         created,
         existing,
         errors,
         total: trusts.length,
      };

      logSystem(`Database creation completed. Created: ${created}, Total: ${trusts.length}, Errors: ${errors.length}`);

      if (errors.length > 0) {
         logError('Database creation errors:', errors);
      }

      return result;
   } catch (error) {
      logError(error, { context: 'createTenantDatabases' });
      throw error;
   }
}

/**
 * Main execution function
 */
async function main() {
   try {
      console.log('🚀 Creating tenant databases...\n');

      const result = await createTenantDatabases();

      console.log('\n📊 Database Creation Summary:');
      console.log(`✅ Total databases processed: ${result.total}`);
      console.log(`✅ Databases created: ${result.created}`);
      console.log(`✅ Success: ${result.success ? 'Yes' : 'No'}`);

      if (result.errors && result.errors.length > 0) {
         console.log(`❌ Errors: ${result.errors.length}`);
         result.errors.forEach((error) => console.log(`   - ${error}`));
      }

      console.log('\n✅ Tenant database creation completed!');

      // Close database connections
      await dbManager.closeAllConnections();

      process.exit(result.success ? 0 : 1);
   } catch (error) {
      console.error('\n❌ Database creation failed:', error.message);
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
   createTenantDatabases,
};
