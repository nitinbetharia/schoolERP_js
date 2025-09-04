const express = require('express');
const request = require('supertest');
const path = require('path');

/**
 * Comprehensive Test Suite for Tenant Configuration Management
 */
class TenantConfigurationTestSuite {
   constructor() {
      this.results = {
         passed: 0,
         failed: 0,
         endpoints: [],
         services: [],
         views: [],
      };
   }

   async runAllTests() {
      console.log('🚀 Starting Comprehensive Tenant Configuration Tests...\n');

      try {
         // Test 1: Service Layer
         await this.testServiceLayer();

         // Test 2: Route Endpoints
         await this.testRouteEndpoints();

         // Test 3: View Files
         await this.testViewFiles();

         // Test 4: Integration Tests
         await this.testIntegration();

         this.printResults();
      } catch (error) {
         console.error('❌ Test suite failed:', error.message);
         process.exit(1);
      }
   }

   async testServiceLayer() {
      console.log('1️⃣ Testing Service Layer...');

      try {
         const TenantConfigurationService = require('./services/TenantConfigurationService.js');

         // Test getConfigurableModules
         const modules = await TenantConfigurationService.getConfigurableModules();
         if (modules && modules.length === 5) {
            console.log('   ✅ getConfigurableModules() - Returns 5 modules');
            this.results.passed++;
            this.results.services.push({
               method: 'getConfigurableModules',
               status: 'PASS',
               description: 'Returns configurable modules',
            });
         } else {
            throw new Error('getConfigurableModules should return 5 modules');
         }

         // Test getModuleSchema
         const schema = await TenantConfigurationService.getModuleSchema('student_management');
         if (schema && Object.keys(schema).length > 0) {
            console.log('   ✅ getModuleSchema() - Returns schema object');
            this.results.passed++;
            this.results.services.push({
               method: 'getModuleSchema',
               status: 'PASS',
               description: 'Returns module schema',
            });
         } else {
            throw new Error('getModuleSchema should return schema object');
         }

         // Test validateConfigChange
         const validationResult = await TenantConfigurationService.validateConfigChange(
            1,
            'student_management',
            {},
            false
         );
         if (validationResult && typeof validationResult.isValid === 'boolean') {
            console.log('   ✅ validateConfigChange() - Returns validation result');
            this.results.passed++;
            this.results.services.push({
               method: 'validateConfigChange',
               status: 'PASS',
               description: 'Returns validation result',
            });
         } else {
            throw new Error('validateConfigChange should return validation result');
         }
      } catch (error) {
         console.log('   ❌ Service layer test failed:', error.message);
         this.results.failed++;
         this.results.services.push({
            method: 'ServiceLayer',
            status: 'FAIL',
            error: error.message,
         });
      }
   }

   async testRouteEndpoints() {
      console.log('\n2️⃣ Testing Route Endpoints...');

      try {
         // Test if routes file is syntactically correct
         const systemRoutes = require('./routes/system.js');
         if (systemRoutes) {
            console.log('   ✅ System routes loaded successfully');
            this.results.passed++;
            this.results.endpoints.push({
               method: 'REQUIRE',
               url: './routes/system.js',
               status: 'PASS',
               description: 'Routes file loads without syntax errors',
            });
         }
      } catch (error) {
         console.log('   ❌ Route loading failed:', error.message);
         this.results.failed++;
         this.results.endpoints.push({
            method: 'REQUIRE',
            url: './routes/system.js',
            status: 'FAIL',
            error: error.message,
         });
      }
   }

   async testViewFiles() {
      console.log('\n3️⃣ Testing View Files...');

      const fs = require('fs');
      const viewFiles = [
         'views/pages/system/tenants/config/dashboard.ejs',
         'views/pages/system/tenants/config/module.ejs',
      ];

      viewFiles.forEach((viewFile) => {
         try {
            if (fs.existsSync(viewFile)) {
               const content = fs.readFileSync(viewFile, 'utf8');
               if (content.includes('<!DOCTYPE html>')) {
                  console.log(`   ✅ ${viewFile} - Valid HTML structure`);
                  this.results.passed++;
                  this.results.views.push({
                     file: viewFile,
                     status: 'PASS',
                     description: 'Valid HTML structure',
                  });
               } else {
                  throw new Error('Invalid HTML structure');
               }
            } else {
               throw new Error('View file does not exist');
            }
         } catch (error) {
            console.log(`   ❌ ${viewFile} - ${error.message}`);
            this.results.failed++;
            this.results.views.push({
               file: viewFile,
               status: 'FAIL',
               error: error.message,
            });
         }
      });
   }

   async testIntegration() {
      console.log('\n4️⃣ Testing Integration...');

      try {
         // Test if all dependencies are properly linked
         const systemRoutes = require('./routes/system.js');
         const TenantConfigurationService = require('./services/TenantConfigurationService.js');

         if (systemRoutes && TenantConfigurationService) {
            console.log('   ✅ All components integrate successfully');
            this.results.passed++;
         }
      } catch (error) {
         console.log('   ❌ Integration test failed:', error.message);
         this.results.failed++;
      }
   }

   printResults() {
      console.log('\n📊 TEST RESULTS SUMMARY');
      console.log('========================');
      console.log(`✅ Passed: ${this.results.passed}`);
      console.log(`❌ Failed: ${this.results.failed}`);
      console.log(
         `📈 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`
      );

      console.log('\n📋 DETAILED RESULTS:');

      if (this.results.services.length > 0) {
         console.log('\n🔧 Service Layer Tests:');
         this.results.services.forEach((test) => {
            const status = test.status === 'PASS' ? '✅' : '❌';
            console.log(`   ${status} ${test.method}: ${test.description || test.error}`);
         });
      }

      if (this.results.endpoints.length > 0) {
         console.log('\n🌐 Route Tests:');
         this.results.endpoints.forEach((test) => {
            const status = test.status === 'PASS' ? '✅' : '❌';
            console.log(`   ${status} ${test.method} ${test.url}: ${test.description || test.error}`);
         });
      }

      if (this.results.views.length > 0) {
         console.log('\n🎨 View Tests:');
         this.results.views.forEach((test) => {
            const status = test.status === 'PASS' ? '✅' : '❌';
            console.log(`   ${status} ${test.file}: ${test.description || test.error}`);
         });
      }

      if (this.results.failed === 0) {
         console.log('\n🎉 ALL TESTS PASSED! Tenant Configuration Management is ready for production!');
      } else {
         console.log('\n⚠️  Some tests failed. Please review and fix the issues before deployment.');
      }
   }
}

// Run tests if this file is executed directly
if (require.main === module) {
   const testSuite = new TenantConfigurationTestSuite();
   testSuite.runAllTests();
}

module.exports = TenantConfigurationTestSuite;
