const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { logAuth, logError } = require('../utils/logger');
const { AuthenticationError, AuthorizationError } = require('../utils/errors');
const { USER_ROLES, SYSTEM } = require('../config/business-constants');
const appConfig = require('../config/app-config.json');

/**
 * Authentication middleware for session-based auth
 */
const authenticate = (req, res, next) => {
   if (!req.session || !req.session.user) {
      return res.status(401).json({
         success: false,
         error: {
            code: 'AUTH_REQUIRED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
         },
      });
   }

   // Check session expiry based on role
   const sessionTimeout = SYSTEM.SESSION_TIMEOUT[req.session.user.role] || SYSTEM.SESSION_TIMEOUT.ADMIN;
   const sessionAge = Date.now() - new Date(req.session.user.lastActivity);

   if (sessionAge > sessionTimeout) {
      req.session.destroy();
      return res.status(401).json({
         success: false,
         error: {
            code: 'SESSION_EXPIRED',
            message: 'Session has expired',
            timestamp: new Date().toISOString(),
         },
      });
   }

   // Update last activity
   req.session.user.lastActivity = new Date();
   req.user = req.session.user;

   next();
};

/**
 * Optional authentication middleware
 * Sets user context if authenticated, but doesn't require it
 */
const optionalAuthenticate = (req, res, next) => {
   if (req.session && req.session.user) {
      req.user = req.session.user;
   }
   next();
};

/**
 * Role-based authorization middleware
 */
const authorize = (...allowedRoles) => {
   return (req, res, next) => {
      if (!req.user) {
         return res.status(401).json({
            success: false,
            error: {
               code: 'AUTH_REQUIRED',
               message: 'Authentication required',
               timestamp: new Date().toISOString(),
            },
         });
      }

      if (!allowedRoles.includes(req.user.role)) {
         logAuth('AUTHORIZATION_DENIED', req.user.id, req.tenantCode, {
            requiredRoles: allowedRoles,
            userRole: req.user.role,
            path: req.path,
         });

         return res.status(403).json({
            success: false,
            error: {
               code: 'INSUFFICIENT_PERMISSIONS',
               message: 'Insufficient permissions to access this resource',
               timestamp: new Date().toISOString(),
            },
         });
      }

      next();
   };
};

/**
 * System admin only middleware
 */
const requireSystemAdmin = authorize(USER_ROLES.SYSTEM_ADMIN);

/**
 * Trust admin or higher middleware
 */
const requireTrustAdmin = authorize(USER_ROLES.SYSTEM_ADMIN, USER_ROLES.TRUST_ADMIN);

/**
 * Principal or higher middleware
 */
const requirePrincipal = authorize(USER_ROLES.SYSTEM_ADMIN, USER_ROLES.TRUST_ADMIN, USER_ROLES.PRINCIPAL);

/**
 * Teacher or higher middleware
 */
const requireTeacher = authorize(
   USER_ROLES.SYSTEM_ADMIN,
   USER_ROLES.TRUST_ADMIN,
   USER_ROLES.PRINCIPAL,
   USER_ROLES.TEACHER
);

/**
 * Staff (non-parent/student) middleware
 */
const requireStaff = authorize(
   USER_ROLES.SYSTEM_ADMIN,
   USER_ROLES.TRUST_ADMIN,
   USER_ROLES.PRINCIPAL,
   USER_ROLES.TEACHER,
   USER_ROLES.ACCOUNTANT
);

/**
 * Login rate limiting middleware
 */
const loginRateLimit = rateLimit({
   windowMs: appConfig.security.rateLimiting.windowMs,
   max: appConfig.security.rateLimiting.authMaxRequests,
   message: {
      success: false,
      error: {
         code: 'RATE_LIMIT_EXCEEDED',
         message: 'Too many login attempts, please try again later',
         timestamp: new Date().toISOString(),
      },
   },
   standardHeaders: true,
   legacyHeaders: false,
});

/**
 * Password utility functions
 */
const passwordUtils = {
   /**
    * Hash password using bcrypt
    */
   async hashPassword(password) {
      try {
         const saltRounds = appConfig.security.bcryptRounds;
         return await bcrypt.hash(password, saltRounds);
      } catch (error) {
         logError(error, { context: 'hashPassword' });
         throw new Error('Failed to hash password');
      }
   },

   /**
    * Verify password against hash
    */
   async verifyPassword(password, hash) {
      try {
         return await bcrypt.compare(password, hash);
      } catch (error) {
         logError(error, { context: 'verifyPassword' });
         throw new Error('Failed to verify password');
      }
   },

   /**
    * Validate password strength
    */
   validatePasswordStrength(password) {
      const minLength = 8;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      const errors = [];

      if (password.length < minLength) {
         errors.push(`Password must be at least ${minLength} characters long`);
      }

      if (!hasUpperCase) {
         errors.push('Password must contain at least one uppercase letter');
      }

      if (!hasLowerCase) {
         errors.push('Password must contain at least one lowercase letter');
      }

      if (!hasNumbers) {
         errors.push('Password must contain at least one number');
      }

      if (!hasSpecialChar) {
         errors.push('Password must contain at least one special character');
      }

      return {
         isValid: errors.length === 0,
         errors,
      };
   },
};

/**
 * Account lockout middleware
 */
const checkAccountLock = async (user) => {
   if (user.isLocked()) {
      logAuth('LOGIN_BLOCKED_ACCOUNT_LOCKED', user.id, null, {
         lockedUntil: user.locked_until,
         loginAttempts: user.login_attempts,
      });

      throw new AuthenticationError(
         'Account is temporarily locked due to multiple failed login attempts',
         'AUTH_ACCOUNT_LOCKED'
      );
   }
};

/**
 * Handle failed login attempt
 */
const handleFailedLogin = async (user) => {
   await user.incrementLoginAttempts();

   // Lock account after max attempts
   if (user.login_attempts >= appConfig.security.maxLoginAttempts) {
      await user.lockAccount(appConfig.security.lockoutTimeMs);

      logAuth('ACCOUNT_LOCKED', user.id, null, {
         loginAttempts: user.login_attempts,
         lockedUntil: user.locked_until,
      });
   }

   logAuth('LOGIN_FAILED', user.id, null, {
      loginAttempts: user.login_attempts,
      remainingAttempts: Math.max(0, appConfig.security.maxLoginAttempts - user.login_attempts),
   });
};

/**
 * Handle successful login
 */
const handleSuccessfulLogin = async (user) => {
   // Reset login attempts
   await user.resetLoginAttempts();

   // Update last login
   await user.updateLastLogin();

   logAuth('LOGIN_SUCCESS', user.id, null, {
      role: user.role,
      lastLogin: user.last_login_at,
   });
};

module.exports = {
   authenticate,
   optionalAuthenticate,
   authorize,
   requireSystemAdmin,
   requireTrustAdmin,
   requirePrincipal,
   requireTeacher,
   requireStaff,
   loginRateLimit,
   passwordUtils,
   checkAccountLock,
   handleFailedLogin,
   handleSuccessfulLogin,
};
