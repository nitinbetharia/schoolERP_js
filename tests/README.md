# School ERP API Testing Guide

## 📋 Overview

This directory contains comprehensive testing files for the School ERP Phase 1A (DATA Module) and Phase 1B (AUTH Module) APIs.

## 🛠️ Setup Requirements

### 1. VS Code Extensions

Install the **REST Client** extension by Huachao Mao:

- Extension ID: `humao.rest-client`
- Or search for "REST Client" in VS Code extensions marketplace

### 2. Server Setup

Ensure the development server is running:

```bash
cd schoolERP_js
npm run dev
```

Server should be accessible at: `http://localhost:3000`

## 📁 Test Files

### 1. `phase1-tests.http`

**Comprehensive test suite** with 10+ categories of tests:

- ✅ Health & Status checks
- 🔐 Authentication tests (login, logout, password change)
- 🏢 Trust management (CRUD operations)
- 🛡️ Authorization tests
- ✔️ Validation tests
- ⏱️ Rate limiting tests
- ❌ Error handling tests
- 📄 Pagination & filtering tests
- 🔒 Security tests (XSS, SQL injection protection)
- ⚡ Performance tests

### 2. `quick-tests.http`

**Essential tests** for rapid verification:

- Health check
- Login
- Create trust
- List trusts
- Update trust
- Complete setup
- Logout

### 3. `test-data.js`

**Sample data** for various testing scenarios:

- Valid payloads (minimal, complete, advanced)
- Invalid payloads (missing fields, wrong formats)
- Authentication data
- Security test payloads

## 🚀 Quick Start

### Step 1: Start Server

```bash
npm run dev
```

Wait for: `🚀 School ERP Server is running!`

### Step 2: Open Test File

Open `quick-tests.http` in VS Code

### Step 3: Run Health Check

Click "Send Request" above the health check endpoint:

```http
GET http://localhost:3000/api/v1/admin/system/health
```

### Step 4: Login

Run the login request:

```http
POST http://localhost:3000/api/v1/admin/system/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### Step 5: Copy Session Cookie

From the login response, find the `Set-Cookie` header:

```
Set-Cookie: connect.sid=s%3A[session-id].signature; Path=/; HttpOnly
```

**Copy ONLY the value part** (everything after connect.sid=):

```
s%3A[session-id].signature
```

### Step 6: Update Cookie Values

Replace `SESSION_COOKIE_VALUE` in test files with your copied value.

**✅ Correct format:**

```http
Cookie: connect.sid=s%3A[session-id].signature
```

**❌ Wrong format:**

```http
Cookie: connect.sid=s%3A[session-id].signature; Path=/; HttpOnly
```

### Step 7: Run Remaining Tests

Execute tests in the provided sequence.

## 📊 Test Categories Explained

### 🔐 Authentication Tests

- **Login**: Valid/invalid credentials, missing fields
- **Logout**: Session termination
- **Password Change**: Current password validation, confirmation matching

### 🏢 Trust Management Tests

- **Create**: Valid/invalid data, required fields, validation
- **Read**: Get all trusts, get by ID, pagination, filtering, search
- **Update**: Partial/complete updates, validation
- **Setup**: Complete trust setup process

### 🛡️ Security Tests

- **XSS Protection**: Script injection attempts
- **SQL Injection**: Query parameter tampering
- **CORS**: Cross-origin request handling
- **Rate Limiting**: Brute force protection

### ✔️ Validation Tests

- **Field Requirements**: Missing required fields
- **Format Validation**: Email, phone, URL formats
- **Length Constraints**: Min/max character limits
- **Data Types**: String, number, object validation

## 🎯 Expected Response Codes

| Code | Meaning               | When to Expect                    |
| ---- | --------------------- | --------------------------------- |
| 200  | Success               | Successful GET, PUT operations    |
| 201  | Created               | Successful POST operations        |
| 400  | Bad Request           | Validation errors, malformed data |
| 401  | Unauthorized          | No session, invalid credentials   |
| 403  | Forbidden             | Insufficient permissions          |
| 404  | Not Found             | Resource doesn't exist            |
| 429  | Too Many Requests     | Rate limiting triggered           |
| 500  | Internal Server Error | Server-side issues                |

## 📝 Sample Test Responses

### Successful Login Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "role": "SYSTEM_ADMIN",
      "isActive": true
    },
    "sessionExpires": "2025-08-20T12:00:00.000Z"
  },
  "message": "Login successful"
}
```

### Trust Creation Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Test School Trust",
    "slug": "test-school-trust",
    "contactEmail": "admin@testschool.edu",
    "status": "ACTIVE",
    "dbName": "trust_1_testschooltrust",
    "createdAt": "2025-08-19T12:59:59.000Z"
  },
  "message": "Trust created successfully"
}
```

### Validation Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_REQUIRED",
    "message": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "Name is required",
        "value": ""
      }
    ],
    "timestamp": "2025-08-19T12:59:59.000Z"
  }
}
```

## 🔧 Troubleshooting

### Server Not Responding

1. Check if server is running: `npm run dev`
2. Verify port 3000 is not blocked
3. Check terminal for error messages

### Authentication Issues

1. Ensure you're using correct credentials (admin/admin123)
2. Copy the complete session cookie including signature
3. Check cookie expiration time

### Rate Limiting Triggered

1. Wait for the rate limit window to reset (15 minutes)
2. Use different IP or restart server for testing

### Database Issues

1. Run migration: `npm run migrate`
2. Run initial setup: `npm run setup`
3. Check database connection in `.env`

## 🧪 Advanced Testing

### Load Testing

For load testing, use tools like:

- **Artillery**: `npm install -g artillery`
- **Apache Bench**: `ab -n 100 -c 10 http://localhost:3000/api/v1/admin/system/health`

### Automated Testing

The REST Client files can be integrated with CI/CD pipelines using the REST Client CLI.

### Security Scanning

Consider using tools like:

- **OWASP ZAP** for security scanning
- **Burp Suite** for penetration testing
- **Snyk** for dependency vulnerability scanning

## 📚 Additional Resources

- [REST Client Extension Documentation](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
- [School ERP API Documentation](../docs/API_DOCUMENTATION.md)
- [Database Schema](../docs/DATABASE_DESIGN.md)

## 🏷️ Test Tags

Use these in your test documentation:

- `@category:auth` - Authentication tests
- `@category:trust` - Trust management tests
- `@category:validation` - Data validation tests
- `@category:security` - Security tests
- `@category:performance` - Performance tests
- `@priority:high` - Critical functionality tests
- `@priority:medium` - Important feature tests
- `@priority:low` - Edge case tests

---

## ✅ Test Checklist

### Phase 1A (DATA Module)

- [ ] Database connection health
- [ ] Multi-tenant database creation
- [ ] Trust model CRUD operations
- [ ] System user model operations
- [ ] Database migration success
- [ ] Connection pooling functionality

### Phase 1B (AUTH Module)

- [ ] System admin login/logout
- [ ] Session management
- [ ] Password change functionality
- [ ] Role-based access control
- [ ] Rate limiting protection
- [ ] Input sanitization
- [ ] Security headers implementation

### Integration Tests

- [ ] End-to-end trust creation workflow
- [ ] Authentication + authorization flow
- [ ] Database transaction consistency
- [ ] Error handling across modules
- [ ] Logging functionality
- [ ] Performance under load

**Happy Testing! 🎉**
