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
TODO: Implement User Authentication Module
- [x] Create user model with UUID primary key
- [x] Set up bcryptjs password hashing (12 salt rounds)
- [ ] Create authentication middleware
- [ ] Add login/logout routes
- [ ] Create login form with EJS template
- [ ] Add session management
- [ ] Test authentication flow

Current: Working on authentication middleware (3/7 completed)
```

## 🚨 CRITICAL: CODE CONSISTENCY RULES (AVOID REITERATION)

**ALWAYS check existing code before creating new code**:

1. ✅ **Check existing models** in `modules/*/models/` for:
   - Model names, field names, data types
   - Table naming conventions (snake_case)
   - Primary key strategies (UUID vs integers)
   - Association patterns and foreign keys

2. ✅ **Check existing database connections** in `modules/data/`:
   - Connection patterns and pool settings
   - Multi-tenant database naming (school*erp_trust*{code})
   - Query patterns and transaction handling

3. ✅ **Use existing codebase APIs**:
   - Database service: `modules/data/database-service.js`
   - Configuration: `config/index.js`
   - Authentication: `modules/auth/`
   - Validation: Use existing Joi schemas

4. ✅ **Maintain consistency**:
   - Route patterns: `/api/v1/{module}/{action}`
   - Error handling: Use existing error response format
   - Middleware chain: Follow established order
   - File organization: Follow existing module structure

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
