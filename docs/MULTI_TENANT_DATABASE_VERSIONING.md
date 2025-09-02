# Multi-Tenant Database Versioning Strategy

## Overview

In a multi-tenant SaaS application like our School ERP system, we need a robust strategy for handling database versioning across multiple tenant databases while maintaining consistency and enabling smooth upgrades.

## Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE ARCHITECTURE                    │
├─────────────────────┬───────────────────────────────────────┤
│   System Database   │           Tenant Databases            │
│                     │                                       │
│ • Trusts            │ • school_erp_trust_{code}             │
│ • SystemUsers       │   - Students                          │
│ • FeeConfigurations │   - Teachers                          │
│ • TenantConfigs     │   - Classes                           │
│ • DatabaseMigrations│   - Fees                              │
│                     │   - Transactions                      │
│                     │   - TenantSpecificData                │
└─────────────────────┴───────────────────────────────────────┘
```

## Database Versioning Strategy

### 1. Schema Version Tracking

We implement a comprehensive versioning system that tracks:
- **System Database Version**: Global schema version
- **Tenant Database Version**: Individual tenant schema version
- **Feature Flags**: What features are enabled per tenant
- **Migration History**: Complete audit trail of all changes

#### Schema Version Table (System Database)

```sql
CREATE TABLE database_schema_versions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    database_type ENUM('system', 'tenant') NOT NULL,
    database_identifier VARCHAR(100), -- NULL for system, trust_code for tenant
    current_version VARCHAR(20) NOT NULL,
    target_version VARCHAR(20),
    migration_status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
    migration_started_at TIMESTAMP NULL,
    migration_completed_at TIMESTAMP NULL,
    migration_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_db_version (database_type, database_identifier)
);

-- Migration History Table (System Database)
CREATE TABLE database_migration_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    database_type ENUM('system', 'tenant') NOT NULL,
    database_identifier VARCHAR(100),
    migration_name VARCHAR(200) NOT NULL,
    migration_version VARCHAR(20) NOT NULL,
    migration_type ENUM('schema', 'data', 'feature') NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    execution_time_ms INT,
    status ENUM('success', 'failed', 'rolled_back') NOT NULL,
    error_message TEXT,
    checksum VARCHAR(64), -- For integrity verification
    
    INDEX idx_db_migration (database_type, database_identifier),
    INDEX idx_migration_version (migration_version)
);
```

### 2. Migration Management

#### Migration File Structure

```
migrations/
├── system/
│   ├── v1.0.0/
│   │   ├── 001_create_trusts.js
│   │   ├── 002_create_users.js
│   │   └── 003_create_fee_configurations.js
│   ├── v1.1.0/
│   │   ├── 004_add_tenant_configurations.js
│   │   └── 005_add_custom_fields.js
│   └── v2.0.0/
│       ├── 006_enhance_fee_system.js
│       └── 007_add_audit_logs.js
├── tenant/
│   ├── v1.0.0/
│   │   ├── 001_create_students.js
│   │   ├── 002_create_classes.js
│   │   └── 003_create_teachers.js
│   ├── v1.1.0/
│   │   ├── 004_add_custom_field_values.js
│   │   └── 005_add_fee_assignments.js
│   └── v2.0.0/
│       ├── 006_enhance_student_model.js
│       └── 007_add_fee_transactions.js
└── shared/
    ├── migration-runner.js
    ├── version-manager.js
    └── rollback-manager.js
```

#### Migration Class Structure

```javascript
class Migration {
    constructor() {
        this.version = '1.1.0';
        this.name = 'add_tenant_configurations';
        this.type = 'schema'; // 'schema', 'data', 'feature'
        this.targetDatabase = 'system'; // 'system', 'tenant', 'both'
        this.rollbackSupported = true;
        this.dependencies = ['1.0.0']; // Required previous versions
    }

    async up(queryInterface, Sequelize, databaseInfo) {
        // Migration logic here
    }

    async down(queryInterface, Sequelize, databaseInfo) {
        // Rollback logic here
    }

