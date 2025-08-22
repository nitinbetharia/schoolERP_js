const { DataTypes } = require('sequelize');

/**
 * Custom Field Values Model
 * Stores actual values for custom fields in TENANT databases
 * This is a generic model that can store values for any entity type
 */
const defineCustomFieldValues = (sequelize) => {
   const CustomFieldValues = sequelize.define(
      'CustomFieldValues',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },

         entity_type: {
            type: DataTypes.ENUM('student', 'school', 'teacher', 'parent', 'class', 'fee_structure'),
            allowNull: false,
            comment: 'Type of entity this value belongs to',
         },

         entity_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'ID of the specific entity (student_id, school_id, etc.)',
         },

         field_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: 'Custom field name (from system TenantCustomFields table)',
         },

         field_value: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Actual field value stored as text (JSON for complex types)',
         },

         field_type: {
            type: DataTypes.ENUM(
               'text',
               'number',
               'date',
               'datetime',
               'dropdown',
               'checkbox',
               'textarea',
               'email',
               'phone',
               'url',
               'file'
            ),
            allowNull: false,
            comment: 'Field type for proper value parsing',
         },

         created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
         },

         updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
         },
      },
      {
         tableName: 'custom_field_values',
         timestamps: true,
         createdAt: 'created_at',
         updatedAt: 'updated_at',
         indexes: [
            {
               fields: ['entity_type', 'entity_id'],
               name: 'idx_custom_values_entity',
            },
            {
               fields: ['entity_type', 'entity_id', 'field_name'],
               unique: true,
               name: 'idx_custom_values_unique',
            },
            {
               fields: ['field_name'],
               name: 'idx_custom_values_field_name',
            },
         ],
      }
   );

   // Instance Methods
   CustomFieldValues.prototype.getParsedValue = function () {
      if (!this.field_value) {
         return null;
      }

      switch (this.field_type) {
         case 'number':
            return parseFloat(this.field_value) || 0;
         case 'checkbox':
            return this.field_value === 'true' || this.field_value === true;
         case 'date':
         case 'datetime':
            return new Date(this.field_value);
         case 'dropdown':
            try {
               // Handle multiple selections
               return JSON.parse(this.field_value);
            } catch {
               return this.field_value;
            }
         case 'file':
            try {
               return JSON.parse(this.field_value); // File metadata
            } catch {
               return this.field_value;
            }
         default:
            return this.field_value;
      }
   };

   CustomFieldValues.prototype.setValue = function (value) {
      if (value === null || value === undefined) {
         this.field_value = null;
         return;
      }

      switch (this.field_type) {
         case 'checkbox':
            this.field_value = Boolean(value).toString();
            break;
         case 'dropdown':
            if (Array.isArray(value)) {
               this.field_value = JSON.stringify(value);
            } else {
               this.field_value = value.toString();
            }
            break;
         case 'date':
         case 'datetime':
            if (value instanceof Date) {
               this.field_value = value.toISOString();
            } else {
               this.field_value = new Date(value).toISOString();
            }
            break;
         case 'file':
            if (typeof value === 'object') {
               this.field_value = JSON.stringify(value);
            } else {
               this.field_value = value.toString();
            }
            break;
         default:
            this.field_value = value.toString();
            break;
      }
   };

   // Class Methods
   CustomFieldValues.getEntityValues = async function (entityType, entityId) {
      const values = await this.findAll({
         where: {
            entity_type: entityType,
            entity_id: entityId,
         },
      });

      const result = {};
      values.forEach((value) => {
         result[value.field_name] = value.getParsedValue();
      });

      return result;
   };

   CustomFieldValues.setEntityValues = async function (entityType, entityId, fieldValues, transaction = null) {
      const operations = [];

      for (const [fieldName, fieldValue] of Object.entries(fieldValues)) {
         // Skip if value is undefined (not null, as null is a valid value for clearing)
         if (fieldValue === undefined) {
            continue;
         }

         operations.push(
            this.findOne({
               where: {
                  entity_type: entityType,
                  entity_id: entityId,
                  field_name: fieldName,
               },
               transaction,
            }).then(async (existingValue) => {
               if (existingValue) {
                  existingValue.setValue(fieldValue);
                  return existingValue.save({ transaction });
               } else {
                  // We need to know the field type - this should be passed or fetched
                  // For now, we'll infer it from the value type
                  const fieldType = this.inferFieldType(fieldValue);
                  const newValue = this.build({
                     entity_type: entityType,
                     entity_id: entityId,
                     field_name: fieldName,
                     field_type: fieldType,
                  });
                  newValue.setValue(fieldValue);
                  return newValue.save({ transaction });
               }
            })
         );
      }

      return Promise.all(operations);
   };

   CustomFieldValues.inferFieldType = function (value) {
      if (typeof value === 'boolean') {
         return 'checkbox';
      }
      if (typeof value === 'number') {
         return 'number';
      }
      if (value instanceof Date) {
         return 'datetime';
      }
      if (Array.isArray(value)) {
         return 'dropdown';
      }
      if (typeof value === 'object') {
         return 'file';
      }

      // Try to detect email or phone
      if (typeof value === 'string') {
         if (value.includes('@')) {
            return 'email';
         }
         if (/^\+?\d{10,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
            return 'phone';
         }
         if (value.startsWith('http')) {
            return 'url';
         }
         if (value.length > 255) {
            return 'textarea';
         }
      }

      return 'text';
   };

   CustomFieldValues.deleteEntityValues = async function (entityType, entityId, transaction = null) {
      return await this.destroy({
         where: {
            entity_type: entityType,
            entity_id: entityId,
         },
         transaction,
      });
   };

   return CustomFieldValues;
};

module.exports = defineCustomFieldValues;
