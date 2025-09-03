const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Automated Theme Consistency Fixer
 * Fixes common theme inconsistencies in EJS templates
 */

console.log('🔧 Automated Theme Consistency Fixer');
console.log('=====================================\n');

// Define class replacements
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

// Files to exclude from automatic replacement
const EXCLUDED_FILES = ['partials/flash-messages.ejs', 'emails/', 'error', 'layout.ejs'];

// Track changes
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

   // Replace class attributes in HTML elements
   Object.entries(CLASS_REPLACEMENTS).forEach(([oldClass, newClass]) => {
      // Match class="..." attributes containing the old class
      const classAttributeRegex = new RegExp(`(class="[^"]*\\s?)${oldClass}(\\s[^"]*")`, 'g');

      // Match class="old-class" (exact match)
      const exactClassRegex = new RegExp(`class="${oldClass}"`, 'g');

      // Count replacements before making them
      const matches1 = modifiedContent.match(classAttributeRegex) || [];
      const matches2 = modifiedContent.match(exactClassRegex) || [];
      replacements += matches1.length + matches2.length;

      // Make the replacements
      modifiedContent = modifiedContent.replace(classAttributeRegex, `$1${newClass}$2`);
      modifiedContent = modifiedContent.replace(exactClassRegex, `class="${newClass}"`);
   });

   return { content: modifiedContent, replacements };
}

function addTenantLogicIfNeeded(content, filePath) {
   // Check if file already has tenant logic
   if (content.includes('tenant.branding') || content.includes('tenant.name')) {
      return content;
   }

   // Add tenant logic to specific page types
   const needsTenantLogic = ['students/', 'fees/', 'reports/', 'dashboard/'].some((pattern) =>
      filePath.includes(pattern)
   );

   if (!needsTenantLogic) {
      return content;
   }

   // Simple tenant logo addition for headers
   if (content.includes('<i class="fas fa-graduation-cap"></i>')) {
      const tenantLogoLogic = `
            <% if (tenant && tenant.branding && tenant.branding.logo) { %>
            <img src="<%= tenant.branding.logo %>" alt="<%= tenant.name %>" class="me-3" style="height: 40px;">
            <% } else { %>
            <div class="bg-brand-primary text-white rounded d-flex align-items-center justify-content-center me-3" 
                 style="width: 40px; height: 40px;">
                <i class="fas fa-graduation-cap"></i>
            </div>
            <% } %>`;

      content = content.replace(/<i class="fas fa-graduation-cap"><\/i>/g, tenantLogoLogic.trim());
   }

   return content;
}

function processFile(filePath) {
   try {
      changes.filesProcessed++;

      const originalContent = fs.readFileSync(filePath, 'utf8');

      // Skip if file is excluded
      if (shouldExcludeFile(filePath)) {
         console.log(`   ⏭️  Skipped: ${filePath.replace(process.cwd(), '')}`);
         return;
      }

      // Replace classes
      const { content: newContent, replacements } = replaceClasses(originalContent);

      // Add tenant logic if needed
      const finalContent = addTenantLogicIfNeeded(newContent, filePath);

      // Check if any changes were made
      if (originalContent !== finalContent) {
         fs.writeFileSync(filePath, finalContent, 'utf8');
         changes.filesModified++;
         changes.replacementsMade += replacements;

         const hasNewTenantLogic = finalContent !== newContent;
         console.log(`   ✅ Modified: ${filePath.replace(process.cwd(), '')}`);
         console.log(`      - Class replacements: ${replacements}`);
         if (hasNewTenantLogic) {
            console.log('      - Added tenant logic: Yes');
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

// Main execution
async function main() {
   const ejsFiles = glob.sync('views/**/*.ejs');

   console.log(`📂 Processing ${ejsFiles.length} EJS files...\n`);

   // Process all files
   ejsFiles.forEach(processFile);

   // Summary
   console.log('\n📊 PROCESSING SUMMARY');
   console.log('=====================');
   console.log(`   • Files processed: ${changes.filesProcessed}`);
   console.log(`   • Files modified: ${changes.filesModified}`);
   console.log(`   • Total replacements: ${changes.replacementsMade}`);
   console.log(`   • Errors encountered: ${changes.errors.length}`);

   if (changes.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      changes.errors.forEach((error, index) => {
         console.log(`   ${index + 1}. ${error.file}: ${error.error}`);
      });
   }

   console.log('\n🎯 NEXT STEPS:');
   console.log('   1. Review the modified files for any issues');
   console.log('   2. Test the application to ensure everything works');
   console.log('   3. Run theme consistency analysis again:');
   console.log('      node scripts/analyze-theme-consistency.js');
   console.log('   4. Commit changes if satisfied with results');

   // Run analysis again to show improvement
   console.log('\n🔄 Running consistency analysis...\n');

   try {
      require('./analyze-theme-consistency.js');
   } catch (error) {
      console.log('   Could not run analysis automatically. Please run manually.');
   }
}

// Execute if run directly
if (require.main === module) {
   main().catch(console.error);
}

module.exports = { CLASS_REPLACEMENTS, replaceClasses, processFile };
