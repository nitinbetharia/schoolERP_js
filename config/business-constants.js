/**
 * Business Constants Configuration
 * Q59 Compliant: Centralized business constants (no hardcoded values)
 *
 * This file contains ALL business logic constants used throughout the application.
 * NO hardcoded values should exist in models, routes, or business logic.
 *
 * Pattern:
 * - Use descriptive constant names
 * - Group related constants together
 * - Provide validation arrays for Joi schemas
 * - Include display labels for frontend
 */

module.exports = {
  // ================================
  // USER MANAGEMENT CONSTANTS
  // ================================

  USER_ROLES: {
    // Core user roles in the system
    TRUST_ADMIN: 'TRUST_ADMIN', // Manages multiple schools
    SCHOOL_ADMIN: 'SCHOOL_ADMIN', // Manages single school
    TEACHER: 'TEACHER', // Teaching staff
    ACCOUNTANT: 'ACCOUNTANT', // Financial management
    PARENT: 'PARENT', // Student parent/guardian
    STUDENT: 'STUDENT', // Student user

    // Validation arrays for Joi schemas
    ALL_ROLES: ['TRUST_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT', 'PARENT', 'STUDENT'],
    ADMIN_ROLES: ['TRUST_ADMIN', 'SCHOOL_ADMIN'],
    STAFF_ROLES: ['TRUST_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT'],
    NON_STUDENT_ROLES: ['TRUST_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT', 'PARENT'],

    // Display labels for frontend
    LABELS: {
      TRUST_ADMIN: 'Trust Administrator',
      SCHOOL_ADMIN: 'School Administrator',
      TEACHER: 'Teacher',
      ACCOUNTANT: 'Accountant',
      PARENT: 'Parent/Guardian',
      STUDENT: 'Student'
    }
  },

  USER_STATUS: {
    // User account status values
    ACTIVE: 'ACTIVE', // User can login and use system
    INACTIVE: 'INACTIVE', // User temporarily disabled
    LOCKED: 'LOCKED', // User locked due to security issues

    // Validation arrays
    ALL_STATUS: ['ACTIVE', 'INACTIVE', 'LOCKED'],
    OPERATIONAL_STATUS: ['ACTIVE', 'INACTIVE'],

    // Display labels
    LABELS: {
      ACTIVE: 'Active',
      INACTIVE: 'Inactive',
      LOCKED: 'Locked'
    }
  },

  // ================================
  // PERSONAL INFORMATION CONSTANTS
  // ================================

  GENDER: {
    MALE: 'MALE',
    FEMALE: 'FEMALE',
    OTHER: 'OTHER',

    // Validation arrays
    ALL_GENDERS: ['MALE', 'FEMALE', 'OTHER'],

    // Display labels
    LABELS: {
      MALE: 'Male',
      FEMALE: 'Female',
      OTHER: 'Other'
    }
  },

  // ================================
  // ACADEMIC MANAGEMENT CONSTANTS
  // ================================

  ACADEMIC_STATUS: {
    // General academic entity status
    ACTIVE: 'ACTIVE', // Currently in use
    INACTIVE: 'INACTIVE', // Not currently in use
    ARCHIVED: 'ARCHIVED', // Historical record

    // Validation arrays
    ALL_STATUS: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
    OPERATIONAL_STATUS: ['ACTIVE', 'INACTIVE'],

    // Display labels
    LABELS: {
      ACTIVE: 'Active',
      INACTIVE: 'Inactive',
      ARCHIVED: 'Archived'
    }
  },

  CLASS_STATUS: {
    // Class-specific status values
    ACTIVE: 'ACTIVE', // Class is currently running
    INACTIVE: 'INACTIVE', // Class temporarily suspended
    COMPLETED: 'COMPLETED', // Academic year completed

    // Validation arrays
    ALL_STATUS: ['ACTIVE', 'INACTIVE', 'COMPLETED'],
    OPERATIONAL_STATUS: ['ACTIVE', 'INACTIVE'],

    // Display labels
    LABELS: {
      ACTIVE: 'Active',
      INACTIVE: 'Inactive',
      COMPLETED: 'Completed'
    }
  },

  STUDENT_STATUS: {
    // Student enrollment status
    ENROLLED: 'ENROLLED', // Currently enrolled
    TRANSFERRED: 'TRANSFERRED', // Transferred to another school
    GRADUATED: 'GRADUATED', // Completed education
    WITHDRAWN: 'WITHDRAWN', // Withdrawn from school
    SUSPENDED: 'SUSPENDED', // Temporarily suspended

    // Validation arrays
    ALL_STATUS: ['ENROLLED', 'TRANSFERRED', 'GRADUATED', 'WITHDRAWN', 'SUSPENDED'],
    ACTIVE_STATUS: ['ENROLLED', 'SUSPENDED'],

    // Display labels
    LABELS: {
      ENROLLED: 'Enrolled',
      TRANSFERRED: 'Transferred',
      GRADUATED: 'Graduated',
      WITHDRAWN: 'Withdrawn',
      SUSPENDED: 'Suspended'
    }
  },

  // ================================
  // FINANCIAL MANAGEMENT CONSTANTS
  // ================================

  PAYMENT_STATUS: {
    // Payment transaction status
    INITIATED: 'INITIATED', // Payment started
    PENDING: 'PENDING', // Awaiting processing
    SUCCESS: 'SUCCESS', // Successfully completed
    FAILED: 'FAILED', // Payment failed
    CANCELLED: 'CANCELLED', // User cancelled
    REFUNDED: 'REFUNDED', // Amount refunded

    // Validation arrays
    ALL_STATUS: ['INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'],
    ACTIVE_STATUS: ['INITIATED', 'PENDING'],
    COMPLETED_STATUS: ['SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'],

    // Display labels
    LABELS: {
      INITIATED: 'Initiated',
      PENDING: 'Pending',
      SUCCESS: 'Successful',
      FAILED: 'Failed',
      CANCELLED: 'Cancelled',
      REFUNDED: 'Refunded'
    }
  },

  FEE_STATUS: {
    // Fee payment status for students
    PENDING: 'PENDING', // Fee not yet paid
    PARTIAL: 'PARTIAL', // Partially paid
    PAID: 'PAID', // Fully paid
    OVERDUE: 'OVERDUE', // Payment overdue
    WAIVED: 'WAIVED', // Fee waived

    // Validation arrays
    ALL_STATUS: ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'WAIVED'],
    UNPAID_STATUS: ['PENDING', 'PARTIAL', 'OVERDUE'],

    // Display labels
    LABELS: {
      PENDING: 'Pending',
      PARTIAL: 'Partially Paid',
      PAID: 'Paid',
      OVERDUE: 'Overdue',
      WAIVED: 'Waived'
    }
  },

  // ================================
  // COMMUNICATION CONSTANTS
  // ================================

  COMMUNICATION_STATUS: {
    // Message/notification status
    PENDING: 'pending', // Queued for sending
    SENT: 'sent', // Successfully sent
    DELIVERED: 'delivered', // Delivered to recipient
    FAILED: 'failed', // Failed to send

    // Validation arrays
    ALL_STATUS: ['pending', 'sent', 'delivered', 'failed'],
    ACTIVE_STATUS: ['pending', 'sent'],

    // Display labels
    LABELS: {
      pending: 'Pending',
      sent: 'Sent',
      delivered: 'Delivered',
      failed: 'Failed'
    }
  },

  RECIPIENT_TYPES: {
    // Communication recipient types
    STUDENT: 'student', // Direct to student
    PARENT: 'parent', // To parent/guardian
    STAFF: 'staff', // To staff member
    ALL: 'all', // Broadcast to all

    // Validation arrays
    ALL_TYPES: ['student', 'parent', 'staff', 'all'],
    INDIVIDUAL_TYPES: ['student', 'parent', 'staff'],

    // Display labels
    LABELS: {
      student: 'Student',
      parent: 'Parent/Guardian',
      staff: 'Staff',
      all: 'All Recipients'
    }
  },

  // ================================
  // ATTENDANCE CONSTANTS
  // ================================

  ATTENDANCE_STATUS: {
    // Daily attendance status
    PRESENT: 'PRESENT', // Student present
    ABSENT: 'ABSENT', // Student absent
    LATE: 'LATE', // Student arrived late
    EXCUSED: 'EXCUSED', // Excused absence

    // Validation arrays
    ALL_STATUS: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'],
    POSITIVE_STATUS: ['PRESENT', 'LATE'],

    // Display labels
    LABELS: {
      PRESENT: 'Present',
      ABSENT: 'Absent',
      LATE: 'Late',
      EXCUSED: 'Excused'
    }
  },

  // ================================
  // SYSTEM MANAGEMENT CONSTANTS
  // ================================

  ENTITY_STATUS: {
    // Generic entity status for schools, trusts, etc.
    ACTIVE: 'ACTIVE', // Currently operational
    INACTIVE: 'INACTIVE', // Temporarily disabled
    SUSPENDED: 'SUSPENDED', // Suspended due to issues
    TERMINATED: 'TERMINATED', // Permanently closed

    // Validation arrays
    ALL_STATUS: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED'],
    OPERATIONAL_STATUS: ['ACTIVE', 'INACTIVE'],

    // Display labels
    LABELS: {
      ACTIVE: 'Active',
      INACTIVE: 'Inactive',
      SUSPENDED: 'Suspended',
      TERMINATED: 'Terminated'
    }
  },

  PRIORITY_LEVELS: {
    // System priority levels
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',

    // Validation arrays
    ALL_LEVELS: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],

    // Display labels
    LABELS: {
      LOW: 'Low',
      MEDIUM: 'Medium',
      HIGH: 'High',
      CRITICAL: 'Critical'
    }
  },

  // ================================
  // HELPER FUNCTIONS
  // ================================

  /**
   * Get validation array for Joi schema
   * @param {string} constantGroup - Group name (e.g., 'USER_ROLES', 'USER_STATUS')
   * @param {string} arrayType - Array type (e.g., 'ALL_ROLES', 'ALL_STATUS')
   * @returns {Array} Validation array
   */
  getValidationArray(constantGroup, arrayType = 'ALL') {
    const group = this[constantGroup];
    if (!group) {
      throw new Error(`Unknown constant group: ${constantGroup}`);
    }

    // Try different array naming patterns
    const possibleKeys = [
      arrayType,
      `ALL_${arrayType}`,
      `${arrayType}_STATUS`,
      `${arrayType}_ROLES`
    ];

    for (const key of possibleKeys) {
      if (group[key]) {
        return group[key];
      }
    }

    throw new Error(`Unknown array type: ${arrayType} in group: ${constantGroup}`);
  },

  /**
   * Get display label for a constant value
   * @param {string} constantGroup - Group name
   * @param {string} value - Constant value
   * @returns {string} Display label
   */
  getLabel(constantGroup, value) {
    const group = this[constantGroup];
    if (!group || !group.LABELS) {
      return value; // Return original value if no labels defined
    }

    return group.LABELS[value] || value;
  },

  /**
   * Validate that a value exists in a constant group
   * @param {string} constantGroup - Group name
   * @param {string} value - Value to validate
   * @param {string} arrayType - Array type to check against
   * @returns {boolean} True if valid
   */
  isValid(constantGroup, value, arrayType = 'ALL') {
    try {
      const validValues = this.getValidationArray(constantGroup, arrayType);
      return validValues.includes(value);
    } catch (error) {
      return false;
    }
  },

  // ================================
  // SYSTEM & MULTI-TENANT CONSTANTS
  // ================================

  TRUST_STATUS: {
    // Trust/tenant status values
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SUSPENDED: 'SUSPENDED',
    TERMINATED: 'TERMINATED',

    // Validation arrays
    ALL_STATUS: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED'],

    // Display labels
    LABELS: {
      ACTIVE: 'Active',
      INACTIVE: 'Inactive',
      SUSPENDED: 'Suspended',
      TERMINATED: 'Terminated'
    }
  },

  SYSTEM_USER_ROLES: {
    // System-level user roles
    SUPER_ADMIN: 'SUPER_ADMIN',
    SYSTEM_ADMIN: 'SYSTEM_ADMIN',
    SUPPORT_ADMIN: 'SUPPORT_ADMIN',

    // Validation arrays
    ALL_ROLES: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'SUPPORT_ADMIN'],

    // Display labels
    LABELS: {
      SUPER_ADMIN: 'Super Administrator',
      SYSTEM_ADMIN: 'System Administrator',
      SUPPORT_ADMIN: 'Support Administrator'
    }
  },

  // ================================
  // FEE MANAGEMENT CONSTANTS
  // ================================

  FEE_TYPES: {
    // Types of fees
    TUITION: 'TUITION',
    ADMISSION: 'ADMISSION',
    EXAMINATION: 'EXAMINATION',
    LIBRARY: 'LIBRARY',
    LABORATORY: 'LABORATORY',
    TRANSPORT: 'TRANSPORT',
    HOSTEL: 'HOSTEL',
    ACTIVITY: 'ACTIVITY',
    OTHER: 'OTHER',

    // Validation arrays
    ALL_TYPES: [
      'TUITION',
      'ADMISSION',
      'EXAMINATION',
      'LIBRARY',
      'LABORATORY',
      'TRANSPORT',
      'HOSTEL',
      'ACTIVITY',
      'OTHER'
    ],

    // Display labels
    LABELS: {
      TUITION: 'Tuition Fee',
      ADMISSION: 'Admission Fee',
      EXAMINATION: 'Examination Fee',
      LIBRARY: 'Library Fee',
      LABORATORY: 'Laboratory Fee',
      TRANSPORT: 'Transport Fee',
      HOSTEL: 'Hostel Fee',
      ACTIVITY: 'Activity Fee',
      OTHER: 'Other Fee'
    }
  },

  FEE_FREQUENCIES: {
    // Fee payment frequencies
    MONTHLY: 'MONTHLY',
    QUARTERLY: 'QUARTERLY',
    HALF_YEARLY: 'HALF_YEARLY',
    YEARLY: 'YEARLY',
    ONE_TIME: 'ONE_TIME',

    // Validation arrays
    ALL_FREQUENCIES: ['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY', 'ONE_TIME'],

    // Display labels
    LABELS: {
      MONTHLY: 'Monthly',
      QUARTERLY: 'Quarterly',
      HALF_YEARLY: 'Half-Yearly',
      YEARLY: 'Yearly',
      ONE_TIME: 'One-Time'
    }
  },

  FEE_STRUCTURE_STATUS: {
    // Fee structure status values
    DRAFT: 'DRAFT',
    ACTIVE: 'ACTIVE',
    ARCHIVED: 'ARCHIVED',

    // Validation arrays
    ALL_STATUS: ['DRAFT', 'ACTIVE', 'ARCHIVED'],

    // Display labels
    LABELS: {
      DRAFT: 'Draft',
      ACTIVE: 'Active',
      ARCHIVED: 'Archived'
    }
  },

  FEE_TRANSACTION_TYPES: {
    // Fee transaction types
    PAYMENT: 'PAYMENT',
    REFUND: 'REFUND',
    ADJUSTMENT: 'ADJUSTMENT',
    WAIVER: 'WAIVER',

    // Validation arrays
    ALL_TYPES: ['PAYMENT', 'REFUND', 'ADJUSTMENT', 'WAIVER'],

    // Display labels
    LABELS: {
      PAYMENT: 'Payment',
      REFUND: 'Refund',
      ADJUSTMENT: 'Adjustment',
      WAIVER: 'Waiver'
    }
  },

  FEE_TRANSACTION_STATUS: {
    // Fee transaction status values
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED',
    REFUNDED: 'REFUNDED',

    // Validation arrays
    ALL_STATUS: ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'],

    // Display labels
    LABELS: {
      PENDING: 'Pending',
      PROCESSING: 'Processing',
      SUCCESS: 'Success',
      FAILED: 'Failed',
      CANCELLED: 'Cancelled',
      REFUNDED: 'Refunded'
    }
  },

  PAYMENT_METHODS: {
    // Payment method options
    CASH: 'CASH',
    BANK_TRANSFER: 'BANK_TRANSFER',
    CHEQUE: 'CHEQUE',
    CARD: 'CARD',
    DIGITAL_WALLET: 'DIGITAL_WALLET',
    UPI: 'UPI',
    NET_BANKING: 'NET_BANKING',

    // Validation arrays
    ALL_METHODS: [
      'CASH',
      'BANK_TRANSFER',
      'CHEQUE',
      'CARD',
      'DIGITAL_WALLET',
      'UPI',
      'NET_BANKING'
    ],

    // Display labels
    LABELS: {
      CASH: 'Cash',
      BANK_TRANSFER: 'Bank Transfer',
      CHEQUE: 'Cheque',
      CARD: 'Card',
      DIGITAL_WALLET: 'Digital Wallet',
      UPI: 'UPI',
      NET_BANKING: 'Net Banking'
    }
  },

  RECONCILIATION_STATUS: {
    // Reconciliation status values
    PENDING: 'PENDING',
    MATCHED: 'MATCHED',
    UNMATCHED: 'UNMATCHED',
    DISPUTED: 'DISPUTED',

    // Validation arrays
    ALL_STATUS: ['PENDING', 'MATCHED', 'UNMATCHED', 'DISPUTED'],

    // Display labels
    LABELS: {
      PENDING: 'Pending',
      MATCHED: 'Matched',
      UNMATCHED: 'Unmatched',
      DISPUTED: 'Disputed'
    }
  },

  // ================================
  // ATTENDANCE CONSTANTS
  // ================================

  ATTENDANCE_CONFIG_TYPES: {
    // Attendance configuration types
    HOLIDAY: 'HOLIDAY',
    WORKING_DAY: 'WORKING_DAY',
    HALF_DAY: 'HALF_DAY',

    // Validation arrays
    ALL_TYPES: ['HOLIDAY', 'WORKING_DAY', 'HALF_DAY'],

    // Display labels
    LABELS: {
      HOLIDAY: 'Holiday',
      WORKING_DAY: 'Working Day',
      HALF_DAY: 'Half Day'
    }
  },

  ATTENDANCE_STATUS: {
    // Daily attendance status values
    PRESENT: 'PRESENT',
    ABSENT: 'ABSENT',
    LATE: 'LATE',
    HALF_DAY: 'HALF_DAY',
    EXCUSED: 'EXCUSED',

    // Validation arrays
    ALL_STATUS: ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'EXCUSED'],

    // Display labels
    LABELS: {
      PRESENT: 'Present',
      ABSENT: 'Absent',
      LATE: 'Late',
      HALF_DAY: 'Half Day',
      EXCUSED: 'Excused'
    }
  },

  // ================================
  // COMMUNICATION CONSTANTS
  // ================================

  COMMUNICATION_CHANNELS: {
    // Communication channel types
    EMAIL: 'EMAIL',
    SMS: 'SMS',
    WHATSAPP: 'WHATSAPP',
    PUSH: 'PUSH',

    // Validation arrays
    ALL_CHANNELS: ['EMAIL', 'SMS', 'WHATSAPP', 'PUSH'],

    // Display labels
    LABELS: {
      EMAIL: 'Email',
      SMS: 'SMS',
      WHATSAPP: 'WhatsApp',
      PUSH: 'Push Notification'
    }
  },

  MESSAGE_CATEGORIES: {
    // Message category types
    ACADEMIC: 'ACADEMIC',
    ADMINISTRATIVE: 'ADMINISTRATIVE',
    FINANCIAL: 'FINANCIAL',
    ATTENDANCE: 'ATTENDANCE',
    EMERGENCY: 'EMERGENCY',
    GENERAL: 'GENERAL',

    // Validation arrays
    ALL_CATEGORIES: [
      'ACADEMIC',
      'ADMINISTRATIVE',
      'FINANCIAL',
      'ATTENDANCE',
      'EMERGENCY',
      'GENERAL'
    ],

    // Display labels
    LABELS: {
      ACADEMIC: 'Academic',
      ADMINISTRATIVE: 'Administrative',
      FINANCIAL: 'Financial',
      ATTENDANCE: 'Attendance',
      EMERGENCY: 'Emergency',
      GENERAL: 'General'
    }
  },

  MESSAGE_PRIORITY: {
    // Message priority levels
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    URGENT: 'URGENT',

    // Validation arrays
    ALL_PRIORITIES: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],

    // Display labels
    LABELS: {
      LOW: 'Low',
      MEDIUM: 'Medium',
      HIGH: 'High',
      URGENT: 'Urgent'
    }
  },

  MESSAGE_STATUS: {
    // Message delivery status
    PENDING: 'PENDING',
    SENT: 'SENT',
    DELIVERED: 'DELIVERED',
    READ: 'READ',
    FAILED: 'FAILED',

    // Validation arrays
    ALL_STATUS: ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'],

    // Display labels
    LABELS: {
      PENDING: 'Pending',
      SENT: 'Sent',
      DELIVERED: 'Delivered',
      READ: 'Read',
      FAILED: 'Failed'
    }
  },

  RECIPIENT_TYPES: {
    // Message recipient types
    USER: 'USER',
    STUDENT: 'STUDENT',
    PARENT: 'PARENT',
    TEACHER: 'TEACHER',
    STAFF: 'STAFF',

    // Validation arrays
    ALL_TYPES: ['USER', 'STUDENT', 'PARENT', 'TEACHER', 'STAFF'],

    // Display labels
    LABELS: {
      USER: 'User',
      STUDENT: 'Student',
      PARENT: 'Parent',
      TEACHER: 'Teacher',
      STAFF: 'Staff'
    }
  },

  APPROVAL_STATUS: {
    // Approval workflow status
    DRAFT: 'DRAFT',
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',

    // Validation arrays
    ALL_STATUS: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'],

    // Display labels
    LABELS: {
      DRAFT: 'Draft',
      PENDING: 'Pending',
      APPROVED: 'Approved',
      REJECTED: 'Rejected'
    }
  },

  // ================================
  // AUDIT & LOGGING CONSTANTS
  // ================================

  AUDIT_ACTIONS: {
    // Audit action types
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    ACCESS: 'ACCESS',

    // Validation arrays
    ALL_ACTIONS: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ACCESS'],

    // Display labels
    LABELS: {
      CREATE: 'Create',
      UPDATE: 'Update',
      DELETE: 'Delete',
      LOGIN: 'Login',
      LOGOUT: 'Logout',
      ACCESS: 'Access'
    }
  },

  AUDIT_CATEGORIES: {
    // Audit category types
    AUTHENTICATION: 'AUTHENTICATION',
    DATA_MODIFICATION: 'DATA_MODIFICATION',
    DATA_ACCESS: 'DATA_ACCESS',
    FINANCE: 'FINANCE',
    ACADEMIC: 'ACADEMIC',
    COMMUNICATION: 'COMMUNICATION',
    SYSTEM: 'SYSTEM',

    // Validation arrays
    ALL_CATEGORIES: [
      'AUTHENTICATION',
      'DATA_MODIFICATION',
      'DATA_ACCESS',
      'FINANCE',
      'ACADEMIC',
      'COMMUNICATION',
      'SYSTEM'
    ],

    // Display labels
    LABELS: {
      AUTHENTICATION: 'Authentication',
      DATA_MODIFICATION: 'Data Modification',
      DATA_ACCESS: 'Data Access',
      FINANCE: 'Finance',
      ACADEMIC: 'Academic',
      COMMUNICATION: 'Communication',
      SYSTEM: 'System'
    }
  },

  AUDIT_USER_TYPES: {
    // User types for system audit
    SYSTEM_USER: 'SYSTEM_USER',
    TENANT_USER: 'TENANT_USER',

    // Validation arrays
    ALL_TYPES: ['SYSTEM_USER', 'TENANT_USER'],

    // Display labels
    LABELS: {
      SYSTEM_USER: 'System User',
      TENANT_USER: 'Tenant User'
    }
  },

  OPERATION_RESULTS: {
    // Operation result types
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    PARTIAL: 'PARTIAL',

    // Validation arrays
    ALL_RESULTS: ['SUCCESS', 'FAILED', 'PARTIAL'],

    // Display labels
    LABELS: {
      SUCCESS: 'Success',
      FAILED: 'Failed',
      PARTIAL: 'Partial'
    }
  },

  RISK_LEVELS: {
    // Risk assessment levels
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',

    // Validation arrays
    ALL_LEVELS: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],

    // Display labels
    LABELS: {
      LOW: 'Low',
      MEDIUM: 'Medium',
      HIGH: 'High',
      CRITICAL: 'Critical'
    }
  },

  LOG_LEVELS: {
    // Logging levels
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARNING: 'WARNING',
    ERROR: 'ERROR',

    // Validation arrays
    ALL_LEVELS: ['DEBUG', 'INFO', 'WARNING', 'ERROR'],

    // Display labels
    LABELS: {
      DEBUG: 'Debug',
      INFO: 'Info',
      WARNING: 'Warning',
      ERROR: 'Error'
    }
  },

  COMMUNICATION_EVENTS: {
    // Communication event types
    CREATED: 'CREATED',
    PROVIDER_REQUEST: 'PROVIDER_REQUEST',
    SENT: 'SENT',
    DELIVERED: 'DELIVERED',
    READ: 'READ',
    ERROR: 'ERROR',
    RETRY: 'RETRY',
    WEBHOOK_RECEIVED: 'WEBHOOK_RECEIVED',

    // Validation arrays
    ALL_EVENTS: [
      'CREATED',
      'PROVIDER_REQUEST',
      'SENT',
      'DELIVERED',
      'READ',
      'ERROR',
      'RETRY',
      'WEBHOOK_RECEIVED'
    ],

    // Display labels
    LABELS: {
      CREATED: 'Created',
      PROVIDER_REQUEST: 'Provider Request',
      SENT: 'Sent',
      DELIVERED: 'Delivered',
      READ: 'Read',
      ERROR: 'Error',
      RETRY: 'Retry',
      WEBHOOK_RECEIVED: 'Webhook Received'
    }
  }
};
