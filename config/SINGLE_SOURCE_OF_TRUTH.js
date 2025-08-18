/**
 * SINGLE SOURCE OF TRUTH - All Q&A Technical Decisions (FINAL)
 *
 * This file contains ALL 56 technical decisions made during the Q&A process.
 * NO OTHER configuration should override these decisions.
 *
 * @author School ERP Team
 * @date 2025-08-18
 * @version FINAL
 */

const TECHNICAL_DECISIONS = {
  // =================================================================
  // CORE TECHNOLOGY STACK (Q1-Q10) - IMMUTABLE
  // =================================================================

  Q1_DATABASE_ACCESS: {
    decision: 'Sequelize ORM (not raw mysql2)',
    implementation: 'sequelize.define()',
    forbidden: ['raw SQL', 'mysql2 direct', 'other ORMs'],
    enforced: true
  },

  Q2_MODULE_SYSTEM: {
    decision: 'CommonJS only (require/module.exports)',
    implementation: 'const module = require("path")',
    forbidden: ['import/export', 'ES6 modules', 'TypeScript'],
    enforced: true
  },

  Q3_CSS_FRAMEWORK: {
    decision: 'Tailwind CSS only',
    implementation: 'CDN via HTML',
    forbidden: ['Bootstrap', 'custom CSS frameworks', 'CSS-in-JS'],
    enforced: true
  },

  Q4_DATABASE_MIGRATIONS: {
    decision: 'Sequelize CLI with migration files',
    implementation: 'npx sequelize-cli migration:generate',
    forbidden: ['manual SQL scripts', 'other migration tools'],
    enforced: true
  },

  Q5_MULTI_TENANT_STRATEGY: {
    decision: 'Separate databases per tenant',
    implementation: 'school_erp_trust_{trustCode}',
    forbidden: ['shared database', 'schema separation', 'table prefixes'],
    enforced: true
  },

  Q6_SESSION_MANAGEMENT: {
    decision: 'Express sessions with MySQL store',
    implementation: 'express-mysql-session',
    forbidden: ['JWT tokens', 'Redis sessions', 'memory sessions'],
    enforced: true
  },

  Q7_API_ARCHITECTURE: {
    decision: 'MVC with EJS views + JSON API endpoints',
    implementation: 'EJS templates + /api/v1/ routes',
    forbidden: ['SPA only', 'GraphQL', 'gRPC'],
    enforced: true
  },

  Q8_VALIDATION_STRATEGY: {
    decision: 'Joi + Sequelize validations + custom business rules',
    implementation: 'Joi schemas within models',
    forbidden: ['express-validator only', 'custom validation only'],
    enforced: true
  },

  Q9_LOGGING_FRAMEWORK: {
    decision: 'Winston + centralized error handler + structured logging',
    implementation: 'winston.createLogger()',
    forbidden: ['console.log', 'other logging libraries'],
    enforced: true
  },

  Q10_DEPLOYMENT_ENVIRONMENT: {
    decision: 'Cloud MySQL + local Node.js',
    implementation: 'Remote database, local application',
    forbidden: ['local MySQL', 'Docker containers'],
    enforced: true
  },

  // =================================================================
  // DATABASE ARCHITECTURE (Q11-Q18) - IMMUTABLE
  // =================================================================

  Q11_CONNECTION_POOLING: {
    decision: 'Moderate connection pooling',
    implementation: { max: 15, min: 2, acquire: 60000, idle: 300000 },
    forbidden: ['high pooling', 'no pooling', 'aggressive pooling'],
    enforced: true
  },

  Q12_MODEL_PATTERN: {
    decision: 'Direct sequelize.define() calls (not class-based)',
    implementation: 'sequelize.define("ModelName", {...})',
    forbidden: ['class extends Model', 'decorators'],
    enforced: true
  },

  Q13_ASSOCIATIONS: {
    decision: 'Inline associations with model definition',
    implementation: 'Model.associate = (models) => {...}',
    forbidden: ['separate association files', 'decorators'],
    enforced: true
  },

  Q14_PRIMARY_KEYS: {
    decision: 'Mixed PKs: UUIDs for sensitive data, integers for lookup tables',
    implementation: 'UUID v4 for users/students, AUTO_INCREMENT for roles/classes',
    forbidden: ['all UUIDs', 'all integers'],
    enforced: true
  },

  Q15_TIMESTAMP_FIELDS: {
    decision: 'Custom timestamp fields (created_at, updated_at, deleted_at)',
    implementation: 'timestamps: true, paranoid: true',
    forbidden: ['createdAt/updatedAt', 'no timestamps'],
    enforced: true
  },

  Q16_NAMING_CONVENTION: {
    decision: 'Snake_case database, camelCase JavaScript (underscored: true)',
    implementation: 'underscored: true in Sequelize',
    forbidden: ['camelCase database', 'snake_case JavaScript'],
    enforced: true
  },

  Q17_PASSWORD_SECURITY: {
    decision: 'bcryptjs with salt rounds 12',
    implementation: 'bcrypt.hash(password, 12)',
    forbidden: ['other hashing', 'plain text', 'different salt rounds'],
    enforced: true
  },

  Q18_SESSION_CONFIGURATION: {
    decision: 'Environment-based session configuration',
    implementation: 'Different settings per environment',
    forbidden: ['hardcoded session config'],
    enforced: true
  },

  // =================================================================
  // VALIDATION & SECURITY (Q19-Q21, Q33, Q49-Q51) - IMMUTABLE
  // =================================================================

  Q19_VALIDATION_SCHEMAS: {
    decision: 'Validation schemas within model files',
    implementation: 'Joi schemas in same file as Sequelize model',
    forbidden: ['separate validation files', 'no validation'],
    enforced: true
  },

  Q20_INPUT_SANITIZATION: {
    decision: 'Joi transforms with custom sanitizers',
    implementation: 'Joi.string().trim().replace()',
    forbidden: ['no sanitization', 'express-validator only'],
    enforced: true
  },

  Q21_ERROR_RESPONSES: {
    decision: 'Structured error responses with error codes and timestamps',
    implementation: '{ success: false, error: {...}, code: "...", timestamp: "..." }',
    forbidden: ['simple error strings', 'no error codes'],
    enforced: true
  },

  Q33_FOREIGN_KEY_HANDLING: {
    decision: 'RESTRICT foreign keys with user-friendly error messages',
    implementation: 'onDelete: "RESTRICT" with custom error handling',
    forbidden: ['CASCADE deletes', 'no foreign keys'],
    enforced: true
  },

  Q49_DATA_ENCRYPTION: {
    decision: 'Application-level encryption for sensitive data only',
    implementation: 'Encrypt PII fields before database storage',
    forbidden: ['database-level encryption', 'no encryption'],
    enforced: true
  },

  Q50_AUDIT_TRAIL: {
    decision: 'Detailed audit trail with before/after change tracking',
    implementation: 'Sequelize hooks + audit_logs table',
    forbidden: ['simple logging', 'no audit trail'],
    enforced: true
  },

  Q51_INPUT_CLEANING: {
    decision: 'Context-aware input sanitization',
    implementation: 'Different sanitization per field type',
    forbidden: ['generic sanitization', 'no sanitization'],
    enforced: true
  },

  // =================================================================
  // AUTHENTICATION & AUTHORIZATION (Q36-Q38) - IMMUTABLE
  // =================================================================

  Q36_ROLE_MANAGEMENT: {
    decision: 'Separate roles table with relationships',
    implementation: 'User belongsTo Role, Role hasMany Permissions',
    forbidden: ['role strings in user table', 'hardcoded roles'],
    enforced: true
  },

  Q37_SESSION_TIMEOUTS: {
    decision: 'Role-based session timeout durations',
    implementation: 'ADMIN: 8hrs, TEACHER: 12hrs, PARENT: 24hrs',
    forbidden: ['single timeout', 'no timeouts'],
    enforced: true
  },

  Q38_PASSWORD_POLICIES: {
    decision: 'Tenant-configurable password policies with simple default',
    implementation: 'Per-tenant password rules, fallback to simple default',
    forbidden: ['global password policy', 'no password policy'],
    enforced: true
  },

  // =================================================================
  // API & FRONTEND (Q22-Q28, Q41-Q43) - IMMUTABLE
  // =================================================================

  Q22_ROUTE_ORGANIZATION: {
    decision: 'Module-based routing with sub-routers',
    implementation: 'Express Router per module',
    forbidden: ['single routes file', 'controller-based routing'],
    enforced: true
  },

  Q23_MIDDLEWARE_CHAIN: {
    decision: 'Security-first middleware chain',
    implementation: 'helmet → cors → rateLimiter → auth → validation',
    forbidden: ['no security middleware', 'different order'],
    enforced: true
  },

  Q24_TENANT_DETECTION: {
    decision: 'Middleware-based tenant detection via subdomain',
    implementation: 'subdomain.domain.com → trustCode',
    forbidden: ['URL parameters', 'headers only'],
    enforced: true
  },

  Q25_LOGGING_CONFIGURATION: {
    decision: 'Winston with multiple transports + daily file rotation',
    implementation: 'winston-daily-rotate-file',
    forbidden: ['single transport', 'no rotation'],
    enforced: true
  },

  Q26_CSS_DELIVERY: {
    decision: 'Tailwind CSS via CDN',
    implementation: '<link href="https://cdn.tailwindcss.com">',
    forbidden: ['local Tailwind', 'build process'],
    enforced: true
  },

  Q27_TEMPLATE_SYSTEM: {
    decision: 'EJS include-based partials with component data passing',
    implementation: '<%- include("partials/header", { data }) %>',
    forbidden: ['other template engines', 'no partials'],
    enforced: true
  },

  Q28_CLIENT_JAVASCRIPT: {
    decision: 'Alpine.js for reactive components',
    implementation: 'x-data, x-show, x-on attributes',
    forbidden: ['React', 'Vue', 'vanilla JS only'],
    enforced: true
  },

  Q41_API_VERSIONING: {
    decision: 'URL path versioning (/api/v1/)',
    implementation: '/api/v1/users, /api/v1/students',
    forbidden: ['header versioning', 'query parameter versioning'],
    enforced: true
  },

  Q42_PAGINATION_STRATEGY: {
    decision: 'Hybrid pagination (offset for small, cursor for large datasets)',
    implementation: 'LIMIT/OFFSET < 10k records, cursor > 10k records',
    forbidden: ['offset only', 'cursor only'],
    enforced: true
  },

  Q43_RATE_LIMITING: {
    decision: 'Endpoint-specific rate limits',
    implementation: 'Different limits per endpoint type',
    forbidden: ['global rate limiting', 'no rate limiting'],
    enforced: true
  },

  // =================================================================
  // FILE HANDLING & STORAGE (Q29-Q32, Q44-Q46) - IMMUTABLE
  // =================================================================

  Q29_CONFIGURATION_FILES: {
    decision: 'JSON config files + .env for secrets only',
    implementation: 'config/development.json + .env',
    forbidden: ['all in .env', 'YAML files', 'JS config files'],
    enforced: true
  },

  Q30_DEVELOPMENT_MIGRATIONS: {
    decision: 'Automatic migrations in development only',
    implementation: 'Auto-run in dev, manual in production',
    forbidden: ['auto migrations in production', 'manual in dev'],
    enforced: true
  },

  Q31_FILE_UPLOADS: {
    decision: 'Multer (local default) + cloud storage option per tenant',
    implementation: 'Multer local + optional S3/Azure per tenant',
    forbidden: ['cloud storage only', 'local storage only'],
    enforced: true
  },

  Q32_CACHING_STRATEGY: {
    decision: 'node-cache for in-memory caching',
    implementation: 'NodeCache with TTL',
    forbidden: ['Redis cache', 'no caching'],
    enforced: true
  },

  Q44_FILE_ORGANIZATION: {
    decision: 'Database-driven file organization',
    implementation: 'File metadata in database',
    forbidden: ['filesystem-only', 'no organization'],
    enforced: true
  },

  Q45_FILE_ACCESS: {
    decision: 'Direct file serving with middleware protection',
    implementation: 'Express static + auth middleware',
    forbidden: ['no protection', 'complex file serving'],
    enforced: true
  },

  Q46_FILE_RESTRICTIONS: {
    decision: 'Tenant-configurable file policies with whitelist default + size limits',
    implementation: 'Per-tenant file rules with safe defaults',
    forbidden: ['global file policy', 'no restrictions'],
    enforced: true
  },

  // =================================================================
  // PERFORMANCE & OPTIMIZATION (Q34-Q35, Q39-Q40, Q47-Q48) - IMMUTABLE
  // =================================================================

  Q34_MIGRATION_STRATEGY: {
    decision: 'Auto-generation in dev, careful manual control in production',
    implementation: 'sequelize-cli in dev, manual review in prod',
    forbidden: ['auto in production', 'manual only'],
    enforced: true
  },

  Q35_MULTI_TENANT_DATABASE: {
    decision: 'Multiple Sequelize instances (one per tenant database)',
    implementation: 'ConnectionManager with tenant-specific instances',
    forbidden: ['single Sequelize instance', 'connection switching'],
    enforced: true
  },

  Q39_VALIDATION_COMPOSITION: {
    decision: 'Composition with shared validation components',
    implementation: 'Reusable Joi schemas',
    forbidden: ['duplicate validation', 'no composition'],
    enforced: true
  },

  Q40_LOCALIZATION: {
    decision: 'Tenant-configurable language, English default',
    implementation: 'i18n per tenant with English fallback',
    forbidden: ['global language', 'no localization'],
    enforced: true
  },

  Q47_QUERY_OPTIMIZATION: {
    decision: 'Smart loading based on data size',
    implementation: 'Eager loading for small sets, lazy for large',
    forbidden: ['always eager', 'always lazy'],
    enforced: true
  },

  Q48_CACHE_INVALIDATION: {
    decision: 'Cache invalidation with tags',
    implementation: 'Tag-based cache clearing',
    forbidden: ['time-based only', 'manual invalidation only'],
    enforced: true
  },

  // =================================================================
  // MONITORING & OPERATIONS (Q52-Q56) - IMMUTABLE
  // =================================================================

  Q52_HEALTH_CHECKS: {
    decision: 'Comprehensive health checks with database/memory/uptime',
    implementation: '/health endpoint with detailed checks',
    forbidden: ['simple ping', 'no health checks'],
    enforced: true
  },

  Q53_METRICS_COLLECTION: {
    decision: 'Detailed metrics collection with categorization',
    implementation: 'Performance, business, system metrics',
    forbidden: ['no metrics', 'basic metrics only'],
    enforced: true
  },

  Q54_ALERTING_SYSTEM: {
    decision: 'Log-based monitoring + email alerts for critical errors',
    implementation: 'Winston + email transport for errors',
    forbidden: ['no alerting', 'SMS only'],
    enforced: true
  },

  Q55_ENVIRONMENT_STRATEGY: {
    decision: 'Single deployment with environment detection',
    implementation: 'NODE_ENV-based configuration',
    forbidden: ['separate deployments', 'manual environment'],
    enforced: true
  },

  Q56_PROCESS_MANAGEMENT: {
    decision: 'PM2 for process management',
    implementation: 'ecosystem.config.js',
    forbidden: ['forever', 'systemd', 'docker'],
    enforced: true
  }
};

