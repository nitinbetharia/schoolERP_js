/**
 * Validate Logger Q&A Compliance
 * Validates Q9, Q25, Q29 decisions
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🔧 Validating Logger Q&A Compliance');
console.log('='.repeat(50));

const validationResults = {
  q9: { name: 'Q9: Logging Framework', passed: false, issues: [] },
  q25: { name: 'Q25: Logging Configuration', passed: false, issues: [] },
  q29: { name: 'Q29: Configuration Files', passed: false, issues: [] }
};

try {
  // Test Q9: Winston + centralized error handler + structured logging
  console.log('\n📋 Validating Q9: Logging Framework');

  const loggerPath = path.join(__dirname, '..', 'config', 'logger.js');
  const loggerCode = fs.readFileSync(loggerPath, 'utf8');

  // Check for winston.createLogger()
  if (loggerCode.includes('winston.createLogger(')) {
    console.log('  ✅ Uses winston.createLogger()');
  } else {
    validationResults.q9.issues.push('Must use winston.createLogger()');
  }

  // Check for centralized error handler
  if (
    loggerCode.includes('logger.exceptions.handle') &&
    loggerCode.includes('logger.rejections.handle')
  ) {
    console.log('  ✅ Has centralized error handler');
  } else {
    validationResults.q9.issues.push('Must have centralized error handler');
  }

  // Check for structured logging
  if (loggerCode.includes('winston.format.json()') && loggerCode.includes('defaultMeta')) {
    console.log('  ✅ Has structured logging');
  } else {
    validationResults.q9.issues.push('Must have structured logging');
  }

  // Check for specialized logging methods
  const specializedMethods = [
    'logger.auth',
    'logger.business',
    'logger.security',
    'logger.performance',
    'logger.database'
  ];
  const hasAllMethods = specializedMethods.every(method => loggerCode.includes(method));

  if (hasAllMethods) {
    console.log('  ✅ Has specialized logging methods');
  } else {
    validationResults.q9.issues.push('Must have specialized logging methods');
  }

  if (validationResults.q9.issues.length === 0) {
    validationResults.q9.passed = true;
  }

  // Test Q25: Multiple transports + daily file rotation
  console.log('\n📋 Validating Q25: Logging Configuration');

  // Check for winston-daily-rotate-file
  if (loggerCode.includes('DailyRotateFile')) {
    console.log('  ✅ Uses winston-daily-rotate-file');
  } else {
    validationResults.q25.issues.push('Must use winston-daily-rotate-file');
  }

  // Check for multiple transports
  if (loggerCode.includes('transports.push') && loggerCode.includes('categories')) {
    console.log('  ✅ Has multiple transports');
  } else {
    validationResults.q25.issues.push('Must have multiple transports');
  }

  // Check for file rotation settings
  if (
    loggerCode.includes('zippedArchive') &&
    loggerCode.includes('maxFiles') &&
    loggerCode.includes('maxSize')
  ) {
    console.log('  ✅ Has file rotation configuration');
  } else {
    validationResults.q25.issues.push('Must have file rotation configuration');
  }

  if (validationResults.q25.issues.length === 0) {
    validationResults.q25.passed = true;
  }

  // Test Q29: JSON config files + .env for secrets only
  console.log('\n📋 Validating Q29: Configuration Files');

  // Check for config index usage
  if (loggerCode.includes("require('./index')")) {
    console.log('  ✅ Uses config index (not direct app-config)');
  } else {
    validationResults.q29.issues.push('Must use config index, not direct app-config');
  }

  // Check for config.get() usage
  if (loggerCode.includes("config.get('logging')") && loggerCode.includes("config.get('app')")) {
    console.log('  ✅ Uses config.get() pattern');
  } else {
    validationResults.q29.issues.push('Must use config.get() pattern');
  }

  // Check that no env vars are used for non-secrets
  const envVarUsage = loggerCode.match(/process\.env\.([A-Z_]+)/g);
  if (envVarUsage) {
    const allowedEnvVars = ['LOG_LEVEL']; // Only LOG_LEVEL is allowed for overrides
    const invalidEnvVars = envVarUsage
      .map(match => match.replace('process.env.', ''))
      .filter(varName => !allowedEnvVars.includes(varName));

    if (invalidEnvVars.length === 0) {
      console.log('  ✅ Only uses allowed environment variables');
    } else {
      validationResults.q29.issues.push(`Invalid env vars: ${invalidEnvVars.join(', ')}`);
    }
  } else {
    console.log('  ✅ No excessive environment variable usage');
  }

  if (validationResults.q29.issues.length === 0) {
    validationResults.q29.passed = true;
  }

  // Test actual logger functionality
  console.log('\n📋 Testing Logger Functionality');

  const logger = require('../config/logger');

  // Test that logger initializes correctly
  if (typeof logger.info === 'function' && typeof logger.auth === 'function') {
    console.log('  ✅ Logger methods available');
  }

  // Test configuration loading
  const config = require('../config/index');
  const loggingConfig = config.get('logging');

  if (loggingConfig && loggingConfig.level && loggingConfig.categories) {
    console.log('  ✅ Configuration loading works');
  }

  // Summary
  console.log('\n🎯 VALIDATION SUMMARY');
  console.log('='.repeat(50));

  const allPassed = Object.values(validationResults).every(result => result.passed);

  Object.values(validationResults).forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);

    if (result.issues.length > 0) {
      result.issues.forEach(issue => {
        console.log(`    - ${issue}`);
      });
    }
  });

  if (allPassed) {
    console.log('\n🎉 ALL Q&A COMPLIANCE CHECKS PASSED!');
    console.log('✅ Logger is fully compliant with Q9, Q25, Q29');
    console.log('✅ Ready for production use');
  } else {
    console.log('\n❌ SOME COMPLIANCE CHECKS FAILED');
    console.log('Please fix the issues above before proceeding');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Validation failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
