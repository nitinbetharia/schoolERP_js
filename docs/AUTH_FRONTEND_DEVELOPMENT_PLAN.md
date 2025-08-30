# Frontend Authentication Development Plan

## 🔍 **REVISED REQUIREMENTS ANALYSIS**

Based on clarifications:

1. **User Registration** = Protected admin routes (role-based control)
2. **2FA Infrastructure** = Framework only (tenant-configurable, no implementation)
3. **Change Password** = Email-based flow (not in-app form)
4. **Password Reset** = Critical missing feature

## 📋 **UPDATED DEVELOPMENT PLAN**

### **PHASE 1: Password Reset Flow** (Priority: HIGH)

**Estimated Time: 8 hours**

#### **1.1 Forgot Password Page** (2 hours)

```html
<!-- views/pages/auth/forgot-password.ejs -->
- Clean email input form - Tenant-aware branding - Progressive enhancement - Clear instructions
```

#### **1.2 Reset Password Page** (2 hours)

```html
<!-- views/pages/auth/reset-password.ejs -->
- Token validation display - New password form with strength meter - Security messaging - Success confirmation
```

#### **1.3 Backend Routes** (3 hours)

```javascript
// routes/web.js - Email-based flow
GET  /forgot-password     // Render form
POST /forgot-password     // Send reset email
GET  /reset-password/:token   // Validate token & render form
POST /reset-password/:token  // Process password reset
```

#### **1.4 Email Templates** (1 hour)

```html
<!-- Professional reset email template -->
- Security-focused messaging - Token expiration notice - Brand consistency
```

### **PHASE 2: Admin-Controlled User Registration** (Priority: MEDIUM)

**Estimated Time: 6 hours**

#### **2.1 Admin User Management Pages** (3 hours)

```html
<!-- views/pages/admin/users/create.ejs -->
- Role-based access control - User creation form (admin only) - Bulk user import - Email invitation system
```

#### **2.2 User Invitation Flow** (2 hours)

```html
<!-- views/pages/auth/activate-account.ejs -->
- Account activation page - Initial password setup - Welcome workflow
```

#### **2.3 Protected Registration Routes** (1 hour)

```javascript
// routes/web.js - Protected routes
GET  /admin/users/create        // Admin only
POST /admin/users/create        // Create user + send invite
GET  /activate-account/:token   // User account activation
POST /activate-account/:token   // Set initial password
```

### **PHASE 3: 2FA Infrastructure** (Priority: MEDIUM)

**Estimated Time: 4 hours**

#### **3.1 2FA Configuration Framework** (2 hours)

```javascript
// models/TenantConfiguration.js - Add 2FA settings
twoFactorAuth: {
  enabled: false,           // Tenant-level toggle
  required: false,          // Force all users
  methods: ['totp', 'sms'], // Available methods
  backupCodes: true         // Enable backup codes
}
```

#### **3.2 2FA UI Components** (2 hours)

```html
<!-- views/partials/2fa/ -->
- setup-placeholder.ejs // Framework for future TOTP setup - verify-placeholder.ejs // Framework for verification -
config-toggle.ejs // Admin tenant configuration
```

### **PHASE 4: Email-Based Password Change** (Priority: MEDIUM)

**Estimated Time: 3 hours**

#### **4.1 Password Change via Email** (2 hours)

```html
<!-- views/pages/profile/security.ejs -->
- "Request Password Change" button - Current password verification - Sends email with secure link
```

#### **4.2 Secure Change Workflow** (1 hour)

```javascript
// Similar to reset but requires current session
POST /profile/request-password-change  // Authenticated route
GET  /change-password/:token          // Secure token validation
POST /change-password/:token          // Process change
```

## 🏗️ **IMPLEMENTATION STRUCTURE**

### **File Organization**

```
views/pages/auth/
├── login.ejs                 ✅ Complete
├── logout.ejs                ✅ Complete
├── forgot-password.ejs       ❌ Phase 1
├── reset-password.ejs        ❌ Phase 1
├── activate-account.ejs      ❌ Phase 2
└── 2fa/                      ❌ Phase 3 (placeholder)
    ├── setup-placeholder.ejs
    └── verify-placeholder.ejs

views/pages/admin/users/
├── create.ejs                ❌ Phase 2
├── list.ejs                  ✅ Exists
└── invite.ejs                ❌ Phase 2

views/pages/profile/
└── security.ejs              ❌ Phase 4

views/partials/2fa/
├── config-toggle.ejs         ❌ Phase 3
└── status-indicator.ejs      ❌ Phase 3
```

### **Route Structure**

```javascript
// Authentication routes (public)
GET|POST /forgot-password
GET|POST /reset-password/:token
GET|POST /activate-account/:token

// Admin routes (protected, role-based)
GET|POST /admin/users/create
GET|POST /admin/users/invite
GET      /admin/users/2fa-settings

// User profile routes (authenticated)
GET|POST /profile/request-password-change
GET|POST /change-password/:token
```

### **Database Schema Extensions**

```javascript
// TenantConfiguration model additions
two_factor_settings: {
  type: DataTypes.JSON,
  defaultValue: {
    enabled: false,
    required_for_admin: false,
    methods: ['totp'],
    backup_codes_enabled: true
  }
}

// User model additions (both System & Tenant)
two_factor_enabled: {
  type: DataTypes.BOOLEAN,
  defaultValue: false
},
two_factor_secret: {
  type: DataTypes.STRING(255),
  allowNull: true
},
backup_codes: {
  type: DataTypes.JSON,
  allowNull: true
}
```

## 🎯 **RECOMMENDED IMPLEMENTATION ORDER**

### **Sprint 1: Critical Auth (8 hours)**

✅ **Phase 1: Password Reset Flow**

- Covers the most critical missing feature
- Essential for production deployment
- Improves security posture

### **Sprint 2: User Management (6 hours)**

✅ **Phase 2: Admin-Controlled Registration**

- Removes manual user creation overhead
- Maintains security through admin control
- Enables scalable onboarding

### **Sprint 3: Future-Proofing (7 hours)**

✅ **Phase 3 + 4: 2FA Infrastructure + Email Password Change**

- Sets foundation for enhanced security
- Tenant-configurable security policies
- Enterprise-ready authentication

## 📊 **UPDATED COMPLETENESS ASSESSMENT**

| Component         | Current | After Sprint 1 | After Sprint 2 | After Sprint 3 |
| ----------------- | ------- | -------------- | -------------- | -------------- |
| Login/Logout      | 95%     | 95%            | 95%            | 95%            |
| Password Reset    | 0%      | **100%**       | 100%           | 100%           |
| User Registration | 0%      | 0%             | **100%**       | 100%           |
| 2FA Framework     | 0%      | 0%             | 0%             | **80%**        |
| Password Change   | 0%      | 0%             | 0%             | **100%**       |
| **Overall Auth**  | **60%** | **78%**        | **89%**        | **95%**        |

## ✅ **KEY DESIGN DECISIONS**

1. **Security First**: All sensitive operations via email tokens
2. **Role-Based Access**: Admin-controlled user lifecycle
3. **Tenant Flexibility**: 2FA configurable per tenant
4. **Progressive Enhancement**: Works without JavaScript
5. **Email-Based Flows**: Reduces in-app security risks

## 🚀 **IMMEDIATE NEXT STEPS**

**Ready for Sprint 1 Implementation:**

1. Create forgot-password.ejs template
2. Create reset-password.ejs template
3. Add email-based reset routes
4. Design reset email templates
5. Test complete password reset workflow

**Shall I proceed with implementing the password reset flow (Phase 1)?**
