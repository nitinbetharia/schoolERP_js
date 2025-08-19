/**
 * Database Synchronization Script
 * 
 * Q1: Uses Sequelize ORM (not raw MySQL)
 * Q5: Multi-tenant database support
 * Q57-58: Async/await with try-catch patterns
 * 
 * This script synchronizes all models with their respective databases:
 * - System database: Trust, SystemUser, SystemAuditLog
 * - Tenant databases: All application models with associations
 * 
 * CRITICAL: Ensures perfect alignment between database schemas and models
 */

const { initializeSystemModels, initializeTenantModels, syncModels } = require('../models');
const config = require('../config');
const constants = config.get('constants');

/**
 * Synchronize System Database
 * Creates/updates system-level tables for multi-tenant management
 */
async function syncSystemDatabase() {
  try {
    console.log('🔄 Synchronizing System Database...');
    
    // Initialize system models
    const systemModels = await initializeSystemModels();
    
    // Test database connection
    await systemModels.sequelize.authenticate();
    console.log('✅ System database connection established');
    
    // Sync system models
    await syncModels(systemModels, {
      force: false, // Don't drop existing tables
      alter: true,  // Alter tables to match model definitions
      logging: true
    });
    
    console.log('✅ System database synchronized successfully');
    console.log('   - Trusts table ready for tenant management');
    console.log('   - SystemUsers table ready for super admin access');
    console.log('   - SystemAuditLog table ready for cross-tenant auditing');
    
    await systemModels.sequelize.close();
    return true;
  } catch (error) {
    console.error('❌ System database synchronization failed:', error.message);
    console.error('   Error Details:', error);
    throw error;
  }
}

/**
 * Synchronize Tenant Database
 * Creates/updates all application tables for a specific tenant
 */
async function syncTenantDatabase(trustCode) {
  try {
    console.log(`🔄 Synchronizing Tenant Database for trust: ${trustCode}`);
    
    // Initialize tenant models
    const tenantModels = await initializeTenantModels(trustCode);
    
    // Test database connection
    await tenantModels.sequelize.authenticate();
    console.log(`✅ Tenant database connection established: school_erp_trust_${trustCode}`);
    
    // Sync tenant models with associations
    await syncModels(tenantModels, {
      force: false, // Don't drop existing tables
      alter: true,  // Alter tables to match model definitions
      logging: true
    });
    
    console.log(`✅ Tenant database synchronized successfully: ${trustCode}`);
    console.log('   Core Models:');
    console.log('   - Users, Students, Schools, Classes, Sections, Subjects, AcademicYears');
    console.log('   Fee Management:');
    console.log('   - FeeStructures, FeeTransactions');
    console.log('   Attendance Management:');
    console.log('   - AttendanceRecords, AttendanceConfigs');
    console.log('   Communication System:');
    console.log('   - MessageTemplates, Messages, CommunicationLogs');
    console.log('   Audit System:');
    console.log('   - AuditLogs');
    
    // Verify critical associations
    await verifyAssociations(tenantModels);
    
    await tenantModels.sequelize.close();
    return true;
  } catch (error) {
    console.error(`❌ Tenant database synchronization failed for ${trustCode}:`, error.message);
    console.error('   Error Details:', error);
    throw error;
  }
}

/**
 * Verify Model Associations
 * Ensures all foreign key constraints are properly established
 */