// =================================================================
// BUSINESS LOGIC PATTERNS (FINAL) - IMMUTABLE
// =================================================================

const BUSINESS_LOGIC_PATTERNS = {
  FEE_CALCULATION: {
    pattern: 'Tenant-configurable fee calculation engine with frontend rules',
    features: ['late fees', 'scholarships', 'waivers', 'custom formulas', 'frontend configuration'],
    implementation: 'ConfigurableFeeCalculator class with rule engine',
    forbidden: ['hardcoded fee logic', 'single calculation method'],
    enforced: true
  },

  COMMUNICATION_SYSTEM: {
    pattern: 'Multi-channel communication with provider integration',
    channels: ['Email (SendGrid/Nodemailer)', 'SMS (Twilio)', 'WhatsApp (Business API)'],
    implementation: 'CommunicationEngine with provider registration',
    forbidden: ['single channel', 'hardcoded providers'],
    enforced: true
  },

  ACADEMIC_CALENDAR: {
    pattern: 'Tenant-configurable academic calendar with flexible structures',
    structures: ['Semester', 'Trimester', 'Quarter', 'Custom periods'],
    implementation: 'ConfigurableAcademicCalendar class',
    forbidden: ['fixed calendar structure', 'hardcoded academic year'],
    enforced: true
  },

  WIZARD_SETUP: {
    pattern: 'Configurable wizard system with frontend management',
    features: ['add/update/remove wizards', 'dynamic steps', 'per-tenant configuration'],
    implementation: 'WizardEngine with configurable steps',
    forbidden: ['fixed setup process', 'hardcoded wizards'],
    enforced: true
  }
};

