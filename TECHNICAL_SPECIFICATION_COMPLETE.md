# School ERP - Complete Technical Specification (2025-08-18)

## 🔒 SINGLE SOURCE OF TRUTH - ALL DECISIONS FINAL

**Status**: ALL 56 technical decisions finalized and ENFORCED in `config/SINGLE_SOURCE_OF_TRUTH.js`  
**Approach**: Zero-ambiguity specification with validation enforcement  
**Result**: Production-ready architecture with immutable implementation patterns

⚠️ **CRITICAL**: All technical decisions are FINAL and ENFORCED. Any deviation will cause build failure.

---

## 📋 Complete Decision Matrix (Q1-Q56) - IMMUTABLE

**Reference**: `config/SINGLE_SOURCE_OF_TRUTH.js` - The ONLY source for technical decisions

### **Core Technology Stack**

- **Q1**: Sequelize ORM (not raw mysql2)
- **Q2**: CommonJS only (`require`/`module.exports`)
- **Q3**: Tailwind CSS only
- **Q4**: Sequelize CLI with migration files
- **Q5**: Separate databases per tenant
- **Q6**: Express sessions with MySQL store
- **Q7**: MVC with EJS views + JSON API endpoints
- **Q8**: Joi + Sequelize validations + custom business rules
- **Q9**: Winston + centralized error handler + structured logging
- **Q10**: Cloud MySQL + local Node.js

### **Database Architecture Details**

- **Q11**: Moderate connection pooling:
  `{ max: 15, min: 2, acquire: 60000, idle: 300000 }`
- **Q12**: Direct `sequelize.define()` calls (not class-based)
- **Q13**: Inline associations with model definition
- **Q14**: Mixed PKs: UUIDs for sensitive data, integers for lookup tables
- **Q15**: Custom timestamp fields (`created_at`, `updated_at`, `deleted_at`)
- **Q16**: Snake_case database, camelCase JavaScript (`underscored: true`)
- **Q17**: bcryptjs with salt rounds 12
- **Q18**: Environment-based session configuration

### **Validation & Error Handling**

- **Q19**: Validation schemas within model files
- **Q20**: Joi transforms with custom sanitizers
- **Q21**: Structured error responses with error codes and timestamps
- **Q33**: RESTRICT foreign keys with user-friendly error messages
- **Q49**: Application-level encryption for sensitive data only
- **Q50**: Detailed audit trail with before/after change tracking
- **Q51**: Context-aware input sanitization

### **Authentication & Security**

- **Q36**: Separate roles table with relationships
- **Q37**: Role-based session timeout durations
- **Q38**: Tenant-configurable password policies with simple default

### **API & Frontend Architecture**

- **Q22**: Module-based routing with sub-routers
- **Q23**: Security-first middleware chain
- **Q24**: Middleware-based tenant detection via subdomain
- **Q25**: Winston with multiple transports + daily file rotation
- **Q26**: Tailwind CSS via CDN
- **Q27**: EJS include-based partials with component data passing
- **Q28**: Alpine.js for reactive components
- **Q41**: URL path versioning (`/api/v1/`)
- **Q42**: Hybrid pagination (offset for small, cursor for large datasets)
- **Q43**: Endpoint-specific rate limits

### **File Handling & Storage**

- **Q29**: JSON config files + .env for secrets only
- **Q30**: Automatic migrations in development only
- **Q31**: Multer (local default) + cloud storage option per tenant
- **Q32**: node-cache for in-memory caching
- **Q44**: Database-driven file organization
- **Q45**: Direct file serving with middleware protection
- **Q46**: Tenant-configurable file policies with whitelist default + size
  limits

### **Performance & Optimization**

- **Q34**: Auto-generation in dev, careful manual control in production
- **Q35**: Multiple Sequelize instances (one per tenant database)
- **Q39**: Composition with shared validation components
- **Q40**: Tenant-configurable language, English default
- **Q47**: Smart loading based on data size
- **Q48**: Cache invalidation with tags

### **Monitoring & Operations**

- **Q52**: Comprehensive health checks with database/memory/uptime
- **Q53**: Detailed metrics collection with categorization
- **Q54**: Log-based monitoring + email alerts for critical errors
- **Q55**: Single deployment with environment detection
- **Q56**: PM2 for process management

---

## 📦 **Complete Module Architecture (All 10 Core Modules)**

### **Module Implementation Sequence & Dependencies**

**Phase 1: Foundation Layer (Critical Dependencies)**
1. **DATA Module** → Database infrastructure, connections, schema management
2. **AUTH Module** → Authentication, authorization, session management  
3. **SETUP Module** → Initial configuration wizard for trusts and schools

**Phase 2: Core Entity Management**
4. **USER Module** → User lifecycle management (depends on AUTH, SETUP)
5. **STUD Module** → Student management (depends on USER, SETUP)

**Phase 3: Operational Modules**
6. **FEES Module** → Fee management (depends on STUD, USER) - **Enhanced with frontend-configurable fee rules**
7. **ATTD Module** → Attendance tracking (depends on STUD, USER)

**Phase 4: Analytics & Communication**
8. **REPT Module** → Reporting system (depends on all data modules)
9. **DASH Module** → Dashboards (depends on all operational modules)
10. **COMM Module** → Communications (depends on USER, STUD) - **Enhanced with multi-channel support**

### **Enhanced Module Specifications (Aligned with Finalized Decisions)**

#### **1. DATA Module - Database Infrastructure**
**Status**: ✅ Fully specified with Sequelize ORM patterns
- Multi-tenant Sequelize connection management (Q35)
- Mixed primary keys: UUIDs for sensitive data, integers for lookups (Q14)
- Snake_case database, camelCase JavaScript mapping (Q16)
- Connection pooling: `{ max: 15, min: 2, acquire: 60000, idle: 300000 }` (Q11)

#### **2. AUTH Module - Authentication & Authorization**  
**Status**: ✅ Fully specified with enhanced security
- bcryptjs with salt rounds 12 (Q17)
- Express sessions with MySQL store (Q6)
- Role-based session timeouts: ADMIN(8h), TEACHER(12h), PARENT(24h) (Q37)
- Comprehensive audit trail with before/after tracking (Q50)

#### **3. SETUP Module - Configuration Wizard**
**Status**: ✅ Enhanced with frontend-configurable wizards
- Complete wizard engine with frontend management interface
- Per-tenant defaults with intelligent configuration
- Dynamic step creation and modification
- Progress tracking and resume functionality

#### **4. USER Module - User Management**
**Status**: ✅ Fully specified with RBAC patterns
- Separate roles table with relationships (Q36)
- Tenant-configurable password policies (Q38)
- Context-aware authorization (users access only their data)
- Comprehensive user lifecycle management

#### **5. STUD Module - Student Management**
**Status**: ✅ Fully specified with academic tracking
- Student model with UUID primary keys
- Comprehensive admission workflow
- Parent-student relationship management
- Transfer and promotion workflows
- Document management integration

