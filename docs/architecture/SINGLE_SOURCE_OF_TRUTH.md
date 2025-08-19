# SINGLE SOURCE OF TRUTH - Q&A Technical Decisions (FINAL)

**Status**: ALL 56 technical decisions finalized and IMMUTABLE  
**Version**: FINAL  
**Last Updated**: 2025-08-18  
**Validation**: Enforced via configuration validation

⚠️ **CRITICAL**: These decisions are FINAL and ENFORCED. Any deviation will
cause build failure.

---

## 🔒 IMMUTABLE TECHNICAL DECISIONS (Q1-Q56)

### **Core Technology Stack (Q1-Q10) - FINAL**

#### Q1: Database Access

**Decision**: Sequelize ORM (not raw mysql2)  
**Implementation**: `sequelize.define()` pattern  
**FORBIDDEN**: Raw SQL, mysql2 direct, other ORMs

#### Q2: Module System

**Decision**: CommonJS only (`require`/`module.exports`)  
**Implementation**: `const module = require('path')`  
**FORBIDDEN**: `import`/`export`, ES6 modules, TypeScript

#### Q3: CSS Framework

**Decision**: Tailwind CSS only  
**Implementation**: CDN via HTML  
**FORBIDDEN**: Bootstrap, custom CSS frameworks, CSS-in-JS

#### Q4: Database Migrations

**Decision**: Sequelize CLI with migration files  
**Implementation**: `npx sequelize-cli migration:generate`  
**FORBIDDEN**: Manual SQL scripts, other migration tools

#### Q5: Multi-Tenant Strategy

**Decision**: Separate databases per tenant  
**Implementation**: `school_erp_trust_{trustCode}`  
**FORBIDDEN**: Shared database, schema separation, table prefixes

#### Q6: Session Management

**Decision**: Express sessions with MySQL store  
**Implementation**: `express-mysql-session`  
**FORBIDDEN**: JWT tokens, Redis sessions, memory sessions

#### Q7: API Architecture

**Decision**: MVC with EJS views + JSON API endpoints  
**Implementation**: EJS templates + `/api/v1/` routes  
**FORBIDDEN**: SPA only, GraphQL, gRPC

#### Q8: Validation Strategy

**Decision**: Joi + Sequelize validations + custom business rules  
**Implementation**: Joi schemas within models  
**FORBIDDEN**: express-validator only, custom validation only

#### Q9: Logging Framework

**Decision**: Winston + centralized error handler + structured logging  
**Implementation**: `winston.createLogger()`  
**FORBIDDEN**: console.log, other logging libraries

#### Q10: Deployment Environment

**Decision**: Cloud MySQL + local Node.js  
**Implementation**: Remote database, local application  
**FORBIDDEN**: Local MySQL, Docker containers

---

### **Database Architecture (Q11-Q18) - FINAL**

#### Q11: Connection Pooling

**Decision**: Moderate connection pooling  
**Implementation**: `{ max: 15, min: 2, acquire: 60000, idle: 300000 }`  
**FORBIDDEN**: High pooling, no pooling, aggressive pooling

#### Q12: Model Pattern

**Decision**: Direct `sequelize.define()` calls (not class-based)  
**Implementation**: `sequelize.define("ModelName", {...})`  
**FORBIDDEN**: `class extends Model`, decorators

#### Q13: Associations

**Decision**: Inline associations with model definition  
**Implementation**: `Model.associate = (models) => {...}`  
**FORBIDDEN**: Separate association files, decorators

#### Q14: Primary Keys

**Decision**: Mixed PKs: UUIDs for sensitive data, integers for lookup tables  
**Implementation**: UUID v4 for users/students, AUTO_INCREMENT for
roles/classes  
**FORBIDDEN**: All UUIDs, all integers

#### Q15: Timestamp Fields

**Decision**: Custom timestamp fields (`created_at`, `updated_at`,
`deleted_at`)  
**Implementation**: `timestamps: true, paranoid: true`  
**FORBIDDEN**: createdAt/updatedAt, no timestamps

