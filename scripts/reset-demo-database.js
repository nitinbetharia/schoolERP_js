/**
 * Database Reset Script - Fixes tenant database schema issues
 * This script will drop and recreate demo tenant database to fix role column issues
 */

const mysql = require('mysql2/promise');
const appConfig = require('../config/app-config.json');
require('dotenv').config();

async function resetDemoDatabase() {
   let connection;

   // Get database credentials from config (in outer scope for error handling)
   const host = appConfig.database.connection.host;
   const port = appConfig.database.connection.port;
   const user = process.env.DB_USER;
   const password = process.env.DB_PASSWORD;

   try {
      console.log('🔧 Connecting to MySQL server...');

      // Connect to MySQL server (not specific database)
      connection = await mysql.createConnection({
         host,
         port,
         user,
         password,
      });

      console.log('✅ Connected to MySQL server');

      // Drop demo database if it exists
      console.log('🗑️ Dropping demo database if it exists...');
      await connection.execute('DROP DATABASE IF EXISTS school_erp_demo');
      console.log('✅ Demo database dropped');

      // Create fresh demo database
      console.log('🏗️ Creating fresh demo database...');
      await connection.execute(`
            CREATE DATABASE school_erp_demo 
            CHARACTER SET utf8mb4 
            COLLATE utf8mb4_unicode_ci
        `);
      console.log('✅ Fresh demo database created');

      console.log('\n🎯 Database reset complete!');
      console.log('💡 Restart the server to initialize fresh schema');
   } catch (error) {
      console.error('❌ Database reset failed:', error.message);

      // If it's a user access issue, provide setup instructions
      if (error.message.includes('Access denied')) {
         console.log('\n📝 Please create the MySQL user first:');
         console.log('1. Connect to MySQL as root:');
         console.log('   mysql -u root -p');
         console.log('2. Create the user and grant permissions:');
         console.log(
            `   CREATE USER '${user}'@'localhost' IDENTIFIED BY '${password}';`,
         );
         console.log(
            `   GRANT ALL PRIVILEGES ON school_erp_*.* TO '${user}'@'localhost';`,
         );
         console.log('   FLUSH PRIVILEGES;');
         console.log('3. Run this script again');
      }
   } finally {
      if (connection) {
         await connection.end();
      }
   }
}

// Run the reset
resetDemoDatabase();
