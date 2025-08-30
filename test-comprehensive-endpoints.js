/**
 * Comprehensive API Endpoint Test
 * Tests all available endpoints with proper authentication context
 */

const axios = require('axios');
const { spawn } = require('child_process');

class ComprehensiveAPITester {
   constructor() {
      this.baseURL = 'http://localhost:3000';
      this.server = null;
      this.results = { passed: 0, failed: 0, tests: [] };
   }

   log(message, type = 'info') {
      const timestamp = new Date().toISOString();
      const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔍';
      console.log(`${prefix} [${timestamp.slice(11, 19)}] ${message}`);
   }

   async startServer() {
      return new Promise((resolve) => {
         this.log('Starting server...');
         this.server = spawn('node', ['server.js'], {
            stdio: 'pipe',
            env: { ...process.env, NODE_ENV: 'test' },
         });

         let serverReady = false;
         const checkReady = (data) => {
            if (data.toString().includes('School ERP Server is running!') && !serverReady) {
               serverReady = true;
               this.log('Server started successfully', 'success');
               setTimeout(resolve, 3000); // Extra time for initialization
            }
         };

         this.server.stdout.on('data', checkReady);
         this.server.stderr.on('data', checkReady);

         setTimeout(() => {
            if (!serverReady) {
               this.log('Server startup timeout - proceeding anyway');
               resolve();
            }
         }, 20000);
      });
   }

   async stopServer() {
      if (this.server) {
         this.log('Stopping server...');
         this.server.kill('SIGTERM');
         setTimeout(() => this.server && this.server.kill('SIGKILL'), 3000);
      }
   }

   async testEndpoint(name, url, options = {}) {
      try {
         const start = Date.now();
         const response = await axios({
            url,
            method: 'GET',
            timeout: 10000,
            validateStatus: () => true,
            ...options,
         });

         const duration = Date.now() - start;
         const success = response.status >= 200 && response.status < 400;

         const result = {
            name,
            success,
            status: response.status,
            duration: `${duration}ms`,
            url,
            method: options.method || 'GET',
         };

         if (success) {
            this.results.passed++;
            this.log(`${name}: ${response.status} (${duration}ms)`, 'success');
         } else {
            this.results.failed++;
            this.log(`${name}: ${response.status} (${duration}ms)`, 'error');
            if (response.data && response.data.message) {
               this.log(`   Error: ${response.data.message}`);
            }
         }

         this.results.tests.push(result);
         return result;
      } catch (error) {
         this.results.failed++;
         this.log(`${name}: ERROR - ${error.code || error.message}`, 'error');
         this.results.tests.push({
            name,
            success: false,
            status: 'ERROR',
            error: error.code || error.message,
            url,
         });
      }
   }

   async runSystemTests() {
      this.log('\\n=== System Health Tests ===');

      await this.testEndpoint('System Health', `${this.baseURL}/api/v1/admin/system/health`);
      await this.testEndpoint('API Status', `${this.baseURL}/api/v1/status`);
      await this.testEndpoint('Database Status', `${this.baseURL}/api/v1/admin/system/database-status`);
   }

   async runWebRouteTests() {
      this.log('\\n=== Web Route Tests ===');

      await this.testEndpoint('System Login Page', `${this.baseURL}/login`);
      await this.testEndpoint('Demo Tenant Login', `${this.baseURL}/login`, {
         headers: { Host: 'demo.localhost:3000' },
      });
      await this.testEndpoint('Maroon Tenant Login', `${this.baseURL}/login`, {
         headers: { Host: 'maroon.localhost:3000' },
      });
   }

   async runStaticAssetTests() {
      this.log('\\n=== Static Asset Tests ===');

      await this.testEndpoint('CSS Assets', `${this.baseURL}/static/css/app.css`);
      await this.testEndpoint('JS Assets', `${this.baseURL}/static/js/app.js`);
      await this.testEndpoint('Favicon', `${this.baseURL}/static/images/favicon.ico`);
   }

