/**
 * Q59 Validation: Business Constants Compliance
 * Finds files with hardcoded business values that need to be replaced with constants
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Q59 Validation: Checking for Hardcoded Business Values');
console.log('='.repeat(60));

// Patterns to detect hardcoded business values
const HARDCODED_PATTERNS = {
  userRoles: {
    pattern:
      /'TRUST_ADMIN'|'SCHOOL_ADMIN'|'TEACHER'|'ACCOUNTANT'|'PARENT'|'STUDENT'|"TRUST_ADMIN"|"SCHOOL_ADMIN"|"TEACHER"|"ACCOUNTANT"|"PARENT"|"STUDENT"/g,
    description: 'Hardcoded user roles (should use constants.USER_ROLES.*)',
    excludePatterns: [
      /constants\.USER_ROLES\./, // Already using constants
      /ALL_ROLES.*=.*\[.*'TRUST_ADMIN'/ // Defining the constants themselves
    ]
  },
  userStatus: {
    pattern: /'ACTIVE'|'INACTIVE'|'LOCKED'|"ACTIVE"|"INACTIVE"|"LOCKED"/g,
    description: 'Hardcoded user/academic status (should use constants.*_STATUS.*)',
    excludePatterns: [
      /constants\.(USER_STATUS|ACADEMIC_STATUS|PAYMENT_STATUS|COMMUNICATION_STATUS|ATTENDANCE_STATUS)\./,
      /ALL_STATUS.*=.*\[.*'ACTIVE'/, // Defining the constants themselves
      /log\.business\(/, // Log messages can use hardcoded strings
      /console\.log\(/, // Console messages can use hardcoded strings
      /description.*:/ // Descriptions can use hardcoded strings
    ]
  },
  paymentStatus: {
    pattern:
      /'PENDING'|'COMPLETED'|'FAILED'|'REFUNDED'|'CANCELLED'|'PROCESSING'|"PENDING"|"COMPLETED"|"FAILED"|"REFUNDED"|"CANCELLED"|"PROCESSING"/g,
    description: 'Hardcoded payment status (should use constants.PAYMENT_STATUS.*)',
    excludePatterns: [/constants\.PAYMENT_STATUS\./, /ALL_STATUS.*=.*\[.*'PENDING'/]
  },
  enumDefinitions: {
    pattern: /DataTypes\.ENUM\s*\(\s*['"][^'"]*['"],?\s*['"][^'"]*['"],?\s*['"][^'"]*['"]?\s*\)/g,
    description: 'Hardcoded DataTypes.ENUM (should use constants spread)',
    excludePatterns: [
      /DataTypes\.ENUM\(\.\.\.constants\./ // Already using constants
    ]
  },
  joiValidation: {
    pattern: /\.valid\s*\(\s*['"][^'"]*['"],?\s*['"][^'"]*['"],?\s*['"][^'"]*['"]?\s*\)/g,
    description: 'Hardcoded Joi .valid() values (should use constants)',
    excludePatterns: [
      /\.valid\(\.\.\.constants\./ // Already using constants spread
    ]
  }
};

// Directories to scan
const SCAN_DIRECTORIES = ['models', 'modules', 'middleware', 'routes', 'controllers', 'services'];

// Files to exclude from scanning
const EXCLUDE_FILES = [
  'config/business-constants.js', // The constants definition file itself
  'node_modules',
  '.git',
  'logs',
  'tests',
  '.env'
];

function shouldExcludeFile(filePath) {
  return EXCLUDE_FILES.some(exclude => filePath.includes(exclude));
}

function findFilesRecursive(dir, extensions = ['.js']) {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);

    if (shouldExcludeFile(fullPath)) {
      continue;
    }

    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findFilesRecursive(fullPath, extensions));
    } else if (extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

function isExcludedMatch(line, excludePatterns) {
  return excludePatterns.some(pattern => pattern.test(line));
}

function scanFileForViolations(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const violations = [];

    for (const [patternName, config] of Object.entries(HARDCODED_PATTERNS)) {
      const matches = content.match(config.pattern);

      if (matches) {
        // Filter out excluded matches
        const validMatches = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lineMatches = line.match(config.pattern);

          if (lineMatches) {
            // Check if this line should be excluded
            if (!isExcludedMatch(line, config.excludePatterns)) {
              validMatches.push({
                line: i + 1,
                content: line.trim(),
                matches: lineMatches
              });
            }
          }
        }

        if (validMatches.length > 0) {
          violations.push({
            type: patternName,
            description: config.description,
            matches: validMatches
          });
        }
      }
    }

    return violations;
  } catch (error) {
    console.error(`Error scanning ${filePath}:`, error.message);
    return [];
  }
}

async function validateBusinessConstants() {
  console.log('📂 Scanning directories for hardcoded business values...\n');

  // Get all JavaScript files to scan
  const allFiles = [];
  for (const dir of SCAN_DIRECTORIES) {
    const dirPath = path.join(process.cwd(), dir);
    allFiles.push(...findFilesRecursive(dirPath));
  }

  console.log(`📄 Found ${allFiles.length} JavaScript files to scan\n`);

  const violationsByFile = new Map();
  let totalViolations = 0;

  // Scan each file
  for (const filePath of allFiles) {
    const violations = scanFileForViolations(filePath);
    if (violations.length > 0) {
      violationsByFile.set(filePath, violations);
      totalViolations += violations.reduce((sum, v) => sum + v.matches.length, 0);
    }
  }

  // Report results
  console.log('📊 VALIDATION RESULTS');
  console.log('='.repeat(40));

  if (violationsByFile.size === 0) {
    console.log('✅ No hardcoded business values found!');
    console.log('✅ Q59 Business Constants compliance: PASSED');
  } else {
    console.log(
      `❌ Found ${totalViolations} hardcoded business values in ${violationsByFile.size} files\n`
    );

    // Group by violation type
    const violationsByType = new Map();

    for (const [filePath, violations] of violationsByFile) {
      for (const violation of violations) {
        if (!violationsByType.has(violation.type)) {
          violationsByType.set(violation.type, []);
        }
        violationsByType.get(violation.type).push({
          file: filePath,
          matches: violation.matches
        });
      }
    }

    // Report by type
    for (const [type, typeViolations] of violationsByType) {
      const config = HARDCODED_PATTERNS[type];
      console.log(`\n🔸 ${config.description}`);
      console.log('-'.repeat(50));

      for (const { file, matches } of typeViolations) {
        const relativePath = path.relative(process.cwd(), file);
        console.log(`\n📄 ${relativePath}:`);

        for (const match of matches) {
          console.log(`   Line ${match.line}: ${match.content}`);
        }
      }
    }

    console.log('\n📋 REMEDIATION SUMMARY');
    console.log('='.repeat(40));
    console.log('To fix these violations:');
    console.log('1. Replace hardcoded user roles with constants.USER_ROLES.*');
    console.log('2. Replace hardcoded status values with constants.*_STATUS.*');
    console.log('3. Update DataTypes.ENUM to use ...constants.*.ALL_STATUS');
    console.log('4. Update Joi .valid() to use ...constants.*.ALL_ROLES/ALL_STATUS');
    console.log(
      '5. Ensure all files import: const config = require("../config"); const constants = config.get("constants");'
    );

    console.log('\n❌ Q59 Business Constants compliance: FAILED');
    console.log(`❌ ${totalViolations} violations found in ${violationsByFile.size} files`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🔍 Q59 Business Constants Validation Complete');

  return violationsByFile.size === 0;
}

// Run validation
validateBusinessConstants()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
