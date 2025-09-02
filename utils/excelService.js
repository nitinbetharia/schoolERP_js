const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const { logger } = require('./logger');

/**
 * Excel Service - Generate Excel exports for school ERP
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

// Helper function to style Excel headers
function styleHeaders(worksheet) {
   const headerRow = worksheet.getRow(1);
   headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
         type: 'pattern',
         pattern: 'solid',
         fgColor: { argb: '366092' }
      };
      cell.border = {
         top: { style: 'thin' },
         left: { style: 'thin' },
         bottom: { style: 'thin' },
         right: { style: 'thin' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
   });
   headerRow.height = 25;
}

// Helper function to add borders to data rows
function styleDataRows(worksheet, startRow, endRow) {
   for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      const row = worksheet.getRow(rowIndex);
      row.eachCell((cell) => {
         cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
         };
         cell.alignment = { vertical: 'middle' };
      });
   }
}

/**
 * Generate student list Excel file
 */
async function generateStudentList(students, schoolData = {}) {
   try {
      const tempDir = ensureTempDir();
      const fileName = `student-list-${Date.now()}.xlsx`;
      const outputPath = path.join(tempDir, fileName);
    
      const workbook = new ExcelJS.Workbook();
    
      // Set workbook properties
      workbook.creator = 'School ERP System';
      workbook.created = new Date();
      workbook.modified = new Date();
    
      const worksheet = workbook.addWorksheet('Students');
    
      // Define columns
      worksheet.columns = [
         { header: 'S.No.', key: 'sno', width: 8 },
         { header: 'Student ID', key: 'student_id', width: 12 },
         { header: 'Name', key: 'name', width: 30 },
         { header: 'Email', key: 'email', width: 30 },
         { header: 'Phone', key: 'phone', width: 15 },
         { header: 'Class', key: 'class', width: 15 },
         { header: 'Roll Number', key: 'roll_number', width: 12 },
         { header: 'Status', key: 'status', width: 12 },
         { header: 'Admission Date', key: 'admission_date', width: 15 }
      ];
    
      // Add data
      students.forEach((student, index) => {
         worksheet.addRow({
            sno: index + 1,
            student_id: student.student_id || student.id,
            name: `${student.first_name || student.name || ''} ${student.last_name || ''}`.trim(),
            email: student.email || 'N/A',
            phone: student.phone || 'N/A',
            class: student.class_name || student.class || 'N/A',
            roll_number: student.roll_number || 'N/A',
            status: student.status || 'ACTIVE',
            admission_date: student.admission_date ? new Date(student.admission_date).toLocaleDateString() : 'N/A'
         });
      });
    
      // Style headers
      styleHeaders(worksheet);
    
      // Style data rows
      if (students.length > 0) {
         styleDataRows(worksheet, 2, students.length + 1);
      }
    
      // Add title at top
      worksheet.insertRow(1, [`${schoolData.name || 'School ERP System'} - Student List`]);
      worksheet.mergeCells(1, 1, 1, 9);
      const titleRow = worksheet.getRow(1);
      titleRow.font = { size: 16, bold: true };
      titleRow.alignment = { horizontal: 'center' };
      titleRow.height = 30;
    
      // Add summary
      worksheet.insertRow(2, [`Generated on: ${new Date().toLocaleDateString()}`, '', '', '', '', '', '', '', `Total Students: ${students.length}`]);
      const summaryRow = worksheet.getRow(2);
      summaryRow.font = { italic: true };
      summaryRow.height = 20;
    
      // Save file
      await workbook.xlsx.writeFile(outputPath);
    
      logger.info('Student list Excel generated', { path: outputPath, studentCount: students.length });
      return outputPath;
    
   } catch (error) {
      logger.error('Error generating student list Excel', error);
      throw error;
   }
}

/**
 * Generate fee report Excel file
 */
