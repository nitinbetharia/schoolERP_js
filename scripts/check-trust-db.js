#!/usr/bin/env node

/**
 * Check Trust Database Script
 * Checks the status of a specific trust database using standardized configuration
 */

const config = require('../config');
const dbUtil = require('../utils/database-util');

class TrustDbChecker {
  async checkTrustDatabase(trustCode) {
    try {
      if (!trustCode) {
        throw new Error('Trust code is required');
      }

      const trustDbName = config.getTrustDbName(trustCode);

      console.log('🔍 Trust Database Status Check');
      console.log('==============================');
      console.log(`Trust Code: ${trustCode}`);
      console.log(`Database: ${trustDbName}`);
      console.log('');

      // Check if trust database exists
      const exists = await dbUtil.databaseExists(trustDbName);

      if (!exists) {
        console.log('❌ Trust database does not exist');
        console.log('\nTo create the trust database, run:');
        console.log(`  npm run tenant:create -- --code=${trustCode} --name="Trust Name"`);
        return false;
      }

      console.log('✅ Trust database exists');

      // Connect and check tables
      const connection = await dbUtil.getTrustConnection(trustCode);

      try {
        // Get database size
        const size = await dbUtil.getDatabaseSize(trustDbName);
        console.log(`📊 Database size: ${size} MB`);

        // Check key tables
        const keyTables = [
          'users',
          'students',
          'schools',
          'classes',
          'fees',
          'attendance',
          'trusts'
        ];

        console.log('\n📋 Table Status:');

        for (const tableName of keyTables) {
          const tableExists = await dbUtil.tableExists(connection, tableName);
          const status = tableExists ? '✅' : '❌';
          console.log(`  ${tableName}: ${status}`);

          if (tableExists) {
            try {
              const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
              const count = rows[0].count;
              console.log(`    Records: ${count}`);
            } catch (error) {
              console.log(`    Records: Error counting (${error.message})`);
            }
          }
        }

        // Check database configuration
        console.log('\n⚙️  Database Configuration:');
        const [charsetRows] = await connection.execute(
          `
          SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME 
          FROM INFORMATION_SCHEMA.SCHEMATA 
          WHERE SCHEMA_NAME = ?
        `,
          [trustDbName]
        );

        if (charsetRows.length > 0) {
          const { DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME } = charsetRows[0];
          console.log(`  Character Set: ${DEFAULT_CHARACTER_SET_NAME}`);
          console.log(`  Collation: ${DEFAULT_COLLATION_NAME}`);
        }

        // Check trust information
        const trustsTableExists = await dbUtil.tableExists(connection, 'trusts');
        if (trustsTableExists) {
          try {
            const [trustRows] = await connection.execute('SELECT * FROM trusts WHERE code = ?', [
              trustCode
            ]);
            if (trustRows.length > 0) {
              const trust = trustRows[0];
              console.log('\n🏢 Trust Information:');
              console.log(`  Name: ${trust.name || 'Not set'}`);
              console.log(`  Status: ${trust.status || 'Unknown'}`);
              console.log(`  Created: ${trust.created_at || 'Unknown'}`);
            }
          } catch (error) {
            console.log('\n⚠️  Could not retrieve trust information');
          }
        }

        console.log('\n✅ Trust database is healthy');
        return true;
      } finally {
        await connection.end();
      }
    } catch (error) {
      console.error(`❌ Trust database check failed: ${error.message}`);
      return false;
    }
  }

  async listAllTrustDatabases() {
    try {
      console.log('🏢 All Trust Databases');
      console.log('======================');

      const trustDatabases = await dbUtil.listTrustDatabases();
      const trustPrefix = config.getTrustDbPrefix();

      if (trustDatabases.length === 0) {
        console.log('No trust databases found.');
        return;
      }

      console.log(`Found ${trustDatabases.length} trust database(s):\n`);

      for (const dbName of trustDatabases) {
        const trustCode = dbName.replace(trustPrefix, '');
        console.log(`📊 ${trustCode}`);
        console.log(`   Database: ${dbName}`);

        // Quick health check
        try {
          const exists = await dbUtil.databaseExists(dbName);
          const size = await dbUtil.getDatabaseSize(dbName);
          console.log(`   Status: ${exists ? '✅ Healthy' : '❌ Issues'}`);
          console.log(`   Size: ${size} MB`);
        } catch (error) {
          console.log(`   Status: ❌ Error (${error.message})`);
        }

        console.log('');
      }
    } catch (error) {
      console.error(`❌ Failed to list trust databases: ${error.message}`);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const checker = new TrustDbChecker();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Trust Database Check Script
==========================

Usage:
  node check-trust-db.js [options]

Options:
  --trust=<code>          Check specific trust database
  --list                  List all trust databases
  --help, -h              Show this help

Examples:
  node check-trust-db.js --trust=demo
  node check-trust-db.js --list
`);
    return;
  }

  try {
    if (args.includes('--list')) {
      await checker.listAllTrustDatabases();
    } else if (args.some(arg => arg.startsWith('--trust='))) {
      const trustArg = args.find(arg => arg.startsWith('--trust='));
      const trustCode = trustArg.split('=')[1];
      await checker.checkTrustDatabase(trustCode);
    } else {
      console.log('Use --help for usage information');
      console.log('You must specify either --trust=<code> or --list');
    }
  } catch (error) {
    console.error(`\n❌ Check failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = TrustDbChecker;
