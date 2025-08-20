const { DataTypes } = require('sequelize');

/**
 * UDISE Integration Log Model
 * Tracks all interactions with external UDISE+ systems
 * Maintains audit trail for API calls, data synchronization, and system integration
 */
module.exports = (sequelize) => {
   const UdiseIntegrationLog = sequelize.define(
      'UdiseIntegrationLog',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: 'Primary key for integration log',
         },

         // Reference Information
         school_id: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: 'Reference to school in school management system',
         },
         udise_registration_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Reference to UDISE registration (if applicable)',
         },

         // Integration Details
         integration_type: {
            type: DataTypes.ENUM(
               'registration_submit',
               'census_data_sync',
               'compliance_report',
               'status_check',
               'document_upload',
               'verification_request',
               'data_validation',
               'system_health_check',
               'bulk_update',
               'report_generation'
            ),
            allowNull: false,
            comment: 'Type of integration operation',
         },
         operation_name: {
            type: DataTypes.STRING(200),
            allowNull: false,
            comment: 'Descriptive name of the operation performed',
         },

         // API/System Details
         external_system: {
            type: DataTypes.ENUM(
               'udise_plus_portal',
               'state_education_dept',
               'central_govt_api',
               'verification_service'
            ),
            allowNull: false,
            comment: 'External system being integrated with',
         },
         api_endpoint: {
            type: DataTypes.STRING(500),
            allowNull: true,
            comment: 'API endpoint or service URL used',
         },
         http_method: {
            type: DataTypes.ENUM('GET', 'POST', 'PUT', 'PATCH', 'DELETE'),
            allowNull: true,
            comment: 'HTTP method used for API call',
         },

         // Request Information
         request_payload: {
            type: DataTypes.TEXT('long'),
            allowNull: true,
            comment: 'JSON payload sent in request (sensitive data masked)',
         },
         request_headers: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'HTTP headers sent (authentication tokens masked)',
         },
         request_timestamp: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: 'Timestamp when request was initiated',
         },

         // Response Information
         response_status_code: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'HTTP status code received',
         },
         response_payload: {
            type: DataTypes.TEXT('long'),
            allowNull: true,
            comment: 'JSON response received (sensitive data masked)',
         },
         response_headers: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'HTTP response headers received',
         },
         response_timestamp: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Timestamp when response was received',
         },

         // Processing Results
         operation_status: {
            type: DataTypes.ENUM('success', 'failure', 'partial_success', 'timeout', 'cancelled'),
            allowNull: false,
            comment: 'Overall status of the integration operation',
         },
         processing_time_ms: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Time taken to process the operation (in milliseconds)',
         },

         // Error Information
         error_code: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'Error code if operation failed',
         },
         error_message: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Detailed error message',
         },
         error_stack: {
            type: DataTypes.TEXT('long'),
            allowNull: true,
            comment: 'Error stack trace (for debugging)',
         },

         // Data Synchronization
         records_sent: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Number of records sent in the operation',
         },
         records_processed: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Number of records successfully processed',
         },
         records_failed: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Number of records that failed processing',
         },

         // Business Context
         academic_year: {
            type: DataTypes.STRING(7),
            allowNull: true,
            comment: 'Academic year context (if applicable)',
         },
         data_type: {
            type: DataTypes.ENUM(
               'school_registration',
               'census_data',
               'compliance_record',
               'teacher_data',
               'student_enrollment',
               'infrastructure_data',
               'financial_data',
               'examination_results'
            ),
            allowNull: true,
            comment: 'Type of data being synchronized',
         },
         batch_id: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Batch ID for bulk operations',
         },
         correlation_id: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Correlation ID to track related operations',
         },

         // Retry Information
         retry_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Number of retry attempts made',
         },
         max_retries: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 3,
            comment: 'Maximum number of retries configured',
         },
         next_retry_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Scheduled time for next retry (if applicable)',
         },

         // Authentication & Security
         auth_method: {
            type: DataTypes.ENUM('api_key', 'oauth', 'basic_auth', 'certificate', 'none'),
            allowNull: true,
            comment: 'Authentication method used',
         },
         user_agent: {
            type: DataTypes.STRING(200),
            allowNull: true,
            comment: 'User agent string used in request',
         },
         client_ip: {
            type: DataTypes.STRING(45),
            allowNull: true,
            comment: 'Client IP address from where operation was initiated',
         },

         // Validation & Compliance
         data_validation_status: {
            type: DataTypes.ENUM('passed', 'failed', 'warning', 'skipped'),
            allowNull: true,
            comment: 'Status of data validation before sync',
         },
         validation_errors: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Data validation errors (JSON array)',
         },
         compliance_check_passed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether compliance checks passed',
         },

         // Performance Metrics
         bandwidth_used_bytes: {
            type: DataTypes.BIGINT,
            allowNull: true,
            comment: 'Approximate bandwidth used for the operation',
         },
         cache_hit: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether response was served from cache',
         },

         // Notification & Alerts
         alert_triggered: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether any alerts were triggered',
         },
         notification_sent: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether notifications were sent to stakeholders',
         },

         // Additional Context
         initiated_by: {
            type: DataTypes.ENUM('user', 'system', 'scheduler', 'webhook', 'api'),
            allowNull: false,
            comment: 'How the operation was initiated',
         },
         user_id: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'User ID who initiated the operation (if applicable)',
         },
         session_id: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Session ID associated with the operation',
         },

         // Environment & Configuration
         environment: {
            type: DataTypes.ENUM('production', 'staging', 'development', 'testing'),
            allowNull: false,
            comment: 'Environment where operation was executed',
         },
         api_version: {
            type: DataTypes.STRING(20),
            allowNull: true,
            comment: 'Version of external API used',
         },

         // Follow-up Actions
         requires_follow_up: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether manual follow-up is required',
         },
         follow_up_notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Notes for follow-up actions',
         },
         resolved_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Timestamp when issue was resolved (if applicable)',
         },

         // Metadata
         created_by: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: 'User/system that created this log entry',
         },
      },
      {
         tableName: 'udise_integration_logs',
         timestamps: true,
         underscored: true,
         indexes: [
            {
               fields: ['school_id'],
            },
         ],
         comment: 'Comprehensive logging for all UDISE+ system integrations and API interactions',
      }
   );

   // Model associations will be defined in index.js
   UdiseIntegrationLog.associate = function (models) {
      // Association with UDISE School Registration
      UdiseIntegrationLog.belongsTo(models.UdiseSchoolRegistration, {
         foreignKey: 'udise_registration_id',
         as: 'udise_registration',
      });
   };

   return UdiseIntegrationLog;
};
