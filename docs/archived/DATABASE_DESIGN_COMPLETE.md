# SCHOOL ERP - COMPLETE DATABASE DESIGN SPECIFICATION

**Version**: 1.0  
**Date**: August 19, 2025  
**Status**: FINAL SPECIFICATION  
**Q&A Decisions**: Incorporated from User Session

---

## 🏗️ **ARCHITECTURE OVERVIEW**

### **Database Strategy**

- **System Database**: `school_erp_system` (Q1 Decision)
- **Trust Databases**: `school_erp_trust_{trustCode}` (Q1 Decision)
- **Isolation Level**: Database-level separation (Q5 Multi-tenant)
- **Primary Keys**: INTEGER auto-increment for performance (Q3 Decision)

### **Model Organization** (Hybrid Architecture)

```
models/                     # CORE SHARED MODELS
├── index.js               # Central model loader & associations
├── User.js                # Base user (students + staff)
├── Student.js             # Student-specific fields (extends User concept)
├── School.js              # School within trust
├── Class.js               # Academic classes
├── Section.js             # Class sections
├── Subject.js             # Subjects taught
└── AcademicYear.js        # Academic year configuration

modules/                   # DOMAIN-SPECIFIC MODELS
├── fees/models/
│   ├── FeeStructure.js    # Fee configuration per class/section
│   ├── FeeRule.js         # Configurable fee calculation rules
│   └── FeeTransaction.js  # Payment records
├── attendance/models/
│   ├── AttendanceRecord.js # Daily attendance records
│   └── AttendanceConfig.js # Holiday calendars, attendance rules
├── communication/models/
│   ├── MessageTemplate.js # Configurable message templates
│   ├── Message.js         # Sent messages
│   └── CommunicationLog.js # Delivery tracking
└── audit/models/
    └── AuditLog.js        # Comprehensive audit trail
```

---

## 🗄️ **SYSTEM DATABASE SCHEMA** (`school_erp_system`)

### **Core System Tables**

#### **trusts** (Master Registry)

```sql
CREATE TABLE trusts (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  trust_name VARCHAR(200) NOT NULL,
  trust_code VARCHAR(20) NOT NULL UNIQUE,
  subdomain VARCHAR(50) NOT NULL UNIQUE,
  contact_email VARCHAR(255) NOT NULL UNIQUE,
  contact_phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'India',
  database_name VARCHAR(100) NOT NULL UNIQUE,
  status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
  tenant_config JSON, -- Configurable features per tenant
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_trusts_subdomain (subdomain),
  INDEX idx_trusts_status (status),
  INDEX idx_trusts_code (trust_code)
);
```

#### **system_users** (Super Admins)

```sql
CREATE TABLE system_users (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role ENUM('SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEVELOPER') DEFAULT 'SYSTEM_ADMIN',
  permissions JSON,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_system_users_email (email),
  INDEX idx_system_users_role (role),
  INDEX idx_system_users_active (is_active)
);
```

#### **system_audit_logs** (Cross-Tenant Audit)

```sql
CREATE TABLE system_audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  trust_id INTEGER,
  user_id INTEGER,
  user_type ENUM('SYSTEM_USER', 'TRUST_USER') NOT NULL,
  action VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  table_name VARCHAR(100),
  record_id VARCHAR(50),
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_audit_trust_user (trust_id, user_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_module (module),
  INDEX idx_audit_created (created_at),
  FOREIGN KEY (trust_id) REFERENCES trusts(id) ON DELETE SET NULL
);
```

---

## 🏫 **TRUST DATABASE SCHEMA** (`school_erp_trust_{trustCode}`)

### **Core Academic Models**

