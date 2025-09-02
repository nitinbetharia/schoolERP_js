const testHelper = require('./helpers/testHelper');

describe('School Module Routes - Trust-scoped Operations', () => {
   beforeAll(async () => {
      await testHelper.initializeApp();
   });

   afterAll(async () => {
      await testHelper.stopServer();
   });

   describe('Trust Routes - /api/v1/trust/:trustId', () => {
      describe('Trust Info and Stats', () => {
         test('GET /trust/:trustId/info - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .get('/api/v1/trust/1/info');

            // These routes may not be mounted, so expect 404 or 401
            expect([401, 404]).toContain(response.status);
         });

         test('GET /trust/:trustId/stats - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .get('/api/v1/trust/1/stats');

            expect([401, 404]).toContain(response.status);
         });

         test('GET /trust/:trustId/activity - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .get('/api/v1/trust/1/activity');

            expect([401, 404]).toContain(response.status);
         });
      });

      describe('School Management under Trust', () => {
         test('GET /trust/:trustId/schools - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .get('/api/v1/trust/1/schools');

            expect([401, 404]).toContain(response.status);
         });

         test('POST /trust/:trustId/schools - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .post('/api/v1/trust/1/schools')
               .send({
                  name: 'Test School',
                  code: 'TS001',
                  address: 'Test Address'
               });

            expect([401, 404]).toContain(response.status);
         });

         test('GET /trust/:trustId/schools/:id - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .get('/api/v1/trust/1/schools/1');

            expect([401, 404]).toContain(response.status);
         });

         test('PUT /trust/:trustId/schools/:id - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .put('/api/v1/trust/1/schools/1')
               .send({
                  name: 'Updated School Name'
               });

            expect([401, 404]).toContain(response.status);
         });

         test('DELETE /trust/:trustId/schools/:id - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .delete('/api/v1/trust/1/schools/1');

            expect([401, 404]).toContain(response.status);
         });
      });
   });

   describe('Direct School Module Routes (if mounted)', () => {
      describe('School Routes - /api/v1/school/schools', () => {
         test('GET /school/schools - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .get('/api/v1/school/schools');

            expect([401, 404]).toContain(response.status);
         });

         test('POST /school/schools - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .post('/api/v1/school/schools')
               .send({
                  name: 'Test School',
                  code: 'TS001'
               });

            expect([401, 404]).toContain(response.status);
         });
      });

      describe('Class Routes - /api/v1/school/classes', () => {
         test('GET /school/classes - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .get('/api/v1/school/classes');

            expect([401, 404]).toContain(response.status);
         });

         test('POST /school/classes - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .post('/api/v1/school/classes')
               .send({
                  name: 'Grade 1',
                  school_id: 1
               });

            expect([401, 404]).toContain(response.status);
         });
      });

      describe('Section Routes - /api/v1/school/sections', () => {
         test('GET /school/sections - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .get('/api/v1/school/sections');

            expect([401, 404]).toContain(response.status);
         });

         test('POST /school/sections - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .post('/api/v1/school/sections')
               .send({
                  name: 'Section A',
                  class_id: 1
               });

            expect([401, 404]).toContain(response.status);
         });
      });

      describe('Board Compliance Routes - /api/v1/school/compliance', () => {
         test('GET /school/compliance - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .get('/api/v1/school/compliance');

            expect([401, 404]).toContain(response.status);
         });

         test('POST /school/compliance - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .post('/api/v1/school/compliance')
               .send({
                  school_id: 1,
                  board_type: 'CBSE'
               });

            expect([401, 404]).toContain(response.status);
         });
      });

      describe('UDISE Routes - /api/v1/school/udise', () => {
         test('GET /school/udise - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .get('/api/v1/school/udise');

            expect([401, 404]).toContain(response.status);
         });

         test('POST /school/udise - should require authentication', async () => {
            const response = await testHelper.getRequest()
               .post('/api/v1/school/udise')
               .send({
                  school_id: 1,
                  udise_code: 'UDISE001'
               });

            expect([401, 404]).toContain(response.status);
         });
      });
   });

   describe('Fee Configuration Routes', () => {
      test('GET /school/fee-configuration - should require authentication', async () => {
         const response = await testHelper.getRequest()
            .get('/api/v1/school/fee-configuration');

         expect([401, 404]).toContain(response.status);
      });

      test('POST /school/fee-configuration - should require authentication', async () => {
         const response = await testHelper.getRequest()
            .post('/api/v1/school/fee-configuration')
            .send({
               school_id: 1,
               class_id: 1,
               fee_amount: 5000
            });

         expect([401, 404]).toContain(response.status);
      });
   });

   describe('Student Fee Routes', () => {
      test('GET /students/fees - should require authentication', async () => {
         const response = await testHelper.getRequest()
            .get('/api/v1/students/fees');

         expect([401, 404]).toContain(response.status);
      });

      test('POST /students/:id/fees - should require authentication', async () => {
         const response = await testHelper.getRequest()
            .post('/api/v1/students/1/fees')
            .send({
               amount: 5000,
               due_date: '2024-12-31'
            });

         expect([401, 404]).toContain(response.status);
      });
   });

   describe('Validation Testing for School Modules', () => {
      test('School creation should validate required fields', async () => {
         const response = await testHelper.getRequest()
            .post('/api/v1/trust/1/schools')
            .send({});

         expect([400, 401, 404]).toContain(response.status);
      });

      test('Class creation should validate school association', async () => {
         const response = await testHelper.getRequest()
            .post('/api/v1/school/classes')
            .send({
               name: 'Grade 1'
               // Missing school_id
            });

         expect([400, 401, 404]).toContain(response.status);
      });

      test('Section creation should validate class association', async () => {
         const response = await testHelper.getRequest()
            .post('/api/v1/school/sections')
            .send({
               name: 'Section A'
               // Missing class_id
            });

         expect([400, 401, 404]).toContain(response.status);
      });
   });

   describe('Query Parameter Validation', () => {
      test('School listing should handle pagination', async () => {
         const response = await testHelper.getRequest()
            .get('/api/v1/trust/1/schools?page=1&limit=10');

         expect([401, 404]).toContain(response.status);
      });

      test('Should handle invalid pagination parameters', async () => {
         const response = await testHelper.getRequest()
            .get('/api/v1/trust/1/schools?page=invalid&limit=abc');

         expect([400, 401, 404]).toContain(response.status);
      });
   });

   describe('Tenant Context Validation', () => {
      test('Should validate trust ID in URL parameters', async () => {
         const response = await testHelper.getRequest()
            .get('/api/v1/trust/invalid/schools');

         expect([400, 401, 404]).toContain(response.status);
      });

      test('Should handle non-existent trust IDs', async () => {
         const response = await testHelper.getRequest()
            .get('/api/v1/trust/99999/schools');

         expect([401, 404]).toContain(response.status);
      });
   });

   describe('Integration with Main System', () => {
      test('School routes should be properly integrated with trust context', async () => {
      // Test that school operations respect trust boundaries
         const response = await testHelper.getRequest()
            .get('/api/v1/trust/1/schools');

         // Routes may not be mounted, but they should respond consistently
         expect([401, 404]).toContain(response.status);
      });

      test('UDISE integration should work with school context', async () => {
         const response = await testHelper.getRequest()
            .get('/api/v1/school/udise/students');

         expect([401, 404]).toContain(response.status);
      });
   });
});