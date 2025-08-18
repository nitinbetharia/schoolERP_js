#!/usr/bin/env node

/**
 * Tenant Creation Script
 * Creates new trust databases using standardized configuration
 */

const config = require('../config');
const dbUtil = require('../utils/database-util');
const DatabaseSetup = require('./setup-database');

class TenantManager {
  constructor() {
    this.databaseSetup = new DatabaseSetup();
  }

  /**
   * Create a new tenant (trust)
   */
  async createTenant(trustCode, trustName) {
    try {
      if (!trustCode || !trustName) {
        throw new Error('Both trust code and trust name are required');
      }

      // Validate trust code format
      if (!/^[a-z0-9_]+$/i.test(trustCode)) {
        throw new Error('Trust code must contain only letters, numbers, and underscores');
      }

      const trustDbName = config.getTrustDbName(trustCode);

      console.log('🏢 Creating New Tenant');
      console.log('======================');
      console.log(`Trust Code: ${trustCode}`);
      console.log(`Trust Name: ${trustName}`);
      console.log(`Database: ${trustDbName}`);
      console.log('');

      // Check if database already exists
      const exists = await dbUtil.databaseExists(trustDbName);
      if (exists) {
        throw new Error(`Trust database already exists: ${trustDbName}`);
      }

      // Create the trust database
      await this.databaseSetup.setupTrustDatabase(trustCode, trustName);

      // Register tenant in system database
      await this.registerTenantInSystem(trustCode, trustName, trustDbName);

      console.log('\n✅ Tenant created successfully!');
      console.log(`\nAccess URL: ${this.generateAccessUrl(trustCode)}`);
      console.log('\nNext steps:');
      console.log('1. Create admin user for this trust');
      console.log('2. Configure trust settings');
      console.log('3. Set up schools within the trust');
    } catch (error) {
      console.error(`❌ Tenant creation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Register tenant in system database
   */
  async registerTenantInSystem(trustCode, trustName, trustDbName) {
    try {
      console.log('📝 Registering tenant in system database...');

      const connection = await dbUtil.getSystemConnection();

      try {
        // Check if trusts table exists in system database
        const tableExists = await dbUtil.tableExists(connection, 'trusts');

        if (tableExists) {
          await connection.execute(
            `
            INSERT INTO trusts (code, name, database_name, status, created_at, updated_at) 
            VALUES (?, ?, ?, 'active', NOW(), NOW())
            ON DUPLICATE KEY UPDATE 
              name = VALUES(name),
              database_name = VALUES(database_name),
              updated_at = VALUES(updated_at)
          `,
            [trustCode, trustName, trustDbName]
          );

          console.log('  ✅ Tenant registered in system database');
        } else {
          console.log('  ⚠️  System trusts table not found, skipping registration');
        }
      } finally {
        await connection.end();
      }
    } catch (error) {
      console.log(`  ⚠️  Could not register tenant in system: ${error.message}`);
    }
  }

  /**
   * Generate access URL for the tenant
   */
  generateAccessUrl(trustCode) {
    const appConfig = config.getApp();
    const baseUrl = appConfig.baseUrl || 'http://localhost:3000';

    // If subdomain routing is enabled
    const features = config.getFeatures();
    if (features.subdomainRouting) {
      return `http://${trustCode}.localhost:3000`;
    } else {
      return `${baseUrl}/${trustCode}`;
    }
  }

  /**
   * List all tenants
   */
  async listTenants() {
    try {
      console.log('🏢 Tenant List');
      console.log('==============');

      const trustDatabases = await dbUtil.listTrustDatabases();
      const trustPrefix = config.getTrustDbPrefix();

      if (trustDatabases.length === 0) {
        console.log('No tenants found.');
        return;
      }

      console.log(`Found ${trustDatabases.length} tenant(s):\n`);

      for (const dbName of trustDatabases) {
        const trustCode = dbName.replace(trustPrefix, '');
        const size = await dbUtil.getDatabaseSize(dbName);

        console.log(`📊 ${trustCode}`);
        console.log(`   Database: ${dbName}`);
        console.log(`   Size: ${size} MB`);
        console.log(`   URL: ${this.generateAccessUrl(trustCode)}`);
        console.log('');
      }
    } catch (error) {
      console.error(`❌ Failed to list tenants: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a tenant (with confirmation)
   */
  async deleteTenant(trustCode, force = false) {
    try {
      if (!trustCode) {
        throw new Error('Trust code is required');
      }

      const trustDbName = config.getTrustDbName(trustCode);

      // Check if database exists
      const exists = await dbUtil.databaseExists(trustDbName);
      if (!exists) {
        throw new Error(`Trust database does not exist: ${trustDbName}`);
      }

      if (!force) {
        console.log('⚠️  WARNING: This will permanently delete the tenant and all its data!');
        console.log(`Database: ${trustDbName}`);
        console.log('Use --force flag to confirm deletion.');
        return;
      }

      console.log(`🗑️  Deleting tenant: ${trustCode}`);
      console.log(`   Database: ${trustDbName}`);

      // Drop the database
      await dbUtil.dropDatabase(trustDbName);

      // Remove from system database
      await this.unregisterTenantFromSystem(trustCode);

      console.log('✅ Tenant deleted successfully!');
    } catch (error) {
      console.error(`❌ Tenant deletion failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Unregister tenant from system database
   */
  async unregisterTenantFromSystem(trustCode) {
    try {
      const connection = await dbUtil.getSystemConnection();

      try {
        const tableExists = await dbUtil.tableExists(connection, 'trusts');

        if (tableExists) {
          await connection.execute('DELETE FROM trusts WHERE code = ?', [trustCode]);
          console.log('  ✅ Tenant unregistered from system database');
        }
      } finally {
        await connection.end();
      }
    } catch (error) {
      console.log(`  ⚠️  Could not unregister tenant from system: ${error.message}`);
    }
  }

  /**
   * Backup a tenant database
   */
  async backupTenant(trustCode, backupDir = './backups') {
    try {
      if (!trustCode) {
        throw new Error('Trust code is required');
      }

      const trustDbName = config.getTrustDbName(trustCode);

      // Check if database exists
      const exists = await dbUtil.databaseExists(trustDbName);
      if (!exists) {
        throw new Error(`Trust database does not exist: ${trustDbName}`);
      }

      const fs = require('fs').promises;
      const path = require('path');

      // Ensure backup directory exists
      await fs.mkdir(backupDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `${trustCode}_${timestamp}.sql`;
      const backupPath = path.join(backupDir, backupFileName);

      console.log(`💾 Backing up tenant: ${trustCode}`);
      console.log(`   Database: ${trustDbName}`);
      console.log(`   Backup file: ${backupPath}`);

      await dbUtil.backupDatabase(trustDbName, backupPath);

      console.log('✅ Tenant backup completed successfully!');
      return backupPath;
    } catch (error) {
      console.error(`❌ Tenant backup failed: ${error.message}`);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const tenantManager = new TenantManager();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Tenant Management Script
========================

Usage:
  node create-tenant.js [options]

Create Tenant:
  --code=<trust_code>     Trust code (required)
  --name="<trust_name>"   Trust name (required)

List Tenants:
  --list                  List all tenants

Delete Tenant:
  --delete=<trust_code>   Delete tenant (requires --force)
  --force                 Force deletion (no confirmation)

Backup Tenant:
  --backup=<trust_code>   Backup tenant database
  --backup-dir=<path>     Backup directory (default: ./backups)

Examples:
  node create-tenant.js --code=demo --name="Demo Trust"
  node create-tenant.js --list
  node create-tenant.js --backup=demo
  node create-tenant.js --delete=demo --force
`);
    return;
  }

  try {
    if (args.includes('--list')) {
      await tenantManager.listTenants();
    } else if (args.some(arg => arg.startsWith('--code='))) {
      const codeArg = args.find(arg => arg.startsWith('--code='));
      const nameArg = args.find(arg => arg.startsWith('--name='));

      if (!codeArg || !nameArg) {
        console.error('❌ Both --code and --name are required for tenant creation');
        process.exit(1);
      }

      const trustCode = codeArg.split('=')[1];
      const trustName = nameArg.split('=')[1];

      await tenantManager.createTenant(trustCode, trustName);
    } else if (args.some(arg => arg.startsWith('--delete='))) {
      const deleteArg = args.find(arg => arg.startsWith('--delete='));
      const trustCode = deleteArg.split('=')[1];
      const force = args.includes('--force');

      await tenantManager.deleteTenant(trustCode, force);
    } else if (args.some(arg => arg.startsWith('--backup='))) {
      const backupArg = args.find(arg => arg.startsWith('--backup='));
      const trustCode = backupArg.split('=')[1];

      const backupDirArg = args.find(arg => arg.startsWith('--backup-dir='));
      const backupDir = backupDirArg ? backupDirArg.split('=')[1] : './backups';

      await tenantManager.backupTenant(trustCode, backupDir);
    } else {
      console.log('Use --help for usage information');
    }
  } catch (error) {
    console.error(`\n❌ Operation failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = TenantManager;