    async validate(queryInterface, databaseInfo) {
        // Post-migration validation
    }
}
```

### 3. Version Compatibility Matrix

```javascript
const VERSION_COMPATIBILITY = {
    'v2.0.0': {
        system: '2.0.0',
        tenant: '2.0.0',
        features: ['enhanced_fees', 'custom_fields', 'audit_logs'],
        breaking_changes: true,
        rollback_point: 'v1.1.0'
    },
    'v1.1.0': {
        system: '1.1.0',
        tenant: '1.1.0',
        features: ['custom_fields', 'fee_configurations'],
        breaking_changes: false,
        rollback_point: 'v1.0.0'
    },
    'v1.0.0': {
        system: '1.0.0',
        tenant: '1.0.0',
        features: ['basic_erp'],
        breaking_changes: false,
        rollback_point: null
    }
};
```

### 4. Tenant-Specific Migration Handling

#### Different Tenants, Different Versions

```javascript
class TenantMigrationManager {
    async migrateTenant(tenantCode, targetVersion) {
        const currentVersion = await this.getCurrentVersion(tenantCode);
        const migrationPath = this.calculateMigrationPath(currentVersion, targetVersion);
        
        // Check if tenant can be migrated
        if (!this.canMigrate(tenantCode, targetVersion)) {
            throw new Error(`Tenant ${tenantCode} cannot migrate to ${targetVersion}`);
        }
        
        // Execute migrations in sequence
        for (const migration of migrationPath) {
            await this.executeMigration(tenantCode, migration);
        }
    }
    
    async canMigrate(tenantCode, targetVersion) {
        const tenantConfig = await this.getTenantConfiguration(tenantCode);
        const compatibility = VERSION_COMPATIBILITY[targetVersion];
        
        // Check feature compatibility
        return tenantConfig.features.every(feature => 
            compatibility.features.includes(feature)
        );
    }
}
```

### 5. Gradual Migration Strategy

#### Phase 1: Preparation
```javascript
async prepareGradualMigration(targetVersion) {
    // 1. Update system database first
    await this.migrateSystemDatabase(targetVersion);
    
    // 2. Mark tenants for migration
    await this.markTenantsForMigration(targetVersion);
    
    // 3. Create rollback points
    await this.createRollbackPoints();
}
```

#### Phase 2: Tenant Migration
```javascript
async migrateTenantsGradually(targetVersion, batchSize = 5) {
    const pendingTenants = await this.getPendingMigrations(targetVersion);
    
    // Process in batches to avoid overwhelming the database
    for (let i = 0; i < pendingTenants.length; i += batchSize) {
        const batch = pendingTenants.slice(i, i + batchSize);
        
        // Migrate batch in parallel
        await Promise.allSettled(
            batch.map(tenant => this.migrateTenant(tenant.code, targetVersion))
        );
        
        // Add delay between batches
        await this.delay(1000);
    }
}
```

### 6. Feature Flags for Gradual Rollouts

```javascript
const FEATURE_FLAGS = {
    enhanced_fee_system: {
        required_version: '2.0.0',
        enabled_for: ['premium', 'enterprise'],
        beta_tenants: ['demo_trust', 'test_trust'],
        rollout_percentage: 25
    },
    advanced_reporting: {
        required_version: '2.1.0',
        enabled_for: ['enterprise'],
        beta_tenants: [],
        rollout_percentage: 0
    }
};

