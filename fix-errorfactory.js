#!/usr/bin/env node
/**
 * Fix ErrorFactory Usage Script
 * Systematically replaces ErrorFactory calls with standard Error objects
 * that work with the centralized errorHandler.js middleware
 */

const fs = require('fs');
const path = require('path');

// Files to process
const filesToProcess = [
   './modules/school/controllers/BoardComplianceController.js',
   './modules/school/controllers/SchoolController.js',
   './modules/school/controllers/SectionController.js',
   './modules/school/controllers/UDISEController.js',
   './modules/school/controllers/UDISEStudentController.js',
   './modules/school/services/ClassService.js',
   './modules/school/services/SchoolService.js',
   './modules/school/services/SectionService.js',
   './modules/school/services/UDISEService.js',
   './modules/school/services/UDISEStudentService.js',
   './modules/udise/services/UdiseService.js',
];

// Common ErrorFactory replacement patterns
const replacements = [
   // Remove ErrorFactory imports from utils/validation
   {
      pattern:
         /const\s*{\s*([^}]*?)ErrorFactory([^}]*?)\s*}\s*=\s*require\(['"`]\.\.\/\.\.\/\.\.\/utils\/validation['"`]\);/g,
      replacement: (match, before, after) => {
         const cleanBefore = before ? before.replace(/,$/, '').trim() : '';
         const cleanAfter = after ? after.replace(/^,/, '').trim() : '';

         if (!cleanBefore && !cleanAfter) {
            return '// ErrorFactory import removed - using standard Error objects';
         }

         const remaining = [];
         if (cleanBefore) {
            remaining.push(cleanBefore);
         }
         if (cleanAfter) {
            remaining.push(cleanAfter);
         }

         if (remaining.length > 0) {
            return `const { ${remaining.join(', ')} } = require('../../../utils/validation');`;
         }

         return '// ErrorFactory import removed - using standard Error objects';
      },
   },

   // ErrorFactory method call patterns
   {
      pattern: /ErrorFactory\.notFound\(['"`]([^'"`]+)['"`]\)/g,
      replacement: (match, message) => {
         return `(() => { const err = new Error('${message}'); err.statusCode = 404; return err; })()`;
      },
   },

   {
      pattern: /ErrorFactory\.validation\(['"`]([^'"`]+)['"`]\)/g,
      replacement: (match, message) => {
         return `(() => { const err = new Error('${message}'); err.statusCode = 400; return err; })()`;
      },
   },

   {
      pattern: /ErrorFactory\.authentication\(['"`]([^'"`]+)['"`]\)/g,
      replacement: (match, message) => {
         return `(() => { const err = new Error('${message}'); err.statusCode = 401; return err; })()`;
      },
   },

   {
      pattern: /ErrorFactory\.authorization\(['"`]([^'"`]+)['"`]\)/g,
      replacement: (match, message) => {
         return `(() => { const err = new Error('${message}'); err.statusCode = 403; return err; })()`;
      },
   },

   {
      pattern: /ErrorFactory\.internal\(['"`]([^'"`]+)['"`]\)/g,
      replacement: (match, message) => {
         return `(() => { const err = new Error('${message}'); err.statusCode = 500; return err; })()`;
      },
   },

   {
      pattern: /ErrorFactory\.database\(['"`]([^'"`]+)['"`]\)/g,
      replacement: (match, message) => {
         return `(() => { const err = new Error('${message}'); err.statusCode = 500; return err; })()`;
      },
   },

   // Throw patterns
   {
      pattern: /throw\s+ErrorFactory\.notFound\(['"`]([^'"`]+)['"`]\);/g,
      replacement: (match, message) => {
         return `const err = new Error('${message}'); err.statusCode = 404; throw err;`;
      },
   },

   {
      pattern: /throw\s+ErrorFactory\.validation\(['"`]([^'"`]+)['"`]\);/g,
      replacement: (match, message) => {
         return `const err = new Error('${message}'); err.statusCode = 400; throw err;`;
      },
   },

   {
      pattern: /throw\s+ErrorFactory\.authentication\(['"`]([^'"`]+)['"`]\);/g,
      replacement: (match, message) => {
         return `const err = new Error('${message}'); err.statusCode = 401; throw err;`;
      },
   },

   {
      pattern: /throw\s+ErrorFactory\.authorization\(['"`]([^'"`]+)['"`]\);/g,
      replacement: (match, message) => {
         return `const err = new Error('${message}'); err.statusCode = 403; throw err;`;
      },
   },

   {
      pattern: /throw\s+ErrorFactory\.internal\(['"`]([^'"`]+)['"`]\);/g,
      replacement: (match, message) => {
         return `const err = new Error('${message}'); err.statusCode = 500; throw err;`;
      },
   },

   {
      pattern: /throw\s+ErrorFactory\.database\(['"`]([^'"`]+)['"`]\);/g,
      replacement: (match, message) => {
         return `const err = new Error('${message}'); err.statusCode = 500; throw err;`;
      },
   },
];

function processFile(filePath) {
   console.log(`Processing ${filePath}...`);

   if (!fs.existsSync(filePath)) {
      console.log(`  File not found: ${filePath}`);
      return;
   }

   let content = fs.readFileSync(filePath, 'utf8');
   let changed = false;

   // Apply all replacement patterns
   replacements.forEach((replacement, index) => {
      const originalContent = content;

      if (typeof replacement.replacement === 'function') {
         content = content.replace(replacement.pattern, replacement.replacement);
      } else {
         content = content.replace(replacement.pattern, replacement.replacement);
      }

      if (content !== originalContent) {
         console.log(`  Applied replacement pattern ${index + 1}`);
         changed = true;
      }
   });

   if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✓ Updated ${filePath}`);
   } else {
      console.log(`  - No changes needed for ${filePath}`);
   }
}

// Process all files
console.log('Starting ErrorFactory to standard Error conversion...\n');

filesToProcess.forEach(processFile);

console.log('\n✓ ErrorFactory conversion complete!');
console.log('\nNext steps:');
console.log('1. Test the server: npm start');
console.log('2. Run linting: npm run lint');
console.log('3. Review changes and commit');
