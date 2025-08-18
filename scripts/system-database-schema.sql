-- ================================================================
-- SCHOOL ERP - CORRECTED MULTI-TENANT DATABASE ARCHITECTURE
-- ================================================================
-- ================================================================
-- SYSTEM MASTER DATABASE (Developer/Super-Admin Controlled)
-- Database: school_erp_system
-- Purpose: System-level management, trust registry, super-admin operations
-- ================================================================
CREATE DATABASE IF NOT EXISTS `school_erp_system` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `school_erp_system`;
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
-- System Users (Super Admins - Developer Team)
CREATE TABLE `system_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `role` enum('SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEVELOPER') NOT NULL DEFAULT 'SYSTEM_ADMIN',
  `permissions` json DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `failed_login_attempts` int(11) NOT NULL DEFAULT 0,
  `locked_until` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_system_users_username` (`username`),
  UNIQUE KEY `uk_system_users_email` (`email`),
  KEY `idx_system_users_role` (`role`),
  KEY `idx_system_users_active` (`is_active`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Trusts Registry (Tenant Management)
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
  `subscription_plan` enum('FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE') NOT NULL DEFAULT 'FREE',
  `subscription_status` enum('ACTIVE', 'TRIAL', 'EXPIRED', 'SUSPENDED') NOT NULL DEFAULT 'TRIAL',
  `max_schools` int(11) DEFAULT 1,
  `max_students` int(11) DEFAULT 100,
  `max_users` int(11) DEFAULT 10,
  `features_enabled` json DEFAULT NULL,
  `status` enum('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE',
  `database_name` varchar(100) NOT NULL,
  `database_status` enum('CREATING', 'ACTIVE', 'MIGRATING', 'ERROR') DEFAULT 'CREATING',
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_trusts_code` (`trust_code`),
  UNIQUE KEY `uk_trusts_subdomain` (`subdomain`),
  UNIQUE KEY `uk_trusts_email` (`contact_email`),
  UNIQUE KEY `uk_trusts_database` (`database_name`),
  KEY `idx_trusts_subdomain` (`subdomain`),
  KEY `idx_trusts_status` (`status`),
  KEY `idx_trusts_subscription` (`subscription_plan`, `subscription_status`),
  KEY `fk_trusts_created_by` (`created_by`),
  CONSTRAINT `fk_trusts_created_by` FOREIGN KEY (`created_by`) REFERENCES `system_users` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Trust Subscriptions History
CREATE TABLE `trust_subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `trust_id` int(11) NOT NULL,
  `plan` enum('FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE') NOT NULL,
  `status` enum('ACTIVE', 'TRIAL', 'EXPIRED', 'CANCELLED') NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `billing_cycle` enum('MONTHLY', 'QUARTERLY', 'ANNUAL') DEFAULT NULL,
  `amount` decimal(10, 2) DEFAULT 0.00,
  `currency` varchar(3) DEFAULT 'INR',
  `payment_status` enum('PENDING', 'PAID', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_subscriptions_trust` (`trust_id`),
  KEY `idx_subscriptions_status` (`status`),
  KEY `idx_subscriptions_dates` (`start_date`, `end_date`),
  CONSTRAINT `fk_subscriptions_trust` FOREIGN KEY (`trust_id`) REFERENCES `trusts` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- System-wide Migration Tracking
CREATE TABLE `migration_versions` (
  `version` varchar(20) NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`version`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- System Audit Logs (Super Admin Actions)
CREATE TABLE `system_audit_logs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `trust_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` varchar(50) DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_trust` (`trust_id`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_entity` (`entity_type`, `entity_id`),
  KEY `idx_audit_created` (`created_at`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `system_users` (`id`) ON DELETE
  SET NULL,
    CONSTRAINT `fk_audit_trust` FOREIGN KEY (`trust_id`) REFERENCES `trusts` (`id`) ON DELETE
  SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- System Sessions (Super Admin Sessions)
CREATE TABLE `system_sessions` (
  `id` varchar(128) NOT NULL,
  `user_id` int(11) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_sessions_user` (`user_id`),
  KEY `idx_sessions_last_activity` (`last_activity`),
  KEY `idx_sessions_expires` (`expires_at`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `system_users` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- System Notifications (For Trust Admins)
CREATE TABLE `system_notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `trust_id` int(11) DEFAULT NULL,
  `type` enum(
    'SYSTEM_UPDATE',
    'MAINTENANCE',
    'BILLING',
    'SECURITY',
    'FEATURE'
  ) NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `priority` enum('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
  `status` enum('DRAFT', 'PUBLISHED', 'ARCHIVED') DEFAULT 'DRAFT',
  `target_audience` enum(
    'ALL_TRUSTS',
    'SPECIFIC_TRUST',
    'SUBSCRIPTION_PLAN'
  ) NOT NULL,
  `target_plan` enum('FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE') DEFAULT NULL,
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `published_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_notifications_trust` (`trust_id`),
  KEY `fk_notifications_created_by` (`created_by`),
  KEY `idx_notifications_type` (`type`),
  KEY `idx_notifications_status` (`status`),
  KEY `idx_notifications_priority` (`priority`),
  CONSTRAINT `fk_notifications_trust` FOREIGN KEY (`trust_id`) REFERENCES `trusts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notifications_created_by` FOREIGN KEY (`created_by`) REFERENCES `system_users` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- System Backup Configurations
CREATE TABLE `system_backups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `trust_id` int(11) DEFAULT NULL,
  `backup_type` enum('FULL', 'INCREMENTAL', 'SCHEMA_ONLY') NOT NULL,
  `schedule_cron` varchar(50) DEFAULT NULL,
  `retention_days` int(11) DEFAULT 30,
  `storage_location` varchar(500) NOT NULL,
  `encryption_enabled` tinyint(1) DEFAULT 1,
  `compression_enabled` tinyint(1) DEFAULT 1,
  `status` enum('ACTIVE', 'INACTIVE', 'ERROR') DEFAULT 'ACTIVE',
  `last_backup_at` timestamp NULL DEFAULT NULL,
  `last_backup_size` bigint(20) DEFAULT NULL,
  `last_backup_status` enum('SUCCESS', 'FAILED', 'PARTIAL') DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_backups_trust` (`trust_id`),
  KEY `idx_backups_status` (`status`),
  CONSTRAINT `fk_backups_trust` FOREIGN KEY (`trust_id`) REFERENCES `trusts` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Default System Configuration
INSERT INTO `system_config` (
    `config_key`,
    `config_value`,
    `data_type`,
    `description`,
    `is_editable`
  )
VALUES (
    'app_name',
    'School ERP System',
    'STRING',
    'Application name',
    1
  ),
  (
    'app_version',
    '2.0.0',
    'STRING',
    'Current application version',
    0
  ),
  (
    'maintenance_mode',
    'false',
    'BOOLEAN',
    'System maintenance mode',
    1
  ),
  (
    'max_trusts',
    '1000',
    'NUMBER',
    'Maximum number of trusts allowed',
    1
  ),
  (
    'default_subscription_plan',
    'FREE',
    'STRING',
    'Default subscription plan for new trusts',
    1
  ),
  (
    'trial_period_days',
    '30',
    'NUMBER',
    'Trial period duration in days',
    1
  ),
  (
    'backup_retention_days',
    '90',
    'NUMBER',
    'System backup retention period',
    1
  ),
  (
    'session_timeout_minutes',
    '480',
    'NUMBER',
    'Session timeout in minutes',
    1
  ),
  (
    'max_login_attempts',
    '5',
    'NUMBER',
    'Maximum failed login attempts',
    1
  ),
  (
    'password_min_length',
    '8',
    'NUMBER',
    'Minimum password length',
    1
  );