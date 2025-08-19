# School ERP - REQUIREMENTS & DEVELOPMENT SEQUENCE (FROM GITHUB)

**Source**: Pulled from existing GitHub repository documentation  
**Last Updated**: August 18, 2025  
**Status**: Production-ready architecture with complete implementation plan

---

## 📋 **CORE REQUIREMENTS SUMMARY**

### **10 Core Modules (Implementation Sequence)**

Based on `TECHNICAL_REQUIREMENTS.md` and `TECHNICAL_SPECIFICATION_COMPLETE.md`
from GitHub:

#### **Phase 1: Foundation Layer (Week 1-2)**

1. **DATA Module** - Database infrastructure, connections, schema management
2. **AUTH Module** - Authentication, authorization, session management
3. **SETUP Module** - Initial configuration wizard for trusts and schools

#### **Phase 2: Core Entity Management (Week 3-4)**

4. **USER Module** - User lifecycle management (depends on AUTH, SETUP)
5. **STUD Module** - Student management (depends on USER, SETUP)

#### **Phase 3: Operational Modules (Week 5-6)**

6. **FEES Module** - Fee management with configurable calculation engine
   (depends on STUD, USER)
7. **ATTD Module** - Attendance tracking (depends on STUD, USER)

#### **Phase 4: Analytics & Communication (Week 7-8)**

8. **REPT Module** - Reporting system (depends on all data modules)
9. **DASH Module** - Dashboards (depends on all operational modules)
10. **COMM Module** - Communications (depends on USER, STUD)

---

## 🎯 **DETAILED MODULE SPECIFICATIONS**

### **1. DATA Module - Database Infrastructure**

**Purpose**: Foundation layer for all database operations

**Components**:

- Multi-tenant Sequelize connection management
- Schema creation and migration system
- Multi-database support (master + trust databases)
- Health checks and monitoring
- Audit logging infrastructure

**Key Features**:

- Connection pooling: `{ max: 15, min: 2, acquire: 60000, idle: 300000 }`
- Mixed primary keys: UUIDs for sensitive data, integers for lookups
- Snake_case database, camelCase JavaScript mapping

### **2. AUTH Module - Authentication & Authorization**

**Purpose**: Complete security framework

**Components**:

- User authentication with bcryptjs (12 salt rounds)
- Role-based access control (RBAC)
- Session management with MySQL store
- Account security policies
- Multi-factor authentication capability

**Key Features**:

- Role-based session timeouts: ADMIN(8h), TEACHER(12h), PARENT(24h)
- Comprehensive audit trail with before/after tracking
- Account lockout after failed attempts

### **3. SETUP Module - Configuration Wizard**

**Purpose**: Initial system setup and configuration

**Components**:

- Trust creation wizard with frontend management
- School configuration and structure setup
- Academic year and session management
- Initial user creation workflow
- System configuration with per-tenant defaults

### **4. USER Module - User Management**

**Purpose**: Complete user lifecycle management

**Components**:

- User CRUD operations with validation
- Role and permission management
- School assignments and relationships
- Profile management and department tracking
- Teacher-class assignments

**Database Tables**:

```sql
users (id, employee_id, first_name, last_name, email, phone, password_hash, role, status, school_id, department, designation, date_of_joining, created_at, updated_at)
user_school_assignments (id, user_id, school_id, role, assigned_at, assigned_by)
user_sessions (session_id, user_id, ip_address, user_agent, created_at, expires_at)
```

### **5. STUD Module - Student Management**

**Purpose**: Student lifecycle from admission to graduation

**Components**:

- Admission process with workflow
- Student profile management with UUID primary keys
- Parent-student relationships
- Transfer and promotion workflows
- Document management integration

**Database Tables**:

```sql
students (id, admission_no, roll_no, first_name, last_name, date_of_birth, gender, class_id, section_id, academic_year_id, admission_date, status, created_at, updated_at)
admissions (id, application_no, student_id, class_id, application_date, admission_date, status, documents_verified, created_by, approved_by, created_at, updated_at)
student_parents (id, student_id, parent_id, relationship, is_primary_contact, created_at, updated_at)
student_transfers (id, student_id, from_school_id, to_school_id, transfer_date, reason, status, approved_by, created_at, updated_at)
```

