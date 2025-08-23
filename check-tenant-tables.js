const mysql = require('mysql2/promise');

async function checkTenantTables() {
   try {
      // Database connection configuration
      const connectionConfig = {
         host: '140.238.167.36',
         user: 'school_erp_admin',
         password: 'Nitin@123#',
         multipleStatements: true
      };

      const connection = await mysql.createConnection(connectionConfig);

      console.log('=== CHECKING DEMO DATABASE ===');
      await connection.execute('USE demo');
      
      const [demoTables] = await connection.execute('SHOW TABLES');
      console.log('Tables in demo database:');
      demoTables.forEach(row => {
         console.log(`  - ${Object.values(row)[0]}`);
      });
      console.log(`Total tables in demo: ${demoTables.length}`);

      console.log('\n=== CHECKING MAROON DATABASE ===');
      await connection.execute('USE maroon');
      
      const [maroonTables] = await connection.execute('SHOW TABLES');
      console.log('Tables in maroon database:');
      maroonTables.forEach(row => {
         console.log(`  - ${Object.values(row)[0]}`);
      });
      console.log(`Total tables in maroon: ${maroonTables.length}`);

      // Compare the differences
      const demoTableNames = demoTables.map(row => Object.values(row)[0]);
      const maroonTableNames = maroonTables.map(row => Object.values(row)[0]);

      const onlyInDemo = demoTableNames.filter(table => 
         !maroonTableNames.includes(table));
      const onlyInMaroon = maroonTableNames.filter(table => 
         !demoTableNames.includes(table));

      console.log('\n=== COMPARISON ===');
      if (onlyInDemo.length > 0) {
         console.log('Tables only in demo:');
         onlyInDemo.forEach(table => console.log(`  - ${table}`));
      }

      if (onlyInMaroon.length > 0) {
         console.log('Tables only in maroon:');
         onlyInMaroon.forEach(table => console.log(`  - ${table}`));
      }

      if (onlyInDemo.length === 0 && onlyInMaroon.length === 0) {
         console.log('Both databases have the same tables.');
      }

      await connection.end();
   } catch (error) {
      console.error('Error checking tenant tables:', error.message);
   }
}

checkTenantTables();
