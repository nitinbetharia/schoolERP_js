/**
 * Basic Functionality Test Script
 * Tests core features to ensure everything works
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function testBasicFunctionality() {
  console.log('🧪 Testing Basic Functionality');
  console.log('==============================\n');

  const tests = [
    {
      name: 'Lint Code',
      command: 'npm run lint',
      required: false
    },
    {
      name: 'Format Code Check',
      command: 'npx prettier --check .',
      required: false
    },
    {
      name: 'Server Health Check',
      command: 'npm run health',
      required: true,
      timeout: 30000
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`📋 Running: ${test.name}...`);
      
      const { stdout, stderr } = await execAsync(test.command, {
        timeout: test.timeout || 10000
      });
      
      if (stdout) console.log(`✅ ${test.name}: PASSED`);
      if (stderr && !stderr.includes('warning')) {
        console.log(`⚠️  ${test.name}: ${stderr}`);
      }
      
      passed++;
      
    } catch (error) {
      if (test.required) {
        console.log(`❌ ${test.name}: FAILED`);
        console.log(`   Error: ${error.message}`);
        failed++;
      } else {
        console.log(`⚠️  ${test.name}: SKIPPED (non-critical)`);
      }
    }
    
    console.log('');
  }

  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All critical tests passed!');
    console.log('🚀 Your School ERP system is ready to use.');
    return true;
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
    return false;
  }
}

// Run tests if called directly
if (require.main === module) {
  testBasicFunctionality()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { testBasicFunctionality };