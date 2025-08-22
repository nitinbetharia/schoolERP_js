# School ERP - Complete Documentation

**Version**: 2.0.0  
**Date**: August 21, 2025  
**Status**: PRODUCTION READY - CONSOLIDATED DOCUMENTATION  
**Repository**: schoolERP_js

---

## 📖 **TABLE OF CONTENTS**

1. [Quick Start](#quick-start)
2. [Single Source of Truth - Technical Decisions](#single-source-of-truth)
3. [Architecture Overview](#architecture-overview)
4. [Database Design](#database-design)
5. [Development Standards](#development-standards)
6. [API Reference](#api-reference)
7. [Setup & Configuration](#setup--configuration)
8. [Deployment](#deployment)

---

## 🚀 **QUICK START**

### **Mission Statement**

Build a school ERP that runs for YEARS without intervention, handles all edge cases gracefully, and prevents data corruption at all costs.

**Core Philosophy:** "Better to fail safely than to succeed dangerously."

### **Prerequisites**

- **Node.js** 18+ (LTS recommended)
- **MySQL** 8.0+ with **MySQL Shell (mysqlsh)** installed
- **Git** for version control

### **Automated Setup**

```bash
# 1. Clone and navigate
git clone <repository-url>
cd school-erp-bulletproof

# 2. Configure database credentials
cp .env.example .env
# ⚠️  IMPORTANT: Edit .env with your REAL MySQL credentials:
#   DB_USER=your_mysql_username
#   DB_PASSWORD=your_mysql_password

# 3. Run first-time setup
npm run first-setup

# 4. Start development server
npm run dev

# 5. Open browser
http://localhost:3000
```

### **Default Credentials**

- **System Admin**: `admin@system.local / admin123`
- **Demo Trust**: `admin@demo.school / password123`

---

## 🔒 **SINGLE SOURCE OF TRUTH**

### **⚠️ CRITICAL: IMMUTABLE TECHNICAL DECISIONS**

**ALL 56 technical decisions are FINAL and ENFORCED. Any deviation will cause build failure.**

#### **Core Technology Stack (Q1-Q10)**

| Decision                    | Implementation                      | FORBIDDEN                           |
| --------------------------- | ----------------------------------- | ----------------------------------- |
| **Q1: Database Access**     | Sequelize ORM `sequelize.define()`  | Raw SQL, mysql2, other ORMs         |
| **Q2: Module System**       | CommonJS `require`/`module.exports` | ES6 imports, TypeScript             |
| **Q3: CSS Framework**       | Bootstrap 5.3+ (Component library)  | Tailwind CSS, custom CSS frameworks |
| **Q4: Database Migrations** | Sequelize CLI                       | Manual SQL scripts                  |
| **Q5: Multi-Tenant**        | Separate databases per tenant       | Shared DB, schema separation        |
| **Q6: Sessions**            | Express sessions + MySQL store      | JWT, Redis sessions                 |
| **Q7: API Architecture**    | MVC + EJS + JSON endpoints          | SPA only, GraphQL                   |
| **Q8: Validation**          | Joi + Sequelize + business rules    | express-validator only              |
| **Q9: Logging**             | Winston + structured logging        | console.log only                    |
| **Q10: Environment**        | Cloud MySQL + local Node.js         | Local MySQL, Docker                 |

#### **Database Architecture (Q11-Q18)**

| Decision                 | Implementation                                      | Details               |
| ------------------------ | --------------------------------------------------- | --------------------- |
| **Q11: Connection Pool** | `{ max: 15, min: 2, acquire: 60000, idle: 300000 }` | Moderate pooling      |
| **Q12: Model Pattern**   | `sequelize.define("Model", {...})`                  | No class-based models |
| **Q13: Associations**    | Inline with model definition                        | No separate files     |
| **Q14: Primary Keys**    | Mixed: UUIDs (sensitive), integers (lookup)         | Performance optimized |
| **Q15: Timestamps**      | Custom: `created_at`, `updated_at`, `deleted_at`    | Manual control        |
| **Q16: Naming**          | Snake_case DB, camelCase JS                         | `underscored: true`   |
| **Q17: Passwords**       | bcryptjs, 12 salt rounds                            | Industry standard     |
| **Q18: Session Config**  | Environment-based configuration                     | Flexible deployment   |

#### **Security & Validation (Q19-Q21, Q33, Q49-Q51, Q59)**

- **Q19**: Validation schemas within model files
- **Q20**: Joi transforms with custom sanitizers
- **Q21**: Structured error responses with codes/timestamps
- **Q33**: RESTRICT foreign keys with user-friendly errors
- **Q49**: Application-level encryption for PII only
- **Q50**: Detailed audit trail with before/after tracking
- **Q51**: Context-aware input sanitization
- **Q59**: Frontend validation MUST reuse API endpoint schemas (ENFORCED)

#### **Complete Decision List**

For all 56 decisions, see: `docs/architecture/SINGLE_SOURCE_OF_TRUTH.md`

---

## 🏗️ **ARCHITECTURE OVERVIEW**

### **Tech Stack**

```json
{
   "runtime": "Node.js 18++",
   "framework": "Express.js 5.1.0",
   "database": "MySQL 8.4 LTS",
   "orm": "Sequelize 6.37.7",
   "templating": "EJS 3.1.10",
   "styling": "Bootstrap 5.3+ (Component library + utilities)",
   "clientJS": "Vanilla JavaScript (Modern ES6+, no frameworks)",
   "icons": "Font Awesome 6.4+ (Icon library)",
   "theming": "CSS Custom Properties (Multi-tenant theming)",
   "validation": "Joi 18.0.1 + Sequelize + Q59-ENFORCED pattern",
   "authentication": "bcryptjs 3.0.2 + express-session 1.18.2",
   "logging": "Winston 3.17.0 + daily-rotate-file",
   "security": "Helmet 8.1.0, CORS 2.8.5, rate limiting 8.0.1",
   "fileHandling": "express-fileupload 1.5.2, archiver 7.0.1",
   "dateTime": "dayjs 1.11.13",
   "validation": "joi 18.0.1, validator 13.12.0",
   "utilities": "uuid 11.1.0, axios 1.11.0, xss 1.0.15"
}
```

### **Multi-Tenant Architecture**

```
System Database: school_erp_system
├── trusts (tenant registry)
├── system_users (super admins)
└── system_audit_logs (cross-tenant audit)

Trust Databases: school_erp_trust_{trustCode}
├── users (trust-level users)
├── students (student records)
├── schools (multi-school support)
├── classes/sections (academic structure)
├── fee_structures (financial rules)
├── attendance_records (daily tracking)
└── audit_logs (tenant audit trail)
```

### **Project Structure (Hybrid Architecture)**

```
schoolERP_js/
├── server.js                    # Main entry point
├── config/                      # Configuration & RBAC (shared)
├── middleware/                  # Cross-cutting concerns
├── models/                      # SHARED core entities
│   ├── User.js                  # Base user model
│   ├── Student.js               # Student records
│   ├── School.js                # School entities
│   └── index.js                 # Model loader
├── modules/                     # BUSINESS MODULES
│   ├── auth/                    # Authentication & session
│   ├── student/                 # Student management
│   ├── fees/                    # Fee calculation engine
│   ├── attendance/              # Attendance tracking
│   └── communication/           # Multi-channel messaging
├── routes/                      # Express route definitions
├── views/                       # EJS templates
├── scripts/                     # Setup/maintenance scripts
├── utils/                       # Shared utilities
└── docs/                        # This documentation
```

---

## 🗄️ **DATABASE DESIGN**

### **System Database Schema** (`school_erp_system`)

#### **Trusts Table**

```sql
CREATE TABLE trusts (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  trust_name VARCHAR(200) NOT NULL,
  trust_code VARCHAR(20) NOT NULL UNIQUE,
  subdomain VARCHAR(50) NOT NULL UNIQUE,
  contact_email VARCHAR(255) NOT NULL UNIQUE,
  database_name VARCHAR(100) NOT NULL UNIQUE,
  status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
  tenant_config JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### **System Users Table**

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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### **Trust Database Schema** (`school_erp_trust_{trustCode}`)

#### **Users Table** (Staff + Students with Login)

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  employee_id VARCHAR(20) UNIQUE,
  student_id VARCHAR(20) UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('TRUST_ADMIN', 'PRINCIPAL', 'TEACHER', 'STAFF', 'STUDENT', 'PARENT') NOT NULL,
  status ENUM('ACTIVE', 'INACTIVE', 'LOCKED', 'GRADUATED') DEFAULT 'ACTIVE',
  school_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id)
);
```

#### **Students Table** (Academic-Specific Data)

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
  father_name VARCHAR(100),
  mother_name VARCHAR(100),
  guardian_name VARCHAR(100),
  status ENUM('ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED', 'DROPPED') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (section_id) REFERENCES sections(id),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);
```

#### **Fee Management Tables**

```sql
-- Fee Structures
CREATE TABLE fee_structures (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  structure_name VARCHAR(100) NOT NULL,
  school_id INTEGER NOT NULL,
  class_id INTEGER,
  academic_year_id INTEGER NOT NULL,
  fee_type ENUM('TUITION', 'TRANSPORT', 'HOSTEL', 'LIBRARY', 'OTHER') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  frequency ENUM('MONTHLY', 'QUARTERLY', 'YEARLY', 'ONE_TIME') NOT NULL,
  is_mandatory BOOLEAN DEFAULT TRUE,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

-- Fee Transactions
CREATE TABLE fee_transactions (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  student_id INTEGER NOT NULL,
  fee_structure_id INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('CASH', 'CHEQUE', 'ONLINE', 'BANK_TRANSFER', 'UPI') NOT NULL,
  payment_date DATE NOT NULL,
  collected_by_user_id INTEGER,
  status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') DEFAULT 'COMPLETED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id),
  FOREIGN KEY (collected_by_user_id) REFERENCES users(id)
);
```

### **Model Implementation Pattern**

```javascript
const { DataTypes } = require('sequelize');
const Joi = require('joi');

const Student = sequelize.define(
   'Student',
   {
      id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         autoIncrement: true,
      },
      admission_number: {
         type: DataTypes.STRING(50),
         allowNull: false,
         unique: true,
      },
      student_name: {
         type: DataTypes.STRING(100),
         allowNull: false,
         validate: { notEmpty: true },
      },
      status: {
         type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
         defaultValue: 'ACTIVE',
      },
      created_at: {
         type: DataTypes.DATE,
         defaultValue: DataTypes.NOW,
      },
   },
   {
      sequelize,
      modelName: 'Student',
      tableName: 'students',
      timestamps: false,
      underscored: true,
   }
);

// Validation schemas within model
Student.validationSchema = {
   create: Joi.object({
      studentName: Joi.string().trim().max(100).required(),
      admissionNumber: Joi.string().trim().max(50).required(),
      classId: Joi.number().integer().positive().required(),
   }),
};

module.exports = Student;
```

---

## 💻 **DEVELOPMENT STANDARDS**

### **Mandatory JavaScript Patterns**

#### **1. Async/Await + Try-Catch (Q57-Q58)**

```javascript
// ✅ CORRECT - Every async function MUST use try-catch
async function createStudent(studentData) {
   try {
      const student = await Student.create(studentData);
      return { success: true, data: student };
   } catch (error) {
      logger.error('Student creation failed', { error: error.message });
      throw new AppError('Failed to create student', 400);
   }
}

// ❌ FORBIDDEN - No try-catch
async function createStudent(studentData) {
   const student = await Student.create(studentData); // VIOLATION
   return student;
}
```

#### **2. Service Layer Pattern**

```javascript
class StudentService {
   static async enrollStudent(studentData, classId) {
      try {
         const transaction = await sequelize.transaction();

         try {
            const student = await Student.create(studentData, { transaction });
            const enrollment = await Enrollment.create(
               {
                  studentId: student.id,
                  classId,
                  enrollmentDate: new Date(),
               },
               { transaction }
            );

            await transaction.commit();
            return { student, enrollment };
         } catch (error) {
            await transaction.rollback();
            throw error;
         }
      } catch (error) {
         logger.error('Enrollment failed', { studentData, classId, error });
         throw new AppError('Failed to enroll student', 500);
      }
   }
}
```

### **Naming Conventions**

| Element                  | Convention          | Example                                    |
| ------------------------ | ------------------- | ------------------------------------------ |
| **Database Tables**      | snake_case (plural) | `system_users`, `fee_structures`           |
| **Database Columns**     | snake_case          | `first_name`, `created_at`, `trust_id`     |
| **JavaScript Variables** | camelCase           | `userId`, `feeAmount`, `studentProfile`    |
| **JavaScript Functions** | camelCase           | `getUserById()`, `calculateFeeAmount()`    |
| **JavaScript Constants** | UPPER_SNAKE_CASE    | `MAX_LOGIN_ATTEMPTS`, `SESSION_TIMEOUT`    |
| **CSS Classes**          | kebab-case          | `form-input`, `btn-primary`, `card-header` |

### **Configuration Pattern (Q29 Compliance)**

```javascript
// ✅ CORRECT - Secrets from .env, config from JSON
const dbConfig = config.get('database');
const sequelize = new Sequelize(
  dbConfig.system.name,           // From JSON config
  process.env.DB_USER,            // From .env (secret)
  process.env.DB_PASSWORD,        // From .env (secret)
  {
    host: dbConfig.connection.host, // From JSON config
    port: dbConfig.connection.port, // From JSON config
    pool: dbConfig.pool            // From JSON config
  }
);

// ❌ FORBIDDEN - All from environment or hardcoded
host: process.env.DB_HOST,         // Should be in JSON
pool: { max: 15 }                  // Should be in JSON config
```

---

## 🌐 **API REFERENCE**

### **Authentication Endpoints**

```
POST   /auth/login              # User login
POST   /auth/logout             # User logout
POST   /auth/forgot-password    # Password reset request
GET    /auth/verify-session     # Session validity check
```

### **Student Management**

```
GET    /api/students            # List students (with filters)
POST   /api/students            # Create new student
GET    /api/students/:id        # Get student details
PUT    /api/students/:id        # Update student
DELETE /api/students/:id        # Delete student
POST   /api/students/:id/promote # Promote to next class
```

### **Fee Management**

```
GET    /api/fees/structures     # List fee structures
POST   /api/fees/structures     # Create fee structure
GET    /api/fees/collections    # List fee collections
POST   /api/fees/collect        # Collect fee payment
GET    /api/fees/reports        # Fee collection reports
```

### **User Management**

```
GET    /api/users               # List users (with filters)
POST   /api/users               # Create new user
GET    /api/users/:id           # Get user details
PUT    /api/users/:id           # Update user
POST   /api/users/:id/roles     # Assign roles to user
```

### **Response Format**

```javascript
// Success Response
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully",
  "timestamp": "2025-08-19T06:30:00Z"
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Invalid input data",
    "details": { /* error details */ }
  },
  "timestamp": "2025-08-19T06:30:00Z"
}
```

---

## ⚙️ **SETUP & CONFIGURATION**

### **Environment Variables (.env)**

```bash
# Database Credentials (SECRETS ONLY)
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password

# Application Secrets
SESSION_SECRET=your_session_secret_key
ENCRYPTION_KEY=your_encryption_key

# Environment
NODE_ENV=development
```

### **Configuration Files (config/)**

#### **Database Configuration (config/database.json)**

```json
{
   "development": {
      "connection": {
         "host": "localhost",
         "port": 3306
      },
      "system": {
         "name": "school_erp_system"
      },
      "tenant": {
         "prefix": "school_erp_trust_"
      },
      "pool": {
         "max": 15,
         "min": 2,
         "acquire": 60000,
         "idle": 300000
      }
   }
}
```

### **NPM Scripts**

```bash
# Development
npm run dev                     # Start development server
npm run test                    # Run tests

# Database Management
npm run first-setup             # Complete initial setup
npm run setup                   # Database setup only
npm run reset-db                # Reset databases

# Validation & Quality
npm run validate:all            # Complete validation suite
npm run validate:docs           # Documentation consistency
npm run fix:docs                # Auto-fix documentation

# Tenant Management
npm run trust:create            # Create new trust
npm run trust:list              # List all trusts
```

---

## 🚀 **DEPLOYMENT**

### **Production Environment**

```bash
# 1. Environment Setup
NODE_ENV=production
DB_HOST=your_production_host
DB_USER=your_production_user
DB_PASSWORD=your_secure_password

# 2. Security Configuration
SESSION_SECRET=cryptographically_strong_secret
ENCRYPTION_KEY=your_encryption_key

# 3. SSL Configuration
DB_SSL=true
HTTPS_ENABLED=true
```

### **Process Management (PM2)**

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Logs
pm2 logs school-erp
```

### **Health Monitoring**

```bash
# Health check endpoint
GET /health

# Response
{
  "status": "healthy",
  "database": "connected",
  "uptime": "24:15:30",
  "memory": "156MB",
  "timestamp": "2025-08-19T06:30:00Z"
}
```

---

## 📋 **DEVELOPMENT WORKFLOW**

### **For GitHub Copilot Users**

1. **ALWAYS** reference `SINGLE_SOURCE_OF_TRUTH.md` before generating code
2. **CHECK** specific Q&A decisions for implementation patterns
3. **USE** only approved technologies and patterns
4. **FOLLOW** async/await + try-catch pattern (Q57-Q58)
5. **VALIDATE** with `npm run validate:all` before committing
6. **FRONTEND VALIDATION** - MUST reuse existing API endpoint validation schemas (Q59-ENFORCED)

### **Code Generation Guidelines**

- Use CommonJS modules (`require`/`module.exports`)
- Implement Sequelize models with `sequelize.define()` pattern
- Include Joi validation schemas within model files
- Follow Q29 configuration patterns (JSON config + .env secrets)
- **NEVER create custom validation in web routes - always import existing schemas**
- Use structured error handling with Winston logging

---

### **Frontend Development Q&A**

#### **Q: Should web routes use their own validation or reuse API endpoint validation?**

**A: ALWAYS reuse existing API endpoint validation schemas.**

**Rationale:**

- **Consistency**: Same validation rules across web and API endpoints
- **Maintainability**: Single source of truth for validation logic
- **Error Handling**: Consistent error formats and messages
- **Testing**: Validation logic already tested in API test suites
- **Standards**: Follows established codebase architecture patterns

**Implementation Pattern:**

```javascript
// ✅ CORRECT: Reuse existing validation schemas
const { systemUserValidationSchemas } = require('../models/SystemUser');
const { validators } = require('../utils/errors');

// System login route
router.post('/auth/login', validators.validateBody(systemUserValidationSchemas.login), async (req, res, next) => {
   // Validation already done by middleware
   // req.body is sanitized and validated
});

// ❌ WRONG: Custom validation in web routes
router.post('/auth/login', async (req, res, next) => {
   if (!req.body.username || !req.body.password) {
      // Custom validation - inconsistent with API
   }
});
```

**Required Actions:**

1. Create missing `userValidationSchemas` for tenant authentication
2. Use `validators.validateBody()` middleware pattern consistently
3. Ensure error handling follows same format as API endpoints
4. Import validation schemas from model files, not custom implementations

**Status**: ✅ **ENFORCED** - All web routes must use existing validation schemas

---

### **Quality Assurance**

```bash
# Before committing
npm run validate:all          # Validate architecture compliance
npm run test                  # Run test suite
npm run lint                  # Code linting
npm run format               # Code formatting
```

---

## 🎯 **QUICK REFERENCE**

### **Key Commands**

```bash
npm run dev                   # Start development
npm run validate:all          # Full validation
npm run first-setup          # Initial setup
npm run fix:docs             # Fix documentation
```

### **Critical Files**

- `docs/architecture/SINGLE_SOURCE_OF_TRUTH.md` - All technical decisions
- `config/database.json` - Database configuration
- `server.js` - Application entry point
- `models/index.js` - Model loader and associations

### **Support & Documentation**

- **Architecture**: See SINGLE_SOURCE_OF_TRUTH.md for all decisions
- **Database**: Complete schema in this document
- **Development**: Follow patterns outlined in this guide
- **Deployment**: Production configuration guidelines included

---

**Last Updated**: August 19, 2025  
**Status**: Production Ready - Single Source of Truth  
**Next Phase**: Begin implementation using enforced technical decisions
