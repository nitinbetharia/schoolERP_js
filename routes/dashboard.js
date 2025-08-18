/**
 * Dashboard Routes
 * Role-based dashboard views
 */

const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errors');
const logger = require('../config/logger');
const database = require('../config/database');

const router = express.Router();

// Apply authentication to all dashboard routes
router.use(requireAuth);

/**
 * GET /dashboard - Main dashboard (role-based)
 */
router.get('/', asyncHandler(async (req, res) => {
  const { user } = req;
  
  logger.business('Dashboard access', 'dashboard', user.id, {
    role: user.role,
    schoolId: user.schoolId,
    trustId: user.trustId
  });

  try {
    let dashboardData = await getDashboardData(user);
    
    res.render('dashboard/index', {
      title: 'Dashboard',
      pageHeader: {
        title: `Welcome back, ${user.firstName}!`,
        description: getDashboardDescription(user.role)
      },
      user,
      data: dashboardData,
      stats: dashboardData.stats || {},
      recentActivities: dashboardData.recentActivities || [],
      quickActions: getQuickActions(user.role, user.permissions)
    });

  } catch (error) {
    logger.error('Dashboard data loading failed', {
      userId: user.id,
      role: user.role,
      error: error.message
    });
    
    // Show dashboard with error message instead of failing completely
    res.render('dashboard/index', {
      title: 'Dashboard',
      pageHeader: {
        title: `Welcome back, ${user.firstName}!`,
        description: getDashboardDescription(user.role)
      },
      user,
      data: { stats: {}, recentActivities: [] },
      error: 'Unable to load dashboard data. Please try again.',
      quickActions: getQuickActions(user.role, user.permissions)
    });
  }
}));

/**
 * GET /dashboard/stats - Dashboard statistics (API)
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const { user } = req;
  
  try {
    const stats = await getDashboardStats(user);
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Dashboard stats loading failed', {
      userId: user.id,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'STATS_LOAD_FAILED',
        message: 'Unable to load dashboard statistics'
      }
    });
  }
}));

/**
 * GET /dashboard/activities - Recent activities (API)
 */
router.get('/activities', asyncHandler(async (req, res) => {
  const { user } = req;
  const limit = parseInt(req.query.limit) || 10;
  
  try {
    const activities = await getRecentActivities(user, limit);
    
    res.json({
      success: true,
      data: activities
    });

  } catch (error) {
    logger.error('Recent activities loading failed', {
      userId: user.id,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'ACTIVITIES_LOAD_FAILED',
        message: 'Unable to load recent activities'
      }
    });
  }
}));

/**
 * System Admin Dashboard
 */
router.get('/system', requireRole('SYSTEM_ADMIN', 'GROUP_ADMIN'), asyncHandler(async (req, res) => {
  const { user } = req;
  
  try {
    const systemStats = await getSystemStats();
    
    res.render('dashboard/system', {
      title: 'System Administration',
      pageHeader: {
        title: 'System Dashboard',
        description: 'Manage the entire school ERP system'
      },
      user,
      stats: systemStats,
      quickActions: [
        { title: 'Manage Trusts', url: '/admin/trusts', icon: 'building' },
        { title: 'System Users', url: '/admin/users', icon: 'users' },
        { title: 'System Health', url: '/admin/health', icon: 'heart' },
        { title: 'Backup & Restore', url: '/admin/backup', icon: 'database' }
      ]
    });

  } catch (error) {
    logger.error('System dashboard failed', {
      userId: user.id,
      error: error.message
    });
    
    res.status(500).render('errors/500', {
      title: 'Dashboard Error',
      error: {
        message: 'Unable to load system dashboard'
      }
    });
  }
}));

/**
 * Get dashboard data based on user role
 */
