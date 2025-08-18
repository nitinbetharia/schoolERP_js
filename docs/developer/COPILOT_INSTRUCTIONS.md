# Copilot Instructions – School ERP (Implementation Ready) — 2025-08

> **⚠️ CRITICAL: This file MUST be read and followed for every code generation
> task in this project.**
>
> **🤖 GitHub Copilot: Always reference this file before generating any code.**

## 🎯 PROJECT STATUS: ARCHITECTURE 100% COMPLETE - SINGLE SOURCE OF TRUTH ENFORCED

**✅ All 56 Technical Decisions Finalized in
`docs/architecture/SINGLE_SOURCE_OF_TRUTH.md`**  
**✅ Business Logic Patterns Defined**  
**✅ Complete Implementation Guide Available**  
**✅ Development Environment Configured**  
**✅ Configuration Validation Enforced**

**NEXT PHASE**: Begin implementation using enforced technical decisions

## 🔒 SINGLE SOURCE OF TRUTH - IMMUTABLE DECISIONS

**ALL technical decisions are FINAL and ENFORCED in
`docs/architecture/SINGLE_SOURCE_OF_TRUTH.md`**

Before generating ANY code, you MUST:

1. Check `docs/architecture/SINGLE_SOURCE_OF_TRUTH.md` for the specific decision
2. Use the exact implementation pattern specified
3. Never use any pattern marked as "forbidden"

## Project Context

This is a **School ERP system** built with **Node.js + Express + MySQL** using
**CommonJS modules** (NO ES6 imports/exports). The system follows a
**bulletproof, production-ready architecture** with comprehensive business logic
patterns for:

- **Multi-tenant database architecture** (separate DBs per tenant)
- **Configurable fee calculation engine** (tenant-specific rules)
- **Multi-channel communication system** (Email/SMS/WhatsApp)
- **Academic calendar management** (semester/quarter/custom structures)

## Mandatory Reading Order (SINGLE SOURCE OF TRUTH)

**🔒 PRIMARY REFERENCE**: `SINGLE_SOURCE_OF_TRUTH.md` - ALL 56 Q&A decisions
(IMMUTABLE)

1. **SINGLE_SOURCE_OF_TRUTH.md** - ALL technical decisions (FINAL)
2. **COPILOT_INSTRUCTIONS.md** (this file) - Development standards
3. **TECHNICAL_SPECIFICATION_COMPLETE.md** - Implementation patterns
4. **REQUIREMENTS_FINAL.md** - Business requirements documentation
5. **IMPLEMENTATION_READY.md** - Phase-by-phase roadmap

**⚠️ CRITICAL**: Before writing ANY code, check `SINGLE_SOURCE_OF_TRUTH.md` for
the specific decision.

---

## Core Philosophy

**Single source of truth with zero deviation allowed.**

- ALL technical decisions are FINAL and ENFORCED
- Any violation of Q&A decisions will cause build failure
- Configuration validation prevents architectural drift
- Simple, readable code with comprehensive patterns

## Core Philosophy

**"Production-ready architecture with zero ambiguity."**

- Build for YEARS of maintenance-free operation with 99.9% uptime
- Prioritize data integrity and tenant isolation
- Simple, readable code with comprehensive patterns
- Configurable business logic for diverse educational institutions

## Technology Standards (Finalized)

### Module System: CommonJS Only

- **USE**: `const module = require('path')`
- **USE**: `module.exports = { ... }`
- **NEVER**: `import` / `export` statements
- **NEVER**: ES6 modules or TypeScript compilation

### Database Access: Sequelize ORM (Multi-Tenant)

- **USE**: `sequelize.define()` for direct model definitions
- **USE**: Inline associations within model files
- **USE**: Mixed PKs: UUIDs for sensitive data (users, students), integers for
  lookup tables
- **USE**: Custom timestamp fields: `created_at`, `updated_at`, `deleted_at`
- **USE**: Snake_case database fields, camelCase JavaScript
  (`underscored: true`)
- **USE**: bcryptjs with salt rounds 12 for passwords
- **USE**: Moderate connection pooling:
  `{ max: 15, min: 2, acquire: 60000, idle: 300000 }`
- **USE**: Separate Sequelize instances per tenant (multi-tenant isolation)
- **NEVER**: Raw SQL queries (use Sequelize query methods)
- **NEVER**: Other ORMs (TypeORM, Prisma, etc.)

