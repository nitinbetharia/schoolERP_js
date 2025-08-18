/**
 * Update Admin Password Script
 * Updates the password for an existing system admin user
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const appConfig = require('../config/app-config');
const logger = require('../config/logger');

async function updateAdminPassword(email, newPassword) {
  let connection = null;

  try {
    console.log('🔑 Updating admin password...\n');
    logger.info('Starting admin password update');

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

    // Check if user exists
    const [users] = await connection.execute(
      'SELECT id, email, full_name, role, is_active FROM system_users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.log(`❌ No user found with email: ${email}`);
      return false;
    }

    const user = users[0];
    console.log(`📋 Found user:`);
    console.log(`   🆔 ID: ${user.id}`);
    console.log(`   👤 Name: ${user.full_name}`);
    console.log(`   📧 Email: ${user.email}`);
    console.log(`   🏷️  Role: ${user.role}`);
    console.log(`   📊 Status: ${user.is_active ? 'ACTIVE' : 'INACTIVE'}`);

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, appConfig.security.bcryptRounds);

    // Update password
    const updateSQL = `
      UPDATE system_users 
      SET password_hash = ?, 
          updated_at = CURRENT_TIMESTAMP
      WHERE email = ?
    `;

    await connection.execute(updateSQL, [passwordHash, email]);

    console.log(`\n✅ Password updated successfully for ${email}`);
    console.log(`🔑 New password: ${newPassword}`);
    
    logger.info('Admin password updated successfully', {
      userId: user.id,
      email: user.email,
      fullName: user.full_name
    });

    return true;

  } catch (error) {
    console.error('❌ Failed to update password:', error.message);
    logger.error('Failed to update admin password:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

// CLI execution
if (require.main === module) {
  const email = process.argv[2] || 'nitin@gmail.com';
  const password = process.argv[3] || 'nitin@123';

  updateAdminPassword(email, password)
    .then((success) => {
      if (success) {
        console.log('\n🎉 Admin password update completed!');
        console.log('✨ You can now login with the updated credentials');
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Password update failed:', error.message);
      process.exit(1);
    });
}

module.exports = updateAdminPassword;