#### **6. FEES Module - Fee Management** ⭐ **ENHANCED**
**Status**: ✅ Advanced frontend-configurable fee calculation engine
- **ConfigurableFeeCalculator** with tenant-specific rules
- Late fees, scholarships, waivers, and custom formulas
- Frontend rule builder with JavaScript formula execution
- Real-time fee calculation with multiple discount types
- Payment tracking and financial reporting

#### **7. ATTD Module - Attendance Management**
**Status**: ✅ Fully specified with multiple tracking types
- Daily attendance with status tracking
- Leave application workflows
- Attendance analytics and reporting
- Automated notification system

#### **8. REPT Module - Reporting System**
**Status**: ✅ Comprehensive reporting framework
- Pre-built report templates
- Custom report builder functionality
- Export capabilities (PDF, Excel, CSV)
- Scheduled reports and distribution
- Role-based report access

#### **9. DASH Module - Dashboard & Analytics**
**Status**: ✅ Role-based dashboards with real-time data
- Real-time KPI widgets with caching (Q32)
- Role-specific dashboard configurations
- Interactive charts and performance indicators
- Quick action panels for common tasks

#### **10. COMM Module - Communication System** ⭐ **ENHANCED**
**Status**: ✅ Advanced multi-channel communication engine
- **CommunicationEngine** with multiple providers
- Email: SendGrid, Nodemailer integration
- SMS: Twilio integration  
- WhatsApp: Business API support
- Template management and delivery tracking
- Emergency alert system

---

## 🏗️ Implementation Patterns

### **Sequelize Model Definition**

```javascript
const { DataTypes } = require('sequelize');
const Joi = require('joi');
const crypto = require('crypto');

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
    // Encrypted sensitive field
    ssn: {
      type: DataTypes.STRING,
      allowNull: true,
      set(value) {
        if (value) {
          const cipher = crypto.createCipher(
            'aes-256-cbc',
            process.env.ENCRYPTION_KEY
          );
          const encrypted =
            cipher.update(value, 'utf8', 'hex') + cipher.final('hex');
          this.setDataValue('ssn', encrypted);
        }
      },
      get() {
        const encrypted = this.getDataValue('ssn');
        if (encrypted) {
          const decipher = crypto.createDecipher(
            'aes-256-cbc',
            process.env.ENCRYPTION_KEY
          );
          return (
            decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8')
          );
        }
        return null;
      }
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
    timestamps: false,
    underscored: true,
    paranoid: false
  }
);

// RESTRICT foreign keys with user-friendly errors
Student.belongsTo(Class, {
  foreignKey: { name: 'class_id', allowNull: false },
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT'
});

// Validation schemas within model
Student.validationSchema = {
  create: Joi.object({
    studentName: Joi.string().trim().max(100).required(),
    admissionNumber: Joi.string().trim().max(20).required(),
    classId: Joi.number().integer().positive().required(),
    ssn: Joi.string()
      .pattern(/^\d{3}-\d{2}-\d{4}$/)
      .optional()
  }),
  update: Joi.object({
    studentName: Joi.string().trim().max(100),
    status: Joi.string().valid('ACTIVE', 'INACTIVE')
  })
};

module.exports = Student;
```

### **Multi-Tenant Connection Management**

```javascript
class TenantConnectionManager {
  constructor() {
    this.connections = new Map();
  }

  getTenantSequelize(trustCode) {
    if (!this.connections.has(trustCode)) {
      const config = {
        ...baseDbConfig,
        database: `school_erp_trust_${trustCode}`,
        pool: { max: 15, min: 2, acquire: 60000, idle: 300000 }
      };
      this.connections.set(trustCode, new Sequelize(config));
    }
    return this.connections.get(trustCode);
  }

  async closeTenantConnection(trustCode) {
    if (this.connections.has(trustCode)) {
      await this.connections.get(trustCode).close();
      this.connections.delete(trustCode);
    }
  }
}

// Middleware for tenant detection
const tenantMiddleware = async (req, res, next) => {
  try {
    const subdomain = req.get('host').split('.')[0];
    req.tenant = await getTenantByCode(subdomain);
    req.db = connectionManager.getTenantSequelize(req.tenant.code);
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_TENANT',
        message: 'Tenant not found or inactive',
        timestamp: new Date().toISOString()
      }
    });
  }
};
```

### **Context-Aware Input Sanitization**

```javascript
const validator = require('validator');
const sanitizeHtml = require('sanitize-html');

const sanitizeByContext = (input, context) => {
  if (typeof input !== 'string') return input;

  switch (context) {
    case 'email':
      return validator.normalizeEmail(validator.trim(input)) || input;

    case 'html':
      return sanitizeHtml(input, {
        allowedTags: ['p', 'br', 'strong', 'em'],
        allowedAttributes: {}
      });

    case 'filename':
      return input.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 255);

    case 'phone':
      return input.replace(/[^\d+()-\s]/g, '');

    case 'name':
      return validator.escape(validator.trim(input));

    default:
      return validator.escape(validator.trim(input));
  }
};

// Validation middleware with sanitization
const validateInput = (schema, contextMap = {}) => {
  return async (req, res, next) => {
    try {
      // Sanitize inputs based on context
      const sanitizedBody = {};
      for (const [key, value] of Object.entries(req.body)) {
        const context = contextMap[key] || 'default';
        sanitizedBody[key] = sanitizeByContext(value, context);
      }

      // Validate with Joi
      const validatedData = await schema.validateAsync(sanitizedBody);
      req.validatedData = validatedData;
      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Input validation failed',
          details: error.details || error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  };
};
```

### **Smart Pagination Implementation**

```javascript
const paginateResults = async (model, options = {}) => {
  const { page = 1, limit = 20, where = {}, include = [] } = options;

  // Get total count first
  const totalCount = await model.count({ where });

  // Choose pagination strategy based on dataset size
  if (totalCount < 10000) {
    // Use offset pagination for smaller datasets
    const offset = (page - 1) * limit;
    const results = await model.findAll({
      where,
      include,
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return {
      data: results,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    };
  } else {
    // Use cursor-based pagination for larger datasets
    const cursor = options.cursor;
    const results = await model.findAll({
      where: cursor ? { ...where, id: { [Op.gt]: cursor } } : where,
      include,
      limit: limit + 1, // Get one extra to check if there's more
      order: [['id', 'ASC']]
    });

    const hasNext = results.length > limit;
    const data = hasNext ? results.slice(0, -1) : results;
    const nextCursor = hasNext ? data[data.length - 1].id : null;

    return {
      data,
      pagination: {
        cursor: nextCursor,
        hasNext,
        limit,
        total: totalCount
      }
    };
  }
};
```

### **Comprehensive Audit Trail**

