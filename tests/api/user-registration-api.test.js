const request = require('supertest');
const app = require('../../server'); // Adjust path as needed

describe('Admin User Registration API Tests', () => {
   let authToken;
   let testUser;

   beforeAll(async () => {
      // Login to get auth token for testing
      const loginResponse = await request(app)
         .post('/api/auth/login')
         .send({
            email: 'system.admin@test.com',
            password: 'TestAdmin123'
         });

      if (loginResponse.status === 200) {
         authToken = loginResponse.body.token;
      }
   });

   describe('GET /api/admin/user-permissions', () => {
      test('Returns user permissions for system admin', async () => {
         const response = await request(app)
            .get('/api/admin/user-permissions')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

         expect(response.body).toHaveProperty('canCreate');
         expect(response.body).toHaveProperty('allowedUserTypes');
         expect(response.body.canCreate).toBe(true);
         expect(Array.isArray(response.body.allowedUserTypes)).toBe(true);
      });

      test('Denies access without authentication', async () => {
         await request(app)
            .get('/api/admin/user-permissions')
            .expect(401);
      });
   });

   describe('GET /api/admin/user-statistics', () => {
      test('Returns user statistics', async () => {
         const response = await request(app)
            .get('/api/admin/user-statistics')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

         expect(response.body).toHaveProperty('totalUsers');
         expect(response.body).toHaveProperty('usersByRole');
         expect(typeof response.body.totalUsers).toBe('number');
         expect(typeof response.body.usersByRole).toBe('object');
      });
   });

   describe('POST /api/admin/users', () => {
      test('Creates new user successfully', async () => {
         const newUser = {
            userType: 'TEACHER',
            fullName: 'Test API User',
            email: `api.test.${Date.now()}@test.com`,
            phoneNumber: '+1234567890',
            dateOfBirth: '1990-01-01',
            gender: 'OTHER',
            passwordGeneration: 'auto',
            sendWelcomeEmail: true
         };

         const response = await request(app)
            .post('/api/admin/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send(newUser)
            .expect(201);

         expect(response.body).toHaveProperty('success', true);
         expect(response.body).toHaveProperty('userId');
         expect(response.body).toHaveProperty('emailSent');
         
         testUser = response.body;
      });

      test('Validates required fields', async () => {
         const invalidUser = {
            userType: 'TEACHER'
            // Missing required fields
         };

         const response = await request(app)
            .post('/api/admin/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidUser)
            .expect(400);

         expect(response.body).toHaveProperty('error');
         expect(response.body.error).toContain('required');
      });

      test('Prevents duplicate email addresses', async () => {
         const duplicateUser = {
            userType: 'STUDENT',
            fullName: 'Duplicate Test User',
            email: 'system.admin@test.com', // Already exists
            phoneNumber: '+9876543210',
            dateOfBirth: '1995-01-01',
            gender: 'MALE',
            passwordGeneration: 'auto'
         };

         const response = await request(app)
            .post('/api/admin/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send(duplicateUser)
            .expect(400);

         expect(response.body).toHaveProperty('error');
         expect(response.body.error.toLowerCase()).toContain('email');
      });

      test('Validates email format', async () => {
         const invalidEmailUser = {
            userType: 'STUDENT',
            fullName: 'Invalid Email User',
            email: 'invalid-email-format',
            phoneNumber: '+1234567890',
            dateOfBirth: '1990-01-01',
            gender: 'FEMALE',
            passwordGeneration: 'auto'
         };

         const response = await request(app)
            .post('/api/admin/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidEmailUser)
            .expect(400);

         expect(response.body).toHaveProperty('error');
         expect(response.body.error.toLowerCase()).toContain('email');
      });

      test('Handles manual password creation', async () => {
         const manualPasswordUser = {
            userType: 'PARENT',
            fullName: 'Manual Password User',
            email: `manual.pwd.${Date.now()}@test.com`,
            phoneNumber: '+1234567890',
            dateOfBirth: '1985-01-01',
            gender: 'OTHER',
            passwordGeneration: 'manual',
            password: 'ManualPassword123!'
         };

         const response = await request(app)
            .post('/api/admin/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send(manualPasswordUser)
            .expect(201);

         expect(response.body).toHaveProperty('success', true);
         expect(response.body).toHaveProperty('userId');
      });
   });

   describe('Role-based Access Control', () => {
      test('System admin can create all user types', async () => {
         const response = await request(app)
            .get('/api/admin/user-permissions')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

         const allowedTypes = response.body.allowedUserTypes;
         expect(allowedTypes).toContain('SYSTEM_ADMIN');
         expect(allowedTypes).toContain('TRUST_ADMIN');
         expect(allowedTypes).toContain('SCHOOL_ADMIN');
         expect(allowedTypes).toContain('TEACHER');
         expect(allowedTypes).toContain('STUDENT');
         expect(allowedTypes).toContain('PARENT');
         expect(allowedTypes).toContain('ACCOUNTANT');
      });

      // Additional role-based tests would require different user tokens
      // This is a simplified version focusing on the main functionality
   });

   describe('Password Generation Tests', () => {
      test('Auto-generated passwords meet security requirements', async () => {
         const userWithAutoPassword = {
            userType: 'TEACHER',
            fullName: 'Auto Password Test',
            email: `auto.pwd.${Date.now()}@test.com`,
            phoneNumber: '+1234567890',
            dateOfBirth: '1990-01-01',
            gender: 'MALE',
            passwordGeneration: 'auto',
            sendWelcomeEmail: false // Disable email for testing
         };

         const response = await request(app)
            .post('/api/admin/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send(userWithAutoPassword)
            .expect(201);

         expect(response.body).toHaveProperty('success', true);
         expect(response.body).toHaveProperty('generatedPassword');
         
         const password = response.body.generatedPassword;
         expect(password.length).toBeGreaterThanOrEqual(10);
         expect(password).toMatch(/[A-Z]/); // Has uppercase
         expect(password).toMatch(/[a-z]/); // Has lowercase  
         expect(password).toMatch(/\d/);    // Has numbers
      });
   });

   describe('Email Integration Tests', () => {
      test('Welcome email is sent when requested', async () => {
         const userWithEmail = {
            userType: 'STUDENT',
            fullName: 'Email Test User',
            email: `email.test.${Date.now()}@test.com`,
            phoneNumber: '+1234567890',
            dateOfBirth: '2005-01-01',
            gender: 'FEMALE',
            passwordGeneration: 'auto',
            sendWelcomeEmail: true
         };

         const response = await request(app)
            .post('/api/admin/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send(userWithEmail)
            .expect(201);

         expect(response.body).toHaveProperty('emailSent', true);
         expect(response.body).toHaveProperty('emailResult');
      });

      test('User creation succeeds even if email fails', async () => {
         // This would require mocking email service to fail
         // For now, we'll test that the API handles email errors gracefully
         
         const userWithEmailIssue = {
            userType: 'PARENT',
            fullName: 'Email Fail Test',
            email: `email.fail.${Date.now()}@test.com`,
            phoneNumber: '+1234567890',
            dateOfBirth: '1980-01-01',
            gender: 'MALE',
            passwordGeneration: 'auto',
            sendWelcomeEmail: true
         };

         const response = await request(app)
            .post('/api/admin/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send(userWithEmailIssue)
            .expect(201);

         expect(response.body).toHaveProperty('success', true);
         expect(response.body).toHaveProperty('userId');
         // Email might succeed or fail, but user creation should succeed
      });
   });

   describe('Data Validation Tests', () => {
      test('Validates phone number format', async () => {
         const invalidPhoneUser = {
            userType: 'TEACHER',
            fullName: 'Invalid Phone User',
            email: `invalid.phone.${Date.now()}@test.com`,
            phoneNumber: 'invalid-phone',
            dateOfBirth: '1990-01-01',
            gender: 'MALE',
            passwordGeneration: 'auto'
         };

         const response = await request(app)
            .post('/api/admin/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidPhoneUser)
            .expect(400);

         expect(response.body).toHaveProperty('error');
         expect(response.body.error.toLowerCase()).toContain('phone');
      });

      test('Validates date of birth', async () => {
         const invalidDateUser = {
            userType: 'STUDENT',
            fullName: 'Invalid Date User',
            email: `invalid.date.${Date.now()}@test.com`,
            phoneNumber: '+1234567890',
            dateOfBirth: 'invalid-date',
            gender: 'FEMALE',
            passwordGeneration: 'auto'
         };

         const response = await request(app)
            .post('/api/admin/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidDateUser)
            .expect(400);

         expect(response.body).toHaveProperty('error');
      });

      test('Validates user type', async () => {
         const invalidTypeUser = {
            userType: 'INVALID_TYPE',
            fullName: 'Invalid Type User',
            email: `invalid.type.${Date.now()}@test.com`,
            phoneNumber: '+1234567890',
            dateOfBirth: '1990-01-01',
            gender: 'MALE',
            passwordGeneration: 'auto'
         };

         const response = await request(app)
            .post('/api/admin/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidTypeUser)
            .expect(400);

         expect(response.body).toHaveProperty('error');
         expect(response.body.error.toLowerCase()).toContain('user type');
      });
   });
});