class FeatureManager {
    async isFeatureEnabled(tenantCode, featureName) {
        const tenant = await this.getTenant(tenantCode);
        const feature = FEATURE_FLAGS[featureName];
        
        // Check version compatibility
        if (!this.versionSupports(tenant.version, feature.required_version)) {
            return false;
        }
        
        // Check tenant tier
        if (!feature.enabled_for.includes(tenant.tier)) {
            return false;
        }
        
        // Check beta access
        if (feature.beta_tenants.includes(tenantCode)) {
            return true;
        }
        
        // Check rollout percentage
        return this.isInRolloutPercentage(tenantCode, feature.rollout_percentage);
    }
}
```

### 7. Data Migration Strategies

#### Strategy A: In-Place Migration
```javascript
async migrateStudentDataInPlace(tenantDb) {
    // Migrate existing data in the same database
    await tenantDb.query(`
        ALTER TABLE Students 
        ADD COLUMN custom_fields JSON DEFAULT NULL,
        ADD COLUMN fee_structure_locked BOOLEAN DEFAULT FALSE
    `);
    
    // Migrate data
    await tenantDb.query(`
        UPDATE Students SET 
        custom_fields = '{}',
        fee_structure_locked = FALSE
        WHERE custom_fields IS NULL
    `);
}
```

#### Strategy B: Shadow Migration
```javascript
async migrateTenantWithShadow(tenantCode) {
    // Create shadow database
    const shadowDb = `${tenantDb}_migration_${Date.now()}`;
    await this.createDatabase(shadowDb);
    
    // Set up new schema in shadow
    await this.setupNewSchema(shadowDb);
    
    // Copy and transform data
    await this.copyDataWithTransformation(tenantDb, shadowDb);
    
    // Validate migration
    await this.validateMigration(tenantDb, shadowDb);
    
    // Switch databases (atomic operation)
    await this.switchDatabases(tenantDb, shadowDb);
    
    // Clean up old database
    await this.scheduleCleanup(tenantDb);
}
```

### 8. Rollback Management

#### Automatic Rollback Triggers
```javascript
class RollbackManager {
    async monitorMigration(migrationId) {
        const migration = await this.getMigration(migrationId);
        
        // Set up monitoring
        const healthCheck = setInterval(async () => {
            const health = await this.checkDatabaseHealth(migration.database);
            
            if (health.status === 'critical') {
                logger.error('Critical error detected, initiating rollback');
                await this.initiateRollback(migrationId);
                clearInterval(healthCheck);
            }
        }, 30000); // Check every 30 seconds
        
        // Set timeout for migration
        setTimeout(() => {
            if (migration.status === 'running') {
                this.initiateRollback(migrationId);
            }
            clearInterval(healthCheck);
        }, 30 * 60 * 1000); // 30 minutes timeout
    }
}
```

### 9. Multi-Environment Strategy

#### Development → Staging → Production
```javascript
const ENVIRONMENT_VERSIONS = {
    development: {
        system_version: '2.1.0-dev',
        tenant_version: '2.1.0-dev',
        allow_experimental: true
    },
    staging: {
        system_version: '2.0.0',
        tenant_version: '2.0.0',
        allow_experimental: false
    },
    production: {
        system_version: '2.0.0',
        tenant_version: '2.0.0',
        allow_experimental: false
    }
};
```

### 10. Performance Considerations

#### Migration Performance Optimization
```javascript
async optimizedTenantMigration(tenantCode) {
    // 1. Analyze current data size
    const dataSize = await this.analyzeTenantDataSize(tenantCode);
    
    // 2. Choose migration strategy based on size
    if (dataSize.totalRows > 1000000) {
        return await this.largeTenantMigration(tenantCode);
    } else {
        return await this.standardTenantMigration(tenantCode);
    }
}

async largeTenantMigration(tenantCode) {
    // Use chunked processing for large datasets
    const chunkSize = 10000;
    const totalRecords = await this.getTotalRecords(tenantCode);
    
    for (let offset = 0; offset < totalRecords; offset += chunkSize) {
        await this.migrateChunk(tenantCode, offset, chunkSize);
        await this.delay(100); // Prevent overwhelming database
    }
}
```

## Implementation Checklist

### Phase 1: Foundation
- [ ] Create database versioning tables
- [ ] Implement migration runner framework
- [ ] Set up version tracking system
- [ ] Create rollback mechanisms

### Phase 2: Migration Infrastructure
- [ ] Build tenant-specific migration logic
- [ ] Implement feature flag system
- [ ] Create monitoring and alerting
- [ ] Set up automated rollback triggers

### Phase 3: Advanced Features
- [ ] Shadow migration for large tenants
- [ ] Performance optimization tools
- [ ] Multi-environment deployment pipeline
- [ ] Comprehensive testing framework

### Phase 4: Operational Excellence
- [ ] Migration dashboard and reporting
- [ ] Tenant migration scheduling
- [ ] Emergency rollback procedures
- [ ] Documentation and runbooks

## Best Practices

1. **Always Backward Compatible**: New versions should work with older tenant schemas
2. **Gradual Rollouts**: Never migrate all tenants simultaneously
3. **Comprehensive Testing**: Test migrations on staging data first
4. **Clear Rollback Plans**: Every migration must have a rollback strategy
5. **Monitor Everything**: Track performance, errors, and completion rates
6. **Communicate Changes**: Keep tenants informed of upgrade schedules
7. **Feature Flags**: Use feature flags to control feature rollouts
8. **Data Validation**: Validate data integrity after every migration

## Common Challenges & Solutions

### Challenge 1: Tenant Customizations
**Problem**: Different tenants have customized their database schema
**Solution**: Schema comparison and automatic conflict resolution

### Challenge 2: Large Dataset Migration
**Problem**: Migration takes too long for large tenants
**Solution**: Chunked processing and shadow database approach

### Challenge 3: Zero-Downtime Requirements
**Problem**: Tenants cannot afford downtime
**Solution**: Blue-green deployments and hot swapping

### Challenge 4: Failed Migrations
**Problem**: Migration fails halfway through
**Solution**: Transactional migrations with automatic rollback

This comprehensive versioning strategy ensures that our multi-tenant School ERP system can evolve smoothly while maintaining data integrity and minimizing disruption to individual tenants.
