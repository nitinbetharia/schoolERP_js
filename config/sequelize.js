/**
 * Sequelize Configuration - Following Q&A Decisions
 *
 * Q1: Sequelize ORM (not raw mysql2)
 * Q5: Separate databases per tenant
 * Q11: Moderate connection pooling
 * Q16: Snake_case database, camelCase JavaScript
 * Q35: Multiple Sequelize instances (one per tenant database)
 */

const { Sequelize } = require('sequelize');
const logger = require('./logger');
const config = require('./index');
const { TECHNICAL_DECISIONS } = require('./SINGLE_SOURCE_OF_TRUTH');

class SequelizeManager {
  constructor() {
    this.systemSequelize = null;
    this.tenantInstances = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize system database Sequelize instance
   */
  async initSystemDatabase() {
    if (this.systemSequelize) {
      return this.systemSequelize;
    }

    const dbConfig = config.get('database');

    // Q11: Use defined connection pool settings from JSON config
    const poolConfig = dbConfig.pool;

    this.systemSequelize = new Sequelize(
      dbConfig.system.name,
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        host: dbConfig.connection.host,
        port: dbConfig.connection.port,
        dialect: 'mysql',

        // Q11: Moderate connection pooling from JSON config
        pool: poolConfig,

        // Q16: Snake_case database, camelCase JavaScript
        define: {
          underscored: true,
          timestamps: true,
          paranoid: true,
          createdAt: 'created_at',
          updatedAt: 'updated_at',
          deletedAt: 'deleted_at'
        },

        // Logging configuration
        logging: (sql, timing) => {
          logger.debug('SQL Query:', { sql, timing });
        },

        // Connection settings
        dialectOptions: {
          charset: dbConfig.system.charset,
          collate: dbConfig.system.collation,
          timezone: dbConfig.connection.timezone
        },

        // Query configuration
        retry: {
          max: 3
        },

        // Development settings
        benchmark: process.env.NODE_ENV === 'development'
      }
    );

    // Test connection
    try {
      await this.systemSequelize.authenticate();
      logger.info('System database Sequelize connection established successfully');
    } catch (error) {
      logger.error('Unable to connect to system database:', error);
      throw error;
    }

    return this.systemSequelize;
  }

  /**
   * Get or create tenant database Sequelize instance
   * Q5: Separate databases per tenant
   * Q35: Multiple Sequelize instances
   */
  async getTenantSequelize(trustCode) {
    if (!trustCode) {
      throw new Error('Trust code is required for tenant database');
    }

    // Check if instance already exists
    if (this.tenantInstances.has(trustCode)) {
      return this.tenantInstances.get(trustCode);
    }

    const dbConfig = config.get('database');

    // Q5: Database naming convention from JSON config
    const tenantDbName = `${dbConfig.tenant.prefix}${trustCode}`;

    // Q11: Use defined connection pool settings from JSON config
    const poolConfig = dbConfig.pool;

    const tenantSequelize = new Sequelize(
      tenantDbName,
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        host: dbConfig.connection.host,
        port: dbConfig.connection.port,
        dialect: 'mysql',

        // Q11: Moderate connection pooling
        pool: poolConfig,

        // Q16: Snake_case database, camelCase JavaScript
        define: {
          underscored: true,
          timestamps: true,
          paranoid: true,
          createdAt: 'created_at',
          updatedAt: 'updated_at',
          deletedAt: 'deleted_at'
        },

        // Logging configuration
        logging: (sql, timing) => {
          logger.debug(`SQL Query [${trustCode}]:`, { sql, timing });
        },

        // Connection settings
        dialectOptions: {
          charset: dbConfig.tenant.charset,
          collate: dbConfig.tenant.collation,
          timezone: dbConfig.connection.timezone
        },

        // Query configuration
        retry: {
          max: 3
        },

        // Development settings
        benchmark: process.env.NODE_ENV === 'development'
      }
    );

    // Test connection
    try {
      await tenantSequelize.authenticate();
      logger.info(`Tenant database Sequelize connection established: ${tenantDbName}`);
    } catch (error) {
      logger.error(`Unable to connect to tenant database ${tenantDbName}:`, error);
      throw error;
    }

    // Cache the instance
    this.tenantInstances.set(trustCode, tenantSequelize);

    return tenantSequelize;
  }

  /**
   * Initialize all Sequelize instances
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize system database
      await this.initSystemDatabase();

      this.isInitialized = true;
      logger.info('Sequelize Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Sequelize Manager:', error);
      throw error;
    }
  }

  /**
   * Get system database instance
   */
  getSystemSequelize() {
    if (!this.systemSequelize) {
      throw new Error('System Sequelize not initialized. Call initSystemDatabase() first.');
    }
    return this.systemSequelize;
  }

  /**
   * Close all connections
   */
  async closeAll() {
    const promises = [];

    // Close system connection
    if (this.systemSequelize) {
      promises.push(this.systemSequelize.close());
    }

    // Close all tenant connections
    for (const [trustCode, sequelize] of this.tenantInstances) {
      promises.push(sequelize.close());
    }

    await Promise.all(promises);

    this.systemSequelize = null;
    this.tenantInstances.clear();
    this.isInitialized = false;

    logger.info('All Sequelize connections closed');
  }

  /**
   * Get all active tenant instances
   */
  getActiveTenants() {
    return Array.from(this.tenantInstances.keys());
  }

  /**
   * Remove tenant instance (for cleanup)
   */
  async removeTenant(trustCode) {
    if (this.tenantInstances.has(trustCode)) {
      const sequelize = this.tenantInstances.get(trustCode);
      await sequelize.close();
      this.tenantInstances.delete(trustCode);
      logger.info(`Tenant Sequelize instance removed: ${trustCode}`);
    }
  }
}

// Export singleton instance
const sequelizeManager = new SequelizeManager();

module.exports = sequelizeManager;
