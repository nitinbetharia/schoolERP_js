const { Sequelize, DataTypes } = require('sequelize');
const { logger } = require('../utils/logger');
const config = require('../config/database');

/**
 * Database Version Manager
 * Handles versioning and migration of multi-tenant databases
 */
class DatabaseVersionManager {
   constructor() {
      this.systemDb = null;
      this.currentSystemVersion = '2.0.0';
      this.currentTenantVersion = '2.0.0';
   }

   /**
    * Initialize the version manager
    */
   async initialize() {
      try {
         // Connect to system database
         this.systemDb = new Sequelize({
            ...config.system,
            logging: false
         });

         await this.systemDb.authenticate();
         logger.info('Database Version Manager initialized');

         // Ensure version tracking tables exist
         await this.ensureVersionTables();

      } catch (error) {
         logger.error('Failed to initialize Database Version Manager:', error);
         throw error;
      }
   }

   /**
    * Ensure version tracking tables exist
    */
   async ensureVersionTables() {
      try {
         // Create database_schema_versions table
         await this.systemDb.query(`
            CREATE TABLE IF NOT EXISTS database_schema_versions (
               id INT PRIMARY KEY AUTO_INCREMENT,
               database_type ENUM('system', 'tenant') NOT NULL,
               database_identifier VARCHAR(100) NULL COMMENT 'NULL for system, trust_code for tenant',
               current_version VARCHAR(20) NOT NULL,
               target_version VARCHAR(20) NULL,
               migration_status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
               migration_started_at TIMESTAMP NULL,
               migration_completed_at TIMESTAMP NULL,
               migration_error TEXT NULL,
               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
               updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
               
               UNIQUE KEY unique_db_version (database_type, database_identifier)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
         `);

         // Create migration history table
         await this.systemDb.query(`
            CREATE TABLE IF NOT EXISTS database_migration_history (
               id INT PRIMARY KEY AUTO_INCREMENT,
               database_type ENUM('system', 'tenant') NOT NULL,
               database_identifier VARCHAR(100) NULL,
               migration_name VARCHAR(200) NOT NULL,
               migration_version VARCHAR(20) NOT NULL,
               migration_type ENUM('schema', 'data', 'feature') NOT NULL,
               executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
               execution_time_ms INT NULL,
               status ENUM('success', 'failed', 'rolled_back') NOT NULL,
               error_message TEXT NULL,
               checksum VARCHAR(64) NULL COMMENT 'For integrity verification',
               
               INDEX idx_db_migration (database_type, database_identifier),
               INDEX idx_migration_version (migration_version)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
         `);

         logger.info('Version tracking tables ensured');

      } catch (error) {
         logger.error('Failed to ensure version tables:', error);
         throw error;
      }
   }

   /**
    * Get current version of a database
    */
   async getCurrentVersion(databaseType, databaseIdentifier = null) {
      try {
         const [results] = await this.systemDb.query(`
            SELECT current_version 
            FROM database_schema_versions 
            WHERE database_type = :type 
            AND (database_identifier = :identifier OR (database_identifier IS NULL AND :identifier IS NULL))
         `, {
            replacements: { 
               type: databaseType, 
               identifier: databaseIdentifier 
            }
         });

         if (results.length === 0) {
            // No version record found, assume initial version
            return databaseType === 'system' ? '1.0.0' : '1.0.0';
         }

         return results[0].current_version;

      } catch (error) {
         logger.error('Failed to get current version:', error);
         throw error;
      }
   }

   /**
    * Set version for a database
    */
   async setVersion(databaseType, version, databaseIdentifier = null) {
      try {
         await this.systemDb.query(`
            INSERT INTO database_schema_versions 
            (database_type, database_identifier, current_version, migration_status, migration_completed_at) 
            VALUES (:type, :identifier, :version, 'completed', NOW())
            ON DUPLICATE KEY UPDATE 
            current_version = :version,
            migration_status = 'completed',
            migration_completed_at = NOW(),
            updated_at = NOW()
         `, {
            replacements: { 
               type: databaseType, 
               identifier: databaseIdentifier, 
               version: version 
            }
         });

         logger.info(`Set version ${version} for ${databaseType} database ${databaseIdentifier || 'system'}`);

      } catch (error) {
         logger.error('Failed to set version:', error);
         throw error;
      }
   }