// =================================================================
// VALIDATION FUNCTIONS - ENFORCE DECISIONS
// =================================================================

/**
 * Validate if code follows our technical decisions
 */
function validateTechnicalDecision(category, implementation) {
  const decision = TECHNICAL_DECISIONS[category];
  if (!decision) {
    throw new Error(`Unknown technical decision category: ${category}`);
  }

  if (
    decision.forbidden &&
    decision.forbidden.some(forbidden =>
      implementation.toLowerCase().includes(forbidden.toLowerCase())
    )
  ) {
    throw new Error(
      `FORBIDDEN IMPLEMENTATION: ${implementation} violates decision ${category}. ` +
        `Use: ${decision.implementation}`
    );
  }

  return true;
}

/**
 * Get configuration values based on our decisions
 */
function getConfigValue(category) {
  const decision = TECHNICAL_DECISIONS[category];
  if (!decision) {
    throw new Error(`Unknown configuration category: ${category}`);
  }
  return decision.implementation;
}

/**
 * Validate entire codebase against decisions
 */
function validateCodebase(codeContent) {
  const violations = [];

  // Check for forbidden patterns
  Object.entries(TECHNICAL_DECISIONS).forEach(([key, decision]) => {
    if (decision.forbidden) {
      decision.forbidden.forEach(forbidden => {
        if (codeContent.toLowerCase().includes(forbidden.toLowerCase())) {
          violations.push({
            decision: key,
            violation: forbidden,
            required: decision.implementation
          });
        }
      });
    }
  });

  return violations;
}

