/**
 * Model Associations for Phase 2 - Sections Management
 * Defines relationships between Classes, Sections, Students, and Users
 */

const setupSectionAssociations = (models) => {
   const { Class, Section, Student, User } = models;

   if (!Class || !Section || !User) {
      console.warn('⚠️ Missing required models for section associations');
      return;
   }

   // Class ↔ Section (One-to-Many)
   Class.hasMany(Section, {
      foreignKey: 'class_id',
      as: 'sections',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
   });

   Section.belongsTo(Class, {
      foreignKey: 'class_id',
      as: 'class',
   });

   // User (Teacher) ↔ Section (One-to-Many)
   User.hasMany(Section, {
      foreignKey: 'section_teacher_id',
      as: 'sectionsTaught',
      constraints: false,
   });

   Section.belongsTo(User, {
      foreignKey: 'section_teacher_id',
      as: 'sectionTeacher',
      constraints: false,
   });

   // Section ↔ Student (One-to-Many) - if Student model exists
   if (Student) {
      Section.hasMany(Student, {
         foreignKey: 'section_id',
         as: 'students',
         onDelete: 'SET NULL',
         onUpdate: 'CASCADE',
      });

      Student.belongsTo(Section, {
         foreignKey: 'section_id',
         as: 'section',
      });
   }

   console.log('✅ Section model associations configured successfully');
};

module.exports = {
   setupSectionAssociations,
};
