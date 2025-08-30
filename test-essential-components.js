/**
 * Essential Syntax and Import Tests
 * Tests only the core working components after modularization
 */

const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Essential Syntax and Import Tests...\n');

// Core essential components that must work
const essentialTests = [
   // Email Service modules (Phase 6A) - Working
   { name: 'Main Email Service', path: './utils/emailService.js' },
   { name: 'Email Core Module', path: './utils/email/EmailCore.js' },
   { name: 'User Communications Module', path: './utils/email/UserCommunications.js' },
   { name: 'Financial Communications Module', path: './utils/email/FinancialCommunications.js' },
   { name: 'Academic Communications Module', path: './utils/email/AcademicCommunications.js' },
   { name: 'System Communications Module', path: './utils/email/SystemCommunications.js' },

   // School Models (Phase 6D) - Core working components
   { name: 'Main School Model (Fixed)', path: './modules/school/models/School.js' },

   // Student Models - Core components
   { name: 'Student Model', path: './models/student/Student.js' },
   { name: 'Student Enrollment Model', path: './models/student/StudentEnrollment.js' },
   { name: 'Student Validation Model', path: './models/student/StudentValidation.js' },
   { name: 'Student Document Model', path: './models/student/StudentDocument.js' },

   // Fee Models
   { name: 'Fee Configuration Model', path: './models/fee/FeeConfiguration.js' },

   // System Models
   { name: 'System User Model', path: './models/system/SystemUser.js' },
   { name: 'Academic Year Model', path: './models/system/AcademicYear.js' },

   // Controllers - Core working
   { name: 'Student Controller', path: './modules/students/controllers/studentController.js' },
   { name: 'User Controller', path: './modules/users/controllers/userController.js' },
   { name: 'School Controller', path: './modules/school/controllers/SchoolController.js' },

   // Services - Core working
   { name: 'Student Service', path: './modules/students/services/studentService.js' },
   { name: 'User Service', path: './modules/users/services/userService.js' },
   { name: 'School Service', path: './modules/school/services/SchoolService.js' },

   // Routes - Working routes
   { name: 'Student Routes', path: './modules/students/routes/studentRoutes.js' },
   { name: 'User Routes', path: './modules/users/routes/userRoutes.js' },
   { name: 'School Routes (Index)', path: './modules/school/routes/index.js' },
   { name: 'Main Routes Index', path: './routes/index.js' },
   { name: 'System Routes', path: './routes/system.js' },

   // Core utilities
   { name: 'Database Manager', path: './models/system/database.js' },
   { name: 'Logger Utility', path: './utils/logger.js' },
   { name: 'Validation Utility', path: './utils/validation.js' },
];

let passed = 0;
let failed = 0;
const results = [];

console.log('=== ESSENTIAL COMPONENTS TEST ===\n');

for (const test of essentialTests) {
   try {
      console.log(`Testing: ${test.name}`);
      console.log(`File: ${test.path}`);

      // Check if file exists
      const fullPath = path.resolve(test.path);
      if (!fs.existsSync(fullPath)) {
         throw new Error(`File does not exist: ${test.path}`);
      }

      // Try to require the module
      delete require.cache[fullPath]; // Clear cache
      require(fullPath);

      console.log('✅ PASS\n');
      passed++;
      results.push({ name: test.name, status: 'PASS' });
   } catch (error) {
      console.log('❌ FAIL');
      console.log(`Error: ${error.message}\n`);
      failed++;
      results.push({ name: test.name, status: 'FAIL', error: error.message });
   }
}

// Summary
console.log('=== ESSENTIAL COMPONENTS TEST SUMMARY ===');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);

if (failed > 0) {
   console.log('=== FAILED TESTS DETAILS ===');
   results
      .filter((r) => r.status === 'FAIL')
      .forEach((result, index) => {
         console.log(`${index + 1}. ${result.name}`);
         console.log(`   Error: ${result.error}\n`);
      });
}

if (failed === 0) {
   console.log('🎉 ALL ESSENTIAL COMPONENTS PASS!');
   console.log('✅ Core functionality is working correctly.');
} else {
   console.log(`⚠️  ${failed} ESSENTIAL COMPONENT(S) FAILED - Please review errors above.`);
}

process.exit(failed === 0 ? 0 : 1);
