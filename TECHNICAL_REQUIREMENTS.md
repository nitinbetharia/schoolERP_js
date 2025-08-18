# School ERP - Technical Requirements Document

## Project Overview
Complete School ERP system with multi-tenant architecture supporting educational trusts managing multiple schools. Built for long-term reliability with bulletproof validation and zero-maintenance design.

## Module Dependencies & Implementation Sequence

### Phase 1: Foundation Layer (Critical Dependencies)
```
1. DATA Module    → Database infrastructure, connections, schema management
2. AUTH Module    → Authentication, authorization, session management
3. SETUP Module   → Initial configuration wizard for trusts and schools
```

### Phase 2: Core Entity Management
```
4. USER Module   → User lifecycle management (depends on AUTH, SETUP)
5. STUD Module   → Student management (depends on USER, SETUP)
```

### Phase 3: Operational Modules
```
6. FEES Module   → Fee management (depends on STUD, USER)
7. ATTD Module   → Attendance tracking (depends on STUD, USER)
```

### Phase 4: Analytics & Communication
```
8. REPT Module   → Reporting system (depends on all data modules)
9. DASH Module   → Dashboards (depends on all operational modules)
10. COMM Module  → Communications (depends on USER, STUD)
```

## Technical Architecture

### Database Architecture
- **Master Database**: `school_erp_master`
  - System configuration and trust registry
  - System-level users and audit logs
- **Trust Databases**: `school_erp_trust_{trust_code}`
  - Trust-specific data and operations
  - Complete isolation between trusts

### Technology Stack (Fixed Requirements)
- **Runtime**: Node.js 18+ (CommonJS, no TypeScript)
- **Framework**: Express.js 4.18+
- **Database**: MySQL 8.0+
- **Templates**: EJS 3.1+
- **Validation**: Joi 17.13+
- **Styling**: Tailwind CSS
- **Security**: Helmet, bcryptjs, rate limiting
- **Logging**: Winston with daily rotate

### Naming Conventions (Industry Standards)

#### Database Naming
- **Tables**: Snake_case (plural) - `system_users`, `fee_structures`
- **Columns**: Snake_case - `first_name`, `created_at`, `trust_id`
- **Indexes**: `idx_{table}_{column(s)}` - `idx_users_email`, `idx_students_admission_no`
- **Foreign Keys**: `fk_{table}_{referenced_table}` - `fk_students_schools`
- **Primary Keys**: `id` (auto-increment integer)
- **Timestamps**: `created_at`, `updated_at`, `deleted_at` (soft deletes)

#### Code Naming
- **Files**: Kebab-case - `user-management.js`, `fee-collection.js`
- **Variables**: camelCase - `userId`, `feeAmount`, `studentProfile`
- **Constants**: UPPER_SNAKE_CASE - `MAX_LOGIN_ATTEMPTS`, `SESSION_TIMEOUT`
- **Functions**: camelCase - `getUserById()`, `calculateFeeAmount()`
- **Classes**: PascalCase - `UserService`, `FeeCalculator`
- **Routes**: Kebab-case - `/api/user-management`, `/fees/fee-structure`

#### Directory Structure
```
school-erp-bulletproof/
├── server.js                  # Main entry point
├── config/                    # Configuration files
│   ├── database.js           # Database connection config
│   ├── rbac.json            # Role-based access control
│   └── validation-schemas.js # Joi validation schemas
├── middleware/               # Express middleware
│   ├── auth-middleware.js   # Authentication middleware
│   ├── validation.js        # Input validation
│   └── error-handler.js     # Error handling
├── modules/                 # Feature modules
│   ├── data/               # DATA module
│   ├── auth/               # AUTH module
│   ├── setup/              # SETUP module
│   ├── user/               # USER module
│   ├── student/            # STUD module
│   ├── fees/               # FEES module
│   ├── attendance/         # ATTD module
│   ├── reports/            # REPT module
│   ├── dashboard/          # DASH module
│   └── communication/      # COMM module
├── services/               # Business logic services
├── models/                # Database models
├── utils/                 # Utility functions
├── views/                 # EJS templates
│   ├── layouts/           # Layout templates
│   ├── components/        # Reusable components
│   └── pages/            # Page templates
├── public/               # Static assets
│   ├── css/             # Compiled CSS
│   ├── js/              # Client-side JavaScript
│   └── images/          # Images and icons
├── logs/                # Application logs
├── scripts/             # Setup and maintenance scripts
└── tests/               # Test files
```

