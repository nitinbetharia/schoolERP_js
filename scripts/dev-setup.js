/**
 * Development Setup Script
 * Helps set up the development environment and validates configuration
 */

const fs = require('fs');
const path = require('path');

function createDevEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');

  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    console.log('✓ .env file already exists');
    return;
  }

  // Copy from .env.example if it exists
  if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envPath, envContent);
    console.log('✓ Created .env file from .env.example');
    console.log('📝 Please update database credentials in .env file');
  } else {
    // Create basic .env file
    const basicEnv = `# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_SSL=false

# Database Names
SYSTEM_DB_NAME=school_erp_system
TRUST_DB_PREFIX=school_erp_trust_

# Application Configuration  
NODE_ENV=development
PORT=3000
SESSION_SECRET=dev-session-secret-change-in-production

# Multi-tenant Configuration
DEFAULT_TRUST_CODE=demo
TENANT_STRATEGY=subdomain
`;

    fs.writeFileSync(envPath, basicEnv);
    console.log('✓ Created basic .env file');
    console.log('📝 Please update database credentials in .env file');
  }
}

function validateConfig() {
  console.log('\n=== Configuration Validation ===');

  try {
    // Load config
    require('dotenv').config();
    const appConfig = require('../config/app-config');

    console.log('✓ Configuration loaded successfully');

    // Validate database config
    const dbConfig = appConfig.database;
    console.log(`✓ System Database: ${dbConfig.system.name}`);
    console.log(`✓ Trust Database Prefix: ${dbConfig.trust.prefix}`);
    console.log(`✓ Database Host: ${dbConfig.connection.host}:${dbConfig.connection.port}`);

    // Validate multi-tenant config
    const mtConfig = appConfig.multiTenant;
    console.log(`✓ Multi-tenant enabled: ${mtConfig.enabled}`);
    console.log(`✓ Default trust code: ${mtConfig.defaultTrustCode}`);
    console.log(`✓ Tenant strategy: ${mtConfig.tenantResolution.strategy}`);

    // Check environment
    const env = appConfig.environment;
    console.log(`✓ Environment: ${env.name}`);
    console.log(`✓ Timezone: ${env.timezone}`);
    console.log(`✓ Locale: ${env.locale}`);

    return true;
  } catch (error) {
    console.error('✗ Configuration error:', error.message);
    return false;
  }
}

function showNextSteps() {
  console.log('\n=== Next Steps ===');
  console.log('1. Update database credentials in .env file');
  console.log('2. Install MySQL and create databases:');
  console.log('   - school_erp_system (system database)');
  console.log('   - school_erp_trust_demo (demo trust database)');
  console.log('3. Run: npm run test:multi-tenant');
  console.log('4. Run: npm run system:migrate');
  console.log('5. Run: npm run tenant:create -- --code=demo --name="Demo Trust"');
  console.log('6. Start development: npm run dev');
}

function main() {
  console.log('🚀 School ERP Development Setup\n');

  // Create .env file
  createDevEnv();

  // Validate configuration
  const configValid = validateConfig();

  if (configValid) {
    console.log('\n✅ Configuration is valid!');
    showNextSteps();
  } else {
    console.log('\n❌ Please fix configuration errors before proceeding');
  }
}

// Run setup if called directly
if (require.main === module) {
  main();
}

module.exports = { createDevEnv, validateConfig, showNextSteps };
