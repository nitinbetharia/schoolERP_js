const express = require('express');
const { logError } = require('../../utils/logger');

/**
 * Trust Management Routes Module
 * Handles trust-related administration
 * File size: ~200 lines (within industry standards)
 */

module.exports = function (middleware) {
   const router = express.Router();
   const { requireAuth } = middleware;

   /**
    * @route GET /
    * @desc List all trusts
    * @access Private (System Admin only)
    */
   router.get('/', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         if (userType !== 'system') {
            req.flash('error', 'Access denied. System admin privileges required.');
            return res.redirect('/dashboard');
         }

         // Fetch actual trusts data from the service
         const { trustService } = require('../../services/systemServices');
         let trusts = [];
         let pagination = null;

         try {
            const result = await trustService.listTrusts({
               page: req.query.page || 1,
               limit: req.query.limit || 10,
               status: req.query.status,
               search: req.query.search,
            });
            trusts = result.trusts || [];
            pagination = result.pagination || null;
         } catch (serviceError) {
            logError(serviceError, { context: 'trusts fetch' });
            req.flash('error', 'Unable to load trusts data. Please try again.');
         }

         res.render('pages/system/trusts/index', {
            title: 'Manage Trusts',
            description: 'View and manage all educational trusts in the system',
            user: req.session.user,
            tenant: null,
            userType: userType,
            currentPath: '/system/trusts',
            trusts: trusts,
            pagination: pagination,
            filters: {
               status: req.query.status || '',
               search: req.query.search || '',
            },
         });
      } catch (error) {
         logError(error, { context: 'system/trusts GET' });
         req.flash('error', 'Unable to load trusts page');
         res.redirect('/admin/system');
      }
   });

   /**
    * @route GET /new
    * @desc Show create trust form
    * @access Private (System Admin only)
    */
   router.get('/new', requireAuth, (req, res) => {
      try {
         const userType = req.session.userType;
         if (userType !== 'system') {
            req.flash('error', 'Access denied. System admin privileges required.');
            return res.redirect('/dashboard');
         }

         res.render('pages/system/trusts/new', {
            title: 'Create New Trust',
            description: 'Add a new educational trust to the system',
            user: req.session.user,
            tenant: null,
            userType: userType,
            currentPath: '/system/trusts/new',
         });
      } catch (error) {
         logError(error, { context: 'system/trusts/new GET' });
         req.flash('error', 'Unable to load trust creation page');
         res.redirect('/system/trusts');
      }
   });

   /**
    * @route GET /:id/edit
    * @desc Wizard: Edit trust
    * @access Private (System Admin only)
    */
   router.get('/:id/edit', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         if (userType !== 'system') {
            req.flash('error', 'Access denied. System admin privileges required.');
            return res.redirect('/dashboard');
         }

         // Fetch trust data from the service
         const { trustService } = require('../../services/systemServices');
         let trust = null;

         try {
            trust = await trustService.getTrust(req.params.id);
         } catch (serviceError) {
            logError(serviceError, { context: 'trust edit fetch', trustId: req.params.id });
            req.flash('error', 'Trust not found or unable to load trust data.');
            return res.redirect('/system/trusts');
         }

         res.render('pages/system/trusts/edit', {
            title: 'Edit Trust',
            description: 'Edit trust details and configuration',
            user: req.session.user,
            tenant: null,
            userType: userType,
            currentPath: '/system/trusts/edit',
            trustId: req.params.id,
            trust: trust,
         });
      } catch (error) {
         logError(error, { context: 'system/trusts/:id/edit GET' });
         req.flash('error', 'Unable to load trust edit page');
         res.redirect('/system/trusts');
      }
   });

   /**
    * @route GET /analytics
    * @desc Trust analytics dashboard
    * @access Private (System Admin only)
    */
   router.get('/analytics', requireAuth, (req, res) => {
      try {
         const userType = req.session.userType;
         if (userType !== 'system') {
            req.flash('error', 'Access denied. System admin privileges required.');
            return res.redirect('/dashboard');
         }

         res.render('pages/system/trusts/analytics', {
            title: 'Trust Analytics',
            description: 'Analytics and insights for all trusts',
            user: req.session.user,
            tenant: null,
            userType: userType,
            currentPath: '/system/trusts/analytics',
         });
      } catch (error) {
         logError(error, { context: 'system/trusts/analytics GET' });
         req.flash('error', 'Unable to load analytics page');
         res.redirect('/system/trusts');
      }
   });

   /**
    * @route GET /setup
    * @desc Trust setup and configuration
    * @access Private (System Admin only)
    */
   router.get('/setup', requireAuth, (req, res) => {
      try {
         const userType = req.session.userType;
         if (userType !== 'system') {
            req.flash('error', 'Access denied. System admin privileges required.');
            return res.redirect('/dashboard');
         }

         res.render('pages/system/trusts/setup', {
            title: 'Trust Setup',
            description: 'Configure trust settings and preferences',
            user: req.session.user,
            tenant: null,
            userType: userType,
            currentPath: '/system/trusts/setup',
         });
      } catch (error) {
         logError(error, { context: 'system/trusts/setup GET' });
         req.flash('error', 'Unable to load setup page');
         res.redirect('/system/trusts');
      }
   });

   /**
    * @route GET /:id/details
    * @desc Trust details page
    * @access Private (System Admin only)
    */
   router.get('/:id/details', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         if (userType !== 'system') {
            req.flash('error', 'Access denied. System admin privileges required.');
            return res.redirect('/dashboard');
         }

         // Fetch trust details from the service
         const { trustService } = require('../../services/systemServices');
         let trust = null;

         try {
            trust = await trustService.getTrust(req.params.id);
         } catch (serviceError) {
            logError(serviceError, { context: 'trust details fetch', trustId: req.params.id });
            req.flash('error', 'Trust not found or unable to load details.');
            return res.redirect('/system/trusts');
         }

         res.render('pages/system/trusts/details', {
            title: `${trust.trust_name} - Details`,
            description: 'Detailed view of trust information and settings',
            user: req.session.user,
            tenant: null,
            userType: userType,
            currentPath: `/system/trusts/${req.params.id}/details`,
            trust: trust,
         });
      } catch (error) {
         logError(error, { context: 'system/trusts/:id/details GET' });
         req.flash('error', 'Unable to load trust details page');
         res.redirect('/system/trusts');
      }
   });

   return router;
};
