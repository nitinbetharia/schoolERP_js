const { logError, logSystem } = require('../../../utils/logger');
const { createNotFoundError } = require('../../../utils/errorHelpers');

/**
 * UDISE Compliance Service
 * Handles compliance tracking, scoring, and validation
 */

/**
 * Create compliance record
 * @param {string} tenantCode - Tenant code
 * @param {number} udiseRegistrationId - UDISE registration ID
 * @param {Object} complianceData - Compliance data
 * @param {string} createdBy - User creating the record
 * @param {Function} getModels - Function to get models
 * @returns {Object} - Created compliance record
 */
async function createComplianceRecord(tenantCode, udiseRegistrationId, complianceData, createdBy, getModels) {
   try {
      const models = await getModels(tenantCode);

      // Calculate compliance score
      const scoreResult = calculateComplianceScore(complianceData);

      const complianceRecord = await models.UdiseComplianceRecord.create({
         udise_registration_id: udiseRegistrationId,
         ...complianceData,
         compliance_score: scoreResult.totalScore,
         compliance_grade: scoreResult.grade,
         compliance_percentage: scoreResult.percentage,
         created_by: createdBy,
      });

      logSystem(`UDISE compliance record created: ${complianceRecord.id}`, {
         tenantCode,
      });

      return complianceRecord;
   } catch (error) {
      logError(error, {
         context: 'UdiseComplianceService.createComplianceRecord',
         tenantCode,
         udiseRegistrationId,
      });
      throw error;
   }
}

/**
 * Update compliance record
 * @param {string} tenantCode - Tenant code
 * @param {number} complianceId - Compliance ID
 * @param {Object} updateData - Update data
 * @param {string} updatedBy - User updating the record
 * @param {Function} getModels - Function to get models
 * @returns {Object} - Updated compliance record
 */
async function updateComplianceRecord(tenantCode, complianceId, updateData, updatedBy, getModels) {
   try {
      const models = await getModels(tenantCode);

      const complianceRecord = await models.UdiseComplianceRecord.findByPk(complianceId);
      if (!complianceRecord) {
         throw createNotFoundError('Compliance record not found');
      }

      // Recalculate score if compliance data is updated
      let scoreData = {};
      if (Object.keys(updateData).some((key) => key.includes('_compliant'))) {
         const fullData = { ...complianceRecord.toJSON(), ...updateData };
         const scoreResult = calculateComplianceScore(fullData);
         scoreData = {
            compliance_score: scoreResult.totalScore,
            compliance_grade: scoreResult.grade,
            compliance_percentage: scoreResult.percentage,
         };
      }

      await complianceRecord.update({
         ...updateData,
         ...scoreData,
         updated_by: updatedBy,
      });

      logSystem(`UDISE compliance record updated: ${complianceId}`, {
         tenantCode,
      });

      return complianceRecord;
   } catch (error) {
      logError(error, {
         context: 'UdiseComplianceService.updateComplianceRecord',
         tenantCode,
         complianceId,
      });
      throw error;
   }
}

/**
 * Get compliance records with filters
 * @param {string} tenantCode - Tenant code
 * @param {Object} filters - Filter parameters
 * @param {Function} getModels - Function to get models
 * @returns {Array} - Array of compliance records
 */
async function getComplianceRecords(tenantCode, filters = {}, getModels) {
   try {
      const models = await getModels(tenantCode);

      const whereClause = {};

      if (filters.udise_registration_id) {
         whereClause.udise_registration_id = filters.udise_registration_id;
      }
      if (filters.compliance_grade) {
         whereClause.compliance_grade = filters.compliance_grade;
      }
      if (filters.min_score) {
         whereClause.compliance_score = {
            [require('sequelize').Op.gte]: filters.min_score,
         };
      }

      const complianceRecords = await models.UdiseComplianceRecord.findAll({
         where: whereClause,
         include: [
            {
               model: models.UdiseSchoolRegistration,
               as: 'udise_registration',
               required: false,
            },
         ],
         order: [['compliance_score', 'DESC']],
         limit: filters.limit || 50,
         offset: filters.offset || 0,
      });

      return complianceRecords;
   } catch (error) {
      logError(error, {
         context: 'UdiseComplianceService.getComplianceRecords',
         tenantCode,
      });
      throw error;
   }
}

/**
 * Calculate compliance score based on criteria weights
 * @param {Object} complianceData - Compliance data object
 * @returns {Object} - Score calculation result
 */