async function getDashboardData(user) {
  const data = {
    stats: {},
    recentActivities: [],
    announcements: []
  };

  try {
    switch (user.role) {
      case 'SYSTEM_ADMIN':
      case 'GROUP_ADMIN':
        data.stats = await getSystemStats();
        data.recentActivities = await getSystemActivities();
        break;
        
      case 'TRUST_ADMIN':
        data.stats = await getTrustStats(user.trustId);
        data.recentActivities = await getTrustActivities(user.trustId);
        break;
        
      case 'SCHOOL_ADMIN':
        data.stats = await getSchoolStats(user.schoolId);
        data.recentActivities = await getSchoolActivities(user.schoolId);
        break;
        
      case 'TEACHER':
        data.stats = await getTeacherStats(user.id);
        data.recentActivities = await getTeacherActivities(user.id);
        break;
        
      case 'ACCOUNTANT':
        data.stats = await getAccountantStats(user.schoolId);
        data.recentActivities = await getAccountantActivities(user.schoolId);
        break;
        
      case 'PARENT':
        data.stats = await getParentStats(user.id);
        data.recentActivities = await getParentActivities(user.id);
        break;
        
      default:
        data.stats = { totalUsers: 0, totalSchools: 0 };
    }

    return data;

  } catch (error) {
    logger.error('Dashboard data fetch failed', {
      userId: user.id,
      role: user.role,
      error: error.message
    });
    
    return data; // Return empty data instead of throwing
  }
}

/**
 * Get system-level statistics
 */
async function getSystemStats() {
  const queries = [
    'SELECT COUNT(*) as total FROM trusts WHERE status = "active"',
    'SELECT COUNT(*) as total FROM schools WHERE status = "active"',
    'SELECT COUNT(*) as total FROM users WHERE status = "active"',
    'SELECT COUNT(*) as total FROM students WHERE status = "active"'
  ];

  const [trusts, schools, users, students] = await Promise.all(
    queries.map(query => database.query(query))
  );

  return {
    totalTrusts: trusts[0]?.total || 0,
    totalSchools: schools[0]?.total || 0,
    totalUsers: users[0]?.total || 0,
    totalStudents: students[0]?.total || 0
  };
}

/**
 * Get trust-level statistics
 */
async function getTrustStats(trustId) {
  const queries = [
    'SELECT COUNT(*) as total FROM schools WHERE trust_id = ? AND status = "active"',
    'SELECT COUNT(*) as total FROM users WHERE trust_id = ? AND status = "active"',
    'SELECT COUNT(*) as total FROM students WHERE trust_id = ? AND status = "active"',
    'SELECT SUM(amount) as total FROM fee_payments WHERE trust_id = ? AND MONTH(payment_date) = MONTH(CURDATE())'
  ];

  const params = [trustId, trustId, trustId, trustId];
  const [schools, users, students, monthlyFees] = await Promise.all(
    queries.map((query, index) => database.query(query, [params[index]]))
  );

  return {
    totalSchools: schools[0]?.total || 0,
    totalUsers: users[0]?.total || 0,
    totalStudents: students[0]?.total || 0,
    monthlyFeeCollection: monthlyFees[0]?.total || 0
  };
}

/**
 * Get school-level statistics
 */
async function getSchoolStats(schoolId) {
  const queries = [
    'SELECT COUNT(*) as total FROM students WHERE school_id = ? AND status = "active"',
    'SELECT COUNT(*) as total FROM users WHERE school_id = ? AND status = "active"',
    'SELECT SUM(amount) as total FROM fee_payments WHERE school_id = ? AND MONTH(payment_date) = MONTH(CURDATE())',
    'SELECT COUNT(*) as total FROM attendance WHERE school_id = ? AND date = CURDATE()'
  ];

  const params = [schoolId, schoolId, schoolId, schoolId];
  const [students, staff, monthlyFees, todayAttendance] = await Promise.all(
    queries.map((query, index) => database.query(query, [params[index]]))
  );

  return {
    totalStudents: students[0]?.total || 0,
    totalStaff: staff[0]?.total || 0,
    monthlyFeeCollection: monthlyFees[0]?.total || 0,
    todayAttendance: todayAttendance[0]?.total || 0
  };
}

