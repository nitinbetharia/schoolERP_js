/**
 * Bulletproof Validation Utilities
 * Simple, robust validation with comprehensive error handling
 */

const Joi = require('joi');
const validator = require('validator');
const xss = require('xss');
const logger = require('../config/logger');

// Common validation schemas - reusable and consistent
const commonSchemas = {
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .max(254)
    .trim()
    .lowercase()
    .required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'string.max': 'Email address is too long',
      'any.required': 'Email address is required'
    }),

  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please enter a valid 10-digit mobile number starting with 6-9',
      'any.required': 'Phone number is required'
    }),

  name: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-Z\s'.,-]+$/)
    .trim()
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters',
      'string.pattern.base': 'Name can only contain letters, spaces, and basic punctuation',
      'any.required': 'Name is required'
    }),

  password: Joi.string().min(6).max(128).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.max': 'Password cannot exceed 128 characters',
    'any.required': 'Password is required'
  }),

  money: Joi.number().positive().precision(2).max(999999.99).required().messages({
    'number.positive': 'Amount must be positive',
    'number.precision': 'Amount cannot have more than 2 decimal places',
    'number.max': 'Amount cannot exceed ₹9,99,999.99',
    'any.required': 'Amount is required'
  }),

  date: Joi.date().min('1900-01-01').max('now').required().messages({
    'date.min': 'Date cannot be before 1900',
    'date.max': 'Date cannot be in the future',
    'any.required': 'Date is required'
  })
};

