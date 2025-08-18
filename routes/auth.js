/**
 * Authentication Routes
 * Unified login system supporting both system and trust users
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const authService = require('../modules/auth/auth-service');
const { validationMiddleware } = require('../utils/validation');
const { asyncHandler } = require('../middleware/errors');
const logger = require('../config/logger');

const router = express.Router();

// Rate limiting for authentication endpoints
const authRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 5, // 5 attempts per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many login attempts. Please wait 15 minutes and try again.',
      retryAfter: 900
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => {
    // Rate limit by IP + email combination for better accuracy
    return `${req.ip}:${req.body.email || 'unknown'}`;
  }
});

/**
 * GET /auth/login - Display login form
 */
router.get(
  '/login',
  asyncHandler(async (req, res) => {
    // Redirect if already logged in
    if (req.user) {
      logger.auth('Already authenticated redirect', req.user.id, req.user.email, {
        redirectTo: '/dashboard'
      });
      return res.redirect('/dashboard');
    }

    const { loginType, trustContext } = req;
    let pageData = {
      title: 'Login',
      description: 'Sign in to continue',
      loginType,
      trustContext,
      error: req.query.error,
      message: req.query.message,
      hideNavigation: true,
      hideFooter: true
    };

    try {
      if (loginType === 'SYSTEM') {
        // System admin login
        pageData.title = 'System Administration';
        pageData.description = 'System Administrator Sign In';
        pageData.isSystemLogin = true;
      } else {
        // Trust-based login
        pageData.title = 'School Login';
        pageData.description = 'Sign in to your school account';

        // Get trust and schools if trust code is available
        if (trustContext?.trustCode) {
          const trust = await authService.getTrustByCode(trustContext.trustCode);

          if (trust) {
            pageData.trust = trust;
            pageData.title = `${trust.name} - Login`;
            pageData.description = `Sign in to ${trust.name}`;

            // Get schools for this trust
            const schools = await authService.getSchoolsByTrust(trust.id);
            pageData.schools = schools;
          } else {
            pageData.error = 'Invalid trust code or trust not found';
          }
        }
      }

      // Set layout options for login page
      pageData.hideNavigation = true;
      pageData.hideFooter = true;
      pageData.bodyClass = 'h-full';

      res.render('auth/login', pageData);
    } catch (error) {
      logger.error('Login page error', {
        error: error.message,
        loginType,
        trustContext
      });

      res.status(500).render('errors/500', {
        title: 'Error',
        error: {
          message: 'Unable to load login page'
        },
        hideNavigation: true
      });
    }
  })
);

/**
 * POST /auth/login - Process login
 */
router.post(
  '/login',
  authRateLimit,
  validationMiddleware('login'),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { loginType, trustContext } = req;

    // Additional fields for trust login
    const schoolId = req.body.school_id ? parseInt(req.body.school_id) : null;
    const trustCode = trustContext?.trustCode || req.body.trust_code;

    const context = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.id
    };

    try {
      logger.auth('Login attempt', null, email, {
        loginType,
        trustCode,
        schoolId,
        ...context
      });

      // Validate trust login requirements
      if (loginType === 'TRUST') {
        if (!trustCode) {
          throw new Error('Trust code is required for trust login');
        }

        // If schools are available, require school selection
        const trust = await authService.getTrustByCode(trustCode);
        if (trust) {
          const schools = await authService.getSchoolsByTrust(trust.id);
          if (schools.length > 1 && !schoolId) {
            throw new Error('Please select a school');
          }
        }
      }

      // Authenticate user
      const authResult = await authService.authenticateUser(
        {
          email,
          password,
          loginType,
          trustCode,
          schoolId
        },
        context
      );

      // Set session data
      req.session.sessionId = authResult.session.sessionId;
      req.session.loginType = authResult.loginType;
      req.session.user = authResult.user;

      // Set session timeout based on user preference (if remember me was selected)
      if (req.body.remember_me === 'on') {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      }

      logger.auth('Login successful', authResult.user.id, email, {
        role: authResult.user.role,
        loginType: authResult.loginType,
        sessionId: authResult.session.sessionId
      });

      // Handle JSON requests (API)
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({
          success: true,
          data: {
            message: 'Login successful',
            user: authResult.user,
            redirectUrl: '/dashboard'
          }
        });
      }

      // Redirect to intended page or dashboard
      const redirectUrl = req.session.returnTo || '/dashboard';
      delete req.session.returnTo;

      res.redirect(redirectUrl);
    } catch (error) {
      logger.auth('Login failed', null, email, {
        error: error.message,
        loginType,
        ...context
      });

      // Handle JSON requests (API)
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({
          success: false,
          error: {
            code: error.code || 'LOGIN_FAILED',
            message: error.message || 'Login failed'
          }
        });
      }

      // Redirect back to login with error
      const errorParam = encodeURIComponent(error.message);
      res.redirect(`/auth/login?error=${errorParam}`);
    }
  })
);

