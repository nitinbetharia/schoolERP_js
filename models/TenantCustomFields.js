const { DataTypes } = require('sequelize');

/**
 * Tenant Custom Fields Model
 * Manages dynamic/custom fields for different entities per tenant
 * Located in SYSTEM database
 */
const defineTenantCustomFields = (sequelize) => {
   const TenantCustomFields = sequelize.define(
      'TenantCustomFields',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },

         trust_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'trusts',
               key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: 'Reference to trust this custom field belongs to',
         },

         entity_type: {
            type: DataTypes.ENUM('student', 'school', 'teacher', 'parent', 'class', 'fee_structure'),
            allowNull: false,
            comment: 'Entity this custom field applies to',
         },

         field_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: 'Internal field name (used in database column)',
         },

         field_label: {
            type: DataTypes.STRING(200),
            allowNull: false,
            comment: 'Display label for the field',
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
            comment: 'Data type of the field',
         },

         field_options: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Field-specific options (dropdown values, validation rules, etc.)',
            /*
            Example for different field types:
            dropdown: { options: ['Option1', 'Option2'], allow_multiple: false }
            text: { min_length: 1, max_length: 255, pattern: null }
            number: { min_value: 0, max_value: 999999, decimal_places: 2 }
            date: { min_date: '1900-01-01', max_date: '2050-12-31', format: 'DD/MM/YYYY' }
            file: { allowed_types: ['pdf', 'jpg', 'png'], max_size_mb: 5 }
            */
         },

         validation_rules: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {},
            comment: 'Validation rules for the field',
            /*
            Example:
            {
               required: true,
               unique: false,
               conditional_required: { field: 'other_field', value: 'some_value' },
               custom_validation: 'regex_pattern'
            }
            */
         },

         display_options: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {},
            comment: 'Display and UI options',
            /*
            Example:
            {
               placeholder: 'Enter value...',
               help_text: 'Additional information about this field',
               display_order: 1,
               group: 'Personal Information',
               column_width: 'half', // 'full', 'half', 'third', 'quarter'
               show_in_list: true,
               show_in_form: true,
               show_in_view: true
            }
            */
         },

         default_value: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Default value for the field',
         },

         is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Whether this custom field is currently active',
         },

         is_required: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Whether this field is mandatory',
         },

         is_unique: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Whether this field value should be unique',
         },

         is_searchable: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Whether this field can be used for searching',
         },

         display_order: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Order in which field should be displayed',
         },

         created_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'User ID who created this field',
         },

         updated_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'User ID who last updated this field',
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
         tableName: 'tenant_custom_fields',
         timestamps: true,
         createdAt: 'created_at',
         updatedAt: 'updated_at',
         indexes: [
            {
               fields: ['trust_id', 'entity_type'],
               name: 'idx_custom_fields_trust_entity',
            },
            {
               fields: ['trust_id', 'entity_type', 'field_name'],
               unique: true,
               name: 'idx_custom_fields_unique',
            },
            {
               fields: ['is_active'],
               name: 'idx_custom_fields_active',
            },
            {
               fields: ['display_order'],
               name: 'idx_custom_fields_order',
            },
         ],
         hooks: {
            beforeValidate: (customField) => {
               // Convert field_name to snake_case
               if (customField.field_name) {
                  customField.field_name = customField.field_name
                     .toLowerCase()
                     .replace(/[^a-z0-9]/g, '_')
                     .replace(/_+/g, '_')
                     .replace(/^_|_$/g, '');
               }
            },
         },
      }
   );

   // Instance Methods
   TenantCustomFields.prototype.getValidationRules = function () {
      const rules = { ...this.validation_rules };

      if (this.is_required) {
         rules.required = true;
      }

      if (this.is_unique) {
         rules.unique = true;
      }

      return rules;
   };

   TenantCustomFields.prototype.getFieldOptions = function () {
      return this.field_options || {};
   };

   TenantCustomFields.prototype.getDisplayOptions = function () {
      return {
         placeholder: '',
         help_text: '',
         display_order: this.display_order,
         group: 'Additional Information',
         column_width: 'half',
         show_in_list: true,
         show_in_form: true,
         show_in_view: true,
         ...this.display_options,
      };
   };

   // Class Methods
   TenantCustomFields.getFieldsForEntity = async function (trustId, entityType, activeOnly = true) {
      const whereClause = { trust_id: trustId, entity_type: entityType };
      if (activeOnly) {
         whereClause.is_active = true;
      }

      return await this.findAll({
         where: whereClause,
         order: [
            ['display_order', 'ASC'],
            ['field_label', 'ASC'],
         ],
      });
   };

   TenantCustomFields.getFieldsByGroup = async function (trustId, entityType) {
      const fields = await this.getFieldsForEntity(trustId, entityType);
      const grouped = {};

      fields.forEach((field) => {
         const displayOptions = field.getDisplayOptions();
         const group = displayOptions.group || 'Additional Information';

         if (!grouped[group]) {
            grouped[group] = [];
         }
         grouped[group].push(field);
      });

      return grouped;
   };

   TenantCustomFields.validateFieldName = function (fieldName, existingFields = []) {
      // Reserved field names that cannot be used
      const reservedNames = [
         'id',
         'created_at',
         'updated_at',
         'created_by',
         'updated_by',
         'trust_id',
         'school_id',
         'user_id',
         'student_id',
         'class_id',
      ];

      const normalizedName = fieldName
         .toLowerCase()
         .replace(/[^a-z0-9]/g, '_')
         .replace(/_+/g, '_')
         .replace(/^_|_$/g, '');

      if (reservedNames.includes(normalizedName)) {
         throw new Error(`Field name '${fieldName}' is reserved and cannot be used`);
      }

      if (existingFields.includes(normalizedName)) {
         throw new Error(`Field name '${fieldName}' already exists`);
      }

      if (normalizedName.length < 2 || normalizedName.length > 50) {
         throw new Error('Field name must be between 2 and 50 characters long');
      }

      return normalizedName;
   };

   return TenantCustomFields;
};

module.exports = defineTenantCustomFields;
