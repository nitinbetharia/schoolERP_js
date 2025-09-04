const express = require('express');
const { logError } = require('../../utils/logger');

/**
 * Help and Support Routes Module
 * Handles help system, documentation, and support requests
 * File size: ~100 lines (within industry standards)
 */

module.exports = function (middleware) {
   const router = express.Router();
   const { requireAuth } = middleware;

   /**
    * @route GET /
    * @desc Help center main page
    * @access Private (All authenticated users)
    */
   router.get('/', requireAuth, (req, res) => {
      try {
         const helpCategories = [
            {
               title: 'Getting Started',
               icon: 'fas fa-play-circle',
               description: 'Learn the basics of using the School ERP system',
               articles: [
                  { title: 'System Overview', url: '/help/getting-started/overview' },
                  { title: 'User Roles and Permissions', url: '/help/getting-started/roles' },
                  { title: 'Navigation Guide', url: '/help/getting-started/navigation' },
               ],
            },
            {
               title: 'Student Management',
               icon: 'fas fa-user-graduate',
               description: 'Managing student records, enrollment, and information',
               articles: [
                  { title: 'Adding Students', url: '/help/students/adding' },
                  { title: 'Student Profiles', url: '/help/students/profiles' },
                  { title: 'Bulk Import', url: '/help/students/import' },
               ],
            },
            {
               title: 'Staff Management',
               icon: 'fas fa-users',
               description: 'Managing teachers and staff members',
               articles: [
                  { title: 'Staff Profiles', url: '/help/staff/profiles' },
                  { title: 'Role Assignment', url: '/help/staff/roles' },
                  { title: 'Attendance Tracking', url: '/help/staff/attendance' },
               ],
            },
            {
               title: 'Fee Management',
               icon: 'fas fa-money-bill-wave',
               description: 'Fee structure, collection, and reporting',
               articles: [
                  { title: 'Fee Structure Setup', url: '/help/fees/setup' },
                  { title: 'Payment Collection', url: '/help/fees/collection' },
                  { title: 'Fee Reports', url: '/help/fees/reports' },
               ],
            },
            {
               title: 'Reports & Analytics',
               icon: 'fas fa-chart-bar',
               description: 'Generating reports and viewing analytics',
               articles: [
                  { title: 'Academic Reports', url: '/help/reports/academic' },
                  { title: 'Financial Reports', url: '/help/reports/financial' },
                  { title: 'Custom Reports', url: '/help/reports/custom' },
               ],
            },
            {
               title: 'System Administration',
               icon: 'fas fa-cog',
               description: 'System configuration and maintenance',
               articles: [
                  { title: 'User Management', url: '/help/admin/users' },
                  { title: 'System Settings', url: '/help/admin/settings' },
                  { title: 'Backup & Security', url: '/help/admin/security' },
               ],
            },
         ];

         res.render('pages/help/index', {
            title: 'Help Center',
            description: 'Find answers and get support for the School ERP system',
            user: req.session.user,
            tenant: req.session.tenant || req.tenant,
            userType: req.session.userType,
            currentPath: '/help',
            helpCategories: helpCategories,
         });
      } catch (error) {
         logError(error, { context: 'help GET' });
         req.flash('error', 'Unable to load help center');
         res.redirect('/dashboard');
      }
   });

   /**
    * @route GET /search
    * @desc Search help articles
    * @access Private (All authenticated users)
    */
   router.get('/search', requireAuth, (req, res) => {
      try {
         const query = req.query.q || '';

         // Mock search results - replace with actual search implementation
         const searchResults = query
            ? [
                 {
                    title: 'Adding New Students',
                    excerpt: 'Learn how to add new students to the system...',
                    category: 'Student Management',
                    url: '/help/students/adding',
                 },
                 {
                    title: 'Setting Up Fee Structure',
                    excerpt: 'Configure fee categories and amounts...',
                    category: 'Fee Management',
                    url: '/help/fees/setup',
                 },
              ]
            : [];

         res.render('pages/help/search', {
            title: `Help Search${query ? ` - ${query}` : ''}`,
            description: 'Search help articles and documentation',
            user: req.session.user,
            tenant: req.session.tenant || req.tenant,
            userType: req.session.userType,
            currentPath: '/help/search',
            query: query,
            results: searchResults,
         });
      } catch (error) {
         logError(error, { context: 'help/search GET' });
         req.flash('error', 'Unable to perform search');
         res.redirect('/help');
      }
   });

   /**
    * @route GET /contact
    * @desc Support contact form
    * @access Private (All authenticated users)
    */
   router.get('/contact', requireAuth, (req, res) => {
      try {
         res.render('pages/help/contact', {
            title: 'Contact Support',
            description: 'Get in touch with our support team',
            user: req.session.user,
            tenant: req.session.tenant || req.tenant,
            userType: req.session.userType,
            currentPath: '/help/contact',
         });
      } catch (error) {
         logError(error, { context: 'help/contact GET' });
         req.flash('error', 'Unable to load contact page');
         res.redirect('/help');
      }
   });

   return router;
};