async function generateFeeReport(feeData, reportData = {}) {
   try {
      const tempDir = ensureTempDir();
      const fileName = `fee-report-${Date.now()}.xlsx`;
      const outputPath = path.join(tempDir, fileName);
    
      const workbook = new ExcelJS.Workbook();
    
      // Set workbook properties
      workbook.creator = 'School ERP System';
      workbook.created = new Date();
      workbook.modified = new Date();
    
      const worksheet = workbook.addWorksheet('Fee Report');
    
      // Define columns
      worksheet.columns = [
         { header: 'S.No.', key: 'sno', width: 8 },
         { header: 'Receipt No', key: 'receipt_no', width: 15 },
         { header: 'Student Name', key: 'student_name', width: 25 },
         { header: 'Class', key: 'class', width: 12 },
         { header: 'Fee Type', key: 'fee_type', width: 20 },
         { header: 'Amount (₹)', key: 'amount', width: 12 },
         { header: 'Payment Date', key: 'payment_date', width: 15 },
         { header: 'Payment Method', key: 'payment_method', width: 15 },
         { header: 'Status', key: 'status', width: 12 }
      ];
    
      // Add data
      let totalAmount = 0;
      feeData.forEach((fee, index) => {
         const amount = parseFloat(fee.amount) || 0;
         totalAmount += amount;
      
         worksheet.addRow({
            sno: index + 1,
            receipt_no: fee.receipt_no || fee.receiptNo || 'N/A',
            student_name: fee.student_name || `${fee.first_name || ''} ${fee.last_name || ''}`.trim() || 'N/A',
            class: fee.class_name || fee.class || 'N/A',
            fee_type: fee.fee_type || fee.feeType || 'General Fee',
            amount: amount.toFixed(2),
            payment_date: fee.payment_date ? new Date(fee.payment_date).toLocaleDateString() : 'N/A',
            payment_method: fee.payment_method || fee.paymentMethod || 'N/A',
            status: fee.status || 'PAID'
         });
      });
    
      // Style headers
      styleHeaders(worksheet);
    
      // Style data rows
      if (feeData.length > 0) {
         styleDataRows(worksheet, 2, feeData.length + 1);
      }
    
      // Add title at top
      worksheet.insertRow(1, [`${reportData.schoolName || 'School ERP System'} - Fee Report`]);
      worksheet.mergeCells(1, 1, 1, 9);
      const titleRow = worksheet.getRow(1);
      titleRow.font = { size: 16, bold: true };
      titleRow.alignment = { horizontal: 'center' };
      titleRow.height = 30;
    
      // Add summary
      worksheet.insertRow(2, [
         `Period: ${reportData.fromDate || 'N/A'} to ${reportData.toDate || 'N/A'}`,
         '', '', '', '',
         `Total Amount: ₹${totalAmount.toFixed(2)}`,
         '', '',
         `Total Records: ${feeData.length}`
      ]);
      const summaryRow = worksheet.getRow(2);
      summaryRow.font = { italic: true };
      summaryRow.height = 20;
    
      // Add total row at bottom
      const totalRowIndex = feeData.length + 3;
      worksheet.addRow(['', '', '', '', 'TOTAL:', totalAmount.toFixed(2), '', '', '']);
      const totalRow = worksheet.getRow(totalRowIndex);
      totalRow.font = { bold: true };
      totalRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF99' } };
      totalRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF99' } };
    
      // Save file
      await workbook.xlsx.writeFile(outputPath);
    
      logger.info('Fee report Excel generated', { path: outputPath, recordCount: feeData.length, totalAmount });
      return outputPath;
    
   } catch (error) {
      logger.error('Error generating fee report Excel', error);
      throw error;
   }
}

/**
 * Generate attendance report Excel file
 */
