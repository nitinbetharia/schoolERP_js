const express = require('express');
const { logError } = require('../../utils/logger');

/**
 * Teacher Assignment Management Routes
 * Assignment creation, review, and grading functionality
 */

module.exports = function (middleware) {
   const router = express.Router();
   const { requireAuth } = middleware;

   /**
    * @route GET /teacher/assignments
    * @desc Assignment list and management
    * @access Private (Teachers, School Admin, Trust Admin)
    */
   router.get('/', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'teacher'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Teacher portal access required.');
            return res.redirect('/dashboard');
         }

         // Mock assignments data
         const assignments = [
            {
               id: 1,
               title: 'Algebra Problems - Chapter 5',
               subject: 'Mathematics',
               class: '10th A',
               dueDate: '2024-01-20',
               submissions: 25,
               totalStudents: 30,
               status: 'Active',
            },
            {
               id: 2,
               title: "Physics Lab Report - Newton's Laws",
               subject: 'Physics',
               class: '11th B',
               dueDate: '2024-01-18',
               submissions: 23,
               totalStudents: 25,
               status: 'Active',
            },
         ];

         res.render('pages/teacher/assignments/index', {
            title: 'Assignments',
            description: 'Manage assignments and homework',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/teacher/assignments',
            assignments,
         });
      } catch (error) {
         logError(error, { context: 'teacher assignments GET' });
         req.flash('error', 'Unable to load assignments');
         res.redirect('/teacher/dashboard');
      }
   });

   /**
    * @route GET /teacher/assignments/new
    * @desc Create new assignment form
    * @access Private (Teachers, School Admin, Trust Admin)
    */
   router.get('/new', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'teacher'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Teacher portal access required.');
            return res.redirect('/dashboard');
         }

         // Mock teacher classes for assignment creation
         const teacherClasses = [
            { id: 1, subject: 'Mathematics', class: '10th A' },
            { id: 2, subject: 'Physics', class: '11th B' },
            { id: 3, subject: 'Mathematics', class: '9th B' },
         ];

         res.render('pages/teacher/assignments/new', {
            title: 'Create New Assignment',
            description: 'Create a new assignment or homework task',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/teacher/assignments/new',
            teacherClasses,
         });
      } catch (error) {
         logError(error, { context: 'teacher assignments new GET' });
         req.flash('error', 'Unable to load assignment creation form');
         res.redirect('/teacher/assignments');
      }
   });

   /**
    * @route GET /teacher/assignments/submissions
    * @desc Review assignment submissions
    * @access Private (Teachers, School Admin, Trust Admin)
    */
   router.get('/submissions', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'teacher'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Teacher portal access required.');
            return res.redirect('/dashboard');
         }

         // Mock submissions data
         const submissions = [
            {
               id: 1,
               studentName: 'John Doe',
               rollNumber: 'ST001',
               assignmentTitle: 'Algebra Problems - Chapter 5',
               class: '10th A',
               submissionDate: '2024-01-15T16:30:00Z',
               status: 'Submitted',
               grade: null,
            },
            {
               id: 2,
               studentName: 'Jane Smith',
               rollNumber: 'ST002',
               assignmentTitle: 'Physics Lab Report',
               class: '11th B',
               submissionDate: '2024-01-14T14:20:00Z',
               status: 'Graded',
               grade: 'A+',
            },
         ];

         res.render('pages/teacher/assignments/submissions', {
            title: 'Assignment Submissions',
            description: 'Review and grade student submissions',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/teacher/assignments/submissions',
            submissions,
         });
      } catch (error) {
         logError(error, { context: 'teacher assignments submissions GET' });
         req.flash('error', 'Unable to load submissions');
         res.redirect('/teacher/assignments');
      }
   });

   return router;
};
