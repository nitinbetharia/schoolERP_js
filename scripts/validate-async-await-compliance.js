/**
 * Q57-Q58 Compliance Validation Script
 * Validates async/await + try-catch patterns across the codebase
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

async function validateAsyncAwaitCompliance() {
  console.log('🔧 Validating Q57-Q58 Compliance: Async/Await + Try-Catch');
  console.log('='.repeat(60));

  const violations = [];
  const validFiles = [];

  try {
    // Define file patterns to check
    const filesToCheck = [
      'models/**/*.js',
      'modules/**/models/*.js',
      'modules/**/services/*.js',
      'modules/**/controllers/*.js',
      'routes/**/*.js',
      'middleware/*.js',
      'scripts/*.js'
    ];

    // Get all JavaScript files
    const jsFiles = await getJavaScriptFiles();

    console.log(`📋 Found ${jsFiles.length} JavaScript files to validate`);
    console.log('');

    for (const filePath of jsFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const fileViolations = await validateFileCompliance(filePath, content);

        if (fileViolations.length > 0) {
          violations.push({
            file: filePath,
            violations: fileViolations
          });
        } else {
          validFiles.push(filePath);
        }
      } catch (error) {
        console.log(`❌ Error reading file ${filePath}: ${error.message}`);
      }
    }

    // Report results
    console.log('📊 VALIDATION RESULTS');
    console.log('='.repeat(40));

    if (validFiles.length > 0) {
      console.log(`✅ Compliant files (${validFiles.length}):`);
      validFiles.forEach(file => {
        console.log(`  ✅ ${file}`);
      });
      console.log('');
    }

    if (violations.length > 0) {
      console.log(`❌ Files with violations (${violations.length}):`);
      violations.forEach(({ file, violations: fileViolations }) => {
        console.log(`  ❌ ${file}:`);
        fileViolations.forEach(violation => {
          console.log(`    - Line ${violation.line}: ${violation.message}`);
        });
      });
      console.log('');
    }

    const totalFiles = validFiles.length + violations.length;
    const compliancePercentage = Math.round((validFiles.length / totalFiles) * 100);

    console.log('🎯 SUMMARY');
    console.log(
      `  📈 Compliance Rate: ${compliancePercentage}% (${validFiles.length}/${totalFiles})`
    );
    console.log(
      `  ✅ Q57 (async/await): ${violations.filter(v => v.violations.some(vv => vv.type === 'Q57')).length === 0 ? 'PASS' : 'FAIL'}`
    );
    console.log(
      `  ✅ Q58 (try-catch): ${violations.filter(v => v.violations.some(vv => vv.type === 'Q58')).length === 0 ? 'PASS' : 'FAIL'}`
    );

    if (violations.length === 0) {
      console.log('\n🎉 ALL FILES ARE Q57-Q58 COMPLIANT!');
      return true;
    } else {
      console.log('\n⚠️  COMPLIANCE VIOLATIONS FOUND - Please fix before proceeding');
      return false;
    }
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    console.error(error.stack);
    return false;
  }
}

async function getJavaScriptFiles() {
  const jsFiles = [];

  const searchPaths = ['models', 'modules', 'routes', 'middleware', 'scripts'];

  for (const searchPath of searchPaths) {
    try {
      await addJsFilesFromPath(path.join(__dirname, '..', searchPath), jsFiles);
    } catch (error) {
      // Path might not exist, skip it
    }
  }

  return jsFiles;
}

async function addJsFilesFromPath(dirPath, jsFiles) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        await addJsFilesFromPath(fullPath, jsFiles);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        jsFiles.push(fullPath);
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
  }
}

async function validateFileCompliance(filePath, content) {
  const violations = [];
  const lines = content.split('\n'); // Check for Q57 violations (callbacks, raw promises)
  const callbackPatterns = [
    /\.(then|catch)\s*\(/,
    /new Promise\s*\(/,
    /callback\s*\(/,
    /\w+\s*\(.*,\s*function\s*\(/,
    /\w+\s*\(.*,\s*\(\s*err\s*,/
  ];

  // Check for Q58 violations (async without try-catch)
  const asyncFunctionRegex = /(?:async\s+function|async\s+\w+\s*=>|async\s*\()/;
  const tryRegex = /^\s*try\s*{/;

  let inAsyncFunction = false;
  let asyncFunctionLine = 0;
  let foundTryCatch = false;
  let braceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Check Q57: No callbacks or raw promises
    for (const pattern of callbackPatterns) {
      if (pattern.test(line) && !line.includes('//') && !line.includes('*')) {
        violations.push({
          line: lineNumber,
          type: 'Q57',
          message: 'FORBIDDEN: Use async/await instead of callbacks/promises'
        });
      }
    }

    // Check Q58: Async functions must have try-catch
    if (asyncFunctionRegex.test(line)) {
      inAsyncFunction = true;
      asyncFunctionLine = lineNumber;
      foundTryCatch = false;
      braceCount = 0;
    }

    if (inAsyncFunction) {
      // Count braces to track function scope
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;

      // Check for try-catch
      if (tryRegex.test(line)) {
        foundTryCatch = true;
      }

      // End of function (when braces balance out)
      if (braceCount <= 0 && i > asyncFunctionLine) {
        if (!foundTryCatch && !isTestOrLogFunction(lines, asyncFunctionLine)) {
          violations.push({
            line: asyncFunctionLine,
            type: 'Q58',
            message: 'VIOLATION: Async function must have try-catch block'
          });
        }
        inAsyncFunction = false;
      }
    }
  }

  return violations;
}

function isTestOrLogFunction(lines, lineIndex) {
  const functionLine = lines[lineIndex - 1];

  // Skip test functions and simple logging functions
  const skipPatterns = [
    /console\./,
    /logger\./,
    /describe\s*\(/,
    /it\s*\(/,
    /test\s*\(/,
    /beforeEach\s*\(/,
    /afterEach\s*\(/,
    /\w+\.log\s*\(/
  ];

  return skipPatterns.some(pattern => pattern.test(functionLine));
}

// Run validation
validateAsyncAwaitCompliance()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
