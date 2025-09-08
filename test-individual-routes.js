// Test individual route loading
const routes = [
   './routes/web/auth',
   './routes/web/system',
   './routes/web/users',
   './routes/web/trusts',
   './routes/web/schools',
   './routes/web/students-simple',
   './routes/web/fees',
   './routes/web/teacher',
   './routes/web/staff',
   './routes/web/help',
   './routes/web/classes',
   './routes/web/sections',
];

console.log('Testing individual route loading...');

for (const route of routes) {
   try {
      console.log(`Testing ${route}...`);
      const routeModule = require(route);
      console.log(`✅ ${route} - Type: ${typeof routeModule}`);
   } catch (err) {
      console.error(`❌ ${route} - Error: ${err.message}`);
   }
}
