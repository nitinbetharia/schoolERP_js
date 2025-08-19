# JavaScript Coding Standards - School ERP System

## 🚨 **MANDATORY: Async/Await + Try-Catch Pattern (Q57-Q58)**

**Date**: August 19, 2025  
**Status**: ENFORCED - All JavaScript code must follow these patterns  
**Violations**: Will cause code review failure

---

## 📋 **CORE PRINCIPLES**

### **1. Every Async Function MUST Use try-catch (Q58)**

```javascript
// ✅ CORRECT Pattern
async function functionName() {
  try {
    const result = await someAsyncOperation();
    return result;
  } catch (error) {
    logger.error('Operation failed', { error: error.message });
    throw error; // Re-throw or handle appropriately
  }
}

// ❌ FORBIDDEN Pattern
async function functionName() {
  const result = await someAsyncOperation(); // NO try-catch = VIOLATION
  return result;
}
```

### **2. Always Use async/await (Never Callbacks/Promises) (Q57)**

```javascript
// ✅ CORRECT - async/await pattern
async function getStudentData(studentId) {
  try {
    const student = await Student.findByPk(studentId);
    const grades = await Grade.findByStudentId(studentId);
    return { student, grades };
  } catch (error) {
    logger.error('Failed to get student data', {
      studentId,
      error: error.message
    });
    throw error;
  }
}

// ❌ FORBIDDEN - Callbacks
function getStudentData(studentId, callback) {
  Student.findByPk(studentId, (err, student) => {
    // NEVER USE
    if (err) return callback(err);
    callback(null, student);
  });
}

// ❌ FORBIDDEN - Raw Promises
function getStudentData(studentId) {
  return Student.findByPk(studentId)
    .then(student => {
      // NEVER USE
      return Grade.findByStudentId(studentId).then(grades => {
        return { student, grades };
      });
    })
    .catch(error => {
      throw error;
    });
}
```

---

## 🏗️ **IMPLEMENTATION PATTERNS**

### **1. Model Methods Pattern**

```javascript
// ✅ CORRECT - Model static methods
class Student {
  static async createStudent(studentData) {
    try {
      const validated = this.sanitizeInput(studentData);
      const student = await this.create(validated);
      logger.business('student_created', 'Student', student.id);
      return student;
    } catch (error) {
      logger.error('Student creation failed', {
        studentData: { ...studentData, password: '[REDACTED]' },
        error: error.message
      });
      throw new AppError('Failed to create student', 400);
    }
  }

  static async findBySchoolAndClass(schoolId, classId) {
    try {
      const students = await this.findAll({
        where: { schoolId, classId, status: 'ACTIVE' },
        order: [
          ['lastName', 'ASC'],
          ['firstName', 'ASC']
        ]
      });
      return students;
    } catch (error) {
      logger.error('Failed to find students', {
        schoolId,
        classId,
        error: error.message
      });
      throw error;
    }
  }
}
```

### **2. Service Layer Pattern**

```javascript
// ✅ CORRECT - Service methods
class StudentService {
  static async enrollStudent(studentData, classId) {
    try {
      // Start transaction
      const transaction = await sequelize.transaction();

      try {
        const student = await Student.createStudent(studentData);
        const enrollment = await Enrollment.create(
          {
            studentId: student.id,
            classId,
            enrollmentDate: new Date()
          },
          { transaction }
        );

        await transaction.commit();

        logger.business('student_enrolled', 'Student', student.id, { classId });
        return { student, enrollment };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error('Student enrollment failed', {
        studentData: { ...studentData, password: '[REDACTED]' },
        classId,
        error: error.message
      });
      throw new AppError('Failed to enroll student', 500);
    }
  }
}
```

### **3. Controller Pattern**

