/**
 * Frontend Test Suite using Puppeteer
 * Tests UI functionality and frontend/backend integration
 */

const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

async function testFrontendWithPuppeteer() {
   console.log('🎭 Starting Frontend Tests with Puppeteer');
   console.log('='.repeat(50));

   let browser = null;
   let server = null;
   const results = { passed: 0, failed: 0, tests: [] };

   try {
      // Start server
      console.log('📡 Starting server...');
      server = spawn('node', ['server.js'], {
         stdio: 'pipe',
         env: { ...process.env, NODE_ENV: 'test' },
      });

      // Wait for server to be ready
      await new Promise((resolve) => {
         const checkReady = (data) => {
            if (data.toString().includes('School ERP Server is running!')) {
               console.log('✅ Server started successfully');
               setTimeout(resolve, 3000); // Extra time for full startup
            }
         };
         server.stdout.on('data', checkReady);
         server.stderr.on('data', checkReady);

         setTimeout(() => {
            console.log('⏰ Proceeding with tests...');
            resolve();
         }, 15000);
      });

      // Launch browser
      console.log('🚀 Launching browser...');
      browser = await puppeteer.launch({
         headless: true,
         args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();

      // Set longer timeout
      page.setDefaultTimeout(10000);

      // Test 1: System Admin Login Page
      console.log('\n🔍 Testing System Admin Login Page...');
      try {
         await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });

         const title = await page.title();
         const hasLoginForm = (await page.$('form')) !== null;
         const hasUsernameField = (await page.$('input[name="email"], input[name="username"]')) !== null;
         const hasPasswordField = (await page.$('input[type="password"]')) !== null;
         const hasSubmitButton = (await page.$('button[type="submit"], input[type="submit"]')) !== null;

         if (title && hasLoginForm && hasUsernameField && hasPasswordField && hasSubmitButton) {
            console.log('✅ System Admin Login Page: PASSED');
            console.log(`   - Title: ${title}`);
            console.log('   - Login form elements present');
            results.passed++;
         } else {
            console.log('❌ System Admin Login Page: FAILED');
            console.log(`   - Title: ${title}`);
            console.log(
               `   - Form: ${hasLoginForm}, Username: ${hasUsernameField}, Password: ${hasPasswordField}, Submit: ${hasSubmitButton}`
            );
            results.failed++;
         }
      } catch (error) {
         console.log(`❌ System Admin Login Page: ERROR - ${error.message}`);
         results.failed++;
      }

      // Test 2: Tenant Login Page (Demo)
      console.log('\n🔍 Testing Tenant Login Page (Demo)...');
      try {
         await page.goto('http://demo.localhost:3000/login', { waitUntil: 'networkidle0' });

         const title = await page.title();
         const hasLoginForm = (await page.$('form')) !== null;
         const pageContent = await page.content();
         const hasTenantBranding = pageContent.includes('Demo') || pageContent.includes('demo');

         if (title && hasLoginForm) {
            console.log('✅ Tenant Login Page (Demo): PASSED');
            console.log(`   - Title: ${title}`);
            console.log(`   - Tenant branding detected: ${hasTenantBranding}`);
            results.passed++;
         } else {
            console.log('❌ Tenant Login Page (Demo): FAILED');
            results.failed++;
         }
      } catch (error) {
         console.log(`❌ Tenant Login Page (Demo): ERROR - ${error.message}`);
         results.failed++;
      }

      // Test 3: Static Assets Loading
      console.log('\n🔍 Testing Static Assets Loading...');
      try {
         await page.goto('http://localhost:3000/login');

         // Check if CSS loaded
         const cssLoaded = await page.evaluate(() => {
            const styles = document.styleSheets;
            return styles.length > 0;
         });

         // Check if any JavaScript errors occurred
         const jsErrors = [];
         page.on('pageerror', (error) => jsErrors.push(error.message));

         if (cssLoaded && jsErrors.length === 0) {
            console.log('✅ Static Assets Loading: PASSED');
            console.log('   - CSS files loaded successfully');
            console.log('   - No JavaScript errors');
            results.passed++;
         } else {
            console.log('❌ Static Assets Loading: ISSUES');
            console.log(`   - CSS loaded: ${cssLoaded}`);
            console.log(`   - JS errors: ${jsErrors.length}`);
            results.failed++;
         }
      } catch (error) {
         console.log(`❌ Static Assets Loading: ERROR - ${error.message}`);
         results.failed++;
      }

      // Test 4: Login Form Interaction
      console.log('\n🔍 Testing Login Form Interaction...');
      try {
         await page.goto('http://localhost:3000/login');

         // Find and fill login fields
         const usernameField = await page.$('input[name="email"], input[name="username"]');
         const passwordField = await page.$('input[type="password"]');

         if (usernameField && passwordField) {
            await usernameField.type('testuser');
            await passwordField.type('testpass');

            const usernameValue = await usernameField.evaluate((el) => el.value);
            const passwordValue = await passwordField.evaluate((el) => el.value);

            if (usernameValue === 'testuser' && passwordValue === 'testpass') {
               console.log('✅ Login Form Interaction: PASSED');
               console.log('   - Form fields can be filled');
               results.passed++;
            } else {
               console.log('❌ Login Form Interaction: FAILED - Values not set correctly');
               results.failed++;
            }
         } else {
            console.log('❌ Login Form Interaction: FAILED - Form fields not found');
            results.failed++;
         }
      } catch (error) {
         console.log(`❌ Login Form Interaction: ERROR - ${error.message}`);
         results.failed++;
      }

      // Test 5: Error Page Handling
      console.log('\n🔍 Testing Error Page Handling...');
      try {
         const response = await page.goto('http://localhost:3000/nonexistent-page');

         if (response && response.status() === 404) {
            console.log('✅ Error Page Handling: PASSED');
            console.log('   - 404 pages handled correctly');
            results.passed++;
         } else {
            console.log(`❌ Error Page Handling: UNEXPECTED - Status: ${response ? response.status() : 'none'}`);
            results.failed++;
         }
      } catch (error) {
         console.log(`❌ Error Page Handling: ERROR - ${error.message}`);
         results.failed++;
      }
   } catch (error) {
      console.log(`❌ Frontend test suite failed: ${error.message}`);
      results.failed++;
   } finally {
      // Cleanup
      if (browser) {
         await browser.close();
         console.log('🔍 Browser closed');
      }

      if (server) {
         server.kill('SIGTERM');
         setTimeout(() => server.kill('SIGKILL'), 3000);
         console.log('📡 Server stopped');
      }
   }

   // Results
   console.log('\n' + '='.repeat(50));
   console.log('🎭 FRONTEND TEST RESULTS');
   console.log('='.repeat(50));
   console.log(`Total Tests: ${results.passed + results.failed}`);
   console.log(`✅ Passed: ${results.passed}`);
   console.log(`❌ Failed: ${results.failed}`);

   const successRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
   console.log(`📈 Success Rate: ${successRate}%`);

   if (results.failed === 0) {
      console.log('\n🎉 ALL FRONTEND TESTS PASSED!');
      console.log('✅ Frontend is functioning correctly with modularized backend');
   } else {
      console.log('\n⚠️  Some frontend tests had issues');
      console.log('📝 Review the details above');
   }

   return results;
}

// Run if called directly
if (require.main === module) {
   testFrontendWithPuppeteer()
      .then(() => process.exit(0))
      .catch((error) => {
         console.error('❌ Frontend test suite failed:', error.message);
         process.exit(1);
      });
}

module.exports = testFrontendWithPuppeteer;
