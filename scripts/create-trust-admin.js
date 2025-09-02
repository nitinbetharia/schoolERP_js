/**
 * Create Trust Admin User for Testing
 * This script creates a trust admin user for the demo trust to test tenant login
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { logSystem, logError } = require('../utils/logger');

async function createTrustAdmin() {
   try {
      console.log('🔧 Creating Trust Admin User for Testing...');

      // Initialize database
      const { initializeSystemModels } = require('../models/database');
      await initializeSystemModels();

      const { dbManager } = require('../models/database');
      const systemDB = await dbManager.getSystemDB();

      // First, get the demo trust
      const [trusts] = await systemDB.query(`
         SELECT id, trust_code, trust_name 
         FROM trusts 
         WHERE trust_code = 'demo'
      `);

      if (trusts.length === 0) {
         throw new Error('Demo trust not found. Please run migrations first.');
      }

      const demoTrust = trusts[0];
      console.log(`✅ Found demo trust: ${demoTrust.trust_name} (${demoTrust.trust_code})`);

      // Check if trust admin already exists
      const [existingAdmins] = await systemDB.query(
         `
         SELECT id, username, email 
         FROM system_users 
         WHERE trust_id = ? AND role = 'TRUST_ADMIN'
      `,
         [demoTrust.id]
      );

      if (existingAdmins.length > 0) {
         console.log('⏭️  Trust admin already exists:');
         existingAdmins.forEach((admin) => {
            console.log(`   - Username: ${admin.username}, Email: ${admin.email}`);
         });
         return;
      }

      // Create trust admin user
      const hashedPassword = await bcrypt.hash('trustadmin123', 12);

      await systemDB.query(
         `
         INSERT INTO system_users (
            trust_id,
            username,
            email,
            password_hash,
            first_name,
            last_name,
            role,
            is_active,
            created_at,
            updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
         [
            demoTrust.id,
            'trustadmin',
            'trustadmin@demo.schoolerp.com',
            hashedPassword,
            'Trust',
            'Administrator',
            'TRUST_ADMIN',
            1,
         ]
      );

      console.log('✅ Trust admin user created successfully!');
      console.log('');
      console.log('=== TRUST ADMIN CREDENTIALS ===');
      console.log('Username: trustadmin');
      console.log('Password: trustadmin123');
      console.log('Email: trustadmin@demo.schoolerp.com');
      console.log('Role: TRUST_ADMIN');
      console.log('Trust: Demo Education Trust (demo)');
      console.log('');
      console.log('🎉 You can now test tenant login functionality!');

      logSystem('Trust admin user created for testing', {
         username: 'trustadmin',
         email: 'trustadmin@demo.schoolerp.com',
         trustCode: demoTrust.trust_code,
         trustId: demoTrust.id,
      });
   } catch (error) {
      logError(error, { context: 'create-trust-admin' });
      console.error('❌ Failed to create trust admin:', error.message);
      throw error;
   } finally {
      // Close database connections
      const { dbManager } = require('../models/database');
      try {
         await dbManager.closeAllConnections();
         console.log('🔌 Database connections closed');
      } catch (closeError) {
         console.error('Warning: Failed to close database connections:', closeError.message);
      }
   }
}

// Run if executed directly
if (require.main === module) {
   createTrustAdmin()
      .then(() => {
         console.log('\n✅ Trust admin creation completed successfully!');
         process.exit(0);
      })
      .catch((error) => {
         console.error('\n❌ Trust admin creation failed:', error.message);
         process.exit(1);
      });
}

module.exports = { createTrustAdmin };
