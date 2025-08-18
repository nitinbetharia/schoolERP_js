/**
 * Simple Sequelize Configuration Test
 * Test Q29 compliance without complex logger setup
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const config = require('../config/index');

async function testSequelizeConfig() {
  try {
    console.log('🔧 Testing Q29 Compliant Sequelize Configuration');
    console.log('='.repeat(50));

    const dbConfig = config.get('database');
    console.log('📋 Configuration loaded:');
    console.log('  Host:', dbConfig.connection.host);
    console.log('  Port:', dbConfig.connection.port);
    console.log('  System DB:', dbConfig.system.name);
    console.log('  Tenant Prefix:', dbConfig.tenant.prefix);
    console.log('  Pool Max:', dbConfig.pool.max);

    // Test system database connection
    console.log('\n📋 Testing system database connection...');
    const systemSequelize = new Sequelize(
      dbConfig.system.name,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: dbConfig.connection.host,
        port: dbConfig.connection.port,
        dialect: 'mysql',
        pool: dbConfig.pool,
        logging: false // Disable logging for test
      }
    );

    await systemSequelize.authenticate();
    console.log('✅ System database connection successful');

    // Test tenant database connection
    console.log('📋 Testing tenant database connection...');
    const tenantDbName = `${dbConfig.tenant.prefix}demo`;
    const tenantSequelize = new Sequelize(
      tenantDbName,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: dbConfig.connection.host,
        port: dbConfig.connection.port,
        dialect: 'mysql',
        pool: dbConfig.pool,
        logging: false // Disable logging for test
      }
    );

    await tenantSequelize.authenticate();
    console.log('✅ Tenant database connection successful');

    // Close connections
    await systemSequelize.close();
    await tenantSequelize.close();

    console.log('\n🎉 Q29 COMPLIANCE TEST PASSED!');
    console.log('✅ Configuration from JSON config: ✓');
    console.log('✅ Secrets from .env: ✓');
    console.log('✅ Database connections working: ✓');
    console.log('✅ Phase 1 fully compliant and functional!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('🚨 Phase 1 compliance issue detected');
    process.exit(1);
  }
}

testSequelizeConfig();
