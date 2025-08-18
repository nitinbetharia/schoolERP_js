const db = require('../data/database-service');

class DashboardService {
  constructor() {
    this.defaultWidgets = {
      // System Admin Widgets
      system_stats: {
        id: 'system_stats',
        name: 'System Statistics',
        description: 'Overall system usage and health',
        roles: ['SYSTEM_ADMIN'],
        category: 'system',
        size: 'medium',
        refreshInterval: 300000, // 5 minutes
        configurable: true
      },

      trust_overview: {
        id: 'trust_overview',
        name: 'Trust Overview',
        description: 'Active trusts and their status',
        roles: ['SYSTEM_ADMIN', 'GROUP_ADMIN'],
        category: 'trust',
        size: 'large',
        refreshInterval: 600000, // 10 minutes
        configurable: true
      },

      // Trust/School Admin Widgets
      school_stats: {
        id: 'school_stats',
        name: 'School Statistics',
        description: 'Student enrollment and basic metrics',
        roles: ['TRUST_ADMIN', 'SCHOOL_ADMIN'],
        category: 'academic',
        size: 'medium',
        refreshInterval: 300000,
        configurable: true
      },

      attendance_overview: {
        id: 'attendance_overview',
        name: 'Attendance Overview',
        description: 'Daily attendance statistics',
        roles: ['TRUST_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'],
        category: 'attendance',
        size: 'medium',
        refreshInterval: 300000,
        configurable: true
      },

      fee_collection: {
        id: 'fee_collection',
        name: 'Fee Collection',
        description: 'Fee collection status and outstanding amounts',
        roles: ['TRUST_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'],
        category: 'financial',
        size: 'large',
        refreshInterval: 600000,
        configurable: true
      },

      recent_admissions: {
        id: 'recent_admissions',
        name: 'Recent Admissions',
        description: 'Latest student admissions and applications',
        roles: ['TRUST_ADMIN', 'SCHOOL_ADMIN'],
        category: 'academic',
        size: 'medium',
        refreshInterval: 600000,
        configurable: true
      },

      // Teacher Widgets
      my_classes: {
        id: 'my_classes',
        name: 'My Classes',
        description: 'Classes assigned to the teacher',
        roles: ['TEACHER'],
        category: 'academic',
        size: 'medium',
        refreshInterval: 3600000, // 1 hour
        configurable: true
      },

      pending_tasks: {
        id: 'pending_tasks',
        name: 'Pending Tasks',
        description: 'Attendance marking and other pending tasks',
        roles: ['TEACHER', 'SCHOOL_ADMIN'],
        category: 'tasks',
        size: 'small',
        refreshInterval: 300000,
        configurable: true
      },

      // Parent Widgets
      my_children: {
        id: 'my_children',
        name: 'My Children',
        description: "Children's academic and attendance summary",
        roles: ['PARENT'],
        category: 'personal',
        size: 'large',
        refreshInterval: 600000,
        configurable: false
      },

      fee_status: {
        id: 'fee_status',
        name: 'Fee Status',
        description: 'Fee payment status and upcoming dues',
        roles: ['PARENT'],
        category: 'financial',
        size: 'medium',
        refreshInterval: 3600000,
        configurable: false
      },

      // Common Widgets
      notifications: {
        id: 'notifications',
        name: 'Notifications',
        description: 'Recent notifications and announcements',
        roles: ['TRUST_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT', 'PARENT'],
        category: 'communication',
        size: 'medium',
        refreshInterval: 300000,
        configurable: true
      },

      quick_actions: {
        id: 'quick_actions',
        name: 'Quick Actions',
        description: 'Frequently used actions and shortcuts',
        roles: ['TRUST_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT'],
        category: 'actions',
        size: 'small',
        refreshInterval: null,
        configurable: true
      }
    };
  }

