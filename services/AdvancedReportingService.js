/**
 * Advanced Reporting Service
 * Enhanced service for comprehensive reports with analytics, charts, and exports
 */

const { logger } = require('../utils/logger');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

class AdvancedReportingService {
   constructor() {
      this.reportCache = new Map();
      this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
   }

   /**
    * Generate comprehensive student report with analytics
    */
   async generateStudentAnalyticsReport(filters, tenantDb) {
      try {
         const { startDate, endDate, classId, sectionId, reportType } = filters;

         const Student = tenantDb.models.Student;
         const whereClause = {};

         if (classId) {
            whereClause.class_id = classId;
         }
         if (sectionId) {
            whereClause.section_id = sectionId;
         }

         // Get student data with associations
         const students = await Student.findAll({
            where: whereClause,
            include: [
               {
                  model: tenantDb.models.FeeTransaction,
                  as: 'feeTransactions',
                  where: startDate && endDate ? {
                     payment_date: {
                        [tenantDb.Sequelize.Op.between]: [startDate, endDate]
                     }
                  } : undefined,
                  required: false
               },
               {
                  model: tenantDb.models.Class,
                  attributes: ['name', 'standard']
               }
            ]
         });

         // Generate analytics
         const analytics = {
            totalStudents: students.length,
            classDistribution: this.calculateClassDistribution(students),
            feeAnalytics: this.calculateFeeAnalytics(students),
            demographicAnalysis: this.calculateDemographicAnalysis(students),
            performanceMetrics: await this.calculatePerformanceMetrics(students, tenantDb)
         };

         // Create charts data
         const chartData = {
            classWiseDistribution: {
               labels: Object.keys(analytics.classDistribution),
               data: Object.values(analytics.classDistribution)
            },
            feeCollectionTrend: analytics.feeAnalytics.monthlyTrend,
            genderDistribution: {
               labels: ['Male', 'Female', 'Other'],
               data: [
                  analytics.demographicAnalysis.male,
                  analytics.demographicAnalysis.female,
                  analytics.demographicAnalysis.other
               ]
            }
         };

         const report = {
            metadata: {
               generatedAt: new Date(),
               reportType: 'Student Analytics',
               filters,
               totalRecords: students.length
            },
            summary: analytics,
            chartData,
            students: students.map(student => ({
               id: student.id,
               name: `${student.first_name} ${student.last_name}`,
               rollNumber: student.roll_number,
               class: student.Class?.name,
               totalFeePaid: student.feeTransactions?.reduce((sum, txn) => sum + parseFloat(txn.amount), 0) || 0
            }))
         };

         logger.info('Student analytics report generated', {
            totalStudents: students.length,
            reportType
         });

         return report;

      } catch (error) {
         logger.error('Failed to generate student analytics report', { error: error.message });
         throw error;
      }
   }

