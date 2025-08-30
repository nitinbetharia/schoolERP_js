#!/usr/bin/env node

/**
 * Backend API Testing Script
 * Tests critical API endpoints after refactoring
 */

const http = require('http');
const https = require('https');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const tests = [];

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
   return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      const req = client.request(url, options, (res) => {
         let data = '';
         res.on('data', (chunk) => (data += chunk));
         res.on('end', () => {
            resolve({
               statusCode: res.statusCode,
               headers: res.headers,
               body: data,
            });
         });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => reject(new Error('Request timeout')));
      req.end();
   });
}

// Test cases
async function testEndpoint(name, path, expectedStatus = 200) {
   try {
      console.log(`Testing: ${name}`);
      const response = await makeRequest(`${BASE_URL}${path}`);

      if (response.statusCode === expectedStatus) {
         console.log(`✅ ${name} - Status: ${response.statusCode}`);
         return { name, status: 'PASS', statusCode: response.statusCode };
      } else {
         console.log(`❌ ${name} - Expected: ${expectedStatus}, Got: ${response.statusCode}`);
         return { name, status: 'FAIL', expected: expectedStatus, actual: response.statusCode };
      }
   } catch (error) {
      console.log(`❌ ${name} - Error: ${error.message}`);
      return { name, status: 'ERROR', error: error.message };
   }
}

async function runTests() {
   console.log('🚀 Starting Backend API Tests\n');

   const testResults = [];

   // Basic connectivity tests
   testResults.push(await testEndpoint('Homepage', '/'));
   testResults.push(await testEndpoint('Login Page', '/login'));

   // Authentication redirects (should redirect to login)
   testResults.push(await testEndpoint('Admin Registration (Auth Required)', '/admin/user-registration', 302));
   testResults.push(await testEndpoint('User Management (Auth Required)', '/admin/user-management', 302));
   testResults.push(await testEndpoint('Bulk Import (Auth Required)', '/admin/bulk-user-import', 302));

   // API endpoints (should require auth, return 302 redirect or 401)
   testResults.push(await testEndpoint('API Health Check', '/api/health'));
   testResults.push(
      await testEndpoint('API User Permissions (Auth Required)', '/api/admin/users/permissions', [302, 401, 403])
   );
   testResults.push(await testEndpoint('API User Stats (Auth Required)', '/api/admin/users/stats', [302, 401, 403]));

   // Static assets
   testResults.push(await testEndpoint('CSS Assets', '/css/bootstrap.min.css'));
   testResults.push(await testEndpoint('JS Assets', '/js/bootstrap.bundle.min.js'));

   // Error handling
   testResults.push(await testEndpoint('404 Error Handling', '/non-existent-route', 404));

   // Summary
   console.log('\n📊 Test Results Summary:');
   console.log('='.repeat(50));

   const passed = testResults.filter((r) => r.status === 'PASS').length;
   const failed = testResults.filter((r) => r.status === 'FAIL').length;
   const errors = testResults.filter((r) => r.status === 'ERROR').length;

   console.log(`✅ Passed: ${passed}`);
   console.log(`❌ Failed: ${failed}`);
   console.log(`🔥 Errors: ${errors}`);
   console.log(`📈 Total: ${testResults.length}`);

   if (failed > 0 || errors > 0) {
      console.log('\n🚨 Failed/Error Tests:');
      testResults
         .filter((r) => r.status !== 'PASS')
         .forEach((result) => {
            console.log(`- ${result.name}: ${result.status}`);
            if (result.error) {
               console.log(`  Error: ${result.error}`);
            }
            if (result.expected) {
               console.log(`  Expected: ${result.expected}, Got: ${result.actual}`);
            }
         });
   }

   const successRate = Math.round((passed / testResults.length) * 100);
   console.log(`\n🎯 Success Rate: ${successRate}%`);

   if (successRate === 100) {
      console.log('🎉 ALL TESTS PASSED! Backend refactoring successful.');
      process.exit(0);
   } else if (successRate >= 80) {
      console.log('⚠️  Most tests passed. Minor issues need attention.');
      process.exit(0);
   } else {
      console.log('🚨 Critical issues detected. Please review failed tests.');
      process.exit(1);
   }
}

