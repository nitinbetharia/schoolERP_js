# Multi-Tenant Database Migration System

## 🏗️ Architecture Overview

The School ERP system uses a **two-database architecture** for multi-tenancy:

1. **Master Database**: `school_erp` - Contains system-level data
   - System users (administrators)
   - Trust registry
   - Migration version tracking
   - Global configurations

2. **Trust Databases**: `school_erp_{trust_code}` - Contains tenant-specific data
   - Trust users (school staff, teachers, students, parents)
   - Schools within the trust
   - Student records, fees, attendance, etc.
   - Trust-specific configurations

## 📊 Migration Management Strategy

### 1. Version Control System

```
migrations/
├── master/                    # Master database migrations
│   ├── 001_initial_setup.sql
│   ├── 002_add_audit_logs.sql
│   └── 003_trust_templates.sql
├── trust_template/            # Trust database template migrations
│   ├── 001_initial_setup.sql
│   ├── 002_fee_structure.sql
│   └── 003_attendance_system.sql
└── migration_tracker.js      # Migration execution engine
```

### 2. Migration Versioning

Each migration includes:
- **Version Number**: Sequential integer (001, 002, 003...)
- **Description**: Human-readable migration purpose
- **Type**: `master` or `trust_template`
- **Rollback Script**: Optional down migration
- **Dependencies**: Required previous migrations

### 3. Migration Metadata Table

**Master Database**: `migration_versions`
```sql
CREATE TABLE migration_versions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    version_number INT NOT NULL,
    migration_name VARCHAR(255) NOT NULL,
    migration_type ENUM('master', 'trust_template') NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(64) NOT NULL,
    execution_time_ms INT,
    rollback_script TEXT NULL
);
```

**Trust Databases**: `trust_migration_versions`
```sql
CREATE TABLE trust_migration_versions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    version_number INT NOT NULL,
    migration_name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    applied_by VARCHAR(255),
    checksum VARCHAR(64) NOT NULL,
    source_version INT NOT NULL -- References master template version
);
```

## 🔧 Migration Engine Implementation

### Core Migration Manager

```javascript
// migrations/migration-manager.js
class MigrationManager {
  constructor() {
    this.masterDb = require('../config/database');
    this.trustConnections = new Map();
  }

  async runMasterMigrations() {
    const pendingMigrations = await this.getPendingMasterMigrations();
    
    for (const migration of pendingMigrations) {
      await this.executeMasterMigration(migration);
    }
  }

  async runTrustMigrations(trustCode) {
    const trustDb = await this.getTrustDatabase(trustCode);
    const pendingMigrations = await this.getPendingTrustMigrations(trustCode);
    
    for (const migration of pendingMigrations) {
      await this.executeTrustMigration(trustDb, migration);
    }
  }

  async createNewTrust(trustCode, trustName) {
    // 1. Create trust database
    await this.createTrustDatabase(trustCode);
    
    // 2. Apply all trust template migrations
    await this.applyAllTrustMigrations(trustCode);
    
    // 3. Insert trust record in master database
    await this.registerTrust(trustCode, trustName);
  }
}
```

### Migration Scripts

**Master Migration Example**: `migrations/master/003_audit_system.sql`
```sql
-- Migration: 003_audit_system
-- Description: Add comprehensive audit logging system
-- Type: master
-- Dependencies: 002

CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    user_type ENUM('system', 'trust') NOT NULL,
    trust_id INT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_action (user_id, action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at)
);

-- Insert migration record
INSERT INTO migration_versions (version_number, migration_name, migration_type, checksum) 
VALUES (3, 'audit_system', 'master', SHA2('audit_system_v3', 256));
```

