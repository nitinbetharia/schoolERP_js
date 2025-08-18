-- School ERP Database Schema
-- Master Database: school_erp_master
-- Trust Database Template: school_erp_trust_{trust_code}
-- ================================================================
-- MASTER DATABASE SCHEMA
-- ================================================================
CREATE DATABASE IF NOT EXISTS `school_erp_master` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `school_erp_master`;
-- System Configuration Table
CREATE TABLE `system_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) NOT NULL,
  `config_value` text DEFAULT NULL,
  `data_type` enum('STRING', 'NUMBER', 'BOOLEAN', 'JSON') NOT NULL DEFAULT 'STRING',
  `description` text DEFAULT NULL,
  `is_editable` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_system_config_key` (`config_key`),
  KEY `idx_system_config_key` (`config_key`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Trusts Registry
CREATE TABLE `trusts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `trust_name` varchar(200) NOT NULL,
  `trust_code` varchar(20) NOT NULL,
  `subdomain` varchar(50) NOT NULL,
  `contact_email` varchar(255) NOT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'India',
  `website` varchar(255) DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `theme_config` json DEFAULT NULL,
  `status` enum('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  `database_name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_trusts_code` (`trust_code`),
  UNIQUE KEY `uk_trusts_subdomain` (`subdomain`),
  UNIQUE KEY `uk_trusts_email` (`contact_email`),
  UNIQUE KEY `uk_trusts_database` (`database_name`),
  KEY `idx_trusts_subdomain` (`subdomain`),
  KEY `idx_trusts_status` (`status`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- System Users (SYSTEM_ADMIN, GROUP_ADMIN)
CREATE TABLE `system_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `role` enum('SYSTEM_ADMIN', 'GROUP_ADMIN') NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `failed_login_attempts` int(11) NOT NULL DEFAULT 0,
  `locked_until` timestamp NULL DEFAULT NULL,
  `password_reset_token` varchar(255) DEFAULT NULL,
  `password_reset_expires` timestamp NULL DEFAULT NULL,
  `status` enum('ACTIVE', 'INACTIVE', 'LOCKED') NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_system_users_username` (`username`),
  UNIQUE KEY `uk_system_users_email` (`email`),
  KEY `idx_system_users_email` (`email`),
  KEY `idx_system_users_role` (`role`),
  KEY `idx_system_users_status` (`status`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Migration Versions
CREATE TABLE `migration_versions` (
  `version` varchar(20) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `executed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`version`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- System Audit Logs
CREATE TABLE `system_audit_logs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `user_type` enum('SYSTEM_USER', 'TRUST_USER') NOT NULL,
  `action` varchar(100) NOT NULL,
  `table_name` varchar(100) DEFAULT NULL,
  `record_id` varchar(50) DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_system_audit_user` (`user_id`, `user_type`),
  KEY `idx_system_audit_action` (`action`),
  KEY `idx_system_audit_table` (`table_name`),
  KEY `idx_system_audit_created` (`created_at`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- System Sessions
CREATE TABLE `system_sessions` (
  `session_id` varchar(128) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_type` enum('SYSTEM_USER', 'TRUST_USER') NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `data` json DEFAULT NULL,
  `expires` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`session_id`),
  KEY `idx_system_sessions_user` (`user_id`, `user_type`),
  KEY `idx_system_sessions_expires` (`expires`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ================================================================
-- TRUST DATABASE SCHEMA TEMPLATE
-- ================================================================
-- This schema is replicated for each trust database
-- Academic Years
CREATE TABLE `academic_years` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `year_name` varchar(20) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('ACTIVE', 'INACTIVE', 'COMPLETED') NOT NULL DEFAULT 'ACTIVE',
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
  `principal_name` varchar(200) DEFAULT NULL,
  `principal_email` varchar(255) DEFAULT NULL,
  `principal_phone` varchar(20) DEFAULT NULL,
  `affiliation_number` varchar(100) DEFAULT NULL,
  `board` varchar(100) DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
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
  `class_name` varchar(50) NOT NULL,
  `class_order` int(11) NOT NULL,
  `school_id` int(11) NOT NULL,
  `academic_year_id` int(11) NOT NULL,
  `status` enum('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_classes_name_school_year` (`class_name`, `school_id`, `academic_year_id`),
  KEY `fk_classes_school` (`school_id`),
  KEY `fk_classes_academic_year` (`academic_year_id`),
  KEY `idx_classes_order` (`class_order`),
  CONSTRAINT `fk_classes_academic_year` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_classes_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Sections
CREATE TABLE `sections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `section_name` varchar(10) NOT NULL,
  `class_id` int(11) NOT NULL,
  `capacity` int(11) DEFAULT 30,
  `status` enum('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sections_name_class` (`section_name`, `class_id`),
  KEY `fk_sections_class` (`class_id`),
  CONSTRAINT `fk_sections_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Subjects
CREATE TABLE `subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subject_name` varchar(100) NOT NULL,
  `subject_code` varchar(20) NOT NULL,
  `class_id` int(11) NOT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT 1,
  `marks_total` int(11) DEFAULT 100,
  `pass_marks` int(11) DEFAULT 35,
  `status` enum('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_subjects_code_class` (`subject_code`, `class_id`),
  KEY `fk_subjects_class` (`class_id`),
  CONSTRAINT `fk_subjects_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Users
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
  SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- User School Assignments
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
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `assigned_by` int(11) NOT NULL,
  `status` enum('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_school_assignments` (`user_id`, `school_id`, `role`),
  KEY `fk_user_school_assignments_user` (`user_id`),
  KEY `fk_user_school_assignments_school` (`school_id`),
  KEY `fk_user_school_assignments_assigned_by` (`assigned_by`),
  CONSTRAINT `fk_user_school_assignments_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_user_school_assignments_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_school_assignments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Students
CREATE TABLE `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admission_no` varchar(20) NOT NULL,
  `roll_no` varchar(20) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `date_of_birth` date NOT NULL,
  `gender` enum('MALE', 'FEMALE', 'OTHER') NOT NULL,
  `blood_group` varchar(5) DEFAULT NULL,
  `religion` varchar(50) DEFAULT NULL,
  `caste` varchar(50) DEFAULT NULL,
  `category` enum('GENERAL', 'OBC', 'SC', 'ST', 'OTHER') DEFAULT 'GENERAL',
  `nationality` varchar(50) DEFAULT 'Indian',
  `mother_tongue` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `class_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `school_id` int(11) NOT NULL,
  `academic_year_id` int(11) NOT NULL,
  `admission_date` date NOT NULL,
  `previous_school` varchar(200) DEFAULT NULL,
  `transport_required` tinyint(1) NOT NULL DEFAULT 0,
  `bus_route` varchar(100) DEFAULT NULL,
  `medical_conditions` text DEFAULT NULL,
  `status` enum(
    'ACTIVE',
    'INACTIVE',
    'TRANSFERRED',
    'GRADUATED',
    'WITHDRAWN'
  ) NOT NULL DEFAULT 'ACTIVE',
  `photo_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_students_admission_no` (`admission_no`),
  UNIQUE KEY `uk_students_roll_class_section` (`roll_no`, `class_id`, `section_id`),
  KEY `fk_students_class` (`class_id`),
  KEY `fk_students_section` (`section_id`),
  KEY `fk_students_school` (`school_id`),
  KEY `fk_students_academic_year` (`academic_year_id`),
  KEY `idx_students_status` (`status`),
  CONSTRAINT `fk_students_academic_year` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_students_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_students_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_students_section` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Student Parents
CREATE TABLE `student_parents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `relationship` enum('FATHER', 'MOTHER', 'GUARDIAN', 'OTHER') NOT NULL,
  `is_primary_contact` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_student_parents` (`student_id`, `parent_id`),
  KEY `fk_student_parents_student` (`student_id`),
  KEY `fk_student_parents_parent` (`parent_id`),
  CONSTRAINT `fk_student_parents_parent` FOREIGN KEY (`parent_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_student_parents_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Admissions
CREATE TABLE `admissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `application_no` varchar(20) NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  `class_id` int(11) NOT NULL,
  `school_id` int(11) NOT NULL,
  `academic_year_id` int(11) NOT NULL,
  `application_date` date NOT NULL,
  `admission_date` date DEFAULT NULL,
  `status` enum('PENDING', 'APPROVED', 'REJECTED', 'WAITING') NOT NULL DEFAULT 'PENDING',
  `documents_verified` tinyint(1) NOT NULL DEFAULT 0,
  `interview_scheduled` date DEFAULT NULL,
  `interview_notes` text DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admissions_application_no` (`application_no`),
  KEY `fk_admissions_student` (`student_id`),
  KEY `fk_admissions_class` (`class_id`),
  KEY `fk_admissions_school` (`school_id`),
  KEY `fk_admissions_academic_year` (`academic_year_id`),
  KEY `fk_admissions_created_by` (`created_by`),
  KEY `fk_admissions_approved_by` (`approved_by`),
  KEY `idx_admissions_status` (`status`),
  CONSTRAINT `fk_admissions_academic_year` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_admissions_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE
  SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_admissions_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_admissions_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_admissions_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_admissions_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE
  SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Student Transfers
CREATE TABLE `student_transfers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `from_school_id` int(11) NOT NULL,
  `to_school_id` int(11) NOT NULL,
  `from_class_id` int(11) NOT NULL,
  `to_class_id` int(11) NOT NULL,
  `transfer_date` date NOT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `approved_by` int(11) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_student_transfers_student` (`student_id`),
  KEY `fk_student_transfers_from_school` (`from_school_id`),
  KEY `fk_student_transfers_to_school` (`to_school_id`),
  KEY `fk_student_transfers_from_class` (`from_class_id`),
  KEY `fk_student_transfers_to_class` (`to_class_id`),
  KEY `fk_student_transfers_approved_by` (`approved_by`),
  KEY `fk_student_transfers_created_by` (`created_by`),
  CONSTRAINT `fk_student_transfers_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE
  SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_student_transfers_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_student_transfers_from_class` FOREIGN KEY (`from_class_id`) REFERENCES `classes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_student_transfers_from_school` FOREIGN KEY (`from_school_id`) REFERENCES `schools` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_student_transfers_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_student_transfers_to_class` FOREIGN KEY (`to_class_id`) REFERENCES `classes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_student_transfers_to_school` FOREIGN KEY (`to_school_id`) REFERENCES `schools` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Fee Structures
CREATE TABLE `fee_structures` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fee_head` varchar(100) NOT NULL,
  `class_id` int(11) NOT NULL,
  `academic_year_id` int(11) NOT NULL,
  `amount` decimal(10, 2) NOT NULL,
  `due_date` date NOT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT 1,
  `installments` int(11) DEFAULT 1,
  `late_fee_amount` decimal(10, 2) DEFAULT 0.00,
  `late_fee_days` int(11) DEFAULT 7,
  `description` text DEFAULT NULL,
  `status` enum('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_fee_structures` (`fee_head`, `class_id`, `academic_year_id`),
  KEY `fk_fee_structures_class` (`class_id`),
  KEY `fk_fee_structures_academic_year` (`academic_year_id`),
  CONSTRAINT `fk_fee_structures_academic_year` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_fee_structures_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Student Fee Assignments
CREATE TABLE `student_fee_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `fee_structure_id` int(11) NOT NULL,
  `assigned_amount` decimal(10, 2) NOT NULL,
  `discount_amount` decimal(10, 2) DEFAULT 0.00,
  `final_amount` decimal(10, 2) NOT NULL,
  `due_date` date NOT NULL,
  `status` enum(
    'PENDING',
    'PARTIALLY_PAID',
    'PAID',
    'OVERDUE',
    'WAIVED'
  ) NOT NULL DEFAULT 'PENDING',
  `assigned_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_student_fee_assignments` (`student_id`, `fee_structure_id`),
  KEY `fk_student_fee_assignments_student` (`student_id`),
  KEY `fk_student_fee_assignments_fee_structure` (`fee_structure_id`),
  KEY `fk_student_fee_assignments_assigned_by` (`assigned_by`),
  KEY `idx_student_fee_assignments_status` (`status`),
  CONSTRAINT `fk_student_fee_assignments_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_student_fee_assignments_fee_structure` FOREIGN KEY (`fee_structure_id`) REFERENCES `fee_structures` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_student_fee_assignments_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Fee Receipts
CREATE TABLE `fee_receipts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `receipt_no` varchar(50) NOT NULL,
  `student_id` int(11) NOT NULL,
  `amount_paid` decimal(10, 2) NOT NULL,
  `late_fee_paid` decimal(10, 2) DEFAULT 0.00,
  `total_paid` decimal(10, 2) NOT NULL,
  `payment_mode` enum(
    'CASH',
    'CHEQUE',
    'BANK_TRANSFER',
    'UPI',
    'ONLINE',
    'CARD'
  ) NOT NULL,
  `payment_reference` varchar(100) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `cheque_no` varchar(50) DEFAULT NULL,
  `cheque_date` date DEFAULT NULL,
  `paid_date` date NOT NULL,
  `academic_year_id` int(11) NOT NULL,
  `remarks` text DEFAULT NULL,
  `collected_by` int(11) NOT NULL,
  `status` enum('PENDING', 'CLEARED', 'BOUNCED', 'CANCELLED') NOT NULL DEFAULT 'CLEARED',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_fee_receipts_receipt_no` (`receipt_no`),
  KEY `fk_fee_receipts_student` (`student_id`),
  KEY `fk_fee_receipts_academic_year` (`academic_year_id`),
  KEY `fk_fee_receipts_collected_by` (`collected_by`),
  KEY `idx_fee_receipts_paid_date` (`paid_date`),
  KEY `idx_fee_receipts_status` (`status`),
  CONSTRAINT `fk_fee_receipts_academic_year` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_fee_receipts_collected_by` FOREIGN KEY (`collected_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_fee_receipts_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Fee Discounts
CREATE TABLE `fee_discounts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `discount_type` enum(
    'PERCENTAGE',
    'FIXED_AMOUNT',
    'SCHOLARSHIP',
    'SIBLING',
    'EMPLOYEE',
    'OTHER'
  ) NOT NULL,
  `discount_value` decimal(10, 2) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `valid_from` date NOT NULL,
  `valid_until` date DEFAULT NULL,
  `approved_by` int(11) NOT NULL,
  `status` enum('ACTIVE', 'INACTIVE', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_fee_discounts_student` (`student_id`),
  KEY `fk_fee_discounts_approved_by` (`approved_by`),
  KEY `idx_fee_discounts_type` (`discount_type`),
  KEY `idx_fee_discounts_status` (`status`),
  CONSTRAINT `fk_fee_discounts_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_fee_discounts_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Attendance Daily
CREATE TABLE `attendance_daily` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `attendance_date` date NOT NULL,
  `status` enum(
    'PRESENT',
    'ABSENT',
    'LATE',
    'HALF_DAY',
    'SICK',
    'HOLIDAY'
  ) NOT NULL,
  `in_time` time DEFAULT NULL,
  `out_time` time DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `marked_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_attendance_daily` (`student_id`, `attendance_date`),
  KEY `fk_attendance_daily_student` (`student_id`),
  KEY `fk_attendance_daily_class` (`class_id`),
  KEY `fk_attendance_daily_section` (`section_id`),
  KEY `fk_attendance_daily_marked_by` (`marked_by`),
  KEY `idx_attendance_daily_date` (`attendance_date`),
  KEY `idx_attendance_daily_status` (`status`),
  CONSTRAINT `fk_attendance_daily_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_attendance_daily_marked_by` FOREIGN KEY (`marked_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_attendance_daily_section` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_attendance_daily_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Attendance Summary
CREATE TABLE `attendance_summary` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `month` int(11) NOT NULL,
  `year` int(11) NOT NULL,
  `total_days` int(11) NOT NULL DEFAULT 0,
  `present_days` int(11) NOT NULL DEFAULT 0,
  `absent_days` int(11) NOT NULL DEFAULT 0,
  `late_days` int(11) NOT NULL DEFAULT 0,
  `half_days` int(11) NOT NULL DEFAULT 0,
  `sick_days` int(11) NOT NULL DEFAULT 0,
  `holiday_days` int(11) NOT NULL DEFAULT 0,
  `percentage` decimal(5, 2) DEFAULT 0.00,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_attendance_summary` (`student_id`, `month`, `year`),
  KEY `fk_attendance_summary_student` (`student_id`),
  KEY `idx_attendance_summary_month_year` (`month`, `year`),
  CONSTRAINT `fk_attendance_summary_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Leave Applications
CREATE TABLE `leave_applications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `leave_type` enum(
    'SICK',
    'CASUAL',
    'EMERGENCY',
    'VACATION',
    'OTHER'
  ) NOT NULL,
  `from_date` date NOT NULL,
  `to_date` date NOT NULL,
  `total_days` int(11) NOT NULL,
  `reason` text NOT NULL,
  `status` enum('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `applied_by` int(11) NOT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `medical_certificate` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_leave_applications_student` (`student_id`),
  KEY `fk_leave_applications_applied_by` (`applied_by`),
  KEY `fk_leave_applications_approved_by` (`approved_by`),
  KEY `idx_leave_applications_dates` (`from_date`, `to_date`),
  KEY `idx_leave_applications_status` (`status`),
  CONSTRAINT `fk_leave_applications_applied_by` FOREIGN KEY (`applied_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_leave_applications_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE
  SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_leave_applications_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Trust Configuration
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
-- Custom Field Definitions
CREATE TABLE `custom_field_definitions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entity_type` enum('STUDENT', 'USER', 'ADMISSION', 'SCHOOL') NOT NULL,
  `field_name` varchar(100) NOT NULL,
  `field_label` varchar(200) NOT NULL,
  `field_type` enum(
    'TEXT',
    'NUMBER',
    'DATE',
    'SELECT',
    'CHECKBOX',
    'FILE'
  ) NOT NULL,
  `field_options` json DEFAULT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT 0,
  `is_searchable` tinyint(1) NOT NULL DEFAULT 0,
  `display_order` int(11) DEFAULT 0,
  `validation_rules` json DEFAULT NULL,
  `status` enum('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_custom_fields` (`entity_type`, `field_name`),
  KEY `fk_custom_field_definitions_created_by` (`created_by`),
  CONSTRAINT `fk_custom_field_definitions_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Custom Field Values
CREATE TABLE `custom_field_values` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `field_definition_id` int(11) NOT NULL,
  `entity_type` enum('STUDENT', 'USER', 'ADMISSION', 'SCHOOL') NOT NULL,
  `entity_id` int(11) NOT NULL,
  `field_value` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_custom_field_values` (
    `field_definition_id`,
    `entity_type`,
    `entity_id`
  ),
  KEY `idx_custom_field_values_entity` (`entity_type`, `entity_id`),
  CONSTRAINT `fk_custom_field_values_definition` FOREIGN KEY (`field_definition_id`) REFERENCES `custom_field_definitions` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Form Configurations
CREATE TABLE `form_configurations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `form_type` enum(
    'STUDENT_ADMISSION',
    'STUDENT_PROFILE',
    'USER_PROFILE',
    'SCHOOL_SETUP'
  ) NOT NULL,
  `form_config` json NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `version` varchar(20) NOT NULL DEFAULT '1.0',
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_form_configurations_type` (`form_type`),
  KEY `fk_form_configurations_created_by` (`created_by`),
  CONSTRAINT `fk_form_configurations_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Payment Gateway Configurations
CREATE TABLE `payment_gateways` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `gateway_name` varchar(50) NOT NULL,
  `gateway_type` enum(
    'RAZORPAY',
    'PAYTM',
    'PAYU',
    'CCAVENUE',
    'INSTAMOJO',
    'BANK'
  ) NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `configuration` json NOT NULL,
  `test_mode` tinyint(1) NOT NULL DEFAULT 1,
  `display_order` int(11) DEFAULT 0,
  `status` enum('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payment_gateways_name` (`gateway_name`),
  KEY `idx_payment_gateways_type` (`gateway_type`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Payment Transactions
CREATE TABLE `payment_transactions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `transaction_id` varchar(100) NOT NULL,
  `gateway_transaction_id` varchar(200) DEFAULT NULL,
  `gateway_name` varchar(50) NOT NULL,
  `fee_receipt_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `amount` decimal(10, 2) NOT NULL,
  `currency` varchar(3) DEFAULT 'INR',
  `payment_method` varchar(50) DEFAULT NULL,
  `status` enum(
    'INITIATED',
    'PENDING',
    'SUCCESS',
    'FAILED',
    'CANCELLED',
    'REFUNDED'
  ) NOT NULL,
  `gateway_response` json DEFAULT NULL,
  `failure_reason` varchar(500) DEFAULT NULL,
  `initiated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL,
  `webhook_verified` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payment_transactions_id` (`transaction_id`),
  KEY `fk_payment_transactions_receipt` (`fee_receipt_id`),
  KEY `fk_payment_transactions_student` (`student_id`),
  KEY `idx_payment_transactions_gateway` (`gateway_name`),
  KEY `idx_payment_transactions_status` (`status`),
  CONSTRAINT `fk_payment_transactions_receipt` FOREIGN KEY (`fee_receipt_id`) REFERENCES `fee_receipts` (`id`),
  CONSTRAINT `fk_payment_transactions_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Payment Method Configurations
CREATE TABLE `payment_method_configs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `method_type` enum(
    'CASH',
    'CHEQUE',
    'BANK_TRANSFER',
    'UPI',
    'ONLINE',
    'CARD'
  ) NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `minimum_amount` decimal(10, 2) DEFAULT 0.00,
  `maximum_amount` decimal(10, 2) DEFAULT NULL,
  `convenience_fee_percentage` decimal(5, 2) DEFAULT 0.00,
  `convenience_fee_fixed` decimal(10, 2) DEFAULT 0.00,
  `requires_approval` tinyint(1) NOT NULL DEFAULT 0,
  `auto_receipt_generation` tinyint(1) NOT NULL DEFAULT 1,
  `configuration` json DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payment_method_configs_type` (`method_type`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Enhanced Communication and Notification System
-- Notification Templates
CREATE TABLE `notification_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `template_name` varchar(100) NOT NULL,
  `template_type` enum('EMAIL', 'SMS', 'PUSH', 'IN_APP') NOT NULL,
  `event_trigger` varchar(100) NOT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `body_template` text NOT NULL,
  `variables` json DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `recipient_roles` json DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_notification_templates` (`template_name`, `template_type`),
  KEY `fk_notification_templates_created_by` (`created_by`),
  CONSTRAINT `fk_notification_templates_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Notifications Queue
CREATE TABLE `notifications_queue` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `notification_type` enum('EMAIL', 'SMS', 'PUSH', 'IN_APP') NOT NULL,
  `recipient_type` enum('USER', 'STUDENT', 'PARENT', 'GROUP') NOT NULL,
  `recipient_id` int(11) NOT NULL,
  `recipient_contact` varchar(255) NOT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `message` text NOT NULL,
  `template_id` int(11) DEFAULT NULL,
  `status` enum('PENDING', 'SENT', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `priority` enum('LOW', 'NORMAL', 'HIGH', 'URGENT') NOT NULL DEFAULT 'NORMAL',
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `failure_reason` varchar(500) DEFAULT NULL,
  `retry_count` int(11) NOT NULL DEFAULT 0,
  `max_retries` int(11) NOT NULL DEFAULT 3,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_notifications_queue_template` (`template_id`),
  KEY `idx_notifications_queue_status` (`status`),
  KEY `idx_notifications_queue_scheduled` (`scheduled_at`),
  KEY `idx_notifications_queue_recipient` (`recipient_type`, `recipient_id`),
  CONSTRAINT `fk_notifications_queue_template` FOREIGN KEY (`template_id`) REFERENCES `notification_templates` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- SMS Configuration
CREATE TABLE `sms_configurations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `provider` enum(
    'TWILIO',
    'TEXTLOCAL',
    'MSG91',
    'FAST2SMS',
    'CUSTOM'
  ) NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `configuration` json NOT NULL,
  `daily_limit` int(11) DEFAULT 1000,
  `monthly_limit` int(11) DEFAULT 10000,
  `cost_per_sms` decimal(10, 4) DEFAULT 0.0000,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sms_configurations_provider` (`provider`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Email Configuration
CREATE TABLE `email_configurations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `provider` enum('SMTP', 'SENDGRID', 'MAILGUN', 'SES', 'GMAIL') NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `configuration` json NOT NULL,
  `daily_limit` int(11) DEFAULT 1000,
  `monthly_limit` int(11) DEFAULT 10000,
  `from_email` varchar(255) NOT NULL,
  `from_name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_email_configurations_provider` (`provider`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Report Templates
CREATE TABLE `report_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `template_name` varchar(100) NOT NULL,
  `report_type` enum(
    'STUDENT_LIST',
    'FEE_COLLECTION',
    'ATTENDANCE',
    'FINANCIAL',
    'ACADEMIC',
    'CUSTOM'
  ) NOT NULL,
  `template_config` json NOT NULL,
  `sql_query` text DEFAULT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `access_roles` json DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_report_templates_name` (`template_name`),
  KEY `fk_report_templates_created_by` (`created_by`),
  CONSTRAINT `fk_report_templates_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Generated Reports
CREATE TABLE `generated_reports` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `template_id` int(11) NOT NULL,
  `report_name` varchar(200) NOT NULL,
  `filters` json DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `file_format` enum('PDF', 'EXCEL', 'CSV', 'HTML') NOT NULL,
  `status` enum('GENERATING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'GENERATING',
  `generated_by` int(11) NOT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `download_count` int(11) NOT NULL DEFAULT 0,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_generated_reports_template` (`template_id`),
  KEY `fk_generated_reports_generated_by` (`generated_by`),
  KEY `idx_generated_reports_status` (`status`),
  KEY `idx_generated_reports_expires` (`expires_at`),
  CONSTRAINT `fk_generated_reports_template` FOREIGN KEY (`template_id`) REFERENCES `report_templates` (`id`),
  CONSTRAINT `fk_generated_reports_generated_by` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Backup Configurations
CREATE TABLE `backup_configurations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `backup_name` varchar(100) NOT NULL,
  `backup_type` enum(
    'FULL',
    'INCREMENTAL',
    'SCHEMA_ONLY',
    'DATA_ONLY'
  ) NOT NULL,
  `schedule_cron` varchar(100) DEFAULT NULL,
  `retention_days` int(11) NOT NULL DEFAULT 30,
  `storage_location` enum('LOCAL', 'S3', 'GOOGLE_DRIVE', 'DROPBOX', 'FTP') NOT NULL DEFAULT 'LOCAL',
  `storage_config` json DEFAULT NULL,
  `compression_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `encryption_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_backup_at` timestamp NULL DEFAULT NULL,
  `next_backup_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_backup_configurations_name` (`backup_name`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Backup History
CREATE TABLE `backup_history` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `configuration_id` int(11) NOT NULL,
  `backup_file_name` varchar(255) NOT NULL,
  `backup_file_path` varchar(500) NOT NULL,
  `backup_size` bigint(20) DEFAULT NULL,
  `backup_type` enum(
    'FULL',
    'INCREMENTAL',
    'SCHEMA_ONLY',
    'DATA_ONLY'
  ) NOT NULL,
  `status` enum('IN_PROGRESS', 'COMPLETED', 'FAILED') NOT NULL,
  `started_at` timestamp NOT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `tables_included` json DEFAULT NULL,
  `records_count` bigint(20) DEFAULT NULL,
  `checksum` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_backup_history_configuration` (`configuration_id`),
  KEY `idx_backup_history_status` (`status`),
  KEY `idx_backup_history_completed` (`completed_at`),
  CONSTRAINT `fk_backup_history_configuration` FOREIGN KEY (`configuration_id`) REFERENCES `backup_configurations` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Trust Audit Logs
CREATE TABLE `trust_audit_logs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `table_name` varchar(100) DEFAULT NULL,
  `record_id` varchar(50) DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_trust_audit_user` (`user_id`),
  KEY `idx_trust_audit_action` (`action`),
  KEY `idx_trust_audit_table` (`table_name`),
  KEY `idx_trust_audit_created` (`created_at`),
  CONSTRAINT `fk_trust_audit_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE
  SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Communication Templates (removed duplicate - using enhanced version below)
-- Communication Messages
CREATE TABLE `communication_messages` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `template_id` int(11) DEFAULT NULL,
  `message_type` enum('SMS', 'EMAIL', 'NOTIFICATION', 'ANNOUNCEMENT') NOT NULL,
  `recipient_type` enum(
    'USER',
    'STUDENT',
    'PARENT',
    'CLASS',
    'SCHOOL',
    'ALL'
  ) NOT NULL,
  `recipient_id` int(11) DEFAULT NULL,
  `recipient_email` varchar(255) DEFAULT NULL,
  `recipient_phone` varchar(20) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `content` text NOT NULL,
  `status` enum(
    'PENDING',
    'SENT',
    'DELIVERED',
    'FAILED',
    'CANCELLED'
  ) NOT NULL DEFAULT 'PENDING',
  `sent_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `priority` enum('LOW', 'NORMAL', 'HIGH', 'URGENT') NOT NULL DEFAULT 'NORMAL',
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_communication_messages_template` (`template_id`),
  KEY `fk_communication_messages_created_by` (`created_by`),
  KEY `idx_communication_messages_status` (`status`),
  KEY `idx_communication_messages_type` (`message_type`),
  KEY `idx_communication_messages_recipient` (`recipient_type`, `recipient_id`),
  CONSTRAINT `fk_communication_messages_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Documents
CREATE TABLE `documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entity_type` enum('STUDENT', 'USER', 'ADMISSION', 'APPLICATION') NOT NULL,
  `entity_id` int(11) NOT NULL,
  `document_type` varchar(100) NOT NULL,
  `document_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `uploaded_by` int(11) NOT NULL,
  `verified` tinyint(1) NOT NULL DEFAULT 0,
  `verified_by` int(11) DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_documents_entity` (`entity_type`, `entity_id`),
  KEY `fk_documents_uploaded_by` (`uploaded_by`),
  KEY `fk_documents_verified_by` (`verified_by`),
  CONSTRAINT `fk_documents_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_documents_verified_by` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE
  SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Insert Initial Data
INSERT INTO `migration_versions` (`version`, `description`)
VALUES ('1.0.0', 'Initial database schema creation');
-- Default System Configuration
INSERT INTO `system_config` (
    `config_key`,
    `config_value`,
    `data_type`,
    `description`,
    `is_editable`
  )
VALUES (
    'APP_NAME',
    'School ERP - Bulletproof',
    'STRING',
    'Application name',
    1
  ),
  (
    'APP_VERSION',
    '1.0.0',
    'STRING',
    'Application version',
    0
  ),
  (
    'MAX_LOGIN_ATTEMPTS',
    '5',
    'NUMBER',
    'Maximum login attempts before lockout',
    1
  ),
  (
    'SESSION_TIMEOUT',
    '1800',
    'NUMBER',
    'Session timeout in seconds (30 minutes)',
    1
  ),
  (
    'PASSWORD_MIN_LENGTH',
    '8',
    'NUMBER',
    'Minimum password length',
    1
  ),
  (
    'FILE_UPLOAD_MAX_SIZE',
    '10485760',
    'NUMBER',
    'Maximum file upload size in bytes (10MB)',
    1
  ),
  (
    'BACKUP_RETENTION_DAYS',
    '30',
    'NUMBER',
    'Number of days to retain backups',
    1
  ),
  (
    'AUDIT_LOG_RETENTION_DAYS',
    '365',
    'NUMBER',
    'Number of days to retain audit logs',
    1
  );
-- ================================================================
-- COMMUNICATION SYSTEM TABLES
-- ================================================================
-- Communication Settings Table
CREATE TABLE IF NOT EXISTS `communication_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `is_encrypted` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_communication_settings_key` (`setting_key`),
  KEY `idx_communication_settings_key` (`setting_key`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Communication Templates Table
CREATE TABLE IF NOT EXISTS `communication_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `type` enum('email', 'sms') NOT NULL,
  `category` enum(
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
  `subject` varchar(200) DEFAULT NULL,
  `content` text NOT NULL,
  `variables` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_default` tinyint(1) DEFAULT 0,
  `description` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_communication_templates_default` (`type`, `category`, `is_default`),
  KEY `idx_communication_templates_type_category` (`type`, `category`),
  KEY `idx_communication_templates_active` (`is_active`),
  KEY `fk_communication_templates_created_by` (`created_by`),
  CONSTRAINT `fk_communication_templates_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE
  SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Communication History Table
CREATE TABLE IF NOT EXISTS `communication_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('email', 'sms') NOT NULL,
  `to_address` varchar(255) NOT NULL,
  `from_address` varchar(255) DEFAULT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `message` text NOT NULL,
  `template_id` int(11) DEFAULT NULL,
  `status` enum(
    'pending',
    'sent',
    'delivered',
    'failed',
    'bounced'
  ) DEFAULT 'pending',
  `error_message` text DEFAULT NULL,
  `provider` varchar(50) DEFAULT NULL,
  `provider_message_id` varchar(255) DEFAULT NULL,
  `delivery_time` timestamp NULL DEFAULT NULL,
  `opened_at` timestamp NULL DEFAULT NULL,
  `clicked_at` timestamp NULL DEFAULT NULL,
  `recipient_type` enum('student', 'parent', 'staff', 'admin') DEFAULT 'parent',
  `recipient_id` int(11) DEFAULT NULL,
  `campaign_id` varchar(100) DEFAULT NULL,
  `cost` decimal(10, 4) DEFAULT 0.0000,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_communication_history_type_status` (`type`, `status`),
  KEY `idx_communication_history_recipient` (`recipient_type`, `recipient_id`),
  KEY `idx_communication_history_created_at` (`created_at`),
  KEY `idx_communication_history_campaign` (`campaign_id`),
  KEY `idx_communication_history_provider` (`provider`),
  KEY `fk_communication_history_template` (`template_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Notification Jobs Table
CREATE TABLE IF NOT EXISTS `notification_jobs` (
  `id` varchar(50) NOT NULL,
  `type` enum('email', 'sms') NOT NULL,
  `status` enum(
    'pending',
    'processing',
    'completed',
    'completed_with_errors',
    'failed'
  ) DEFAULT 'pending',
  `data` json NOT NULL,
  `recipients_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `attempts` int(11) DEFAULT 0,
  `error` text DEFAULT NULL,
  `results` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notification_jobs_type_status` (`type`, `status`),
  KEY `idx_notification_jobs_created_at` (`created_at`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Notification Delivery Logs Table
CREATE TABLE IF NOT EXISTS `notification_delivery_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `job_id` varchar(50) NOT NULL,
  `recipient_type` enum('student', 'parent', 'staff', 'admin') DEFAULT 'parent',
  `recipient_id` int(11) DEFAULT NULL,
  `recipient_contact` varchar(255) DEFAULT NULL,
  `status` enum('success', 'failed') NOT NULL,
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_notification_delivery_logs_job_id` (`job_id`),
  KEY `idx_notification_delivery_logs_recipient` (`recipient_type`, `recipient_id`),
  KEY `idx_notification_delivery_logs_status` (`status`),
  CONSTRAINT `fk_notification_delivery_logs_job` FOREIGN KEY (`job_id`) REFERENCES `notification_jobs` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Email Delivery Tracking Table
CREATE TABLE IF NOT EXISTS `email_delivery_tracking` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `communication_id` int(11) NOT NULL,
  `event_type` enum(
    'delivered',
    'bounced',
    'opened',
    'clicked',
    'complained',
    'unsubscribed'
  ) NOT NULL,
  `event_data` json DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `user_agent` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_email_delivery_tracking_communication_id` (`communication_id`),
  KEY `idx_email_delivery_tracking_event_type` (`event_type`),
  KEY `idx_email_delivery_tracking_timestamp` (`timestamp`),
  CONSTRAINT `fk_email_delivery_tracking_communication` FOREIGN KEY (`communication_id`) REFERENCES `communication_history` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- SMS Delivery Reports Table
CREATE TABLE IF NOT EXISTS `sms_delivery_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `communication_id` int(11) NOT NULL,
  `provider_message_id` varchar(255) DEFAULT NULL,
  `status` enum(
    'sent',
    'delivered',
    'failed',
    'expired',
    'rejected'
  ) NOT NULL,
  `status_description` text DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `cost` decimal(10, 4) DEFAULT 0.0000,
  `error_code` varchar(10) DEFAULT NULL,
  `error_description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_sms_delivery_reports_communication_id` (`communication_id`),
  KEY `idx_sms_delivery_reports_provider_message_id` (`provider_message_id`),
  KEY `idx_sms_delivery_reports_status` (`status`),
  CONSTRAINT `fk_sms_delivery_reports_communication` FOREIGN KEY (`communication_id`) REFERENCES `communication_history` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Communication Preferences Table
CREATE TABLE IF NOT EXISTS `communication_preferences` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `recipient_type` enum('student', 'parent', 'staff', 'admin') NOT NULL,
  `recipient_id` int(11) NOT NULL,
  `email_enabled` tinyint(1) DEFAULT 1,
  `sms_enabled` tinyint(1) DEFAULT 1,
  `email_frequency` enum('immediate', 'daily', 'weekly', 'disabled') DEFAULT 'immediate',
  `sms_frequency` enum('immediate', 'daily', 'disabled') DEFAULT 'immediate',
  `categories` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_communication_preferences_recipient` (`recipient_type`, `recipient_id`),
  KEY `idx_communication_preferences_recipient` (`recipient_type`, `recipient_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Communication Statistics Table
CREATE TABLE IF NOT EXISTS `communication_statistics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `type` enum('email', 'sms') NOT NULL,
  `provider` varchar(50) DEFAULT NULL,
  `total_sent` int(11) DEFAULT 0,
  `total_delivered` int(11) DEFAULT 0,
  `total_failed` int(11) DEFAULT 0,
  `total_bounced` int(11) DEFAULT 0,
  `total_opened` int(11) DEFAULT 0,
  `total_clicked` int(11) DEFAULT 0,
  `total_cost` decimal(10, 2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_communication_statistics_date_type_provider` (`date`, `type`, `provider`),
  KEY `idx_communication_statistics_date` (`date`),
  KEY `idx_communication_statistics_type` (`type`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Insert default communication templates
INSERT INTO `communication_templates` (
    `name`,
    `type`,
    `category`,
    `subject`,
    `content`,
    `variables`,
    `is_default`,
    `description`
  )
VALUES -- Email Templates
  (
    'Fee Reminder',
    'email',
    'fee_reminder',
    'Fee Payment Reminder - {{student_name}}',
    '<p>Dear Parent/Guardian,</p><p>This is a reminder that the fee payment for <strong>{{student_name}}</strong> is due on <strong>{{due_date}}</strong>.</p><p><strong>Amount Due:</strong> ₹{{amount}}</p><p>Please make the payment at your earliest convenience to avoid late fees.</p><p>Thank you!</p>',
    '["student_name", "due_date", "amount"]',
    1,
    'Default fee reminder email template'
  ),
  (
    'Admission Confirmation',
    'email',
    'admission_confirmation',
    'Admission Confirmed - {{student_name}}',
    '<p>Dear Parent/Guardian,</p><p>We are pleased to confirm the admission of <strong>{{student_name}}</strong> to <strong>{{class_name}}</strong> for the academic year <strong>{{academic_year}}</strong>.</p><p><strong>Student ID:</strong> {{student_id}}</p><p><strong>Class:</strong> {{class_name}}</p><p><strong>Start Date:</strong> {{start_date}}</p><p>Welcome to our school family!</p>',
    '["student_name", "class_name", "academic_year", "student_id", "start_date"]',
    1,
    'Default admission confirmation email'
  ),
  (
    'Payment Confirmation',
    'email',
    'payment_confirmation',
    'Payment Received - {{student_name}}',
    '<p>Dear Parent/Guardian,</p><p>We have successfully received your payment for <strong>{{student_name}}</strong>.</p><p><strong>Amount Paid:</strong> ₹{{amount}}</p><p><strong>Transaction ID:</strong> {{transaction_id}}</p><p><strong>Payment Date:</strong> {{payment_date}}</p><p>Thank you for your payment!</p>',
    '["student_name", "amount", "transaction_id", "payment_date"]',
    1,
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
    1,
    'Default fee reminder SMS template'
  ),
  (
    'Attendance Alert SMS',
    'sms',
    'attendance_alert',
    NULL,
    'Alert: {{student_name}} was absent on {{date}}. Please contact school if this was due to illness.',
    '["student_name", "date"]',
    1,
    'Default attendance alert SMS'
  ),
  (
    'Payment Confirmation SMS',
    'sms',
    'payment_confirmation',
    NULL,
    'Payment received for {{student_name}}. Amount: ₹{{amount}}, Txn: {{transaction_id}}. Thank you!',
    '["student_name", "amount", "transaction_id"]',
    1,
    'Default payment confirmation SMS'
  );
-- Insert default communication settings
INSERT INTO `communication_settings` (`setting_key`, `setting_value`)
VALUES ('default_from_name', 'School Management System'),
  (
    'email_signature',
    '<br><br>Best regards,<br>School Administration<br>Contact: +91-XXXXXXXXXX'
  ),
  ('sms_signature', ' - School Admin'),
  ('max_email_recipients', '100'),
  ('max_sms_recipients', '1000'),
  ('email_rate_limit', '50'),
  ('sms_rate_limit', '100');
-- ================================================================
-- ENHANCED REPORTING FRAMEWORK SCHEMA (Phase 3)
-- ================================================================
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