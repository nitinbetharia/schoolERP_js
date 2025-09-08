const { Sequelize } = require('sequelize');

async function testWithTimeout() {
   try {
      console.log('Testing Sequelize with short timeout...');

      const sequelize = new Sequelize({
         host: '140.238.167.36',
         port: 3306,
         username: 'school_erp_admin',
         password: 'Nitin@123#',
         database: 'school_erp_system',
         dialect: 'mysql',
         dialectOptions: {
            charset: 'utf8mb4',
            connectTimeout: 5000, // 5 seconds
         },
         pool: {
            max: 1,
            min: 0,
            acquire: 5000, // 5 seconds
            idle: 2000,
         },
         logging: console.log,
      });

      console.log('Sequelize instance created, testing authentication...');

      // Add a timeout wrapper
      const authPromise = sequelize.authenticate();
      const timeoutPromise = new Promise((_, reject) =>
         setTimeout(() => reject(new Error('Authentication timeout')), 10000)
      );

      await Promise.race([authPromise, timeoutPromise]);
      console.log('✅ Authentication successful!');

      await sequelize.close();
      console.log('✅ Connection closed');
   } catch (error) {
      console.error('❌ Test failed:', error.message);
   }
}

testWithTimeout();