### Code Style: Modern JavaScript with CommonJS

- **USE**: `const`/`let` (no `var`)
- **USE**: Arrow functions, async/await
- **USE**: Template literals, destructuring
- **USE**: Classes for services
- **KEEP**: CommonJS module syntax

## Invariants (Never Break These)

- **Secrets live ONLY in `.env`**. Never in code or config files committed with
  real values.
- **All runtime config from `config/*.json`** or environment variables. **No
  hardcoding** of ports, limits, table names, or email settings in code.
- **Read connection strings and models first**. Before writing scripts or
  migrations, load config, resolve DB URL, inspect existing models for table and
  field names, and then proceed.
- **CommonJS ONLY** - Use `require()` and `module.exports`. NO `import`/`export`
  statements.
- **Sequelize ORM** - Use Sequelize models and migrations. NO raw SQL queries.
- **Multi-tenant isolation** - Separate databases per tenant with proper
  connection management.

## Tech Baseline

- Node.js ≥ 22, Express 5.1, MySQL 8.4 LTS preferred (8.0.43+ ok), EJS 3.1.10,
  Joi 18, Sequelize 6.37+, sequelize-cli 6.6+, helmet 8.1, express-session
  1.18.2, express-rate-limit 8.x, winston 3.17, Tailwind CSS 3.x (CDN),
  Alpine.js 3.x.

## Finalized Architecture Decisions

### Multi-Tenant Database Strategy

- **Master Database**: `school_erp_master` (system users, trusts, global config)
- **Tenant Databases**: `school_erp_trust_{trust_code}` (per-tenant isolation)
- **Connection Management**: Middleware-based tenant detection via subdomain
- **Migration Strategy**: Auto-sync in development, manual migrations in
  production

### Authentication & Security

- **Password Hashing**: bcryptjs with salt rounds 12
- **Session Management**: express-session with MySQL store, environment-based
  config
- **Middleware Chain**: helmet() → cors() → rateLimiter → authMiddleware →
  validationMiddleware
- **Input Validation**: Joi + Sequelize validations + custom business rules
  sanitization

### Frontend & UI Architecture

- **Templating**: EJS with include-based partials + component data passing
- **Styling**: Tailwind CSS via CDN
- **Client-side**: Alpine.js for reactive components
- **File Uploads**: Multer (local default) + cloud storage option per tenant

### Error Handling & Logging

- **Logging**: Winston with multiple transports + daily file rotation
- **Error Format**: Structured responses with error codes, timestamps, details
- **Caching**: node-cache for in-memory caching (10-minute TTL)

### Configuration Management

- **Config Files**: JSON files per environment (development.json,
  production.json)
- **Secrets**: .env file only (DB_PASSWORD, SESSION_SECRET, API_KEYS)
- **Environment Detection**: NODE_ENV-based configuration loading

### Sequelize Model Pattern

```javascript
// Direct define() pattern (not class-based)
const { DataTypes } = require('sequelize');

const Student = sequelize.define(
  'Student',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    admission_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    student_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true }
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      defaultValue: 'ACTIVE'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Student',
    tableName: 'students',
    timestamps: false, // Using custom timestamp fields
    underscored: true, // snake_case in DB, camelCase in JS
    paranoid: false // Using custom deleted_at
  }
);

// Inline associations
Student.belongsTo(Class, { foreignKey: 'class_id' });
Student.hasMany(FeePayment, { foreignKey: 'student_id' });

// Validation schema within model file
const Joi = require('joi');
Student.validationSchema = {
  create: Joi.object({
    studentName: Joi.string().trim().max(100).required(),
    admissionNumber: Joi.string().trim().max(20).required(),
    classId: Joi.number().integer().positive().required()
  }),
  update: Joi.object({
    studentName: Joi.string().trim().max(100),
    status: Joi.string().valid('ACTIVE', 'INACTIVE')
  })
};

module.exports = Student;
```

### Table/Column References

```javascript
// ❌ BAD: Hardcoded table names
const sql = `SELECT * FROM students WHERE id = ?`;

// ✅ GOOD: Use config or constants
const cfg = require('../config');
const sql = `SELECT * FROM ${cfg.tables.students} WHERE id = ?`;

// Or use a constants file
const TABLES = require('../config/table-names');
const sql = `SELECT * FROM ${TABLES.STUDENTS} WHERE id = ?`;
```