## Module Specifications

### 1. DATA Module - Database Infrastructure
**Purpose**: Foundation layer for all database operations

**Components**:
- Database connection management with pooling
- Schema creation and migration system
- Multi-database support (master + trust databases)
- Health checks and monitoring
- Audit logging infrastructure

**Key Files**:
- `modules/data/database-service.js` - Connection management
- `modules/data/migration-service.js` - Schema migrations
- `modules/data/audit-service.js` - Audit logging
- `scripts/setup-database.js` - Database initialization

**Database Tables**:
```sql
-- Master Database Tables
system_config (id, config_key, config_value, data_type, created_at, updated_at)
trusts (id, trust_name, trust_code, subdomain, contact_email, created_at, updated_at)
system_users (id, username, email, password_hash, role, last_login, created_at, updated_at)
migration_versions (version, executed_at)
system_audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent, created_at)
```

### 2. AUTH Module - Authentication & Authorization
**Purpose**: Complete security framework

**Components**:
- User authentication (session + JWT)
- Role-based access control (RBAC)
- Multi-factor authentication (MFA)
- Account security policies
- Session management

**Key Files**:
- `modules/auth/auth-service.js` - Authentication logic
- `modules/auth/rbac-service.js` - Role-based access control
- `modules/auth/session-service.js` - Session management
- `middleware/auth-middleware.js` - Auth middleware

**Security Features**:
- Password hashing with bcrypt (12 rounds)
- Account lockout after failed attempts
- Session timeout and rotation
- Rate limiting on auth endpoints
- XSS and CSRF protection

### 3. SETUP Module - Configuration Wizard
**Purpose**: Initial system setup and configuration

**Components**:
- Trust creation wizard
- School configuration
- Academic structure setup
- Initial user creation
- System configuration

**Key Files**:
- `modules/setup/setup-service.js` - Setup business logic
- `modules/setup/wizard-controller.js` - Wizard flow control
- `views/setup/` - Wizard templates

### 4. USER Module - User Management
**Purpose**: Complete user lifecycle management

**Components**:
- User CRUD operations
- Role and permission management
- School assignments
- Profile management
- Department and designation tracking

**Database Tables**:
```sql
-- Trust Database Tables
users (id, employee_id, first_name, last_name, email, phone, password_hash, role, status, school_id, department, designation, date_of_joining, created_at, updated_at)
user_school_assignments (id, user_id, school_id, role, assigned_at, assigned_by)
user_sessions (session_id, user_id, ip_address, user_agent, created_at, expires_at)
```

### 5. STUD Module - Student Management
**Purpose**: Student lifecycle from admission to graduation

**Components**:
- Admission process with workflow
- Student profile management
- Parent-student relationships
- Transfer and promotion workflows
- Document management

**Database Tables**:
```sql
students (id, admission_no, roll_no, first_name, last_name, date_of_birth, gender, class_id, section_id, academic_year_id, admission_date, status, created_at, updated_at)
admissions (id, application_no, student_id, class_id, application_date, admission_date, status, documents_verified, created_by, approved_by, created_at, updated_at)
student_parents (id, student_id, parent_id, relationship, is_primary_contact, created_at, updated_at)
student_transfers (id, student_id, from_school_id, to_school_id, transfer_date, reason, status, approved_by, created_at, updated_at)
```

### 6. FEES Module - Fee Management
**Purpose**: Comprehensive financial management

**Components**:
- Fee structure management
- Student fee assignments
- Payment collection and tracking
- Discount and scholarship management
- Financial reporting

**Database Tables**:
```sql
fee_structures (id, class_id, academic_year_id, fee_head, amount, due_date, is_mandatory, created_at, updated_at)
student_fee_assignments (id, student_id, fee_structure_id, assigned_amount, discount_amount, final_amount, due_date, created_at, updated_at)
fee_receipts (id, receipt_no, student_id, amount_paid, payment_mode, payment_reference, paid_date, collected_by, created_at, updated_at)
fee_discounts (id, student_id, discount_type, discount_value, reason, approved_by, created_at, updated_at)
```