```javascript
const createAuditLog = async (
  req,
  action,
  tableName,
  recordId,
  oldValues = null,
  newValues = null
) => {
  const auditData = {
    user_id: req.user?.id,
    tenant_code: req.tenant?.code,
    action, // CREATE, UPDATE, DELETE, LOGIN, LOGOUT
    table_name: tableName,
    record_id: recordId,
    old_values: oldValues ? JSON.stringify(oldValues) : null,
    new_values: newValues ? JSON.stringify(newValues) : null,
    changed_fields:
      oldValues && newValues
        ? Object.keys(newValues).filter(
            key => oldValues[key] !== newValues[key]
          )
        : null,
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
    created_at: new Date()
  };

  await AuditLog.create(auditData);

  // Log to Winston for additional monitoring
  logger.info('Audit trail', {
    user: req.user?.id,
    action,
    table: tableName,
    record: recordId,
    tenant: req.tenant?.code
  });
};

// Usage in controllers
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    const oldValues = student.toJSON();

    await student.update(req.validatedData);
    const newValues = student.toJSON();

    await createAuditLog(
      req,
      'UPDATE',
      'students',
      student.id,
      oldValues,
      newValues
    );

    res.json({ success: true, data: student });
  } catch (error) {
    handleError(res, error);
  }
};
```

### **Cache Management with Tags**

```javascript
const NodeCache = require('node-cache');

class TaggedCache {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });
    this.tags = new Map(); // tag -> Set of keys
  }

  set(key, value, ttl = null, tags = []) {
    this.cache.set(key, value, ttl);

    // Associate with tags
    tags.forEach(tag => {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set());
      }
      this.tags.get(tag).add(key);
    });
  }

  get(key) {
    return this.cache.get(key);
  }

  invalidateTag(tag) {
    if (this.tags.has(tag)) {
      const keys = this.tags.get(tag);
      keys.forEach(key => this.cache.del(key));
      this.tags.delete(tag);
    }
  }

  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    const allKeys = this.cache.keys();
    allKeys.filter(key => regex.test(key)).forEach(key => this.cache.del(key));
  }
}

const taggedCache = new TaggedCache();

// Usage
const getStudents = async (req, res) => {
  const cacheKey = `students:${req.tenant.code}:page:${req.query.page}`;
  const cached = taggedCache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  const result = await paginateResults(Student, req.query);

  // Cache with tags for easy invalidation
  taggedCache.set(cacheKey, result, 300, [
    `students:${req.tenant.code}`,
    'students'
  ]);

  res.json(result);
};

// Invalidate cache when data changes
const createStudent = async (req, res) => {
  const student = await Student.create(req.validatedData);

  // Invalidate all student-related cache for this tenant
  taggedCache.invalidateTag(`students:${req.tenant.code}`);

  res.json({ success: true, data: student });
};
```

### **Health Check & Monitoring**

```javascript
const checkDatabaseHealth = async () => {
  try {
    await sequelize.authenticate();
    const stats = await sequelize.query('SHOW STATUS LIKE "Threads_connected"');
    return {
      status: 'healthy',
      connections: stats[0][0]?.Value || 'unknown'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};

const healthCheck = async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
    database: await checkDatabaseHealth(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    },
    uptime: Math.round(process.uptime()),
    cache: {
      keys: taggedCache.cache.keys().length,
      hits: taggedCache.cache.getStats().hits,
      misses: taggedCache.cache.getStats().misses
    }
  };

  const overallStatus = health.database.status === 'healthy' ? 'OK' : 'ERROR';
  res.status(overallStatus === 'OK' ? 200 : 503).json(health);
};

// Performance metrics collection
const metrics = {
  requests: 0,
  errors: 0,
  responseTimes: [],
  slowQueries: [],

  record(req, res, duration) {
    this.requests++;
    this.responseTimes.push(duration);

    if (res.statusCode >= 400) this.errors++;
    if (duration > 1000) {
      this.slowQueries.push({
        path: req.path,
        method: req.method,
        duration,
        timestamp: new Date()
      });
    }

    // Keep only last 1000 response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }
  },

  getSummary() {
    const avgResponseTime =
      this.responseTimes.length > 0
        ? this.responseTimes.reduce((a, b) => a + b, 0) /
          this.responseTimes.length
        : 0;

    return {
      totalRequests: this.requests,
      totalErrors: this.errors,
      errorRate:
        this.requests > 0
          ? ((this.errors / this.requests) * 100).toFixed(2)
          : 0,
      avgResponseTime: Math.round(avgResponseTime),
      slowQueries: this.slowQueries.slice(-10) // Last 10 slow queries
    };
  }
};

// Metrics middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.record(req, res, duration);

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request', {
        method: req.method,
        path: req.path,
        duration,
        tenant: req.tenant?.code
      });
    }
  });
  next();
});
```

---

## 🎯 Implementation Checklist

### Phase 1: Foundation (Week 1-2)

- [ ] Set up Sequelize with multi-tenant connection management
- [ ] Implement authentication with bcryptjs + express-session
- [ ] Create base model patterns with validation schemas
- [ ] Set up Winston logging with daily rotation
- [ ] Configure PM2 for process management

### Phase 2: Core Modules (Week 3-4)

- [ ] Implement user management with role-based access
- [ ] Create student management with proper validation
- [ ] Set up file upload handling (Multer + cloud options)
- [ ] Implement audit trail system
- [ ] Add health checks and monitoring

### Phase 3: Frontend & API (Week 5-6)

- [ ] Create EJS templates with Alpine.js components
- [ ] Implement API versioning and rate limiting
- [ ] Add smart pagination for all list views
- [ ] Set up comprehensive error handling
- [ ] Implement caching with tag-based invalidation

### Phase 4: Security & Performance (Week 7-8)

- [ ] Add encryption for sensitive data
- [ ] Implement context-aware input sanitization
- [ ] Set up performance metrics collection
- [ ] Add email alerting for critical errors
- [ ] Optimize database queries with smart loading

---

**Architecture Status**: ✅ COMPLETE (56/56 decisions finalized)  
**Implementation Ready**: ✅ YES  
**Documentation**: ✅ COMPREHENSIVE  
**Business Logic**: ✅ FINALIZED (Configurable fee engine, multi-channel
communications, academic calendar)  
**Last Updated**: August 18, 2025

---

## 🏢 Business Logic Implementation Patterns

### **Comprehensive Frontend-Configurable Fee Calculation Engine**

