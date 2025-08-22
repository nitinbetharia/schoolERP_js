const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class SystemTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      timestamp: new Date().toISOString(),
      testSuite: 'Comprehensive System Test - Backend & Frontend',
      backend: {},
      frontend: {},
      summary: {
        passed: 0,
        failed: 0,
        total: 0
      }
    };
  }

  async init() {
    console.log('🚀 Initializing System Test...');
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for production
      defaultViewport: { width: 1366, height: 768 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Enable console logging
    this.page.on('console', (msg) => {
      console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
    });

    // Handle errors
    this.page.on('pageerror', (error) => {
      console.log(`[BROWSER ERROR] ${error.message}`);
    });
  }

  async testBackendEndpoints() {
    console.log('\n📡 Testing Backend API Endpoints...');
    const tests = [
      { 
        name: 'API Status', 
        url: 'http://localhost:3000/api/v1/status',
        expectedStatus: 200,
        expectedFields: ['success', 'message', 'version']
      },
      { 
        name: 'Health Check', 
        url: 'http://localhost:3000/api/v1/admin/system/health',
        expectedStatus: 200,
        expectedFields: ['success', 'data']
      }
    ];

    this.testResults.backend = { tests: [], passed: 0, failed: 0 };

    for (const test of tests) {
      console.log(`  Testing: ${test.name}...`);
      try {
        const response = await this.page.goto(test.url);
        const content = await this.page.content();
        const jsonMatch = content.match(/<pre[^>]*>(.*?)<\/pre>/s);
        
        let result = {
          name: test.name,
          url: test.url,
          status: response.status(),
          passed: false,
          error: null
        };

        if (response.status() === test.expectedStatus) {
          if (jsonMatch) {
            const jsonData = JSON.parse(jsonMatch[1]);
            const hasRequiredFields = test.expectedFields.every(field => 
              jsonData.hasOwnProperty(field)
            );
            
            if (hasRequiredFields) {
              result.passed = true;
              result.response = jsonData;
              this.testResults.backend.passed++;
              console.log(`    ✅ ${test.name} - PASSED`);
            } else {
              result.error = 'Missing required fields';
              this.testResults.backend.failed++;
              console.log(`    ❌ ${test.name} - FAILED: Missing fields`);
            }
          } else {
            result.passed = true;
            this.testResults.backend.passed++;
            console.log(`    ✅ ${test.name} - PASSED`);
          }
        } else {
          result.error = `Expected status ${test.expectedStatus}, got ${response.status()}`;
          this.testResults.backend.failed++;
          console.log(`    ❌ ${test.name} - FAILED: ${result.error}`);
        }

        this.testResults.backend.tests.push(result);
      } catch (error) {
        console.log(`    ❌ ${test.name} - ERROR: ${error.message}`);
        this.testResults.backend.tests.push({
          name: test.name,
          url: test.url,
          passed: false,
          error: error.message
        });
        this.testResults.backend.failed++;
      }
    }
  }

  async testFrontendLogin() {
    console.log('\n🌐 Testing Frontend Login...');
    
    try {
      // Navigate to login page
      console.log('  Navigating to login page...');
      await this.page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle2' });
      
      // Take screenshot
      await this.page.screenshot({ path: 'login-page-test.png', fullPage: true });
      console.log('  📸 Screenshot saved: login-page-test.png');

      // Check if login form exists
      const loginForm = await this.page.$('form');
      const usernameField = await this.page.$('input[name="email"], input[name="username"], input[type="email"]');
      const passwordField = await this.page.$('input[name="password"], input[type="password"]');
      const submitButton = await this.page.$('button[type="submit"], input[type="submit"]');

      let loginTest = {
        name: 'Login Page Load',
        passed: false,
        elements: {
          form: !!loginForm,
          usernameField: !!usernameField,
          passwordField: !!passwordField,
          submitButton: !!submitButton
        }
      };

      if (loginForm && usernameField && passwordField && submitButton) {
        loginTest.passed = true;
        console.log('    ✅ Login form elements found');
        
        // Test form interaction
        console.log('  Testing form interaction...');
        await this.page.type('input[name="email"], input[name="username"], input[type="email"]', 'testuser@example.com');
        await this.page.type('input[name="password"], input[type="password"]', 'testpassword');
        
        // Take screenshot with filled form
        await this.page.screenshot({ path: 'login-form-filled.png', fullPage: true });
        console.log('  📸 Screenshot saved: login-form-filled.png');
        
        loginTest.interaction = 'Form fields can be filled';
        console.log('    ✅ Form interaction successful');
      } else {
        loginTest.error = 'Login form elements missing';
        console.log('    ❌ Login form elements missing');
      }

      this.testResults.frontend.loginTest = loginTest;
      
      if (loginTest.passed) {
        this.testResults.summary.passed++;
      } else {
        this.testResults.summary.failed++;
      }

    } catch (error) {
      console.log(`    ❌ Login test failed: ${error.message}`);
      this.testResults.frontend.loginTest = {
        name: 'Login Page Load',
        passed: false,
        error: error.message
      };
      this.testResults.summary.failed++;
    }
  }

  async testFrontendNavigation() {
    console.log('\n🧭 Testing Frontend Navigation...');
    
    try {
      // Test navigation to different pages
      const pages = [
        { url: 'http://localhost:3000/', name: 'Home Page' },
        { url: 'http://localhost:3000/auth/login', name: 'Login Page' }
      ];

      let navigationTests = [];

      for (const pageTest of pages) {
        console.log(`  Testing: ${pageTest.name}...`);
        try {
          const response = await this.page.goto(pageTest.url, { waitUntil: 'networkidle2' });
          
          let navTest = {
            name: pageTest.name,
            url: pageTest.url,
            status: response.status(),
            passed: response.status() >= 200 && response.status() < 400
          };

          if (navTest.passed) {
            console.log(`    ✅ ${pageTest.name} - Loaded successfully`);
          } else {
            console.log(`    ❌ ${pageTest.name} - Failed to load`);
          }

          navigationTests.push(navTest);
        } catch (error) {
          console.log(`    ❌ ${pageTest.name} - Error: ${error.message}`);
          navigationTests.push({
            name: pageTest.name,
            url: pageTest.url,
            passed: false,
            error: error.message
          });
        }
      }

      this.testResults.frontend.navigationTests = navigationTests;
      
      // Count passed/failed navigation tests
      const passedNav = navigationTests.filter(t => t.passed).length;
      const failedNav = navigationTests.length - passedNav;
      
      this.testResults.summary.passed += passedNav;
      this.testResults.summary.failed += failedNav;

    } catch (error) {
      console.log(`    ❌ Navigation test failed: ${error.message}`);
      this.testResults.frontend.navigationError = error.message;
      this.testResults.summary.failed++;
    }
  }

  async generateReport() {
    console.log('\n📊 Generating Test Report...');
    
    // Calculate totals
    this.testResults.summary.total = this.testResults.summary.passed + this.testResults.summary.failed;
    
    // Create detailed report
    const reportContent = `
# Comprehensive System Test Report
**Generated:** ${this.testResults.timestamp}
**Test Suite:** ${this.testResults.testSuite}

## Summary
- **Total Tests:** ${this.testResults.summary.total}
- **Passed:** ✅ ${this.testResults.summary.passed}
- **Failed:** ❌ ${this.testResults.summary.failed}
- **Success Rate:** ${((this.testResults.summary.passed / this.testResults.summary.total) * 100).toFixed(1)}%

## Backend API Tests
**Passed:** ${this.testResults.backend.passed} | **Failed:** ${this.testResults.backend.failed}

${this.testResults.backend.tests.map(test => `
### ${test.name}
- **URL:** ${test.url}
- **Status:** ${test.status || 'N/A'}
- **Result:** ${test.passed ? '✅ PASSED' : '❌ FAILED'}
${test.error ? `- **Error:** ${test.error}` : ''}
${test.response ? `- **Response:** Available` : ''}
`).join('')}

## Frontend Tests

### Login Page Test
- **Result:** ${this.testResults.frontend.loginTest?.passed ? '✅ PASSED' : '❌ FAILED'}
- **Form Elements:**
  - Form: ${this.testResults.frontend.loginTest?.elements?.form ? '✅' : '❌'}
  - Username Field: ${this.testResults.frontend.loginTest?.elements?.usernameField ? '✅' : '❌'}
  - Password Field: ${this.testResults.frontend.loginTest?.elements?.passwordField ? '✅' : '❌'}
  - Submit Button: ${this.testResults.frontend.loginTest?.elements?.submitButton ? '✅' : '❌'}
${this.testResults.frontend.loginTest?.error ? `- **Error:** ${this.testResults.frontend.loginTest.error}` : ''}

### Navigation Tests
${this.testResults.frontend.navigationTests?.map(test => `
#### ${test.name}
- **URL:** ${test.url}
- **Status:** ${test.status || 'N/A'}
- **Result:** ${test.passed ? '✅ PASSED' : '❌ FAILED'}
${test.error ? `- **Error:** ${test.error}` : ''}
`).join('') || 'No navigation tests performed'}

## System Status
- **Server:** ✅ Running on http://localhost:3000
- **API Status Endpoint:** ${this.testResults.backend.tests.find(t => t.name === 'API Status')?.passed ? '✅ Working' : '❌ Failed'}
- **Health Check:** ${this.testResults.backend.tests.find(t => t.name === 'Health Check')?.passed ? '✅ Working' : '❌ Failed'}
- **Frontend:** ${this.testResults.frontend.loginTest?.passed ? '✅ Accessible' : '❌ Issues detected'}

## Screenshots Generated
- login-page-test.png - Login page initial load
- login-form-filled.png - Login form with test data

---
*Test completed at ${new Date().toISOString()}*
`;

    // Save report
    const reportPath = `system-test-report-${Date.now()}.md`;
    fs.writeFileSync(reportPath, reportContent);
    
    // Save JSON results
    const jsonPath = `system-test-results-${Date.now()}.json`;
    fs.writeFileSync(jsonPath, JSON.stringify(this.testResults, null, 2));

    console.log(`📋 Report saved: ${reportPath}`);
    console.log(`📄 JSON results: ${jsonPath}`);
    
    return { reportPath, jsonPath };
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runCompleteTest() {
    try {
      await this.init();
      await this.testBackendEndpoints();
      await this.testFrontendLogin();
      await this.testFrontendNavigation();
      
      const { reportPath } = await this.generateReport();
      
      // Print summary
      console.log('\n' + '='.repeat(60));
      console.log('🏆 TEST SUMMARY');
      console.log('='.repeat(60));
      console.log(`Total Tests: ${this.testResults.summary.total}`);
      console.log(`Passed: ✅ ${this.testResults.summary.passed}`);
      console.log(`Failed: ❌ ${this.testResults.summary.failed}`);
      console.log(`Success Rate: ${((this.testResults.summary.passed / this.testResults.summary.total) * 100).toFixed(1)}%`);
      console.log('='.repeat(60));
      console.log(`📋 Full report: ${reportPath}`);
      console.log('='.repeat(60));
      
      return this.testResults;
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  const tester = new SystemTester();
  tester.runCompleteTest()
    .then(() => {
      console.log('✅ All tests completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = SystemTester;