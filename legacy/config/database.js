/**
 * Bulletproof Database Configuration
 * Includes connection pooling, safety wrappers, and automatic recovery
 */

const mysql = require('mysql2/promise');
const logger = require('./logger');
const config = require('./index');

class Database {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000; // 5 seconds
    
    this.init();
  }

  /**
   * Initialize database connection pool
   */
  async init() {
    try {
      const dbConfig = config.getDatabase();
      
      this.pool = mysql.createPool({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.name,
        waitForConnections: true,
        connectionLimit: dbConfig.connectionLimit,
        queueLimit: 0,
        acquireTimeout: dbConfig.acquireTimeout,
        timeout: dbConfig.timeout,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        // Automatically handle disconnections
        reconnect: dbConfig.reconnect,
        // Security settings
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

      // Test initial connection
      await this.testConnection();
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      logger.info('Database connected successfully', {
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        connectionLimit: 10
      });

      // Set up connection monitoring
      this.monitorConnection();

    } catch (error) {
      logger.error('Database initialization failed', {
        error: error.message,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME
      });
      
      // Schedule reconnection attempt
      this.scheduleReconnect();
    }
  }

  /**
   * Test database connection
   */
  async testConnection() {
    const connection = await this.pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  }

  /**
   * Monitor connection health and handle reconnection
   */
  monitorConnection() {
    setInterval(async () => {
      try {
        await this.testConnection();
        if (!this.isConnected) {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          logger.info('Database connection restored');
        }
      } catch (error) {
        if (this.isConnected) {
          this.isConnected = false;
          logger.error('Database connection lost', { error: error.message });
          this.scheduleReconnect();
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached', {
        attempts: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts; // Exponential backoff

    logger.info('Scheduling database reconnection', {
      attempt: this.reconnectAttempts,
      delay: delay,
      maxAttempts: this.maxReconnectAttempts
    });

    setTimeout(() => {
      this.init();
    }, delay);
  }

  /**
   * Execute a query with comprehensive error handling and logging
   */
  async query(sql, params = []) {
    const startTime = Date.now();
    const queryId = Math.random().toString(36).substr(2, 9);
    
    try {
      // Log query execution (without sensitive data)
      logger.debug('Database query started', {
        queryId,
        sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
        paramCount: params.length
      });

      if (!this.isConnected) {
        throw new Error('Database connection not available');
      }

      const [rows, fields] = await this.pool.execute(sql, params);
      
      const duration = Date.now() - startTime;
      logger.debug('Database query completed', {
        queryId,
        duration,
        rowCount: Array.isArray(rows) ? rows.length : 1
      });

      return rows;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Database query failed', {
        queryId,
        sql: sql.substring(0, 100),
        paramCount: params.length,
        duration,
        error: error.message,
        code: error.code,
        sqlState: error.sqlState
      });

      // Check if error is recoverable
      if (this.isRecoverableError(error)) {
        logger.warn('Attempting query retry', { queryId });
        
        // Wait and retry once
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          const [rows] = await this.pool.execute(sql, params);
          logger.info('Query retry successful', { queryId });
          return rows;
        } catch (retryError) {
          logger.error('Query retry failed', { 
            queryId, 
            retryError: retryError.message 
          });
          throw retryError;
        }
      }

      // Transform database errors into user-friendly messages
      throw this.transformError(error);
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction(callback) {
    const connection = await this.pool.getConnection();
    const transactionId = Math.random().toString(36).substr(2, 9);
    
    try {
      logger.debug('Transaction started', { transactionId });
      
      await connection.beginTransaction();
      
      // Provide a safe query function for the transaction
      const transactionQuery = async (sql, params = []) => {
        const [rows] = await connection.execute(sql, params);
        return rows;
      };
      
      const result = await callback(transactionQuery);
      
      await connection.commit();
      
      logger.debug('Transaction committed', { transactionId });
      return result;
      
    } catch (error) {
      await connection.rollback();
      
      logger.error('Transaction rolled back', {
        transactionId,
        error: error.message
      });
      
      throw this.transformError(error);
      
    } finally {
      connection.release();
    }
  }

  /**
   * Check if database error is recoverable
   */
  isRecoverableError(error) {
    const recoverableCodes = [
      'ECONNRESET',
      'ETIMEDOUT',
      'PROTOCOL_CONNECTION_LOST',
      'ER_LOCK_WAIT_TIMEOUT',
      'ER_LOCK_DEADLOCK'
    ];
    
    return recoverableCodes.some(code => 
      error.code === code || error.message.includes(code)
    );
  }

  /**
   * Transform database errors into user-friendly messages
   */
  transformError(error) {
    const transformedError = new Error();
    transformedError.originalError = error;
    
    switch (error.code) {
      case 'ER_DUP_ENTRY':
        transformedError.message = 'This record already exists';
        transformedError.code = 'DUPLICATE_ENTRY';
        break;
        
      case 'ER_NO_REFERENCED_ROW_2':
        transformedError.message = 'Referenced record does not exist';
        transformedError.code = 'INVALID_REFERENCE';
        break;
        
      case 'ER_ROW_IS_REFERENCED_2':
        transformedError.message = 'Cannot delete record - it is being used elsewhere';
        transformedError.code = 'RECORD_IN_USE';
        break;
        
      case 'ER_DATA_TOO_LONG':
        transformedError.message = 'Data is too long for the field';
        transformedError.code = 'DATA_TOO_LONG';
        break;
        
      case 'ER_BAD_NULL_ERROR':
        transformedError.message = 'Required field cannot be empty';
        transformedError.code = 'REQUIRED_FIELD_EMPTY';
        break;
        
      case 'ER_LOCK_WAIT_TIMEOUT':
        transformedError.message = 'Operation timed out - please try again';
        transformedError.code = 'OPERATION_TIMEOUT';
        break;
        
      default:
        transformedError.message = 'Database operation failed';
        transformedError.code = 'DATABASE_ERROR';
    }
    
    return transformedError;
  }

  /**
   * Get database health status
   */
  async getHealthStatus() {
    try {
      const connection = await this.pool.getConnection();
      const startTime = Date.now();
      
      await connection.ping();
      
      const responseTime = Date.now() - startTime;
      connection.release();
      
      const poolStatus = {
        totalConnections: this.pool.pool._allConnections.length,
        freeConnections: this.pool.pool._freeConnections.length,
        acquiringConnections: this.pool.pool._acquiringConnections.length
      };
      
      return {
        status: 'healthy',
        responseTime,
        isConnected: this.isConnected,
        reconnectAttempts: this.reconnectAttempts,
        pool: poolStatus
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        isConnected: this.isConnected,
        reconnectAttempts: this.reconnectAttempts
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async close() {
    try {
      if (this.pool) {
        await this.pool.end();
        logger.info('Database connection pool closed');
      }
    } catch (error) {
      logger.error('Error closing database connection', { error: error.message });
    }
  }
}

// Create single instance
const database = new Database();

module.exports = database;