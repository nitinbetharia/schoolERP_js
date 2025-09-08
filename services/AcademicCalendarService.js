const { Op } = require('sequelize');
const { logError } = require('../utils/logger');

/**
 * Academic Calendar Service
 * Complete academic year and term management system
 * Phase 4 Implementation - Academic Structure Integration
 */

class AcademicCalendarService {
   constructor(models) {
      this.models = models;
   }

   /**
    * Get all academic years with enhanced filtering and pagination
    * @param {Object} filters - Filter criteria
    * @param {Object} pagination - Pagination options
    * @param {string} tenantCode - Tenant isolation
    * @returns {Object} Academic years with pagination info
    */
   async getAllAcademicYears(filters = {}, pagination = {}, tenantCode = null) {
      try {
         const { search = '', status = '', is_current = '', start_year = '' } = filters;

         const { page = 1, limit = 20, sortBy = 'start_date', sortOrder = 'DESC' } = pagination;

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
            ];
         }

         // Status filter
         if (status) {
            whereConditions.status = status;
         }

         // Current year filter
         if (is_current !== '') {
            whereConditions.is_current = is_current === 'true';
         }

         // Year filter
         if (start_year) {
            whereConditions.start_year = parseInt(start_year);
         }

         // Calculate offset
         const offset = (page - 1) * limit;

