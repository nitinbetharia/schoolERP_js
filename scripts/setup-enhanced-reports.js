/**
 * Enhanced Reports Database Setup Script
 * Sets up the complete database schema for Phase 3: Enhanced Reporting Framework
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../config/logger');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'school_erp',
  multipleStatements: true
};

async function setupEnhancedReportsDatabase() {
  let connection;

  try {
    console.log('🚀 Setting up Enhanced Reporting Framework database...');

    // Create connection
    connection = await mysql.createConnection(dbConfig);

    // Read and execute schema file
    const schemaPath = path.join(__dirname, 'enhanced-reports-schema.sql');
    const schemaSql = await fs.readFile(schemaPath, 'utf8');

    console.log('📄 Executing enhanced reports schema...');
    await connection.execute(schemaSql);

    console.log('✅ Enhanced reports database schema created successfully!');

    // Verify tables were created
    const tables = [
      'reports',
      'report_templates',
      'report_executions',
      'report_schedules',
      'scheduled_report_executions',
      'report_shares',
      'report_favorites',
      'report_comments',
      'dashboard_widgets',
      'report_cache',
      'data_sources',
      'report_audit_log'
    ];

    console.log('🔍 Verifying table creation...');
    for (const table of tables) {
      const [rows] = await connection.execute(
        'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
        [dbConfig.database, table]
      );

      if (rows[0].count > 0) {
        console.log(`  ✅ Table '${table}' created successfully`);
      } else {
        console.log(`  ❌ Table '${table}' not found`);
      }
    }

    // Insert additional sample data if needed
    await insertSampleData(connection);

    console.log('🎉 Enhanced Reporting Framework setup completed successfully!');
    console.log('');
    console.log('📊 Available Features:');
    console.log('  • Dynamic Report Builder');
    console.log('  • Report Templates Library');
    console.log('  • Automated Scheduling');
    console.log('  • Data Visualization Charts');
    console.log('  • Export to Excel/PDF');
    console.log('  • Advanced Analytics Dashboard');
    console.log('  • Custom Dashboard Builder');
    console.log('  • Report Sharing & Collaboration');
    console.log('');
    console.log('🌐 Access the reporting system at: http://localhost:3000/reports');
  } catch (error) {
    console.error('❌ Error setting up enhanced reports database:', error);
    logger.error('Enhanced reports database setup failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function insertSampleData(connection) {
  try {
    console.log('📝 Inserting sample report data...');

    // Check if sample data already exists
    const [existingReports] = await connection.execute(
      'SELECT COUNT(*) as count FROM reports WHERE created_by = "system"'
    );

    if (existingReports[0].count > 0) {
      console.log('  ℹ️  Sample data already exists, skipping...');
      return;
    }

    // Insert sample reports
    const sampleReports = [
      {
        name: 'Student Enrollment Summary',
        description: 'Overview of student enrollment by class and academic year',
        query:
          'SELECT class, COUNT(*) as student_count FROM students WHERE status = "active" GROUP BY class ORDER BY class',
        chart_config: JSON.stringify({
          type: 'bar',
          labelField: 'class',
          valueField: 'student_count'
        }),
        permissions: JSON.stringify({
          roles: ['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']
        })
      },
      {
        name: 'Monthly Fee Collection',
        description: 'Monthly breakdown of fee collections and pending amounts',
        query:
          'SELECT MONTH(payment_date) as month, YEAR(payment_date) as year, SUM(amount) as total_collected FROM fee_payments GROUP BY YEAR(payment_date), MONTH(payment_date) ORDER BY year DESC, month DESC',
        chart_config: JSON.stringify({
          type: 'line',
          labelField: 'month',
          valueField: 'total_collected'
        }),
        permissions: JSON.stringify({
          roles: ['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']
        })
      },
      {
        name: 'Teacher Attendance Report',
        description: 'Daily attendance tracking for teaching staff',
        query:
          'SELECT u.name as teacher_name, COUNT(*) as present_days FROM users u JOIN attendance a ON u.id = a.teacher_id WHERE u.role = "TEACHER" AND a.status = "present" GROUP BY u.id ORDER BY present_days DESC',
        chart_config: JSON.stringify({
          type: 'bar',
          labelField: 'teacher_name',
          valueField: 'present_days'
        }),
        permissions: JSON.stringify({
          roles: ['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']
        })
      }
    ];

    for (const report of sampleReports) {
      await connection.execute(
        'INSERT INTO reports (name, description, query, chart_config, permissions, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          report.name,
          report.description,
          report.query,
          report.chart_config,
          report.permissions,
          'system',
          'active'
        ]
      );
    }

    // Insert sample dashboard widgets
    const sampleWidgets = [
      {
        dashboard_id: 'main_dashboard',
        widget_type: 'metric',
        widget_config: JSON.stringify({
          title: 'Total Students',
          query: 'SELECT COUNT(*) as value FROM students WHERE status = "active"',
          icon: 'fa-user-graduate',
          color: 'primary'
        }),
        position_x: 0,
        position_y: 0,
        width: 3,
        height: 2
      },
      {
        dashboard_id: 'main_dashboard',
        widget_type: 'metric',
        widget_config: JSON.stringify({
          title: 'Monthly Revenue',
          query:
            'SELECT SUM(amount) as value FROM fee_payments WHERE MONTH(payment_date) = MONTH(NOW()) AND YEAR(payment_date) = YEAR(NOW())',
          icon: 'fa-dollar-sign',
          color: 'success'
        }),
        position_x: 3,
        position_y: 0,
        width: 3,
        height: 2
      }
    ];

    for (const widget of sampleWidgets) {
      await connection.execute(
        'INSERT INTO dashboard_widgets (dashboard_id, widget_type, widget_config, position_x, position_y, width, height, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          widget.dashboard_id,
          widget.widget_type,
          widget.widget_config,
          widget.position_x,
          widget.position_y,
          widget.width,
          widget.height,
          'system',
          'active'
        ]
      );
    }

    console.log('  ✅ Sample reports and widgets inserted successfully');
  } catch (error) {
    console.error('Error inserting sample data:', error);
    // Don't fail the whole setup for sample data issues
  }
}

// Run setup if called directly
if (require.main === module) {
  setupEnhancedReportsDatabase();
}

module.exports = { setupEnhancedReportsDatabase };