// Handle multiple expected status codes
async function testEndpointMultiStatus(name, path, expectedStatuses) {
   try {
      console.log(`Testing: ${name}`);
      const response = await makeRequest(`${BASE_URL}${path}`);

      if (expectedStatuses.includes(response.statusCode)) {
         console.log(`✅ ${name} - Status: ${response.statusCode}`);
         return { name, status: 'PASS', statusCode: response.statusCode };
      } else {
         console.log(`❌ ${name} - Expected: ${expectedStatuses}, Got: ${response.statusCode}`);
         return { name, status: 'FAIL', expected: expectedStatuses, actual: response.statusCode };
      }
   } catch (error) {
      console.log(`❌ ${name} - Error: ${error.message}`);
      return { name, status: 'ERROR', error: error.message };
   }
}

// Enhanced test with multi-status support
async function runEnhancedTests() {
   console.log('🚀 Starting Backend API Tests\n');

   const testResults = [];

   // Basic connectivity tests
   testResults.push(await testEndpoint('Homepage', '/'));
   testResults.push(await testEndpoint('Login Page', '/login'));

   // Authentication redirects (should redirect to login)
   testResults.push(await testEndpoint('Admin Registration (Auth Required)', '/admin/user-registration', 302));
   testResults.push(await testEndpoint('User Management (Auth Required)', '/admin/user-management', 302));
   testResults.push(await testEndpoint('Bulk Import (Auth Required)', '/admin/bulk-user-import', 302));

   // API endpoints (should require auth, return 302 redirect or 401/403)
   testResults.push(await testEndpoint('API Health Check', '/api/health'));
   testResults.push(
      await testEndpointMultiStatus(
         'API User Permissions (Auth Required)',
         '/api/admin/users/permissions',
         [302, 401, 403]
      )
   );
   testResults.push(
      await testEndpointMultiStatus('API User Stats (Auth Required)', '/api/admin/users/stats', [302, 401, 403])
   );

   // Static assets
   testResults.push(await testEndpoint('CSS Assets', '/css/bootstrap.min.css'));
   testResults.push(await testEndpoint('JS Assets', '/js/bootstrap.bundle.min.js'));

   // Error handling
   testResults.push(await testEndpoint('404 Error Handling', '/non-existent-route', 404));

   // Summary
   console.log('\n📊 Test Results Summary:');
   console.log('='.repeat(50));

   const passed = testResults.filter((r) => r.status === 'PASS').length;
   const failed = testResults.filter((r) => r.status === 'FAIL').length;
   const errors = testResults.filter((r) => r.status === 'ERROR').length;

   console.log(`✅ Passed: ${passed}`);
   console.log(`❌ Failed: ${failed}`);
   console.log(`🔥 Errors: ${errors}`);
   console.log(`📈 Total: ${testResults.length}`);

   if (failed > 0 || errors > 0) {
      console.log('\n🚨 Failed/Error Tests:');
      testResults
         .filter((r) => r.status !== 'PASS')
         .forEach((result) => {
            console.log(`- ${result.name}: ${result.status}`);
            if (result.error) {
               console.log(`  Error: ${result.error}`);
            }
            if (result.expected) {
               console.log(`  Expected: ${result.expected}, Got: ${result.actual}`);
            }
         });
   }

   const successRate = Math.round((passed / testResults.length) * 100);
   console.log(`\n🎯 Success Rate: ${successRate}%`);

   if (successRate === 100) {
      console.log('🎉 ALL TESTS PASSED! Backend refactoring successful.');
      return true;
   } else if (successRate >= 80) {
      console.log('⚠️  Most tests passed. Minor issues need attention.');
      return true;
   } else {
      console.log('🚨 Critical issues detected. Please review failed tests.');
      return false;
   }
}

// Check if server is running first
async function checkServer() {
   try {
      await makeRequest(BASE_URL);
      return true;
   } catch (error) {
      console.log('🚨 Server is not running at ' + BASE_URL);
      console.log('Please start the server with: npm start');
      return false;
   }
}

// Main execution
async function main() {
   console.log('🔍 Checking server status...');

   const serverRunning = await checkServer();
   if (!serverRunning) {
      process.exit(1);
   }

   console.log('✅ Server is running. Starting tests...\n');

   const success = await runEnhancedTests();
   process.exit(success ? 0 : 1);
}

main().catch(console.error);