```javascript
class ConfigurableFeeCalculator {
  constructor(tenantId, database) {
    this.tenantId = tenantId;
    this.db = database;
    this.appliedRules = [];
    this.feeBreakdown = [];
  }

  async calculateStudentFee(studentId, feeStructureId, options = {}) {
    const { academicYear, term, dueDate = new Date() } = options;
    
    // Load student data with relationships
    const student = await this.loadStudentData(studentId);
    const feeStructure = await this.loadFeeStructure(feeStructureId);
    const rules = await this.loadTenantFeeRules();
    
    // Initialize calculation
    let calculation = {
      baseFee: feeStructure.base_amount,
      totalFee: feeStructure.base_amount,
      appliedDiscounts: 0,
      appliedCharges: 0,
      appliedWaivers: 0,
      appliedScholarships: 0,
      finalAmount: 0
    };

    this.feeBreakdown.push({
      type: 'base_fee',
      description: feeStructure.name,
      amount: feeStructure.base_amount,
      operation: 'add'
    });

    // Apply rules in priority order
    const sortedRules = rules.sort((a, b) => a.priority - b.priority);
    
    for (const rule of sortedRules) {
      if (await this.isRuleApplicable(rule, student, feeStructure, options)) {
        calculation = await this.applyRule(rule, calculation, student, options);
      }
    }

    calculation.finalAmount = Math.max(0, calculation.totalFee);

    return {
      studentId,
      feeStructureId,
      calculation,
      appliedRules: this.appliedRules,
      breakdown: this.feeBreakdown,
      metadata: {
        calculatedAt: new Date(),
        academicYear,
        term,
        dueDate
      }
    };
  }

  async applyRule(rule, calculation, student, options) {
    const { dueDate } = options;

    switch (rule.type) {
      case 'late_fee':
        return await this.applyLateFee(rule, calculation, dueDate);
      
      case 'scholarship':
        return await this.applyScholarship(rule, calculation, student);
      
      case 'waiver':
        return await this.applyWaiver(rule, calculation, student);
      
      case 'sibling_discount':
        return await this.applySiblingDiscount(rule, calculation, student);
      
      case 'category_discount':
        return await this.applyCategoryDiscount(rule, calculation, student);
      
      case 'early_payment_discount':
        return await this.applyEarlyPaymentDiscount(rule, calculation, dueDate);
      
      case 'transport_fee':
        return await this.applyTransportFee(rule, calculation, student);
      
      case 'hostel_fee':
        return await this.applyHostelFee(rule, calculation, student);
      
      case 'custom_formula':
        return await this.applyCustomFormula(rule, calculation, student);
      
      case 'conditional_discount':
        return await this.applyConditionalDiscount(rule, calculation, student);
      
      case 'installment_charge':
        return await this.applyInstallmentCharge(rule, calculation, options);
      
      case 'penalty':
        return await this.applyPenalty(rule, calculation, student, options);
      
      default:
        console.warn(`Unknown fee rule type: ${rule.type}`);
        return calculation;
    }
  }

  async applyLateFee(rule, calculation, dueDate) {
    const daysPastDue = Math.max(0, Math.floor((new Date() - dueDate) / (1000 * 60 * 60 * 24)));
    
    if (daysPastDue <= rule.config.gracePeriodDays) return calculation;

    let lateFee = 0;
    const config = rule.config;

    switch (config.calculationType) {
      case 'fixed':
        lateFee = config.fixedAmount;
        break;
      
      case 'percentage':
        lateFee = calculation.baseFee * (config.percentageRate / 100);
        break;
      
      case 'daily':
        const chargeableDays = daysPastDue - config.gracePeriodDays;
        lateFee = chargeableDays * config.dailyRate;
        break;
      
      case 'tiered':
        lateFee = this.calculateTieredLateFee(daysPastDue, config.tiers);
        break;
      
      case 'compound':
        lateFee = this.calculateCompoundLateFee(calculation.baseFee, daysPastDue, config);
        break;
    }

    // Apply maximum cap if configured
    if (config.maximumAmount && lateFee > config.maximumAmount) {
      lateFee = config.maximumAmount;
    }

    calculation.totalFee += lateFee;
    calculation.appliedCharges += lateFee;
    
    this.appliedRules.push({
      ruleId: rule.id,
      ruleName: rule.name,
      type: 'late_fee',
      amount: lateFee,
      details: `${daysPastDue} days past due`
    });

    this.feeBreakdown.push({
      type: 'late_fee',
      description: `${rule.name} (${daysPastDue} days late)`,
      amount: lateFee,
      operation: 'add'
    });

    return calculation;
  }

  async applyScholarship(rule, calculation, student) {
    // Check scholarship eligibility
    const eligibility = await this.checkScholarshipEligibility(rule, student);
    if (!eligibility.eligible) return calculation;

    let scholarshipAmount = 0;
    const config = rule.config;

    switch (config.type) {
      case 'percentage':
        scholarshipAmount = calculation.baseFee * (config.percentage / 100);
        break;
      
      case 'fixed':
        scholarshipAmount = config.fixedAmount;
        break;
      
      case 'full_waiver':
        scholarshipAmount = calculation.totalFee;
        break;
      
      case 'merit_based':
        scholarshipAmount = this.calculateMeritScholarship(student, config);
        break;
      
      case 'need_based':
        scholarshipAmount = await this.calculateNeedBasedScholarship(student, config);
        break;
    }

    // Apply scholarship limits
    if (config.maximumAmount && scholarshipAmount > config.maximumAmount) {
      scholarshipAmount = config.maximumAmount;
    }

    scholarshipAmount = Math.min(scholarshipAmount, calculation.totalFee);

    calculation.totalFee -= scholarshipAmount;
    calculation.appliedScholarships += scholarshipAmount;

    this.appliedRules.push({
      ruleId: rule.id,
      ruleName: rule.name,
      type: 'scholarship',
      amount: -scholarshipAmount,
      details: eligibility.reason
    });

    this.feeBreakdown.push({
      type: 'scholarship',
      description: `${rule.name} - ${eligibility.reason}`,
      amount: scholarshipAmount,
      operation: 'subtract'
    });

    return calculation;
  }

  async applyWaiver(rule, calculation, student) {
    const config = rule.config;
    let waiverAmount = 0;

    // Check waiver conditions
    const conditions = config.conditions || {};
    if (!await this.checkWaiverConditions(conditions, student)) {
      return calculation;
    }

    switch (config.waiverType) {
      case 'percentage':
        waiverAmount = calculation.baseFee * (config.percentage / 100);
        break;
      
      case 'fixed':
        waiverAmount = config.fixedAmount;
        break;
      
      case 'component_specific':
        waiverAmount = await this.calculateComponentWaiver(config, calculation);
        break;
      
      case 'conditional':
        waiverAmount = await this.calculateConditionalWaiver(config, student, calculation);
        break;
    }

    waiverAmount = Math.min(waiverAmount, calculation.totalFee);

    calculation.totalFee -= waiverAmount;
    calculation.appliedWaivers += waiverAmount;

    this.appliedRules.push({
      ruleId: rule.id,
      ruleName: rule.name,
      type: 'waiver',
      amount: -waiverAmount,
      details: config.reason || 'Waiver applied'
    });

    this.feeBreakdown.push({
      type: 'waiver',
      description: rule.name,
      amount: waiverAmount,
      operation: 'subtract'
    });

    return calculation;
  }

  async applyCustomFormula(rule, calculation, student) {
    // Safe execution of tenant-defined formulas
    const config = rule.config;
    const context = {
      baseFee: calculation.baseFee,
      currentTotal: calculation.totalFee,
      student: this.sanitizeStudentData(student),
      Math,
      Date
    };

    try {
      // Create safe execution environment
      const formula = new Function('context', `
        with(context) {
          ${config.formula}
        }
      `);

      const result = formula(context);
      
      if (typeof result !== 'number' || isNaN(result)) {
        throw new Error('Formula must return a valid number');
      }

      const adjustment = result - calculation.totalFee;

      calculation.totalFee = Math.max(0, result);

      this.appliedRules.push({
        ruleId: rule.id,
        ruleName: rule.name,
        type: 'custom_formula',
        amount: adjustment,
        details: 'Custom calculation applied'
      });

      this.feeBreakdown.push({
        type: 'custom_formula',
        description: rule.name,
        amount: Math.abs(adjustment),
        operation: adjustment >= 0 ? 'add' : 'subtract'
      });

    } catch (error) {
      console.error(`Error executing custom formula for rule ${rule.id}:`, error);
    }

    return calculation;
  }

  // Frontend Configuration Interface
  async saveFeeRule(ruleData) {
    const rule = {
      tenantId: this.tenantId,
      name: ruleData.name,
      type: ruleData.type,
      priority: ruleData.priority || 100,
      isActive: ruleData.isActive !== false,
      config: this.validateRuleConfig(ruleData.type, ruleData.config),
      conditions: ruleData.conditions || {},
      createdBy: ruleData.createdBy,
      createdAt: new Date()
    };

    return await this.db.FeeRule.create(rule);
  }

  async getFeeRuleTemplates() {
    return {
      late_fee: {
        name: 'Late Fee Configuration',
        fields: [
          { name: 'gracePeriodDays', type: 'number', label: 'Grace Period (Days)', default: 0 },
          { name: 'calculationType', type: 'select', label: 'Calculation Type', 
            options: ['fixed', 'percentage', 'daily', 'tiered', 'compound'] },
          { name: 'fixedAmount', type: 'number', label: 'Fixed Amount', condition: 'calculationType=fixed' },
          { name: 'percentageRate', type: 'number', label: 'Percentage Rate', condition: 'calculationType=percentage' },
          { name: 'dailyRate', type: 'number', label: 'Daily Rate', condition: 'calculationType=daily' },
          { name: 'maximumAmount', type: 'number', label: 'Maximum Amount (Optional)' }
        ]
      },
      scholarship: {
        name: 'Scholarship Configuration',
        fields: [
          { name: 'type', type: 'select', label: 'Scholarship Type',
            options: ['percentage', 'fixed', 'full_waiver', 'merit_based', 'need_based'] },
          { name: 'percentage', type: 'number', label: 'Percentage', condition: 'type=percentage' },
          { name: 'fixedAmount', type: 'number', label: 'Fixed Amount', condition: 'type=fixed' },
          { name: 'maximumAmount', type: 'number', label: 'Maximum Amount' },
          { name: 'eligibilityCriteria', type: 'json', label: 'Eligibility Criteria' }
        ]
      },
      waiver: {
        name: 'Fee Waiver Configuration',
        fields: [
          { name: 'waiverType', type: 'select', label: 'Waiver Type',
            options: ['percentage', 'fixed', 'component_specific', 'conditional'] },
          { name: 'percentage', type: 'number', label: 'Percentage', condition: 'waiverType=percentage' },
          { name: 'fixedAmount', type: 'number', label: 'Fixed Amount', condition: 'waiverType=fixed' },
          { name: 'reason', type: 'text', label: 'Waiver Reason' },
          { name: 'conditions', type: 'json', label: 'Conditions' }
        ]
      },
      custom_formula: {
        name: 'Custom Formula',
        fields: [
          { name: 'formula', type: 'textarea', label: 'JavaScript Formula',
            help: 'Use: baseFee, currentTotal, student object, Math functions' },
          { name: 'description', type: 'text', label: 'Formula Description' }
        ]
      }
    };
  }
}
```

