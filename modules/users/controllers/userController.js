const userService = require('../services/userService');
const { formatSuccessResponse, formatErrorResponse } = require('../../../utils/validation');
const { logger } = require('../../../utils/logger');

/**
 * User Controller - Simple function exports
 * Converted from factory pattern to direct function exports
 * Handles HTTP requests for tenant user management
 */

/**
 * Create a new user
 * POST /api/users
 */
async function createUser(req, res) {
   try {
      const tenantCode = req.tenantCode;
      const userData = req.body;
      const createdBy = req.user ? req.user.id : null;

      // Add creator info
      userData.created_by = createdBy;

      const user = await userService.createUser(tenantCode, userData);

      logger.info('User created successfully', { 
         tenantCode, 
         userId: user.id,
         createdBy 
      });

      res.status(201).json(formatSuccessResponse(user, 'User created successfully'));
   } catch (error) {
      logger.error('Failed to create user', { 
         error: error.message, 
         tenantCode: req.tenantCode,
         userData: req.body?.email 
      });
    
      if (error.message.includes('already exists')) {
         res.status(409).json(formatErrorResponse(error, 'User with this email already exists'));
      } else {
         res.status(400).json(formatErrorResponse(error, 'Failed to create user'));
      }
   }
}

/**
 * Get user by ID
 * GET /api/users/:id
 */
async function getUserById(req, res) {
   try {
      const tenantCode = req.tenantCode;
      const userId = req.params.id;

      const user = await userService.getUserById(tenantCode, userId);

      if (!user) {
         return res.status(404).json(formatErrorResponse(null, 'User not found'));
      }

      res.json(formatSuccessResponse(user, 'User retrieved successfully'));
   } catch (error) {
      logger.error('Failed to get user by ID', { 
         error: error.message, 
         tenantCode: req.tenantCode,
         userId: req.params.id 
      });
    
      res.status(500).json(formatErrorResponse(error, 'Failed to retrieve user'));
   }
}

/**
 * Update user
 * PUT /api/users/:id
 */
async function updateUser(req, res) {
   try {
      const tenantCode = req.tenantCode;
      const userId = req.params.id;
      const updateData = req.body;

      const user = await userService.updateUser(tenantCode, userId, updateData);

      logger.info('User updated successfully', { 
         tenantCode, 
         userId,
         updatedBy: req.user?.id 
      });

      res.json(formatSuccessResponse(user, 'User updated successfully'));
   } catch (error) {
      logger.error('Failed to update user', { 
         error: error.message, 
         tenantCode: req.tenantCode,
         userId: req.params.id 
      });
    
      if (error.message.includes('not found')) {
         res.status(404).json(formatErrorResponse(error, 'User not found'));
      } else {
         res.status(400).json(formatErrorResponse(error, 'Failed to update user'));
      }
   }
}

/**
 * Delete user
 * DELETE /api/users/:id
 */
async function deleteUser(req, res) {
   try {
      const tenantCode = req.tenantCode;
      const userId = req.params.id;

      // Prevent self-deletion
      if (req.user && req.user.id === parseInt(userId)) {
         return res.status(400).json(formatErrorResponse(null, 'Cannot delete your own account'));
      }

      await userService.deleteUser(tenantCode, userId);

      logger.info('User deleted successfully', { 
         tenantCode, 
         userId,
         deletedBy: req.user?.id 
      });

      res.json(formatSuccessResponse(null, 'User deleted successfully'));
   } catch (error) {
      logger.error('Failed to delete user', { 
         error: error.message, 
         tenantCode: req.tenantCode,
         userId: req.params.id 
      });
    
      if (error.message.includes('not found')) {
         res.status(404).json(formatErrorResponse(error, 'User not found'));
      } else {
         res.status(500).json(formatErrorResponse(error, 'Failed to delete user'));
      }
   }
}

/**
 * List users with filtering and pagination  
 * GET /api/users
 */
