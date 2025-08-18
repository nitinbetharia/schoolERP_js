-- ================================================================
-- TRUST DATABASE TEMPLATE (Per-Tenant Database)
-- Database: school_erp_trust_{trust_code}
-- Purpose: Completely isolated trust-specific operational data
-- ================================================================
-- This template will be used to create individual databases for each trust
-- Variables to be replaced: {trust_code}, {trust_name}
-- Trust Configuration Table
CREATE TABLE `trust_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) NOT NULL,
  `config_value` text DEFAULT NULL,
  `data_type` enum('STRING', 'NUMBER', 'BOOLEAN', 'JSON') NOT NULL DEFAULT 'STRING',
  `description` text DEFAULT NULL,
  `is_editable` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_trust_config_key` (`config_key`),
  KEY `idx_trust_config_key` (`config_key`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Academic Years
CREATE TABLE `academic_years` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `year_name` varchar(20) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('DRAFT', 'ACTIVE', 'COMPLETED') NOT NULL DEFAULT 'DRAFT',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_academic_years_name` (`year_name`),
  KEY `idx_academic_years_current` (`is_current`),
  KEY `idx_academic_years_status` (`status`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Schools
CREATE TABLE `schools` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `school_name` varchar(200) NOT NULL,
  `school_code` varchar(20) NOT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `principal_name` varchar(200) DEFAULT NULL,
  `board_affiliation` varchar(100) DEFAULT NULL,
  `established_year` year DEFAULT NULL,
  `status` enum('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_schools_code` (`school_code`),
  KEY `idx_schools_status` (`status`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Classes
CREATE TABLE `classes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `school_id` int(11) NOT NULL,
  `class_name` varchar(50) NOT NULL,
  `class_code` varchar(20) NOT NULL,
  `academic_year_id` int(11) NOT NULL,
  `class_order` int(11) DEFAULT 0,
  `max_students` int(11) DEFAULT 40,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_classes_school_code_year` (`school_id`, `class_code`, `academic_year_id`),
  KEY `fk_classes_school` (`school_id`),
  KEY `fk_classes_academic_year` (`academic_year_id`),
  KEY `idx_classes_active` (`is_active`),
  CONSTRAINT `fk_classes_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_classes_academic_year` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Sections
CREATE TABLE `sections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class_id` int(11) NOT NULL,
  `section_name` varchar(10) NOT NULL,
  `max_students` int(11) DEFAULT 40,
  `class_teacher_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sections_class_name` (`class_id`, `section_name`),
  KEY `fk_sections_class` (`class_id`),
  KEY `fk_sections_teacher` (`class_teacher_id`),
  CONSTRAINT `fk_sections_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Subjects
CREATE TABLE `subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `school_id` int(11) NOT NULL,
  `subject_name` varchar(100) NOT NULL,
  `subject_code` varchar(20) NOT NULL,
  `subject_type` enum('CORE', 'ELECTIVE', 'EXTRA_CURRICULAR') NOT NULL DEFAULT 'CORE',
  `max_marks` int(11) DEFAULT 100,
  `pass_marks` int(11) DEFAULT 35,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_subjects_school_code` (`school_id`, `subject_code`),
  KEY `fk_subjects_school` (`school_id`),
  KEY `idx_subjects_type` (`subject_type`),
  CONSTRAINT `fk_subjects_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Users (Trust Staff - Teachers, Admins, etc.)
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(20) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum(
    'TRUST_ADMIN',
    'SCHOOL_ADMIN',
    'TEACHER',
    'ACCOUNTANT',
    'PARENT',
    'STUDENT'
  ) NOT NULL,
  `status` enum('ACTIVE', 'INACTIVE', 'LOCKED') NOT NULL DEFAULT 'ACTIVE',
  `school_id` int(11) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `date_of_joining` date DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('MALE', 'FEMALE', 'OTHER') DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `emergency_contact_name` varchar(200) DEFAULT NULL,
  `emergency_contact_phone` varchar(20) DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `last_activity` timestamp NULL DEFAULT NULL,
  `failed_login_attempts` int(11) NOT NULL DEFAULT 0,
  `locked_until` timestamp NULL DEFAULT NULL,
  `password_reset_token` varchar(255) DEFAULT NULL,
  `password_reset_expires` timestamp NULL DEFAULT NULL,
  `email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `phone_verified` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`),
  UNIQUE KEY `uk_users_employee_id` (`employee_id`),
  KEY `fk_users_school` (`school_id`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_status` (`status`),
  CONSTRAINT `fk_users_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE
  SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- User School Assignments (Multi-school access)
CREATE TABLE `user_school_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `school_id` int(11) NOT NULL,
  `role` enum(
    'TRUST_ADMIN',
    'SCHOOL_ADMIN',
    'TEACHER',
    'ACCOUNTANT'
  ) NOT NULL,
  `permissions` json DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `assigned_by` int(11) DEFAULT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_school_assignments` (`user_id`, `school_id`),
  KEY `fk_assignments_user` (`user_id`),
  KEY `fk_assignments_school` (`school_id`),
  KEY `fk_assignments_assigned_by` (`assigned_by`),
  CONSTRAINT `fk_assignments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_assignments_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_assignments_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE
  SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Students
CREATE TABLE `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` varchar(20) NOT NULL,
  `admission_number` varchar(50) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `date_of_birth` date NOT NULL,
  `gender` enum('MALE', 'FEMALE', 'OTHER') NOT NULL,
  `blood_group` varchar(10) DEFAULT NULL,
  `religion` varchar(50) DEFAULT NULL,
  `caste` varchar(50) DEFAULT NULL,
  `nationality` varchar(50) DEFAULT 'Indian',
  `mother_tongue` varchar(50) DEFAULT NULL,
  `aadhar_number` varchar(12) DEFAULT NULL,
  `school_id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `section_id` int(11) DEFAULT NULL,
  `roll_number` varchar(20) DEFAULT NULL,
  `admission_date` date NOT NULL,
  `enrollment_date` date DEFAULT NULL,
  `academic_year_id` int(11) NOT NULL,
  `status` enum(
    'ACTIVE',
    'INACTIVE',
    'TRANSFERRED',
    'GRADUATED',
    'DROPPED'
  ) NOT NULL DEFAULT 'ACTIVE',
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `photo_url` varchar(500) DEFAULT NULL,
  `medical_conditions` text DEFAULT NULL,
  `allergies` text DEFAULT NULL,
  `emergency_contact_name` varchar(200) DEFAULT NULL,
  `emergency_contact_phone` varchar(20) DEFAULT NULL,
  `emergency_contact_relation` varchar(50) DEFAULT NULL,
  `transport_required` tinyint(1) DEFAULT 0,
  `transport_route` varchar(100) DEFAULT NULL,
  `hostel_required` tinyint(1) DEFAULT 0,
  `previous_school` varchar(200) DEFAULT NULL,
  `transfer_certificate_number` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_students_id` (`student_id`),
  UNIQUE KEY `uk_students_admission` (`school_id`, `admission_number`),
  KEY `fk_students_school` (`school_id`),
  KEY `fk_students_class` (`class_id`),
  KEY `fk_students_section` (`section_id`),
  KEY `fk_students_academic_year` (`academic_year_id`),
  KEY `idx_students_status` (`status`),
  KEY `idx_students_roll` (`roll_number`),
  CONSTRAINT `fk_students_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_students_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE
  SET NULL,
    CONSTRAINT `fk_students_section` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE
  SET NULL,
    CONSTRAINT `fk_students_academic_year` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Student Parents
CREATE TABLE `student_parents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `parent_type` enum('FATHER', 'MOTHER', 'GUARDIAN') NOT NULL,
  `name` varchar(200) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `occupation` varchar(100) DEFAULT NULL,
  `annual_income` decimal(12, 2) DEFAULT NULL,
  `education_qualification` varchar(100) DEFAULT NULL,
  `is_primary_contact` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_parents_student` (`student_id`),
  KEY `idx_parents_type` (`parent_type`),
  CONSTRAINT `fk_parents_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Default Trust Configuration
INSERT INTO `trust_config` (
    `config_key`,
    `config_value`,
    `data_type`,
    `description`,
    `is_editable`
  )
VALUES (
    'trust_name',
    '{trust_name}',
    'STRING',
    'Trust name',
    1
  ),
  (
    'trust_code',
    '{trust_code}',
    'STRING',
    'Trust code',
    0
  ),
  (
    'academic_year_start_month',
    '4',
    'NUMBER',
    'Academic year start month (1-12)',
    1
  ),
  (
    'default_session_timeout',
    '240',
    'NUMBER',
    'Default user session timeout in minutes',
    1
  ),
  (
    'attendance_cutoff_time',
    '10:00',
    'STRING',
    'Daily attendance cutoff time',
    1
  ),
  (
    'fee_late_payment_grace_days',
    '7',
    'NUMBER',
    'Grace period for late fee payments',
    1
  ),
  (
    'sms_provider',
    'local',
    'STRING',
    'SMS service provider',
    1
  ),
  (
    'email_provider',
    'local',
    'STRING',
    'Email service provider',
    1
  ),
  (
    'backup_enabled',
    'true',
    'BOOLEAN',
    'Enable automatic backups',
    1
  ),
  (
    'multi_school_enabled',
    'false',
    'BOOLEAN',
    'Enable multi-school mode',
    1
  );