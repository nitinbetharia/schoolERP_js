# GitHub Copilot Instructions - School ERP System

## 🔒 CRITICAL: SINGLE SOURCE OF TRUTH ENFORCEMENT

**ALL technical decisions are FINAL and documented in
`docs/architecture/SINGLE_SOURCE_OF_TRUTH.md`**

Before generating ANY code, you MUST:

1. ✅ Read `docs/architecture/SINGLE_SOURCE_OF_TRUTH.md` for the specific Q&A
   decision
2. ✅ Use ONLY the implementation pattern specified in that decision
3. ❌ NEVER use any pattern marked as "FORBIDDEN"
4. ✅ Follow the exact technical specifications documented

## 📋 **CURRENT PROJECT STATUS (UPDATED August 19, 2025)**

### **✅ COMPLETED PHASES**

```
Phase 1: Legacy Cleanup           ████████████████████ 100%
Phase 2: Database Architecture    ████████████████████ 100%
Phase 3: Model Infrastructure     ████████████████████ 100%
```

### **🎯 READY FOR IMPLEMENTATION**

```
Phase 4: Business Services        ░░░░░░░░░░░░░░░░░░░░   0%
Phase 5: Controller Layer         ░░░░░░░░░░░░░░░░░░░░   0%
Phase 6: Integration Testing      ░░░░░░░░░░░░░░░░░░░░   0%
```

### **📊 CURRENT ARCHITECTURE STATUS**

- **18 Models Complete**: 7 core + 11 domain-specific models
- **100% Q&A Compliance**: All architectural decisions enforced
- **HYBRID ARCHITECTURE**: Core models in root, modules in domains
- **Multi-tenant Ready**: System + tenant database separation
- **Performance Optimized**: Proper indexing and association patterns

## 📋 CRITICAL: TODO LIST MANAGEMENT (LIKE CLAUDE CODER)

**BEFORE starting ANY development activity, you MUST:**

1. ✅ **Create/Update TODO List** - List all sub-tasks for the requested feature
2. ✅ **Check Off Completed Items** - Mark tasks as complete as you progress
3. ✅ **Show Progress** - Display current progress (e.g., "3/7 tasks completed")
4. ✅ **Explain Next Steps** - Always explain what task you're working on next
5. ✅ **Update List Dynamically** - Add new tasks if discovered during
   implementation

**Format Example:**

```
TODO: Implement Fee Collection Service
- [x] Create FeeStructure model (already complete)
- [x] Create FeeTransaction model (already complete)
- [ ] Create fee-structure-service.js
- [ ] Create fee-collection-service.js
- [ ] Add fee calculation business logic
- [ ] Create fee collection API endpoints
- [ ] Add fee reporting capabilities

Current: Working on fee-structure-service.js (2/7 completed)
```

## 🚨 CRITICAL: ASYNC/AWAIT + TRY-CATCH ENFORCEMENT (Q57-Q58)

**ALL JavaScript code MUST follow these patterns:**

### **MANDATORY: Async/Await Pattern (Q57)**

```javascript
// ✅ CORRECT - Always use async/await
async function processStudentData(studentId) {
  try {
    const student = await Student.findByPk(studentId);
    const result = await performOperation(student);
    return result;
  } catch (error) {
    logger.error('Student processing failed', {
      studentId,
      error: error.message
    });
    throw error;
  }
}

// ❌ FORBIDDEN - No callbacks or raw promises
function processStudentData(studentId, callback) {
  // NEVER USE
  Student.findByPk(studentId)
    .then(student => {
      // NEVER USE
      callback(null, student);
    })
    .catch(callback); // NEVER USE
}
```

### **MANDATORY: Try-Catch Pattern (Q58)**

```javascript
// ✅ CORRECT - Every async function has try-catch
async function createStudent(studentData) {
  try {
    const validated = Student.sanitizeInput(studentData);
    const student = await Student.create(validated);
    logger.business('student_created', 'Student', student.id);
    return student;
  } catch (error) {
    logger.error('Student creation failed', {
      studentData,
      error: error.message
    });
    throw new AppError('Failed to create student', 400);
  }
}

// ❌ FORBIDDEN - No unhandled async operations
async function createStudent(studentData) {
  // NEVER USE
  const student = await Student.create(studentData); // No try-catch = VIOLATION
  return student;
}
```

### **MANDATORY: Controller Pattern**

```javascript
// ✅ CORRECT - All controllers use async/await + try-catch
const createStudentController = async (req, res, next) => {
  try {
    const studentData = req.body;
    const student = await studentService.createStudent(studentData);
    res.status(201).json({ success: true, data: student });
  } catch (error) {
    next(error); // Pass to centralized error handler
  }
};

// ❌ FORBIDDEN - No sync controllers or missing error handling
const createStudentController = (req, res) => {
  // NEVER USE - not async
  const student = studentService.createStudent(req.body); // No await = VIOLATION
  res.json(student);
};
```

## 🚨 CRITICAL: BUSINESS CONSTANTS ENFORCEMENT (Q59)

**NO hardcoded business values allowed anywhere in code:**