```javascript
// ✅ CORRECT - Express controllers
const studentController = {
  async createStudent(req, res, next) {
    try {
      const studentData = req.body;
      const student = await StudentService.createStudent(studentData);

      res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: student
      });
    } catch (error) {
      next(error); // Pass to centralized error handler
    }
  },

  async getStudentsByClass(req, res, next) {
    try {
      const { schoolId, classId } = req.params;
      const students = await Student.findBySchoolAndClass(schoolId, classId);

      res.json({
        success: true,
        count: students.length,
        data: students
      });
    } catch (error) {
      next(error);
    }
  }
};
```

### **4. Middleware Pattern**

```javascript
// ✅ CORRECT - Async middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const user = await User.findByToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication failed', { error: error.message });
    res.status(500).json({ error: 'Authentication error' });
  }
};

const tenantMiddleware = async (req, res, next) => {
  try {
    const trustCode = req.headers['x-trust-code'] || req.subdomain;

    if (!trustCode) {
      return res.status(400).json({ error: 'Trust code required' });
    }

    const tenant = await Tenant.findByCode(trustCode);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    req.tenant = tenant;
    next();
  } catch (error) {
    logger.error('Tenant resolution failed', { error: error.message });
    next(error);
  }
};
```

---

## 🔧 **ERROR HANDLING PATTERNS**

### **1. Custom Error Classes**

```javascript
// ✅ CORRECT - Custom error with proper inheritance
class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
  }
}

// Usage in async functions
async function validateStudentData(data) {
  try {
    const schema = Student.getValidationSchema();
    const { error, value } = schema.validate(data);

    if (error) {
      throw new ValidationError(
        error.details[0].message,
        error.details[0].path[0]
      );
    }

    return value;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error; // Re-throw custom errors
    }

    logger.error('Validation failed', { data, error: error.message });
    throw new AppError('Data validation failed', 400);
  }
}
```

### **2. Centralized Error Handler**

```javascript
// ✅ CORRECT - Express error handler
const errorHandler = async (error, req, res, next) => {
  try {
    // Log error details
    logger.error('Request failed', {
      method: req.method,
      url: req.url,
      error: error.message,
      stack: error.stack,
      user: req.user?.id,
      tenant: req.tenant?.code
    });

    // Handle known error types
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        field: error.field,
        code: error.code
      });
    }

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }

    // Handle Sequelize errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }

    // Default error response
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  } catch (handlerError) {
    // Last resort - log and send basic error
    logger.error('Error handler failed', {
      handlerError: handlerError.message
    });
    res.status(500).json({ success: false, error: 'Fatal error' });
  }
};
```

---

## 📋 **VALIDATION CHECKLIST**

### **Before Committing Code:**

- [ ] ✅ Every async function has try-catch block
- [ ] ✅ No callbacks or raw promises used
- [ ] ✅ All database operations use await
- [ ] ✅ Error logging includes relevant context
- [ ] ✅ Custom errors are properly thrown
- [ ] ✅ Controllers pass errors to next()
- [ ] ✅ Transactions are properly handled
- [ ] ✅ Sensitive data is redacted in logs

### **Code Review Checklist:**

- [ ] ✅ Async/await pattern consistently used
- [ ] ✅ Try-catch blocks comprehensive
- [ ] ✅ Error messages are descriptive
- [ ] ✅ Logging includes sufficient context
- [ ] ✅ No unhandled promise rejections
- [ ] ✅ Error responses follow standard format
- [ ] ✅ Performance considerations addressed

---

## 🚫 **FORBIDDEN PATTERNS**

### **❌ NEVER USE:**

```javascript
// Callbacks
function getData(callback) { ... }

// Raw Promises
function getData() {
  return new Promise((resolve, reject) => { ... });
}

// Unhandled async operations
async function badFunction() {
  const result = await operation(); // No try-catch
  return result;
}

// Mixed patterns
async function mixedFunction() {
  try {
    const result = await operation();
    someCallback(() => { ... }); // Mixing async/await with callbacks
    return result;
  } catch (error) {
    throw error;
  }
}
```

---

**ENFORCEMENT**: These patterns are mandatory for all JavaScript code in the
School ERP system. Violations will result in code review failure and must be
fixed before merging.
