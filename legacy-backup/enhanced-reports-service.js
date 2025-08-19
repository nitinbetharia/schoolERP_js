/**
 * Enhanced Reports Service
 * Advanced reporting framework with dynamic report building, data visualization, and automation
 */

const mysql = require('mysql2/promise');
const { ValidationError, NotFoundError } = require('../../middleware/errors');
const logger = require('../../config/logger');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');

class EnhancedReportsService {
  constructor(dbConfig) {
    this.dbConfig = dbConfig;
    this.reportCache = new Map();
    this.scheduledReports = new Map();
    this.initializeScheduler();
  }

  async getConnection() {
    return await mysql.createConnection(this.dbConfig);
  }

  /**
   * Report Builder - Dynamic SQL Generation
   */
  async buildCustomReport(reportConfig) {
    try {
      const {
        name,
        description,
        tables,
        fields,
        joins,
        filters,
        groupBy,
        orderBy,
        chartConfig,
        permissions
      } = reportConfig;

      // Validate report configuration
      this.validateReportConfig(reportConfig);

      // Generate SQL query
      const query = this.generateDynamicSQL({
        tables,
        fields,
        joins,
        filters,
        groupBy,
        orderBy
      });

      // Save report configuration
      const reportId = await this.saveReportConfiguration({
        name,
        description,
        query,
        chartConfig: JSON.stringify(chartConfig),
        permissions: JSON.stringify(permissions),
        createdBy: reportConfig.createdBy
      });

      // Execute query to validate
      const connection = await this.getConnection();
      try {
        const [results] = await connection.execute(query.sql, query.params);
        await connection.end();

        return {
          success: true,
          reportId,
          query: query.sql,
          sampleData: results.slice(0, 5), // First 5 rows for preview
          totalRows: results.length
        };
      } catch (error) {
        await connection.end();
        throw new ValidationError(`Invalid query: ${error.message}`);
      }
    } catch (error) {
      logger.error('Error building custom report:', error);
      throw error;
    }
  }

  /**
   * Dynamic SQL Generation
   */
  generateDynamicSQL({ tables, fields, joins, filters, groupBy, orderBy }) {
    let sql = 'SELECT ';
    const params = [];

    // Build SELECT clause
    const selectFields = fields.map(field => {
      if (field.aggregate) {
        return `${field.aggregate}(${field.table}.${field.column}) AS ${field.alias || field.column}`;
      }
      return `${field.table}.${field.column}${field.alias ? ` AS ${field.alias}` : ''}`;
    });
    sql += selectFields.join(', ');

    // Build FROM clause
    sql += ` FROM ${tables.main}`;

    // Build JOIN clauses
    if (joins && joins.length > 0) {
      joins.forEach(join => {
        sql += ` ${join.type.toUpperCase()} JOIN ${join.table} ON ${join.condition}`;
      });
    }

    // Build WHERE clause
    if (filters && filters.length > 0) {
      const whereConditions = filters.map(filter => {
        switch (filter.operator) {
          case 'equals':
            params.push(filter.value);
            return `${filter.field} = ?`;
          case 'not_equals':
            params.push(filter.value);
            return `${filter.field} != ?`;
          case 'contains':
            params.push(`%${filter.value}%`);
            return `${filter.field} LIKE ?`;
          case 'starts_with':
            params.push(`${filter.value}%`);
            return `${filter.field} LIKE ?`;
          case 'ends_with':
            params.push(`%${filter.value}`);
            return `${filter.field} LIKE ?`;
          case 'greater_than':
            params.push(filter.value);
            return `${filter.field} > ?`;
          case 'less_than':
            params.push(filter.value);
            return `${filter.field} < ?`;
          case 'between':
            params.push(filter.value[0], filter.value[1]);
            return `${filter.field} BETWEEN ? AND ?`;
          case 'in':
            const placeholders = filter.value.map(() => '?').join(',');
            params.push(...filter.value);
            return `${filter.field} IN (${placeholders})`;
          case 'is_null':
            return `${filter.field} IS NULL`;
          case 'is_not_null':
            return `${filter.field} IS NOT NULL`;
          default:
            throw new ValidationError(`Invalid filter operator: ${filter.operator}`);
        }
      });

      if (whereConditions.length > 0) {
        sql += ` WHERE ${whereConditions.join(' AND ')}`;
      }
    }

    // Build GROUP BY clause
    if (groupBy && groupBy.length > 0) {
      sql += ` GROUP BY ${groupBy.join(', ')}`;
    }

    // Build ORDER BY clause
    if (orderBy && orderBy.length > 0) {
      const orderFields = orderBy.map(order => `${order.field} ${order.direction || 'ASC'}`);
      sql += ` ORDER BY ${orderFields.join(', ')}`;
    }

    return { sql, params };
  }

