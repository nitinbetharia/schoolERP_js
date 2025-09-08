const { Sequelize } = require('sequelize');

async function testSequelizeConnection() {
   try {
      console.log('Testing Sequelize connection...');

      const sequelize = new Sequelize({
         host: '140.238.167.36',
         port: 3306,
         username: 'school_erp_admin',
         password: 'Nitin@123#',
         database: 'school_erp_system',
         dialect: 'mysql',
         logging: console.log,
         pool: {
            max: 1,
            min: 0,
            acquire: 10000,
            idle: 5000,
         },
      });

      console.log('Testing authentication...');
      await sequelize.authenticate();
      console.log('✅ Sequelize connection successful!');

      await sequelize.close();
      console.log('✅ Sequelize connection closed');
   } catch (error) {
      console.error('❌ Sequelize connection failed:');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
   }
}

testSequelizeConnection();
