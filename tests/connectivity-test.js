/**
 * Simple connectivity test for SchoolERP server
 * Tests basic server response before running full test suite
 */

const axios = require('axios');

async function testServerConnectivity() {
   const baseURL = 'http://localhost:3000';

   console.log('Testing server connectivity...');

   try {
      // Test 1: Basic health check
      console.log('1. Testing basic server response...');
      const healthResponse = await axios.get(`${baseURL}/api/v1/status`, {
         timeout: 5000,
         validateStatus: () => true,
      });

      console.log(`   Status: ${healthResponse.status}`);
      console.log(`   Response: ${JSON.stringify(healthResponse.data, null, 2)}`);

      // Test 2: System admin endpoint
      console.log('2. Testing system admin endpoint...');
      const adminResponse = await axios.get(`${baseURL}/api/v1/admin/system/health`, {
         timeout: 5000,
         validateStatus: () => true,
      });

      console.log(`   Status: ${adminResponse.status}`);
      console.log(`   Response: ${JSON.stringify(adminResponse.data, null, 2)}`);

      // Test 3: Tenant detection with subdomain
      console.log('3. Testing subdomain detection...');
      const subdomainResponse = await axios.get(`${baseURL}/api/v1/users`, {
         headers: {
            Host: 'trust001.example.com:3000',
         },
         timeout: 5000,
         validateStatus: () => true,
      });

      console.log(`   Status: ${subdomainResponse.status}`);
      console.log(`   Response: ${JSON.stringify(subdomainResponse.data, null, 2)}`);

      console.log('\n✅ Server connectivity test completed successfully');
      return true;
   } catch (error) {
      console.error('\n❌ Server connectivity test failed:');
      console.error(`   Error: ${error.message}`);

      if (error.code === 'ECONNREFUSED') {
         console.error('   → Server is not running. Please start the server with: node app.js');
      } else if (error.code === 'TIMEOUT') {
         console.error('   → Server is running but responding slowly');
      }

      return false;
   }
}

// Run test if called directly
if (require.main === module) {
   testServerConnectivity()
      .then((success) => {
         process.exit(success ? 0 : 1);
      })
      .catch((error) => {
         console.error('Unexpected error:', error);
         process.exit(1);
      });
}

module.exports = testServerConnectivity;
