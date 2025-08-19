const db = require('../data/database-service');

class ReportsService {

  constructor() {
    this.reportTemplates = {
      student_profile: {
        name: 'Student Profile Report',
        description: 'Comprehensive student information report',
        category: 'Student',
        configurable: true,
        fields: [
          'admission_no', 'roll_no', 'full_name', 'date_of_birth', 'gender',
          'class_section', 'parent_details', 'contact_info', 'address',
          'medical_conditions', 'transport_info'
        ],
        filters: ['class_id', 'section_id', 'academic_year_id', 'status'],
        exports: ['PDF', 'Excel', 'CSV']
      },
      
      fee_collection: {
        name: 'Fee Collection Report',
        description: 'Fee collection summary and details',
        category: 'Financial',
        configurable: true,
        fields: [
          'collection_date', 'receipt_no', 'student_name', 'class_section',
          'fee_head', 'amount_paid', 'payment_mode', 'collected_by'
        ],
        filters: ['date_range', 'payment_mode', 'class_id', 'fee_head'],
        exports: ['PDF', 'Excel', 'CSV']
      },
      
      attendance_summary: {
        name: 'Attendance Summary Report',
        description: 'Student attendance analysis and statistics',
        category: 'Attendance',
        configurable: true,
        fields: [
          'student_name', 'class_section', 'total_days', 'present_days',
          'absent_days', 'late_days', 'attendance_percentage'
        ],
        filters: ['date_range', 'class_id', 'section_id', 'min_percentage'],
        exports: ['PDF', 'Excel', 'CSV']
      },
      
      defaulter_list: {
        name: 'Fee Defaulter Report',
        description: 'Students with outstanding fee payments',
        category: 'Financial',
        configurable: true,
        fields: [
          'student_name', 'class_section', 'parent_contact', 'outstanding_amount',
          'due_date', 'days_overdue', 'last_payment_date'
        ],
        filters: ['min_amount', 'min_days_overdue', 'class_id'],
        exports: ['PDF', 'Excel', 'CSV']
      },
      
      academic_performance: {
        name: 'Academic Performance Report',
        description: 'Student academic performance analysis',
        category: 'Academic',
        configurable: true,
        fields: [
          'student_name', 'class_section', 'subject_wise_marks',
          'total_marks', 'percentage', 'grade', 'rank'
        ],
        filters: ['class_id', 'section_id', 'subject_id', 'exam_type'],
        exports: ['PDF', 'Excel', 'CSV']
      }
    };
  }

  // Get available report templates (tenant-configurable)
  async getReportTemplates(trustCode, userRole) {
    try {
      // Get tenant-specific report configurations
      const tenantReports = await this.getTenantReportConfigs(trustCode);
      
      // Merge default templates with tenant configurations
      const availableReports = { ...this.reportTemplates };
      
      // Apply tenant customizations
      for (const [reportId, tenantConfig] of Object.entries(tenantReports)) {
        if (availableReports[reportId]) {
          availableReports[reportId] = { 
            ...availableReports[reportId], 
            ...tenantConfig 
          };
        } else {
          // Custom tenant report
          availableReports[reportId] = tenantConfig;
        }
      }

      // Filter by user role permissions
      const filteredReports = {};
      for (const [reportId, report] of Object.entries(availableReports)) {
        if (this.canAccessReport(report, userRole)) {
          filteredReports[reportId] = report;
        }
      }

      return filteredReports;
    } catch (error) {
      throw new Error(`Failed to get report templates: ${error.message}`);
    }
  }

  async getTenantReportConfigs(trustCode) {
    try {
      const sql = `
        SELECT config_value 
        FROM trust_config 
        WHERE config_key = 'report_templates'
      `;
      
      const result = await db.queryTrust(trustCode, sql);
      
      if (result.length > 0 && result[0].config_value) {
        return JSON.parse(result[0].config_value);
      }
      
      return {};
    } catch (error) {
      console.error('Error getting tenant report configs:', error);
      return {};
    }
  }

