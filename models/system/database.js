const { Sequelize } = require('sequelize');
const { logDB, logError, logSystem } = require('../../utils/logger');
const appConfig = require('../../config/app-config.json');
// Simple database error class
class DatabaseError extends Error {
   constructor(message, originalError = null) {
      super(message);
      this.name = 'DatabaseError';
      this.originalError = originalError;
   }
}
const { withCriticalRetry, withSequelizeRetry, healthCheckWithRetry } = require('../../utils/databaseRetry');
require('dotenv').config();

/**
 * Multi-tenant database connection manager
 * Handles system database and dynamic tenant database connections
 */
function createDatabaseManager() {
   let systemDB = null;
   const tenantConnections = new Map();
   const connectionPool = appConfig.database.pool;

   // Connection cleanup interval (every 5 minutes)
   const CLEANUP_INTERVAL = 5 * 60 * 1000;
   let cleanupTimer = null;

   /**
    * Start periodic connection cleanup to prevent pool exhaustion
    */
   function startConnectionCleanup() {
      if (cleanupTimer) {
         clearInterval(cleanupTimer);
      }

      cleanupTimer = setInterval(async () => {
         try {
            await cleanupIdleConnections();
         } catch (error) {
            logError(error, { context: 'startConnectionCleanup' });
         }
      }, CLEANUP_INTERVAL);

      logSystem('Started periodic connection cleanup');
   }

   /**
    * Cleanup idle tenant connections to prevent pool exhaustion
    */
   async function cleanupIdleConnections() {
      const now = Date.now();
      const idleThreshold = connectionPool.idle || 10000;

      for (const [tenantCode, connection] of tenantConnections) {
         try {
            // Check if connection is still active
            await connection.authenticate();

            // Check if connection has been idle too long
            const lastUsed = connection._lastUsed || connection._created || now;
            if (now - lastUsed > idleThreshold) {
               await connection.close();
               tenantConnections.delete(tenantCode);
               logSystem(`Closed idle tenant connection: ${tenantCode}`);
            }
         } catch (_error) {
            // Connection is dead, remove it
            tenantConnections.delete(tenantCode);
            logSystem(`Removed dead tenant connection: ${tenantCode}`);
         }
      }
   }

   /**
    * Initialize system database connection with retry logic and timeout
    */
   async function initializeSystemDB() {
      try {
         return await withCriticalRetry(
            async () => {
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
                     connectTimeout: 10000, // 10 second connection timeout
                     acquireTimeout: 10000, // 10 second acquire timeout
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
                     acquire: 10000, // 10 second acquire timeout
                     idle: connectionPool.idle,
                     evict: connectionPool.evict || 5000,
                     handleDisconnects: connectionPool.handleDisconnects || true,
                  },
                  logging: (msg) => logDB(msg),
                  define: {
                     underscored: true,
                     freezeTableName: true,
                  },
               };

               systemDB = new Sequelize(config);

               // Test connection with explicit timeout
               const authPromise = systemDB.authenticate();
               const timeoutPromise = new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('Database authentication timeout')), 15000)
               );

               await Promise.race([authPromise, timeoutPromise]);
               logSystem('System database connection established successfully');

               // Start connection cleanup
               startConnectionCleanup();

               return systemDB;
            },
            {
               operation: 'initializeSystemDB',
               context: 'system_database_initialization',
               timeout: 25000, // 25 second overall timeout
            }
         );
      } catch (error) {
         logSystem(`Failed to initialize system database: ${error.message}`);
         throw new Error(`Database initialization failed: ${error.message}`);
      }
   }

   /**
    * Get tenant database connection
    */
   async function getTenantDB(tenantCode) {
      try {
         // Check if connection already exists
         if (tenantConnections.has(tenantCode)) {
            const connection = tenantConnections.get(tenantCode);
            // Test if connection is still alive
            try {
               await connection.authenticate();
               // Update last used timestamp
               connection._lastUsed = Date.now();
               return connection;
            } catch (_testError) {
               // Connection is dead, remove it and create new one
               logSystem(`Tenant DB connection for ${tenantCode} is dead, recreating...`);
               tenantConnections.delete(tenantCode);
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
               max: connectionPool.max,
               min: connectionPool.min,
               acquire: connectionPool.acquire,
               idle: connectionPool.idle,
               evict: connectionPool.evict || 5000,
               handleDisconnects: connectionPool.handleDisconnects || true,
            },
            logging: (msg) => logDB(msg, { tenantCode }),
            define: {
               underscored: true,
               freezeTableName: true,
            },
         };

         const tenantDB = new Sequelize(config);

         // Test connection with retry for tenant databases
         await withSequelizeRetry(
            async () => {
               return await tenantDB.authenticate();
            },
            {
               operation: 'tenant_db_authenticate',
               tenantCode,
               context: 'tenant_database_connection',
            }
         );

         logDB(`Tenant database connection established for: ${tenantCode}`);

         // Cache connection with timestamp
         tenantDB._created = Date.now();
         tenantDB._lastUsed = Date.now();
         tenantConnections.set(tenantCode, tenantDB);

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
         const sysDB = await getSystemDB();

         await sysDB.query(`CREATE DATABASE IF NOT EXISTS \`${tenantDbName}\` 
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
      if (!systemDB) {
         await initializeSystemDB();
      }
      return systemDB;
   }

   /**
    * Get tenant models for a specific tenant
    */
   async function getTenantModels(tenantCode) {
      try {
         const tenantDB = await getTenantDB(tenantCode);

         // Import and initialize tenant models
         const { defineTenantUserModel } = require('./TenantUser');

         const User = defineTenantUserModel(tenantDB);

         return {
            User,
            sequelize: tenantDB,
         };
      } catch (error) {
         logError(error, { context: 'getTenantModels', tenantCode });
         throw new DatabaseError(`Failed to initialize tenant models: ${tenantCode}`, error);
      }
   }

   /**
    * Check if tenant database exists
    */
   async function tenantDatabaseExists(tenantCode) {
      try {
         const tenantDbName = `${appConfig.database.tenant.prefix}${tenantCode}`;
         const sysDB = await getSystemDB();

         const [results] = await sysDB.query(
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
         // Stop cleanup timer
         if (cleanupTimer) {
            clearInterval(cleanupTimer);
            cleanupTimer = null;
         }

         // Close tenant connections
         for (const [tenantCode, connection] of tenantConnections) {
            try {
               await connection.close();
               logSystem(`Closed tenant database connection: ${tenantCode}`);
            } catch (error) {
               logError(error, { context: 'closeAllConnections', tenantCode });
            }
         }
         tenantConnections.clear();

         // Close system connection
         if (systemDB) {
            await systemDB.close();
            logSystem('Closed system database connection');
            systemDB = null;
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
         connectionPoolStatus: {
            system: null,
            tenants: [],
         },
      };

      try {
         // Check system DB with retry
         if (systemDB) {
            await healthCheckWithRetry(
               async () => {
                  return await systemDB.authenticate();
               },
               {
                  operation: 'system_db_health_check',
                  context: 'database_health_monitoring',
               }
            );
            health.systemDB = true;
            health.connectionPoolStatus.system = {
               pool: systemDB.connectionManager?.pool?.config || null,
               used: systemDB.connectionManager?.pool?._allConnections?.length || 0,
            };
         }

         // Check tenant connections
         health.tenantConnections = tenantConnections.size;
         health.activeTenants = Array.from(tenantConnections.keys());

         for (const [tenantCode, connection] of tenantConnections) {
            health.connectionPoolStatus.tenants.push({
               tenant: tenantCode,
               pool: connection.connectionManager?.pool?.config || null,
               used: connection.connectionManager?.pool?._allConnections?.length || 0,
               lastUsed: connection._lastUsed || connection._created || null,
            });
         }

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
      getTenantModels,
      tenantDatabaseExists,
      closeAllConnections,
      healthCheck,
      cleanupIdleConnections,
      startConnectionCleanup,
   };
}

// Create singleton instance
const dbManager = createDatabaseManager();

/**
 * Initialize system models - moved from models/index.js
 * This function initializes core system models needed for application startup
 */
async function initializeSystemModels() {
   try {
      logSystem('Initializing system models...');

      // Get system database connection
      const systemDB = await dbManager.getSystemDB();

      // Import and initialize core system models
      const { defineTrustModel } = require('../tenant/Trust');
      const { defineSystemUserModel, defineSystemAuditLogModel } = require('./SystemUser');

      const Trust = defineTrustModel(systemDB);
      const SystemUser = defineSystemUserModel(systemDB);
      const SystemAuditLog = defineSystemAuditLogModel(systemDB);

      // Set up basic associations
      Trust.hasMany(SystemUser, { foreignKey: 'trust_id' });
      SystemUser.belongsTo(Trust, { foreignKey: 'trust_id' });

      logSystem('System models initialized successfully');
      return {
         Trust,
         SystemUser,
         SystemAuditLog,
         success: true,
      };
   } catch (error) {
      logError(error, { context: 'initializeSystemModels' });
      throw error;
   }
}

/**
 * Model health check - moved from models/index.js
 * Provides health information about model initialization status
 */
async function modelHealthCheck() {
   try {
      const dbHealth = await dbManager.healthCheck();

      return {
         database: dbHealth,
         modelsInitialized: true, // Simplified - models are initialized on demand
         systemConnection: dbHealth.systemDB,
         tenantConnections: dbHealth.tenantConnections,
      };
   } catch (error) {
      logError(error, { context: 'modelHealthCheck' });
      return {
         database: null,
         modelsInitialized: false,
         systemConnection: false,
         tenantConnections: 0,
         error: error.message,
      };
   }
}

module.exports = {
   DatabaseManager: createDatabaseManager,
   dbManager,
   initializeSystemModels,
   modelHealthCheck,
};
