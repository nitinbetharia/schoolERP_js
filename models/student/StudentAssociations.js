/**
 * Student Model Associations
 * Defines all relationships and associations for the Student model
 * File size: ~180 lines (within industry standards)
 */

const defineStudentAssociations = (models) => {
   const {
      Student,
      User,
      School,
      Class,
      Section,
      StudentDocument,
      StudentEnrollment,
      FeeTransaction,
      StudentFeeAssignment,
   } = models;

   /**
    * Core Associations
    */

   // Student belongs to User (login credentials)
   Student.belongsTo(User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
   });

   // User has one Student profile
   User.hasOne(Student, {
      foreignKey: 'user_id',
      as: 'studentProfile',
   });

   // Student belongs to School
   Student.belongsTo(School, {
      foreignKey: 'school_id',
      as: 'school',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
   });

   // School has many Students
   School.hasMany(Student, {
      foreignKey: 'school_id',
      as: 'students',
   });

   // Student belongs to Class (current class)
   Student.belongsTo(Class, {
      foreignKey: 'class_id',
      as: 'currentClass',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
   });

   // Class has many Students
   Class.hasMany(Student, {
      foreignKey: 'class_id',
      as: 'students',
   });

   // Student belongs to Section (current section)
   Student.belongsTo(Section, {
      foreignKey: 'section_id',
      as: 'currentSection',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
   });

   // Section has many Students
   Section.hasMany(Student, {
      foreignKey: 'section_id',
      as: 'students',
   });

   /**
    * Document Associations
    */

   // Student has many Documents
   Student.hasMany(StudentDocument, {
      foreignKey: 'student_id',
      as: 'documents',
      onDelete: 'CASCADE',
   });

   // StudentDocument belongs to Student
   StudentDocument.belongsTo(Student, {
      foreignKey: 'student_id',
      as: 'student',
   });

   /**
    * Enrollment History Associations
    */

   // Student has many Enrollments (class history)
   Student.hasMany(StudentEnrollment, {
      foreignKey: 'student_id',
      as: 'enrollmentHistory',
      onDelete: 'CASCADE',
   });

   // StudentEnrollment belongs to Student
   StudentEnrollment.belongsTo(Student, {
      foreignKey: 'student_id',
      as: 'student',
   });

   // StudentEnrollment belongs to Class
   StudentEnrollment.belongsTo(Class, {
      foreignKey: 'class_id',
      as: 'class',
   });

   // StudentEnrollment belongs to Section
   StudentEnrollment.belongsTo(Section, {
      foreignKey: 'section_id',
      as: 'section',
   });

   /**
    * Fee Management Associations
    */

   // Student has many Fee Transactions
   Student.hasMany(FeeTransaction, {
      foreignKey: 'student_id',
      as: 'feeTransactions',
      onDelete: 'CASCADE',
   });

   // FeeTransaction belongs to Student
   FeeTransaction.belongsTo(Student, {
      foreignKey: 'student_id',
      as: 'student',
   });

   // Student has many Fee Assignments
   Student.hasMany(StudentFeeAssignment, {
      foreignKey: 'student_id',
      as: 'feeAssignments',
      onDelete: 'CASCADE',
   });

   // StudentFeeAssignment belongs to Student
   StudentFeeAssignment.belongsTo(Student, {
      foreignKey: 'student_id',
      as: 'student',
   });

   /**
    * Audit Trail Associations (if audit models exist)
    */

   // Created by User relationship
   Student.belongsTo(User, {
      foreignKey: 'created_by',
      as: 'creator',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
   });

   // Updated by User relationship
   Student.belongsTo(User, {
      foreignKey: 'updated_by',
      as: 'updater',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
   });
};

/**
 * Custom Association Methods
 * These methods define complex queries involving multiple models
 */