### 7. ATTD Module - Attendance Management
**Purpose**: Daily attendance tracking and reporting

**Database Tables**:
```sql
attendance_daily (id, student_id, class_id, attendance_date, status, marked_by, remarks, created_at, updated_at)
attendance_summary (id, student_id, month, year, total_days, present_days, absent_days, late_days, percentage, updated_at)
leave_applications (id, student_id, leave_type, from_date, to_date, reason, status, applied_by, approved_by, created_at, updated_at)
```

### 8. REPT Module - Reporting System
**Purpose**: Comprehensive reporting and analytics

**Components**:
- Pre-built report templates
- Custom report builder
- Export functionality (PDF, Excel, CSV)
- Scheduled reports
- Report sharing and distribution

### 9. DASH Module - Dashboard & Analytics
**Purpose**: Role-based dashboards with key metrics

**Components**:
- Real-time KPI widgets
- Role-specific dashboards
- Interactive charts and graphs
- Quick action panels
- Performance indicators

### 10. COMM Module - Communication System
**Purpose**: Multi-channel communication platform

**Components**:
- SMS and email integration
- In-app messaging
- Announcement system
- Emergency alerts
- Communication templates

## Validation Standards

### Input Validation (Joi Schemas)
```javascript
// Example validation schema
const studentSchema = Joi.object({
  admissionNo: Joi.string().pattern(/^[A-Z0-9]{6,12}$/).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  dateOfBirth: Joi.date().max('now').required(),
  gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').required(),
  classId: Joi.number().integer().positive().required(),
  sectionId: Joi.number().integer().positive().required()
}).strict();
```

### Business Rule Validation
- Unique constraints on critical fields (email, admission numbers)
- Date range validations (admission dates, fee due dates)
- Relationship validations (parent-student links, teacher-class assignments)
- Financial validations (fee amounts, payment references)

## Security Standards

### Authentication Security
- Password complexity requirements (8+ chars, mixed case, numbers, symbols)
- Account lockout after 5 failed attempts
- Session timeout after 30 minutes of inactivity
- Multi-factor authentication for admin roles

### Data Security
- All sensitive data encrypted at rest
- Parameterized queries to prevent SQL injection
- XSS prevention through template escaping
- CSRF tokens for all forms
- Rate limiting on all endpoints

### Access Control
- Role-based access control with granular permissions
- Context-aware authorization (users can only access their school's data)
- Audit logging for all CRUD operations
- IP-based access restrictions for admin functions

## Performance Standards

### Response Time Targets
- Page loads: < 2 seconds
- API responses: < 500ms
- Database queries: < 100ms
- Report generation: < 10 seconds

### Scalability Targets
- 1000+ concurrent users per trust
- 50,000+ students per trust
- 1M+ transactions per year
- 99.9% uptime SLA

## Testing Standards

### Unit Testing
- All business logic functions
- Validation schemas
- Database operations
- Utility functions

### Integration Testing
- API endpoints
- Database transactions
- Authentication flows
- Module interactions

### End-to-End Testing
- Complete user workflows
- Cross-module operations
- Error handling scenarios
- Performance testing

## Deployment Standards

### Environment Configuration
- Development: Local MySQL with sample data
- Staging: Cloud VM with production-like data
- Production: Load-balanced setup with backup

### Monitoring Requirements
- Application performance monitoring
- Database performance tracking
- Error tracking and alerting
- User activity analytics
- Health check endpoints

## Compliance Requirements

### Data Protection
- GDPR compliance for data handling
- Student data protection policies
- Audit trail maintenance
- Data retention policies
- Right to data deletion

### Educational Standards
- Academic record security
- Parental consent management
- Grade privacy protection
- Financial transaction compliance

---

**Implementation Timeline**: 5-7 days for complete development
**Testing Phase**: 2-3 days for comprehensive testing
**Total Delivery**: Production-ready system in 7-10 days

This document serves as the complete technical specification for implementing all modules with industry standards and bulletproof reliability.