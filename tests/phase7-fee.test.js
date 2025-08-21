const request = require('supertest');
const SchoolERPServer = require('../server');

/**
 * Phase 7 - Fee Management System Tests
 * Tests comprehensive fee management including structure, collection, receipts, and financial analytics
 */

describe('Phase 7 - Fee Management System', () => {
   let app;
   let server;
   let authCookie;
   let trustId;
   let schoolId;
   let academicYearId;
   let classId;
   let studentId;
   let feeStructureId;
   let feeCollectionId;

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

      // Create trust
      const trustData = {
         trust_name: `Fee Test Trust ${timestamp}`,
         trust_code: `fee${timestamp.toString().slice(-10)}`,
         subdomain: `feetest${timestamp}`,
         contact_email: `admin${timestamp}@feetest.school`,
         contact_phone: '9876543210',
         address: 'Fee Test Address',
      };

      const trustResponse = await request(app)
         .post('/api/v1/admin/system/trusts')
         .set('Cookie', authCookie)
         .send(trustData);

      trustId = trustResponse.body.data.id;

      // Create school
      const schoolData = {
         name: `Fee Test School ${timestamp}`,
         code: `FEE${timestamp.toString().slice(-8)}`,
         address: 'Fee Test School Address',
         contact_phone: '9876543210',
         contact_email: `principal${timestamp}@feetest.school`,
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

      // Create class
      const classData = {
         name: 'Grade 5',
         code: 'G5',
         academic_year_id: academicYearId,
         capacity: 40,
      };

      const classResponse = await request(app)
         .post(`/api/v1/trust/${trustId}/schools/${schoolId}/classes`)
         .set('Cookie', authCookie)
         .send(classData);

      classId = classResponse.body.data.id;

      // Create student
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

      const studentResponse = await request(app)
         .post(`/api/v1/trust/${trustId}/schools/${schoolId}/students`)
         .set('Cookie', authCookie)
         .send(studentData);

      studentId = studentResponse.body.data.id;
   }, 30000);

   afterAll(async () => {
      if (server && server.server) {
         server.server.close();
      }

      // Close database connections
      const { dbManager } = require('../models/database');
      await dbManager.closeAllConnections();
   });

   describe('Fee Structure Management', () => {
      test('Should create fee structure', async () => {
         const feeStructureData = {
            name: 'Grade 5 Fee Structure',
            description: 'Annual fee structure for Grade 5 students',
            class_id: classId,
            academic_year_id: academicYearId,
            fee_components: [
               {
                  name: 'Tuition Fee',
                  amount: 50000,
                  type: 'MANDATORY',
                  due_date: '2024-04-15',
               },
               {
                  name: 'Transport Fee',
                  amount: 12000,
                  type: 'OPTIONAL',
                  due_date: '2024-04-15',
               },
               {
                  name: 'Library Fee',
                  amount: 2000,
                  type: 'MANDATORY',
                  due_date: '2024-04-15',
               },
            ],
            total_amount: 64000,
            installments_allowed: true,
            installment_count: 4,
         };

         const response = await request(app)
            .post(`/api/v1/trust/${trustId}/schools/${schoolId}/fee-structures`)
            .set('Cookie', authCookie)
            .send(feeStructureData);

         expect(response.status).toBe(201);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('id');
         expect(response.body.data.name).toBe(feeStructureData.name);
         expect(response.body.data.school_id).toBe(schoolId);

         feeStructureId = response.body.data.id;
      });

      test('Should get fee structure by ID', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/fee-structures/${feeStructureId}`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('id', feeStructureId);
         expect(response.body.data.school_id).toBe(schoolId);
      });

      test('Should list fee structures for school', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/fee-structures`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(Array.isArray(response.body.data)).toBe(true);
         expect(response.body.data.length).toBeGreaterThan(0);
      });

      test('Should update fee structure', async () => {
         const updateData = {
            name: 'Updated Grade 5 Fee Structure',
            total_amount: 66000,
         };

         const response = await request(app)
            .put(`/api/v1/trust/${trustId}/schools/${schoolId}/fee-structures/${feeStructureId}`)
            .set('Cookie', authCookie)
            .send(updateData);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(response.body.data.name).toBe(updateData.name);
         expect(response.body.data.total_amount).toBe(updateData.total_amount);
      });
   });

   describe('Student Fee Assignment', () => {
      test('Should assign fee structure to student', async () => {
         const assignmentData = {
            student_id: studentId,
            fee_structure_id: feeStructureId,
            academic_year_id: academicYearId,
            discount_percentage: 10,
            discount_reason: 'Merit scholarship',
         };

         const response = await request(app)
            .post(`/api/v1/trust/${trustId}/schools/${schoolId}/fee-assignments`)
            .set('Cookie', authCookie)
            .send(assignmentData);

         expect(response.status).toBe(201);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('id');
         expect(response.body.data.student_id).toBe(studentId);
         expect(response.body.data.discount_percentage).toBe(assignmentData.discount_percentage);
      });

      test('Should get student fee details', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/students/${studentId}/fees`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('fee_structure');
         expect(response.body.data).toHaveProperty('total_due');
         expect(response.body.data).toHaveProperty('total_paid');
         expect(response.body.data).toHaveProperty('balance');
      });
   });

   describe('Fee Collection', () => {
      test('Should collect fee payment', async () => {
         const paymentData = {
            student_id: studentId,
            amount: 16000,
            payment_mode: 'CASH',
            payment_date: '2024-08-21',
            receipt_number: `REC${Date.now()}`,
            collected_by: 'admin',
            remarks: 'First installment payment',
            fee_components: [
               {
                  name: 'Tuition Fee',
                  amount: 12500,
               },
               {
                  name: 'Transport Fee',
                  amount: 3000,
               },
               {
                  name: 'Library Fee',
                  amount: 500,
               },
            ],
         };

         const response = await request(app)
            .post(`/api/v1/trust/${trustId}/schools/${schoolId}/fee-collections`)
            .set('Cookie', authCookie)
            .send(paymentData);

         expect(response.status).toBe(201);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('id');
         expect(response.body.data.student_id).toBe(studentId);
         expect(response.body.data.amount).toBe(paymentData.amount);

         feeCollectionId = response.body.data.id;
      });

      test('Should get fee collection by ID', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/fee-collections/${feeCollectionId}`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('id', feeCollectionId);
         expect(response.body.data.student_id).toBe(studentId);
      });

      test('Should list fee collections', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/fee-collections`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(Array.isArray(response.body.data)).toBe(true);
         expect(response.body.data.length).toBeGreaterThan(0);
      });

      test('Should get student payment history', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/students/${studentId}/payment-history`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(Array.isArray(response.body.data)).toBe(true);
         expect(response.body.data.length).toBeGreaterThan(0);
      });
   });

   describe('Receipt Management', () => {
      test('Should generate payment receipt', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/fee-collections/${feeCollectionId}/receipt`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('receipt_url');
         expect(response.body.data).toHaveProperty('receipt_number');
      });

      test('Should get receipt history for student', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/students/${studentId}/receipts`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(Array.isArray(response.body.data)).toBe(true);
      });
   });

   describe('Fee Analytics & Reports', () => {
      test('Should get fee collection statistics', async () => {
         const response = await request(app)
            .get(
               `/api/v1/trust/${trustId}/schools/${schoolId}/fee-analytics/collection-stats?academic_year_id=${academicYearId}`
            )
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('total_expected');
         expect(response.body.data).toHaveProperty('total_collected');
         expect(response.body.data).toHaveProperty('total_pending');
         expect(response.body.data).toHaveProperty('collection_percentage');
      });

      test('Should get defaulter report', async () => {
         const response = await request(app)
            .get(
               `/api/v1/trust/${trustId}/schools/${schoolId}/fee-analytics/defaulters?academic_year_id=${academicYearId}`
            )
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(Array.isArray(response.body.data)).toBe(true);
      });

      test('Should get monthly collection report', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/fee-analytics/monthly-collection?month=8&year=2024`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('month');
         expect(response.body.data).toHaveProperty('year');
         expect(response.body.data).toHaveProperty('total_collected');
         expect(response.body.data).toHaveProperty('transaction_count');
      });

      test('Should get class-wise collection summary', async () => {
         const response = await request(app)
            .get(
               `/api/v1/trust/${trustId}/schools/${schoolId}/fee-analytics/class-wise-collection?academic_year_id=${academicYearId}`
            )
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(Array.isArray(response.body.data)).toBe(true);
      });
   });

   describe('Fee Reminders & Notifications', () => {
      test('Should send fee reminder to parent', async () => {
         const reminderData = {
            student_id: studentId,
            reminder_type: 'EMAIL',
            message: 'Fee payment reminder for next installment',
            due_date: '2024-09-15',
         };

         const response = await request(app)
            .post(`/api/v1/trust/${trustId}/schools/${schoolId}/fee-reminders`)
            .set('Cookie', authCookie)
            .send(reminderData);

         expect(response.status).toBe(201);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('id');
         expect(response.body.data.student_id).toBe(studentId);
      });

      test('Should get reminder history', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/fee-reminders?student_id=${studentId}`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(Array.isArray(response.body.data)).toBe(true);
      });
   });

   describe('Refund Management', () => {
      test('Should process fee refund', async () => {
         const refundData = {
            student_id: studentId,
            amount: 1000,
            reason: 'Student withdrawal mid-term',
            refund_mode: 'BANK_TRANSFER',
            approved_by: 'admin',
            remarks: 'Pro-rata refund for unused term',
         };

         const response = await request(app)
            .post(`/api/v1/trust/${trustId}/schools/${schoolId}/fee-refunds`)
            .set('Cookie', authCookie)
            .send(refundData);

         expect(response.status).toBe(201);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('id');
         expect(response.body.data.student_id).toBe(studentId);
         expect(response.body.data.amount).toBe(refundData.amount);
      });

      test('Should list refunds', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/fee-refunds`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(Array.isArray(response.body.data)).toBe(true);
      });
   });

   describe('Fee Concession Management', () => {
      test('Should apply fee concession', async () => {
         const concessionData = {
            student_id: studentId,
            concession_type: 'SCHOLARSHIP',
            percentage: 15,
            amount: 9000,
            reason: 'Academic excellence scholarship',
            valid_from: '2024-04-01',
            valid_until: '2025-03-31',
            approved_by: 'admin',
         };

         const response = await request(app)
            .post(`/api/v1/trust/${trustId}/schools/${schoolId}/fee-concessions`)
            .set('Cookie', authCookie)
            .send(concessionData);

         expect(response.status).toBe(201);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('id');
         expect(response.body.data.student_id).toBe(studentId);
         expect(response.body.data.percentage).toBe(concessionData.percentage);
      });

      test('Should list student concessions', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/students/${studentId}/concessions`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(Array.isArray(response.body.data)).toBe(true);
      });
   });
});
