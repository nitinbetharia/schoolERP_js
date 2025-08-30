const { logSystem, logError } = require('../utils/logger');

/**
 * User Profile Management Service
 * Handles user profile operations, preferences, and settings
 */
class UserProfileService {
   constructor(systemDB) {
      this.systemDB = systemDB;
   }

   /**
    * Get user profile with preferences
    * @param {number} userId - User ID
    * @returns {Promise<Object>} - User profile data
    */
   async getUserProfile(userId) {
      try {
         // Get user basic information
         const [users] = await this.systemDB.execute(
            `
            SELECT 
               id, email, full_name, role, status, phone_number,
               date_of_birth, gender, created_at, updated_at, last_login,
               profile_picture, is_email_verified, timezone, language,
               notification_preferences
            FROM system_users 
            WHERE id = ?
         `,
            [userId]
         );

         if (users.length === 0) {
            return null;
         }

         const user = users[0];

         // Parse notification preferences
         try {
            user.notification_preferences = user.notification_preferences
               ? JSON.parse(user.notification_preferences)
               : this.getDefaultNotificationPreferences();
         } catch {
            user.notification_preferences = this.getDefaultNotificationPreferences();
         }

         // Get user sessions (last 5 logins)
         const [sessions] = await this.systemDB.execute(
            `
            SELECT 
               login_time, ip_address, user_agent, location
            FROM user_sessions 
            WHERE user_id = ? 
            ORDER BY login_time DESC 
            LIMIT 5
         `,
            [userId]
         );

         user.recent_sessions = sessions;

         // Get user activity statistics
         const [activityStats] = await this.systemDB.execute(
            `
            SELECT 
               COUNT(*) as total_logins,
               MAX(last_login) as last_activity,
               MIN(created_at) as member_since
            FROM system_users 
            WHERE id = ?
         `,
            [userId]
         );

         user.activity_stats = activityStats[0];

         return user;
      } catch (error) {
         logError(error, { context: 'getUserProfile', userId });
         throw error;
      }
   }

   /**
    * Update user profile information
    * @param {number} userId - User ID
    * @param {Object} profileData - Profile data to update
    * @param {number} updatedBy - ID of user making the update
    * @returns {Promise<Object>} - Updated user profile
    */
   async updateUserProfile(userId, profileData, updatedBy) {
      try {
         const {
            fullName,
            phoneNumber,
            dateOfBirth,
            gender,
            timezone,
            language,
            profilePicture,
            notificationPreferences,
         } = profileData;

         // Build update query
         const updateFields = [];
         const updateParams = [];

         if (fullName !== undefined) {
            updateFields.push('full_name = ?');
            updateParams.push(fullName);
         }

         if (phoneNumber !== undefined) {
            updateFields.push('phone_number = ?');
            updateParams.push(phoneNumber);
         }

         if (dateOfBirth !== undefined) {
            updateFields.push('date_of_birth = ?');
            updateParams.push(dateOfBirth);
         }

         if (gender !== undefined) {
            updateFields.push('gender = ?');
            updateParams.push(gender);
         }

         if (timezone !== undefined) {
            updateFields.push('timezone = ?');
            updateParams.push(timezone);
         }

         if (language !== undefined) {
            updateFields.push('language = ?');
            updateParams.push(language);
         }

         if (profilePicture !== undefined) {
            updateFields.push('profile_picture = ?');
            updateParams.push(profilePicture);
         }

         if (notificationPreferences !== undefined) {
            updateFields.push('notification_preferences = ?');
            updateParams.push(JSON.stringify(notificationPreferences));
         }

         if (updateFields.length === 0) {
            throw new Error('No fields to update');
         }

         updateFields.push('updated_at = NOW()');
         updateParams.push(userId);

         const updateQuery = `
            UPDATE system_users 
            SET ${updateFields.join(', ')}
            WHERE id = ?
         `;

         await this.systemDB.execute(updateQuery, updateParams);

         logSystem('User profile updated', {
            userId,
            updatedBy,
            fields: Object.keys(profileData),
         });

         // Return updated profile
         return await this.getUserProfile(userId);
      } catch (error) {
         logError(error, { context: 'updateUserProfile', userId, updatedBy });
         throw error;
      }
   }

