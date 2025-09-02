const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateBody, validateQuery, validateParams } = require('../../../utils/validation');
const { systemUserValidationSchemas } = require('../../../models/SystemUser');
const { commonSchemas } = require('../../../utils/validation');

/**
 * User Routes - Simple and clean
 * Converted from factory pattern to direct function usage
 */

// Validation schemas
const idParamSchema = require('joi').object({
   id: commonSchemas.id
});

const userQuerySchema = require('joi').object({
   page: commonSchemas.pagination.page,
   limit: commonSchemas.pagination.limit,
   role: require('joi').string().valid('admin', 'teacher', 'student', 'parent').optional(),
   status: require('joi').string().valid('ACTIVE', 'INACTIVE').optional(),
   search: require('joi').string().max(100).optional(),
   sortBy: require('joi').string().default('created_at'),
   sortOrder: commonSchemas.pagination.sortOrder
});

const loginSchema = require('joi').object({
   username: require('joi').string().required(),
   password: require('joi').string().required()
});

const changePasswordSchema = require('joi').object({
   currentPassword: require('joi').string().required(),
   newPassword: commonSchemas.password
});

// Authentication routes
router.post('/auth/login', 
   validateBody(loginSchema),
   userController.authenticateUser
);

router.post('/auth/logout', 
   userController.logoutUser
);

// Profile routes
router.get('/profile', 
   userController.getCurrentUser
);

router.post('/change-password',
   validateBody(changePasswordSchema),
   userController.changePassword
);

// User management routes
router.get('/', 
   validateQuery(userQuerySchema),
   userController.listUsers
);

router.post('/', 
   validateBody(systemUserValidationSchemas.create),
   userController.createUser
);

router.get('/roles',
   userController.getUserRoles
);

router.get('/:id', 
   validateParams(idParamSchema),
   userController.getUserById
);

router.put('/:id', 
   validateParams(idParamSchema),
   validateBody(systemUserValidationSchemas.update),
   userController.updateUser
);

router.delete('/:id', 
   validateParams(idParamSchema),
   userController.deleteUser
);

module.exports = router;