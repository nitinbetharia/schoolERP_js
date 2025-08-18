# School ERP Development Standards & Guidelines

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Standards](#architecture-standards)
3. [Coding Standards](#coding-standards)
4. [Database Standards](#database-standards)
5. [Security Standards](#security-standards)
6. [API Design Standards](#api-design-standards)
7. [Frontend Standards](#frontend-standards)
8. [Testing Standards](#testing-standards)
9. [Documentation Standards](#documentation-standards)
10. [Deployment Standards](#deployment-standards)

---

## Project Overview

### Core Principles

- **Simple & Maintainable**: Code should be understandable by intermediate
  developers
- **Bulletproof Design**: Comprehensive error handling and validation at every
  layer
- **Multi-Tenant Architecture**: Scalable design supporting multiple educational
  trusts
- **Security First**: Industry-standard security practices throughout
- **Professional UI/UX**: Expert-level design with accessibility and
  responsiveness

### Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18+
- **Database**: MySQL 8.0+
- **Templating**: EJS 3.1+
- **Validation**: Joi 17+
- **Security**: Helmet, XSS, Rate Limiting
- **Session**: Express-session with MySQL store

---

## Architecture Standards

### Module Structure

```
modules/
├── data/           # Database connections and utilities
├── auth/           # Authentication and authorization
├── setup/          # Trust and school setup wizards
├── user/           # User management CRUD operations
├── student/        # Student lifecycle management
├── fees/           # Fee structure and collection
├── attendance/     # Attendance tracking and reports
├── reports/        # Report generation and templates
├── dashboard/      # Role-based dashboard widgets
└── communication/  # Messaging and notifications
```

### Dependency Order

```
DATA → AUTH → SETUP → USER → STUDENT → FEES → ATTENDANCE → REPORTS → DASHBOARD → COMMUNICATION
```

### Service Pattern

```javascript
// modules/[module]/[module]-service.js
class ModuleService {
  constructor() {
    this.db = require('../data/database-service');
    this.validator = require('./validation-schemas');
  }

  async create(data, context) {
    // 1. Validate input
    // 2. Business logic
    // 3. Database transaction
    // 4. Return result
  }
}
```

---

## Coding Standards

### Naming Conventions

#### Variables & Functions (camelCase)

```javascript
const userName = 'john_doe';
const studentId = 12345;

function calculateTotalFees(studentId, academicYear) {}
function getUserPermissions(userId, context) {}
```

#### Database Fields (snake_case)

```sql
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admission_number VARCHAR(20) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Constants (UPPER_SNAKE_CASE)

```javascript
const MAX_LOGIN_ATTEMPTS = 5;
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const DEFAULT_PAGE_SIZE = 25;
```

#### CSS Classes (kebab-case)

```css
.form-input {
}
.btn-primary {
}
.card-header {
}
.navigation-menu {
}
```

### Code Organization

#### File Structure

```
/api/[module]/[action].js     # API route handlers
/modules/[module]/            # Business logic services
/middleware/                  # Express middleware
/config/                      # Configuration files
/public/                      # Static assets
/views/                       # EJS templates
/scripts/                     # Utility scripts
```

#### Function Design

```javascript
// ✅ Good: Clear, single responsibility
async function createStudent(studentData, context) {
  try {
    // Validate input
    const validData = await this.validateStudentData(studentData);

    // Check permissions
    this.rbac.enforcePermission(context.user, 'students', 'create');

    // Business logic
    const admissionNumber = await this.generateAdmissionNumber(
      validData.schoolId
    );

    // Database operation
    const result = await this.db.transaction(async trx => {
      const studentId = await this.createStudentRecord(validData, trx);
      await this.createStudentProfile(studentId, validData, trx);
      return studentId;
    });

    return { success: true, data: { id: result } };
  } catch (error) {
    throw new AppError(
      `Failed to create student: ${error.message}`,
      'STUDENT_CREATE_FAILED'
    );
  }
}
```

### Error Handling Pattern

```javascript
// Custom error class
class AppError extends Error {
  constructor(message, code, statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// Service layer error handling
try {
  const result = await someOperation();
  return { success: true, data: result };
} catch (error) {
  if (error.isOperational) {
    throw error; // Re-throw operational errors
  }
  throw new AppError(`Unexpected error: ${error.message}`, 'INTERNAL_ERROR');
}

// Route layer error handling
app.use((error, req, res, next) => {
  logger.error('Request error:', error);

  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    error: error.message,
    code: error.code || 'INTERNAL_ERROR'
  };

  if (req.path.startsWith('/api/')) {
    res.status(statusCode).json(response);
  } else {
    res.status(statusCode).render('error', { error });
  }
});
```

---

## Database Standards

### Schema Design

#### Table Naming

- Plural nouns: `students`, `users`, `fee_structures`
- Snake case: `admission_workflows`, `attendance_records`
- Descriptive: `student_fee_assignments`, `user_role_permissions`

#### Column Standards

```sql
-- Primary Keys
id INT AUTO_INCREMENT PRIMARY KEY

-- Foreign Keys
school_id INT NOT NULL,
FOREIGN KEY (school_id) REFERENCES schools(id)

-- Status Fields
status ENUM('ACTIVE', 'INACTIVE', 'PENDING') DEFAULT 'ACTIVE'

-- Timestamps
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

-- Soft Deletes
deleted_at TIMESTAMP NULL

-- Audit Fields
created_by INT,
updated_by INT,
FOREIGN KEY (created_by) REFERENCES users(id)
```

#### Indexing Strategy

```sql
-- Primary indexes on frequently queried columns
CREATE INDEX idx_students_admission_number ON students(admission_number);
CREATE INDEX idx_students_school_class ON students(school_id, class_id);
CREATE INDEX idx_attendance_date_student ON attendance_records(attendance_date, student_id);

-- Composite indexes for common query patterns
CREATE INDEX idx_fees_student_year ON fee_collections(student_id, academic_year);
CREATE INDEX idx_users_email_status ON users(email, status);
```

### Query Patterns

```javascript
// ✅ Parameterized queries (prevents SQL injection)
const query = `
    SELECT s.*, c.class_name, sc.section_name 
    FROM students s
    JOIN classes c ON s.class_id = c.id
    LEFT JOIN sections sc ON s.section_id = sc.id
    WHERE s.school_id = ? AND s.status = ?
    ORDER BY s.admission_number
    LIMIT ? OFFSET ?
`;
const results = await db.query(query, [schoolId, 'ACTIVE', limit, offset]);

// ✅ Transaction pattern
await db.transaction(async trx => {
  const studentId = await trx.query('INSERT INTO students SET ?', [
    studentData
  ]);
  await trx.query('INSERT INTO student_profiles SET ?', [profileData]);
  await trx.query(
    'UPDATE admission_counters SET last_number = last_number + 1 WHERE school_id = ?',
    [schoolId]
  );
  return studentId;
});
```

---

## Security Standards

### Authentication

```javascript
// Password hashing
const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash(password, 12);

// Session management
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 30 * 60 * 1000 // 30 minutes
    },
    store: new MySQLStore({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    })
  })
);
```

### Input Validation

```javascript
// Joi validation schemas
const studentSchema = Joi.object({
  full_name: Joi.string().trim().min(2).max(255).required(),
  email: Joi.string().email().lowercase().trim(),
  mobile: Joi.string()
    .pattern(/^\d{10}$/)
    .required(),
  date_of_birth: Joi.date().max('now').iso(),
  admission_date: Joi.date().default(() => new Date())
});

// XSS sanitization
const xss = require('xss');
const sanitizedInput = xss(userInput, {
  whiteList: {}, // No HTML allowed
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script']
});
```

### Authorization (RBAC)

```javascript
// Permission checking
function requirePermission(resource, action) {
  return async (req, res, next) => {
    try {
      const hasPermission = await rbacService.checkPermission(
        req.user.id,
        resource,
        action,
        req.context
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// Usage in routes
router.post(
  '/students',
  requireAuth(),
  requirePermission('students', 'create'),
  validateInput(studentSchema),
  createStudent
);
```

---

## API Design Standards

### RESTful Endpoints

```
GET    /api/students              # List students
POST   /api/students              # Create student
GET    /api/students/:id          # Get student
PUT    /api/students/:id          # Update student
DELETE /api/students/:id          # Delete student
GET    /api/students/:id/fees     # Get student fees
POST   /api/students/:id/promote  # Promote student
```

### Response Format

```javascript
// Success Response
{
    "success": true,
    "data": {
        "id": 123,
        "full_name": "John Doe",
        "admission_number": "2024-001"
    },
    "meta": {
        "total": 150,
        "page": 1,
        "per_page": 25
    }
}

// Error Response
{
    "success": false,
    "error": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": {
        "full_name": "Full name is required",
        "email": "Invalid email format"
    }
}
```

### Middleware Chain

```javascript
router.post(
  '/students',
  // 1. Authentication
  requireAuth(),

  // 2. Context extraction
  extractContext(),

  // 3. Authorization
  requirePermission('students', 'create'),

  // 4. Rate limiting
  rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }),

  // 5. Input validation
  validateInput(studentSchema),

  // 6. Business logic
  createStudent
);
```

---

## Frontend Standards

### EJS Template Structure

```html
<% layout('layout') -%>

<!-- Page Header -->
<div class="page-header">
  <h1 class="page-title">Student Management</h1>
  <p class="page-subtitle">Manage student admissions and profiles</p>
</div>

<!-- Main Content -->
<div class="page-container">
  <!-- Content goes here -->
</div>

<script>
  // Page-specific JavaScript
  class StudentManager {
    constructor() {
      this.init();
    }

    async init() {
      await this.loadStudents();
      this.setupEventListeners();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    new StudentManager();
  });
</script>
```

### CSS Class Conventions

```css
/* Component Classes */
.btn {
} /* Base button */
.btn-primary {
} /* Primary button variant */
.btn-sm {
} /* Size modifier */

.card {
} /* Base card component */
.card-header {
} /* Card subcomponent */
.card-body {
} /* Card subcomponent */

.form-input {
} /* Form input element */
.form-label {
} /* Form label element */
.form-group {
} /* Form group container */

/* State Classes */
.active {
} /* Active state */
.disabled {
} /* Disabled state */
.loading {
} /* Loading state */
.error {
} /* Error state */

/* Layout Classes */
.page-container {
} /* Main page wrapper */
.page-header {
} /* Page header section */
.grid {
} /* Grid layout */
.flex {
} /* Flex layout */
```

### JavaScript Standards

```javascript
// API calls
try {
    const response = await api.post('/api/students', studentData);
    if (response.success) {
        notifications.success('Student Created', 'Student has been created successfully');
        this.loadStudents();
    }
} catch (error) {
    notifications.error('Creation Failed', error.message);
}

// Form validation
validateField(field) {
    const value = field.value.trim();
    const rules = field.getAttribute('data-validation');

    if (field.hasAttribute('required') && !value) {
        this.showFieldError(field, 'This field is required');
        return false;
    }

    // Additional validation based on field type
    return true;
}

// Event handling
setupEventListeners() {
    // Use event delegation for dynamic content
    document.addEventListener('click', (e) => {
        if (e.target.matches('[data-action="delete"]')) {
            this.handleDelete(e.target);
        }
    });

    // Debounce search inputs
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input',
        utils.debounce(() => this.performSearch(), 300)
    );
}
```

---

## Testing Standards

### Unit Testing (Jest)

```javascript
// modules/student/student-service.test.js
describe('StudentService', () => {
  let studentService;

  beforeEach(() => {
    studentService = new StudentService();
    // Mock database and dependencies
  });

  describe('createStudent', () => {
    it('should create student with valid data', async () => {
      const studentData = {
        full_name: 'John Doe',
        email: 'john@example.com',
        school_id: 1
      };

      const result = await studentService.create(studentData, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.id).toBeDefined();
    });

    it('should reject invalid email', async () => {
      const studentData = {
        full_name: 'John Doe',
        email: 'invalid-email',
        school_id: 1
      };

      await expect(
        studentService.create(studentData, mockContext)
      ).rejects.toThrow('Invalid email format');
    });
  });
});
```

### Integration Testing

```javascript
// api/student/create.test.js
describe('POST /api/students', () => {
  it('should create student when authenticated', async () => {
    const response = await request(app)
      .post('/api/students')
      .set('Cookie', authCookie)
      .send({
        full_name: 'John Doe',
        email: 'john@example.com',
        school_id: 1
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBeDefined();
  });
});
```

---

## Documentation Standards

### Code Documentation

```javascript
/**
 * Create a new student record with admission workflow
 * @param {Object} studentData - Student information
 * @param {string} studentData.full_name - Student's full name
 * @param {string} studentData.email - Student's email address
 * @param {number} studentData.school_id - School ID
 * @param {Object} context - Request context with user and permissions
 * @param {Object} context.user - Authenticated user
 * @param {string} context.trustId - Current trust ID
 * @returns {Promise<Object>} Result object with success flag and student ID
 * @throws {AppError} When validation fails or permission denied
 */
async function createStudent(studentData, context) {
  // Implementation
}
```

### API Documentation

````markdown
## Create Student

Creates a new student record and initiates the admission workflow.

**Endpoint:** `POST /api/students`

**Authentication:** Required

**Permissions:** `students:create`

**Request Body:**

```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "mobile": "9876543210",
  "school_id": 1,
  "class_id": 5
}
```
````

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 123,
    "admission_number": "2024-001"
  }
}
```

````

---

## Deployment Standards

### Environment Configuration
```bash
# .env.production
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=school_erp_user
DB_PASSWORD=secure_password
DB_NAME=school_erp_master

# Security
SESSION_SECRET=your-super-secure-session-secret
ENCRYPTION_KEY=your-encryption-key

# Features
ENABLE_2FA=true
ENABLE_EMAIL=true
ENABLE_SMS=false

# External Services
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
````

### Production Checklist

```markdown
□ SSL certificate configured □ Database credentials secured □ Environment
variables set □ Log aggregation configured □ Monitoring alerts setup □ Backup
schedule configured □ Security headers enabled □ Rate limiting configured □
Error tracking enabled □ Health checks implemented
```

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'school-erp',
      script: './server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_memory_restart: '1G'
    }
  ]
};
```

---

## Best Practices Summary

### Development Workflow

1. **Feature Branches**: Use feature branches for all development
2. **Code Review**: All code must be reviewed before merging
3. **Testing**: Write tests for all business logic
4. **Documentation**: Update docs with every feature change
5. **Security**: Security review for all authentication/authorization changes

### Performance Guidelines

1. **Database**: Always use indexed queries and avoid N+1 problems
2. **Caching**: Cache frequently accessed data and computation results
3. **Pagination**: Implement server-side pagination for all lists
4. **Compression**: Enable gzip compression for all responses
5. **Assets**: Optimize and minify all static assets

### Security Guidelines

1. **Input Validation**: Validate and sanitize all user input
2. **Authentication**: Use strong password policies and session management
3. **Authorization**: Implement role-based access control throughout
4. **HTTPS**: Always use HTTPS in production
5. **Updates**: Keep all dependencies updated regularly

---

**This document serves as the authoritative guide for all School ERP development
activities. All team members must follow these standards to ensure code quality,
security, and maintainability.**