// Specific validation schemas for different operations
const schemas = {
  // User login
  login: Joi.object({
    email: commonSchemas.email,
    password: commonSchemas.password
  }),

  // User registration
  userCreate: Joi.object({
    email: commonSchemas.email,
    phone: commonSchemas.phone,
    firstName: commonSchemas.name,
    lastName: commonSchemas.name,
    password: commonSchemas.password,
    role: Joi.string().valid('SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT', 'PARENT').required()
  }),

  // Student admission
  studentCreate: Joi.object({
    firstName: commonSchemas.name,
    lastName: commonSchemas.name,
    dateOfBirth: Joi.date()
      .min(new Date(Date.now() - 25 * 365 * 24 * 60 * 60 * 1000)) // Max 25 years old
      .max(new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000)) // Min 3 years old
      .required(),
    gender: Joi.string().valid('male', 'female', 'other').required(),
    aadharNumber: Joi.string()
      .pattern(/^\d{12}$/)
      .optional(),
    guardianName: commonSchemas.name,
    guardianPhone: commonSchemas.phone,
    guardianEmail: commonSchemas.email.optional(),
    address: Joi.string().min(10).max(500).required(),
    pincode: Joi.string()
      .pattern(/^\d{6}$/)
      .required(),
    classId: Joi.number().integer().positive().required(),
    academicYearId: Joi.number().integer().positive().required()
  }),

  // Fee payment
  feePayment: Joi.object({
    studentId: Joi.number().integer().positive().required(),
    amount: commonSchemas.money,
    paymentMethod: Joi.string().valid('cash', 'cheque', 'online', 'card').required(),
    paymentReference: Joi.string()
      .max(100)
      .when('paymentMethod', {
        is: Joi.valid('cheque', 'online', 'card'),
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
    notes: Joi.string().max(500).optional()
  }),

  // Payment Setup Configuration
  paymentSetup: Joi.object({
    enable_online_payments: Joi.boolean().default(false),
    enabled_gateways: Joi.array()
      .items(Joi.string().valid('RAZORPAY', 'PAYTM', 'PAYU', 'CCAVENUE', 'INSTAMOJO'))
      .when('enable_online_payments', {
        is: true,
        then: Joi.required().min(1),
        otherwise: Joi.optional()
      }),
    enabled_payment_methods: Joi.array()
      .items(Joi.string().valid('CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'ONLINE', 'CARD'))
      .required()
      .min(1),

    // Razorpay Configuration
    razorpay_key_id: Joi.string()
      .pattern(/^rzp_(test|live)_[A-Za-z0-9]{10}$/)
      .when('enabled_gateways', {
        is: Joi.array().has(Joi.string().valid('RAZORPAY')),
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
    razorpay_key_secret: Joi.string()
      .min(20)
      .when('enabled_gateways', {
        is: Joi.array().has(Joi.string().valid('RAZORPAY')),
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
    razorpay_test_mode: Joi.boolean().default(true),

    // Paytm Configuration
    paytm_merchant_id: Joi.string().when('enabled_gateways', {
      is: Joi.array().has(Joi.string().valid('PAYTM')),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    paytm_merchant_key: Joi.string().when('enabled_gateways', {
      is: Joi.array().has(Joi.string().valid('PAYTM')),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    paytm_test_mode: Joi.boolean().default(true),

    // PayU Configuration
    payu_merchant_key: Joi.string().when('enabled_gateways', {
      is: Joi.array().has(Joi.string().valid('PAYU')),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    payu_salt: Joi.string().when('enabled_gateways', {
      is: Joi.array().has(Joi.string().valid('PAYU')),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),

    // Convenience Fee Configuration
    online_fee_percentage: Joi.number().min(0).max(10).default(0),
    online_fee_fixed: Joi.number().min(0).default(0)
  }),

  // Payment Initiation
  initiatePayment: Joi.object({
    student_id: Joi.number().integer().positive().required(),
    amount: commonSchemas.money,
    gateway_name: Joi.string()
      .valid('RAZORPAY', 'PAYTM', 'PAYU', 'CCAVENUE', 'INSTAMOJO')
      .required(),
    payment_method: Joi.string()
      .valid('ONLINE', 'UPI', 'CARD', 'NETBANKING', 'WALLET')
      .default('ONLINE'),
    fee_receipt_id: Joi.number().integer().positive().optional(),
    customer_info: Joi.object({
      name: commonSchemas.name.optional(),
      email: commonSchemas.email.optional(),
      phone: commonSchemas.phone.optional()
    }).optional(),
    notes: Joi.object().optional()
  }),

  // Payment Verification
  verifyPayment: Joi.object({
    transaction_id: Joi.string().required(),
    gateway_name: Joi.string()
      .valid('RAZORPAY', 'PAYTM', 'PAYU', 'CCAVENUE', 'INSTAMOJO')
      .required(),
    gateway_payment_id: Joi.string().optional(),
    gateway_signature: Joi.string().optional()
  }),

  // Payment Refund
  refundPayment: Joi.object({
    transaction_id: Joi.string().required(),
    refund_amount: commonSchemas.money,
    reason: Joi.string().max(500).required(),
    refund_type: Joi.string().valid('FULL', 'PARTIAL').default('FULL'),
    notes: Joi.string().max(1000).optional()
  }),

  // Payment Analytics Filters
  paymentAnalytics: Joi.object({
    start_date: Joi.date().required(),
    end_date: Joi.date().min(Joi.ref('start_date')).required(),
    gateway_name: Joi.string()
      .valid('RAZORPAY', 'PAYTM', 'PAYU', 'CCAVENUE', 'INSTAMOJO')
      .optional(),
    payment_method: Joi.string()
      .valid('CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'ONLINE', 'CARD')
      .optional(),
    payment_status: Joi.string()
      .valid('INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED')
      .optional(),
    school_id: Joi.number().integer().positive().optional(),
    class_id: Joi.number().integer().positive().optional()
  }),

  // Communication Setup Configuration
  communicationSetup: Joi.object({
    enable_email_notifications: Joi.boolean().default(false),
    enable_sms_notifications: Joi.boolean().default(false),

    // Email Configuration
    email_provider: Joi.string()
      .valid('SMTP', 'SENDGRID', 'MAILGUN', 'SES', 'GMAIL')
      .when('enable_email_notifications', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
    from_email: commonSchemas.email.when('enable_email_notifications', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    from_name: Joi.string().max(100).when('enable_email_notifications', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    }),

    // SMTP Configuration
    smtp_host: Joi.string().when('email_provider', {
      is: 'SMTP',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    smtp_port: Joi.number().integer().min(1).max(65535).when('email_provider', {
      is: 'SMTP',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    smtp_username: Joi.string().when('email_provider', {
      is: 'SMTP',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    smtp_password: Joi.string().when('email_provider', {
      is: 'SMTP',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    smtp_secure: Joi.boolean().default(true),

    // SendGrid Configuration
    sendgrid_api_key: Joi.string().when('email_provider', {
      is: 'SENDGRID',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),

    // Mailgun Configuration
    mailgun_api_key: Joi.string().when('email_provider', {
      is: 'MAILGUN',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    mailgun_domain: Joi.string().when('email_provider', {
      is: 'MAILGUN',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),

    // Email Provider Configuration
    ses_access_key_id: Joi.string().when('email_provider', {
      is: 'SES',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    ses_secret_access_key: Joi.string().when('email_provider', {
      is: 'SES',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    ses_region: Joi.string().when('email_provider', {
      is: 'SES',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),

    // Gmail Configuration
    gmail_client_id: Joi.string().when('email_provider', {
      is: 'GMAIL',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    gmail_client_secret: Joi.string().when('email_provider', {
      is: 'GMAIL',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    gmail_refresh_token: Joi.string().when('email_provider', {
      is: 'GMAIL',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),

    // SMS Configuration
    sms_provider: Joi.string()
      .valid('TWILIO', 'TEXTLOCAL', 'MSG91', 'FAST2SMS')
      .when('enable_sms_notifications', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional()
      }),

    // Twilio Configuration
    twilio_account_sid: Joi.string().when('sms_provider', {
      is: 'TWILIO',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    twilio_auth_token: Joi.string().when('sms_provider', {
      is: 'TWILIO',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    twilio_from_number: Joi.string().when('sms_provider', {
      is: 'TWILIO',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),

    // TextLocal Configuration
    textlocal_api_key: Joi.string().when('sms_provider', {
      is: 'TEXTLOCAL',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    textlocal_sender: Joi.string().max(6).when('sms_provider', {
      is: 'TEXTLOCAL',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),

    // MSG91 Configuration
    msg91_auth_key: Joi.string().when('sms_provider', {
      is: 'MSG91',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    msg91_sender_id: Joi.string().max(6).when('sms_provider', {
      is: 'MSG91',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),

    // Fast2SMS Configuration
    fast2sms_api_key: Joi.string().when('sms_provider', {
      is: 'FAST2SMS',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    fast2sms_sender_id: Joi.string().max(6).when('sms_provider', {
      is: 'FAST2SMS',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  }),

  // Email Sending
  sendEmail: Joi.object({
    to: Joi.alternatives()
      .try(commonSchemas.email, Joi.array().items(commonSchemas.email).min(1).max(100))
      .required(),
    cc: Joi.alternatives()
      .try(commonSchemas.email, Joi.array().items(commonSchemas.email).max(50))
      .optional(),
    bcc: Joi.alternatives()
      .try(commonSchemas.email, Joi.array().items(commonSchemas.email).max(50))
      .optional(),
    subject: Joi.string().min(1).max(200).required(),
    message: Joi.string().min(1).max(10000).required(),
    is_html: Joi.boolean().default(false),
    template_name: Joi.string().max(100).optional(),
    template_variables: Joi.object().optional(),
    attachments: Joi.array()
      .items(
        Joi.object({
          filename: Joi.string().max(255).required(),
          path: Joi.string().optional(),
          content: Joi.string().optional(),
          contentType: Joi.string().optional()
        })
      )
      .max(10)
      .optional(),
    priority: Joi.string().valid('low', 'normal', 'high').default('normal'),
    delivery_time: Joi.date().min('now').optional(),
    track_opens: Joi.boolean().default(false),
    track_clicks: Joi.boolean().default(false)
  }),

  // SMS Sending
  sendSMS: Joi.object({
    to: Joi.alternatives()
      .try(commonSchemas.phone, Joi.array().items(commonSchemas.phone).min(1).max(1000))
      .required(),
    message: Joi.string().min(1).max(160).required(),
    template_name: Joi.string().max(100).optional(),
    template_variables: Joi.object().optional(),
    priority: Joi.string().valid('low', 'normal', 'high').default('normal'),
    delivery_time: Joi.date().min('now').optional(),
    message_type: Joi.string().valid('transactional', 'promotional').default('transactional')
  }),

  // Communication Template
  communicationTemplate: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    type: Joi.string().valid('email', 'sms').required(),
    subject: Joi.string().max(200).when('type', {
      is: 'email',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    content: Joi.string().min(1).max(10000).required(),
    variables: Joi.array().items(Joi.string().max(50)).optional(),
    is_active: Joi.boolean().default(true),
    category: Joi.string()
      .valid(
        'fee_reminder',
        'admission_confirmation',
        'attendance_alert',
        'exam_notification',
        'general_announcement',
        'payment_confirmation',
        'payment_failure',
        'account_activation',
        'password_reset'
      )
      .required(),
    description: Joi.string().max(500).optional()
  }),

  // Bulk Communication
  bulkCommunication: Joi.object({
    type: Joi.string().valid('email', 'sms').required(),
    recipient_type: Joi.string()
      .valid('all_students', 'class_students', 'fee_defaulters', 'custom_list')
      .required(),
    class_ids: Joi.array()
      .items(Joi.number().integer().positive())
      .when('recipient_type', {
        is: 'class_students',
        then: Joi.required().min(1),
        otherwise: Joi.optional()
      }),
    recipient_list: Joi.array()
      .items(Joi.number().integer().positive())
      .when('recipient_type', {
        is: 'custom_list',
        then: Joi.required().min(1).max(1000),
        otherwise: Joi.optional()
      }),
    template_id: Joi.number().integer().positive().optional(),
    subject: Joi.string().max(200).when('type', {
      is: 'email',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    message: Joi.string().min(1).max(10000).required(),
    template_variables: Joi.object().optional(),
    delivery_time: Joi.date().min('now').optional(),
    priority: Joi.string().valid('low', 'normal', 'high').default('normal')
  }),

  // Communication Analytics
  communicationAnalytics: Joi.object({
    start_date: Joi.date().required(),
    end_date: Joi.date().min(Joi.ref('start_date')).required(),
    communication_type: Joi.string().valid('email', 'sms', 'all').default('all'),
    status: Joi.string().valid('sent', 'delivered', 'failed', 'pending').optional(),
    template_id: Joi.number().integer().positive().optional(),
    recipient_type: Joi.string().valid('student', 'parent', 'staff').optional()
  }),

  // Fee Structure Management
  feeStructure: Joi.object({
    fee_head: Joi.string().max(100).required(),
    class_id: Joi.number().integer().positive().required(),
    academic_year_id: Joi.number().integer().positive().required(),
    amount: commonSchemas.money,
    due_date: Joi.date().min('now').required(),
    is_mandatory: Joi.boolean().default(true),
    installments: Joi.number().integer().min(1).max(12).default(1),
    late_fee_amount: commonSchemas.money.default(0),
    late_fee_days: Joi.number().integer().min(0).max(365).default(7),
    description: Joi.string().max(500).optional()
  }),

  // Fee Assignment
  feeAssignment: Joi.object({
    student_id: Joi.number().integer().positive().required(),
    fee_structure_id: Joi.number().integer().positive().required(),
    assigned_amount: commonSchemas.money,
    discount_amount: commonSchemas.money.default(0),
    due_date: Joi.date().min('now').optional()
  }),

  // Payment Transaction Filters
  paymentTransactions: Joi.object({
    student_id: Joi.number().integer().positive().optional(),
    gateway_name: Joi.string()
      .valid('RAZORPAY', 'PAYTM', 'PAYU', 'CCAVENUE', 'INSTAMOJO')
      .optional(),
    status: Joi.string()
      .valid('INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED')
      .optional(),
    start_date: Joi.date().optional(),
    end_date: Joi.date().min(Joi.ref('start_date')).optional(),
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0)
  })
};

/**
 * Validates request data against a schema
 * @param {string} schemaName - Name of the validation schema to use
 * @param {Object} data - Data to validate
 * @returns {Object} - { isValid, data, errors }
 */
function validateData(schemaName, data) {
  try {
    if (!schemas[schemaName]) {
      throw new Error(`Validation schema '${schemaName}' not found`);
    }

    const { error, value } = schemas[schemaName].validate(data, {
      abortEarly: false, // Return all errors
      stripUnknown: true, // Remove unknown fields
      convert: true // Auto-convert types
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return {
        isValid: false,
        data: null,
        errors: validationErrors
      };
    }

    // Sanitize the validated data
    const sanitizedData = sanitizeData(value);

    return {
      isValid: true,
      data: sanitizedData,
      errors: null
    };
  } catch (err) {
    logger.error('Validation error', { schemaName, error: err.message });
    return {
      isValid: false,
      data: null,
      errors: [{ field: 'general', message: 'Validation failed', value: null }]
    };
  }
}

/**
 * Sanitizes data to prevent XSS and other injection attacks
 * @param {Object} data - Data to sanitize
 * @returns {Object} - Sanitized data
 */
function sanitizeData(data) {
  if (typeof data === 'string') {
    return xss(data, {
      whiteList: {}, // No HTML tags allowed
      stripIgnoreTag: true, // Strip unknown tags
      stripIgnoreTagBody: ['script'] // Strip script tag content
    }).trim();
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeData(value);
    }
    return sanitized;
  }

  return data;
}

/**
 * Additional business validation functions
 */
const businessValidation = {
  /**
   * Validates if email is not from disposable email providers
   */
  isDisposableEmail(email) {
    const disposableDomains = [
      '10minutemail.com',
      'guerrillamail.com',
      'tempmail.org',
      'throwaway.email',
      'mailinator.com'
    ];
    const domain = email.split('@')[1];
    return disposableDomains.includes(domain.toLowerCase());
  },

  /**
   * Validates Indian mobile number format
   */
  isValidIndianMobile(phone) {
    return validator.isMobilePhone(phone, 'en-IN');
  },

  /**
   * Validates Aadhar number format and checksum
   */
  isValidAadhar(aadharNumber) {
    if (!aadharNumber || !/^\d{12}$/.test(aadharNumber)) {
      return false;
    }

    // Verhoeff algorithm for Aadhar validation
    const d = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
      [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
      [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
      [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
      [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
      [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
      [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
      [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
      [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    ];

    const p = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
      [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
      [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
      [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
      [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
      [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
      [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
    ];

    let c = 0;
    const myArray = aadharNumber.split('').reverse();

    for (let i = 0; i < myArray.length; i++) {
      c = d[c][p[(i + 1) % 8][parseInt(myArray[i])]];
    }

    return c === 0;
  },

  /**
   * Calculates age from date of birth
   */
  calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }
};

/**
 * Express middleware factory for validation
 */
function validationMiddleware(schemaName) {
  return (req, res, next) => {
    const validation = validateData(schemaName, req.body);

    if (!validation.isValid) {
      logger.warn('Request validation failed', {
        url: req.url,
        method: req.method,
        ip: req.ip,
        errors: validation.errors,
        originalBody: req.body
      });

      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Input validation failed',
          details: validation.errors
        },
        timestamp: new Date().toISOString()
      });
    }

    // Replace request body with validated and sanitized data
    req.body = validation.data;
    next();
  };
}

module.exports = {
  schemas,
  validateData,
  sanitizeData,
  businessValidation,
  validationMiddleware
};
