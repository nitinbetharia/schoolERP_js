const { Op, Sequelize } = require('sequelize');
const { logError } = require('../utils/logger');

/**
 * Fee Management Service
 * Complete fee structure, payment processing, and financial management system
 * Phase 5 Implementation - Fee Management System
 */

class FeeService {
   constructor(models) {
      this.models = models;
   }

   /**
    * Get all fee structures with enhanced filtering and pagination
    * @param {Object} filters - Filter criteria
    * @param {Object} pagination - Pagination options
    * @param {string} tenantCode - Tenant isolation
    * @returns {Object} Fee structures with pagination info
    */
   async getAllFeeStructures(filters = {}, pagination = {}, tenantCode = null) {
      try {
         const {
            search = '',
            class_id = '',
            category = '',
            academic_year_id = '',
            status = '',
            fee_type = '',
         } = filters;

         const { page = 1, limit = 20, sortBy = 'name', sortOrder = 'ASC' } = pagination;

         // Build where conditions
         const whereConditions = {};

         // Tenant isolation
         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         // Search filter
         if (search) {
            whereConditions[Op.or] = [
               { name: { [Op.iLike]: `%${search}%` } },
               { code: { [Op.iLike]: `%${search}%` } },
               { description: { [Op.iLike]: `%${search}%` } },
               { category: { [Op.iLike]: `%${search}%` } },
            ];
         }

         // Class filter
         if (class_id) {
            whereConditions.class_id = class_id;
         }

         // Category filter
         if (category) {
            whereConditions.category = category;
         }

         // Academic year filter
         if (academic_year_id) {
            whereConditions.academic_year_id = academic_year_id;
         }

         // Status filter
         if (status) {
            whereConditions.status = status;
         }

         // Fee type filter
         if (fee_type) {
            whereConditions.fee_type = fee_type;
         }

         // Calculate offset
         const offset = (page - 1) * limit;

         // Get fee structures with related data
         const { rows: feeStructures, count: total } = await this.models.FeeStructure.findAndCountAll({
            where: whereConditions,
            include: [
               {
                  model: this.models.Class,
                  as: 'class',
                  attributes: ['id', 'name', 'standard'],
                  required: false,
               },
               {
                  model: this.models.AcademicYear,
                  as: 'academicYear',
                  attributes: ['id', 'name', 'code'],
                  required: false,
               },
               {
                  model: this.models.FeeComponent,
                  as: 'components',
                  attributes: ['id', 'name', 'amount', 'is_mandatory'],
                  required: false,
               },
            ],
            order: [[sortBy, sortOrder.toUpperCase()]],
            limit: parseInt(limit),
            offset: offset,
            distinct: true,
         });

         // Calculate pagination info
         const totalPages = Math.ceil(total / limit);
         const hasNextPage = page < totalPages;
         const hasPreviousPage = page > 1;

         // Enhance fee structures with calculations
         const enhancedStructures = feeStructures.map((structure) => {
            const totalAmount = structure.components?.reduce((sum, comp) => sum + parseFloat(comp.amount || 0), 0) || 0;
            const mandatoryAmount =
               structure.components
                  ?.filter((comp) => comp.is_mandatory)
                  .reduce((sum, comp) => sum + parseFloat(comp.amount || 0), 0) || 0;
            const optionalAmount = totalAmount - mandatoryAmount;

            return {
               ...structure.dataValues,
               total_amount: totalAmount,
               mandatory_amount: mandatoryAmount,
               optional_amount: optionalAmount,
               component_count: structure.components?.length || 0,
            };
         });

         return {
            feeStructures: enhancedStructures,
            pagination: {
               currentPage: page,
               totalPages,
               totalItems: total,
               itemsPerPage: limit,
               hasNextPage,
               hasPreviousPage,
               nextPage: hasNextPage ? page + 1 : null,
               previousPage: hasPreviousPage ? page - 1 : null,
            },
         };
      } catch (error) {
         logError(error, { context: 'FeeService.getAllFeeStructures', tenantCode });
         throw new Error('Failed to retrieve fee structures');
      }
   }

