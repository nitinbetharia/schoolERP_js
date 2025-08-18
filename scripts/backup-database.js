#!/usr/bin/env node

/**
 * Database Backup Script
 * Comprehensive backup system for School ERP multi-tenant architecture
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const archiver = require('archiver');
const crypto = require('crypto');

// Load configuration
require('dotenv').config();

class DatabaseBackup {
  constructor() {
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      masterDatabase: process.env.DB_MASTER_NAME || 'school_erp_master'
    };

    this.backupDir = path.join(__dirname, '..', 'backups');
    this.timestamp =
      new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] +
      '_' +
      new Date().toTimeString().split(' ')[0].replace(/:/g, '-');

    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Get all trust databases from master database
   */
  async getTrustDatabases() {
    const connection = await mysql.createConnection({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      database: this.config.masterDatabase
    });

    try {
      const [rows] = await connection.execute(
        'SELECT id, trust_code, database_name FROM trusts WHERE status = ?',
        ['ACTIVE']
      );
      return rows;
    } finally {
      await connection.end();
    }
  }

  /**
   * Create backup using mysqldump
   */
  async createMySQLDump(database, outputFile, options = {}) {
    const dumpOptions = [
      '--single-transaction',
      '--routines',
      '--triggers',
      '--events',
      '--set-gtid-purged=OFF',
      '--default-character-set=utf8mb4',
      '--no-tablespaces'
    ];

    if (options.schemaOnly) {
      dumpOptions.push('--no-data');
    }

    if (options.dataOnly) {
      dumpOptions.push('--no-create-info');
    }

    const command = [
      'mysqldump',
      `-h${this.config.host}`,
      `-P${this.config.port}`,
      `-u${this.config.user}`,
      this.config.password ? `-p${this.config.password}` : '',
      ...dumpOptions,
      database
    ]
      .filter(Boolean)
      .join(' ');

    console.log(`Creating backup for database: ${database}`);

    try {
      const { stdout } = await execAsync(`${command} > "${outputFile}"`);
      return true;
    } catch (error) {
      console.error(`Error backing up ${database}:`, error.message);
      return false;
    }
  }

  /**
   * Calculate file checksum
   */
  calculateChecksum(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Compress backup files
   */
  async compressBackup(sourceDir, outputFile) {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputFile);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        console.log(`Backup compressed: ${archive.pointer()} total bytes`);
        resolve(true);
      });

      archive.on('error', reject);
      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }

  /**
   * Log backup to master database
   */
  async logBackup(backupInfo) {
    const connection = await mysql.createConnection({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      database: this.config.masterDatabase
    });

    try {
      // Check if backup_history table exists in master database
      const [tables] = await connection.execute("SHOW TABLES LIKE 'backup_history'");

      if (tables.length === 0) {
        console.log('Backup history table not found. Creating minimal backup log...');
        await connection.execute(`
                    CREATE TABLE IF NOT EXISTS backup_history (
                        id bigint(20) NOT NULL AUTO_INCREMENT,
                        backup_file_name varchar(255) NOT NULL,
                        backup_file_path varchar(500) NOT NULL,
                        backup_size bigint(20) DEFAULT NULL,
                        backup_type enum('FULL', 'INCREMENTAL', 'SCHEMA_ONLY', 'DATA_ONLY') NOT NULL,
                        status enum('IN_PROGRESS', 'COMPLETED', 'FAILED') NOT NULL,
                        started_at timestamp NOT NULL,
                        completed_at timestamp NULL DEFAULT NULL,
                        error_message text DEFAULT NULL,
                        tables_included json DEFAULT NULL,
                        records_count bigint(20) DEFAULT NULL,
                        checksum varchar(255) DEFAULT NULL,
                        created_at timestamp NOT NULL DEFAULT current_timestamp(),
                        PRIMARY KEY (id),
                        KEY idx_backup_history_status (status),
                        KEY idx_backup_history_completed (completed_at)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                `);
      }

      await connection.execute(
        `
                INSERT INTO backup_history 
                (backup_file_name, backup_file_path, backup_size, backup_type, status, started_at, completed_at, checksum)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
        [
          backupInfo.fileName,
          backupInfo.filePath,
          backupInfo.fileSize,
          backupInfo.backupType,
          backupInfo.status,
          backupInfo.startedAt,
          backupInfo.completedAt,
          backupInfo.checksum
        ]
      );

      console.log('Backup logged to database');
    } catch (error) {
      console.error('Error logging backup:', error.message);
    } finally {
      await connection.end();
    }
  }

  /**
   * Perform full backup
   */
  async performFullBackup() {
    const startTime = new Date();
    const backupSessionDir = path.join(this.backupDir, `full_backup_${this.timestamp}`);

    console.log('Starting full backup...');
    console.log(`Backup directory: ${backupSessionDir}`);

    // Create session backup directory
    fs.mkdirSync(backupSessionDir, { recursive: true });

    try {
      // Backup master database
      const masterBackupFile = path.join(backupSessionDir, `${this.config.masterDatabase}.sql`);
      console.log('Backing up master database...');
      const masterSuccess = await this.createMySQLDump(
        this.config.masterDatabase,
        masterBackupFile
      );

      if (!masterSuccess) {
        throw new Error('Failed to backup master database');
      }

      // Get all trust databases
      const trustDatabases = await this.getTrustDatabases();
      console.log(`Found ${trustDatabases.length} trust databases to backup`);

      // Backup each trust database
      const trustBackupPromises = trustDatabases.map(async trust => {
        const trustBackupFile = path.join(backupSessionDir, `${trust.database_name}.sql`);
        console.log(`Backing up trust database: ${trust.database_name}`);
        return await this.createMySQLDump(trust.database_name, trustBackupFile);
      });

      const trustResults = await Promise.all(trustBackupPromises);
      const failedTrusts = trustResults.filter(result => !result).length;

      if (failedTrusts > 0) {
        console.warn(`${failedTrusts} trust databases failed to backup`);
      }

      // Create backup manifest
      const manifest = {
        backupType: 'FULL',
        timestamp: this.timestamp,
        startTime: startTime.toISOString(),
        endTime: new Date().toISOString(),
        masterDatabase: this.config.masterDatabase,
        trustDatabases: trustDatabases.map(t => t.database_name),
        totalDatabases: trustDatabases.length + 1,
        successfulBackups: trustResults.filter(r => r).length + (masterSuccess ? 1 : 0),
        failedBackups: failedTrusts + (masterSuccess ? 0 : 1)
      };

      fs.writeFileSync(
        path.join(backupSessionDir, 'backup_manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

      // Compress backup
      const compressedBackupFile = path.join(this.backupDir, `full_backup_${this.timestamp}.zip`);
      await this.compressBackup(backupSessionDir, compressedBackupFile);

      // Calculate checksum
      const checksum = await this.calculateChecksum(compressedBackupFile);
      const stats = fs.statSync(compressedBackupFile);

      // Log backup to database
      await this.logBackup({
        fileName: `full_backup_${this.timestamp}.zip`,
        filePath: compressedBackupFile,
        fileSize: stats.size,
        backupType: 'FULL',
        status: 'COMPLETED',
        startedAt: startTime,
        completedAt: new Date(),
        checksum: checksum
      });

      // Cleanup uncompressed files
      fs.rmSync(backupSessionDir, { recursive: true, force: true });

      console.log('\n=== Backup Completed Successfully ===');
      console.log(`Backup file: ${compressedBackupFile}`);
      console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Checksum: ${checksum}`);
      console.log(`Duration: ${Math.round((new Date() - startTime) / 1000)} seconds`);

      return true;
    } catch (error) {
      console.error('Backup failed:', error.message);

      // Log failed backup
      await this.logBackup({
        fileName: `full_backup_${this.timestamp}.zip`,
        filePath: '',
        fileSize: 0,
        backupType: 'FULL',
        status: 'FAILED',
        startedAt: startTime,
        completedAt: new Date(),
        checksum: null
      });

      return false;
    }
  }

  /**
   * Perform schema-only backup
   */
  async performSchemaBackup() {
    const startTime = new Date();
    const backupSessionDir = path.join(this.backupDir, `schema_backup_${this.timestamp}`);

    console.log('Starting schema-only backup...');
    fs.mkdirSync(backupSessionDir, { recursive: true });

    try {
      // Backup master database schema
      const masterSchemaFile = path.join(
        backupSessionDir,
        `${this.config.masterDatabase}_schema.sql`
      );
      await this.createMySQLDump(this.config.masterDatabase, masterSchemaFile, {
        schemaOnly: true
      });

      // Get one trust database as schema template
      const trustDatabases = await this.getTrustDatabases();
      if (trustDatabases.length > 0) {
        const trustSchemaFile = path.join(backupSessionDir, `trust_schema_template.sql`);
        await this.createMySQLDump(trustDatabases[0].database_name, trustSchemaFile, {
          schemaOnly: true
        });
      }

      // Compress and finalize
      const compressedBackupFile = path.join(this.backupDir, `schema_backup_${this.timestamp}.zip`);
      await this.compressBackup(backupSessionDir, compressedBackupFile);

      const checksum = await this.calculateChecksum(compressedBackupFile);
      const stats = fs.statSync(compressedBackupFile);

      await this.logBackup({
        fileName: `schema_backup_${this.timestamp}.zip`,
        filePath: compressedBackupFile,
        fileSize: stats.size,
        backupType: 'SCHEMA_ONLY',
        status: 'COMPLETED',
        startedAt: startTime,
        completedAt: new Date(),
        checksum: checksum
      });

      fs.rmSync(backupSessionDir, { recursive: true, force: true });

      console.log('\n=== Schema Backup Completed ===');
      console.log(`Backup file: ${compressedBackupFile}`);
      console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

      return true;
    } catch (error) {
      console.error('Schema backup failed:', error.message);
      return false;
    }
  }

  /**
   * Clean old backups based on retention policy
   */
  async cleanOldBackups(retentionDays = 30) {
    console.log(`Cleaning backups older than ${retentionDays} days...`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      const files = fs.readdirSync(this.backupDir);
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < cutoffDate && file.endsWith('.zip')) {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`Deleted old backup: ${file}`);
        }
      }

      console.log(`Cleaned ${deletedCount} old backup files`);
      return true;
    } catch (error) {
      console.error('Error cleaning old backups:', error.message);
      return false;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const backupType = args[0] || 'full';
  const retentionDays = parseInt(args[1]) || 30;

  const backup = new DatabaseBackup();

  try {
    switch (backupType.toLowerCase()) {
      case 'full':
        await backup.performFullBackup();
        break;
      case 'schema':
        await backup.performSchemaBackup();
        break;
      case 'clean':
        await backup.cleanOldBackups(retentionDays);
        break;
      default:
        console.log('Usage: node backup-database.js [full|schema|clean] [retention_days]');
        console.log('Examples:');
        console.log('  node backup-database.js full          # Full backup');
        console.log('  node backup-database.js schema        # Schema only backup');
        console.log('  node backup-database.js clean 30      # Clean backups older than 30 days');
        process.exit(1);
    }
  } catch (error) {
    console.error('Backup script error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DatabaseBackup;
