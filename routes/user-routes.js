const express = require('express');
const router = express.Router();
const userService = require('../modules/user/user-service');
const validationMiddleware = require('../middleware/validation-middleware');
const authMiddleware = require('../middleware/auth-middleware');
const errorHandler = require('../middleware/error-handler');

// Create new user
router.post('/',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('users', 'create'),
  validationMiddleware.validate('user.create'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const userData = req.body;
      const createdBy = req.session.userId;
      
      const result = await userService.createUser(userData, createdBy, req.trustCode);
      
      res.success(result, 'User created successfully');
    } catch (error) {
      res.error(error.message, 'USER_CREATION_FAILED', 400);
    }
  })
);

// Get all users with filters
router.get('/',
  authMiddleware.requirePermission('users', 'read'),
  validationMiddleware.validateQuery('user.list'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const users = await userService.getUsers(filters, userRole, userId, req.trustCode);
      
      res.success(users, 'Users retrieved successfully');
    } catch (error) {
      res.error(error.message, 'USERS_FETCH_FAILED', 500);
    }
  })
);

// Get user by ID
router.get('/:userId',
  authMiddleware.requirePermission('users', 'read'),
  validationMiddleware.validateParams('user.id'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { userId } = req.params;
      const requestingUserId = req.session.userId;
      const userRole = req.session.userRole;
      
      const user = await userService.getUserById(userId, requestingUserId, userRole, req.trustCode);
      
      res.success(user, 'User retrieved successfully');
    } catch (error) {
      res.error(error.message, 'USER_FETCH_FAILED', 404);
    }
  })
);

// Update user
router.put('/:userId',
  authMiddleware.requirePermission('users', 'update'),
  validationMiddleware.validateParams('user.id'),
  validationMiddleware.validate('user.update'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { userId } = req.params;
      const updateData = req.body;
      const updatedBy = req.session.userId;
      const userRole = req.session.userRole;
      
      const result = await userService.updateUser(userId, updateData, updatedBy, userRole, req.trustCode);
      
      res.success(result, 'User updated successfully');
    } catch (error) {
      res.error(error.message, 'USER_UPDATE_FAILED', 400);
    }
  })
);

// Delete user (soft delete)
router.delete('/:userId',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN']),
  authMiddleware.requirePermission('users', 'delete'),
  validationMiddleware.validateParams('user.id'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { userId } = req.params;
      const deletedBy = req.session.userId;
      
      const result = await userService.deleteUser(userId, deletedBy, req.trustCode);
      
      res.success(result, 'User deleted successfully');
    } catch (error) {
      res.error(error.message, 'USER_DELETION_FAILED', 400);
    }
  })
);

// Assign user to school
router.post('/:userId/schools/:schoolId/assign',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('users', 'update'),
  validationMiddleware.validateParams('user.schoolAssignment'),
  validationMiddleware.validate('user.assignToSchool'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { userId, schoolId } = req.params;
      const assignmentData = req.body;
      const assignedBy = req.session.userId;
      
      const result = await userService.assignToSchool(userId, schoolId, assignmentData, assignedBy, req.trustCode);
      
      res.success(result, 'User assigned to school successfully');
    } catch (error) {
      res.error(error.message, 'SCHOOL_ASSIGNMENT_FAILED', 400);
    }
  })
);

// Remove user from school
router.delete('/:userId/schools/:schoolId/assign',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('users', 'update'),
  validationMiddleware.validateParams('user.schoolAssignment'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { userId, schoolId } = req.params;
      const removedBy = req.session.userId;
      
      const result = await userService.removeFromSchool(userId, schoolId, removedBy, req.trustCode);
      
      res.success(result, 'User removed from school successfully');
    } catch (error) {
      res.error(error.message, 'SCHOOL_REMOVAL_FAILED', 400);
    }
  })
);

