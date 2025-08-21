const request = require('supertest');
const SchoolERPServer = require('../server');

/**
 * Phase 2A - Trust & School Setup Tests
 * Tests the complete trust setup workflow including creating trusts, schools, and basic configuration
 */

describe('Phase 2A - Trust & School Setup', () => {
   let app;
   let server;
   let authCookie;
   let trustId;
   let schoolId;

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

      authCookie = loginResponse.headers['set-cookie'];
   }, 30000);

   afterAll(async () => {
      if (server && server.server) {
         server.server.close();
      }

      // Close database connections
      const { dbManager } = require('../models/database');
      await dbManager.closeAllConnections();
   });

   describe('Trust Management', () => {
      test('Should create a new trust', async () => {
         const timestamp = Date.now();
         const shortCode = timestamp.toString().slice(-8); // Use last 8 digits
         const trustData = {
            trust_name: `Demo Trust ${timestamp}`,
            trust_code: `demo${shortCode}`,
            subdomain: `demo${shortCode}`,
            contact_email: `admin${shortCode}@demo.school`,
            contact_phone: '9876543210',
            address: 'Demo Address',
         };

         const response = await request(app)
            .post('/api/v1/admin/system/trusts')
            .set('Cookie', authCookie)
            .send(trustData);

         expect(response.status).toBe(201);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('id');
         expect(response.body.data.trust_name).toBe(trustData.trust_name);
         expect(response.body.data.status).toBe('SETUP_PENDING');

         trustId = response.body.data.id;
      });

      test('Should get trust by ID', async () => {
         const response = await request(app).get(`/api/v1/admin/system/trusts/${trustId}`).set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('id', trustId);
      });

      test('Should list all trusts', async () => {
         const response = await request(app).get('/api/v1/admin/system/trusts').set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(Array.isArray(response.body.data)).toBe(true);
         expect(response.body.meta).toHaveProperty('pagination');
      });

      test('Should update trust information', async () => {
         const updateData = {
            trust_name: 'Updated Demo Trust',
            contact_phone: '9876543211',
         };

         const response = await request(app)
            .put(`/api/v1/admin/system/trusts/${trustId}`)
            .set('Cookie', authCookie)
            .send(updateData);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(response.body.data.trust_name).toBe(updateData.trust_name);
         expect(response.body.data.contact_phone).toBe(updateData.contact_phone);
      });

      test('Should complete trust setup', async () => {
         const response = await request(app)
            .post(`/api/v1/admin/system/trusts/${trustId}/complete-setup`)
            .set('Cookie', authCookie)
            .send({ completed_by: 1 });

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(response.body.data.status).toBe('ACTIVE');
      });
   });

   describe('School Management', () => {
      test('Should create a school under the trust', async () => {
         const timestamp = Date.now();
         const schoolData = {
            name: `Demo School ${timestamp}`,
            code: `DEMO${timestamp.toString().slice(-6)}`,
            address: 'Demo School Address',
            contact_phone: '9876543210',
            contact_email: `principal${timestamp.toString().slice(-6)}@demo.school`,
            board: 'CBSE',
            medium: 'English',
            type: 'Co-Educational',
            recognition_status: 'Recognized',
         };

         const response = await request(app)
            .post(`/api/v1/trust/${trustId}/schools`)
            .set('Cookie', authCookie)
            .send(schoolData);

         expect(response.status).toBe(201);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('id');
         expect(response.body.data.name).toBe(schoolData.name);
         expect(response.body.data.trust_id).toBe(trustId);

         schoolId = response.body.data.id;
      });

      test('Should get school by ID', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('id', schoolId);
         expect(response.body.data.trust_id).toBe(trustId);
      });

      test('Should list schools under trust', async () => {
         const response = await request(app).get(`/api/v1/trust/${trustId}/schools`).set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(Array.isArray(response.body.data)).toBe(true);
         expect(response.body.data.length).toBeGreaterThan(0);
      });

      test('Should update school information', async () => {
         const updateData = {
            name: 'Updated Demo School',
            contact_phone: '9876543211',
         };

         const response = await request(app)
            .put(`/api/v1/trust/${trustId}/schools/${schoolId}`)
            .set('Cookie', authCookie)
            .send(updateData);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(response.body.data.name).toBe(updateData.name);
         expect(response.body.data.contact_phone).toBe(updateData.contact_phone);
      });
   });

   describe('Academic Year Setup', () => {
      test('Should create academic year for school', async () => {
         const academicYearData = {
            year_label: '2024-25',
            start_date: '2024-04-01',
            end_date: '2025-03-31',
            is_active: true,
         };

         const response = await request(app)
            .post(`/api/v1/trust/${trustId}/schools/${schoolId}/academic-years`)
            .set('Cookie', authCookie)
            .send(academicYearData);

         expect(response.status).toBe(201);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('id');
         expect(response.body.data.year_label).toBe(academicYearData.year_label);
         expect(response.body.data.school_id).toBe(schoolId);
      });

      test('Should list academic years for school', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/academic-years`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(Array.isArray(response.body.data)).toBe(true);
         expect(response.body.data.length).toBeGreaterThan(0);
      });
   });
});
