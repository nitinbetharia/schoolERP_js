const puppeteer = require('puppeteer');
const request = require('supertest');

describe('Phase 2: Basic Frontend & API Tests', () => {
   let browser;
   let page;

   beforeAll(async () => {
      browser = await puppeteer.launch({
         headless: true,
         args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
   });

   afterAll(async () => {
      if (browser) {
         await browser.close();
      }
   });

   beforeEach(async () => {
      page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 720 });
   });

   afterEach(async () => {
      if (page) {
         await page.close();
      }
   });

   describe('Server Health Tests', () => {
      test('Server is running and responds', async () => {
         const response = await request('http://localhost:3000')
            .get('/api/v1/status')
            .expect(200);

         expect(response.body).toHaveProperty('status', 'OK');
         expect(response.body).toHaveProperty('service');
      });

      test('Health check endpoint works', async () => {
         const response = await request('http://localhost:3000')
            .get('/api/v1/admin/system/health')
            .expect(200);

         expect(response.body).toHaveProperty('status');
         expect(response.body).toHaveProperty('timestamp');
      });
   });

   describe('Frontend Access Tests', () => {
      test('Home page loads successfully', async () => {
         await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
         
         const title = await page.title();
         expect(title).toBeTruthy();
         
         // Should have some basic HTML structure
         const bodyExists = await page.$('body') !== null;
         expect(bodyExists).toBe(true);
      });

      test('Login page is accessible', async () => {
         await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
         
         // Should have login form elements
         const emailField = await page.$('#email, input[type="email"], input[name="email"]');
         const passwordField = await page.$('#password, input[type="password"], input[name="password"]');
         
         expect(emailField).toBeTruthy();
         expect(passwordField).toBeTruthy();
      });

      test('Admin user registration page requires authentication', async () => {
         const response = await page.goto('http://localhost:3000/admin/user-registration', { 
            waitUntil: 'networkidle2' 
         });

         // Should either redirect to login or show access denied
         const url = page.url();
         const isRedirectedOrBlocked = url.includes('/login') || 
                                     response.status() === 401 || 
                                     response.status() === 403 ||
                                     await page.$('.access-denied, .error-container');

         expect(isRedirectedOrBlocked).toBeTruthy();
      });
   });

   describe('Password Generator Integration Tests', () => {
      test('Password generator utility is available', () => {
         const PasswordGenerator = require('../../utils/passwordGenerator');
         
         expect(PasswordGenerator).toBeDefined();
         expect(typeof PasswordGenerator.generatePassword).toBe('function');
         expect(typeof PasswordGenerator.generateUserFriendlyPassword).toBe('function');
         expect(typeof PasswordGenerator.generateSecurePassword).toBe('function');
         expect(typeof PasswordGenerator.generateTemporaryPassword).toBe('function');
         expect(typeof PasswordGenerator.validatePasswordStrength).toBe('function');
      });

      test('Password generator produces valid passwords', () => {
         const PasswordGenerator = require('../../utils/passwordGenerator');
         
         const userFriendly = PasswordGenerator.generateUserFriendlyPassword();
         const secure = PasswordGenerator.generateSecurePassword();
         const temporary = PasswordGenerator.generateTemporaryPassword();

         expect(userFriendly.length).toBeGreaterThanOrEqual(8);
         expect(secure.length).toBeGreaterThanOrEqual(12);
         expect(temporary.length).toBeGreaterThanOrEqual(10);

         // All should pass basic strength validation
         const userValidation = PasswordGenerator.validatePasswordStrength(userFriendly);
         const secureValidation = PasswordGenerator.validatePasswordStrength(secure);
         const tempValidation = PasswordGenerator.validatePasswordStrength(temporary);

         expect(userValidation.score).toBeGreaterThan(0);
         expect(secureValidation.score).toBeGreaterThan(0);
         expect(tempValidation.score).toBeGreaterThan(0);
      });
   });

   describe('Email Service Integration Tests', () => {
      test('Email service is properly initialized', () => {
         // Test that email service exists and has required methods
         const emailService = require('../../services/emailService');
         
         expect(emailService).toBeDefined();
         expect(typeof emailService.sendPasswordResetEmail).toBe('function');
         expect(typeof emailService.sendWelcomeEmail).toBe('function');
      });
   });

   describe('Bootstrap UI Components Tests', () => {
      test('Bootstrap CSS is loaded on pages', async () => {
         await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
         
         // Check if Bootstrap classes are available by testing a common Bootstrap element
         const hasBootstrapStyles = await page.evaluate(() => {
            // Create a temporary element with Bootstrap classes
            const testEl = document.createElement('div');
            testEl.className = 'container';
            document.body.appendChild(testEl);
            
            const styles = window.getComputedStyle(testEl);
            const hasContainer = styles.width !== 'auto' || styles.maxWidth !== 'none';
            
            document.body.removeChild(testEl);
            return hasContainer;
         });

         expect(hasBootstrapStyles).toBe(true);
      });
   });

   describe('Static Assets Tests', () => {
      test('CSS files are accessible', async () => {
         const response = await request('http://localhost:3000')
            .get('/css/bootstrap.min.css')
            .expect(200);

         expect(response.headers['content-type']).toContain('text/css');
      });

      test('JavaScript files are accessible', async () => {
         const response = await request('http://localhost:3000')
            .get('/js/bootstrap.bundle.min.js')
            .expect(200);

         expect(response.headers['content-type']).toContain('javascript');
      });
   });

   describe('API Endpoints Basic Tests', () => {
      test('User permissions endpoint exists', async () => {
         // This should require authentication, so we expect 401
         const response = await request('http://localhost:3000')
            .get('/api/admin/user-permissions');

         expect([401, 403]).toContain(response.status);
      });

      test('User statistics endpoint exists', async () => {
         // This should require authentication, so we expect 401
         const response = await request('http://localhost:3000')
            .get('/api/admin/user-statistics');

         expect([401, 403]).toContain(response.status);
      });

      test('User creation endpoint exists', async () => {
         // This should require authentication, so we expect 401
         const response = await request('http://localhost:3000')
            .post('/api/admin/users')
            .send({});

         expect([401, 403]).toContain(response.status);
      });
   });

   describe('View Templates Tests', () => {
      test('User registration template exists', async () => {
         const fs = require('fs');
         const path = require('path');
         
         const templatePath = path.join(__dirname, '../../views/pages/admin/user-registration.ejs');
         const templateExists = fs.existsSync(templatePath);
         
         expect(templateExists).toBe(true);

         if (templateExists) {
            const templateContent = fs.readFileSync(templatePath, 'utf8');
            expect(templateContent).toContain('user-registration-container');
            expect(templateContent).toContain('createUserModal');
            expect(templateContent).toContain('statistics-dashboard');
         }
      });

      test('Welcome email template exists', async () => {
         const fs = require('fs');
         const path = require('path');
         
         const templatePath = path.join(__dirname, '../../views/emails/welcome-user.ejs');
         const templateExists = fs.existsSync(templatePath);
         
         expect(templateExists).toBe(true);

         if (templateExists) {
            const templateContent = fs.readFileSync(templatePath, 'utf8');
            expect(templateContent).toContain('welcome');
            expect(templateContent).toContain('credentials');
            expect(templateContent).toContain('login');
         }
      });
   });
});
