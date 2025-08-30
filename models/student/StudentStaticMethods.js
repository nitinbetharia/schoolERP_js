/**
 * Student Static Methods
 * Class-level methods and utilities for Student model operations
 * File size: ~200 lines (within industry standards)
 */

const StudentStaticMethods = {
   /**
    * Generate admission number
    */
   generateAdmissionNumber: async function (schoolCode, academicYear) {
      const { Op } = require('sequelize');
      const year = academicYear.split('-')[0].slice(-2); // Last 2 digits of year
      const prefix = `${schoolCode}${year}`;

      // Find the highest admission number for this pattern
      const lastStudent = await this.findOne({
         where: {
            admission_number: {
               [Op.like]: `${prefix}%`,
            },
         },
         order: [['admission_number', 'DESC']],
      });

      let nextNumber = 1;
      if (lastStudent) {
         const lastNumber = parseInt(lastStudent.admission_number.slice(prefix.length));
         nextNumber = lastNumber + 1;
      }

      return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
   },

   /**
    * Get statistics by school
    */
   getStatsBySchool: async function (schoolId, academicYear = null) {
      const whereClause = { school_id: schoolId };

      if (academicYear) {
         whereClause.academic_year = academicYear;
      }

      const totalStudents = await this.count({ where: whereClause });

      const statusStats = await this.findAll({
         where: whereClause,
         attributes: ['student_status', [require('sequelize').fn('COUNT', '*'), 'count']],
         group: ['student_status'],
         raw: true,
      });

      const genderStats = await this.findAll({
         where: whereClause,
         attributes: ['gender', [require('sequelize').fn('COUNT', '*'), 'count']],
         group: ['gender'],
         raw: true,
      });

      return {
         total: totalStudents,
         byStatus: statusStats.reduce((acc, stat) => {
            acc[stat.student_status] = parseInt(stat.count);
            return acc;
         }, {}),
         byGender: genderStats.reduce((acc, stat) => {
            acc[stat.gender] = parseInt(stat.count);
            return acc;
         }, {}),
      };
   },

   /**
    * Bulk update student status
    */
   bulkUpdateStatus: async function (studentIds, newStatus, updatedBy, transaction = null) {
      return await this.update(
         {
            student_status: newStatus,
            updated_by: updatedBy,
         },
         {
            where: {
               id: {
                  [require('sequelize').Op.in]: studentIds,
               },
            },
            transaction,
         }
      );
   },

   /**
    * Find students due for promotion
    */
   findStudentsDueForPromotion: async function (schoolId, currentAcademicYear) {
      const { Op } = require('sequelize');

      return await this.findAll({
         where: {
            school_id: schoolId,
            academic_year: currentAcademicYear,
            student_status: 'ACTIVE',
            class_id: {
               [Op.not]: null,
            },
         },
         include: [
            {
               model: require('../database').User,
               as: 'user',
               attributes: ['id', 'name'],
            },
            {
               model: require('../database').Class,
               as: 'currentClass',
               attributes: ['id', 'name', 'grade'],
            },
         ],
      });
   },

   /**
    * Search students with advanced filters
    */
   searchAdvanced: async function (criteria) {
      const { Op } = require('sequelize');
      const {
         schoolId,
         classId,
         sectionId,
         academicYear,
         studentStatus,
         admissionStatus,
         searchTerm,
         hasTransport,
         hasHostel,
         hasScholarship,
         bloodGroup,
         category,
         dateRange,
      } = criteria;

      const whereClause = {};

      // Basic filters
      if (schoolId) {
         whereClause.school_id = schoolId;
      }
      if (classId) {
         whereClause.class_id = classId;
      }
      if (sectionId) {
         whereClause.section_id = sectionId;
      }
      if (academicYear) {
         whereClause.academic_year = academicYear;
      }
      if (studentStatus) {
         whereClause.student_status = studentStatus;
      }
      if (admissionStatus) {
         whereClause.admission_status = admissionStatus;
      }

      // Optional filters
      if (hasTransport !== undefined) {
         whereClause.transport_required = hasTransport;
      }
      if (hasHostel !== undefined) {
         whereClause.hostel_required = hasHostel;
      }
      if (hasScholarship !== undefined) {
         whereClause.scholarship = hasScholarship ? { [Op.gt]: 0 } : { [Op.or]: [null, 0] };
      }
      if (bloodGroup) {
         whereClause.blood_group = bloodGroup;
      }
      if (category) {
         whereClause.category = category;
      }

      // Date range filter
      if (dateRange && dateRange.start && dateRange.end) {
         whereClause.admission_date = {
            [Op.between]: [dateRange.start, dateRange.end],
         };
      }

      // Search term across multiple fields
      if (searchTerm) {
         whereClause[Op.or] = [
            { admission_number: { [Op.iLike]: `%${searchTerm}%` } },
            { father_name: { [Op.iLike]: `%${searchTerm}%` } },
            { mother_name: { [Op.iLike]: `%${searchTerm}%` } },
            { guardian_name: { [Op.iLike]: `%${searchTerm}%` } },
            { phone: { [Op.iLike]: `%${searchTerm}%` } },
            { '$user.name$': { [Op.iLike]: `%${searchTerm}%` } },
            { '$user.email$': { [Op.iLike]: `%${searchTerm}%` } },
         ];
      }

      return await this.findAll({
         where: whereClause,
         include: [
            {
               model: require('../database').User,
               as: 'user',
               attributes: ['id', 'name', 'email'],
            },
            {
               model: require('../database').Class,
               as: 'currentClass',
               attributes: ['id', 'name', 'grade'],
            },
            {
               model: require('../database').Section,
               as: 'currentSection',
               attributes: ['id', 'name'],
            },
         ],
         order: [['admission_number', 'ASC']],
      });
   },

   /**
    * Get count by various dimensions
    */
   getCountAnalytics: async function (schoolId, academicYear = null) {
      const whereClause = { school_id: schoolId };

      if (academicYear) {
         whereClause.academic_year = academicYear;
      }

      const analytics = {};

      // Count by class
      analytics.byClass = await this.findAll({
         where: whereClause,
         attributes: ['class_id', [require('sequelize').fn('COUNT', '*'), 'count']],
         group: ['class_id'],
         include: [
            {
               model: require('../database').Class,
               as: 'currentClass',
               attributes: ['name', 'grade'],
            },
         ],
         raw: false,
      });

      // Count by gender and category
      analytics.demographics = await this.findAll({
         where: whereClause,
         attributes: ['gender', 'category', [require('sequelize').fn('COUNT', '*'), 'count']],
         group: ['gender', 'category'],
         raw: true,
      });

      // Count with special services
      analytics.services = {
         transport: await this.count({
            where: { ...whereClause, transport_required: true },
         }),
         hostel: await this.count({
            where: { ...whereClause, hostel_required: true },
         }),
         scholarship: await this.count({
            where: { ...whereClause, scholarship: { [require('sequelize').Op.gt]: 0 } },
         }),
      };

      return analytics;
   },
};

module.exports = StudentStaticMethods;
