#!/usr/bin/env node

/**
 * Emergency Connection Queue Manager
 * Implements a waiting queue system for database connections
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const config = require('../config/app-config.json');

class ConnectionQueueManager {
   constructor() {
      this.queue = [];
      this.processing = false;
      this.maxRetries = 10;
      this.baseDelay = 5000; // 5 seconds
      this.maxDelay = 60000; // 1 minute max
   }

   async waitForConnection() {
      return new Promise((resolve, reject) => {
         this.queue.push({ resolve, reject });
         this.processQueue();
      });
   }

   async processQueue() {
      if (this.processing || this.queue.length === 0) {
         return;
      }

      this.processing = true;
      console.log(`📋 Processing connection queue (${this.queue.length} waiting)`);

      while (this.queue.length > 0) {
         const { resolve, reject } = this.queue.shift();

         try {
            const connection = await this.attemptConnection();
            resolve(connection);

            // Add small delay between successful connections
            await this.sleep(1000);
         } catch (error) {
            reject(error);

            // Add longer delay after failed connection
            await this.sleep(this.baseDelay);
         }
      }

      this.processing = false;
   }

   async attemptConnection() {
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
         try {
            console.log(`🔄 Connection attempt ${attempt}/${this.maxRetries}`);

            if (attempt > 1) {
               const delay = Math.min(this.baseDelay * Math.pow(1.5, attempt - 1), this.maxDelay);
               console.log(`⏳ Waiting ${delay}ms before retry...`);
               await this.sleep(delay);
            }

            // Attempt minimal connection
            const connection = await mysql.createConnection({
               host: config.database.connection.host,
               port: config.database.connection.port,
               user: process.env.DB_USER,
               password: process.env.DB_PASSWORD,
               database: config.database.system.name,
               connectTimeout: 15000,
               acquireTimeout: 15000,
               timeout: 15000,
            });

            console.log('✅ Connection established successfully');
            return connection;
         } catch (error) {
            console.error(`❌ Attempt ${attempt} failed:`, error.message);

            if (attempt === this.maxRetries) {
               throw new Error(`Connection failed after ${this.maxRetries} attempts: ${error.message}`);
            }
         }
      }
   }

   sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
   }
}

async function testConnectionQueue() {
   console.log('🚀 Testing Connection Queue Manager');
   console.log('===================================\n');

   const manager = new ConnectionQueueManager();

   try {
      console.log('📡 Requesting connection through queue...');
      const connection = await manager.waitForConnection();

      console.log('✅ Connection successful through queue system');

      // Test basic query
      const [rows] = await connection.execute('SELECT 1 as test');
      console.log('📊 Query test successful:', rows[0]);

      await connection.end();
      console.log('🔌 Connection closed successfully');

      return true;
   } catch (error) {
      console.error('❌ Queue connection failed:', error.message);
      return false;
   }
}

async function main() {
   const success = await testConnectionQueue();

   if (success) {
      console.log('\n🎉 Connection queue system working!');
      console.log('💡 The application can now use queued connections');
      console.log('   Consider integrating this queue system into the main app');
   } else {
      console.log('\n❌ Connection queue system failed');
      console.log('💡 Database server may need administrative intervention');
      console.log('   - Check MySQL server status');
      console.log('   - Verify connection limits');
      console.log('   - Consider alternative database host');
   }

   process.exit(success ? 0 : 1);
}

if (require.main === module) {
   main().catch(console.error);
}

module.exports = ConnectionQueueManager;
