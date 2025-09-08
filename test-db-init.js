const { initializeSystemModels } = require('./models/system/database');

console.log('Testing database initialization...');

async function test() {
   try {
      console.log('Starting system models initialization...');
      const result = await initializeSystemModels();
      console.log('Success:', result.success);
      console.log('Test completed successfully!');
      process.exit(0);
   } catch (error) {
      console.error('Error during initialization:', error.message);
      console.error('Stack:', error.stack);
      process.exit(1);
   }
}

test();