  /**
   * Execute Report
   */
  async executeReport(reportId, parameters = {}) {
    try {
      const connection = await this.getConnection();

      // Get report configuration
      const [reportRows] = await connection.execute(
        'SELECT * FROM reports WHERE id = ? AND status = "active"',
        [reportId]
      );

      if (reportRows.length === 0) {
        throw new NotFoundError('Report not found');
      }

      const report = reportRows[0];
      let query = report.query;
      const params = [];

      // Replace parameters in query
      if (parameters && Object.keys(parameters).length > 0) {
        Object.entries(parameters).forEach(([key, value]) => {
          const placeholder = `:${key}`;
          if (query.includes(placeholder)) {
            query = query.replace(new RegExp(placeholder, 'g'), '?');
            params.push(value);
          }
        });
      }

      // Execute query
      const [results] = await connection.execute(query, params);

      // Update execution log
      await connection.execute(
        'INSERT INTO report_executions (report_id, executed_by, parameters, row_count, execution_time) VALUES (?, ?, ?, ?, NOW())',
        [reportId, parameters.executedBy || 'system', JSON.stringify(parameters), results.length]
      );

      await connection.end();

      return {
        success: true,
        reportId,
        reportName: report.name,
        data: results,
        rowCount: results.length,
        chartConfig: report.chart_config ? JSON.parse(report.chart_config) : null,
        executedAt: new Date()
      };
    } catch (error) {
      logger.error('Error executing report:', error);
      throw error;
    }
  }

  /**
   * Data Visualization
   */
  async generateChartData(reportId, chartType = 'bar') {
    try {
      const reportData = await this.executeReport(reportId);
      const { data, chartConfig } = reportData;

      if (!data || data.length === 0) {
        return { labels: [], datasets: [] };
      }

      const config = chartConfig || this.getDefaultChartConfig(chartType, data);

      switch (chartType) {
        case 'bar':
        case 'line':
          return this.generateBarLineChartData(data, config);
        case 'pie':
        case 'doughnut':
          return this.generatePieChartData(data, config);
        case 'scatter':
          return this.generateScatterChartData(data, config);
        case 'area':
          return this.generateAreaChartData(data, config);
        default:
          throw new ValidationError(`Unsupported chart type: ${chartType}`);
      }
    } catch (error) {
      logger.error('Error generating chart data:', error);
      throw error;
    }
  }

  generateBarLineChartData(data, config) {
    const labels = data.map(row => row[config.labelField]);
    const datasets = config.dataFields.map(field => ({
      label: field.label || field.name,
      data: data.map(row => parseFloat(row[field.name]) || 0),
      backgroundColor: field.backgroundColor || 'rgba(54, 162, 235, 0.6)',
      borderColor: field.borderColor || 'rgba(54, 162, 235, 1)',
      borderWidth: field.borderWidth || 2
    }));

    return { labels, datasets };
  }

