/**
 * Simple but Robust RBAC Implementation
 * Configuration-driven role-based access control
 */

const rbacConfig = require('../config/rbac.json');
const logger = require('../config/logger');
const { AuthorizationError } = require('../middleware/errors');

class RBAC {
  constructor() {
    this.roles = rbacConfig.roles;
    this.resources = rbacConfig.resources;
    this.hierarchy = rbacConfig.permissionHierarchy;
    this.routePermissions = rbacConfig.routePermissions;
    this.contextRules = rbacConfig.contextRules;
  }

  /**
   * Check if user has permission for a specific action
   * @param {Object} user - User object with role and context
   * @param {string} resource - Resource name (e.g., 'students')
   * @param {string} action - Action name (e.g., 'read', 'create')
   * @param {Object} context - Additional context (e.g., { schoolId: 1 })
   * @returns {boolean} - Whether user has permission
   */
  hasPermission(user, resource, action, context = {}) {
    try {
      if (!user || !user.role) {
        return false;
      }

      const userRole = this.roles[user.role];
      if (!userRole) {
        logger.security('Unknown role attempted access', 'medium', {
          userId: user.id,
          role: user.role,
          resource,
          action
        });
        return false;
      }

      // System admin has all permissions
      if (user.role === 'SYSTEM_ADMIN') {
        return true;
      }

      // Check if user has wildcard permission
      if (userRole.permissions.includes('*')) {
        return this.checkContextRules(user, resource, action, context);
      }

      // Check specific permission
      const permission = `${resource}:${action}`;
      const hasDirectPermission = userRole.permissions.includes(permission);
      
      if (!hasDirectPermission) {
        // Check if user has general resource permission
        const resourcePermission = `${resource}:*`;
        if (!userRole.permissions.includes(resourcePermission)) {
          return false;
        }
      }

      // Check context-specific rules
      return this.checkContextRules(user, resource, action, context);

    } catch (error) {
      logger.error('RBAC permission check failed', {
        error: error.message,
        userId: user?.id,
        role: user?.role,
        resource,
        action
      });
      return false;
    }
  }

  /**
   * Check if user can access a specific route
   * @param {Object} user - User object
   * @param {string} route - Route path
   * @returns {boolean} - Whether user can access route
   */
  canAccessRoute(user, route) {
    try {
      if (!user || !user.role) {
        return false;
      }

      // Find matching route permission
      const routePermission = Object.keys(this.routePermissions).find(routePattern => {
        return route.startsWith(routePattern);
      });

      if (!routePermission) {
        // If no specific permission defined, allow access for authenticated users
        return true;
      }

      const allowedRoles = this.routePermissions[routePermission];
      
      // Check if wildcard access
      if (allowedRoles.includes('*')) {
        return true;
      }

      // Check direct role permission
      if (allowedRoles.includes(user.role)) {
        return true;
      }

      // Check hierarchical permissions
      return this.hasHierarchicalAccess(user.role, allowedRoles);

    } catch (error) {
      logger.error('Route access check failed', {
        error: error.message,
        userId: user?.id,
        role: user?.role,
        route
      });
      return false;
    }
  }

  /**
   * Check hierarchical role permissions
   */
  hasHierarchicalAccess(userRole, allowedRoles) {
    const subordinateRoles = this.hierarchy[userRole] || [];
    
    return allowedRoles.some(allowedRole => 
      subordinateRoles.includes(allowedRole)
    );
  }

  /**
   * Check context-specific access rules
   */
  checkContextRules(user, resource, action, context) {
    const contextRule = this.contextRules[user.role];
    
    if (!contextRule) {
      return true; // No context restrictions
    }

    // Handle "own" permissions (e.g., "students:read:own")
    const userPermissions = this.roles[user.role].permissions;
    const ownPermission = `${resource}:${action}:own`;
    
    if (userPermissions.includes(ownPermission)) {
      return this.checkOwnResourceAccess(user, resource, context);
    }

    return true;
  }

  /**
   * Check if user can access their own resources
   */
  checkOwnResourceAccess(user, resource, context) {
    switch (user.role) {
      case 'PARENT':
        // Parents can only access their children's records
        return context.isOwnChild === true;
        
      case 'TEACHER':
        // Teachers can only access their assigned classes
        return context.isAssignedClass === true;
        
      case 'SCHOOL_ADMIN':
        // School admins can only access their school's data
        return context.schoolId === user.schoolId;
        
      default:
        return true;
    }
  }

  /**
   * Get user's effective permissions
   */
  getUserPermissions(user) {
    if (!user || !user.role) {
      return [];
    }

    const userRole = this.roles[user.role];
    if (!userRole) {
      return [];
    }

    return userRole.permissions;
  }

  /**
   * Get user's accessible routes
   */
  getUserRoutes(user) {
    if (!user || !user.role) {
      return [];
    }

    const accessibleRoutes = [];
    
    for (const [route, allowedRoles] of Object.entries(this.routePermissions)) {
      if (this.canAccessRoute(user, route)) {
        accessibleRoutes.push(route);
      }
    }

    return accessibleRoutes;
  }

  /**
   * Middleware factory for route protection
   */
  requirePermission(resource, action) {
    return (req, res, next) => {
      const user = req.session?.user;
      
      if (!user) {
        logger.security('Unauthenticated access attempt', 'medium', {
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        return next(new AuthorizationError('Authentication required'));
      }

      if (!this.hasPermission(user, resource, action, req.context)) {
        logger.security('Unauthorized access attempt', 'high', {
          userId: user.id,
          role: user.role,
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
   * Middleware for route-level protection
   */
  requireRoute() {
    return (req, res, next) => {
      const user = req.session?.user;
      
      if (!user) {
        return next(new AuthorizationError('Authentication required'));
      }

      if (!this.canAccessRoute(user, req.path)) {
        logger.security('Route access denied', 'medium', {
          userId: user.id,
          role: user.role,
          route: req.path,
          ip: req.ip
        });
        return next(new AuthorizationError('Access denied to this section'));
      }

      next();
    };
  }

  /**
   * Check if role exists and return role info
   */
  getRoleInfo(roleName) {
    return this.roles[roleName] || null;
  }

  /**
   * Get all available roles
   */
  getAllRoles() {
    return Object.keys(this.roles).map(roleName => ({
      name: roleName,
      ...this.roles[roleName]
    }));
  }

  /**
   * Validate role assignment based on hierarchy
   */
  canAssignRole(assignerRole, targetRole) {
    if (assignerRole === 'SYSTEM_ADMIN') {
      return true;
    }

    const subordinateRoles = this.hierarchy[assignerRole] || [];
    return subordinateRoles.includes(targetRole);
  }
}

// Create singleton instance
const rbac = new RBAC();

module.exports = rbac;