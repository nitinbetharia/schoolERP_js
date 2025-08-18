# 🔧 REFACTORING INSTRUCTIONS - AUTOMATED COMPLIANCE

## 🚨 **CRITICAL: ALWAYS FOLLOW THESE STEPS DURING REFACTORING**

### **STEP 0: LEGACY FILE MANAGEMENT (MANDATORY)**

Before creating any new compliant file:

1. ✅ **Move old file to legacy** using:
   `mv [old-file] legacy/[same-structure]/[old-file]`
2. ✅ **Update legacy log** in `legacy/README.md` with:
   - Date moved
   - File path
   - Reason for move
   - Replacement file
   - Q&A violation reference
3. ✅ **Create new compliant file** in original location
4. ✅ **Update all imports** to point to new file

### **STEP 1: Q29 COMPLIANCE (MANDATORY)**

**Q29: JSON config files + .env for secrets only**

✅ **ALLOWED in .env:**

- `DB_USER` (secret)
- `DB_PASSWORD` (secret)
- `SESSION_SECRET` (secret)
- `ENCRYPTION_KEY` (secret)

❌ **FORBIDDEN in .env:**

- Database names
- Host/port settings
- Connection pool settings
- Application configuration
- Business logic settings

✅ **REQUIRED in JSON config files:**

- Database names (`system.name`, `tenant.prefix`)
- Host/port configuration
- Connection pool settings
- All non-secret configuration

### **STEP 2: SEQUELIZE CONFIGURATION PATTERN**

All Sequelize instances MUST follow this pattern:

```javascript
// ✅ CORRECT: Get config from JSON, secrets from .env
const dbConfig = config.get('database');

const sequelize = new Sequelize(
  dbConfig.system.name, // From JSON config
  process.env.DB_USER, // From .env (secret)
  process.env.DB_PASSWORD, // From .env (secret)
  {
    host: dbConfig.connection.host, // From JSON config
    port: dbConfig.connection.port, // From JSON config
    pool: dbConfig.pool // From JSON config
    // ... other settings from JSON config
  }
);
```

❌ **FORBIDDEN PATTERNS:**

```javascript
// ❌ All from environment
host: process.env.DB_HOST

// ❌ All from config including secrets
password: dbConfig.connection.password

// ❌ Hardcoded values
pool: { max: 15, min: 2 }
```

### **STEP 3: DATABASE NAMING PATTERN**

✅ **CORRECT JSON config structure:**

```json
{
  "database": {
    "connection": { "host": "localhost", "port": 3306 },
    "system": { "name": "school_erp_system" },
    "tenant": { "prefix": "school_erp_trust_" },
    "pool": { "max": 15, "min": 2, "acquire": 60000, "idle": 300000 }
  }
}
```

✅ **CORRECT usage in code:**

```javascript
// System database
const systemDbName = dbConfig.system.name;

// Tenant database
const tenantDbName = `${dbConfig.tenant.prefix}${trustCode}`;
```

### **STEP 4: MODEL REFACTORING PATTERN**

When refactoring models from class-based to `sequelize.define()`:

1. ✅ **Move class-based model** to `legacy/models/`
2. ✅ **Create new model** using `sequelize.define()` pattern
3. ✅ **Add Joi validation** within same file
4. ✅ **Follow Q16 naming** (underscored: true)

### **STEP 5: SCRIPT REFACTORING PATTERN**

When refactoring scripts from raw MySQL to Sequelize:

1. ✅ **Move raw MySQL script** to `legacy/scripts/`
2. ✅ **Create new Sequelize-based script**
3. ✅ **Use sequelize instances** instead of `mysql.createConnection()`
4. ✅ **Follow Q29 config pattern** (JSON + .env secrets)

### **VALIDATION CHECKLIST**

Before completing any refactoring task:

- [ ] ✅ Old file moved to `legacy/` folder
- [ ] ✅ Legacy log updated
- [ ] ✅ New file follows Q29 (JSON config + .env secrets only)
- [ ] ✅ Database names from JSON config, NOT environment
- [ ] ✅ Secrets (user/password) from .env ONLY
- [ ] ✅ All imports updated to new file
- [ ] ✅ No hardcoded values (use JSON config)
- [ ] ✅ Sequelize patterns followed (if applicable)

## 🔧 **QUICK REFERENCE COMMANDS**

### Move file to legacy:

```bash
mkdir -p legacy/[directory-structure]
mv [old-file] legacy/[same-structure]/[old-file]
```

### Update imports:

```bash
find . -name "*.js" -type f -exec sed -i 's|require.*old-file|require.*new-file|g' {} \;
```

### Validate Q29 compliance:

```bash
grep -r "process.env.DB_HOST\|process.env.DB_PORT\|process.env.DB_SYSTEM" --include="*.js" .
# Should return NO results (these should be in JSON config)
```

---

**REMEMBER**: Every violation of these patterns will cause build/deployment
failure. The Single Source of Truth configuration system enforces these
decisions automatically.
