/**
 * AUTH API Routes - Complete REST API for Authentication
 * Provides JSON API endpoints for mobile apps and frontend JavaScript
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const authService = require('../../modules/auth/auth-service');
const { validationMiddleware } = require('../../utils/validation');
const { asyncHandler } = require('../../middleware/errors');
const { requireAuth, optionalAuth } = require('../../middleware/auth');
const logger = require('../../config/logger');
const config = require('../../config');

const router = express.Router();

// Rate limiting for authentication API endpoints
const rateLimitConfig = config.getRateLimitConfig();
const authApiRateLimit = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.authMaxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: config.getErrors().rateLimited.message,
      retryAfter: Math.floor(rateLimitConfig.windowMs / 1000)
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * POST /api/v1/auth/login
 * Authenticate user and create session
 */
router.post(
  '/login',
  authApiRateLimit,
  validationMiddleware('login'),
  asyncHandler(async (req, res) => {
    const { email, password, trust_code, school_id, remember_me } = req.body;

    // Determine login type
    const loginType = trust_code ? 'TRUST' : 'SYSTEM';

    const context = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.id
    };

    try {
      logger.auth('API login attempt', null, email, {
        loginType,
        trustCode: trust_code,
        schoolId: school_id,
        ...context
      });

      // Authenticate user
      const authResult = await authService.authenticateUser(
        {
          email,
          password,
          loginType,
          trustCode: trust_code,
          schoolId: school_id
        },
        context
      );

      // Set session data
      req.session.sessionId = authResult.session.sessionId;
      req.session.loginType = authResult.loginType;
      req.session.user = authResult.user;

      // Set session timeout based on remember_me
      if (remember_me) {
        req.session.cookie.maxAge = config.getSecurity().rememberMeMaxAge;
      }

      logger.auth('API login successful', authResult.user.id, email, {
        role: authResult.user.role,
        loginType: authResult.loginType,
        sessionId: authResult.session.sessionId
      });

      res.json({
        success: true,
        data: {
          message: 'Login successful',
          user: {
            id: authResult.user.id,
            email: authResult.user.email,
            firstName: authResult.user.firstName,
            lastName: authResult.user.lastName,
            role: authResult.user.role,
            permissions: authResult.user.permissions,
            schoolId: authResult.user.schoolId,
            trustId: authResult.user.trustId
          },
          session: {
            sessionId: authResult.session.sessionId,
            expiresAt: authResult.session.expiresAt,
            loginType: authResult.loginType
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.auth('API login failed', null, email, {
        error: error.message,
        loginType,
        ...context
      });

      const statusCode = error.name === 'AuthenticationError' ? 401 : 400;

      res.status(statusCode).json({
        success: false,
        error: {
          code: error.code || 'LOGIN_FAILED',
          message: error.message || 'Login failed',
          timestamp: new Date().toISOString()
        }
      });
    }
  })
);

/**
 * POST /api/v1/auth/logout
 * Logout user and invalidate session
 */
router.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    const sessionId = req.session?.sessionId;
    const loginType = req.session?.loginType;
    const userId = req.user?.id;

    try {
      // Invalidate session in database
      if (sessionId && loginType) {
        await authService.logout(sessionId, loginType);
      }

      logger.auth('API logout', userId, req.user?.email, {
        sessionId,
        loginType
      });

      // Destroy session
      req.session.destroy(err => {
        if (err) {
          logger.error('Session destruction failed', { error: err.message });
        }
      });

      res.json({
        success: true,
        data: {
          message: 'Logout successful'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('API logout error', {
        error: error.message,
        sessionId,
        userId
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'LOGOUT_FAILED',
          message: 'Logout failed',
          timestamp: new Date().toISOString()
        }
      });
    }
  })
);

/**
 * GET /api/v1/auth/me
 * Get current user information
 */
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          role: req.user.role,
          permissions: req.user.permissions,
          schoolId: req.user.schoolId,
          trustId: req.user.trustId
        },
        session: {
          sessionId: req.session.sessionId,
          loginType: req.session.loginType
        }
      },
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * GET /api/v1/auth/status
 * Check authentication status
 */
