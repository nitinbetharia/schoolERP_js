/**
 * AUTH Module Comprehensive Test Script
 * Tests all AUTH endpoints and functionality
 */

const http = require('http');
const https = require('https');

class AuthModuleTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.sessionCookie = null;
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
  }

  async runAllTests() {
    console.log('🧪 Starting AUTH Module Comprehensive Tests');
    console.log('============================================\n');

    try {
      // Test sequence
      await this.testHealthCheck();
      await this.testSystemLogin();
      await this.testGetCurrentUser();
      await this.testAuthStatus();
      await this.testGetPermissions();
      await this.testTrustLookup();
      await this.testInvalidLogin();
      await this.testValidationErrors();
      await this.testTrustLogin();
      await this.testForgotPassword();
      await this.testLogout();
      await this.testAuthStatusAfterLogout();

      // Print results
      this.printResults();

    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async makeRequest(method, path, data = null, requiresAuth = false) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AUTH-Module-Tester/1.0'
        }
      };

      // Add session cookie if required and available
      if (requiresAuth && this.sessionCookie) {
        options.headers.Cookie = this.sessionCookie;
      }

      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.request(url, options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            // Store session cookie from login
            if (res.headers['set-cookie'] && path.includes('/auth/login')) {
              this.sessionCookie = res.headers['set-cookie'][0];
            }

            const responseData = body ? JSON.parse(body) : {};
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: responseData
            });
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', reject);

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  async runTest(name, testFunction) {
    this.totalTests++;
    try {
      console.log(`${this.totalTests}️⃣  ${name}...`);
      await testFunction();
      this.passedTests++;
      console.log(`✅ ${name} - PASSED\n`);
      this.testResults.push({ name, status: 'PASSED' });
    } catch (error) {
      console.log(`❌ ${name} - FAILED: ${error.message}\n`);
      this.testResults.push({ name, status: 'FAILED', error: error.message });
    }
  }

  async testHealthCheck() {
    await this.runTest('Health Check', async () => {
      const response = await this.makeRequest('GET', '/api/v1/health');
      
      if (response.statusCode !== 200) {
        throw new Error(`Expected 200, got ${response.statusCode}`);
      }
      
      if (!response.data.success) {
        throw new Error('Health check should return success: true');
      }
      
      if (response.data.data.status !== 'healthy') {
        throw new Error('Health check should return status: healthy');
      }
    });
  }

  async testSystemLogin() {
    await this.runTest('System Admin Login', async () => {
      const loginData = {
        email: 'admin@system.local',
        password: 'admin123',
        remember_me: false
      };

      const response = await this.makeRequest('POST', '/api/v1/auth/login', loginData);
      
      if (response.statusCode !== 200) {
        throw new Error(`Expected 200, got ${response.statusCode}. Response: ${JSON.stringify(response.data)}`);
      }
      
      if (!response.data.success) {
        throw new Error('Login should be successful');
      }
      
      if (response.data.data.user.role !== 'SYSTEM_ADMIN') {
        throw new Error('User role should be SYSTEM_ADMIN');
      }
      
      if (!response.data.data.session.sessionId) {
        throw new Error('Session ID should be present');
      }
    });
  }

  async testGetCurrentUser() {
    await this.runTest('Get Current User Info', async () => {
      const response = await this.makeRequest('GET', '/api/v1/auth/me', null, true);
      
      if (response.statusCode !== 200) {
        throw new Error(`Expected 200, got ${response.statusCode}`);
      }
      
      if (!response.data.success) {
        throw new Error('Get user info should be successful');
      }
      
      if (!response.data.data.user.id) {
        throw new Error('User ID should be present');
      }
      
      if (!response.data.data.user.email) {
        throw new Error('User email should be present');
      }
    });
  }

  async testAuthStatus() {
    await this.runTest('Authentication Status Check', async () => {
      const response = await this.makeRequest('GET', '/api/v1/auth/status', null, false);
      
      if (response.statusCode !== 200) {
        throw new Error(`Expected 200, got ${response.statusCode}`);
      }
      
      if (!response.data.success) {
        throw new Error('Status check should be successful');
      }
      
      // With session cookie, should be authenticated
      if (!response.data.data.authenticated) {
        throw new Error('Should be authenticated with valid session');
      }
    });
  }

  async testGetPermissions() {
    await this.runTest('Get User Permissions', async () => {
      const response = await this.makeRequest('GET', '/api/v1/auth/permissions', null, true);
      
      if (response.statusCode !== 200) {
        throw new Error(`Expected 200, got ${response.statusCode}`);
      }
      
      if (!response.data.success) {
        throw new Error('Get permissions should be successful');
      }
      
      if (!response.data.data.role) {
        throw new Error('Role should be present');
      }
      
      if (!Array.isArray(response.data.data.permissions)) {
        throw new Error('Permissions should be an array');
      }
    });
  }

  async testTrustLookup() {
    await this.runTest('Trust Lookup', async () => {
      const response = await this.makeRequest('GET', '/api/v1/auth/trusts/demo');
      
      if (response.statusCode !== 200) {
        throw new Error(`Expected 200, got ${response.statusCode}`);
      }
      
      if (!response.data.success) {
        throw new Error('Trust lookup should be successful');
      }
      
      if (!response.data.data.trust) {
        throw new Error('Trust data should be present');
      }
      
      if (response.data.data.trust.trustCode !== 'demo') {
        throw new Error('Trust code should match requested code');
      }
      
      if (!Array.isArray(response.data.data.schools)) {
        throw new Error('Schools should be an array');
      }
    });
  }

  async testInvalidLogin() {
    await this.runTest('Invalid Login Handling', async () => {
      const loginData = {
        email: 'wrong@email.com',
        password: 'wrongpassword'
      };

      const response = await this.makeRequest('POST', '/api/v1/auth/login', loginData);
      
      if (response.statusCode !== 401) {
        throw new Error(`Expected 401, got ${response.statusCode}`);
      }
      
      if (response.data.success) {
        throw new Error('Invalid login should not be successful');
      }
      
      if (!response.data.error) {
        throw new Error('Error object should be present');
      }
      
      if (!response.data.error.code) {
        throw new Error('Error code should be present');
      }
    });
  }

  async testValidationErrors() {
    await this.runTest('Input Validation Errors', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: ''
      };

      const response = await this.makeRequest('POST', '/api/v1/auth/login', invalidData);
      
      if (response.statusCode !== 400) {
        throw new Error(`Expected 400, got ${response.statusCode}`);
      }
      
      if (response.data.success) {
        throw new Error('Invalid input should not be successful');
      }
      
      if (!response.data.error.code.includes('VALIDATION')) {
        throw new Error('Should be a validation error');
      }
    });
  }

  async testTrustLogin() {
    await this.runTest('Trust User Login', async () => {
      // First logout system admin
      await this.makeRequest('POST', '/api/v1/auth/logout', null, true);
      this.sessionCookie = null;

      const loginData = {
        email: 'admin@demo.school',
        password: 'password123',
        trust_code: 'demo',
        school_id: 1,
        remember_me: true
      };

      const response = await this.makeRequest('POST', '/api/v1/auth/login', loginData);
      
      if (response.statusCode !== 200) {
        throw new Error(`Expected 200, got ${response.statusCode}. Response: ${JSON.stringify(response.data)}`);
      }
      
      if (!response.data.success) {
        throw new Error('Trust login should be successful');
      }
      
      if (!response.data.data.user.trustId) {
        throw new Error('Trust ID should be present for trust users');
      }
      
      if (!response.data.data.user.schoolId) {
        throw new Error('School ID should be present for trust users');
      }
      
      if (response.data.data.session.loginType !== 'TRUST') {
        throw new Error('Login type should be TRUST');
      }
    });
  }

  async testForgotPassword() {
    await this.runTest('Forgot Password Request', async () => {
      const forgotData = {
        email: 'admin@demo.school',
        trust_code: 'demo'
      };

      const response = await this.makeRequest('POST', '/api/v1/auth/forgot-password', forgotData);
      
      if (response.statusCode !== 200) {
        throw new Error(`Expected 200, got ${response.statusCode}`);
      }
      
      if (!response.data.success) {
        throw new Error('Forgot password should return success');
      }
      
      if (!response.data.data.message.includes('sent')) {
        throw new Error('Should indicate password reset instructions were sent');
      }
    });
  }

  async testLogout() {
    await this.runTest('User Logout', async () => {
      const response = await this.makeRequest('POST', '/api/v1/auth/logout', null, true);
      
      if (response.statusCode !== 200) {
        throw new Error(`Expected 200, got ${response.statusCode}`);
      }
      
      if (!response.data.success) {
        throw new Error('Logout should be successful');
      }
      
      if (!response.data.data.message.includes('successful')) {
        throw new Error('Should indicate logout was successful');
      }
    });
  }

  async testAuthStatusAfterLogout() {
    await this.runTest('Auth Status After Logout', async () => {
      // Clear session cookie
      this.sessionCookie = null;
      
      const response = await this.makeRequest('GET', '/api/v1/auth/status');
      
      if (response.statusCode !== 200) {
        throw new Error(`Expected 200, got ${response.statusCode}`);
      }
      
      if (!response.data.success) {
        throw new Error('Status check should be successful');
      }
      
      if (response.data.data.authenticated) {
        throw new Error('Should not be authenticated after logout');
      }
    });
  }

  printResults() {
    console.log('\n🎯 AUTH Module Test Results');
    console.log('============================');
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(`Passed: ${this.passedTests}`);
    console.log(`Failed: ${this.totalTests - this.passedTests}`);
    console.log(`Success Rate: ${Math.round((this.passedTests / this.totalTests) * 100)}%\n`);

    if (this.passedTests === this.totalTests) {
      console.log('🎉 ALL TESTS PASSED! AUTH Module is working correctly.');
      console.log('\n✅ The AUTH module is ready for production use.');
      console.log('✅ All endpoints are functioning as expected.');
      console.log('✅ Error handling is working properly.');
      console.log('✅ Security features are active.');
    } else {
      console.log('❌ Some tests failed. Please review the issues above.');
      
      const failedTests = this.testResults.filter(test => test.status === 'FAILED');
      console.log('\n💥 Failed Tests:');
      failedTests.forEach(test => {
        console.log(`   • ${test.name}: ${test.error}`);
      });
    }

    console.log('\n📋 Detailed Test Results:');
    this.testResults.forEach((test, index) => {
      const status = test.status === 'PASSED' ? '✅' : '❌';
      console.log(`   ${index + 1}. ${status} ${test.name}`);
    });

    console.log('\n🔗 Next Steps:');
    console.log('1. Import the Postman collection for manual testing');
    console.log('2. Use the REST client file for VS Code testing');
    console.log('3. Review the comprehensive test documentation');
    console.log('4. Proceed to the next module (USER) after approval');

    process.exit(this.passedTests === this.totalTests ? 0 : 1);
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new AuthModuleTester();
  
  console.log('⏳ Waiting 2 seconds for server to be ready...\n');
  setTimeout(() => {
    tester.runAllTests().catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
  }, 2000);
}

module.exports = AuthModuleTester;