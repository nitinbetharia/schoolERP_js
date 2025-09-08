// Test script to check route loading
console.log('Testing web routes loading...');

try {
   const webRoutes = require('./routes/web/index.js');
   console.log('SUCCESS: Web routes loaded without errors');
   console.log('Route type:', typeof webRoutes);
} catch (err) {
   console.error('ERROR:', err.message);
   console.error('Stack:', err.stack);
}
