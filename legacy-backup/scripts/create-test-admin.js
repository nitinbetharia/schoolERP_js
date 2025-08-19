/**
 * Simple script to create a test admin user
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createTestAdmin() {
  let connection;
  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'school_erp_system'
    });

    console.log('✅ Connected to database');

    // Check existing table structure
    const [tableInfo] = await connection.execute('DESCRIBE system_users');
    console.log('📋 Table structure:', tableInfo.map(col => col.Field).join(', '));

    // Hash password
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);

    // Try to insert admin user (adapt to existing table structure)
    try {
      await connection.execute(
        `
        INSERT INTO system_users (username, email, password_hash, first_name, last_name, role)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        ['admin', 'admin@school.com', hashedPassword, 'System', 'Admin', 'SYSTEM_ADMIN']
      );

      console.log('✅ Admin user created successfully');
      console.log('📝 Login credentials:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    } catch (insertError) {
      if (insertError.code === 'ER_DUP_ENTRY') {
        console.log('ℹ️  Admin user already exists');

        // Update existing admin password
        await connection.execute(
          `
          UPDATE system_users 
          SET password_hash = ? 
          WHERE username = 'admin'
        `,
          [hashedPassword]
        );

        console.log('✅ Admin password updated');
        console.log('📝 Login credentials:');
        console.log('   Username: admin');
        console.log('   Password: admin123');
      } else {
        throw insertError;
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

createTestAdmin();
