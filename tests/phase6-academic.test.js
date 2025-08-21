const request = require('supertest');
const SchoolERPServer = require('../server');

/**
 * Phase 6 - Academic Management System Tests
 * Tests comprehensive academic operations including exams, grades, assessments, and transcripts
 */

describe('Phase 6 - Academic Management System', () => {
   let app;
   let server;
   let authCookie;
   let trustId;
   let schoolId;
   let academicYearId;
   let classId;
   let sectionId;
   let subjectId;
   let studentId;
   let examId;
   let gradeId;

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
         trust_name: `Academic Test Trust ${timestamp}`,
         trust_code: `acad${timestamp.toString().slice(-10)}`,
         subdomain: `academictest${timestamp}`,
         contact_email: `admin${timestamp}@academictest.school`,
         contact_phone: '9876543210',
         address: 'Academic Test Address',
      };

      const trustResponse = await request(app)
         .post('/api/v1/admin/system/trusts')
         .set('Cookie', authCookie)
         .send(trustData);

      trustId = trustResponse.body.data.id;

      // Create school
      const schoolData = {
         name: `Academic Test School ${timestamp}`,
         code: `ACAD${timestamp.toString().slice(-8)}`,
         address: 'Academic Test School Address',
         contact_phone: '9876543210',
         contact_email: `principal${timestamp}@academictest.school`,
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

      // Create class, section, subject, and student
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

      const sectionData = {
         name: 'Section A',
         code: 'A',
         capacity: 20,
         class_id: classId,
      };

      const sectionResponse = await request(app)
         .post(`/api/v1/trust/${trustId}/schools/${schoolId}/classes/${classId}/sections`)
         .set('Cookie', authCookie)
         .send(sectionData);

      sectionId = sectionResponse.body.data.id;

      const subjectData = {
         name: 'Mathematics',
         code: 'MATH',
         type: 'CORE',
      };

      const subjectResponse = await request(app)
         .post(`/api/v1/trust/${trustId}/schools/${schoolId}/subjects`)
         .set('Cookie', authCookie)
         .send(subjectData);

      subjectId = subjectResponse.body.data.id;

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

   describe('Exam Management', () => {
      test('Should create an exam', async () => {
         const examData = {
            name: 'Mid Term Exam',
            description: 'Mid term examination for Grade 5',
            exam_type: 'MID_TERM',
            start_date: '2024-09-01',
            end_date: '2024-09-10',
            class_id: classId,
            academic_year_id: academicYearId,
            total_marks: 100,
            passing_marks: 40,
         };

         const response = await request(app)
            .post(`/api/v1/trust/${trustId}/schools/${schoolId}/exams`)
            .set('Cookie', authCookie)
            .send(examData);

         expect(response.status).toBe(201);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('id');
         expect(response.body.data.name).toBe(examData.name);
         expect(response.body.data.school_id).toBe(schoolId);

         examId = response.body.data.id;
      });

      test('Should get exam by ID', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/exams/${examId}`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('id', examId);
         expect(response.body.data.school_id).toBe(schoolId);
      });

      test('Should list exams for school', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/exams`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(Array.isArray(response.body.data)).toBe(true);
         expect(response.body.data.length).toBeGreaterThan(0);
      });

      test('Should update exam information', async () => {
         const updateData = {
            name: 'Updated Mid Term Exam',
            total_marks: 120,
         };

         const response = await request(app)
            .put(`/api/v1/trust/${trustId}/schools/${schoolId}/exams/${examId}`)
            .set('Cookie', authCookie)
            .send(updateData);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(response.body.data.name).toBe(updateData.name);
         expect(response.body.data.total_marks).toBe(updateData.total_marks);
      });
   });

   describe('Grade Management', () => {
      test('Should record student grade', async () => {
         const gradeData = {
            student_id: studentId,
            exam_id: examId,
            subject_id: subjectId,
            marks_obtained: 85,
            total_marks: 100,
            grade: 'A',
            remarks: 'Excellent performance',
         };

         const response = await request(app)
            .post(`/api/v1/trust/${trustId}/schools/${schoolId}/grades`)
            .set('Cookie', authCookie)
            .send(gradeData);

         expect(response.status).toBe(201);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('id');
         expect(response.body.data.student_id).toBe(studentId);
         expect(response.body.data.marks_obtained).toBe(gradeData.marks_obtained);

         gradeId = response.body.data.id;
      });

      test('Should get student grades', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/students/${studentId}/grades`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(Array.isArray(response.body.data)).toBe(true);
         expect(response.body.data.length).toBeGreaterThan(0);
      });

      test('Should update grade record', async () => {
         const updateData = {
            marks_obtained: 90,
            grade: 'A+',
            remarks: 'Outstanding performance',
         };

         const response = await request(app)
            .put(`/api/v1/trust/${trustId}/schools/${schoolId}/grades/${gradeId}`)
            .set('Cookie', authCookie)
            .send(updateData);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(response.body.data.marks_obtained).toBe(updateData.marks_obtained);
         expect(response.body.data.grade).toBe(updateData.grade);
      });
   });

   describe('Assessment Analytics', () => {
      test('Should get exam statistics', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/exams/${examId}/statistics`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('total_students');
         expect(response.body.data).toHaveProperty('average_marks');
         expect(response.body.data).toHaveProperty('highest_marks');
         expect(response.body.data).toHaveProperty('lowest_marks');
      });

      test('Should get student performance report', async () => {
         const response = await request(app)
            .get(
               `/api/v1/trust/${trustId}/schools/${schoolId}/students/${studentId}/performance?academic_year_id=${academicYearId}`
            )
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('overall_grade');
         expect(response.body.data).toHaveProperty('subject_wise_performance');
         expect(response.body.data).toHaveProperty('exam_wise_performance');
      });

      test('Should get class performance analytics', async () => {
         const response = await request(app)
            .get(
               `/api/v1/trust/${trustId}/schools/${schoolId}/classes/${classId}/performance-analytics?academic_year_id=${academicYearId}`
            )
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('class_average');
         expect(response.body.data).toHaveProperty('subject_wise_averages');
         expect(response.body.data).toHaveProperty('top_performers');
      });
   });

   describe('Report Card Generation', () => {
      test('Should generate student report card', async () => {
         const response = await request(app)
            .get(
               `/api/v1/trust/${trustId}/schools/${schoolId}/students/${studentId}/report-card?academic_year_id=${academicYearId}&format=pdf`
            )
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('report_card_url');
      });

      test('Should generate bulk report cards for class', async () => {
         const response = await request(app)
            .post(`/api/v1/trust/${trustId}/schools/${schoolId}/classes/${classId}/bulk-report-cards`)
            .set('Cookie', authCookie)
            .send({
               academic_year_id: academicYearId,
               format: 'pdf',
            });

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('batch_id');
         expect(response.body.data).toHaveProperty('status');
      });
   });

   describe('Transcript Management', () => {
      test('Should generate student transcript', async () => {
         const transcriptData = {
            student_id: studentId,
            academic_year_id: academicYearId,
            include_grades: true,
            include_attendance: true,
            include_conduct: true,
         };

         const response = await request(app)
            .post(`/api/v1/trust/${trustId}/schools/${schoolId}/transcripts`)
            .set('Cookie', authCookie)
            .send(transcriptData);

         expect(response.status).toBe(201);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('id');
         expect(response.body.data.student_id).toBe(studentId);
      });

      test('Should get transcript history for student', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/students/${studentId}/transcripts`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(Array.isArray(response.body.data)).toBe(true);
      });
   });

   describe('Academic Calendar', () => {
      test('Should create academic calendar event', async () => {
         const calendarData = {
            title: 'Mid Term Exam Week',
            description: 'Mid term examinations for all classes',
            event_type: 'EXAM',
            start_date: '2024-09-01',
            end_date: '2024-09-07',
            academic_year_id: academicYearId,
         };

         const response = await request(app)
            .post(`/api/v1/trust/${trustId}/schools/${schoolId}/calendar`)
            .set('Cookie', authCookie)
            .send(calendarData);

         expect(response.status).toBe(201);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('id');
         expect(response.body.data.title).toBe(calendarData.title);
      });

      test('Should get academic calendar events', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/calendar?academic_year_id=${academicYearId}`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(Array.isArray(response.body.data)).toBe(true);
      });
   });

   describe('Grade Book Management', () => {
      test('Should create grade book entry', async () => {
         const gradeBookData = {
            class_id: classId,
            section_id: sectionId,
            subject_id: subjectId,
            academic_year_id: academicYearId,
            assignment_name: 'Math Quiz 1',
            assignment_type: 'QUIZ',
            total_marks: 20,
            due_date: '2024-08-25',
         };

         const response = await request(app)
            .post(`/api/v1/trust/${trustId}/schools/${schoolId}/gradebook`)
            .set('Cookie', authCookie)
            .send(gradeBookData);

         expect(response.status).toBe(201);
         expect(response.body.success).toBe(true);
         expect(response.body.data).toHaveProperty('id');
         expect(response.body.data.assignment_name).toBe(gradeBookData.assignment_name);
      });

      test('Should get grade book for class', async () => {
         const response = await request(app)
            .get(`/api/v1/trust/${trustId}/schools/${schoolId}/gradebook?class_id=${classId}&subject_id=${subjectId}`)
            .set('Cookie', authCookie);

         expect(response.status).toBe(200);
         expect(response.body.success).toBe(true);
         expect(Array.isArray(response.body.data)).toBe(true);
      });
   });
});
