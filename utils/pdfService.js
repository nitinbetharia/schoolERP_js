const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');

/**
 * PDF Service - Generate PDF documents for school ERP
 * Simple, secure, reusable functions following DRY principles
 */

// Helper function to ensure temp directory exists
function ensureTempDir() {
   const tempDir = path.join(__dirname, '../temp');
   if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
   }
   return tempDir;
}

// Helper function to add header to PDF
function addPDFHeader(doc, title, schoolName = 'School ERP System') {
   doc.fontSize(20)
      .font('Helvetica-Bold')
      .text(schoolName, 50, 50, { align: 'center' });
  
   doc.fontSize(16)
      .font('Helvetica')
      .text(title, 50, 80, { align: 'center' });
  
   doc.moveTo(50, 110)
      .lineTo(550, 110)
      .stroke();
  
   return 130; // Return Y position for content
}

// Helper function to add footer
function addPDFFooter(doc) {
   const bottom = doc.page.height - 50;
  
   doc.fontSize(8)
      .font('Helvetica')
      .text(`Generated on ${new Date().toLocaleDateString()}`, 50, bottom, { align: 'left' })
      .text('Page ' + doc.pageNumber, 0, bottom, { align: 'right', width: 550 });
}

/**
 * Generate student report PDF
 */
async function generateStudentReport(students, schoolData = {}) {
   return new Promise((resolve, reject) => {
      try {
         const tempDir = ensureTempDir();
         const fileName = `student-report-${Date.now()}.pdf`;
         const outputPath = path.join(tempDir, fileName);
      
         const doc = new PDFDocument();
         const stream = fs.createWriteStream(outputPath);
      
         doc.pipe(stream);
      
         // Add header
         let yPosition = addPDFHeader(doc, 'Student Report', schoolData.name);
      
         // Add summary
         doc.fontSize(12)
            .font('Helvetica-Bold')
            .text(`Total Students: ${students.length}`, 50, yPosition);
      
         yPosition += 30;
      
         // Add student details
         students.forEach((student, index) => {
            if (yPosition > 700) {
               doc.addPage();
               yPosition = 50;
            }
        
            doc.fontSize(10)
               .font('Helvetica-Bold')
               .text(`${index + 1}. ${student.name || student.first_name} ${student.last_name || ''}`, 50, yPosition);
        
            yPosition += 15;
        
            doc.font('Helvetica')
               .text(`Email: ${student.email || 'N/A'}`, 70, yPosition)
               .text(`Class: ${student.class_name || student.class || 'N/A'}`, 250, yPosition)
               .text(`Status: ${student.status || 'ACTIVE'}`, 400, yPosition);
        
            yPosition += 20;
         });
      
         // Add footer
         addPDFFooter(doc);
      
         doc.end();
      
         stream.on('finish', () => {
            logger.info('Student report PDF generated', { path: outputPath, studentCount: students.length });
            resolve(outputPath);
         });
      
         stream.on('error', (error) => {
            logger.error('Failed to generate student report PDF', error);
            reject(error);
         });
      
      } catch (error) {
         logger.error('Error in generateStudentReport', error);
         reject(error);
      }
   });
}

/**
 * Generate fee receipt PDF
 */
