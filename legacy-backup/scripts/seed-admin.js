/**
 * Database Seeding Script - System Admin User
 * Creates the initial system admin user for the School ERP system
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const appConfig = require('../config/app-config');
const logger = require('../config/logger');

class AdminSeeder {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      this.connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: appConfig.database.system.name,
        charset: appConfig.database.system.charset
      });

      console.log('✅ Connected to master database');
      logger.info('Connected to master database for seeding');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      logger.error('Database connection failed for seeding:', error);
      throw error;
    }
  }

  async createSystemUsersTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS system_users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role ENUM('SYSTEM_ADMIN', 'SUPPORT_ADMIN') DEFAULT 'SYSTEM_ADMIN',
        status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
        failed_login_attempts INT DEFAULT 0,
        locked_until DATETIME NULL,
        last_login DATETIME NULL,
        password_reset_token VARCHAR(255) NULL,
        password_reset_expires DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_email (email),
        INDEX idx_username (username),
        INDEX idx_status (status),
        INDEX idx_reset_token (password_reset_token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    try {
      await this.connection.execute(createTableSQL);
      console.log('✅ System users table created/verified');
      logger.info('System users table created/verified');
    } catch (error) {
      console.error('❌ Failed to create system users table:', error.message);
      logger.error('Failed to create system users table:', error);
      throw error;
    }
  }

  async createSystemSessionsTable() {
    const createSessionsTableSQL = `
      CREATE TABLE IF NOT EXISTS system_sessions (
        session_id VARCHAR(128) PRIMARY KEY,
        user_id INT NOT NULL,
        user_type ENUM('system', 'trust') NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        data JSON,
        expires INT UNSIGNED NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_user_id (user_id),
        INDEX idx_expires (expires),
        INDEX idx_user_type (user_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    try {
      await this.connection.execute(createSessionsTableSQL);
      console.log('✅ System sessions table created/verified');
      logger.info('System sessions table created/verified');
    } catch (error) {
      console.error('❌ Failed to create system sessions table:', error.message);
      logger.error('Failed to create system sessions table:', error);
      throw error;
    }
  }

  async seedSystemAdmin(email, password, firstName = 'Nitin', lastName = 'Admin') {
    try {
      // Check if admin already exists
      const [existingUsers] = await this.connection.execute(
        'SELECT id, email FROM system_users WHERE email = ?',
        [email]
      );

      if (existingUsers.length > 0) {
        console.log(`⚠️  System admin with email ${email} already exists`);
        logger.warn(`System admin with email ${email} already exists`);
        return existingUsers[0];
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, appConfig.security.bcryptRounds);

      // Generate username from email
      const username = email.split('@')[0];

      // Insert admin user
      const insertSQL = `
        INSERT INTO system_users (
          username, email, password_hash, first_name, last_name, role, status
        ) VALUES (?, ?, ?, ?, ?, 'SYSTEM_ADMIN', 'ACTIVE')
      `;

      const [result] = await this.connection.execute(insertSQL, [
        username,
        email,
        passwordHash,
        firstName,
        lastName
      ]);

      console.log('✅ System admin user created successfully');
      console.log(`   📧 Email: ${email}`);
      console.log(`   🔑 Password: ${password}`);
      console.log(`   👤 Name: ${firstName} ${lastName}`);
      console.log(`   🆔 User ID: ${result.insertId}`);

      logger.info('System admin user created successfully', {
        userId: result.insertId,
        email,
        username,
        firstName,
        lastName
      });

      return {
        id: result.insertId,
        email,
        username,
        firstName,
        lastName
      };
    } catch (error) {
      console.error('❌ Failed to seed system admin:', error.message);
      logger.error('Failed to seed system admin:', error);
      throw error;
    }
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
      console.log('✅ Database connection closed');
      logger.info('Database connection closed after seeding');
    }
  }

  async run(email, password, firstName, lastName) {
    try {
      console.log('🌱 Starting database seeding for system admin...\n');
      logger.info('Starting database seeding for system admin');

      await this.connect();
      await this.createSystemUsersTable();
      await this.createSystemSessionsTable();
      const admin = await this.seedSystemAdmin(email, password, firstName, lastName);

      console.log('\n🎉 Database seeding completed successfully!');
      logger.info('Database seeding completed successfully');

      return admin;
    } catch (error) {
      console.error('\n💥 Database seeding failed:', error.message);
      logger.error('Database seeding failed:', error);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// CLI execution
if (require.main === module) {
  const email = process.argv[2] || 'nitin@gmail.com';
  const password = process.argv[3] || 'nitin@123';
  const firstName = process.argv[4] || 'Nitin';
  const lastName = process.argv[5] || 'Admin';

  const seeder = new AdminSeeder();
  seeder
    .run(email, password, firstName, lastName)
    .then(() => {
      console.log('\n✨ Ready to login with the seeded admin credentials!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Seeding failed:', error.message);
      process.exit(1);
    });
}

module.exports = AdminSeeder;
