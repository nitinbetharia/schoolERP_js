const express = require('express');
const { logError } = require('../../utils/logger');

/**
 * School Management Routes Module
 * Handles school-related administration
 * File size: ~200 lines (within industry standards)
 */

module.exports = function (middleware) {
   const router = express.Router();
   const { requireAuth } = middleware;

   /**
    * @route GET /
    * @desc List all schools
    * @access Private (System Admin only)
    */
   router.get('/', requireAuth, (req, res) => {
      try {
         const userType = req.session.userType;
         if (userType !== 'system') {
            req.flash('error', 'Access denied. System admin privileges required.');
            return res.redirect('/dashboard');
         }

         res.render('pages/system/schools/index', {
            title: 'School Management',
            description: 'Manage schools across all trusts',
            user: req.session.user,
            tenant: null,
            userType: userType,
            currentPath: '/system/schools',
         });
      } catch (error) {
         logError(error, { context: 'system/schools GET' });
         req.flash('error', 'Unable to load schools page');
         res.redirect('/admin/system');
      }
   });

   /**
    * @route GET /new
    * @desc Wizard: Create new school
    * @access Private (System Admin only)
    */
   router.get('/new', requireAuth, (req, res) => {
      try {
         const userType = req.session.userType;
         if (userType !== 'system') {
            req.flash('error', 'Access denied. System admin privileges required.');
            return res.redirect('/dashboard');
         }

         res.render('pages/system/schools/new', {
            title: 'Create School',
            description: 'Add a new school under a trust',
            user: req.session.user,
            tenant: null,
            userType: userType,
            currentPath: '/system/schools/new',
         });
      } catch (error) {
         logError(error, { context: 'system/schools/new GET' });
         req.flash('error', 'Unable to load school creation page');
         res.redirect('/system/schools');
      }
   });

   /**
    * @route GET /:id/edit
    * @desc Wizard: Edit school
    * @access Private (System Admin only)
    */
   router.get('/:id/edit', requireAuth, (req, res) => {
      try {
         const userType = req.session.userType;
         if (userType !== 'system') {
            req.flash('error', 'Access denied. System admin privileges required.');
            return res.redirect('/dashboard');
         }

         res.render('pages/system/schools/edit', {
            title: 'Edit School',
            description: 'Edit school details and configuration',
            user: req.session.user,
            tenant: null,
            userType: userType,
            currentPath: '/system/schools/edit',
            schoolId: req.params.id,
         });
      } catch (error) {
         logError(error, { context: 'system/schools/:id/edit GET' });
         req.flash('error', 'Unable to load school edit page');
         res.redirect('/system/schools');
      }
   });

   /**
    * @route GET /performance
    * @desc School performance dashboard
    * @access Private (System Admin only)
    */
   router.get('/performance', requireAuth, (req, res) => {
      try {
         const userType = req.session.userType;
         if (userType !== 'system') {
            req.flash('error', 'Access denied. System admin privileges required.');
            return res.redirect('/dashboard');
         }

         res.render('pages/system/schools/performance', {
            title: 'School Performance',
            description: 'Monitor academic and operational performance across schools',
            user: req.session.user,
            tenant: null,
            userType: userType,
            currentPath: '/system/schools/performance',
         });
      } catch (error) {
         logError(error, { context: 'system/schools/performance GET' });
         req.flash('error', 'Unable to load performance page');
         res.redirect('/system/schools');
      }
   });

   /**
    * @route GET /compliance
    * @desc School compliance monitoring
    * @access Private (System Admin only)
    */
   router.get('/compliance', requireAuth, (req, res) => {
      try {
         const userType = req.session.userType;
         if (userType !== 'system') {
            req.flash('error', 'Access denied. System admin privileges required.');
            return res.redirect('/dashboard');
         }

         res.render('pages/system/schools/compliance', {
            title: 'School Compliance',
            description: 'Monitor regulatory compliance and requirements',
            user: req.session.user,
            tenant: null,
            userType: userType,
            currentPath: '/system/schools/compliance',
         });
      } catch (error) {
         logError(error, { context: 'system/schools/compliance GET' });
         req.flash('error', 'Unable to load compliance page');
         res.redirect('/system/schools');
      }
   });

   return router;
};
