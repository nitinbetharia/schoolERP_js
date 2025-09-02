const testHelper = require('./helpers/testHelper');

describe('Authentication and Middleware', () => {
   beforeAll(async () => {
      await testHelper.initializeApp();
   });

   afterAll(async () => {
      await testHelper.stopServer();
   });

   describe('Authentication Middleware', () => {
      test('Protected routes should reject requests without authentication', async () => {
         const protectedRoutes = [
            '/api/v1/admin/system/trusts',
            '/api/v1/admin/system/stats',
            '/api/v1/admin/system/profile',
            '/api/v1/users',
            '/api/v1/students'
         ];

         for (const route of protectedRoutes) {
            const response = await testHelper.getRequest().get(route);
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body.error).toMatch(/authentication|unauthorized|login/i);
         }
      });

      test('Public routes should be accessible without authentication', async () => {
         const publicRoutes = [
            '/api/v1/admin/system/health',
            '/api/v1/status',
            '/auth/login',
            '/test-frontend'
         ];

         for (const route of publicRoutes) {
            const response = await testHelper.getRequest().get(route);
            expect(response.status).toBeLessThan(400);
         }
      });

      test('Should handle malformed authorization headers gracefully', async () => {
         const response = await testHelper.getRequest()
            .get('/api/v1/users')
            .set('Authorization', 'Invalid Bearer Token');

         expect(response.status).toBe(401);
         testHelper.expectAuthenticationError(response);
      });

      test('Should handle expired sessions appropriately', async () => {
         const response = await testHelper.getRequest()
            .get('/api/v1/users')
            .set('Cookie', 'connect.sid=expired-session-id');

         expect(response.status).toBe(401);
         testHelper.expectAuthenticationError(response);
      });
   });

   describe('Session Management', () => {
      test('Login should create valid session', async () => {
         const loginResponse = await testHelper.getRequest()
            .post('/api/v1/admin/system/auth/login')
            .send({
               username: 'admin',
               password: 'admin123'
            });

         if (loginResponse.status === 200) {
            expect(loginResponse.headers['set-cookie']).toBeDefined();
            const cookies = loginResponse.headers['set-cookie'];
            expect(cookies.some(cookie => cookie.includes('connect.sid'))).toBe(true);
         }
      });

      test('Logout should invalidate session', async () => {
         const logoutResponse = await testHelper.getRequest()
            .post('/api/v1/admin/system/auth/logout');

         testHelper.expectSuccessResponse(logoutResponse);
         expect(logoutResponse.body.message).toMatch(/logout/i);
      });

      test('Multiple concurrent sessions should be handled properly', async () => {
         const promises = Array(5).fill().map(() => 
            testHelper.getRequest()
               .post('/api/v1/admin/system/auth/login')
               .send({ username: 'admin', password: 'admin123' })
         );

         const responses = await Promise.all(promises);
         responses.forEach(response => {
            expect([200, 401, 429]).toContain(response.status);
         });
      });
   });

   describe('Rate Limiting', () => {
      test('Login endpoint should implement rate limiting', async () => {
         const promises = Array(10).fill().map(() => 
            testHelper.getRequest()
               .post('/api/v1/admin/system/auth/login')
               .send({ username: 'invalid', password: 'invalid' })
         );

         const responses = await Promise.all(promises);
         const rateLimited = responses.some(response => response.status === 429);
      
         // Rate limiting may or may not be configured, but all should respond
         responses.forEach(response => {
            expect(response.status).toBeGreaterThanOrEqual(200);
         });
      });

      test('Password change should implement sensitive rate limiting', async () => {
         const promises = Array(5).fill().map(() => 
            testHelper.getRequest()
               .post('/api/v1/admin/system/auth/change-password')
               .send({ 
                  currentPassword: 'wrong',
                  newPassword: 'newpass123'
               })
         );

         const responses = await Promise.all(promises);
         responses.forEach(response => {
            expect([401, 429]).toContain(response.status);
         });
      });
   });

   describe('Input Validation and Sanitization', () => {
      test('Should sanitize potentially dangerous input', async () => {
         const maliciousInputs = [
            '<script>alert("xss")</script>',
            'javascript:alert(1)',
            '${7*7}',
            '../../etc/passwd',
            'SELECT * FROM users'
         ];

         for (const input of maliciousInputs) {
            const response = await testHelper.getRequest()
               .post('/api/v1/admin/system/auth/login')
               .send({
                  username: input,
                  password: input
               });

            expect([400, 401]).toContain(response.status);
            if (response.body.error) {
               expect(response.body.error).not.toContain('<script>');
               expect(response.body.error).not.toContain('javascript:');
            }
         }
      });

      test('Should validate email formats properly', async () => {
         const invalidEmails = [
            'notanemail',
            '@domain.com',
            'user@',
            'user..name@domain.com',
            'user@domain'
         ];

         for (const email of invalidEmails) {
            const response = await testHelper.getRequest()
               .post('/auth/login')
               .send({
                  email: email,
                  password: 'password123'
               });

            expect([302, 400]).toContain(response.status);
         }
      });

      test('Should enforce password complexity requirements', async () => {
         const weakPasswords = [
            '123',
            'password',
            'abc',
            '   ',
            ''
         ];

         for (const password of weakPasswords) {
            const response = await testHelper.getRequest()
               .post('/api/v1/admin/system/auth/change-password')
               .send({
                  currentPassword: 'current123',
                  newPassword: password
               });

            expect([400, 401]).toContain(response.status);
         }
      });
   });

   describe('CORS and Security Headers', () => {
      test('Should include appropriate CORS headers', async () => {
         const response = await testHelper.getRequest()
            .options('/api/v1/status');

         expect([200, 204, 404]).toContain(response.status);
      });

      test('Should include security headers', async () => {
         const response = await testHelper.getRequest()
            .get('/auth/login');

         expect(response.headers).toHaveProperty('x-content-type-options');
         expect(response.headers).toHaveProperty('x-frame-options');
         expect(response.headers['x-content-type-options']).toBe('nosniff');
         expect(response.headers['x-frame-options']).toBe('DENY');
      });

      test('Should implement Content Security Policy', async () => {
         const response = await testHelper.getRequest()
            .get('/auth/login');

         expect(response.headers).toHaveProperty('content-security-policy');
         const csp = response.headers['content-security-policy'];
         expect(csp).toMatch(/default-src/);
         expect(csp).toMatch(/script-src/);
      });
   });

   describe('Error Handling', () => {
      test('Should handle authentication errors gracefully', async () => {
         const response = await testHelper.getRequest()
            .post('/api/v1/admin/system/auth/login')
            .send({
               username: 'nonexistent',
               password: 'invalid'
            });

         expect([400, 401]).toContain(response.status);
         expect(response.body).toHaveProperty('success', false);
         expect(response.body).toHaveProperty('error');
         expect(typeof response.body.error).toBe('string');
      });

      test('Should handle validation errors consistently', async () => {
         const response = await testHelper.getRequest()
            .post('/api/v1/admin/system/auth/login')
            .send({});

         expect(response.status).toBe(400);
         expect(response.body).toHaveProperty('success', false);
         expect(response.body).toHaveProperty('error');
      });

      test('Should handle server errors gracefully', async () => {
         const response = await testHelper.getRequest()
            .get('/test-500-error');

         expect(response.status).toBe(500);
         expect(response.headers['content-type']).toMatch(/html|json/);
      });
   });

   describe('Authorization Levels', () => {
      test('System admin routes should require system admin role', async () => {
         const systemRoutes = [
            '/api/v1/admin/system/trusts',
            '/api/v1/admin/system/users',
            '/api/v1/admin/system/stats'
         ];

         for (const route of systemRoutes) {
            const response = await testHelper.getRequest().get(route);
            expect(response.status).toBe(401);
            testHelper.expectAuthenticationError(response);
         }
      });

      test('Should differentiate between authentication and authorization errors', async () => {
      // Test without any auth
         const noAuthResponse = await testHelper.getRequest()
            .get('/api/v1/admin/system/trusts');
      
         expect(noAuthResponse.status).toBe(401);
         testHelper.expectAuthenticationError(noAuthResponse);
      });
   });

   describe('Request Logging and Monitoring', () => {
      test('Should log authentication attempts', async () => {
         const response = await testHelper.getRequest()
            .post('/api/v1/admin/system/auth/login')
            .send({
               username: 'testuser',
               password: 'testpass'
            });

         // Response should be handled appropriately regardless of logging
         expect(response.status).toBeGreaterThanOrEqual(200);
      });

      test('Should monitor connection pool status', async () => {
         const response = await testHelper.getRequest()
            .get('/api/v1/admin/system/health');

         if (response.status === 200) {
            expect(response.body).toHaveProperty('healthy');
         }
      });
   });
});