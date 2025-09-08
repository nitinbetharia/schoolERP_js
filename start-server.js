#!/usr/bin/env node

/**
 * School ERP Server Startup Script with Pre-flight Checks
 * This script performs database connectivity tests before starting the main server
 */

require('dotenv').config();

const { Sequelize } = require('sequelize');
const appConfig = require('./config/app-config.json');
const net = require('net');

// Colors for console output
const colors = {
   reset: '\x1b[0m',
   red: '\x1b[31m',
   green: '\x1b[32m',
   yellow: '\x1b[33m',
   blue: '\x1b[34m',
   magenta: '\x1b[35m',
   cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
   console.log(`${color}${message}${colors.reset}`);
}

/**
 * Test network connectivity to database server
 */
function testNetworkConnectivity() {
   return new Promise((resolve, reject) => {
      const host = appConfig.database.connection.host;
      const port = appConfig.database.connection.port;

      log(`🔍 Testing network connectivity to ${host}:${port}...`, colors.cyan);

      const socket = new net.Socket();
      socket.setTimeout(10000);

      socket.on('connect', () => {
         log('✅ Network connection successful - MySQL server is reachable', colors.green);
         socket.destroy();
         resolve();
      });

      socket.on('timeout', () => {
         socket.destroy();
         reject(new Error('Network connection timeout - MySQL server may be unreachable'));
      });

      socket.on('error', (error) => {
         reject(error);
      });

      socket.connect(port, host);
   });
}

/**
 * Test database authentication and basic query
 */
function testDatabaseConnection() {
   return new Promise(async (resolve, reject) => {
      let sequelize;

      try {
         log('🔍 Testing database authentication...', colors.cyan);

         sequelize = new Sequelize({
            host: appConfig.database.connection.host,
            port: appConfig.database.connection.port,
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: appConfig.database.system.name,
            dialect: 'mysql',
            dialectOptions: {
               connectTimeout: 10000,
               acquireTimeout: 10000,
            },
            pool: {
               max: 2,
               min: 0,
               acquire: 10000,
               idle: 10000,
            },
            logging: false,
         });

         // Test authentication with timeout
         const authPromise = sequelize.authenticate();
         const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Authentication timeout after 15 seconds')), 15000)
         );

         await Promise.race([authPromise, timeoutPromise]);
         log('✅ Database authentication successful', colors.green);

         // Test basic query
         const [results] = await sequelize.query('SELECT 1 as test, NOW() as current_time');
         log(`✅ Database query successful: ${JSON.stringify(results[0])}`, colors.green);

         resolve();
      } catch (error) {
         reject(error);
      } finally {
         if (sequelize) {
            try {
               await sequelize.close();
            } catch {
               // Ignore close errors
            }
         }
      }
   });
}

/**
 * Validate environment variables
 */
function validateEnvironment() {
   log('🔍 Validating environment variables...', colors.cyan);

   const required = ['DB_USER', 'DB_PASSWORD', 'SESSION_SECRET', 'NODE_ENV'];
   const missing = required.filter((var_name) => !process.env[var_name]);

   if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
   }

   log('✅ All required environment variables are present', colors.green);

   // Log configuration (without sensitive data)
   log(`🔧 Database Host: ${appConfig.database.connection.host}`, colors.blue);
   log(`🔧 Database Port: ${appConfig.database.connection.port}`, colors.blue);
   log(`🔧 Database Name: ${appConfig.database.system.name}`, colors.blue);
   log(`🔧 Database User: ${process.env.DB_USER}`, colors.blue);
   log(`🔧 Environment: ${process.env.NODE_ENV}`, colors.blue);
}

/**
 * Run all pre-flight checks
 */
async function runPreflightChecks() {
   try {
      log('🚀 School ERP Server - Pre-flight Checks', colors.magenta);
      log('='.repeat(50), colors.magenta);

      // 1. Validate environment
      validateEnvironment();

      // 2. Test network connectivity
      await testNetworkConnectivity();

      // 3. Test database connection
      await testDatabaseConnection();

      log('='.repeat(50), colors.green);
      log('✅ All pre-flight checks passed successfully!', colors.green);
      log('🚀 Starting School ERP Server...', colors.green);
      log('='.repeat(50), colors.green);

      return true;
   } catch (error) {
      log('='.repeat(50), colors.red);
      log('❌ Pre-flight checks failed!', colors.red);
      log(`Error: ${error.message}`, colors.red);

      if (error.code) {
         log(`Error Code: ${error.code}`, colors.red);
      }

      log('\n💡 Troubleshooting suggestions:', colors.yellow);

      if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
         log('   - Check network connectivity to database server', colors.yellow);
         log('   - Verify database server is running', colors.yellow);
         log('   - Check firewall settings', colors.yellow);
      } else if (error.code === 'ECONNREFUSED') {
         log('   - Ensure MySQL server is running', colors.yellow);
         log('   - Verify the database port is correct', colors.yellow);
      } else if (error.code === 'ENOTFOUND') {
         log('   - Check the database host address', colors.yellow);
         log('   - Verify DNS resolution', colors.yellow);
      } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
         log('   - Verify database username and password', colors.yellow);
         log('   - Check user permissions in MySQL', colors.yellow);
      }

      log('='.repeat(50), colors.red);
      return false;
   }
}

/**
 * Start the main server
 */
function startServer() {
   const SchoolERPServer = require('./server');
   const server = new SchoolERPServer();
   server.start();
}

/**
 * Main execution
 */
async function main() {
   const checksPass = await runPreflightChecks();

   if (checksPass) {
      startServer();
   } else {
      process.exit(1);
   }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
   log(`❌ Unhandled Rejection at: ${promise}, reason: ${reason}`, colors.red);
   process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
   log(`❌ Uncaught Exception: ${error.message}`, colors.red);
   process.exit(1);
});

// Run main function
if (require.main === module) {
   main();
}