   /**
    * Record migration in history
    */
   async recordMigration(databaseType, databaseIdentifier, migrationName, version, 
                        type, status, executionTime = null, errorMessage = null) {
      try {
         await this.systemDb.query(`
            INSERT INTO database_migration_history 
            (database_type, database_identifier, migration_name, migration_version, 
             migration_type, status, execution_time_ms, error_message) 
            VALUES (:dbType, :dbIdentifier, :name, :version, :type, :status, :time, :error)
         `, {
            replacements: {
               dbType: databaseType,
               dbIdentifier: databaseIdentifier,
               name: migrationName,
               version: version,
               type: type,
               status: status,
               time: executionTime,
               error: errorMessage
            }
         });

         logger.info(`Recorded migration: ${migrationName} for ${databaseType} ${databaseIdentifier || 'system'}`);

      } catch (error) {
         logger.error('Failed to record migration:', error);
         throw error;
      }
   }

   /**
    * Check if a migration has been applied
    */
   async isMigrationApplied(databaseType, databaseIdentifier, migrationName) {
      try {
         const [results] = await this.systemDb.query(`
            SELECT id FROM database_migration_history 
            WHERE database_type = :type 
            AND (database_identifier = :identifier OR (database_identifier IS NULL AND :identifier IS NULL))
            AND migration_name = :name 
            AND status = 'success'
         `, {
            replacements: { 
               type: databaseType, 
               identifier: databaseIdentifier,
               name: migrationName
            }
         });

         return results.length > 0;

      } catch (error) {
         logger.error('Failed to check migration status:', error);
         throw error;
      }
   }

   /**
    * Get all tenants that need migration
    */
   async getTenantsNeedingMigration(targetVersion) {
      try {
         const [results] = await this.systemDb.query(`
            SELECT t.id, t.trust_name, t.code, t.database_name,
                   COALESCE(dsv.current_version, '1.0.0') as current_version
            FROM trusts t
            LEFT JOIN database_schema_versions dsv ON dsv.database_type = 'tenant' 
                  AND dsv.database_identifier = t.code
            WHERE t.is_active = 1 
            AND COALESCE(dsv.current_version, '1.0.0') != :targetVersion
         `, {
            replacements: { targetVersion }
         });

         return results;

      } catch (error) {
         logger.error('Failed to get tenants needing migration:', error);
         throw error;
      }
   }

   /**
    * Get migration status for all databases
    */
   async getMigrationStatus() {
      try {
         // Get system database status
         const systemVersion = await this.getCurrentVersion('system');
         
         // Get tenant database statuses
         const [tenantResults] = await this.systemDb.query(`
            SELECT t.trust_name, t.code, t.database_name,
                   COALESCE(dsv.current_version, '1.0.0') as current_version,
                   dsv.migration_status,
                   dsv.target_version
            FROM trusts t
            LEFT JOIN database_schema_versions dsv ON dsv.database_type = 'tenant' 
                  AND dsv.database_identifier = t.code
            WHERE t.is_active = 1
            ORDER BY t.trust_name
         `);

         return {
            system: {
               current_version: systemVersion,
               target_version: this.currentSystemVersion,
               needs_migration: systemVersion !== this.currentSystemVersion
            },
            tenants: tenantResults.map(tenant => ({
               name: tenant.trust_name,
               code: tenant.code,
               database_name: tenant.database_name,
               current_version: tenant.current_version,
               target_version: this.currentTenantVersion,
               needs_migration: tenant.current_version !== this.currentTenantVersion,
               migration_status: tenant.migration_status || 'pending'
            }))
         };

      } catch (error) {
         logger.error('Failed to get migration status:', error);
         throw error;
      }
   }

   /**
    * Plan migration path
    */
   calculateMigrationPath(currentVersion, targetVersion) {
      const versionOrder = [
         '1.0.0',
         '1.1.0', 
         '2.0.0',
         '2.1.0'
      ];

      const currentIndex = versionOrder.indexOf(currentVersion);
      const targetIndex = versionOrder.indexOf(targetVersion);

      if (currentIndex === -1 || targetIndex === -1) {
         throw new Error(`Invalid version: ${currentVersion} -> ${targetVersion}`);
      }

      if (currentIndex >= targetIndex) {
         return []; // No migration needed or downgrade (not supported)
      }

      return versionOrder.slice(currentIndex + 1, targetIndex + 1);
   }

