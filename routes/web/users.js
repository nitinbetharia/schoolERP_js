const express = require('express');
const { logError } = require('../../utils/logger');

/**
 * User Management Routes Module
 * Handles user registration, bulk import, and user management interfaces
 * File size: ~250 lines (within industry standards)
 */

/**
 * Get user creation permissions based on role
 * @param {Object} user - Current user object
 * @returns {Promise<Object>} - User permissions
 */
async function getUserCreationPermissions(user) {
   try {
      const roleHierarchy = {
         SYSTEM_ADMIN: ['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT', 'PARENT', 'STUDENT'],
         TRUST_ADMIN: ['TRUST_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT', 'PARENT', 'STUDENT'],
         SCHOOL_ADMIN: ['TEACHER', 'ACCOUNTANT', 'PARENT', 'STUDENT'],
         TEACHER: ['STUDENT', 'PARENT'],
         ACCOUNTANT: ['STUDENT', 'PARENT'],
         PARENT: [],
         STUDENT: [],
      };

      const allowedUserTypes = roleHierarchy[user.role] || [];

      return {
         canCreate: allowedUserTypes.length > 0,
         allowedUserTypes,
         maxUsers: user.role === 'SYSTEM_ADMIN' ? null : 1000,
      };
   } catch (error) {
      logError(error, { context: 'getUserCreationPermissions', userId: user?.id });
      return {
         canCreate: false,
         allowedUserTypes: [],
         maxUsers: 0,
      };
   }
}

module.exports = function (middleware) {
   const router = express.Router();
   const { requireAuth, requireUserCreationAccess } = middleware;

   /**
    * @route GET /admin/user-registration
    * @desc Show user registration management page
    * @access Private (Admin only)
    */
   router.get('/user-registration', requireUserCreationAccess, async (req, res) => {
      try {
         const permissions = await getUserCreationPermissions(req.session.user);

         res.render('pages/admin/user-registration', {
            title: 'User Registration',
            description: 'Create and manage user accounts',
            user: req.session.user,
            tenant: req.session.tenant || req.tenant,
            userType: req.session.userType,
            currentPath: '/admin/user-registration',
            permissions: permissions,
         });
      } catch (error) {
         logError(error, { context: 'admin/user-registration GET' });
         req.flash('error', 'Unable to load user registration page');
         res.redirect('/dashboard');
      }
   });

   /**
    * @route GET /admin/bulk-user-import
    * @desc Bulk user import interface
    * @access Private (Admin only)
    */
   router.get('/bulk-user-import', requireUserCreationAccess, async (req, res) => {
      try {
         const userRole = req.session.user?.role;

         // Check if bulk import is allowed for this user level
         const canBulkImport = ['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN'].includes(userRole);
         if (!canBulkImport) {
            req.flash('error', 'Access denied. Bulk import privileges required.');
            return res.redirect('/dashboard');
         }

         const permissions = await getUserCreationPermissions(req.session.user);

         res.render('pages/admin/bulk-user-import', {
            title: 'Bulk User Import',
            description: 'Import multiple users from CSV or Excel files',
            user: req.session.user,
            tenant: req.session.tenant || req.tenant,
            userType: req.session.userType,
            currentPath: '/admin/bulk-user-import',
            permissions: permissions,
         });
      } catch (error) {
         logError(error, {
            context: 'admin/bulk-user-import GET',
            userId: req.session.user?.id,
         });
         req.flash('error', 'Unable to load bulk import page');
         res.redirect('/dashboard');
      }
   });

   /**
    * @route GET /admin/user-management
    * @desc User management interface with search and filtering
    * @access Private (Admin only)
    */
   router.get('/user-management', requireUserCreationAccess, async (req, res) => {
      try {
         const userRole = req.session.user?.role;

         // Check access permissions
         const allowedRoles = ['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN'];
         if (!allowedRoles.includes(userRole)) {
            req.flash('error', 'Access denied. User management privileges required.');
            return res.redirect('/dashboard');
         }

         const permissions = await getUserCreationPermissions(req.session.user);

         res.render('pages/admin/user-management', {
            title: 'User Management',
            description: 'Search, view, and manage user accounts',
            user: req.session.user,
            tenant: req.session.tenant || req.tenant,
            userType: req.session.userType,
            currentPath: '/admin/user-management',
            permissions: permissions,
         });
      } catch (error) {
         logError(error, {
            context: 'admin/user-management GET',
            userId: req.session.user?.id,
         });
         req.flash('error', 'Unable to load user management page');
         res.redirect('/dashboard');
      }
   });

   /**
    * @route GET /coming-soon
    * @desc Generic coming soon page for unimplemented features
    * @access Private
    */
   router.get('/coming-soon', requireAuth, (req, res) => {
      try {
         const { title, description, icon, eta, features } = req.query;

         res.render('pages/coming-soon', {
            title: title || 'Feature Coming Soon',
            description:
               description ||
               'This feature is currently under development and will be available ' + 'in a future update.',
            icon: icon || 'fas fa-tools',
            eta: eta || null,
            features: features ? JSON.parse(features) : [],
            user: req.session.user,
            tenant: req.session.tenant || req.tenant,
            userType: req.session.userType,
         });
      } catch (error) {
         logError(error, { context: 'coming-soon GET' });
         req.flash('error', 'Unable to load page');
         res.redirect('/dashboard');
      }
   });

   return router;
};