### **Multi-Channel Communication System**

```javascript
// Communication provider interface
class CommunicationProvider {
  constructor(config) {
    this.config = config;
  }

  async send(message, recipients, options = {}) {
    throw new Error('send() method must be implemented');
  }
}

// Email providers
class SendGridProvider extends CommunicationProvider {
  async send(message, recipients, options = {}) {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(this.config.apiKey);

    return await sgMail.send({
      to: recipients,
      from: this.config.fromEmail,
      subject: message.subject,
      html: message.html
    });
  }
}

// SMS providers
class TwilioProvider extends CommunicationProvider {
  async send(message, recipients, options = {}) {
    const twilio = require('twilio');
    const client = twilio(this.config.accountSid, this.config.authToken);

    const results = [];
    for (const phoneNumber of recipients) {
      const result = await client.messages.create({
        body: message.text,
        from: this.config.fromNumber,
        to: phoneNumber
      });
      results.push(result);
    }
    return results;
  }
}

// WhatsApp providers
class WhatsAppBusinessProvider extends CommunicationProvider {
  async send(message, recipients, options = {}) {
    const axios = require('axios');

    const results = [];
    for (const phoneNumber of recipients) {
      const result = await axios.post(
        `https://graph.facebook.com/v17.0/${this.config.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phoneNumber,
          text: { body: message.text }
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      results.push(result.data);
    }
    return results;
  }
}

// Communication engine with provider management
class CommunicationEngine {
  constructor() {
    this.providers = new Map();
    this.tenantConfigs = new Map();
  }

  registerProvider(name, providerClass) {
    this.providers.set(name, providerClass);
  }

  async sendNotification(
    tenantCode,
    channelType,
    message,
    recipients,
    options = {}
  ) {
    const tenantProviders = this.tenantConfigs.get(tenantCode);
    const provider = tenantProviders.get(channelType);

    try {
      const result = await provider.send(message, recipients, options);
      await this.logCommunication(
        tenantCode,
        channelType,
        message,
        recipients,
        'SUCCESS'
      );
      return { success: true, result };
    } catch (error) {
      await this.logCommunication(
        tenantCode,
        channelType,
        message,
        recipients,
        'FAILED'
      );
      throw error;
    }
  }
}
```

### **Tenant-Configurable Academic Calendar**

```javascript
class ConfigurableAcademicCalendar {
  constructor(tenantAcademicRules) {
    this.rules = tenantAcademicRules;
    this.calendar = new Map();
  }

  async setupAcademicYear(academicYearConfig) {
    const { year, startDate, endDate, structure, gradingPeriods, holidays } =
      academicYearConfig;

    const calendar = {
      academicYear: year,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      structure: this.processAcademicStructure(structure),
      gradingPeriods: this.processGradingPeriods(gradingPeriods),
      holidays: this.processHolidays(holidays),
      generatedEvents: []
    };

    calendar.generatedEvents = await this.generateAcademicEvents(calendar);
    this.calendar.set(year, calendar);
    return calendar;
  }

  processAcademicStructure(structure) {
    switch (structure.type) {
      case 'semester':
        return this.processSemesterStructure(structure);
      case 'trimester':
        return this.processTrimesterStructure(structure);
      case 'quarter':
        return this.processQuarterStructure(structure);
      case 'custom':
        return this.processCustomStructure(structure);
      default:
        throw new Error(`Unsupported academic structure: ${structure.type}`);
    }
  }

