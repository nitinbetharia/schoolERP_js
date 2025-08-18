#!/usr/bin/env node

/**
 * Backup Tenant Script
 * Backs up tenant databases using standardized configuration
 */

const TenantManager = require('./create-tenant');

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Backup Tenant Script
===================

Usage:
  node backup-tenant.js --tenant=<trust_code> [--backup-dir=<path>]

Options:
  --tenant=<code>         Trust code to backup (required)
  --backup-dir=<path>     Backup directory (default: ./backups)
  --help, -h              Show this help

Examples:
  node backup-tenant.js --tenant=demo
  node backup-tenant.js --tenant=demo --backup-dir=/home/backups
`);
    return;
  }

  const tenantArg = args.find(arg => arg.startsWith('--tenant='));
  if (!tenantArg) {
    console.error('❌ --tenant argument is required');
    console.log('Use --help for usage information');
    process.exit(1);
  }

  const trustCode = tenantArg.split('=')[1];
  const backupDirArg = args.find(arg => arg.startsWith('--backup-dir='));
  const backupDir = backupDirArg ? backupDirArg.split('=')[1] : './backups';

  try {
    const tenantManager = new TenantManager();
    await tenantManager.backupTenant(trustCode, backupDir);
  } catch (error) {
    console.error(`❌ Backup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}