   /**
    * Generate financial analytics report
    */
   async generateFinancialAnalyticsReport(filters, tenantDb) {
      try {
         const { startDate, endDate } = filters;

         const FeeTransaction = tenantDb.models.FeeTransaction;
         const FeeInstallment = tenantDb.models.FeeInstallment;

         // Get transaction data
         const transactions = await FeeTransaction.findAll({
            where: {
               payment_date: {
                  [tenantDb.Sequelize.Op.between]: [startDate, endDate]
               }
            },
            include: [
               {
                  model: tenantDb.models.Student,
                  attributes: ['first_name', 'last_name', 'roll_number']
               }
            ]
         });

         // Get outstanding data
         const outstandingInstallments = await FeeInstallment.findAll({
            where: {
               status: ['pending', 'partial', 'overdue']
            },
            include: [
               {
                  model: tenantDb.models.Student,
                  attributes: ['first_name', 'last_name', 'roll_number']
               }
            ]
         });

         // Calculate financial metrics
         const financialMetrics = {
            totalCollection: transactions.reduce((sum, txn) => sum + parseFloat(txn.amount), 0),
            totalOutstanding: outstandingInstallments.reduce((sum, inst) => 
               sum + (parseFloat(inst.amount) - parseFloat(inst.paid_amount || 0)), 0),
            totalPenalty: transactions.reduce((sum, txn) => sum + parseFloat(txn.penalty_amount || 0), 0),
            averageTransaction: 0,
            collectionRate: 0
         };

         financialMetrics.averageTransaction = transactions.length > 0 ? 
            financialMetrics.totalCollection / transactions.length : 0;
         
         const totalDue = financialMetrics.totalCollection + financialMetrics.totalOutstanding;
         financialMetrics.collectionRate = totalDue > 0 ? 
            (financialMetrics.totalCollection / totalDue) * 100 : 0;

         // Monthly trend analysis
         const monthlyTrend = this.calculateMonthlyTrend(transactions, startDate, endDate);

         // Payment method analysis
         const paymentMethodAnalysis = this.calculatePaymentMethodAnalysis(transactions);

         const report = {
            metadata: {
               generatedAt: new Date(),
               reportType: 'Financial Analytics',
               filters,
               totalTransactions: transactions.length
            },
            summary: financialMetrics,
            monthlyTrend,
            paymentMethodAnalysis,
            outstandingDetails: outstandingInstallments.map(inst => ({
               studentName: `${inst.Student.first_name} ${inst.Student.last_name}`,
               rollNumber: inst.Student.roll_number,
               amount: inst.amount,
               paidAmount: inst.paid_amount || 0,
               outstanding: inst.amount - (inst.paid_amount || 0),
               dueDate: inst.due_date,
               status: inst.status
            }))
         };

         logger.info('Financial analytics report generated', {
            totalTransactions: transactions.length,
            totalCollection: financialMetrics.totalCollection
         });

         return report;

      } catch (error) {
         logger.error('Failed to generate financial analytics report', { error: error.message });
         throw error;
      }
   }

   /**
    * Export report to Excel
    */
   async exportToExcel(reportData, reportType) {
      try {
         const workbook = new ExcelJS.Workbook();
         const worksheet = workbook.addWorksheet(`${reportType} Report`);

         // Add metadata
         worksheet.addRow(['Report Type:', reportType]);
         worksheet.addRow(['Generated At:', reportData.metadata.generatedAt.toISOString()]);
         worksheet.addRow(['Total Records:', reportData.metadata.totalRecords || 0]);
         worksheet.addRow([]); // Empty row

         if (reportType === 'Student Analytics') {
            // Add summary section
            worksheet.addRow(['SUMMARY ANALYTICS']);
            worksheet.addRow(['Total Students:', reportData.summary.totalStudents]);
            worksheet.addRow(['Classes:', Object.keys(reportData.summary.classDistribution).length]);
            worksheet.addRow([]); // Empty row

            // Add student data
            worksheet.addRow(['STUDENT DETAILS']);
            const headers = ['ID', 'Name', 'Roll Number', 'Class', 'Total Fee Paid'];
            worksheet.addRow(headers);

            reportData.students.forEach(student => {
               worksheet.addRow([
                  student.id,
                  student.name,
                  student.rollNumber,
                  student.class,
                  student.totalFeePaid
               ]);
            });

         } else if (reportType === 'Financial Analytics') {
            // Add financial summary
            worksheet.addRow(['FINANCIAL SUMMARY']);
            worksheet.addRow(['Total Collection:', reportData.summary.totalCollection]);
            worksheet.addRow(['Total Outstanding:', reportData.summary.totalOutstanding]);
            worksheet.addRow(['Collection Rate:', `${reportData.summary.collectionRate.toFixed(2)}%`]);
            worksheet.addRow([]); // Empty row

            // Add outstanding details
            if (reportData.outstandingDetails?.length > 0) {
               worksheet.addRow(['OUTSTANDING DETAILS']);
               const outstandingHeaders = ['Student Name', 'Roll Number', 'Amount', 'Paid', 'Outstanding', 'Due Date', 'Status'];
               worksheet.addRow(outstandingHeaders);

               reportData.outstandingDetails.forEach(detail => {
                  worksheet.addRow([
                     detail.studentName,
                     detail.rollNumber,
                     detail.amount,
                     detail.paidAmount,
                     detail.outstanding,
                     detail.dueDate,
                     detail.status
                  ]);
               });
            }
         }

         // Style the headers
         worksheet.getRow(1).font = { bold: true, size: 14 };
         worksheet.columns.forEach(column => {
            column.width = 15;
         });

         const buffer = await workbook.xlsx.writeBuffer();
         
         logger.info('Report exported to Excel', { reportType });
         
         return buffer;

      } catch (error) {
         logger.error('Failed to export report to Excel', { error: error.message });
         throw error;
      }
   }