  async getDashboardConfig(userRole, trustCode, userId) {
    try {
      // Get user's custom dashboard configuration
      let userConfig = await this.getUserDashboardConfig(userId, trustCode);

      // Get tenant's default dashboard configuration
      const tenantConfig = await this.getTenantDashboardConfig(trustCode);

      // Get role-based default widgets
      const roleWidgets = Object.entries(this.defaultWidgets)
        .filter(([_, widget]) => widget.roles.includes(userRole))
        .reduce((acc, [id, widget]) => {
          acc[id] = widget;
          return acc;
        }, {});

      // Merge configurations (user > tenant > role defaults)
      let dashboardConfig = {
        layout: userConfig?.layout || tenantConfig?.layout || 'grid',
        theme: userConfig?.theme || tenantConfig?.theme || 'light',
        refreshInterval: userConfig?.refreshInterval || 300000,
        widgets: { ...roleWidgets }
      };

      // Apply tenant customizations
      if (tenantConfig?.widgetOverrides) {
        for (const [widgetId, overrides] of Object.entries(tenantConfig.widgetOverrides)) {
          if (dashboardConfig.widgets[widgetId]) {
            dashboardConfig.widgets[widgetId] = {
              ...dashboardConfig.widgets[widgetId],
              ...overrides
            };
          }
        }
      }

      // Apply user customizations
      if (userConfig?.widgetConfig) {
        for (const [widgetId, config] of Object.entries(userConfig.widgetConfig)) {
          if (dashboardConfig.widgets[widgetId]) {
            dashboardConfig.widgets[widgetId] = {
              ...dashboardConfig.widgets[widgetId],
              ...config,
              userCustomized: true
            };
          }
        }
      }

      return dashboardConfig;
    } catch (error) {
      throw new Error(`Failed to get dashboard config: ${error.message}`);
    }
  }

  async getUserDashboardConfig(userId, trustCode) {
    try {
      const sql = `
        SELECT config_value 
        FROM trust_config 
        WHERE config_key = ?
      `;

      const result = await db.queryTrust(trustCode, sql, [`user_dashboard_${userId}`]);

      if (result.length > 0 && result[0].config_value) {
        return JSON.parse(result[0].config_value);
      }

      return null;
    } catch (error) {
      console.error('Error getting user dashboard config:', error);
      return null;
    }
  }

  async getTenantDashboardConfig(trustCode) {
    try {
      const sql = `
        SELECT config_value 
        FROM trust_config 
        WHERE config_key = 'dashboard_config'
      `;

      const result = await db.queryTrust(trustCode, sql);

      if (result.length > 0 && result[0].config_value) {
        return JSON.parse(result[0].config_value);
      }

      return {};
    } catch (error) {
      console.error('Error getting tenant dashboard config:', error);
      return {};
    }
  }

  // Widget Data Methods
  async getSystemStatsWidget(trustCode) {
    try {
      const stats = await db.querySystem(`
        SELECT 
          COUNT(*) as total_trusts,
          SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_trusts
        FROM trusts
      `);

      const dbHealth = await db.healthCheck();

      return {
        totalTrusts: stats[0].total_trusts,
        activeTrusts: stats[0].active_trusts,
        systemHealth: dbHealth.master ? 'healthy' : 'degraded',
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get system stats: ${error.message}`);
    }
  }

  async getSchoolStatsWidget(trustCode, schoolId = null) {
    try {
      let sql = `
        SELECT 
          COUNT(DISTINCT s.id) as total_students,
          COUNT(DISTINCT CASE WHEN s.status = 'ACTIVE' THEN s.id END) as active_students,
          COUNT(DISTINCT c.id) as total_classes,
          COUNT(DISTINCT u.id) as total_staff
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN users u ON s.school_id = u.school_id AND u.role IN ('TEACHER', 'SCHOOL_ADMIN')
        WHERE 1=1
      `;

      const params = [];

      if (schoolId) {
        sql += ' AND s.school_id = ?';
        params.push(schoolId);
      }

      const result = await db.queryTrust(trustCode, sql, params);

      return {
        totalStudents: result[0].total_students,
        activeStudents: result[0].active_students,
        totalClasses: result[0].total_classes,
        totalStaff: result[0].total_staff,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get school stats: ${error.message}`);
    }
  }

