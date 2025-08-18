/**
 * Enhanced Reports API Routes
 * Advanced reporting endpoints with dynamic builders, analytics, and automation
 */

const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../../middleware/auth-middleware');
const { validateInput } = require('../../middleware/validation-middleware');
const { ValidationError, NotFoundError } = require('../../middleware/errors');
const EnhancedReportsService = require('../../modules/reports/enhanced-reports-service');
const logger = require('../../config/logger');

// Initialize service
const dbConfig = require('../../config/database');
const reportsService = new EnhancedReportsService(dbConfig);

// Validation schemas
const reportConfigSchema = {
  type: 'object',
  required: ['name', 'tables', 'fields'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 255 },
    description: { type: 'string', maxLength: 1000 },
    tables: {
      type: 'object',
      required: ['main'],
      properties: {
        main: { type: 'string' }
      }
    },
    fields: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['table', 'column'],
        properties: {
          table: { type: 'string' },
          column: { type: 'string' },
          alias: { type: 'string' },
          aggregate: { type: 'string', enum: ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'] }
        }
      }
    },
    joins: {
      type: 'array',
      items: {
        type: 'object',
        required: ['type', 'table', 'condition'],
        properties: {
          type: { type: 'string', enum: ['LEFT', 'RIGHT', 'INNER', 'OUTER'] },
          table: { type: 'string' },
          condition: { type: 'string' }
        }
      }
    },
    filters: {
      type: 'array',
      items: {
        type: 'object',
        required: ['field', 'operator'],
        properties: {
          field: { type: 'string' },
          operator: {
            type: 'string',
            enum: [
              'equals',
              'not_equals',
              'contains',
              'starts_with',
              'ends_with',
              'greater_than',
              'less_than',
              'between',
              'in',
              'is_null',
              'is_not_null'
            ]
          },
          value: {}
        }
      }
    },
    groupBy: { type: 'array', items: { type: 'string' } },
    orderBy: {
      type: 'array',
      items: {
        type: 'object',
        required: ['field'],
        properties: {
          field: { type: 'string' },
          direction: { type: 'string', enum: ['ASC', 'DESC'] }
        }
      }
    },
    chartConfig: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['bar', 'line', 'pie', 'doughnut', 'scatter', 'area'] },
        labelField: { type: 'string' },
        valueField: { type: 'string' },
        dataFields: { type: 'array' }
      }
    },
    permissions: {
      type: 'object',
      properties: {
        roles: { type: 'array', items: { type: 'string' } },
        users: { type: 'array', items: { type: 'string' } }
      }
    }
  }
};

const scheduleConfigSchema = {
  type: 'object',
  required: ['reportId', 'schedule', 'recipients', 'name'],
  properties: {
    reportId: { type: 'integer', minimum: 1 },
    schedule: { type: 'string' }, // cron expression
    recipients: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
          name: { type: 'string' }
        }
      }
    },
    format: { type: 'string', enum: ['excel', 'pdf'] },
    name: { type: 'string', minLength: 1, maxLength: 255 },
    parameters: { type: 'object' }
  }
};

/**
 * Report Builder Routes
 */

// GET /api/reports/builder/tables - Get available tables
router.get(
  '/builder/tables',
  requireAuth,
  requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  async (req, res) => {
    try {
      // Get database schema information
      const connection = await reportsService.getConnection();

      const [tables] = await connection.execute(`
            SELECT 
                TABLE_NAME as name,
                TABLE_COMMENT as description
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        `);

      await connection.end();

      res.json({
        success: true,
        tables
      });
    } catch (error) {
      logger.error('Error getting tables:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get tables'
      });
    }
  }
);

