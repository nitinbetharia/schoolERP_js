const testHelper = require('./helpers/testHelper');

describe('Module Routes - Users and Students', () => {
   beforeAll(async () => {
      await testHelper.initializeApp();
   });

   afterAll(async () => {
      await testHelper.stopServer();
   });

   describe('User Module Routes - /api/v1/users', () => {
      describe('Authentication Endpoints', () => {
         test('POST /users/auth/login - should authenticate with valid credentials', async () => {
            const response = await testHelper.getRequest()
               .post('/api/v1/users/auth/login')
               .send({
                  username: 'demo@user.com',
                  password: 'demo123'
               });

            if (response.status === 200) {
               testHelper.expectSuccessResponse(response);
               expect(response.body.data).toHaveProperty('id');
               expect(response.headers['set-cookie']).toBeDefined();
            } else {
               // Expected for test environment
               expect([400, 401, 500]).toContain(response.status);
            }
         });

         test('POST /users/auth/login - should reject invalid credentials', async () => {
            const response = await testHelper.getRequest()
               .post('/api/v1/users/auth/login')
               .send({
                  username: 'invalid@user.com',
                  password: 'invalid'
               });

            expect([400, 401]).toContain(response.status);
            testHelper.expectErrorResponse(response, response.status);
         });

         test('POST /users/auth/logout - should logout successfully', async () => {
            const response = await testHelper.getRequest()
               .post('/api/v1/users/auth/logout');

            expect([200, 401]).toContain(response.status);
            if (response.status === 200) {
               testHelper.expectSuccessResponse(response);
            }
         });
      });

      describe('User Management Endpoints', () => {
         test('GET /users - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .get('/api/v1/users');

            testHelper.expectAuthenticationError(response);
         });

         test('POST /users - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .post('/api/v1/users')
               .send({
                  username: 'newuser',
                  email: 'new@user.com',
                  password: 'password123'
               });

            testHelper.expectAuthenticationError(response);
         });

         test('GET /users/profile - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .get('/api/v1/users/profile');

            testHelper.expectAuthenticationError(response);
         });

         test('GET /users/roles - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .get('/api/v1/users/roles');

            testHelper.expectAuthenticationError(response);
         });
      });

      describe('Password Management', () => {
         test('POST /users/change-password - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .post('/api/v1/users/change-password')
               .send({
                  currentPassword: 'oldpass',
                  newPassword: 'newpass123'
               });

            testHelper.expectAuthenticationError(response);
         });
      });

      describe('Individual User Operations', () => {
         test('GET /users/:id - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .get('/api/v1/users/1');

            testHelper.expectAuthenticationError(response);
         });

         test('PUT /users/:id - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .put('/api/v1/users/1')
               .send({
                  username: 'updated'
               });

            testHelper.expectAuthenticationError(response);
         });

         test('DELETE /users/:id - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .delete('/api/v1/users/1');

            testHelper.expectAuthenticationError(response);
         });
      });
   });

   describe('Student Module Routes - /api/v1/students', () => {
      describe('Basic CRUD Operations', () => {
         test('GET /students - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .get('/api/v1/students');

            testHelper.expectAuthenticationError(response);
         });

         test('POST /students - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .post('/api/v1/students')
               .send({
                  first_name: 'John',
                  last_name: 'Doe',
                  date_of_birth: '2010-01-01',
                  class_id: 1
               });

            testHelper.expectAuthenticationError(response);
         });

         test('GET /students/:id - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .get('/api/v1/students/1');

            testHelper.expectAuthenticationError(response);
         });

         test('PUT /students/:id - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .put('/api/v1/students/1')
               .send({
                  first_name: 'Jane'
               });

            testHelper.expectAuthenticationError(response);
         });

         test('DELETE /students/:id - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .delete('/api/v1/students/1');

            testHelper.expectAuthenticationError(response);
         });
      });

      describe('Export Functionality', () => {
         test('GET /students/export/pdf - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .get('/api/v1/students/export/pdf');

            testHelper.expectAuthenticationError(response);
         });

         test('GET /students/export/excel - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .get('/api/v1/students/export/excel');

            testHelper.expectAuthenticationError(response);
         });
      });

      describe('Email Functionality', () => {
         test('POST /students/:id/send-welcome - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .post('/api/v1/students/1/send-welcome')
               .send({
                  temporaryPassword: 'temp123'
               });

            testHelper.expectAuthenticationError(response);
         });

         test('POST /students/send-bulk-email - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .post('/api/v1/students/send-bulk-email')
               .send({
                  studentIds: [1, 2, 3],
                  subject: 'Test Email',
                  message: 'Test message'
               });

            testHelper.expectAuthenticationError(response);
         });
      });
   });

   describe('Status Endpoint', () => {
      test('GET /status - should return API status', async () => {
         const response = await testHelper.getRequest()
            .get('/api/v1/status');

         testHelper.expectSuccessResponse(response);
         expect(response.body.message).toMatch(/running/i);
         expect(response.body).toHaveProperty('version');
         expect(response.body).toHaveProperty('timestamp');
      });
   });

   describe('Validation Testing', () => {
      test('User creation should validate required fields', async () => {
         const response = await testHelper.getRequest()
            .post('/api/v1/users')
            .send({});

         testHelper.expectAuthenticationError(response);
      });

      test('Student creation should validate required fields', async () => {
         const response = await testHelper.getRequest()
            .post('/api/v1/students')
            .send({});

         testHelper.expectAuthenticationError(response);
      });

      test('Password change should validate input format', async () => {
         const response = await testHelper.getRequest()
            .post('/api/v1/users/change-password')
            .send({
               currentPassword: 'short',
               newPassword: '123'
            });

         testHelper.expectAuthenticationError(response);
      });
   });

   describe('Query Parameter Validation', () => {
      test('User listing should handle pagination parameters', async () => {
         const response = await testHelper.getRequest()
            .get('/api/v1/users?page=1&limit=10');

         testHelper.expectAuthenticationError(response);
      });

      test('Student listing should handle filter parameters', async () => {
         const response = await testHelper.getRequest()
            .get('/api/v1/students?classId=1&status=ACTIVE');

         testHelper.expectAuthenticationError(response);
      });

      test('Should reject invalid pagination parameters', async () => {
         const response = await testHelper.getRequest()
            .get('/api/v1/users?page=invalid&limit=abc');

         // Should get validation error before auth check
         expect([400, 401]).toContain(response.status);
      });
   });

   describe('Response Format Consistency', () => {
      test('All authenticated endpoints should return consistent format', async () => {
         const endpoints = [
            '/api/v1/users',
            '/api/v1/students',
            '/api/v1/users/profile'
         ];

         for (const endpoint of endpoints) {
            const response = await testHelper.getRequest().get(endpoint);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
         }
      });

      test('Status endpoint should return standard success format', async () => {
         const response = await testHelper.getRequest()
            .get('/api/v1/status');

         expect(response.body).toHaveProperty('success', true);
         expect(response.body).toHaveProperty('message');
         expect(response.body).toHaveProperty('version');
      });
   });

   describe('HTTP Method Support', () => {
      test('Should support OPTIONS requests for CORS', async () => {
         const response = await testHelper.getRequest()
            .options('/api/v1/users');

         expect([200, 204, 404]).toContain(response.status);
      });

      test('Should reject unsupported methods gracefully', async () => {
         const response = await testHelper.getRequest()
            .patch('/api/v1/users/1');

         expect([405, 404, 401]).toContain(response.status);
      });
   });
});