const { DataTypes } = require('sequelize');

/**
 * UserActivity Model
 * Tracks user activities and system interactions for audit and analytics
 */

module.exports = (sequelize, _tenant) => {
   const UserActivity = sequelize.define(
      'UserActivity',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
         },
         user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'TenantUsers',
               key: 'id',
            },
         },
         activity_type: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: 'Type of activity (login, logout, create, update, delete, view, export)',
         },
         module: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'Module where activity occurred (students, fees, reports, etc.)',
         },
         action: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Specific action performed',
         },
         description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Detailed description of the activity',
         },
         entity_type: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'Type of entity affected (student, fee, report, etc.)',
         },
         entity_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'ID of the affected entity',
         },
         old_values: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Previous values before update (for audit trail)',
         },
         new_values: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'New values after update (for audit trail)',
         },
         ip_address: {
            type: DataTypes.STRING(45),
            allowNull: true,
            comment: 'IP address of the user',
         },
         user_agent: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'User agent string from browser',
         },
         session_id: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Session identifier',
         },
         status: {
            type: DataTypes.ENUM('success', 'failed', 'warning'),
            defaultValue: 'success',
            allowNull: false,
         },
         error_message: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Error message if activity failed',
         },
         duration_ms: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Duration of activity in milliseconds',
         },
         created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
         },
      },
      {
         tableName: 'user_activities',
         timestamps: false,
         indexes: [
            {
               name: 'idx_user_activity_user',
               fields: ['user_id'],
            },
            {
               name: 'idx_user_activity_type',
               fields: ['activity_type'],
            },
            {
               name: 'idx_user_activity_module',
               fields: ['module'],
            },
            {
               name: 'idx_user_activity_date',
               fields: ['created_at'],
            },
            {
               name: 'idx_user_activity_entity',
               fields: ['entity_type', 'entity_id'],
            },
            {
               name: 'idx_user_activity_session',
               fields: ['session_id'],
            },
         ],
      }
   );

   // Instance Methods
   UserActivity.prototype.getFormattedDuration = function() {
      if (!this.duration_ms) return 'N/A';
      
      if (this.duration_ms < 1000) {
         return `${this.duration_ms}ms`;
      } else if (this.duration_ms < 60000) {
         return `${(this.duration_ms / 1000).toFixed(2)}s`;
      } else {
         return `${(this.duration_ms / 60000).toFixed(2)}m`;
      }
   };

   UserActivity.prototype.isSuccessful = function() {
      return this.status === 'success';
   };

   UserActivity.prototype.hasSensitiveData = function() {
      const sensitiveModules = ['users', 'system', 'permissions'];
      return sensitiveModules.includes(this.module);
   };

   // Class Methods
   UserActivity.logActivity = async function(activityData) {
      try {
         const activity = await this.create({
            user_id: activityData.userId,
            activity_type: activityData.type,
            module: activityData.module,
            action: activityData.action,
            description: activityData.description,
            entity_type: activityData.entityType,
            entity_id: activityData.entityId,
            old_values: activityData.oldValues,
            new_values: activityData.newValues,
            ip_address: activityData.ipAddress,
            user_agent: activityData.userAgent,
            session_id: activityData.sessionId,
            status: activityData.status || 'success',
            error_message: activityData.errorMessage,
            duration_ms: activityData.duration,
         });

         return activity;
      } catch (error) {
         console.error('Failed to log user activity:', error);
         // Don't throw error to avoid breaking main functionality
         return null;
      }
   };

   UserActivity.getUserActivitySummary = async function(userId, days = 30) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const activities = await this.findAll({
         where: {
            user_id: userId,
            created_at: {
               [sequelize.Sequelize.Op.between]: [startDate, endDate],
            },
         },
         attributes: [
            'activity_type',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
            [sequelize.fn('MAX', sequelize.col('created_at')), 'last_activity'],
         ],
         group: ['activity_type'],
         order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      });

      return activities;
   };

   UserActivity.getSystemActivityStats = async function(days = 7) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await this.findAll({
         where: {
            created_at: {
               [sequelize.Sequelize.Op.between]: [startDate, endDate],
            },
         },
         attributes: [
            [sequelize.fn('COUNT', sequelize.col('id')), 'total_activities'],
            [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('user_id'))), 'active_users'],
            [sequelize.fn('AVG', sequelize.col('duration_ms')), 'avg_duration'],
            [
               sequelize.fn('COUNT', 
                  sequelize.literal("CASE WHEN status = 'failed' THEN 1 END")
               ), 
               'failed_activities'
            ],
         ],
      });

      return stats[0] || {};
   };

   UserActivity.cleanupOldActivities = async function(retentionDays = 90) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const deleted = await this.destroy({
         where: {
            created_at: {
               [sequelize.Sequelize.Op.lt]: cutoffDate,
            },
         },
      });

      return deleted;
   };

   UserActivity.getAuditTrail = async function(entityType, entityId, limit = 50) {
      return await this.findAll({
         where: {
            entity_type: entityType,
            entity_id: entityId,
         },
         include: [
            {
               model: sequelize.models.TenantUser,
               attributes: ['first_name', 'last_name', 'email'],
            },
         ],
         order: [['created_at', 'DESC']],
         limit: limit,
      });
   };

   // Hooks
   UserActivity.addHook('beforeCreate', (activity, _options) => {
      // Sanitize sensitive data
      if (activity.hasSensitiveData()) {
         if (activity.old_values) {
            activity.old_values = this.sanitizeSensitiveData(activity.old_values);
         }
         if (activity.new_values) {
            activity.new_values = this.sanitizeSensitiveData(activity.new_values);
         }
      }
   });

   // Static helper method
   UserActivity.sanitizeSensitiveData = function(data) {
      if (typeof data !== 'object' || data === null) return data;
      
      const sanitized = { ...data };
      const sensitiveFields = ['password', 'password_hash', 'token', 'secret'];
      
      sensitiveFields.forEach(field => {
         if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
         }
      });
      
      return sanitized;
   };

   return UserActivity;
};