// GET /api/reports/builder/tables/:tableName/columns - Get table columns
router.get(
  '/builder/tables/:tableName/columns',
  requireAuth,
  requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  async (req, res) => {
    try {
      const { tableName } = req.params;

      const connection = await reportsService.getConnection();

      const [columns] = await connection.execute(
        `
            SELECT 
                COLUMN_NAME as name,
                DATA_TYPE as type,
                IS_NULLABLE as nullable,
                COLUMN_DEFAULT as defaultValue,
                COLUMN_COMMENT as description
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION
        `,
        [tableName]
      );

      await connection.end();

      res.json({
        success: true,
        columns
      });
    } catch (error) {
      logger.error('Error getting columns:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get columns'
      });
    }
  }
);

// POST /api/reports/builder/build - Build custom report
router.post(
  '/builder/build',
  requireAuth,
  requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  validateInput(reportConfigSchema),
  async (req, res) => {
    try {
      const reportConfig = {
        ...req.body,
        createdBy: req.user.username
      };

      const result = await reportsService.buildCustomReport(reportConfig);

      res.json(result);
    } catch (error) {
      logger.error('Error building report:', error);
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to build report'
        });
      }
    }
  }
);

/**
 * Report Execution Routes
 */

// POST /api/reports/:reportId/execute - Execute report
router.post('/:reportId/execute', requireAuth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const parameters = {
      ...req.body,
      executedBy: req.user.username
    };

    const result = await reportsService.executeReport(parseInt(reportId), parameters);

    res.json(result);
  } catch (error) {
    logger.error('Error executing report:', error);
    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to execute report'
      });
    }
  }
});

// GET /api/reports/:reportId/chart/:chartType - Generate chart data
router.get('/:reportId/chart/:chartType', requireAuth, async (req, res) => {
  try {
    const { reportId, chartType } = req.params;

    const chartData = await reportsService.generateChartData(parseInt(reportId), chartType);

    res.json({
      success: true,
      chartData
    });
  } catch (error) {
    logger.error('Error generating chart data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate chart data'
    });
  }
});

/**
 * Export Routes
 */

// GET /api/reports/:reportId/export/excel - Export to Excel
router.get('/:reportId/export/excel', requireAuth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const parameters = req.query;

    const result = await reportsService.exportToExcel(parseInt(reportId), parameters);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  } catch (error) {
    logger.error('Error exporting to Excel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export to Excel'
    });
  }
});

// GET /api/reports/:reportId/export/pdf - Export to PDF
router.get('/:reportId/export/pdf', requireAuth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const parameters = req.query;

    const result = await reportsService.exportToPDF(parseInt(reportId), parameters);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  } catch (error) {
    logger.error('Error exporting to PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export to PDF'
    });
  }
});

/**
 * Scheduled Reports Routes
 */

// POST /api/reports/schedules - Create scheduled report
router.post(
  '/schedules',
  requireAuth,
  requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  validateInput(scheduleConfigSchema),
  async (req, res) => {
    try {
      const scheduleConfig = {
        ...req.body,
        createdBy: req.user.username
      };

      const result = await reportsService.scheduleReport(scheduleConfig);

      res.json(result);
    } catch (error) {
      logger.error('Error scheduling report:', error);
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to schedule report'
        });
      }
    }
  }
);

// GET /api/reports/schedules - Get scheduled reports
router.get(
  '/schedules',
  requireAuth,
  requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  async (req, res) => {
    try {
      const connection = await reportsService.getConnection();

      const [schedules] = await connection.execute(`
            SELECT 
                rs.*,
                r.name as report_name,
                (SELECT COUNT(*) FROM scheduled_report_executions sre WHERE sre.schedule_id = rs.id) as execution_count
            FROM report_schedules rs
            JOIN reports r ON rs.report_id = r.id
            WHERE rs.status = 'active'
            ORDER BY rs.created_at DESC
        `);

      await connection.end();

      const schedulesWithRecipients = schedules.map(schedule => ({
        ...schedule,
        recipients: JSON.parse(schedule.recipients),
        parameters: schedule.parameters ? JSON.parse(schedule.parameters) : null
      }));

      res.json({
        success: true,
        schedules: schedulesWithRecipients
      });
    } catch (error) {
      logger.error('Error getting scheduled reports:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get scheduled reports'
      });
    }
  }
);