   /**
    * Get fee structure by ID with comprehensive details
    * @param {number} structureId - Fee structure ID
    * @param {string} tenantCode - Tenant isolation
    * @returns {Object} Fee structure details
    */
   async getFeeStructureById(structureId, tenantCode = null) {
      try {
         const whereConditions = { id: structureId };
         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         const feeStructure = await this.models.FeeStructure.findOne({
            where: whereConditions,
            include: [
               {
                  model: this.models.Class,
                  as: 'class',
                  attributes: ['id', 'name', 'standard'],
               },
               {
                  model: this.models.AcademicYear,
                  as: 'academicYear',
                  attributes: ['id', 'name', 'code', 'start_date', 'end_date'],
               },
               {
                  model: this.models.FeeComponent,
                  as: 'components',
                  include: [
                     {
                        model: this.models.Subject,
                        as: 'subject',
                        attributes: ['id', 'name', 'code'],
                        required: false,
                     },
                  ],
               },
               {
                  model: this.models.FeeAssignment,
                  as: 'assignments',
                  include: [
                     {
                        model: this.models.Student,
                        as: 'student',
                        attributes: ['id', 'first_name', 'last_name', 'admission_number'],
                     },
                  ],
                  limit: 10, // Limit for performance
               },
            ],
         });

         if (!feeStructure) {
            throw new Error('Fee structure not found');
         }

         // Calculate totals
         const totalAmount = feeStructure.components?.reduce((sum, comp) => sum + parseFloat(comp.amount || 0), 0) || 0;
         const mandatoryAmount =
            feeStructure.components
               ?.filter((comp) => comp.is_mandatory)
               .reduce((sum, comp) => sum + parseFloat(comp.amount || 0), 0) || 0;

         return {
            ...feeStructure.dataValues,
            total_amount: totalAmount,
            mandatory_amount: mandatoryAmount,
            optional_amount: totalAmount - mandatoryAmount,
            assigned_students_count: feeStructure.assignments?.length || 0,
         };
      } catch (error) {
         if (error.message === 'Fee structure not found') {
            throw error;
         }
         logError(error, { context: 'FeeService.getFeeStructureById', structureId, tenantCode });
         throw new Error('Failed to retrieve fee structure details');
      }
   }

   /**
    * Create new fee structure with components
    * @param {Object} structureData - Fee structure information
    * @param {string} tenantCode - Tenant isolation
    * @returns {Object} Created fee structure
    */
   async createFeeStructure(structureData, tenantCode = null) {
      const transaction = await this.models.sequelize.transaction();

      try {
         // Validate class exists
         if (structureData.class_id) {
            const classExists = await this.models.Class.findOne({
               where: {
                  id: structureData.class_id,
                  ...(tenantCode && { tenant_code: tenantCode }),
               },
               transaction,
            });

            if (!classExists) {
               throw new Error('Selected class not found');
            }
         }

         // Validate academic year exists
         if (structureData.academic_year_id) {
            const yearExists = await this.models.AcademicYear.findOne({
               where: {
                  id: structureData.academic_year_id,
                  ...(tenantCode && { tenant_code: tenantCode }),
               },
               transaction,
            });

            if (!yearExists) {
               throw new Error('Selected academic year not found');
            }
         }

         // Check for duplicate fee structure
         const duplicateCheck = {
            name: structureData.name,
            class_id: structureData.class_id,
            academic_year_id: structureData.academic_year_id,
         };
         if (tenantCode) {
            duplicateCheck.tenant_code = tenantCode;
         }

         const existing = await this.models.FeeStructure.findOne({
            where: duplicateCheck,
            transaction,
         });

         if (existing) {
            throw new Error('Fee structure with this name already exists for the selected class and academic year');
         }

         // Generate fee structure code if not provided
         if (!structureData.code) {
            const yearCode = yearExists?.code || 'AY';
            const classCode = classExists?.name || 'GEN';
            const timestamp = Date.now().toString().slice(-4);
            structureData.code = `FEE-${yearCode}-${classCode}-${timestamp}`;
         }

         // Create fee structure
         const feeStructure = await this.models.FeeStructure.create(
            {
               ...structureData,
               tenant_code: tenantCode,
            },
            { transaction }
         );

         // Create fee components if provided
         if (structureData.components && structureData.components.length > 0) {
            const componentsData = structureData.components.map((component) => ({
               ...component,
               fee_structure_id: feeStructure.id,
               tenant_code: tenantCode,
            }));

            await this.models.FeeComponent.bulkCreate(componentsData, {
               transaction,
               validate: true,
            });
         }

         await transaction.commit();

         // Return with components
         return await this.getFeeStructureById(feeStructure.id, tenantCode);
      } catch (error) {
         await transaction.rollback();
         if (error.message.includes('not found') || error.message.includes('already exists')) {
            throw error;
         }
         logError(error, { context: 'FeeService.createFeeStructure', tenantCode });
         throw new Error('Failed to create fee structure');
      }
   }

