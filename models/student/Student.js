const { studentFields } = require('./StudentFields');

/**
 * Student Model - Core Definition
 * Main model definition using field specifications from StudentFields.js
 * File size: ~80 lines (within industry standards)
 */

const defineStudent = (sequelize) => {
   const Student = sequelize.define('Student', studentFields, {
      tableName: 'students',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
         {
            name: 'student_school_id_idx',
            fields: ['school_id'],
         },
         {
            name: 'student_class_section_idx',
            fields: ['class_id', 'section_id'],
         },
      ],
      hooks: {
         beforeCreate: (student) => {
            if (student.admission_number) {
               student.admission_number = student.admission_number.toUpperCase();
            }
         },
         beforeUpdate: (student) => {
            if (student.admission_number) {
               student.admission_number = student.admission_number.toUpperCase();
            }
         },
      },
   });

   return Student;
};

module.exports = { defineStudent };