// DELETE /api/reports/schedules/:scheduleId - Delete scheduled report
router.delete(
  '/schedules/:scheduleId',
  requireAuth,
  requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  async (req, res) => {
    try {
      const { scheduleId } = req.params;

      const connection = await reportsService.getConnection();

      await connection.execute('UPDATE report_schedules SET status = "inactive" WHERE id = ?', [
        scheduleId
      ]);

      await connection.end();

      // Stop the cron job
      if (reportsService.scheduledReports.has(parseInt(scheduleId))) {
        const task = reportsService.scheduledReports.get(parseInt(scheduleId));
        task.stop();
        reportsService.scheduledReports.delete(parseInt(scheduleId));
      }

      res.json({
        success: true,
        message: 'Scheduled report deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting scheduled report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete scheduled report'
      });
    }
  }
);

/**
 * Report Templates Routes
 */

// GET /api/reports/templates - Get report templates
router.get('/templates', requireAuth, async (req, res) => {
  try {
    const { category } = req.query;

    const templates = await reportsService.getReportTemplates(category);

    res.json({
      success: true,
      templates
    });
  } catch (error) {
    logger.error('Error getting report templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get report templates'
    });
  }
});

// POST /api/reports/templates - Create report template
router.post(
  '/templates',
  requireAuth,
  requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  async (req, res) => {
    try {
      const templateConfig = {
        ...req.body,
        createdBy: req.user.username
      };

      const result = await reportsService.createReportTemplate(templateConfig);

      res.json(result);
    } catch (error) {
      logger.error('Error creating report template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create report template'
      });
    }
  }
);

// POST /api/reports/templates/:templateId/use - Create report from template
router.post('/templates/:templateId/use', requireAuth, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { name, customizations } = req.body;

    const connection = await reportsService.getConnection();

    // Get template
    const [templateRows] = await connection.execute(
      'SELECT * FROM report_templates WHERE id = ? AND status = "active"',
      [templateId]
    );

    if (templateRows.length === 0) {
      throw new NotFoundError('Template not found');
    }

    const template = templateRows[0];
    let config = JSON.parse(template.config);

    // Apply customizations
    if (customizations) {
      config = { ...config, ...customizations };
    }

    // Create report from template
    const reportConfig = {
      name: name || `${template.name} - ${new Date().toLocaleDateString()}`,
      description: `Created from template: ${template.name}`,
      ...config,
      createdBy: req.user.username
    };

    // Update template usage count
    await connection.execute(
      'UPDATE report_templates SET usage_count = usage_count + 1 WHERE id = ?',
      [templateId]
    );

    await connection.end();

    const result = await reportsService.buildCustomReport(reportConfig);

    res.json(result);
  } catch (error) {
    logger.error('Error creating report from template:', error);
    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create report from template'
      });
    }
  }
});

/**
 * Analytics Routes
 */

// GET /api/reports/:reportId/analytics - Get report analytics
router.get(
  '/:reportId/analytics',
  requireAuth,
  requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  async (req, res) => {
    try {
      const { reportId } = req.params;
      const { start_date, end_date } = req.query;

      let dateRange = null;
      if (start_date && end_date) {
        dateRange = { start: start_date, end: end_date };
      }

      const analytics = await reportsService.getReportAnalytics(parseInt(reportId), dateRange);

      res.json({
        success: true,
        analytics
      });
    } catch (error) {
      logger.error('Error getting report analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get report analytics'
      });
    }
  }
);

