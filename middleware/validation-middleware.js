const Joi = require('joi');
const ValidationSchemas = require('../config/validation-schemas');

class ValidationMiddleware {
  // Helper to detect browser requests
  isBrowserRequest(req) {
    return req.headers.accept && req.headers.accept.includes('text/html');
  }

  // Preprocess form data for HTML forms
  preprocessFormData(data) {
    const processed = { ...data };

    // Convert checkbox values to booleans
    if (processed.remember_me !== undefined) {
      processed.remember_me =
        processed.remember_me === 'on' ||
        processed.remember_me === 'true' ||
        processed.remember_me === true;
    }

    // Convert empty strings to null for optional fields
    Object.keys(processed).forEach(key => {
      if (processed[key] === '') {
        processed[key] = undefined;
      }
    });

    return processed;
  }

  // Generic validation middleware factory
  validate(schemaName, options = {}) {
    return (req, res, next) => {
      try {
        const schema = this.getSchema(schemaName);
        if (!schema) {
          const errorMessage = 'Validation schema not found';
          if (this.isBrowserRequest(req)) {
            req.flash('error', errorMessage);
            return res.redirect('back');
          }
          return res.status(500).json({
            error: errorMessage,
            code: 'SCHEMA_NOT_FOUND'
          });
        }

        // Choose validation target (body, query, params)
        const target = options.target || 'body';
        let data = req[target];

        // Preprocess form data for browser requests
        if (this.isBrowserRequest(req) && target === 'body') {
          data = this.preprocessFormData(data);
        }

        // Validate data
        const { error, value } = schema.validate(data, {
          abortEarly: false,
          stripUnknown: options.stripUnknown !== false,
          allowUnknown: options.allowUnknown === true
        });

        if (error) {
          const errors = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            type: detail.type
          }));

          // Handle validation errors for browser requests
          if (this.isBrowserRequest(req)) {
            const errorMessage = errors.map(e => e.message).join(', ');
            req.flash('error', errorMessage);
            req.flash('formData', JSON.stringify(req[target]));
            return res.redirect('back');
          }

          return res.status(400).json({
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errors
          });
        }

