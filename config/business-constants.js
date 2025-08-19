// Business Constants - Single Source of Truth
module.exports = {
   // User Role Constants
   USER_ROLES: {
      SYSTEM_ADMIN: 'SYSTEM_ADMIN',
      TRUST_ADMIN: 'TRUST_ADMIN',
      PRINCIPAL: 'PRINCIPAL',
      TEACHER: 'TEACHER',
      ACCOUNTANT: 'ACCOUNTANT',
      PARENT: 'PARENT',
      STUDENT: 'STUDENT',
   },

   // User Status Constants
   USER_STATUS: {
      ACTIVE: 'ACTIVE',
      INACTIVE: 'INACTIVE',
      SUSPENDED: 'SUSPENDED',
      PENDING: 'PENDING',
   },

   // Trust Status Constants
   TRUST_STATUS: {
      ACTIVE: 'ACTIVE',
      INACTIVE: 'INACTIVE',
      SUSPENDED: 'SUSPENDED',
      SETUP_PENDING: 'SETUP_PENDING',
   },

   // School Status Constants
   SCHOOL_STATUS: {
      ACTIVE: 'ACTIVE',
      INACTIVE: 'INACTIVE',
      SUSPENDED: 'SUSPENDED',
   },

   // Academic Constants
   ACADEMIC: {
      DEFAULT_ACADEMIC_YEAR: '2024-25',
      TERMS: ['TERM_1', 'TERM_2', 'TERM_3'],
      SECTIONS: ['A', 'B', 'C', 'D', 'E'],
      ATTENDANCE_STATUS: {
         PRESENT: 'PRESENT',
         ABSENT: 'ABSENT',
         LATE: 'LATE',
         HALF_DAY: 'HALF_DAY',
         EXCUSED: 'EXCUSED',
      },
   },

   // Fee Constants
   FEE_TYPES: {
      TUITION: 'TUITION',
      TRANSPORT: 'TRANSPORT',
      LIBRARY: 'LIBRARY',
      LABORATORY: 'LABORATORY',
      SPORTS: 'SPORTS',
      ACTIVITY: 'ACTIVITY',
      EXAMINATION: 'EXAMINATION',
      MISCELLANEOUS: 'MISCELLANEOUS',
   },

   FEE_STATUS: {
      PENDING: 'PENDING',
      PARTIAL: 'PARTIAL',
      PAID: 'PAID',
      OVERDUE: 'OVERDUE',
      CANCELLED: 'CANCELLED',
   },

   // Payment Constants
   PAYMENT_STATUS: {
      SUCCESS: 'SUCCESS',
      FAILED: 'FAILED',
      PENDING: 'PENDING',
      CANCELLED: 'CANCELLED',
   },

   PAYMENT_METHODS: {
      CASH: 'CASH',
      CHEQUE: 'CHEQUE',
      ONLINE: 'ONLINE',
      CARD: 'CARD',
      UPI: 'UPI',
   },

   // Communication Constants
   COMMUNICATION_TYPES: {
      SMS: 'SMS',
      EMAIL: 'EMAIL',
      NOTIFICATION: 'NOTIFICATION',
      ANNOUNCEMENT: 'ANNOUNCEMENT',
   },

   COMMUNICATION_STATUS: {
      SENT: 'SENT',
      DELIVERED: 'DELIVERED',
      FAILED: 'FAILED',
      PENDING: 'PENDING',
   },

   // System Constants
   SYSTEM: {
      DEFAULT_PAGE_SIZE: 20,
      MAX_PAGE_SIZE: 100,
      MAX_FILE_SIZE: 5242880, // 5MB
      ALLOWED_FILE_TYPES: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'xls', 'xlsx'],
      SESSION_TIMEOUT: {
         ADMIN: 8 * 60 * 60 * 1000, // 8 hours
         TEACHER: 12 * 60 * 60 * 1000, // 12 hours
         PARENT: 24 * 60 * 60 * 1000, // 24 hours
         STUDENT: 4 * 60 * 60 * 1000, // 4 hours
      },
   },

   // Validation Constants
   VALIDATION: {
      PASSWORD_MIN_LENGTH: 8,
      PASSWORD_MAX_LENGTH: 50,
      NAME_MIN_LENGTH: 2,
      NAME_MAX_LENGTH: 100,
      EMAIL_MAX_LENGTH: 255,
      PHONE_MIN_LENGTH: 10,
      PHONE_MAX_LENGTH: 15,
      TRUST_CODE_MIN_LENGTH: 3,
      TRUST_CODE_MAX_LENGTH: 20,
      SUBDOMAIN_MIN_LENGTH: 3,
      SUBDOMAIN_MAX_LENGTH: 50,
   },

   // Error Codes
   ERROR_CODES: {
      // Authentication Errors
      AUTH_INVALID_CREDENTIALS: 'AUTH_001',
      AUTH_ACCOUNT_LOCKED: 'AUTH_002',
      AUTH_SESSION_EXPIRED: 'AUTH_003',
      AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_004',
      AUTH_TENANT_NOT_FOUND: 'AUTH_005',

      // Validation Errors
      VALIDATION_REQUIRED: 'VAL_001',
      VALIDATION_FORMAT: 'VAL_002',
      VALIDATION_LENGTH: 'VAL_003',
      VALIDATION_DUPLICATE: 'VAL_004',

      // Database Errors
      DB_CONNECTION_ERROR: 'DB_001',
      DB_QUERY_ERROR: 'DB_002',
      DB_CONSTRAINT_ERROR: 'DB_003',
      DB_NOT_FOUND: 'DB_004',

      // Business Logic Errors
      BUSINESS_RULE_VIOLATION: 'BIZ_001',
      INSUFFICIENT_BALANCE: 'BIZ_002',
      DUPLICATE_ENTRY: 'BIZ_003',
      OPERATION_NOT_ALLOWED: 'BIZ_004',

      // System Errors
      SYSTEM_ERROR: 'SYS_001',
      FILE_UPLOAD_ERROR: 'SYS_002',
      EMAIL_SEND_ERROR: 'SYS_003',
      SMS_SEND_ERROR: 'SYS_004',
   },

   // Audit Actions
   AUDIT_ACTIONS: {
      CREATE: 'CREATE',
      UPDATE: 'UPDATE',
      DELETE: 'DELETE',
      LOGIN: 'LOGIN',
      LOGOUT: 'LOGOUT',
      PASSWORD_CHANGE: 'PASSWORD_CHANGE',
      STATUS_CHANGE: 'STATUS_CHANGE',
      ROLE_CHANGE: 'ROLE_CHANGE',
   },
};
