const config = require('../../config');
const constants = config.get('constants');

class RBACService {
  constructor() {
    // Define role equivalencies
    this.roleEquivalencies = {
      SUPER_ADMIN: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'SYS_ADMIN'],
      SYSTEM_ADMIN: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'SYS_ADMIN'],
      SYS_ADMIN: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'SYS_ADMIN'],
      GROUP_ADMIN: ['GROUP_ADMIN', constants.USER_ROLES.TRUST_ADMIN],
      TRUST_ADMIN: ['GROUP_ADMIN', constants.USER_ROLES.TRUST_ADMIN]
    };

    this.roles = {
      SUPER_ADMIN: { level: 100, permissions: ['*'] },
      SYSTEM_ADMIN: { level: 100, permissions: ['*'] },
      SYS_ADMIN: { level: 100, permissions: ['*'] },
      GROUP_ADMIN: {
        level: 90,
        permissions: ['trusts:*', 'schools:*', 'users:*', 'students:*', 'fees:*', 'reports:*']
      },
      [constants.USER_ROLES.TRUST_ADMIN]: {
        level: 90,
        permissions: ['trusts:*', 'schools:*', 'users:*', 'students:*', 'fees:*', 'reports:*']
      },
      [constants.USER_ROLES.SCHOOL_ADMIN]: {
        level: 70,
        permissions: ['students:*', 'users:school', 'fees:*', 'attendance:*', 'reports:school']
      },
      [constants.USER_ROLES.TEACHER]: {
        level: 50,
        permissions: ['students:read', 'attendance:*', 'reports:class']
      },
      [constants.USER_ROLES.ACCOUNTANT]: {
        level: 60,
        permissions: ['fees:*', 'students:read', 'reports:financial']
      },
      [constants.USER_ROLES.PARENT]: {
        level: 20,
        permissions: ['students:own', 'fees:own', 'attendance:own']
      },
      [constants.USER_ROLES.STUDENT]: { level: 10, permissions: ['profile:own', 'attendance:own'] }
    };

    this.resources = [
      'trusts',
      'schools',
      'users',
      'students',
      'classes',
      'sections',
      'fees',
      'attendance',
      'reports',
      'communications',
      'documents'
    ];

    this.actions = ['create', 'read', 'update', 'delete', 'approve', 'assign'];
  }

  // Check if user role is equivalent to any of the allowed roles
  isRoleEquivalent(userRole, allowedRoles) {
    if (allowedRoles.includes(userRole)) return true;

    const equivalentRoles = this.roleEquivalencies[userRole] || [userRole];
    return allowedRoles.some(role => equivalentRoles.includes(role));
  }

  hasPermission(userRole, resource, action, context = {}) {
    const role = this.roles[userRole];
    if (!role) return false;

    // Super admin, system admin, and sys admin have all permissions
    if (this.isRoleEquivalent(userRole, ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'SYS_ADMIN'])) return true;

    // Check wildcard permissions
    if (role.permissions.includes('*')) return true;
    if (role.permissions.includes(`${resource}:*`)) return true;
    if (role.permissions.includes(`${resource}:${action}`)) return true;

    // Handle special context-based permissions
    return this.checkContextualPermissions(userRole, resource, action, context);
  }

  checkContextualPermissions(userRole, resource, action, context) {
    const { userId, trustCode, schoolId, studentId, parentId } = context;

    switch (userRole) {
      case constants.USER_ROLES.TRUST_ADMIN:
        return this.checkTrustAdminPermissions(resource, action, context);

      case constants.USER_ROLES.SCHOOL_ADMIN:
        return this.checkSchoolAdminPermissions(resource, action, context);

      case constants.USER_ROLES.TEACHER:
        return this.checkTeacherPermissions(resource, action, context);

      case constants.USER_ROLES.ACCOUNTANT:
        return this.checkAccountantPermissions(resource, action, context);

      case constants.USER_ROLES.PARENT:
        return this.checkParentPermissions(resource, action, context);

      case constants.USER_ROLES.STUDENT:
        return this.checkStudentPermissions(resource, action, context);

      default:
        return false;
    }
  }

  checkTrustAdminPermissions(resource, action, context) {
    const allowedResources = ['schools', 'users', 'students', 'fees', 'attendance', 'reports'];
    return allowedResources.includes(resource);
  }

  checkSchoolAdminPermissions(resource, action, context) {
    const { schoolId, userSchoolId } = context;

    // Can only access data from their assigned school
    if (schoolId && userSchoolId && schoolId !== userSchoolId) {
      return false;
    }

    const permissions = {
      students: ['create', 'read', 'update', 'approve'],
      users: ['read', 'update'],
      fees: ['create', 'read', 'update', 'approve'],
      attendance: ['create', 'read', 'update'],
      reports: ['read'],
      communications: ['create', 'read']
    };

    return permissions[resource]?.includes(action) || false;
  }

  checkTeacherPermissions(resource, action, context) {
    const { userId, teacherId, classId, userClassIds } = context;

    // Teachers can only access their assigned classes
    if (classId && userClassIds && !userClassIds.includes(classId)) {
      return false;
    }

    const permissions = {
      students: ['read'],
      attendance: ['create', 'read', 'update'],
      reports: ['read'],
      communications: ['create', 'read']
    };

    return permissions[resource]?.includes(action) || false;
  }

  checkAccountantPermissions(resource, action, context) {
    const { schoolId, userSchoolId } = context;

    // Can only access data from their assigned school
    if (schoolId && userSchoolId && schoolId !== userSchoolId) {
      return false;
    }

    const permissions = {
      students: ['read'],
      fees: ['create', 'read', 'update', 'approve'],
      reports: ['read']
    };

    return permissions[resource]?.includes(action) || false;
  }

  checkParentPermissions(resource, action, context) {
    const { userId, parentId, studentId, userChildIds } = context;

    // Parents can only access their own children's data
    if (studentId && userChildIds && !userChildIds.includes(studentId)) {
      return false;
    }

    const permissions = {
      students: ['read'],
      fees: ['read'],
      attendance: ['read'],
      communications: ['read']
    };

    return permissions[resource]?.includes(action) || false;
  }

  checkStudentPermissions(resource, action, context) {
    const { userId, studentUserId } = context;

    // Students can only access their own data
    if (userId !== studentUserId) {
      return false;
    }

    const permissions = {
      students: ['read'],
      attendance: ['read'],
      fees: ['read']
    };

    return permissions[resource]?.includes(action) || false;
  }

  canAccessRoute(userRole, route, method = 'GET') {
    const routePermissions = {
      // System routes
      '/api/trusts': {
        roles: ['SYSTEM_ADMIN', 'GROUP_ADMIN'],
        methods: ['GET', 'POST', 'PUT', 'DELETE']
      },
      '/api/system-users': { roles: ['SYSTEM_ADMIN'], methods: ['GET', 'POST', 'PUT', 'DELETE'] },

      // Trust routes
      '/api/schools': {
        roles: [constants.USER_ROLES.TRUST_ADMIN, constants.USER_ROLES.SCHOOL_ADMIN],
        methods: ['GET', 'POST', 'PUT']
      },
      '/api/users': {
        roles: [constants.USER_ROLES.TRUST_ADMIN, constants.USER_ROLES.SCHOOL_ADMIN],
        methods: ['GET', 'POST', 'PUT']
      },

      // Student routes
      '/api/students': {
        roles: [
          constants.USER_ROLES.TRUST_ADMIN,
          constants.USER_ROLES.SCHOOL_ADMIN,
          constants.USER_ROLES.TEACHER,
          constants.USER_ROLES.PARENT
        ],
        methods: ['GET', 'POST', 'PUT']
      },

      // Fee routes
      '/api/fees': {
        roles: [
          constants.USER_ROLES.TRUST_ADMIN,
          constants.USER_ROLES.SCHOOL_ADMIN,
          constants.USER_ROLES.ACCOUNTANT,
          constants.USER_ROLES.PARENT
        ],
        methods: ['GET', 'POST', 'PUT']
      },

      // Attendance routes
      '/api/attendance': {
        roles: [
          constants.USER_ROLES.TRUST_ADMIN,
          constants.USER_ROLES.SCHOOL_ADMIN,
          constants.USER_ROLES.TEACHER,
          constants.USER_ROLES.PARENT
        ],
        methods: ['GET', 'POST', 'PUT']
      },

      // Report routes
      '/api/reports': {
        roles: [
          constants.USER_ROLES.TRUST_ADMIN,
          constants.USER_ROLES.SCHOOL_ADMIN,
          constants.USER_ROLES.TEACHER,
          constants.USER_ROLES.ACCOUNTANT,
          constants.USER_ROLES.PARENT
        ],
        methods: ['GET']
      }
    };

    // Find matching route (supports wildcards)
    const matchingRoute = Object.keys(routePermissions).find(pattern => {
      return route.startsWith(pattern) || route.match(new RegExp(pattern.replace('*', '.*')));
    });

    if (!matchingRoute) {
      return false; // Route not defined, deny access
    }

    const permission = routePermissions[matchingRoute];
    return permission.roles.includes(userRole) && permission.methods.includes(method);
  }

  getRoleLevel(role) {
    return this.roles[role]?.level || 0;
  }

  isHigherRole(role1, role2) {
    return this.getRoleLevel(role1) > this.getRoleLevel(role2);
  }

  canManageUser(managerRole, targetRole) {
    const managerLevel = this.getRoleLevel(managerRole);
    const targetLevel = this.getRoleLevel(targetRole);

    // Can only manage users with lower role level
    return managerLevel > targetLevel;
  }

  getAccessibleResources(userRole) {
    const role = this.roles[userRole];
    if (!role) return [];

    if (role.permissions.includes('*')) {
      return this.resources;
    }

    const accessibleResources = [];
    role.permissions.forEach(permission => {
      if (permission.includes(':')) {
        const [resource] = permission.split(':');
        if (!accessibleResources.includes(resource)) {
          accessibleResources.push(resource);
        }
      }
    });

    return accessibleResources;
  }

  validateRoleTransition(currentRole, newRole, managerRole) {
    // System admin can change any role
    if (managerRole === 'SYSTEM_ADMIN') return true;

    // Group admin can manage trust and below
    if (managerRole === 'GROUP_ADMIN') {
      const allowedRoles = [
        constants.USER_ROLES.TRUST_ADMIN,
        constants.USER_ROLES.SCHOOL_ADMIN,
        constants.USER_ROLES.TEACHER,
        constants.USER_ROLES.ACCOUNTANT,
        constants.USER_ROLES.PARENT,
        constants.USER_ROLES.STUDENT
      ];
      return allowedRoles.includes(newRole);
    }

    // Trust admin can manage school level and below
    if (managerRole === constants.USER_ROLES.TRUST_ADMIN) {
      const allowedRoles = [
        constants.USER_ROLES.SCHOOL_ADMIN,
        constants.USER_ROLES.TEACHER,
        constants.USER_ROLES.ACCOUNTANT,
        constants.USER_ROLES.PARENT,
        constants.USER_ROLES.STUDENT
      ];
      return allowedRoles.includes(newRole);
    }

    // School admin can manage operational roles
    if (managerRole === constants.USER_ROLES.SCHOOL_ADMIN) {
      const allowedRoles = [
        constants.USER_ROLES.TEACHER,
        constants.USER_ROLES.ACCOUNTANT,
        constants.USER_ROLES.PARENT,
        constants.USER_ROLES.STUDENT
      ];
      return allowedRoles.includes(newRole);
    }

    return false;
  }

  // Check permission by user ID (looks up user role and calls hasPermission)
  async checkPermission(userId, resource, action, context = {}) {
    try {
      // For now, get user role from the context or session
      // In a full implementation, this would query the database for the user's role
      const userRole = context.userRole || context.role;

      if (!userRole) {
        console.error('checkPermission: No user role found in context for userId:', userId);
        return false;
      }

      return this.hasPermission(userRole, resource, action, context);
    } catch (error) {
      console.error('Error in checkPermission:', error);
      return false;
    }
  }
}

module.exports = new RBACService();
