const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { asyncHandler, healthCheck } = require('../middleware');
const { trustService, systemAuthService } = require('../services/systemServices');
const { requireSystemAdmin, loginRateLimit, authenticate } = require('../middleware/auth');
const { sensitiveRateLimit } = require('../middleware/security');
const {
   ErrorFactory,
   validators,
   formatSuccessResponse,
   commonSchemas
} = require('../utils/errors');
const { trustValidationSchemas } = require('../models/Trust');
const { systemUserValidationSchemas } = require('../models/SystemUser');

// Health check endpoint (public)
router.get('/health', healthCheck);

/**
 * System Authentication Routes
 */
// System admin login
router.post(
   '/auth/login',
   loginRateLimit,
   validators.validateBody(systemUserValidationSchemas.login),
   asyncHandler(async (req, res) => {
      const userData = await systemAuthService.login(req.body);

      // Set session
      req.session.user = userData;
      req.session.userType = 'system';

      res.json(formatSuccessResponse(userData, 'Login successful'));
   })
);

// System admin logout
router.post(
   '/auth/logout',
   asyncHandler(async (req, res) => {
      if (req.session) {
         req.session.destroy();
      }
      res.json(formatSuccessResponse(null, 'Logout successful'));
   })
);

// Change password
router.post(
   '/auth/change-password',
   authenticate,
   sensitiveRateLimit,
   validators.validateBody(systemUserValidationSchemas.changePassword),
   asyncHandler(async (req, res) => {
      const { currentPassword, newPassword } = req.body;

      const result = await systemAuthService.changePassword(req.user.id, currentPassword, newPassword);

      res.json(formatSuccessResponse(result, 'Password changed successfully'));
   })
);

/**
 * Trust Management Routes (System Admin only)
 */
// Create new trust
router.post(
   '/trusts',
   authenticate,
   requireSystemAdmin,
   validators.validateBody(trustValidationSchemas.create),
   asyncHandler(async (req, res) => {
      const trust = await trustService.createTrust(req.body);

      res.status(201).json(formatSuccessResponse(trust, 'Trust created successfully'));
   })
);

// Get trust by ID
router.get(
   '/trusts/:id',
   authenticate,
   requireSystemAdmin,
   validators.validateParams(Joi.object({ id: commonSchemas.id })),
   asyncHandler(async (req, res) => {
      const trust = await trustService.getTrust(req.params.id, 'id');

      res.json(formatSuccessResponse(trust));
   })
);

// Update trust
router.put(
   '/trusts/:id',
   authenticate,
   requireSystemAdmin,
   validators.validateParams(Joi.object({ id: commonSchemas.id })),
   validators.validateBody(trustValidationSchemas.update),
   asyncHandler(async (req, res) => {
      const trust = await trustService.updateTrust(req.params.id, req.body, req.user.id);

      res.json(formatSuccessResponse(trust, 'Trust updated successfully'));
   })
);

// List all trusts
router.get(
   '/trusts',
   authenticate,
   requireSystemAdmin,
   validators.validateQuery(
      Joi.object({
         page: require('../utils/errors').commonSchemas.pagination.page,
         limit: require('../utils/errors').commonSchemas.pagination.limit,
         status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED', 'SETUP_PENDING').optional(),
         search: Joi.string().min(2).optional(),
      })
   ),
   asyncHandler(async (req, res) => {
      const result = await trustService.listTrusts(req.query);

      res.json(
         formatSuccessResponse(result.trusts, 'Trusts retrieved successfully', { pagination: result.pagination })
      );
   })
);

// Complete trust setup
router.post(
   '/trusts/:id/complete-setup',
   authenticate,
   requireSystemAdmin,
   validators.validateParams(Joi.object({ id: commonSchemas.id })),
   asyncHandler(async (req, res) => {
      const trust = await trustService.completeSetup(req.params.id, req.user.id);

      res.json(formatSuccessResponse(trust, 'Trust setup completed successfully'));
   })
);

/**
 * System User Management Routes
 */
// Create system user
router.post(
   '/users',
   authenticate,
   requireSystemAdmin,
   validators.validateBody(systemUserValidationSchemas.create),
   asyncHandler(async (req, res) => {
      const user = await systemAuthService.createSystemUser(req.body, req.user.id);

      res.status(201).json(formatSuccessResponse(user, 'System user created successfully'));
   })
);

// Get current user profile
router.get(
   '/profile',
   authenticate,
   asyncHandler(async (req, res) => {
      res.json(formatSuccessResponse(req.user));
   })
);

module.exports = router;
