#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 PERFORMING CODEBASE CLEANUP');
console.log('═'.repeat(50));

// Files to remove
const filesToRemove = [
   // Backup files
   'services/systemServices.js.backup',
   'services/systemServices.js.corrupted',
   'modules/school/services/BoardComplianceService.js.corrupted',
   'modules/school/services/BoardComplianceService.js.original',
   'modules/student/services/StudentService.js.corrupted',
   'modules/student/services/StudentService.js.original',

   // Obsolete documentation
   'ERROR_REFACTOR_COMPLETE.md',
   'ERROR_HANDLING_REFACTOR_SUMMARY.md',
   'PHASE4A_UDISE_STUDENT_COMPLETION.md',
   'PHASE4B_BOARD_AFFILIATION_COMPLETION.md',
   'UDISE_COMPLETION_PROGRESS_SUMMARY.md',
   'GIT_COMMIT_SUMMARY.md',
   'DEVELOPMENT_HANDOFF_FOR_NEW_PC.md',

   // Obsolete scripts
   'scripts/migrate-error-handling.js',
   'scripts/convert-classes-to-functions.js',
   'scripts/fix-error-integration.js',
   'scripts/fix-remaining-error-issues.js',
   'scripts/check-codebase-compliance.js',
   'scripts/test-error-handling.js',
   'scripts/quick-compliance-check.js',
   'scripts/audit-error-system.js',
   'scripts/corrected-audit.js',
   'scripts/repair-completion-report.js',
];

let removedCount = 0;
let errors = [];

console.log('Removing files...\n');

filesToRemove.forEach((filePath) => {
   try {
      if (fs.existsSync(filePath)) {
         fs.unlinkSync(filePath);
         console.log(`✅ Removed: ${filePath}`);
         removedCount++;
      } else {
         console.log(`⚪ Not found: ${filePath}`);
      }
   } catch (error) {
      console.log(`❌ Error removing ${filePath}: ${error.message}`);
      errors.push({ file: filePath, error: error.message });
   }
});

console.log('\n' + '═'.repeat(50));
console.log('🎯 CLEANUP RESULTS');
console.log(`✅ Successfully removed: ${removedCount} files`);
console.log(`❌ Errors: ${errors.length}`);

if (errors.length > 0) {
   console.log('\nErrors encountered:');
   errors.forEach((err) => {
      console.log(`   ${err.file}: ${err.error}`);
   });
}

console.log('\n🧹 Codebase cleanup completed!');
console.log('═'.repeat(50));
