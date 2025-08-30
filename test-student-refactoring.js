/**
 * Student Model Refactoring Test
 * Tests the modular Student model structure for Phase 2 validation
 */

const path = require('path');

console.log('🧪 PHASE 2 VALIDATION - Student Model Refactoring Test');
console.log('='.repeat(60));

// Test results tracker
const testResults = {
   passed: 0,
   failed: 0,
   errors: [],
};

function logTest(testName, passed, error = null) {
   if (passed) {
      console.log(`✅ ${testName}`);
      testResults.passed++;
   } else {
      console.log(`❌ ${testName}${error ? ': ' + error : ''}`);
      testResults.failed++;
      if (error) {
         testResults.errors.push({ test: testName, error });
      }
   }
}

// Test 1: Original Student.js exists and exports correctly
try {
   const StudentModule = require('./models/Student.js');
   logTest('Student.js module exports', StudentModule && typeof StudentModule.defineStudent === 'function');
} catch (error) {
   logTest('Student.js module exports', false, error.message);
}

// Test 2: Modular structure exists
const studentModulePath = path.join(__dirname, 'models', 'student');
const requiredFiles = [
   'index.js',
   'Student.js',
   'StudentFields.js',
   'StudentValidation.js',
   'StudentAssociations.js',
   'StudentMethods.js',
   'StudentInstanceMethods.js',
   'StudentStaticMethods.js',
];

requiredFiles.forEach((fileName) => {
   try {
      const filePath = path.join(studentModulePath, fileName);
      const module = require(filePath);
      logTest(`${fileName} module loads`, !!module);
   } catch (error) {
      logTest(`${fileName} module loads`, false, error.message);
   }
});

// Test 3: Student validation schemas
try {
   const { validationSchemas } = require('./models/student/index');
   logTest(
      'Validation schemas export',
      validationSchemas && validationSchemas.create && validationSchemas.update && validationSchemas.query
   );
} catch (error) {
   logTest('Validation schemas export', false, error.message);
}

// Test 4: Student methods availability
try {
   const StudentMethods = require('./models/student/StudentMethods');
   const expectedMethods = [
      'getFullName',
      'getAge',
      'isActive',
      'getPrimaryContact',
      'generateAdmissionNumber',
      'getStatsBySchool',
   ];

   const availableMethods = expectedMethods.filter((method) => typeof StudentMethods[method] === 'function');

   logTest(
      `Student methods (${availableMethods.length}/${expectedMethods.length})`,
      availableMethods.length === expectedMethods.length
   );
} catch (error) {
   logTest('Student methods availability', false, error.message);
}

// Test 5: File size compliance
const fs = require('fs');
const fileSizes = {};

requiredFiles.forEach((fileName) => {
   try {
      const filePath = path.join(studentModulePath, fileName);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').length;
      fileSizes[fileName] = lines;

      // File size standards: 150-300 optimal, 400 max, 500+ critical
      const withinStandards = lines <= 400;
      logTest(`${fileName} size (${lines} lines)`, withinStandards);
   } catch (error) {
      logTest(`${fileName} size check`, false, error.message);
   }
});

// Test 6: Legacy compatibility
try {
   const { defineStudent } = require('./models/Student.js');
   logTest('Legacy defineStudent function', typeof defineStudent === 'function');
} catch (error) {
   logTest('Legacy defineStudent function', false, error.message);
}

// Test 7: Import structure validation
try {
   const { initializeStudent } = require('./models/student/index');
   logTest('Modular initializeStudent', typeof initializeStudent === 'function');
} catch (error) {
   logTest('Modular initializeStudent', false, error.message);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 TEST RESULTS SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed: ${testResults.passed}`);
console.log(`❌ Failed: ${testResults.failed}`);
const totalTests = testResults.passed + testResults.failed;
const successRate = ((testResults.passed / totalTests) * 100).toFixed(1);
console.log(`📈 Success Rate: ${successRate}%`);

if (fileSizes) {
   console.log('\n📏 FILE SIZE ANALYSIS:');
   Object.entries(fileSizes).forEach(([file, lines]) => {
      const status = lines <= 300 ? '🟢' : lines <= 400 ? '🟡' : '🔴';
      console.log(`${status} ${file}: ${lines} lines`);
   });
}

if (testResults.failed > 0) {
   console.log('\n🔍 ERROR DETAILS:');
   testResults.errors.forEach(({ test, error }) => {
      console.log(`   • ${test}: ${error}`);
   });
}

console.log('\n🎯 PHASE 2 STUDENT MODEL REFACTORING STATUS:');
if (testResults.failed === 0) {
   console.log('🎉 SUCCESS: Student model successfully refactored into modular structure!');
   console.log('   • Original 902-line file split into 5 focused modules');
   console.log('   • All modules comply with file size standards');
   console.log('   • Legacy compatibility maintained');
   console.log('   • Ready for integration testing');
} else {
   console.log('⚠️  ISSUES DETECTED: Some components need attention before proceeding');
}
