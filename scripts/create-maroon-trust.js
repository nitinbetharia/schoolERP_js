#!/usr/bin/env node
/**
 * Create New Trust with Trust Admin User
 * Creates a new trust called "Maroon Education Trust" with tadmin/tadmin123 credentials
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { logSystem, logError } = require('../utils/logger');

async function createMaroonTrust() {
   try {
      console.log('🏫 Creating Maroon Education Trust...');

      // Initialize database
      const { dbManager, initializeSystemModels } = require('../models/system/database');
      await initializeSystemModels();

      const systemDB = await dbManager.getSystemDB();

      // Step 1: Create the trust in system database
      console.log('📝 Step 1: Creating trust record...');

      // Initialize system models to get Trust model
      const systemModels = await initializeSystemModels();
      const { Trust } = systemModels;

      const trustData = {
         trust_name: 'Maroon Education Trust',
         trust_code: 'maroon',
         subdomain: 'maroon',
         contact_email: 'tadmin@maroon.school',
         contact_phone: '9876543210',
         address: 'Maroon Trust Campus, Education District, Learning City - 654321',
         database_name: 'school_erp_trust_maroon',
         status: 'ACTIVE',
         tenant_config: {
            theme: {
               primaryColor: '#800000', // Maroon
               secondaryColor: '#8B0000', // Dark Red
               accentColor: '#A0522D', // Sienna
               brandGradient: 'linear-gradient(135deg, #800000 0%, #8B0000 100%)',
            },
            features: {
               fee_management: true,
               attendance: true,
               academic_reports: true,
               parent_portal: true,
            },
         },
         setup_completed_at: new Date(),
      };

      // Check if trust already exists
      const existingTrust = await Trust.findOne({
         where: { trust_code: 'maroon' },
      });

      if (existingTrust) {
         console.log('⏭️  Maroon trust already exists');
         console.log(`   Trust ID: ${existingTrust.id}`);
         console.log(`   Name: ${existingTrust.trust_name}`);
         console.log(`   Code: ${existingTrust.trust_code}`);

         // Check if trust admin already exists
         await checkAndCreateTrustAdmin(existingTrust.id);
         return;
      }

      // Create trust using Sequelize model
      const maroonTrust = await Trust.create(trustData);
      console.log('✅ Trust created successfully!');
      console.log(`   Trust ID: ${maroonTrust.id}`);
      console.log(`   Name: ${maroonTrust.trust_name}`);
      console.log(`   Code: ${maroonTrust.trust_code}`);

      // Step 2: Create tenant database
      console.log('🗄️  Step 2: Creating tenant database...');

      try {
         await systemDB.query(`CREATE DATABASE IF NOT EXISTS \`${trustData.database_name}\` 
            CHARACTER SET utf8mb4 
            COLLATE utf8mb4_unicode_ci`);
         console.log(`✅ Database created: ${trustData.database_name}`);
      } catch (error) {
         console.log(`⚠️  Database may already exist: ${trustData.database_name}`);
      }

      // Step 3: Initialize tenant models and create tables
      console.log('📋 Step 3: Initializing tenant models and tables...');

      try {
         // Just get tenant models - this will create tables if they don't exist
         await dbManager.getTenantModels('maroon');
         console.log('✅ Tenant models initialized and tables created');
      } catch (modelError) {
         console.log('⚠️  Tenant models initialization had issues:', modelError.message);
         console.log('   This is expected for a new tenant database.');
      }

      // Step 4: Create trust admin user in tenant database
      await createTrustAdminUser();
   } catch (error) {
      logError(error, { context: 'create-maroon-trust' });
      console.error('❌ Failed to create maroon trust:', error.message);
      throw error;
   } finally {
      // Close database connections
      try {
         const { dbManager } = require('../models/system/database');
         await dbManager.closeAllConnections();
         console.log('🔌 Database connections closed');
      } catch (closeError) {
         console.error('Warning: Failed to close database connections:', closeError.message);
      }
   }
}

async function checkAndCreateTrustAdmin(_trustId) {
   console.log('👤 Checking for existing trust admin...');

   try {
      const { dbManager } = require('../models/system/database');

      // Get tenant models for maroon trust
      const tenantModels = await dbManager.getTenantModels('maroon');
      const { User } = tenantModels;

      // Check if trust admin already exists
      const existingAdmin = await User.findOne({
         where: {
            email: 'tadmin@maroon.school',
            role: 'TRUST_ADMIN',
         },
      });

      if (existingAdmin) {
         console.log('⏭️  Trust admin already exists:');
         console.log(`   Username: ${existingAdmin.username || 'N/A'}`);
         console.log(`   Email: ${existingAdmin.email}`);
         console.log(`   Role: ${existingAdmin.role}`);
         return;
      }

      await createTrustAdminUser();
   } catch (error) {
      console.error('❌ Error checking/creating trust admin:', error.message);
   }
}

async function createTrustAdminUser() {
   console.log('👤 Step 4: Creating trust admin user...');

   try {
      const { dbManager } = require('../models/system/database');

      // Get tenant models for maroon trust
      const tenantModels = await dbManager.getTenantModels('maroon');
      const { User } = tenantModels;

      // Hash password
      const hashedPassword = await bcrypt.hash('tadmin123', 12);

      // Create trust admin user
      await User.create({
         username: 'tadmin',
         email: 'tadmin@maroon.school',
         password_hash: hashedPassword,
         first_name: 'Trust',
         last_name: 'Administrator',
         full_name: 'Trust Administrator',
         role: 'TRUST_ADMIN',
         user_type: 'ADMIN',
         status: 'ACTIVE',
         is_active: true,
         phone: '9876543210',
         created_at: new Date(),
         updated_at: new Date(),
      });

      console.log('✅ Trust admin user created successfully!');
      console.log('');
      console.log('=== MAROON TRUST CREDENTIALS ===');
      console.log('Trust: Maroon Education Trust');
      console.log('Subdomain: maroon.localhost:3000');
      console.log('Username: tadmin');
      console.log('Password: tadmin123');
      console.log('Email: tadmin@maroon.school');
      console.log('Role: TRUST_ADMIN');
      console.log('Theme: Maroon (#800000)');
      console.log('');

      logSystem('Maroon trust and admin user created', {
         trustCode: 'maroon',
         adminUsername: 'tadmin',
         adminEmail: 'tadmin@maroon.school',
      });
   } catch (error) {
      console.error('❌ Error creating trust admin user:', error.message);
      throw error;
   }
}

// Run if executed directly
if (require.main === module) {
   createMaroonTrust()
      .then(() => {
         console.log('\n🎉 Maroon trust creation completed successfully!');
         console.log('');
         console.log('🌐 Access URLs:');
         console.log('   Trust Login: http://maroon.localhost:3000/login');
         console.log('   System Login: http://localhost:3000/login');
         console.log('');
         console.log('🎨 Theme Colors:');
         console.log('   Primary: #800000 (Maroon)');
         console.log('   Secondary: #8B0000 (Dark Red)');
         console.log('   Accent: #A0522D (Sienna)');
         process.exit(0);
      })
      .catch((error) => {
         console.error('\n❌ Maroon trust creation failed:', error.message);
         process.exit(1);
      });
}

module.exports = { createMaroonTrust };