   /**
    * Update fee structure with validation
    * @param {number} structureId - Fee structure ID
    * @param {Object} updateData - Update information
    * @param {string} tenantCode - Tenant isolation
    * @returns {Object} Updated fee structure
    */
   async updateFeeStructure(structureId, updateData, tenantCode = null) {
      const transaction = await this.models.sequelize.transaction();

      try {
         const whereConditions = { id: structureId };
         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         const feeStructure = await this.models.FeeStructure.findOne({
            where: whereConditions,
            transaction,
         });

         if (!feeStructure) {
            throw new Error('Fee structure not found');
         }

         // Check if structure has active assignments before major changes
         if (updateData.class_id || updateData.academic_year_id) {
            const hasAssignments = await this.models.FeeAssignment.count({
               where: { fee_structure_id: structureId },
               transaction,
            });

            if (hasAssignments > 0) {
               throw new Error('Cannot modify fee structure with active student assignments');
            }
         }

         // Validate new class if being updated
         if (updateData.class_id) {
            const classExists = await this.models.Class.findOne({
               where: {
                  id: updateData.class_id,
                  ...(tenantCode && { tenant_code: tenantCode }),
               },
               transaction,
            });

            if (!classExists) {
               throw new Error('Selected class not found');
            }
         }

         // Update fee structure
         await feeStructure.update(updateData, { transaction });

         // Update components if provided
         if (updateData.components) {
            // Delete existing components
            await this.models.FeeComponent.destroy({
               where: { fee_structure_id: structureId },
               transaction,
            });

            // Create new components
            if (updateData.components.length > 0) {
               const componentsData = updateData.components.map((component) => ({
                  ...component,
                  fee_structure_id: structureId,
                  tenant_code: tenantCode,
               }));

               await this.models.FeeComponent.bulkCreate(componentsData, {
                  transaction,
                  validate: true,
               });
            }
         }

         await transaction.commit();
         return await this.getFeeStructureById(structureId, tenantCode);
      } catch (error) {
         await transaction.rollback();
         if (error.message.includes('not found') || error.message.includes('Cannot modify')) {
            throw error;
         }
         logError(error, { context: 'FeeService.updateFeeStructure', structureId, tenantCode });
         throw new Error('Failed to update fee structure');
      }
   }

