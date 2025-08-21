# Backend API Sitemap - School ERP System

**Generated**: August 21, 2025  
**Version**: 2.0.0  
**Base URL**: `http://localhost:3000/api/v1`  
**Documentation**: Following Q59-ENFORCED validation patterns - all routes use existing validation schemas

---

## 🔒 **SYSTEM ADMIN ENDPOINTS**

**Base Path**: `/api/v1/admin/system`

### **Authentication & Session**

#### **POST** `/admin/system/auth/login`

**Description**: System administrator login  
**Access**: Public  
**Rate Limit**: Login rate limiting applied  
**Validation Schema**: `systemUserValidationSchemas.login`

**Request**:

```json
{
   "username": "admin",
   "password": "admin123"
}
```

**Response Success**:

```json
{
   "success": true,
   "data": {
      "id": 1,
      "username": "admin",
      "email": "admin@system.local",
      "role": "SYSTEM_ADMIN",
      "status": "ACTIVE",
      "last_login_at": "2025-08-20T10:30:00.000Z",
      "profile": {}
   },
   "message": "Login successful"
}
```

**Response Error**:

```json
{
   "success": false,
   "error": {
      "code": "AUTHENTICATION_ERROR",
      "message": "Invalid username or password"
   }
}
```

---

#### **POST** `/admin/system/auth/logout`

**Description**: System administrator logout  
**Access**: Private (any authenticated user)  
**Middleware**: None

**Request**: Empty body

```json
{}
```

**Response**:

```json
{
   "success": true,
   "data": null,
   "message": "Logout successful"
}
```

---

#### **POST** `/admin/system/auth/change-password`

**Description**: Change system administrator password  
**Access**: Private (authenticated system admin)  
**Rate Limit**: Sensitive operations rate limiting  
**Validation Schema**: `systemUserValidationSchemas.changePassword`

**Request**:

```json
{
   "currentPassword": "admin123",
   "newPassword": "newSecurePassword123",
   "confirmPassword": "newSecurePassword123"
}
```

**Response**:

```json
{
   "success": true,
   "data": {
      "passwordChanged": true
   },
   "message": "Password changed successfully"
}
```

---

### **Trust Management**

#### **POST** `/admin/system/trusts`

**Description**: Create new educational trust  
**Access**: Private (system admin only)  
**Validation Schema**: `trustValidationSchemas.create`

**Request**:

```json
{
   "trust_name": "ABC Educational Trust",
   "trust_code": "abc_edu",
   "subdomain": "abc",
   "contact_email": "admin@abc.edu",
   "contact_phone": "1234567890",
   "address": "123 Education Street, City",
   "tenant_config": {
      "theme": "blue",
      "features": ["attendance", "fees", "exams"]
   }
}
```

**Response**:

```json
{
   "success": true,
   "data": {
      "id": 1,
      "trust_name": "ABC Educational Trust",
      "trust_code": "abc_edu",
      "subdomain": "abc",
      "contact_email": "admin@abc.edu",
      "database_name": "school_erp_tenant_abc_edu",
      "status": "SETUP_PENDING",
      "created_at": "2025-08-20T10:30:00.000Z"
   },
   "message": "Trust created successfully"
}
```

---

#### **GET** `/admin/system/trusts/:id`

**Description**: Get trust details by ID  
**Access**: Private (system admin only)  
**Validation**: ID parameter validation

**Request**: URL parameter `id` (integer)

**Response**:

```json
{
   "success": true,
   "data": {
      "id": 1,
      "trust_name": "ABC Educational Trust",
      "trust_code": "abc_edu",
      "subdomain": "abc",
      "contact_email": "admin@abc.edu",
      "contact_phone": "1234567890",
      "status": "ACTIVE",
      "tenant_config": {},
      "created_at": "2025-08-20T10:30:00.000Z",
      "updated_at": "2025-08-20T10:30:00.000Z"
   }
}
```

---

#### **PUT** `/admin/system/trusts/:id`

**Description**: Update trust details  
**Access**: Private (system admin only)  
**Validation Schema**: `trustValidationSchemas.update`

**Request**:

```json
{
   "trust_name": "Updated Trust Name",
   "contact_email": "newemail@abc.edu",
   "contact_phone": "9876543210",
   "address": "New Address",
   "status": "ACTIVE"
}
```

**Response**:

```json
{
   "success": true,
   "data": {
      "id": 1,
      "trust_name": "Updated Trust Name",
      "contact_email": "newemail@abc.edu",
      "updated_at": "2025-08-20T11:00:00.000Z"
   },
   "message": "Trust updated successfully"
}
```