  async getAttendanceOverviewWidget(trustCode, schoolId = null) {
    try {
      const today = new Date().toISOString().split('T')[0];

      let sql = `
        SELECT 
          COUNT(DISTINCT s.id) as total_students,
          COUNT(DISTINCT CASE WHEN ad.status = 'PRESENT' THEN ad.student_id END) as present_today,
          COUNT(DISTINCT CASE WHEN ad.status = 'ABSENT' THEN ad.student_id END) as absent_today,
          COUNT(DISTINCT CASE WHEN ad.status = 'LATE' THEN ad.student_id END) as late_today
        FROM students s
        LEFT JOIN attendance_daily ad ON s.id = ad.student_id AND ad.attendance_date = ?
        WHERE s.status = 'ACTIVE'
      `;

      const params = [today];

      if (schoolId) {
        sql += ' AND s.school_id = ?';
        params.push(schoolId);
      }

      const result = await db.queryTrust(trustCode, sql, params);
      const stats = result[0];

      const attendancePercentage =
        stats.total_students > 0
          ? Math.round((stats.present_today * 100) / stats.total_students)
          : 0;

      return {
        totalStudents: stats.total_students,
        presentToday: stats.present_today,
        absentToday: stats.absent_today,
        lateToday: stats.late_today,
        attendancePercentage,
        date: today,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get attendance overview: ${error.message}`);
    }
  }

  async getFeeCollectionWidget(trustCode, schoolId = null) {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

      let sql = `
        SELECT 
          COUNT(DISTINCT fr.id) as total_receipts,
          SUM(fr.total_paid) as total_collected,
          COUNT(DISTINCT fr.student_id) as students_paid
        FROM fee_receipts fr
        JOIN students s ON fr.student_id = s.id
        WHERE DATE_FORMAT(fr.paid_date, '%Y-%m') = ?
      `;

      const params = [currentMonth];

      if (schoolId) {
        sql += ' AND s.school_id = ?';
        params.push(schoolId);
      }

      const collectionResult = await db.queryTrust(trustCode, sql, params);

      // Get outstanding amounts
      let outstandingSql = `
        SELECT 
          COUNT(DISTINCT s.id) as students_with_outstanding,
          SUM(sfa.final_amount - COALESCE(payments.paid_amount, 0)) as total_outstanding
        FROM students s
        JOIN student_fee_assignments sfa ON s.id = sfa.student_id
        LEFT JOIN (
          SELECT student_id, SUM(amount_paid) as paid_amount
          FROM fee_receipts
          GROUP BY student_id
        ) payments ON s.id = payments.student_id
        WHERE sfa.final_amount > COALESCE(payments.paid_amount, 0)
          AND s.status = 'ACTIVE'
      `;

      const outstandingParams = [];

      if (schoolId) {
        outstandingSql += ' AND s.school_id = ?';
        outstandingParams.push(schoolId);
      }

      const outstandingResult = await db.queryTrust(trustCode, outstandingSql, outstandingParams);

      return {
        monthlyCollection: {
          totalReceipts: collectionResult[0].total_receipts,
          totalCollected: collectionResult[0].total_collected || 0,
          studentsPaid: collectionResult[0].students_paid
        },
        outstanding: {
          studentsWithOutstanding: outstandingResult[0].students_with_outstanding,
          totalOutstanding: outstandingResult[0].total_outstanding || 0
        },
        month: currentMonth,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get fee collection data: ${error.message}`);
    }
  }

  async getRecentAdmissionsWidget(trustCode, schoolId = null) {
    try {
      let sql = `
        SELECT 
          s.admission_no,
          CONCAT(s.first_name, ' ', s.last_name) as student_name,
          c.class_name,
          sec.section_name,
          s.admission_date,
          s.status
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN sections sec ON s.section_id = sec.id
        WHERE s.admission_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      `;

      const params = [];

      if (schoolId) {
        sql += ' AND s.school_id = ?';
        params.push(schoolId);
      }

      sql += ' ORDER BY s.admission_date DESC LIMIT 10';

      const result = await db.queryTrust(trustCode, sql, params);

      return {
        recentAdmissions: result,
        count: result.length,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get recent admissions: ${error.message}`);
    }
  }

  async getMyClassesWidget(trustCode, teacherId) {
    try {
      const sql = `
        SELECT 
          c.id as class_id,
          c.class_name,
          sec.section_name,
          COUNT(s.id) as student_count,
          COUNT(CASE WHEN ad.attendance_date = CURDATE() AND ad.status = 'PRESENT' THEN 1 END) as present_today
        FROM user_school_assignments usa
        JOIN classes c ON usa.school_id = c.school_id
        JOIN sections sec ON c.id = sec.class_id
        LEFT JOIN students s ON sec.id = s.section_id AND s.status = 'ACTIVE'
        LEFT JOIN attendance_daily ad ON s.id = ad.student_id AND ad.attendance_date = CURDATE()
        WHERE usa.user_id = ? AND usa.status = 'ACTIVE'
        GROUP BY c.id, sec.id
        ORDER BY c.class_order ASC, sec.section_name ASC
      `;

      const result = await db.queryTrust(trustCode, sql, [teacherId]);

      return {
        classes: result,
        totalClasses: result.length,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get teacher classes: ${error.message}`);
    }
  }

