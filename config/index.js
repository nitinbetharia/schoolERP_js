/**
 * Configuration Manager - Q&A DECISIONS ENFORCED
 * All configurations must comply with SINGLE_SOURCE_OF_TRUTH.md
 */

// Load environment variables first
require('dotenv').config();

const path = require('path');
const fs = require('fs');

class ConfigManager {
  constructor() {
    this.config = {};
    this.loadConfiguration();
    this.enforceQandADecisions();
  }

  loadConfiguration() {
    try {
      // Q29: JSON config files only (no JS config files)
      // Load JSON-based configurations
      const appConfigJsonPath = path.join(__dirname, 'app-config.json');
      const appConfigJson = JSON.parse(fs.readFileSync(appConfigJsonPath, 'utf8'));

      // Load RBAC configuration
      const rbacConfigPath = path.join(__dirname, 'rbac.json');
      const rbacConfig = JSON.parse(fs.readFileSync(rbacConfigPath, 'utf8'));

      // Q59: Load business constants (no hardcoded values)
      const businessConstants = require('./business-constants');

      // Use JSON config as main configuration
      this.config = {
        ...appConfigJson,
        rbac: rbacConfig,
        constants: businessConstants
      };

      // Override with environment variables
      this.applyEnvironmentOverrides();
    } catch (error) {
      console.error('Failed to load configuration:', error.message);
      process.exit(1);
    }
  }

  /**
   * Enforce Q&A technical decisions from SINGLE_SOURCE_OF_TRUTH.md
   */
  enforceQandADecisions() {
    // Q11: Connection pooling must match decision
    if (this.config.database && this.config.database.pool) {
      this.config.database.pool = { max: 15, min: 2, acquire: 60000, idle: 300000 };
    }

    // Q17: Salt rounds must be 12
    if (this.config.security && this.config.security.bcrypt) {
      this.config.security.bcrypt.saltRounds = 12;
    }

    // Q37: Role-based session timeouts
    if (this.config.session) {
      this.config.session.timeouts = {
        ADMIN: 8 * 60 * 60 * 1000, // 8 hours
        TEACHER: 12 * 60 * 60 * 1000, // 12 hours
        PARENT: 24 * 60 * 60 * 1000 // 24 hours
      };
    }

    // Q23: Middleware chain order enforcement
    this.config.middleware = {
      order: ['helmet', 'cors', 'rateLimiter', 'auth', 'validation'],
      enforced: true
    };

    // Q26: Tailwind CSS via CDN
    this.config.frontend = {
      css: 'Tailwind CSS CDN',
      javascript: 'Alpine.js',
      templates: 'EJS with includes'
    };

    // Add technical decisions metadata
    this.config._technicalDecisions = {
      source: 'SINGLE_SOURCE_OF_TRUTH.md',
      version: 'FINAL',
      decisionCount: 59, // Updated to include Q59
      lastUpdated: '2025-08-19',
      immutable: true
    };

    console.log(
      '✅ Configuration enforced against Q&A technical decisions from SINGLE_SOURCE_OF_TRUTH.md'
    );
  }

  applyEnvironmentOverrides() {
    // Only apply environment variables for secrets and deployment-specific overrides

    // Environment-specific overrides (not secrets, but deployment config)
    if (process.env.NODE_ENV) {
      this.config.app.environment = process.env.NODE_ENV;
    }

    // Secrets only (should come from environment for security)
    // Session secret
    if (process.env.SESSION_SECRET) {
      this.config.security.sessionSecret = process.env.SESSION_SECRET;
    }

    // Note: All other configuration comes from JSON file
    // Only secrets and environment-specific values should be in env vars
  }

  // Getter methods for easy access
  get(path) {
    return this.getNestedValue(this.config, path);
  }

  getApp() {
    return this.config.app;
  }

  getSecurity() {
    return this.config.security;
  }

  getDatabase() {
    return {
      ...this.config.database
      // Q29: Secrets from environment only
      // Note: user/password are secrets, everything else from JSON config
    };
  }

  // Database Names Helper Methods
  getDbNames() {
    return (
      this.config.database?.db_names || {
        system: 'school_erp_system',
        trust_prefix: 'school_erp_trust_',
        getTrustDbName: trustCode => `school_erp_trust_${trustCode}`,
        getSystemDbName: () => 'school_erp_system'
      }
    );
  }

  getSystemDbName() {
    return this.getDbNames().system;
  }

  getTrustDbName(trustCode) {
    if (!trustCode) {
      throw new Error('Trust code is required to generate trust database name');
    }
    return `${this.getDbNames().trust_prefix}${trustCode}`;
  }

  getTrustDbPrefix() {
    return this.getDbNames().trust_prefix;
  }

  getLogging() {
    return this.config.logging;
  }

  getValidation() {
    return this.config.validation;
  }

  getRoles() {
    return this.config.roles;
  }

  getUI() {
    return this.config.ui;
  }

  getFeatures() {
    return this.config.features;
  }

  getAPI() {
    return this.config.api;
  }

  getModules() {
    return this.config.modules;
  }

  getErrors() {
    return this.config.errors;
  }

  getRoutes() {
    return this.config.routes;
  }

  getRBAC() {
    return this.config.rbac;
  }

  // Helper method to get nested values
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  // Check if feature is enabled
  isFeatureEnabled(feature) {
    return this.config.features[feature] === true;
  }

  // Check if module is enabled
  isModuleEnabled(module) {
    return this.config.modules[module]?.enabled === true;
  }

  // Get error configuration by code
  getErrorConfig(code) {
    return (
      this.config.errors.codes[code] || {
        httpStatus: 500,
        message: 'Internal server error'
      }
    );
  }

  // Get role hierarchy level
  getRoleLevel(role) {
    return this.config.roles.hierarchy[role] || 0;
  }

  // Check if role is system level
  isSystemRole(role) {
    return this.config.roles.system.includes(role);
  }

  // Check if role is trust level
  isTrustRole(role) {
    return this.config.roles.trust.includes(role);
  }

  // Validation helpers
  getPasswordPolicy() {
    return this.config.validation.password;
  }

  getEmailPolicy() {
    return this.config.validation.email;
  }

  // Rate limiting configuration
  getRateLimitConfig() {
    return this.config.security.rateLimiting;
  }

  // Session configuration
  getSessionConfig() {
    return {
      secret: this.config.security.sessionSecret,
      maxAge: this.config.security.sessionMaxAge,
      rememberMeMaxAge: this.config.security.rememberMeMaxAge
    };
  }

  // CORS configuration
  getCORSConfig() {
    return this.config.api.cors;
  }

  // Development mode check
  isDevelopment() {
    return this.config.app.environment === 'development';
  }

  // Production mode check
  isProduction() {
    return this.config.app.environment === 'production';
  }

  // Get complete configuration (for debugging)
  getAll() {
    return this.config;
  }
}

// Export singleton instance
module.exports = new ConfigManager();
