const express = require('express');
const { logError } = require('../../utils/logger');

/**
 * Student Management Routes
 * Core ERP functionality for student CRUD operations
 */

module.exports = function (middleware) {
   const router = express.Router();
   const { requireAuth } = middleware;

   /**
    * @route GET /students
    * @desc Students list page
    * @access Private (School Admin, Trust Admin, Teachers)
    */
   router.get('/', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'teacher'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Insufficient privileges for student management.');
            return res.redirect('/dashboard');
         }

         // Mock data for now - will be replaced with actual database queries
         const students = [
            {
               id: 1,
               firstName: 'John',
               lastName: 'Doe',
               rollNumber: 'ST001',
               class: '10th',
               section: 'A',
               admissionDate: '2024-04-15',
               status: 'Active',
            },
            {
               id: 2,
               firstName: 'Jane',
               lastName: 'Smith',
               rollNumber: 'ST002',
               class: '10th',
               section: 'B',
               admissionDate: '2024-04-16',
               status: 'Active',
            },
         ];

         const filters = {
            search: req.query.search || '',
            class: req.query.class || '',
            section: req.query.section || '',
            status: req.query.status || 'Active',
         };

         const pagination = {
            currentPage: parseInt(req.query.page) || 1,
            totalPages: Math.ceil(students.length / 20),
            pageSize: 20,
            totalRecords: students.length,
         };

         res.render('pages/students/index', {
            title: 'Student Management',
            description: 'Manage student records and information',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/students',
            students,
            filters,
            pagination,
         });
      } catch (error) {
         logError(error, { context: 'students index GET' });
         req.flash('error', 'Unable to load students page');
         res.redirect('/dashboard');
      }
   });

   /**
    * @route GET /students/new
    * @desc New student form page
    * @access Private (School Admin, Trust Admin)
    */
   router.get('/new', requireAuth, (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Student creation privileges required.');
            return res.redirect('/students');
         }

         res.render('pages/students/new', {
            title: 'Add New Student',
            description: 'Register a new student in the system',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/students/new',
         });
      } catch (error) {
         logError(error, { context: 'students new GET' });
         req.flash('error', 'Unable to load new student page');
         res.redirect('/students');
      }
   });

   /**
    * @route POST /students
    * @desc Create new student
    * @access Private (School Admin, Trust Admin)
    */
   router.post('/', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Student creation privileges required.');
            return res.redirect('/students');
         }

         // TODO: Add validation and database insertion
         console.log('Student creation data:', req.body);

         req.flash('success', 'Student added successfully!');
         res.redirect('/students');
      } catch (error) {
         logError(error, { context: 'students create POST' });
         req.flash('error', 'Failed to create student');
         res.redirect('/students/new');
      }
   });

   /**
    * @route GET /students/:id
    * @desc Student profile page
    * @access Private (School Admin, Trust Admin, Teachers, Parents)
    */
   router.get('/:id', requireAuth, async (req, res) => {
      try {
         const studentId = req.params.id;
         const userType = req.session.userType;

         // Mock student data - replace with database query
         const student = {
            id: studentId,
            firstName: 'John',
            lastName: 'Doe',
            rollNumber: 'ST001',
            class: '10th',
            section: 'A',
            admissionDate: '2024-04-15',
            status: 'Active',
            dateOfBirth: '2008-05-10',
            gender: 'Male',
            address: '123 Main Street, City',
            phone: '9876543210',
            email: 'john.doe@email.com',
            guardianName: 'Robert Doe',
            guardianPhone: '9876543211',
         };

         res.render('pages/students/profile', {
            title: `Student Profile - ${student.firstName} ${student.lastName}`,
            description: 'View and manage student information',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: `/students/${studentId}`,
            student,
         });
      } catch (error) {
         logError(error, { context: 'student profile GET' });
         req.flash('error', 'Unable to load student profile');
         res.redirect('/students');
      }
   });

   /**
    * @route GET /students/:id/edit
    * @desc Edit student form page
    * @access Private (School Admin, Trust Admin)
    */
   router.get('/:id/edit', requireAuth, async (req, res) => {
      try {
         const studentId = req.params.id;
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Student edit privileges required.');
            return res.redirect(`/students/${studentId}`);
         }

         // Mock student data - replace with database query
         const student = {
            id: studentId,
            firstName: 'John',
            lastName: 'Doe',
            rollNumber: 'ST001',
            class: '10th',
            section: 'A',
            admissionDate: '2024-04-15',
            status: 'Active',
            dateOfBirth: '2008-05-10',
            gender: 'Male',
            address: '123 Main Street, City',
            phone: '9876543210',
            email: 'john.doe@email.com',
            guardianName: 'Robert Doe',
            guardianPhone: '9876543211',
         };

         res.render('pages/students/edit', {
            title: `Edit Student - ${student.firstName} ${student.lastName}`,
            description: 'Update student information',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: `/students/${studentId}/edit`,
            student,
         });
      } catch (error) {
         logError(error, { context: 'student edit GET' });
         req.flash('error', 'Unable to load student edit page');
         res.redirect('/students');
      }
   });

   return router;
};
