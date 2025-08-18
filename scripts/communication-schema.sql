/**
 * Communication System Database Schema Updates
 * SQL scripts for creating communication-related tables
 */
-- Communication Settings Table
CREATE TABLE IF NOT EXISTS communication_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  is_encrypted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_setting_key (setting_key)
);
-- Communication Templates Table
CREATE TABLE IF NOT EXISTS communication_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  type ENUM('email', 'sms') NOT NULL,
  category ENUM(
    'fee_reminder',
    'admission_confirmation',
    'attendance_alert',
    'exam_notification',
    'general_announcement',
    'payment_confirmation',
    'payment_failure',
    'account_activation',
    'password_reset'
  ) NOT NULL,
  subject VARCHAR(200),
  -- For email templates
  content TEXT NOT NULL,
  variables JSON,
  -- Template variables
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_default_template (type, category, is_default),
  INDEX idx_type_category (type, category),
  INDEX idx_active (is_active)
);
-- Communication History Table
CREATE TABLE IF NOT EXISTS communication_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('email', 'sms') NOT NULL,
  to_address VARCHAR(255) NOT NULL,
  -- Email or phone number
  from_address VARCHAR(255),
  subject VARCHAR(200),
  -- For emails
  message TEXT NOT NULL,
  template_id INT NULL,
  status ENUM(
    'pending',
    'sent',
    'delivered',
    'failed',
    'bounced'
  ) DEFAULT 'pending',
  error_message TEXT,
  provider VARCHAR(50),
  -- Which provider was used
  provider_message_id VARCHAR(255),
  -- Provider's message ID
  delivery_time TIMESTAMP NULL,
  opened_at TIMESTAMP NULL,
  -- Email open tracking
  clicked_at TIMESTAMP NULL,
  -- Link click tracking
  recipient_type ENUM('student', 'parent', 'staff', 'admin') DEFAULT 'parent',
  recipient_id INT,
  -- ID of the recipient (student_id, user_id, etc.)
  campaign_id VARCHAR(100),
  -- For bulk communications
  cost DECIMAL(10, 4) DEFAULT 0.00,
  -- Cost of sending (especially for SMS)
  metadata JSON,
  -- Additional data like attachments, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES communication_templates(id) ON DELETE
  SET NULL,
    INDEX idx_type_status (type, status),
    INDEX idx_recipient (recipient_type, recipient_id),
    INDEX idx_created_at (created_at),
    INDEX idx_campaign (campaign_id),
    INDEX idx_provider (provider)
);
-- Notification Jobs Table (for bulk processing)
CREATE TABLE IF NOT EXISTS notification_jobs (
  id VARCHAR(50) PRIMARY KEY,
  type ENUM('email', 'sms') NOT NULL,
  status ENUM(
    'pending',
    'processing',
    'completed',
    'completed_with_errors',
    'failed'
  ) DEFAULT 'pending',
  data JSON NOT NULL,
  -- Job configuration
  recipients_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  attempts INT DEFAULT 0,
  error TEXT,
  results JSON,
  -- Success/failure counts and details
  INDEX idx_type_status (type, status),
  INDEX idx_created_at (created_at)
);
-- Notification Delivery Logs Table
CREATE TABLE IF NOT EXISTS notification_delivery_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  job_id VARCHAR(50) NOT NULL,
  recipient_type ENUM('student', 'parent', 'staff', 'admin') DEFAULT 'parent',
  recipient_id INT,
  recipient_contact VARCHAR(255),
  -- Email or phone
  status ENUM('success', 'failed') NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES notification_jobs(id) ON DELETE CASCADE,
  INDEX idx_job_id (job_id),
  INDEX idx_recipient (recipient_type, recipient_id),
  INDEX idx_status (status)
);
-- Email Delivery Tracking Table
CREATE TABLE IF NOT EXISTS email_delivery_tracking (
  id INT PRIMARY KEY AUTO_INCREMENT,
  communication_id INT NOT NULL,
  event_type ENUM(
    'delivered',
    'bounced',
    'opened',
    'clicked',
    'complained',
    'unsubscribed'
  ) NOT NULL,
  event_data JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,
  ip_address VARCHAR(45),
  FOREIGN KEY (communication_id) REFERENCES communication_history(id) ON DELETE CASCADE,
  INDEX idx_communication_id (communication_id),
  INDEX idx_event_type (event_type),
  INDEX idx_timestamp (timestamp)
);
-- SMS Delivery Reports Table
CREATE TABLE IF NOT EXISTS sms_delivery_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  communication_id INT NOT NULL,
  provider_message_id VARCHAR(255),
  status ENUM(
    'sent',
    'delivered',
    'failed',
    'expired',
    'rejected'
  ) NOT NULL,
  status_description TEXT,
  delivered_at TIMESTAMP NULL,
  cost DECIMAL(10, 4) DEFAULT 0.00,
  error_code VARCHAR(10),
  error_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (communication_id) REFERENCES communication_history(id) ON DELETE CASCADE,
  INDEX idx_communication_id (communication_id),
  INDEX idx_provider_message_id (provider_message_id),
  INDEX idx_status (status)
);
-- Communication Preferences Table
CREATE TABLE IF NOT EXISTS communication_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  recipient_type ENUM('student', 'parent', 'staff', 'admin') NOT NULL,
  recipient_id INT NOT NULL,
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT TRUE,
  email_frequency ENUM('immediate', 'daily', 'weekly', 'disabled') DEFAULT 'immediate',
  sms_frequency ENUM('immediate', 'daily', 'disabled') DEFAULT 'immediate',
  categories JSON,
  -- Which categories they want to receive
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_recipient (recipient_type, recipient_id),
  INDEX idx_recipient (recipient_type, recipient_id)
);
-- Communication Statistics Table (for analytics)
CREATE TABLE IF NOT EXISTS communication_statistics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  date DATE NOT NULL,
  type ENUM('email', 'sms') NOT NULL,
  provider VARCHAR(50),
  total_sent INT DEFAULT 0,
  total_delivered INT DEFAULT 0,
  total_failed INT DEFAULT 0,
  total_bounced INT DEFAULT 0,
  total_opened INT DEFAULT 0,
  -- Email only
  total_clicked INT DEFAULT 0,
  -- Email only
  total_cost DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_date_type_provider (date, type, provider),
  INDEX idx_date (date),
  INDEX idx_type (type)
);
-- Insert default communication templates
INSERT INTO communication_templates (
    name,
    type,
    category,
    subject,
    content,
    variables,
    is_default,
    description
  )
