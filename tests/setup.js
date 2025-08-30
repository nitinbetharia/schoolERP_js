const puppeteer = require('puppeteer');

// Global test configuration
global.testConfig = {
   baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
   timeout: 30000,
   slowMo: process.env.NODE_ENV === 'development' ? 100 : 0,
   headless: process.env.HEADLESS !== 'false',
};

// Test users for different roles
global.testUsers = {
   systemAdmin: {
      email: 'system.admin@test.com',
      password: 'TestAdmin123',
      role: 'SYSTEM_ADMIN',
   },
   trustAdmin: {
      email: 'trust.admin@test.com',
      password: 'TestTrust123',
      role: 'TRUST_ADMIN',
   },
   schoolAdmin: {
      email: 'school.admin@test.com',
      password: 'TestSchool123',
      role: 'SCHOOL_ADMIN',
   },
   teacher: {
      email: 'teacher@test.com',
      password: 'TestTeacher123',
      role: 'TEACHER',
   },
};

// Test tenant configuration
global.testTenant = {
   id: 1,
   name: 'Test School',
   domain: 'testschool',
   database: 'testschool_db',
};

// Browser instance for tests
global.browser = null;

// Setup before all tests
beforeAll(async () => {
   console.log('🚀 Starting test suite...');

   // Launch browser
   global.browser = await puppeteer.launch({
      headless: global.testConfig.headless,
      slowMo: global.testConfig.slowMo,
      args: [
         '--no-sandbox',
         '--disable-setuid-sandbox',
         '--disable-dev-shm-usage',
         '--disable-accelerated-2d-canvas',
         '--no-first-run',
         '--no-zygote',
         '--disable-gpu',
      ],
   });

   console.log('✅ Browser launched');
});

// Cleanup after all tests
afterAll(async () => {
   if (global.browser) {
      await global.browser.close();
      console.log('🔒 Browser closed');
   }
});

// Helper functions for tests
global.testHelpers = {
   /**
    * Create a new page with common setup
    */
   async createPage() {
      const page = await global.browser.newPage();

      // Set viewport
      await page.setViewport({ width: 1280, height: 720 });

      // Set user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

      // Enable console logs in tests
      page.on('console', (msg) => {
         if (msg.type() === 'error') {
            console.error('Browser Console Error:', msg.text());
         }
      });

      // Enable page error tracking
      page.on('pageerror', (error) => {
         console.error('Page Error:', error.message);
      });

      return page;
   },

   /**
    * Login with test user
    */
   async loginUser(page, userType = 'systemAdmin') {
      const user = global.testUsers[userType];
      if (!user) {
         throw new Error(`Unknown user type: ${userType}`);
      }

      await page.goto(`${global.testConfig.baseUrl}/login`);
      await page.waitForSelector('#email', { timeout: 5000 });

      await page.type('#email', user.email);
      await page.type('#password', user.password);

      await Promise.all([page.waitForNavigation(), page.click('button[type="submit"]')]);

      // Wait for dashboard to load
      await page.waitForSelector('.dashboard-container, .main-content', { timeout: 10000 });

      console.log(`✅ Logged in as ${userType} (${user.email})`);
      return page;
   },

   /**
    * Wait for element and get text
    */
   async waitForTextContent(page, selector, timeout = 5000) {
      await page.waitForSelector(selector, { timeout });
      return await page.$eval(selector, (el) => el.textContent.trim());
   },

   /**
    * Wait for element and click
    */
   async waitAndClick(page, selector, timeout = 5000) {
      await page.waitForSelector(selector, { timeout });
      await page.click(selector);
   },

   /**
    * Fill form field
    */
   async fillField(page, selector, value, options = {}) {
      await page.waitForSelector(selector, { timeout: 5000 });

      if (options.clear) {
         await page.click(selector, { clickCount: 3 });
      }

      await page.type(selector, value, { delay: 50 });
   },

   /**
    * Take screenshot for debugging
    */
   async takeScreenshot(page, filename) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const path = `tests/screenshots/${filename}-${timestamp}.png`;
      await page.screenshot({ path, fullPage: true });
      console.log(`📸 Screenshot saved: ${path}`);
      return path;
   },

   /**
    * Wait for API response
    */
   async waitForResponse(page, urlPattern, timeout = 10000) {
      return new Promise((resolve, reject) => {
         const timer = setTimeout(() => {
            reject(new Error(`Timeout waiting for response matching: ${urlPattern}`));
         }, timeout);

         page.on('response', (response) => {
            if (response.url().includes(urlPattern)) {
               clearTimeout(timer);
               resolve(response);
            }
         });
      });
   },
};

console.log('🔧 Test setup configured');
