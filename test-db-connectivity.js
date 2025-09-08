const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
   try {
      console.log('Testing database connection...');

      const connection = await mysql.createConnection({
         host: '140.238.167.36',
         port: 3306,
         user: 'school_erp_admin',
         password: 'Nitin@123#',
         database: 'school_erp_system',
         connectTimeout: 10000,
      });

      console.log('✅ Database connection successful!');

      // Test a simple query
      const [rows] = await connection.execute('SELECT 1 as test');
      console.log('✅ Test query successful:', rows);

      await connection.end();
      console.log('✅ Connection closed successfully');
   } catch (error) {
      console.error('❌ Database connection failed:');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);

      if (error.code === 'ETIMEDOUT') {
         console.error('💡 This suggests a network connectivity issue or the database server is not responding');
      } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
         console.error('💡 This suggests incorrect database credentials');
      } else if (error.code === 'ENOTFOUND') {
         console.error('💡 This suggests the database host cannot be resolved');
      }
   }
}

testDatabaseConnection();
