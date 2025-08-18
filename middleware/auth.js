/**
 * Authentication Middleware
 * Simple session-based authentication with unified login support
 */

const authService = require('../modules/auth/auth-service');
const rbac = require('../utils/rbac');
const logger = require('../config/logger');
const { AuthenticationError, AuthorizationError } = require('./errors');

/**
 * Session authentication middleware
 * Validates user session and attaches user to request
 */
async function requireAuth(req, res, next) {
  try {
    const sessionId = req.session?.sessionId;
    const loginType = req.session?.loginType || 'TRUST';

    if (!sessionId) {
      logger.security('Missing session', 'low', {
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Redirect to login for browser requests
      if (req.accepts('html') && !req.xhr) {
        return res.redirect('/auth/login');
      }

      return next(new AuthenticationError('Authentication required'));
    }

    // Validate session
    const sessionData = await authService.validateSession(sessionId, loginType);

    if (!sessionData) {
      logger.security('Invalid session', 'medium', {
        sessionId,
        url: req.url,
        ip: req.ip
      });

      // Clear invalid session
      req.session.destroy(err => {
        if (err) {
          logger.error('Session destruction failed', { error: err.message });
        }
        // Create a new session for the flash message
        req.session.regenerate(() => {
          req.flash('error', 'Session expired');
          if (req.accepts('html') && !req.xhr) {
            return res.redirect('/auth/login');
          }
          return next(new AuthenticationError('Session expired'));
        });
      });
    }

    // Attach user and session to request
    req.user = sessionData.user;
    req.sessionData = sessionData;

    // Set user permissions for easy access
    req.user.permissions = rbac.getUserPermissions(req.user);
    req.user.canAccess = (resource, action, context = {}) => {
      return rbac.hasPermission(req.user, resource, action, context);
    };

    next();
  } catch (error) {
    logger.error('Authentication middleware error', {
      error: error.message,
      url: req.url,
      sessionId: req.session?.sessionId
    });

    return next(new AuthenticationError('Authentication failed'));
  }
}

/**
 * Optional authentication middleware
 * Attaches user if authenticated, but doesn't require it
 */
async function optionalAuth(req, res, next) {
  try {
    const sessionId = req.session?.sessionId;
    const loginType = req.session?.loginType || 'TRUST';

    if (sessionId) {
      const sessionData = await authService.validateSession(sessionId, loginType);

      if (sessionData) {
        req.user = sessionData.user;
        req.sessionData = sessionData;
        req.user.permissions = rbac.getUserPermissions(req.user);
        req.user.canAccess = (resource, action, context = {}) => {
          return rbac.hasPermission(req.user, resource, action, context);
        };
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error', {
      error: error.message,
      url: req.url
    });

    // Don't fail on optional auth errors
    next();
  }
}

const rbacService = require('../modules/auth/rbac-service');

/**
 * Role-based access control middleware
 * Requires specific role(s) to access the route
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    // Use RBAC service to check role equivalency
    const hasValidRole = rbacService.isRoleEquivalent(req.user.role, allowedRoles);

    if (!hasValidRole) {
      logger.security('Role access denied', 'medium', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        url: req.url,
        ip: req.ip
      });

      return next(
        new AuthorizationError(`Role ${req.user.role} not allowed. Required: ${allowedRoles.join(', ')}`)
      );
    }

    next();
  };
}

/**
 * Permission-based access control middleware
 * Requires specific permission to access the route
 */
function requirePermission(resource, action) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    if (!req.user.canAccess(resource, action, req.context)) {
      logger.security('Permission denied', 'medium', {
        userId: req.user.id,
        userRole: req.user.role,
        resource,
        action,
        url: req.url,
        ip: req.ip
      });

      return next(new AuthorizationError(`Access denied: ${resource}:${action}`));
    }

    next();
  };
}

/**
 * Context extraction middleware
 * Extracts context information for authorization decisions
 */
