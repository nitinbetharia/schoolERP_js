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
    * @route GET /
    * @desc System Admin Dashboard at /system
    * @access Private (System Admin only)
    */
   router.get('/', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;

         if (userType !== 'system') {
            req.flash('error', 'Access denied. System admin privileges required.');
            return res.redirect('/dashboard');
         }

         const { trustService } = require('../../services/systemServices');
         let stats = null;
         let recent = [];

         try {
            stats = await trustService.getSystemStats();
            recent = await trustService.getRecentActivity(5);
         } catch (statsError) {
            logError(statsError, { context: 'admin/system stats fetch' });
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

         // Build RBAC menu options for system admin from rbac.json
         const rbac = require('../../config/rbac.json');
         const roleKey = req.session.user?.role || 'SYSTEM_ADMIN';
         const roleDef = rbac.roles[roleKey] || rbac.roles.SYSTEM_ADMIN;
         const permissions = roleDef?.permissions || [];
         const routeMap = {
            trusts: {
               open: '/system/trusts',
               new: '/system/trusts/new',
               manage: '/system/trusts',
               admin: '/system/trusts',
            },
            schools: {
               open: '/system/schools',
               new: '/system/schools/new',
               manage: '/system/schools',
               admin: '/system/schools',
            },
            users: {
               open: '/admin/user-management',
               new: '/admin/user-registration',
               manage: '/admin/user-management',
               admin: '/admin/user-management',
            },
            students: {
               open: '/system/reports/usage?focus=students',
               new: null,
               manage: '/system/reports/system',
               admin: '/system/reports/system',
            },
            fees: {
               open: '/system/reports/financial',
               new: null,
               manage: '/system/reports/financial',
               admin: '/system/reports/financial',
            },
            attendance: {
               open: '/system/reports/usage?focus=attendance',
               new: null,
               manage: '/system/reports/usage',
               admin: '/system/reports/usage',
            },
            reports: {
               open: '/system/analytics',
               new: null,
               manage: '/system/analytics',
               admin: '/system/analytics',
            },
            communications: {
               open:
                  '/system/support?title=Communications&description=System-wide%20' +
                  'communications%20center&icon=bi%20bi-chat-dots',
               new: null,
               manage: null,
               admin: null,
            },
            setup: {
               open: '/system/config/general',
               new: null,
               manage: '/system/config/general',
               admin: '/system/config/security',
            },
         };
         const rbacMenu = Object.entries(rbac.resources).map(([key, resDef]) => {
            const base = routeMap[key] || {
               open: `/system/${key}`,
               new: `/system/${key}/new`,
               manage: `/system/${key}`,
               admin: `/system/${key}`,
            };
            return {
               key,
               name: resDef.name,
               canRead: permissions.includes('*') || permissions.includes(`${key}:read`),
               canCreate: permissions.includes('*') || permissions.includes(`${key}:create`),
               canUpdate: permissions.includes('*') || permissions.includes(`${key}:update`),
               canDelete: permissions.includes('*') || permissions.includes(`${key}:delete`),
               openHref: base.open,
               newHref: base.new,
               manageHref: base.manage,
               adminHref: base.admin,
            };
         });

         res.render('pages/dashboard/system-admin', {
            title: 'System Administration',
            description: 'System admin dashboard for managing trusts and configuration',
            user: req.session.user,
            tenant: null,
            userType: userType,
            currentPath: '/admin/system',
            stats: stats,
            recent,
            rbacMenu,
         });
      } catch (error) {
         logError(error, { context: 'system dashboard root GET' });
         req.flash('error', 'Unable to load system dashboard');
         res.redirect('/login');
      }
   });

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

         // Build RBAC menu options for system admin from rbac.json
         const rbac = require('../../config/rbac.json');
         const roleKey = req.session.user?.role || 'SYSTEM_ADMIN';
         const roleDef = rbac.roles[roleKey] || rbac.roles.SYSTEM_ADMIN;
         const permissions = roleDef?.permissions || [];
         const routeMap = {
            trusts: {
               open: '/system/trusts',
               new: '/system/trusts/new',
               manage: '/system/trusts',
               admin: '/system/trusts',
            },
            schools: {
               open: '/system/schools',
               new: '/system/schools/new',
               manage: '/system/schools',
               admin: '/system/schools',
            },
            users: {
               open: '/admin/user-management',
               new: '/admin/user-registration',
               manage: '/admin/user-management',
               admin: '/admin/user-management',
            },
            students: {
               open: '/system/reports/usage?focus=students',
               new: null,
               manage: '/system/reports/system',
               admin: '/system/reports/system',
            },
            fees: {
               open: '/system/reports/financial',
               new: null,
               manage: '/system/reports/financial',
               admin: '/system/reports/financial',
            },
            attendance: {
               open: '/system/reports/usage?focus=attendance',
               new: null,
               manage: '/system/reports/usage',
               admin: '/system/reports/usage',
            },
            reports: {
               open: '/system/analytics',
               new: null,
               manage: '/system/analytics',
               admin: '/system/analytics',
            },
            communications: {
               open:
                  '/system/support?title=Communications&description=System-wide%20' +
                  'communications%20center&icon=bi%20bi-chat-dots',
               new: null,
               manage: null,
               admin: null,
            },
            setup: {
               open: '/system/config/general',
               new: null,
               manage: '/system/config/general',
               admin: '/system/config/security',
            },
         };
         const rbacMenu = Object.entries(rbac.resources).map(([key, resDef]) => {
            const base = routeMap[key] || {
               open: `/system/${key}`,
               new: `/system/${key}/new`,
               manage: `/system/${key}`,
               admin: `/system/${key}`,
            };
            return {
               key,
               name: resDef.name,
               canRead: permissions.includes('*') || permissions.includes(`${key}:read`),
               canCreate: permissions.includes('*') || permissions.includes(`${key}:create`),
               canUpdate: permissions.includes('*') || permissions.includes(`${key}:update`),
               canDelete: permissions.includes('*') || permissions.includes(`${key}:delete`),
               openHref: base.open,
               newHref: base.new,
               manageHref: base.manage,
               adminHref: base.admin,
            };
         });

         res.render('pages/dashboard/system-admin', {
            title: 'System Administration',
            description: 'System admin dashboard for managing trusts and configuration',
            user: req.session.user,
            tenant: null,
            userType: userType,
            currentPath: '/admin/system',
            stats: stats,
            rbacMenu,
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

   // Friendly aliases/redirects and placeholders to avoid 404s from sidebar/actions
   router.get('/users', requireAuth, (req, res) => res.redirect('/admin/user-management'));
   router.get('/users/new', requireAuth, (req, res) => res.redirect('/admin/user-registration'));
   router.get('/users/roles', requireAuth, (req, res) => {
      try {
         if (req.session.userType !== 'system') {
            req.flash('error', 'Access denied. System admin privileges required.');
            return res.redirect('/dashboard');
         }
         const rbac = require('../../config/rbac.json');
         res.render('pages/system/users/roles', {
            title: 'Role Management',
            description: 'Define and manage system roles and hierarchy',
            user: req.session.user,
            tenant: null,
            userType: req.session.userType,
            currentPath: '/system/users/roles',
            rbac,
         });
      } catch (error) {
         logError(error, { context: 'system/users/roles GET' });
         res.redirect('/system');
      }
   });
   router.get('/users/permissions', requireAuth, (req, res) => {
      try {
         if (req.session.userType !== 'system') {
            req.flash('error', 'Access denied. System admin privileges required.');
            return res.redirect('/dashboard');
         }
         const rbac = require('../../config/rbac.json');
         res.render('pages/system/users/permissions', {
            title: 'Permissions',
            description: 'Configure fine-grained permissions for resources',
            user: req.session.user,
            tenant: null,
            userType: req.session.userType,
            currentPath: '/system/users/permissions',
            rbac,
         });
      } catch (error) {
         logError(error, { context: 'system/users/permissions GET' });
         res.redirect('/system');
      }
   });

   const placeholder = (pathTitle, desc, icon) => (req, res) => {
      try {
         if (req.session.userType !== 'system') {
            req.flash('error', 'Access denied. System admin privileges required.');
            return res.redirect('/dashboard');
         }
         res.render('pages/coming-soon', {
            title: pathTitle,
            description: desc,
            icon,
            eta: null,
            features: [],
            user: req.session.user,
            tenant: null,
            userType: req.session.userType,
         });
      } catch (error) {
         logError(error, { context: `system placeholder ${pathTitle}` });
         res.redirect('/system');
      }
   };

   router.get(
      '/backups',
      requireAuth,
      placeholder('Backups', 'Manage database and file backups', 'bi bi-cloud-arrow-down')
   );
   router.get(
      '/migrations',
      requireAuth,
      placeholder('Migrations', 'Manage schema migrations and versions', 'bi bi-arrow-repeat')
   );
   router.get('/imports', requireAuth, placeholder('Data Import', 'Import data from CSV/Excel', 'bi bi-upload'));
   router.get('/exports', requireAuth, placeholder('Data Export', 'Export data and reports', 'bi bi-download'));
   router.get('/maintenance', requireAuth, placeholder('Maintenance', 'System maintenance operations', 'bi bi-tools'));
   router.get(
      '/support',
      requireAuth,
      placeholder('Support Center', 'Help, FAQs, and support requests', 'bi bi-life-preserver')
   );
   router.get(
      '/documentation',
      requireAuth,
      placeholder('Documentation', 'Product guides and developer docs', 'bi bi-book')
   );
   // System config GET/POST routes
   router.get('/config/:section', requireAuth, (req, res) => {
      try {
         if (req.session.userType !== 'system') {
            req.flash('error', 'Access denied. System admin privileges required.');
            return res.redirect('/dashboard');
         }
         const section = req.params.section;
         const systemConfigService = require('../../services/SystemConfigService');
         const data = systemConfigService.getSection(section);
         if (!data || Object.keys(data).length === 0) {
            return res.render('pages/coming-soon', {
               title: 'Configuration',
               description: 'This configuration section will be available soon',
               icon: 'bi bi-gear',
               user: req.session.user,
               tenant: null,
               userType: req.session.userType,
            });
         }
         return res.render('pages/system/config/index', {
            title: 'System Configuration',
            description: 'Update system-wide configuration',
            user: req.session.user,
            tenant: null,
            userType: req.session.userType,
            currentPath: `/system/config/${section}`,
            section,
            configData: data,
         });
      } catch (error) {
         logError(error, { context: 'system/config GET' });
         req.flash('error', 'Unable to load configuration');
         return res.redirect('/admin/system');
      }
   });

   router.post('/config/:section', requireAuth, async (req, res) => {
      try {
         if (req.session.userType !== 'system') {
            req.flash('error', 'Access denied. System admin privileges required.');
            return res.redirect('/dashboard');
         }
         const section = req.params.section;
         const systemConfigService = require('../../services/SystemConfigService');
         const ok = await systemConfigService.saveSection(section, req.body || {});
         if (ok) {
            req.flash('success', 'Configuration saved');
         } else {
            req.flash('error', 'Failed to save configuration');
         }
         res.redirect(`/system/config/${section}`);
      } catch (error) {
         logError(error, { context: 'system/config POST' });
         req.flash('error', 'Configuration error');
         res.redirect('/admin/system');
      }
   });
   router.get('/reports/:section', requireAuth, (req, res) => {
      const sec = req.params.section;
      const map = {
         system: ['System Reports', 'System-wide reports and KPIs', 'bi bi-graph-up'],
         usage: ['Usage Statistics', 'User and feature usage analytics', 'bi bi-bar-chart'],
         financial: ['Financial Reports', 'Billing and fee reports', 'bi bi-currency-dollar'],
         custom: ['Custom Reports', 'Build custom reports', 'bi bi-gear'],
      };
      const [t, d, i] = map[sec] || ['Reports', 'Reporting and analytics', 'bi bi-file-earmark-bar-graph'];
      return placeholder(t, d, i)(req, res);
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