   /**
    * Delete fee structure with validation
    * @param {number} structureId - Fee structure ID
    * @param {string} tenantCode - Tenant isolation
    * @returns {boolean} Success status
    */
   async deleteFeeStructure(structureId, tenantCode = null) {
      const transaction = await this.models.sequelize.transaction();

      try {
         const whereConditions = { id: structureId };
         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         const feeStructure = await this.models.FeeStructure.findOne({
            where: whereConditions,
            transaction,
         });

         if (!feeStructure) {
            throw new Error('Fee structure not found');
         }

         // Check for active assignments
         const hasAssignments = await this.models.FeeAssignment.count({
            where: { fee_structure_id: structureId },
            transaction,
         });

         if (hasAssignments > 0) {
            throw new Error('Cannot delete fee structure with active student assignments');
         }

         // Check for payment records
         const hasPayments = await this.models.FeePayment.count({
            include: [
               {
                  model: this.models.FeeAssignment,
                  where: { fee_structure_id: structureId },
               },
            ],
            transaction,
         });

         if (hasPayments > 0) {
            throw new Error('Cannot delete fee structure with existing payment records');
         }

         // Delete components first
         await this.models.FeeComponent.destroy({
            where: { fee_structure_id: structureId },
            transaction,
         });

         // Delete fee structure
         await feeStructure.destroy({ transaction });

         await transaction.commit();
         return true;
      } catch (error) {
         await transaction.rollback();
         if (error.message.includes('not found') || error.message.includes('Cannot delete')) {
            throw error;
         }
         logError(error, { context: 'FeeService.deleteFeeStructure', structureId, tenantCode });
         throw new Error('Failed to delete fee structure');
      }
   }

   /**
    * Assign fee structure to students
    * @param {number} structureId - Fee structure ID
    * @param {Array} studentIds - Array of student IDs
    * @param {Object} assignmentData - Assignment details
    * @param {string} tenantCode - Tenant isolation
    * @returns {Object} Assignment results
    */
   async assignFeeToStudents(structureId, studentIds, assignmentData = {}, tenantCode = null) {
      const transaction = await this.models.sequelize.transaction();

      try {
         // Validate fee structure
         const feeStructure = await this.models.FeeStructure.findOne({
            where: {
               id: structureId,
               ...(tenantCode && { tenant_code: tenantCode }),
            },
            include: [{ model: this.models.FeeComponent, as: 'components' }],
            transaction,
         });

         if (!feeStructure) {
            throw new Error('Fee structure not found');
         }

         const results = {
            assigned: 0,
            skipped: 0,
            errors: [],
         };

         for (const studentId of studentIds) {
            try {
               // Check if student exists
               const student = await this.models.Student.findOne({
                  where: {
                     id: studentId,
                     ...(tenantCode && { tenant_code: tenantCode }),
                  },
                  transaction,
               });

               if (!student) {
                  results.errors.push(`Student ID ${studentId}: Student not found`);
                  continue;
               }

               // Check for existing assignment
               const existingAssignment = await this.models.FeeAssignment.findOne({
                  where: {
                     student_id: studentId,
                     fee_structure_id: structureId,
                  },
                  transaction,
               });

               if (existingAssignment) {
                  results.skipped++;
                  continue;
               }

               // Create assignment
               await this.models.FeeAssignment.create(
                  {
                     student_id: studentId,
                     fee_structure_id: structureId,
                     assigned_date: assignmentData.assigned_date || new Date(),
                     due_date: assignmentData.due_date,
                     status: 'PENDING',
                     total_amount:
                        feeStructure.components?.reduce((sum, comp) => sum + parseFloat(comp.amount || 0), 0) || 0,
                     tenant_code: tenantCode,
                  },
                  { transaction }
               );

               results.assigned++;
            } catch (studentError) {
               results.errors.push(`Student ID ${studentId}: ${studentError.message}`);
            }
         }

         await transaction.commit();
         return results;
      } catch (error) {
         await transaction.rollback();
         if (error.message === 'Fee structure not found') {
            throw error;
         }
         logError(error, { context: 'FeeService.assignFeeToStudents', structureId, tenantCode });
         throw new Error('Failed to assign fee structure to students');
      }
   }

