# GitHub Copilot Instructions - School ERP System

## 🔒 CRITICAL: SINGLE SOURCE OF TRUTH ENFORCEMENT

**ALL technical decisions are FINAL and documented in `SINGLE_SOURCE_OF_TRUTH.md`**

Before generating ANY code, you MUST:

1. ✅ Read `SINGLE_SOURCE_OF_TRUTH.md` for the specific Q&A decision
2. ✅ Use ONLY the implementation pattern specified in that decision
3. ❌ NEVER use any pattern marked as "FORBIDDEN"
4. ✅ Follow the exact technical specifications documented

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

## 📁 Key Reference Files

1. **`SINGLE_SOURCE_OF_TRUTH.md`** - ALL 56 Q&A decisions (IMMUTABLE)
2. **`COPILOT_INSTRUCTIONS.md`** - Detailed development standards
3. **`TECHNICAL_SPECIFICATION_COMPLETE.md`** - Implementation patterns

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

Any code that violates the Q&A technical decisions will cause build/deployment failure. The configuration system enforces these decisions automatically.

---

**STATUS**: All 56 technical decisions FINAL and ENFORCED  
**VERSION**: IMMUTABLE - DO NOT MODIFY  
**LAST UPDATED**: 2025-08-18
