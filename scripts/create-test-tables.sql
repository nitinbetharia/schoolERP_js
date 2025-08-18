-- Create basic tables for AUTH module testing

-- System users table for system administrators
CREATE TABLE IF NOT EXISTS system_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('SYSTEM_ADMIN', 'GROUP_ADMIN') DEFAULT 'SYSTEM_ADMIN',
    status ENUM('active', 'inactive') DEFAULT 'active',
    login_attempts INT DEFAULT 0,
    locked_until DATETIME NULL,
    last_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Trusts table for educational trusts
CREATE TABLE IF NOT EXISTS trusts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    trust_code VARCHAR(50) UNIQUE NOT NULL,
    database_name VARCHAR(100) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Schools table for trust schools
CREATE TABLE IF NOT EXISTS schools (
    id INT PRIMARY KEY AUTO_INCREMENT,
    trust_id INT NOT NULL,
    school_name VARCHAR(255) NOT NULL,
    school_code VARCHAR(50) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (trust_id) REFERENCES trusts(id)
);

-- Users table for trust-level users
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    trust_id INT NOT NULL,
    school_id INT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('TRUST_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT', 'PARENT', 'STUDENT') NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    login_attempts INT DEFAULT 0,
    locked_until DATETIME NULL,
    last_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (trust_id) REFERENCES trusts(id),
    FOREIGN KEY (school_id) REFERENCES schools(id),
    UNIQUE KEY unique_email_trust (email, trust_id)
);

-- Session tables for authentication
CREATE TABLE IF NOT EXISTS system_user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES system_users(id)
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert test data
INSERT IGNORE INTO system_users (email, password_hash, first_name, last_name, role) VALUES
('admin@system.local', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LzjKOznBzLIb7QPQO', 'System', 'Administrator', 'SYSTEM_ADMIN');

INSERT IGNORE INTO trusts (name, trust_code, database_name) VALUES
('Demo Educational Trust', 'demo', 'school_erp_demo');

INSERT IGNORE INTO schools (trust_id, school_name, school_code) VALUES
(1, 'Demo High School', 'DHS001'),
(1, 'Demo Primary School', 'DPS001');

INSERT IGNORE INTO users (trust_id, school_id, email, password_hash, first_name, last_name, role) VALUES
(1, 1, 'admin@demo.school', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LzjKOznBzLIb7QPQO', 'School', 'Admin', 'SCHOOL_ADMIN'),
(1, 1, 'teacher@demo.school', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LzjKOznBzLIb7QPQO', 'Demo', 'Teacher', 'TEACHER'),
(1, 1, 'accountant@demo.school', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LzjKOznBzLIb7QPQO', 'Demo', 'Accountant', 'ACCOUNTANT');