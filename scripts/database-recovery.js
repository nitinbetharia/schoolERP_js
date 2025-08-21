#!/usr/bin/env node

/**
 * Database Connection Recovery Script
 * Attempts to resolve "Too many connections" errors
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const config = require('../config/app-config.json');

console.log('🔧 Database Connection Recovery Tool');
console.log('===================================\n');

async function recoveryAttempt() {
    console.log('🔍 Attempting database connection recovery...');
    
    try {
        // Try to connect with minimal configuration
        const connection = await mysql.createConnection({
            host: config.database.connection.host,
            port: config.database.connection.port,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectTimeout: 5000,
            acquireTimeout: 5000,
            timeout: 5000
        });

        console.log('✅ Basic connection established');

        // Check current connections
        const [rows] = await connection.execute('SHOW PROCESSLIST');
        console.log(`📊 Current connections: ${rows.length}`);
        
        // Show connections by user
        const connectionsByUser = {};
        rows.forEach(row => {
            const user = row.User || 'unknown';
            connectionsByUser[user] = (connectionsByUser[user] || 0) + 1;
        });
        
        console.log('👥 Connections by user:');
        Object.entries(connectionsByUser).forEach(([user, count]) => {
            console.log(`   ${user}: ${count} connections`);
        });

        // Check max connections limit
        const [maxConnResult] = await connection.execute('SHOW VARIABLES LIKE "max_connections"');
        const maxConnections = maxConnResult[0].Value;
        console.log(`⚡ Server max connections: ${maxConnections}`);
        
        if (rows.length >= maxConnections * 0.9) {
            console.log('⚠️  Server is near connection limit!');
            
            // Kill idle connections for our user (if safe to do so)
            console.log('🧹 Attempting to clean idle connections...');
            let killed = 0;
            for (const row of rows) {
                if (row.User === process.env.DB_USER && 
                    row.Command === 'Sleep' && 
                    row.Time > 30) {
                    try {
                        await connection.execute(`KILL ${row.Id}`);
                        killed++;
                        console.log(`   Killed idle connection ${row.Id}`);
                    } catch (error) {
                        console.log(`   Failed to kill connection ${row.Id}: ${error.message}`);
                    }
                }
            }
            console.log(`✅ Cleaned up ${killed} idle connections`);
        }

        await connection.end();
        console.log('✅ Recovery attempt completed');
        return true;
        
    } catch (error) {
        console.error('❌ Recovery failed:', error.message);
        return false;
    }
}

async function main() {
    const success = await recoveryAttempt();
    
    if (success) {
        console.log('\n🎉 Database connection recovery successful!');
        console.log('💡 You can now try starting the application');
        console.log('   npm run dev');
    } else {
        console.log('\n💡 Manual intervention may be required:');
        console.log('1. Wait for existing connections to timeout (5-15 minutes)');
        console.log('2. Contact database administrator to restart MySQL service');
        console.log('3. Check for other applications using the same database');
        console.log('4. Consider using a different database host/port');
    }
    
    process.exit(success ? 0 : 1);
}

main().catch(console.error);