async function generateAttendanceReport(attendanceData, reportData = {}) {
   try {
      const tempDir = ensureTempDir();
      const fileName = `attendance-report-${Date.now()}.xlsx`;
      const outputPath = path.join(tempDir, fileName);
    
      const workbook = new ExcelJS.Workbook();
    
      // Set workbook properties
      workbook.creator = 'School ERP System';
      workbook.created = new Date();
      workbook.modified = new Date();
    
      const worksheet = workbook.addWorksheet('Attendance Report');
    
      // Define columns
      worksheet.columns = [
         { header: 'S.No.', key: 'sno', width: 8 },
         { header: 'Roll No', key: 'roll_number', width: 10 },
         { header: 'Student Name', key: 'student_name', width: 25 },
         { header: 'Class', key: 'class', width: 12 },
         { header: 'Date', key: 'date', width: 12 },
         { header: 'Status', key: 'status', width: 12 },
         { header: 'Check-in Time', key: 'check_in', width: 15 },
         { header: 'Check-out Time', key: 'check_out', width: 15 },
         { header: 'Remarks', key: 'remarks', width: 20 }
      ];
    
      // Add data
      let presentCount = 0;
      let absentCount = 0;
    
      attendanceData.forEach((record, index) => {
         const status = record.status || 'PRESENT';
         if (status === 'PRESENT') {presentCount++;}
         else if (status === 'ABSENT') {absentCount++;}
      
         worksheet.addRow({
            sno: index + 1,
            roll_number: record.roll_number || 'N/A',
            student_name: record.student_name || `${record.first_name || ''} ${record.last_name || ''}`.trim() || 'N/A',
            class: record.class_name || record.class || 'N/A',
            date: record.date ? new Date(record.date).toLocaleDateString() : 'N/A',
            status: status,
            check_in: record.check_in_time || 'N/A',
            check_out: record.check_out_time || 'N/A',
            remarks: record.remarks || '-'
         });
      });
    
      // Style headers
      styleHeaders(worksheet);
    
      // Style data rows with conditional formatting for status
      if (attendanceData.length > 0) {
         for (let rowIndex = 2; rowIndex <= attendanceData.length + 1; rowIndex++) {
            const row = worksheet.getRow(rowIndex);
            row.eachCell((cell) => {
               cell.border = {
                  top: { style: 'thin' },
                  left: { style: 'thin' },
                  bottom: { style: 'thin' },
                  right: { style: 'thin' }
               };
               cell.alignment = { vertical: 'middle' };
            });
        
            // Color code status
            const statusCell = row.getCell(6);
            if (statusCell.value === 'PRESENT') {
               statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C6EFCE' } };
            } else if (statusCell.value === 'ABSENT') {
               statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC7CE' } };
            }
         }
      }
    
      // Add title at top
      worksheet.insertRow(1, [`${reportData.schoolName || 'School ERP System'} - Attendance Report`]);
      worksheet.mergeCells(1, 1, 1, 9);
      const titleRow = worksheet.getRow(1);
      titleRow.font = { size: 16, bold: true };
      titleRow.alignment = { horizontal: 'center' };
      titleRow.height = 30;
    
      // Add summary
      worksheet.insertRow(2, [
         `Class: ${reportData.className || 'N/A'}`,
         `Date: ${reportData.date || new Date().toLocaleDateString()}`,
         '', '',
         `Total: ${attendanceData.length}`,
         `Present: ${presentCount}`,
         `Absent: ${absentCount}`,
         '', ''
      ]);
      const summaryRow = worksheet.getRow(2);
      summaryRow.font = { italic: true };
      summaryRow.height = 20;
    
      // Save file
      await workbook.xlsx.writeFile(outputPath);
    
      logger.info('Attendance report Excel generated', { 
         path: outputPath, 
         recordCount: attendanceData.length, 
         presentCount, 
         absentCount 
      });
      return outputPath;
    
   } catch (error) {
      logger.error('Error generating attendance report Excel', error);
      throw error;
   }
}

/**
 * Clean up old Excel files (security measure)
 */
async function cleanupTempFiles(olderThanHours = 24) {
   try {
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {return;}
    
      const files = fs.readdirSync(tempDir);
      const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    
      files.forEach(file => {
         if (path.extname(file) === '.xlsx') {
            const filePath = path.join(tempDir, file);
            const stats = fs.statSync(filePath);
        
            if (stats.mtime.getTime() < cutoffTime) {
               fs.unlinkSync(filePath);
               logger.info('Cleaned up old Excel file', { file });
            }
         }
      });
    
   } catch (error) {
      logger.error('Error cleaning up Excel temp files', error);
   }
}

module.exports = {
   generateStudentList,
   generateFeeReport,
   generateAttendanceReport,
   cleanupTempFiles
};