async function listUsers(req, res) {
   try {
      const tenantCode = req.tenantCode;
      const query = req.query;

      // Check if this is system admin access (no tenant context)
      if (!tenantCode && req.isSystemAdmin) {
         return res.status(400).json(formatErrorResponse(
            new Error('Tenant context required'),
            'User data requires tenant context. ' +
            'Please access via tenant subdomain (e.g., demo.localhost:3000)'
         ));
      }

      // Check if tenant context is missing
      if (!tenantCode) {
         return res.status(400).json(formatErrorResponse(
            new Error('Missing tenant context'),
            'Please access this endpoint via tenant subdomain'
         ));
      }

      const result = await userService.listUsers(tenantCode, query);

      res.json(formatSuccessResponse(
         result.users, 
         'Users retrieved successfully',
         { pagination: result.pagination }
      ));
   } catch (error) {
      logger.error('Failed to list users', { 
         error: error.message, 
         tenantCode: req.tenantCode,
         query: req.query 
      });
    
      res.status(500).json(formatErrorResponse(error, 'Failed to retrieve users'));
   }
}/**
 * Authenticate user
 * POST /api/users/auth/login
 */
async function authenticateUser(req, res) {
   try {
      const tenantCode = req.tenantCode;
      const { username, password } = req.body;

      const user = await userService.authenticateUser(tenantCode, username, password);

      // Set session
      req.session.user = user;
      req.session.userType = 'tenant';
      req.session.tenantCode = tenantCode;

      logger.info('User authenticated successfully', { 
         tenantCode, 
         userId: user.id,
         username 
      });

      res.json(formatSuccessResponse(user, 'Authentication successful'));
   } catch (error) {
      logger.warn('Authentication failed', { 
         tenantCode: req.tenantCode,
         username: req.body?.username,
         error: error.message 
      });
    
      // Always return generic message for security
      res.status(401).json(formatErrorResponse(error, 'Invalid username or password'));
   }
}

/**
 * Logout user
 * POST /api/users/auth/logout
 */
async function logoutUser(req, res) {
   try {
      if (req.session) {
         req.session.destroy((err) => {
            if (err) {
               logger.error('Session destruction failed', err);
               return res.status(500).json(formatErrorResponse(err, 'Logout failed'));
            }
        
            res.json(formatSuccessResponse(null, 'Logout successful'));
         });
      } else {
         res.json(formatSuccessResponse(null, 'Logout successful'));
      }
   } catch (error) {
      logger.error('Logout error', error);
      res.status(500).json(formatErrorResponse(error, 'Logout failed'));
   }
}

/**
 * Get current user profile
 * GET /api/users/profile
 */
async function getCurrentUser(req, res) {
   try {
      if (!req.user) {
         return res.status(401).json(formatErrorResponse(null, 'Not authenticated'));
      }
    
      res.json(formatSuccessResponse(req.user, 'Current user retrieved successfully'));
   } catch (error) {
      logger.error('Failed to get current user', error);
      res.status(500).json(formatErrorResponse(error, 'Failed to retrieve user profile'));
   }
}

/**
 * Change password
 * POST /api/users/change-password
 */
async function changePassword(req, res) {
   try {
      const tenantCode = req.tenantCode;
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Verify current password first
      await userService.authenticateUser(tenantCode, req.user.username, currentPassword);

      // Update with new password
      await userService.changePassword(tenantCode, userId, newPassword);

      logger.info('Password changed successfully', { 
         tenantCode, 
         userId 
      });

      res.json(formatSuccessResponse(null, 'Password changed successfully'));
   } catch (error) {
      logger.error('Failed to change password', { 
         error: error.message, 
         tenantCode: req.tenantCode,
         userId: req.user?.id 
      });
    
      if (error.message.includes('Invalid')) {
         res.status(401).json(formatErrorResponse(error, 'Current password is incorrect'));
      } else {
         res.status(500).json(formatErrorResponse(error, 'Failed to change password'));
      }
   }
}

/**
 * Get user roles (for dropdowns)
 * GET /api/users/roles
 */
async function getUserRoles(req, res) {
   try {
      const roles = await userService.getUserRoles();
      res.json(formatSuccessResponse(roles, 'User roles retrieved successfully'));
   } catch (error) {
      logger.error('Failed to get user roles', error);
      res.status(500).json(formatErrorResponse(error, 'Failed to retrieve user roles'));
   }
}

// Direct function exports (no factory pattern)
module.exports = {
   createUser,
   getUserById,
   updateUser,
   deleteUser,
   listUsers,
   authenticateUser,
   logoutUser,
   getCurrentUser,
   changePassword,
   getUserRoles
};