/**
 * Application Configuration
 * Non-sensitive configuration values that can be safely committed to version control
 */

const AppConfig = {
  // Application Info
  app: {
    name: 'School ERP - Bulletproof',
    version: '1.0.0',
    description: 'TvaritaTech School ERP System - Simple & Maintainable'
  },

  // Database Configuration
  database: {
    // Connection settings
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      timezone: '+00:00',
      connectTimeout: 60000,
      ssl:
        process.env.DB_SSL === 'true'
          ? {
              rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
            }
          : false
    },
    // System database (for developers/super-admins)
    system: {
      name: process.env.SYSTEM_DB_NAME || 'school_erp_system',
      charset: 'utf8mb4',
      collation: 'utf8mb4_unicode_ci',
      connectionLimit: parseInt(process.env.SYSTEM_DB_CONNECTION_LIMIT) || 10,
      queueLimit: 0,
      multipleStatements: false
    },
    // Trust databases (tenant-specific)
    trust: {
      prefix: process.env.TRUST_DB_PREFIX || 'school_erp_trust_',
      charset: 'utf8mb4',
      collation: 'utf8mb4_unicode_ci',
      connectionLimit: parseInt(process.env.TRUST_DB_CONNECTION_LIMIT) || 10,
      queueLimit: 0,
      multipleStatements: false
    },
    // Migration settings
    migration: {
      tableName: '_migrations',
      directory: './scripts/migrations',
      systemMigrationsDir: './scripts/migrations/system',
      trustMigrationsDir: './scripts/migrations/trust'
    }
  },

  // Server Configuration
  server: {
    host: 'localhost',
    port: 3000,
    compression: true,
    corsEnabled: true,
    trustProxy: true
  },

  // Security Configuration
  security: {
    bcryptRounds: 12,
    maxLoginAttempts: 5,
    lockoutTime: 900000, // 15 minutes
    sessionTimeout: 1800000, // 30 minutes
    passwordMinLength: 8,
    passwordRequireSpecialChars: true,
    passwordRequireNumbers: true,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    csrfEnabled: true,
    helmetEnabled: true
  },

  // Rate Limiting
  rateLimiting: {
    windowMs: 900000, // 15 minutes
    max: 100, // requests per window
    auth: {
      windowMs: 900000, // 15 minutes
      max: 5 // login attempts per window
    },
    api: {
      windowMs: 60000, // 1 minute
      max: 60 // API calls per minute
    },
    upload: {
      windowMs: 300000, // 5 minutes
      max: 10 // file uploads per window
    }
  },

  // File Upload Configuration
  uploads: {
    maxFileSize: 10485760, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    uploadPath: './uploads',
    tempPath: './uploads/temp'
  },

  // Logging Configuration
  logging: {
    level: 'info',
    maxSize: '20m',
    maxFiles: '180d', // 180 days retention as required
    datePattern: 'YYYY-MM-DD',
    auditRetentionDays: 180,
    debugRetentionDays: 30, // Keep debug logs shorter
    errorLogFile: 'logs/error.log',
    warningLogFile: 'logs/warning.log',
    infoLogFile: 'logs/info.log',
    debugLogFile: 'logs/debug.log',
    combinedLogFile: 'logs/combined.log',
    databaseLogFile: 'logs/database.log',
    auditLogFile: 'logs/audit.log',
    exceptionsLogFile: 'logs/exceptions.log',
    rejectionsLogFile: 'logs/rejections.log',
    logsDirectory: 'logs',
    zippedArchive: true
  },

  // File Upload Configuration
  fileUpload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    uploadDir: 'uploads/',
    tempDir: 'temp/',
    createParentPath: true,
    preserveExtension: true,
    safeFileNames: true,
    abortOnLimit: true
  },

  // Session Configuration
  session: {
    name: 'school_erp_session',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    maxAge: 1800000, // 30 minutes
    store: {
      clearExpired: true,
      checkExpirationInterval: 900000, // 15 minutes
      createDatabaseTable: true,
      tableName: 'user_sessions',
      sessionIdColumn: 'session_id',
      expiresColumn: 'expires',
      dataColumn: 'data'
    },
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 1800000, // 30 minutes
      sameSite: 'lax'
    }
  },

  // Backup Configuration
  backup: {
    enabled: true,
    schedule: '0 2 * * *', // Daily at 2 AM
    retentionDays: 30,
    compressionEnabled: true,
    path: './backups'
  },

  // Email Configuration Templates
  email: {
    from: 'noreply@schoolerp.com',
    templates: {
      welcome: 'welcome-email',
      passwordReset: 'password-reset',
      admission: 'admission-notification',
      feeReminder: 'fee-reminder'
    }
  },

  // Roles and Permissions
  roles: {
    SYSTEM_ADMIN: {
      level: 100,
      description: 'System Administrator with full access'
    },
    GROUP_ADMIN: {
      level: 90,
      description: 'Group Administrator managing multiple trusts'
    },
    TRUST_ADMIN: {
      level: 80,
      description: 'Trust Administrator managing trust-wide operations'
    },
    SCHOOL_ADMIN: {
      level: 70,
      description: 'School Administrator managing school operations'
    },
    TEACHER: {
      level: 50,
      description: 'Teacher with access to assigned classes'
    },
    ACCOUNTANT: {
      level: 60,
      description: 'Accountant managing financial operations'
    },
    PARENT: {
      level: 20,
      description: "Parent with access to their children's information"
    },
    STUDENT: {
      level: 10,
      description: 'Student with limited self-service access'
    }
  },

  // Academic Configuration
  academic: {
    defaultGradingSystem: 'PERCENTAGE',
    gradingSystems: ['PERCENTAGE', 'GPA', 'LETTER_GRADE'],
    attendanceStatuses: ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'SICK', 'HOLIDAY'],
    leaveTypes: ['SICK', 'CASUAL', 'EMERGENCY', 'VACATION', 'OTHER'],
    paymentModes: ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'ONLINE', 'CARD'],
    discountTypes: ['PERCENTAGE', 'FIXED_AMOUNT', 'SCHOLARSHIP', 'SIBLING', 'EMPLOYEE', 'OTHER']
  },

  // UI/UX Configuration
  ui: {
    itemsPerPage: 25,
    maxSearchResults: 100,
    autoSaveInterval: 30000, // 30 seconds
    sessionWarningTime: 300000, // 5 minutes before expiry
    toastDuration: 5000,
    loadingTimeout: 30000
  },

  // API Configuration
  api: {
    version: 'v1',
    basePath: '/api/v1',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  },

  // Cache Configuration
  cache: {
    enabled: true,
    defaultTTL: 300, // 5 minutes
    checkPeriod: 600, // 10 minutes
    maxKeys: 1000
  },

  // Multi-Tenant Configuration
  multiTenant: {
    enabled: true,
    defaultTrustCode: process.env.DEFAULT_TRUST_CODE || 'demo',
    tenantResolution: {
      strategy: process.env.TENANT_STRATEGY || 'subdomain', // 'subdomain', 'header', 'path'
      headerName: 'X-Trust-Code',
      subdomainPattern: /^([a-zA-Z0-9_-]+)\./, // Extract trust code from subdomain
      pathPattern: /^\/trust\/([a-zA-Z0-9_-]+)/, // Extract trust code from path
      cookieName: 'trust_context'
    },
    trustCodeValidation: {
      minLength: 2,
      maxLength: 20,
      pattern: /^[a-zA-Z0-9_-]+$/, // Alphanumeric, underscore, hyphen
      reservedCodes: ['admin', 'api', 'system', 'www', 'app', 'mail', 'ftp']
    },
    database: {
      autoCreateTrustDB: process.env.AUTO_CREATE_TRUST_DB === 'true',
      maxTrustsPerInstance: parseInt(process.env.MAX_TRUSTS_PER_INSTANCE) || 100,
      trustPoolTimeout: 300000, // 5 minutes - close unused trust connections
      systemContextRequired: ['/system', '/api/system', '/setup/platform'],
      trustContextRequired: ['/api/users', '/api/students', '/api/fees', '/api/reports']
    }
  },

  // Environment Configuration
  environment: {
    name: process.env.NODE_ENV || 'development',
    isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
    timezone: process.env.TZ || 'Asia/Kolkata',
    locale: process.env.LOCALE || 'en-IN',
    currency: process.env.CURRENCY || 'INR'
  },

  // Health Check Configuration
  health: {
    endpoint: '/health',
    timeout: 5000,
    retries: 3,
    interval: 30000 // 30 seconds
  },

  // Development Configuration
  development: {
    enableDebugLogging: true,
    enableSQLLogging: false,
    enableHotReload: true,
    showDetailedErrors: true
  },

  // Production Configuration
  production: {
    enableDebugLogging: false,
    enableSQLLogging: false,
    enableHotReload: false,
    showDetailedErrors: false,
    enableCompression: true,
    enableCaching: true
  }
};

module.exports = AppConfig;
