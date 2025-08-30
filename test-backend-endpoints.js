/**
 * Comprehensive Backend API Test Suite
 * Tests all critical endpoints and functionality after modularization
 */

const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class BackendAPITester {
   constructor() {
      this.baseURL = 'http://localhost:3000';
      this.server = null;
      this.results = {
         passed: 0,
         failed: 0,
         tests: [],
      };
   }

   log(message, type = 'info') {
      const timestamp = new Date().toISOString();
      const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔍';
      console.log(`${prefix} [${timestamp}] ${message}`);
   }

   async startServer() {
      return new Promise((resolve, reject) => {
         this.log('Starting server for API tests...');

         this.server = spawn('node', ['server.js'], {
            cwd: process.cwd(),
            stdio: ['ignore', 'pipe', 'pipe'],
            env: { ...process.env, NODE_ENV: 'test' },
         });

         let serverReady = false;
         let startupOutput = '';

         const checkServerReady = (data) => {
            startupOutput += data.toString();
            if (data.toString().includes('School ERP Server is running!') && !serverReady) {
               serverReady = true;
               this.log('Server started successfully');
               setTimeout(resolve, 2000); // Give server time to fully initialize
            }
         };

         this.server.stdout.on('data', checkServerReady);
         this.server.stderr.on('data', checkServerReady);

         this.server.on('error', (error) => {
            this.log(`Server startup error: ${error.message}`, 'error');
            reject(error);
         });

         // Timeout after 30 seconds
         setTimeout(() => {
            if (!serverReady) {
               this.log('Server startup timeout', 'error');
               this.log(`Startup output: ${startupOutput}`);
               reject(new Error('Server startup timeout'));
            }
         }, 30000);
      });
   }

   async stopServer() {
      if (this.server) {
         this.log('Stopping server...');
         this.server.kill('SIGTERM');

         return new Promise((resolve) => {
            this.server.on('close', () => {
               this.log('Server stopped');
               resolve();
            });

            // Force kill after 5 seconds
            setTimeout(() => {
               if (this.server) {
                  this.server.kill('SIGKILL');
               }
               resolve();
            }, 5000);
         });
      }
   }

   async testEndpoint(name, options) {
      try {
         const startTime = Date.now();
         const response = await axios({
            timeout: 10000,
            validateStatus: () => true, // Don't throw on any status code
            ...options,
         });

         const duration = Date.now() - startTime;
         const success = response.status >= 200 && response.status < 400;

         const result = {
            name,
            success,
            status: response.status,
            duration: `${duration}ms`,
            url: options.url,
            method: options.method || 'GET',
            error: success ? null : `HTTP ${response.status}`,
            responseSize: JSON.stringify(response.data).length,
         };

         if (success) {
            this.results.passed++;
            this.log(`✓ ${name}: ${response.status} (${duration}ms)`, 'success');
         } else {
            this.results.failed++;
            this.log(`✗ ${name}: ${response.status} (${duration}ms)`, 'error');
         }

         this.results.tests.push(result);
         return result;
      } catch (error) {
         this.results.failed++;
         const result = {
            name,
            success: false,
            status: 'ERROR',
            duration: '0ms',
            url: options.url,
            method: options.method || 'GET',
            error: error.code || error.message,
            responseSize: 0,
         };

         this.log(`✗ ${name}: ${error.code || error.message}`, 'error');
         this.results.tests.push(result);
         return result;
      }
   }

   async runHealthChecks() {
      this.log('\n=== Health Check Tests ===');

      await this.testEndpoint('System Health Check', {
         url: `${this.baseURL}/api/v1/admin/system/health`,
         method: 'GET',
      });

      await this.testEndpoint('API Status Check', {
         url: `${this.baseURL}/api/v1/status`,
         method: 'GET',
      });

      await this.testEndpoint('Database Health', {
         url: `${this.baseURL}/api/v1/admin/system/database-status`,
         method: 'GET',
      });
   }

   async runAuthenticationTests() {
      this.log('\n=== Authentication Tests ===');

      await this.testEndpoint('Login Page (System Admin)', {
         url: `${this.baseURL}/login`,
         method: 'GET',
      });

      await this.testEndpoint('Login Page (Tenant - Demo)', {
         url: `${this.baseURL}/login`,
         method: 'GET',
         headers: { Host: 'demo.localhost:3000' },
      });

      await this.testEndpoint('Login Page (Tenant - Maroon)', {
         url: `${this.baseURL}/login`,
         method: 'GET',
         headers: { Host: 'maroon.localhost:3000' },
      });
   }

   async runStaticAssetTests() {
      this.log('\n=== Static Asset Tests ===');

      await this.testEndpoint('CSS Assets', {
         url: `${this.baseURL}/static/css/app.css`,
         method: 'GET',
      });

      await this.testEndpoint('JS Assets', {
         url: `${this.baseURL}/static/js/app.js`,
         method: 'GET',
      });

      await this.testEndpoint('Favicon', {
         url: `${this.baseURL}/static/images/favicon.ico`,
         method: 'GET',
      });
   }

   async runAPIEndpointTests() {
      this.log('\n=== API Endpoint Tests ===');

      // Test various API endpoints that should exist
      const endpoints = [
         '/api/v1/students',
         '/api/v1/schools',
         '/api/v1/academic-years',
         '/api/v1/system/tenants',
         '/api/v1/admin/users',
         '/api/v1/fees/configurations',
         '/api/v1/admin/system/info',
      ];

      for (const endpoint of endpoints) {
         await this.testEndpoint(`API Endpoint: ${endpoint}`, {
            url: `${this.baseURL}${endpoint}`,
            method: 'GET',
         });
      }
   }

   async runModularComponentTests() {
      this.log('\n=== Modular Component Integration Tests ===');

      // Test endpoints that use our modularized components
      await this.testEndpoint('Student Validation (Uses Modularized Components)', {
         url: `${this.baseURL}/api/v1/students/validate`,
         method: 'POST',
         data: { name: 'Test Student', email: 'test@example.com' },
         headers: { 'Content-Type': 'application/json' },
      });

      await this.testEndpoint('Fee Configuration (Uses Modularized Components)', {
         url: `${this.baseURL}/api/v1/fees/configurations`,
         method: 'GET',
      });

      await this.testEndpoint('School Management (Uses Modularized Components)', {
         url: `${this.baseURL}/api/v1/schools`,
         method: 'GET',
      });
   }

   async runErrorHandlingTests() {
      this.log('\n=== Error Handling Tests ===');

      await this.testEndpoint('404 Error Handling', {
         url: `${this.baseURL}/nonexistent-endpoint`,
         method: 'GET',
      });

      await this.testEndpoint('Invalid API Endpoint', {
         url: `${this.baseURL}/api/v1/invalid-endpoint`,
         method: 'GET',
      });

      await this.testEndpoint('Malformed Request', {
         url: `${this.baseURL}/api/v1/students`,
         method: 'POST',
         data: 'invalid-json',
         headers: { 'Content-Type': 'application/json' },
      });
   }

   generateReport() {
      this.log('\n' + '='.repeat(60));
      this.log('COMPREHENSIVE BACKEND API TEST RESULTS');
      this.log('='.repeat(60));

      const total = this.results.passed + this.results.failed;
      const successRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : '0.0';

      this.log(`Total Tests: ${total}`);
      this.log(`Passed: ${this.results.passed}`, 'success');
      this.log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'success');
      this.log(`Success Rate: ${successRate}%`);

      if (this.results.failed > 0) {
         this.log('\n=== Failed Tests Details ===');
         this.results.tests
            .filter((test) => !test.success)
            .forEach((test) => {
               this.log(`❌ ${test.name}: ${test.error} (${test.method} ${test.url})`);
            });
      }

      this.log('\n=== Performance Summary ===');
      const avgDuration = this.results.tests
         .filter((test) => test.duration !== '0ms')
         .map((test) => parseInt(test.duration))
         .reduce((sum, dur, _, arr) => sum + dur / arr.length, 0);

      this.log(`Average Response Time: ${avgDuration.toFixed(0)}ms`);

      // Save detailed report
      const reportPath = path.join(process.cwd(), 'backend-api-test-report.json');
      fs.writeFileSync(
         reportPath,
         JSON.stringify(
            {
               timestamp: new Date().toISOString(),
               summary: {
                  total,
                  passed: this.results.passed,
                  failed: this.results.failed,
                  successRate: parseFloat(successRate),
                  averageResponseTime: avgDuration,
               },
               tests: this.results.tests,
            },
            null,
            2
         )
      );

      this.log(`\nDetailed report saved to: ${reportPath}`);

      return {
         success: this.results.failed === 0,
         total,
         passed: this.results.passed,
         failed: this.results.failed,
      };
   }

   async run() {
      try {
         this.log('🚀 Starting Comprehensive Backend API Test Suite');
         this.log('Testing modularized SchoolERP application...\n');

         await this.startServer();

         // Wait a moment for server to be fully ready
         await new Promise((resolve) => setTimeout(resolve, 3000));

         // Run all test suites
         await this.runHealthChecks();
         await this.runAuthenticationTests();
         await this.runStaticAssetTests();
         await this.runAPIEndpointTests();
         await this.runModularComponentTests();
         await this.runErrorHandlingTests();

         const summary = this.generateReport();

         if (summary.success) {
            this.log('\n🎉 ALL BACKEND API TESTS PASSED!', 'success');
            this.log('The modularized codebase is functioning correctly.', 'success');
         } else {
            this.log(`\n⚠️  Some tests failed (${summary.failed}/${summary.total})`, 'error');
            this.log('Review the failed tests above for details.', 'error');
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
async function main() {
   const tester = new BackendAPITester();
   const result = await tester.run();
   process.exit(result.success ? 0 : 1);
}

if (require.main === module) {
   main().catch(console.error);
}

module.exports = BackendAPITester;
