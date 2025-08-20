const logger = require('../../../utils/logger');
const { ValidationError, NotFoundError, BusinessLogicError } = require('../../../utils/errors');

/**
 * Board Compliance Service
 * Manages board affiliation and NEP adoption policies
 */
class BoardComplianceService {
   /**
    * Get effective NEP policy for a school (considering trust inheritance)
    */
   async getEffectiveNEPPolicy(schoolId) {
      try {
         const { getTenantModels } = require('../../../models');
         const { School, Trust } = getTenantModels();

         const school = await School.findByPk(schoolId, {
            include: [
               {
                  model: Trust,
                  as: 'trust',
                  attributes: ['tenant_config'],
               },
            ],
         });

         if (!school) {
            throw new NotFoundError('School not found');
         }

         const schoolNEPConfig = school.additional_info?.nep_2020_adoption || {};
         const trustNEPConfig = school.trust?.tenant_config?.nep_2020_adoption || {};

         // Determine effective policy
         let effectivePolicy = {
            enabled: false,
            policy: 'TRADITIONAL',
            adoption_date: null,
            academic_year_from: null,
            source: 'default',
         };

         // If school overrides trust policy
         if (schoolNEPConfig.override_trust_policy && schoolNEPConfig.enabled !== null) {
            effectivePolicy = {
               enabled: schoolNEPConfig.enabled,
               policy: schoolNEPConfig.policy || 'TRADITIONAL',
               adoption_date: schoolNEPConfig.adoption_date,
               academic_year_from: schoolNEPConfig.academic_year_from,
               source: 'school',
            };
         }
         // Otherwise, inherit from trust
         else if (trustNEPConfig.enabled) {
            effectivePolicy = {
               enabled: trustNEPConfig.enabled,
               policy: trustNEPConfig.policy || 'TRADITIONAL',
               adoption_date: trustNEPConfig.adoption_date,
               academic_year_from: trustNEPConfig.academic_year_from,
               source: 'trust',
            };
         }

         return {
            school_id: schoolId,
            school_name: school.name,
            effective_policy: effectivePolicy,
            school_config: schoolNEPConfig,
            trust_config: trustNEPConfig,
         };
      } catch (error) {
         logger.error('Error getting effective NEP policy', {
            school_id: schoolId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Set NEP adoption policy at school level
    */
   async setSchoolNEPPolicy(schoolId, nepConfig, userId) {
      try {
         const { getTenantModels } = require('../../../models');
         const { School } = getTenantModels();

         const school = await School.findByPk(schoolId);
         if (!school) {
            throw new NotFoundError('School not found');
         }

         // Validate NEP configuration
         const validPolicies = ['TRADITIONAL', 'NEP_2020', 'HYBRID'];
         if (nepConfig.policy && !validPolicies.includes(nepConfig.policy)) {
            throw new ValidationError('Invalid NEP policy');
         }

         // Update school configuration
         const updatedConfig = {
            ...school.additional_info,
            nep_2020_adoption: {
               enabled: nepConfig.enabled,
               adoption_date: nepConfig.adoption_date || null,
               policy: nepConfig.policy || 'TRADITIONAL',
               academic_year_from: nepConfig.academic_year_from || null,
               override_trust_policy: nepConfig.override_trust_policy || false,
               updated_by: userId,
               updated_at: new Date(),
            },
         };

         await school.update({
            additional_info: updatedConfig,
            updated_by: userId,
         });

         logger.info('School NEP policy updated', {
            school_id: schoolId,
            policy: nepConfig.policy,
            enabled: nepConfig.enabled,
            updated_by: userId,
         });

         return await this.getEffectiveNEPPolicy(schoolId);
      } catch (error) {
         logger.error('Error setting school NEP policy', {
            school_id: schoolId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Set trust-wide NEP adoption policy
    */
   async setTrustNEPPolicy(trustId, nepConfig, userId) {
      try {
         const { getTrustModel } = require('../../../models');
         const Trust = getTrustModel();

         const trust = await Trust.findByPk(trustId);
         if (!trust) {
            throw new NotFoundError('Trust not found');
         }

         // Update trust configuration
         const updatedConfig = {
            ...trust.tenant_config,
            nep_2020_adoption: {
               enabled: nepConfig.enabled,
               adoption_date: nepConfig.adoption_date || null,
               policy: nepConfig.policy || 'TRADITIONAL',
               allow_school_override: nepConfig.allow_school_override !== false,
               academic_year_from: nepConfig.academic_year_from || null,
               updated_by: userId,
               updated_at: new Date(),
            },
         };

         await trust.update({
            tenant_config: updatedConfig,
         });

         logger.info('Trust NEP policy updated', {
            trust_id: trustId,
            policy: nepConfig.policy,
            enabled: nepConfig.enabled,
            allow_override: nepConfig.allow_school_override,
            updated_by: userId,
         });

         return updatedConfig.nep_2020_adoption;
      } catch (error) {
         logger.error('Error setting trust NEP policy', {
            trust_id: trustId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Get board affiliation compliance status
    */
   async getBoardCompliance(schoolId) {
      try {
         const { getTenantModels } = require('../../../models');
         const { School, BoardCompliance } = getTenantModels();

         const school = await School.findByPk(schoolId, {
            include: [
               {
                  model: BoardCompliance,
                  as: 'board_compliance',
                  required: false,
               },
            ],
         });

         if (!school) {
            throw new NotFoundError('School not found');
         }

         return {
            school_id: schoolId,
            school_name: school.name,
            affiliation_board: school.affiliation_board,
            board_details: school.board_affiliation_details,
            compliance_records: school.board_compliance || [],
         };
      } catch (error) {
         logger.error('Error getting board compliance', {
            school_id: schoolId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Set board affiliation for a school
    */
   async setBoardAffiliation(schoolId, boardConfig, userId) {
      try {
         const { getTenantModels } = require('../../../models');
         const { School, BoardCompliance } = getTenantModels();

         const school = await School.findByPk(schoolId);
         if (!school) {
            throw new NotFoundError('School not found');
         }

         const validBoards = ['CBSE', 'CISCE', 'STATE_BOARD', 'INTERNATIONAL', 'UNAFFILIATED'];
         if (!validBoards.includes(boardConfig.board_type)) {
            throw new ValidationError('Invalid board type');
         }

         // Update school board affiliation
         await school.update({
            affiliation_board: boardConfig.board_type,
            board_affiliation_details: {
               affiliation_code: boardConfig.affiliation_code,
               registration_number: boardConfig.registration_number,
               affiliation_date: boardConfig.affiliation_date,
               expiry_date: boardConfig.expiry_date,
               updated_by: userId,
               updated_at: new Date(),
            },
            updated_by: userId,
         });

         // Create or update board compliance record
         const [compliance, created] = await BoardCompliance.findOrCreate({
            where: { school_id: schoolId, board_type: boardConfig.board_type },
            defaults: {
               affiliation_code: boardConfig.affiliation_code,
               registration_number: boardConfig.registration_number,
               affiliation_status: boardConfig.affiliation_status || 'APPLIED',
               affiliation_date: boardConfig.affiliation_date,
               expiry_date: boardConfig.expiry_date,
               nep_compatibility: boardConfig.nep_compatibility || 'UNKNOWN',
               assessment_framework: boardConfig.assessment_framework || 'TRADITIONAL',
               created_by: userId,
            },
         });

         if (!created) {
            await compliance.update({
               affiliation_code: boardConfig.affiliation_code,
               registration_number: boardConfig.registration_number,
               affiliation_status: boardConfig.affiliation_status || compliance.affiliation_status,
               affiliation_date: boardConfig.affiliation_date || compliance.affiliation_date,
               expiry_date: boardConfig.expiry_date || compliance.expiry_date,
               nep_compatibility: boardConfig.nep_compatibility || compliance.nep_compatibility,
               assessment_framework: boardConfig.assessment_framework || compliance.assessment_framework,
               updated_by: userId,
            });
         }

         logger.info('Board affiliation updated', {
            school_id: schoolId,
            board_type: boardConfig.board_type,
            affiliation_code: boardConfig.affiliation_code,
            updated_by: userId,
         });

         return await this.getBoardCompliance(schoolId);
      } catch (error) {
         logger.error('Error setting board affiliation', {
            school_id: schoolId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Get NEP compliance report for schools
    */
   async getNEPComplianceReport(filters = {}) {
      try {
         const { getTenantModels } = require('../../../models');
         const { School, NEPCompliance } = getTenantModels();

         const where = {};
         if (filters.adoption_status) {
            where.adoption_status = filters.adoption_status;
         }

         const schools = await School.findAll({
            include: [
               {
                  model: NEPCompliance,
                  as: 'nep_compliance',
                  required: false,
                  where: Object.keys(where).length > 0 ? where : undefined,
               },
            ],
            order: [['name', 'ASC']],
         });

         const report = {
            total_schools: schools.length,
            nep_adoption_summary: {
               not_adopted: 0,
               planning: 0,
               partial: 0,
               full: 0,
               certified: 0,
            },
            schools: [],
         };

         for (const school of schools) {
            const effectivePolicy = await this.getEffectiveNEPPolicy(school.id);
            const nepCompliance = school.nep_compliance;

            const status = nepCompliance?.adoption_status || 'NOT_ADOPTED';
            report.nep_adoption_summary[status.toLowerCase()] += 1;

            report.schools.push({
               id: school.id,
               name: school.name,
               affiliation_board: school.affiliation_board,
               effective_nep_policy: effectivePolicy.effective_policy,
               nep_compliance: nepCompliance
                  ? {
                       adoption_status: nepCompliance.adoption_status,
                       compliance_score: nepCompliance.compliance_score,
                       last_assessment: nepCompliance.last_assessment_date,
                    }
                  : null,
            });
         }

         return report;
      } catch (error) {
         logger.error('Error generating NEP compliance report', {
            error: error.message,
         });
         throw error;
      }
   }
}

module.exports = BoardComplianceService;