  canAccessReport(report, userRole) {
    const rolePermissions = {
      'SYSTEM_ADMIN': ['Student', 'Financial', 'Attendance', 'Academic', 'System'],
      'TRUST_ADMIN': ['Student', 'Financial', 'Attendance', 'Academic'],
      'SCHOOL_ADMIN': ['Student', 'Financial', 'Attendance', 'Academic'],
      'TEACHER': ['Student', 'Attendance', 'Academic'],
      'ACCOUNTANT': ['Financial', 'Student'],
      'PARENT': ['Student'],
      'STUDENT': []
    };

    const allowedCategories = rolePermissions[userRole] || [];
    return allowedCategories.includes(report.category);
  }

  // Generate reports
  async generateStudentProfileReport(filters, trustCode) {
    let sql = `
      SELECT 
        s.admission_no,
        s.roll_no,
        CONCAT(s.first_name, ' ', s.last_name) as full_name,
        s.date_of_birth,
        s.gender,
        s.blood_group,
        s.religion,
        s.caste,
        s.nationality,
        s.address,
        s.city,
        s.state,
        s.postal_code,
        s.transport_required,
        s.bus_route,
        s.medical_conditions,
        s.status,
        CONCAT(c.class_name, ' - ', sec.section_name) as class_section,
        sch.school_name,
        ay.year_name as academic_year,
        GROUP_CONCAT(
          CONCAT(u.first_name, ' ', u.last_name, ' (', sp.relationship, ')')
          SEPARATOR ', '
        ) as parents
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN schools sch ON s.school_id = sch.id
      LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
      LEFT JOIN student_parents sp ON s.id = sp.student_id
      LEFT JOIN users u ON sp.parent_id = u.id
      WHERE 1=1
    `;

    const params = this.buildFilterParams(filters, sql);
    sql = params.sql;

    sql += ' GROUP BY s.id ORDER BY s.first_name ASC';

    return await db.queryTrust(trustCode, sql, params.values);
  }

  async generateFeeCollectionReport(filters, trustCode) {
    let sql = `
      SELECT 
        fr.receipt_no,
        DATE(fr.paid_date) as collection_date,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        s.admission_no,
        CONCAT(c.class_name, ' - ', sec.section_name) as class_section,
        fr.amount_paid,
        fr.late_fee_paid,
        fr.total_paid,
        fr.payment_mode,
        fr.payment_reference,
        CONCAT(u.first_name, ' ', u.last_name) as collected_by,
        fr.remarks
      FROM fee_receipts fr
      JOIN students s ON fr.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN users u ON fr.collected_by = u.id
      WHERE 1=1
    `;

    const params = this.buildFilterParams(filters, sql);
    sql = params.sql;

    sql += ' ORDER BY fr.paid_date DESC, fr.receipt_no ASC';

    return await db.queryTrust(trustCode, sql, params.values);
  }

  async generateAttendanceReport(filters, trustCode) {
    let sql = `
      SELECT 
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        s.admission_no,
        s.roll_no,
        CONCAT(c.class_name, ' - ', sec.section_name) as class_section,
        COUNT(ad.id) as total_days,
        SUM(CASE WHEN ad.status = 'PRESENT' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN ad.status = 'ABSENT' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN ad.status = 'LATE' THEN 1 ELSE 0 END) as late_days,
        SUM(CASE WHEN ad.status = 'HALF_DAY' THEN 1 ELSE 0 END) as half_days,
        ROUND((SUM(CASE WHEN ad.status = 'PRESENT' THEN 1 ELSE 0 END) * 100.0 / COUNT(ad.id)), 2) as attendance_percentage
      FROM students s
      LEFT JOIN attendance_daily ad ON s.id = ad.student_id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      WHERE s.status = 'ACTIVE'
    `;

    const params = this.buildFilterParams(filters, sql);
    sql = params.sql;

    sql += ' GROUP BY s.id ORDER BY attendance_percentage ASC, s.first_name ASC';

    return await db.queryTrust(trustCode, sql, params.values);
  }

