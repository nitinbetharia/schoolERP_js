const request = require('supertest');
const SchoolERPServer = require('../server');

describe('Phase 2A - Trust Setup (Simple)', () => {
   let app;
   let server;
   let authCookie;

   beforeAll(async () => {
      process.env.NODE_ENV = 'test';

      server = new SchoolERPServer();
      await server.initialize();
      app = server.app;

      // Login as system admin
      const loginResponse = await request(app).post('/api/v1/admin/system/auth/login').send({
         username: 'admin',
         password: 'admin123',
      });

      expect(loginResponse.status).toBe(200);
      authCookie = loginResponse.headers['set-cookie'];
      console.log('✅ Simple Test - Login successful');
   }, 30000);

   afterAll(async () => {
      if (server && server.server) {
         server.server.close();
      }

      // Close database connections
      const { dbManager } = require('../models/database');
      await dbManager.closeAllConnections();
   });

   test('Should create a trust successfully', async () => {
      const timestamp = Date.now();
      const trustData = {
         trust_name: `Test Trust ${timestamp}`,
         trust_code: `test_${timestamp}`,
         subdomain: `test${timestamp}`,
         contact_email: `admin${timestamp}@test.school`,
         contact_phone: '9876543210',
         address: 'Test Address',
      };

      const response = await request(app).post('/api/v1/admin/system/trusts').set('Cookie', authCookie).send(trustData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.trust_name).toBe(trustData.trust_name);

      console.log('✅ Simple Test - Trust created successfully');
   });
});
