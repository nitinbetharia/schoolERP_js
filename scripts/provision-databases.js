/**
 * Provision full databases from schema: master and sample trust DB
 * - Applies scripts/database-schema.sql to master DB (school_erp_master)
 * - Creates a sample trust DB (school_erp_trust_demo) with required tables
 * - Seeds minimal data used by the app for quick start
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function run() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';

  const schemaPath = path.join(__dirname, 'database-schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true
  });
  try {
    console.log('Connected to MySQL at', host, port);

    // Apply master schema idempotently
    console.log('Applying master schema from scripts/database-schema.sql ...');
    const masterStart = schemaSql.indexOf('-- MASTER DATABASE SCHEMA');
    const trustStart = schemaSql.indexOf('-- TRUST DATABASE SCHEMA TEMPLATE');
    if (masterStart < 0 || trustStart < 0)
      throw new Error('Could not locate master/trust sections in schema');
    const masterSection = schemaSql.substring(masterStart, trustStart);

    // Ensure master DB exists
    await conn.query(
      'CREATE DATABASE IF NOT EXISTS `school_erp_master` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
    );
    await conn.query('USE `school_erp_master`');

    // Execute CREATE TABLE statements with IF NOT EXISTS
    const createRegex =
      /CREATE TABLE\s+`?([a-zA-Z0-9_]+)`?\s*\([\s\S]*?\)\s*ENGINE=InnoDB[\s\S]*?;/g;
    const masterCreates = masterSection.match(createRegex) || [];
    for (let ddl of masterCreates) {
      // add IF NOT EXISTS if missing
      ddl = ddl.replace(/CREATE TABLE\s+`?/i, match => match + 'IF NOT EXISTS ');
      try {
        await conn.query(ddl);
      } catch (e) {
        // tolerate table exists, else rethrow
        if (e.code !== 'ER_TABLE_EXISTS_ERROR') {
          console.error('Master DDL failed:', e.code || e.message);
          throw e;
        }
      }
    }

    // Execute INSERTs as INSERT IGNORE to avoid duplicates
    const insertRegex = /INSERT INTO [\s\S]*?;\s*/g;
    const masterInserts = (masterSection.match(insertRegex) || []).map(s =>
      s.replace(/^INSERT INTO/i, 'INSERT IGNORE INTO')
    );
    for (const ins of masterInserts) {
      try {
        await conn.query(ins);
      } catch (e) {
        console.warn('Master seed insert skipped due to error:', e.code || e.message);
      }
    }

    // Create sample trust DB and all tables matching the template in schema file
    const trustDb = 'school_erp_trust_demo';
    console.log(`Ensuring sample trust DB exists: ${trustDb}`);
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${trustDb}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await conn.query(`USE \`${trustDb}\``);
    // Disable FK checks to allow any creation order
    await conn.query('SET FOREIGN_KEY_CHECKS=0');

    // Re-create trust tables by extracting only trust DDLs from schema text (simple split by statements)
    // For reliability and brevity here, we execute the trust section by selecting CREATE TABLE statements after the TRUST header.
    const trustSectionStart = schemaSql.indexOf('-- TRUST DATABASE SCHEMA TEMPLATE');
    if (trustSectionStart < 0)
      throw new Error('Could not locate trust schema section in database-schema.sql');
    const trustSection = schemaSql.substring(trustSectionStart);
    const regex = /CREATE TABLE[\s\S]*?;\s*/g;
    const statements = trustSection.match(regex) || [];
    console.log(`Found ${statements.length} trust table DDL statements`);

    for (let stmt of statements) {
      // Inject IF NOT EXISTS for idempotency
      stmt = stmt.replace(/CREATE TABLE\s+`/i, 'CREATE TABLE IF NOT EXISTS `');
      const ddl = stmt.endsWith(';') ? stmt : stmt + ';';
      try {
        await conn.query(ddl);
      } catch (e) {
        if (e.code !== 'ER_TABLE_EXISTS_ERROR') {
          console.error(
            'DDL failed:',
            e.code || e.message,
            '\nStatement:',
            ddl.slice(0, 120) + (ddl.length > 120 ? '...' : '')
          );
          throw e;
        }
      }
    }
    await conn.query('SET FOREIGN_KEY_CHECKS=1');

    // Seed minimal trust data
    await seedTrustData(conn);

    // Seed minimal master data
    await seedMasterData(conn);

    // Ensure compatibility columns exist in trust DBs
    await ensureTrustCompatibility(conn);

    console.log('Provisioning complete.');
  } finally {
    await conn.end();
  }
}

