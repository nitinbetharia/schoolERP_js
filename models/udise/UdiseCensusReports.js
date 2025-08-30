/**
 * UDISE Census Reports Module
 * Comprehensive reporting functions for UDISE census data
 * Includes enrollment summaries, teacher reports, infrastructure status
 */

/**
 * Calculate total enrollment across all classes
 * @param {Object} censusData - Census data object
 * @returns {Object} - Enrollment summary with totals by category
 */
function calculateEnrollmentSummary(censusData) {
   const summary = {
      prePrimary: {
         boys: censusData.enrollment_pre_primary_boys || 0,
         girls: censusData.enrollment_pre_primary_girls || 0,
         total: 0,
      },
      primary: {
         boys: 0,
         girls: 0,
         total: 0,
      },
      upperPrimary: {
         boys: 0,
         girls: 0,
         total: 0,
      },
      secondary: {
         boys: 0,
         girls: 0,
         total: 0,
      },
      higherSecondary: {
         boys: 0,
         girls: 0,
         total: 0,
      },
      grandTotal: {
         boys: 0,
         girls: 0,
         total: 0,
         cwsn: 0,
      },
   };

   // Pre-primary total
   summary.prePrimary.total = summary.prePrimary.boys + summary.prePrimary.girls;

   // Primary classes (I-V)
   const primaryBoys =
      (censusData.enrollment_class_1_boys || 0) +
      (censusData.enrollment_class_2_boys || 0) +
      (censusData.enrollment_class_3_boys || 0) +
      (censusData.enrollment_class_4_boys || 0) +
      (censusData.enrollment_class_5_boys || 0);

   const primaryGirls =
      (censusData.enrollment_class_1_girls || 0) +
      (censusData.enrollment_class_2_girls || 0) +
      (censusData.enrollment_class_3_girls || 0) +
      (censusData.enrollment_class_4_girls || 0) +
      (censusData.enrollment_class_5_girls || 0);

   summary.primary.boys = primaryBoys;
   summary.primary.girls = primaryGirls;
   summary.primary.total = primaryBoys + primaryGirls;

   // Upper Primary classes (VI-VIII)
   const upperPrimaryBoys =
      (censusData.enrollment_class_6_boys || 0) +
      (censusData.enrollment_class_7_boys || 0) +
      (censusData.enrollment_class_8_boys || 0);

   const upperPrimaryGirls =
      (censusData.enrollment_class_6_girls || 0) +
      (censusData.enrollment_class_7_girls || 0) +
      (censusData.enrollment_class_8_girls || 0);

   summary.upperPrimary.boys = upperPrimaryBoys;
   summary.upperPrimary.girls = upperPrimaryGirls;
   summary.upperPrimary.total = upperPrimaryBoys + upperPrimaryGirls;

   // Secondary classes (IX-X)
   const secondaryBoys = (censusData.enrollment_class_9_boys || 0) + (censusData.enrollment_class_10_boys || 0);

   const secondaryGirls = (censusData.enrollment_class_9_girls || 0) + (censusData.enrollment_class_10_girls || 0);

   summary.secondary.boys = secondaryBoys;
   summary.secondary.girls = secondaryGirls;
   summary.secondary.total = secondaryBoys + secondaryGirls;

   // Higher Secondary classes (XI-XII)
   const higherSecondaryBoys = (censusData.enrollment_class_11_boys || 0) + (censusData.enrollment_class_12_boys || 0);

   const higherSecondaryGirls =
      (censusData.enrollment_class_11_girls || 0) + (censusData.enrollment_class_12_girls || 0);

   summary.higherSecondary.boys = higherSecondaryBoys;
   summary.higherSecondary.girls = higherSecondaryGirls;
   summary.higherSecondary.total = higherSecondaryBoys + higherSecondaryGirls;

   // Grand totals
   summary.grandTotal.boys =
      summary.prePrimary.boys + primaryBoys + upperPrimaryBoys + secondaryBoys + higherSecondaryBoys;
   summary.grandTotal.girls =
      summary.prePrimary.girls + primaryGirls + upperPrimaryGirls + secondaryGirls + higherSecondaryGirls;
   summary.grandTotal.total = summary.grandTotal.boys + summary.grandTotal.girls;
   summary.grandTotal.cwsn = (censusData.cwsn_students_boys || 0) + (censusData.cwsn_students_girls || 0);

   return summary;
}

/**
 * Generate teacher-student ratio report
 * @param {Object} censusData - Census data object
 * @returns {Object} - Teacher report with ratios and statistics
 */
function generateTeacherReport(censusData) {
   const enrollmentSummary = calculateEnrollmentSummary(censusData);
   const totalStudents = enrollmentSummary.grandTotal.total;
   const totalTeachers = censusData.total_teachers || 0;

   return {
      totalTeachers,
      maleTeachers: censusData.male_teachers || 0,
      femaleTeachers: censusData.female_teachers || 0,
      trainedTeachers: censusData.trained_teachers || 0,
      totalStudents,
      studentTeacherRatio: totalTeachers > 0 ? Math.round((totalStudents / totalTeachers) * 100) / 100 : 0,
      trainedTeacherPercentage:
         totalTeachers > 0 ? Math.round(((censusData.trained_teachers || 0) / totalTeachers) * 10000) / 100 : 0,
      femaleTeacherPercentage:
         totalTeachers > 0 ? Math.round(((censusData.female_teachers || 0) / totalTeachers) * 10000) / 100 : 0,
   };
}

/**
 * Generate infrastructure status report
 * @param {Object} censusData - Census data object
 * @returns {Object} - Infrastructure report with condition analysis
 */
