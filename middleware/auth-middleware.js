const authService = require('../modules/auth/auth-service');
const rbacService = require('../modules/auth/rbac-service');
const logger = require('../config/logger');

class AuthMiddleware {
  // Extract trust code from subdomain or query parameter
  extractTrustContext() {
    return (req, res, next) => {
      try {
        const host = req.get('host') || '';
        const hostname = req.hostname || '';
        const subdomain = host.split('.')[0];

        // Determine if this is system context
        // System context: localhost, localhost:3000, admin.*, system.*, or root domain without subdomain
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        const isSystemSubdomain = ['admin', 'system', 'www'].includes(subdomain);
        const isRootDomain = host.split('.').length <= 2; // No subdomain or just www

        const isSystemContext = isLocalhost || isSystemSubdomain || isRootDomain;

        let trustCode = null;

        // Only extract trust code if NOT in system context
        if (!isSystemContext) {
          trustCode = subdomain;
        }

        // Fallback to query parameter (only for trust context)
        if (!isSystemContext && !trustCode && req.query.trust) {
          trustCode = req.query.trust;
        }

        // Add context to request
        req.context = req.context || {};
        req.context.trustCode = trustCode;
        req.context.isSystemContext = isSystemContext;
        req.context.isTrustContext = !isSystemContext;
        req.context.host = host;
        req.context.hostname = hostname;
        req.context.subdomain = subdomain;

        // For backward compatibility
        req.trustCode = trustCode;

        logger.debug('Trust context extracted', {
          host,
          hostname,
          subdomain,
          isSystemContext,
          trustCode
        });

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  // Web authentication middleware - converts session to user object
  requireAuth() {
    return async (req, res, next) => {
      try {
        // Check if user is authenticated via session
        if (!req.session.userId) {
          // For browser requests, redirect to login
          if (req.headers.accept && req.headers.accept.includes('text/html')) {
            return res.redirect('/auth/login');
          }
          // For API requests, return JSON error
          return this.handleAuthError(res, 'Authentication required', 401, req);
        }

        // Convert session data to user object format expected by other middleware
        req.user = {
          id: req.session.userId,
          role: req.session.userRole,
          type: req.session.loginType || 'SYSTEM_USER',
          trustCode: req.session.trustCode || null,
          schoolId: req.session.schoolId || null
        };

        next();
      } catch (error) {
        console.error('Web auth middleware error:', error);
        return this.handleAuthError(res, 'Authentication failed', 500, req);
      }
    };
  }

  // Main authentication middleware
  authenticate() {
    return async (req, res, next) => {
      try {
        const sessionId = req.session?.sessionId || req.headers['x-session-id'];

        if (!sessionId) {
          return this.handleAuthError(res, 'No session found', 401, req);
        }

        const session = await authService.getSession(sessionId);
        if (!session) {
          return this.handleAuthError(res, 'Invalid or expired session', 401, req);
        }

        // Update session expiry
        await authService.updateSession(sessionId);

        // Set user context
        req.user = {
          id: session.user_id,
          type: session.user_type,
          trustCode: session.data.trustCode,
          role: session.data.role,
          schoolId: session.data.schoolId
        };

        next();
      } catch (error) {
        console.error('Auth middleware error:', error);
        return this.handleAuthError(res, 'Authentication failed', 500, req);
      }
    };
  }

  // Role-based authorization middleware
  authorize(requiredRole = null, requiredPermissions = []) {
    return (req, res, next) => {
      try {
        if (!req.user) {
          return this.handleAuthError(res, 'User not authenticated', 401, req);
        }

        // Check role requirement
        if (requiredRole) {
          if (Array.isArray(requiredRole)) {
            if (!requiredRole.includes(req.user.role)) {
              return this.handleAuthError(res, 'Insufficient role permissions', 403, req);
            }
          } else {
            if (req.user.role !== requiredRole) {
              return this.handleAuthError(res, 'Insufficient role permissions', 403, req);
            }
          }
        }

        // Check specific permissions
        if (requiredPermissions.length > 0) {
          const hasPermissions = requiredPermissions.every(permission => {
            const [resource, action] = permission.split(':');
            return rbacService.hasPermission(req.user.role, resource, action, {
              userId: req.user.id,
              trustCode: req.user.trustCode,
              schoolId: req.user.schoolId
            });
          });

          if (!hasPermissions) {
            return this.handleAuthError(res, 'Insufficient permissions', 403, req);
          }
        }

        next();
      } catch (error) {
        console.error('Authorization middleware error:', error);
        return this.handleAuthError(res, 'Authorization failed', 500, req);
      }
    };
  }

  // Route-based authorization
  authorizeRoute() {
    return (req, res, next) => {
      try {
        if (!req.user) {
          return this.handleAuthError(res, 'User not authenticated', 401, req);
        }

        const canAccess = rbacService.canAccessRoute(req.user.role, req.path, req.method);
        if (!canAccess) {
          return this.handleAuthError(res, 'Access denied to this route', 403, req);
        }

        next();
      } catch (error) {
        console.error('Route authorization error:', error);
        return this.handleAuthError(res, 'Authorization failed', 500, req);
      }
    };
  }

  // Trust context middleware
  requireTrustContext() {
    return (req, res, next) => {
      try {
        const trustCode = this.extractTrustContext(req);

        if (!trustCode) {
          return this.handleAuthError(res, 'Trust context required', 400, req);
        }

        // For trust users, verify they belong to this trust
        if (req.user && req.user.type === 'TRUST_USER') {
          if (req.user.trustCode !== trustCode) {
            return this.handleAuthError(res, 'Trust context mismatch', 403, req);
          }
        }

        req.trustCode = trustCode;
        next();
      } catch (error) {
        console.error('Trust context middleware error:', error);
        return this.handleAuthError(res, 'Trust context validation failed', 500, req);
      }
    };
  }

  // System user only middleware
  requireSystemUser() {
    return (req, res, next) => {
      if (!req.user || req.user.type !== 'SYSTEM_USER') {
        return this.handleAuthError(res, 'System user access required', 403, req);
      }
      next();
    };
  }

  // Trust user only middleware
  requireTrustUser() {
    return (req, res, next) => {
      if (!req.user || req.user.type !== 'TRUST_USER') {
        return this.handleAuthError(res, 'Trust user access required', 403, req);
      }
      next();
    };
  }

  // Optional authentication (for public routes that can benefit from user context)
  optionalAuth() {
    return async (req, res, next) => {
      try {
        const sessionId = req.session?.sessionId || req.headers['x-session-id'];

        if (sessionId) {
          const session = await authService.getSession(sessionId);
          if (session) {
            req.user = {
              id: session.user_id,
              type: session.user_type,
              trustCode: session.data.trustCode,
              role: session.data.role,
              schoolId: session.data.schoolId
            };
          }
        }

        next();
      } catch (error) {
        // For optional auth, we don't fail on errors
        console.error('Optional auth error:', error);
        next();
      }
    };
  }

  // Require authentication middleware (alias for authenticate)
  requireAuth() {
    return this.authenticate();
  }

  // Require specific permission middleware
  requirePermission(resource, action) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return this.handleAuthError(res, 'Authentication required', 401, req);
        }

        const hasPermission = await rbacService.checkPermission(
          req.user.id,
          resource,
          action,
          req.context
        );

        if (!hasPermission) {
          return this.handleAuthError(res, `Permission denied: ${resource}:${action}`, 403, req);
        }

        next();
      } catch (error) {
        console.error('Permission check error:', error);
        return this.handleAuthError(res, 'Permission check failed', 500, req);
      }
    };
  }

  // Require specific role middleware
  requireRole(...allowedRoles) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return this.handleAuthError(res, 'Authentication required', 401, req);
        }

        // Use RBAC service to check role equivalency
        const hasValidRole = rbacService.isRoleEquivalent(req.user.role, allowedRoles);
        
        if (!hasValidRole) {
          return this.handleAuthError(
            res,
            `Role ${req.user.role} not allowed. Required: ${allowedRoles.join(', ')}`,
            403,
            req
          );
        }

        next();
      } catch (error) {
        console.error('Role check error:', error);
        return this.handleAuthError(res, 'Role check failed', 500, req);
      }
    };
  }

  // Resource ownership middleware (for parent/student access)
  requireResourceOwnership(resourceIdParam = 'id') {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return this.handleAuthError(res, 'Authentication required', 401, req);
        }

        const resourceId = req.params[resourceIdParam];
        const userRole = req.user.role;

        // Admin roles can access any resource
        const adminRoles = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'SYS_ADMIN', 'GROUP_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN'];
        if (rbacService.isRoleEquivalent(userRole, adminRoles)) {
          return next();
        }

        // For PARENT role, check if they have access to the student
        if (userRole === 'PARENT') {
          const hasAccess = await this.checkParentStudentAccess(
            req.user.id,
            resourceId,
            req.trustCode
          );
          if (!hasAccess) {
            return this.handleAuthError(res, 'Access denied to this resource', 403, req);
          }
        }

        // For STUDENT role, check if accessing own data
        if (userRole === 'STUDENT') {
          if (req.user.id !== parseInt(resourceId)) {
            return this.handleAuthError(res, 'Access denied to this resource', 403, req);
          }
        }

        next();
      } catch (error) {
        console.error('Resource ownership check error:', error);
        return this.handleAuthError(res, 'Access validation failed', 500, req);
      }
    };
  }

  // Helper method to check parent-student relationship
  async checkParentStudentAccess(parentId, studentId, trustCode) {
    const db = require('../modules/data/database-service');

    try {
      const sql = `
        SELECT 1 FROM student_parents sp
        JOIN students s ON sp.student_id = s.id
        WHERE sp.parent_id = ? AND s.id = ?
      `;

      const result = await db.queryTrust(trustCode, sql, [parentId, studentId]);
      return result.length > 0;
    } catch (error) {
      console.error('Error checking parent-student access:', error);
      return false;
    }
  }

  // Logout middleware
  logout() {
    return async (req, res, next) => {
      try {
        const sessionId = req.session?.sessionId || req.headers['x-session-id'];

        if (sessionId) {
          await authService.destroySession(sessionId);
        }

        // Clear session data
        if (req.session) {
          req.session.destroy(err => {
            if (err) {
              console.error('Session destruction error:', err);
            }
          });
        }

        res.json({ message: 'Logged out successfully' });
      } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
      }
    };
  }

  // Error handling helper
  handleAuthError(res, message, statusCode = 401, req = null) {
    // Check if this is a browser request (accepts HTML)
    const acceptsHtml = req && req.headers.accept && req.headers.accept.includes('text/html');

    if (acceptsHtml && statusCode === 401) {
      // For browser requests with authentication errors, redirect to login
      return res.redirect('/auth/login');
    }

    if (acceptsHtml && statusCode === 403) {
      // For browser requests with authorization errors, render error page
      return res.status(403).render('errors/403', {
        title: 'Access Denied',
        message: message || 'You do not have permission to access this resource',
        user: req?.user || null
      });
    }

    // For API requests or other status codes, return JSON
    return res.status(statusCode).json({
      error: message,
      code: statusCode,
      timestamp: new Date().toISOString()
    });
  }

  // Session cleanup task (should be run periodically)
  static async cleanupExpiredSessions() {
    try {
      const cleaned = await authService.cleanupExpiredSessions();
      logger.info(`Cleaned up ${cleaned} expired sessions`);
      return cleaned;
    } catch (error) {
      logger.error('Session cleanup error:', error);
      return 0;
    }
  }
}

module.exports = new AuthMiddleware();
