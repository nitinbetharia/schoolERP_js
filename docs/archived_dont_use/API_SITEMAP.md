# School ERP System - API Sitemap & Endpoint Documentation

## Table of Contents
1. [Authentication Endpoints](#authentication-endpoints)
2. [Setup & Configuration](#setup--configuration)
3. [User Management](#user-management)
4. [Student Management](#student-management)
5. [Fee Management](#fee-management)
6. [Attendance Management](#attendance-management)
7. [Reports & Analytics](#reports--analytics)
8. [Dashboard & Widgets](#dashboard--widgets)
9. [Communication](#communication)
10. [System Utilities](#system-utilities)

---

## Authentication Endpoints

### 🔐 User Authentication
```
POST   /auth/login              # User login
POST   /auth/logout             # User logout
POST   /auth/register           # User registration
POST   /auth/forgot-password    # Request password reset
POST   /auth/reset-password     # Reset password with token
GET    /auth/verify-session     # Verify session validity
POST   /auth/refresh-token      # Refresh authentication token
GET    /auth/2fa/generate       # Generate 2FA QR code
POST   /auth/2fa/verify         # Verify 2FA token
POST   /auth/2fa/disable        # Disable 2FA
```

### 🔑 Session Management
```
GET    /auth/sessions           # List active sessions
DELETE /auth/sessions/:id       # Terminate specific session
DELETE /auth/sessions/all       # Terminate all sessions
GET    /auth/login-history      # View login history
```

---

## Setup & Configuration

### 🏢 Trust Management
```
GET    /api/setup/trust         # Get trust configuration
POST   /api/setup/trust         # Create/setup trust
PUT    /api/setup/trust         # Update trust settings
GET    /api/setup/trust/wizard  # Get wizard configuration
POST   /api/setup/trust/wizard  # Process wizard step
```

### 🏫 School Management
```
GET    /api/setup/schools       # List schools in trust
POST   /api/setup/school        # Create new school
PUT    /api/setup/school/:id    # Update school
DELETE /api/setup/school/:id    # Delete school
GET    /api/setup/school/wizard # Get school wizard config
POST   /api/setup/school/wizard # Process school wizard
```

### ⚙️ System Configuration
```
GET    /api/config/app          # Get application config
PUT    /api/config/app          # Update app configuration
GET    /api/config/features     # Get enabled features
PUT    /api/config/features     # Update feature flags
GET    /api/config/themes       # Get available themes
POST   /api/config/themes       # Create custom theme
```

---

## User Management

### 👥 Users CRUD
```
GET    /api/users               # List users (with filters)
POST   /api/users               # Create new user
GET    /api/users/:id           # Get user details
PUT    /api/users/:id           # Update user
DELETE /api/users/:id           # Delete user
PATCH  /api/users/:id/status    # Update user status
POST   /api/users/:id/reset-password  # Reset user password
```

### 👥 Bulk Operations
```
POST   /api/users/bulk-action   # Perform bulk actions
POST   /api/users/import        # Import users from file
GET    /api/users/export        # Export users to file
GET    /api/users/template      # Download import template
```

### 🎭 Roles & Permissions
```
GET    /api/roles               # List available roles
GET    /api/roles/:id           # Get role details
POST   /api/roles               # Create custom role
PUT    /api/roles/:id           # Update role
DELETE /api/roles/:id           # Delete role
GET    /api/permissions         # List all permissions
POST   /api/users/:id/roles     # Assign roles to user
DELETE /api/users/:id/roles/:roleId  # Remove role from user
```

### 📱 User Profile
```
GET    /api/profile             # Get current user profile
PUT    /api/profile             # Update profile
POST   /api/profile/avatar      # Upload profile picture
POST   /api/profile/change-password  # Change password
GET    /api/profile/preferences # Get user preferences
PUT    /api/profile/preferences # Update preferences
```

---

## Student Management

### 🎓 Students CRUD
```
GET    /api/students            # List students (with filters)
POST   /api/students            # Create new student
GET    /api/students/:id        # Get student details
PUT    /api/students/:id        # Update student
DELETE /api/students/:id        # Delete student
PATCH  /api/students/:id/status # Update student status
```

### 📝 Admission Management
```
POST   /api/students/admission  # Create admission application
GET    /api/admissions          # List admission applications
GET    /api/admissions/:id      # Get admission details
POST   /api/admissions/:id/approve    # Approve admission
POST   /api/admissions/:id/reject     # Reject admission
POST   /api/admissions/:id/documents  # Upload documents
```

### 🔄 Student Operations
```
POST   /api/students/:id/promote      # Promote to next class
POST   /api/students/:id/transfer     # Transfer student
POST   /api/students/:id/withdraw     # Withdraw student
GET    /api/students/:id/timeline     # Get student timeline
GET    /api/students/:id/documents    # Get student documents
POST   /api/students/:id/documents    # Upload documents
```

### 📋 Bulk Student Operations
```
POST   /api/students/bulk-action      # Bulk operations
POST   /api/students/bulk/promote     # Bulk promotion
POST   /api/students/bulk/transfer    # Bulk transfer
POST   /api/students/import           # Import students
GET    /api/students/export           # Export students
GET    /api/students/bulk/id-cards    # Generate bulk ID cards
```

### 🏫 Classes & Sections
```
GET    /api/classes                   # List classes
POST   /api/classes                   # Create class
GET    /api/classes/:id               # Get class details
PUT    /api/classes/:id               # Update class
DELETE /api/classes/:id               # Delete class
GET    /api/classes/:id/students      # List students in class
GET    /api/classes/:id/sections      # List sections in class
POST   /api/classes/:id/sections      # Create section
```

---

## Fee Management

### 💰 Fee Structures
```
GET    /api/fees/structures           # List fee structures
POST   /api/fees/structures           # Create fee structure
GET    /api/fees/structures/:id       # Get structure details
PUT    /api/fees/structures/:id       # Update structure
DELETE /api/fees/structures/:id       # Delete structure
POST   /api/fees/structures/:id/assign    # Assign to students
```

### 💳 Fee Collection
```
GET    /api/fees/collections          # List collections
POST   /api/fees/collect              # Collect fee payment
GET    /api/fees/collections/:id      # Get collection details
PUT    /api/fees/collections/:id      # Update collection
DELETE /api/fees/collections/:id      # Delete collection
POST   /api/fees/collections/:id/receipt  # Generate receipt
```

### 📊 Fee Reports
```
GET    /api/fees/reports/summary      # Fee summary report
GET    /api/fees/reports/defaulters   # Fee defaulters report
GET    /api/fees/reports/collections  # Collection reports
GET    /api/fees/reports/pending      # Pending fees report
GET    /api/fees/student/:id          # Student fee details
```

### 💸 Discounts & Concessions
```
GET    /api/fees/discounts            # List discount schemes
POST   /api/fees/discounts            # Create discount
GET    /api/fees/discounts/:id        # Get discount details
PUT    /api/fees/discounts/:id        # Update discount
DELETE /api/fees/discounts/:id        # Delete discount
POST   /api/fees/apply-discount       # Apply discount to student
```

---

## Attendance Management

### ✅ Daily Attendance
```
GET    /api/attendance/today          # Today's attendance summary
POST   /api/attendance/mark           # Mark attendance
GET    /api/attendance/class/:id      # Get class attendance
POST   /api/attendance/bulk-mark      # Bulk mark attendance
PUT    /api/attendance/:id            # Update attendance record
GET    /api/attendance/student/:id    # Student attendance history
```

### 📅 Leave Management
```
GET    /api/leaves                    # List leave applications
POST   /api/leaves                    # Apply for leave
GET    /api/leaves/:id                # Get leave details
PUT    /api/leaves/:id                # Update leave application
DELETE /api/leaves/:id                # Cancel leave application
POST   /api/leaves/:id/approve        # Approve leave
POST   /api/leaves/:id/reject         # Reject leave
```

### 📈 Attendance Reports
```
GET    /api/attendance/reports/summary        # Attendance summary
GET    /api/attendance/reports/monthly        # Monthly attendance
GET    /api/attendance/reports/student/:id    # Individual student report
GET    /api/attendance/reports/class/:id      # Class attendance report
GET    /api/attendance/reports/defaulters     # Attendance defaulters
GET    /api/attendance/statistics             # Attendance statistics
```

### ⏰ Attendance Settings
```
GET    /api/attendance/settings       # Get attendance settings
PUT    /api/attendance/settings       # Update settings
GET    /api/attendance/holidays       # List holidays
POST   /api/attendance/holidays       # Add holiday
DELETE /api/attendance/holidays/:id   # Remove holiday
```

---

## Reports & Analytics

### 📊 Standard Reports
```
GET    /api/reports/templates         # List report templates
GET    /api/reports/generate/:template    # Generate report
POST   /api/reports/custom            # Create custom report
GET    /api/reports/:id               # Get report details
DELETE /api/reports/:id               # Delete report
GET    /api/reports/:id/download      # Download report
```

### 📈 Analytics Dashboard
```
GET    /api/analytics/overview        # System overview
GET    /api/analytics/students        # Student analytics
GET    /api/analytics/fees            # Fee analytics
GET    /api/analytics/attendance      # Attendance analytics
GET    /api/analytics/performance     # Academic performance
GET    /api/analytics/trends          # Trend analysis
```

### 📋 Custom Reports
```
GET    /api/reports/builder           # Report builder config
POST   /api/reports/build             # Build custom report
GET    /api/reports/data-sources      # Available data sources
GET    /api/reports/fields/:source    # Fields for data source
POST   /api/reports/preview           # Preview report
POST   /api/reports/schedule          # Schedule report
```

---

## Dashboard & Widgets

### 📱 Dashboard Management
```
GET    /api/dashboard/config          # Get dashboard config
PUT    /api/dashboard/config          # Update dashboard layout
GET    /api/dashboard/widgets         # List available widgets
POST   /api/dashboard/widgets/batch   # Get multiple widget data
GET    /api/dashboard/widget/:id      # Get widget data
PUT    /api/dashboard/widget/:id      # Update widget config
```

### 📊 Widget Data
```
GET    /api/widgets/student-count     # Student count widget
GET    /api/widgets/fee-collection    # Fee collection widget  
GET    /api/widgets/attendance-today  # Today's attendance
GET    /api/widgets/recent-activities # Recent activities
GET    /api/widgets/notifications     # Notification widget
GET    /api/widgets/calendar-events   # Calendar widget
```

### 🎛️ Dashboard Customization
```
POST   /api/dashboard/layouts         # Save dashboard layout
GET    /api/dashboard/layouts         # Get saved layouts
DELETE /api/dashboard/layouts/:id     # Delete layout
POST   /api/dashboard/widgets/add     # Add widget to dashboard
DELETE /api/dashboard/widgets/:id     # Remove widget
```

---

## Communication

### 📧 Messaging System
```
GET    /api/communication/messages    # List messages
POST   /api/communication/compose     # Send message
GET    /api/communication/messages/:id    # Get message details
DELETE /api/communication/messages/:id  # Delete message
POST   /api/communication/messages/:id/reply  # Reply to message
```

### 📢 Announcements
```
GET    /api/communication/announcements       # List announcements
POST   /api/communication/announcements       # Create announcement
GET    /api/communication/announcements/:id   # Get announcement
PUT    /api/communication/announcements/:id   # Update announcement
DELETE /api/communication/announcements/:id   # Delete announcement
POST   /api/communication/announcements/:id/publish  # Publish announcement
```

### 📱 Notifications
```
GET    /api/communication/notifications       # List notifications
POST   /api/communication/notify              # Send notification
GET    /api/communication/notifications/:id   # Get notification
PUT    /api/communication/notifications/:id   # Mark as read
DELETE /api/communication/notifications/:id   # Delete notification
POST   /api/communication/notifications/mark-all-read  # Mark all read
```

### 📋 Templates
```
GET    /api/communication/templates           # List message templates
POST   /api/communication/templates           # Create template
GET    /api/communication/templates/:id       # Get template
PUT    /api/communication/templates/:id       # Update template
DELETE /api/communication/templates/:id       # Delete template
```

### 📊 Communication Reports
```
GET    /api/communication/reports/delivery    # Delivery reports
GET    /api/communication/reports/engagement  # Engagement reports
GET    /api/communication/settings            # Communication settings
PUT    /api/communication/settings            # Update settings
```

---

## System Utilities

### 🏥 Health & Monitoring
```
GET    /health                        # System health check
GET    /api/system/status             # Detailed system status
GET    /api/system/metrics            # System metrics
GET    /api/system/logs               # System logs
GET    /api/system/performance        # Performance metrics
```

### 🔧 Maintenance
```
POST   /api/system/backup             # Create system backup
POST   /api/system/restore            # Restore from backup
GET    /api/system/backups            # List available backups
DELETE /api/system/backups/:id        # Delete backup
POST   /api/system/maintenance        # Toggle maintenance mode
```

### 📁 File Management
```
POST   /api/files/upload              # Upload file
GET    /api/files/:id                 # Download file
DELETE /api/files/:id                 # Delete file
GET    /api/files/list                # List uploaded files
POST   /api/files/bulk-upload         # Bulk file upload
```

### 🔍 Search & Filters
```
GET    /api/search/global             # Global search
GET    /api/search/students           # Search students
GET    /api/search/users              # Search users
GET    /api/search/suggestions        # Search suggestions
POST   /api/search/save-query         # Save search query
```

### 📊 Data Import/Export
```
POST   /api/import/validate           # Validate import file
POST   /api/import/process            # Process import
GET    /api/import/status/:id         # Check import status
GET    /api/export/templates          # Export templates
POST   /api/export/generate           # Generate export
GET    /api/export/download/:id       # Download export
```

---

## Error Handling & Response Formats

### Standard Response Format
```json
{
    "success": true|false,
    "data": { ... },
    "error": "Error message",
    "code": "ERROR_CODE",
    "meta": {
        "total": 100,
        "page": 1,
        "per_page": 25,
        "has_more": true
    }
}
```

### Error Codes
```
AUTH_FAILED          - Authentication failed
PERMISSION_DENIED     - Insufficient permissions
VALIDATION_ERROR      - Input validation failed
NOT_FOUND            - Resource not found
DUPLICATE_ENTRY      - Duplicate entry
RATE_LIMITED         - Rate limit exceeded
SERVER_ERROR         - Internal server error
MAINTENANCE_MODE     - System in maintenance
```

### HTTP Status Codes
```
200 - OK                    # Successful GET, PUT, PATCH
201 - Created              # Successful POST
204 - No Content           # Successful DELETE
400 - Bad Request          # Validation error
401 - Unauthorized         # Authentication required
403 - Forbidden            # Permission denied
404 - Not Found            # Resource not found
422 - Unprocessable Entity # Validation failed
429 - Too Many Requests    # Rate limited
500 - Internal Server Error # Server error
503 - Service Unavailable  # Maintenance mode
```

---

## Authentication & Authorization

### Required Headers
```
Authorization: Bearer <token>      # For API token auth
Content-Type: application/json     # For JSON requests
X-CSRF-Token: <token>             # For CSRF protection
X-Requested-With: XMLHttpRequest   # For AJAX requests
```

### Permission Format
```
resource:action
```

Examples:
```
students:create          # Create students
students:read           # View students
students:update         # Edit students
students:delete         # Delete students
fees:collect           # Collect fees
reports:generate       # Generate reports
```

---

## Rate Limiting

### Default Limits
```
Authentication: 5 requests/15 minutes
API Calls: 1000 requests/hour
File Upload: 10 requests/hour
Bulk Operations: 5 requests/hour
```

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1628097600
Retry-After: 3600
```

---

## Versioning

### API Versioning
```
/api/v1/students         # Version 1 (current)
/api/v2/students         # Version 2 (future)
```

### Backward Compatibility
- Version 1 will be supported for 12 months after Version 2 release
- Deprecated endpoints will return warning headers
- Breaking changes will require version increment

---

**This API sitemap provides complete coverage of all School ERP endpoints with proper RESTful design, comprehensive error handling, and production-ready features. All endpoints follow the established security, validation, and response standards outlined in the development documentation.**