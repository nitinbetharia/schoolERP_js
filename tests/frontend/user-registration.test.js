const puppeteer = require('puppeteer');

describe('Phase 2: Admin-Controlled User Registration Tests', () => {
   let page;

   beforeEach(async () => {
      page = await global.testHelpers.createPage();
   });

   afterEach(async () => {
      if (page) {
         await page.close();
      }
   });

   describe('Access Control Tests', () => {
      test('System Admin can access user registration page', async () => {
         await global.testHelpers.loginUser(page, 'systemAdmin');
         
         // Navigate to user registration page
         await page.goto(`${global.testConfig.baseUrl}/admin/user-registration`);
         
         // Should successfully load the page
         await page.waitForSelector('.user-registration-container', { timeout: 10000 });
         
         // Check for main components
         const pageTitle = await global.testHelpers.waitForTextContent(page, 'h1, .page-title');
         expect(pageTitle).toContain('User Registration Management');
         
         // Check for statistics dashboard
         await page.waitForSelector('.statistics-dashboard');
         
         // Check for create user button
         await page.waitForSelector('#createUserBtn');
         
         console.log('✅ System Admin can access user registration page');
      });

      test('Teacher cannot access user registration page', async () => {
         await global.testHelpers.loginUser(page, 'teacher');
         
         // Try to navigate to user registration page
         await page.goto(`${global.testConfig.baseUrl}/admin/user-registration`);
         
         // Should be redirected or show error
         await page.waitForSelector('.error-container, .access-denied, .login-form', { timeout: 10000 });
         
         const url = page.url();
         expect(url).not.toContain('/admin/user-registration');
         
         console.log('✅ Teacher cannot access user registration page (proper access control)');
      });

      test('School Admin can access user registration with limited permissions', async () => {
         await global.testHelpers.loginUser(page, 'schoolAdmin');
         
         // Navigate to user registration page
         await page.goto(`${global.testConfig.baseUrl}/admin/user-registration`);
         
         // Should load but with limited user types
         await page.waitForSelector('.user-registration-container', { timeout: 10000 });
         
         // Open create user modal
         await global.testHelpers.waitAndClick(page, '#createUserBtn');
         await page.waitForSelector('#createUserModal', { timeout: 5000 });
         
         // Check available user types (should be limited for school admin)
         const userTypeOptions = await page.$$eval('#userType option', options => 
            options.map(option => option.value).filter(value => value !== '')
         );
         
         // School admin should not be able to create system or trust admins
         expect(userTypeOptions).not.toContain('SYSTEM_ADMIN');
         expect(userTypeOptions).not.toContain('TRUST_ADMIN');
         
         console.log('✅ School Admin has limited user creation permissions');
      });
   });

   describe('User Registration Interface Tests', () => {
      beforeEach(async () => {
         await global.testHelpers.loginUser(page, 'systemAdmin');
         await page.goto(`${global.testConfig.baseUrl}/admin/user-registration`);
         await page.waitForSelector('.user-registration-container');
      });

      test('Statistics dashboard loads correctly', async () => {
         // Wait for statistics to load
         await page.waitForSelector('.statistics-dashboard .stat-card');
         
         // Check for required stat cards
         const statCards = await page.$$('.stat-card');
         expect(statCards.length).toBeGreaterThan(0);
         
         // Check for specific role statistics
         const roleStats = await page.$$eval('.stat-card .stat-label', labels => 
            labels.map(label => label.textContent.trim())
         );
         
         expect(roleStats).toContain('Total Users');
         
         console.log('✅ Statistics dashboard loads with proper data');
      });

      test('Create user modal opens and displays correctly', async () => {
         // Click create user button
         await global.testHelpers.waitAndClick(page, '#createUserBtn');
         
         // Wait for modal to appear
         await page.waitForSelector('#createUserModal.show', { timeout: 5000 });
         
         // Check modal structure
         const modalTitle = await global.testHelpers.waitForTextContent(page, '#createUserModal .modal-title');
         expect(modalTitle).toContain('Create New User');
         
         // Check for step indicators
         await page.waitForSelector('.step-indicator');
         
         // Check first step content
         await page.waitForSelector('.step-content[data-step="1"]');
         
         // Check required form fields
         await page.waitForSelector('#userType');
         await page.waitForSelector('#fullName');
         await page.waitForSelector('#email');
         
         console.log('✅ Create user modal displays correctly with proper structure');
      });

      test('Multi-step form navigation works correctly', async () => {
         await global.testHelpers.waitAndClick(page, '#createUserBtn');
         await page.waitForSelector('#createUserModal.show');
         
         // Fill step 1 fields
         await page.select('#userType', 'TEACHER');
         await global.testHelpers.fillField(page, '#fullName', 'Test Teacher User');
         await global.testHelpers.fillField(page, '#email', 'test.teacher.new@test.com');
         
         // Go to step 2
         await global.testHelpers.waitAndClick(page, '#nextStep1');
         await page.waitForSelector('.step-content[data-step="2"]', { visible: true });
         
         // Check step 2 elements
         await page.waitForSelector('#phoneNumber');
         await page.waitForSelector('#dateOfBirth');
         
         // Fill step 2
         await global.testHelpers.fillField(page, '#phoneNumber', '+1234567890');
         await page.type('#dateOfBirth', '1990-01-01');
         
         // Go to step 3
         await global.testHelpers.waitAndClick(page, '#nextStep2');
         await page.waitForSelector('.step-content[data-step="3"]', { visible: true });
         
         // Check step 3 elements  
         await page.waitForSelector('#passwordGeneration');
         
         // Go to step 4 (review)
         await global.testHelpers.waitAndClick(page, '#nextStep3');
         await page.waitForSelector('.step-content[data-step="4"]', { visible: true });
         
         // Check review step
         const reviewData = await page.$eval('.review-data', el => el.textContent);
         expect(reviewData).toContain('Test Teacher User');
         expect(reviewData).toContain('test.teacher.new@test.com');
         
         console.log('✅ Multi-step form navigation works correctly');
      });

      test('Form validation works properly', async () => {
         await global.testHelpers.waitAndClick(page, '#createUserBtn');
         await page.waitForSelector('#createUserModal.show');
         
         // Try to proceed without filling required fields
         await global.testHelpers.waitAndClick(page, '#nextStep1');
         
         // Should show validation errors
         await page.waitForSelector('.invalid-feedback, .error-message', { timeout: 3000 });
         
         // Fill email with invalid format
         await global.testHelpers.fillField(page, '#email', 'invalid-email');
         await global.testHelpers.waitAndClick(page, '#nextStep1');
         
         // Should show email validation error
         const emailError = await page.$('.invalid-feedback');
         expect(emailError).toBeTruthy();
         
         console.log('✅ Form validation works properly');
      });
   });

   describe('User Creation Workflow Tests', () => {
      beforeEach(async () => {
         await global.testHelpers.loginUser(page, 'systemAdmin');
         await page.goto(`${global.testConfig.baseUrl}/admin/user-registration`);
         await page.waitForSelector('.user-registration-container');
      });

      test('Complete user creation workflow', async () => {
         const testUserEmail = `test.user.${Date.now()}@test.com`;
         
         // Open create user modal
         await global.testHelpers.waitAndClick(page, '#createUserBtn');
         await page.waitForSelector('#createUserModal.show');
         
         // Step 1: Basic Information
         await page.select('#userType', 'TEACHER');
         await global.testHelpers.fillField(page, '#fullName', 'Automated Test User');
         await global.testHelpers.fillField(page, '#email', testUserEmail);
         await global.testHelpers.waitAndClick(page, '#nextStep1');
         
         // Step 2: Personal Information
         await page.waitForSelector('.step-content[data-step="2"]', { visible: true });
         await global.testHelpers.fillField(page, '#phoneNumber', '+1234567890');
         await page.type('#dateOfBirth', '1990-01-01');
         await page.select('#gender', 'OTHER');
         await global.testHelpers.waitAndClick(page, '#nextStep2');
         
         // Step 3: Account Settings
         await page.waitForSelector('.step-content[data-step="3"]', { visible: true });
         await page.click('#passwordGeneration input[value="auto"]');
         await global.testHelpers.waitAndClick(page, '#nextStep3');
         
         // Step 4: Review and Submit
         await page.waitForSelector('.step-content[data-step="4"]', { visible: true });
         
         // Wait for and capture the API response
         const responsePromise = global.testHelpers.waitForResponse(page, '/api/admin/users');
         
         // Submit the form
         await global.testHelpers.waitAndClick(page, '#createUserForm button[type="submit"]');
         
         // Wait for response
         const response = await responsePromise;
         expect(response.status()).toBe(201);
         
         // Wait for success message
         await page.waitForSelector('.alert-success, .success-message', { timeout: 10000 });
         
         // Modal should close
         await page.waitForSelector('#createUserModal', { hidden: true, timeout: 10000 });
         
         console.log('✅ Complete user creation workflow successful');
      });

      test('Password generation options work correctly', async () => {
         await global.testHelpers.waitAndClick(page, '#createUserBtn');
         await page.waitForSelector('#createUserModal.show');
         
         // Navigate to step 3
         await page.select('#userType', 'STUDENT');
         await global.testHelpers.fillField(page, '#fullName', 'Test Student');
         await global.testHelpers.fillField(page, '#email', 'test.student@test.com');
         await global.testHelpers.waitAndClick(page, '#nextStep1');
         
         await page.waitForSelector('.step-content[data-step="2"]', { visible: true });
         await global.testHelpers.fillField(page, '#phoneNumber', '+1234567890');
         await global.testHelpers.waitAndClick(page, '#nextStep2');
         
         // Step 3: Test password options
         await page.waitForSelector('.step-content[data-step="3"]', { visible: true });
         
         // Test auto-generation
         await page.click('#passwordGeneration input[value="auto"]');
         
         // Should show password preview
         await page.waitForSelector('#passwordPreview');
         
         // Test manual password
         await page.click('#passwordGeneration input[value="manual"]');
         await page.waitForSelector('#manualPassword', { visible: true });
         
         await global.testHelpers.fillField(page, '#manualPassword', 'TestPassword123');
         await global.testHelpers.fillField(page, '#confirmPassword', 'TestPassword123');
         
         console.log('✅ Password generation options work correctly');
      });
   });

   describe('Email Integration Tests', () => {
      test('Welcome email is sent after user creation', async () => {
         // This test would need to be integrated with email testing service
         // For now, we'll test that the email service is called
         
         await global.testHelpers.loginUser(page, 'systemAdmin');
         await page.goto(`${global.testConfig.baseUrl}/admin/user-registration`);
         
         // Create a user and verify email service interaction
         const testUserEmail = `welcome.test.${Date.now()}@test.com`;
         
         await global.testHelpers.waitAndClick(page, '#createUserBtn');
         await page.waitForSelector('#createUserModal.show');
         
         // Fill and submit form quickly
         await page.select('#userType', 'PARENT');
         await global.testHelpers.fillField(page, '#fullName', 'Welcome Test User');
         await global.testHelpers.fillField(page, '#email', testUserEmail);
         await global.testHelpers.waitAndClick(page, '#nextStep1');
         
         await page.waitForSelector('.step-content[data-step="2"]', { visible: true });
         await global.testHelpers.fillField(page, '#phoneNumber', '+1234567890');
         await global.testHelpers.waitAndClick(page, '#nextStep2');
         
         await page.waitForSelector('.step-content[data-step="3"]', { visible: true });
         await page.click('#passwordGeneration input[value="auto"]');
         await global.testHelpers.waitAndClick(page, '#nextStep3');
         
         await page.waitForSelector('.step-content[data-step="4"]', { visible: true });
         
         // Monitor network for email-related requests
         const responsePromise = global.testHelpers.waitForResponse(page, '/api/admin/users');
         await global.testHelpers.waitAndClick(page, '#createUserForm button[type="submit"]');
         
         const response = await responsePromise;
         const responseData = await response.json();
         
         // Should indicate email was sent
         expect(responseData.emailSent).toBeTruthy();
         
         console.log('✅ Welcome email integration verified');
      });
   });

   describe('Error Handling Tests', () => {
      beforeEach(async () => {
         await global.testHelpers.loginUser(page, 'systemAdmin');
         await page.goto(`${global.testConfig.baseUrl}/admin/user-registration`);
      });

      test('Duplicate email error is handled gracefully', async () => {
         const duplicateEmail = 'duplicate@test.com';
         
         // First, create a user
         await global.testHelpers.waitAndClick(page, '#createUserBtn');
         await page.waitForSelector('#createUserModal.show');
         
         await page.select('#userType', 'STUDENT');
         await global.testHelpers.fillField(page, '#fullName', 'First User');
         await global.testHelpers.fillField(page, '#email', duplicateEmail);
         await global.testHelpers.waitAndClick(page, '#nextStep1');
         
         await page.waitForSelector('.step-content[data-step="2"]', { visible: true });
         await global.testHelpers.fillField(page, '#phoneNumber', '+1111111111');
         await global.testHelpers.waitAndClick(page, '#nextStep2');
         
         await page.waitForSelector('.step-content[data-step="3"]', { visible: true });
         await page.click('#passwordGeneration input[value="auto"]');
         await global.testHelpers.waitAndClick(page, '#nextStep3');
         
         await page.waitForSelector('.step-content[data-step="4"]', { visible: true });
         await global.testHelpers.waitAndClick(page, '#createUserForm button[type="submit"]');
         
         // Wait for first user to be created
         await page.waitForSelector('.alert-success', { timeout: 10000 });
         await page.waitForSelector('#createUserModal', { hidden: true });
         
         // Try to create second user with same email
         await global.testHelpers.waitAndClick(page, '#createUserBtn');
         await page.waitForSelector('#createUserModal.show');
         
         await page.select('#userType', 'STUDENT');
         await global.testHelpers.fillField(page, '#fullName', 'Second User');
         await global.testHelpers.fillField(page, '#email', duplicateEmail);
         await global.testHelpers.waitAndClick(page, '#nextStep1');
         
         await page.waitForSelector('.step-content[data-step="2"]', { visible: true });
         await global.testHelpers.fillField(page, '#phoneNumber', '+2222222222');
         await global.testHelpers.waitAndClick(page, '#nextStep2');
         
         await page.waitForSelector('.step-content[data-step="3"]', { visible: true });
         await page.click('#passwordGeneration input[value="auto"]');
         await global.testHelpers.waitAndClick(page, '#nextStep3');
         
         await page.waitForSelector('.step-content[data-step="4"]', { visible: true });
         await global.testHelpers.waitAndClick(page, '#createUserForm button[type="submit"]');
         
         // Should show duplicate email error
         await page.waitForSelector('.alert-danger, .error-message', { timeout: 10000 });
         
         const errorMessage = await global.testHelpers.waitForTextContent(page, '.alert-danger, .error-message');
         expect(errorMessage.toLowerCase()).toContain('email');
         expect(errorMessage.toLowerCase()).toContain('exist');
         
         console.log('✅ Duplicate email error handled gracefully');
      });

      test('Network error is handled gracefully', async () => {
         // Intercept and fail the API call
         await page.setRequestInterception(true);
         
         page.on('request', request => {
            if (request.url().includes('/api/admin/users') && request.method() === 'POST') {
               request.respond({
                  status: 500,
                  contentType: 'application/json',
                  body: JSON.stringify({ error: 'Internal server error' })
               });
            } else {
               request.continue();
            }
         });
         
         await global.testHelpers.waitAndClick(page, '#createUserBtn');
         await page.waitForSelector('#createUserModal.show');
         
         // Fill form quickly
         await page.select('#userType', 'STUDENT');
         await global.testHelpers.fillField(page, '#fullName', 'Network Test User');
         await global.testHelpers.fillField(page, '#email', 'network.test@test.com');
         await global.testHelpers.waitAndClick(page, '#nextStep1');
         
         await page.waitForSelector('.step-content[data-step="2"]', { visible: true });
         await global.testHelpers.fillField(page, '#phoneNumber', '+1234567890');
         await global.testHelpers.waitAndClick(page, '#nextStep2');
         
         await page.waitForSelector('.step-content[data-step="3"]', { visible: true });
         await page.click('#passwordGeneration input[value="auto"]');
         await global.testHelpers.waitAndClick(page, '#nextStep3');
         
         await page.waitForSelector('.step-content[data-step="4"]', { visible: true });
         await global.testHelpers.waitAndClick(page, '#createUserForm button[type="submit"]');
         
         // Should show network error
         await page.waitForSelector('.alert-danger', { timeout: 10000 });
         
         const errorMessage = await global.testHelpers.waitForTextContent(page, '.alert-danger');
         expect(errorMessage.toLowerCase()).toContain('error');
         
         console.log('✅ Network error handled gracefully');
      });
   });
});
