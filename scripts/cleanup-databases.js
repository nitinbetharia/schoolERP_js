/**
 * Database Cleanup Script
 * Removes all trusts except demo and their respective databases
 */

const { Sequelize } = require('sequelize');
const config = require('../config/app-config.json');
const { logger } = require('../utils/logger');
require('dotenv').config();

async function cleanupDatabases() {
   try {
      logger.info('Starting database cleanup process');

      // Connect to system database
      const systemDB = new Sequelize({
         host: config.database.connection.host,
         port: config.database.connection.port,
         database: config.database.system.name,
         username: process.env.DB_USER,
         password: process.env.DB_PASSWORD,
         dialect: 'mysql',
         logging: false,
      });

      await systemDB.authenticate();
      logger.info('Connected to system database');

      // Connect to MySQL root to drop databases
      const rootDB = new Sequelize({
         host: config.database.connection.host,
         port: config.database.connection.port,
         username: process.env.DB_USER,
         password: process.env.DB_PASSWORD,
         dialect: 'mysql',
         logging: false,
      });

      await rootDB.authenticate();
      logger.info('Connected to MySQL server');

      // Get all trusts except demo
      const [trustsToDelete] = await systemDB.query(
         'SELECT trust_code, trust_name FROM trusts WHERE trust_code != "demo"'
      );

      console.log(`Found ${trustsToDelete.length} trusts to delete (excluding demo)`);

      // Delete tenant databases first
      for (const trust of trustsToDelete) {
         const dbName = `school_erp_trust_${trust.trust_code}`;

         try {
            // Check if database exists
            const [databases] = await rootDB.query(`SHOW DATABASES LIKE '${dbName}'`);
            if (databases.length > 0) {
               await rootDB.query(`DROP DATABASE \`${dbName}\``);
               logger.info(`Dropped database: ${dbName}`);
               console.log(`✅ Deleted database: ${dbName}`);
            } else {
               console.log(`⚠️  Database not found: ${dbName}`);
            }
         } catch (error) {
            logger.error(`Failed to drop database ${dbName}:`, error);
            console.log(`❌ Failed to delete database: ${dbName} - ${error.message}`);
         }
      }

      // Delete trusts from system database
      if (trustsToDelete.length > 0) {
         const trustCodes = trustsToDelete.map((t) => `'${t.trust_code}'`).join(',');
         const [result] = await systemDB.query(`DELETE FROM trusts WHERE trust_code IN (${trustCodes})`);
         logger.info(`Deleted ${result.affectedRows} trusts from system database`);
         console.log(`✅ Deleted ${result.affectedRows} trusts from system database`);
      }

      // Verify remaining trusts
      const [remainingTrusts] = await systemDB.query('SELECT trust_code, trust_name FROM trusts');
      console.log('\n=== REMAINING TRUSTS ===');
      remainingTrusts.forEach((trust) => {
         console.log(`- ${trust.trust_code}: ${trust.trust_name}`);
      });

      // Verify remaining tenant databases
      const [allDatabases] = await rootDB.query('SHOW DATABASES');
      const remainingTenantDBs = allDatabases.filter((db) => db.Database.startsWith('school_erp_trust_'));

      console.log('\n=== REMAINING TENANT DATABASES ===');
      remainingTenantDBs.forEach((db) => {
         console.log(`- ${db.Database}`);
      });

      await systemDB.close();
      await rootDB.close();

      console.log('\n🎉 Database cleanup completed successfully!');
   } catch (error) {
      logger.error('Database cleanup failed:', error);
      console.error('Cleanup failed:', error.message);
      process.exit(1);
   }
}

// Run the cleanup if this file is executed directly
if (require.main === module) {
   cleanupDatabases()
      .then(() => {
         console.log('Database cleanup completed successfully');
         process.exit(0);
      })
      .catch((error) => {
         console.error('Database cleanup failed:', error);
         process.exit(1);
      });
}

module.exports = { cleanupDatabases };