function extractContext(req, res, next) {
  req.context = {
    schoolId: req.user?.schoolId,
    trustId: req.user?.trustId,
    userId: req.user?.id,

    // Extract from URL parameters
    studentId: req.params.studentId,
    feeId: req.params.feeId,

    // Extract from query parameters
    classId: req.query.classId,

    // Helper functions for common checks
    isOwnChild: studentId => {
      // Check if parent is accessing their own child
      return req.user?.role === 'PARENT' && req.user?.children?.includes(parseInt(studentId));
    },

    isAssignedClass: classId => {
      // Check if teacher is accessing their assigned class
      return req.user?.role === 'TEACHER' && req.user?.assignedClasses?.includes(parseInt(classId));
    },

    isSameSchool: schoolId => {
      // Check if user belongs to the same school
      return req.user?.schoolId === parseInt(schoolId);
    }
  };

  next();
}

/**
 * Trust context middleware
 * Determines login type based on subdomain or explicit parameter
 */
function determineTrustContext(req, res, next) {
  try {
    const host = req.get('host') || '';
    const subdomain = host.split('.')[0];

    // System admin access (no subdomain or explicit system domain)
    if (subdomain === 'admin' || subdomain === 'system' || req.query.system === 'true') {
      req.loginType = 'SYSTEM';
      req.trustContext = null;
    } else {
      req.loginType = 'TRUST';
      req.trustContext = {
        subdomain: subdomain !== host ? subdomain : null, // Only if actual subdomain
        trustCode: req.query.trust || req.body.trust_code || subdomain
      };
    }

    next();
  } catch (error) {
    logger.error('Trust context determination failed', {
      error: error.message,
      host: req.get('host'),
      url: req.url
    });

    // Default to trust login if context detection fails
    req.loginType = 'TRUST';
    req.trustContext = { subdomain: null, trustCode: null };
    next();
  }
}

/**
 * System admin route protection
 * Ensures only system-level users can access system routes
 */
function requireSystemAccess(req, res, next) {
  if (!req.user) {
    return next(new AuthenticationError('Authentication required'));
  }

  if (!['SYSTEM_ADMIN', 'GROUP_ADMIN'].includes(req.user.role)) {
    logger.security('System access denied', 'high', {
      userId: req.user.id,
      userRole: req.user.role,
      url: req.url,
      ip: req.ip
    });

    return next(new AuthorizationError('System administrator access required'));
  }

  next();
}

/**
 * School context validation
 * Ensures user can only access data from their assigned school
 */
function requireSchoolContext(req, res, next) {
  if (!req.user) {
    return next(new AuthenticationError('Authentication required'));
  }

  // System admins can access all schools
  if (['SYSTEM_ADMIN', 'GROUP_ADMIN'].includes(req.user.role)) {
    return next();
  }

  // Trust admins can access all schools in their trust
  if (req.user.role === 'TRUST_ADMIN') {
    return next();
  }

  // Other roles must have school assignment
  if (!req.user.schoolId) {
    logger.security('Missing school context', 'medium', {
      userId: req.user.id,
      userRole: req.user.role,
      url: req.url
    });

    return next(new AuthorizationError('School assignment required'));
  }

  // Validate school access for requests with school parameter
  const requestedSchoolId = req.params.schoolId || req.body.schoolId || req.query.schoolId;

  if (requestedSchoolId && parseInt(requestedSchoolId) !== req.user.schoolId) {
    logger.security('Cross-school access attempt', 'high', {
      userId: req.user.id,
      userSchool: req.user.schoolId,
      requestedSchool: requestedSchoolId,
      url: req.url,
      ip: req.ip
    });

    return next(new AuthorizationError('Access denied to this school'));
  }

  next();
}

module.exports = {
  requireAuth,
  optionalAuth,
  requireRole,
  requirePermission,
  extractContext,
  determineTrustContext,
  requireSystemAccess,
  requireSchoolContext
};