async function seedMasterData(conn) {
  await conn.query('USE `school_erp_master`');
  const adminHash = await bcrypt.hash('admin123', 12);
  await conn.query(
    `INSERT IGNORE INTO system_users (email, password_hash, first_name, last_name, role, status) VALUES (?, ?, 'System', 'Admin', 'SYSTEM_ADMIN', 'ACTIVE')`,
    ['admin@system.local', adminHash]
  );

  // Trusts registry minimal row for demo trust
  await conn.query(
    `INSERT IGNORE INTO trusts (trust_name, trust_code, subdomain, contact_email, database_name, status) VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
    ['Demo Educational Trust', 'demo', 'demo', 'contact@demo.trust', 'school_erp_trust_demo']
  );
}

async function seedTrustData(conn) {
  await conn.query('USE `school_erp_trust_demo`');

  // One school
  await conn.query(
    `INSERT IGNORE INTO schools (school_name, school_code, address, city, state, postal_code, phone, email, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
    [
      'Demo High School',
      'DHS001',
      '123 Demo St',
      'Demo City',
      'Demo State',
      '123456',
      '9876543211',
      'principal@demo.school'
    ]
  );

  // Academic year
  await conn.query(
    `INSERT IGNORE INTO academic_years (year_name, start_date, end_date, is_current, status) VALUES (?, ?, ?, 1, 'ACTIVE')`,
    ['2024-25', '2024-04-01', '2025-03-31']
  );

  // Classes, Sections
  const [acs] = await conn.query(
    'SELECT id as ayId FROM academic_years WHERE year_name = ? LIMIT 1',
    ['2024-25']
  );
  const ayId = acs[0]?.ayId;
  const [sch] = await conn.query(
    'SELECT id as schoolId FROM schools WHERE school_code = ? LIMIT 1',
    ['DHS001']
  );
  const schoolId = sch[0]?.schoolId;

  await conn.query(
    `INSERT IGNORE INTO classes (class_name, class_order, school_id, academic_year_id, status) VALUES ('Class 1', 1, ?, ?, 'ACTIVE'), ('Class 2', 2, ?, ?, 'ACTIVE')`,
    [schoolId, ayId, schoolId, ayId]
  );
  const [cls] = await conn.query(
    'SELECT id FROM classes WHERE school_id = ? AND academic_year_id = ? ORDER BY class_order',
    [schoolId, ayId]
  );
  const classId = cls[0].id;
  await conn.query(
    `INSERT IGNORE INTO sections (section_name, class_id, capacity, status) VALUES ('A', ?, 40, 'ACTIVE'), ('B', ?, 40, 'ACTIVE')`,
    [classId, classId]
  );

  // Users
  const pwd = await bcrypt.hash('password123', 12);
  await conn.query(
    `INSERT IGNORE INTO users (employee_id, first_name, last_name, email, phone, password_hash, role, status, school_id)
     VALUES ('SA250001','School','Admin','admin@demo.school','9876543210',?, 'SCHOOL_ADMIN','ACTIVE', ?)`,
    [pwd, schoolId]
  );
}

if (require.main === module) {
  run().catch(err => {
    console.error('Provisioning failed:', err.message);
    process.exit(1);
  });
}

module.exports = { run };

async function ensureTrustCompatibility(conn) {
  await conn.query('USE `school_erp_trust_demo`');
  // Add users.last_activity if missing
  const [cols] = await conn.query("SHOW COLUMNS FROM `users` LIKE 'last_activity'");
  if (cols.length === 0) {
    await conn.query(
      'ALTER TABLE `users` ADD COLUMN `last_activity` timestamp NULL DEFAULT NULL AFTER `last_login`'
    );
    console.log('Added users.last_activity to school_erp_trust_demo');
  }
}