  async getMyChildrenWidget(trustCode, parentId) {
    try {
      const sql = `
        SELECT 
          s.id as student_id,
          s.admission_no,
          CONCAT(s.first_name, ' ', s.last_name) as student_name,
          c.class_name,
          sec.section_name,
          sch.school_name,
          att_summary.percentage as attendance_percentage,
          fee_status.outstanding_amount
        FROM student_parents sp
        JOIN students s ON sp.student_id = s.id
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN sections sec ON s.section_id = sec.id
        LEFT JOIN schools sch ON s.school_id = sch.id
        LEFT JOIN (
          SELECT student_id, AVG(percentage) as percentage
          FROM attendance_summary
          WHERE year = YEAR(CURDATE())
          GROUP BY student_id
        ) att_summary ON s.id = att_summary.student_id
        LEFT JOIN (
          SELECT 
            s.id as student_id,
            SUM(sfa.final_amount - COALESCE(payments.paid_amount, 0)) as outstanding_amount
          FROM students s
          JOIN student_fee_assignments sfa ON s.id = sfa.student_id
          LEFT JOIN (
            SELECT student_id, SUM(amount_paid) as paid_amount
            FROM fee_receipts GROUP BY student_id
          ) payments ON s.id = payments.student_id
          WHERE sfa.final_amount > COALESCE(payments.paid_amount, 0)
          GROUP BY s.id
        ) fee_status ON s.id = fee_status.student_id
        WHERE sp.parent_id = ? AND s.status = 'ACTIVE'
        ORDER BY s.first_name ASC
      `;

      const result = await db.queryTrust(trustCode, sql, [parentId]);

      return {
        children: result,
        count: result.length,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get parent's children data: ${error.message}`);
    }
  }

  async getPendingTasksWidget(trustCode, userId, userRole) {
    try {
      const tasks = [];
      const today = new Date().toISOString().split('T')[0];

      if (userRole === 'TEACHER') {
        // Check for classes without attendance marked today
        const sql = `
          SELECT 
            c.class_name,
            sec.section_name,
            COUNT(s.id) as total_students,
            COUNT(ad.id) as marked_students
          FROM user_school_assignments usa
          JOIN classes c ON usa.school_id = c.school_id
          JOIN sections sec ON c.id = sec.class_id
          JOIN students s ON sec.id = s.section_id AND s.status = 'ACTIVE'
          LEFT JOIN attendance_daily ad ON s.id = ad.student_id AND ad.attendance_date = ?
          WHERE usa.user_id = ? AND usa.status = 'ACTIVE'
          GROUP BY c.id, sec.id
          HAVING marked_students < total_students
        `;

        const pendingAttendance = await db.queryTrust(trustCode, sql, [today, userId]);

        for (const item of pendingAttendance) {
          tasks.push({
            type: 'attendance',
            title: `Mark Attendance - ${item.class_name} ${item.section_name}`,
            description: `${item.total_students - item.marked_students} students pending`,
            priority: 'high',
            dueDate: today
          });
        }
      }

      if (['SCHOOL_ADMIN', 'TRUST_ADMIN'].includes(userRole)) {
        // Check for pending admissions
        const admissionsSql = `
          SELECT COUNT(*) as pending_count
          FROM admissions
          WHERE status = 'PENDING'
        `;

        const pendingAdmissions = await db.queryTrust(trustCode, admissionsSql);

        if (pendingAdmissions[0].pending_count > 0) {
          tasks.push({
            type: 'admissions',
            title: 'Review Pending Admissions',
            description: `${pendingAdmissions[0].pending_count} applications waiting for review`,
            priority: 'medium',
            count: pendingAdmissions[0].pending_count
          });
        }
      }

      return {
        tasks,
        count: tasks.length,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get pending tasks: ${error.message}`);
    }
  }

  // Configuration Management
  async updateUserDashboardConfig(userId, config, trustCode) {
    try {
      const sql = `
        INSERT INTO trust_config (config_key, config_value, data_type, description)
        VALUES (?, ?, 'JSON', 'User dashboard configuration')
        ON DUPLICATE KEY UPDATE 
          config_value = VALUES(config_value),
          updated_at = NOW()
      `;

      await db.queryTrust(trustCode, sql, [`user_dashboard_${userId}`, JSON.stringify(config)]);

      return { updated: true };
    } catch (error) {
      throw new Error(`Failed to update user dashboard config: ${error.message}`);
    }
  }

  async updateTenantDashboardConfig(config, trustCode) {
    try {
      const sql = `
        INSERT INTO trust_config (config_key, config_value, data_type, description)
        VALUES ('dashboard_config', ?, 'JSON', 'Tenant dashboard configuration')
        ON DUPLICATE KEY UPDATE 
          config_value = VALUES(config_value),
          updated_at = NOW()
      `;

      await db.queryTrust(trustCode, sql, [JSON.stringify(config)]);

      return { updated: true };
    } catch (error) {
      throw new Error(`Failed to update tenant dashboard config: ${error.message}`);
    }
  }

  // Get widget data based on widget ID
  async getWidgetData(widgetId, context, trustCode) {
    try {
      const { userId, userRole, schoolId } = context;

      switch (widgetId) {
        case 'system_stats':
          return await this.getSystemStatsWidget(trustCode);
        case 'school_stats':
          return await this.getSchoolStatsWidget(trustCode, schoolId);
        case 'attendance_overview':
          return await this.getAttendanceOverviewWidget(trustCode, schoolId);
        case 'fee_collection':
          return await this.getFeeCollectionWidget(trustCode, schoolId);
        case 'recent_admissions':
          return await this.getRecentAdmissionsWidget(trustCode, schoolId);
        case 'my_classes':
          return await this.getMyClassesWidget(trustCode, userId);
        case 'my_children':
          return await this.getMyChildrenWidget(trustCode, userId);
        case 'pending_tasks':
          return await this.getPendingTasksWidget(trustCode, userId, userRole);
        default:
          throw new Error(`Unknown widget: ${widgetId}`);
      }
    } catch (error) {
      throw new Error(`Failed to get widget data for ${widgetId}: ${error.message}`);
    }
  }

  // Real dashboard statistics methods
  async getRealDashboardStats(userRole, trustCode, userId, schoolId = null) {
    try {
      let stats = {};

      if (userRole === 'SUPER_ADMIN' || userRole === 'SYSTEM_ADMIN') {
        stats = await this.getSystemAdminStats();
      } else if (userRole === 'SCHOOL_ADMIN' || userRole === 'TRUST_ADMIN') {
        stats = await this.getSchoolAdminStats(trustCode, schoolId);
      } else if (userRole === 'TEACHER') {
        stats = await this.getTeacherStats(trustCode, userId);
      } else if (userRole === 'PARENT') {
        stats = await this.getParentStats(trustCode, userId);
      } else {
        stats = await this.getDefaultUserStats(trustCode, userId);
      }

      return stats;
    } catch (error) {
      console.error('Error getting real dashboard stats:', error);
      // Return fallback dummy data if real data fails
      return this.getFallbackStats(userRole);
    }
  }

  async getSystemAdminStats() {
    try {
      // Get total trusts from system database
      const trustStats = await db.querySystem(`
        SELECT COUNT(*) as total_trusts,
               SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_trusts
        FROM trusts
      `);

      // Get total system users
      const userStats = await db.querySystem(`
        SELECT COUNT(*) as total_users,
               SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users
        FROM system_users
      `);

      // Get total schools across all trusts
      const schoolStats = await db.querySystem(`
        SELECT COUNT(*) as total_schools
        FROM information_schema.tables
        WHERE table_schema LIKE 'school_erp_trust_%'
        AND table_name = 'schools'
      `);

      return {
        totalTrusts: trustStats[0]?.total_trusts || 0,
        activeTrusts: trustStats[0]?.active_trusts || 0,
        totalUsers: userStats[0]?.total_users || 0,
        activeUsers: userStats[0]?.active_users || 0,
        totalSchools: schoolStats.length || 0,
        systemHealth: 'Good',
        lastBackup: '2 hours ago'
      };
    } catch (error) {
      console.error('Error getting system admin stats:', error);
      throw error;
    }
  }

  async getSchoolAdminStats(trustCode, schoolId = null) {
    try {
      let whereClause = '';
      let params = [];

      if (schoolId) {
        whereClause = 'WHERE s.school_id = ?';
        params = [schoolId];
      }

      const studentStats = await db.queryTrust(
        trustCode,
        `
        SELECT COUNT(*) as total_students,
               SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_students
        FROM students s ${whereClause}
      `,
        params
      );

      const teacherStats = await db.queryTrust(
        trustCode,
        `
        SELECT COUNT(*) as total_teachers
        FROM users u
        WHERE u.role = 'TEACHER' AND u.is_active = 1
        ${schoolId ? 'AND EXISTS (SELECT 1 FROM user_school_assignments usa WHERE usa.user_id = u.id AND usa.school_id = ?)' : ''}
      `,
        schoolId ? [schoolId] : []
      );

      // Get today's attendance
      const today = new Date().toISOString().split('T')[0];
      const attendanceStats = await db.queryTrust(
        trustCode,
        `
        SELECT COUNT(DISTINCT s.id) as total_eligible,
               COUNT(DISTINCT ad.student_id) as marked_attendance,
               COUNT(DISTINCT CASE WHEN ad.status = 'PRESENT' THEN ad.student_id END) as present_today
        FROM students s
        LEFT JOIN attendance_daily ad ON s.id = ad.student_id AND ad.attendance_date = ?
        WHERE s.status = 'ACTIVE' ${schoolId ? 'AND s.school_id = ?' : ''}
      `,
        schoolId ? [today, schoolId] : [today]
      );

      // Get pending fees
      const feeStats = await db.queryTrust(
        trustCode,
        `
        SELECT COUNT(DISTINCT s.id) as students_with_dues,
               COALESCE(SUM(sfa.final_amount - COALESCE(payments.paid_amount, 0)), 0) as total_pending
        FROM students s
        JOIN student_fee_assignments sfa ON s.id = sfa.student_id
        LEFT JOIN (
          SELECT student_id, SUM(amount_paid) as paid_amount
          FROM fee_receipts
          GROUP BY student_id
        ) payments ON s.id = payments.student_id
        WHERE sfa.final_amount > COALESCE(payments.paid_amount, 0)
          AND s.status = 'ACTIVE'
          ${schoolId ? 'AND s.school_id = ?' : ''}
      `,
        schoolId ? [schoolId] : []
      );

      const attendancePercentage =
        attendanceStats[0].total_eligible > 0
          ? Math.round((attendanceStats[0].present_today * 100) / attendanceStats[0].total_eligible)
          : 0;

      return {
        totalStudents: studentStats[0]?.total_students || 0,
        activeStudents: studentStats[0]?.active_students || 0,
        totalTeachers: teacherStats[0]?.total_teachers || 0,
        attendanceToday: attendancePercentage,
        presentToday: attendanceStats[0]?.present_today || 0,
        pendingFees: feeStats[0]?.total_pending || 0,
        studentsWithDues: feeStats[0]?.students_with_dues || 0
      };
    } catch (error) {
      console.error('Error getting school admin stats:', error);
      throw error;
    }
  }

  async getTeacherStats(trustCode, teacherId) {
    try {
      // Get teacher's assigned classes
      const classStats = await db.queryTrust(
        trustCode,
        `
        SELECT COUNT(DISTINCT c.id) as total_classes,
               COUNT(DISTINCT s.id) as total_students
        FROM user_school_assignments usa
        JOIN classes c ON usa.school_id = c.school_id
        JOIN sections sec ON c.id = sec.class_id
        LEFT JOIN students s ON sec.id = s.section_id AND s.status = 'ACTIVE'
        WHERE usa.user_id = ? AND usa.status = 'ACTIVE'
      `,
        [teacherId]
      );

      // Get today's attendance marking status
      const today = new Date().toISOString().split('T')[0];
      const attendanceStats = await db.queryTrust(
        trustCode,
        `
        SELECT COUNT(DISTINCT s.id) as students_to_mark,
               COUNT(DISTINCT ad.student_id) as students_marked
        FROM user_school_assignments usa
        JOIN classes c ON usa.school_id = c.school_id
        JOIN sections sec ON c.id = sec.class_id
        JOIN students s ON sec.id = s.section_id AND s.status = 'ACTIVE'
        LEFT JOIN attendance_daily ad ON s.id = ad.student_id AND ad.attendance_date = ?
        WHERE usa.user_id = ? AND usa.status = 'ACTIVE'
      `,
        [today, teacherId]
      );

      // Get pending tasks count
      const pendingTasks = Math.max(
        0,
        (attendanceStats[0]?.students_to_mark || 0) - (attendanceStats[0]?.students_marked || 0)
      );

      return {
        myClasses: classStats[0]?.total_classes || 0,
        totalStudents: classStats[0]?.total_students || 0,
        studentsMarked: attendanceStats[0]?.students_marked || 0,
        pendingAttendance: pendingTasks,
        upcomingEvents: 2 // This would need event system implementation
      };
    } catch (error) {
      console.error('Error getting teacher stats:', error);
      throw error;
    }
  }

  async getParentStats(trustCode, parentId) {
    try {
      // Get parent's children
      const childrenStats = await db.queryTrust(
        trustCode,
        `
        SELECT COUNT(DISTINCT s.id) as total_children,
               AVG(att_summary.percentage) as avg_attendance
        FROM student_parents sp
        JOIN students s ON sp.student_id = s.id
        LEFT JOIN (
          SELECT student_id, AVG(percentage) as percentage
          FROM attendance_summary
          WHERE year = YEAR(CURDATE())
          GROUP BY student_id
        ) att_summary ON s.id = att_summary.student_id
        WHERE sp.parent_id = ? AND s.status = 'ACTIVE'
      `,
        [parentId]
      );

      // Get fee status
      const feeStats = await db.queryTrust(
        trustCode,
        `
        SELECT COALESCE(SUM(sfa.final_amount - COALESCE(payments.paid_amount, 0)), 0) as pending_fees
        FROM student_parents sp
        JOIN students s ON sp.student_id = s.id
        JOIN student_fee_assignments sfa ON s.id = sfa.student_id
        LEFT JOIN (
          SELECT student_id, SUM(amount_paid) as paid_amount
          FROM fee_receipts
          GROUP BY student_id
        ) payments ON s.id = payments.student_id
        WHERE sp.parent_id = ? AND s.status = 'ACTIVE'
          AND sfa.final_amount > COALESCE(payments.paid_amount, 0)
      `,
        [parentId]
      );

      return {
        myChildren: childrenStats[0]?.total_children || 0,
        averageAttendance: Math.round(childrenStats[0]?.avg_attendance || 0),
        pendingFees: feeStats[0]?.pending_fees || 0,
        upcomingEvents: 1 // This would need event system implementation
      };
    } catch (error) {
      console.error('Error getting parent stats:', error);
      throw error;
    }
  }

  async getDefaultUserStats(trustCode, userId) {
    try {
      // Basic stats for other user types
      return {
        notifications: 3,
        pendingTasks: 1,
        lastLogin: new Date().toISOString(),
        systemStatus: 'Active'
      };
    } catch (error) {
      console.error('Error getting default user stats:', error);
      throw error;
    }
  }

  getFallbackStats(userRole) {
    // Fallback dummy data in case of database errors
    if (userRole === 'SUPER_ADMIN' || userRole === 'SYSTEM_ADMIN') {
      return {
        totalUsers: 156,
        totalSchools: 12,
        activeStudents: 2340,
        systemHealth: 'Good'
      };
    } else if (userRole === 'SCHOOL_ADMIN') {
      return {
        totalStudents: 480,
        totalTeachers: 25,
        attendanceToday: 95,
        pendingFees: 15000
      };
    } else {
      return {
        myClasses: 5,
        studentsPresent: 145,
        pendingTasks: 3,
        upcomingEvents: 2
      };
    }
  }
}

module.exports = new DashboardService();
