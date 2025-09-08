const { Sequelize } = require('sequelize');
const { logDB } = require('./utils/logger');

async function testWithCustomLogger() {
   try {
      console.log('Testing with custom logger...');

      const sequelize = new Sequelize({
         host: '140.238.167.36',
         port: 3306,
         username: 'school_erp_admin',
         password: 'Nitin@123#',
         database: 'school_erp_system',
         dialect: 'mysql',
         logging: (msg) => logDB(msg), // This is what the server uses
         pool: {
            max: 1,
            min: 0,
            acquire: 5000,
            idle: 2000,
         },
      });

      console.log('Testing authentication with custom logger...');
      await sequelize.authenticate();
      console.log('✅ Authentication successful!');

      await sequelize.close();
      console.log('✅ Connection closed');
   } catch (error) {
      console.error('❌ Test failed:', error.message);
   }
}

testWithCustomLogger();