// =================================================================
// EXPORTS - SINGLE SOURCE OF TRUTH
// =================================================================

module.exports = {
  TECHNICAL_DECISIONS,
  BUSINESS_LOGIC_PATTERNS,
  validateTechnicalDecision,
  getConfigValue,
  validateCodebase,

  // Quick access to key decisions
  CONNECTION_POOL: TECHNICAL_DECISIONS.Q11_CONNECTION_POOLING.implementation,
  SALT_ROUNDS: 12, // From Q17
  SESSION_TIMEOUTS: {
    ADMIN: 8 * 60 * 60 * 1000, // 8 hours
    TEACHER: 12 * 60 * 60 * 1000, // 12 hours
    PARENT: 24 * 60 * 60 * 1000 // 24 hours
  },

  // Core patterns
  MODULE_SYSTEM: 'CommonJS',
  DATABASE_ORM: 'Sequelize',
  CSS_FRAMEWORK: 'TailwindCSS',
  TEMPLATE_ENGINE: 'EJS',
  CLIENT_FRAMEWORK: 'Alpine.js',

  // Meta information
  VERSION: 'FINAL',
  LAST_UPDATED: '2025-08-18',
  DECISION_COUNT: 56,
  STATUS: 'IMMUTABLE - DO NOT MODIFY'
};
