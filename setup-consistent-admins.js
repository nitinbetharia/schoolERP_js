const { dbManager } = require('./models/database');
const { defineSystemUserModel } = require('./models/SystemUser');
const { defineTrustModel } = require('./models/Trust');
const { defineTenantUserModel } = require('./models/TenantUser');
const bcrypt = require('bcryptjs');

/**
 * Consistent Admin Users Seeder
 * Creates admin users with consistent credentials across all databases using proper models
 */
async function setupConsistentAdmins() {
   try {
      console.log('=== SETTING UP CONSISTENT ADMIN USERS USING MODELS ===\n');

      // Get system database connection
      const systemDB = await dbManager.getSystemDB();

      // Initialize models
      const SystemUser = defineSystemUserModel(systemDB);
      const Trust = defineTrustModel(systemDB);

      // Hash password once for all users
      const passwordHash = await bcrypt.hash('admin123', 12);
      console.log('✅ Password hashed successfully\n');

      // 1. SYSTEM DATABASE - Clean and create system admin using model
      console.log('🔧 Setting up SYSTEM ADMIN using SystemUser model...');

      // Clear existing system users
      await SystemUser.destroy({ where: {}, force: true });
      console.log('  ✅ Cleared existing system users');

      // Create new system admin using model
      const systemAdmin = await SystemUser.create({
         username: 'admin',
         email: 'admin@system.local',
         password_hash: passwordHash,
         full_name: 'System Administrator',
         role: 'SYSTEM_ADMIN',
         status: 'ACTIVE'
      });

      console.log('  ✅ Created system admin:', systemAdmin.username + ' / admin123');
      console.log('  📍 Login at: http://localhost:3000');
      console.log('');

      // 2. Get existing trusts to work with
      const trusts = await Trust.findAll({
         where: {},
         attributes: ['id', 'trust_code', 'trust_name', 'database_name']
      });

      console.log(`📋 Found ${trusts.length} trust(s) to setup admin users for:\n`);

      for (const trust of trusts) {
         console.log(`🔧 Setting up ${trust.trust_code.toUpperCase()} TRUST ADMIN using TenantUser model...`);

         try {
            // Get tenant database connection and model
            const tenantDB = await dbManager.getTenantDB(trust.trust_code);
            const TenantUser = defineTenantUserModel(tenantDB);

            // Clear existing users
            await TenantUser.destroy({ where: {}, force: true });
            console.log(`  ✅ Cleared existing ${trust.trust_code} users`);

            // Create tenant admin using model
            const tenantAdmin = await TenantUser.create({
               username: 'admin',
               email: `admin@${trust.trust_code}.school`,
               password_hash: passwordHash,
               first_name: `${trust.trust_name}`,
               last_name: 'Administrator',
               role: 'TRUST_ADMIN',
               user_type: 'STAFF',
               is_active: true
            });

            console.log(`  ✅ Created ${trust.trust_code} admin:`, 
               tenantAdmin.username + ' / admin123');
            console.log(`  📍 Login at: http://${trust.trust_code}.localhost:3000`);
            console.log('');

            // Close tenant connection to prevent memory leaks
            await tenantDB.close();

         } catch (error) {
            console.error(`  ❌ Error setting up ${trust.trust_code} admin:`, error.message);
            console.log('');
         }
      }

      // 3. SUMMARY
      console.log('🎉 SETUP COMPLETE! Admin credentials for all databases:');
      console.log('');
      console.log('┌─────────────────┬─────────────────┬─────────────────────────────┐');
      console.log('│ Database        │ Username        │ Access URL                  │');
      console.log('├─────────────────┼─────────────────┼─────────────────────────────┤');
      console.log('│ System          │ admin/admin123  │ http://localhost:3000       │');
      
      for (const trust of trusts) {
         const dbName = trust.trust_code.padEnd(15);
         const url = `http://${trust.trust_code}.localhost:3000`.padEnd(27);
         console.log(`│ ${dbName} │ admin/admin123  │ ${url} │`);
      }
      
      console.log('└─────────────────┴─────────────────┴─────────────────────────────┘');
      console.log('');
      console.log('📝 Notes:');
      console.log('   - All users created with ADMIN role and ACTIVE status');
      console.log('   - Password is consistently "admin123" across all databases');
      console.log('   - System admin has SYSTEM_ADMIN role');
      console.log('   - Tenant admins have TRUST_ADMIN role');
      console.log('   - All existing users were cleared before creating new ones');
      console.log('');

   } catch (error) {
      console.error('❌ Setup failed:', error.message);
      console.error('Stack trace:', error.stack);
   } finally {
      // Close connections
      try {
         await dbManager.closeAllConnections();
         console.log('✅ Database connections closed');
      } catch (closeError) {
         console.error('⚠️  Error closing connections:', closeError.message);
      }
      process.exit(0);
   }
}

setupConsistentAdmins();