VALUES -- Email Templates
  (
    'Fee Reminder',
    'email',
    'fee_reminder',
    'Fee Payment Reminder - {{student_name}}',
    '<p>Dear Parent/Guardian,</p><p>This is a reminder that the fee payment for <strong>{{student_name}}</strong> is due on <strong>{{due_date}}</strong>.</p><p><strong>Amount Due:</strong> ₹{{amount}}</p><p>Please make the payment at your earliest convenience to avoid late fees.</p><p>Thank you!</p>',
    '["student_name", "due_date", "amount"]',
    TRUE,
    'Default fee reminder email template'
  ),
  (
    'Admission Confirmation',
    'email',
    'admission_confirmation',
    'Admission Confirmed - {{student_name}}',
    '<p>Dear Parent/Guardian,</p><p>We are pleased to confirm the admission of <strong>{{student_name}}</strong> to <strong>{{class_name}}</strong> for the academic year <strong>{{academic_year}}</strong>.</p><p><strong>Student ID:</strong> {{student_id}}</p><p><strong>Class:</strong> {{class_name}}</p><p><strong>Start Date:</strong> {{start_date}}</p><p>Welcome to our school family!</p>',
    '["student_name", "class_name", "academic_year", "student_id", "start_date"]',
    TRUE,
    'Default admission confirmation email'
  ),
  (
    'Payment Confirmation',
    'email',
    'payment_confirmation',
    'Payment Received - {{student_name}}',
    '<p>Dear Parent/Guardian,</p><p>We have successfully received your payment for <strong>{{student_name}}</strong>.</p><p><strong>Amount Paid:</strong> ₹{{amount}}</p><p><strong>Transaction ID:</strong> {{transaction_id}}</p><p><strong>Payment Date:</strong> {{payment_date}}</p><p>Thank you for your payment!</p>',
    '["student_name", "amount", "transaction_id", "payment_date"]',
    TRUE,
    'Default payment confirmation email'
  ),
  -- SMS Templates
  (
    'Fee Reminder SMS',
    'sms',
    'fee_reminder',
    NULL,
    'Fee reminder for {{student_name}}. Amount: ₹{{amount}}, Due: {{due_date}}. Please pay to avoid late fees.',
    '["student_name", "amount", "due_date"]',
    TRUE,
    'Default fee reminder SMS template'
  ),
  (
    'Attendance Alert SMS',
    'sms',
    'attendance_alert',
    NULL,
    'Alert: {{student_name}} was absent on {{date}}. Please contact school if this was due to illness.',
    '["student_name", "date"]',
    TRUE,
    'Default attendance alert SMS'
  ),
  (
    'Payment Confirmation SMS',
    'sms',
    'payment_confirmation',
    NULL,
    'Payment received for {{student_name}}. Amount: ₹{{amount}}, Txn: {{transaction_id}}. Thank you!',
    '["student_name", "amount", "transaction_id"]',
    TRUE,
    'Default payment confirmation SMS'
  );
-- Insert default communication settings
INSERT INTO communication_settings (setting_key, setting_value)
VALUES ('default_from_name', 'School Management System'),
  (
    'email_signature',
    '<br><br>Best regards,<br>School Administration<br>Contact: +91-XXXXXXXXXX'
  ),
  ('sms_signature', ' - School Admin'),
  ('max_email_recipients', '100'),
  ('max_sms_recipients', '1000'),
  ('email_rate_limit', '50'),
  -- emails per minute
  ('sms_rate_limit', '100');
-- SMS per minute