async function generateFeeReceipt(feeData, studentData = {}, schoolData = {}) {
   return new Promise((resolve, reject) => {
      try {
         const tempDir = ensureTempDir();
         const fileName = `fee-receipt-${feeData.receiptNo || Date.now()}.pdf`;
         const outputPath = path.join(tempDir, fileName);
      
         const doc = new PDFDocument();
         const stream = fs.createWriteStream(outputPath);
      
         doc.pipe(stream);
      
         // Add header
         let yPosition = addPDFHeader(doc, 'Fee Receipt', schoolData.name);
      
         // Receipt details
         doc.fontSize(12)
            .font('Helvetica-Bold')
            .text('Receipt Details', 50, yPosition);
      
         yPosition += 25;
      
         doc.fontSize(10)
            .font('Helvetica')
            .text(`Receipt No: ${feeData.receiptNo || 'N/A'}`, 50, yPosition)
            .text(`Date: ${feeData.date || new Date().toLocaleDateString()}`, 300, yPosition);
      
         yPosition += 40;
      
         // Student details
         doc.fontSize(12)
            .font('Helvetica-Bold')
            .text('Student Details', 50, yPosition);
      
         yPosition += 25;
      
         doc.fontSize(10)
            .font('Helvetica')
            .text(`Name: ${studentData.name || studentData.first_name || 'N/A'}`, 50, yPosition)
            .text(`Class: ${studentData.class_name || 'N/A'}`, 300, yPosition);
      
         yPosition += 20;
      
         doc.text(`Student ID: ${studentData.student_id || studentData.id || 'N/A'}`, 50, yPosition)
            .text(`Roll No: ${studentData.roll_number || 'N/A'}`, 300, yPosition);
      
         yPosition += 40;
      
         // Fee details
         doc.fontSize(12)
            .font('Helvetica-Bold')
            .text('Fee Details', 50, yPosition);
      
         yPosition += 25;
      
         doc.fontSize(10)
            .font('Helvetica')
            .text(`Fee Type: ${feeData.feeType || 'General Fee'}`, 50, yPosition)
            .text(`Payment Method: ${feeData.paymentMethod || 'Cash'}`, 300, yPosition);
      
         yPosition += 20;
      
         doc.text(`Amount: ₹${feeData.amount || '0.00'}`, 50, yPosition)
            .text(`Status: ${feeData.status || 'Paid'}`, 300, yPosition);
      
         yPosition += 40;
      
         // Total box
         doc.rect(400, yPosition, 150, 30)
            .stroke();
      
         doc.fontSize(12)
            .font('Helvetica-Bold')
            .text(`Total: ₹${feeData.amount || '0.00'}`, 420, yPosition + 8);
      
         yPosition += 60;
      
         // Thank you message
         doc.fontSize(10)
            .font('Helvetica')
            .text('Thank you for your payment!', 50, yPosition, { align: 'center', width: 500 });
      
         // Add footer
         addPDFFooter(doc);
      
         doc.end();
      
         stream.on('finish', () => {
            logger.info('Fee receipt PDF generated', { path: outputPath, receiptNo: feeData.receiptNo });
            resolve(outputPath);
         });
      
         stream.on('error', (error) => {
            logger.error('Failed to generate fee receipt PDF', error);
            reject(error);
         });
      
      } catch (error) {
         logger.error('Error in generateFeeReceipt', error);
         reject(error);
      }
   });
}

/**
 * Generate attendance report PDF
 */
async function generateAttendanceReport(attendanceData, classData = {}, schoolData = {}) {
   return new Promise((resolve, reject) => {
      try {
         const tempDir = ensureTempDir();
         const fileName = `attendance-report-${Date.now()}.pdf`;
         const outputPath = path.join(tempDir, fileName);
      
         const doc = new PDFDocument();
         const stream = fs.createWriteStream(outputPath);
      
         doc.pipe(stream);
      
         // Add header
         let yPosition = addPDFHeader(doc, 'Attendance Report', schoolData.name);
      
         // Add class info
         doc.fontSize(12)
            .font('Helvetica-Bold')
            .text(`Class: ${classData.class_name || 'N/A'}`, 50, yPosition)
            .text(`Date: ${attendanceData.date || new Date().toLocaleDateString()}`, 300, yPosition);
      
         yPosition += 40;
      
         // Table headers
         doc.fontSize(10)
            .font('Helvetica-Bold')
            .text('Roll No', 50, yPosition)
            .text('Student Name', 120, yPosition)
            .text('Status', 350, yPosition)
            .text('Remarks', 450, yPosition);
      
         // Table line
         doc.moveTo(50, yPosition + 15)
            .lineTo(550, yPosition + 15)
            .stroke();
      
         yPosition += 25;
      
         // Attendance data
         if (attendanceData.records && attendanceData.records.length > 0) {
            attendanceData.records.forEach((record, index) => {
               if (yPosition > 700) {
                  doc.addPage();
                  yPosition = 50;
               }
          
               doc.fontSize(9)
                  .font('Helvetica')
                  .text(record.roll_number || (index + 1), 50, yPosition)
                  .text(record.student_name || 'N/A', 120, yPosition)
                  .text(record.status || 'Present', 350, yPosition)
                  .text(record.remarks || '-', 450, yPosition);
          
               yPosition += 18;
            });
         }
      
         // Add footer
         addPDFFooter(doc);
      
         doc.end();
      
         stream.on('finish', () => {
            logger.info('Attendance report PDF generated', { path: outputPath });
            resolve(outputPath);
         });
      
         stream.on('error', (error) => {
            logger.error('Failed to generate attendance report PDF', error);
            reject(error);
         });
      
      } catch (error) {
         logger.error('Error in generateAttendanceReport', error);
         reject(error);
      }
   });
}

/**
 * Clean up old PDF files (security measure)
 */
async function cleanupTempFiles(olderThanHours = 24) {
   try {
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {return;}
    
      const files = fs.readdirSync(tempDir);
      const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    
      files.forEach(file => {
         const filePath = path.join(tempDir, file);
         const stats = fs.statSync(filePath);
      
         if (stats.mtime.getTime() < cutoffTime) {
            fs.unlinkSync(filePath);
            logger.info('Cleaned up old temp file', { file });
         }
      });
    
   } catch (error) {
      logger.error('Error cleaning up temp files', error);
   }
}

module.exports = {
   generateStudentReport,
   generateFeeReceipt,
   generateAttendanceReport,
   cleanupTempFiles
};