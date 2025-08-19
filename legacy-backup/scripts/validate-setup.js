/**
 * Setup Validation Script
 * Tests database connections and authentication with actual credentials
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function validateSetup() {
  console.log('🧪 Validating School ERP Setup');
  console.log('================================\n');

  let masterConnection;
  let trustConnection;
  
  try {
    // Test 1: Master Database Connection
    console.log('1️⃣  Testing Master Database Connection...');
    
    masterConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME
    });
    
    console.log('✅ Master database connection successful');

    // Test 2: Verify System Admin User
    console.log('\n2️⃣  Testing System Admin Authentication...');
    
    const [systemUsers] = await masterConnection.execute(
      'SELECT id, email, password_hash, role FROM system_users WHERE email = ?',
      ['admin@system.local']
    );
    
    if (systemUsers.length === 0) {
      throw new Error('System admin user not found');
    }
    
    const systemAdmin = systemUsers[0];
    const passwordValid = await bcrypt.compare('admin123', systemAdmin.password_hash);
    
    if (!passwordValid) {
      throw new Error('System admin password validation failed');
    }
    
    console.log('✅ System admin authentication validated');
    console.log(`   User ID: ${systemAdmin.id}, Role: ${systemAdmin.role}`);

    // Test 3: Verify Trust Configuration
    console.log('\n3️⃣  Testing Trust Configuration...');
    
    const [trusts] = await masterConnection.execute(
      'SELECT id, name, trust_code, database_name FROM trusts WHERE trust_code = ?',
      ['demo']
    );
    
    if (trusts.length === 0) {
      throw new Error('Demo trust not found');
    }
    
    const demoTrust = trusts[0];
    console.log('✅ Demo trust configuration validated');
    console.log(`   Trust: ${demoTrust.name} (${demoTrust.trust_code})`);
    console.log(`   Database: ${demoTrust.database_name}`);

    // Test 4: Trust Database Connection
    console.log('\n4️⃣  Testing Trust Database Connection...');
    
    trustConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: demoTrust.database_name
    });
    
    console.log('✅ Trust database connection successful');

    // Test 5: Verify Trust Users
    console.log('\n5️⃣  Testing Trust User Authentication...');
    
    const [trustUsers] = await trustConnection.execute(
      'SELECT id, email, first_name, last_name, role FROM users WHERE role = ?',
      ['SCHOOL_ADMIN']
    );
    
    if (trustUsers.length === 0) {
      throw new Error('No school admin users found in trust database');
    }
    
    console.log('✅ Trust users validated');
    trustUsers.forEach(user => {
      console.log(`   ${user.role}: ${user.first_name} ${user.last_name} (${user.email})`);
    });

    // Test 6: Verify School Data
    console.log('\n6️⃣  Testing School Data...');
    
    const [schools] = await trustConnection.execute(
      'SELECT id, school_name, school_code FROM schools'
    );
    
    if (schools.length === 0) {
      throw new Error('No schools found in trust database');
    }
    
    console.log('✅ School data validated');
    schools.forEach(school => {
      console.log(`   School: ${school.school_name} (${school.school_code})`);
    });

    // Test 7: Verify Academic Structure
    console.log('\n7️⃣  Testing Academic Structure...');
    
    const [classes] = await trustConnection.execute(
      'SELECT COUNT(*) as class_count FROM classes'
    );
    
    const [academicYears] = await trustConnection.execute(
      'SELECT COUNT(*) as year_count FROM academic_years'
    );
    
    console.log('✅ Academic structure validated');
    console.log(`   Classes: ${classes[0].class_count}`);
    console.log(`   Academic Years: ${academicYears[0].year_count}`);

    // Test 8: Database Constraints
    console.log('\n8️⃣  Testing Database Constraints...');
    
    try {
      // Test unique constraint
      await trustConnection.execute(
        'INSERT INTO users (email, password_hash, first_name, last_name, role, trust_id) VALUES (?, ?, ?, ?, ?, ?)',
        ['admin@demo.school', 'test', 'Test', 'User', 'SCHOOL_ADMIN', 1]
      );
      throw new Error('Unique constraint not working - duplicate email allowed');
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log('✅ Database constraints working (unique email enforced)');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 All Validation Tests Passed!');
    console.log('\n📋 Summary:');
    console.log('✅ Master database connection working');
    console.log('✅ System admin authentication working');
    console.log('✅ Trust database structure valid');
    console.log('✅ Demo trust and schools configured');
    console.log('✅ User authentication system ready');
    console.log('✅ Database constraints enforced');
    
    console.log('\n🚀 Your School ERP is ready for use!');
    console.log('\n🔑 Test with these credentials:');
    console.log('System Admin: admin@system.local / admin123');
    console.log('School Admin: admin@demo.school / password123');
    
    return true;

  } catch (error) {
    console.error('\n❌ Validation Failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Troubleshooting:');
      console.error('1. Make sure MySQL server is running');
      console.error('2. Check your database credentials in .env file');
      console.error('3. Verify MySQL is accepting connections on the specified port');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Troubleshooting:');
      console.error('1. Check your MySQL username and password in .env file');
      console.error('2. Make sure the MySQL user has proper permissions');
      console.error('3. Try connecting to MySQL manually to verify credentials');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 Troubleshooting:');
      console.error('1. Run the database setup script: npm run setup');
      console.error('2. Make sure the database was created successfully');
    }
    
    return false;
    
  } finally {
    if (masterConnection) {
      await masterConnection.end();
    }
    if (trustConnection) {
      await trustConnection.end();
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  validateSetup()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Validation runner failed:', error);
      process.exit(1);
    });
}

module.exports = { validateSetup };