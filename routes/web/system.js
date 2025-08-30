const express = require('express');
const { logError } = require('../../utils/logger');

/**
 * System Administration Routes Module
 * Handles system admin dashboard and core system management
 * File size: ~250 lines (within industry standards)
 */

module.exports = function (middleware) {
   const router = express.Router();
   const { requireAuth } = middleware;

   /**
    * @route GET /admin/system
    * @desc System Admin Dashboard page
    * @access Private (System Admin only)
    */
   router.get('/admin/system', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;

         // Only allow system admins
         if (userType !== 'system') {
            req.flash('error', 'Access denied. System admin privileges required.');
            return res.redirect('/dashboard');
         }

         // Fetch real system statistics
         const { trustService } = require('../../services/systemServices');
         let stats = null;

         try {
            stats = await trustService.getSystemStats();
         } catch (statsError) {
            logError(statsError, { context: 'admin/system stats fetch' });
            // Provide fallback stats if service fails
            stats = {
               totalTrusts: 0,
               activeTrusts: 0,
               pendingTrusts: 0,
               totalSystemUsers: 0,
               activeUsers: 0,
               systemHealth: 'unknown',
               databaseStatus: 'unknown',
               lastUpdated: new Date().toISOString(),
               error: 'Unable to retrieve current statistics',
            };
         }

         res.render('pages/dashboard/system-admin', {
            title: 'System Administration',
            description: 'System admin dashboard for managing trusts and configuration',
            user: req.session.user,
            tenant: null,
            userType: userType,
            currentPath: '/admin/system',
            stats: stats,
         });
      } catch (error) {
         logError(error, { context: 'admin/system GET' });
         req.flash('error', 'Unable to load system dashboard');
         res.redirect('/login');
      }
   });

   /**
    * @route GET /system/health
    * @desc System health monitoring page
    * @access Private (System Admin only)
    */
   router.get('/health', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         if (userType !== 'system') {
            req.flash('error', 'Access denied. System admin privileges required.');
            return res.redirect('/dashboard');
         }

         const { systemHealthService } = require('../../services/systemServices');
         let stats = null;
         let healthData = null;

         try {
            stats = await systemHealthService.getSystemStats();
            healthData = await systemHealthService.getDetailedHealthStatus();
         } catch (error) {
            logError(error, { context: 'system/health service' });
            stats = {
               error: 'Unable to retrieve health data',
               lastChecked: new Date().toISOString(),
            };
            healthData = {
               database: { status: 'unknown', message: 'Health check failed' },
               services: { status: 'unknown', message: 'Health check failed' },
               memory: { status: 'unknown', message: 'Health check failed' },
            };
         }

         res.render('pages/system/health/index', {
            title: 'System Health',
            description: 'Monitor system performance and health status',
            user: req.session.user,
            tenant: null,
            userType: userType,
            currentPath: '/system/health',
            stats: stats,
            health: healthData,
         });
      } catch (error) {
         logError(error, { context: 'system/health GET' });
         req.flash('error', 'Unable to load health monitoring');
         res.redirect('/admin/system');
      }
   });

   /**
    * @route GET /system/profile
    * @desc System admin profile page
    * @access Private (System Admin only)
    */
   router.get('/admin/system/profile', requireAuth, (req, res) => {
      try {
         const userType = req.session.userType;
         if (userType !== 'system') {
            req.flash('error', 'Access denied. System admin privileges required.');
            return res.redirect('/dashboard');
         }

         res.render('pages/system/profile/index', {
            title: 'System Profile',
            description: 'System administrator profile and settings',
            user: req.session.user,
            tenant: null,
            userType: userType,
            currentPath: '/admin/system/profile',
         });
      } catch (error) {
         logError(error, { context: 'admin/system/profile GET' });
         req.flash('error', 'Unable to load profile page');
         res.redirect('/admin/system');
      }
   });

   /**
    * @route GET /system/sessions
    * @desc System session monitoring
    * @access Private (System Admin only)
    */
   router.get('/sessions', requireAuth, (req, res) => {
      try {
         const userType = req.session.userType;
         if (userType !== 'system') {
            req.flash('error', 'Access denied. System admin privileges required.');
            return res.redirect('/dashboard');
         }

         res.render('pages/system/sessions/index', {
            title: 'Session Management',
            description: 'Monitor and manage active user sessions',
            user: req.session.user,
            tenant: null,
            userType: userType,
            currentPath: '/system/sessions',
         });
      } catch (error) {
         logError(error, { context: 'system/sessions GET' });
         req.flash('error', 'Unable to load sessions page');
         res.redirect('/admin/system');
      }
   });

   /**
    * @route GET /system/audit
    * @desc System audit logs
    * @access Private (System Admin only)
    */
   router.get('/audit', requireAuth, (req, res) => {
      try {
         const userType = req.session.userType;
         if (userType !== 'system') {
            req.flash('error', 'Access denied. System admin privileges required.');
            return res.redirect('/dashboard');
         }

         res.render('pages/system/audit/index', {
            title: 'Audit Logs',
            description: 'View system audit logs and security events',
            user: req.session.user,
            tenant: null,
            userType: userType,
            currentPath: '/system/audit',
         });
      } catch (error) {
         logError(error, { context: 'system/audit GET' });
         req.flash('error', 'Unable to load audit page');
         res.redirect('/admin/system');
      }
   });

   /**
    * @route GET /system/performance
    * @desc System performance monitoring
    * @access Private (System Admin only)
    */
   router.get('/performance', requireAuth, (req, res) => {
      try {
         const userType = req.session.userType;
         if (userType !== 'system') {
            req.flash('error', 'Access denied. System admin privileges required.');
            return res.redirect('/dashboard');
         }

         res.render('pages/system/performance/index', {
            title: 'Performance Monitoring',
            description: 'Monitor system performance metrics and optimization',
            user: req.session.user,
            tenant: null,
            userType: userType,
            currentPath: '/system/performance',
         });
      } catch (error) {
         logError(error, { context: 'system/performance GET' });
         req.flash('error', 'Unable to load performance page');
         res.redirect('/admin/system');
      }
   });

   /**
    * @route GET /system/analytics
    * @desc System analytics dashboard
    * @access Private (System Admin only)
    */
   router.get('/analytics', requireAuth, (req, res) => {
      try {
         const userType = req.session.userType;
         if (userType !== 'system') {
            req.flash('error', 'Access denied. System admin privileges required.');
            return res.redirect('/dashboard');
         }

         res.render('pages/system/analytics/index', {
            title: 'System Analytics',
            description: 'System-wide analytics and insights',
            user: req.session.user,
            tenant: null,
            userType: userType,
            currentPath: '/system/analytics',
         });
      } catch (error) {
         logError(error, { context: 'system/analytics GET' });
         req.flash('error', 'Unable to load analytics page');
         res.redirect('/admin/system');
      }
   });

   /**
    * @route GET /system/logs
    * @desc System logs viewer
    * @access Private (System Admin only)
    */
   router.get('/logs', requireAuth, (req, res) => {
      try {
         const userType = req.session.userType;
         if (userType !== 'system') {
            req.flash('error', 'Access denied. System admin privileges required.');
            return res.redirect('/dashboard');
         }

         res.render('pages/system/logs/index', {
            title: 'System Logs',
            description: 'View and search system logs',
            user: req.session.user,
            tenant: null,
            userType: userType,
            currentPath: '/system/logs',
         });
      } catch (error) {
         logError(error, { context: 'system/logs GET' });
         req.flash('error', 'Unable to load logs page');
         res.redirect('/admin/system');
      }
   });

   return router;
};