   /**
    * Export report to PDF
    */
   async exportToPDF(reportData, reportType) {
      try {
         return new Promise((resolve, reject) => {
            const doc = new PDFDocument();
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
               const pdfBuffer = Buffer.concat(buffers);
               resolve(pdfBuffer);
            });
            doc.on('error', reject);

            // Add title
            doc.fontSize(20).text(`${reportType} Report`, 50, 50);
            doc.fontSize(12).text(`Generated on: ${reportData.metadata.generatedAt.toDateString()}`, 50, 80);

            let currentY = 120;

            if (reportType === 'Student Analytics') {
               // Add summary
               doc.fontSize(16).text('Summary', 50, currentY);
               currentY += 30;

               doc.fontSize(12);
               doc.text(`Total Students: ${reportData.summary.totalStudents}`, 50, currentY);
               currentY += 20;

               // Add class distribution
               doc.text('Class Distribution:', 50, currentY);
               currentY += 20;
               
               Object.entries(reportData.summary.classDistribution).forEach(([className, count]) => {
                  doc.text(`  ${className}: ${count} students`, 70, currentY);
                  currentY += 15;
               });

            } else if (reportType === 'Financial Analytics') {
               // Add financial summary
               doc.fontSize(16).text('Financial Summary', 50, currentY);
               currentY += 30;

               doc.fontSize(12);
               doc.text(`Total Collection: ₹${reportData.summary.totalCollection.toLocaleString()}`, 50, currentY);
               currentY += 20;
               doc.text(`Total Outstanding: ₹${reportData.summary.totalOutstanding.toLocaleString()}`, 50, currentY);
               currentY += 20;
               doc.text(`Collection Rate: ${reportData.summary.collectionRate.toFixed(2)}%`, 50, currentY);
               currentY += 20;
            }

            doc.end();
         });

      } catch (error) {
         logger.error('Failed to export report to PDF', { error: error.message });
         throw error;
      }
   }

   // Helper methods
   calculateClassDistribution(students) {
      const distribution = {};
      students.forEach(student => {
         const className = student.Class?.name || 'Unassigned';
         distribution[className] = (distribution[className] || 0) + 1;
      });
      return distribution;
   }

   calculateFeeAnalytics(students) {
      const analytics = {
         totalFeePaid: 0,
         averageFeePerStudent: 0,
         monthlyTrend: []
      };

      students.forEach(student => {
         const totalPaid = student.feeTransactions?.reduce((sum, txn) => sum + parseFloat(txn.amount), 0) || 0;
         analytics.totalFeePaid += totalPaid;
      });

      analytics.averageFeePerStudent = students.length > 0 ? analytics.totalFeePaid / students.length : 0;

      return analytics;
   }

   calculateDemographicAnalysis(students) {
      const analysis = { male: 0, female: 0, other: 0 };
      
      students.forEach(student => {
         const gender = (student.gender || 'other').toLowerCase();
         if (analysis.hasOwnProperty(gender)) {
            analysis[gender]++;
         } else {
            analysis.other++;
         }
      });

      return analysis;
   }

   async calculatePerformanceMetrics(_students, _tenantDb) {
      // This would integrate with examination module when implemented
      return {
         averageGrade: 'N/A',
         passRate: 'N/A',
         topPerformers: []
      };
   }

   calculateMonthlyTrend(transactions, _startDate, _endDate) {
      const trend = {};
      transactions.forEach(txn => {
         const month = txn.payment_date.toISOString().substr(0, 7); // YYYY-MM format
         trend[month] = (trend[month] || 0) + parseFloat(txn.amount);
      });
      return trend;
   }

   calculatePaymentMethodAnalysis(transactions) {
      const analysis = {};
      transactions.forEach(txn => {
         const method = txn.payment_method || 'Unknown';
         analysis[method] = (analysis[method] || 0) + 1;
      });
      return analysis;
   }
}

module.exports = AdvancedReportingService;