  generatePieChartData(data, config) {
    const labels = data.map(row => row[config.labelField]);
    const values = data.map(row => parseFloat(row[config.valueField]) || 0);

    const colors = this.generateColors(labels.length);

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors.background,
          borderColor: colors.border,
          borderWidth: 2
        }
      ]
    };
  }

  generateScatterChartData(data, config) {
    return {
      datasets: [
        {
          label: config.label || 'Scatter Data',
          data: data.map(row => ({
            x: parseFloat(row[config.xField]) || 0,
            y: parseFloat(row[config.yField]) || 0
          })),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)'
        }
      ]
    };
  }

  generateAreaChartData(data, config) {
    const chartData = this.generateBarLineChartData(data, config);
    chartData.datasets.forEach(dataset => {
      dataset.fill = true;
      dataset.backgroundColor = dataset.backgroundColor.replace('0.6', '0.3');
    });
    return chartData;
  }

  /**
   * Export Functions
   */
  async exportToExcel(reportId, parameters = {}) {
    try {
      const reportData = await this.executeReport(reportId, parameters);
      const { data, reportName } = reportData;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Report Data');

      if (data.length === 0) {
        worksheet.addRow(['No data available']);
        const buffer = await workbook.xlsx.writeBuffer();
        return { buffer, filename: `${reportName}_${Date.now()}.xlsx` };
      }

      // Add headers
      const headers = Object.keys(data[0]);
      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Add data
      data.forEach(row => {
        worksheet.addRow(Object.values(row));
      });

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        column.width =
          Math.max(
            column.header ? column.header.length : 0,
            ...data.map(row => (row[column.key] ? row[column.key].toString().length : 0))
          ) + 2;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      return {
        buffer,
        filename: `${reportName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.xlsx`
      };
    } catch (error) {
      logger.error('Error exporting to Excel:', error);
      throw error;
    }
  }

  async exportToPDF(reportId, parameters = {}) {
    try {
      const reportData = await this.executeReport(reportId, parameters);
      const { data, reportName } = reportData;

      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));

      // Header
      doc.fontSize(16).text(reportName, { align: 'center' });
      doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(2);

      if (data.length === 0) {
        doc.text('No data available');
      } else {
        // Table headers
        const headers = Object.keys(data[0]);
        const tableTop = doc.y;
        const columnWidth = (doc.page.width - 100) / headers.length;

        // Header row
        headers.forEach((header, i) => {
          doc.rect(50 + i * columnWidth, tableTop, columnWidth, 20).stroke();
          doc.fontSize(8).text(header, 50 + i * columnWidth + 5, tableTop + 5, {
            width: columnWidth - 10,
            height: 20,
            ellipsis: true
          });
        });

        // Data rows
        let currentY = tableTop + 20;
        data.forEach((row, rowIndex) => {
          if (currentY > doc.page.height - 100) {
            doc.addPage();
            currentY = 50;
          }

          Object.values(row).forEach((value, colIndex) => {
            doc.rect(50 + colIndex * columnWidth, currentY, columnWidth, 15).stroke();
            doc
              .fontSize(7)
              .text(String(value || ''), 50 + colIndex * columnWidth + 2, currentY + 2, {
                width: columnWidth - 4,
                height: 15,
                ellipsis: true
              });
          });
          currentY += 15;
        });
      }

      doc.end();

      return new Promise(resolve => {
        doc.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            buffer,
            filename: `${reportName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`
          });
        });
      });
    } catch (error) {
      logger.error('Error exporting to PDF:', error);
      throw error;
    }
  }

  /**
   * Scheduled Reports
   */
  async scheduleReport(scheduleConfig) {
    try {
      const {
        reportId,
        schedule, // cron expression
        recipients,
        format, // 'excel' or 'pdf'
        name,
        createdBy
      } = scheduleConfig;

      // Validate cron expression
      if (!cron.validate(schedule)) {
        throw new ValidationError('Invalid cron schedule expression');
      }

      const connection = await this.getConnection();

      // Save schedule
      const [result] = await connection.execute(
        `INSERT INTO report_schedules (report_id, name, schedule_cron, recipients, format, created_by, status) 
                 VALUES (?, ?, ?, ?, ?, ?, 'active')`,
        [reportId, name, schedule, JSON.stringify(recipients), format, createdBy]
      );

      const scheduleId = result.insertId;

      // Set up cron job
      const task = cron.schedule(
        schedule,
        async () => {
          await this.executeScheduledReport(scheduleId);
        },
        {
          scheduled: false
        }
      );

      this.scheduledReports.set(scheduleId, task);
      task.start();

      await connection.end();

      return {
        success: true,
        scheduleId,
        message: 'Report scheduled successfully'
      };
    } catch (error) {
      logger.error('Error scheduling report:', error);
      throw error;
    }
  }

  async executeScheduledReport(scheduleId) {
    try {
      const connection = await this.getConnection();

      // Get schedule details
      const [scheduleRows] = await connection.execute(
        `SELECT rs.*, r.name as report_name 
                 FROM report_schedules rs 
                 JOIN reports r ON rs.report_id = r.id 
                 WHERE rs.id = ? AND rs.status = 'active'`,
        [scheduleId]
      );

      if (scheduleRows.length === 0) {
        return;
      }

      const schedule = scheduleRows[0];
      const recipients = JSON.parse(schedule.recipients);

      // Generate report
      let exportResult;
      if (schedule.format === 'excel') {
        exportResult = await this.exportToExcel(schedule.report_id);
      } else {
        exportResult = await this.exportToPDF(schedule.report_id);
      }

      // Send to recipients (integrate with communication service)
      const communicationService = require('../communication/communication-service');

      for (const recipient of recipients) {
        await communicationService.sendEmail({
          to: recipient.email,
          subject: `Scheduled Report: ${schedule.report_name}`,
          body: `Please find the attached report: ${schedule.report_name}`,
          attachments: [
            {
              filename: exportResult.filename,
              content: exportResult.buffer
            }
          ]
        });
      }

      // Log execution
      await connection.execute(
        'INSERT INTO scheduled_report_executions (schedule_id, executed_at, status, recipients_count) VALUES (?, NOW(), ?, ?)',
        [scheduleId, 'success', recipients.length]
      );

      await connection.end();
    } catch (error) {
      logger.error('Error executing scheduled report:', error);

      // Log failure
      const connection = await this.getConnection();
      await connection.execute(
        'INSERT INTO scheduled_report_executions (schedule_id, executed_at, status, error_message) VALUES (?, NOW(), ?, ?)',
        [scheduleId, 'failed', error.message]
      );
      await connection.end();
    }
  }

  /**
   * Report Templates
   */
  async createReportTemplate(templateConfig) {
    try {
      const { name, description, category, reportConfig, previewImage, createdBy } = templateConfig;

      const connection = await this.getConnection();

      const [result] = await connection.execute(
        `INSERT INTO report_templates (name, description, category, config, preview_image, created_by) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
        [name, description, category, JSON.stringify(reportConfig), previewImage, createdBy]
      );

      await connection.end();

      return {
        success: true,
        templateId: result.insertId,
        message: 'Report template created successfully'
      };
    } catch (error) {
      logger.error('Error creating report template:', error);
      throw error;
    }
  }

  async getReportTemplates(category = null) {
    try {
      const connection = await this.getConnection();

      let query = 'SELECT * FROM report_templates WHERE status = "active"';
      const params = [];

      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }

      query += ' ORDER BY category, name';

      const [templates] = await connection.execute(query, params);
      await connection.end();

      return templates.map(template => ({
        ...template,
        config: JSON.parse(template.config)
      }));
    } catch (error) {
      logger.error('Error getting report templates:', error);
      throw error;
    }
  }

  /**
   * Analytics & Metrics
   */
  async getReportAnalytics(reportId, dateRange = null) {
    try {
      const connection = await this.getConnection();

      let whereClause = 'WHERE report_id = ?';
      const params = [reportId];

      if (dateRange) {
        whereClause += ' AND executed_at BETWEEN ? AND ?';
        params.push(dateRange.start, dateRange.end);
      }

      // Execution statistics
      const [execStats] = await connection.execute(
        `SELECT 
                    COUNT(*) as total_executions,
                    AVG(execution_time) as avg_execution_time,
                    MAX(execution_time) as max_execution_time,
                    AVG(row_count) as avg_row_count,
                    MAX(row_count) as max_row_count
                 FROM report_executions ${whereClause}`,
        params
      );

      // Daily execution trend
      const [dailyTrend] = await connection.execute(
        `SELECT 
                    DATE(executed_at) as date,
                    COUNT(*) as executions
                 FROM report_executions ${whereClause}
                 GROUP BY DATE(executed_at)
                 ORDER BY date DESC
                 LIMIT 30`,
        params
      );

      // Most active users
      const [activeUsers] = await connection.execute(
        `SELECT 
                    executed_by,
                    COUNT(*) as execution_count
                 FROM report_executions ${whereClause}
                 GROUP BY executed_by
                 ORDER BY execution_count DESC
                 LIMIT 10`,
        params
      );

      await connection.end();

      return {
        statistics: execStats[0],
        dailyTrend,
        activeUsers
      };
    } catch (error) {
      logger.error('Error getting report analytics:', error);
      throw error;
    }
  }

  /**
   * Utility Methods
   */
  validateReportConfig(config) {
    const required = ['name', 'tables', 'fields'];
    for (const field of required) {
      if (!config[field]) {
        throw new ValidationError(`Missing required field: ${field}`);
      }
    }

    if (!config.tables.main) {
      throw new ValidationError('Main table is required');
    }

    if (!Array.isArray(config.fields) || config.fields.length === 0) {
      throw new ValidationError('At least one field is required');
    }
  }

  async saveReportConfiguration(config) {
    const connection = await this.getConnection();

    const [result] = await connection.execute(
      `INSERT INTO reports (name, description, query, chart_config, permissions, created_by, status) 
             VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [
        config.name,
        config.description,
        config.query,
        config.chartConfig,
        config.permissions,
        config.createdBy
      ]
    );

    await connection.end();
    return result.insertId;
  }

  getDefaultChartConfig(chartType, data) {
    if (!data || data.length === 0) return null;

    const fields = Object.keys(data[0]);
    const numericFields = fields.filter(field => !isNaN(parseFloat(data[0][field])));
    const textFields = fields.filter(field => isNaN(parseFloat(data[0][field])));

    return {
      labelField: textFields[0] || fields[0],
      valueField: numericFields[0] || fields[1],
      dataFields: numericFields.slice(0, 3).map(field => ({ name: field, label: field }))
    };
  }

  generateColors(count) {
    const colors = [
      'rgba(255, 99, 132, 0.6)',
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 205, 86, 0.6)',
      'rgba(75, 192, 192, 0.6)',
      'rgba(153, 102, 255, 0.6)',
      'rgba(255, 159, 64, 0.6)',
      'rgba(199, 199, 199, 0.6)',
      'rgba(83, 102, 255, 0.6)',
      'rgba(255, 99, 255, 0.6)',
      'rgba(99, 255, 132, 0.6)'
    ];

    const borderColors = colors.map(color => color.replace('0.6', '1'));

    return {
      background: Array.from({ length: count }, (_, i) => colors[i % colors.length]),
      border: Array.from({ length: count }, (_, i) => borderColors[i % borderColors.length])
    };
  }

  initializeScheduler() {
    // Load existing scheduled reports on startup
    setTimeout(async () => {
      try {
        const connection = await this.getConnection();
        const [schedules] = await connection.execute(
          'SELECT * FROM report_schedules WHERE status = "active"'
        );

        for (const schedule of schedules) {
          const task = cron.schedule(
            schedule.schedule_cron,
            async () => {
              await this.executeScheduledReport(schedule.id);
            },
            {
              scheduled: false
            }
          );

          this.scheduledReports.set(schedule.id, task);
          task.start();
        }

        await connection.end();
        logger.info(`Loaded ${schedules.length} scheduled reports`);
      } catch (error) {
        logger.error('Error loading scheduled reports:', error);
      }
    }, 5000); // Wait 5 seconds after startup
  }
}

module.exports = EnhancedReportsService;
