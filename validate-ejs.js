#!/usr/bin/env node

/**
 * EJS Template Validation Script
 * Validates all EJS templates for syntax errors
 */

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

function findEjsFiles(dir, files = []) {
   const items = fs.readdirSync(dir);

   for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
         findEjsFiles(fullPath, files);
      } else if (path.extname(item) === '.ejs') {
         files.push(fullPath);
      }
   }

   return files;
}

function validateEjsFile(filePath) {
   try {
      const content = fs.readFileSync(filePath, 'utf8');

      // Try to render the template with minimal context
      ejs.compile(content, {
         filename: filePath,
         strict: false,
      });

      return { valid: true, file: filePath };
   } catch (error) {
      return {
         valid: false,
         file: filePath,
         error: error.message,
         line: error.line || 'unknown',
      };
   }
}

function main() {
   const viewsDir = path.join(__dirname, 'views');
   console.log('🔍 Scanning EJS templates for syntax errors...\n');

   if (!fs.existsSync(viewsDir)) {
      console.error('❌ Views directory not found!');
      process.exit(1);
   }

   const ejsFiles = findEjsFiles(viewsDir);
   console.log(`Found ${ejsFiles.length} EJS files\n`);

   const errors = [];
   let validFiles = 0;

   for (const file of ejsFiles) {
      const result = validateEjsFile(file);

      if (result.valid) {
         validFiles++;
         console.log(`✅ ${path.relative(__dirname, result.file)}`);
      } else {
         errors.push(result);
         console.log(`❌ ${path.relative(__dirname, result.file)}`);
         console.log(`   Error: ${result.error}`);
         if (result.line !== 'unknown') {
            console.log(`   Line: ${result.line}`);
         }
         console.log('');
      }
   }

   console.log('\n' + '='.repeat(50));
   console.log('📊 Validation Summary:');
   console.log(`✅ Valid files: ${validFiles}`);
   console.log(`❌ Invalid files: ${errors.length}`);

   if (errors.length > 0) {
      console.log('\n🚨 Files with errors:');
      errors.forEach((error) => {
         console.log(`- ${path.relative(__dirname, error.file)}: ${error.error}`);
      });
      process.exit(1);
   } else {
      console.log('\n🎉 All EJS templates are valid!');
   }
}

main();