---

#### **GET** `/admin/system/trusts`

**Description**: List all trusts with pagination and filtering  
**Access**: Private (system admin only)  
**Query Parameters**: `page`, `limit`, `status`, `search`

**Request Query Parameters**:

- `page`: integer (default: 1)
- `limit`: integer (default: 10)
- `status`: string (ACTIVE, INACTIVE, SUSPENDED, SETUP_PENDING)
- `search`: string (minimum 2 characters)

**Response**:

```json
{
   "success": true,
   "data": [
      {
         "id": 1,
         "trust_name": "ABC Educational Trust",
         "trust_code": "abc_edu",
         "subdomain": "abc",
         "status": "ACTIVE",
         "created_at": "2025-08-20T10:30:00.000Z"
      }
   ],
   "message": "Trusts retrieved successfully",
   "pagination": {
      "current_page": 1,
      "total_pages": 1,
      "total_items": 1,
      "items_per_page": 10
   }
}
```

---

#### **POST** `/admin/system/trusts/:id/complete-setup`

**Description**: Complete trust setup and activate  
**Access**: Private (system admin only)

**Request**: Empty body

```json
{}
```

**Response**:

```json
{
   "success": true,
   "data": {
      "id": 1,
      "trust_name": "ABC Educational Trust",
      "status": "ACTIVE",
      "setup_completed_at": "2025-08-20T11:00:00.000Z"
   },
   "message": "Trust setup completed successfully"
}
```

---

### **System User Management**

#### **POST** `/admin/system/users`

**Description**: Create new system administrator  
**Access**: Private (system admin only)  
**Validation Schema**: `systemUserValidationSchemas.create`

**Request**:

```json
{
   "username": "newadmin",
   "email": "newadmin@system.local",
   "password": "securePassword123",
   "full_name": "New Administrator"
}
```

**Response**:

```json
{
   "success": true,
   "data": {
      "id": 2,
      "username": "newadmin",
      "email": "newadmin@system.local",
      "role": "SYSTEM_ADMIN",
      "status": "ACTIVE",
      "profile": {},
      "created_at": "2025-08-20T11:00:00.000Z"
   },
   "message": "System user created successfully"
}
```

---

#### **GET** `/admin/system/profile`

**Description**: Get current system admin profile  
**Access**: Private (authenticated system admin)

**Request**: No body required

**Response**:

```json
{
   "success": true,
   "data": {
      "id": 1,
      "username": "admin",
      "email": "admin@system.local",
      "role": "SYSTEM_ADMIN",
      "status": "ACTIVE",
      "last_login_at": "2025-08-20T10:30:00.000Z",
      "profile": {}
   }
}
```

---

#### **GET** `/admin/system/health`

**Description**: System health check  
**Access**: Public

**Request**: No body required

**Response**:

```json
{
   "success": true,
   "data": {
      "status": "healthy",
      "database": "connected",
      "uptime": "24:15:30",
      "memory": "156MB",
      "timestamp": "2025-08-20T10:30:00.000Z",
      "version": "1.0.0"
   }
}
```

---

## 👥 **TENANT USER ENDPOINTS**

**Base Path**: `/api/v1/users` (tenant-specific, requires subdomain)

### **Authentication**

#### **POST** `/users/auth/login`

**Description**: Tenant user authentication  
**Access**: Public (within tenant)  
**Validation**: Currently uses controller validation (needs Q59 compliance)

**Request**:

```json
{
   "username": "demo_principal",
   "password": "demo123"
}
```

**Response Success**:

```json
{
   "success": true,
   "data": {
      "id": 1,
      "username": "demo_principal",
      "email": "principal@demo.school",
      "role": "admin",
      "school_id": 1,
      "last_login_at": "2025-08-20T10:30:00.000Z"
   },
   "message": "Authentication successful"
}
```

---

#### **POST** `/users/auth/logout`

**Description**: Tenant user logout  
**Access**: Private

**Request**: Empty body

```json
{}
```

**Response**:

```json
{
   "success": true,
   "data": null,
   "message": "Logout successful"
}
```

---

### **User Management**

#### **GET** `/users`

**Description**: Get all users with filters  
**Access**: Private

**Response**:

```json
{
   "success": true,
   "data": [
      {
         "id": 1,
         "username": "demo_principal",
         "email": "principal@demo.school",
         "role": "admin",
         "school_id": 1,
         "is_active": true
      }
   ]
}
```

