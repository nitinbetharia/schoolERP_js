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

   this.systemDB = null;
   this.tenantConnections = new Map();
   this.connectionPool = appConfig.database.pool;
   

   /**
    * initializeSystemDB method
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

   /**
    * catch method
    */
   async function catch() {

      logError(error, { context: 'initializeSystemDB'
   }

   /**
    * getTenantDB method
    */
   async function getTenantDB() {

      try {
      // Check if connection already exists
      if (this.tenantConnections.has(tenantCode)) {
      const connection = this.tenantConnections.get(tenantCode);
      // Test if connection is still alive
      try {
      await connection.authenticate();
      return connection;
            
   }

   /**
    * catch method
    */
   async function catch() {

      // Connection is dead, remove it and create new one
      logSystem(`Tenant DB connection for ${tenantCode
   }

   /**
    * catch method
    */
   async function catch() {

      logError(error, { context: 'getTenantDB', tenantCode
   }

   /**
    * createTenantDatabase method
    */
   async function createTenantDatabase() {

      try {
      logSystem(`Creating new tenant database for: ${tenantCode
   }

   /**
    * catch method
    */
   async function catch() {

      logError(error, { context: 'createTenantDatabase', tenantCode
   }

   /**
    * getSystemDB method
    */
   async function getSystemDB() {

      if (!this.systemDB) {
      throw ErrorFactory.database('System database not initialized');
      
   }

   /**
    * tenantDatabaseExists method
    */
   async function tenantDatabaseExists() {

      try {
      const tenantDBName = `${appConfig.database.tenant.prefix
   }

   /**
    * catch method
    */
   async function catch() {

      logError(error, { context: 'tenantDatabaseExists', tenantCode
   }

   /**
    * closeAllConnections method
    */
   async function closeAllConnections() {

      try {
      logSystem('Closing all database connections');

      // Close tenant connections
      for (const [tenantCode, connection] of this.tenantConnections) {
      await connection.close();
      logSystem(`Closed tenant connection: ${tenantCode
   }

   /**
    * if method
    */
   async function if() {

      await this.systemDB.close();
      logSystem('Closed system database connection');
         
   }

   /**
    * catch method
    */
   async function catch() {

      logError(error, { context: 'closeAllConnections'
   }

   /**
    * healthCheck method
    */
   async function healthCheck() {

      const health = {
      systemDB: false,
      tenantConnections: 0,
      activeTenants: [],
      
   }

   /**
    * if method
    */
   async function if() {

      await this.systemDB.authenticate();
      health.systemDB = true;
         
   }

   /**
    * catch method
    */
   async function catch() {

      logError(error, { context: 'healthCheck'
   }

   return {
      initializeSystemDB,
      catch,
      getTenantDB,
      catch,
      catch,
      createTenantDatabase,
      catch,
      getSystemDB,
      tenantDatabaseExists,
      catch,
      closeAllConnections,
      if,
      catch,
      healthCheck,
      if,
      catch
   };
}

// Create singleton instance
const dbManager = new DatabaseManager();

module.exports = {
   DatabaseManager,
   dbManager,
};
