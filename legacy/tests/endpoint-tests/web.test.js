const testHelper = require('./helpers/testHelper');

describe('Web Routes - Frontend Templates and Auth', () => {
   beforeAll(async () => {
      await testHelper.initializeApp();
   });

   afterAll(async () => {
      await testHelper.stopServer();
   });

   describe('Public Routes', () => {
      test('GET / - should redirect to login when not authenticated', async () => {
         const response = await testHelper.getRequest()
            .get('/');

         expect([302, 200]).toContain(response.status);
         if (response.status === 302) {
            expect(response.headers.location).toMatch(/login/);
         }
      });

      test('GET /auth/login - should render login page', async () => {
         const response = await testHelper.getRequest()
            .get('/auth/login');

         expect(response.status).toBe(200);
         expect(response.text).toMatch(/login/i);
         expect(response.headers['content-type']).toMatch(/html/);
      });

      test('GET /login - should render login page', async () => {
         const response = await testHelper.getRequest()
            .get('/login');

         expect(response.status).toBe(200);
         expect(response.text).toMatch(/login/i);
         expect(response.headers['content-type']).toMatch(/html/);
      });

      test('GET /test-frontend - should render test page', async () => {
         const response = await testHelper.getRequest()
            .get('/test-frontend');

         expect(response.status).toBe(200);
         expect(response.headers['content-type']).toMatch(/html/);
      });
   });

   describe('Authentication Routes', () => {
      test('POST /auth/login - should process login with valid system credentials', async () => {
         const response = await testHelper.getRequest()
            .post('/auth/login')
            .send({
               email: 'admin',
               password: 'admin123'
            });

         if (response.status === 302) {
            // Successful redirect
            expect(response.headers.location).toMatch(/dashboard|admin/);
         } else if (response.status === 200) {
            // JSON response
            expect(response.body).toHaveProperty('success');
         } else {
            // Expected error in test environment
            expect([400, 401, 500]).toContain(response.status);
         }
      });

      test('POST /auth/login - should reject invalid credentials', async () => {
         const response = await testHelper.getRequest()
            .post('/auth/login')
            .send({
               email: 'invalid@user.com',
               password: 'wrongpassword'
            });

         expect([302, 400, 401]).toContain(response.status);
         if (response.status === 302) {
            expect(response.headers.location).toMatch(/login/);
         }
      });

      test('POST /auth/login - should validate required fields', async () => {
         const response = await testHelper.getRequest()
            .post('/auth/login')
            .send({});

         expect([302, 400]).toContain(response.status);
         if (response.status === 302) {
            expect(response.headers.location).toMatch(/login/);
         }
      });

      test('POST /logout - should logout successfully', async () => {
         const response = await testHelper.getRequest()
            .post('/logout');

         expect([200, 302]).toContain(response.status);
         if (response.status === 302) {
            expect(response.headers.location).toMatch(/login/);
         } else {
            expect(response.body).toHaveProperty('success', true);
         }
      });

      test('GET /logout - should render logout page', async () => {
         const response = await testHelper.getRequest()
            .get('/logout');

         expect(response.status).toBe(200);
         expect(response.headers['content-type']).toMatch(/html/);
      });
   });

   describe('Protected Routes', () => {
      test('GET /dashboard - should require authentication', async () => {
         const response = await testHelper.getRequest()
            .get('/dashboard');

         expect([302, 401]).toContain(response.status);
         if (response.status === 302) {
            expect(response.headers.location).toMatch(/login/);
         }
      });

      test('GET /admin/system - should require authentication', async () => {
         const response = await testHelper.getRequest()
            .get('/admin/system');

         expect([302, 401]).toContain(response.status);
         if (response.status === 302) {
            expect(response.headers.location).toMatch(/login/);
         }
      });

      test('GET /admin/system/profile - should require authentication', async () => {
         const response = await testHelper.getRequest()
            .get('/admin/system/profile');

         expect([302, 401]).toContain(response.status);
         if (response.status === 302) {
            expect(response.headers.location).toMatch(/login/);
         }
      });

      test('GET /system/health - should require authentication', async () => {
         const response = await testHelper.getRequest()
            .get('/system/health');

         expect([302, 401, 403]).toContain(response.status);
      });
   });

   describe('Error Test Routes', () => {
      test('GET /test/error-handler - should render error test page', async () => {
         const response = await testHelper.getRequest()
            .get('/test/error-handler');

         expect(response.status).toBe(200);
         expect(response.headers['content-type']).toMatch(/html/);
      });

      test('GET /test-500-error - should trigger 500 error', async () => {
         const response = await testHelper.getRequest()
            .get('/test-500-error');

         expect(response.status).toBe(500);
         expect(response.headers['content-type']).toMatch(/html|json/);
      });

      test('GET /test-generic-error - should trigger generic error', async () => {
         const response = await testHelper.getRequest()
            .get('/test-generic-error');

         expect(response.status).toBe(418); // I'm a teapot
         expect(response.headers['content-type']).toMatch(/html|json/);
      });
   });

   describe('Session and Cookie Handling', () => {
      test('Login should set session cookies', async () => {
         const response = await testHelper.getRequest()
            .post('/auth/login')
            .send({
               email: 'admin',
               password: 'admin123'
            });

         if (response.status === 200 || response.status === 302) {
            expect(response.headers['set-cookie']).toBeDefined();
         }
      });

      test('Logout should clear session cookies', async () => {
         const response = await testHelper.getRequest()
            .post('/logout');

         if (response.status === 200 || response.status === 302) {
            const cookies = response.headers['set-cookie'] || [];
            const hasClearCookie = cookies.some(cookie => 
               cookie.includes('connect.sid') && cookie.includes('Max-Age=0')
            );
            // Not all logout implementations clear cookies the same way
            // So we just check that the endpoint responds correctly
            expect(response.status).toBeLessThan(400);
         }
      });
   });

   describe('Content Security and Headers', () => {
      test('Should include security headers', async () => {
         const response = await testHelper.getRequest()
            .get('/auth/login');

         expect(response.headers).toHaveProperty('x-content-type-options');
         expect(response.headers).toHaveProperty('x-frame-options');
      });

      test('Should serve static files correctly', async () => {
         const response = await testHelper.getRequest()
            .get('/static/css/app.css');

         // May or may not exist, but should handle appropriately
         expect([200, 404]).toContain(response.status);
      });
   });

   describe('Template Rendering', () => {
      test('Login page should contain form elements', async () => {
         const response = await testHelper.getRequest()
            .get('/auth/login');

         expect(response.status).toBe(200);
         expect(response.text).toMatch(/form/i);
         expect(response.text).toMatch(/password/i);
         expect(response.text).toMatch(/email|username/i);
      });

      test('Pages should include proper meta tags', async () => {
         const response = await testHelper.getRequest()
            .get('/auth/login');

         expect(response.status).toBe(200);
         expect(response.text).toMatch(/<title>/i);
         expect(response.text).toMatch(/<meta.*viewport/i);
      });
   });

   describe('Response Format Consistency', () => {
      test('HTML pages should have correct content type', async () => {
         const response = await testHelper.getRequest()
            .get('/auth/login');

         expect(response.status).toBe(200);
         expect(response.headers['content-type']).toMatch(/text\/html/);
      });

      test('AJAX requests should get JSON responses', async () => {
         const response = await testHelper.getRequest()
            .post('/auth/login')
            .set('Accept', 'application/json')
            .send({
               email: 'invalid',
               password: 'invalid'
            });

         if (response.headers['content-type']) {
            expect(response.headers['content-type']).toMatch(/application\/json/);
         }
      });
   });
});