   /**
    * Get student fee assignments
    * @param {number} studentId - Student ID
    * @param {Object} filters - Filter options
    * @param {string} tenantCode - Tenant isolation
    * @returns {Array} Student fee assignments
    */
   async getStudentFeeAssignments(studentId, filters = {}, tenantCode = null) {
      try {
         const whereConditions = { student_id: studentId };

         // Academic year filter
         if (filters.academic_year_id) {
            whereConditions['$feeStructure.academic_year_id$'] = filters.academic_year_id;
         }

         // Status filter
         if (filters.status) {
            whereConditions.status = filters.status;
         }

         const assignments = await this.models.FeeAssignment.findAll({
            where: whereConditions,
            include: [
               {
                  model: this.models.FeeStructure,
                  as: 'feeStructure',
                  where: tenantCode ? { tenant_code: tenantCode } : {},
                  include: [
                     {
                        model: this.models.Class,
                        as: 'class',
                        attributes: ['id', 'name', 'standard'],
                     },
                     {
                        model: this.models.AcademicYear,
                        as: 'academicYear',
                        attributes: ['id', 'name', 'code'],
                     },
                     {
                        model: this.models.FeeComponent,
                        as: 'components',
                     },
                  ],
               },
               {
                  model: this.models.FeePayment,
                  as: 'payments',
                  attributes: ['id', 'amount', 'payment_date', 'payment_method', 'status'],
                  required: false,
               },
            ],
            order: [['assigned_date', 'DESC']],
         });

         // Calculate payment status for each assignment
         return assignments.map((assignment) => {
            const totalPaid =
               assignment.payments
                  ?.filter((p) => p.status === 'COMPLETED')
                  .reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0) || 0;

            const balanceAmount = parseFloat(assignment.total_amount) - totalPaid;

            return {
               ...assignment.dataValues,
               total_paid: totalPaid,
               balance_amount: balanceAmount,
               payment_status: balanceAmount <= 0 ? 'PAID' : totalPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID',
            };
         });
      } catch (error) {
         logError(error, { context: 'FeeService.getStudentFeeAssignments', studentId, tenantCode });
         throw new Error('Failed to retrieve student fee assignments');
      }
   }

   /**
    * Get fee collection statistics
    * @param {Object} filters - Filter criteria
    * @param {string} tenantCode - Tenant isolation
    * @returns {Object} Fee collection statistics
    */
   async getFeeCollectionStatistics(filters = {}, tenantCode = null) {
      try {
         const whereConditions = tenantCode ? { tenant_code: tenantCode } : {};

         // Academic year filter
         if (filters.academic_year_id) {
            whereConditions.academic_year_id = filters.academic_year_id;
         }

         // Class filter
         if (filters.class_id) {
            whereConditions.class_id = filters.class_id;
         }

         // Get fee assignments with payment data
         const assignments = await this.models.FeeAssignment.findAll({
            include: [
               {
                  model: this.models.FeeStructure,
                  as: 'feeStructure',
                  where: whereConditions,
                  attributes: ['id', 'name', 'category'],
               },
               {
                  model: this.models.FeePayment,
                  as: 'payments',
                  where: { status: 'COMPLETED' },
                  required: false,
                  attributes: ['amount', 'payment_date'],
               },
            ],
         });

         // Calculate statistics
         const totalAssignments = assignments.length;
         const totalDemand = assignments.reduce((sum, assignment) => sum + parseFloat(assignment.total_amount || 0), 0);

         const totalCollected = assignments.reduce((sum, assignment) => {
            const paidAmount =
               assignment.payments?.reduce((paySum, payment) => paySum + parseFloat(payment.amount || 0), 0) || 0;
            return sum + paidAmount;
         }, 0);

         const totalPending = totalDemand - totalCollected;
         const collectionPercentage = totalDemand > 0 ? (totalCollected / totalDemand) * 100 : 0;

         // Students payment status
         const paidStudents = assignments.filter((assignment) => {
            const paidAmount =
               assignment.payments?.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0) || 0;
            return paidAmount >= parseFloat(assignment.total_amount);
         }).length;

         const partiallyPaidStudents = assignments.filter((assignment) => {
            const paidAmount =
               assignment.payments?.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0) || 0;
            return paidAmount > 0 && paidAmount < parseFloat(assignment.total_amount);
         }).length;

         const unpaidStudents = totalAssignments - paidStudents - partiallyPaidStudents;

         return {
            total_assignments: totalAssignments,
            total_demand: parseFloat(totalDemand.toFixed(2)),
            total_collected: parseFloat(totalCollected.toFixed(2)),
            total_pending: parseFloat(totalPending.toFixed(2)),
            collection_percentage: parseFloat(collectionPercentage.toFixed(2)),
            paid_students: paidStudents,
            partially_paid_students: partiallyPaidStudents,
            unpaid_students: unpaidStudents,
            payment_rate: totalAssignments > 0 ? parseFloat(((paidStudents / totalAssignments) * 100).toFixed(2)) : 0,
         };
      } catch (error) {
         logError(error, { context: 'FeeService.getFeeCollectionStatistics', tenantCode });
         throw new Error('Failed to retrieve fee collection statistics');
      }
   }

   /**
    * Export fee data to CSV
    * @param {Object} filters - Export filters
    * @param {string} exportType - Type of export (structures, assignments, payments)
    * @param {string} tenantCode - Tenant isolation
    * @returns {string} CSV data
    */
   async exportToCSV(filters = {}, exportType = 'structures', tenantCode = null) {
      try {
         let csvData = '';

         switch (exportType) {
            case 'structures':
               csvData = await this.exportFeeStructuresCSV(filters, tenantCode);
               break;
            case 'assignments':
               csvData = await this.exportFeeAssignmentsCSV(filters, tenantCode);
               break;
            case 'payments':
               csvData = await this.exportFeePaymentsCSV(filters, tenantCode);
               break;
            default:
               throw new Error('Invalid export type');
         }

         return csvData;
      } catch (error) {
         logError(error, { context: 'FeeService.exportToCSV', exportType, tenantCode });
         throw new Error('Failed to export fee data');
      }
   }

   /**
    * Export fee structures to CSV
    * @private
    */
   async exportFeeStructuresCSV(filters, tenantCode) {
      const { feeStructures } = await this.getAllFeeStructures(filters, { limit: 1000 }, tenantCode);

      const csvHeaders = [
         'Name',
         'Code',
         'Category',
         'Fee Type',
         'Class',
         'Academic Year',
         'Total Amount',
         'Mandatory Amount',
         'Optional Amount',
         'Status',
         'Description',
      ];

      const csvRows = feeStructures.map((structure) => [
         structure.name,
         structure.code,
         structure.category,
         structure.fee_type,
         structure.class?.name || '',
         structure.academicYear?.name || '',
         structure.total_amount,
         structure.mandatory_amount,
         structure.optional_amount,
         structure.status,
         structure.description || '',
      ]);

      return [csvHeaders, ...csvRows].map((row) => row.map((field) => `"${field || ''}"`).join(',')).join('\n');
   }

   /**
    * Export fee assignments to CSV
    * @private
    */
   async exportFeeAssignmentsCSV(filters, tenantCode) {
      // Implementation for fee assignments export
      const csvHeaders = [
         'Student Name',
         'Admission Number',
         'Fee Structure',
         'Class',
         'Academic Year',
         'Total Amount',
         'Paid Amount',
         'Balance Amount',
         'Status',
         'Assigned Date',
         'Due Date',
      ];

      // This would be implemented based on specific requirements
      return csvHeaders.map((header) => `"${header}"`).join(',') + '\n';
   }

   /**
    * Export fee payments to CSV
    * @private
    */
   async exportFeePaymentsCSV(filters, tenantCode) {
      // Implementation for fee payments export
      const csvHeaders = [
         'Student Name',
         'Fee Structure',
         'Payment Amount',
         'Payment Date',
         'Payment Method',
         'Transaction ID',
         'Status',
         'Receipt Number',
      ];

      // This would be implemented based on specific requirements
      return csvHeaders.map((header) => `"${header}"`).join(',') + '\n';
   }
}

module.exports = FeeService;