### **6. FEES Module - Fee Management** ⭐ **ENHANCED**

**Purpose**: Comprehensive financial management with configurable calculation
engine

**Components**:

- **ConfigurableFeeCalculator** with tenant-specific rules
- Fee structure management and assignments
- Payment collection and tracking
- Late fees, scholarships, waivers, and custom formulas
- Frontend rule builder with JavaScript formula execution
- Financial reporting and analytics

**Database Tables**:

```sql
fee_structures (id, class_id, academic_year_id, fee_head, amount, due_date, is_mandatory, created_at, updated_at)
student_fee_assignments (id, student_id, fee_structure_id, assigned_amount, discount_amount, final_amount, due_date, created_at, updated_at)
fee_receipts (id, receipt_no, student_id, amount_paid, payment_mode, payment_reference, paid_date, collected_by, created_at, updated_at)
fee_discounts (id, student_id, discount_type, discount_value, reason, approved_by, created_at, updated_at)
```

### **7. ATTD Module - Attendance Management**

**Purpose**: Daily attendance tracking and reporting

**Components**:

- Daily attendance with multiple status tracking
- Leave application workflows
- Attendance analytics and reporting
- Automated notification system

**Database Tables**:

```sql
attendance_daily (id, student_id, class_id, attendance_date, status, marked_by, remarks, created_at, updated_at)
attendance_summary (id, student_id, month, year, total_days, present_days, absent_days, late_days, percentage, updated_at)
leave_applications (id, student_id, leave_type, from_date, to_date, reason, status, applied_by, approved_by, created_at, updated_at)
```

### **8. REPT Module - Reporting System**

**Purpose**: Comprehensive reporting and analytics

**Components**:

- Pre-built report templates
- Custom report builder functionality
- Export capabilities (PDF, Excel, CSV)
- Scheduled reports and distribution
- Role-based report access

### **9. DASH Module - Dashboard & Analytics**

**Purpose**: Role-based dashboards with key metrics

**Components**:

- Real-time KPI widgets with caching
- Role-specific dashboard configurations
- Interactive charts and performance indicators
- Quick action panels for common tasks

### **10. COMM Module - Communication System** ⭐ **ENHANCED**

**Purpose**: Multi-channel communication platform

**Components**:

- **CommunicationEngine** with multiple providers
- Email: SendGrid, Nodemailer integration
- SMS: Twilio integration
- WhatsApp: Business API support
- In-app messaging and announcements
- Emergency alerts and template management

---

## 🔐 **ROLE-BASED ACCESS CONTROL (RBAC)**

### **Role Hierarchy & Permissions**

Based on [`config/rbac.json`](../config/rbac.json):

#### **System Level (Master Database)**

- **SUPER_ADMIN/SYSTEM_ADMIN/SYS_ADMIN** (Level 0)
  - Ultimate system access with all privileges
  - Manage multiple trusts and entire system
  - Permissions: `["*"]` (everything)

- **GROUP_ADMIN/TRUST_ADMIN** (Level 1)
  - Manage multiple trusts under a group
  - Full CRUD on trusts, schools, users, students, fees
  - Database: master/trust

#### **Trust Level (Tenant Database)**

- **SCHOOL_ADMIN** (Level 2)
  - Manage single school operations
  - CRUD on users, students, fees, attendance within school
  - Can create communications

- **TEACHER** (Level 3)
  - Manage students and attendance for assigned classes
  - Read/update students, CRUD attendance
  - Context: Only assigned classes

- **ACCOUNTANT** (Level 6)
  - Manage fee collection and financial records
  - Read students, CRUD fees, read reports

- **PARENT** (Level 7)
  - View child's records and make payments
  - Read own children's data only
  - Context: Only own children
    (`student_id IN (SELECT id FROM students WHERE guardian_user_id = ?)`)

### **Resources & Actions**

- **trusts**: read, create, update, delete
- **schools**: read, create, update, delete
- **users**: read, create, update, delete
- **students**: read, create, update, delete
- **fees**: read, create, update, delete
- **attendance**: read, create, update, delete
- **reports**: read, export
- **communications**: read, create, update, delete
- **setup**: read, update