// GET /api/reports/analytics/overview - Get overall reports analytics
router.get(
  '/analytics/overview',
  requireAuth,
  requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  async (req, res) => {
    try {
      const connection = await reportsService.getConnection();

      // Overall statistics
      const [stats] = await connection.execute(`
            SELECT 
                (SELECT COUNT(*) FROM reports WHERE status = 'active') as total_reports,
                (SELECT COUNT(*) FROM report_executions WHERE executed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as executions_last_30_days,
                (SELECT COUNT(*) FROM report_schedules WHERE status = 'active') as active_schedules,
                (SELECT COUNT(DISTINCT executed_by) FROM report_executions WHERE executed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as active_users
        `);

      // Most popular reports
      const [popularReports] = await connection.execute(`
            SELECT 
                r.id,
                r.name,
                COUNT(re.id) as execution_count
            FROM reports r
            LEFT JOIN report_executions re ON r.id = re.report_id AND re.executed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            WHERE r.status = 'active'
            GROUP BY r.id, r.name
            ORDER BY execution_count DESC
            LIMIT 10
        `);

      // Daily execution trend
      const [dailyTrend] = await connection.execute(`
            SELECT 
                DATE(executed_at) as date,
                COUNT(*) as executions
            FROM report_executions
            WHERE executed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(executed_at)
            ORDER BY date
        `);

      await connection.end();

      res.json({
        success: true,
        overview: {
          statistics: stats[0],
          popularReports,
          dailyTrend
        }
      });
    } catch (error) {
      logger.error('Error getting reports overview:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get reports overview'
      });
    }
  }
);

/**
 * Report Management Routes
 */

// GET /api/reports - Get all reports
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category } = req.query;
    const offset = (page - 1) * limit;

    const connection = await reportsService.getConnection();

    let whereClause = 'WHERE r.status = "active"';
    const params = [];

    if (search) {
      whereClause += ' AND (r.name LIKE ? OR r.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [reports] = await connection.execute(
      `
            SELECT 
                r.*,
                (SELECT COUNT(*) FROM report_executions re WHERE re.report_id = r.id) as execution_count,
                (SELECT MAX(executed_at) FROM report_executions re WHERE re.report_id = r.id) as last_executed
            FROM reports r
            ${whereClause}
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        `,
      [...params, parseInt(limit), offset]
    );

    const [countResult] = await connection.execute(
      `
            SELECT COUNT(*) as total FROM reports r ${whereClause}
        `,
      params
    );

    await connection.end();

    res.json({
      success: true,
      reports: reports.map(report => ({
        ...report,
        permissions: report.permissions ? JSON.parse(report.permissions) : null,
        chart_config: report.chart_config ? JSON.parse(report.chart_config) : null
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    logger.error('Error getting reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reports'
    });
  }
});

// GET /api/reports/:reportId - Get specific report
router.get('/:reportId', requireAuth, async (req, res) => {
  try {
    const { reportId } = req.params;

    const connection = await reportsService.getConnection();

    const [reportRows] = await connection.execute(
      'SELECT * FROM reports WHERE id = ? AND status = "active"',
      [reportId]
    );

    if (reportRows.length === 0) {
      throw new NotFoundError('Report not found');
    }

    const report = reportRows[0];

    await connection.end();

    res.json({
      success: true,
      report: {
        ...report,
        permissions: report.permissions ? JSON.parse(report.permissions) : null,
        chart_config: report.chart_config ? JSON.parse(report.chart_config) : null
      }
    });
  } catch (error) {
    logger.error('Error getting report:', error);
    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to get report'
      });
    }
  }
});

// DELETE /api/reports/:reportId - Delete report
router.delete(
  '/:reportId',
  requireAuth,
  requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  async (req, res) => {
    try {
      const { reportId } = req.params;

      const connection = await reportsService.getConnection();

      await connection.execute('UPDATE reports SET status = "inactive" WHERE id = ?', [reportId]);

      await connection.end();

      res.json({
        success: true,
        message: 'Report deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete report'
      });
    }
  }
);

module.exports = router;