/**
 * POST /auth/logout - Logout user
 */
router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const sessionId = req.session?.sessionId;
    const loginType = req.session?.loginType;
    const userId = req.user?.id;

    try {
      // Invalidate session in database
      if (sessionId && loginType) {
        await authService.logout(sessionId, loginType);
      }

      logger.auth('Logout', userId, req.user?.email, {
        sessionId,
        loginType
      });
    } catch (error) {
      logger.error('Logout error', {
        error: error.message,
        sessionId,
        userId
      });
    }

    // Destroy session
    req.session.destroy(err => {
      if (err) {
        logger.error('Session destruction failed', { error: err.message });
      }

      // Clear session cookie
      res.clearCookie('school_erp_session');

      // Handle JSON requests (API)
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({
          success: true,
          data: {
            message: 'Logout successful'
          }
        });
      }

      // Redirect to login with success message
      res.redirect('/auth/login?message=logged_out');
    });
  })
);

/**
 * GET /auth/status - Check authentication status (API)
 */
router.get('/status', (req, res) => {
  if (req.user) {
    res.json({
      success: true,
      data: {
        authenticated: true,
        user: {
          id: req.user.id,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          role: req.user.role,
          permissions: req.user.permissions
        },
        session: {
          loginType: req.session.loginType
        }
      }
    });
  } else {
    res.json({
      success: true,
      data: {
        authenticated: false
      }
    });
  }
});

/**
 * GET /auth/forgot-password - Forgot password form
 */
router.get('/forgot-password', (req, res) => {
  res.render('auth/forgot-password', {
    title: 'Forgot Password',
    description: 'Reset your password',
    hideNavigation: true,
    hideFooter: true,
    error: req.query.error,
    message: req.query.message
  });
});

/**
 * POST /auth/forgot-password - Process forgot password
 */
router.post(
  '/forgot-password',
  authRateLimit,
  asyncHandler(async (req, res) => {
    // TODO: Implement password reset functionality
    // For now, just show a message

    logger.auth('Password reset requested', null, req.body.email, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Always show success message for security (don't reveal if email exists)
    const message =
      'If an account with that email exists, we have sent password reset instructions.';

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        data: { message }
      });
    }

    res.redirect(`/auth/forgot-password?message=${encodeURIComponent(message)}`);
  })
);

/**
 * GET /auth/trust/:trustCode - Redirect to trust-specific login
 */
router.get(
  '/trust/:trustCode',
  asyncHandler(async (req, res) => {
    const { trustCode } = req.params;

    try {
      const trust = await authService.getTrustByCode(trustCode);

      if (!trust) {
        return res.status(404).render('errors/404', {
          title: 'Trust Not Found',
          error: {
            message: 'The specified trust was not found or is inactive.'
          },
          hideNavigation: true
        });
      }

      // Redirect to login with trust context
      res.redirect(`/auth/login?trust=${trustCode}`);
    } catch (error) {
      logger.error('Trust lookup failed', {
        trustCode,
        error: error.message
      });

      res.status(500).render('errors/500', {
        title: 'Error',
        error: {
          message: 'Unable to process trust lookup'
        },
        hideNavigation: true
      });
    }
  })
);

module.exports = router;
