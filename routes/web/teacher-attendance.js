const express = require('express');
const { logError } = require('../../utils/logger');

/**
 * Teacher Attendance Management Routes
 * Attendance marking, viewing, and reporting functionality
 */

module.exports = function (middleware) {
   const router = express.Router();
   const { requireAuth } = middleware;

   /**
    * @route GET /teacher/attendance/mark
    * @desc Daily attendance marking interface
    * @access Private (Teachers, School Admin, Trust Admin)
    */
   router.get('/mark', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'teacher'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Teacher portal access required.');
            return res.redirect('/dashboard');
         }

         // Mock classes for attendance marking
         const classes = [
            {
               id: 1,
               subject: 'Mathematics',
               class: '10th A',
               totalStudents: 30,
               attendanceMarked: false,
               lastMarked: null,
            },
            {
               id: 2,
               subject: 'Physics',
               class: '11th B',
               totalStudents: 25,
               attendanceMarked: true,
               lastMarked: '2024-01-15T09:00:00Z',
            },
         ];

         res.render('pages/teacher/attendance/mark', {
            title: 'Mark Attendance',
            description: 'Mark daily attendance for your classes',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/teacher/attendance/mark',
            classes,
         });
      } catch (error) {
         logError(error, { context: 'teacher attendance mark GET' });
         req.flash('error', 'Unable to load attendance marking page');
         res.redirect('/teacher/dashboard');
      }
   });

   /**
    * @route GET /teacher/attendance/view
    * @desc View attendance records
    * @access Private (Teachers, School Admin, Trust Admin)
    */
   router.get('/view', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'teacher'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Teacher portal access required.');
            return res.redirect('/dashboard');
         }

         // Mock attendance data
         const attendanceRecords = [
            {
               date: '2024-01-15',
               class: '10th A',
               subject: 'Mathematics',
               totalStudents: 30,
               presentStudents: 28,
               attendanceRate: 93.3,
            },
            {
               date: '2024-01-14',
               class: '11th B',
               subject: 'Physics',
               totalStudents: 25,
               presentStudents: 23,
               attendanceRate: 92.0,
            },
         ];

         res.render('pages/teacher/attendance/view', {
            title: 'Attendance Records',
            description: 'View attendance history for your classes',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/teacher/attendance/view',
            attendanceRecords,
         });
      } catch (error) {
         logError(error, { context: 'teacher attendance view GET' });
         req.flash('error', 'Unable to load attendance records');
         res.redirect('/teacher/dashboard');
      }
   });

   /**
    * @route GET /teacher/attendance/reports
    * @desc Attendance analytics and reports
    * @access Private (Teachers, School Admin, Trust Admin)
    */
   router.get('/reports', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'teacher'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Teacher portal access required.');
            return res.redirect('/dashboard');
         }

         // Mock attendance report data
         const reportData = {
            overallAttendance: 89.5,
            monthlyTrend: {
               labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
               data: [92, 88, 87, 91],
            },
            classWiseAttendance: [
               { class: '10th A', attendance: 93.3 },
               { class: '11th B', attendance: 92.0 },
               { class: '9th B', attendance: 85.7 },
            ],
         };

         res.render('pages/teacher/attendance/reports', {
            title: 'Attendance Reports',
            description: 'Attendance analytics and trends',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/teacher/attendance/reports',
            reportData,
         });
      } catch (error) {
         logError(error, { context: 'teacher attendance reports GET' });
         req.flash('error', 'Unable to load attendance reports');
         res.redirect('/teacher/dashboard');
      }
   });

   return router;
};
