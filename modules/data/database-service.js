const mysql = require('mysql2/promise');
const logger = require('../../config/logger');
const appConfig = require('../../config/app-config');

class DatabaseService {
  constructor() {
    this.masterPool = null;
    this.trustPools = new Map();
    this.isInitialized = false;
    this.logger = logger;
  }

  async init() {
    if (this.isInitialized) return;

    try {
      await this.initMaster();
      this.isInitialized = true;
      this.logger.info('Database service initialized');
    } catch (error) {
      this.logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  async initMaster() {
    const dbConfig = appConfig.database;
    const config = {
      host: dbConfig.connection.host,
      port: dbConfig.connection.port,
      user: dbConfig.connection.user,
      password: dbConfig.connection.password,
      database: dbConfig.system.name,
      connectionLimit: dbConfig.system.connectionLimit,
      queueLimit: dbConfig.system.queueLimit,
      charset: dbConfig.system.charset,
      timezone: dbConfig.connection.timezone,
      connectTimeout: dbConfig.connection.connectTimeout,
      multipleStatements: dbConfig.system.multipleStatements,
      ssl: dbConfig.connection.ssl
    };

    this.masterPool = mysql.createPool(config);

    // Test connection
    const connection = await this.masterPool.getConnection();
    await connection.ping();
    connection.release();

    this.logger.info('System database connected', {
      database: dbConfig.system.name,
      host: dbConfig.connection.host,
      port: dbConfig.connection.port
    });
  }

  async initTrust(trustCode) {
    if (this.trustPools.has(trustCode)) return;

    const dbConfig = appConfig.database;
    const config = {
      host: dbConfig.connection.host,
      port: dbConfig.connection.port,
      user: dbConfig.connection.user,
      password: dbConfig.connection.password,
      database: `${dbConfig.trust.prefix}${trustCode}`,
      connectionLimit: dbConfig.trust.connectionLimit,
      queueLimit: dbConfig.trust.queueLimit,
      charset: dbConfig.trust.charset,
      timezone: dbConfig.connection.timezone,
      connectTimeout: dbConfig.connection.connectTimeout,
      multipleStatements: dbConfig.trust.multipleStatements,
      ssl: dbConfig.connection.ssl
    };

    const pool = mysql.createPool(config); // Test connection
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    this.trustPools.set(trustCode, pool);
    this.logger.info('Trust database connected', {
      trustCode,
      database: config.database,
      host: dbConfig.connection.host,
      port: dbConfig.connection.port
    });
  }

  async querySystem(sql, params = []) {
    try {
      const [rows] = await this.masterPool.execute(sql, params);
      return rows;
    } catch (error) {
      this.logger.error('System query failed:', { sql, params, error: error.message });
      throw error;
    }
  }

  async queryTrust(trustCode, sql, params = []) {
    try {
      const pool = this.trustPools.get(trustCode);
      if (!pool) {
        throw new Error(`Trust database not initialized: ${trustCode}`);
      }

      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (error) {
      this.logger.error(`Trust query failed (${trustCode}):`, {
        sql,
        params,
        error: error.message
      });
      throw error;
    }
  }

  async transactionSystem(callback) {
    const connection = await this.masterPool.getConnection();

    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async transactionTrust(trustCode, callback) {
    const pool = this.trustPools.get(trustCode);
    if (!pool) {
      throw new Error(`Trust database not initialized: ${trustCode}`);
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async createDatabase(databaseName) {
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      charset: appConfig.database.master.charset
    });

    try {
      await tempConnection.execute(
        `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET ${appConfig.database.system.charset} COLLATE ${appConfig.database.system.collation}`
      );
      this.logger.info(`Database created: ${databaseName}`);
    } finally {
      await tempConnection.end();
    }
  }

  async healthCheck() {
    const health = {
      system: { status: 'disconnected', error: null },
      trusts: {}
    };

    try {
      const connection = await this.masterPool.getConnection();
      await connection.ping();
      connection.release();
      health.system.status = 'connected';
    } catch (error) {
      this.logger.error('System health check failed:', error);
      health.system.error = error.message;
    }

    for (const [trustCode, pool] of this.trustPools) {
      try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        health.trusts[trustCode] = { status: 'connected', error: null };
      } catch (error) {
        this.logger.error(`Trust health check failed (${trustCode}):`, error);
        health.trusts[trustCode] = { status: 'disconnected', error: error.message };
      }
    }

    return health;
  }

  async close() {
    try {
      if (this.masterPool) {
        await this.masterPool.end();
      }

      for (const [trustCode, pool] of this.trustPools) {
        await pool.end();
      }

      this.trustPools.clear();
      this.isInitialized = false;
      this.logger.info('Database connections closed');
    } catch (error) {
      this.logger.error('Error closing connections:', error);
      throw error;
    }
  }
}

module.exports = new DatabaseService();