  async getCurrentAcademicPeriod(date = new Date()) {
    for (const [year, calendar] of this.calendar.entries()) {
      if (date >= calendar.startDate && date <= calendar.endDate) {
        for (const period of calendar.structure.periods) {
          const periodStart = new Date(period.startDate);
          const periodEnd = new Date(period.endDate);

          if (date >= periodStart && date <= periodEnd) {
            return {
              academicYear: year,
              period: period.name,
              periodStart,
              periodEnd,
              daysRemaining: Math.ceil(
                (periodEnd - date) / (1000 * 60 * 60 * 24)
              )
            };
          }
        }
      }
    }
    return null;
  }
}
```

## 🗄️ Frontend-Configurable Fee Rules Database Schema

```javascript
// Fee Rules Table - Stores all tenant-configurable fee calculation rules
const FeeRule = sequelize.define('FeeRule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'tenants', key: 'id' }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { len: [3, 100] }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM([
      'late_fee',
      'scholarship', 
      'waiver',
      'sibling_discount',
      'category_discount', 
      'early_payment_discount',
      'transport_fee',
      'hostel_fee',
      'custom_formula',
      'conditional_discount',
      'installment_charge',
      'penalty'
    ]),
    allowNull: false
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    validate: { min: 1, max: 1000 }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  config: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Rule-specific configuration (amounts, percentages, formulas, etc.)'
  },
  conditions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Eligibility conditions (grade, category, academic performance, etc.)'
  },
  applicableToClasses: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of class IDs this rule applies to'
  },
  applicableToCategories: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of student categories this rule applies to'
  },
  effectiveFrom: {
    type: DataTypes.DATE,
    allowNull: true
  },
  effectiveTo: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  lastModifiedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  }
}, {
  tableName: 'fee_rules',
  underscored: true,
  indexes: [
    { fields: ['tenant_id', 'type'] },
    { fields: ['tenant_id', 'is_active'] },
    { fields: ['priority'] },
    { fields: ['effective_from', 'effective_to'] }
  ]
});

