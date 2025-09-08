const { withCriticalRetry } = require('./utils/databaseRetry');
const { Sequelize } = require('sequelize');
const appConfig = require('./config/app-config.json');
const { logSystem, logError } = require('./utils/logger');

async function testCompleteInitialization() {
   try {
      console.log('Testing complete initialization process...');

      const result = await withCriticalRetry(
         async () => {
            console.log('Inside withCriticalRetry...');
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
                  ssl: false,
               },
               pool: {
                  max: 2,
                  min: 0,
                  acquire: 10000,
                  idle: 5000,
               },
               logging: console.log,
               define: {
                  underscored: true,
                  freezeTableName: true,
               },
            };

            const systemDB = new Sequelize(config);
            console.log('Sequelize instance created');

            // Test connection with retry
            console.log('Testing authentication...');
            await systemDB.authenticate();
            console.log('Authentication successful');
            logSystem('System database connection established successfully');

            return systemDB;
         },
         {
            operation: 'test_initializeSystemDB',
            context: 'system_database_initialization_test',
         }
      );

      console.log('✅ withCriticalRetry completed successfully');

      // Close the connection
      await result.close();
      console.log('✅ Connection closed');
   } catch (error) {
      console.error('❌ Test failed:', error.message);
      console.error('Stack:', error.stack);
   }
}

testCompleteInitialization();
