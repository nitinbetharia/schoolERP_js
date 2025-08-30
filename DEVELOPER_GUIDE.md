# Developer Guide - School ERP

Simple guidelines for maintaining and extending the School ERP system.

## Core Principles

1. **Simple Functions** - No factories, no classes, just functions
2. **Multi-tenant DB** - Separate databases per trust (working pattern)
3. **DRY Code** - Reusable utilities for common tasks
4. **Security First** - Validate everything, hash passwords, prevent injection

## Essential Patterns

### **1. Controllers (Simple Functions)**

```javascript
// controllers/studentController.js
const studentService = require('../services/studentService');

async function createStudent(req, res) {
   try {
      const student = await studentService.createStudent(req.tenantCode, req.body);
      res.json({ success: true, data: student });
   } catch (error) {
      res.status(400).json({ success: false, error: error.message });
   }
}

module.exports = { createStudent, getStudent, updateStudent };
```

### **2. Services (Business Logic)**

```javascript
// services/studentService.js
const { getTenantModels } = require('../models');

async function createStudent(tenantCode, studentData) {
   const models = await getTenantModels(tenantCode);
   return await models.Student.create(studentData);
}

module.exports = { createStudent, getStudent, updateStudent };
```

### **3. Models (Keep Current Pattern)**

```javascript
// models/Student.js - Keep existing pattern
const { DataTypes } = require('sequelize');
const Joi = require('joi');

function defineStudent(sequelize) {
   const Student = sequelize.define('Student', {
      /* fields */
   });
   return Student;
}

const studentValidationSchemas = {
   create: Joi.object({
      /* validation */
   }),
};

module.exports = { defineStudent, studentValidationSchemas };
```

### **4. Routes with Features**

```javascript
// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const pdfService = require('../utils/pdfService');

router.get('/', studentController.getStudents);
router.post('/', studentController.createStudent);

// PDF Export
router.get('/export/pdf', async (req, res) => {
   const students = await studentController.getStudentsData(req.tenantCode);
   const pdfPath = await pdfService.generateStudentReport(students);
   res.download(pdfPath, 'students.pdf');
});
```

## Key Technologies

### **Backend Stack**

- **Express.js** - Web framework
- **Sequelize** - Database ORM
- **Joi** - Input validation
- **bcryptjs** - Password hashing
- **MySQL** - Database

### **Essential Features**

- **PDFKit** - PDF generation
- **ExcelJS** - Excel exports
- **Nodemailer** - Email sending

## File Organization

```
controllers/     # HTTP request handlers (simple functions)
services/        # Business logic (reusable functions)
models/          # Database models (keep current multi-tenant)
utils/           # Utilities (PDF, Excel, Email)
routes/          # Express routes
middleware/      # Keep current (tenant, auth, error)
views/           # EJS templates
```

## File Size Standards & Code Quality

### Industry-Standard File Size Guidelines

Based on comprehensive industry research and best practices:

- **Optimal Range**: 150-300 lines per file for maximum maintainability
- **Acceptable Range**: Up to 400 lines per file
- **Critical Threshold**: 500+ lines require immediate refactoring

### File Type Specific Standards

- **JavaScript Files**: Target 200-250 lines, maximum 400 lines
- **EJS Templates**: Target 150-200 lines, maximum 300 lines
- **Service Files**: Target 250-300 lines, maximum 400 lines
- **Route Files**: Target 200-300 lines, split by feature modules
- **Controller Files**: Target 150-250 lines, one controller per domain

### Why These Standards Matter

1. **Cognitive Load**: Files over 300 lines become harder to understand
2. **Bug Density**: Larger files have statistically higher bug rates
3. **Team Collaboration**: Smaller files reduce merge conflicts
4. **Testing**: Focused files are easier to unit test
5. **Maintenance**: Smaller modules are easier to debug and modify

### Refactoring Strategy

When files exceed limits:

1. **Split by Feature**: Separate related functionality
2. **Extract Utilities**: Move reusable code to utils/
3. **Modularize Routes**: Group by business domain
4. **Break Templates**: Use EJS partials and includes
5. **Service Separation**: One service per business entity

### Refactoring Success History

#### Phase 1 - Routes Refactoring (Completed August 2025) ✅

**Before:**

- `routes/web.js`: 3,442 lines (monolithic routing file)
- Single file handling all route logic
- Difficult to maintain and test

**After:**

- Split into 12 focused modules
- Each file: 38-352 lines (all within standards)
- Organized by feature domain (auth, users, system, API)
- 100% test pass rate (25/25 tests)

**Benefits Achieved:**

- 🔧 Better maintainability
- 🧪 Enhanced testability  
- 👥 Easier team collaboration
- 🐛 Reduced bug density

#### Phase 2 - Student Model Refactoring (Completed August 2025) ✅

**Before:**

- `models/Student.js`: 902 lines (monolithic model)
- Single file with fields, validation, associations, methods
- Complex to understand and modify

**After:**

- Split into 8 focused modules
- `Student.js`: 47 lines (core definition)
- `StudentFields.js`: 442 lines (field specifications)
- `StudentValidation.js`: 343 lines (Joi schemas)
- `StudentAssociations.js`: 359 lines (relationships)
- `StudentMethods.js`: Combined coordinator
- Instance & Static methods separated
- 100% test pass rate (18/18 tests)
- Legacy compatibility maintained

**Architecture Benefits:**

- 📁 Clear separation of concerns
- 🔄 Modular structure for reusability
- 🛡️ No breaking changes to existing code
- 📋 Better code organization

#### Current Codebase Health (August 2025)

- **Overall Success Rate**: 100% (43/43 tests passed)
- **Files Refactored**: 20 files now compliant with size standards
- **Lines Refactored**: 4,344 lines transformed into focused modules
- **Zero Downtime**: No functionality disrupted
- **Ready for Phase 3**: Services & Large Models identified

## Common Tasks

### **Add New Feature**

1. Create service function
2. Create controller function
3. Add route
4. Add validation schema
5. Test multi-tenant functionality

### **Add Export Feature**

1. Create utility function in `/utils`
2. Add route endpoint
3. Test with sample data

### **Add Email Feature**

1. Use `emailService.js` template functions
2. Create specific email function
3. Add route endpoint

## Security Checklist

- ✅ Validate all inputs with Joi schemas
- ✅ Hash passwords with bcryptjs
- ✅ Use Sequelize (prevents SQL injection)
- ✅ Validate tenant access in middleware
- ✅ Sanitize file paths for exports
- ✅ Use HTTPS in production

## Testing Strategy

```bash
# Test multi-tenant functionality
npm run test:tenants

# Test specific feature
npm run test -- --grep "student"

# Test exports
npm run test:exports
```

## Troubleshooting

### **Database Issues**

- Check tenant detection middleware
- Verify database connections
- Check model initialization

### **Export Issues**

- Verify file permissions
- Check temporary file cleanup
- Test with small datasets first

### **Email Issues**

- Check SMTP credentials
- Test with simple text emails first
- Verify email templates

---

**Keep it simple, keep it working** 💪
