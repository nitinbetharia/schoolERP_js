# Configuration Summary

## Overview
All database names, connection settings, and multi-tenant configurations have been centralized in the `config/app-config.js` file and can be overridden via environment variables.

## Configuration Structure

### 1. Database Configuration (`config/app-config.js`)

#### Connection Settings
```javascript
database: {
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    timezone: '+00:00',
    acquireTimeout: 60000,
    connectTimeout: 60000,
    ssl: process.env.DB_SSL === 'true' ? {...} : false
  }
}
```

#### System Database (Developer/Super-Admin)
```javascript
system: {
  name: process.env.SYSTEM_DB_NAME || 'school_erp_system',
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci',
  connectionLimit: parseInt(process.env.SYSTEM_DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  multipleStatements: false
}
```

#### Trust Databases (Tenant-Specific)
```javascript
trust: {
  prefix: process.env.TRUST_DB_PREFIX || 'school_erp_trust_',
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci',
  connectionLimit: parseInt(process.env.TRUST_DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  multipleStatements: false
}
```

### 2. Multi-Tenant Configuration

#### Tenant Resolution Strategies
```javascript
multiTenant: {
  enabled: true,
  defaultTrustCode: process.env.DEFAULT_TRUST_CODE || 'demo',
  tenantResolution: {
    strategy: process.env.TENANT_STRATEGY || 'subdomain',
    headerName: 'X-Trust-Code',
    subdomainPattern: /^([a-zA-Z0-9_-]+)\./,
    pathPattern: /^\/trust\/([a-zA-Z0-9_-]+)/,
    cookieName: 'trust_context'
  }
}
```

#### Trust Code Validation
```javascript
trustCodeValidation: {
  minLength: 2,
  maxLength: 20,
  pattern: /^[a-zA-Z0-9_-]+$/,
  reservedCodes: ['admin', 'api', 'system', 'www', 'app', 'mail', 'ftp']
}
```

#### Database Context Requirements
```javascript
database: {
  autoCreateTrustDB: process.env.AUTO_CREATE_TRUST_DB === 'true',
  maxTrustsPerInstance: parseInt(process.env.MAX_TRUSTS_PER_INSTANCE) || 100,
  trustPoolTimeout: 300000,
  systemContextRequired: ['/system', '/api/system', '/setup/platform'],
  trustContextRequired: ['/api/users', '/api/students', '/api/fees', '/api/reports']
}
```

### 3. Environment Configuration
```javascript
environment: {
  name: process.env.NODE_ENV || 'development',
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  timezone: process.env.TZ || 'Asia/Kolkata',
  locale: process.env.LOCALE || 'en-IN',
  currency: process.env.CURRENCY || 'INR'
}
```

## Environment Variables (.env file)

### Required Database Settings
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_SSL=false

# Database Names
SYSTEM_DB_NAME=school_erp_system
TRUST_DB_PREFIX=school_erp_trust_

# Connection Limits
SYSTEM_DB_CONNECTION_LIMIT=10
TRUST_DB_CONNECTION_LIMIT=10
```

### Multi-Tenant Settings
```bash
# Multi-tenant Configuration
DEFAULT_TRUST_CODE=demo
TENANT_STRATEGY=subdomain
AUTO_CREATE_TRUST_DB=false
MAX_TRUSTS_PER_INSTANCE=100
```

### Application Settings
```bash
# Application
NODE_ENV=development
PORT=3000
TZ=Asia/Kolkata
LOCALE=en-IN
CURRENCY=INR
```

## Implementation Benefits

### 1. Centralized Configuration
- All database names and settings in one place
- Environment variable overrides for flexibility
- Clear separation between system and trust configs

### 2. Environment-Specific Settings
- Development, staging, production configurations
- SSL configuration for secure connections
- Connection pooling and timeout settings

### 3. Multi-Tenant Flexibility
- Multiple tenant resolution strategies
- Configurable trust code validation
- Route-based context enforcement

### 4. Security & Validation
- Reserved trust code prevention
- Input validation patterns
- SSL support for encrypted connections

## Database Usage Examples

### System Database Operations
```javascript
// Used for: developer operations, trust registry, system users
const users = await db.querySystem('SELECT * FROM system_users');
```

### Trust Database Operations
```javascript
// Used for: tenant-specific data (schools, students, fees, etc.)
const students = await db.queryTrust('demo', 'SELECT * FROM students');
```

### Configuration Access
```javascript
const appConfig = require('./config/app-config');

// Get system database name
const systemDB = appConfig.database.system.name;

// Get trust database prefix
const trustPrefix = appConfig.database.trust.prefix;

// Get multi-tenant settings
const tenantStrategy = appConfig.multiTenant.tenantResolution.strategy;
```

## Setup Instructions

1. **Copy environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Update database credentials** in `.env`:
   ```bash
   DB_USER=your_username
   DB_PASSWORD=your_password
   ```

3. **Test configuration**:
   ```bash
   npm run test:multi-tenant
   ```

4. **Create system database**:
   ```bash
   npm run system:migrate
   ```

5. **Create first tenant**:
   ```bash
   npm run tenant:create -- --code=demo --name="Demo Trust"
   ```

This configuration provides complete flexibility while maintaining security and proper separation between system and tenant data.