### **MANDATORY: Use Business Constants (Q59)**

```javascript
// ✅ CORRECT - Use business constants from config
const config = require('../config/index');
const constants = config.get('constants');

// Model with constants
status: {
  type: DataTypes.ENUM(...constants.USER_STATUS.ALL_STATUS),
  defaultValue: constants.USER_STATUS.ACTIVE
}

// Joi validation with constants
role: Joi.string()
  .valid(...constants.USER_ROLES.ALL_ROLES)
  .required()

// Business logic with constants
if (user.role === constants.USER_ROLES.ADMIN) {
  // Admin logic
}

// ❌ FORBIDDEN - No hardcoded business values
status: {
  type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'LOCKED'), // NEVER USE
  defaultValue: 'ACTIVE' // NEVER USE
}

role: Joi.string().valid('ADMIN', 'TEACHER', 'STUDENT') // NEVER USE

if (user.role === 'ADMIN') { // NEVER USE
  // Logic
}
```

### **MANDATORY: Business Constants Categories**

- `USER_ROLES` - All user role types
- `USER_STATUS` - User account status values
- `ACADEMIC_STATUS` - Academic entity status
- `PAYMENT_STATUS` - Payment transaction status
- `COMMUNICATION_STATUS` - Message/notification status
- `ATTENDANCE_STATUS` - Attendance tracking values

## 🚨 CRITICAL: CODE CONSISTENCY RULES (CURRENT ARCHITECTURE)

**ALWAYS check existing code before creating new code**:

1. ✅ **Check existing models** in `models/` and `modules/*/models/` for:
   - **18 Complete Models**: Use as reference for new models
   - **Association Patterns**: Follow `models/index.js` loading pattern
   - **Validation Patterns**: Use Joi schemas within model files
   - **Business Constants**: Use `config/business-constants.js`

2. ✅ **Use existing model infrastructure**:
   - **Model Loading**: Use `models/index.js` for all model operations
   - **Database Connection**: Models handle connections automatically
   - **Associations**: All models have proper foreign key relationships
   - **Validation**: Every model includes Joi validation schemas

3. ✅ **Follow HYBRID ARCHITECTURE pattern**:
   - **Core Models**: Place in root `models/` (User, Student, School, etc.)
   - **Domain Models**: Place in `modules/{domain}/models/`
   - **Services**: Create in `modules/{domain}/services/` (NEXT PHASE)
   - **Controllers**: Create in `modules/{domain}/controllers/` (NEXT PHASE)

4. ✅ **Use existing patterns**:
   - **Route patterns**: `/api/v1/{module}/{action}`
   - **Error handling**: Use centralized error response format
   - **Middleware chain**: Follow established order
   - **File organization**: Follow existing module structure

5. ✅ **Database operations**:
   - **Model Access**: Use `models.ModelName` after loading via index.js
   - **Transactions**: Use Sequelize transaction patterns
   - **Queries**: Use Sequelize ORM methods (no raw SQL)
   - **Migrations**: Use Sequelize CLI for schema changes

## 🏗️ **CURRENT MODEL REFERENCE GUIDE**

### **Core Models (models/)**

- **User.js** - Base authentication for all user types
- **Student.js** - Student-specific academic data (extends User concept)
- **School.js** - Multi-school support within trusts
- **Class.js** - Academic class structure
- **Section.js** - Class sections/divisions
- **Subject.js** - Curriculum subjects
- **AcademicYear.js** - Academic calendar configuration

### **Domain Models (modules/\*/models/)**

**System Management:**

- **Trust.js** - Tenant registry and configuration
- **SystemUser.js** - Super admin authentication
- **SystemAuditLog.js** - Cross-tenant audit trails

**Fee Management:**

- **FeeStructure.js** - Configurable fee rules per class/section
- **FeeTransaction.js** - Payment tracking and reconciliation

**Attendance System:**

- **AttendanceConfig.js** - Holiday calendar and working day rules
- **AttendanceRecord.js** - Daily attendance tracking

**Communication:**

- **MessageTemplate.js** - Multi-channel message templates
- **Message.js** - Message delivery management
- **CommunicationLog.js** - Delivery tracking and analytics

**Audit & Security:**

- **AuditLog.js** - Comprehensive change tracking

5. ✅ **All seedings and DB operations**:
   - MUST use existing connection objects from
     `modules/data/database-service.js`
   - MUST follow existing query patterns
   - MUST use established transaction methods

## 🏗️ HYBRID ARCHITECTURE STRUCTURE (ENFORCED)

**Follow DRY principles with clear separation between SHARED and MODULE-SPECIFIC
code:**

### **SHARED RESPONSIBILITY (Root Level)**

- **`models/`** - Core entities only (User, Student, School, Trust, Permission)
- **`middleware/`** - Cross-cutting concerns (auth, tenant, validation, logging)
- **`routes/`** - Main router registration and API routing
- **`views/layouts/`** - Common layouts and shell templates
- **`config/`** - Configuration files and RBAC
- **`utils/`** - Shared utilities and helpers

### **MODULE RESPONSIBILITY**

