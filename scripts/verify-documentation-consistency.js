#!/usr/bin/env node

/**
 * Documentation Consistency Verification Script
 * 
 * This script automatically checks for inconsistencies across all documentation files
 * in the School ERP project to ensure 100% consistency.
 * 
 * Usage: node scripts/verify-documentation-consistency.js
 */

const fs = require('fs');
const path = require('path');

class DocumentationVerifier {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.mainDocPath = path.join(__dirname, '../docs/COMPLETE_DOCUMENTATION.md');
    this.readmePath = path.join(__dirname, '../README.md');
    this.copilotInstructionsPath = path.join(__dirname, '../docs/archived/COPILOT_INSTRUCTIONS.md');
    
    // Expected consistent values
    this.expectedValues = {
      DATABASE_NAMES: {
        SYSTEM: 'school_erp_system',
        TRUST_PREFIX: 'school_erp_trust_'
      },
      NODE_VERSION: '18+',
      MYSQL_COMMAND: 'mysqlsh',
      DEFAULT_CREDENTIALS: {
        EMAIL: 'admin@system.local',
        PASSWORD: 'admin123'
      },
      TECH_STACK: {
        RUNTIME: 'Node.js',
        FRAMEWORK: 'Express.js',
        DATABASE: 'MySQL',
        ORM: 'Sequelize',
        TEMPLATES: 'EJS',
        VALIDATION: 'Joi',
        CSS: 'Tailwind CSS'
      }
    };
  }

  /**
   * Main verification method
   */
  async verify() {
    console.log('🔍 Starting Documentation Consistency Verification...\n');
    console.log('📋 Now focusing on consolidated documentation structure...\n');
    
    try {
      await this.checkMainDocumentation();
      await this.checkDatabaseNameConsistency();
      await this.checkVersionConsistency();
      await this.checkCredentialsConsistency();
      await this.checkMySQLCommandConsistency();
      await this.checkTechStackConsistency();
      await this.checkConfigurationPatterns();
      
      this.printResults();
    } catch (error) {
      console.error('❌ Verification failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Check main documentation files exist and are properly formatted
   */
  async checkMainDocumentation() {
    console.log('📖 Checking main documentation structure...');
    
    // Check if COMPLETE_DOCUMENTATION.md exists
    if (!fs.existsSync(this.mainDocPath)) {
      this.errors.push({
        type: 'MISSING_MAIN_DOC',
        message: 'docs/COMPLETE_DOCUMENTATION.md is missing',
        file: 'docs/ directory'
      });
      return;
    }

    // Check if README.md points to the consolidated doc
    if (fs.existsSync(this.readmePath)) {
      const readmeContent = fs.readFileSync(this.readmePath, 'utf8');
      if (!readmeContent.includes('docs/COMPLETE_DOCUMENTATION.md')) {
        this.errors.push({
          type: 'README_REFERENCE',
          message: 'README.md should reference docs/COMPLETE_DOCUMENTATION.md',
          file: 'README.md'
        });
      }
    }

    // Check main doc content structure
    const mainDocContent = fs.readFileSync(this.mainDocPath, 'utf8');
    const requiredSections = [
      'Single Source of Truth',
      'Architecture Overview',
      'Database Design',
      'Development Standards',
      'API Reference'
    ];

    requiredSections.forEach(section => {
      if (!mainDocContent.includes(section)) {
        this.warnings.push({
          type: 'MISSING_SECTION',
          message: `Main documentation missing section: ${section}`,
          file: 'COMPLETE_DOCUMENTATION.md'
        });
      }
    });

    console.log('  ✅ Main documentation structure checked');
  }

  /**
   * Check database naming consistency
   */
  async checkDatabaseNameConsistency() {
    console.log('📊 Checking database name consistency...');
    
    const files = await this.getAllDocFiles();
    const patterns = [
      { regex: /school_erp_master/gi, violation: 'Should be school_erp_system' },
      { regex: /school_erp_trust_demo/gi, context: 'Example usage' },
      { regex: /school_erp_system/gi, expected: true },
      { regex: /school_erp_trust_/gi, expected: true }
    ];

    for (const file of files) {
      const content = await this.readFile(file);
      
      // Check for violations
      if (content.match(patterns[0].regex)) {
        this.errors.push(`${file}: Contains 'school_erp_master' instead of 'school_erp_system'`);
      }
    }
  }

  /**
   * Check Node.js version consistency
   */
  async checkVersionConsistency() {
    console.log('🔢 Checking version consistency...');
    
    const files = await this.getAllDocFiles();
    const versionPatterns = [
      /Node\.?js\s*[><=]*\s*(\d+[\.\+]*\d*)/gi,
      /runtime.*Node\.?js\s*[><=]*\s*(\d+[\.\+]*\d*)/gi
    ];

    for (const file of files) {
      const content = await this.readFile(file);
      
      for (const pattern of versionPatterns) {
        const matches = [...content.matchAll(pattern)];
        for (const match of matches) {
          const version = match[1];
          if (version && !['18+', '18', '18.0', '18.0.0'].includes(version)) {
            this.warnings.push(`${file}: Node.js version '${version}' should be '18+'`);
          }
        }
      }
    }
  }

  /**
   * Check default credentials consistency
   */
  async checkCredentialsConsistency() {
    console.log('🔑 Checking default credentials consistency...');
    
    const files = await this.getAllDocFiles();
    files.push(this.readmePath);

    const credentialPatterns = [
      { 
        regex: /(?:email|Email|EMAIL).*(?:nitin@gmail\.com|admin@system\.local)/gi,
        field: 'email'
      },
      { 
        regex: /(?:password|Password|PASSWORD).*(?:nitin@123|admin123)/gi,
        field: 'password'
      }
    ];

    for (const file of files) {
      const content = await this.readFile(file);
      
      // Check for old credentials
      if (content.includes('nitin@gmail.com') || content.includes('nitin@123')) {
        this.errors.push(`${file}: Contains old credentials (nitin@gmail.com/nitin@123) instead of admin@system.local/admin123`);
      }
    }
  }

  /**
   * Check MySQL command consistency
   */
  async checkMySQLCommandConsistency() {
    console.log('🛠️ Checking MySQL command consistency...');
    
    const files = await this.getAllDocFiles();
    const mysqlPatterns = [
      { regex: /mysql\s+-[hu]/gi, violation: 'Should use mysqlsh instead' },
      { regex: /mysql\s+--/gi, violation: 'Should use mysqlsh instead' }
    ];

    for (const file of files) {
      const content = await this.readFile(file);
      
      for (const pattern of mysqlPatterns) {
        if (content.match(pattern.regex)) {
          // Skip if it's in the instruction file showing old commands as examples
          if (!file.includes('CRITICAL_MYSQL_SHELL_INSTRUCTION.md')) {
            this.warnings.push(`${file}: Contains 'mysql' command - ${pattern.violation}`);
          }
        }
      }
    }
  }

  /**
   * Check technology stack consistency
   */
  async checkTechStackConsistency() {
    console.log('⚡ Checking technology stack consistency...');
    
    const files = await this.getAllDocFiles();
    const techChecks = [
      { tech: 'Express', expected: ['Express.js', 'Express'], variations: ['express.js', 'ExpressJS'] },
      { tech: 'MySQL', expected: ['MySQL'], variations: ['MySql', 'mysql', 'My SQL'] },
      { tech: 'Sequelize', expected: ['Sequelize'], variations: ['sequelize'] },
      { tech: 'EJS', expected: ['EJS'], variations: ['ejs', 'Ejs'] },
      { tech: 'Tailwind', expected: ['Tailwind CSS', 'Tailwind'], variations: ['tailwind', 'TailwindCSS'] }
    ];

    for (const file of files) {
      const content = await this.readFile(file);
      
      for (const check of techChecks) {
        for (const variation of check.variations) {
          const regex = new RegExp(`\\b${variation}\\b`, 'gi');
          if (content.match(regex)) {
            this.warnings.push(`${file}: Uses '${variation}' instead of preferred '${check.expected[0]}'`);
          }
        }
      }
    }
  }

  /**
   * Check configuration pattern consistency (Q29 compliance)
   */
  async checkConfigurationPatterns() {
    console.log('⚙️ Checking configuration pattern consistency (Q29)...');
    
    const files = await this.getAllDocFiles();
    const violationPatterns = [
      { 
        regex: /process\.env\.DB_HOST/gi, 
        violation: 'DB_HOST should come from JSON config, not environment' 
      },
      { 
        regex: /process\.env\.DB_PORT/gi, 
        violation: 'DB_PORT should come from JSON config, not environment' 
      },
      { 
        regex: /process\.env\.SYSTEM_DB_NAME/gi, 
        violation: 'Database names should come from JSON config, not environment' 
      }
    ];

    for (const file of files) {
      const content = await this.readFile(file);
      
      for (const pattern of violationPatterns) {
        if (content.match(pattern.regex)) {
          this.errors.push(`${file}: Q29 violation - ${pattern.violation}`);
        }
      }
    }
  }

  /**
   * Get all key documentation files
   */
  async getAllDocFiles() {
    const files = [];
    
    // Primary documentation files
    if (fs.existsSync(this.mainDocPath)) {
      files.push(this.mainDocPath);
    }
    
    if (fs.existsSync(this.readmePath)) {
      files.push(this.readmePath);
    }
    
    // Critical archived file for Copilot instructions
    if (fs.existsSync(this.copilotInstructionsPath)) {
      files.push(this.copilotInstructionsPath);
    }
    
    return files;
  }

  /**
   * Read file content
   */
  async readFile(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      this.warnings.push(`Cannot read file: ${filePath}`);
      return '';
    }
  }

  /**
   * Print verification results
   */
  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 DOCUMENTATION CONSISTENCY VERIFICATION RESULTS');
    console.log('='.repeat(60));

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ ALL CHECKS PASSED! Documentation is 100% consistent.');
      return;
    }

    if (this.errors.length > 0) {
      console.log(`\n❌ CRITICAL ERRORS FOUND (${this.errors.length}):`);
      console.log('-'.repeat(50));
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS FOUND (${this.warnings.length}):`);
      console.log('-'.repeat(50));
      this.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }

    console.log('\n📊 CONSISTENCY RATING:');
    const totalIssues = this.errors.length + this.warnings.length;
    const criticalWeight = this.errors.length * 2; // Errors count double
    const totalWeight = criticalWeight + this.warnings.length;
    const consistencyRating = Math.max(0, 100 - (totalWeight * 2)); // Each weighted issue = 2% penalty

    console.log(`🎯 ${consistencyRating}% consistent`);
    
    if (consistencyRating >= 98) {
      console.log('🏆 EXCELLENT - Nearly perfect consistency!');
    } else if (consistencyRating >= 90) {
      console.log('✅ GOOD - High consistency achieved!');
    } else if (consistencyRating >= 80) {
      console.log('🟨 FAIR - Some inconsistencies need attention');
    } else {
      console.log('🔴 POOR - Major inconsistencies require immediate fix');
    }

    console.log('\n🔧 NEXT STEPS:');
    if (this.errors.length > 0) {
      console.log('1. Fix all CRITICAL ERRORS first');
    }
    if (this.warnings.length > 0) {
      console.log('2. Address warnings for perfect consistency');
    }
    console.log('3. Re-run this script to verify fixes');
    console.log('\nUsage: node scripts/verify-documentation-consistency.js');
    
    // Exit with error code if there are critical errors
    if (this.errors.length > 0) {
      process.exit(1);
    }
  }
}

// Auto-fix suggestions
function suggestFixes() {
  console.log('\n🛠️  AUTO-FIX SUGGESTIONS:');
  console.log('-'.repeat(50));
  console.log('1. Database names: Replace "school_erp_master" with "school_erp_system"');
  console.log('2. Node.js versions: Standardize on "18+"');
  console.log('3. Credentials: Use "admin@system.local/admin123" everywhere');
  console.log('4. MySQL commands: Use "mysqlsh" instead of "mysql"');
  console.log('5. Configuration: Follow Q29 (JSON config + .env secrets only)');
}

// Run verification if called directly
if (require.main === module) {
  const verifier = new DocumentationVerifier();
  verifier.verify().then(() => {
    if (verifier.errors.length > 0 || verifier.warnings.length > 0) {
      suggestFixes();
    }
  });
}

module.exports = DocumentationVerifier;
