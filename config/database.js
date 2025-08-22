// Database configuration for different environments
// This file defines Sequelize configuration for development, test, and production

const { Sequelize } = require('sequelize');
const config = require('./app-config.json');

/**
 * Enhanced Database Connection with Retry Logic
 */
class DatabaseManager {
   constructor() {
      this.sequelize = null;
      this.retryCount = 0;
      this.maxRetries = 5;
      this.baseDelay = 2000; // 2 seconds base delay
      this.initialized = false;
   }

   async initialize() {
      if (this.initialized) {return this.sequelize;}

      console.log('🔧 Initializing database connection with enhanced retry logic...');

      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
         try {
            console.log(`📡 Database connection attempt ${attempt}/${this.maxRetries}`);

            // Calculate exponential backoff delay
            if (attempt > 1) {
               const delay = this.baseDelay * Math.pow(2, attempt - 2);
               console.log(`⏳ Waiting ${delay}ms before retry...`);
               await this.sleep(delay);
            }

            // Create sequelize instance with minimal pool
            this.sequelize = new Sequelize(
               config.database.connection.database,
               config.database.connection.username,
               config.database.connection.password,
               {
                  host: config.database.connection.host,
                  port: config.database.connection.port,
                  dialect: config.database.connection.dialect,
                  logging: false, // Reduce logging during initialization
                  pool: {
                     max: 1, // Absolute minimum for initialization
                     min: 0,
                     acquire: 15000, // 15 second acquire timeout
                     idle: 5000, // 5 second idle timeout
                     evict: 1000, // Check for idle connections every 1 second
                     handleDisconnects: true,
                  },
                  retry: {
                     match: [/ECONNRESET/, /ENOTFOUND/, /ECONNREFUSED/, /ETIMEDOUT/, /Too many connections/],
                     max: 3,
                  },
                  dialectOptions: {
                     connectTimeout: 10000,
                     acquireTimeout: 10000,
                     timeout: 10000,
                  },
               }
            );

            // Test the connection
            await this.sequelize.authenticate();

            console.log('✅ Database connection established successfully');

            // Gradually increase pool size after successful connection
            await this.optimizePoolSize();

            this.initialized = true;
            return this.sequelize;
         } catch (error) {
            console.error(`❌ Connection attempt ${attempt} failed:`, error.message);

            if (this.sequelize) {
               try {
                  await this.sequelize.close();
               } catch (closeError) {
                  console.error('Error closing failed connection:', closeError.message);
               }
               this.sequelize = null;
            }

            // If this was the last attempt, throw the error
            if (attempt === this.maxRetries) {
               throw new Error(
                  `Failed to connect to database after ${this.maxRetries} attempts. Last error: ${error.message}`
               );
            }
         }
      }
   }

   async optimizePoolSize() {
      try {
         // Test if we can safely increase pool size
         console.log('🔧 Optimizing connection pool size...');

         // Close the initial minimal connection
         await this.sequelize.close();

         // Recreate with optimized pool
         this.sequelize = new Sequelize(
            config.database.connection.database,
            config.database.connection.username,
            config.database.connection.password,
            {
               host: config.database.connection.host,
               port: config.database.connection.port,
               dialect: config.database.connection.dialect,
               logging: config.database.logging,
               pool: config.database.pool, // Use configured pool settings
               retry: config.database.retry,
               dialectOptions: {
                  connectTimeout: 30000,
                  acquireTimeout: 30000,
                  timeout: 30000,
               },
            }
         );

         await this.sequelize.authenticate();
         console.log('✅ Pool size optimized successfully');
      } catch (error) {
         console.warn('⚠️ Could not optimize pool size, continuing with minimal pool:', error.message);
         // Continue with minimal pool if optimization fails
      }
   }

   async getInstance() {
      if (!this.initialized) {
         await this.initialize();
      }
      return this.sequelize;
   }

   async gracefulShutdown() {
      if (this.sequelize) {
         console.log('🔌 Closing database connections...');
         await this.sequelize.close();
         this.initialized = false;
      }
   }

   sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
   }
}

// Create singleton instance
const dbManager = new DatabaseManager();

// Handle process termination
process.on('SIGINT', async () => {
   await dbManager.gracefulShutdown();
   process.exit(0);
});

process.on('SIGTERM', async () => {
   await dbManager.gracefulShutdown();
   process.exit(0);
});

module.exports = dbManager.getInstance();
