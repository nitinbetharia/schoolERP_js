const { Sequelize } = require('sequelize');
const { logger, logDB, logError, logSystem } = require('../utils/logger');
const appConfig = require('../config/app-config.json');
const { DatabaseError } = require('../utils/errors');
require('dotenv').config();

/**
 * Multi-tenant database connection manager
 * Handles system database and dynamic tenant database connections
 */
function createDatabaseManager() {
   const systemDB = null;
   const tenantConnections = new Map();
   const connectionPool = appConfig.database.pool;

   /**
    * Initialize system database connection
    */
   async function initializeSystemDB() {
      try {
         logSystem('Initializing system database connection');

         const config = {
            host: appConfig.database.connection.host,
            port: appConfig.database.connection.port,
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: appConfig.database.system.name,
            dialect: 'mysql',
            timezone: appConfig.database.connection.timezone,
            dialectOptions: {
               charset: appConfig.database.system.charset,
               connectTimeout: appConfig.database.connection.connectTimeout,
               ssl: appConfig.database.connection.ssl
                  ? {
                       require: true,
                       rejectUnauthorized: false,
                    }
                  : false,
            },
            pool: {
               max: connectionPool.max,
               min: connectionPool.min,
               acquire: connectionPool.acquire,
               idle: connectionPool.idle,
            },
            logging: (msg) => logDB(msg),
            define: {
               underscored: true,
               freezeTableName: true,
            },
         };

         const systemDBConnection = new Sequelize(config);

         // Test connection
         await systemDBConnection.authenticate();
         logSystem('System database connection established successfully');

         return systemDBConnection;
      } catch (error) {
         logError(error, { context: 'initializeSystemDB' });
         throw new DatabaseError('Failed to initialize system database', error);
      }
   }

   /**
    * Get tenant database connection
    */
   async function getTenantDB(tenantCode) {
      try {
         // Check if connection already exists
         if (this.tenantConnections.has(tenantCode)) {
            const connection = this.tenantConnections.get(tenantCode);
            // Test if connection is still alive
            try {
               await connection.authenticate();
               return connection;
            } catch (testError) {
               // Connection is dead, remove it and create new one
               logSystem(`Tenant DB connection for ${tenantCode} is dead, recreating...`);
               this.tenantConnections.delete(tenantCode);
            }
         }

         // Create new connection
         const tenantDbName = `${appConfig.database.tenant.prefix}${tenantCode}`;

         const config = {
            host: appConfig.database.connection.host,
            port: appConfig.database.connection.port,
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: tenantDbName,
            dialect: 'mysql',
            timezone: appConfig.database.connection.timezone,
            dialectOptions: {
               charset: appConfig.database.tenant.charset,
               connectTimeout: appConfig.database.connection.connectTimeout,
               ssl: appConfig.database.connection.ssl
                  ? {
                       require: true,
                       rejectUnauthorized: false,
                    }
                  : false,
            },
            pool: {
               max: this.connectionPool.max,
               min: this.connectionPool.min,
               acquire: this.connectionPool.acquire,
               idle: this.connectionPool.idle,
            },
            logging: (msg) => logDB(msg, { tenantCode }),
            define: {
               underscored: true,
               freezeTableName: true,
            },
         };

         const tenantDB = new Sequelize(config);

         // Test connection
         await tenantDB.authenticate();
         logDB(`Tenant database connection established for: ${tenantCode}`);

         // Cache connection
         this.tenantConnections.set(tenantCode, tenantDB);

         return tenantDB;
      } catch (error) {
         logError(error, { context: 'getTenantDB', tenantCode });
         throw new DatabaseError(`Failed to connect to tenant database: ${tenantCode}`, error);
      }
   }

   /**
    * Create tenant database if it doesn't exist
    */
   async function createTenantDatabase(tenantCode) {
      try {
         logSystem(`Creating new tenant database for: ${tenantCode}`);

         const tenantDbName = `${appConfig.database.tenant.prefix}${tenantCode}`;

         // Use system connection to create tenant database
         const systemDB = await this.getSystemDB();

         await systemDB.query(`CREATE DATABASE IF NOT EXISTS \`${tenantDbName}\` 
                              CHARACTER SET ${appConfig.database.tenant.charset} 
                              COLLATE ${appConfig.database.tenant.collation}`);

         logSystem(`Tenant database created successfully: ${tenantDbName}`);

         return true;
      } catch (error) {
         logError(error, { context: 'createTenantDatabase', tenantCode });
         throw new DatabaseError(`Failed to create tenant database: ${tenantCode}`, error);
      }
   }

   /**
    * Get system database connection
    */
   async function getSystemDB() {
      if (!this.systemDB) {
         await this.initializeSystemDB();
      }
      return this.systemDB;
   }

   /**
    * Check if tenant database exists
    */
   async function tenantDatabaseExists(tenantCode) {
      try {
         const tenantDbName = `${appConfig.database.tenant.prefix}${tenantCode}`;
         const systemDB = await this.getSystemDB();

         const [results] = await systemDB.query(
            'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
            { replacements: [tenantDbName] }
         );

         return results.length > 0;
      } catch (error) {
         logError(error, { context: 'tenantDatabaseExists', tenantCode });
         return false;
      }
   }

   /**
    * Close all database connections
    */
   async function closeAllConnections() {
      try {
         // Close tenant connections
         for (const [tenantCode, connection] of this.tenantConnections) {
            try {
               await connection.close();
               logSystem(`Closed tenant database connection: ${tenantCode}`);
            } catch (error) {
               logError(error, { context: 'closeAllConnections', tenantCode });
            }
         }
         this.tenantConnections.clear();

         // Close system connection
         if (this.systemDB) {
            await this.systemDB.close();
            logSystem('Closed system database connection');
            this.systemDB = null;
         }
      } catch (error) {
         logError(error, { context: 'closeAllConnections' });
      }
   }

   /**
    * Database health check
    */
   async function healthCheck() {
      const health = {
         systemDB: false,
         tenantConnections: 0,
         activeTenants: [],
      };

      try {
         // Check system DB
         if (this.systemDB) {
            await this.systemDB.authenticate();
            health.systemDB = true;
         }

         // Check tenant connections
         health.tenantConnections = this.tenantConnections.size;
         health.activeTenants = Array.from(this.tenantConnections.keys());

         return health;
      } catch (error) {
         logError(error, { context: 'healthCheck' });
         return health;
      }
   }

   return {
      initializeSystemDB,
      getTenantDB,
      createTenantDatabase,
      getSystemDB,
      tenantDatabaseExists,
      closeAllConnections,
      healthCheck,
   };
}

// Create singleton instance
const dbManager = new createDatabaseManager();

module.exports = {
   DatabaseManager: createDatabaseManager,
   dbManager,
};
