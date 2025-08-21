#!/usr/bin/env node

/**
 * Connection Pool Management Script
 * Use this script to monitor, diagnose, and fix connection pool issues
 */

require('dotenv').config();
const path = require('path');

// Change to project root directory
const projectRoot = path.join(__dirname, '..');
process.chdir(projectRoot);

const { dbManager } = require(path.join(projectRoot, 'models', 'database'));
const { logSystem, logError } = require(path.join(projectRoot, 'utils', 'logger'));

async function showConnectionStatus() {
   try {
      console.log('\n=== DATABASE CONNECTION STATUS ===\n');

      const health = await dbManager.healthCheck();

      console.log(`System DB Connected: ${health.systemDB ? '✅' : '❌'}`);
      console.log(`Active Tenant Connections: ${health.tenantConnections}`);
      console.log(`Active Tenants: ${health.activeTenants.join(', ')}`);

      if (health.connectionPoolStatus) {
         console.log('\n--- System Database Pool ---');
         if (health.connectionPoolStatus.system) {
            const systemPool = health.connectionPoolStatus.system;
            console.log(`Pool Max: ${systemPool.pool?.max || 'N/A'}`);
            console.log(`Used Connections: ${systemPool.used || 0}`);
            console.log(`Available: ${(systemPool.pool?.max || 0) - (systemPool.used || 0)}`);
         }

         console.log('\n--- Tenant Database Pools ---');
         let totalUsed = health.connectionPoolStatus.system?.used || 0;
         health.connectionPoolStatus.tenants.forEach((tenant) => {
            console.log(`Tenant: ${tenant.tenant}`);
            console.log(`  Pool Max: ${tenant.pool?.max || 'N/A'}`);
            console.log(`  Used Connections: ${tenant.used || 0}`);
            console.log(`  Available: ${(tenant.pool?.max || 0) - (tenant.used || 0)}`);
            console.log(`  Last Used: ${tenant.lastUsed ? new Date(tenant.lastUsed).toISOString() : 'N/A'}`);
            totalUsed += tenant.used || 0;
         });

         console.log(`\n--- Summary ---`);
         console.log(`Total Used Connections: ${totalUsed}`);
         const sessionStoreConnections = 5; // From config
         console.log(`Estimated Session Store Connections: ${sessionStoreConnections}`);
         console.log(`Grand Total Estimated: ${totalUsed + sessionStoreConnections}`);

         // Health indicators
         if (totalUsed > 25) {
            console.log('⚠️  WARNING: High connection usage detected');
         } else if (totalUsed > 15) {
            console.log('⚡ MODERATE: Connection usage is getting high');
         } else {
            console.log('✅ GOOD: Connection usage is healthy');
         }
      }

      console.log('\n--- Retry Configuration ---');
      try {
         const { RETRY_CONFIG } = require(path.join(projectRoot, 'utils', 'databaseRetry'));
         console.log(`Max Retry Attempts: ${RETRY_CONFIG.maxAttempts}`);
         console.log(`Base Delay: ${RETRY_CONFIG.baseDelayMs}ms`);
         console.log(`Max Delay: ${RETRY_CONFIG.maxDelayMs}ms`);
         console.log(`Backoff Multiplier: ${RETRY_CONFIG.backoffMultiplier}x`);
         console.log('✅ Database retry system is active');
      } catch (error) {
         console.log('❌ Database retry system not available');
      }

      console.log('\n');
   } catch (error) {
      console.error('Error checking connection status:', error.message);
   }
}

async function cleanupConnections() {
   try {
      console.log('Cleaning up idle connections...');
      await dbManager.cleanupIdleConnections();
      console.log('Cleanup completed ✅');
   } catch (error) {
      console.error('Error during cleanup:', error.message);
   }
}

async function resetAllConnections() {
   try {
      console.log('Resetting all database connections...');
      await dbManager.closeAllConnections();
      console.log('All connections closed ✅');

      // Reinitialize system DB
      await dbManager.initializeSystemDB();
      console.log('System database reconnected ✅');
   } catch (error) {
      console.error('Error resetting connections:', error.message);
   }
}

async function showMySQLProcesses() {
   try {
      console.log('\n=== MYSQL PROCESS LIST ===\n');

      const systemDB = await dbManager.getSystemDB();
      const [results] = await systemDB.query('SHOW PROCESSLIST');

      console.log('Active MySQL connections:');
      results.forEach((process, index) => {
         console.log(
            `${index + 1}. ID: ${process.Id}, User: ${process.User}, Host: ${process.Host}, DB: ${process.db || 'NULL'}, Command: ${process.Command}, Time: ${process.Time}s`
         );
      });

      console.log(`\nTotal active processes: ${results.length}`);
   } catch (error) {
      console.error('Error showing MySQL processes:', error.message);
   }
}

async function showMySQLVariables() {
   try {
      console.log('\n=== MYSQL CONNECTION VARIABLES ===\n');

      const systemDB = await dbManager.getSystemDB();
      const queries = [
         "SHOW VARIABLES LIKE 'max_connections'",
         "SHOW VARIABLES LIKE 'max_user_connections'",
         "SHOW VARIABLES LIKE 'thread_cache_size'",
         "SHOW STATUS LIKE 'Threads_connected'",
         "SHOW STATUS LIKE 'Threads_running'",
         "SHOW STATUS LIKE 'Max_used_connections'",
      ];

      for (const query of queries) {
         try {
            const [results] = await systemDB.query(query);
            results.forEach((result) => {
               console.log(`${result.Variable_name}: ${result.Value}`);
            });
         } catch (error) {
            console.log(`Could not execute: ${query}`);
         }
      }

      console.log('\n');
   } catch (error) {
      console.error('Error showing MySQL variables:', error.message);
   }
}

// Command line interface
async function main() {
   const command = process.argv[2];

   try {
      switch (command) {
         case 'status':
            await showConnectionStatus();
            break;

         case 'cleanup':
            await cleanupConnections();
            break;

         case 'reset':
            await resetAllConnections();
            break;

         case 'processes':
            await showMySQLProcesses();
            break;

         case 'variables':
            await showMySQLVariables();
            break;

         case 'full-report':
            await showConnectionStatus();
            await showMySQLVariables();
            await showMySQLProcesses();
            break;

         default:
            console.log('\nConnection Pool Management Tool\n');
            console.log('Usage: node connection-manager.js <command>\n');
            console.log('Commands:');
            console.log('  status      - Show current connection pool status');
            console.log('  cleanup     - Clean up idle connections');
            console.log('  reset       - Reset all connections');
            console.log('  processes   - Show MySQL process list');
            console.log('  variables   - Show MySQL connection variables');
            console.log('  full-report - Show comprehensive connection report');
            console.log('');
            break;
      }
   } catch (error) {
      logError(error, { context: 'connection-manager' });
      console.error('Script failed:', error.message);
   } finally {
      process.exit(0);
   }
}

if (require.main === module) {
   main();
}

module.exports = {
   showConnectionStatus,
   cleanupConnections,
   resetAllConnections,
   showMySQLProcesses,
   showMySQLVariables,
};