**Trust Template Migration**: `migrations/trust_template/002_fee_management.sql`
```sql
-- Migration: 002_fee_management
-- Description: Fee collection and management system
-- Type: trust_template
-- Dependencies: 001

CREATE TABLE fee_structures (
    id INT PRIMARY KEY AUTO_INCREMENT,
    school_id INT NOT NULL,
    class_id INT NOT NULL,
    fee_type ENUM('tuition', 'transport', 'library', 'lab', 'exam', 'other') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    academic_year_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

CREATE TABLE fee_payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    fee_structure_id INT NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method ENUM('cash', 'cheque', 'online', 'card') NOT NULL,
    transaction_id VARCHAR(100),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    collected_by INT NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id),
    FOREIGN KEY (collected_by) REFERENCES users(id)
);

-- Record migration in trust database
INSERT INTO trust_migration_versions (version_number, migration_name, applied_by, checksum, source_version) 
VALUES (2, 'fee_management', 'system', SHA2('fee_management_v2', 256), 2);
```

## 📋 Migration Commands

### CLI Migration Commands

```bash
# Run all pending master migrations
npm run migrate:master

# Run all pending trust migrations for specific trust
npm run migrate:trust demo

# Run migrations for all trusts
npm run migrate:trust-all

# Create new trust with migrations
npm run trust:create demo "Demo Educational Trust"

# Check migration status
npm run migrate:status

# Rollback last migration (master)
npm run migrate:rollback:master

# Rollback last migration (trust)
npm run migrate:rollback:trust demo
```

### Package.json Scripts

```json
{
  "scripts": {
    "migrate:master": "node migrations/run-master-migrations.js",
    "migrate:trust": "node migrations/run-trust-migrations.js",
    "migrate:trust-all": "node migrations/run-all-trust-migrations.js",
    "migrate:status": "node migrations/migration-status.js",
    "migrate:rollback:master": "node migrations/rollback-master.js",
    "migrate:rollback:trust": "node migrations/rollback-trust.js",
    "trust:create": "node migrations/create-trust.js",
    "migrate:check": "node migrations/check-migrations.js"
  }
}
```

## 🔄 Migration Workflow

### Adding New Migration

1. **Create Migration File**
   ```bash
   # For master database
   npm run migration:create master add_new_feature
   
   # For trust template
   npm run migration:create trust add_student_grades
   ```

2. **Write Migration SQL**
   - Include proper version number
   - Add descriptive comments
   - Include rollback script if possible
   - Test on development database

3. **Execute Migration**
   ```bash
   # Test on single trust first
   npm run migrate:trust demo
   
   # Deploy to all trusts
   npm run migrate:trust-all
   ```

### Creating New Trust

1. **Use Migration System**
   ```bash
   npm run trust:create abc "ABC School Trust"
   ```

2. **Automated Process**
   - Creates new database: `school_erp_abc`
   - Applies all trust template migrations
   - Registers trust in master database
   - Sets up initial admin user
   - Configures basic settings

### Updating Existing Trusts

1. **Create New Template Migration**
2. **Test on Development Trust**
3. **Deploy to Production Trusts**
   ```bash
   npm run migrate:trust-all
   ```

## 🛡️ Safety Mechanisms

### 1. Migration Validation

```javascript
async function validateMigration(migration) {
  // Check migration syntax
  await validateSQL(migration.sql);
  
  // Verify dependencies
  await checkDependencies(migration.dependencies);
  
  // Confirm checksum
  await verifyChecksum(migration);
  
  // Test on copy database
  await testMigration(migration);
}
```

### 2. Rollback System

```javascript
async function rollbackMigration(version, type, trustCode = null) {
  const migration = await getMigration(version, type);
  
  if (migration.rollback_script) {
    await executeSQLScript(migration.rollback_script, trustCode);
    await removeMigrationRecord(version, type, trustCode);
  } else {
    throw new Error('No rollback script available');
  }
}
```

### 3. Backup Before Migration

```javascript
async function safeMigration(migration, trustCode) {
  // Create backup
  const backupId = await createDatabaseBackup(trustCode);
  
  try {
    await executeMigration(migration, trustCode);
  } catch (error) {
    // Restore from backup on failure
    await restoreFromBackup(backupId, trustCode);
    throw error;
  }
}
```

