-- Insert default Enhanced Reporting Framework templates
INSERT IGNORE INTO report_templates (
    template_name,
    report_type,
    template_config,
    sql_query,
    is_system,
    created_by
  )
VALUES (
    'Student Enrollment Report',
    'ACADEMIC',
    '{"title":"Student Enrollment Report","description":"Track student enrollment trends over time","chart_type":"line","fields":["enrollment_date","student_count"],"filters":[],"grouping":"DATE(enrollment_date)"}',
    'SELECT DATE(enrollment_date) as enrollment_date, COUNT(*) as student_count FROM students WHERE enrollment_date IS NOT NULL GROUP BY DATE(enrollment_date) ORDER BY enrollment_date DESC',
    1,
    1
  ),
  (
    'Fee Collection Summary',
    'FINANCIAL',
    '{"title":"Fee Collection Summary","description":"Monthly fee collection analysis","chart_type":"bar","fields":["payment_month","total_collected"],"filters":[],"grouping":"MONTH(payment_date)"}',
    'SELECT DATE_FORMAT(payment_date, "%Y-%m") as payment_month, SUM(amount) as total_collected FROM fee_receipts WHERE payment_date IS NOT NULL GROUP BY MONTH(payment_date), YEAR(payment_date) ORDER BY payment_date DESC',
    1,
    1
  ),
  (
    'Attendance Overview',
    'ATTENDANCE',
    '{"title":"Attendance Overview","description":"Student attendance patterns and statistics","chart_type":"pie","fields":["student_name","present_days","total_days"],"filters":[],"grouping":"student_id"}',
    'SELECT s.name as student_name, COUNT(CASE WHEN a.status = "PRESENT" THEN 1 END) as present_days, COUNT(*) as total_days FROM students s LEFT JOIN attendance_daily a ON s.id = a.student_id GROUP BY s.id, s.name',
    1,
    1
  ),
  (
    'Monthly Revenue Report',
    'FINANCIAL',
    '{"title":"Monthly Revenue Report","description":"Comprehensive revenue analysis","chart_type":"bar","fields":["revenue_month","total_revenue","payment_method"],"filters":[],"grouping":"payment_method"}',
    'SELECT DATE_FORMAT(payment_date, "%Y-%m") as revenue_month, SUM(amount) as total_revenue, payment_method FROM fee_receipts WHERE payment_date IS NOT NULL GROUP BY MONTH(payment_date), YEAR(payment_date), payment_method ORDER BY payment_date DESC',
    1,
    1
  ),
  (
    'Active Students Report',
    'STUDENT_LIST',
    '{"title":"Active Students Report","description":"List of all active students","chart_type":"table","fields":["student_name","class","section","enrollment_date"],"filters":[],"grouping":"class"}',
    'SELECT s.name as student_name, c.class_name as class, sec.section_name as section, s.enrollment_date FROM students s LEFT JOIN classes c ON s.class_id = c.id LEFT JOIN sections sec ON s.section_id = sec.id WHERE s.status = "ACTIVE" ORDER BY c.class_name, sec.section_name, s.name',
    1,
    1
  );
SELECT 'Enhanced Reporting Framework templates inserted successfully!' AS Result;
SELECT COUNT(*) as total_templates
FROM report_templates;