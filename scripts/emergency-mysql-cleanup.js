#!/usr/bin/env node

/**
 * Emergency MySQL Connection Cleanup
 * This script helps clean up hanging MySQL connections when the server can't start
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
   host: '140.238.167.36',
   port: 3306,
   user: process.env.DB_USER,
   password: process.env.DB_PASSWORD,
   database: 'school_erp_system',
   acquireTimeout: 10000,
   timeout: 10000,
};

async function emergencyCleanup() {
   let connection = null;

   try {
      console.log('🚨 Emergency MySQL Connection Cleanup Starting...\n');

      // Try to connect with minimal settings
      connection = await mysql.createConnection({
         host: dbConfig.host,
         port: dbConfig.port,
         user: dbConfig.user,
         password: dbConfig.password,
         acquireTimeout: 10000,
         timeout: 10000,
      });

      console.log('✅ Connected to MySQL server\n');

      // Show current connection status
      console.log('=== CURRENT CONNECTION STATUS ===');
      const [variables] = await connection.execute("SHOW VARIABLES LIKE 'max_connections'");
      console.log(`Max Connections: ${variables[0].Value}`);

      const [status] = await connection.execute("SHOW STATUS LIKE 'Threads_connected'");
      console.log(`Current Connections: ${status[0].Value}`);

      const [maxUsed] = await connection.execute("SHOW STATUS LIKE 'Max_used_connections'");
      console.log(`Max Used Connections: ${maxUsed[0].Value}\n`);

      // Show active processes
      console.log('=== ACTIVE PROCESSES ===');
      const [processes] = await connection.execute('SHOW PROCESSLIST');
      console.log(`Total processes: ${processes.length}`);

      // Group processes by user and database
      const processGroups = {};
      processes.forEach((proc) => {
         const key = `${proc.User}@${proc.Host}`;
         if (!processGroups[key]) {
            processGroups[key] = { count: 0, databases: new Set(), ids: [] };
         }
         processGroups[key].count++;
         if (proc.db) processGroups[key].databases.add(proc.db);
         processGroups[key].ids.push(proc.Id);
      });

      console.log('\nProcesses by user:');
      Object.entries(processGroups).forEach(([userHost, info]) => {
         console.log(`  ${userHost}: ${info.count} connections`);
         console.log(`    Databases: ${Array.from(info.databases).join(', ') || 'None'}`);
      });

      // Find potentially problematic connections
      const problematicConnections = processes.filter(
         (proc) =>
            (proc.Command === 'Sleep' && proc.Time > 300) || // Sleeping for more than 5 minutes
            (proc.State && proc.State.includes('Waiting')) ||
            (proc.Info && proc.Info.includes('LOCK'))
      );

      if (problematicConnections.length > 0) {
         console.log(`\n⚠️  Found ${problematicConnections.length} potentially problematic connections:`);
         problematicConnections.forEach((proc) => {
            console.log(
               `  ID: ${proc.Id}, User: ${proc.User}, Command: ${proc.Command}, Time: ${proc.Time}s, State: ${proc.State || 'N/A'}`
            );
         });

         console.log('\n🛠️  Cleaning up problematic connections...');
         for (const proc of problematicConnections) {
            try {
               await connection.execute(`KILL ${proc.Id}`);
               console.log(`   Killed connection ${proc.Id}`);
            } catch (error) {
               console.log(`   Could not kill connection ${proc.Id}: ${error.message}`);
            }
         }
      }

      // Clean up old session data
      console.log('\n🧹 Cleaning up expired sessions...');
      await connection.execute(`USE ${dbConfig.database}`);
      const [sessionResult] = await connection.execute('DELETE FROM sessions WHERE expires < NOW()');
      console.log(`   Deleted ${sessionResult.affectedRows} expired sessions`);

      // Show final status
      console.log('\n=== FINAL STATUS ===');
      const [finalStatus] = await connection.execute("SHOW STATUS LIKE 'Threads_connected'");
      console.log(`Current Connections: ${finalStatus[0].Value}`);

      console.log('\n✅ Emergency cleanup completed successfully!');
      console.log('💡 You can now try starting the server again.\n');
   } catch (error) {
      console.error('❌ Emergency cleanup failed:', error.message);
      console.log('\n🔧 Manual steps you can try:');
      console.log('1. Restart your MySQL server if you have access');
      console.log('2. Wait a few minutes for connections to timeout naturally');
      console.log('3. Contact your database administrator');
      console.log('4. Check if other applications are using too many connections\n');
   } finally {
      if (connection) {
         await connection.end();
      }
   }
}

async function showOnlyStatus() {
   let connection = null;

   try {
      connection = await mysql.createConnection({
         host: dbConfig.host,
         port: dbConfig.port,
         user: dbConfig.user,
         password: dbConfig.password,
         acquireTimeout: 5000,
         timeout: 5000,
      });

      const [variables] = await connection.execute("SHOW VARIABLES LIKE 'max_connections'");
      const [status] = await connection.execute("SHOW STATUS LIKE 'Threads_connected'");
      const [maxUsed] = await connection.execute("SHOW STATUS LIKE 'Max_used_connections'");

      console.log('=== MYSQL CONNECTION STATUS ===');
      console.log(`Max Connections: ${variables[0].Value}`);
      console.log(`Current Connections: ${status[0].Value}`);
      console.log(`Max Used Connections: ${maxUsed[0].Value}`);
      console.log(`Available Connections: ${variables[0].Value - status[0].Value}`);

      if (parseInt(status[0].Value) > parseInt(variables[0].Value) * 0.8) {
         console.log('⚠️  WARNING: Connection usage is above 80%');
      } else {
         console.log('✅ Connection usage is normal');
      }
   } catch (error) {
      console.error('❌ Could not check status:', error.message);
   } finally {
      if (connection) {
         await connection.end();
      }
   }
}

// Command line interface
const command = process.argv[2] || 'status';

switch (command) {
   case 'cleanup':
      emergencyCleanup();
      break;
   case 'status':
   default:
      showOnlyStatus();
      break;
}
