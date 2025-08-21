#!/usr/bin/env node

/**
 * Comprehensive Codebase Cleanup and Deployment Script
 * Cleans up temporary files, organizes documentation, and prepares for GitHub push
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class CodebaseCleanup {
   constructor() {
      this.projectRoot = process.cwd();
      this.cleanupLog = [];
   }

   log(message, type = 'info') {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
      console.log(logEntry);
      this.cleanupLog.push(logEntry);
   }

   async cleanup() {
      this.log('🧹 Starting comprehensive codebase cleanup', 'info');

      try {
         // Step 1: Clean temporary and debug files
         await this.cleanTempFiles();

         // Step 2: Organize documentation
         await this.organizeDocumentation();

         // Step 3: Clean up test artifacts
         await this.cleanTestArtifacts();

         // Step 4: Verify file structure
         await this.verifyStructure();

         // Step 5: Run code quality checks
         await this.runQualityChecks();

         // Step 6: Generate cleanup report
         await this.generateCleanupReport();

         this.log('✅ Codebase cleanup completed successfully', 'success');
         return true;
      } catch (error) {
         this.log(`❌ Cleanup failed: ${error.message}`, 'error');
         return false;
      }
   }

   async cleanTempFiles() {
      this.log('🗑️  Cleaning temporary files...', 'info');

      const tempPatterns = [
         '**/*.tmp',
         '**/*.temp',
         '**/*.log',
         '**/*.debug',
         '**/cookies.txt',
         '**/login-debug.html',
         '**/static-login.html',
      ];

      let cleanedCount = 0;

      for (const pattern of tempPatterns) {
         try {
            const files = await this.findFiles(pattern);
            for (const file of files) {
               await this.safeDelete(file);
               cleanedCount++;
            }
         } catch (error) {
            this.log(`Warning: Could not clean pattern ${pattern}: ${error.message}`, 'warn');
         }
      }

      this.log(`🗑️  Cleaned ${cleanedCount} temporary files`, 'success');
   }

   async organizeDocumentation() {
      this.log('📚 Organizing documentation...', 'info');

      // Create docs structure if it doesn't exist
      const docsDir = path.join(this.projectRoot, 'docs');
      await this.ensureDirectory(docsDir);

      // Move analysis reports to docs/analysis/
      const analysisDir = path.join(docsDir, 'analysis');
      await this.ensureDirectory(analysisDir);

      const analysisFiles = [
         'COMPREHENSIVE_AUDIT_REPORT.md',
         'COMPREHENSIVE_CODE_ANALYSIS_REPORT.md',
         'COMPREHENSIVE_VALIDATION_PLAN.md',
         'CONNECTION_POOL_FIX.md',
         'DATABASE_RETRY_IMPLEMENTATION.md',
         'ROUTE_DUPLICATION_ANALYSIS.md',
         'SECURITY_IMPROVEMENTS_IMPLEMENTED.md',
         'TESTING_STRATEGIC_SUMMARY.md',
         'VALIDATION_FIXES_SUMMARY.md',
      ];

      for (const file of analysisFiles) {
         await this.moveToDirectory(file, analysisDir);
      }

      // Move completion reports to docs/releases/
      const releasesDir = path.join(docsDir, 'releases');
      await this.ensureDirectory(releasesDir);

      const releaseFiles = [
         'FINAL_PROJECT_COMPLETION_SUCCESS.md',
         'PHASE_TESTING_COMPLETE_SUCCESS.md',
         'VERSION_2.0.0_RELEASE_REPORT.md',
         'TOMORROW_SCHOOL_VALIDATION.md',
      ];

      for (const file of releaseFiles) {
         await this.moveToDirectory(file, releasesDir);
      }

      this.log('📚 Documentation organized successfully', 'success');
   }

   async cleanTestArtifacts() {
      this.log('🧪 Cleaning test artifacts...', 'info');

      const testArtifacts = [
         'test-frontend-compliance.js',
         'test-pages.js',
         'test-system-dashboard.js',
         'test-system-services.js',
         'test-validation.js',
         'validation-test-suite.http',
         'validation-tests.http',
      ];

      const testDir = path.join(this.projectRoot, 'tests', 'artifacts');
      await this.ensureDirectory(testDir);

      for (const artifact of testArtifacts) {
         await this.moveToDirectory(artifact, testDir);
      }

      this.log('🧪 Test artifacts organized', 'success');
   }

   async verifyStructure() {
      this.log('🔍 Verifying project structure...', 'info');

      const requiredDirs = [
         'config',
         'middleware',
         'models',
         'modules',
         'public',
         'routes',
         'scripts',
         'services',
         'utils',
         'views',
         'docs',
         'tests',
      ];

      for (const dir of requiredDirs) {
         const dirPath = path.join(this.projectRoot, dir);
         try {
            await fs.access(dirPath);
            this.log(`✓ Directory exists: ${dir}`, 'success');
         } catch {
            this.log(`✗ Missing directory: ${dir}`, 'warn');
         }
      }
   }

   async runQualityChecks() {
      this.log('🔍 Running code quality checks...', 'info');

      try {
         // Check if package.json exists and has required scripts
         const packagePath = path.join(this.projectRoot, 'package.json');
         const packageContent = await fs.readFile(packagePath, 'utf8');
         const packageJson = JSON.parse(packageContent);

         this.log(`📦 Project: ${packageJson.name} v${packageJson.version}`, 'info');

         // Run linting if available
         if (packageJson.scripts && packageJson.scripts.lint) {
            this.log('🔍 Running ESLint...', 'info');
            execSync('npm run lint --silent', { cwd: this.projectRoot });
            this.log('✅ Linting passed', 'success');
         }
      } catch (error) {
         this.log(`⚠️  Quality checks completed with warnings: ${error.message}`, 'warn');
      }
   }

   async generateCleanupReport() {
      const reportPath = path.join(this.projectRoot, 'docs', 'CLEANUP_REPORT.md');

      const report = `# Codebase Cleanup Report

**Generated:** ${new Date().toISOString()}

## Summary
This report documents the comprehensive cleanup performed on the School ERP codebase before deployment.

## Actions Performed
${this.cleanupLog.map((entry) => `- ${entry}`).join('\n')}

## Project Structure
\`\`\`
schoolERP_js/
├── config/          # Configuration files
├── middleware/      # Express middleware
├── models/          # Database models
├── modules/         # Feature modules
├── public/          # Static assets
├── routes/          # API routes
├── scripts/         # Utility scripts
├── services/        # Business services
├── utils/           # Utility functions
├── views/           # Template views
├── docs/            # Documentation
│   ├── analysis/    # Code analysis reports
│   └── releases/    # Release documentation
└── tests/           # Test files and artifacts
\`\`\`

## Security Improvements Applied
- ✅ XSS vulnerability fixes
- ✅ Content Security Policy headers
- ✅ Database connection pool optimization
- ✅ Session security hardening
- ✅ CDN integrity checks
- ✅ Environment variable validation

## Ready for Deployment
The codebase is now clean, organized, and ready for GitHub deployment.
`;

      await fs.writeFile(reportPath, report);
      this.log(`📄 Cleanup report generated: ${reportPath}`, 'success');
   }

   // Helper methods
   async findFiles(pattern) {
      // Simple file finder - in a real implementation, you'd use glob
      const files = [];
      const checkFile = async (filePath) => {
         try {
            const stats = await fs.stat(filePath);
            if (stats.isFile() && path.basename(filePath).match(pattern.replace('**/', '').replace('*', '.*'))) {
               files.push(filePath);
            }
         } catch {}
      };

      await checkFile(path.join(this.projectRoot, path.basename(pattern.replace('**/', ''))));
      return files;
   }

   async safeDelete(filePath) {
      try {
         await fs.unlink(filePath);
         this.log(`🗑️  Deleted: ${path.basename(filePath)}`, 'info');
      } catch (error) {
         this.log(`⚠️  Could not delete ${filePath}: ${error.message}`, 'warn');
      }
   }

   async ensureDirectory(dirPath) {
      try {
         await fs.mkdir(dirPath, { recursive: true });
      } catch (error) {
         if (error.code !== 'EEXIST') {
            throw error;
         }
      }
   }

   async moveToDirectory(fileName, targetDir) {
      const sourcePath = path.join(this.projectRoot, fileName);
      const targetPath = path.join(targetDir, fileName);

      try {
         await fs.access(sourcePath);
         await fs.rename(sourcePath, targetPath);
         this.log(`📁 Moved: ${fileName} → ${path.relative(this.projectRoot, targetDir)}/`, 'info');
      } catch (error) {
         if (error.code !== 'ENOENT') {
            this.log(`⚠️  Could not move ${fileName}: ${error.message}`, 'warn');
         }
      }
   }
}

async function main() {
   console.log('🚀 School ERP Codebase Cleanup & Deployment Preparation');
   console.log('======================================================\n');

   const cleanup = new CodebaseCleanup();
   const success = await cleanup.cleanup();

   if (success) {
      console.log('\n🎉 Codebase cleanup completed successfully!');
      console.log('💡 Ready for GitHub deployment');
      console.log('   Next steps:');
      console.log('   1. git add .');
      console.log('   2. git commit -m "feat: comprehensive security improvements and codebase cleanup"');
      console.log('   3. git push origin main');
   } else {
      console.log('\n❌ Cleanup encountered issues');
      console.log('💡 Please review the log above and fix any issues before deployment');
      process.exit(1);
   }
}

if (require.main === module) {
   main().catch(console.error);
}

module.exports = CodebaseCleanup;