/**
 * Get teacher-specific statistics
 */
async function getTeacherStats(teacherId) {
  // TODO: Implement teacher-specific stats
  return {
    assignedClasses: 0,
    totalStudents: 0,
    pendingAttendance: 0
  };
}

/**
 * Get accountant-specific statistics
 */
async function getAccountantStats(schoolId) {
  // TODO: Implement accountant-specific stats
  return {
    pendingPayments: 0,
    monthlyCollection: 0,
    overduePayments: 0
  };
}

/**
 * Get parent-specific statistics
 */
async function getParentStats(parentId) {
  // TODO: Implement parent-specific stats
  return {
    children: 0,
    pendingFees: 0,
    lastPayment: null
  };
}

/**
 * Get recent activities for dashboard
 */
async function getRecentActivities(user, limit = 10) {
  // TODO: Implement activity fetching based on user role
  return [];
}

async function getSystemActivities() { return []; }
async function getTrustActivities(trustId) { return []; }
async function getSchoolActivities(schoolId) { return []; }
async function getTeacherActivities(teacherId) { return []; }
async function getAccountantActivities(schoolId) { return []; }
async function getParentActivities(parentId) { return []; }

/**
 * Get dashboard statistics for API
 */
async function getDashboardStats(user) {
  return await getDashboardData(user);
}

/**
 * Get dashboard description based on role
 */
function getDashboardDescription(role) {
  const descriptions = {
    'SYSTEM_ADMIN': 'Manage the entire school ERP system',
    'GROUP_ADMIN': 'Manage multiple educational trusts',
    'TRUST_ADMIN': 'Manage all schools in your trust',
    'SCHOOL_ADMIN': 'Manage your school operations',
    'TEACHER': 'Manage your classes and students',
    'ACCOUNTANT': 'Manage fee collection and finances',
    'PARENT': 'Track your child\'s progress and payments'
  };
  
  return descriptions[role] || 'Manage your account';
}

/**
 * Get quick actions based on role and permissions
 */
function getQuickActions(role, permissions) {
  const baseActions = {
    'SYSTEM_ADMIN': [
      { title: 'Manage Trusts', url: '/admin/trusts', icon: 'building' },
      { title: 'System Health', url: '/admin/health', icon: 'heart' },
      { title: 'User Management', url: '/admin/users', icon: 'users' }
    ],
    'TRUST_ADMIN': [
      { title: 'Manage Schools', url: '/schools', icon: 'building' },
      { title: 'User Management', url: '/users', icon: 'users' },
      { title: 'Reports', url: '/reports', icon: 'chart-bar' }
    ],
    'SCHOOL_ADMIN': [
      { title: 'Student Management', url: '/students', icon: 'users' },
      { title: 'Fee Management', url: '/fees', icon: 'currency-rupee' },
      { title: 'Attendance', url: '/attendance', icon: 'check-circle' },
      { title: 'Reports', url: '/reports', icon: 'chart-bar' }
    ],
    'TEACHER': [
      { title: 'My Classes', url: '/classes', icon: 'academic-cap' },
      { title: 'Attendance', url: '/attendance', icon: 'check-circle' },
      { title: 'Student Reports', url: '/reports/students', icon: 'chart-bar' }
    ],
    'ACCOUNTANT': [
      { title: 'Fee Collection', url: '/fees/collect', icon: 'currency-rupee' },
      { title: 'Payment Reports', url: '/reports/payments', icon: 'chart-bar' },
      { title: 'Defaulters', url: '/fees/defaulters', icon: 'exclamation-triangle' }
    ],
    'PARENT': [
      { title: 'My Children', url: '/children', icon: 'users' },
      { title: 'Fee Payments', url: '/fees/pay', icon: 'currency-rupee' },
      { title: 'Attendance Report', url: '/reports/attendance', icon: 'check-circle' }
    ]
  };

  return baseActions[role] || [];
}

module.exports = router;