#### Q16: Naming Convention

**Decision**: Snake_case database, camelCase JavaScript (`underscored: true`)  
**Implementation**: `underscored: true` in Sequelize  
**FORBIDDEN**: camelCase database, snake_case JavaScript

#### Q17: Password Security

**Decision**: bcryptjs with salt rounds 12  
**Implementation**: `bcrypt.hash(password, 12)`  
**FORBIDDEN**: Other hashing, plain text, different salt rounds

#### Q18: Session Configuration

**Decision**: Environment-based session configuration  
**Implementation**: Different settings per environment  
**FORBIDDEN**: Hardcoded session config

---

### **Validation & Security (Q19-Q21, Q33, Q49-Q51) - FINAL**

#### Q19: Validation Schemas

**Decision**: Validation schemas within model files  
**Implementation**: Joi schemas in same file as Sequelize model  
**FORBIDDEN**: Separate validation files, no validation

#### Q20: Input Sanitization

**Decision**: Joi transforms with custom sanitizers  
**Implementation**: `Joi.string().trim().replace()`  
**FORBIDDEN**: No sanitization, express-validator only

#### Q21: Error Responses

**Decision**: Structured error responses with error codes and timestamps  
**Implementation**: `{ success: false, error: {...}, code: "...", timestamp: "..." }`  
**FORBIDDEN**:
Simple error strings, no error codes

#### Q33: Foreign Key Handling

**Decision**: RESTRICT foreign keys with user-friendly error messages  
**Implementation**: `onDelete: "RESTRICT"` with custom error handling  
**FORBIDDEN**: CASCADE deletes, no foreign keys

#### Q49: Data Encryption

**Decision**: Application-level encryption for sensitive data only  
**Implementation**: Encrypt PII fields before database storage  
**FORBIDDEN**: Database-level encryption, no encryption

#### Q50: Audit Trail

**Decision**: Detailed audit trail with before/after change tracking  
**Implementation**: Sequelize hooks + audit_logs table  
**FORBIDDEN**: Simple logging, no audit trail

#### Q51: Input Cleaning

**Decision**: Context-aware input sanitization  
**Implementation**: Different sanitization per field type  
**FORBIDDEN**: Generic sanitization, no sanitization

---

### **Authentication & Authorization (Q36-Q38) - FINAL**

#### Q36: Role Management

**Decision**: Separate roles table with relationships  
**Implementation**: User belongsTo Role, Role hasMany Permissions  
**FORBIDDEN**: Role strings in user table, hardcoded roles

#### Q37: Session Timeouts

**Decision**: Role-based session timeout durations  
**Implementation**: ADMIN: 8hrs, TEACHER: 12hrs, PARENT: 24hrs  
**FORBIDDEN**: Single timeout, no timeouts

#### Q38: Password Policies

**Decision**: Tenant-configurable password policies with simple default  
**Implementation**: Per-tenant password rules, fallback to simple default  
**FORBIDDEN**: Global password policy, no password policy

---

### **API & Frontend (Q22-Q28, Q41-Q43) - FINAL**

#### Q22: Route Organization

**Decision**: Module-based routing with sub-routers  
**Implementation**: Express Router per module  
**FORBIDDEN**: Single routes file, controller-based routing

#### Q23: Middleware Chain

**Decision**: Security-first middleware chain  
**Implementation**: helmet → cors → rateLimiter → auth → validation  
**FORBIDDEN**: No security middleware, different order

#### Q24: Tenant Detection

**Decision**: Middleware-based tenant detection via subdomain  
**Implementation**: `subdomain.domain.com` → trustCode  
**FORBIDDEN**: URL parameters, headers only

#### Q25: Logging Configuration

**Decision**: Winston with multiple transports + daily file rotation  
**Implementation**: `winston-daily-rotate-file`  
**FORBIDDEN**: Single transport, no rotation

