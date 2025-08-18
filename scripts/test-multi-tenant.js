/**
 * Test Multi-Tenant Database Setup
 * Validates that both system and trust databases are accessible
 */

// Load environment variables first
require('dotenv').config();

const db = require('../modules/data/database-service');
const logger = require('../config/logger');

async function testMultiTenant() {
  try {
    console.log('=== Testing Multi-Tenant Database Setup ===\n');

    // Initialize database connections
    await db.init();
    console.log('✓ Database service initialized');

    // Test system database connection
    console.log('\n--- Testing System Database ---');
    try {
      const systemTables = await db.querySystem('SHOW TABLES');
      console.log(`✓ System database connected - Found ${systemTables.length} tables`);
      console.log('System tables:', systemTables.map(t => Object.values(t)[0]).join(', '));
    } catch (error) {
      console.log('✗ System database error:', error.message);
    }

    // Test trust database connection (if any trust exists)
    console.log('\n--- Testing Trust Database Access ---');
    try {
      const trusts = await db.querySystem(
        "SELECT trust_code FROM trusts WHERE status = 'ACTIVE' LIMIT 1"
      );

      if (trusts.length > 0) {
        const trustCode = trusts[0].trust_code;
        console.log(`Found active trust: ${trustCode}`);

        try {
          const trustTables = await db.queryTrust(trustCode, 'SHOW TABLES');
          console.log(`✓ Trust database connected - Found ${trustTables.length} tables`);
          console.log('Trust tables:', trustTables.map(t => Object.values(t)[0]).join(', '));
        } catch (error) {
          console.log(`✗ Trust database error for ${trustCode}:`, error.message);
        }
      } else {
        console.log('ℹ No active trusts found - trust database test skipped');
      }
    } catch (error) {
      console.log('✗ Error checking trusts:', error.message);
    }

    // Test transaction capabilities
    console.log('\n--- Testing Transaction Capabilities ---');
    try {
      await db.transactionSystem(async connection => {
        const result = await connection.execute('SELECT 1 as test');
        console.log('✓ System transaction test passed');
        return result;
      });
    } catch (error) {
      console.log('✗ System transaction error:', error.message);
    }

    console.log('\n=== Multi-Tenant Test Complete ===');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
if (require.main === module) {
  testMultiTenant();
}

module.exports = { testMultiTenant };
