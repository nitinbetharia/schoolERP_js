/**
 * Single Source of Truth Validator
 * Validates codebase against Q&A technical decisions
 */

const fs = require('fs');
const path = require('path');
const { TECHNICAL_DECISIONS, validateCodebase } = require('../config/SINGLE_SOURCE_OF_TRUTH');

class CodebaseValidator {
  constructor() {
    this.violations = [];
    this.filesChecked = 0;
  }

  async validateProject() {
    console.log('🔍 Validating codebase against Q&A technical decisions...\n');

    await this.validateDirectory(path.join(__dirname, '..'));

    this.reportResults();
  }

  async validateDirectory(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);

      // Skip node_modules, .git, and other directories
      if (item.isDirectory() && !this.shouldSkipDirectory(item.name)) {
        await this.validateDirectory(fullPath);
      } else if (item.isFile() && this.shouldValidateFile(item.name)) {
        await this.validateFile(fullPath);
      }
    }
  }

  shouldSkipDirectory(name) {
    const skipDirs = ['node_modules', '.git', '.vscode', 'logs', 'uploads'];
    return skipDirs.includes(name);
  }

  shouldValidateFile(name) {
    const validExtensions = ['.js', '.json', '.md', '.sql'];
    return validExtensions.some(ext => name.endsWith(ext));
  }

  async validateFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      this.filesChecked++;

      const violations = validateCodebase(content);
      
      if (violations.length > 0) {
        this.violations.push({
          file: path.relative(process.cwd(), filePath),
          violations
        });
      }

      // Additional specific checks
      await this.validateSpecificPatterns(filePath, content);

    } catch (error) {
      console.warn(`⚠️  Could not validate ${filePath}: ${error.message}`);
    }
  }

  async validateSpecificPatterns(filePath, content) {
    const fileName = path.basename(filePath);
    const violations = [];

    // Check for ES6 imports (Q2 violation)
    if (content.includes('import ') && content.includes(' from ')) {
      violations.push({
        decision: 'Q2_MODULE_SYSTEM',
        violation: 'ES6 import statement found',
        required: 'Use require() instead'
      });
    }

    // Check for raw mysql2 usage (Q1 violation)
    if (content.includes('mysql2') && !content.includes('sequelize')) {
      violations.push({
        decision: 'Q1_DATABASE_ACCESS',
        violation: 'Raw mysql2 usage detected',
        required: 'Use Sequelize ORM'
      });
    }

    // Check for wrong connection pool settings (Q11 violation)
    if (content.includes('pool') && content.includes('max') && 
        !content.includes('max: 15')) {
      violations.push({
        decision: 'Q11_CONNECTION_POOLING',
        violation: 'Incorrect connection pool settings',
        required: '{ max: 15, min: 2, acquire: 60000, idle: 300000 }'
      });
    }

    // Check for wrong bcrypt salt rounds (Q17 violation)
    if (content.includes('bcrypt') && content.includes('hash') && 
        !content.includes('12')) {
      violations.push({
        decision: 'Q17_PASSWORD_SECURITY',
        violation: 'Incorrect bcrypt salt rounds',
        required: 'Use 12 salt rounds'
      });
    }

    if (violations.length > 0) {
      this.violations.push({
        file: path.relative(process.cwd(), filePath),
        violations
      });
    }
  }

  reportResults() {
    console.log(`\n📊 Validation Results:`);
    console.log(`Files checked: ${this.filesChecked}`);
    console.log(`Violations found: ${this.violations.length}`);

    if (this.violations.length === 0) {
      console.log('\n✅ SUCCESS: Codebase follows all Q&A technical decisions!');
      return;
    }

    console.log('\n❌ VIOLATIONS FOUND:');
    console.log('==================');

    this.violations.forEach(fileViolation => {
      console.log(`\n📄 File: ${fileViolation.file}`);
      fileViolation.violations.forEach(violation => {
        console.log(`   ❌ ${violation.decision}: ${violation.violation}`);
        console.log(`   ✅ Required: ${violation.required}`);
      });
    });

    console.log('\n🚨 Fix these violations to comply with Q&A decisions!');
    process.exit(1);
  }
}

// CLI execution
if (require.main === module) {
  const validator = new CodebaseValidator();
  validator.validateProject().catch(console.error);
}

module.exports = CodebaseValidator;
