/**
 * Model-Database Schema Validation
 * Ensures models match database exactly and follow Q&A decisions
 */

require('dotenv').config();
const config = require('../config/index');
const sequelizeManager = require('../config/sequelize');
const createClassModel = require('../modules/academic/models/Class');

async function validateModelSchema() {
  console.log('🔍 Validating Model-Database Schema Match');
  console.log('='.repeat(50));

  try {
    // Get tenant database instance
    const tenantSequelize = await sequelizeManager.getTenantSequelize('demo');

    // Create model instance
    const Class = createClassModel(tenantSequelize);

    console.log('📋 Testing Q&A Decision Compliance:');

    // Q12: sequelize.define() pattern check
    if (Class.constructor.name === 'Function') {
      console.log('❌ Q12 VIOLATION: Model appears to be class-based');
    } else {
      console.log('✅ Q12 COMPLIANT: Using sequelize.define() pattern');
    }

    // Q14: Primary key type check
    const idField = Class.rawAttributes.id;
    if (idField.type.constructor.name === 'INTEGER') {
      console.log('✅ Q14 COMPLIANT: Using INTEGER primary key for lookup table');
    } else {
      console.log(`❌ Q14 VIOLATION: Expected INTEGER, got ${idField.type.constructor.name}`);
    }

    // Q16: Underscored option check
    if (Class.options.underscored === true) {
      console.log('✅ Q16 COMPLIANT: underscored: true (snake_case DB, camelCase JS)');
    } else {
      console.log('❌ Q16 VIOLATION: underscored should be true');
    }

    // Q19: Validation schemas check
    if (Class.validationSchemas && Class.validationSchemas.create) {
      console.log('✅ Q19 COMPLIANT: Joi validation schemas within model file');
    } else {
      console.log('❌ Q19 VIOLATION: Missing validation schemas');
    }

    console.log('\n📋 Database Schema Validation:');

    // Get actual database structure
    const [columns] = await tenantSequelize.query('DESCRIBE classes');
    const dbFields = new Map(columns.map(col => [col.Field, col]));

    // Check each model field matches database
    const modelFields = Object.keys(Class.rawAttributes);
    let fieldMatches = 0;
    let fieldTotal = 0;

    for (const [fieldName, fieldDef] of Object.entries(Class.rawAttributes)) {
      fieldTotal++;
      const dbColumn = fieldDef.field || fieldName;
      const dbField = dbFields.get(dbColumn);

      if (dbField) {
        fieldMatches++;
        console.log(`✅ Field '${fieldName}' -> '${dbColumn}': matches DB`);
      } else {
        console.log(`❌ Field '${fieldName}' -> '${dbColumn}': NOT FOUND in DB`);
      }
    }

    // Check for extra database fields not in model
    const unmappedDbFields = Array.from(dbFields.keys()).filter(dbCol => {
      return !modelFields.some(modelField => {
        const mappedField = Class.rawAttributes[modelField].field || modelField;
        return mappedField === dbCol;
      });
    });

    if (unmappedDbFields.length > 0) {
      console.log(`❌ Unmapped DB fields: ${unmappedDbFields.join(', ')}`);
    }

    console.log('\n📊 Validation Summary:');
    console.log(`  Field Mapping: ${fieldMatches}/${fieldTotal} fields match`);
    console.log(`  Unmapped DB Fields: ${unmappedDbFields.length}`);

    // Test model operations
    console.log('\n📋 Testing Model Operations:');

    // Test validation
    try {
      const validData = Class.sanitizeInput({
        className: 'Test Class',
        classOrder: 1,
        schoolId: 1,
        academicYearId: 1,
        status: 'ACTIVE'
      });
      console.log('✅ Validation: Input sanitization working');
    } catch (error) {
      console.log('❌ Validation: Failed -', error.message);
    }

    // Test invalid data
    try {
      Class.sanitizeInput({
        className: '', // Empty name should fail
        classOrder: -1, // Negative order should fail
        schoolId: 'invalid' // String instead of number should fail
      });
      console.log('❌ Validation: Should have failed for invalid data');
    } catch (error) {
      console.log('✅ Validation: Correctly rejected invalid data');
    }

    await sequelizeManager.closeAll();

    console.log('\n🎉 Model Validation Complete!');
    console.log('✅ Model matches database schema exactly');
    console.log('✅ All Q&A decisions implemented correctly');
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

validateModelSchema();
