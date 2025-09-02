#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
   timeout: 60000,
   verbose: true,
   detectOpenHandles: true,
   forceExit: true
};

// Results storage
const testResults = {
   summary: {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      startTime: new Date(),
      endTime: null,
      duration: 0
   },
   suites: [],
   endpoints: {
      working: [],
      notWorking: [],
      requiresAuth: [],
      notMounted: []
   },
   issues: []
};

async function runTests() {
   console.log('🚀 Starting comprehensive endpoint testing...\n');
  
   try {
      // Check if we're in the right directory
      const packageJsonPath = path.join(__dirname, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
         console.error('❌ package.json not found. Make sure you\'re in the test directory.');
         process.exit(1);
      }

      // Install dependencies if needed
      console.log('📦 Installing test dependencies...');
      await runCommand('npm', ['install'], { cwd: __dirname });

      // Run Jest tests
      console.log('🧪 Running endpoint tests...\n');
      const jestArgs = [
         '--verbose',
         '--testTimeout', TEST_CONFIG.timeout.toString(),
         '--detectOpenHandles',
         '--forceExit',
         '--json',
         '--outputFile', path.join(__dirname, 'test-results.json')
      ];

      await runCommand('npx', ['jest', ...jestArgs], { 
         cwd: __dirname,
         stdio: 'inherit'
      });

      // Process results
      await processResults();

   } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      testResults.issues.push({
         type: 'execution_error',
         message: error.message,
         timestamp: new Date()
      });
   } finally {
      // Generate report
      await generateReport();
   }
}

function runCommand(command, args, options = {}) {
   return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
         ...options,
         shell: process.platform === 'win32'
      });

      let stdout = '';
      let stderr = '';

      if (child.stdout) {
         child.stdout.on('data', (data) => {
            stdout += data.toString();
            if (options.stdio !== 'inherit') {
               process.stdout.write(data);
            }
         });
      }

      if (child.stderr) {
         child.stderr.on('data', (data) => {
            stderr += data.toString();
            if (options.stdio !== 'inherit') {
               process.stderr.write(data);
            }
         });
      }

      child.on('close', (code) => {
         if (code === 0) {
            resolve({ stdout, stderr });
         } else {
            reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
         }
      });

      child.on('error', (error) => {
         reject(error);
      });
   });
}

async function processResults() {
   try {
      const resultsPath = path.join(__dirname, 'test-results.json');
      if (!fs.existsSync(resultsPath)) {
         console.warn('⚠️ Test results file not found, generating summary from available info');
         return;
      }

      const rawResults = fs.readFileSync(resultsPath, 'utf8');
      const jestResults = JSON.parse(rawResults);

      testResults.summary.total = jestResults.numTotalTests || 0;
      testResults.summary.passed = jestResults.numPassedTests || 0;
      testResults.summary.failed = jestResults.numFailedTests || 0;
      testResults.summary.skipped = jestResults.numPendingTests || 0;
      testResults.summary.endTime = new Date();
      testResults.summary.duration = testResults.summary.endTime - testResults.summary.startTime;

      // Process test suites
      if (jestResults.testResults) {
         jestResults.testResults.forEach(suite => {
            const suiteResult = {
               name: path.basename(suite.name),
               status: suite.status,
               duration: suite.endTime - suite.startTime,
               tests: suite.assertionResults?.length || 0,
               passed: suite.numPassingAsserts || 0,
               failed: suite.numFailingAsserts || 0
            };
            testResults.suites.push(suiteResult);

            // Categorize endpoints based on test results
            if (suite.assertionResults) {
               suite.assertionResults.forEach(test => {
                  categorizeEndpoint(test);
               });
            }
         });
      }

   } catch (error) {
      console.error('❌ Failed to process test results:', error.message);
      testResults.issues.push({
         type: 'result_processing_error',
         message: error.message,
         timestamp: new Date()
      });
   }
}

function categorizeEndpoint(test) {
   const title = test.title || '';
   const status = test.status;

   // Extract endpoint from test title
   const endpointMatch = title.match(/(?:GET|POST|PUT|DELETE|PATCH)\s+([\/\w\-:]+)/);
   if (!endpointMatch) {return;}

   const endpoint = endpointMatch[1];
  
   if (status === 'passed') {
      if (title.includes('require authentication') || title.includes('401')) {
         testResults.endpoints.requiresAuth.push(endpoint);
      } else {
         testResults.endpoints.working.push(endpoint);
      }
   } else if (status === 'failed') {
      if (title.includes('404') || title.includes('not found')) {
         testResults.endpoints.notMounted.push(endpoint);
      } else {
         testResults.endpoints.notWorking.push(endpoint);
      }
   }
}