## 📊 Migration Monitoring

### Migration Status Dashboard

```javascript
// migrations/status-dashboard.js
async function getMigrationStatus() {
  const masterStatus = await getMasterMigrationStatus();
  const trustsStatus = await getAllTrustsStatus();
  
  return {
    master: masterStatus,
    trusts: trustsStatus,
    summary: {
      totalTrusts: trustsStatus.length,
      upToDate: trustsStatus.filter(t => t.isUpToDate).length,
      needsUpdate: trustsStatus.filter(t => !t.isUpToDate).length
    }
  };
}
```

### Automated Monitoring

```javascript
// Scheduled job to check migration status
setInterval(async () => {
  const status = await getMigrationStatus();
  
  if (status.summary.needsUpdate > 0) {
    await notifyAdministrators({
      message: `${status.summary.needsUpdate} trusts need migration updates`,
      trusts: status.trusts.filter(t => !t.isUpToDate)
    });
  }
}, 60 * 60 * 1000); // Check hourly
```

## 🚀 Deployment Strategy

### Development Environment

1. **Local Development**
   - Single master database
   - One or two test trust databases
   - Rapid migration testing

2. **Staging Environment**
   - Production-like setup
   - Multiple test trusts
   - Migration validation

3. **Production Environment**
   - Full multi-tenant setup
   - Automated backup before migrations
   - Phased rollout for trust migrations

### Migration Deployment Process

1. **Pre-Deployment**
   ```bash
   npm run migrate:check          # Validate all migrations
   npm run backup:all            # Backup all databases
   npm run test:migrations       # Run migration tests
   ```

2. **Deployment**
   ```bash
   npm run migrate:master        # Update master database
   npm run migrate:trust-all     # Update all trust databases
   npm run verify:deployment     # Verify successful deployment
   ```

3. **Post-Deployment**
   ```bash
   npm run health:check          # System health verification
   npm run migrate:status        # Confirm migration status
   npm run cleanup:backups       # Clean old backups
   ```

## 📝 Best Practices

### 1. Migration Design

- **Atomic Migrations**: Each migration should be complete and atomic
- **Backward Compatibility**: Avoid breaking changes when possible
- **Data Preservation**: Always preserve existing data
- **Testing**: Test migrations on development/staging first

### 2. Naming Conventions

- **Files**: `001_descriptive_name.sql`
- **Tables**: Use consistent naming across trusts
- **Versions**: Sequential numbering with no gaps

### 3. Performance Considerations

- **Large Tables**: Use batch processing for large data migrations
- **Indexes**: Add indexes after data insertion for better performance
- **Timing**: Run heavy migrations during low-traffic periods

### 4. Security

- **Access Control**: Limit migration execution to authorized users
- **Audit Trail**: Log all migration activities
- **Validation**: Validate all SQL before execution

## 🔧 Implementation Files

The migration system would include these key files:

```
migrations/
├── migration-manager.js       # Core migration engine
├── run-master-migrations.js   # Master database migrations
├── run-trust-migrations.js    # Trust database migrations
├── create-trust.js           # New trust creation
├── rollback-manager.js       # Rollback functionality
├── backup-manager.js         # Database backup system
├── validation.js             # Migration validation
├── monitoring.js             # Status monitoring
├── master/                   # Master DB migrations
└── trust_template/           # Trust DB template migrations
```

This migration system ensures:

✅ **Consistency** across all trust databases  
✅ **Version control** for database schema changes  
✅ **Automated deployment** of database updates  
✅ **Rollback capability** for failed migrations  
✅ **Monitoring and alerting** for migration status  
✅ **Safe multi-tenant** database management

The system provides a robust foundation for managing database evolution across multiple tenants while maintaining data integrity and system reliability.