   async runAPIRouteTests() {
      this.log('\\n=== API Endpoint Tests ===');

      // Test without tenant (system admin context)
      await this.testEndpoint('Students API (System)', `${this.baseURL}/api/v1/students`);
      await this.testEndpoint('Schools API (System)', `${this.baseURL}/api/v1/schools/schools`);
      await this.testEndpoint('Users API (System)', `${this.baseURL}/api/v1/users`);
      await this.testEndpoint('Setup API (System)', `${this.baseURL}/api/v1/setup`);

      // Test with demo tenant context
      await this.testEndpoint('Students API (Demo)', `${this.baseURL}/api/v1/students`, {
         headers: { Host: 'demo.localhost:3000' },
      });
      await this.testEndpoint('Schools API (Demo)', `${this.baseURL}/api/v1/schools/schools`, {
         headers: { Host: 'demo.localhost:3000' },
      });

      // Test with maroon tenant context
      await this.testEndpoint('Students API (Maroon)', `${this.baseURL}/api/v1/students`, {
         headers: { Host: 'maroon.localhost:3000' },
      });
      await this.testEndpoint('Schools API (Maroon)', `${this.baseURL}/api/v1/schools/schools`, {
         headers: { Host: 'maroon.localhost:3000' },
      });
   }

   async runErrorHandlingTests() {
      this.log('\\n=== Error Handling Tests ===');

      await this.testEndpoint('404 Error Page', `${this.baseURL}/nonexistent-page`);
      await this.testEndpoint('Invalid API Endpoint', `${this.baseURL}/api/v1/invalid-endpoint`);
      await this.testEndpoint('Root Path (404 Expected)', `${this.baseURL}/`);
   }

   generateReport() {
      this.log('\\n' + '='.repeat(60));
      this.log('COMPREHENSIVE API TEST RESULTS');
      this.log('='.repeat(60));

      const total = this.results.passed + this.results.failed;
      const successRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : '0.0';

      this.log(`Total Tests: ${total}`);
      this.log(`Passed: ${this.results.passed}`, 'success');
      this.log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'success');
      this.log(`Success Rate: ${successRate}%`);

      if (this.results.failed > 0) {
         this.log('\\n=== Failed Tests ===');
         this.results.tests
            .filter((test) => !test.success)
            .forEach((test) => {
               this.log(`❌ ${test.name}: ${test.status} ${test.error || ''}`);
               this.log(`   URL: ${test.url}`);
            });
      }

      this.log('\\n=== Analysis ===');
      const authErrors = this.results.tests.filter(
         (t) => !t.success && (t.status === 400 || t.status === 401 || t.status === 403)
      );
      const notFoundErrors = this.results.tests.filter((t) => !t.success && t.status === 404);
      const serverErrors = this.results.tests.filter((t) => !t.success && t.status >= 500);

      this.log(`Authentication/Validation Errors (400/401/403): ${authErrors.length}`);
      this.log(`Not Found Errors (404): ${notFoundErrors.length}`);
      this.log(`Server Errors (500+): ${serverErrors.length}`);

      return {
         success: this.results.failed === 0,
         total,
         passed: this.results.passed,
         failed: this.results.failed,
         successRate: parseFloat(successRate),
         authErrors: authErrors.length,
         notFoundErrors: notFoundErrors.length,
         serverErrors: serverErrors.length,
      };
   }

   async run() {
      try {
         this.log('🚀 Starting Comprehensive API Testing');
         this.log('Testing all endpoints with different contexts\\n');

         await this.startServer();

         // Run all test suites
         await this.runSystemTests();
         await this.runWebRouteTests();
         await this.runStaticAssetTests();
         await this.runAPIRouteTests();
         await this.runErrorHandlingTests();

         const summary = this.generateReport();

         if (summary.success) {
            this.log('\\n🎉 ALL TESTS PASSED!', 'success');
         } else {
            this.log(`\\n⚠️ ${summary.failed}/${summary.total} tests failed`, 'error');

            if (summary.authErrors > 0) {
               this.log('💡 Auth errors are expected for protected endpoints', 'info');
            }
            if (summary.notFoundErrors > 0) {
               this.log('💡 404 errors may indicate missing route definitions', 'info');
            }
            if (summary.serverErrors > 0) {
               this.log('⚠️ Server errors indicate actual problems that need fixing', 'error');
            }
         }

         return summary;
      } catch (error) {
         this.log(`Test suite failed: ${error.message}`, 'error');
         return { success: false, error: error.message };
      } finally {
         await this.stopServer();
      }
   }
}

// Run the test suite
if (require.main === module) {
   const tester = new ComprehensiveAPITester();
   tester
      .run()
      .then((result) => {
         process.exit(result.success ? 0 : 1);
      })
      .catch(console.error);
}

module.exports = ComprehensiveAPITester;
