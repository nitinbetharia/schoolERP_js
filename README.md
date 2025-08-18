# School ERP - Bulletproof Simple

## Mission Statement

Build a school ERP that runs for YEARS without intervention, handles all edge
cases gracefully, and prevents data corruption at all costs.

**Core Philosophy:** "Better to fail safely than to succeed dangerously."

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **MySQL** 8.0+ with **MySQL Shell (mysqlsh)** installed
- **Git** for version control

## Quick Start

### Option 1: Automated Setup

```bash
# 1. Clone and navigate
git clone <repository-url>
cd school-erp-bulletproof

# 2. Configure database credentials
cp .env.example .env
# ⚠️  IMPORTANT: Edit .env with your REAL MySQL credentials:
#   DB_HOST=localhost (or your MySQL server)
#   DB_USER=your_mysql_username
#   DB_PASSWORD=your_mysql_password
#   DB_NAME=school_erp (database name to create)

# 3. Run first-time setup
node scripts/first-time-setup.js

# 4. Start development server
npm run dev

# 5. Open browser
http://localhost:3000
```

### Option 2: Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your database credentials

# 3. Set up database
npm run setup

# 4. Start development server
npm run dev

# 5. Open browser
http://localhost:3000
```

## Default Credentials

### System Administrator

- **URL**: http://admin.localhost:3000 or http://localhost:3000?system=true
- **Email**: admin@system.local
- **Password**: admin123

### Demo Trust Users

- **URL**: http://demo.localhost:3000 or http://localhost:3000?trust=demo
- **School Admin**: admin@demo.school / password123
- **Teacher**: teacher@demo.school / password123
- **Accountant**: accountant@demo.school / password123
- **Parent**: parent@demo.school / password123

## Architecture Principles

### 1. Single Source of Truth

- ALL technical decisions documented in
  [`docs/architecture/SINGLE_SOURCE_OF_TRUTH.md`](docs/architecture/SINGLE_SOURCE_OF_TRUTH.md)
- 56 Q&A decisions covering every technical aspect (IMMUTABLE)
- Enforced via configuration validation
- GitHub Copilot integration for consistent code generation

### 2. Simplicity First

- CommonJS (no TypeScript compilation)
- Clear folder structure
- Minimal dependencies
- Easy debugging with console.log

### 2. Bulletproof Validation

- Multi-layer validation (Input → Business → Database)
- Comprehensive error handling
- Automatic data sanitization
- Business rule enforcement

### 3. Zero-Maintenance Design

- Self-healing mechanisms
- Comprehensive logging
- Health monitoring
- Automatic error recovery

## Project Structure (Hybrid Architecture)

**Our hybrid approach follows DRY principles while maintaining clear
separation:**

```
school-erp-bulletproof/
├── server.js              # Main entry point
├── config/                # Configuration & RBAC (shared)
├── middleware/            # Cross-cutting concerns (auth, tenant, validation)
├── models/                # SHARED core entities (User, Student, School, Trust)
├── routes/                # Main route registration & API routing
├── views/                 # SHARED layouts & common templates
├── utils/                 # Shared utilities & helpers
├── scripts/               # Setup/maintenance scripts
├── modules/               # BUSINESS MODULES (domain-specific)
│   ├── auth/              # Authentication & session management
│   │   ├── services/      # Auth business logic
│   │   ├── controllers/   # HTTP handlers
│   │   ├── models/        # Auth-specific models (Session, Permission)
│   │   ├── routes/        # Auth route definitions
│   │   └── views/         # Login, register forms
│   ├── student/           # Student management
│   │   ├── services/      # Student business logic
│   │   ├── controllers/   # Student HTTP handlers
│   │   ├── models/        # Student-specific models
│   │   └── views/         # Student management UI
│   ├── fees/              # Fee management & calculation
│   │   ├── services/      # Fee business logic
│   │   ├── controllers/   # Fee HTTP handlers
│   │   ├── models/        # Fee-specific models (FeeRule, FeeStructure)
│   │   ├── business/      # ConfigurableFeeCalculator engine
│   │   └── views/         # Fee management UI
│   └── data/              # Database infrastructure (foundation)
├── docs/                  # Documentation
│   ├── architecture/      # Technical decisions & specifications
│   ├── developer/         # Development guides & standards
│   └── setup/             # Setup & configuration guides
└── .vscode/               # VS Code team settings

### DRY Architecture Principles

- **SHARED**: Models, middleware, layouts used across modules
- **MODULE-SPECIFIC**: Business logic, controllers, domain models
- **NO DUPLICATION**: Common utilities in `/utils`, module utilities in `/modules/{name}/utils`
- **CLEAR INTERFACES**: Modules communicate through service layers
```

## Tech Stack

**✅ All technical decisions finalized in
[`docs/architecture/SINGLE_SOURCE_OF_TRUTH.md`](docs/architecture/SINGLE_SOURCE_OF_TRUTH.md)**

### Core Stack (Based on Q&A Decisions Q1-Q56)

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MySQL 8+ with **Sequelize ORM** (`sequelize.define()` pattern)
- **Modules:** CommonJS (`require`/`module.exports`) - NO ES6 imports
- **Templates:** EJS with include-based partials
- **Frontend:** Tailwind CSS + **Alpine.js** for reactive components
- **Validation:** **Joi** + Sequelize validations + custom business rules
- **Logging:** **Winston** with daily rotation + structured logging
- **Security:** **Helmet** + CORS + rate limiting + bcryptjs (12 salt rounds)
- **Sessions:** express-mysql-session with MySQL store
- **Multi-Tenant:** Separate databases per tenant (`school_erp_trust_{code}`)

## Key Features

- ✅ Bulletproof input validation
- ✅ Comprehensive error handling
- ✅ Automatic data sanitization
- ✅ Business rule enforcement
- ✅ Audit trail for all operations
- ✅ Self-healing mechanisms
- ✅ Health monitoring
- ✅ Performance tracking

## Development Guidelines

1. **Validation First** - Validate everything, everywhere
2. **Fail Safe** - If something can go wrong, handle it gracefully
3. **Log Everything** - Comprehensive logging for debugging
4. **Keep It Simple** - Prefer clarity over cleverness
5. **Document As You Go** - Code should be self-documenting

## Production Readiness

- Database constraints and foreign keys
- Comprehensive audit logging
- Automated backup strategies
- Health check endpoints
- Performance monitoring
- Security hardening
