/**
 * Sequelize CLI Configuration
 * Q4: Sequelize CLI with migration files
 * Q30: Automatic migrations in development only
 * Q34: Auto-generation in dev, careful manual control in production
 */

require('dotenv').config();
const config = require('./index');

const dbConfig = config.get('database');

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbConfig.system.name,
    host: dbConfig.connection.host,
    port: dbConfig.connection.port,
    dialect: 'mysql',

    // Q11: Moderate connection pooling from JSON config
    pool: dbConfig.pool,

    // Q16: Snake_case database, camelCase JavaScript
    define: {
      underscored: true,
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at'
    },

    dialectOptions: {
      charset: dbConfig.system.charset,
      collate: dbConfig.system.collation,
      timezone: dbConfig.connection.timezone
    },

    // Migration settings
    migrationStorage: 'sequelize',
    migrationStorageTableName: '_sequelize_migrations',
    seederStorage: 'sequelize',
    seederStorageTableName: '_sequelize_seeders'
  },

  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: dbConfig.system.name,
    host: dbConfig.connection.host,
    port: dbConfig.connection.port,
    dialect: 'mysql',

    // Q11: Moderate connection pooling from JSON config
    pool: dbConfig.pool,

    // Q16: Snake_case database, camelCase JavaScript
    define: {
      underscored: true,
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at'
    },

    dialectOptions: {
      charset: dbConfig.system.charset,
      collate: dbConfig.system.collation,
      timezone: dbConfig.connection.timezone
    },

    // Migration settings
    migrationStorage: 'sequelize',
    migrationStorageTableName: '_sequelize_migrations',
    seederStorage: 'sequelize',
    seederStorageTableName: '_sequelize_seeders',

    // Production safety
    logging: false
  }
};