  async generateDefaulterReport(filters, trustCode) {
    let sql = `
      SELECT 
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        s.admission_no,
        CONCAT(c.class_name, ' - ', sec.section_name) as class_section,
        GROUP_CONCAT(DISTINCT u.phone SEPARATOR ', ') as parent_contact,
        SUM(sfa.final_amount - COALESCE(payments.paid_amount, 0)) as outstanding_amount,
        MIN(sfa.due_date) as earliest_due_date,
        MAX(sfa.due_date) as latest_due_date,
        DATEDIFF(CURDATE(), MIN(sfa.due_date)) as days_overdue,
        MAX(fr.paid_date) as last_payment_date
      FROM students s
      JOIN student_fee_assignments sfa ON s.id = sfa.student_id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN student_parents sp ON s.id = sp.student_id
      LEFT JOIN users u ON sp.parent_id = u.id
      LEFT JOIN (
        SELECT student_id, SUM(amount_paid) as paid_amount
        FROM fee_receipts
        GROUP BY student_id
      ) payments ON s.id = payments.student_id
      LEFT JOIN fee_receipts fr ON s.id = fr.student_id
      WHERE sfa.final_amount > COALESCE(payments.paid_amount, 0)
        AND sfa.due_date < CURDATE()
        AND s.status = 'ACTIVE'
    `;

    const params = this.buildFilterParams(filters, sql);
    sql = params.sql;

    sql += ' GROUP BY s.id HAVING outstanding_amount > 0';
    sql += ' ORDER BY days_overdue DESC, outstanding_amount DESC';

    return await db.queryTrust(trustCode, sql, params.values);
  }

  // Custom report builder
  async generateCustomReport(reportConfig, trustCode) {
    try {
      const { 
        name, 
        description, 
        tables, 
        fields, 
        filters, 
        joins, 
        groupBy, 
        orderBy 
      } = reportConfig;

      // Build dynamic SQL query
      let sql = 'SELECT ';
      
      // Add selected fields
      sql += fields.map(field => {
        if (field.alias) {
          return `${field.expression} as ${field.alias}`;
        }
        return field.expression;
      }).join(', ');

      // Add FROM clause
      sql += ` FROM ${tables.primary}`;

      // Add JOINs
      if (joins && joins.length > 0) {
        for (const join of joins) {
          sql += ` ${join.type} JOIN ${join.table} ON ${join.condition}`;
        }
      }

      // Add WHERE clause
      sql += ' WHERE 1=1';
      const params = [];

      if (filters && filters.length > 0) {
        for (const filter of filters) {
          sql += ` AND ${filter.condition}`;
          if (filter.value !== undefined) {
            params.push(filter.value);
          }
        }
      }

      // Add GROUP BY
      if (groupBy && groupBy.length > 0) {
        sql += ` GROUP BY ${groupBy.join(', ')}`;
      }

      // Add ORDER BY
      if (orderBy && orderBy.length > 0) {
        sql += ` ORDER BY ${orderBy.join(', ')}`;
      }

      // Execute query
      const result = await db.queryTrust(trustCode, sql, params);

      return {
        reportName: name,
        description,
        data: result,
        generatedAt: new Date().toISOString(),
        recordCount: result.length
      };
    } catch (error) {
      throw new Error(`Failed to generate custom report: ${error.message}`);
    }
  }

  // Report scheduling and automation
  async scheduleReport(scheduleConfig, trustCode) {
    try {
      const sql = `
        INSERT INTO trust_config (config_key, config_value, data_type)
        VALUES (?, ?, 'JSON')
        ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)
      `;

      const configKey = `scheduled_report_${scheduleConfig.reportId}`;
      const configValue = JSON.stringify({
        reportId: scheduleConfig.reportId,
        schedule: scheduleConfig.schedule, // cron expression
        recipients: scheduleConfig.recipients,
        format: scheduleConfig.format,
        filters: scheduleConfig.filters,
        active: true,
        createdAt: new Date().toISOString()
      });

      await db.queryTrust(trustCode, sql, [configKey, configValue]);

      return { scheduled: true, configKey };
    } catch (error) {
      throw new Error(`Failed to schedule report: ${error.message}`);
    }
  }

