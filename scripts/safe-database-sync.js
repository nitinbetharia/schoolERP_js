#!/usr/bin/env node
/**
 * Safe Database Synchronization Script
 * 
 * This script handles database schema updates safely without creating duplicate indexes.
 * Use this instead of { alter: true } for production schema changes.
 */

const { createDatabaseManager } = require('../models/database');
const { logger } = require('../utils/logger');

async function safeDatabaseSync() {
    console.log('🔄 Starting Safe Database Synchronization');
    console.log('==========================================');

    try {
        const dbManager = createDatabaseManager();
        
        // Initialize system database connection
        const systemDB = await dbManager.getSystemDB();
        
        console.log('📋 Current Sync Strategy:');
        console.log('   - alter: false (prevents duplicate indexes)');
        console.log('   - force: false (preserves existing data)');
        console.log('   - Uses model definitions to create missing tables only');
        console.log('');

        // Sync with safe options
        await systemDB.sync({ 
            alter: false,  // Never alter existing tables
            force: false   // Never drop existing tables
        });

        console.log('✅ System database synchronized successfully');
        console.log('');
        console.log('📝 For Schema Changes:');
        console.log('   1. Create specific migration scripts');
        console.log('   2. Test migrations on development database first');
        console.log('   3. Apply migrations manually with proper rollback plans');
        console.log('');
        console.log('⚠️  Index Management:');
        console.log('   - Unique constraints automatically create indexes');
        console.log('   - Only define additional indexes when necessary');
        console.log('   - Use named indexes for better control');

        process.exit(0);

    } catch (error) {
        console.error('❌ Database synchronization failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    safeDatabaseSync();
}

module.exports = { safeDatabaseSync };