---

#### **POST** `/users`

**Description**: Create new user  
**Access**: Private (Trust Admin only)

**Request**:

```json
{
   "username": "newteacher",
   "email": "teacher@demo.school",
   "password": "password123",
   "role": "teacher",
   "school_id": 1
}
```

---

#### **GET** `/users/:user_id`

**Description**: Get user by ID  
**Access**: Private

**Response**:

```json
{
   "success": true,
   "data": {
      "id": 1,
      "username": "demo_principal",
      "email": "principal@demo.school",
      "role": "admin",
      "school_id": 1,
      "profile": {}
   }
}
```

---

#### **PUT** `/users/:user_id`

**Description**: Update user  
**Access**: Private (Admin/Trust Admin/Self)

**Request**:

```json
{
   "email": "newemail@demo.school",
   "profile": {
      "full_name": "Updated Name"
   }
}
```

---

#### **DELETE** `/users/:user_id`

**Description**: Delete user (soft delete)  
**Access**: Private (Trust Admin only)

---

## 🏫 **SCHOOL MODULE ENDPOINTS**

**Base Path**: `/api/v1/school` (tenant-specific)

### **School Management**

#### **GET** `/school/schools`

**Description**: List all schools in tenant  
**Access**: Private

#### **POST** `/school/schools`

**Description**: Create new school  
**Access**: Private (Admin only)

#### **GET** `/school/schools/:id`

**Description**: Get school details  
**Access**: Private

#### **PUT** `/school/schools/:id`

**Description**: Update school  
**Access**: Private (Admin only)

### **Class Management**

#### **GET** `/school/classes`

**Description**: List all classes  
**Access**: Private

#### **POST** `/school/classes`

**Description**: Create new class  
**Access**: Private (Admin/Teacher)

#### **GET** `/school/classes/:id`

**Description**: Get class details  
**Access**: Private

#### **PUT** `/school/classes/:id`

**Description**: Update class  
**Access**: Private (Admin/Teacher)

### **Section Management**

#### **GET** `/school/sections`

**Description**: List all sections  
**Access**: Private

#### **POST** `/school/sections`

**Description**: Create new section  
**Access**: Private (Admin/Teacher)

#### **GET** `/school/sections/:id`

**Description**: Get section details  
**Access**: Private

### **UDISE+ Compliance**

#### **GET** `/school/udise`

**Description**: Get UDISE+ data  
**Access**: Private

#### **POST** `/school/udise`

**Description**: Create/Update UDISE+ data  
**Access**: Private (Admin only)

#### **GET** `/school/compliance`

**Description**: Board compliance status  
**Access**: Private

---

## 📚 **STUDENT ENDPOINTS**

**Base Path**: `/api/v1/students` (tenant-specific)

### **Student Management**

#### **GET** `/students`

**Description**: List all students with filters  
**Access**: Private

#### **POST** `/students`

**Description**: Create new student  
**Access**: Private (Admin/Teacher)

#### **GET** `/students/:id`

**Description**: Get student details  
**Access**: Private

#### **PUT** `/students/:id`

**Description**: Update student  
**Access**: Private (Admin/Teacher)

#### **DELETE** `/students/:id`

**Description**: Delete student (soft delete)  
**Access**: Private (Admin only)

---

## 📋 **ATTENDANCE ENDPOINTS**

**Base Path**: `/api/v1/attendance` (tenant-specific)

### **Attendance Management**

#### **GET** `/attendance`

**Description**: Get attendance records  
**Access**: Private

#### **POST** `/attendance`

**Description**: Mark attendance  
**Access**: Private (Teacher)

#### **PUT** `/attendance/:id`

**Description**: Update attendance  
**Access**: Private (Teacher/Admin)

#### **GET** `/attendance/reports`

**Description**: Generate attendance reports  
**Access**: Private

---

## 💰 **FEE MANAGEMENT ENDPOINTS**

**Base Path**: `/api/v1/fees` (tenant-specific)

### **Fee Structure**

#### **GET** `/fees/structures`

**Description**: List fee structures  
**Access**: Private

#### **POST** `/fees/structures`

**Description**: Create fee structure  
**Access**: Private (Admin only)

#### **GET** `/fees/structures/:id`

**Description**: Get fee structure details  
**Access**: Private

### **Fee Collection**

#### **GET** `/fees/collections`

**Description**: List fee collections  
**Access**: Private

#### **POST** `/fees/collections`

