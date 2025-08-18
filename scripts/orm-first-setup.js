#!/usr/bin/env node

/**
 * ORM-based First Time Setup Script
 * Complete setup for multi-tenant school ERP system using Sequelize ORM
 */

const path = require('path');
const fs = require('fs').promises;
const readline = require('readline');
const modelManager = require('../models/ModelManager');
const TrustRepository = require('../repositories/TrustRepository');
const databaseManager = require('../config/database-orm');
const logger = require('../config/logger');

class ORMSetup {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.trustRepository = new TrustRepository();
  }

  /**
   * Ask question and get user input
   */
  question(prompt) {
    return new Promise(resolve => {
      this.rl.question(prompt, resolve);
    });
  }

  /**
   * Initialize system database
   */
  async initializeSystemDatabase() {
    console.log('\n📋 Initializing System Database...');

    try {
      // Test system connection
      await databaseManager.getSystemConnection();
      console.log('✅ System database connection: OK');

      // Create system tables
      await modelManager.createSystemTables();
      console.log('✅ System database tables created successfully');

      return true;
    } catch (error) {
      console.error('❌ System database initialization failed:', error.message);
      return false;
    }
  }

  /**
   * Create trust/organization
   */
  async createTrust() {
    console.log('\n🏢 Setting up Trust/Organization...');

    const trustCode = await this.question('Enter trust code (2-10 characters, alphanumeric): ');
    if (!/^[a-zA-Z0-9]{2,10}$/.test(trustCode)) {
      console.error('❌ Invalid trust code format');
      return null;
    }

    // Check if trust code already exists
    const existingTrust = await this.trustRepository.findByCode(trustCode.toLowerCase());
    if (existingTrust) {
      console.error('❌ Trust code already exists');
      return null;
    }

    const trustName = await this.question('Enter trust/organization name: ');
    if (!trustName.trim()) {
      console.error('❌ Trust name is required');
      return null;
    }

    const contactPerson = await this.question('Enter contact person name: ');
    const email = await this.question('Enter contact email: ');
    const phone = await this.question('Enter contact phone: ');

    try {
      const trust = await this.trustRepository.createTrust({
        trust_code: trustCode.toLowerCase(),
        trust_name: trustName.trim(),
        contact_person: contactPerson.trim(),
        email: email.trim(),
        phone: phone.trim(),
        subscription_plan: 'basic',
        max_students: 100,
        max_staff: 20
      });

      console.log(`✅ Trust created successfully: ${trust.trust_code}`);
      return trust;
    } catch (error) {
      console.error('❌ Failed to create trust:', error.message);
      return null;
    }
  }

  /**
   * Initialize tenant database
   */
  async initializeTenantDatabase(trustCode) {
    console.log(`\n📋 Initializing Tenant Database for: ${trustCode}`);

    try {
      // Test tenant connection
      await databaseManager.getTenantConnection(trustCode);
      console.log('✅ Tenant database connection: OK');

      // Create tenant tables
      await modelManager.createTenantTables(trustCode);
      console.log('✅ Tenant database tables created successfully');

      // Update trust status
      await this.trustRepository.updateDatabaseStatus(trustCode, 'active');
      console.log('✅ Trust database status updated to active');

      return true;
    } catch (error) {
      console.error('❌ Tenant database initialization failed:', error.message);
      await this.trustRepository.updateDatabaseStatus(trustCode, 'error');
      return false;
    }
  }

  /**
   * Create admin user for tenant
   */
  async createAdminUser(trustCode) {
    console.log('\n👤 Creating Admin User...');

    try {
      const UserModel = await modelManager.getUserModel(trustCode);

      const username = await this.question('Enter admin username: ');
      if (!/^[a-zA-Z0-9_]{3,50}$/.test(username)) {
        console.error('❌ Invalid username format (3-50 alphanumeric characters)');
        return null;
      }

      const email = await this.question('Enter admin email: ');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        console.error('❌ Invalid email format');
        return null;
      }

      const firstName = await this.question('Enter first name: ');
      const lastName = await this.question('Enter last name: ');

      let password = await this.question('Enter admin password (min 8 characters): ');
      if (password.length < 8) {
        console.error('❌ Password must be at least 8 characters');
        return null;
      }

      const admin = await UserModel.create({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password_hash: password, // Will be hashed by the model hook
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role: 'super_admin',
        email_verified: true,
        permissions: ['*'] // All permissions
      });

      console.log(`✅ Admin user created successfully: ${admin.username}`);
      return admin;
    } catch (error) {
      console.error('❌ Failed to create admin user:', error.message);
      return null;
    }
  }

  /**
   * Test the complete setup
   */
  async testSetup(trustCode) {
    console.log('\n🧪 Testing Setup...');

    try {
      // Test database connections
      const connectionTests = await databaseManager.testConnections();

      if (!connectionTests.system) {
        console.error('❌ System database connection failed');
        return false;
      }

      // Test trust retrieval
      const trust = await this.trustRepository.findByCode(trustCode);
      if (!trust) {
        console.error('❌ Trust not found in system database');
        return false;
      }

      // Test tenant database
      const UserModel = await modelManager.getUserModel(trustCode);
      const userCount = await UserModel.count();

      console.log('✅ All tests passed!');
      console.log(`✅ Trust: ${trust.trust_name}`);
      console.log(`✅ Database: ${trust.database_name}`);
      console.log(`✅ Users: ${userCount}`);

      return true;
    } catch (error) {
      console.error('❌ Setup test failed:', error.message);
      return false;
    }
  }

  /**
   * Main setup process
   */
  async run() {
    console.log('🚀 School ERP - ORM-based First Time Setup');
    console.log('==========================================\n');

    try {
      // Step 1: Initialize System Database
      const systemInit = await this.initializeSystemDatabase();
      if (!systemInit) {
        throw new Error('System database initialization failed');
      }

      // Step 2: Create Trust
      const trust = await this.createTrust();
      if (!trust) {
        throw new Error('Trust creation failed');
      }

      // Step 3: Initialize Tenant Database
      const tenantInit = await this.initializeTenantDatabase(trust.trust_code);
      if (!tenantInit) {
        throw new Error('Tenant database initialization failed');
      }

      // Step 4: Create Admin User
      const admin = await this.createAdminUser(trust.trust_code);
      if (!admin) {
        throw new Error('Admin user creation failed');
      }

      // Step 5: Test Setup
      const testResult = await this.testSetup(trust.trust_code);
      if (!testResult) {
        throw new Error('Setup verification failed');
      }

      console.log('\n🎉 Setup completed successfully!');
      console.log('================================');
      console.log(`📝 Trust Code: ${trust.trust_code}`);
      console.log(`🏢 Trust Name: ${trust.trust_name}`);
      console.log(`📧 Admin Email: ${admin.email}`);
      console.log(`👤 Admin Username: ${admin.username}`);
      console.log(`🗄️  Database: ${trust.database_name}`);
      console.log('\n🚀 You can now start the server with: npm start');
    } catch (error) {
      console.error('\n💥 Setup failed:', error.message);
      process.exit(1);
    } finally {
      this.rl.close();
      await databaseManager.closeAllConnections();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const setup = new ORMSetup();
  setup.run().catch(error => {
    console.error('Setup error:', error);
    process.exit(1);
  });
}

module.exports = ORMSetup;