## Generation Rules for Copilot

1. **Config-first code**: `const cfg = require('../config');` or load from
   config files. Read `process.env` only for secrets.
2. **No hardcoded identifiers**: Get table names and columns from the models
   layer or constants module. Never inline `'students'`, `'fee_structures'`,
   etc.
3. **RBAC + Validation chain**:
   `requireAuth → extractContext → requirePermission → rateLimit → validateInput(Joi) → handler`.
4. **DB access**: Sequelize ORM only (NO raw mysql2). Transactions for
   multi-table writes. Handle deadlocks with retry (max 2).
5. **Audit**: Log who/what/when/IP/UA and old vs new for all mutations.
6. **Logging**: Winston structured logs. No `console.log` in production paths.
7. **Testing**: Add unit + integration tests for every new service and route.
8. **Formatting & Linting**: Respect project ESLint and Prettier. Run
   `npm run lint:fix && npm run format` before PR.
9. **EJS + CSRF**: All forms include CSRF tokens. Validate on client and server.
10. **Secrets discipline**: If code attempts to introduce a secret in code or
    config, reject with a TODO to move it to `.env`.

## Service Layer Pattern

```javascript
const db = require('../data/database-service');
const validator = require('./validation-schemas');
const logger = require('../../config/logger');

class StudentService {
  async createStudent(studentData, context) {
    try {
      // 1. Validate input
      const validData = await validator.validateCreateStudent(studentData);

      // 2. Check permissions
      this.rbac.enforcePermission(context.user, 'students', 'create');

      // 3. Business logic
      const admissionNumber = await this.generateAdmissionNumber(
        validData.schoolId
      );

      // 4. Database transaction
      const result = await db.transactionTrust(
        context.trustCode,
        async connection => {
          const sql = `INSERT INTO students SET ?`;
          const [result] = await connection.execute(sql, [validData]);
          return result.insertId;
        }
      );

      // 5. Audit log
      logger.audit('student.created', {
        actor: context.user.id,
        target: result.insertId,
        data: validData,
        ip: context.ip
      });

      return { success: true, data: { id: result.insertId } };
    } catch (error) {
      throw new AppError(
        `Failed to create student: ${error.message}`,
        'STUDENT_CREATE_FAILED'
      );
    }
  }
}
```

## File Layout Hints

- Keep module order: DATA → AUTH → SETUP → USER → STUD → FEES → ATTD → REPT →
  DASH → COMM.
- Place configs in `/config`. Add environment overlays like `production.json`
  without secrets.
- Scripts read config and `.env` before DB actions.

## Response and Error Contract

- JSON: `{ success, data?, error?, code?, meta? }` for `/api/*` routes.
- Rendered pages use centralized EJS error view.

## Performance & Security

- Index-friendly queries, pagination by default.
- Rate limit on auth and public GETs.
- Helmet on all routes; sessions `httpOnly`, `secure` in prod.

## Key Reminders for Copilot

1. **ALWAYS use CommonJS** (`require()` / `module.exports`)
2. **ALWAYS use Sequelize ORM** with `sequelize.define()` pattern
3. **ALWAYS read TECHNICAL_SPECIFICATION_COMPLETE.md** for detailed patterns
4. **ALWAYS validate inputs** with Joi schemas within model files
5. **ALWAYS use transactions** for multi-table operations
6. **ALWAYS log actions** for audit trails with before/after values
7. **ALWAYS handle errors** gracefully with structured responses
8. **ALWAYS encrypt sensitive data** at application level
9. **ALWAYS use role-based permissions** and session timeouts
10. **ALWAYS implement caching** with tag-based invalidation

## Complete Architecture Reference

**📋 All 56 technical decisions finalized in
TECHNICAL_SPECIFICATION_COMPLETE.md**

- Database: Sequelize ORM with multi-tenant architecture
- Security: bcryptjs, RESTRICT foreign keys, encrypted sensitive fields
- Frontend: EJS + Tailwind CSS + Alpine.js
- Validation: Joi schemas within models + context-aware sanitization
- Caching: node-cache with tag-based invalidation
- Monitoring: Winston logging + comprehensive health checks
- Performance: Smart pagination + detailed metrics collection

**Status**: ✅ PRODUCTION READY ARCHITECTURE
