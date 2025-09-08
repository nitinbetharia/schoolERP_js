/**
 * Quick database connection test to debug server hanging issue
 */
require('dotenv').config();

const { Sequelize } = require('sequelize');
const appConfig = require('./config/app-config.json');

console.log('🔍 Environment variables check:');
console.log('DB_USER:', process.env.DB_USER ? 'SET' : 'NOT SET');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'SET' : 'NOT SET');

console.log('\n🔍 Database configuration:');
console.log('Host:', appConfig.database.connection.host);
console.log('Port:', appConfig.database.connection.port);
console.log('Database:', appConfig.database.system.name);

async function testConnection() {
   try {
      console.log('\n🔗 Testing database connection...');

      const sequelize = new Sequelize({
         host: appConfig.database.connection.host,
         port: appConfig.database.connection.port,
         username: process.env.DB_USER,
         password: process.env.DB_PASSWORD,
         database: appConfig.database.system.name,
         dialect: 'mysql',
         dialectOptions: {
            connectTimeout: 10000,
            acquireTimeout: 10000,
         },
         pool: {
            max: 2,
            min: 0,
            acquire: 10000,
            idle: 10000,
         },
         logging: false,
      });

      // Test with explicit timeout
      const authPromise = sequelize.authenticate();
      const timeoutPromise = new Promise((_, reject) =>
         setTimeout(() => reject(new Error('Connection timeout after 15 seconds')), 15000)
      );

      await Promise.race([authPromise, timeoutPromise]);

      console.log('✅ Database connection successful!');

      // Test a simple query
      const [results] = await sequelize.query('SELECT 1 as test');
      console.log('✅ Query test successful:', results);

      await sequelize.close();
      console.log('✅ Connection closed successfully');
   } catch (error) {
      console.error('❌ Database connection failed:');
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Full error:', error);
   }
}

testConnection();
