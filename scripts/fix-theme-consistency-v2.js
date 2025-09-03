const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Enhanced Theme Consistency Fixer v2
 * More comprehensive theme fixing with better pattern matching
 */

console.log('🔧 Enhanced Theme Consistency Fixer v2');
console.log('=======================================\n');

// Enhanced class replacements including more comprehensive patterns
const CLASS_REPLACEMENTS = {
   // Button classes
   'btn-primary': 'btn-brand-primary',
   'btn-outline-primary': 'btn-outline-brand-primary',

   // Background classes
   'bg-primary': 'bg-brand-primary',

   // Text classes
   'text-primary': 'text-brand-primary',

   // Border classes
   'border-primary': 'border-brand-primary',
};

// Additional patterns to look for
const BADGE_PATTERNS = {
   'badge bg-primary': 'badge bg-brand-primary',
   'progress-bar bg-primary': 'progress-bar bg-brand-primary',
   'alert-primary': 'alert-brand-primary',
   'table-primary': 'table-brand-primary',
};

// Files to exclude
const EXCLUDED_FILES = ['partials/flash-messages.ejs', 'emails/', 'error', 'layout.ejs'];

const changes = {
   filesProcessed: 0,
   filesModified: 0,
   replacementsMade: 0,
   errors: [],
};

function shouldExcludeFile(filePath) {
   return EXCLUDED_FILES.some((excludePattern) => filePath.includes(excludePattern));
}

function replaceClasses(content) {
   let modifiedContent = content;
   let replacements = 0;

   // Enhanced regex patterns for better matching
   Object.entries(CLASS_REPLACEMENTS).forEach(([oldClass, newClass]) => {
      // Pattern 1: class="primary-class other-classes"
      const pattern1 = new RegExp(`(class="[^"]*\\s)${oldClass}(\\s[^"]*")`, 'g');
      // Pattern 2: class="primary-class"
      const pattern2 = new RegExp(`class="${oldClass}"`, 'g');
      // Pattern 3: class='primary-class'
      const pattern3 = new RegExp(`class='${oldClass}'`, 'g');
      // Pattern 4: class="other-classes primary-class"
      const pattern4 = new RegExp(`(class="[^"]*\\s)${oldClass}(")`, 'g');
      // Pattern 5: class="primary-class more-classes"
      const pattern5 = new RegExp(`(class=")${oldClass}(\\s[^"]*")`, 'g');

      [pattern1, pattern2, pattern3, pattern4, pattern5].forEach((pattern) => {
         const matches = modifiedContent.match(pattern) || [];
         replacements += matches.length;

         if (pattern === pattern1) {
            modifiedContent = modifiedContent.replace(pattern, `$1${newClass}$2`);
         } else if (pattern === pattern2) {
            modifiedContent = modifiedContent.replace(pattern, `class="${newClass}"`);
         } else if (pattern === pattern3) {
            modifiedContent = modifiedContent.replace(pattern, `class='${newClass}'`);
         } else if (pattern === pattern4) {
            modifiedContent = modifiedContent.replace(pattern, `$1${newClass}$2`);
         } else if (pattern === pattern5) {
            modifiedContent = modifiedContent.replace(pattern, `$1${newClass}$2`);
         }
      });
   });

   // Handle badge patterns
   Object.entries(BADGE_PATTERNS).forEach(([oldPattern, newPattern]) => {
      const regex = new RegExp(oldPattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
      const matches = modifiedContent.match(regex) || [];
      replacements += matches.length;
      modifiedContent = modifiedContent.replace(regex, newPattern);
   });

   // Handle conditional classes in EJS
   const conditionalPattern = /<%= .*\? ['"]bg-primary['"] : /g;
   const conditionalMatches = modifiedContent.match(conditionalPattern) || [];
   replacements += conditionalMatches.length;
   modifiedContent = modifiedContent.replace(/(['"])bg-primary(['"])/g, '$1bg-brand-primary$2');

   return { content: modifiedContent, replacements };
}

function addTenantLogicToImportantPages(content, filePath) {
   // Skip if already has tenant logic
   if (content.includes('tenant.branding') || content.includes('tenant.name')) {
      return content;
   }

   // Add to key user-facing pages
   const importantPages = ['students/index.ejs', 'fees/index.ejs', 'reports/index.ejs', 'dashboard/'];

   const needsTenantLogic = importantPages.some((pattern) => filePath.includes(pattern));

   if (!needsTenantLogic) {
      return content;
   }

   // Add tenant-aware page title if there's an h1
   if (content.includes('<h1')) {
      content = content.replace(
         /(<h1[^>]*>)(.*?)(School ERP|Management|Dashboard)(.*?)(<\/h1>)/g,
         "$1$2<%= tenant && tenant.name ? tenant.name : 'School ERP' %> - $3$4$5"
      );
   }

   return content;
}

function processFile(filePath) {
   try {
      changes.filesProcessed++;

      const originalContent = fs.readFileSync(filePath, 'utf8');

      // Skip excluded files
      if (shouldExcludeFile(filePath)) {
         console.log(`   ⏭️  Skipped: ${filePath.replace(process.cwd(), '')}`);
         return;
      }

      // Apply fixes
      const { content: classesFixed, replacements } = replaceClasses(originalContent);
      const finalContent = addTenantLogicToImportantPages(classesFixed, filePath);

      // Save if changed
      if (originalContent !== finalContent) {
         fs.writeFileSync(filePath, finalContent, 'utf8');
         changes.filesModified++;
         changes.replacementsMade += replacements;

         const addedTenantLogic = classesFixed !== finalContent;
         console.log(`   ✅ Modified: ${filePath.replace(process.cwd(), '')}`);
         console.log(`      - Replacements: ${replacements}`);
         if (addedTenantLogic) {
            console.log('      - Enhanced tenant logic: Yes');
         }
      } else {
         console.log(`   ✨ Clean: ${filePath.replace(process.cwd(), '')}`);
      }
   } catch (error) {
      changes.errors.push({
         file: filePath,
         error: error.message,
      });
      console.log(`   ❌ Error: ${filePath.replace(process.cwd(), '')} - ${error.message}`);
   }
}

async function main() {
   const ejsFiles = glob.sync('views/**/*.ejs');

   console.log(`📂 Processing ${ejsFiles.length} EJS files with enhanced patterns...\n`);

   // Process files
   ejsFiles.forEach(processFile);

   // Summary
   console.log('\n📊 ENHANCED PROCESSING SUMMARY');
   console.log('==============================');
   console.log(`   • Files processed: ${changes.filesProcessed}`);
   console.log(`   • Files modified: ${changes.filesModified}`);
   console.log(`   • Total replacements: ${changes.replacementsMade}`);
   console.log(`   • Errors: ${changes.errors.length}`);

   if (changes.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      changes.errors.forEach((error, index) => {
         console.log(`   ${index + 1}. ${error.file}: ${error.error}`);
      });
   }

   console.log('\n🔄 Running final consistency check...\n');

   // Run analysis
   try {
      require('./analyze-theme-consistency.js');
   } catch (error) {
      console.log('   Analysis not available. Run manually: node scripts/analyze-theme-consistency.js');
   }
}

if (require.main === module) {
   main().catch(console.error);
}
