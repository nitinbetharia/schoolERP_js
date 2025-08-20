const express = require('express');
const UserController = require('../controllers/UserController');
const { authenticate, requireTrustAdmin } = require('../../../middleware/auth');
const { validators } = require('../../../utils/errors');
const { userValidationSchemas } = require('../../../models');

const router = express.Router();
const userController = new UserController();

/**
 * User Routes
 * Handles tenant user management endpoints
 */

/**
 * @route POST /api/v1/users/auth/login
 * @desc Authenticate tenant user
 * @access Public (within tenant)
 */
router.post('/auth/login', validators.validateBody(userValidationSchemas.login), (req, res) => {
   userController.authenticateUser(req, res);
});

/**
 * @route POST /api/v1/users/auth/logout
 * @desc Logout tenant user
 * @access Private
 */
router.post('/auth/logout', authenticate, (req, res) => {
   userController.logoutUser(req, res);
});

// Apply authentication to all other user routes
router.use(authenticate);

/**
 * @route GET /api/v1/users
 * @desc Get all users with filters
 * @access Private
 */
router.get('/', (req, res) => {
   userController.getUsers(req, res);
});

/**
 * @route POST /api/v1/users
 * @desc Create a new user
 * @access Admin/Trust Admin
 */
router.post('/', requireTrustAdmin, validators.validateBody(userValidationSchemas.create), (req, res) => {
   userController.createUser(req, res);
});

/**
 * @route GET /api/v1/users/:user_id
 * @desc Get user by ID
 * @access Private
 */
router.get('/:user_id', (req, res) => {
   userController.getUserById(req, res);
});

/**
 * @route PUT /api/v1/users/:user_id
 * @desc Update user
 * @access Admin/Trust Admin/Self
 */
router.put('/:user_id', validators.validateBody(userValidationSchemas.update), (req, res) => {
   userController.updateUser(req, res);
});

/**
 * @route DELETE /api/v1/users/:user_id
 * @desc Delete user (soft delete)
 * @access Admin/Trust Admin
 */
router.delete('/:user_id', requireTrustAdmin, (req, res) => {
   userController.deleteUser(req, res);
});

module.exports = router;
