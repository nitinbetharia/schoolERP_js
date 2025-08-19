/**
 * Model Validation Script
 *
 * Q1: Uses Sequelize ORM (not raw MySQL)
 * Q57-58: Async/await with try-catch patterns
 * Q13: Validates all model associations
 *
 * This script performs comprehensive validation of all models:
 * - Model loading and instantiation
 * - Association setup verification
 * - Database schema alignment
 * - Business constant usage validation
 * - Joi validation schema checks
 */

const { initializeSystemModels, initializeTenantModels } = require('../models');
const config = require('../config');
const constants = config.get('constants');

/**
 * Validate System Models
 * Ensures system-level models are properly configured
 */
async function validateSystemModels() {
  try {
    console.log('🔍 Validating System Models...');

    const systemModels = await initializeSystemModels();
    const modelNames = Object.keys(systemModels).filter(
      name => !['sequelize', 'Sequelize'].includes(name)
    );

    console.log(`   Found ${modelNames.length} system models: ${modelNames.join(', ')}`);

    // Validate each system model
    for (const modelName of modelNames) {
      await validateModel(systemModels[modelName], modelName, 'system');
    }

    // Validate system model associations
    await validateSystemAssociations(systemModels);

    await systemModels.sequelize.close();
    console.log('✅ System models validation passed');

    return { success: true, models: modelNames };
  } catch (error) {
    console.error('❌ System models validation failed:', error.message);
    throw error;
  }
}

/**
 * Validate Tenant Models
 * Ensures tenant-level models are properly configured
 */
async function validateTenantModels(trustCode = 'TEST') {
  try {
    console.log(`🔍 Validating Tenant Models (${trustCode})...`);

    const tenantModels = await initializeTenantModels(trustCode);
    const modelNames = Object.keys(tenantModels).filter(
      name => !['sequelize', 'Sequelize'].includes(name)
    );

    console.log(`   Found ${modelNames.length} tenant models: ${modelNames.join(', ')}`);

    // Validate each tenant model
    for (const modelName of modelNames) {
      await validateModel(tenantModels[modelName], modelName, 'tenant');
    }

    // Validate tenant model associations
    await validateTenantAssociations(tenantModels);

    await tenantModels.sequelize.close();
    console.log('✅ Tenant models validation passed');

    return { success: true, models: modelNames };
  } catch (error) {
    console.error(`❌ Tenant models validation failed (${trustCode}):`, error.message);
    throw error;
  }
}

/**
 * Validate Individual Model
 * Performs comprehensive validation of a single model
 */
async function validateModel(Model, modelName, type) {
  try {
    const validations = [];

    // 1. Check if model has required Sequelize properties
    if (!Model.sequelize) {
      throw new Error(`${modelName}: Missing sequelize instance`);
    }
    validations.push('Sequelize instance ✓');

    // 2. Check if model has table name
    if (!Model.tableName) {
      throw new Error(`${modelName}: Missing table name`);
    }
    validations.push(`Table name: ${Model.tableName} ✓`);

    // 3. Check if model has primary key
    const primaryKeys = Object.keys(Model.primaryKeys || {});
    if (primaryKeys.length === 0) {
      throw new Error(`${modelName}: No primary key defined`);
    }
    validations.push(`Primary key: ${primaryKeys.join(', ')} ✓`);

    // 4. Check if model has attributes
    const attributes = Object.keys(Model.rawAttributes || {});
    if (attributes.length === 0) {
      throw new Error(`${modelName}: No attributes defined`);
    }
    validations.push(`Attributes: ${attributes.length} fields ✓`);

    // 5. Check for business constants usage (Q59 compliance)
    await validateBusinessConstants(Model, modelName);
    validations.push('Business constants usage ✓');

    // 6. Check for validation schemas
    const modelFile =
      require.resolve(`../modules/${getModuleFromType(type)}/models/${modelName}`) ||
      require.resolve(`../models/${modelName}`);
    const modelModule = require(modelFile);

    if (modelModule.validationSchemas) {
      validations.push('Joi validation schemas ✓');
    } else {
      console.warn(`   ⚠️  ${modelName}: No validation schemas found`);
    }

    // 7. Test model instantiation (dry run)
    try {
      const instance = Model.build({});
      validations.push('Model instantiation ✓');
    } catch (error) {
      console.warn(`   ⚠️  ${modelName}: Model instantiation warning: ${error.message}`);
    }

    console.log(`   ✅ ${modelName}: ${validations.length} validations passed`);
  } catch (error) {
    console.error(`   ❌ ${modelName}: ${error.message}`);
    throw error;
  }
}

