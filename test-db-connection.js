const { Sequelize } = require('sequelize');
const appConfig = require('./config/app-config.json');
require('dotenv').config();

console.log('Testing database connection...');
console.log('Environment variables:');
console.log('DB_USER:', process.env.DB_USER ? 'SET' : 'NOT SET');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'SET' : 'NOT SET');

const config = appConfig.database.connection;
console.log('Database config:');
console.log('Host:', config.host);
console.log('Port:', config.port);
console.log('System DB:', appConfig.database.system.name);

async function testConnection() {
   try {
      const sequelize = new Sequelize(appConfig.database.system.name, process.env.DB_USER, process.env.DB_PASSWORD, {
         host: config.host,
         port: config.port,
         dialect: 'mysql',
         timezone: config.timezone,
         logging: console.log,
         pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
         },
      });

      console.log('Attempting to connect...');
      await sequelize.authenticate();
      console.log('✅ Database connection successful!');

      await sequelize.close();
      console.log('Connection closed.');
   } catch (error) {
      console.error('❌ Database connection failed:');
      console.error('Error:', error.message);
      console.error('Code:', error.original?.code);
      console.error('Errno:', error.original?.errno);
   }
}

testConnection();
