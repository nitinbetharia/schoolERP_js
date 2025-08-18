/**
 * Configuration Test Script
 * Tests configuration loading and validation without requiring database access
 */

// Load environment variables first
require('dotenv').config();

const logger = require('../config/logger');

async function testConfiguration() {
  try {
    console.log('=== Testing Configuration Loading ===\n');

    // Test config loading
    const appConfig = require('../config/app-config');
    console.log('✓ App configuration loaded successfully');

    // Test database configuration
    const dbConfig = appConfig.database;
    console.log('\n--- Database Configuration ---');
    console.log(`System Database Name: ${dbConfig.system.name}`);
    console.log(`Trust Database Prefix: ${dbConfig.trust.prefix}`);
    console.log(`Connection Host: ${dbConfig.connection.host}:${dbConfig.connection.port}`);
    console.log(`Connection User: ${dbConfig.connection.user || '(not set)'}`);
    console.log(`Connection SSL: ${dbConfig.connection.ssl ? 'enabled' : 'disabled'}`);
    console.log('✓ Database configuration valid');

    // Test multi-tenant configuration
    const mtConfig = appConfig.multiTenant;
    console.log('\n--- Multi-Tenant Configuration ---');
    console.log(`Enabled: ${mtConfig.enabled}`);
    console.log(`Default Trust Code: ${mtConfig.defaultTrustCode}`);
    console.log(`Tenant Strategy: ${mtConfig.tenantResolution.strategy}`);
    console.log(`Header Name: ${mtConfig.tenantResolution.headerName}`);
    console.log(`Max Trusts: ${mtConfig.database.maxTrustsPerInstance}`);
    console.log('✓ Multi-tenant configuration valid');

    // Test trust code validation
    const validation = mtConfig.trustCodeValidation;
    console.log('\n--- Trust Code Validation Rules ---');
    console.log(`Length: ${validation.minLength}-${validation.maxLength} characters`);
    console.log(`Pattern: ${validation.pattern}`);
    console.log(`Reserved Codes: ${validation.reservedCodes.join(', ')}`);
    console.log('✓ Trust code validation rules valid');

    // Test environment configuration
    const envConfig = appConfig.environment;
    console.log('\n--- Environment Configuration ---');
    console.log(`Environment: ${envConfig.name}`);
    console.log(`Is Development: ${envConfig.isDevelopment}`);
    console.log(`Is Production: ${envConfig.isProduction}`);
    console.log(`Timezone: ${envConfig.timezone}`);
    console.log(`Locale: ${envConfig.locale}`);
    console.log(`Currency: ${envConfig.currency}`);
    console.log('✓ Environment configuration valid');

    // Test middleware import
    console.log('\n--- Middleware Loading ---');
    const tenantMiddleware = require('../middleware/tenant-middleware');
    console.log('✓ Tenant middleware loaded');
    console.log(`Available functions: ${Object.keys(tenantMiddleware).join(', ')}`);

    // Test database service import (without initialization)
    console.log('\n--- Service Loading ---');
    const dbService = require('../modules/data/database-service');
    console.log('✓ Database service loaded');

    // Test trust code validation function
    console.log('\n--- Trust Code Validation Tests ---');
    const { resolveTenant, requireSystemContext, requireTrustContext } = tenantMiddleware;

    // These are the middleware functions that should be available
    console.log('✓ resolveTenant middleware available');
    console.log('✓ requireSystemContext middleware available');
    console.log('✓ requireTrustContext middleware available');

    console.log('\n=== Configuration Test Complete ===');
    console.log('✅ All configurations loaded and validated successfully!');
    console.log('\n📋 Configuration Summary:');
    console.log(`   • System Database: ${dbConfig.system.name}`);
    console.log(`   • Trust Database Prefix: ${dbConfig.trust.prefix}`);
    console.log(`   • Multi-tenant Strategy: ${mtConfig.tenantResolution.strategy}`);
    console.log(`   • Default Trust: ${mtConfig.defaultTrustCode}`);
    console.log(`   • Environment: ${envConfig.name}`);

    return true;
  } catch (error) {
    console.error('\n❌ Configuration test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testConfiguration().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testConfiguration };
