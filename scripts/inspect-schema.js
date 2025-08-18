/**
 * Database Schema Inspector
 * Check actual database structure vs model definitions
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const config = require('../config/index');

async function inspectDatabaseSchema() {
  const dbConfig = config.get('database');

  // Connect to system database
  const sequelize = new Sequelize(
    dbConfig.system.name,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: dbConfig.connection.host,
      port: dbConfig.connection.port,
      dialect: 'mysql',
      logging: false
    }
  );

  try {
    console.log('🔍 Inspecting Database Schema');
    console.log('='.repeat(50));

    // Check if tables exist
    const [results] = await sequelize.query('SHOW TABLES');
    console.log(
      '📋 Tables in system database:',
      results.map(r => Object.values(r)[0])
    );

    // Connect to tenant database
    const tenantDbName = `${dbConfig.tenant.prefix}demo`;
    const tenantSequelize = new Sequelize(
      tenantDbName,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: dbConfig.connection.host,
        port: dbConfig.connection.port,
        dialect: 'mysql',
        logging: false
      }
    );

    const [tenantResults] = await tenantSequelize.query('SHOW TABLES');
    console.log(
      '📋 Tables in tenant database:',
      tenantResults.map(r => Object.values(r)[0])
    );

    // Inspect classes table structure if it exists
    if (tenantResults.some(r => Object.values(r)[0] === 'classes')) {
      console.log('\n📋 Classes table structure:');
      const [classesStructure] = await tenantSequelize.query('DESCRIBE classes');
      classesStructure.forEach(col => {
        console.log(
          `  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''} ${col.Default ? `DEFAULT ${col.Default}` : ''}`
        );
      });
    }

    await sequelize.close();
    await tenantSequelize.close();
  } catch (error) {
    console.error('❌ Database inspection failed:', error.message);
  }
}

inspectDatabaseSchema();