         // Get academic years with terms
         const { rows: academicYears, count: total } = await this.models.AcademicYear.findAndCountAll({
            where: whereConditions,
            include: [
               {
                  model: this.models.AcademicTerm,
                  as: 'terms',
                  attributes: ['id', 'name', 'start_date', 'end_date', 'is_current', 'status'],
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

         return {
            academicYears: academicYears.map((year) => ({
               ...year.dataValues,
               term_count: year.terms?.length || 0,
               current_term: year.terms?.find((term) => term.is_current) || null,
               active_terms: year.terms?.filter((term) => term.status === 'ACTIVE').length || 0,
            })),
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
         logError(error, { context: 'AcademicCalendarService.getAllAcademicYears', tenantCode });
         throw new Error('Failed to retrieve academic years');
      }
   }

   /**
    * Get academic year by ID with comprehensive details
    * @param {number} yearId - Academic year ID
    * @param {string} tenantCode - Tenant isolation
    * @returns {Object} Academic year details
    */
   async getAcademicYearById(yearId, tenantCode = null) {
      try {
         const whereConditions = { id: yearId };
         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         const academicYear = await this.models.AcademicYear.findOne({
            where: whereConditions,
            include: [
               {
                  model: this.models.AcademicTerm,
                  as: 'terms',
                  include: [
                     {
                        model: this.models.Holiday,
                        as: 'holidays',
                        required: false,
                     },
                     {
                        model: this.models.AcademicEvent,
                        as: 'events',
                        required: false,
                     },
                  ],
               },
               {
                  model: this.models.Holiday,
                  as: 'holidays',
                  where: { scope: 'YEAR' },
                  required: false,
               },
            ],
         });

         if (!academicYear) {
            throw new Error('Academic year not found');
         }

         return academicYear;
      } catch (error) {
         if (error.message === 'Academic year not found') {
            throw error;
         }
         logError(error, { context: 'AcademicCalendarService.getAcademicYearById', yearId, tenantCode });
         throw new Error('Failed to retrieve academic year details');
      }
   }

   /**
    * Create new academic year with validation
    * @param {Object} yearData - Academic year information
    * @param {string} tenantCode - Tenant isolation
    * @returns {Object} Created academic year
    */
   async createAcademicYear(yearData, tenantCode = null) {
      const transaction = await this.models.sequelize.transaction();

      try {
         // Validate date ranges
         const startDate = new Date(yearData.start_date);
         const endDate = new Date(yearData.end_date);

         if (startDate >= endDate) {
            throw new Error('End date must be after start date');
         }

         // Check for overlapping years
         const whereConditions = {
            [Op.or]: [
               {
                  start_date: { [Op.between]: [startDate, endDate] },
               },
               {
                  end_date: { [Op.between]: [startDate, endDate] },
               },
               {
                  [Op.and]: [{ start_date: { [Op.lte]: startDate } }, { end_date: { [Op.gte]: endDate } }],
               },
            ],
         };

         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         const overlapping = await this.models.AcademicYear.findOne({
            where: whereConditions,
            transaction,
         });

         if (overlapping) {
            throw new Error(`Academic year overlaps with existing year: ${overlapping.name}`);
         }

         // If this is set as current year, unset other current years
         if (yearData.is_current) {
            const updateConditions = tenantCode ? { tenant_code: tenantCode } : {};
            await this.models.AcademicYear.update(
               { is_current: false },
               {
                  where: updateConditions,
                  transaction,
               }
            );
         }

         // Generate academic year code if not provided
         if (!yearData.code) {
            const startYear = startDate.getFullYear();
            const endYear = endDate.getFullYear();
            yearData.code = `AY${startYear}-${endYear.toString().slice(-2)}`;
         }

         // Create academic year
         const academicYear = await this.models.AcademicYear.create(
            {
               ...yearData,
               tenant_code: tenantCode,
               start_year: startDate.getFullYear(),
               end_year: endDate.getFullYear(),
            },
            { transaction }
         );

         // Create default terms if specified
         if (yearData.create_default_terms) {
            await this.createDefaultTerms(academicYear.id, startDate, endDate, tenantCode, transaction);
         }

         await transaction.commit();
         return academicYear;
      } catch (error) {
         await transaction.rollback();
         if (error.message.includes('overlaps') || error.message.includes('after')) {
            throw error;
         }
         logError(error, { context: 'AcademicCalendarService.createAcademicYear', tenantCode });
         throw new Error('Failed to create academic year');
      }
   }

   /**
    * Update academic year with validation
    * @param {number} yearId - Academic year ID
    * @param {Object} updateData - Update information
    * @param {string} tenantCode - Tenant isolation
    * @returns {Object} Updated academic year
    */
   async updateAcademicYear(yearId, updateData, tenantCode = null) {
      const transaction = await this.models.sequelize.transaction();

      try {
         const whereConditions = { id: yearId };
         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         const academicYear = await this.models.AcademicYear.findOne({
            where: whereConditions,
            transaction,
         });

         if (!academicYear) {
            throw new Error('Academic year not found');
         }

         // Validate date ranges if dates are being updated
         if (updateData.start_date || updateData.end_date) {
            const startDate = new Date(updateData.start_date || academicYear.start_date);
            const endDate = new Date(updateData.end_date || academicYear.end_date);

            if (startDate >= endDate) {
               throw new Error('End date must be after start date');
            }

            // Check for overlapping years (excluding current year)
            const whereOverlapConditions = {
               id: { [Op.ne]: yearId },
               [Op.or]: [
                  { start_date: { [Op.between]: [startDate, endDate] } },
                  { end_date: { [Op.between]: [startDate, endDate] } },
                  {
                     [Op.and]: [{ start_date: { [Op.lte]: startDate } }, { end_date: { [Op.gte]: endDate } }],
                  },
               ],
            };

            if (tenantCode) {
               whereOverlapConditions.tenant_code = tenantCode;
            }

            const overlapping = await this.models.AcademicYear.findOne({
               where: whereOverlapConditions,
               transaction,
            });

            if (overlapping) {
               throw new Error(`Academic year overlaps with existing year: ${overlapping.name}`);
            }

            updateData.start_year = startDate.getFullYear();
            updateData.end_year = endDate.getFullYear();
         }

         // If this is set as current year, unset other current years
         if (updateData.is_current) {
            const updateConditions = { id: { [Op.ne]: yearId } };
            if (tenantCode) {
               updateConditions.tenant_code = tenantCode;
            }

            await this.models.AcademicYear.update(
               { is_current: false },
               {
                  where: updateConditions,
                  transaction,
               }
            );
         }

         // Update academic year
         await academicYear.update(updateData, { transaction });

         await transaction.commit();
         return academicYear.reload();
      } catch (error) {
         await transaction.rollback();
         if (
            error.message.includes('not found') ||
            error.message.includes('overlaps') ||
            error.message.includes('after')
         ) {
            throw error;
         }
         logError(error, { context: 'AcademicCalendarService.updateAcademicYear', yearId, tenantCode });
         throw new Error('Failed to update academic year');
      }
   }

   /**
    * Delete academic year with validation
    * @param {number} yearId - Academic year ID
    * @param {string} tenantCode - Tenant isolation
    * @returns {boolean} Success status
    */
   async deleteAcademicYear(yearId, tenantCode = null) {
      const transaction = await this.models.sequelize.transaction();

      try {
         const whereConditions = { id: yearId };
         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         const academicYear = await this.models.AcademicYear.findOne({
            where: whereConditions,
            transaction,
         });

         if (!academicYear) {
            throw new Error('Academic year not found');
         }

         // Check if year has active enrollments or records
         const hasEnrollments = await this.models.StudentEnrollment.count({
            where: { academic_year_id: yearId },
            transaction,
         });

         if (hasEnrollments > 0) {
            throw new Error('Cannot delete academic year with active student enrollments');
         }

         // Check if it's the current year
         if (academicYear.is_current) {
            throw new Error('Cannot delete the current academic year');
         }

         // Delete related terms and their data
         await this.models.AcademicTerm.destroy({
            where: { academic_year_id: yearId },
            transaction,
         });

         // Delete the academic year
         await academicYear.destroy({ transaction });

         await transaction.commit();
         return true;
      } catch (error) {
         await transaction.rollback();
         if (error.message.includes('not found') || error.message.includes('Cannot delete')) {
            throw error;
         }
         logError(error, { context: 'AcademicCalendarService.deleteAcademicYear', yearId, tenantCode });
         throw new Error('Failed to delete academic year');
      }
   }

   /**
    * Get academic terms for a year
    * @param {number} yearId - Academic year ID
    * @param {string} tenantCode - Tenant isolation
    * @returns {Array} Academic terms
    */
   async getTermsForYear(yearId, tenantCode = null) {
      try {
         const whereConditions = { academic_year_id: yearId };

         const academicYear = await this.models.AcademicYear.findOne({
            where: {
               id: yearId,
               ...(tenantCode && { tenant_code: tenantCode }),
            },
         });

         if (!academicYear) {
            throw new Error('Academic year not found');
         }

         const terms = await this.models.AcademicTerm.findAll({
            where: whereConditions,
            include: [
               {
                  model: this.models.Holiday,
                  as: 'holidays',
                  required: false,
               },
               {
                  model: this.models.AcademicEvent,
                  as: 'events',
                  required: false,
               },
            ],
            order: [['start_date', 'ASC']],
         });

         return terms;
      } catch (error) {
         if (error.message === 'Academic year not found') {
            throw error;
         }
         logError(error, { context: 'AcademicCalendarService.getTermsForYear', yearId, tenantCode });
         throw new Error('Failed to retrieve academic terms');
      }
   }

   /**
    * Create academic term
    * @param {Object} termData - Term information
    * @param {string} tenantCode - Tenant isolation
    * @returns {Object} Created term
    */
   async createTerm(termData, tenantCode = null) {
      try {
         // Validate date ranges
         const startDate = new Date(termData.start_date);
         const endDate = new Date(termData.end_date);

         if (startDate >= endDate) {
            throw new Error('Term end date must be after start date');
         }

         // Validate term is within academic year
         const academicYear = await this.models.AcademicYear.findOne({
            where: {
               id: termData.academic_year_id,
               ...(tenantCode && { tenant_code: tenantCode }),
            },
         });

         if (!academicYear) {
            throw new Error('Academic year not found');
         }

         const yearStart = new Date(academicYear.start_date);
         const yearEnd = new Date(academicYear.end_date);

         if (startDate < yearStart || endDate > yearEnd) {
            throw new Error('Term dates must be within the academic year period');
         }

         // Check for overlapping terms in the same year
         const overlapping = await this.models.AcademicTerm.findOne({
            where: {
               academic_year_id: termData.academic_year_id,
               [Op.or]: [
                  { start_date: { [Op.between]: [startDate, endDate] } },
                  { end_date: { [Op.between]: [startDate, endDate] } },
                  {
                     [Op.and]: [{ start_date: { [Op.lte]: startDate } }, { end_date: { [Op.gte]: endDate } }],
                  },
               ],
            },
         });

         if (overlapping) {
            throw new Error(`Term overlaps with existing term: ${overlapping.name}`);
         }

         // If this is set as current term, unset other current terms in the year
         if (termData.is_current) {
            await this.models.AcademicTerm.update(
               { is_current: false },
               { where: { academic_year_id: termData.academic_year_id } }
            );
         }

         // Create term
         const term = await this.models.AcademicTerm.create({
            ...termData,
            tenant_code: tenantCode,
         });

         return term;
      } catch (error) {
         if (
            error.message.includes('not found') ||
            error.message.includes('overlaps') ||
            error.message.includes('must be') ||
            error.message.includes('within')
         ) {
            throw error;
         }
         logError(error, { context: 'AcademicCalendarService.createTerm', tenantCode });
         throw new Error('Failed to create academic term');
      }
   }

   /**
    * Get current academic year
    * @param {string} tenantCode - Tenant isolation
    * @returns {Object} Current academic year
    */
   async getCurrentAcademicYear(tenantCode = null) {
      try {
         const whereConditions = { is_current: true };
         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         const currentYear = await this.models.AcademicYear.findOne({
            where: whereConditions,
            include: [
               {
                  model: this.models.AcademicTerm,
                  as: 'terms',
                  where: { is_current: true },
                  required: false,
               },
            ],
         });

         return currentYear;
      } catch (error) {
         logError(error, { context: 'AcademicCalendarService.getCurrentAcademicYear', tenantCode });
         throw new Error('Failed to retrieve current academic year');
      }
   }

   /**
    * Get academic calendar statistics
    * @param {string} tenantCode - Tenant isolation
    * @returns {Object} Calendar statistics
    */
   async getCalendarStatistics(tenantCode = null) {
      try {
         const whereConditions = tenantCode ? { tenant_code: tenantCode } : {};

         const [totalYears, activeYears, totalTerms, currentYear] = await Promise.all([
            this.models.AcademicYear.count({ where: whereConditions }),
            this.models.AcademicYear.count({
               where: { ...whereConditions, status: 'ACTIVE' },
            }),
            this.models.AcademicTerm.count({
               include: [
                  {
                     model: this.models.AcademicYear,
                     where: whereConditions,
                     attributes: [],
                  },
               ],
            }),
            this.getCurrentAcademicYear(tenantCode),
         ]);

         return {
            total_years: totalYears,
            active_years: activeYears,
            total_terms: totalTerms,
            current_year: currentYear,
            current_term: currentYear?.terms?.[0] || null,
         };
      } catch (error) {
         logError(error, { context: 'AcademicCalendarService.getCalendarStatistics', tenantCode });
         throw new Error('Failed to retrieve calendar statistics');
      }
   }

   /**
    * Create default terms for academic year
    * @param {number} yearId - Academic year ID
    * @param {Date} yearStart - Year start date
    * @param {Date} yearEnd - Year end date
    * @param {string} tenantCode - Tenant isolation
    * @param {Object} transaction - Database transaction
    * @returns {Array} Created terms
    */
   async createDefaultTerms(yearId, yearStart, yearEnd, tenantCode = null, transaction = null) {
      try {
         const yearDuration = yearEnd.getTime() - yearStart.getTime();
         const termDuration = yearDuration / 3; // Three terms

         const terms = [
            {
               name: 'First Term',
               code: 'TERM1',
               academic_year_id: yearId,
               start_date: new Date(yearStart),
               end_date: new Date(yearStart.getTime() + termDuration),
               is_current: true,
               status: 'ACTIVE',
               tenant_code: tenantCode,
            },
            {
               name: 'Second Term',
               code: 'TERM2',
               academic_year_id: yearId,
               start_date: new Date(yearStart.getTime() + termDuration + 1),
               end_date: new Date(yearStart.getTime() + termDuration * 2),
               is_current: false,
               status: 'PLANNED',
               tenant_code: tenantCode,
            },
            {
               name: 'Third Term',
               code: 'TERM3',
               academic_year_id: yearId,
               start_date: new Date(yearStart.getTime() + termDuration * 2 + 1),
               end_date: new Date(yearEnd),
               is_current: false,
               status: 'PLANNED',
               tenant_code: tenantCode,
            },
         ];

         const createdTerms = await this.models.AcademicTerm.bulkCreate(terms, {
            transaction,
            returning: true,
         });

         return createdTerms;
      } catch (error) {
         logError(error, { context: 'AcademicCalendarService.createDefaultTerms', yearId, tenantCode });
         throw new Error('Failed to create default terms');
      }
   }

   /**
    * Export academic calendar to CSV
    * @param {Object} filters - Export filters
    * @param {string} tenantCode - Tenant isolation
    * @returns {string} CSV data
    */
   async exportToCSV(filters = {}, tenantCode = null) {
      try {
         const { academicYears } = await this.getAllAcademicYears(
            filters,
            { limit: 1000 }, // Large limit for export
            tenantCode
         );

         const csvHeaders = [
            'Name',
            'Code',
            'Start Date',
            'End Date',
            'Status',
            'Is Current',
            'Start Year',
            'End Year',
            'Terms Count',
            'Description',
         ];

         const csvRows = academicYears.map((year) => [
            year.name,
            year.code,
            year.start_date,
            year.end_date,
            year.status,
            year.is_current ? 'Yes' : 'No',
            year.start_year,
            year.end_year,
            year.term_count,
            year.description || '',
         ]);

         const csvContent = [csvHeaders, ...csvRows]
            .map((row) => row.map((field) => `"${field || ''}"`).join(','))
            .join('\n');

         return csvContent;
      } catch (error) {
         logError(error, { context: 'AcademicCalendarService.exportToCSV', tenantCode });
         throw new Error('Failed to export academic calendar');
      }
   }
}

module.exports = AcademicCalendarService;