router.get(
  '/status',
  optionalAuth,
  asyncHandler(async (req, res) => {
    if (req.user) {
      res.json({
        success: true,
        data: {
          authenticated: true,
          user: {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role
          },
          session: {
            loginType: req.session.loginType
          }
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        success: true,
        data: {
          authenticated: false
        },
        timestamp: new Date().toISOString()
      });
    }
  })
);

/**
 * POST /api/v1/auth/change-password
 * Change user password
 */
router.post(
  '/change-password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Current password, new password, and confirmation are required'
        }
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'New password and confirmation do not match'
        }
      });
    }

    const minPasswordLength = config.getValidation().password.minLength;
    if (newPassword.length < minPasswordLength) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `New password must be at least ${minPasswordLength} characters long`
        }
      });
    }

    try {
      // Change password via service
      await authService.changePassword(
        req.user.id,
        currentPassword,
        newPassword,
        req.session.loginType
      );

      logger.auth('Password changed', req.user.id, req.user.email, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        data: {
          message: 'Password changed successfully'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.auth('Password change failed', req.user.id, req.user.email, {
        error: error.message,
        ip: req.ip
      });

      const statusCode = error.name === 'AuthenticationError' ? 401 : 400;

      res.status(statusCode).json({
        success: false,
        error: {
          code: error.code || 'PASSWORD_CHANGE_FAILED',
          message: error.message || 'Password change failed'
        }
      });
    }
  })
);

/**
 * GET /api/v1/auth/trusts/:trustCode
 * Get trust information and schools
 */
router.get(
  '/trusts/:trustCode',
  asyncHandler(async (req, res) => {
    const { trustCode } = req.params;

    try {
      const trust = await authService.getTrustByCode(trustCode);

      if (!trust) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'TRUST_NOT_FOUND',
            message: 'Trust not found or inactive'
          }
        });
      }

      const schools = await authService.getSchoolsByTrust(trust.id);

      res.json({
        success: true,
        data: {
          trust: {
            id: trust.id,
            name: trust.name,
            trustCode: trust.trust_code
          },
          schools: schools.map(school => ({
            id: school.id,
            name: school.school_name,
            status: school.status
          }))
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Trust lookup failed', {
        trustCode,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'TRUST_LOOKUP_FAILED',
          message: 'Failed to lookup trust information'
        }
      });
    }
  })
);

/**
 * POST /api/v1/auth/forgot-password
 * Request password reset
 */
router.post(
  '/forgot-password',
  authApiRateLimit,
  asyncHandler(async (req, res) => {
    const { email, trust_code } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email address is required'
        }
      });
    }

    try {
      // TODO: Implement password reset functionality

      logger.auth('Password reset requested', null, email, {
        trustCode: trust_code,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Always return success for security (don't reveal if email exists)
      res.json({
        success: true,
        data: {
          message: 'If an account with that email exists, we have sent password reset instructions.'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Forgot password error', {
        email,
        error: error.message
      });

      // Still return success for security
      res.json({
        success: true,
        data: {
          message: 'If an account with that email exists, we have sent password reset instructions.'
        }
      });
    }
  })
);

/**
 * GET /api/v1/auth/permissions
 * Get user permissions and accessible routes
 */
router.get(
  '/permissions',
  requireAuth,
  asyncHandler(async (req, res) => {
    const rbac = require('../../utils/rbac');

    res.json({
      success: true,
      data: {
        role: req.user.role,
        permissions: req.user.permissions,
        accessibleRoutes: rbac.getUserRoutes(req.user),
        context: {
          schoolId: req.user.schoolId,
          trustId: req.user.trustId
        }
      },
      timestamp: new Date().toISOString()
    });
  })
);

module.exports = router;
