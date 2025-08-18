const express = require('express');
const router = express.Router();
const authService = require('../modules/auth/auth-service');
const validationMiddleware = require('../middleware/validation-middleware');
const errorHandler = require('../middleware/error-handler');

// Helper function to detect browser requests
const isBrowserRequest = req => {
  return req.headers.accept && req.headers.accept.includes('text/html');
};

// Login endpoint - SIMPLE VERSION
router.post('/login', async (req, res) => {
  try {
    const { email, password, loginType = 'SYSTEM' } = req.body;

    // Use the correct method from the modules auth service
    const result = await authService.login(email, password, 'SYSTEM', null);

    // Store session data
    req.session.userId = result.user.id;
    req.session.userRole = result.user.role;
    req.session.loginType = 'SYSTEM';

    // Redirect to the appropriate dashboard based on role
    if (result.user.role === 'SYSTEM_ADMIN') {
      return res.redirect('/admin/dashboard');
    } else {
      return res.redirect('/dashboard');
    }
  } catch (error) {
    // Use flash message instead of URL parameter
    req.flash('error', error.message);
    return res.redirect('/auth/login');
  }
});

// Logout endpoints (both GET and POST)
router.get('/logout', (req, res) => {
  // Clear session and redirect
  req.session.destroy(err => {
    if (err) {
      logger.error('Session destroy error:', err);
    }
    res.clearCookie('school_erp_session');
    res.redirect('/auth/login?message=logged_out');
  });
});

router.post(
  '/logout',
  errorHandler.asyncHandler(async (req, res) => {
    req.session.destroy(err => {
      if (err) {
        if (isBrowserRequest(req)) {
          req.flash('error', 'Logout failed');
          return res.redirect('/auth/login');
        }
        return res.error('Logout failed', 'LOGOUT_ERROR', 500);
      }

      res.clearCookie('school_erp_session');

      if (isBrowserRequest(req)) {
        req.flash('message', 'Logged out successfully');
        return res.redirect('/auth/login');
      }
      res.success(null, 'Logout successful');
    });
  })
);

// Change password endpoint
router.post(
  '/change-password',
  validationMiddleware.validate('auth.changePassword'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.session.userId;

      if (!userId) {
        return res.error('User not authenticated', 'NOT_AUTHENTICATED', 401);
      }

      await authService.changePassword(userId, currentPassword, newPassword, req.trustCode);

      res.success(null, 'Password changed successfully');
    } catch (error) {
      res.error(error.message, 'PASSWORD_CHANGE_FAILED', 400);
    }
  })
);

// Forgot password endpoint
router.post(
  '/forgot-password',
  validationMiddleware.validate('auth.forgotPassword'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { email } = req.body;

      await authService.initiatePasswordReset(email, req.trustCode);

      const successMessage = 'If the email exists, password reset instructions have been sent';

      if (isBrowserRequest(req)) {
        req.flash('message', successMessage);
        return res.redirect('/auth/forgot-password');
      }

      // Always return success for security (don't reveal if email exists)
      res.success(null, successMessage);
    } catch (error) {
      // Log the error but don't expose it to the user
      console.error('Forgot password error:', error);

      const successMessage = 'If the email exists, password reset instructions have been sent';

      if (isBrowserRequest(req)) {
        req.flash('message', successMessage);
        return res.redirect('/auth/forgot-password');
      }

      res.success(null, successMessage);
    }
  })
);

// Reset password endpoint
router.post(
  '/reset-password',
  validationMiddleware.validate('auth.resetPassword'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      await authService.resetPassword(token, newPassword, req.trustCode);

      if (isBrowserRequest(req)) {
        req.flash('message', 'Password reset successful. Please login with your new password.');
        return res.redirect('/auth/login');
      }

      res.success(null, 'Password reset successful');
    } catch (error) {
      if (isBrowserRequest(req)) {
        req.flash('error', error.message);
        return res.redirect(`/auth/reset-password/${token}`);
      }
      res.error(error.message, 'PASSWORD_RESET_FAILED', 400);
    }
  })
);

// Verify session endpoint
router.get(
  '/verify-session',
  errorHandler.asyncHandler(async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.error('No active session', 'NO_SESSION', 401);
      }

      const user = await authService.getUserById(req.session.userId, req.trustCode);

      if (!user) {
        // Clear invalid session
        req.session.destroy();
        return res.error('Invalid session', 'INVALID_SESSION', 401);
      }

      res.success(
        {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            permissions: user.permissions
          }
        },
        'Session valid'
      );
    } catch (error) {
      res.error(error.message, 'SESSION_VERIFICATION_FAILED', 500);
    }
  })
);

// Get current user profile
router.get(
  '/profile',
  errorHandler.asyncHandler(async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.error('User not authenticated', 'NOT_AUTHENTICATED', 401);
      }

      const user = await authService.getUserProfile(req.session.userId, req.trustCode);

      res.success(user, 'Profile retrieved successfully');
    } catch (error) {
      res.error(error.message, 'PROFILE_FETCH_FAILED', 500);
    }
  })
);

// Update user profile
router.put(
  '/profile',
  validationMiddleware.validate('auth.updateProfile'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.error('User not authenticated', 'NOT_AUTHENTICATED', 401);
      }

      const updatedUser = await authService.updateUserProfile(
        req.session.userId,
        req.body,
        req.trustCode
      );

      res.success(updatedUser, 'Profile updated successfully');
    } catch (error) {
      res.error(error.message, 'PROFILE_UPDATE_FAILED', 400);
    }
  })
);

// Get user permissions
router.get(
  '/permissions',
  errorHandler.asyncHandler(async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.error('User not authenticated', 'NOT_AUTHENTICATED', 401);
      }

      const permissions = await authService.getUserPermissions(req.session.userId, req.trustCode);

      res.success(permissions, 'Permissions retrieved successfully');
    } catch (error) {
      res.error(error.message, 'PERMISSIONS_FETCH_FAILED', 500);
    }
  })
);

// Session activity tracking
router.post(
  '/activity',
  errorHandler.asyncHandler(async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.error('User not authenticated', 'NOT_AUTHENTICATED', 401);
      }

      // Update last activity timestamp
      await authService.updateLastActivity(req.session.userId, req.trustCode);

      res.success(null, 'Activity recorded');
    } catch (error) {
      res.error(error.message, 'ACTIVITY_UPDATE_FAILED', 500);
    }
  })
);

// System login for system admins
router.post(
  '/system-login',
  validationMiddleware.validate('auth.systemLogin'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { email, password } = req.body;

      const result = await authService.systemLogin(email, password);

      // Store session data
      req.session.userId = result.user.id;
      req.session.userRole = result.user.role;
      req.session.loginType = 'SYSTEM';
      req.session.trustCode = null; // System users don't belong to specific trust

      res.success(
        {
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            role: result.user.role,
            permissions: result.user.permissions
          },
          redirectUrl: '/admin/dashboard'
        },
        'System login successful'
      );
    } catch (error) {
      res.error(error.message, 'SYSTEM_LOGIN_FAILED', 401);
    }
  })
);

module.exports = router;
