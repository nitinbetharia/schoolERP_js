console.log('Testing model imports...');

try {
   console.log('Importing Trust model...');
   const { defineTrustModel } = require('./models/tenant/Trust');
   console.log('✅ Trust model imported successfully');

   console.log('Importing SystemUser models...');
   const { defineSystemUserModel, defineSystemAuditLogModel } = require('./models/system/SystemUser');
   console.log('✅ SystemUser models imported successfully');

   console.log('✅ All model imports successful!');
} catch (error) {
   console.error('❌ Model import failed:');
   console.error('Error:', error.message);
   console.error('Stack:', error.stack);
}
