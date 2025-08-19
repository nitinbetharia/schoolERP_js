const logger = require('../../../utils/logger');
const { ValidationError, NotFoundError, DuplicateError, BusinessLogicError } = require('../../../utils/errors');

/**
 * Student Service
 * Handles complete student lifecycle management
 * This is the most critical service in the ERP system
 */
class StudentService {
   constructor() {
      this.defaultPassword = 'student123'; // Should be configurable
   }

   /**
    * Create a new student with complete admission workflow
    */
   async createStudent(tenantCode, studentData, createdBy) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { Student, User, School, Class, Section } = tenantModels;

         // Start transaction for atomic operation
         const transaction = await tenantModels.User.sequelize.transaction();

         try {
            // Validate required fields
            this.validateRequiredFields(studentData, 'create');

            // Validate school exists
            const school = await School.findByPk(studentData.school_id, { transaction });
            if (!school) {
               throw new NotFoundError('School not found');
            }

            // Validate class exists (if provided)
            if (studentData.class_id) {
               const classInstance = await Class.findOne({
                  where: {
                     id: studentData.class_id,
                     school_id: studentData.school_id,
                  },
                  transaction,
               });
               if (!classInstance) {
                  throw new NotFoundError('Class not found in the specified school');
               }
            }

            // Validate section exists (if provided)
            if (studentData.section_id) {
               const section = await Section.findOne({
                  where: {
                     id: studentData.section_id,
                     class_id: studentData.class_id,
                  },
                  transaction,
               });
               if (!section) {
                  throw new NotFoundError('Section not found in the specified class');
               }
            }

            // Check if admission number already exists
            if (studentData.admission_number) {
               const existingStudent = await Student.findOne({
                  where: { admission_number: studentData.admission_number },
                  transaction,
               });
               if (existingStudent) {
                  throw new DuplicateError('Admission number already exists');
               }
            }

            // Generate admission number if not provided
            if (!studentData.admission_number) {
               studentData.admission_number = await this.generateAdmissionNumber(
                  tenantCode,
                  studentData.school_id,
                  transaction
               );
            }

            // Create User account first
            const userData = {
               full_name: studentData.full_name || `${studentData.first_name} ${studentData.last_name}`,
               email: studentData.student_email || null,
               password: await this.hashPassword(studentData.password || this.defaultPassword),
               role: 'STUDENT',
               is_active: true,
            };

            const user = await User.create(userData, { transaction });

            // Create Student record
            const student = await Student.create(
               {
                  user_id: user.id,
                  admission_number: studentData.admission_number,
                  roll_number: studentData.roll_number,
                  school_id: studentData.school_id,
                  class_id: studentData.class_id,
                  section_id: studentData.section_id,
                  academic_year: studentData.academic_year || this.getCurrentAcademicYear(),
                  admission_date: studentData.admission_date || new Date(),
                  date_of_birth: studentData.date_of_birth,
                  gender: studentData.gender,
                  blood_group: studentData.blood_group,
                  category: studentData.category,
                  religion: studentData.religion,
                  nationality: studentData.nationality || 'Indian',
                  mother_tongue: studentData.mother_tongue,

                  // Address information
                  address: studentData.address,
                  city: studentData.city,
                  state: studentData.state,
                  postal_code: studentData.postal_code,
                  phone: studentData.phone,
                  email: studentData.email,

                  // Previous school information
                  previous_school: studentData.previous_school,
                  previous_class: studentData.previous_class,
                  transfer_certificate_number: studentData.transfer_certificate_number,

                  // Parent information
                  father_name: studentData.father_name,
                  father_phone: studentData.father_phone,
                  father_email: studentData.father_email,
                  father_occupation: studentData.father_occupation,
                  father_annual_income: studentData.father_annual_income,

                  mother_name: studentData.mother_name,
                  mother_phone: studentData.mother_phone,
                  mother_email: studentData.mother_email,
                  mother_occupation: studentData.mother_occupation,
                  mother_annual_income: studentData.mother_annual_income,

                  guardian_name: studentData.guardian_name,
                  guardian_phone: studentData.guardian_phone,
                  guardian_email: studentData.guardian_email,
                  guardian_relation: studentData.guardian_relation,
                  guardian_occupation: studentData.guardian_occupation,

                  // Emergency contact
                  emergency_contact_name: studentData.emergency_contact_name,
                  emergency_contact_phone: studentData.emergency_contact_phone,
                  emergency_contact_relation: studentData.emergency_contact_relation,

                  // Medical information
                  medical_conditions: studentData.medical_conditions,
                  allergies: studentData.allergies,
                  medications: studentData.medications,
                  doctor_name: studentData.doctor_name,
                  doctor_phone: studentData.doctor_phone,

                  // Transport and hostel
                  transport_required: studentData.transport_required || false,
                  transport_route: studentData.transport_route,
                  pickup_point: studentData.pickup_point,
                  drop_point: studentData.drop_point,
                  hostel_required: studentData.hostel_required || false,
                  hostel_block: studentData.hostel_block,
                  hostel_room_number: studentData.hostel_room_number,

                  // Academic information
                  stream: studentData.stream,
                  subjects: studentData.subjects,
                  fee_structure: studentData.fee_structure,
                  scholarship: studentData.scholarship,
                  scholarship_reason: studentData.scholarship_reason,

                  // Status
                  admission_status: studentData.admission_status || 'ENROLLED',
                  student_status: 'ACTIVE',

                  // Additional information
                  special_needs: studentData.special_needs,
                  talents: studentData.talents,
                  hobbies: studentData.hobbies,
                  remarks: studentData.remarks,

                  created_by: createdBy,
               },
               { transaction }
            );

            // Update section strength if assigned to section
            if (studentData.section_id) {
               await this.updateSectionStrength(studentData.section_id, 'INCREMENT', transaction);
            }

            await transaction.commit();

            logger.info('Student Service Event', {
               service: 'student-service',
               category: 'STUDENT',
               event: 'Student created successfully',
               tenant_code: tenantCode,
               student_id: student.id,
               admission_number: student.admission_number,
               user_id: user.id,
               created_by: createdBy,
            });

            return {
               student: await this.getStudentDetails(tenantCode, student.id),
               credentials: {
                  username: user.email || student.admission_number,
                  password: studentData.password || this.defaultPassword,
               },
            };
         } catch (error) {
            await transaction.rollback();
            throw error;
         }
      } catch (error) {
         logger.error('Student Service Error', {
            service: 'student-service',
            category: 'STUDENT',
            event: 'Student creation failed',
            tenant_code: tenantCode,
            error: error.message,
            created_by: createdBy,
         });
         throw error;
      }
   }

   /**
    * Get students with filtering and pagination
    */
   async getStudents(tenantCode, options = {}) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { Student, User, School, Class, Section } = tenantModels;

         const {
            school_id,
            class_id,
            section_id,
            academic_year,
            student_status,
            admission_status,
            gender,
            search,
            page = 1,
            limit = 50,
            include_inactive = false,
         } = options;

         // Build where conditions
         const whereConditions = {};

         if (school_id) whereConditions.school_id = school_id;
         if (class_id) whereConditions.class_id = class_id;
         if (section_id) whereConditions.section_id = section_id;
         if (academic_year) whereConditions.academic_year = academic_year;
         if (student_status) whereConditions.student_status = student_status;
         if (admission_status) whereConditions.admission_status = admission_status;
         if (gender) whereConditions.gender = gender;

         if (!include_inactive) {
            whereConditions.student_status = whereConditions.student_status || 'ACTIVE';
         }

         // Search functionality
         let searchConditions = [];
         if (search) {
            const { Op } = require('sequelize');
            searchConditions = [
               { admission_number: { [Op.like]: `%${search}%` } },
               { roll_number: { [Op.like]: `%${search}%` } },
               { father_name: { [Op.like]: `%${search}%` } },
               { mother_name: { [Op.like]: `%${search}%` } },
               { phone: { [Op.like]: `%${search}%` } },
            ];
         }

         const offset = (page - 1) * limit;

         const students = await Student.findAndCountAll({
            where:
               searchConditions.length > 0
                  ? {
                       [require('sequelize').Op.and]: [
                          whereConditions,
                          { [require('sequelize').Op.or]: searchConditions },
                       ],
                    }
                  : whereConditions,
            include: [
               {
                  model: User,
                  as: 'user',
                  attributes: ['id', 'full_name', 'email', 'is_active', 'last_login_at'],
               },
               {
                  model: School,
                  as: 'school',
                  attributes: ['id', 'name', 'code'],
               },
               {
                  model: Class,
                  as: 'class',
                  attributes: ['id', 'name', 'level', 'category'],
               },
               {
                  model: Section,
                  as: 'section',
                  attributes: ['id', 'name'],
               },
            ],
            order: [
               ['admission_date', 'DESC'],
               ['admission_number', 'ASC'],
            ],
            offset,
            limit,
         });

         logger.info('Student Service Event', {
            service: 'student-service',
            category: 'STUDENT',
            event: 'Students retrieved successfully',
            tenant_code: tenantCode,
            count: students.count,
            page,
            limit,
         });

         return {
            students: students.rows.map(this.formatStudentResponse),
            pagination: {
               total: students.count,
               page,
               limit,
               pages: Math.ceil(students.count / limit),
            },
         };
      } catch (error) {
         logger.error('Student Service Error', {
            service: 'student-service',
            category: 'STUDENT',
            event: 'Students retrieval failed',
            tenant_code: tenantCode,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Get student by ID with complete details
    */
   async getStudentById(tenantCode, studentId) {
      try {
         const student = await this.getStudentDetails(tenantCode, studentId);

         if (!student) {
            throw new NotFoundError('Student not found');
         }

         logger.info('Student Service Event', {
            service: 'student-service',
            category: 'STUDENT',
            event: 'Student retrieved successfully',
            tenant_code: tenantCode,
            student_id: studentId,
         });

         return { student };
      } catch (error) {
         logger.error('Student Service Error', {
            service: 'student-service',
            category: 'STUDENT',
            event: 'Student retrieval failed',
            tenant_code: tenantCode,
            student_id: studentId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Update student information
    */
   async updateStudent(tenantCode, studentId, studentData, updatedBy) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { Student, User, Class, Section } = tenantModels;

         const transaction = await tenantModels.User.sequelize.transaction();

         try {
            const student = await Student.findByPk(studentId, {
               include: [{ model: User, as: 'user' }],
               transaction,
            });

            if (!student) {
               throw new NotFoundError('Student not found');
            }

            // Check if changing class/section
            const oldClassId = student.class_id;
            const oldSectionId = student.section_id;

            // Validate new class/section if being changed
            if (studentData.class_id && studentData.class_id !== oldClassId) {
               const classInstance = await Class.findOne({
                  where: {
                     id: studentData.class_id,
                     school_id: student.school_id,
                  },
                  transaction,
               });
               if (!classInstance) {
                  throw new NotFoundError('New class not found in the same school');
               }
            }

            if (studentData.section_id && studentData.section_id !== oldSectionId) {
               const section = await Section.findOne({
                  where: {
                     id: studentData.section_id,
                     class_id: studentData.class_id || student.class_id,
                  },
                  transaction,
               });
               if (!section) {
                  throw new NotFoundError('New section not found in the specified class');
               }
            }

            // Update User information if provided
            if (studentData.full_name || studentData.email) {
               await student.user.update(
                  {
                     full_name: studentData.full_name,
                     email: studentData.email,
                     updated_by: updatedBy,
                  },
                  { transaction }
               );
            }

            // Update Student information
            await student.update(
               {
                  ...studentData,
                  updated_by: updatedBy,
               },
               { transaction }
            );

            // Update section strengths if section changed
            if (oldSectionId !== studentData.section_id) {
               if (oldSectionId) {
                  await this.updateSectionStrength(oldSectionId, 'DECREMENT', transaction);
               }
               if (studentData.section_id) {
                  await this.updateSectionStrength(studentData.section_id, 'INCREMENT', transaction);
               }
            }

            await transaction.commit();

            logger.info('Student Service Event', {
               service: 'student-service',
               category: 'STUDENT',
               event: 'Student updated successfully',
               tenant_code: tenantCode,
               student_id: studentId,
               updated_by: updatedBy,
            });

            return {
               student: await this.getStudentDetails(tenantCode, studentId),
            };
         } catch (error) {
            await transaction.rollback();
            throw error;
         }
      } catch (error) {
         logger.error('Student Service Error', {
            service: 'student-service',
            category: 'STUDENT',
            event: 'Student update failed',
            tenant_code: tenantCode,
            student_id: studentId,
            error: error.message,
            updated_by: updatedBy,
         });
         throw error;
      }
   }

   /**
    * Transfer student to different school/class/section
    */
   async transferStudent(tenantCode, studentId, transferData, updatedBy) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { Student, StudentEnrollment, School, Class, Section } = tenantModels;

         const transaction = await tenantModels.User.sequelize.transaction();

         try {
            const student = await Student.findByPk(studentId, { transaction });
            if (!student) {
               throw new NotFoundError('Student not found');
            }

            // If transferring to different school
            if (transferData.to_school_id && transferData.to_school_id !== student.school_id) {
               // Create enrollment record for previous school
               await StudentEnrollment.create(
                  {
                     student_id: studentId,
                     school_id: student.school_id,
                     class_id: student.class_id,
                     section_id: student.section_id,
                     academic_year: student.academic_year,
                     enrollment_date: student.admission_date,
                     end_date: transferData.transfer_date || new Date(),
                     status: 'TRANSFERRED',
                     remarks: transferData.reason,
                     created_by: updatedBy,
                  },
                  { transaction }
               );

               // Update student with new school details
               await student.update(
                  {
                     school_id: transferData.to_school_id,
                     class_id: transferData.to_class_id || null,
                     section_id: transferData.to_section_id || null,
                     student_status: 'ACTIVE',
                     transfer_date: transferData.transfer_date || new Date(),
                     transfer_reason: transferData.reason,
                     transfer_to_school: transferData.to_school_name,
                     updated_by: updatedBy,
                  },
                  { transaction }
               );
            } else {
               // Internal transfer within same school
               await student.update(
                  {
                     class_id: transferData.to_class_id || student.class_id,
                     section_id: transferData.to_section_id || student.section_id,
                     remarks: `${student.remarks || ''} Transfer: ${transferData.reason}`,
                     updated_by: updatedBy,
                  },
                  { transaction }
               );
            }

            await transaction.commit();

            logger.info('Student Service Event', {
               service: 'student-service',
               category: 'STUDENT',
               event: 'Student transferred successfully',
               tenant_code: tenantCode,
               student_id: studentId,
               transfer_type: transferData.to_school_id !== student.school_id ? 'EXTERNAL' : 'INTERNAL',
               updated_by: updatedBy,
            });

            return {
               student: await this.getStudentDetails(tenantCode, studentId),
            };
         } catch (error) {
            await transaction.rollback();
            throw error;
         }
      } catch (error) {
         logger.error('Student Service Error', {
            service: 'student-service',
            category: 'STUDENT',
            event: 'Student transfer failed',
            tenant_code: tenantCode,
            student_id: studentId,
            error: error.message,
            updated_by: updatedBy,
         });
         throw error;
      }
   }

   /**
    * Promote student to next class
    */
   async promoteStudent(tenantCode, studentId, promotionData, updatedBy) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { Student, StudentEnrollment, Class } = tenantModels;

         const transaction = await tenantModels.User.sequelize.transaction();

         try {
            const student = await Student.findByPk(studentId, { transaction });
            if (!student) {
               throw new NotFoundError('Student not found');
            }

            // Validate new class exists
            const newClass = await Class.findByPk(promotionData.to_class_id, { transaction });
            if (!newClass) {
               throw new NotFoundError('Promotion class not found');
            }

            // Create enrollment record for completed class
            await StudentEnrollment.create(
               {
                  student_id: studentId,
                  school_id: student.school_id,
                  class_id: student.class_id,
                  section_id: student.section_id,
                  academic_year: student.academic_year,
                  enrollment_date: student.admission_date,
                  end_date: promotionData.promotion_date || new Date(),
                  status: 'PROMOTED',
                  promotion_status: promotionData.promotion_status || 'PROMOTED',
                  final_grade: promotionData.final_grade,
                  attendance_percentage: promotionData.attendance_percentage,
                  remarks: promotionData.remarks,
                  created_by: updatedBy,
               },
               { transaction }
            );

            // Update student with new class
            await student.update(
               {
                  class_id: promotionData.to_class_id,
                  section_id: promotionData.to_section_id || null,
                  academic_year: promotionData.new_academic_year,
                  roll_number: null, // Reset roll number for new class
                  updated_by: updatedBy,
               },
               { transaction }
            );

            await transaction.commit();

            logger.info('Student Service Event', {
               service: 'student-service',
               category: 'STUDENT',
               event: 'Student promoted successfully',
               tenant_code: tenantCode,
               student_id: studentId,
               from_class_id: student.class_id,
               to_class_id: promotionData.to_class_id,
               updated_by: updatedBy,
            });

            return {
               student: await this.getStudentDetails(tenantCode, studentId),
            };
         } catch (error) {
            await transaction.rollback();
            throw error;
         }
      } catch (error) {
         logger.error('Student Service Error', {
            service: 'student-service',
            category: 'STUDENT',
            event: 'Student promotion failed',
            tenant_code: tenantCode,
            student_id: studentId,
            error: error.message,
            updated_by: updatedBy,
         });
         throw error;
      }
   }

   /**
    * Get student enrollment history
    */
   async getStudentEnrollments(tenantCode, studentId) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { StudentEnrollment, School, Class, Section } = tenantModels;

         const enrollments = await StudentEnrollment.findAll({
            where: { student_id: studentId },
            include: [
               {
                  model: School,
                  as: 'school',
                  attributes: ['id', 'name', 'code'],
               },
               {
                  model: Class,
                  as: 'class',
                  attributes: ['id', 'name', 'level', 'category'],
               },
               {
                  model: Section,
                  as: 'section',
                  attributes: ['id', 'name'],
               },
            ],
            order: [['enrollment_date', 'DESC']],
         });

         logger.info('Student Service Event', {
            service: 'student-service',
            category: 'STUDENT',
            event: 'Student enrollments retrieved successfully',
            tenant_code: tenantCode,
            student_id: studentId,
            count: enrollments.length,
         });

         return {
            enrollments: enrollments.map((enrollment) => ({
               id: enrollment.id,
               school: enrollment.school,
               class: enrollment.class,
               section: enrollment.section,
               academic_year: enrollment.academic_year,
               enrollment_date: enrollment.enrollment_date,
               end_date: enrollment.end_date,
               roll_number: enrollment.roll_number,
               status: enrollment.status,
               promotion_status: enrollment.promotion_status,
               final_grade: enrollment.final_grade,
               attendance_percentage: enrollment.attendance_percentage,
               remarks: enrollment.remarks,
               created_at: enrollment.created_at,
            })),
         };
      } catch (error) {
         logger.error('Student Service Error', {
            service: 'student-service',
            category: 'STUDENT',
            event: 'Student enrollments retrieval failed',
            tenant_code: tenantCode,
            student_id: studentId,
            error: error.message,
         });
         throw error;
      }
   }

   // Helper methods
   validateRequiredFields(data, operation = 'create') {
      const required = ['full_name', 'date_of_birth', 'gender', 'school_id'];

      if (operation === 'create') {
         required.push('admission_date');
      }

      for (const field of required) {
         if (!data[field]) {
            throw new ValidationError(`${field} is required`);
         }
      }

      // Validate email format if provided
      if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
         throw new ValidationError('Invalid email format');
      }

      // Validate date of birth is not in future
      if (data.date_of_birth && new Date(data.date_of_birth) > new Date()) {
         throw new ValidationError('Date of birth cannot be in the future');
      }
   }

   async generateAdmissionNumber(tenantCode, schoolId, transaction) {
      // Generate admission number based on school and current year
      const year = new Date().getFullYear().toString().slice(-2);
      const { getTenantModels } = require('../../../models');
      const tenantModels = await getTenantModels(tenantCode);
      const { Student, School } = tenantModels;

      const school = await School.findByPk(schoolId, { transaction });
      const schoolCode = school.code.substring(0, 3).toUpperCase();

      // Find the last admission number for this school
      const lastStudent = await Student.findOne({
         where: { school_id: schoolId },
         order: [['admission_number', 'DESC']],
         transaction,
      });

      let sequence = 1;
      if (lastStudent && lastStudent.admission_number) {
         const lastSequence = parseInt(lastStudent.admission_number.slice(-4));
         sequence = lastSequence + 1;
      }

      return `${schoolCode}${year}${sequence.toString().padStart(4, '0')}`;
   }

   async hashPassword(password) {
      const bcrypt = require('bcrypt');
      return await bcrypt.hash(password, 10);
   }

   getCurrentAcademicYear() {
      const now = new Date();
      const currentYear = now.getFullYear();
      const month = now.getMonth() + 1;

      // If current month is April or later, academic year is current-next
      // Otherwise, it's previous-current
      if (month >= 4) {
         return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
      } else {
         return `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
      }
   }

   async updateSectionStrength(sectionId, operation, transaction) {
      const { getTenantModels } = require('../../../models');
      const tenantModels = await getTenantModels(process.env.TENANT_CODE); // Assuming tenant code is available
      const { Section } = tenantModels;

      const section = await Section.findByPk(sectionId, { transaction });
      if (section) {
         const increment = operation === 'INCREMENT' ? 1 : -1;
         const newStrength = Math.max(0, (section.current_strength || 0) + increment);
         await section.update({ current_strength: newStrength }, { transaction });
      }
   }

   async getStudentDetails(tenantCode, studentId) {
      const { getTenantModels } = require('../../../models');
      const tenantModels = await getTenantModels(tenantCode);
      const { Student, User, School, Class, Section } = tenantModels;

      const student = await Student.findByPk(studentId, {
         include: [
            {
               model: User,
               as: 'user',
               attributes: ['id', 'full_name', 'email', 'is_active', 'last_login_at'],
            },
            {
               model: School,
               as: 'school',
               attributes: ['id', 'name', 'code', 'address', 'city', 'phone'],
            },
            {
               model: Class,
               as: 'class',
               attributes: ['id', 'name', 'level', 'category'],
            },
            {
               model: Section,
               as: 'section',
               attributes: ['id', 'name', 'capacity'],
            },
         ],
      });

      return student ? this.formatStudentResponse(student) : null;
   }

   formatStudentResponse(student) {
      return {
         id: student.id,
         user_id: student.user_id,
         admission_number: student.admission_number,
         roll_number: student.roll_number,
         user: student.user,
         school: student.school,
         class: student.class,
         section: student.section,
         academic_year: student.academic_year,
         admission_date: student.admission_date,
         date_of_birth: student.date_of_birth,
         gender: student.gender,
         blood_group: student.blood_group,
         category: student.category,
         religion: student.religion,
         nationality: student.nationality,
         mother_tongue: student.mother_tongue,
         address: student.address,
         city: student.city,
         state: student.state,
         postal_code: student.postal_code,
         phone: student.phone,
         email: student.email,
         father_name: student.father_name,
         father_phone: student.father_phone,
         father_email: student.father_email,
         mother_name: student.mother_name,
         mother_phone: student.mother_phone,
         mother_email: student.mother_email,
         guardian_name: student.guardian_name,
         guardian_phone: student.guardian_phone,
         emergency_contact_name: student.emergency_contact_name,
         emergency_contact_phone: student.emergency_contact_phone,
         medical_conditions: student.medical_conditions,
         allergies: student.allergies,
         transport_required: student.transport_required,
         hostel_required: student.hostel_required,
         admission_status: student.admission_status,
         student_status: student.student_status,
         created_at: student.created_at,
         updated_at: student.updated_at,
      };
   }
}

module.exports = StudentService;