function calculateComplianceScore(complianceData) {
   try {
      // Compliance criteria with weightage (total = 100%)
      const criteriaWeights = {
         // Infrastructure & Safety (25%)
         building_safety_certificate: 6,
         fire_safety_compliance: 5,
         disabled_friendly_infrastructure: 4,
         playground_availability: 4,
         library_with_books: 3,
         laboratory_facilities: 3,

         // Academic & Teacher (20%)
         teacher_verification_complete: 5,
         teacher_training_updated: 5,
         curriculum_board_approved: 5,
         assessment_system_compliant: 5,

         // Child Safety (15%)
         child_protection_policy: 4,
         anti_ragging_measures: 3,
         pocso_awareness: 4,
         grievance_mechanism: 4,

         // Others (10%)
         financial_audit_current: 3,
         fee_structure_approved: 2,
         digital_learning_implemented: 2,
         green_practices_adopted: 3,
      };

      let totalScore = 0;
      let maxScore = 0;

      for (const [criterion, weight] of Object.entries(criteriaWeights)) {
         maxScore += weight;
         if (complianceData[criterion] === true) {
            totalScore += weight;
         }
      }

      const percentage = (totalScore / maxScore) * 100;

      let grade;
      if (percentage >= 90) {
         grade = 'A+';
      } else if (percentage >= 85) {
         grade = 'A';
      } else if (percentage >= 80) {
         grade = 'B+';
      } else if (percentage >= 75) {
         grade = 'B';
      } else if (percentage >= 70) {
         grade = 'C+';
      } else if (percentage >= 60) {
         grade = 'C';
      } else if (percentage >= 50) {
         grade = 'D';
      } else {
         grade = 'F';
      }

      return {
         totalScore: Math.round(totalScore * 100) / 100,
         maxScore,
         percentage: Math.round(percentage * 100) / 100,
         grade,
         criteriaWeights,
      };
   } catch (error) {
      logError(error, {
         context: 'UdiseComplianceService.calculateComplianceScore',
      });
      throw error;
   }
}

/**
 * Generate compliance checklist
 * @returns {Object} - Compliance checklist with categories
 */
function getComplianceChecklist() {
   return {
      infrastructure_safety: {
         title: 'Infrastructure & Safety (25%)',
         criteria: [
            {
               key: 'building_safety_certificate',
               label: 'Building Safety Certificate',
               weight: 6,
               description: 'Valid building safety certificate from local authority',
            },
            {
               key: 'fire_safety_compliance',
               label: 'Fire Safety Compliance',
               weight: 5,
               description: 'Fire safety measures and NOC from fire department',
            },
            {
               key: 'disabled_friendly_infrastructure',
               label: 'Disabled-Friendly Infrastructure',
               weight: 4,
               description: 'Ramps, accessible toilets, and barrier-free access',
            },
            {
               key: 'playground_availability',
               label: 'Playground Availability',
               weight: 4,
               description: 'Adequate playground space for students',
            },
            {
               key: 'library_with_books',
               label: 'Library with Books',
               weight: 3,
               description: 'Functional library with age-appropriate books',
            },
            {
               key: 'laboratory_facilities',
               label: 'Laboratory Facilities',
               weight: 3,
               description: 'Science and computer laboratories as applicable',
            },
         ],
      },
      academic_teacher: {
         title: 'Academic & Teacher (20%)',
         criteria: [
            {
               key: 'teacher_verification_complete',
               label: 'Teacher Verification Complete',
               weight: 5,
               description: 'All teacher background checks and verification completed',
            },
            {
               key: 'teacher_training_updated',
               label: 'Teacher Training Updated',
               weight: 5,
               description: 'Teachers have completed mandatory training programs',
            },
            {
               key: 'curriculum_board_approved',
               label: 'Curriculum Board Approved',
               weight: 5,
               description: 'School curriculum approved by education board',
            },
            {
               key: 'assessment_system_compliant',
               label: 'Assessment System Compliant',
               weight: 5,
               description: 'Student assessment system follows prescribed guidelines',
            },
         ],
      },
      child_safety: {
         title: 'Child Safety (15%)',
         criteria: [
            {
               key: 'child_protection_policy',
               label: 'Child Protection Policy',
               weight: 4,
               description: 'Documented child protection and safeguarding policy',
            },
            {
               key: 'anti_ragging_measures',
               label: 'Anti-Ragging Measures',
               weight: 3,
               description: 'Anti-ragging policy and complaint mechanism',
            },
            {
               key: 'pocso_awareness',
               label: 'POCSO Awareness',
               weight: 4,
               description: 'Staff trained on POCSO Act and child safety',
            },
            {
               key: 'grievance_mechanism',
               label: 'Grievance Mechanism',
               weight: 4,
               description: 'Student and parent grievance redressal system',
            },
         ],
      },
      others: {
         title: 'Others (10%)',
         criteria: [
            {
               key: 'financial_audit_current',
               label: 'Financial Audit Current',
               weight: 3,
               description: 'Latest financial audit completed and approved',
            },
            {
               key: 'fee_structure_approved',
               label: 'Fee Structure Approved',
               weight: 2,
               description: 'Fee structure approved by competent authority',
            },
            {
               key: 'digital_learning_implemented',
               label: 'Digital Learning Implemented',
               weight: 2,
               description: 'Digital learning tools and resources available',
            },
            {
               key: 'green_practices_adopted',
               label: 'Green Practices Adopted',
               weight: 3,
               description: 'Environment-friendly practices and awareness programs',
            },
         ],
      },
   };
}