  // Export functionality
  async exportReport(reportData, format, options = {}) {
    try {
      switch (format.toLowerCase()) {
        case 'csv':
          return this.exportToCSV(reportData, options);
        case 'excel':
          return this.exportToExcel(reportData, options);
        case 'pdf':
          return this.exportToPDF(reportData, options);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  exportToCSV(data, options) {
    if (!data || data.length === 0) {
      return 'No data available';
    }

    const headers = Object.keys(data[0]);
    let csv = headers.join(',') + '\n';

    for (const row of data) {
      const values = headers.map(header => {
        let value = row[header] || '';
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csv += values.join(',') + '\n';
    }

    return csv;
  }

  exportToExcel(data, options) {
    // In a real implementation, use a library like ExcelJS
    // For now, return CSV format
    return this.exportToCSV(data, options);
  }

  exportToPDF(data, options) {
    // In a real implementation, use a library like PDFKit or Puppeteer
    // For now, return HTML that can be converted to PDF
    if (!data || data.length === 0) {
      return '<html><body><h1>No data available</h1></body></html>';
    }

    const headers = Object.keys(data[0]);
    let html = `
      <html>
        <head>
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>${options.title || 'Report'}</h1>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
    `;

    for (const row of data) {
      html += '<tr>';
      for (const header of headers) {
        html += `<td>${row[header] || ''}</td>`;
      }
      html += '</tr>';
    }

    html += `
            </tbody>
          </table>
        </body>
      </html>
    `;

    return html;
  }

  // Helper methods
  buildFilterParams(filters, baseSql) {
    let sql = baseSql;
    const params = [];

    if (filters.class_id) {
      sql += ' AND s.class_id = ?';
      params.push(filters.class_id);
    }

    if (filters.section_id) {
      sql += ' AND s.section_id = ?';
      params.push(filters.section_id);
    }

    if (filters.school_id) {
      sql += ' AND s.school_id = ?';
      params.push(filters.school_id);
    }

    if (filters.academic_year_id) {
      sql += ' AND s.academic_year_id = ?';
      params.push(filters.academic_year_id);
    }

    if (filters.status) {
      sql += ' AND s.status = ?';
      params.push(filters.status);
    }

    if (filters.from_date) {
      sql += ' AND DATE(fr.paid_date) >= ?';
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      sql += ' AND DATE(fr.paid_date) <= ?';
      params.push(filters.to_date);
    }

    if (filters.payment_mode) {
      sql += ' AND fr.payment_mode = ?';
      params.push(filters.payment_mode);
    }

    if (filters.min_amount) {
      sql += ' AND fr.total_paid >= ?';
      params.push(filters.min_amount);
    }

    if (filters.search) {
      sql += ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_no LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    return { sql, values: params };
  }

  // Tenant configuration management
  async updateTenantReportConfig(trustCode, reportConfigs) {
    try {
      const sql = `
        INSERT INTO trust_config (config_key, config_value, data_type, description)
        VALUES ('report_templates', ?, 'JSON', 'Tenant-specific report configurations')
        ON DUPLICATE KEY UPDATE 
          config_value = VALUES(config_value),
          updated_at = NOW()
      `;

      await db.queryTrust(trustCode, sql, [JSON.stringify(reportConfigs)]);

      return { updated: true };
    } catch (error) {
      throw new Error(`Failed to update tenant report config: ${error.message}`);
    }
  }

  async getReportHistory(filters, trustCode) {
    // This would typically be stored in a reports_history table
    // For now, return empty array
    return [];
  }

  async getReportStatistics(trustCode) {
    try {
      // Get basic statistics about report usage
      const stats = {
        totalReportsGenerated: 0,
        mostPopularReport: null,
        lastGeneratedReport: null,
        totalExports: 0
      };

      // In a real implementation, this would query report_history table
      return stats;
    } catch (error) {
      throw new Error(`Failed to get report statistics: ${error.message}`);
    }
  }
}

module.exports = new ReportsService();