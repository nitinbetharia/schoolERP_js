const { initializeTenantModels } = require('./models');

async function testTenantModels() {
  try {
    const models = await initializeTenantModels('TEST');
    const modelNames = Object.keys(models).filter(k => !['sequelize', 'Sequelize'].includes(k));
    console.log('✅ Tenant models loaded:', modelNames);
  } catch (error) {
    console.error('❌ Error loading tenant models:', error.message);
    console.error(error.stack);
  }
}

testTenantModels();
