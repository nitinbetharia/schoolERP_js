#!/usr/bin/env node

/**
 * Test script to demonstrate enhanced error handling with rich error objects
 */

const axios = require('axios');

const baseURL = 'http://localhost:3000';

async function testEnhancedErrors() {
   console.log('🧪 Testing Enhanced Error Handling with Rich Error Objects\n');

   try {
      console.log('1️⃣ Testing Setup Module - Create Trust with Validation Errors...');

      // Test with invalid data to trigger validation errors
      const response = await axios.post(
         `${baseURL}/api/v1/setup/trusts`,
         {
            // Missing required fields to trigger validation
            name: '', // Empty name
            type: 'INVALID_TYPE', // Invalid type
            email: 'not-an-email', // Invalid email format
            phone: '123', // Too short phone
         },
         {
            headers: {
               'Content-Type': 'application/json',
               Accept: 'application/json',
            },
         }
      );

      console.log('✅ Response:', response.data);
   } catch (error) {
      if (error.response) {
         console.log('❌ API Error Response:');
         console.log('   Status:', error.response.status);
         console.log('   Headers:', error.response.headers);
         console.log('   Data:', JSON.stringify(error.response.data, null, 2));

         // Check if we have flash messages with enhanced error objects
         if (error.response.data.flash && error.response.data.flash.error) {
            console.log('\n📢 Enhanced Flash Error Messages:');
            error.response.data.flash.error.forEach((msg, index) => {
               console.log(`\n   Error ${index + 1}:`, JSON.stringify(msg, null, 4));
            });
         }
      } else {
         console.error('❌ Network/Request Error:', error.message);
      }
   }

   console.log('\n' + '='.repeat(60));

   try {
      console.log('\n2️⃣ Testing Setup Module - Get Nonexistent Trust...');

      const response = await axios.get(`${baseURL}/api/v1/setup/trusts/99999`, {
         headers: {
            Accept: 'application/json',
         },
      });

      console.log('✅ Response:', response.data);
   } catch (error) {
      if (error.response) {
         console.log('❌ API Error Response:');
         console.log('   Status:', error.response.status);
         console.log('   Data:', JSON.stringify(error.response.data, null, 2));

         if (error.response.data.flash && error.response.data.flash.error) {
            console.log('\n📢 Enhanced Flash Error Messages:');
            error.response.data.flash.error.forEach((msg, index) => {
               console.log(`\n   Error ${index + 1}:`, JSON.stringify(msg, null, 4));
            });
         }
      } else {
         console.error('❌ Network/Request Error:', error.message);
      }
   }

   console.log('\n' + '='.repeat(60));

   try {
      console.log('\n3️⃣ Testing Setup Module - List Trusts (should work)...');

      const response = await axios.get(`${baseURL}/api/v1/setup/trusts`, {
         headers: {
            Accept: 'application/json',
         },
      });

      console.log('✅ Success Response:');
      console.log('   Status:', response.status);
      console.log('   Data:', JSON.stringify(response.data, null, 2));
   } catch (error) {
      if (error.response) {
         console.log('❌ Unexpected Error:');
         console.log('   Status:', error.response.status);
         console.log('   Data:', JSON.stringify(error.response.data, null, 2));
      } else {
         console.error('❌ Network/Request Error:', error.message);
      }
   }
}

// Handle unhandled promises
process.on('unhandledRejection', (reason, promise) => {
   console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
   process.exit(1);
});

// Run the tests
testEnhancedErrors()
   .then(() => {
      console.log('\n✅ Enhanced Error Handling Tests Completed!');
      process.exit(0);
   })
   .catch((error) => {
      console.error('🚨 Test Runner Error:', error);
      process.exit(1);
   });
