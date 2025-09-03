/**
 * Advanced User Management Service
 * Enhanced service for comprehensive user operations including bulk imports and advanced permissions
 */

const { logger } = require('../utils/logger');
const ExcelJS = require('exceljs');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class AdvancedUserManagementService {
   constructor() {
      this.userCache = new Map();
      this.cacheExpiry = 15 * 60 * 1000; // 15 minutes
   }

   /**
    * Bulk import users from Excel file
    */
   async bulkImportUsers(fileBuffer, tenantCode, createdBy, systemDb, tenantDb) {
      try {
         const workbook = new ExcelJS.Workbook();
         await workbook.xlsx.load(fileBuffer);
         
         const worksheet = workbook.worksheets[0];
         const users = [];
         const errors = [];
         const validationResults = {
            totalRows: 0,
            validUsers: 0,
            errors: 0,
            duplicates: 0
         };

         // Expected columns: First Name, Last Name, Email, Role, Phone, Department
         const expectedHeaders = ['First Name', 'Last Name', 'Email', 'Role', 'Phone', 'Department'];
         
         // Validate headers
         const actualHeaders = [];
         worksheet.getRow(1).eachCell((cell, colNumber) => {
            actualHeaders[colNumber - 1] = cell.value;
         });

         const headerValidation = this.validateHeaders(expectedHeaders, actualHeaders);
         if (!headerValidation.valid) {
            throw new Error(`Invalid headers: ${headerValidation.message}`);
         }

         // Process each row
         worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header row
            
            validationResults.totalRows++;
            
            const userData = {
               first_name: row.getCell(1).value,
               last_name: row.getCell(2).value,
               email: row.getCell(3).value,
               role: row.getCell(4).value,
               phone: row.getCell(5).value,
               department: row.getCell(6).value,
               tenant_code: tenantCode,
               created_by: createdBy,
               is_active: true
            };

            // Validate user data
            const validation = this.validateUserData(userData);
            if (!validation.valid) {
               errors.push({
                  row: rowNumber,
                  errors: validation.errors,
                  data: userData
               });
               validationResults.errors++;
               return;
            }

            users.push(userData);
            validationResults.validUsers++;
         });

         // Check for duplicates in the current batch
         const emailSet = new Set();
         const duplicateEmails = [];
         
         users.forEach((user, index) => {
            if (emailSet.has(user.email)) {
               duplicateEmails.push({ index, email: user.email });
               validationResults.duplicates++;
            } else {
               emailSet.add(user.email);
            }
         });

         // Check for existing users in database
         const TenantUser = tenantDb.models.TenantUser;
         const emails = users.map(user => user.email);
         const existingUsers = await TenantUser.findAll({
            where: { email: emails },
            attributes: ['email']
         });

         const existingEmails = new Set(existingUsers.map(user => user.email));
         
         // Filter out existing users
         const newUsers = users.filter(user => !existingEmails.has(user.email));
         validationResults.duplicates += users.length - newUsers.length;

         // Generate passwords and hash them
         const usersWithPasswords = await Promise.all(newUsers.map(async (user) => {
            const tempPassword = this.generateTemporaryPassword();
            const hashedPassword = await bcrypt.hash(tempPassword, 10);
            
            return {
               ...user,
               password: hashedPassword,
               temp_password: tempPassword,
               password_reset_required: true,
               created_at: new Date(),
               updated_at: new Date()
            };
         }));

         // Bulk create users
         const createdUsers = await TenantUser.bulkCreate(usersWithPasswords, {
            returning: true
         });

         logger.info('Bulk user import completed', {
            tenantCode,
            totalRows: validationResults.totalRows,
            created: createdUsers.length,
            errors: validationResults.errors,
            duplicates: validationResults.duplicates
         });

         return {
            success: true,
            results: validationResults,
            createdUsers: createdUsers.map(user => ({
               id: user.id,
               name: `${user.first_name} ${user.last_name}`,
               email: user.email,
               tempPassword: user.temp_password
            })),
            errors
         };

      } catch (error) {
         logger.error('Bulk user import failed', { error: error.message, tenantCode });
         throw error;
      }
   }

   /**
    * Generate bulk import template
    */
   async generateBulkImportTemplate() {
      try {
         const workbook = new ExcelJS.Workbook();
         const worksheet = workbook.addWorksheet('User Import Template');

         // Add headers
         const headers = ['First Name', 'Last Name', 'Email', 'Role', 'Phone', 'Department'];
         worksheet.addRow(headers);

         // Add sample data
         const sampleData = [
            ['John', 'Doe', 'john.doe@example.com', 'teacher', '9876543210', 'Mathematics'],
            ['Jane', 'Smith', 'jane.smith@example.com', 'admin', '9876543211', 'Administration'],
            ['Mike', 'Wilson', 'mike.wilson@example.com', 'teacher', '9876543212', 'Science']
         ];

         sampleData.forEach(row => worksheet.addRow(row));

         // Style the headers
         worksheet.getRow(1).font = { bold: true };
         worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
         };

         // Auto-fit columns
         worksheet.columns.forEach(column => {
            column.width = 20;
         });

         // Add instructions
         worksheet.addRow([]);
         worksheet.addRow(['Instructions:']);
         worksheet.addRow(['1. Fill in user details in the rows above']);
         worksheet.addRow(['2. Email must be unique and valid']);
         worksheet.addRow(['3. Role options: admin, teacher, staff, parent']);
         worksheet.addRow(['4. Phone should be 10 digits']);
         worksheet.addRow(['5. Department is optional']);

         const buffer = await workbook.xlsx.writeBuffer();
         
         logger.info('Bulk import template generated');
         
         return buffer;

      } catch (error) {
         logger.error('Failed to generate bulk import template', { error: error.message });
         throw error;
      }
   }

   /**
    * Advanced user permissions management
    */
   async manageUserPermissions(userId, permissions, tenantDb) {
      try {
         const UserPermission = tenantDb.models.UserPermission;
         const TenantUser = tenantDb.models.TenantUser;

         // Verify user exists
         const user = await TenantUser.findByPk(userId);
         if (!user) {
            throw new Error('User not found');
         }

         // Remove existing permissions
         await UserPermission.destroy({ where: { user_id: userId } });

         // Add new permissions
         const permissionRecords = permissions.map(permission => ({
            user_id: userId,
            module: permission.module,
            action: permission.action,
            granted: permission.granted,
            granted_at: new Date(),
            granted_by: permission.grantedBy
         }));

         const createdPermissions = await UserPermission.bulkCreate(permissionRecords);

         // Update user's permission matrix cache
         await this.updateUserPermissionCache(userId, permissions);

         logger.info('User permissions updated', {
            userId,
            permissionCount: createdPermissions.length
         });

         return {
            success: true,
            permissionsSet: createdPermissions.length,
            permissions: createdPermissions
         };

      } catch (error) {
         logger.error('Failed to manage user permissions', { error: error.message, userId });
         throw error;
      }
   }

   /**
    * Generate user activity report
    */
   async generateUserActivityReport(filters, tenantDb) {
      try {
         const { startDate, endDate, userId, activityType } = filters;

         const UserActivity = tenantDb.models.UserActivity;
         const whereClause = {
            created_at: {
               [tenantDb.Sequelize.Op.between]: [startDate, endDate]
            }
         };

         if (userId) {
            whereClause.user_id = userId;
         }
         if (activityType) {
            whereClause.activity_type = activityType;
         }

         const activities = await UserActivity.findAll({
            where: whereClause,
            include: [
               {
                  model: tenantDb.models.TenantUser,
                  attributes: ['first_name', 'last_name', 'email', 'role']
               }
            ],
            order: [['created_at', 'DESC']]
         });

         // Generate activity analytics
         const analytics = {
            totalActivities: activities.length,
            uniqueUsers: new Set(activities.map(a => a.user_id)).size,
            activityTypeBreakdown: this.calculateActivityTypeBreakdown(activities),
            hourlyActivity: this.calculateHourlyActivity(activities),
            topUsers: this.calculateTopActiveUsers(activities)
         };

         const report = {
            metadata: {
               generatedAt: new Date(),
               reportType: 'User Activity Report',
               filters,
               totalRecords: activities.length
            },
            analytics,
            activities: activities.map(activity => ({
               id: activity.id,
               user: `${activity.TenantUser.first_name} ${activity.TenantUser.last_name}`,
               email: activity.TenantUser.email,
               activityType: activity.activity_type,
               description: activity.description,
               ipAddress: activity.ip_address,
               userAgent: activity.user_agent,
               createdAt: activity.created_at
            }))
         };

         logger.info('User activity report generated', {
            totalActivities: activities.length,
            uniqueUsers: analytics.uniqueUsers
         });

         return report;

      } catch (error) {
         logger.error('Failed to generate user activity report', { error: error.message });
         throw error;
      }
   }

   // Helper methods
   validateHeaders(expected, actual) {
      const missing = expected.filter(header => !actual.includes(header));
      return {
         valid: missing.length === 0,
         message: missing.length > 0 ? `Missing headers: ${missing.join(', ')}` : 'Valid'
      };
   }

   validateUserData(userData) {
      const errors = [];

      if (!userData.first_name || userData.first_name.toString().trim().length < 2) {
         errors.push('First name must be at least 2 characters');
      }
      if (!userData.last_name || userData.last_name.toString().trim().length < 2) {
         errors.push('Last name must be at least 2 characters');
      }
      if (!this.isValidEmail(userData.email)) {
         errors.push('Invalid email format');
      }
      if (!['admin', 'teacher', 'staff', 'parent'].includes(userData.role)) {
         errors.push('Invalid role. Must be: admin, teacher, staff, or parent');
      }
      if (userData.phone && !this.isValidPhone(userData.phone)) {
         errors.push('Invalid phone number format');
      }

      return {
         valid: errors.length === 0,
         errors
      };
   }

   isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
   }

   isValidPhone(phone) {
      const phoneRegex = /^\d{10}$/;
      return phoneRegex.test(phone);
   }

   generateTemporaryPassword() {
      return crypto.randomBytes(4).toString('hex').toUpperCase();
   }

   async updateUserPermissionCache(userId, permissions) {
      const cacheKey = `user_permissions_${userId}`;
      const permissionMap = {};
      
      permissions.forEach(permission => {
         if (!permissionMap[permission.module]) {
            permissionMap[permission.module] = {};
         }
         permissionMap[permission.module][permission.action] = permission.granted;
      });

      this.userCache.set(cacheKey, {
         data: permissionMap,
         timestamp: Date.now()
      });
   }

   calculateActivityTypeBreakdown(activities) {
      const breakdown = {};
      activities.forEach(activity => {
         const type = activity.activity_type;
         breakdown[type] = (breakdown[type] || 0) + 1;
      });
      return breakdown;
   }

   calculateHourlyActivity(activities) {
      const hourly = Array(24).fill(0);
      activities.forEach(activity => {
         const hour = new Date(activity.created_at).getHours();
         hourly[hour]++;
      });
      return hourly;
   }

   calculateTopActiveUsers(activities) {
      const userActivity = {};
      activities.forEach(activity => {
         const userKey = `${activity.TenantUser.first_name} ${activity.TenantUser.last_name}`;
         userActivity[userKey] = (userActivity[userKey] || 0) + 1;
      });

      return Object.entries(userActivity)
         .sort(([, a], [, b]) => b - a)
         .slice(0, 10)
         .map(([user, count]) => ({ user, activityCount: count }));
   }
}

module.exports = AdvancedUserManagementService;
