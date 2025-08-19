const { Sequelize } = require('sequelize');
const { logger, logDB, logError, logSystem } = require('../utils/logger');
const appConfig = require('../config/app-config.json');
const { DatabaseError } = require('../utils/errors');
require('dotenv').config();

/**
 * Multi-tenant database connection manager
 * Handles system database and dynamic tenant database connections
 */
class DatabaseManager {
   constructor() {
      this.systemDB = null;
      this.tenantConnections = new Map();
      this.connectionPool = appConfig.database.pool;
   }

   /**
    * Initialize system database connection
    */
   async initializeSystemDB() {
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
            pool: this.connectionPool,
            logging: (msg, timing) => {
               logDB('SYSTEM_DB', msg, timing);
            },
            benchmark: true,
            define: {
               underscored: true,
               freezeTableName: true,
               charset: appConfig.database.system.charset,
               collate: appConfig.database.system.collation,
               timestamps: true,
               createdAt: 'created_at',
               updatedAt: 'updated_at',
            },
         };

         this.systemDB = new Sequelize(config);

         // Test connection
         await this.systemDB.authenticate();
         logSystem('System database connection established successfully');

         return this.systemDB;
      } catch (error) {
         logError(error, { context: 'initializeSystemDB' });
         throw new DatabaseError('Failed to initialize system database', error);
      }
   }

   /**
    * Get or create tenant database connection
    */
   async getTenantDB(tenantCode) {
      try {
         // Check if connection already exists
         if (this.tenantConnections.has(tenantCode)) {
            const connection = this.tenantConnections.get(tenantCode);
            // Test if connection is still alive
            try {
               await connection.authenticate();
               return connection;
            } catch (error) {
               // Connection is dead, remove it and create new one
               logSystem(`Tenant DB connection for ${tenantCode} is dead, recreating`, { tenantCode });
               this.tenantConnections.delete(tenantCode);
            }
         }

         logSystem(`Creating new tenant database connection for: ${tenantCode}`);

         const tenantDBName = `${appConfig.database.tenant.prefix}${tenantCode}`;

         const config = {
            host: appConfig.database.connection.host,
            port: appConfig.database.connection.port,
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: tenantDBName,
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
            pool: this.connectionPool,
            logging: (msg, timing) => {
               logDB(`TENANT_DB_${tenantCode}`, msg, timing);
            },
            benchmark: true,
            define: {
               underscored: true,
               freezeTableName: true,
               charset: appConfig.database.tenant.charset,
               collate: appConfig.database.tenant.collation,
               timestamps: true,
               createdAt: 'created_at',
               updatedAt: 'updated_at',
            },
         };

         const tenantDB = new Sequelize(config);

         // Test connection
         await tenantDB.authenticate();

         // Store connection
         this.tenantConnections.set(tenantCode, tenantDB);

         logSystem(`Tenant database connection established for: ${tenantCode}`);
         return tenantDB;
      } catch (error) {
         logError(error, { context: 'getTenantDB', tenantCode });
         throw new DatabaseError(`Failed to connect to tenant database: ${tenantCode}`, error);
      }
   }

   /**
    * Create new tenant database
    */
   async createTenantDatabase(tenantCode) {
      try {
         logSystem(`Creating new tenant database for: ${tenantCode}`);

         const tenantDBName = `${appConfig.database.tenant.prefix}${tenantCode}`;

         // Use system connection to create new database
         const createDBQuery = `
        CREATE DATABASE IF NOT EXISTS \`${tenantDBName}\`
        CHARACTER SET ${appConfig.database.tenant.charset}
        COLLATE ${appConfig.database.tenant.collation}
      `;

         await this.systemDB.query(createDBQuery);
         logSystem(`Tenant database created successfully: ${tenantDBName}`);

         // Return new connection to the created database
         return await this.getTenantDB(tenantCode);
      } catch (error) {
         logError(error, { context: 'createTenantDatabase', tenantCode });
         throw new DatabaseError(`Failed to create tenant database: ${tenantCode}`, error);
      }
   }

   /**
    * Get system database connection
    */
   getSystemDB() {
      if (!this.systemDB) {
         throw new DatabaseError('System database not initialized');
      }
      return this.systemDB;
   }

   /**
    * Check if tenant database exists
    */
   async tenantDatabaseExists(tenantCode) {
      try {
         const tenantDBName = `${appConfig.database.tenant.prefix}${tenantCode}`;
         const [results] = await this.systemDB.query('SHOW DATABASES LIKE ?', { replacements: [tenantDBName] });

         return results.length > 0;
      } catch (error) {
         logError(error, { context: 'tenantDatabaseExists', tenantCode });
         return false;
      }
   }

   /**
    * Close all database connections
    */
   async closeAllConnections() {
      try {
         logSystem('Closing all database connections');

         // Close tenant connections
         for (const [tenantCode, connection] of this.tenantConnections) {
            await connection.close();
            logSystem(`Closed tenant connection: ${tenantCode}`);
         }
         this.tenantConnections.clear();

         // Close system connection
         if (this.systemDB) {
            await this.systemDB.close();
            logSystem('Closed system database connection');
         }
      } catch (error) {
         logError(error, { context: 'closeAllConnections' });
      }
   }

   /**
    * Health check for database connections
    */
   async healthCheck() {
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
      } catch (error) {
         logError(error, { context: 'healthCheck' });
      }

      return health;
   }
}

// Create singleton instance
const dbManager = new DatabaseManager();

module.exports = {
   DatabaseManager,
   dbManager,
};
