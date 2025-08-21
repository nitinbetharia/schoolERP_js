const request = require('supertest');
const SchoolERPServer = require('../server');

/**
 * Phase 3 - Student Management System Tests
 * Tests comprehensive student management including enrollment, documents, and data management
 */

describe('Phase 3 - Student Management System', () => {
   let app;
   let server;
   let authCookie;
   let trustId;
   let schoolId;
   let academicYearId;
   let studentId;

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

      // Create test infrastructure
      const timestamp = Date.now();
      const shortCode = timestamp.toString().slice(-8); // Use last 8 digits

      // Create trust
      const trustData = {
         trust_name: `Student Test Trust ${timestamp}`,
         trust_code: `stud${shortCode}`, // Max 20 chars, this gives us 12 chars
         subdomain: `stud${shortCode}`,
         contact_email: `admin${shortCode}@test.school`,
         contact_phone: '9876543210',
         address: 'Student Test Address',
      };

      const trustResponse = await request(app)
         .post('/api/v1/admin/system/trusts')
         .set('Cookie', authCookie)
         .send(trustData);

      trustId = trustResponse.body.data.id;

      // Create school
      const schoolData = {
         name: `Student Test School ${timestamp}`,
         code: `STUDENTTEST${timestamp}`,
         address: 'Student Test School Address',
         contact_phone: '9876543210',
         contact_email: `principal${timestamp}@studenttest.school`,
         board: 'CBSE',
         medium: 'English',
         type: 'Co-Educational',
         recognition_status: 'Recognized',
      };

      const schoolResponse = await request(app)
         .post(`/api/v1/trust/${trustId}/schools`)
         .set('Cookie', authCookie)
         .send(schoolData);

      schoolId = schoolResponse.body.data.id;

      // Create academic year
      const academicYearData = {
         year_label: '2024-25',
         start_date: '2024-04-01',
         end_date: '2025-03-31',
         is_active: true,
      };

      const academicYearResponse = await request(app)
         .post(`/api/v1/trust/${trustId}/schools/${schoolId}/academic-years`)
         .set('Cookie', authCookie)
         .send(academicYearData);

      academicYearId = academicYearResponse.body.data.id;
   }, 30000);

   afterAll(async () => {
      if (server && server.server) {
         server.server.close();
      }

      // Close database connections
      const { dbManager } = require('../models/database');
      await dbManager.closeAllConnections();
   });

   describe('Student Registration', () => {
      test('Should register a new student', async () => {
         const timestamp = Date.now();
         const studentData = {
            admission_number: `ADM${timestamp}`,
            roll_number: `${timestamp}`,
            first_name: 'John',
            last_name: 'Doe',
            date_of_birth: '2010-05-15',
            gender: 'Male',
            class_name: 'Grade 5',
            section: 'A',
            father_name: 'James Doe',
            mother_name: 'Jane Doe',
            contact_phone: '9876543210',
            contact_email: `parent${timestamp}@example.com`,
            address: '123 Student Street',
            academic_year_id: academicYearId,
         };

         const response = await request(app)
            .post(`/api/v1/trust/${trustId}/schools/${schoolId}/students`)
            .set('Cookie', authCookie)
            .send(studentData);

         expect(response.status).toBe(201);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('id');
         expect(response.body.data.first_name).toBe(studentData.first_name);
         expect(response.body.data.admission_number).toBe(studentData.admission_number);
         expect(response.body.data.school_id).toBe(schoolId);

         studentId = response.body.data.id;
      });

      test('Should get student by ID', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/students/${studentId}`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('id', studentId);
         expect(response.body.data.school_id).toBe(schoolId);
      });

      test('Should list students in school', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/students`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(Array.isArray(response.body.data)).toBe(true);
         expect(response.body.data.length).toBeGreaterThan(0);
      });

      test('Should update student information', async () => {
         const updateData = {
            first_name: 'Updated John',
            contact_phone: '9876543211',
         };

         const response = await request(app)
            .put(`/api/v1/trust/${trustId}/schools/${schoolId}/students/${studentId}`)
            .set('Cookie', authCookie)
            .send(updateData);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(response.body.data.first_name).toBe(updateData.first_name);
         expect(response.body.data.contact_phone).toBe(updateData.contact_phone);
      });
   });

   describe('Student Search & Filtering', () => {
      test('Should search students by name', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/students?search=John`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(Array.isArray(response.body.data)).toBe(true);
      });

      test('Should filter students by class', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/students?class_name=Grade 5`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(Array.isArray(response.body.data)).toBe(true);
      });

      test('Should filter students by academic year', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/students?academic_year_id=${academicYearId}`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(Array.isArray(response.body.data)).toBe(true);
         expect(response.body.data.length).toBeGreaterThan(0);
      });
   });

   describe('Student Enrollment', () => {
      test('Should create student enrollment record', async () => {
         const enrollmentData = {
            enrollment_date: '2024-04-01',
            class_name: 'Grade 5',
            section: 'A',
            roll_number: Date.now().toString(),
            academic_year_id: academicYearId,
            status: 'ACTIVE',
         };

         const response = await request(app)
            .post(`/api/v1/trust/${trustId}/schools/${schoolId}/students/${studentId}/enrollments`)
            .set('Cookie', authCookie)
            .send(enrollmentData);

         expect(response.status).toBe(201);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('id');
         expect(response.body.data.student_id).toBe(studentId);
         expect(response.body.data.class_name).toBe(enrollmentData.class_name);
      });

      test('Should list student enrollments', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/students/${studentId}/enrollments`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(Array.isArray(response.body.data)).toBe(true);
      });
   });

   describe('Student Documents', () => {
      test('Should add student document record', async () => {
         const documentData = {
            document_type: 'Birth Certificate',
            document_number: `BC${Date.now()}`,
            issue_date: '2010-05-15',
            issuing_authority: 'Municipal Corporation',
            status: 'VERIFIED',
         };

         const response = await request(app)
            .post(`/api/v1/trust/${trustId}/schools/${schoolId}/students/${studentId}/documents`)
            .set('Cookie', authCookie)
            .send(documentData);

         expect(response.status).toBe(201);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('id');
         expect(response.body.data.student_id).toBe(studentId);
         expect(response.body.data.document_type).toBe(documentData.document_type);
      });

      test('Should list student documents', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/students/${studentId}/documents`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(Array.isArray(response.body.data)).toBe(true);
         expect(response.body.data.length).toBeGreaterThan(0);
      });
   });

   describe('Student Analytics', () => {
      test('Should get student statistics', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/students/analytics/stats`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('total_students');
         expect(response.body.data).toHaveProperty('by_class');
         expect(response.body.data).toHaveProperty('by_gender');
      });

      test('Should get class-wise distribution', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/students/analytics/class-distribution`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(Array.isArray(response.body.data)).toBe(true);
      });
   });
});
