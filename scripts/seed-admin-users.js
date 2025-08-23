/**
 * Seed Admin Users Script - API Version
 * Uses API endpoints to create system admin and tenant admin users
 */

const http = require('http');
const config = require('../config/app-config.json');
const { logger } = require('../utils/logger');
require('dotenv').config();

// API base URLs
const BASE_PORT = process.env.PORT || config.app.port || 3000;

function makeHttpRequest(options, data) {
   return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
         let responseData = '';

         res.on('data', (chunk) => {
            responseData += chunk;
         });

         res.on('end', () => {
            try {
               const parsedData = responseData ? JSON.parse(responseData) : {};
               resolve({
                  status: res.statusCode,
                  data: parsedData,
                  headers: res.headers,
               });
            } catch (error) {
               resolve({
                  status: res.statusCode,
                  data: responseData,
                  headers: res.headers,
               });
            }
         });
      });

      req.on('error', (error) => {
         reject(error);
      });

      if (data) {
         req.write(JSON.stringify(data));
      }

      req.end();
   });
}

async function seedAdminUsers() {
   try {
      logger.info('Starting admin users seeding process via API');

      console.log('🔄 Checking if server is running...');

      // Create system admin user
      logger.info('Creating system admin user...');
      const systemUserData = {
         username: 'sysadmin',
         email: 'sysadmin@schoolerp.com',
         password: 'sysadmin123',
         firstName: 'System',
         lastName: 'Administrator',
         userType: 'SYSTEM_ADMIN',
         isActive: true,
         isVerified: true,
      };

      const systemOptions = {
         hostname: 'localhost',
         port: BASE_PORT,
         path: '/api/v1/admin/system/users',
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(JSON.stringify(systemUserData)),
         },
      };

      try {
         const systemUserResponse = await makeHttpRequest(systemOptions, systemUserData);

         if (systemUserResponse.status === 201) {
            logger.info('System admin user created successfully');
            console.log('✅ System admin user created successfully');
         } else if (systemUserResponse.status === 409) {
            logger.info('System admin user already exists');
            console.log('ℹ️  System admin user already exists');
         } else {
            console.log('⚠️  System admin creation response:', systemUserResponse.status, systemUserResponse.data);
         }
      } catch (error) {
         if (error.code === 'ECONNREFUSED') {
            console.log('❌ Server is not running. Please start the server first: npm start');
            process.exit(1);
         }
         logger.error('Failed to create system admin user:', error.message);
         console.log('❌ Failed to create system admin user:', error.message);
      }

      // Create tenant admin user for demo trust
      logger.info('Creating tenant admin user...');
      const tenantUserData = {
         username: 'trustadmin',
         email: 'admin@demo-trust.com',
         password: 'trustadmin123',
         firstName: 'Trust',
         lastName: 'Administrator',
         userType: 'STAFF',
         isActive: true,
      };

      const tenantOptions = {
         hostname: 'localhost',
         port: BASE_PORT,
         path: '/api/v1/admin/users',
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(JSON.stringify(tenantUserData)),
            'X-Tenant-Code': 'demo', // Set tenant context
         },
      };

      try {
         const tenantUserResponse = await makeHttpRequest(tenantOptions, tenantUserData);

         if (tenantUserResponse.status === 201) {
            logger.info('Tenant admin user created successfully');
            console.log('✅ Tenant admin user created successfully');
         } else if (tenantUserResponse.status === 409) {
            logger.info('Tenant admin user already exists');
            console.log('ℹ️  Tenant admin user already exists');
         } else {
            console.log('⚠️  Tenant admin creation response:', tenantUserResponse.status, tenantUserResponse.data);
         }
      } catch (error) {
         logger.error('Failed to create tenant admin user:', error.message);
         console.log('❌ Failed to create tenant admin user:', error.message);
      }

      console.log('\n=== ADMIN USERS SEEDING COMPLETED ===');
      console.log('System Database:');
      console.log('  Username: sysadmin');
      console.log('  Password: sysadmin123');
      console.log('  Email: sysadmin@schoolerp.com');
      console.log('');
      console.log('Tenant Database (Demo Trust):');
      console.log('  Username: trustadmin');
      console.log('  Password: trustadmin123');
      console.log('  Email: admin@demo-trust.com');
      console.log('');
      console.log('💡 Note: Server was running on port', BASE_PORT);
   } catch (error) {
      logger.error('Admin seeding failed:', error);
      console.error('Seeding failed:', error.message);
      if (error.code === 'ECONNREFUSED') {
         console.error('💡 Make sure the server is running: npm start');
      }
      process.exit(1);
   }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
   seedAdminUsers()
      .then(() => {
         console.log('Admin users seeding completed successfully');
         process.exit(0);
      })
      .catch((error) => {
         console.error('Admin users seeding failed:', error);
         process.exit(1);
      });
}

module.exports = { seedAdminUsers };

// Run the seeding if this file is executed directly
if (require.main === module) {
   seedAdminUsers()
      .then(() => {
         console.log('Admin users seeding completed successfully');
         process.exit(0);
      })
      .catch((error) => {
         console.error('Admin users seeding failed:', error);
         process.exit(1);
      });
}

module.exports = { seedAdminUsers };
