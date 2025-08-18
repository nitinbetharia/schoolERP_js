/**
 * Database Utility for Scripts
 * Standardized database connection and operations for all database scripts
 */

const mysql = require('mysql2/promise');
const config = require('../config');
const logger = require('../config/logger');

class DatabaseUtil {
  constructor() {
    this.connections = new Map();
  }

  /**
   * Get database connection configuration
   */
  getConnectionConfig(dbName = null) {
    const dbConfig = config.getDatabase();
    return {
      host: dbConfig.connection?.host || dbConfig.host || 'localhost',
      port: dbConfig.connection?.port || dbConfig.port || 3306,
      user: dbConfig.connection?.user || dbConfig.user || 'root',
      password: dbConfig.connection?.password || dbConfig.password || '',
      database: dbName,
      charset: dbConfig.system?.charset || 'utf8mb4',
      timezone: '+00:00',
      connectTimeout: 60000,
      acquireTimeout: 60000,
      timeout: 60000
    };
  }

  /**
   * Create connection to system database
   */
  async getSystemConnection() {
    const systemDbName = config.getSystemDbName();
    const connectionConfig = this.getConnectionConfig(systemDbName);

    try {
      const connection = await mysql.createConnection(connectionConfig);
      logger.info(`Connected to system database: ${systemDbName}`);
      return connection;
    } catch (error) {
      logger.error(`Failed to connect to system database: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create connection to trust database
   */
  async getTrustConnection(trustCode) {
    if (!trustCode) {
      throw new Error('Trust code is required for trust database connection');
    }

    const trustDbName = config.getTrustDbName(trustCode);
    const connectionConfig = this.getConnectionConfig(trustDbName);

    try {
      const connection = await mysql.createConnection(connectionConfig);
      logger.info(`Connected to trust database: ${trustDbName}`);
      return connection;
    } catch (error) {
      logger.error(`Failed to connect to trust database: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create connection without specifying database (for database creation)
   */
  async getRootConnection() {
    const connectionConfig = this.getConnectionConfig();
    delete connectionConfig.database; // Remove database from config

    try {
      const connection = await mysql.createConnection(connectionConfig);
      logger.info('Connected to MySQL server (root connection)');
      return connection;
    } catch (error) {
      logger.error(`Failed to connect to MySQL server: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if database exists
   */
  async databaseExists(dbName) {
    const connection = await this.getRootConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
        [dbName]
      );
      return rows.length > 0;
    } finally {
      await connection.end();
    }
  }

  /**
   * Create database if it doesn't exist
   */
  async createDatabase(dbName, charset = 'utf8mb4', collation = 'utf8mb4_unicode_ci') {
    const connection = await this.getRootConnection();
    try {
      await connection.execute(
        `CREATE DATABASE IF NOT EXISTS \`${dbName}\` 
         CHARACTER SET ${charset} 
         COLLATE ${collation}`
      );
      logger.info(`Database created/verified: ${dbName}`);
    } finally {
      await connection.end();
    }
  }

  /**
   * Drop database if it exists
   */
  async dropDatabase(dbName) {
    const connection = await this.getRootConnection();
    try {
      await connection.execute(`DROP DATABASE IF EXISTS \`${dbName}\``);
      logger.info(`Database dropped: ${dbName}`);
    } finally {
      await connection.end();
    }
  }

  /**
   * List all databases matching a pattern
   */
  async listDatabases(pattern = null) {
    const connection = await this.getRootConnection();
    try {
      let query = 'SELECT SCHEMA_NAME as database_name FROM INFORMATION_SCHEMA.SCHEMATA';
      const params = [];

      if (pattern) {
        query += ' WHERE SCHEMA_NAME LIKE ?';
        params.push(pattern.replace('*', '%'));
      }

      query += ' ORDER BY SCHEMA_NAME';

      const [rows] = await connection.execute(query, params);
      return rows.map(row => row.database_name);
    } finally {
      await connection.end();
    }
  }

  /**
   * List all trust databases
   */
  async listTrustDatabases() {
    const trustPrefix = config.getTrustDbPrefix();
    return await this.listDatabases(`${trustPrefix}%`);
  }

  /**
   * Execute SQL file
   */
  async executeSqlFile(connection, filePath) {
    const fs = require('fs').promises;
    const path = require('path');

    try {
      const sqlContent = await fs.readFile(filePath, 'utf8');
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      for (const statement of statements) {
        if (statement.trim()) {
          await connection.execute(statement);
        }
      }

      logger.info(`Executed SQL file: ${path.basename(filePath)}`);
    } catch (error) {
      logger.error(`Failed to execute SQL file ${filePath}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if table exists
   */
  async tableExists(connection, tableName) {
    try {
      const [rows] = await connection.execute(
        'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
        [tableName]
      );
      return rows.length > 0;
    } catch (error) {
      logger.error(`Failed to check table existence: ${error.message}`);
      return false;
    }
  }

  /**
   * Get database size
   */
  async getDatabaseSize(dbName) {
    const connection = await this.getRootConnection();
    try {
      const [rows] = await connection.execute(
        `
        SELECT 
          ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
        FROM information_schema.tables 
        WHERE table_schema = ?
      `,
        [dbName]
      );

      return rows[0]?.size_mb || 0;
    } finally {
      await connection.end();
    }
  }

  /**
   * Backup database to SQL file
   */
  async backupDatabase(dbName, backupPath) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    const dbConfig = config.getDatabase();
    const host = dbConfig.connection?.host || 'localhost';
    const port = dbConfig.connection?.port || 3306;
    const user = dbConfig.connection?.user || 'root';
    const password = dbConfig.connection?.password || '';

    const command = `mysqldump -h ${host} -P ${port} -u ${user} ${password ? `-p${password}` : ''} ${dbName} > "${backupPath}"`;

    try {
      await execAsync(command);
      logger.info(`Database backup created: ${backupPath}`);
    } catch (error) {
      logger.error(`Database backup failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all database names from config
   */
  getConfiguredDatabaseNames() {
    return {
      system: config.getSystemDbName(),
      trustPrefix: config.getTrustDbPrefix(),
      getAllTrustNames: async () => await this.listTrustDatabases()
    };
  }
}

module.exports = new DatabaseUtil();
