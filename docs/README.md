# Documentation Structure

This documentation is organized into three main categories:

## 📁 Architecture

- **`SINGLE_SOURCE_OF_TRUTH.md`** - MASTER REFERENCE: All 56 Q&A technical
  decisions (IMMUTABLE)

## 📁 Developer

- **`API_SITEMAP.md`** - Complete API documentation and endpoints
- **`DEVELOPMENT_STANDARDS.md`** - Coding standards, conventions, and best
  practices

## 📁 Setup

- **`DATABASE_SETUP_GUIDE.md`** - Database installation and setup instructions
- **`CONFIGURATION_GUIDE.md`** - Application configuration and environment setup

## 📋 Project Requirements

- **`REQUIREMENTS_AND_SEQUENCE.md`** - Complete module requirements and
  development sequence (pulled from GitHub)

## 🏗️ Hybrid Architecture Structure

**Following DRY principles with clear separation:**

### SHARED RESPONSIBILITY (Root Level)

- `models/` - Core entities (User, Student, School, Trust, Permission)
- `middleware/` - Cross-cutting concerns (auth, tenant, validation, logging)
- `routes/` - Main router registration and API routing
- `views/layouts/` - Common layouts and shell
- `config/` - Configuration and RBAC
- `utils/` - Shared utilities

### MODULE RESPONSIBILITY

- `modules/{name}/services/` - Business logic specific to that domain
- `modules/{name}/controllers/` - HTTP handlers for that module
- `modules/{name}/models/` - Domain-specific models (FeeRule, AttendanceRecord)
- `modules/{name}/views/` - Module-specific UI components
- `modules/{name}/business/` - Complex business logic classes

### DRY RULES

1. **Models can reference other models** (Student → User)
2. **Modules can call other module services** (Fees → Student service)
3. **No direct module-to-module model access** (use services)
4. **Shared utilities in utils/**, module utilities in `modules/{name}/utils/`

## 🔑 Key Reference Priority

1. **Primary**: `architecture/SINGLE_SOURCE_OF_TRUTH.md` - For all technical
   decisions
2. **Requirements**: `REQUIREMENTS_AND_SEQUENCE.md` - For module specs and
   development sequence
3. **RBAC**: `../config/rbac.json` - For role permissions and access control (7
   roles, hierarchical)
4. **Development**: `developer/DEVELOPMENT_STANDARDS.md` - For coding practices
5. **Setup**: Use setup guides for initial environment configuration

## 🚨 Important Notes

- **Single Source of Truth**: All technical decisions are centralized in
  `architecture/SINGLE_SOURCE_OF_TRUTH.md`
- **GitHub Copilot**: AI instructions are in `.github/copilot-instructions.md`
  (root level)
- **No Duplicates**: Redundant files have been removed to avoid confusion
- **Team Consistency**: All team members should reference these exact files

---

**Last Updated**: August 18, 2025  
**Status**: Finalized and cleaned up
