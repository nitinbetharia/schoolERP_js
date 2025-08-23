const mysql = require('mysql2/promise');

async function analyzeTablePurposes() {
   try {
      const connectionConfig = {
         host: '140.238.167.36',
         user: 'school_erp_admin',
         password: 'Nitin@123#',
         multipleStatements: true
      };

      const connection = await mysql.createConnection(connectionConfig);

      // Get tables only in demo
      await connection.execute('USE school_erp_trust_demo');
      const [demoTables] = await connection.execute('SHOW TABLES');
      const demoTableNames = demoTables.map(row => Object.values(row)[0]);

      await connection.execute('USE school_erp_trust_maroon');
      const [maroonTables] = await connection.execute('SHOW TABLES');
      const maroonTableNames = maroonTables.map(row => Object.values(row)[0]);

      const onlyInDemo = demoTableNames.filter(table => !maroonTableNames.includes(table));

      console.log('=== TABLES ONLY IN DEMO (Missing in Maroon) ===');
      console.log(`Total: ${onlyInDemo.length} tables\n`);

      // Categorize tables by functionality
      const categories = {
         'Fee Management': [
            'fee_receipts', 'fee_structures', 'payment_gateways', 
            'payment_method_configs', 'payment_transactions'
         ],
         'Communication System': [
            'communication_history', 'communication_messages', 'communication_preferences',
            'communication_settings', 'communication_statistics', 'communication_templates',
            'email_configurations', 'email_delivery_tracking', 'sms_configurations', 
            'sms_delivery_reports'
         ],
         'Notification System': [
            'notification_delivery_logs', 'notification_jobs', 'notification_templates',
            'notifications_queue'
         ],
         'Student Management': [
            'admissions', 'student_parents', 'student_transfers'
         ],
         'Attendance System': [
            'attendance_daily', 'attendance_summary'
         ],
         'Leave Management': [
            'leave_applications'
         ],
         'Document Management': [
            'documents'
         ],
         'Dashboard & UI': [
            'dashboard_widgets'
         ],
         'Reporting System': [
            'generated_reports', 'report_executions', 'report_favorites',
            'report_schedules', 'report_shares', 'report_templates', 'reports',
            'scheduled_report_executions'
         ],
         'System Management': [
            'backup_configurations', 'backup_history', 'trust_audit_logs',
            'trust_config', 'user_school_assignments'
         ],
         'Forms & Configuration': [
            'form_configurations', 'custom_field_definitions'
         ],
         'Academic Structure': [
            'subjects'
         ]
      };

      // Analyze each table
      await connection.execute('USE school_erp_trust_demo');
      
      for (const [category, tables] of Object.entries(categories)) {
         const foundTables = tables.filter(table => onlyInDemo.includes(table));
         if (foundTables.length > 0) {
            console.log(`\n📁 ${category.toUpperCase()}`);
            console.log('=' + '='.repeat(category.length + 2));
            
            for (const table of foundTables) {
               try {
                  // Get table structure
                  const [columns] = await connection.execute(`DESCRIBE ${table}`);
                  const [rowCount] = await connection.execute(
                     `SELECT COUNT(*) as count FROM ${table}`);
                  
                  console.log(`\n🔹 ${table.toUpperCase()}`);
                  console.log(`   Columns: ${columns.length}, Records: ${rowCount[0].count}`);
                  
                  // Show key columns
                  const keyColumns = columns
                     .filter(col => col.Key === 'PRI' || col.Key === 'UNI' || col.Key === 'MUL')
                     .map(col => `${col.Field}(${col.Key})`)
                     .join(', ');
                  if (keyColumns) {
                     console.log(`   Key Fields: ${keyColumns}`);
                  }
                  
                  // Show sample of important columns
                  const importantCols = columns
                     .slice(0, 4)
                     .map(col => col.Field)
                     .join(', ');
                  console.log(`   Main Fields: ${importantCols}`);
                  
               } catch (err) {
                  console.log(`\n🔹 ${table.toUpperCase()}: Error analyzing - ${err.message}`);
               }
            }
         }
      }

      // Check for uncategorized tables
      const categorizedTables = Object.values(categories).flat();
      const uncategorized = onlyInDemo.filter(table => !categorizedTables.includes(table));
      
      if (uncategorized.length > 0) {
         console.log('\n\n📁 UNCATEGORIZED TABLES');
         console.log('========================');
         for (const table of uncategorized) {
            console.log(`🔸 ${table}`);
         }
      }

      await connection.end();
      
      console.log('\n\n=== SUMMARY ===');
      console.log(`Total missing tables in maroon: ${onlyInDemo.length}`);
      console.log('Major missing functionality:');
      Object.entries(categories).forEach(([category, tables]) => {
         const found = tables.filter(t => onlyInDemo.includes(t));
         if (found.length > 0) {
            console.log(`  - ${category}: ${found.length} tables`);
         }
      });

   } catch (error) {
      console.error('Error analyzing tables:', error.message);
   }
}

analyzeTablePurposes();
