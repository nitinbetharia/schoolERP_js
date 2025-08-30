/**
 * Migration: Add Password Reset Token Fields
 *
 * Adds reset_token and reset_token_expires fields to both system_users
 * and tenant users tables to support password reset functionality
 *
 * Version: 1.0.0
 * Created: 2025-01-27
 */

const { logSystem, logError } = require('../utils/logger');

/**
 * Add password reset token fields to system users table
 */
async function addPasswordResetFieldsToSystemUsers(sequelize) {
   const { QueryInterface } = sequelize;
   const { DataTypes } = require('sequelize');

   try {
      // Check if columns already exist
      const tableDescription = await QueryInterface.describeTable('system_users');

      if (!tableDescription.reset_token) {
         await QueryInterface.addColumn('system_users', 'reset_token', {
            type: DataTypes.STRING(64),
            allowNull: true,
            comment: 'Password reset token',
         });
         logSystem('Added reset_token column to system_users table');
      }

      if (!tableDescription.reset_token_expires) {
         await QueryInterface.addColumn('system_users', 'reset_token_expires', {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Password reset token expiry timestamp',
         });
         logSystem('Added reset_token_expires column to system_users table');
      }

      logSystem('Password reset fields migration completed for system_users');
      return true;
   } catch (error) {
      logError(error, { context: 'AddPasswordResetFieldsToSystemUsers' });
      throw error;
   }
}

/**
 * Add password reset token fields to tenant users tables
 */
async function addPasswordResetFieldsToTenantUsers(tenantDB, tenantCode) {
   const { DataTypes } = require('sequelize');
   const QueryInterface = tenantDB.getQueryInterface();

   try {
      // Check if columns already exist
      const tableDescription = await QueryInterface.describeTable('users');

      // Add login_attempts if it doesn't exist (for consistency)
      if (!tableDescription.login_attempts) {
         await QueryInterface.addColumn('users', 'login_attempts', {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Failed login attempts counter',
         });
         logSystem(`Added login_attempts column to users table in tenant ${tenantCode}`);
      }

      if (!tableDescription.reset_token) {
         await QueryInterface.addColumn('users', 'reset_token', {
            type: DataTypes.STRING(64),
            allowNull: true,
            comment: 'Password reset token',
         });
         logSystem(`Added reset_token column to users table in tenant ${tenantCode}`);
      }

      if (!tableDescription.reset_token_expires) {
         await QueryInterface.addColumn('users', 'reset_token_expires', {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Password reset token expiry timestamp',
         });
         logSystem(`Added reset_token_expires column to users table in tenant ${tenantCode}`);
      }

      logSystem(`Password reset fields migration completed for tenant ${tenantCode} users table`);
      return true;
   } catch (error) {
      logError(error, {
         context: 'AddPasswordResetFieldsToTenantUsers',
         tenantCode,
      });
      throw error;
   }
}

/**
 * Run the password reset fields migration
 */
async function runPasswordResetMigration() {
   try {
      logSystem('Starting password reset fields migration...');

      const { dbManager } = require('../models/system/database');

      // Migrate system users table
      logSystem('Migrating system_users table...');
      const systemDB = await dbManager.getSystemDB();
      await addPasswordResetFieldsToSystemUsers(systemDB);

      // Get all tenants and migrate their users tables
      logSystem('Migrating tenant users tables...');
      const { defineTrustModel } = require('../models/tenant/Trust');
      const Trust = defineTrustModel(systemDB);

      const tenants = await Trust.findAll({
         where: { status: 'ACTIVE' },
         attributes: ['trust_code', 'name', 'id'],
      });

      logSystem(`Found ${tenants.length} active tenants to migrate`);

      for (const tenant of tenants) {
         try {
            logSystem(`Migrating tenant: ${tenant.name} (${tenant.trust_code})`);

            // Get tenant database connection
            const tenantDB = await dbManager.getTenantDB(tenant.trust_code);

            // Run migration for this tenant
            await addPasswordResetFieldsToTenantUsers(tenantDB, tenant.trust_code);
         } catch (error) {
            logError(error, {
               context: 'TenantPasswordResetMigration',
               tenantCode: tenant.trust_code,
               tenantName: tenant.name,
            });
            // Continue with other tenants even if one fails
            console.warn(`Failed to migrate tenant ${tenant.trust_code}: ${error.message}`);
         }
      }

      logSystem('Password reset fields migration completed successfully');
      return {
         success: true,
         systemMigrated: true,
         tenantsMigrated: tenants.length,
      };
   } catch (error) {
      logError(error, { context: 'RunPasswordResetMigration' });
      throw error;
   }
}

/**
 * Rollback password reset fields migration (for development/testing)
 */
async function rollbackPasswordResetMigration() {
   try {
      logSystem('Starting password reset fields migration rollback...');

      const { dbManager } = require('../models/system/database');

      // Rollback system users table
      const systemDB = await dbManager.getSystemDB();
      const systemQueryInterface = systemDB.getQueryInterface();

      try {
         await systemQueryInterface.removeColumn('system_users', 'reset_token');
         await systemQueryInterface.removeColumn('system_users', 'reset_token_expires');
         logSystem('Removed password reset fields from system_users table');
      } catch (error) {
         logError(error, { context: 'SystemUsersRollback' });
      }

      // Rollback tenant users tables
      const { defineTrustModel } = require('../models/tenant/Trust');
      const Trust = defineTrustModel(systemDB);

      const tenants = await Trust.findAll({
         where: { status: 'ACTIVE' },
         attributes: ['trust_code', 'name'],
      });

      for (const tenant of tenants) {
         try {
            const tenantDB = await dbManager.getTenantDB(tenant.trust_code);
            const queryInterface = tenantDB.getQueryInterface();

            await queryInterface.removeColumn('users', 'reset_token');
            await queryInterface.removeColumn('users', 'reset_token_expires');
            await queryInterface.removeColumn('users', 'login_attempts');

            logSystem(`Removed password reset fields from tenant ${tenant.trust_code} users table`);
         } catch (error) {
            logError(error, {
               context: 'TenantUsersRollback',
               tenantCode: tenant.trust_code,
            });
         }
      }

      logSystem('Password reset fields migration rollback completed');
      return { success: true };
   } catch (error) {
      logError(error, { context: 'RollbackPasswordResetMigration' });
      throw error;
   }
}

// Export functions for use by migration runner
module.exports = {
   runPasswordResetMigration,
   rollbackPasswordResetMigration,
   addPasswordResetFieldsToSystemUsers,
   addPasswordResetFieldsToTenantUsers,
};

// If run directly, execute the migration
if (require.main === module) {
   const readline = require('readline');
   const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
   });

   console.log('Password Reset Fields Migration');
   console.log('=============================');
   console.log('This will add reset_token and reset_token_expires fields to:');
   console.log('- system_users table');
   console.log('- users table in all tenant databases');
   console.log('- login_attempts field to tenant users (if missing)');
   console.log('');

   rl.question('Do you want to proceed with the migration? (y/N): ', async (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
         try {
            const result = await runPasswordResetMigration();
            console.log('\nMigration completed successfully!');
            console.log(`- System users table: ${result.systemMigrated ? 'Migrated' : 'Skipped'}`);
            console.log(`- Tenant databases: ${result.tenantsMigrated} migrated`);
            process.exit(0);
         } catch (error) {
            console.error('\nMigration failed:', error.message);
            process.exit(1);
         }
      } else {
         console.log('Migration cancelled.');
         process.exit(0);
      }
      rl.close();
   });
}