#### **users** (Students + Staff with Login)

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  employee_id VARCHAR(20) UNIQUE, -- For staff
  student_id VARCHAR(20) UNIQUE,  -- For students
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('TRUST_ADMIN', 'PRINCIPAL', 'TEACHER', 'STAFF', 'STUDENT', 'PARENT') NOT NULL,
  status ENUM('ACTIVE', 'INACTIVE', 'LOCKED', 'GRADUATED') DEFAULT 'ACTIVE',
  school_id INTEGER,
  department VARCHAR(100),
  designation VARCHAR(100),
  joining_date DATE,
  date_of_birth DATE,
  gender ENUM('MALE', 'FEMALE', 'OTHER'),
  address TEXT,
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  profile_picture_url VARCHAR(500),
  permissions JSON, -- RBAC permissions per user
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_users_email (email),
  INDEX idx_users_role (role),
  INDEX idx_users_school (school_id),
  INDEX idx_users_employee_id (employee_id),
  INDEX idx_users_student_id (student_id),
  INDEX idx_users_status (status),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
);
```

#### **students** (Student-Specific Academic Info)

```sql
CREATE TABLE students (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  admission_number VARCHAR(50) NOT NULL UNIQUE,
  roll_number VARCHAR(20),
  class_id INTEGER,
  section_id INTEGER,
  academic_year_id INTEGER NOT NULL,
  admission_date DATE NOT NULL,
  previous_school VARCHAR(200),
  blood_group VARCHAR(10),
  allergies TEXT,
  medical_conditions TEXT,
  transport_required BOOLEAN DEFAULT FALSE,
  hostel_required BOOLEAN DEFAULT FALSE,

  -- Parent/Guardian Information
  father_name VARCHAR(100),
  father_phone VARCHAR(20),
  father_email VARCHAR(255),
  father_occupation VARCHAR(100),
  mother_name VARCHAR(100),
  mother_phone VARCHAR(20),
  mother_email VARCHAR(255),
  mother_occupation VARCHAR(100),
  guardian_name VARCHAR(100),
  guardian_phone VARCHAR(20),
  guardian_email VARCHAR(255),
  guardian_relation VARCHAR(50),

  status ENUM('ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED', 'DROPPED') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_students_user (user_id),
  INDEX idx_students_admission (admission_number),
  INDEX idx_students_class_section (class_id, section_id),
  INDEX idx_students_academic_year (academic_year_id),
  INDEX idx_students_status (status),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE RESTRICT
);
```

#### **schools** (Multi-School Trust Support)

```sql
CREATE TABLE schools (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  school_name VARCHAR(200) NOT NULL,
  school_code VARCHAR(20) NOT NULL UNIQUE,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(255),
  principal_user_id INTEGER,
  website VARCHAR(255),
  school_type ENUM('PRIMARY', 'SECONDARY', 'HIGHER_SECONDARY', 'COMPOSITE') NOT NULL,
  affiliation_board VARCHAR(100), -- CBSE, ICSE, State Board, etc.
  affiliation_number VARCHAR(50),
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_schools_code (school_code),
  INDEX idx_schools_principal (principal_user_id),
  INDEX idx_schools_status (status),
  FOREIGN KEY (principal_user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

#### **academic_years** (Tenant Configurable)

```sql
CREATE TABLE academic_years (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  year_name VARCHAR(50) NOT NULL, -- e.g., "2024-25"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  school_id INTEGER, -- NULL = Trust-wide, specific = School-specific
  status ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_academic_years_current (is_current),
  INDEX idx_academic_years_school (school_id),
  INDEX idx_academic_years_dates (start_date, end_date),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  UNIQUE KEY uk_academic_year_school (year_name, school_id)
);
```

#### **classes** (Academic Classes)

```sql
CREATE TABLE classes (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  class_name VARCHAR(50) NOT NULL, -- e.g., "Class 10", "Grade 5"
  class_code VARCHAR(20) NOT NULL,
  school_id INTEGER NOT NULL,
  class_order INTEGER NOT NULL, -- For sorting (1, 2, 3... 12)
  description TEXT,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_classes_school (school_id),
  INDEX idx_classes_order (class_order),
  INDEX idx_classes_status (status),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  UNIQUE KEY uk_class_school (class_code, school_id)
);
```

#### **sections** (Class Sections)

```sql
CREATE TABLE sections (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  section_name VARCHAR(10) NOT NULL, -- A, B, C, etc.
  class_id INTEGER NOT NULL,
  class_teacher_user_id INTEGER,
  max_students INTEGER DEFAULT 40,
  room_number VARCHAR(20),
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_sections_class (class_id),
  INDEX idx_sections_teacher (class_teacher_user_id),
  INDEX idx_sections_status (status),
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (class_teacher_user_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uk_section_class (section_name, class_id)
);
```

#### **subjects** (School-Level Subjects)

```sql
CREATE TABLE subjects (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  subject_name VARCHAR(100) NOT NULL,
  subject_code VARCHAR(20) NOT NULL,
  school_id INTEGER NOT NULL,
  subject_type ENUM('CORE', 'ELECTIVE', 'OPTIONAL', 'EXTRA_CURRICULAR') DEFAULT 'CORE',
  description TEXT,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_subjects_school (school_id),
  INDEX idx_subjects_type (subject_type),
  INDEX idx_subjects_status (status),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  UNIQUE KEY uk_subject_school (subject_code, school_id)
);
```

---

## 💰 **FEE MANAGEMENT MODELS**

#### **fee_structures** (Tenant Configurable)

```sql
CREATE TABLE fee_structures (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  structure_name VARCHAR(100) NOT NULL,
  school_id INTEGER NOT NULL,
  class_id INTEGER,
  section_id INTEGER,
  academic_year_id INTEGER NOT NULL,
  fee_type ENUM('TUITION', 'TRANSPORT', 'HOSTEL', 'LIBRARY', 'LABORATORY', 'SPORTS', 'OTHER') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  frequency ENUM('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY', 'ONE_TIME') NOT NULL,
  due_day INTEGER, -- Day of month for recurring fees
  late_fee_amount DECIMAL(10,2) DEFAULT 0,
  late_fee_grace_days INTEGER DEFAULT 0,
  is_mandatory BOOLEAN DEFAULT TRUE,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_fee_structures_school (school_id),
  INDEX idx_fee_structures_class_section (class_id, section_id),
  INDEX idx_fee_structures_academic_year (academic_year_id),
  INDEX idx_fee_structures_type (fee_type),
  INDEX idx_fee_structures_status (status),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE
);
```

#### **fee_transactions** (Payment Records)

```sql
CREATE TABLE fee_transactions (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  student_id INTEGER NOT NULL,
  fee_structure_id INTEGER NOT NULL,
  transaction_type ENUM('PAYMENT', 'REFUND', 'ADJUSTMENT', 'WAIVER') DEFAULT 'PAYMENT',
  amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('CASH', 'CHEQUE', 'ONLINE', 'BANK_TRANSFER', 'UPI') NOT NULL,
  payment_reference VARCHAR(100), -- Transaction ID from payment gateway
  payment_date DATE NOT NULL,
  academic_month INTEGER, -- For monthly fees (1-12)
  late_fee_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  remarks TEXT,
  collected_by_user_id INTEGER,
  status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') DEFAULT 'COMPLETED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_fee_transactions_student (student_id),
  INDEX idx_fee_transactions_structure (fee_structure_id),
  INDEX idx_fee_transactions_date (payment_date),
  INDEX idx_fee_transactions_status (status),
  INDEX idx_fee_transactions_collector (collected_by_user_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id) ON DELETE CASCADE,
  FOREIGN KEY (collected_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

---

## 📊 **ATTENDANCE SYSTEM**

#### **attendance_configs** (Holiday Calendar)

```sql
CREATE TABLE attendance_configs (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  school_id INTEGER NOT NULL,
  academic_year_id INTEGER NOT NULL,
  config_type ENUM('HOLIDAY', 'WORKING_DAY', 'HALF_DAY', 'SPECIAL_EVENT') NOT NULL,
  config_date DATE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  is_recurring BOOLEAN DEFAULT FALSE, -- For annual holidays
  applies_to_classes JSON, -- Array of class IDs, NULL = all classes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_attendance_configs_school_year (school_id, academic_year_id),
  INDEX idx_attendance_configs_date (config_date),
  INDEX idx_attendance_configs_type (config_type),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
  UNIQUE KEY uk_attendance_config (school_id, config_date, config_type)
);
```

#### **attendance_records** (Daily Attendance)

```sql
CREATE TABLE attendance_records (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  student_id INTEGER NOT NULL,
  attendance_date DATE NOT NULL,
  status ENUM('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'EXCUSED') NOT NULL,
  check_in_time TIME,
  check_out_time TIME,
  remarks TEXT,
  marked_by_user_id INTEGER NOT NULL,
  marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_attendance_student_date (student_id, attendance_date),
  INDEX idx_attendance_date (attendance_date),
  INDEX idx_attendance_status (status),
  INDEX idx_attendance_marked_by (marked_by_user_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  UNIQUE KEY uk_student_date (student_id, attendance_date)
);
```

---

## 📨 **COMMUNICATION SYSTEM**

#### **message_templates** (Configurable Templates)

```sql
CREATE TABLE message_templates (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  template_name VARCHAR(100) NOT NULL,
  template_code VARCHAR(50) NOT NULL,
  school_id INTEGER NOT NULL,
  message_type ENUM('SMS', 'EMAIL', 'PUSH_NOTIFICATION', 'IN_APP') NOT NULL,
  subject VARCHAR(200), -- For emails
  message_body TEXT NOT NULL,
  variables JSON, -- Available template variables
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_message_templates_school (school_id),
  INDEX idx_message_templates_type (message_type),
  INDEX idx_message_templates_code (template_code),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  UNIQUE KEY uk_template_school (template_code, school_id)
);
```

#### **messages** (Sent Messages)

```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  template_id INTEGER,
  sender_user_id INTEGER NOT NULL,
  school_id INTEGER NOT NULL,
  message_type ENUM('SMS', 'EMAIL', 'PUSH_NOTIFICATION', 'IN_APP') NOT NULL,
  recipient_type ENUM('INDIVIDUAL', 'CLASS', 'SECTION', 'SCHOOL', 'CUSTOM_GROUP') NOT NULL,
  subject VARCHAR(200),
  message_body TEXT NOT NULL,
  recipient_filter JSON, -- Criteria for bulk messages
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status ENUM('DRAFT', 'QUEUED', 'SENDING', 'COMPLETED', 'FAILED') DEFAULT 'DRAFT',
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_messages_sender (sender_user_id),
  INDEX idx_messages_school (school_id),
  INDEX idx_messages_type (message_type),
  INDEX idx_messages_status (status),
  INDEX idx_messages_scheduled (scheduled_at),
  FOREIGN KEY (template_id) REFERENCES message_templates(id) ON DELETE SET NULL,
  FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);
```

#### **communication_logs** (Delivery Tracking)

```sql
CREATE TABLE communication_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  message_id INTEGER NOT NULL,
  recipient_user_id INTEGER,
  recipient_phone VARCHAR(20),
  recipient_email VARCHAR(255),
  delivery_status ENUM('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED') DEFAULT 'QUEUED',
  provider_response TEXT,
  delivery_timestamp TIMESTAMP,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_communication_logs_message (message_id),
  INDEX idx_communication_logs_recipient (recipient_user_id),
  INDEX idx_communication_logs_status (delivery_status),
  INDEX idx_communication_logs_timestamp (delivery_timestamp),
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

---

## 🔍 **AUDIT & SECURITY SYSTEM**

#### **audit_logs** (Complete Change Tracking)

```sql
CREATE TABLE audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id INTEGER,
  user_role VARCHAR(50),
  action ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW') NOT NULL,
  module VARCHAR(50) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id INTEGER,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  session_id VARCHAR(255),
  request_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_audit_logs_user (user_id),
  INDEX idx_audit_logs_action (action),
  INDEX idx_audit_logs_module (module),
  INDEX idx_audit_logs_table (table_name),
  INDEX idx_audit_logs_created (created_at),
  INDEX idx_audit_logs_record (table_name, record_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

#### **user_permissions** (RBAC with Maker-Checker)

```sql
CREATE TABLE user_permissions (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  user_id INTEGER NOT NULL,
  module VARCHAR(50) NOT NULL,
  permission_type ENUM('VIEW', 'ADD', 'EDIT', 'DELETE', 'APPROVE') NOT NULL,
  can_make BOOLEAN DEFAULT FALSE,
  can_check BOOLEAN DEFAULT FALSE,
  granted_by_user_id INTEGER,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,

  INDEX idx_user_permissions_user (user_id),
  INDEX idx_user_permissions_module (module),
  INDEX idx_user_permissions_type (permission_type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uk_user_module_permission (user_id, module, permission_type)
);
```

---

## 🚀 **PERFORMANCE OPTIMIZATION STRATEGY**

### **Critical Indexes** (Senior DBA Recommendations)

#### **High-Priority Query Optimization**

```sql
-- Student lookup (most frequent)
CREATE INDEX idx_students_lookup ON students (admission_number, status, academic_year_id);
CREATE INDEX idx_users_student_lookup ON users (student_id, email, status);

-- Fee collection reports
CREATE INDEX idx_fee_transactions_reports ON fee_transactions (payment_date, status, student_id);
CREATE INDEX idx_fee_structures_collection ON fee_structures (academic_year_id, school_id, fee_type, status);

-- Attendance reports
CREATE INDEX idx_attendance_monthly ON attendance_records (attendance_date, status) USING BTREE;
CREATE INDEX idx_attendance_student_range ON attendance_records (student_id, attendance_date) USING BTREE;

-- Communication delivery tracking
CREATE INDEX idx_communication_bulk ON communication_logs (message_id, delivery_status, delivery_timestamp);

-- Audit log queries (with partitioning strategy)
CREATE INDEX idx_audit_log_user_date ON audit_logs (user_id, created_at) USING BTREE;
CREATE INDEX idx_audit_log_module_date ON audit_logs (module, table_name, created_at) USING BTREE;
```

#### **Full-Text Search Indexes**

```sql
-- Student name search
ALTER TABLE users ADD FULLTEXT(first_name, last_name);
ALTER TABLE students ADD FULLTEXT(admission_number);

-- School-wide search
ALTER TABLE schools ADD FULLTEXT(school_name);
ALTER TABLE classes ADD FULLTEXT(class_name);
ALTER TABLE subjects ADD FULLTEXT(subject_name);
```

#### **Partitioning Strategy** (Large Data Tables)

```sql
-- Partition audit logs by year for 2-year retention
ALTER TABLE audit_logs PARTITION BY RANGE (YEAR(created_at)) (
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION p2025 VALUES LESS THAN (2026),
  PARTITION p2026 VALUES LESS THAN (2027),
  PARTITION future VALUES LESS THAN MAXVALUE
);

-- Partition attendance by academic year
ALTER TABLE attendance_records PARTITION BY RANGE (YEAR(attendance_date)) (
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION p2025 VALUES LESS THAN (2026),
  PARTITION p2026 VALUES LESS THAN (2027),
  PARTITION future VALUES LESS THAN MAXVALUE
);
```

---

## 🔄 **DATA RETENTION & ARCHIVAL STRATEGY**

### **Automated Cleanup Procedures**

```sql
-- Archive old audit logs (>2 years) to separate table
CREATE EVENT audit_log_archival
ON SCHEDULE EVERY 1 MONTH
DO
BEGIN
  INSERT INTO audit_logs_archive
  SELECT * FROM audit_logs
  WHERE created_at < DATE_SUB(NOW(), INTERVAL 2 YEAR);

  DELETE FROM audit_logs
  WHERE created_at < DATE_SUB(NOW(), INTERVAL 2 YEAR);
END;

-- Archive graduated student data
CREATE EVENT student_data_archival
ON SCHEDULE EVERY 1 YEAR
DO
BEGIN
  UPDATE students
  SET status = 'ARCHIVED'
  WHERE status = 'GRADUATED'
  AND updated_at < DATE_SUB(NOW(), INTERVAL 2 YEAR);
END;
```

---

## 📋 **IMPLEMENTATION CHECKLIST**

### **Phase 1: Core Foundation** ✅

- [x] Fix database naming to `school_erp_system`
- [x] Create central `models/index.js` for associations (Q13)
- [x] Implement all core models with INTEGER PKs
- [ ] Create database migration scripts

### **Phase 2: Module Models**

- [ ] Create fee management models
- [ ] Create attendance models
- [ ] Create communication models
- [ ] Create audit models

### **Phase 3: Associations & Constraints**

- [ ] Define all foreign key relationships
- [ ] Implement cascade rules
- [ ] Add check constraints for business rules

### **Phase 4: Performance Optimization**

- [ ] Create all recommended indexes
- [ ] Implement partitioning for large tables
- [ ] Set up full-text search indexes

### **Phase 5: Security & Audit**

- [ ] Implement RBAC permission system
- [ ] Set up comprehensive audit logging
- [ ] Create data retention procedures

---

## 🎯 **NEXT IMMEDIATE ACTIONS**

1. **Create `models/index.js`** - Central model loader with associations
2. **Fix existing models** - Update with proper foreign keys and indexes
3. **Create module models** - Fee, Attendance, Communication, Audit
4. **Database migration scripts** - Convert current SQL to Sequelize migrations
5. **Test associations** - Verify all relationships work correctly

Would you like me to start implementing any specific part of this design?
