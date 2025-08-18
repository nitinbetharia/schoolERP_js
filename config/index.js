/**
 * Configuration Manager
 * Centralized configuration system to eliminate hardcoding
 */

// Load environment variables first
require('dotenv').config();

const path = require('path');
const fs = require('fs');

class ConfigManager {
  constructor() {
    this.config = {};
    this.loadConfiguration();
  }

  loadConfiguration() {
    try {
      // Load main app configuration from JavaScript file
      const appConfigPath = path.join(__dirname, 'app-config.js');
      delete require.cache[require.resolve(appConfigPath)]; // Clear cache
      const appConfig = require(appConfigPath);

      // Load JSON-based configurations
      const appConfigJsonPath = path.join(__dirname, 'app-config.json');
      const appConfigJson = JSON.parse(fs.readFileSync(appConfigJsonPath, 'utf8'));

      // Load RBAC configuration
      const rbacConfigPath = path.join(__dirname, 'rbac.json');
      const rbacConfig = JSON.parse(fs.readFileSync(rbacConfigPath, 'utf8'));

      // Merge configurations (JS config takes precedence)
      this.config = {
        ...appConfigJson,
        ...appConfig,
        rbac: rbacConfig
      };

      // Override with environment variables
      this.applyEnvironmentOverrides();
    } catch (error) {
      console.error('Failed to load configuration:', error.message);
      process.exit(1);
    }
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
      ...this.config.database,
      // Secrets from environment
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
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
