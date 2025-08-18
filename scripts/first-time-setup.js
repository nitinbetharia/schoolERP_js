#!/usr/bin/env node

/**
 * First-time Setup Script
 * Installs dependencies and sets up the database
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 School ERP - First Time Setup');
console.log('=====================================\n');

async function firstTimeSetup() {
  try {
    // Check if .env exists
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
      console.log('❌ .env file not found!');
      console.log('📝 Please copy .env.example to .env and configure your database settings');
      console.log('📝 Then run: npm run setup');
      process.exit(1);
    }

    console.log('1️⃣  Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed\n');

    console.log('2️⃣  Setting up database...');
    const setupDatabase = require('./setup-database');
    await setupDatabase.setupDatabase();
    console.log('✅ Database setup completed\n');

    console.log('3️⃣  Running linting and formatting...');
    try {
      execSync('npm run lint -- --fix', { stdio: 'inherit' });
      execSync('npm run format', { stdio: 'inherit' });
      console.log('✅ Code formatting completed\n');
    } catch (error) {
      console.log('⚠️  Linting/formatting had some issues (non-critical)\n');
    }

    console.log('🎉 Setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Open: http://localhost:3000');
    console.log('3. Login with system admin credentials shown above');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  firstTimeSetup();
}

module.exports = { firstTimeSetup };