   /**
    * Check if tenant can be migrated
    */
   async canMigrateTenant(tenantCode, targetVersion) {
      try {
         // Check if tenant database exists
         const [results] = await this.systemDb.query(`
            SELECT database_name FROM trusts WHERE code = :code AND is_active = 1
         `, {
            replacements: { code: tenantCode }
         });

         if (results.length === 0) {
            return { canMigrate: false, reason: 'Tenant not found or inactive' };
         }

         const tenantDb = results[0].database_name;

         // Try to connect to tenant database
         const tenantSequelize = new Sequelize({
            ...config.tenant,
            database: tenantDb,
            logging: false
         });

         try {
            await tenantSequelize.authenticate();
            await tenantSequelize.close();
            return { canMigrate: true };
         } catch (error) {
            return { 
               canMigrate: false, 
               reason: `Cannot connect to tenant database: ${error.message}` 
            };
         }

      } catch (error) {
         logger.error('Failed to check if tenant can be migrated:', error);
         return { canMigrate: false, reason: error.message };
      }
   }

   /**
    * Start migration transaction
    */
   async startMigration(databaseType, databaseIdentifier, targetVersion) {
      try {
         await this.systemDb.query(`
            INSERT INTO database_schema_versions 
            (database_type, database_identifier, current_version, target_version, 
             migration_status, migration_started_at) 
            VALUES (:type, :identifier, 
                   (SELECT COALESCE(current_version, '1.0.0') 
                    FROM database_schema_versions dsv2 
                    WHERE dsv2.database_type = :type 
                    AND dsv2.database_identifier = :identifier), 
                   :targetVersion, 'running', NOW())
            ON DUPLICATE KEY UPDATE 
            target_version = :targetVersion,
            migration_status = 'running',
            migration_started_at = NOW(),
            updated_at = NOW()
         `, {
            replacements: { 
               type: databaseType, 
               identifier: databaseIdentifier,
               targetVersion: targetVersion
            }
         });

         logger.info(`Started migration for ${databaseType} ${databaseIdentifier || 'system'} to ${targetVersion}`);

      } catch (error) {
         logger.error('Failed to start migration:', error);
         throw error;
      }
   }

   /**
    * Complete migration
    */
   async completeMigration(databaseType, databaseIdentifier, version) {
      try {
         await this.systemDb.query(`
            UPDATE database_schema_versions 
            SET current_version = :version,
                migration_status = 'completed',
                migration_completed_at = NOW(),
                updated_at = NOW()
            WHERE database_type = :type 
            AND (database_identifier = :identifier OR (database_identifier IS NULL AND :identifier IS NULL))
         `, {
            replacements: { 
               type: databaseType, 
               identifier: databaseIdentifier,
               version: version
            }
         });

         logger.info(`Completed migration for ${databaseType} ${databaseIdentifier || 'system'} to ${version}`);

      } catch (error) {
         logger.error('Failed to complete migration:', error);
         throw error;
      }
   }

   /**
    * Mark migration as failed
    */
   async failMigration(databaseType, databaseIdentifier, errorMessage) {
      try {
         await this.systemDb.query(`
            UPDATE database_schema_versions 
            SET migration_status = 'failed',
                migration_error = :error,
                updated_at = NOW()
            WHERE database_type = :type 
            AND (database_identifier = :identifier OR (database_identifier IS NULL AND :identifier IS NULL))
         `, {
            replacements: { 
               type: databaseType, 
               identifier: databaseIdentifier,
               error: errorMessage
            }
         });

         logger.error(`Failed migration for ${databaseType} ${databaseIdentifier || 'system'}: ${errorMessage}`);

      } catch (error) {
         logger.error('Failed to mark migration as failed:', error);
         throw error;
      }
   }

   /**
    * Close connections
    */
   async close() {
      if (this.systemDb) {
         await this.systemDb.close();
         logger.info('Database Version Manager connections closed');
      }
   }
}

module.exports = DatabaseVersionManager;
