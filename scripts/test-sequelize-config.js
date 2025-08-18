/**
 * Test Sequelize Configuration
 * Verify that our Q29-compliant configuration works
 */

const sequelizeManager = require('../config/sequelize');

async function testSequelizeConfig() {
  try {
    console.log('🔧 Testing Sequelize Configuration');
    console.log('='.repeat(40));

    // Test system database connection
    console.log('📋 Testing system database connection...');
    await sequelizeManager.initialize();

    const systemSequelize = sequelizeManager.getSystemSequelize();
    await systemSequelize.authenticate();
    console.log('✅ System database connection successful');

    // Test tenant database connection
    console.log('📋 Testing tenant database connection...');
    const tenantSequelize = await sequelizeManager.getTenantSequelize('demo');
    await tenantSequelize.authenticate();
    console.log('✅ Tenant database connection successful');

    // Show configuration being used
    console.log('\n📊 Configuration Summary:');
    console.log('  Host:', systemSequelize.config.host);
    console.log('  Port:', systemSequelize.config.port);
    console.log('  System DB:', systemSequelize.config.database);
    console.log('  Tenant DB:', tenantSequelize.config.database);
    console.log('  Pool Max:', systemSequelize.config.pool.max);
    console.log('  Underscored:', systemSequelize.options.define.underscored);

    // Close connections
    await sequelizeManager.closeAll();
    console.log('\n🎉 All Sequelize tests passed!');
    console.log('✅ Q29 compliant configuration working correctly');
  } catch (error) {
    console.error('❌ Sequelize test failed:', error.message);
    process.exit(1);
  }
}

testSequelizeConfig();
