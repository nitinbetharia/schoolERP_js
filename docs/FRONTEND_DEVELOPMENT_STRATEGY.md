# School ERP - Frontend Development Strategy

**Version**: 2.0.0  
**Date**: August 21, 2025  
**Status**: PRODUCTION READY - FRONTEND IMPLEMENTATION GUIDE  
**Repository**: schoolERP_js

---

## 📖 **TABLE OF CONTENTS**

1. [Mission Statement](#mission-statement)
2. [Frontend Tech Stack (Q1-Q10 Enforced)](#frontend-tech-stack)
3. [Multi-Tenant Authentication Architecture](#multi-tenant-authentication-architecture)
4. [Development Sequence (Module-wise)](#development-sequence)
5. [UI/UX Implementation Patterns](#uiux-implementation-patterns)
6. [Form Validation (Q59 ENFORCED)](#form-validation)
7. [EJS Template Structure](#ejs-template-structure)
8. [Integration Points](#integration-points)
9. [Critical Development Rules](#critical-development-rules)

---

## 🚀 **MISSION STATEMENT**

Build frontend interfaces that complement the bulletproof backend architecture, ensuring **100% compliance** with all 56 technical decisions while providing an intuitive, mobile-first user experience.

**Core Philosophy:** "Frontend enhances backend reliability, never compromises it."

---

## 🔧 **FRONTEND TECH STACK (Q1-Q10 ENFORCED)**

### **✅ REQUIRED TECHNOLOGIES (Per Documentation)**

| Decision                 | Implementation                      | Rationale                                 |
| ------------------------ | ----------------------------------- | ----------------------------------------- |
| **Q3: CSS Framework**    | Tailwind CSS 3.x (CDN only)         | ENFORCED - No Bootstrap/custom frameworks |
| **Q7: API Architecture** | MVC + EJS + JSON endpoints          | ENFORCED - No SPA-only, no GraphQL        |
| **Q2: Module System**    | CommonJS `require`/`module.exports` | ENFORCED - No ES6 imports, no TypeScript  |
| **Q6: Sessions**         | Express sessions + MySQL store      | ENFORCED - No JWT, no Redis sessions      |
| **Q59: Validation**      | Reuse API endpoint schemas          | ENFORCED - No custom web validation       |

```json
{
  "frontend": {
    "templating": "EJS 3.1.10",
    "styling": "Tailwind CSS 3.x (CDN)",
    "clientJS": "Alpine.js 3.x",
    "validation": "Joi (reused from API endpoints)",
    "fileHandling": "express-fileupload 1.5.2",
    "dateTime": "dayjs 1.11.13",
    "fonts": "Google Fonts (Inter) with system fallbacks",
    "icons": "Font Awesome 6 Free (CDN) + Heroicons inline",
    "animations": "CSS transforms + Alpine.js transitions"
  }
}
```

### **🎨 ENHANCED UI ASSETS**

#### **Typography & Fonts**
```html
<!-- Google Fonts - Professional system (CDN) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

<!-- CSS Font Stack with System Fallbacks -->
<style>
  :root {
    --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
                    'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 
                    'Droid Sans', 'Helvetica Neue', sans-serif;
    --font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', 
                 Consolas, 'Courier New', monospace;
  }
  
  body { 
    font-family: var(--font-primary);
    font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  }
</style>
```

#### **Icons Strategy**
```html
<!-- Font Awesome 6 Free - Core Icons (CDN) -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
      integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
      crossorigin="anonymous" referrerpolicy="no-referrer">

<!-- Icon Implementation Pattern -->
<i class="fas fa-dashboard mr-3 h-5 w-5"></i> <!-- Font Awesome -->
<svg class="h-5 w-5 mr-3">...</svg>         <!-- Heroicons inline (existing) -->
```

#### **Subtle Animations**
```css
/* CSS-only animations for performance */
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

.slide-up {
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.scale-in {
  animation: scaleIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Alpine.js transition classes */
.transition-enter { @apply transition duration-300 ease-out; }
.transition-leave { @apply transition duration-200 ease-in; }
```

### **❌ FORBIDDEN TECHNOLOGIES**

- Bootstrap, custom CSS frameworks (Q3 violation)
- React, Vue, Angular SPA frameworks (Q7 violation)
- TypeScript, ES6 imports (Q2 violation)
- JWT authentication (Q6 violation)
- Custom validation for web routes (Q59 violation)
- Heavy animation libraries (Framer Motion, GSAP) - Use CSS/Alpine.js only
- Icon fonts beyond Font Awesome 6 Free (licensing/performance)
- Custom font hosting (use Google Fonts CDN only)

---

## 🏗️ **MULTI-TENANT AUTHENTICATION ARCHITECTURE**

### **Dual Authentication System**

```
System Database: school_erp_system
├── System Admin Authentication
│   ├── Route: /auth/login (admin@system.local)
│   ├── Validation: systemUserValidationSchemas.login
│   └── Redirect: /admin/system
│
Trust Database: school_erp_trust_{trustCode}
├── Trust Context Authentication
│   ├── Route: /auth/login (user@demo.school)
│   ├── Validation: userValidationSchemas.login
│   └── Redirect: /dashboard
```

### **Tenant Detection Flow**

```javascript
// Tenant detection middleware (existing)
const tenantDetection = async (req, res, next) => {
  // 1. Extract subdomain: demo.localhost:3000 → 'demo'
  // 2. Fallback: localhost:3000 → defaultTrustCode ('demo')
  // 3. Initialize tenant models: getTenantModels(tenantCode)
  // 4. Set context: req.tenantCode, req.tenantModels
};
```

### **Authentication Flow (Existing Implementation)**

```javascript
// routes/web.js - Already implemented Q59 compliant authentication
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Determine validation schema based on login type
  const isSystemLogin = !email.includes("@") || email.includes("admin");

  let validationSchema;
  if (isSystemLogin) {
    validationSchema = systemUserValidationSchemas.login; // Q59 COMPLIANT
  } else {
    validationSchema = userValidationSchemas.login; // Q59 COMPLIANT
  }

  // Validate using existing schemas (Q59 ENFORCED)
  const { error } = validationSchema.validate({ username: email, password });
});
```

---

## 📱 **DEVELOPMENT SEQUENCE (MODULE-WISE)**

### **Phase 1: Foundation & Authentication (Week 1)**

#### **1.1 System Authentication UI** ✅ COMPLETED

- **File**: `views/pages/auth/login.ejs`
- **Features**: Dual login detection, Alpine.js validation
- **Validation**: Q59 compliant - reuses existing schemas
- **Status**: Production ready

#### **1.2 Trust Context Selection**

```javascript
// Tenant branding support (existing in auth.ejs)
<style>
  :root {
    <% if (tenant && tenant.branding) { %>
    --primary-color: <%= tenant.branding.primaryColor || '#3B82F6' %>;
    <% } %>
  }
</style>
```

### **Phase 2: Core Management (Week 2-3)**

#### **2.1 Dashboard Templates**

```
views/pages/dashboard/
├── system-admin.ejs     # Trust management interface
├── trust-admin.ejs      # School overview dashboard
├── teacher.ejs          # Teacher-specific dashboard
└── components/
    ├── stats-card.ejs   # Reusable metric cards
    ├── quick-actions.ejs # Action buttons
    └── activity-feed.ejs # Recent activities
```

#### **2.2 School Setup Module**

```javascript
// Q59 ENFORCED: Reuse existing validation schemas
const {
  setupConfigurationValidationSchemas,
} = require("../modules/setup/models/SetupConfiguration");
const { validators } = require("../utils/errors");

router.post(
  "/setup/school",
  validators.validateBody(setupConfigurationValidationSchemas.create),
  async (req, res) => {
    // req.body is validated using existing backend schema
  },
);
```

#### **2.3 School Management**

```javascript
// Q59 ENFORCED: Reuse school validation schemas
const { schoolValidationSchemas } = require("../modules/school/models/School");

router.post(
  "/schools",
  validators.validateBody(schoolValidationSchemas.create),
  async (req, res) => {
    // Validated school creation
  },
);
```

### **Phase 3: Student Management (Week 4-5)**

#### **3.1 Student Registration Form**

```javascript
// Q59 ENFORCED: Reuse student validation schemas
const { studentValidationSchemas } = require("../models");

router.post(
  "/students/new",
  validators.validateBody(studentValidationSchemas.create),
  async (req, res) => {
    // Multi-step form with existing validation
  },
);
```

**Template Structure**:

```
views/pages/students/
├── register.ejs         # Multi-tab registration form
├── directory.ejs        # Student listing with filters
├── profile.ejs          # Individual student profile
└── components/
    ├── student-form.ejs # Reusable form components
    ├── document-upload.ejs # File handling
    └── guardian-info.ejs # Guardian details
```

#### **3.2 Student Directory**

```javascript
// Server-side pagination (config compliant)
const pageSize = appConfig.ui.pagination.defaultPageSize; // 20
const students = await Student.findAndCountAll({
  limit: pageSize,
  offset: (page - 1) * pageSize,
  where: filters,
});
```

### **Phase 4: Fee Management (Week 6)**

#### **4.1 Fee Structure Setup**

```javascript
// Q59 ENFORCED: Reuse fee validation schemas
const {
  feeStructureValidationSchemas,
} = require("../modules/fee/models/FeeStructure");

router.post(
  "/fees/structures",
  validators.validateBody(feeStructureValidationSchemas.create),
  async (req, res) => {
    // Fee structure with existing validation
  },
);
```

#### **4.2 Fee Collection Interface**

```javascript
// Q59 ENFORCED: Reuse fee collection schemas
const {
  feeCollectionValidationSchemas,
} = require("../modules/fee/models/FeeCollection");

router.post(
  "/fees/collect",
  validators.validateBody(feeCollectionValidationSchemas.create),
  async (req, res) => {
    // Receipt generation with pdfkit (existing dependency)
  },
);
```

### **Phase 5: Attendance & Reports (Week 7-8)**

#### **5.1 Attendance Interface**

```javascript
// Q59 ENFORCED: Reuse attendance validation schemas
const {
  studentAttendanceValidationSchemas,
} = require("../modules/attendance/models/StudentAttendance");

router.post(
  "/attendance/mark",
  validators.validateBody(studentAttendanceValidationSchemas.create),
  async (req, res) => {
    // Mobile-first attendance marking
  },
);
```

---

## 🎨 **UI/UX IMPLEMENTATION PATTERNS**

### **Form Architecture (Q59 COMPLIANCE)**

```javascript
// ✅ CORRECT: Always reuse API validation schemas
const { validators } = require("../utils/errors");
const { studentValidationSchemas } = require("../models");

router.post(
  "/web/students",
  validators.validateBody(studentValidationSchemas.create), // Q59 ENFORCED
  async (req, res) => {
    // req.body is already validated and sanitized
    try {
      const student = await Student.create(req.body);
      res.json({ success: true, data: student });
    } catch (error) {
      // Structured error handling (Q21 compliant)
      res.status(500).json({
        success: false,
        error: {
          code: "STUDENT_CREATION_FAILED",
          message: "Failed to create student",
          timestamp: new Date().toISOString(),
        },
      });
    }
  },
);

// ❌ FORBIDDEN: Custom web validation (Q59 violation)
router.post("/web/students", async (req, res) => {
  if (!req.body.name) {
    // VIOLATION: Custom validation
    return res.status(400).json({ error: "Name required" });
  }
});
```

### **Alpine.js Component Pattern**

```javascript
// Enhanced form component with animations and better UX
function studentForm() {
  return {
    formData: {
      name: "",
      email: "",
      classId: "",
    },
    errors: {},
    loading: false,
    success: false,

    async submitForm() {
      this.loading = true;
      this.errors = {};
      this.success = false;

      try {
        const response = await fetch("/api/v1/students", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify(this.formData),
        });

        const data = await response.json();

        if (data.success) {
          // Success animation
          this.success = true;
          
          // Show success notification
          this.$dispatch('notify', {
            type: 'success',
            message: 'Student created successfully!'
          });
          
          // Redirect after animation
          setTimeout(() => {
            window.location.href = "/students";
          }, 1500);
        } else {
          // Error handling with shake animation
          this.errors = data.error.details || {};
          this.$refs.form.classList.add('animate-shake');
          setTimeout(() => {
            this.$refs.form.classList.remove('animate-shake');
          }, 500);
        }
      } catch (error) {
        console.error("Form submission error:", error);
        this.$dispatch('notify', {
          type: 'error',
          message: 'Network error. Please try again.'
        });
      } finally {
        this.loading = false;
      }
    },
  };
}
```

### **Mobile-First Design Principles**

```css
/* Tailwind CSS classes for mobile-first */
.form-input {
  @apply w-full px-4 py-3 text-base border border-gray-300 rounded-lg 
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
         min-h-[44px]; /* Touch target compliance */
}

.btn-primary {
  @apply w-full py-3 px-4 text-base font-medium text-white 
         bg-blue-600 rounded-lg hover:bg-blue-700 
         min-h-[44px]; /* Touch target compliance */
}

/* Responsive table handling */
.table-responsive {
  @apply overflow-x-auto;
}

@media (max-width: 768px) {
  .table-responsive table {
    @apply min-w-full;
  }
}
```

---

## 🔗 **FORM VALIDATION (Q59 ENFORCED)**

### **Validation Middleware Pattern**

```javascript
// utils/webValidators.js - Standardized web validation
const { validators } = require("./errors");

const webValidators = {
  // Reuse existing schemas for web routes
  validateStudentCreate: validators.validateBody(
    studentValidationSchemas.create,
  ),
  validateUserCreate: validators.validateBody(userValidationSchemas.create),
  validateFeeStructure: validators.validateBody(
    feeStructureValidationSchemas.create,
  ),
  validateAttendance: validators.validateBody(
    studentAttendanceValidationSchemas.create,
  ),
};

module.exports = webValidators;
```

### **Error Handling (Q21 Compliant)**

```javascript
// Structured error response pattern
const handleValidationError = (error, req, res) => {
  const response = {
    success: false,
    error: {
      code: "VALIDATION_FAILED",
      message: "Form validation failed",
      details: {},
      timestamp: new Date().toISOString(),
    },
  };

  // Transform Joi errors to user-friendly format
  if (error.details) {
    error.details.forEach((detail) => {
      const key = detail.path[0];
      response.error.details[key] = detail.message;
    });
  }

  return res.status(422).json(response);
};
```

---

## 📂 **EJS TEMPLATE STRUCTURE**

```
views/
├── layouts/
│   └── base.ejs           # Single universal layout (fonts, icons, scripts)
├── partials/
│   ├── head/
│   │   ├── seo.ejs        # SEO meta tags
│   │   ├── assets.ejs     # Fonts, icons, scripts (consistent loading)
│   │   └── theme.ejs      # Tenant branding variables
│   ├── nav/
│   │   ├── system-admin.ejs   # System admin navigation
│   │   ├── trust-admin.ejs    # Trust admin navigation  
│   │   ├── teacher.ejs        # Teacher navigation
│   │   └── auth.ejs           # Authentication layout nav
│   ├── layout/
│   │   ├── sidebar.ejs        # Main sidebar wrapper
│   │   ├── header.ejs         # Top header bar
│   │   └── footer.ejs         # Footer content
├── pages/
│   ├── auth/
│   │   └── login.ejs      # ✅ Already implemented
│   ├── dashboard/
│   │   ├── system-admin.ejs    # Trust management
│   │   ├── trust-admin.ejs     # School overview
│   │   └── teacher.ejs         # Teacher dashboard
│   ├── students/
│   │   ├── register.ejs        # Multi-step registration
│   │   ├── directory.ejs       # Student listing
│   │   └── profile.ejs         # Student details
│   ├── fees/
│   │   ├── structures.ejs      # Fee setup
│   │   ├── collection.ejs      # Fee collection
│   │   └── reports.ejs         # Fee reports
│   ├── attendance/
│   │   ├── mark.ejs           # Daily marking
│   │   └── reports.ejs        # Attendance reports
│   └── setup/
│       ├── wizard.ejs         # Initial school setup
│       └── complete.ejs       # Setup completion
├── partials/
│   ├── alerts.ejs         # ✅ Flash messages (existing)
│   ├── navigation.ejs     # Main navigation
│   ├── forms/
│   │   ├── student-form.ejs   # Student form components
│   │   ├── fee-form.ejs       # Fee form components
│   │   └── validation.ejs     # Validation display
│   └── modals/
│       ├── confirm.ejs        # Confirmation dialogs
│       └── forms.ejs          # Modal forms
└── components/
    ├── stats-cards.ejs    # Dashboard statistics
    ├── data-tables.ejs    # Responsive tables
    └── form-fields.ejs    # Reusable form fields
```

### **Single Layout Architecture**

```html
<!-- layouts/base.ejs - Universal layout with consistent asset loading -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- SEO & Meta -->
    <%- include('../partials/head/seo') %>
    
    <!-- Consistent Asset Loading -->
    <%- include('../partials/head/assets') %>
    
    <!-- Tenant Theme Variables -->
    <%- include('../partials/head/theme') %>
  </head>
  <body class="bg-gray-50 font-sans antialiased fade-in" x-data="{ sidebarOpen: false }">
    <!-- Flash Messages -->
    <%- include('../partials/alerts') %>
    
    <!-- Role-based Navigation -->
    <% 
      const navPartial = user?.role === 'SYSTEM_ADMIN' ? 'system-admin' :
                        user?.role === 'TRUST_ADMIN' ? 'trust-admin' :
                        user?.role === 'TEACHER' ? 'teacher' : 'auth';
    %>
    <%- include('../partials/nav/' + navPartial) %>

    <!-- Dynamic Layout Structure -->
    <% if (layout === 'auth') { %>
      <!-- Authentication pages - minimal layout -->
      <main class="min-h-screen flex items-center justify-center px-4">
        <div class="max-w-md w-full space-y-8 slide-up"><%- body %></div>
      </main>
    <% } else if (layout === 'dashboard') { %>
      <!-- Dashboard layout with sidebar -->
      <div class="flex h-screen bg-gray-50">
        <%- include('../partials/layout/sidebar') %>
        <div class="flex-1 flex flex-col overflow-hidden">
          <%- include('../partials/layout/header') %>
          <main class="flex-1 relative overflow-y-auto focus:outline-none slide-up">
            <div class="py-6"><%- body %></div>
          </main>
        </div>
      </div>
    <% } else { %>
      <!-- Default content layout -->
      <main class="container mx-auto px-4 py-8 slide-up"><%- body %></main>
    <% } %>

    <!-- Footer for non-auth layouts -->
    <% if (layout !== 'auth') { %>
      <%- include('../partials/layout/footer') %>
    <% } %>

    <!-- Global JavaScript -->
    <script src="/static/js/app.js"></script>
  </body>
</html>

<!-- Partial Templates for Consistent Asset Loading -->

<!-- partials/head/seo.ejs -->
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="<%= description || 'School ERP Management System' %>">
<title><%= title %> - <%= tenant ? tenant.name : 'School ERP System' %></title>

<!-- partials/head/assets.ejs - CONSISTENT LOADING -->
<!-- Google Fonts - Professional typography -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

<!-- Font Awesome 6 Free - Icons -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
      integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
      crossorigin="anonymous" referrerpolicy="no-referrer">

<!-- Tailwind CSS (Q3 ENFORCED) -->
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
        },
        animation: {
          'fade-in': 'fadeIn 0.3s ease-in-out',
          'slide-up': 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          'shake': 'shake 0.5s ease-in-out'
        }
      }
    }
  }
</script>

<!-- Alpine.js (Client-side reactivity) -->
<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>

<!-- Custom CSS -->
<link rel="stylesheet" href="/static/css/app.css">

<!-- partials/head/theme.ejs -->
<style>
  :root {
    <% if (tenant && tenant.branding) { %>
    --primary-color: <%= tenant.branding.primaryColor || '#3B82F6' %>;
    --secondary-color: <%= tenant.branding.secondaryColor || '#64748B' %>;
    <% } else { %>
    --primary-color: #1E40AF;
    --secondary-color: #1E3A8A;
    <% } %>
    
    --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --font-mono: 'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace;
  }
  
  body { 
    font-family: var(--font-primary);
    font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  }
  
  /* Animation keyframes */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { transform: translateY(10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }
</style>
```

---

## 🔗 **INTEGRATION POINTS**

### **API Endpoint Alignment**

```javascript
// Frontend routes align with existing API structure
const routeMapping = {
  // Authentication (✅ existing)
  "POST /auth/login":
    "systemAuthService.login() || userService.authenticateUser()",

  // Student management
  "GET  /api/v1/students": "Student.findAndCountAll() with filters",
  "POST /api/v1/students": "StudentService.createStudent() with validation",
  "PUT  /api/v1/students/:id": "StudentService.updateStudent() with validation",

  // Fee management
  "GET  /api/v1/fees/structures": "FeeStructure.findAll() with filters",
  "POST /api/v1/fees/collect": "FeeService.collectFee() with validation",

  // Attendance
  "POST /api/v1/attendance/mark":
    "AttendanceService.markAttendance() with validation",
};
```

### **Session Management (Q6 Compliant)**

```javascript
// Session structure (existing implementation)
req.session = {
  user: {
    id: 123,
    email: "admin@demo.school",
    role: "TRUST_ADMIN",
  },
  userType: "tenant", // or 'system'
  tenantCode: "demo",
  tenant: {
    id: 1,
    name: "Demo School Trust",
    branding: {
      /* theme colors */
    },
  },
};
```

---

## 📋 **CRITICAL DEVELOPMENT RULES**

### **1. Single Layout Principle**

```javascript
// ✅ ALWAYS: Use base.ejs for all pages
router.get('/dashboard', (req, res) => {
  res.render('pages/dashboard/index', {
    layout: 'dashboard',  // Controls content structure within base.ejs
    title: 'Dashboard',
    user: req.session.user,
    tenant: req.tenant
  });
});

// ✅ ALWAYS: Role-based navigation via partials
// Navigation automatically selected based on user.role in base.ejs
```

### **2. Validation Compliance (Q59 ENFORCED)**

```javascript
// ✅ ALWAYS: Reuse existing API validation schemas
const { studentValidationSchemas } = require("../models");
router.post(
  "/web/students",
  validators.validateBody(studentValidationSchemas.create),
);

// ❌ NEVER: Create custom validation for web routes
router.post("/web/students", customWebValidation); // FORBIDDEN
```

### **2. Technology Stack Compliance (Q1-Q10)**

```javascript
// ✅ REQUIRED: CommonJS modules (Q2)
const express = require('express');
const router = express.Router();

// ❌ FORBIDDEN: ES6 imports (Q2 violation)
import express from 'express'; // FORBIDDEN

// ✅ REQUIRED: Tailwind CSS (Q3)
<script src="https://cdn.tailwindcss.com"></script>

// ❌ FORBIDDEN: Bootstrap (Q3 violation)
<link href="bootstrap.css" rel="stylesheet"> <!-- FORBIDDEN -->
```

### **3. Error Handling (Q21 Compliant)**

```javascript
// ✅ REQUIRED: Structured error responses
const errorResponse = {
  success: false,
  error: {
    code: "VALIDATION_FAILED",
    message: "Form validation failed",
    details: { name: "Name is required" },
    timestamp: new Date().toISOString(),
  },
};

// ❌ FORBIDDEN: Simple error messages
res.status(400).send("Validation failed"); // FORBIDDEN
```

### **4. Async/Await Pattern (Q57-Q58)**

```javascript
// ✅ REQUIRED: Every async function must use try-catch
async function handleFormSubmission(req, res) {
  try {
    const result = await StudentService.createStudent(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    logError(error, { context: "student creation" });
    res.status(500).json({
      success: false,
      error: {
        code: "STUDENT_CREATION_FAILED",
        message: "Failed to create student",
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// ❌ FORBIDDEN: No try-catch in async functions
async function handleFormSubmission(req, res) {
  const result = await StudentService.createStudent(req.body); // VIOLATION
  res.json(result);
}
```

### **5. Configuration Pattern (Q29 Compliance)**

```javascript
// ✅ CORRECT: Use app-config.json for non-secrets
const appConfig = require("../config/app-config.json");
const pageSize = appConfig.ui.pagination.defaultPageSize; // 20

// ✅ CORRECT: Use .env for secrets only
const dbPassword = process.env.DB_PASSWORD;

// ❌ FORBIDDEN: Hardcoded configuration
const pageSize = 20; // Should be in app-config.json
```

---

## 🚀 **IMPLEMENTATION CHECKLIST**

### **Phase 1: Foundation ✅**

- [x] System authentication UI (completed)
- [x] Tenant detection middleware (existing)
- [x] Q59 validation compliance (implemented)
- [ ] Trust branding support enhancement

### **Phase 2: Core Management**

- [ ] Dashboard templates (system/trust/role-based)
- [ ] School setup wizard with validation
- [ ] School management CRUD operations

### **Phase 3: Student Management**

- [ ] Multi-step student registration form
- [ ] Student directory with filtering
- [ ] Document upload functionality

### **Phase 4: Fee Management**

- [ ] Fee structure configuration
- [ ] Fee collection interface
- [ ] Receipt generation

### **Phase 5: Attendance & Reports**

- [ ] Mobile-first attendance marking
- [ ] Attendance reports and analytics

---

## 📋 **QUALITY ASSURANCE**

### **Before Each Commit**

```bash
# Validate all architectural compliance
npm run validate:all

# Run test suite
npm run test

# Check code formatting
npm run lint
npm run format
```

### **Validation Commands**

```bash
# Documentation consistency
npm run validate:docs

# Auto-fix documentation issues
npm run fix:docs

# Complete validation suite
npm run validate:all
```

---

## 🎯 **SUCCESS METRICS**

- **100% Q59 Compliance**: No custom validation in web routes
- **100% Tech Stack Compliance**: Only approved technologies (Q1-Q10)
- **Mobile-First**: All forms work on mobile devices
- **Session Management**: Proper tenant context handling
- **Error Handling**: Structured responses (Q21 compliant)
- **Performance**: Server-side pagination, optimized queries

---

**Last Updated**: August 21, 2025  
**Status**: Production Ready - Frontend Implementation Guide  
**Next Phase**: Begin Phase 2 - Core Management Interfaces

---

**Built to complement the bulletproof backend architecture** 🚀
