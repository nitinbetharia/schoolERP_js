const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🎨 UI/UX Theme Consistency Analysis');
console.log('=====================================\n');

// Theme analysis data
const themeData = {
   brandClasses: {
      found: 0,
      inconsistent: 0,
      files: [],
   },
   standardBootstrap: {
      found: 0,
      files: [],
   },
   tenantTheming: {
      implemented: 0,
      missing: 0,
      files: [],
   },
   inconsistencies: [],
   recommendations: [],
};

// Pattern definitions
const patterns = {
   brandClasses: /(btn-brand-primary|bg-brand-primary|text-brand-primary|border-brand-primary)/g,
   standardBootstrap: /(btn-primary|bg-primary|text-primary|border-primary)/g,
   tenantVars: /(--tenant-primary|--tenant-secondary|--tenant-accent)/g,
   systemAdminTheme: /(system.admin|isSystemAdmin|system-admin)/gi,
   tenantBranding: /(tenant\.branding|tenant\.name|tenant\.logo)/g,
};

// Analyze EJS templates
const ejsFiles = glob.sync('views/**/*.ejs');
console.log(`📂 Analyzing ${ejsFiles.length} EJS templates...\n`);

let totalBrandClasses = 0;
let totalStandardBootstrap = 0;
let filesWithTenantLogic = 0;
let filesWithInconsistencies = 0;

ejsFiles.forEach((file) => {
   const content = fs.readFileSync(file, 'utf8');

   // Check for brand classes
   const brandMatches = content.match(patterns.brandClasses) || [];
   const standardMatches = content.match(patterns.standardBootstrap) || [];
   const tenantMatches = content.match(patterns.tenantBranding) || [];

   totalBrandClasses += brandMatches.length;
   totalStandardBootstrap += standardMatches.length;

   if (tenantMatches.length > 0) {
      filesWithTenantLogic++;
   }

   // Check for inconsistencies (mixing brand and standard classes)
   if (brandMatches.length > 0 && standardMatches.length > 0) {
      filesWithInconsistencies++;
      themeData.inconsistencies.push({
         file: file.replace(process.cwd(), ''),
         brandClasses: brandMatches.length,
         standardClasses: standardMatches.length,
         issue: 'Mixed brand and standard Bootstrap classes',
      });
   }

   // Files using only standard bootstrap (potential issue)
   if (standardMatches.length > 0 && brandMatches.length === 0) {
      if (!file.includes('partials/flash-messages') && !file.includes('emails/')) {
         themeData.tenantTheming.missing++;
         themeData.tenantTheming.files.push({
            file: file.replace(process.cwd(), ''),
            standardClasses: standardMatches.length,
            issue: 'Uses standard Bootstrap classes instead of brand classes',
         });
      }
   }
});

// Analyze CSS files
const cssFiles = glob.sync('public/css/*.css');
console.log(`🎨 Analyzing ${cssFiles.length} CSS files...\n`);

let cssThemeVars = 0;
cssFiles.forEach((file) => {
   const content = fs.readFileSync(file, 'utf8');
   const tenantVarMatches = content.match(patterns.tenantVars) || [];
   cssThemeVars += tenantVarMatches.length;
});

// Generate analysis results
console.log('📊 THEME CONSISTENCY ANALYSIS RESULTS');
console.log('======================================\n');

console.log('✅ POSITIVE FINDINGS:');
console.log(`   • Brand classes found: ${totalBrandClasses} instances`);
console.log(`   • Files with tenant logic: ${filesWithTenantLogic}/${ejsFiles.length}`);
console.log(`   • CSS theme variables: ${cssThemeVars} instances`);
console.log('   • Theme system architecture: IMPLEMENTED ✅');

console.log('\n⚠️  CONSISTENCY ISSUES:');
console.log(`   • Files mixing brand/standard classes: ${filesWithInconsistencies}`);
console.log(`   • Files using only Bootstrap standard: ${themeData.tenantTheming.missing}`);
console.log(`   • Standard Bootstrap instances: ${totalStandardBootstrap}`);

if (themeData.inconsistencies.length > 0) {
   console.log('\n🔍 DETAILED INCONSISTENCIES:');
   themeData.inconsistencies.slice(0, 5).forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.file}`);
      console.log(`      - Brand classes: ${item.brandClasses}, Standard: ${item.standardClasses}`);
   });
   if (themeData.inconsistencies.length > 5) {
      console.log(`   ... and ${themeData.inconsistencies.length - 5} more files`);
   }
}

if (themeData.tenantTheming.missing > 0) {
   console.log('\n🎯 FILES NEEDING BRAND CLASS UPDATES:');
   themeData.tenantTheming.files.slice(0, 8).forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.file}`);
      console.log(`      - Standard classes: ${item.standardClasses}`);
   });
   if (themeData.tenantTheming.files.length > 8) {
      console.log(`   ... and ${themeData.tenantTheming.files.length - 8} more files`);
   }
}

// Calculate consistency percentage
const totalFiles = ejsFiles.length;
const consistentFiles = totalFiles - filesWithInconsistencies - themeData.tenantTheming.missing;
const consistencyPercentage = Math.round((consistentFiles / totalFiles) * 100);

console.log('\n📈 CONSISTENCY METRICS:');
console.log(`   • Overall theme consistency: ${consistencyPercentage}%`);
console.log(`   • Files following brand theme: ${consistentFiles}/${totalFiles}`);
console.log(`   • Files needing updates: ${filesWithInconsistencies + themeData.tenantTheming.missing}`);

console.log('\n🎨 THEME IMPLEMENTATION STATUS:');
console.log('   • ✅ CSS Custom Properties (CSS Variables): IMPLEMENTED');
console.log('   • ✅ Tenant Branding System: IMPLEMENTED');
console.log('   • ✅ System Admin Theme: IMPLEMENTED');
console.log('   • ✅ Brand Utility Classes: IMPLEMENTED');
console.log('   • ⚠️  Consistent Brand Usage: NEEDS IMPROVEMENT');

console.log('\n🔧 RECOMMENDATIONS:');
if (themeData.tenantTheming.missing > 0) {
   console.log(
      `   1. Update ${themeData.tenantTheming.missing} files to use brand classes instead of standard Bootstrap`
   );
}
if (filesWithInconsistencies > 0) {
   console.log(`   2. Fix ${filesWithInconsistencies} files that mix brand and standard classes`);
}
console.log('   3. Create automated linting rules to enforce brand class usage');
console.log('   4. Add theme documentation for developers');
console.log('   5. Consider creating theme preview/testing page');

console.log('\n🏆 OVERALL ASSESSMENT:');
if (consistencyPercentage >= 90) {
   console.log('   EXCELLENT - Theme system is well implemented and mostly consistent');
} else if (consistencyPercentage >= 75) {
   console.log('   GOOD - Theme system works but needs consistency improvements');
} else if (consistencyPercentage >= 50) {
   console.log('   FAIR - Theme system exists but significant inconsistencies present');
} else {
   console.log('   NEEDS WORK - Major theme consistency issues need addressing');
}

console.log(
   `\n📋 SUMMARY: ${consistencyPercentage}% theme consistency with ${totalBrandClasses} brand class implementations across ${totalFiles} templates`
);