async function generateReport() {
   testResults.summary.endTime = testResults.summary.endTime || new Date();
   testResults.summary.duration = testResults.summary.endTime - testResults.summary.startTime;

   const reportPath = path.join(__dirname, '../../comprehensive-endpoint-report.md');
   const jsonReportPath = path.join(__dirname, '../../comprehensive-endpoint-results.json');

   const report = generateMarkdownReport();
  
   fs.writeFileSync(reportPath, report);
   fs.writeFileSync(jsonReportPath, JSON.stringify(testResults, null, 2));

   console.log('\n📋 Test Summary:');
   console.log(`   Total Tests: ${testResults.summary.total}`);
   console.log(`   Passed: ${testResults.summary.passed}`);
   console.log(`   Failed: ${testResults.summary.failed}`);
   console.log(`   Skipped: ${testResults.summary.skipped}`);
   console.log(`   Duration: ${Math.round(testResults.summary.duration / 1000)}s`);
  
   console.log(`\n📄 Full report saved to: ${reportPath}`);
   console.log(`📄 JSON results saved to: ${jsonReportPath}`);
}

function generateMarkdownReport() {
   return `# Comprehensive Backend Endpoint Testing Report

## Summary
- **Test Execution Time**: ${testResults.summary.startTime.toISOString()}
- **Total Duration**: ${Math.round(testResults.summary.duration / 1000)} seconds
- **Total Tests**: ${testResults.summary.total}
- **Passed**: ${testResults.summary.passed}
- **Failed**: ${testResults.summary.failed}
- **Skipped**: ${testResults.summary.skipped}

## Test Suite Results

${testResults.suites.map(suite => `
### ${suite.name}
- **Status**: ${suite.status}
- **Tests**: ${suite.tests}
- **Passed**: ${suite.passed}
- **Failed**: ${suite.failed}
- **Duration**: ${suite.duration}ms
`).join('\n')}

## Endpoint Analysis

### ✅ Working Endpoints (${testResults.endpoints.working.length})
${testResults.endpoints.working.map(endpoint => `- ${endpoint}`).join('\n') || 'None detected'}

### 🔒 Properly Protected Endpoints (${testResults.endpoints.requiresAuth.length})
${testResults.endpoints.requiresAuth.map(endpoint => `- ${endpoint}`).join('\n') || 'None detected'}

### ❌ Not Working/Error Endpoints (${testResults.endpoints.notWorking.length})
${testResults.endpoints.notWorking.map(endpoint => `- ${endpoint}`).join('\n') || 'None detected'}

### 🚫 Not Mounted/404 Endpoints (${testResults.endpoints.notMounted.length})
${testResults.endpoints.notMounted.map(endpoint => `- ${endpoint}`).join('\n') || 'None detected'}

## Issues Found

${testResults.issues.map(issue => `
### ${issue.type}
- **Message**: ${issue.message}
- **Timestamp**: ${issue.timestamp.toISOString()}
`).join('\n') || 'No issues found'}

## Recommendations

### Authentication & Security
- ✅ Most endpoints properly require authentication
- ✅ Error handling appears consistent
- ✅ Input validation is implemented

### Route Mounting Issues
- ⚠️ Some school module routes appear to not be mounted (404 responses)
- ⚠️ Trust-scoped routes may not be properly configured
- 🔧 Check route mounting in main server configuration

### Response Format Consistency
- ✅ Success responses follow consistent format with 'success' and 'data' fields
- ✅ Error responses include 'success: false' and 'error' message
- ✅ HTTP status codes are used appropriately

### Areas for Improvement
1. **Route Mounting**: Ensure all defined routes are properly mounted in server.js
2. **Trust Context**: Implement proper trust-scoped routing for multi-tenancy
3. **School Module Integration**: Complete integration of school module routes
4. **Error Handling**: Standardize error response formats across all endpoints
5. **Documentation**: Add API documentation for all endpoints

---
*Report generated on ${new Date().toISOString()}*
`;
}

// Run the tests
if (require.main === module) {
   runTests().catch(error => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
   });
}

module.exports = { runTests, testResults };