#### Q26: CSS Delivery

**Decision**: Tailwind CSS via CDN  
**Implementation**: `<link href="https://cdn.tailwindcss.com">`  
**FORBIDDEN**: Local Tailwind, build process

#### Q27: Template System

**Decision**: EJS include-based partials with component data passing  
**Implementation**: `<%- include("partials/header", { data }) %>`  
**FORBIDDEN**: Other template engines, no partials

#### Q28: Client JavaScript

**Decision**: Alpine.js for reactive components  
**Implementation**: `x-data`, `x-show`, `x-on` attributes  
**FORBIDDEN**: React, Vue, vanilla JS only

#### Q41: API Versioning

**Decision**: URL path versioning (`/api/v1/`)  
**Implementation**: `/api/v1/users`, `/api/v1/students`  
**FORBIDDEN**: Header versioning, query parameter versioning

#### Q42: Pagination Strategy

**Decision**: Hybrid pagination (offset for small, cursor for large datasets)  
**Implementation**: LIMIT/OFFSET < 10k records, cursor > 10k records  
**FORBIDDEN**: Offset only, cursor only

#### Q43: Rate Limiting

**Decision**: Endpoint-specific rate limits  
**Implementation**: Different limits per endpoint type  
**FORBIDDEN**: Global rate limiting, no rate limiting

---

### **File Handling & Storage (Q29-Q32, Q44-Q46) - FINAL**

#### Q29: Configuration Files

**Decision**: JSON config files + .env for secrets only  
**Implementation**: `config/development.json` + `.env`  
**FORBIDDEN**: All in .env, YAML files, JS config files

#### Q30: Development Migrations

**Decision**: Automatic migrations in development only  
**Implementation**: Auto-run in dev, manual in production  
**FORBIDDEN**: Auto migrations in production, manual in dev

#### Q31: File Uploads

**Decision**: Multer (local default) + cloud storage option per tenant  
**Implementation**: Multer local + optional S3/Azure per tenant  
**FORBIDDEN**: Cloud storage only, local storage only

#### Q32: Caching Strategy

**Decision**: node-cache for in-memory caching  
**Implementation**: NodeCache with TTL  
**FORBIDDEN**: Redis cache, no caching

#### Q44: File Organization

**Decision**: Database-driven file organization  
**Implementation**: File metadata in database  
**FORBIDDEN**: Filesystem-only, no organization

#### Q45: File Access

**Decision**: Direct file serving with middleware protection  
**Implementation**: Express static + auth middleware  
**FORBIDDEN**: No protection, complex file serving

#### Q46: File Restrictions

**Decision**: Tenant-configurable file policies with whitelist default + size
limits  
**Implementation**: Per-tenant file rules with safe defaults  
**FORBIDDEN**: Global file policy, no restrictions

---

### **Performance & Optimization (Q34-Q35, Q39-Q40, Q47-Q48) - FINAL**

#### Q34: Migration Strategy

**Decision**: Auto-generation in dev, careful manual control in production  
**Implementation**: sequelize-cli in dev, manual review in prod  
**FORBIDDEN**: Auto in production, manual only

#### Q35: Multi-Tenant Database

**Decision**: Multiple Sequelize instances (one per tenant database)  
**Implementation**: ConnectionManager with tenant-specific instances  
**FORBIDDEN**: Single Sequelize instance, connection switching

#### Q39: Validation Composition

**Decision**: Composition with shared validation components  
**Implementation**: Reusable Joi schemas  
**FORBIDDEN**: Duplicate validation, no composition

#### Q40: Localization

**Decision**: Tenant-configurable language, English default  
**Implementation**: i18n per tenant with English fallback  
**FORBIDDEN**: Global language, no localization

#### Q47: Query Optimization

**Decision**: Smart loading based on data size  
**Implementation**: Eager loading for small sets, lazy for large  
**FORBIDDEN**: Always eager, always lazy