        // Replace request data with validated data
        req[target] = value;
        next();
      } catch (err) {
        console.error('Validation middleware error:', err);
        const errorMessage = 'Internal validation error';

        if (this.isBrowserRequest(req)) {
          req.flash('error', errorMessage);
          return res.redirect('back');
        }

        return res.status(500).json({
          error: errorMessage,
          code: 'VALIDATION_INTERNAL_ERROR'
        });
      }
    };
  }

  // Validate query parameters
  validateQuery(schemaName) {
    return this.validate(schemaName, { target: 'query' });
  }

  // Validate URL parameters
  validateParams(schemaName) {
    return this.validate(schemaName, { target: 'params' });
  }

  // Custom validation for complex scenarios
  custom(validationFn) {
    return async (req, res, next) => {
      try {
        const result = await validationFn(req);
        if (result.error) {
          return res.status(400).json({
            error: result.error,
            code: 'CUSTOM_VALIDATION_ERROR',
            details: result.details || []
          });
        }
        next();
      } catch (err) {
        console.error('Custom validation error:', err);
        return res.status(500).json({
          error: 'Validation error',
          code: 'VALIDATION_ERROR'
        });
      }
    };
  }

  // XSS sanitization middleware
  sanitizeInput() {
    return (req, res, next) => {
      try {
        if (req.body) {
          req.body = this.sanitizeObject(req.body);
        }
        if (req.query && Object.keys(req.query).length > 0) {
          // Check if req.query is writable and sanitize safely
          try {
            for (const [key, value] of Object.entries(req.query)) {
              if (typeof value === 'string') {
                req.query[key] = this.sanitizeString(value);
              }
            }
          } catch (queryError) {
            // If query sanitization fails, just continue
            console.warn('Query sanitization skipped:', queryError.message);
          }
        }
        if (req.params) {
          req.params = this.sanitizeObject(req.params);
        }
        next();
      } catch (err) {
        console.error('Sanitization error:', err);
        next(); // Continue even if sanitization fails
      }
    };
  }

  sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return this.sanitizeString(obj);
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        sanitized[key] = value.map(item => this.sanitizeObject(item));
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = this.sanitizeString(value);
      }
    }
    return sanitized;
  }

  sanitizeString(str) {
    if (typeof str !== 'string') return str;

    // Basic XSS prevention
    return str
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  // Get schema by path (e.g., 'user.create', 'student.update')
  getSchema(schemaPath) {
    const parts = schemaPath.split('.');
    let schema = ValidationSchemas;

    for (const part of parts) {
      if (schema && schema[part]) {
        schema = schema[part];
      } else {
        return null;
      }
    }

    return schema;
  }

  // File upload validation
  validateFileUpload(options = {}) {
    return (req, res, next) => {
      try {
        if (!req.files || Object.keys(req.files).length === 0) {
          if (options.required) {
            return res.status(400).json({
              error: 'No files uploaded',
              code: 'NO_FILES'
            });
          }
          return next();
        }

        const errors = [];

        for (const [fieldName, file] of Object.entries(req.files)) {
          const fieldOptions = options.fields?.[fieldName] || options;

          // Check file size
          if (fieldOptions.maxSize && file.size > fieldOptions.maxSize) {
            errors.push({
              field: fieldName,
              message: `File size exceeds maximum allowed size of ${fieldOptions.maxSize} bytes`,
              type: 'file.size'
            });
          }

          // Check file type
          if (fieldOptions.allowedTypes && !fieldOptions.allowedTypes.includes(file.mimetype)) {
            errors.push({
              field: fieldName,
              message: `File type ${file.mimetype} is not allowed`,
              type: 'file.type'
            });
          }

          // Check file extension
          if (fieldOptions.allowedExtensions) {
            const extension = file.name.split('.').pop().toLowerCase();
            if (!fieldOptions.allowedExtensions.includes(extension)) {
              errors.push({
                field: fieldName,
                message: `File extension .${extension} is not allowed`,
                type: 'file.extension'
              });
            }
          }
        }

        if (errors.length > 0) {
          return res.status(400).json({
            error: 'File validation failed',
            code: 'FILE_VALIDATION_ERROR',
            details: errors
          });
        }

        next();
      } catch (err) {
        console.error('File validation error:', err);
        return res.status(500).json({
          error: 'File validation error',
          code: 'FILE_VALIDATION_ERROR'
        });
      }
    };
  }

  // Batch validation for bulk operations
  validateBatch(itemSchema, options = {}) {
    return (req, res, next) => {
      try {
        const items = req.body.items || req.body;

        if (!Array.isArray(items)) {
          return res.status(400).json({
            error: 'Expected array of items',
            code: 'INVALID_BATCH_FORMAT'
          });
        }

        if (options.maxItems && items.length > options.maxItems) {
          return res.status(400).json({
            error: `Too many items. Maximum allowed: ${options.maxItems}`,
            code: 'BATCH_SIZE_EXCEEDED'
          });
        }

        const schema = this.getSchema(itemSchema);
        if (!schema) {
          return res.status(500).json({
            error: 'Validation schema not found',
            code: 'SCHEMA_NOT_FOUND'
          });
        }

        const errors = [];
        const validatedItems = [];

        for (let i = 0; i < items.length; i++) {
          const { error, value } = schema.validate(items[i], {
            abortEarly: false,
            stripUnknown: true
          });

          if (error) {
            errors.push({
              index: i,
              errors: error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                type: detail.type
              }))
            });
          } else {
            validatedItems.push(value);
          }
        }

        if (errors.length > 0) {
          return res.status(400).json({
            error: 'Batch validation failed',
            code: 'BATCH_VALIDATION_ERROR',
            details: errors
          });
        }

        req.body.items = validatedItems;
        next();
      } catch (err) {
        console.error('Batch validation error:', err);
        return res.status(500).json({
          error: 'Batch validation error',
          code: 'BATCH_VALIDATION_ERROR'
        });
      }
    };
  }

  // Conditional validation based on user role or other context
  validateConditional(conditions) {
    return (req, res, next) => {
      try {
        let schemaName = null;

        // Evaluate conditions to determine schema
        for (const condition of conditions) {
          if (this.evaluateCondition(condition.condition, req)) {
            schemaName = condition.schema;
            break;
          }
        }

        if (!schemaName) {
          return res.status(400).json({
            error: 'No valid validation schema found for request',
            code: 'NO_VALID_SCHEMA'
          });
        }

        // Apply the determined schema
        return this.validate(schemaName)(req, res, next);
      } catch (err) {
        console.error('Conditional validation error:', err);
        return res.status(500).json({
          error: 'Validation error',
          code: 'VALIDATION_ERROR'
        });
      }
    };
  }

  evaluateCondition(condition, req) {
    try {
      // Simple condition evaluation
      if (condition.role) {
        return req.user?.role === condition.role;
      }

      if (condition.method) {
        return req.method === condition.method;
      }

      if (condition.path) {
        return req.path.includes(condition.path);
      }

      if (condition.header) {
        return req.headers[condition.header.name] === condition.header.value;
      }

      return false;
    } catch (err) {
      console.error('Condition evaluation error:', err);
      return false;
    }
  }

  // Response validation (for API consistency)
  validateResponse(schemaName) {
    return (req, res, next) => {
      const originalSend = res.send;

      res.send = function (body) {
        try {
          if (process.env.NODE_ENV === 'development') {
            const schema = this.getSchema(schemaName);
            if (schema && body) {
              const { error } = schema.validate(JSON.parse(body));
              if (error) {
                console.warn('Response validation warning:', error.details);
              }
            }
          }
        } catch (err) {
          console.warn('Response validation error:', err);
        }

        return originalSend.call(this, body);
      }.bind(this);

      next();
    };
  }
}

module.exports = new ValidationMiddleware();
