# BROKEN ROUTES - Service Dependencies Removed

## Route Files Requiring Updates

1. **routes/fee-routes.js**
   - `const feeService = require('../modules/fees/fees-service');` (REMOVED)
   - `const setupService = require('../modules/setup/setup-service');` (REMOVED)

2. **routes/user-routes.js**
   - `const userService = require('../modules/user/user-service');` (REMOVED)

3. **routes/web-routes.js**
   - `const dashboardService = require('../modules/dashboard/dashboard-service');`
     (REMOVED)
   - `const systemDashboardService = require('../modules/dashboard/system-dashboard-service');`
     (REMOVED)

4. **routes/system-dashboard-routes.js**
   - `const systemDashboardService = require('../modules/dashboard/system-dashboard-service');`
     (REMOVED)

5. **routes/student-routes.js**
   - `const studentService = require('../modules/student/student-service');`
     (REMOVED)

6. **routes/setup-routes.js**
   - `const setupService = require('../modules/setup/setup-service');` (REMOVED)

7. **routes/report-routes.js**
   - `const reportsService = require('../modules/reports/reports-service');`
     (REMOVED)

8. **routes/dashboard-routes.js**
   - `const dashboardService = require('../modules/dashboard/dashboard-service');`
     (REMOVED)

9. **routes/communication-routes.js**
   - `const communicationService = require('../modules/communication/communication-service');`
     (REMOVED)
   - `const setupService = require('../modules/setup/setup-service');` (REMOVED)
   - **KEEPING**: `emailProviders` and `smsProviders` (no raw SQL)

10. **routes/auth.js**
    - `const authService = require('../modules/auth/auth-service');` (REMOVED)

11. **routes/auth-routes.js**
    - `const authService = require('../modules/auth/auth-service');` (REMOVED)

12. **routes/attendance-routes.js**
    - `const attendanceService = require('../modules/attendance/attendance-service');`
      (REMOVED)

13. **routes/api/enhanced-reports.js**
    - `const EnhancedReportsService = require('../../modules/reports/enhanced-reports-service');`
      (REMOVED)

14. **routes/api/auth.js**
    - `const authService = require('../../modules/auth/auth-service');`
      (REMOVED)

## Next Actions Needed

1. ✅ **Complete Phase 1 cleanup**
2. **Phase 2**: Build ORM-compliant replacements
3. **Phase 3**: Update route files to use new services
4. **Phase 4**: Test all routes with new service layer

## Scripts with Raw SQL (Legacy - Phase 1.4)

Multiple scripts still use raw mysql2 - these are setup/migration scripts which
may be acceptable, but need review for Q1 compliance.
