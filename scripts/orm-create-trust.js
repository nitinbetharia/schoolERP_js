#!/usr/bin/env node

/**
 * ORM Create Trust Script
 * Creates a new trust using Sequelize ORM
 */

const readline = require('readline');
const TrustRepository = require('../repositories/TrustRepository');
const modelManager = require('../models/ModelManager');
const databaseManager = require('../config/database-orm');
const logger = require('../config/logger');

class ORMCreateTrust {
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
   * Validate trust code
   */
  validateTrustCode(code) {
    if (!code || code.length < 2 || code.length > 10) {
      return 'Trust code must be 2-10 characters long';
    }

    if (!/^[a-zA-Z0-9]+$/.test(code)) {
      return 'Trust code can only contain letters and numbers';
    }

    return null;
  }

  /**
   * Validate email
   */
  validateEmail(email) {
    if (!email) return null; // Email is optional

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Invalid email format';
    }

    return null;
  }

  /**
   * Get trust information from user
   */
  async getTrustInformation() {
    console.log('📝 Trust Information');
    console.log('===================\n');

    // Trust Code
    let trustCode;
    while (true) {
      trustCode = await this.question('Trust Code (2-10 characters, alphanumeric): ');
      const codeError = this.validateTrustCode(trustCode);
      if (codeError) {
        console.log(`❌ ${codeError}`);
        continue;
      }

      // Check if code already exists
      const existing = await this.trustRepository.findByCode(trustCode.toLowerCase());
      if (existing) {
        console.log('❌ Trust code already exists. Please choose a different code.');
        continue;
      }

      break;
    }

    // Trust Name
    let trustName;
    while (true) {
      trustName = await this.question('Trust/Organization Name: ');
      if (!trustName.trim()) {
        console.log('❌ Trust name is required');
        continue;
      }
      break;
    }

    // Optional fields
    const description = await this.question('Description (optional): ');
    const contactPerson = await this.question('Contact Person: ');

    // Email with validation
    let email;
    while (true) {
      email = await this.question('Email (optional): ');
      if (!email.trim()) {
        email = null;
        break;
      }

      const emailError = this.validateEmail(email);
      if (emailError) {
        console.log(`❌ ${emailError}`);
        continue;
      }
      break;
    }

    const phone = await this.question('Phone (optional): ');
    const address = await this.question('Address (optional): ');
    const city = await this.question('City (optional): ');
    const state = await this.question('State (optional): ');
    const pincode = await this.question('Pincode (optional): ');
    const website = await this.question('Website (optional): ');

    // Subscription details
    console.log('\n💼 Subscription Details');
    console.log('======================');

    const plans = ['basic', 'standard', 'premium', 'enterprise'];
    console.log('Available plans:', plans.join(', '));

    let subscriptionPlan;
    while (true) {
      subscriptionPlan = (await this.question('Subscription Plan [basic]: ')) || 'basic';
      if (!plans.includes(subscriptionPlan)) {
        console.log('❌ Invalid plan. Choose from:', plans.join(', '));
        continue;
      }
      break;
    }

    const maxStudents = parseInt((await this.question('Max Students [100]: ')) || '100');
    const maxStaff = parseInt((await this.question('Max Staff [20]: ')) || '20');

    return {
      trust_code: trustCode.toLowerCase(),
      trust_name: trustName.trim(),
      description: description.trim() || null,
      contact_person: contactPerson.trim() || null,
      email: email,
      phone: phone.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      pincode: pincode.trim() || null,
      website: website.trim() || null,
      subscription_plan: subscriptionPlan,
      max_students: maxStudents,
      max_staff: maxStaff
    };
  }

  /**
   * Create trust database
   */
  async createTrustDatabase(trustCode) {
    console.log(`\n🗄️  Creating database for trust: ${trustCode}`);

    try {
      // Test if we can connect to tenant database
      await databaseManager.getTenantConnection(trustCode);
      console.log('✅ Database connection established');

      // Create tables
      await modelManager.createTenantTables(trustCode);
      console.log('✅ Database tables created');

      return true;
    } catch (error) {
      console.error('❌ Database creation failed:', error.message);
      return false;
    }
  }

  /**
   * Create trust with confirmation
   */
  async createTrust() {
    try {
      // Get trust information
      const trustInfo = await this.getTrustInformation();

      // Show summary
      console.log('\n📋 Trust Summary');
      console.log('================');
      console.log(`Code: ${trustInfo.trust_code}`);
      console.log(`Name: ${trustInfo.trust_name}`);
      console.log(`Contact: ${trustInfo.contact_person || 'N/A'}`);
      console.log(`Email: ${trustInfo.email || 'N/A'}`);
      console.log(`Plan: ${trustInfo.subscription_plan}`);
      console.log(`Max Students: ${trustInfo.max_students}`);
      console.log(`Max Staff: ${trustInfo.max_staff}`);

      // Confirm creation
      const confirm = await this.question('\nCreate this trust? (y/N): ');
      if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
        console.log('❌ Trust creation cancelled');
        return;
      }

      // Create trust record
      console.log('\n🏢 Creating trust record...');
      const trust = await this.trustRepository.createTrust(trustInfo);
      console.log(`✅ Trust created: ${trust.trust_code}`);

      // Create database
      const dbCreated = await this.createTrustDatabase(trust.trust_code);

      if (dbCreated) {
        // Update status to active
        await this.trustRepository.updateDatabaseStatus(trust.trust_code, 'active');
        console.log('✅ Database status updated to active');

        console.log('\n🎉 Trust created successfully!');
        console.log('===============================');
        console.log(`Trust Code: ${trust.trust_code}`);
        console.log(`Trust Name: ${trust.trust_name}`);
        console.log(`Database: ${trust.database_name}`);
        console.log('\n💡 Next steps:');
        console.log(`1. Create admin user: npm run tenant:create -- --code=${trust.trust_code}`);
        console.log('2. Configure trust settings');
        console.log('3. Start using the system');
      } else {
        // Update status to error
        await this.trustRepository.updateDatabaseStatus(trust.trust_code, 'error');
        console.log('❌ Trust created but database setup failed');
        console.log('💡 You can retry database creation later');
      }
    } catch (error) {
      console.error('❌ Failed to create trust:', error.message);
      logger.error('Trust creation error:', error);
    }
  }

  /**
   * Main execution
   */
  async run() {
    const args = process.argv.slice(2);

    if (args.includes('--help')) {
      this.showHelp();
      return;
    }

    console.log('🏢 Create New Trust');
    console.log('==================\n');

    try {
      await this.createTrust();
    } catch (error) {
      console.error('Script error:', error.message);
      process.exit(1);
    } finally {
      this.rl.close();
      await databaseManager.closeAllConnections();
    }
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log('🏢 ORM Create Trust - Usage');
    console.log('===========================\n');
    console.log('node scripts/orm-create-trust.js\n');
    console.log('This script will guide you through creating a new trust/organization.');
    console.log('It will create both the trust record and the tenant database.\n');
    console.log('Examples:');
    console.log('  npm run trust:create');
    console.log('  node scripts/orm-create-trust.js');
  }
}

// Run if called directly
if (require.main === module) {
  const createTrust = new ORMCreateTrust();
  createTrust.run().catch(error => {
    console.error('Script error:', error);
    process.exit(1);
  });
}

module.exports = ORMCreateTrust;
