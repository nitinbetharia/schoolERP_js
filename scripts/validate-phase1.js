/**
 * Phase 1 Validation Script - Q29 Compliance Check
 * Ensures all configuration follows JSON + .env secrets pattern
 */

require('dotenv').config();
const config = require('../config/index');

class Phase1Validator {
  constructor() {
    this.violations = [];
    this.passed = [];
  }

  /**
   * Validate Q29: JSON config files + .env for secrets only
   */
  validateQ29Compliance() {
    console.log('🔍 Validating Q29: JSON config files + .env for secrets only');
    console.log('='.repeat(60));

    // Check database configuration
    this.checkDatabaseConfig();

    // Check environment variables
    this.checkEnvironmentVariables();

    // Check application configuration
    this.checkApplicationConfig();

    // Report results
    this.reportResults();
  }

  checkDatabaseConfig() {
    const dbConfig = config.get('database');

    // ✅ These should be in JSON config (not secrets)
    this.validateConfigValue(
      'database.connection.host',
      dbConfig.connection?.host,
      '140.238.167.36'
    );
    this.validateConfigValue('database.connection.port', dbConfig.connection?.port, 3306);
    this.validateConfigValue('database.system.name', dbConfig.system?.name, 'school_erp_system');
    this.validateConfigValue(
      'database.tenant.prefix',
      dbConfig.tenant?.prefix,
      'school_erp_trust_'
    );
    this.validateConfigValue('database.pool.max', dbConfig.pool?.max, 15);

    // ❌ These should NOT be in JSON config (secrets)
    if (dbConfig.connection?.user) {
      this.violations.push('❌ DB user found in JSON config - should be in .env');
    } else {
      this.passed.push('✅ DB user correctly in .env, not JSON config');
    }

    if (dbConfig.connection?.password) {
      this.violations.push('❌ DB password found in JSON config - should be in .env');
    } else {
      this.passed.push('✅ DB password correctly in .env, not JSON config');
    }
  }

  checkEnvironmentVariables() {
    // ✅ These should be in .env (secrets)
    this.validateEnvSecret('DB_USER', process.env.DB_USER);
    this.validateEnvSecret('DB_PASSWORD', process.env.DB_PASSWORD);
    this.validateEnvSecret('SESSION_SECRET', process.env.SESSION_SECRET);

    // ❌ These should NOT be in .env (not secrets)
    const forbiddenEnvVars = [
      'DB_HOST',
      'DB_PORT',
      'SYSTEM_DB_NAME',
      'TRUST_DB_PREFIX',
      'DB_SSL',
      'DEFAULT_TRUST_CODE',
      'TENANT_STRATEGY'
    ];

    forbiddenEnvVars.forEach(envVar => {
      if (process.env[envVar]) {
        this.violations.push(`❌ ${envVar} found in .env - should be in JSON config`);
      } else {
        this.passed.push(`✅ ${envVar} correctly NOT in .env`);
      }
    });
  }

  checkApplicationConfig() {
    const appConfig = config.get('app');
    const multiTenantConfig = config.get('multiTenant');

    // ✅ These should be in JSON config
    this.validateConfigValue('app.port', appConfig?.port, 3000);
    this.validateConfigValue(
      'multiTenant.defaultTrustCode',
      multiTenantConfig?.defaultTrustCode,
      'demo'
    );
    this.validateConfigValue('multiTenant.strategy', multiTenantConfig?.strategy, 'subdomain');
  }

  validateConfigValue(path, actual, expected) {
    if (actual === expected) {
      this.passed.push(`✅ ${path}: ${actual} (from JSON config)`);
    } else {
      this.violations.push(`❌ ${path}: expected ${expected}, got ${actual}`);
    }
  }

  validateEnvSecret(name, value) {
    if (value) {
      this.passed.push(`✅ ${name}: present in .env (secret)`);
    } else {
      this.violations.push(`❌ ${name}: missing from .env`);
    }
  }

  reportResults() {
    console.log('\n📊 VALIDATION RESULTS');
    console.log('='.repeat(40));

    if (this.passed.length > 0) {
      console.log('\n✅ PASSED CHECKS:');
      this.passed.forEach(check => console.log(`  ${check}`));
    }

    if (this.violations.length > 0) {
      console.log('\n❌ VIOLATIONS FOUND:');
      this.violations.forEach(violation => console.log(`  ${violation}`));
      console.log('\n🚨 PHASE 1 FAILED - Fix violations before proceeding');
      process.exit(1);
    } else {
      console.log('\n🎉 PHASE 1 COMPLETE - All Q29 requirements satisfied!');
      console.log('✅ Configuration follows JSON + .env secrets pattern');
      console.log('✅ Ready to proceed to Phase 2');
    }
  }
}

// Run validation
const validator = new Phase1Validator();
validator.validateQ29Compliance();
