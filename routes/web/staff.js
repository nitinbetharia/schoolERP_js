const express = require('express');
const { logError } = require('../../utils/logger');

/**
 * Staff Management Routes Module
 * Handles staff-related administration for trust admin users
 * File size: ~150 lines (within industry standards)
 */

module.exports = function (middleware) {
   const router = express.Router();
   const { requireAuth } = middleware;

   /**
    * @route GET /
    * @desc List all staff members
    * @access Private (Trust Admin, School Admin)
    */
   router.get('/', requireAuth, (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['trust', 'school', 'system'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Staff management privileges required.');
            return res.redirect('/dashboard');
         }

         // Mock staff data for now - will be replaced with actual database queries
         const mockStaff = [
            {
               id: 1,
               name: 'Dr. Sarah Johnson',
               role: 'Principal',
               department: 'Administration',
               email: 'sarah.johnson@school.edu',
               phone: '+1 (555) 123-4567',
               status: 'Active',
               joinDate: '2020-08-15',
               school: 'Central High School',
            },
            {
               id: 2,
               name: 'Michael Brown',
               role: 'Mathematics Teacher',
               department: 'Mathematics',
               email: 'michael.brown@school.edu',
               phone: '+1 (555) 123-4568',
               status: 'Active',
               joinDate: '2021-01-10',
               school: 'Central High School',
            },
            {
               id: 3,
               name: 'Emily Davis',
               role: 'English Teacher',
               department: 'English',
               email: 'emily.davis@school.edu',
               phone: '+1 (555) 123-4569',
               status: 'Active',
               joinDate: '2019-09-01',
               school: 'Westside Elementary',
            },
         ];

         // Create pagination data for staff list
         const pagination = {
            currentPage: parseInt(req.query.page) || 1,
            totalPages: Math.ceil(mockStaff.length / 20),
            pageSize: 20,
            totalRecords: mockStaff.length,
         };

         res.render('pages/staff/index', {
            title: 'Staff Management',
            description: 'Manage staff members across all schools',
            user: req.session.user,
            tenant: req.session.tenant || req.tenant,
            userType: userType,
            currentPath: '/staff',
            staff: mockStaff,
            pagination: pagination,
            filters: {
               role: req.query.role || '',
               department: req.query.department || '',
               status: req.query.status || '',
               search: req.query.search || '',
            },
         });
      } catch (error) {
         logError(error, { context: 'staff GET' });
         req.flash('error', 'Unable to load staff page');
         res.redirect('/dashboard');
      }
   });

   /**
    * @route GET /new
    * @desc Show add staff form
    * @access Private (Trust Admin, School Admin)
    */
   router.get('/new', requireAuth, (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['trust', 'school', 'system'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Staff management privileges required.');
            return res.redirect('/dashboard');
         }

         res.render('pages/staff/new', {
            title: 'Add New Staff Member',
            description: 'Add a new staff member to the system',
            user: req.session.user,
            tenant: req.session.tenant || req.tenant,
            userType: userType,
            currentPath: '/staff/new',
         });
      } catch (error) {
         logError(error, { context: 'staff/new GET' });
         req.flash('error', 'Unable to load staff creation page');
         res.redirect('/staff');
      }
   });

   /**
    * @route GET /:id
    * @desc Staff member details
    * @access Private (Trust Admin, School Admin)
    */
   router.get('/:id', requireAuth, (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['trust', 'school', 'system'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Staff management privileges required.');
            return res.redirect('/dashboard');
         }

         // Mock staff member data - replace with database query
         const mockStaffMember = {
            id: req.params.id,
            name: 'Dr. Sarah Johnson',
            role: 'Principal',
            department: 'Administration',
            email: 'sarah.johnson@school.edu',
            phone: '+1 (555) 123-4567',
            status: 'Active',
            joinDate: '2020-08-15',
            school: 'Central High School',
            address: '123 Education Street, Learning City, LC 12345',
            qualifications: ['Ph.D. in Educational Administration', 'M.Ed. in Leadership'],
            experience: '15 years',
         };

         res.render('pages/staff/details', {
            title: `${mockStaffMember.name} - Staff Details`,
            description: 'Staff member details and information',
            user: req.session.user,
            tenant: req.session.tenant || req.tenant,
            userType: userType,
            currentPath: `/staff/${req.params.id}`,
            staffMember: mockStaffMember,
         });
      } catch (error) {
         logError(error, { context: 'staff/:id GET' });
         req.flash('error', 'Unable to load staff member details');
         res.redirect('/staff');
      }
   });

   return router;
};