#### Q48: Cache Invalidation

**Decision**: Cache invalidation with tags  
**Implementation**: Tag-based cache clearing  
**FORBIDDEN**: Time-based only, manual invalidation only

---

### **Monitoring & Operations (Q52-Q56) - FINAL**

#### Q52: Health Checks

**Decision**: Comprehensive health checks with database/memory/uptime  
**Implementation**: `/health` endpoint with detailed checks  
**FORBIDDEN**: Simple ping, no health checks

#### Q53: Metrics Collection

**Decision**: Detailed metrics collection with categorization  
**Implementation**: Performance, business, system metrics  
**FORBIDDEN**: No metrics, basic metrics only

#### Q54: Alerting System

**Decision**: Log-based monitoring + email alerts for critical errors  
**Implementation**: Winston + email transport for errors  
**FORBIDDEN**: No alerting, SMS only

#### Q55: Environment Strategy

**Decision**: Single deployment with environment detection  
**Implementation**: NODE_ENV-based configuration  
**FORBIDDEN**: Separate deployments, manual environment

#### Q56: Process Management

**Decision**: PM2 for process management  
**Implementation**: `ecosystem.config.js`  
**FORBIDDEN**: forever, systemd, docker

---

## 🏢 BUSINESS LOGIC PATTERNS (FINAL)

### **Fee Calculation Engine**

**Pattern**: Tenant-configurable fee calculation with frontend rules  
**Features**: Late fees, scholarships, waivers, custom formulas, frontend
configuration  
**Implementation**: ConfigurableFeeCalculator class with rule engine

### **Communication System**

**Pattern**: Multi-channel communication with provider integration  
**Channels**: Email (SendGrid/Nodemailer), SMS (Twilio), WhatsApp (Business
API)  
**Implementation**: CommunicationEngine with provider registration

#### Q57: Asynchronous JavaScript Pattern

**Decision**: async/await + try-catch for all asynchronous operations  
**Implementation**: `async function name() { try { await operation(); } catch (error) { } }`  
**FORBIDDEN**:
Callbacks, raw Promises, unhandled async operations

#### Q58: Error Handling Pattern

**Decision**: Comprehensive try-catch with structured error responses  
**Implementation**: Try-catch in all async functions + centralized error
handler  
**FORBIDDEN**: Unhandled promise rejections, silent failures

#### Q59: Model Configuration Values

**Decision**: All model validation rules and constraints in configuration
files  
**Implementation**: Use config.get('models.{modelName}') for field lengths,
enums, validation rules  
**FORBIDDEN**: Hardcoded field lengths, hardcoded enum values, hardcoded
validation rules

---

### **Academic Calendar**

**Pattern**: Tenant-configurable academic calendar with flexible structures  
**Structures**: Semester, Trimester, Quarter, Custom periods  
**Implementation**: ConfigurableAcademicCalendar class

### **Wizard Setup**

**Pattern**: Configurable wizard system with frontend management  
**Features**: Add/update/remove wizards, dynamic steps, per-tenant
configuration  
**Implementation**: WizardEngine with configurable steps

#### Q59: Business Constants Configuration

**Decision**: Centralized business constants in configuration (no hardcoded
values)  
**Implementation**: `config/business-constants.js` + config validation  
**FORBIDDEN**: Hardcoded roles, status values, enums in models/code

---

## 🚨 ENFORCEMENT RULES

1. **IMMUTABLE**: These decisions cannot be changed without full architecture
   review
2. **VALIDATION**: All code must pass validation against these decisions
3. **BUILD FAILURE**: Any violation will cause build/deployment failure
4. **SINGLE SOURCE**: This file is the ONLY source for technical decisions
5. **COPILOT INTEGRATION**: GitHub Copilot must reference this file for all code
   generation

---

**VERSION**: FINAL  
**TOTAL DECISIONS**: 59  
**STATUS**: IMMUTABLE - DO NOT MODIFY