   /**
    * Change user password
    * @param {number} userId - User ID
    * @param {string} currentPassword - Current password
    * @param {string} newPassword - New password
    * @returns {Promise<boolean>} - Success status
    */
   async changePassword(userId, currentPassword, newPassword) {
      try {
         const bcrypt = require('bcryptjs');

         // Get current password hash
         const [users] = await this.systemDB.execute('SELECT password FROM system_users WHERE id = ?', [userId]);

         if (users.length === 0) {
            throw new Error('User not found');
         }

         // Verify current password
         const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[0].password);
         if (!isCurrentPasswordValid) {
            throw new Error('Current password is incorrect');
         }

         // Hash new password
         const hashedNewPassword = await bcrypt.hash(newPassword, 10);

         // Update password
         await this.systemDB.execute('UPDATE system_users SET password = ?, updated_at = NOW() WHERE id = ?', [
            hashedNewPassword,
            userId,
         ]);

         logSystem('User password changed', { userId });

         return true;
      } catch (error) {
         logError(error, { context: 'changePassword', userId });
         throw error;
      }
   }

   /**
    * Upload and update profile picture
    * @param {number} userId - User ID
    * @param {Object} file - Uploaded file object
    * @returns {Promise<string>} - Profile picture URL
    */
   async updateProfilePicture(userId, file) {
      try {
         const path = require('path');
         const fs = require('fs').promises;
         const crypto = require('crypto');

         // Validate file type
         const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
         if (!allowedTypes.includes(file.mimetype)) {
            throw new Error('Invalid file type. Only JPEG, PNG, and GIF images are allowed.');
         }

         // Validate file size (5MB max)
         if (file.size > 5 * 1024 * 1024) {
            throw new Error('File too large. Maximum size is 5MB.');
         }

         // Generate unique filename
         const fileExtension = path.extname(file.originalname);
         const fileName = `profile_${userId}_${crypto.randomUUID()}${fileExtension}`;
         const uploadDir = path.join(__dirname, '../public/uploads/profiles');
         const filePath = path.join(uploadDir, fileName);

         // Ensure upload directory exists
         await fs.mkdir(uploadDir, { recursive: true });

         // Save file
         await fs.writeFile(filePath, file.buffer);

         // Update user profile picture path
         const profilePictureUrl = `/uploads/profiles/${fileName}`;
         await this.systemDB.execute('UPDATE system_users SET profile_picture = ?, updated_at = NOW() WHERE id = ?', [
            profilePictureUrl,
            userId,
         ]);

         logSystem('Profile picture updated', { userId, fileName });

         return profilePictureUrl;
      } catch (error) {
         logError(error, { context: 'updateProfilePicture', userId });
         throw error;
      }
   }

   /**
    * Get user notification preferences
    * @param {number} userId - User ID
    * @returns {Promise<Object>} - Notification preferences
    */
   async getNotificationPreferences(userId) {
      try {
         const [users] = await this.systemDB.execute('SELECT notification_preferences FROM system_users WHERE id = ?', [
            userId,
         ]);

         if (users.length === 0) {
            return this.getDefaultNotificationPreferences();
         }

         try {
            return users[0].notification_preferences
               ? JSON.parse(users[0].notification_preferences)
               : this.getDefaultNotificationPreferences();
         } catch {
            return this.getDefaultNotificationPreferences();
         }
      } catch (error) {
         logError(error, { context: 'getNotificationPreferences', userId });
         throw error;
      }
   }

   /**
    * Update user notification preferences
    * @param {number} userId - User ID
    * @param {Object} preferences - Notification preferences
    * @returns {Promise<Object>} - Updated preferences
    */
   async updateNotificationPreferences(userId, preferences) {
      try {
         const validatedPreferences = this.validateNotificationPreferences(preferences);

         await this.systemDB.execute(
            'UPDATE system_users SET notification_preferences = ?, updated_at = NOW() WHERE id = ?',
            [JSON.stringify(validatedPreferences), userId]
         );

         logSystem('Notification preferences updated', { userId });

         return validatedPreferences;
      } catch (error) {
         logError(error, { context: 'updateNotificationPreferences', userId });
         throw error;
      }
   }

   /**
    * Record user login session
    * @param {number} userId - User ID
    * @param {Object} sessionData - Session data
    * @returns {Promise<void>}
    */
   async recordLoginSession(userId, sessionData) {
      try {
         const { ipAddress, userAgent, location } = sessionData;

         // Create user_sessions table if it doesn't exist
         await this.systemDB.execute(`
            CREATE TABLE IF NOT EXISTS user_sessions (
               id INT AUTO_INCREMENT PRIMARY KEY,
               user_id INT NOT NULL,
               login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
               ip_address VARCHAR(45),
               user_agent TEXT,
               location VARCHAR(255),
               INDEX idx_user_sessions_user_id (user_id),
               INDEX idx_user_sessions_login_time (login_time)
            ) ENGINE=InnoDB
         `);

         // Insert session record
         await this.systemDB.execute(
            `
            INSERT INTO user_sessions (user_id, ip_address, user_agent, location)
            VALUES (?, ?, ?, ?)
         `,
            [userId, ipAddress, userAgent, location]
         );

         // Update user's last login time
         await this.systemDB.execute('UPDATE system_users SET last_login = NOW() WHERE id = ?', [userId]);

         // Clean up old sessions (keep only last 50 per user)
         await this.systemDB.execute(
            `
            DELETE FROM user_sessions 
            WHERE user_id = ? AND id NOT IN (
               SELECT id FROM (
                  SELECT id FROM user_sessions 
                  WHERE user_id = ? 
                  ORDER BY login_time DESC 
                  LIMIT 50
               ) AS recent_sessions
            )
         `,
            [userId, userId]
         );
      } catch (error) {
         logError(error, { context: 'recordLoginSession', userId });
      }
   }

   /**
    * Get default notification preferences
    * @returns {Object} - Default preferences
    */
   getDefaultNotificationPreferences() {
      return {
         email: {
            newUser: true,
            passwordReset: true,
            accountUpdates: true,
            systemNotifications: true,
            weeklyDigest: false,
         },
         browser: {
            newUser: true,
            accountUpdates: true,
            systemNotifications: false,
         },
         frequency: {
            immediate: true,
            daily: false,
            weekly: false,
         },
      };
   }

   /**
    * Validate notification preferences
    * @param {Object} preferences - Preferences to validate
    * @returns {Object} - Validated preferences
    */
   validateNotificationPreferences(preferences) {
      const defaults = this.getDefaultNotificationPreferences();

      // Merge with defaults and ensure all required keys exist
      return {
         email: {
            newUser: Boolean(preferences.email?.newUser ?? defaults.email.newUser),
            passwordReset: Boolean(preferences.email?.passwordReset ?? defaults.email.passwordReset),
            accountUpdates: Boolean(preferences.email?.accountUpdates ?? defaults.email.accountUpdates),
            systemNotifications: Boolean(preferences.email?.systemNotifications ?? defaults.email.systemNotifications),
            weeklyDigest: Boolean(preferences.email?.weeklyDigest ?? defaults.email.weeklyDigest),
         },
         browser: {
            newUser: Boolean(preferences.browser?.newUser ?? defaults.browser.newUser),
            accountUpdates: Boolean(preferences.browser?.accountUpdates ?? defaults.browser.accountUpdates),
            systemNotifications: Boolean(
               preferences.browser?.systemNotifications ?? defaults.browser.systemNotifications
            ),
         },
         frequency: {
            immediate: Boolean(preferences.frequency?.immediate ?? defaults.frequency.immediate),
            daily: Boolean(preferences.frequency?.daily ?? defaults.frequency.daily),
            weekly: Boolean(preferences.frequency?.weekly ?? defaults.frequency.weekly),
         },
      };
   }
}

module.exports = UserProfileService;
