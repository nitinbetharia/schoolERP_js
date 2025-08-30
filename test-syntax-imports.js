/**
 * Comprehensive Syntax and Import Test Suite
 * Tests all modularized files for syntax errors and import issues
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Comprehensive Syntax and Import Tests...\n');

// Test results tracking
const testResults = {
   passed: 0,
   failed: 0,
   errors: [],
};

/**
 * Test a JavaScript file for syntax errors
 */
function testFile(filePath, description) {
   try {
      console.log(`Testing: ${description}`);
      console.log(`File: ${filePath}`);

      if (!fs.existsSync(filePath)) {
         throw new Error(`File does not exist: ${filePath}`);
      }

      // Try to require the file to check for syntax and import errors
      delete require.cache[require.resolve(filePath)];
      require(filePath);

      console.log('✅ PASS\n');
      testResults.passed++;
      return true;
   } catch (error) {
      console.log('❌ FAIL');
      console.log(`Error: ${error.message}\n`);
      testResults.failed++;
      testResults.errors.push({
         file: filePath,
         description,
         error: error.message,
      });
      return false;
   }
}

/**
 * Test Sequelize model files (need special handling)
 */
function testSequelizeModel(filePath, description) {
   try {
      console.log(`Testing: ${description}`);
      console.log(`File: ${filePath}`);

      if (!fs.existsSync(filePath)) {
         throw new Error(`File does not exist: ${filePath}`);
      }

      // Read and check basic syntax without executing
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Basic syntax validation
      try {
         new Function(fileContent);
      } catch (syntaxError) {
         throw new Error(`Syntax error: ${syntaxError.message}`);
      }

      // Try to require without executing sequelize.define
      delete require.cache[require.resolve(filePath)];
      const moduleExports = require(filePath);

      if (typeof moduleExports !== 'function' && typeof moduleExports !== 'object') {
         throw new Error('Invalid module export');
      }

      console.log('✅ PASS\n');
      testResults.passed++;
      return true;
   } catch (error) {
      console.log('❌ FAIL');
      console.log(`Error: ${error.message}\n`);
      testResults.failed++;
      testResults.errors.push({
         file: filePath,
         description,
         error: error.message,
      });
      return false;
   }
}

// Test Phase 6A: Email Service Modules
console.log('=== PHASE 6A: EMAIL SERVICE MODULES ===');
testFile('./utils/emailService.js', 'Main Email Service');
testFile('./utils/email/EmailCore.js', 'Email Core Module');
testFile('./utils/email/UserCommunications.js', 'User Communications Module');
testFile('./utils/email/FinancialCommunications.js', 'Financial Communications Module');
testFile('./utils/email/AcademicCommunications.js', 'Academic Communications Module');
testFile('./utils/email/SystemCommunications.js', 'System Communications Module');

// Test Phase 6B: UDISE Facilities Modules
console.log('=== PHASE 6B: UDISE FACILITIES MODULES ===');
testSequelizeModel('./modules/school/models/UDISEFacilities.js', 'Main UDISE Facilities Model');
testFile('./modules/school/models/udise-facilities/InfrastructureFields.js', 'Infrastructure Fields Module');
testFile('./modules/school/models/udise-facilities/WaterSanitationFields.js', 'Water Sanitation Fields Module');
testFile('./modules/school/models/udise-facilities/TechnologyDigitalFields.js', 'Technology Digital Fields Module');
testFile('./modules/school/models/udise-facilities/KitchenNutritionFields.js', 'Kitchen Nutrition Fields Module');
testFile('./modules/school/models/udise-facilities/TransportationFields.js', 'Transportation Fields Module');
testFile('./modules/school/models/udise-facilities/SafetySecurityFields.js', 'Safety Security Fields Module');
testFile(
   './modules/school/models/udise-facilities/ComplianceAssessmentFields.js',
   'Compliance Assessment Fields Module'
);
testFile('./modules/school/models/udise-facilities/CalculationMethods.js', 'Calculation Methods Module');

// Test Phase 6C: International Board Compliance Modules
console.log('=== PHASE 6C: INTERNATIONAL BOARD COMPLIANCE MODULES ===');
testSequelizeModel(
   './modules/school/models/InternationalBoardCompliance.js',
   'Main International Board Compliance Model'
);
testFile('./modules/school/models/international-board-compliance/index.js', 'Compliance Index Module');
testFile(
   './modules/school/models/international-board-compliance/BoardAuthorizationFields.js',
   'Board Authorization Fields Module'
);
testFile(
   './modules/school/models/international-board-compliance/CurriculumAssessmentFields.js',
   'Curriculum Assessment Fields Module'
);
testFile(
   './modules/school/models/international-board-compliance/StaffQualificationsFields.js',
   'Staff Qualifications Fields Module'
);
testFile(
   './modules/school/models/international-board-compliance/FinancialComplianceFields.js',
   'Financial Compliance Fields Module'
);
testFile(
   './modules/school/models/international-board-compliance/MonitoringReportingFields.js',
   'Monitoring Reporting Fields Module'
);
testFile(
   './modules/school/models/international-board-compliance/RecognitionTransferFields.js',
   'Recognition Transfer Fields Module'
);
testFile(
   './modules/school/models/international-board-compliance/InnovationResearchFields.js',
   'Innovation Research Fields Module'
);

// Test Phase 6D: School Model Modules
console.log('=== PHASE 6D: SCHOOL MODEL MODULES ===');
testSequelizeModel('./modules/school/models/School.js', 'Main School Model');
testFile('./modules/school/models/school-fields/index.js', 'School Fields Index Module');
testFile('./modules/school/models/school-fields/BasicSchoolFields.js', 'Basic School Fields Module');
testFile('./modules/school/models/school-fields/AcademicConfigFields.js', 'Academic Config Fields Module');
testFile(
   './modules/school/models/school-fields/InfrastructureFacilitiesFields.js',
   'Infrastructure Facilities Fields Module'
);
testFile('./modules/school/models/school-fields/PrincipalStaffFields.js', 'Principal Staff Fields Module');
testFile(
   './modules/school/models/school-fields/ComplianceIntegrationFields.js',
   'Compliance Integration Fields Module'
);
testFile('./modules/school/models/school-fields/SchoolInstanceMethods.js', 'School Instance Methods Module');
testFile('./modules/school/models/school-fields/SchoolValidationSchemas.js', 'School Validation Schemas Module');

// Test Results Summary
console.log('=== TEST RESULTS SUMMARY ===');
console.log(`✅ Passed: ${testResults.passed}`);
console.log(`❌ Failed: ${testResults.failed}`);
console.log(`📊 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

if (testResults.errors.length > 0) {
   console.log('\n=== FAILED TESTS DETAILS ===');
   testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.description}`);
      console.log(`   File: ${error.file}`);
      console.log(`   Error: ${error.error}\n`);
   });
}

if (testResults.failed === 0) {
   console.log('\n🎉 ALL SYNTAX AND IMPORT TESTS PASSED!');
   process.exit(0);
} else {
   console.log(`\n⚠️  ${testResults.failed} TEST(S) FAILED - Please review errors above.`);
   process.exit(1);
}