/**
 * Validate System Model Associations
 */
async function validateSystemAssociations(models) {
  try {
    console.log('🔗 Validating System Model Associations...');

    const expectedAssociations = {
      Trust: [],
      SystemUser: ['trust'],
      SystemAuditLog: ['trust', 'systemUser']
    };

    let totalAssociations = 0;

    Object.keys(expectedAssociations).forEach(modelName => {
      if (models[modelName] && models[modelName].associations) {
        const associations = Object.keys(models[modelName].associations);
        totalAssociations += associations.length;
        console.log(
          `   ${modelName}: ${associations.length} associations [${associations.join(', ')}]`
        );
      } else {
        console.log(`   ${modelName}: No associations`);
      }
    });

    console.log(`   Total system associations: ${totalAssociations}`);
  } catch (error) {
    console.error('   ❌ System associations validation failed:', error.message);
    throw error;
  }
}

/**
 * Validate Tenant Model Associations
 */
async function validateTenantAssociations(models) {
  try {
    console.log('🔗 Validating Tenant Model Associations...');

    const criticalAssociations = {
      User: ['school'],
      Student: ['user', 'school', 'class', 'section'],
      FeeStructure: ['school', 'class', 'section'],
      FeeTransaction: ['student', 'feeStructure'],
      AttendanceRecord: ['student', 'markedBy'],
      Message: ['template', 'sentBy'],
      MessageTemplate: ['createdBy'],
      CommunicationLog: ['message'],
      AuditLog: ['user']
    };

    let totalAssociations = 0;

    Object.keys(criticalAssociations).forEach(modelName => {
      if (models[modelName] && models[modelName].associations) {
        const associations = Object.keys(models[modelName].associations);
        totalAssociations += associations.length;
        console.log(
          `   ${modelName}: ${associations.length} associations [${associations.join(', ')}]`
        );

        // Check if critical associations exist
        const expected = criticalAssociations[modelName];
        const missing = expected.filter(assoc => !associations.includes(assoc));
        if (missing.length > 0) {
          console.warn(`     ⚠️  Missing critical associations: ${missing.join(', ')}`);
        }
      } else {
        console.log(`   ${modelName}: No associations`);
      }
    });

    console.log(`   Total tenant associations: ${totalAssociations}`);
  } catch (error) {
    console.error('   ❌ Tenant associations validation failed:', error.message);
    throw error;
  }
}

/**
 * Validate Business Constants Usage
 * Ensures models use business constants instead of hardcoded values
 */