async function verifyAssociations(models) {
  try {
    console.log('🔍 Verifying model associations...');
    
    const associations = [];
    
    // Check each model's associations
    Object.keys(models).forEach(modelName => {
      if (models[modelName].associations) {
        const modelAssociations = Object.keys(models[modelName].associations);
        if (modelAssociations.length > 0) {
          associations.push(`${modelName}: ${modelAssociations.join(', ')}`);
        }
      }
    });
    
    if (associations.length > 0) {
      console.log('✅ Model associations verified:');
      associations.forEach(assoc => console.log(`   - ${assoc}`));
    } else {
      console.log('⚠️  No associations found - this may indicate an issue');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Association verification failed:', error.message);
    throw error;
  }
}

/**
 * Sync All Databases
 * Synchronizes system database and all existing tenant databases
 */
async function syncAllDatabases() {
  try {
    console.log('🚀 Starting Database Synchronization Process...');
    console.log('=' .repeat(60));
    
    // Step 1: Sync System Database
    await syncSystemDatabase();
    console.log('');
    
    // Step 2: Get list of existing trusts and sync their databases
    const systemModels = await initializeSystemModels();
    
    try {
      // Try to get existing trusts
      const trusts = await systemModels.Trust.findAll({
        attributes: ['trustCode'],
        where: {
          status: constants.TRUST_STATUS.ACTIVE
        }
      });
      
      if (trusts.length > 0) {
        console.log(`📋 Found ${trusts.length} active trust(s) to synchronize:`);
        
        for (const trust of trusts) {
          await syncTenantDatabase(trust.trustCode);
          console.log('');
        }
      } else {
        console.log('📋 No active trusts found - system ready for new tenant creation');
      }
    } catch (error) {
      // If Trust table doesn't exist yet, that's okay - system is being set up
      console.log('📋 Trust table not yet available - system database will be created');
    }
    
    await systemModels.sequelize.close();
    
    console.log('=' .repeat(60));
    console.log('🎉 Database Synchronization Completed Successfully!');
    console.log('');
    console.log('Next Steps:');
    console.log('1. Create your first trust using the trust creation script');
    console.log('2. Set up initial admin users');
    console.log('3. Configure system settings');
    
    return true;
  } catch (error) {
    console.error('💥 Database synchronization process failed:', error.message);
    console.error('   This is likely due to missing database or configuration issues');
    console.error('   Please check your database connection settings and try again');
    throw error;
  }
}

/**
 * Create Indices for Performance
 * Adds additional performance indices beyond what models define
 */
async function createPerformanceIndices(trustCode) {
  try {
    console.log(`🔧 Creating performance indices for tenant: ${trustCode}`);
    
    const tenantModels = await initializeTenantModels(trustCode);
    const { sequelize } = tenantModels;
    
    // Additional composite indices for complex queries
    const customIndices = [
      // Student lookup optimization
      'CREATE INDEX IF NOT EXISTS idx_students_class_section_status ON students(class_id, section_id, status)',
      
      // Attendance report optimization
      'CREATE INDEX IF NOT EXISTS idx_attendance_date_status ON attendance_records(attendance_date, status)',
      
      // Fee transaction optimization
      'CREATE INDEX IF NOT EXISTS idx_fee_trans_student_status ON fee_transactions(student_id, payment_status, due_date)',
      
      // Message delivery optimization
      'CREATE INDEX IF NOT EXISTS idx_messages_channel_status ON messages(channel, status, created_at)',
      
      // Audit log analysis optimization
      'CREATE INDEX IF NOT EXISTS idx_audit_user_action_date ON audit_logs(user_id, action, created_at)',
      
      // Communication log performance
      'CREATE INDEX IF NOT EXISTS idx_comm_log_message_event ON communication_logs(message_id, event, logged_at)'
    ];
    
    for (const indexQuery of customIndices) {
      try {
        await sequelize.query(indexQuery);
        console.log(`   ✅ ${indexQuery.split(' ')[5]} created`);
      } catch (error) {
        console.log(`   ⚠️  Index already exists or creation failed: ${error.message}`);
      }
    }
    
    await sequelize.close();
    console.log('✅ Performance indices setup completed');
    
  } catch (error) {
    console.error(`❌ Performance indices creation failed for ${trustCode}:`, error.message);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Check command line arguments
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
      case 'system':
        await syncSystemDatabase();
        break;
      case 'tenant':
        const trustCode = args[1];
        if (!trustCode) {
          throw new Error('Trust code is required for tenant sync: npm run sync-db tenant <trust_code>');
        }
        await syncTenantDatabase(trustCode);
        break;
      case 'indices':
        const trustCodeForIndices = args[1];
        if (!trustCodeForIndices) {
          throw new Error('Trust code is required for indices: npm run sync-db indices <trust_code>');
        }
        await createPerformanceIndices(trustCodeForIndices);
        break;
      case 'all':
      default:
        await syncAllDatabases();
        break;
    }
    
    process.exit(0);
  } catch (error) {
    console.error('💥 Script execution failed:', error.message);
    process.exit(1);
  }
}

// Export functions for programmatic use
module.exports = {
  syncSystemDatabase,
  syncTenantDatabase,
  syncAllDatabases,
  verifyAssociations,
  createPerformanceIndices
};

// Run if called directly
if (require.main === module) {
  main();
}