**Description**: Collect fees  
**Access**: Private (Admin/Accountant)

#### **GET** `/fees/reports`

**Description**: Fee reports  
**Access**: Private

---

## 🏛️ **UDISE+ ENDPOINTS**

**Base Path**: `/api/v1/udise` (tenant-specific)

### **UDISE+ Data Management**

#### **GET** `/udise/schools`

**Description**: UDISE+ school data  
**Access**: Private

#### **POST** `/udise/schools`

**Description**: Update UDISE+ school data  
**Access**: Private (Admin only)

#### **GET** `/udise/students`

**Description**: UDISE+ student data  
**Access**: Private

#### **POST** `/udise/submit`

**Description**: Submit UDISE+ data to government  
**Access**: Private (Admin only)

---

## 🔧 **SETUP ENDPOINTS**

**Base Path**: `/api/v1/setup` (tenant-specific)

### **Initial Setup**

#### **GET** `/setup/status`

**Description**: Get setup completion status  
**Access**: Private

#### **POST** `/setup/initialize`

**Description**: Initialize tenant setup  
**Access**: Private (Admin only)

#### **POST** `/setup/complete`

**Description**: Mark setup as complete  
**Access**: Private (Admin only)

---

## 🔄 **GENERAL API ENDPOINTS**

### **API Status**

#### **GET** `/api/v1/status`

**Description**: API health and status  
**Access**: Public

**Response**:

```json
{
   "success": true,
   "message": "School ERP API is running",
   "version": "1.0.0",
   "timestamp": "2025-08-20T10:30:00.000Z",
   "environment": "development"
}
```

---

## 🌐 **WEB ROUTES** (Frontend)

**Base Path**: `/` (EJS templates)

### **Authentication Pages**

#### **GET** `/auth/login`

**Description**: Login page (system or tenant)  
**Access**: Public  
**Template**: `views/pages/auth/login.ejs`

#### **POST** `/auth/login`

**Description**: Process login (uses existing API validation)  
**Access**: Public  
**Validation**: Reuses `systemUserValidationSchemas.login` (Q59-compliant)

#### **GET** `/auth/logout`

**Description**: Logout and redirect  
**Access**: Private

### **Dashboard**

#### **GET** `/dashboard`

**Description**: Main dashboard  
**Access**: Private  
**Template**: `views/pages/dashboard/index.ejs`

---

## 📊 **RESPONSE FORMAT STANDARDS**

### **Success Response**

```json
{
   "success": true,
   "data": {
      /* response data */
   },
   "message": "Operation successful",
   "pagination": {
      /* optional pagination info */
   }
}
```

### **Error Response**

```json
{
   "success": false,
   "error": {
      "code": "ERROR_CODE",
      "message": "Error description",
      "details": [
         /* validation errors array */
      ],
      "timestamp": "2025-08-20T10:30:00.000Z"
   }
}
```

### **Validation Error Response**

```json
{
   "success": false,
   "error": {
      "code": "VALIDATION_FAILED",
      "message": "Input validation failed",
      "details": [
         {
            "field": "username",
            "message": "Username is required"
         }
      ]
   }
}
```

---

## 🛡️ **AUTHENTICATION & MIDDLEWARE**

### **Authentication Types**

1. **System Authentication**: For system admin routes (`/admin/system/*`)
2. **Tenant Authentication**: For tenant-specific routes (subdomain-based)

### **Middleware Applied**

- **Rate Limiting**: Login attempts, sensitive operations
- **Validation**: Joi schemas (Q59-enforced for all routes)
- **Authentication**: Session-based authentication
- **Authorization**: Role-based access control (RBAC)
- **Error Handling**: Structured error responses
- **Logging**: Winston structured logging for all operations

### **Session Management**

- **Storage**: MySQL session store
- **Expiration**: Configurable session timeout
- **Security**: Secure session cookies, CSRF protection

---

## 🔗 **VALIDATION SCHEMAS** (Q59-ENFORCED)

All API endpoints use existing validation schemas from model files:

- **System User**: `systemUserValidationSchemas` from `models/SystemUser.js`
- **Trust**: `trustValidationSchemas` from `models/Trust.js`
- **Common**: `commonSchemas` from `utils/errors.js`

**Note**: Web routes MUST reuse these same validation schemas - never create custom validation (Q59-ENFORCED).

---

**Last Updated**: August 20, 2025  
**Status**: Phase 1 Complete - Frontend implementation in progress  
**Next Phase**: Complete validation schema implementation for all modules (Q59 compliance)
