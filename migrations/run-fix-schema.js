/**
 * Standalone runner for schema fix migration
 */

const { Sequelize } = require('sequelize');
const config = require('../config/app-config.json');
const { logger } = require('../utils/logger');
require('dotenv').config();

// Import the migration
const migration004 = require('./004-fix-schema-inconsistencies');

async function runSchemaMigration() {
   try {
      logger.info('Starting schema fix migration runner');

      // Connect to system database first
      const systemDBConfig = {
         host: config.database.connection.host,
         port: config.database.connection.port,
         database: config.database.system.name,
         username: process.env.DB_USER,
         password: process.env.DB_PASSWORD,
         dialect: 'mysql',
         timezone: config.database.connection.timezone,
         logging: false,
      };
      const systemDB = new Sequelize(systemDBConfig);
      logger.info('Connected to system database');

      // Get list of tenants
      const [tenants] = await systemDB.query(
         'SELECT trust_code as tenant_code, trust_name as tenant_name FROM trusts WHERE status = 1'
      );
      logger.info(`Found ${tenants.length} active tenants`);

      const results = {
         system: null,
         tenants: [],
         errors: [],
      };

      // Run system database migration
      try {
         logger.info('Running schema fixes on system database...');
         await migration004.up(systemDB.getQueryInterface(), Sequelize);
         results.system = { success: true, message: 'System database updated successfully' };
         logger.info('System database schema fixes completed');
      } catch (error) {
         logger.error('System database migration failed:', error);
         results.system = { success: false, error: error.message };
         results.errors.push({ database: 'system', error: error.message });
      }

      // Run tenant database migrations
      for (const tenant of tenants) {
         const tenantDBName = `${config.database.tenant.prefix}${tenant.tenant_code}`;

         try {
            logger.info(`Processing tenant database: ${tenantDBName}`);

            const tenantConfig = {
               host: config.database.connection.host,
               port: config.database.connection.port,
               database: tenantDBName,
               username: process.env.DB_USER,
               password: process.env.DB_PASSWORD,
               dialect: 'mysql',
               timezone: config.database.connection.timezone,
               logging: false,
            };

            const tenantDB = new Sequelize(tenantConfig);
            await tenantDB.authenticate();

            await migration004.up(tenantDB.getQueryInterface(), Sequelize);

            results.tenants.push({
               tenantCode: tenant.tenant_code,
               tenantName: tenant.tenant_name,
               success: true,
               message: 'Schema fixes applied successfully',
            });

            await tenantDB.close();
            logger.info(`Completed tenant: ${tenant.tenant_code}`);
         } catch (error) {
            logger.error(`Failed to process tenant ${tenant.tenant_code}:`, error);
            results.tenants.push({
               tenantCode: tenant.tenant_code,
               tenantName: tenant.tenant_name,
               success: false,
               error: error.message,
            });
            results.errors.push({
               database: tenantDBName,
               tenant: tenant.tenant_code,
               error: error.message,
            });
         }
      }

      await systemDB.close();

      // Report results
      console.log('\n=== SCHEMA FIX MIGRATION RESULTS ===');
      console.log(`System Database: ${results.system?.success ? 'SUCCESS' : 'FAILED'}`);
      console.log(`Tenants Processed: ${results.tenants.length}`);
      console.log(`Successful: ${results.tenants.filter((t) => t.success).length}`);
      console.log(`Failed: ${results.tenants.filter((t) => !t.success).length}`);

      if (results.errors.length > 0) {
         console.log('\n=== ERRORS ===');
         results.errors.forEach((error) => {
            console.log(`${error.database}: ${error.error}`);
         });
      }

      // Write detailed results to file
      const fs = require('fs');
      fs.writeFileSync('schema-fix-results.json', JSON.stringify(results, null, 2));

      console.log('\nDetailed results written to: schema-fix-results.json');
   } catch (error) {
      logger.error('Schema migration runner failed:', error);
      console.error('Migration failed:', error.message);
      process.exit(1);
   }
}

// Run the migration if this file is executed directly
if (require.main === module) {
   runSchemaMigration()
      .then(() => {
         console.log('Schema fix migration completed');
         process.exit(0);
      })
      .catch((error) => {
         console.error('Schema fix migration failed:', error);
         process.exit(1);
      });
}

module.exports = { runSchemaMigration };
