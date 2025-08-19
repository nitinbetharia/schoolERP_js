/**
 * Reset passwords with proper bcrypt hashes
 */

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();
const config = require('../config');

async function resetPasswords() {
  let connection;
  
  try {
    // Connect to database
    const dbConfig = config.getDatabase();
    connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.name
    });

    console.log('🔗 Connected to database');

    // Generate proper hashes using config
    const securityConfig = config.getSecurity();
    const adminHash = await bcrypt.hash('admin123', securityConfig.bcryptRounds);
    const userHash = await bcrypt.hash('password123', securityConfig.bcryptRounds);

    console.log('🔐 Generated password hashes:');
    console.log('admin123 ->', adminHash);
    console.log('password123 ->', userHash);

    // Update system user
    const [systemResult] = await connection.execute(
      'UPDATE system_users SET password_hash = ?, login_attempts = 0, locked_until = NULL WHERE email = ?',
      [adminHash, 'admin@system.local']
    );

    console.log('✅ Updated system user:', systemResult.affectedRows, 'rows');

    // Update trust user
    const [trustResult] = await connection.execute(
      'UPDATE users SET password_hash = ?, login_attempts = 0, locked_until = NULL WHERE email = ?',
      [userHash, 'admin@demo.school']
    );

    console.log('✅ Updated trust user:', trustResult.affectedRows, 'rows');

    // Verify the updates
    const [systemCheck] = await connection.execute(
      'SELECT email, LENGTH(password_hash) as hash_length, login_attempts FROM system_users WHERE email = ?',
      ['admin@system.local']
    );

    const [trustCheck] = await connection.execute(
      'SELECT email, LENGTH(password_hash) as hash_length, login_attempts FROM users WHERE email = ?',
      ['admin@demo.school']
    );

    console.log('\n📊 Verification:');
    console.log('System user:', systemCheck[0]);
    console.log('Trust user:', trustCheck[0]);

    console.log('\n🎉 Password reset completed successfully!');
    console.log('\nTest credentials:');
    console.log('System Admin: admin@system.local / admin123');
    console.log('Trust Admin: admin@demo.school / password123');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

resetPasswords();