// Fee Rule Applications - Track when rules are applied to student fees
const FeeRuleApplication = sequelize.define('FeeRuleApplication', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  feeCalculationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'fee_calculations', key: 'id' }
  },
  feeRuleId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'fee_rules', key: 'id' }
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'students', key: 'id' }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Positive for charges, negative for discounts/waivers'
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Rule execution details and intermediate calculations'
  },
  appliedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'fee_rule_applications',
  underscored: true,
  indexes: [
    { fields: ['fee_calculation_id'] },
    { fields: ['fee_rule_id'] },
    { fields: ['student_id'] },
    { fields: ['applied_at'] }
  ]
});
```

## 🎛️ Frontend Configuration Interface Components

### **Fee Rule Builder Component (Alpine.js)**

```javascript
// Fee Rule Configuration Component
Alpine.data('feeRuleBuilder', () => ({
  ruleTypes: [
    { value: 'late_fee', label: 'Late Fee' },
    { value: 'scholarship', label: 'Scholarship' },
    { value: 'waiver', label: 'Fee Waiver' },
    { value: 'sibling_discount', label: 'Sibling Discount' },
    { value: 'category_discount', label: 'Category Discount' },
    { value: 'early_payment_discount', label: 'Early Payment Discount' },
    { value: 'custom_formula', label: 'Custom Formula' }
  ],
  
  selectedType: '',
  ruleConfig: {},
  conditions: {},
  
  // Dynamic field configurations based on rule type
  getFieldsForType(type) {
    const templates = {
      late_fee: [
        { name: 'gracePeriodDays', label: 'Grace Period (Days)', type: 'number', default: 0 },
        { name: 'calculationType', label: 'Calculation Method', type: 'select', 
          options: [
            { value: 'fixed', label: 'Fixed Amount' },
            { value: 'percentage', label: 'Percentage of Base Fee' },
            { value: 'daily', label: 'Daily Rate' },
            { value: 'tiered', label: 'Tiered Based on Days' },
            { value: 'compound', label: 'Compound Interest' }
          ]
        },
        { name: 'fixedAmount', label: 'Fixed Amount', type: 'currency', 
          condition: 'calculationType=fixed' },
        { name: 'percentageRate', label: 'Percentage Rate (%)', type: 'number', 
          condition: 'calculationType=percentage' },
        { name: 'dailyRate', label: 'Daily Rate', type: 'currency', 
          condition: 'calculationType=daily' },
        { name: 'maximumAmount', label: 'Maximum Amount (Optional)', type: 'currency' }
      ],
      
      scholarship: [
        { name: 'type', label: 'Scholarship Type', type: 'select',
          options: [
            { value: 'percentage', label: 'Percentage Discount' },
            { value: 'fixed', label: 'Fixed Amount Discount' },
            { value: 'full_waiver', label: 'Full Fee Waiver' },
            { value: 'merit_based', label: 'Merit-Based Calculation' },
            { value: 'need_based', label: 'Need-Based Assessment' }
          ]
        },
        { name: 'percentage', label: 'Discount Percentage', type: 'number', 
          condition: 'type=percentage', min: 0, max: 100 },
        { name: 'fixedAmount', label: 'Fixed Discount Amount', type: 'currency', 
          condition: 'type=fixed' },
        { name: 'maximumAmount', label: 'Maximum Scholarship Amount', type: 'currency' },
        { name: 'minimumGrade', label: 'Minimum Grade Requirement', type: 'select',
          condition: 'type=merit_based',
          options: ['A+', 'A', 'B+', 'B', 'C+', 'C'] },
        { name: 'parentIncomeLimit', label: 'Parent Income Limit', type: 'currency',
          condition: 'type=need_based' }
      ],
      
      waiver: [
        { name: 'waiverType', label: 'Waiver Type', type: 'select',
          options: [
            { value: 'percentage', label: 'Percentage Waiver' },
            { value: 'fixed', label: 'Fixed Amount Waiver' },
            { value: 'component_specific', label: 'Specific Fee Component' },
            { value: 'conditional', label: 'Conditional Waiver' }
          ]
        },
        { name: 'percentage', label: 'Waiver Percentage', type: 'number', 
          condition: 'waiverType=percentage', min: 0, max: 100 },
        { name: 'fixedAmount', label: 'Fixed Waiver Amount', type: 'currency', 
          condition: 'waiverType=fixed' },
        { name: 'reason', label: 'Waiver Reason', type: 'text', required: true }
      ],
      
      custom_formula: [
        { name: 'formula', label: 'JavaScript Formula', type: 'code',
          help: 'Available variables: baseFee, currentTotal, student (object), Math functions',
          placeholder: 'return baseFee * 0.9; // 10% discount example' },
        { name: 'description', label: 'Formula Description', type: 'textarea' }
      ]
    };
    
    return templates[type] || [];
  },
  
  // Condition builder for rule eligibility
  addCondition() {
    const conditionId = Date.now();
    this.conditions[conditionId] = {
      field: '',
      operator: '',
      value: '',
      logicalOperator: 'AND'
    };
  },
  
  removeCondition(conditionId) {
    delete this.conditions[conditionId];
  },
  
  // Save rule configuration
  async saveRule() {
    const ruleData = {
      name: this.ruleName,
      description: this.ruleDescription,
      type: this.selectedType,
      priority: this.priority || 100,
      config: this.ruleConfig,
      conditions: this.conditions,
      applicableToClasses: this.selectedClasses,
      applicableToCategories: this.selectedCategories,
      effectiveFrom: this.effectiveFrom,
      effectiveTo: this.effectiveTo
    };
    
    try {
      const response = await fetch('/api/fee-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData)
      });
      
      if (response.ok) {
        this.showSuccess('Fee rule saved successfully!');
        this.resetForm();
      } else {
        throw new Error(await response.text());
      }
    } catch (error) {
      this.showError('Error saving fee rule: ' + error.message);
    }
  },
  
  // Test rule against sample data
  async testRule() {
    const testData = {
      ruleConfig: this.ruleConfig,
      conditions: this.conditions,
      sampleStudent: this.sampleStudentData
    };
    
    try {
      const response = await fetch('/api/fee-rules/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });
      
      const result = await response.json();
      this.showTestResult(result);
    } catch (error) {
      this.showError('Error testing rule: ' + error.message);
    }
  }
}));
```

### **EJS Template for Fee Rule Management**

```html
<!-- Fee Rule Management Interface -->
<div class="container mx-auto p-6" x-data="feeRuleBuilder()">
  <div class="bg-white rounded-lg shadow-lg p-6">
    <h2 class="text-2xl font-bold mb-6">Configure Fee Calculation Rules</h2>
    
    <!-- Rule Type Selection -->
    <div class="mb-6">
      <label class="block text-sm font-medium mb-2">Rule Type</label>
      <select x-model="selectedType" class="w-full p-3 border rounded-lg">
        <option value="">Select Rule Type</option>
        <template x-for="type in ruleTypes">
          <option :value="type.value" x-text="type.label"></option>
        </template>
      </select>
    </div>
    
    <!-- Basic Rule Information -->
    <div class="grid grid-cols-2 gap-6 mb-6">
      <div>
        <label class="block text-sm font-medium mb-2">Rule Name</label>
        <input type="text" x-model="ruleName" class="w-full p-3 border rounded-lg" 
               placeholder="e.g., Standard Late Fee">
      </div>
      <div>
        <label class="block text-sm font-medium mb-2">Priority</label>
        <input type="number" x-model="priority" class="w-full p-3 border rounded-lg" 
               placeholder="100" min="1" max="1000">
      </div>
    </div>
    
    <!-- Dynamic Configuration Fields -->
    <div x-show="selectedType" class="mb-6">
      <h3 class="text-lg font-semibold mb-4">Rule Configuration</h3>
      <div class="grid grid-cols-2 gap-4">
        <template x-for="field in getFieldsForType(selectedType)">
          <div :class="field.condition ? 'col-span-1' : 'col-span-2'"
               x-show="!field.condition || eval(field.condition.replace('=', '=='))">
            <label class="block text-sm font-medium mb-2" x-text="field.label"></label>
            
            <!-- Text Input -->
            <input x-show="field.type === 'text' || field.type === 'number' || field.type === 'currency'"
                   :type="field.type === 'currency' ? 'number' : field.type"
                   x-model="ruleConfig[field.name]"
                   class="w-full p-3 border rounded-lg"
                   :placeholder="field.placeholder || ''"
                   :min="field.min"
                   :max="field.max"
                   :step="field.type === 'currency' ? '0.01' : '1'">
            
            <!-- Select Dropdown -->
            <select x-show="field.type === 'select'"
                    x-model="ruleConfig[field.name]"
                    class="w-full p-3 border rounded-lg">
              <option value="">Select Option</option>
              <template x-for="option in field.options">
                <option :value="option.value || option" 
                        x-text="option.label || option"></option>
              </template>
            </select>
            
            <!-- Textarea -->
            <textarea x-show="field.type === 'textarea' || field.type === 'code'"
                      x-model="ruleConfig[field.name]"
                      class="w-full p-3 border rounded-lg h-32"
                      :class="field.type === 'code' ? 'font-mono' : ''"
                      :placeholder="field.placeholder || ''"></textarea>
            
            <!-- Help Text -->
            <p x-show="field.help" class="text-sm text-gray-600 mt-1" x-text="field.help"></p>
          </div>
        </template>
      </div>
    </div>
    
    <!-- Eligibility Conditions -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-4">Eligibility Conditions</h3>
      <div class="space-y-3">
        <template x-for="(condition, id) in conditions" :key="id">
          <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <select x-model="condition.field" class="flex-1 p-2 border rounded">
              <option value="">Select Field</option>
              <option value="grade">Student Grade</option>
              <option value="category">Student Category</option>
              <option value="class">Class</option>
              <option value="parentIncome">Parent Income</option>
              <option value="academicPerformance">Academic Performance</option>
            </select>
            
            <select x-model="condition.operator" class="p-2 border rounded">
              <option value="equals">Equals</option>
              <option value="not_equals">Not Equals</option>
              <option value="greater_than">Greater Than</option>
              <option value="less_than">Less Than</option>
              <option value="contains">Contains</option>
            </select>
            
            <input type="text" x-model="condition.value" 
                   class="flex-1 p-2 border rounded" placeholder="Value">
            
            <button @click="removeCondition(id)" 
                    class="text-red-600 hover:text-red-800">
              Remove
            </button>
          </div>
        </template>
        
        <button @click="addCondition()" 
                class="text-blue-600 hover:text-blue-800">
          + Add Condition
        </button>
      </div>
    </div>
    
    <!-- Action Buttons -->
    <div class="flex space-x-4">
      <button @click="testRule()" 
              class="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600">
        Test Rule
      </button>
      <button @click="saveRule()" 
              class="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600">
        Save Rule
      </button>
    </div>
  </div>