### **Route Permissions**

- `/admin`: SYSTEM_ADMIN, GROUP_ADMIN only
- `/setup`: SYSTEM_ADMIN, GROUP_ADMIN, TRUST_ADMIN
- `/dashboard`: All authenticated users
- `/students`: TRUST_ADMIN, SCHOOL_ADMIN, TEACHER, PARENT
- `/fees`: TRUST_ADMIN, SCHOOL_ADMIN, ACCOUNTANT, PARENT
- `/attendance`: TRUST_ADMIN, SCHOOL_ADMIN, TEACHER, PARENT
- `/reports`: All except PARENT
- `/users`: SYSTEM_ADMIN, GROUP_ADMIN, TRUST_ADMIN, SCHOOL_ADMIN

### **Context Rules**

- **PARENT**: Can only access own children's data
- **TEACHER**: Can only access assigned classes
- **SCHOOL_ADMIN**: Can only access own school data

---

## 🏗️ **MODULE ARCHITECTURE**

### **Fee Calculation Engine**

- **Pattern**: Tenant-configurable fee calculation with frontend rules
- **Features**: Late fees, scholarships, waivers, custom formulas, frontend
  configuration
- **Implementation**: ConfigurableFeeCalculator class with rule engine

### **Communication System**

- **Pattern**: Multi-channel communication with provider integration
- **Channels**: Email (SendGrid/Nodemailer), SMS (Twilio), WhatsApp (Business
  API)
- **Implementation**: CommunicationEngine with provider registration

### **Academic Calendar**

- **Pattern**: Tenant-configurable academic calendar with flexible structures
- **Structures**: Semester, Trimester, Quarter, Custom periods
- **Implementation**: ConfigurableAcademicCalendar class

### **Wizard Setup**

- **Pattern**: Configurable wizard system with frontend management
- **Features**: Add/update/remove wizards, dynamic steps, per-tenant
  configuration
- **Implementation**: WizardEngine with configurable steps

---

## 📅 **16-WEEK IMPLEMENTATION TIMELINE**

### **Week 1-2: Foundation**

- [ ] Set up Sequelize with multi-tenant connection management
- [ ] Implement authentication with bcryptjs + express-session
- [ ] Create base model patterns with validation schemas
- [ ] Set up Winston logging with daily rotation
- [ ] Configure PM2 for process management

### **Week 3-4: Core Business Logic**

- [ ] Implement configurable fee calculation engine
- [ ] Set up multi-channel communication system
- [ ] Create academic calendar management
- [ ] Implement user management with role-based access
- [ ] Set up file upload handling (Multer + cloud options)

### **Week 5-6: Student & Academic Management**

- [ ] Create student management with proper validation
- [ ] Implement attendance tracking system
- [ ] Set up grade and academic record management
- [ ] Create parent-student-teacher relationship management
- [ ] Implement academic year and session management

### **Week 7-8: Financial Management**

- [ ] Implement fee structure setup and management
- [ ] Create payment processing and receipt generation
- [ ] Set up defaulter tracking and payment reminders
- [ ] Implement financial reporting and analytics
- [ ] Add scholarship and discount management

### **Week 9-10: Reporting & Analytics**

- [ ] Create comprehensive reporting system
- [ ] Implement role-based dashboards
- [ ] Set up real-time statistics and monitoring
- [ ] Add custom report builder functionality
- [ ] Implement data export capabilities

### **Week 11-12: Frontend & UX**

- [ ] Create EJS templates with Alpine.js components
- [ ] Implement responsive design with Tailwind CSS
- [ ] Add interactive forms and data tables
- [ ] Set up comprehensive error handling and user feedback
- [ ] Implement caching with tag-based invalidation

### **Week 13-14: Security & Performance**

- [ ] Add encryption for sensitive data
- [ ] Implement comprehensive audit trail system
- [ ] Set up performance metrics collection
- [ ] Add email alerting for critical errors
- [ ] Optimize database queries with smart loading

### **Week 15-16: Testing & Deployment**