// Get user's school assignments
router.get('/:userId/schools',
  authMiddleware.requirePermission('users', 'read'),
  validationMiddleware.validateParams('user.id'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { userId } = req.params;
      
      const assignments = await userService.getUserSchoolAssignments(userId, req.trustCode);
      
      res.success(assignments, 'School assignments retrieved successfully');
    } catch (error) {
      res.error(error.message, 'ASSIGNMENTS_FETCH_FAILED', 500);
    }
  })
);

// Bulk create users
router.post('/bulk',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN']),
  authMiddleware.requirePermission('users', 'create'),
  validationMiddleware.validateBatch('user.bulkCreate', { maxItems: 100 }),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { items: users } = req.body;
      const createdBy = req.session.userId;
      
      const result = await userService.bulkCreateUsers(users, createdBy, req.trustCode);
      
      res.success(result, 'Bulk user creation completed');
    } catch (error) {
      res.error(error.message, 'BULK_USER_CREATION_FAILED', 400);
    }
  })
);

// Get user statistics
router.get('/stats/overview',
  authMiddleware.requirePermission('users', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      const userRole = req.session.userRole;
      
      const stats = await userService.getUserStats(filters, userRole, req.trustCode);
      
      res.success(stats, 'User statistics retrieved successfully');
    } catch (error) {
      res.error(error.message, 'STATS_FETCH_FAILED', 500);
    }
  })
);

// Reset user password
router.post('/:userId/reset-password',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('users', 'update'),
  validationMiddleware.validateParams('user.id'),
  validationMiddleware.validate('user.resetPassword'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { userId } = req.params;
      const { temporaryPassword } = req.body;
      const resetBy = req.session.userId;
      
      const result = await userService.resetUserPassword(userId, temporaryPassword, resetBy, req.trustCode);
      
      res.success(result, 'Password reset successfully');
    } catch (error) {
      res.error(error.message, 'PASSWORD_RESET_FAILED', 400);
    }
  })
);

// Update user status
router.patch('/:userId/status',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('users', 'update'),
  validationMiddleware.validateParams('user.id'),
  validationMiddleware.validate('user.updateStatus'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { userId } = req.params;
      const { status, reason } = req.body;
      const updatedBy = req.session.userId;
      
      const result = await userService.updateUserStatus(userId, status, reason, updatedBy, req.trustCode);
      
      res.success(result, 'User status updated successfully');
    } catch (error) {
      res.error(error.message, 'STATUS_UPDATE_FAILED', 400);
    }
  })
);

// Get user activity log
router.get('/:userId/activity',
  authMiddleware.requirePermission('users', 'read'),
  validationMiddleware.validateParams('user.id'),
  validationMiddleware.validateQuery('user.activityLog'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { userId } = req.params;
      const filters = req.query;
      
      const activities = await userService.getUserActivityLog(userId, filters, req.trustCode);
      
      res.success(activities, 'User activity log retrieved successfully');
    } catch (error) {
      res.error(error.message, 'ACTIVITY_LOG_FETCH_FAILED', 500);
    }
  })
);

// Export users data
router.get('/export/:format',
  authMiddleware.requirePermission('users', 'read'),
  validationMiddleware.validateParams('common.exportFormat'),
  validationMiddleware.validateQuery('user.export'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { format } = req.params;
      const filters = req.query;
      const userRole = req.session.userRole;
      
      const result = await userService.exportUsers(format, filters, userRole, req.trustCode);
      
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.data);
      
    } catch (error) {
      res.error(error.message, 'EXPORT_FAILED', 500);
    }
  })
);

// Get roles and permissions
router.get('/roles/available',
  authMiddleware.requirePermission('users', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const userRole = req.session.userRole;
      
      const roles = await userService.getAvailableRoles(userRole, req.trustCode);
      
      res.success(roles, 'Available roles retrieved successfully');
    } catch (error) {
      res.error(error.message, 'ROLES_FETCH_FAILED', 500);
    }
  })
);

module.exports = router;