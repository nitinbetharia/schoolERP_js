# Multi-Tenant Configuration Guide

## Quick Start

1. **Setup development environment**:
   ```bash
   npm run setup:dev
   ```

2. **Test configuration** (no database required):
   ```bash
   npm run test:config
   ```

3. **Update database credentials** in `.env` file:
   ```bash
   DB_USER=your_username
   DB_PASSWORD=your_password
   ```

4. **Test with database**:
   ```bash
   npm run test:multi-tenant
   ```

## Configuration Overview

All configurations are centralized in `config/app-config.js` and can be overridden via environment variables in your `.env` file.

### Database Configuration

#### System Database (Developer/Super-Admin Operations)
- **Name**: `school_erp_system` (configurable via `SYSTEM_DB_NAME`)
- **Purpose**: Trust registry, system users, platform configurations
- **Access**: System-level operations only

#### Trust Databases (Tenant-Specific Operations)
- **Naming**: `school_erp_trust_{trustCode}` (prefix configurable via `TRUST_DB_PREFIX`)
- **Purpose**: Schools, students, users, fees, reports for each trust
- **Access**: Trust-specific operations only

### Multi-Tenant Features

#### Tenant Resolution Strategies
1. **Subdomain-based**: `trust1.yourapp.com` → `trust1`
2. **Header-based**: `X-Trust-Code: trust1` → `trust1`
3. **Path-based**: `/trust/trust1/api/users` → `trust1`

#### Route Protection
- **System Routes**: `/system/*`, `/api/system/*` (require system context)
- **Trust Routes**: `/api/*` (require trust context)

#### Trust Code Validation
- **Length**: 2-20 characters
- **Pattern**: Alphanumeric, underscore, hyphen only
- **Reserved**: `admin`, `api`, `system`, `www`, `app`, `mail`, `ftp`

## Environment Variables

### Required Settings
```bash
# Database Connection
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password

# Database Names
SYSTEM_DB_NAME=school_erp_system
TRUST_DB_PREFIX=school_erp_trust_
```

### Optional Settings
```bash
# Multi-tenant
DEFAULT_TRUST_CODE=demo
TENANT_STRATEGY=subdomain
MAX_TRUSTS_PER_INSTANCE=100

# Application
NODE_ENV=development
TZ=Asia/Kolkata
LOCALE=en-IN
CURRENCY=INR
```

## Usage Examples

### Accessing Configuration
```javascript
const appConfig = require('./config/app-config');

// Database names
const systemDB = appConfig.database.system.name;
const trustPrefix = appConfig.database.trust.prefix;

// Multi-tenant settings
const strategy = appConfig.multiTenant.tenantResolution.strategy;
const maxTrusts = appConfig.multiTenant.database.maxTrustsPerInstance;
```

### Database Operations
```javascript
// System database (for system-level data)
const systemUsers = await db.querySystem('SELECT * FROM system_users');

// Trust database (for tenant-specific data)
const students = await db.queryTrust('demo', 'SELECT * FROM students');
```

### Route Protection
```javascript
// System-only routes
app.use('/system', requireSystemContext, authMiddleware.requireAuth());

// Trust-specific routes
app.use('/api/users', requireTrustContext, authMiddleware.requireAuth());
```

## Available Scripts

### Setup & Testing
- `npm run setup:dev` - Initialize development environment
- `npm run test:config` - Test configuration (no DB required)
- `npm run test:multi-tenant` - Test with database connection

### Database Management
- `npm run system:migrate` - Run system database migrations
- `npm run tenant:create -- --code=demo --name="Demo Trust"` - Create new tenant
- `npm run tenant:list` - List all tenants

### Development
- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload

## Troubleshooting

### Configuration Issues
```bash
# Test configuration loading
npm run test:config

# Check environment setup
npm run setup:dev
```

### Database Issues
```bash
# Test database connection
npm run test:multi-tenant

# Check database structure
npm run db:status
```

### Common Problems

1. **Invalid configuration option 'acquireTimeout'**
   - ✅ Fixed: Removed unsupported MySQL2 options

2. **Access denied for user 'root'@'localhost'**
   - 🔧 Solution: Update `DB_PASSWORD` in `.env` file

3. **Trust code validation failed**
   - 🔧 Solution: Use alphanumeric characters, 2-20 length, avoid reserved words

4. **Cannot resolve tenant context**
   - 🔧 Solution: Ensure proper subdomain/header/path format

This configuration provides a robust, scalable multi-tenant architecture with proper separation of concerns and flexible deployment options.