const defineStudentMethods = (models) => {
   const { Student, User, School, Class, Section, StudentDocument, StudentEnrollment, FeeTransaction } = models;

   /**
    * Get student with complete profile information
    */
   Student.getCompleteProfile = async function (studentId, options = {}) {
      return await this.findOne({
         where: { id: studentId },
         include: [
            {
               model: User,
               as: 'user',
               attributes: ['id', 'name', 'email', 'phone', 'profile_image'],
            },
            {
               model: School,
               as: 'school',
               attributes: ['id', 'name', 'code'],
            },
            {
               model: Class,
               as: 'currentClass',
               attributes: ['id', 'name', 'grade'],
            },
            {
               model: Section,
               as: 'currentSection',
               attributes: ['id', 'name'],
            },
            {
               model: StudentDocument,
               as: 'documents',
               attributes: ['id', 'document_type', 'document_url', 'status'],
            },
         ],
         ...options,
      });
   };

   /**
    * Get student enrollment history
    */
   Student.getEnrollmentHistory = async function (studentId, options = {}) {
      return await this.findOne({
         where: { id: studentId },
         include: [
            {
               model: StudentEnrollment,
               as: 'enrollmentHistory',
               include: [
                  {
                     model: Class,
                     as: 'class',
                     attributes: ['id', 'name', 'grade'],
                  },
                  {
                     model: Section,
                     as: 'section',
                     attributes: ['id', 'name'],
                  },
               ],
               order: [
                  ['academic_year', 'DESC'],
                  ['created_at', 'DESC'],
               ],
            },
         ],
         ...options,
      });
   };

   /**
    * Get students by class and section
    */
   Student.getByClassSection = async function (classId, sectionId = null, options = {}) {
      const whereClause = {
         class_id: classId,
         student_status: 'ACTIVE',
      };

      if (sectionId) {
         whereClause.section_id = sectionId;
      }

      return await this.findAll({
         where: whereClause,
         include: [
            {
               model: User,
               as: 'user',
               attributes: ['id', 'name', 'email'],
            },
         ],
         order: [
            ['roll_number', 'ASC'],
            ['admission_number', 'ASC'],
         ],
         ...options,
      });
   };

   /**
    * Get students with pending fee payments
    */
   Student.getWithPendingFees = async function (schoolId, options = {}) {
      return await this.findAll({
         where: {
            school_id: schoolId,
            student_status: 'ACTIVE',
         },
         include: [
            {
               model: User,
               as: 'user',
               attributes: ['id', 'name'],
            },
            {
               model: FeeTransaction,
               as: 'feeTransactions',
               where: {
                  payment_status: 'PENDING',
               },
               required: true,
            },
         ],
         ...options,
      });
   };

   /**
    * Search students with flexible criteria
    */
   Student.searchStudents = async function (searchCriteria, options = {}) {
      const { Op } = require('sequelize');
      const { search, school_id, class_id, section_id, student_status } = searchCriteria;

      const whereClause = {};

      if (school_id) {
         whereClause.school_id = school_id;
      }
      if (class_id) {
         whereClause.class_id = class_id;
      }
      if (section_id) {
         whereClause.section_id = section_id;
      }
      if (student_status) {
         whereClause.student_status = student_status;
      }

      if (search) {
         whereClause[Op.or] = [
            { admission_number: { [Op.iLike]: `%${search}%` } },
            { father_name: { [Op.iLike]: `%${search}%` } },
            { mother_name: { [Op.iLike]: `%${search}%` } },
            { guardian_name: { [Op.iLike]: `%${search}%` } },
            { phone: { [Op.iLike]: `%${search}%` } },
            { '$user.name$': { [Op.iLike]: `%${search}%` } },
            { '$user.email$': { [Op.iLike]: `%${search}%` } },
         ];
      }

      return await this.findAll({
         where: whereClause,
         include: [
            {
               model: User,
               as: 'user',
               attributes: ['id', 'name', 'email'],
            },
            {
               model: Class,
               as: 'currentClass',
               attributes: ['id', 'name', 'grade'],
            },
            {
               model: Section,
               as: 'currentSection',
               attributes: ['id', 'name'],
            },
         ],
         ...options,
      });
   };
};

module.exports = {
   defineStudentAssociations,
   defineStudentMethods,
};