- [ ] Create comprehensive test suite
- [ ] Set up health checks and monitoring
- [ ] Configure production deployment with PM2
- [ ] Implement backup and recovery procedures
- [ ] Create documentation and user guides

---

## 🏢 **BUSINESS LOGIC PATTERNS (FROM SINGLE SOURCE OF TRUTH)**

### **Fee Calculation Engine (FEES Module)**

**Pattern**: Tenant-configurable fee calculation with frontend rules  
**Features**: Late fees, scholarships, waivers, custom formulas, frontend
configuration  
**Implementation**: ConfigurableFeeCalculator class with rule engine

### **Communication System (COMM Module)**

**Pattern**: Multi-channel communication with provider integration  
**Channels**: Email (SendGrid/Nodemailer), SMS (Twilio), WhatsApp (Business
API)  
**Implementation**: CommunicationEngine with provider registration

### **Academic Calendar (SETUP Module)**

**Pattern**: Tenant-configurable academic calendar with flexible structures  
**Structures**: Semester, Trimester, Quarter, Custom periods  
**Implementation**: ConfigurableAcademicCalendar class

### **Wizard Setup (SETUP Module)**

**Pattern**: Configurable wizard system with frontend management  
**Features**: Add/update/remove wizards, dynamic steps, per-tenant
configuration  
**Implementation**: WizardEngine with configurable steps

---

## 🔧 **TECHNICAL SPECIFICATIONS**

**All technical decisions documented in**:
[`docs/architecture/SINGLE_SOURCE_OF_TRUTH.md`](docs/architecture/SINGLE_SOURCE_OF_TRUTH.md)

**Core Stack (Q1-Q10)**:

- **Runtime**: Node.js 18+ (CommonJS modules only - NO ES6 imports)
- **Framework**: Express.js with MVC + JSON API endpoints (`/api/v1/`)
- **Database**: MySQL 8+ with **Sequelize ORM** (`sequelize.define()` pattern -
  NO raw mysql2)
- **Templates**: **EJS** with include-based partials
- **Frontend**: **Tailwind CSS** (CDN) + **Alpine.js** reactive components (NO
  Bootstrap/React/Vue)
- **Modules**: **CommonJS** (`require`/`module.exports`) - NO ES6
  imports/TypeScript
- **Validation**: **Joi + Sequelize validations + custom business rules** (NO
  express-validator only)
- **Security**: **bcryptjs** (12 salt rounds) + **express-session** with MySQL
  store (NO JWT)
- **Logging**: **Winston** with daily rotation + structured logging (NO
  console.log)
- **Migrations**: **Sequelize CLI** with migration files (NO manual SQL scripts)
- **Multi-Tenant**: **Separate databases per tenant**
  (`school_erp_trust_{code}`)
- **Deployment**: **Cloud MySQL + local Node.js** (NO Docker containers)
- **Process Management**: **PM2** with ecosystem.config.js
- **Caching**: **node-cache** for in-memory caching (NO Redis cache)

**Database Architecture (Q11-Q18)**:

- **Connection Pool**: `{ max: 15, min: 2, acquire: 60000, idle: 300000 }`
- **Model Pattern**: Direct `sequelize.define()` calls (NO class extends Model)
- **Primary Keys**: Mixed - UUIDs for sensitive data, integers for lookup tables
- **Timestamps**: Custom fields (`created_at`, `updated_at`, `deleted_at`)
- **Naming**: Snake_case database, camelCase JavaScript (`underscored: true`)
- **Sessions**: Environment-based configuration (secure in production)

**Frontend & API (Q26-Q28, Q41-Q43)**:

- **CSS Delivery**: Tailwind CSS via CDN (NO local build process)
- **Templates**: EJS include-based partials with component data passing
- **Client JavaScript**: Alpine.js for reactive components (NO vanilla JS only)
- **API Versioning**: URL path versioning (`/api/v1/`) (NO header versioning)
- **Pagination**: Hybrid - offset for small, cursor for large datasets
- **Rate Limiting**: Endpoint-specific rate limits (NO global rate limiting)

---

**Status**: ✅ **PRODUCTION READY ARCHITECTURE**  
**Source**: Compiled from existing GitHub repository documentation  
**Next Step**: Begin Phase 1 implementation following this sequence
