#!/usr/bin/env node

/**
 * Check System Database Script
 * Checks the status of the system database using standardized configuration
 */

const config = require('../config');
const dbUtil = require('../utils/database-util');

class SystemDbChecker {
  async checkSystemDatabase() {
    try {
      const systemDbName = config.getSystemDbName();

      console.log('🔍 System Database Status Check');
      console.log('===============================');
      console.log(`Database: ${systemDbName}`);
      console.log('');

      // Check if system database exists
      const exists = await dbUtil.databaseExists(systemDbName);

      if (!exists) {
        console.log('❌ System database does not exist');
        console.log('\nTo create the system database, run:');
        console.log('  npm run setup');
        return false;
      }

      console.log('✅ System database exists');

      // Connect and check tables
      const connection = await dbUtil.getSystemConnection();

      try {
        // Get database size
        const size = await dbUtil.getDatabaseSize(systemDbName);
        console.log(`📊 Database size: ${size} MB`);

        // Check key tables
        const keyTables = ['users', 'trusts', 'system_config', 'audit_logs', 'sessions'];

        console.log('\n📋 Table Status:');

        for (const tableName of keyTables) {
          const tableExists = await dbUtil.tableExists(connection, tableName);
          const status = tableExists ? '✅' : '❌';
          console.log(`  ${tableName}: ${status}`);

          if (tableExists) {
            const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
            const count = rows[0].count;
            console.log(`    Records: ${count}`);
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
          [systemDbName]
        );

        if (charsetRows.length > 0) {
          const { DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME } = charsetRows[0];
          console.log(`  Character Set: ${DEFAULT_CHARACTER_SET_NAME}`);
          console.log(`  Collation: ${DEFAULT_COLLATION_NAME}`);
        }

        console.log('\n✅ System database is healthy');
        return true;
      } finally {
        await connection.end();
      }
    } catch (error) {
      console.error(`❌ System database check failed: ${error.message}`);
      return false;
    }
  }

  async checkConnection() {
    try {
      console.log('🔗 Testing database connection...');

      const connection = await dbUtil.getRootConnection();

      try {
        const [rows] = await connection.execute('SELECT VERSION() as version');
        const version = rows[0].version;
        console.log(`✅ Connected to MySQL ${version}`);
        return true;
      } finally {
        await connection.end();
      }
    } catch (error) {
      console.error(`❌ Database connection failed: ${error.message}`);
      console.log('\nPlease check:');
      console.log('1. MySQL server is running');
      console.log('2. Database credentials in .env file');
      console.log('3. Network connectivity');
      return false;
    }
  }

  async fullCheck() {
    console.log('🚀 Full System Database Check');
    console.log('=============================\n');

    const connectionOk = await this.checkConnection();
    if (!connectionOk) {
      process.exit(1);
    }

    console.log('');
    const dbOk = await this.checkSystemDatabase();

    console.log('\n' + '='.repeat(40));

    if (dbOk) {
      console.log('🎉 All checks passed!');
    } else {
      console.log('⚠️  Some issues found. Please review the output above.');
      process.exit(1);
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const checker = new SystemDbChecker();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
System Database Check Script
===========================

Usage:
  node check-system-db.js [options]

Options:
  --connection-only       Check database connection only
  --full                  Full system check (default)
  --help, -h              Show this help

Examples:
  node check-system-db.js
  node check-system-db.js --connection-only
`);
    return;
  }

  try {
    if (args.includes('--connection-only')) {
      await checker.checkConnection();
    } else {
      await checker.fullCheck();
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

module.exports = SystemDbChecker;
