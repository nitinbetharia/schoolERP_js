/**
 * Database Structure Checker
 * Checks the actual structure of the system_users table
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const appConfig = require('../config/app-config');

async function checkDatabaseStructure() {
  let connection = null;

  try {
    console.log('🔍 Checking database structure...\n');

    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: appConfig.database.master.name,
      charset: appConfig.database.master.charset
    });
    
    console.log('✅ Connected to master database');

    // Check if table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'system_users'"
    );

    if (tables.length === 0) {
      console.log('❌ system_users table does not exist');
      return;
    }

    console.log('✅ system_users table exists');

    // Show table structure
    const [columns] = await connection.execute(
      "DESCRIBE system_users"
    );

    console.log('\n📋 Table structure:');
    columns.forEach(col => {
      console.log(`   ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`);
    });

    // Check existing users
    const [users] = await connection.execute(
      'SELECT * FROM system_users LIMIT 5'
    );

    console.log(`\n👥 Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`   ID: ${user.id} | Email: ${user.email || 'N/A'} | Role: ${user.role || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Failed to check database:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

// CLI execution
if (require.main === module) {
  checkDatabaseStructure()
    .then(() => {
      console.log('\n🎉 Database structure check completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Database check failed:', error.message);
      process.exit(1);
    });
}

module.exports = checkDatabaseStructure;