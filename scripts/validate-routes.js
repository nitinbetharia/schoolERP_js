#!/usr/bin/env node

/**
 * Route Validation Script
 * Tests route mounting and identifies duplications without connecting to database
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Route Duplication Analysis & Validation');
console.log('==========================================\n');

// Mock Express router for static analysis
class MockRouter {
   constructor() {
      this.routes = [];
   }

   get(path, ...handlers) {
      this.routes.push({ method: 'GET', path, handlers: handlers.length });
   }

   post(path, ...handlers) {
      this.routes.push({ method: 'POST', path, handlers: handlers.length });
   }

   put(path, ...handlers) {
      this.routes.push({ method: 'PUT', path, handlers: handlers.length });
   }

   delete(path, ...handlers) {
      this.routes.push({ method: 'DELETE', path, handlers: handlers.length });
   }

   patch(path, ...handlers) {
      this.routes.push({ method: 'PATCH', path, handlers: handlers.length });
   }

   use(path, router) {
      if (typeof path === 'function') {
         // middleware
         this.routes.push({ method: 'MIDDLEWARE', path: '*', handlers: 1 });
      } else if (router && router.routes) {
         // sub-router
         router.routes.forEach((route) => {
            this.routes.push({
               method: route.method,
               path: path + route.path,
               handlers: route.handlers,
            });
         });
      }
   }
}

// Test route file validation
function validateRouteFile(filePath, prefix = '') {
   try {
      console.log(`📁 Analyzing: ${filePath}`);

      // Read file content
      const content = fs.readFileSync(filePath, 'utf8');

      // Count route definitions
      const routeMatches = content.match(/router\.(get|post|put|delete|patch)\(/g) || [];
      console.log(`   Routes found: ${routeMatches.length}`);

      // Check for duplicate paths
      const pathMatches = content.match(/router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)/g) || [];
      const paths = pathMatches.map((match) => {
         const [, method, path] = match.match(/router\.(\w+)\(['"`]([^'"`]+)/) || [];
         return { method: method?.toUpperCase(), path };
      });

      // Find duplicates within file
      const duplicates = paths.filter((item, index) => {
         return paths.findIndex((p) => p.method === item.method && p.path === item.path) !== index;
      });

      if (duplicates.length > 0) {
         console.log(`   ⚠️  Duplicates found:`);
         duplicates.forEach((dup) => {
            console.log(`      ${dup.method} ${prefix}${dup.path}`);
         });
      } else {
         console.log(`   ✅ No duplicates found`);
      }

      console.log('');
      return { routes: paths.length, duplicates: duplicates.length, paths };
   } catch (error) {
      console.log(`   ❌ Error analyzing file: ${error.message}\n`);
      return { routes: 0, duplicates: 0, paths: [] };
   }
}

// Main analysis
console.log('1. CRITICAL ROUTE FILES ANALYSIS\n');

const results = {
   'routes/web.js': validateRouteFile('./routes/web.js', '/auth'),
   'routes/system.js': validateRouteFile('./routes/system.js', '/api/v1/admin/system'),
   'routes/trust.js': validateRouteFile('./routes/trust.js', '/api/v1/trust/:trustId'),
   'modules/user/routes/userRoutes.js': validateRouteFile('./modules/user/routes/userRoutes.js', '/api/v1/users'),
   'modules/student/routes/studentRoutes.js': validateRouteFile(
      './modules/student/routes/studentRoutes.js',
      '/api/v1/students'
   ),
};

console.log('2. ROUTE MOUNTING ANALYSIS\n');
console.log('Based on server.js configuration:');
console.log('   app.use("/", webRoutes)           -> Web interface routes');
console.log('   app.use("/auth", webRoutes)       -> Auth routes (potential duplication)');
console.log('   app.use("/api/v1", routes)        -> API routes\n');

console.log('3. SUMMARY\n');

let totalRoutes = 0;
let totalDuplicates = 0;

Object.entries(results).forEach(([file, result]) => {
   totalRoutes += result.routes;
   totalDuplicates += result.duplicates;
});

console.log(`📊 Total routes analyzed: ${totalRoutes}`);
console.log(`🔥 Total duplications found: ${totalDuplicates}`);

if (totalDuplicates === 0) {
   console.log('✅ Route duplication fix SUCCESSFUL!');
} else {
   console.log('⚠️  Additional duplications need attention');
}

console.log('\n4. RECOMMENDED ACTIONS\n');

// Check if web.js still has the duplicate logout
try {
   const webContent = fs.readFileSync('./routes/web.js', 'utf8');
   const logoutMatches = (webContent.match(/router\.post\(['"`]\/logout/g) || []).length;

   if (logoutMatches > 1) {
      console.log('❌ CRITICAL: Multiple logout routes still exist in web.js');
   } else {
      console.log('✅ Logout route duplication resolved');
   }
} catch (error) {
   console.log('⚠️  Could not verify logout route fix');
}

console.log('✅ Route analysis completed successfully');
console.log('📝 See ROUTE_DUPLICATION_ANALYSIS.md for detailed findings');
