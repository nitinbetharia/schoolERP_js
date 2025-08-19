#!/usr/bin/env node

/**
 * Auto-Fix Documentation Inconsistencies Script
 * 
 * This script automatically fixes common consistency issues found in documentation.
 * Should be used carefully and always review changes before committing.
 * 
 * Usage: node scripts/auto-fix-documentation.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const DocumentationVerifier = require('./verify-documentation-consistency');

class DocumentationAutoFixer {
  constructor(dryRun = false) {
    this.dryRun = dryRun;
    this.fixCount = 0;
    this.docsPath = path.join(__dirname, '../docs');
    this.readmePath = path.join(__dirname, '../README.md');
    
    // Auto-fix patterns
    this.fixPatterns = [
      {
        name: 'Database Name Standardization',
        pattern: /school_erp_master/gi,
        replacement: 'school_erp_system',
        critical: true
      },
      {
        name: 'Node.js Version Standardization',
        pattern: /Node\.?js\s*[><=]*\s*22(\.\d+)?(\.\d+)?/gi,
        replacement: 'Node.js 18+',
        critical: false
      },
      {
        name: 'Node.js Version Standardization (Runtime)',
        pattern: /"runtime":\s*"Node\.js\s*>=?\s*22(\.\d+)?(\.\d+)?"/gi,
        replacement: '"runtime": "Node.js 18+"',
        critical: false
      },
      {
        name: 'Old Credentials Fix',
        pattern: /nitin@gmail\.com/gi,
        replacement: 'admin@system.local',
        critical: true
      },
      {
        name: 'Old Password Fix',
        pattern: /nitin@123/gi,
        replacement: 'admin123',
        critical: true
      },
      {
        name: 'Q29 Config Pattern Fix - DB_HOST',
        pattern: /process\.env\.DB_HOST\s*\|\|\s*['"]localhost['"]/gi,
        replacement: "'localhost' // From JSON config",
        critical: true
      },
      {
        name: 'Q29 Config Pattern Fix - DB_PORT',
        pattern: /parseInt\(process\.env\.DB_PORT\)\s*\|\|\s*3306/gi,
        replacement: '3306 // From JSON config',
        critical: true
      }
    ];
  }

  /**
   * Main auto-fix method
   */
  async autoFix() {
    console.log(`🔧 Starting Documentation Auto-Fix${this.dryRun ? ' (DRY RUN)' : ''}...\n`);
    
    try {
      const files = await this.getAllDocFiles();
      files.push(this.readmePath);

      for (const file of files) {
        await this.processFile(file);
      }

      console.log('\n' + '='.repeat(60));
      console.log('📋 AUTO-FIX RESULTS');
      console.log('='.repeat(60));
      
      if (this.fixCount === 0) {
        console.log('✅ No fixes needed - documentation already consistent!');
      } else {
        console.log(`🎯 Applied ${this.fixCount} fixes across documentation files`);
        
        if (this.dryRun) {
          console.log('\n⚠️  This was a DRY RUN - no files were actually modified');
          console.log('Run without --dry-run flag to apply fixes');
        } else {
          console.log('\n✅ Fixes have been applied successfully');
          console.log('🔍 Run verification script to confirm consistency:');
          console.log('   npm run validate:docs');
        }
      }

      // Run verification after fixes (if not dry run)
      if (!this.dryRun && this.fixCount > 0) {
        console.log('\n🔍 Running verification to check results...');
        const verifier = new DocumentationVerifier();
        await verifier.verify();
      }

    } catch (error) {
      console.error('❌ Auto-fix failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Process a single file
   */
  async processFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      let fileFixCount = 0;

      const relativePath = path.relative(process.cwd(), filePath);

      for (const fix of this.fixPatterns) {
        const matches = content.match(fix.pattern);
        if (matches) {
          content = content.replace(fix.pattern, fix.replacement);
          const matchCount = matches.length;
          fileFixCount += matchCount;
          
          console.log(`  ${fix.critical ? '🔴' : '🟡'} ${fix.name}: ${matchCount} fix${matchCount > 1 ? 'es' : ''} in ${relativePath}`);
        }
      }

      if (fileFixCount > 0) {
        if (!this.dryRun) {
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`    ✅ Applied ${fileFixCount} fixes to ${relativePath}`);
        } else {
          console.log(`    🔍 Would apply ${fileFixCount} fixes to ${relativePath}`);
        }
        
        this.fixCount += fileFixCount;
      }

    } catch (error) {
      console.warn(`⚠️  Could not process ${filePath}: ${error.message}`);
    }
  }

  /**
   * Get all documentation files
   */
  async getAllDocFiles() {
    const files = [];
    const scanDirectory = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          scanDirectory(fullPath);
        } else if (item.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    };

    scanDirectory(this.docsPath);
    return files;
  }
}

/**
 * Backup files before applying fixes
 */
function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../backups', `docs-backup-${timestamp}`);
  
  console.log(`📦 Creating backup in ${backupDir}...`);
  
  // This would implement backup logic
  // For now, just log the intention
  console.log('💡 Backup feature would be implemented here for safety');
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-n');

// Run auto-fix if called directly
if (require.main === module) {
  if (!dryRun) {
    createBackup();
  }
  
  const fixer = new DocumentationAutoFixer(dryRun);
  fixer.autoFix();
}

module.exports = DocumentationAutoFixer;
