/**
 * Audit DB Schemas
 * Detects trust-template tables that exist in the master database by mistake.
 * Reads scripts/database-schema.sql to extract table names and compares with actual DB.
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const appConfig = require('../config/app-config');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function extractTablesFromSchema(schemaText) {
  const masterStart = schemaText.indexOf('-- MASTER DATABASE SCHEMA');
  const trustStart = schemaText.indexOf('-- TRUST DATABASE SCHEMA TEMPLATE');
  if (masterStart < 0 || trustStart < 0) {
    throw new Error('Could not locate master/trust sections in scripts/database-schema.sql');
  }
  const masterSection = schemaText.substring(masterStart, trustStart);
  const trustSection = schemaText.substring(trustStart);

  const tableRegex = /CREATE TABLE\s+`?([a-zA-Z0-9_]+)`?\s*\(/g;
  const collect = text => {
    const names = new Set();
    let m;
    while ((m = tableRegex.exec(text)) !== null) {
      names.add(m[1]);
    }
    return names;
  };

  return { masterTables: collect(masterSection), trustTables: collect(trustSection) };
}

async function audit() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const masterDb = appConfig.database.master.name; // expected master

  const schemaPath = path.join(__dirname, 'database-schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const { masterTables, trustTables } = extractTablesFromSchema(schemaSql);

  const conn = await mysql.createConnection({ host, port, user, password });
  try {
    // List actual tables in master
    const [rows] = await conn.query(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = ? ORDER BY table_name',
      [masterDb]
    );
    const actualMaster = new Set(rows.map(r => r.table_name));

    const misplaced = [...trustTables].filter(t => actualMaster.has(t) && !masterTables.has(t));

    console.log(`\nMaster DB: ${masterDb}`);
    console.log(`Total tables in master: ${actualMaster.size}`);
    console.log(`Trust-template tables defined: ${trustTables.size}`);
    if (misplaced.length === 0) {
      console.log('\n✅ No trust tables found in master. Schema separation looks good.');
    } else {
      console.log(
        '\n⚠️  Detected trust tables present in master (likely created by running full schema under master context):'
      );
      misplaced.forEach(t => console.log(`  - ${t}`));
      console.log('\nRecommended remediation:');
      console.log(
        '- Ensure you use scripts/provision-databases.js to create DBs. It switches to the trust DB before applying trust DDL.'
      );
      console.log(
        `- Move or drop the above tables from ${masterDb}. If you already created the trust DB, re-create tables there via provision script.`
      );
      console.log(
        '- If data exists that you want to preserve, export from master and import into the trust DB, then drop from master.'
      );
    }
  } finally {
    await conn.end();
  }
}

if (require.main === module) {
  audit().catch(e => {
    console.error('Audit failed:', e.message);
    process.exit(1);
  });
}

module.exports = { audit };