/**
 * Validate compliance data
 * @param {Object} complianceData - Compliance data to validate
 * @returns {Object} - Validation result
 */
function validateComplianceData(complianceData) {
   const errors = [];
   const warnings = [];

   // Check if basic compliance fields are present
   const requiredFields = [
      'building_safety_certificate',
      'fire_safety_compliance',
      'teacher_verification_complete',
      'child_protection_policy',
   ];

   requiredFields.forEach((field) => {
      if (complianceData[field] === undefined) {
         errors.push(`${field} is required for compliance assessment`);
      }
   });

   // Check for high-priority compliance items
   if (!complianceData.fire_safety_compliance) {
      warnings.push('Fire safety compliance is critical for student safety');
   }

   if (!complianceData.child_protection_policy) {
      warnings.push('Child protection policy is mandatory for school operation');
   }

   if (!complianceData.teacher_verification_complete) {
      warnings.push('Teacher background verification is required by law');
   }

   return {
      isValid: errors.length === 0,
      errors,
      warnings,
   };
}

/**
 * Generate compliance summary report
 * @param {Array} complianceRecords - Array of compliance records
 * @returns {Object} - Compliance summary statistics
 */
function generateComplianceSummary(complianceRecords) {
   try {
      if (!complianceRecords || complianceRecords.length === 0) {
         return {
            message: 'No compliance records found',
            summary: {},
         };
      }

      const totalRecords = complianceRecords.length;
      const gradeDistribution = {};
      let totalScore = 0;
      let highestScore = 0;
      let lowestScore = 100;

      complianceRecords.forEach((record) => {
         // Grade distribution
         if (!gradeDistribution[record.compliance_grade]) {
            gradeDistribution[record.compliance_grade] = 0;
         }
         gradeDistribution[record.compliance_grade]++;

         // Score statistics
         totalScore += record.compliance_score || 0;
         if (record.compliance_score > highestScore) {
            highestScore = record.compliance_score;
         }
         if (record.compliance_score < lowestScore) {
            lowestScore = record.compliance_score;
         }
      });

      const averageScore = totalScore / totalRecords;

      return {
         message: 'Compliance summary generated successfully',
         summary: {
            total_records: totalRecords,
            average_score: Math.round(averageScore * 100) / 100,
            highest_score: highestScore,
            lowest_score: lowestScore,
            grade_distribution: gradeDistribution,
            compliance_rate: {
               excellent: (gradeDistribution['A+'] || 0) + (gradeDistribution['A'] || 0),
               good: (gradeDistribution['B+'] || 0) + (gradeDistribution['B'] || 0),
               satisfactory: (gradeDistribution['C+'] || 0) + (gradeDistribution['C'] || 0),
               needs_improvement: (gradeDistribution['D'] || 0) + (gradeDistribution['F'] || 0),
            },
         },
      };
   } catch (error) {
      logError(error, {
         context: 'UdiseComplianceService.generateComplianceSummary',
      });
      throw error;
   }
}

module.exports = {
   createComplianceRecord,
   updateComplianceRecord,
   getComplianceRecords,
   calculateComplianceScore,
   getComplianceChecklist,
   validateComplianceData,
   generateComplianceSummary,
};