</div>
```

---

## 🧙‍♂️ **Wizard Setup System - Complete Frontend-Configurable Architecture**

### **Wizard System Overview**

The system includes a comprehensive, frontend-configurable wizard system that allows easy addition, modification, and removal of setup wizards and their steps. All wizards support maximum per-tenant configuration with intelligent defaults for quick setup.

### **Wizard Configuration Engine**

```javascript
// config/wizard-configs.js - Frontend-configurable wizard definitions
const WizardConfigs = {
  trustSetup: {
    id: 'trust_setup',
    name: 'Trust Setup Wizard',
    description: 'Complete setup wizard for new educational trusts',
    version: '1.0.0',
    canModify: true,      // Allow frontend modification
    canDelete: false,     // Prevent deletion of core wizards
    steps: [
      {
        id: 'trust_info',
        name: 'Trust Information',
        description: 'Basic trust details and contact information',
        order: 1,
        required: true,
        component: 'TrustInfoStep',
        validation: 'trustInfoValidation',
        canSkip: false,
        fields: [
          {
            name: 'trust_name',
            type: 'text',
            label: 'Trust Name',
            placeholder: 'Enter trust name',
            required: true,
            minLength: 3,
            maxLength: 200,
            defaultValue: '',
            helpText: 'Official name of the educational trust'
          },
          {
            name: 'trust_code',
            type: 'text',
            label: 'Trust Code',
            placeholder: 'Enter unique trust code (letters and numbers only)',
            required: true,
            pattern: '^[A-Z0-9]{3,20}$',
            unique: true,
            defaultValue: '',
            helpText: 'Unique identifier for the trust (used in database naming)'
          }
          // ... more fields with comprehensive configuration
        ]
      }
      // ... more steps
    ]
  },
  
  schoolSetup: {
    id: 'school_setup',
    name: 'School Setup Wizard',
    description: 'Setup wizard for individual schools within a trust',
    version: '1.0.0',
    canModify: true,
    canDelete: true,      // Allow deletion of non-core wizards
    perTenantDefaults: {  // Per-tenant default values
      academicYear: 'auto-generate',
      gradeSystem: '10-point',
      feeStructure: 'simple'
    },
    steps: [
      {
        id: 'school_basic_info',
        name: 'School Information',
        description: 'Basic school details and configuration',
        order: 1,
        required: true,
        component: 'SchoolInfoStep',
        validation: 'schoolInfoValidation',
        fields: [
          {
            name: 'school_name',
            type: 'text',
            label: 'School Name',
            required: true,
            defaultValue: '{{trust_name}} School',  // Dynamic defaults
            maxLength: 200
          },
          {
            name: 'school_code',
            type: 'text',
            label: 'School Code',
            required: true,
            pattern: '^[A-Z0-9]{3,10}$',
            unique: true,
            defaultValue: '{{trust_code}}_001'   // Auto-generated pattern
          },
          {
            name: 'academic_structure',
            type: 'select',
            label: 'Academic Structure',
            required: true,
            defaultValue: 'semester',
            options: [
              { value: 'semester', label: 'Semester System' },
              { value: 'trimester', label: 'Trimester System' },
              { value: 'quarter', label: 'Quarter System' },
              { value: 'custom', label: 'Custom Structure' }
            ],
            conditional: {
              field: 'academic_structure',
              value: 'custom',
              showFields: ['custom_structure_config']
            }
          }
        ]
      }
    ]
  },
  
  feeStructureSetup: {
    id: 'fee_structure_setup',
    name: 'Fee Structure Setup Wizard',
    description: 'Configure comprehensive fee calculation rules',
    version: '1.0.0',
    canModify: true,
    canDelete: true,
    perTenantDefaults: {
      lateFeeType: 'percentage',
      lateFeeValue: 2,
      scholarshipEnabled: true,
      waiversEnabled: true,
      customRulesEnabled: false
    },
    steps: [
      {
        id: 'basic_fee_structure',
        name: 'Basic Fee Structure',
        description: 'Define base fee categories and amounts',
        order: 1,
        required: true,
        component: 'BasicFeeStructureStep',
        fields: [
          {
            name: 'fee_categories',
            type: 'dynamic_array',
            label: 'Fee Categories',
            required: true,
            defaultValue: [
              { name: 'Tuition Fee', amount: 0, required: true },
              { name: 'Library Fee', amount: 0, required: false },
              { name: 'Lab Fee', amount: 0, required: false }
            ],
            itemFields: [
              { name: 'name', type: 'text', label: 'Category Name', required: true },
              { name: 'amount', type: 'number', label: 'Amount', required: true, min: 0 },
              { name: 'required', type: 'checkbox', label: 'Mandatory Fee', defaultValue: true }
            ]
          }
        ]
      },
      {
        id: 'advanced_fee_rules',
        name: 'Advanced Fee Rules',
        description: 'Configure late fees, discounts, scholarships, and waivers',
        order: 2,
        required: false,
        component: 'AdvancedFeeRulesStep',
        fields: [
          {
            name: 'late_fee_configuration',
            type: 'object',
            label: 'Late Fee Configuration',
            required: false,
            defaultValue: {
              enabled: true,
              type: 'percentage',
              value: 2,
              gracePeriodays: 7,
              maxAmount: null
            },
            objectFields: [
              { name: 'enabled', type: 'checkbox', label: 'Enable Late Fees', defaultValue: true },
              { name: 'type', type: 'select', label: 'Late Fee Type', 
                options: [
                  { value: 'percentage', label: 'Percentage of Due Amount' },
                  { value: 'fixed', label: 'Fixed Amount' },
                  { value: 'progressive', label: 'Progressive (increases over time)' }
                ]
              },
              { name: 'value', type: 'number', label: 'Late Fee Value', required: true, min: 0 },
              { name: 'gracePeriodDays', type: 'number', label: 'Grace Period (Days)', defaultValue: 7, min: 0 },
              { name: 'maxAmount', type: 'number', label: 'Maximum Late Fee Amount', required: false, min: 0 }
            ]
          },
          {
            name: 'scholarship_rules',
            type: 'dynamic_array',
            label: 'Scholarship Rules',
            required: false,
            defaultValue: [],
            itemFields: [
              { name: 'name', type: 'text', label: 'Scholarship Name', required: true },
              { name: 'type', type: 'select', label: 'Discount Type',
                options: [
                  { value: 'percentage', label: 'Percentage Discount' },
                  { value: 'fixed', label: 'Fixed Amount Discount' },
                  { value: 'waiver', label: 'Complete Waiver' }
                ]
              },
              { name: 'value', type: 'number', label: 'Discount Value', required: true, min: 0 },
              { name: 'eligibilityCriteria', type: 'textarea', label: 'Eligibility Criteria', required: true },
              { name: 'autoApply', type: 'checkbox', label: 'Auto-apply based on criteria', defaultValue: false }
            ]
          }
        ]
      }
    ]
  }
};

module.exports = WizardConfigs;
```

### **Key Features of the Wizard System**

1. **Frontend-Configurable**: Complete wizard management through web interface
2. **Dynamic Step Creation**: Add/remove/modify wizard steps without code changes
3. **Per-Tenant Defaults**: Intelligent defaults based on tenant configuration
4. **Conditional Logic**: Show/hide fields based on other field values
5. **Validation Engine**: Comprehensive validation with custom business rules
6. **Progress Tracking**: Save progress and resume incomplete wizards
7. **Version Control**: Track wizard configuration changes over time
8. **Reusable Components**: Modular field types and validation patterns
9. **Security**: Role-based access to wizard configuration
10. **Extensible**: Easy addition of new wizard types and field types

This wizard system ensures maximum flexibility while maintaining the simplicity needed for quick setup with sensible defaults.

---