- **`modules/{name}/services/`** - Business logic specific to that domain
- **`modules/{name}/controllers/`** - HTTP handlers for that module
- **`modules/{name}/models/`** - Domain-specific models (FeeRule,
  AttendanceRecord)
- **`modules/{name}/views/`** - Module-specific UI components
- **`modules/{name}/business/`** - Complex business logic classes

### **DRY ENFORCEMENT RULES**

1. ✅ **Models can reference other models** (Student → User)
2. ✅ **Modules can call other module services** (Fees → Student service)
3. ❌ **NO direct module-to-module model access** (use services)
4. ✅ **Shared utilities in utils/**, module utilities in
   `modules/{name}/utils/`
5. ❌ **NO duplicate code** - Always check existing implementations first

## 📁 FILE ORGANIZATION (ENFORCED)

**Root folder should have MINIMUM files**. New files MUST go in appropriate
folders:

- **Documentation**: `docs/` folder only
  - Architecture: `docs/architecture/`
  - Developer guides: `docs/developer/`
  - Setup guides: `docs/setup/`
- **Code**: Organized by module in `modules/`
- **Configuration**: `config/` folder only
- **Scripts**: `scripts/` folder only

## 📋 Architecture Overview

This is a **School ERP system** with these IMMUTABLE decisions:

- **Database**: Sequelize ORM only (Q1) - NO raw mysql2
- **Modules**: CommonJS only (Q2) - NO ES6 imports/exports
- **Multi-Tenant**: Separate databases per tenant (Q5)
- **Authentication**: bcryptjs + express-session (Q6, Q17)
- **Frontend**: EJS + Tailwind CSS + Alpine.js (Q26-Q28)
- **Validation**: Joi + Sequelize + custom rules (Q8)

## 🚨 Code Generation Rules

### ALWAYS USE:

- `const module = require('path')` - CommonJS modules (Q2)
- `sequelize.define()` - Direct model definitions (Q12)
- `bcrypt.hash(password, 12)` - 12 salt rounds (Q17)
- `{ max: 15, min: 2, acquire: 60000, idle: 300000 }` - Connection pool (Q11)
- `underscored: true` - Snake_case DB, camelCase JS (Q16)

### NEVER USE:

- `import`/`export` statements - Violates Q2
- Raw SQL or mysql2 direct - Violates Q1
- Different salt rounds - Violates Q17
- Class-based Sequelize models - Violates Q12
- Bootstrap or other CSS frameworks - Violates Q3

## 📁 Key Reference Files (NEW LOCATIONS)

1. **`docs/architecture/SINGLE_SOURCE_OF_TRUTH.md`** - ALL 56 Q&A decisions
   (IMMUTABLE)
2. **`docs/developer/COPILOT_INSTRUCTIONS.md`** - Detailed development standards
3. **`docs/architecture/TECHNICAL_SPECIFICATION_COMPLETE.md`** - Implementation
   patterns
4. **`docs/developer/API_SITEMAP.md`** - API documentation

## 🏗️ Business Logic Patterns

### Fee Calculation (Enhanced)

- Use `ConfigurableFeeCalculator` class with tenant-specific rules
- Support late fees, scholarships, waivers, custom formulas
- Frontend-configurable rules engine

### Communication System

- Use `CommunicationEngine` with multiple providers
- Support Email (SendGrid/Nodemailer), SMS (Twilio), WhatsApp

### Academic Calendar

- Use `ConfigurableAcademicCalendar` with flexible structures
- Support Semester/Trimester/Quarter/Custom periods

## 🔧 Implementation Commands

- `npm run validate:decisions` - Validate code against Q&A decisions
- `npm run validate:all` - Full validation including technical decisions

## ⚠️ VIOLATION = BUILD FAILURE

Any code that violates the Q&A technical decisions will cause build/deployment
failure. The configuration system enforces these decisions automatically.

---

**STATUS**: All 56 technical decisions FINAL and ENFORCED  
**VERSION**: IMMUTABLE - DO NOT MODIFY  
**LAST UPDATED**: 2025-08-18

## 🏗️ Business Logic Patterns

### Fee Calculation (Enhanced)

- Use `ConfigurableFeeCalculator` class with tenant-specific rules
- Support late fees, scholarships, waivers, custom formulas
- Frontend-configurable rules engine

### Communication System

- Use `CommunicationEngine` with multiple providers
- Support Email (SendGrid/Nodemailer), SMS (Twilio), WhatsApp

### Academic Calendar

- Use `ConfigurableAcademicCalendar` with flexible structures
- Support Semester/Trimester/Quarter/Custom periods

## 🔧 Implementation Commands

- `npm run validate:decisions` - Validate code against Q&A decisions
- `npm run validate:all` - Full validation including technical decisions

## ⚠️ VIOLATION = BUILD FAILURE

Any code that violates the Q&A technical decisions will cause build/deployment
failure. The configuration system enforces these decisions automatically.

---

**STATUS**: All 56 technical decisions FINAL and ENFORCED  
**VERSION**: IMMUTABLE - DO NOT MODIFY  
**LAST UPDATED**: 2025-08-18
