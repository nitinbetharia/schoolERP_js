-- Enhanced Reporting Framework Database Schema
-- Phase 3: Advanced reporting with dynamic builders, analytics, and automation
-- Reports table - Core report definitions
CREATE TABLE IF NOT EXISTS reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  query TEXT NOT NULL,
  chart_config JSON,
  permissions JSON,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  status ENUM('active', 'inactive', 'draft') DEFAULT 'active',
  INDEX idx_reports_status (status),
  INDEX idx_reports_created_by (created_by)
);
-- Report templates - Predefined report configurations
CREATE TABLE IF NOT EXISTS report_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  config JSON NOT NULL,
  preview_image VARCHAR(500),
  usage_count INT DEFAULT 0,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  status ENUM('active', 'inactive') DEFAULT 'active',
  INDEX idx_templates_category (category),
  INDEX idx_templates_status (status)
);
-- Report executions - Track report runs and performance
CREATE TABLE IF NOT EXISTS report_executions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_id INT NOT NULL,
  executed_by VARCHAR(100),
  parameters JSON,
  row_count INT,
  execution_time DECIMAL(10, 3),
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('success', 'failed', 'timeout') DEFAULT 'success',
  error_message TEXT,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  INDEX idx_executions_report_id (report_id),
  INDEX idx_executions_executed_by (executed_by),
  INDEX idx_executions_executed_at (executed_at)
);
-- Report schedules - Automated report generation
CREATE TABLE IF NOT EXISTS report_schedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  schedule_cron VARCHAR(100) NOT NULL,
  recipients JSON NOT NULL,
  format ENUM('excel', 'pdf') DEFAULT 'excel',
  parameters JSON,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  status ENUM('active', 'inactive', 'paused') DEFAULT 'active',
  last_execution TIMESTAMP NULL,
  next_execution TIMESTAMP NULL,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  INDEX idx_schedules_report_id (report_id),
  INDEX idx_schedules_status (status),
  INDEX idx_schedules_next_execution (next_execution)
);
-- Scheduled report executions - Track automated runs
CREATE TABLE IF NOT EXISTS scheduled_report_executions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  schedule_id INT NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('success', 'failed') DEFAULT 'success',
  recipients_count INT,
  error_message TEXT,
  file_size INT,
  execution_time DECIMAL(10, 3),
  FOREIGN KEY (schedule_id) REFERENCES report_schedules(id) ON DELETE CASCADE,
  INDEX idx_scheduled_executions_schedule_id (schedule_id),
  INDEX idx_scheduled_executions_executed_at (executed_at)
);
-- Report shares - Share reports with specific users/roles
CREATE TABLE IF NOT EXISTS report_shares (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_id INT NOT NULL,
  shared_with_type ENUM('user', 'role', 'group') NOT NULL,
  shared_with_value VARCHAR(100) NOT NULL,
  permissions JSON,
  shared_by VARCHAR(100),
  shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  status ENUM('active', 'revoked') DEFAULT 'active',
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  INDEX idx_shares_report_id (report_id),
  INDEX idx_shares_shared_with (shared_with_type, shared_with_value),
  INDEX idx_shares_status (status)
);
-- Report favorites - User bookmarks
CREATE TABLE IF NOT EXISTS report_favorites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_id INT NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_report (user_id, report_id),
  INDEX idx_favorites_user_id (user_id)
);
-- Report comments - Collaboration and feedback
CREATE TABLE IF NOT EXISTS report_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_id INT NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  parent_comment_id INT NULL,
  status ENUM('active', 'deleted') DEFAULT 'active',
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_comment_id) REFERENCES report_comments(id) ON DELETE CASCADE,
  INDEX idx_comments_report_id (report_id),
  INDEX idx_comments_user_id (user_id),
  INDEX idx_comments_parent (parent_comment_id)
);
-- Dashboard widgets - Custom dashboard configurations
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dashboard_id VARCHAR(100) NOT NULL,
  report_id INT,
  widget_type ENUM('chart', 'table', 'metric', 'text') NOT NULL,
  widget_config JSON NOT NULL,
  position_x INT DEFAULT 0,
  position_y INT DEFAULT 0,
  width INT DEFAULT 6,
  height INT DEFAULT 4,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  status ENUM('active', 'inactive') DEFAULT 'active',
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  INDEX idx_widgets_dashboard_id (dashboard_id),
  INDEX idx_widgets_report_id (report_id),
  INDEX idx_widgets_created_by (created_by)
);
-- Report cache - Performance optimization
CREATE TABLE IF NOT EXISTS report_cache (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_id INT NOT NULL,
  cache_key VARCHAR(255) NOT NULL,
  parameters_hash VARCHAR(64),
  data_compressed LONGBLOB,
  row_count INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  hit_count INT DEFAULT 0,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  UNIQUE KEY unique_cache_key (cache_key),
  INDEX idx_cache_report_id (report_id),
  INDEX idx_cache_expires_at (expires_at)
);
-- Data sources - External data connections
CREATE TABLE IF NOT EXISTS data_sources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  type ENUM(
    'mysql',
    'postgresql',
    'mongodb',
    'api',
    'csv',
    'excel'
  ) NOT NULL,
  connection_config JSON NOT NULL,
  test_query TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  status ENUM('active', 'inactive', 'testing') DEFAULT 'active',
  last_tested TIMESTAMP NULL,
  test_status ENUM('success', 'failed') NULL,
  INDEX idx_datasources_type (type),
  INDEX idx_datasources_status (status),
  INDEX idx_datasources_created_by (created_by)
);
-- Report audit log - Track all report-related activities
CREATE TABLE IF NOT EXISTS report_audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_id INT,
  action ENUM(
    'create',
    'update',
    'delete',
    'execute',
    'share',
    'export',
    'schedule'
  ) NOT NULL,
  performed_by VARCHAR(100) NOT NULL,
  details JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE
  SET NULL,
    INDEX idx_audit_report_id (report_id),
    INDEX idx_audit_performed_by (performed_by),
    INDEX idx_audit_action (action),
    INDEX idx_audit_created_at (created_at)
);
-- Insert default report templates
INSERT IGNORE INTO report_templates (name, description, category, config, created_by)
VALUES (
    'Student Enrollment Report',
    'Track student enrollment trends over time',
    'Academic',
    '{"tables":{"main":"students"},"fields":[{"table":"students","column":"enrollment_date","alias":"date"},{"table":"students","column":"*","aggregate":"COUNT","alias":"enrollment_count"}],"groupBy":["DATE(enrollment_date)"],"orderBy":[{"field":"enrollment_date","direction":"DESC"}]}',
    'system'
  ),
  (
    'Fee Collection Summary',
    'Monthly fee collection analysis',
    'Financial',
    '{"tables":{"main":"fee_payments"},"fields":[{"table":"fee_payments","column":"payment_date","alias":"month"},{"table":"fee_payments","column":"amount","aggregate":"SUM","alias":"total_collected"}],"groupBy":["MONTH(payment_date)","YEAR(payment_date)"],"orderBy":[{"field":"payment_date","direction":"DESC"}]}',
    'system'
  ),
  (
    'Attendance Overview',
    'Student attendance patterns and statistics',
    'Academic',
    '{"tables":{"main":"attendance"},"joins":[{"type":"LEFT","table":"students","condition":"attendance.student_id = students.id"}],"fields":[{"table":"students","column":"name","alias":"student_name"},{"table":"attendance","column":"status","aggregate":"COUNT","alias":"total_days"},{"table":"attendance","column":"status"}],"filters":[{"field":"attendance.status","operator":"equals","value":"present"}],"groupBy":["students.id","attendance.status"]}',
    'system'
  ),
  (
    'Staff Performance Report',
    'Evaluate staff performance metrics',
    'HR',
    '{"tables":{"main":"users"},"joins":[{"type":"LEFT","table":"attendance","condition":"users.id = attendance.teacher_id"}],"fields":[{"table":"users","column":"name","alias":"staff_name"},{"table":"users","column":"role"},{"table":"attendance","column":"*","aggregate":"COUNT","alias":"classes_taken"}],"filters":[{"field":"users.role","operator":"in","value":["TEACHER","STAFF"]}],"groupBy":["users.id"]}',
    'system'
  ),
  (
    'Monthly Revenue Report',
    'Comprehensive revenue analysis',
    'Financial',
    '{"tables":{"main":"fee_payments"},"fields":[{"table":"fee_payments","column":"payment_date","alias":"payment_month"},{"table":"fee_payments","column":"amount","aggregate":"SUM","alias":"total_revenue"},{"table":"fee_payments","column":"payment_method","alias":"method"}],"groupBy":["MONTH(payment_date)","YEAR(payment_date)","payment_method"],"orderBy":[{"field":"payment_date","direction":"DESC"}]}',
    'system'
  );
-- Create indexes for performance
CREATE INDEX idx_reports_composite ON reports(status, created_by, created_at);
CREATE INDEX idx_executions_composite ON report_executions(report_id, executed_at, status);
CREATE INDEX idx_schedules_composite ON report_schedules(status, next_execution);
CREATE INDEX idx_cache_composite ON report_cache(report_id, expires_at, hit_count);