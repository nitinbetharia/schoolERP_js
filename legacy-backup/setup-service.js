const db = require('../data/database-service');
const migrationService = require('../data/migration-service');
const authService = require('../auth/auth-service');
const wizardConfigs = require('../../config/wizard-configs');

class SetupService {
  async createTrust(trustData) {
    try {
      return await db.transactionSystem(async connection => {
        // Insert trust record
        const trustSql = `
          INSERT INTO trusts (
            trust_name, trust_code, subdomain, contact_email, contact_phone,
            address, city, state, postal_code, country, website, logo_url,
            theme_config, database_name
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const databaseName = `school_erp_trust_${trustData.trust_code}`;

        const [result] = await connection.execute(trustSql, [
          trustData.trust_name,
          trustData.trust_code,
          trustData.subdomain,
          trustData.contact_email,
          trustData.contact_phone || null,
          trustData.address || null,
          trustData.city || null,
          trustData.state || null,
          trustData.postal_code || null,
          trustData.country || 'India',
          trustData.website || null,
          trustData.logo_url || null,
          JSON.stringify(trustData.theme_config || {}),
          databaseName
        ]);

        const trustId = result.insertId;

        // Create trust database
        await migrationService.createTrustDatabase(trustData.trust_code);

        // Create admin user for trust
        if (trustData.admin_user) {
          await this.createTrustAdmin(trustData.admin_user, trustData.trust_code);
        }

        return { trustId, trustCode: trustData.trust_code };
      });
    } catch (error) {
      throw new Error(`Failed to create trust: ${error.message}`);
    }
  }

  async createTrustAdmin(adminData, trustCode) {
    const hashedPassword = await authService.hashPassword(adminData.password);

    const sql = `
      INSERT INTO users (
        first_name, last_name, email, phone, password_hash, role, status
      ) VALUES (?, ?, ?, ?, ?, 'TRUST_ADMIN', 'ACTIVE')
    `;

    await db.queryTrust(trustCode, sql, [
      adminData.first_name,
      adminData.last_name,
      adminData.email,
      adminData.phone,
      hashedPassword
    ]);
  }

  async createSchool(schoolData, trustCode) {
    try {
      return await db.transactionTrust(trustCode, async connection => {
        // Insert school record
        const schoolSql = `
          INSERT INTO schools (
            school_name, school_code, address, city, state, postal_code,
            phone, email, website, principal_name, principal_email,
            principal_phone, affiliation_number, board, logo_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [schoolResult] = await connection.execute(schoolSql, [
          schoolData.school_name,
          schoolData.school_code,
          schoolData.address || null,
          schoolData.city || null,
          schoolData.state || null,
          schoolData.postal_code || null,
          schoolData.phone || null,
          schoolData.email || null,
          schoolData.website || null,
          schoolData.principal_name || null,
          schoolData.principal_email || null,
          schoolData.principal_phone || null,
          schoolData.affiliation_number || null,
          schoolData.board,
          schoolData.logo_url || null
        ]);

        const schoolId = schoolResult.insertId;

        // Create academic year if provided
        if (schoolData.academic_year) {
          await this.createAcademicYear(schoolData.academic_year, connection);
        }

        // Create classes and sections if provided
        if (schoolData.classes && schoolData.classes.length > 0) {
          await this.createClassesAndSections(schoolData.classes, schoolId, connection);
        }

        return { schoolId };
      });
    } catch (error) {
      throw new Error(`Failed to create school: ${error.message}`);
    }
  }

  async createAcademicYear(yearData, connection) {
    const sql = `
      INSERT INTO academic_years (year_name, start_date, end_date, is_current)
      VALUES (?, ?, ?, true)
    `;

    const [result] = await connection.execute(sql, [
      yearData.academic_year,
      yearData.academic_start_date,
      yearData.academic_end_date
    ]);

    return result.insertId;
  }

  async createClassesAndSections(classesData, schoolId, connection) {
    // Get current academic year
    const academicYearSql = `SELECT id FROM academic_years WHERE is_current = true LIMIT 1`;
    const [academicYears] = await connection.execute(academicYearSql);

    if (academicYears.length === 0) {
      throw new Error('No current academic year found');
    }

    const academicYearId = academicYears[0].id;

    for (const classData of classesData) {
      // Create class
      const classSql = `
        INSERT INTO classes (class_name, class_order, school_id, academic_year_id)
        VALUES (?, ?, ?, ?)
      `;

      const [classResult] = await connection.execute(classSql, [
        classData.class_name,
        classData.class_order,
        schoolId,
        academicYearId
      ]);

      const classId = classResult.insertId;

      // Create sections for this class
      if (classData.sections && classData.sections.length > 0) {
        for (const sectionData of classData.sections) {
          const sectionSql = `
            INSERT INTO sections (section_name, class_id, capacity)
            VALUES (?, ?, ?)
          `;

          await connection.execute(sectionSql, [
            sectionData.section_name,
            classId,
            sectionData.capacity || 30
          ]);
        }
      }
    }
  }

  // Wizard management methods
  async getWizardConfig(wizardId) {
    return wizardConfigs[wizardId] || null;
  }

  async validateWizardStep(wizardId, stepId, data) {
    const config = await this.getWizardConfig(wizardId);
    if (!config) {
      throw new Error('Wizard configuration not found');
    }

    const step = config.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error('Step configuration not found');
    }

    const errors = [];

    // Validate required fields
    for (const field of step.fields) {
      if (field.required && (!data[field.name] || data[field.name] === '')) {
        errors.push(`${field.label} is required`);
        continue;
      }

      const value = data[field.name];
      if (!value) continue;

      // Validate field patterns
      if (field.pattern && !new RegExp(field.pattern).test(value)) {
        errors.push(`${field.label} format is invalid`);
      }

      // Validate field lengths
      if (field.minLength && value.length < field.minLength) {
        errors.push(`${field.label} must be at least ${field.minLength} characters`);
      }

      if (field.maxLength && value.length > field.maxLength) {
        errors.push(`${field.label} must not exceed ${field.maxLength} characters`);
      }

      // Check uniqueness if required
      if (field.unique) {
        const isUnique = await this.checkFieldUniqueness(field.name, value, wizardId);
        if (!isUnique) {
          errors.push(`${field.label} already exists`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async checkFieldUniqueness(fieldName, value, wizardId) {
    try {
      let sql, params;

      switch (fieldName) {
        case 'trust_code':
          sql = 'SELECT COUNT(*) as count FROM trusts WHERE trust_code = ?';
          params = [value];
          const trustResults = await db.querySystem(sql, params);
          return trustResults[0].count === 0;

        case 'subdomain':
          sql = 'SELECT COUNT(*) as count FROM trusts WHERE subdomain = ?';
          params = [value];
          const subdomainResults = await db.querySystem(sql, params);
          return subdomainResults[0].count === 0;

        case 'contact_email':
          sql = 'SELECT COUNT(*) as count FROM trusts WHERE contact_email = ?';
          params = [value];
          const emailResults = await db.querySystem(sql, params);
          return emailResults[0].count === 0;

        default:
          return true; // If no specific check, assume unique
      }
    } catch (error) {
      console.error('Error checking field uniqueness:', error);
      return false; // Fail safe
    }
  }

  async saveWizardProgress(wizardId, stepId, data, sessionId) {
    // Save progress to session or database for recovery
    const progressKey = `wizard_${wizardId}_${sessionId}`;
    const progressData = {
      currentStep: stepId,
      stepData: data,
      timestamp: new Date().toISOString()
    };

    // For simplicity, storing in memory/cache
    // In production, use Redis or database storage
    global.wizardProgress = global.wizardProgress || {};
    global.wizardProgress[progressKey] = progressData;

    return true;
  }

  async getWizardProgress(wizardId, sessionId) {
    const progressKey = `wizard_${wizardId}_${sessionId}`;
    return global.wizardProgress?.[progressKey] || null;
  }

  async clearWizardProgress(wizardId, sessionId) {
    const progressKey = `wizard_${wizardId}_${sessionId}`;
    if (global.wizardProgress) {
      delete global.wizardProgress[progressKey];
    }
    return true;
  }

  // Get available trusts for system users
  async getTrusts(filters = {}) {
    let sql = `
      SELECT id, trust_name, trust_code, subdomain, contact_email, 
             city, state, status, created_at
      FROM trusts
      WHERE 1=1
    `;

    const params = [];

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.search) {
      sql += ' AND (trust_name LIKE ? OR trust_code LIKE ? OR contact_email LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY trust_name ASC';

    if (filters.limit) {
      sql += ` LIMIT ${parseInt(filters.limit)}`;
      if (filters.offset) {
        sql += ` OFFSET ${parseInt(filters.offset)}`;
      }
    }

    return await db.querySystem(sql, params);
  }

  // Get schools within a trust
  async getSchools(trustCode, filters = {}) {
    let sql = `
      SELECT id, school_name, school_code, city, state, principal_name, 
             status, created_at
      FROM schools
      WHERE 1=1
    `;

    const params = [];

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.search) {
      sql += ' AND (school_name LIKE ? OR school_code LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    sql += ' ORDER BY school_name ASC';

    return await db.queryTrust(trustCode, sql, params);
  }

  // Initialize system with default configuration
  async initializeSystem() {
    try {
      // Check if system is already initialized
      const configSql = 'SELECT COUNT(*) as count FROM system_config';
      const configResult = await db.querySystem(configSql);

      if (configResult[0].count > 0) {
        return { message: 'System already initialized' };
      }

      // Insert default system configuration
      const defaultConfigs = [
        ['APP_NAME', 'School ERP - Bulletproof', 'STRING', 'Application name'],
        ['APP_VERSION', '1.0.0', 'STRING', 'Application version'],
        ['MAX_LOGIN_ATTEMPTS', '5', 'NUMBER', 'Maximum login attempts'],
        ['SESSION_TIMEOUT', '1800', 'NUMBER', 'Session timeout in seconds'],
        ['SYSTEM_INITIALIZED', 'true', 'BOOLEAN', 'System initialization status']
      ];

      for (const config of defaultConfigs) {
        const insertSql = `
          INSERT INTO system_config (config_key, config_value, data_type, description)
          VALUES (?, ?, ?, ?)
        `;
        await db.querySystem(insertSql, config);
      }

      return { message: 'System initialized successfully' };
    } catch (error) {
      throw new Error(`System initialization failed: ${error.message}`);
    }
  }

  // Payment Gateway Configuration Methods
  async setupPaymentGateways(gatewayConfigs) {
    try {
      return await db.transactionSystem(async connection => {
        const results = [];

        for (const config of gatewayConfigs) {
          // Encrypt sensitive configuration data
          const encryptedConfig = this.encryptSensitiveData(config.configuration);

          const sql = `
            INSERT INTO payment_gateways (
              gateway_name, gateway_type, is_enabled, 
              configuration, test_mode, display_order, status
            ) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
            ON DUPLICATE KEY UPDATE
              is_enabled = VALUES(is_enabled),
              configuration = VALUES(configuration),
              test_mode = VALUES(test_mode),
              display_order = VALUES(display_order),
              updated_at = NOW()
          `;

          const [result] = await connection.execute(sql, [
            config.gateway_name,
            config.gateway_type,
            config.is_enabled || false,
            JSON.stringify(encryptedConfig),
            config.test_mode !== false, // Default to test mode
            config.display_order || 0
          ]);

          results.push({
            gateway_name: config.gateway_name,
            gateway_id: result.insertId || result.affectedRows,
            configured: true
          });
        }

        return { gateways: results };
      });
    } catch (error) {
      throw new Error(`Failed to setup payment gateways: ${error.message}`);
    }
  }

  async setupPaymentMethods(methodConfigs) {
    try {
      return await db.transactionSystem(async connection => {
        const results = [];

        for (const config of methodConfigs) {
          const sql = `
            INSERT INTO payment_method_configs (
              method_type, is_enabled, minimum_amount, maximum_amount,
              convenience_fee_percentage, convenience_fee_fixed,
              requires_approval, auto_receipt_generation, 
              configuration, display_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              is_enabled = VALUES(is_enabled),
              minimum_amount = VALUES(minimum_amount),
              maximum_amount = VALUES(maximum_amount),
              convenience_fee_percentage = VALUES(convenience_fee_percentage),
              convenience_fee_fixed = VALUES(convenience_fee_fixed),
              requires_approval = VALUES(requires_approval),
              auto_receipt_generation = VALUES(auto_receipt_generation),
              configuration = VALUES(configuration),
              display_order = VALUES(display_order),
              updated_at = NOW()
          `;

          const [result] = await connection.execute(sql, [
            config.method_type,
            config.is_enabled !== false, // Default to enabled
            config.minimum_amount || 0.0,
            config.maximum_amount || null,
            config.convenience_fee_percentage || 0.0,
            config.convenience_fee_fixed || 0.0,
            config.requires_approval || false,
            config.auto_receipt_generation !== false, // Default to true
            JSON.stringify(config.configuration || {}),
            config.display_order || 0
          ]);

          results.push({
            method_type: config.method_type,
            method_id: result.insertId || result.affectedRows,
            configured: true
          });
        }

        return { methods: results };
      });
    } catch (error) {
      throw new Error(`Failed to setup payment methods: ${error.message}`);
    }
  }

  // Communication Provider Configuration Methods
  async setupCommunicationProviders(configs) {
    try {
      return await db.transactionSystem(async connection => {
        const results = {};

        // Setup email configuration
        if (configs.email) {
          const emailSql = `
            INSERT INTO email_configurations (
              provider, is_enabled, configuration, 
              daily_limit, monthly_limit, from_email, from_name
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              is_enabled = VALUES(is_enabled),
              configuration = VALUES(configuration),
              daily_limit = VALUES(daily_limit),
              monthly_limit = VALUES(monthly_limit),
              from_email = VALUES(from_email),
              from_name = VALUES(from_name),
              updated_at = NOW()
          `;

          const encryptedEmailConfig = this.encryptSensitiveData(configs.email.configuration);

          const [emailResult] = await connection.execute(emailSql, [
            configs.email.provider,
            configs.email.is_enabled || false,
            JSON.stringify(encryptedEmailConfig),
            configs.email.daily_limit || 1000,
            configs.email.monthly_limit || 10000,
            configs.email.from_email,
            configs.email.from_name
          ]);

          results.email = {
            provider: configs.email.provider,
            configured: true,
            config_id: emailResult.insertId || emailResult.affectedRows
          };
        }

        // Setup SMS configuration
        if (configs.sms) {
          const smsSql = `
            INSERT INTO sms_configurations (
              provider, is_enabled, configuration,
              daily_limit, monthly_limit, cost_per_sms
            ) VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              is_enabled = VALUES(is_enabled),
              configuration = VALUES(configuration),
              daily_limit = VALUES(daily_limit),
              monthly_limit = VALUES(monthly_limit),
              cost_per_sms = VALUES(cost_per_sms),
              updated_at = NOW()
          `;

          const encryptedSmsConfig = this.encryptSensitiveData(configs.sms.configuration);

          const [smsResult] = await connection.execute(smsSql, [
            configs.sms.provider,
            configs.sms.is_enabled || false,
            JSON.stringify(encryptedSmsConfig),
            configs.sms.daily_limit || 1000,
            configs.sms.monthly_limit || 10000,
            configs.sms.cost_per_sms || 0.0
          ]);

          results.sms = {
            provider: configs.sms.provider,
            configured: true,
            config_id: smsResult.insertId || smsResult.affectedRows
          };
        }

        return results;
      });
    } catch (error) {
      throw new Error(`Failed to setup communication providers: ${error.message}`);
    }
  }

  // Utility method to encrypt sensitive configuration data
  encryptSensitiveData(data) {
    // In production, use proper encryption like AES-256
    // For now, returning as-is but marked for encryption
    return {
      ...data,
      _encrypted: true,
      _timestamp: new Date().toISOString()
    };
  }

  // Get configured payment gateways
  async getPaymentGateways(onlyEnabled = false) {
    try {
      let sql = 'SELECT * FROM payment_gateways WHERE status = "ACTIVE"';
      if (onlyEnabled) {
        sql += ' AND is_enabled = 1';
      }
      sql += ' ORDER BY display_order ASC, gateway_name ASC';

      const gateways = await db.querySystem(sql);

      // Decrypt sensitive data for display (mask secrets)
      return gateways.map(gateway => ({
        ...gateway,
        configuration: this.maskSensitiveData(JSON.parse(gateway.configuration))
      }));
    } catch (error) {
      throw new Error(`Failed to get payment gateways: ${error.message}`);
    }
  }

  // Get configured payment methods
  async getPaymentMethods(onlyEnabled = false) {
    try {
      let sql = 'SELECT * FROM payment_method_configs';
      if (onlyEnabled) {
        sql += ' WHERE is_enabled = 1';
      }
      sql += ' ORDER BY display_order ASC, method_type ASC';

      return await db.querySystem(sql);
    } catch (error) {
      throw new Error(`Failed to get payment methods: ${error.message}`);
    }
  }

  // Utility method to mask sensitive data
  maskSensitiveData(data) {
    const sensitiveKeys = ['key_secret', 'api_secret', 'password', 'token', 'private_key'];
    const masked = { ...data };

    Object.keys(masked).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        masked[key] = '***MASKED***';
      }
    });

    return masked;
  }

  // Communication provider setup methods
  async setupEmailProvider(emailConfig, trustCode) {
    try {
      const communicationService = require('../communication/communication-service');

      // Validate configuration
      const emailProviders = require('../communication/email-service-providers');
      const validation = emailProviders.validateEmailConfig(emailConfig);

      if (!validation.isValid) {
        throw new Error(`Email configuration validation failed: ${validation.errors.join(', ')}`);
      }

      // Setup the provider
      const result = await communicationService.setupEmailProvider(emailConfig, trustCode);

      // Create default email templates
      await this.createDefaultEmailTemplates(trustCode);

      logger.info('Email provider setup completed', { trustCode, provider: emailConfig.provider });
      return result;
    } catch (error) {
      logger.error('Failed to setup email provider:', error);
      throw new Error(`Failed to setup email provider: ${error.message}`);
    }
  }

  async setupSMSProvider(smsConfig, trustCode) {
    try {
      const communicationService = require('../communication/communication-service');

      // Validate configuration
      const smsProviders = require('../communication/sms-service-providers');
      const validation = smsProviders.validateSMSConfig(smsConfig);

      if (!validation.isValid) {
        throw new Error(`SMS configuration validation failed: ${validation.errors.join(', ')}`);
      }

      // Setup the provider
      const result = await communicationService.setupSMSProvider(smsConfig, trustCode);

      // Create default SMS templates
      await this.createDefaultSMSTemplates(trustCode);

      logger.info('SMS provider setup completed', { trustCode, provider: smsConfig.provider });
      return result;
    } catch (error) {
      logger.error('Failed to setup SMS provider:', error);
      throw new Error(`Failed to setup SMS provider: ${error.message}`);
    }
  }

  async createDefaultEmailTemplates(trustCode) {
    try {
      const emailProviders = require('../communication/email-service-providers');
      const templates = emailProviders.getDefaultTemplates();

      for (const template of templates) {
        const sql = `
          INSERT INTO communication_templates (
            template_name, template_type, subject, content, variables, created_by
          ) VALUES (?, ?, ?, ?, ?, 'SYSTEM')
          ON DUPLICATE KEY UPDATE
          subject = VALUES(subject),
          content = VALUES(content),
          variables = VALUES(variables)
        `;

        await db.queryTrust(trustCode, sql, [
          template.name,
          template.type,
          template.subject || null,
          template.content,
          JSON.stringify(template.variables || [])
        ]);
      }

      logger.info('Default email templates created', { trustCode, count: templates.length });
    } catch (error) {
      logger.error('Failed to create default email templates:', error);
      throw error;
    }
  }

  async createDefaultSMSTemplates(trustCode) {
    try {
      const smsProviders = require('../communication/sms-service-providers');
      const templates = smsProviders.getDefaultTemplates();

      for (const template of templates) {
        const sql = `
          INSERT INTO communication_templates (
            template_name, template_type, subject, content, variables, created_by
          ) VALUES (?, ?, ?, ?, ?, 'SYSTEM')
          ON DUPLICATE KEY UPDATE
          content = VALUES(content),
          variables = VALUES(variables)
        `;

        await db.queryTrust(trustCode, sql, [
          template.name,
          template.type,
          null, // SMS templates don't have subjects
          template.content,
          JSON.stringify(template.variables || [])
        ]);
      }

      logger.info('Default SMS templates created', { trustCode, count: templates.length });
    } catch (error) {
      logger.error('Failed to create default SMS templates:', error);
      throw error;
    }
  }

  // Communication provider management
  async getCommunicationProviders(trustCode, type = null) {
    try {
      let configKey = type ? `${type.toLowerCase()}_provider_config` : '%_provider_config';

      const sql = `
        SELECT config_key, config_value, created_at, updated_at
        FROM trust_config
        WHERE config_key LIKE ?
      `;

      const results = await db.queryTrust(trustCode, sql, [configKey]);

      return results.map(result => {
        const providerType = result.config_key.replace('_provider_config', '').toUpperCase();
        const config = JSON.parse(result.config_value);

        return {
          type: providerType,
          provider: config.provider,
          configuration: this.maskSensitiveData(config),
          created_at: result.created_at,
          updated_at: result.updated_at
        };
      });
    } catch (error) {
      throw new Error(`Failed to get communication providers: ${error.message}`);
    }
  }

  async testCommunicationProvider(trustCode, providerType, testData) {
    try {
      const communicationService = require('../communication/communication-service');

      if (providerType.toLowerCase() === 'email') {
        // Test email sending
        await communicationService.initializeEmailProvider(trustCode);
        const result = await communicationService.sendEmail(
          {
            to: testData.recipient,
            subject: 'Test Email - School ERP Configuration',
            html: `<p>This is a test email sent at ${new Date().toLocaleString()}</p>`,
            text: `This is a test email sent at ${new Date().toLocaleString()}`
          },
          trustCode
        );

        return { success: true, message: 'Test email sent successfully', result };
      } else if (providerType.toLowerCase() === 'sms') {
        // Test SMS sending
        await communicationService.initializeSMSProvider(trustCode);
        const result = await communicationService.sendSMS(
          {
            to: testData.recipient,
            message: `Test SMS from School ERP - ${new Date().toLocaleString()}`
          },
          trustCode
        );

        return { success: true, message: 'Test SMS sent successfully', result };
      }

      throw new Error(`Unsupported provider type: ${providerType}`);
    } catch (error) {
      logger.error('Communication provider test failed:', error);
      return {
        success: false,
        message: `Test failed: ${error.message}`
      };
    }
  }

  async getCommunicationStats(trustCode, dateRange) {
    try {
      const sql = `
        SELECT 
          type,
          provider,
          status,
          COUNT(*) as count,
          DATE(created_at) as date
        FROM communication_logs
        WHERE created_at >= ? AND created_at <= ?
        GROUP BY type, provider, status, DATE(created_at)
        ORDER BY date DESC
      `;

      const results = await db.queryTrust(trustCode, sql, [dateRange.start, dateRange.end]);

      // Aggregate statistics
      const stats = {
        email: { sent: 0, delivered: 0, failed: 0 },
        sms: { sent: 0, delivered: 0, failed: 0 },
        daily: {}
      };

      results.forEach(row => {
        const type = row.type.toLowerCase();
        if (stats[type]) {
          if (row.status === 'SENT') stats[type].sent += row.count;
          if (row.status === 'DELIVERED') stats[type].delivered += row.count;
          if (row.status === 'FAILED') stats[type].failed += row.count;
        }

        if (!stats.daily[row.date]) {
          stats.daily[row.date] = { email: 0, sms: 0 };
        }
        stats.daily[row.date][type] += row.count;
      });

      return stats;
    } catch (error) {
      throw new Error(`Failed to get communication stats: ${error.message}`);
    }
  }

  async getSystemStatus() {
    try {
      const health = await db.healthCheck();

      const configSql = 'SELECT config_key, config_value FROM system_config';
      const configs = await db.querySystem(configSql);

      const trustCountSql = 'SELECT COUNT(*) as count FROM trusts WHERE status = "ACTIVE"';
      const trustCount = await db.querySystem(trustCountSql);

      return {
        database: health,
        configuration: configs.reduce((acc, config) => {
          acc[config.config_key] = config.config_value;
          return acc;
        }, {}),
        activeTrusts: trustCount[0].count,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get system status: ${error.message}`);
    }
  }
}

module.exports = new SetupService();