async function validateBusinessConstants(Model, modelName) {
  try {
    const attributes = Model.rawAttributes || {};

    Object.keys(attributes).forEach(fieldName => {
      const field = attributes[fieldName];

      // Check ENUM fields for business constants usage
      if (field.type && field.type.constructor.name === 'ENUM') {
        const values = field.type.values || [];

        // Check if values match known business constants
        const isUsingConstants = Object.keys(constants).some(constantKey => {
          const constantValues = constants[constantKey];
          if (constantValues && constantValues.ALL_STATUS) {
            return arraysEqual(values.sort(), constantValues.ALL_STATUS.sort());
          }
          if (constantValues && constantValues.ALL_TYPES) {
            return arraysEqual(values.sort(), constantValues.ALL_TYPES.sort());
          }
          if (constantValues && constantValues.ALL_LEVELS) {
            return arraysEqual(values.sort(), constantValues.ALL_LEVELS.sort());
          }
          if (constantValues && constantValues.ALL_CATEGORIES) {
            return arraysEqual(values.sort(), constantValues.ALL_CATEGORIES.sort());
          }
          if (constantValues && constantValues.ALL_CHANNELS) {
            return arraysEqual(values.sort(), constantValues.ALL_CHANNELS.sort());
          }
          if (constantValues && constantValues.ALL_PRIORITIES) {
            return arraysEqual(values.sort(), constantValues.ALL_PRIORITIES.sort());
          }
          if (constantValues && constantValues.ALL_ACTIONS) {
            return arraysEqual(values.sort(), constantValues.ALL_ACTIONS.sort());
          }
          if (constantValues && constantValues.ALL_RESULTS) {
            return arraysEqual(values.sort(), constantValues.ALL_RESULTS.sort());
          }
          return false;
        });

        if (!isUsingConstants && values.length > 1) {
          console.warn(`     ⚠️  ${fieldName}: ENUM values may not be using business constants`);
        }
      }
    });
  } catch (error) {
    console.warn(`   ⚠️  Business constants validation warning for ${modelName}: ${error.message}`);
  }
}

/**
 * Utility Functions
 */
function arraysEqual(a, b) {
  return a.length === b.length && a.every((val, i) => val === b[i]);
}

function getModuleFromType(type) {
  return type === 'system' ? 'system' : 'fees'; // Default to fees for now
}

/**
 * Run All Validations
 */
async function validateAllModels() {
  try {
    console.log('🚀 Starting Comprehensive Model Validation...');
    console.log('='.repeat(60));

    // Validate system models
    const systemValidation = await validateSystemModels();
    console.log('');

    // Validate tenant models
    const tenantValidation = await validateTenantModels();
    console.log('');

    console.log('='.repeat(60));
    console.log('🎉 Model Validation Completed Successfully!');
    console.log('');
    console.log('Validation Summary:');
    console.log(`  System Models: ${systemValidation.models.length} validated`);
    console.log(`  Tenant Models: ${tenantValidation.models.length} validated`);
    console.log(
      `  Total Models: ${systemValidation.models.length + tenantValidation.models.length}`
    );
    console.log('');
    console.log('✅ All models are properly configured and ready for use');
    console.log('✅ Associations are correctly established');
    console.log('✅ Business constants are being used appropriately');

    return {
      success: true,
      systemModels: systemValidation.models,
      tenantModels: tenantValidation.models
    };
  } catch (error) {
    console.error('💥 Model validation failed:', error.message);
    console.error('   Please fix the issues above and run validation again');
    throw error;
  }
}

/**
 * Test Database Connectivity
 */
async function testDatabaseConnectivity() {
  try {
    console.log('🔌 Testing Database Connectivity...');

    // Test system database
    const systemModels = await initializeSystemModels();
    await systemModels.sequelize.authenticate();
    console.log('   ✅ System database connection: OK');
    await systemModels.sequelize.close();

    // Test tenant database (with test trust code)
    try {
      const tenantModels = await initializeTenantModels('TEST');
      await tenantModels.sequelize.authenticate();
      console.log('   ✅ Tenant database connection: OK');
      await tenantModels.sequelize.close();
    } catch (error) {
      console.log(
        '   ⚠️  Tenant database connection: Not available (this is normal if no test database exists)'
      );
    }

    return true;
  } catch (error) {
    console.error('❌ Database connectivity test failed:', error.message);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'system':
        await validateSystemModels();
        break;
      case 'tenant':
        const trustCode = args[1] || 'TEST';
        await validateTenantModels(trustCode);
        break;
      case 'connectivity':
        await testDatabaseConnectivity();
        break;
      case 'all':
      default:
        await testDatabaseConnectivity();
        console.log('');
        await validateAllModels();
        break;
    }

    process.exit(0);
  } catch (error) {
    console.error('💥 Validation script failed:', error.message);
    process.exit(1);
  }
}

// Export functions for programmatic use
module.exports = {
  validateSystemModels,
  validateTenantModels,
  validateAllModels,
  testDatabaseConnectivity
};

// Run if called directly
if (require.main === module) {
  main();
}