function generateInfrastructureReport(censusData) {
   const totalClassrooms = censusData.total_classrooms || 0;
   const goodClassrooms = censusData.classrooms_good_condition || 0;
   const minorRepairClassrooms = censusData.classrooms_minor_repair || 0;
   const majorRepairClassrooms = censusData.classrooms_major_repair || 0;

   return {
      classrooms: {
         total: totalClassrooms,
         goodCondition: goodClassrooms,
         minorRepair: minorRepairClassrooms,
         majorRepair: majorRepairClassrooms,
         goodConditionPercentage:
            totalClassrooms > 0 ? Math.round((goodClassrooms / totalClassrooms) * 10000) / 100 : 0,
      },
      facilities: {
         library: censusData.library_available || false,
         computerLab: censusData.computer_lab_available || false,
         drinkingWater: censusData.drinking_water_available || false,
         toilet: censusData.toilet_facility_available || false,
         electricity: censusData.electricity_available || false,
      },
      facilityScore: calculateFacilityScore(censusData),
   };
}

/**
 * Calculate facility score based on available amenities
 * @param {Object} censusData - Census data object
 * @returns {Object} - Facility score with breakdown
 */
function calculateFacilityScore(censusData) {
   const facilities = [
      'library_available',
      'computer_lab_available',
      'drinking_water_available',
      'toilet_facility_available',
      'electricity_available',
   ];

   let availableCount = 0;
   facilities.forEach((facility) => {
      if (censusData[facility]) {
         availableCount++;
      }
   });

   const percentage = Math.round((availableCount / facilities.length) * 10000) / 100;

   return {
      availableFacilities: availableCount,
      totalFacilities: facilities.length,
      percentage,
      grade: getGradeByPercentage(percentage),
   };
}

/**
 * Get grade based on percentage score
 * @param {number} percentage - Percentage score
 * @returns {string} - Grade (A+, A, B+, B, C+, C, D)
 */
function getGradeByPercentage(percentage) {
   if (percentage >= 95) {
      return 'A+';
   }
   if (percentage >= 85) {
      return 'A';
   }
   if (percentage >= 75) {
      return 'B+';
   }
   if (percentage >= 65) {
      return 'B';
   }
   if (percentage >= 55) {
      return 'C+';
   }
   if (percentage >= 45) {
      return 'C';
   }
   return 'D';
}

/**
 * Generate comprehensive school report for UDISE submission
 * @param {Object} censusData - Census data object
 * @returns {Object} - Complete school report with all metrics
 */
function generateSchoolReport(censusData) {
   const enrollmentSummary = calculateEnrollmentSummary(censusData);
   const teacherReport = generateTeacherReport(censusData);
   const infrastructureReport = generateInfrastructureReport(censusData);

   return {
      basicInfo: {
         schoolId: censusData.school_id,
         academicYear: censusData.academic_year,
         censusDate: censusData.census_date,
         dataCollectionPhase: censusData.data_collection_phase,
         status: censusData.status,
      },
      enrollment: enrollmentSummary,
      teachers: teacherReport,
      infrastructure: infrastructureReport,
      specialCategories: {
         cwsnStudents: {
            boys: censusData.cwsn_students_boys || 0,
            girls: censusData.cwsn_students_girls || 0,
            total: (censusData.cwsn_students_boys || 0) + (censusData.cwsn_students_girls || 0),
            percentage:
               enrollmentSummary.grandTotal.total > 0
                  ? Math.round(
                       (((censusData.cwsn_students_boys || 0) + (censusData.cwsn_students_girls || 0)) /
                          enrollmentSummary.grandTotal.total) *
                          10000
                    ) / 100
                  : 0,
         },
      },
      overallScore: calculateOverallScore(enrollmentSummary, teacherReport, infrastructureReport),
   };
}

/**
 * Calculate overall school performance score
 * @param {Object} enrollmentSummary - Enrollment summary
 * @param {Object} teacherReport - Teacher report
 * @param {Object} infrastructureReport - Infrastructure report
 * @returns {Object} - Overall score with breakdown
 */
function calculateOverallScore(enrollmentSummary, teacherReport, infrastructureReport) {
   let score = 0;
   const components = {
      enrollment: 0,
      teachers: 0,
      infrastructure: 0,
   };

   // Enrollment score (30 points max)
   const totalEnrollment = enrollmentSummary.grandTotal.total;
   if (totalEnrollment > 0) {
      components.enrollment = Math.min(30, totalEnrollment / 10);
   }

   // Teacher score (40 points max)
   const ptr = teacherReport.studentTeacherRatio;
   if (ptr > 0) {
      if (ptr <= 30) {
         components.teachers = 40;
      } else if (ptr <= 40) {
         components.teachers = 30;
      } else if (ptr <= 50) {
         components.teachers = 20;
      } else {
         components.teachers = 10;
      }

      // Add bonus for trained teachers
      if (teacherReport.trainedTeacherPercentage >= 80) {
         components.teachers += 5;
      }
   }

   // Infrastructure score (30 points max)
   components.infrastructure =
      infrastructureReport.classrooms.goodConditionPercentage * 0.2 +
      infrastructureReport.facilityScore.percentage * 0.1;

   score = components.enrollment + components.teachers + components.infrastructure;

   return {
      totalScore: Math.round(score * 100) / 100,
      components,
      grade: getGradeByPercentage(score),
      maxScore: 100,
   };
}

module.exports = {
   calculateEnrollmentSummary,
   generateTeacherReport,
   generateInfrastructureReport,
   calculateFacilityScore,
   generateSchoolReport,
   calculateOverallScore,
   getGradeByPercentage,
};
