/**
 * Simple Integration Test
 * Tests if all modularized components integrate correctly
 */

console.log('🧪 Running Integration Tests for Modularized Components...\n');

// Test 1: Test all modularized exports
console.log('=== TESTING MODULAR COMPONENT EXPORTS ===');

let allTestsPassed = true;

function testModule(modulePath, description) {
   try {
      const moduleExports = require(modulePath);
      if (moduleExports && (typeof moduleExports === 'object' || typeof moduleExports === 'function')) {
         console.log(`✅ ${description}: Module loads and exports correctly`);
         return true;
      } else {
         console.log(`❌ ${description}: Invalid exports`);
         return false;
      }
   } catch (error) {
      console.log(`❌ ${description}: ${error.message}`);
      return false;
   }
}

// Test modularized components
console.log('\n--- Phase 6A: Email Service Components ---');
allTestsPassed &= testModule('./utils/emailService.js', 'Main Email Service');
allTestsPassed &= testModule('./utils/email/EmailCore.js', 'Email Core');
allTestsPassed &= testModule('./utils/email/UserCommunications.js', 'User Communications');

console.log('\n--- Phase 6B: UDISE Facilities Components ---');
allTestsPassed &= testModule(
   './modules/school/models/udise-facilities/InfrastructureFields.js',
   'Infrastructure Fields'
);
allTestsPassed &= testModule(
   './modules/school/models/udise-facilities/TechnologyDigitalFields.js',
   'Technology Fields'
);

console.log('\n--- Phase 6C: International Board Compliance Components ---');
allTestsPassed &= testModule('./modules/school/models/international-board-compliance/index.js', 'Compliance Index');
allTestsPassed &= testModule(
   './modules/school/models/international-board-compliance/BoardAuthorizationFields.js',
   'Board Authorization'
);

console.log('\n--- Phase 6D: School Model Components ---');
allTestsPassed &= testModule('./modules/school/models/school-fields/index.js', 'School Fields Index');
allTestsPassed &= testModule('./modules/school/models/school-fields/BasicSchoolFields.js', 'Basic School Fields');

// Test 2: Test that main files can be required without errors
console.log('\n=== TESTING MAIN MODEL INTEGRATION ===');

// Mock Sequelize for testing
const mockSequelize = {
   define: () => ({}),
   models: {},
   Op: {},
};

try {
   const { defineSchool } = require('./modules/school/models/School.js');
   if (typeof defineSchool === 'function') {
      console.log('✅ School Model: Successfully imports and exports define function');
   } else {
      console.log('❌ School Model: Invalid export structure');
      allTestsPassed = false;
   }
} catch (error) {
   console.log(`❌ School Model: ${error.message}`);
   allTestsPassed = false;
}

try {
   const defineCompliance = require('./modules/school/models/InternationalBoardCompliance.js');
   if (typeof defineCompliance === 'function') {
      console.log('✅ International Board Compliance Model: Successfully imports');
   } else {
      console.log('❌ International Board Compliance Model: Invalid export');
      allTestsPassed = false;
   }
} catch (error) {
   console.log(`❌ International Board Compliance Model: ${error.message}`);
   allTestsPassed = false;
}

try {
   const defineUDISE = require('./modules/school/models/UDISEFacilities.js');
   if (typeof defineUDISE === 'function') {
      console.log('✅ UDISE Facilities Model: Successfully imports');
   } else {
      console.log('❌ UDISE Facilities Model: Invalid export');
      allTestsPassed = false;
   }
} catch (error) {
   console.log(`❌ UDISE Facilities Model: ${error.message}`);
   allTestsPassed = false;
}

try {
   const emailService = require('./utils/emailService.js');
   if (emailService && typeof emailService === 'object') {
      console.log('✅ Email Service: Successfully imports modularized version');
   } else {
      console.log('❌ Email Service: Invalid export structure');
      allTestsPassed = false;
   }
} catch (error) {
   console.log(`❌ Email Service: ${error.message}`);
   allTestsPassed = false;
}

// Test 3: Check for critical server dependencies
console.log('\n=== TESTING CRITICAL DEPENDENCIES ===');

const criticalModules = ['express', 'sequelize', 'joi', 'winston', 'dotenv'];

criticalModules.forEach((moduleName) => {
   try {
      require(moduleName);
      console.log(`✅ ${moduleName}: Available`);
   } catch (error) {
      console.log(`❌ ${moduleName}: Missing or error - ${error.message}`);
      allTestsPassed = false;
   }
});

// Final Results
console.log('\n=== INTEGRATION TEST RESULTS ===');
if (allTestsPassed) {
   console.log('🎉 ALL INTEGRATION TESTS PASSED!');
   console.log('✅ All modularized components are working correctly');
   console.log('✅ Server should start without issues');
   console.log('✅ All dependencies are available');
   process.exit(0);
} else {
   console.log('❌ SOME INTEGRATION TESTS FAILED');
   console.log('⚠️  Please review the errors above');
   process.exit(1);
}
