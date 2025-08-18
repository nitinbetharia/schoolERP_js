# AUTH Module API Test Guide

## 🧪 Complete Testing Guide for AUTH Module

This document provides comprehensive test cases for the AUTH module API endpoints using REST clients like Postman, REST Client Extension, or curl.

## 📋 Test Environment Setup

### Base URLs
- **Local Development**: `http://localhost:3000`
- **System Admin**: `http://admin.localhost:3000` (requires hosts file entry)
- **Demo Trust**: `http://demo.localhost:3000` (requires hosts file entry)

### Prerequisites
1. Start the server: `npm run dev`
2. Ensure database is set up: `npm run setup`
3. Validate setup: `npm run validate`

---

## 🔐 Test Cases

### 1. Health Check
**Purpose**: Verify API is running and healthy

```http
GET http://localhost:3000/api/v1/health
Content-Type: application/json
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2025-08-16T10:30:00.000Z"
  }
}
```

---

### 2. System Admin Login
**Purpose**: Test system administrator authentication

```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@system.local",
  "password": "admin123",
  "remember_me": false
}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Login successful",
    "user": {
      "id": 1,
      "email": "admin@system.local",
      "firstName": "System",
      "lastName": "Administrator",
      "role": "SYSTEM_ADMIN",
      "permissions": ["*"],
      "schoolId": null,
      "trustId": null
    },
    "session": {
      "sessionId": "uuid-session-id",
      "expiresAt": "2025-08-17T10:30:00.000Z",
      "loginType": "SYSTEM"
    }
  },
  "timestamp": "2025-08-16T10:30:00.000Z"
}
```

---

### 3. Trust User Login
**Purpose**: Test trust-level user authentication

```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@demo.school",
  "password": "password123",
  "trust_code": "demo",
  "school_id": 1,
  "remember_me": true
}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Login successful",
    "user": {
      "id": 1,
      "email": "admin@demo.school",
      "firstName": "School",
      "lastName": "Admin",
      "role": "SCHOOL_ADMIN",
      "permissions": ["users:read", "students:*", "fees:*"],
      "schoolId": 1,
      "trustId": 1
    },
    "session": {
      "sessionId": "uuid-session-id",
      "expiresAt": "2025-09-15T10:30:00.000Z",
      "loginType": "TRUST"
    }
  },
  "timestamp": "2025-08-16T10:30:00.000Z"
}
```

---

### 4. Invalid Login Attempt
**Purpose**: Test authentication failure handling

```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "wrong@email.com",
  "password": "wrongpassword"
}
```

**Expected Response** (401 Unauthorized):
```json
{
  "success": false,
  "error": {
    "code": "LOGIN_FAILED",
    "message": "Invalid email or password",
    "timestamp": "2025-08-16T10:30:00.000Z"
  }
}
```

---

### 5. Get Current User Info
**Purpose**: Test authenticated user information retrieval

⚠️ **Requires**: Valid session from previous login

```http
GET http://localhost:3000/api/v1/auth/me
Content-Type: application/json
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "admin@system.local",
      "firstName": "System",
      "lastName": "Administrator",
      "role": "SYSTEM_ADMIN",
      "permissions": ["*"],
      "schoolId": null,
      "trustId": null
    },
    "session": {
      "sessionId": "uuid-session-id",
      "loginType": "SYSTEM"
    }
  },
  "timestamp": "2025-08-16T10:30:00.000Z"
}
```

---

### 6. Check Authentication Status
**Purpose**: Test authentication status endpoint

```http
GET http://localhost:3000/api/v1/auth/status
Content-Type: application/json
```

**Expected Response** (authenticated):
```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "user": {
      "id": 1,
      "email": "admin@system.local",
      "role": "SYSTEM_ADMIN"
    },
    "session": {
      "loginType": "SYSTEM"
    }
  },
  "timestamp": "2025-08-16T10:30:00.000Z"
}
```

**Expected Response** (not authenticated):
```json
{
  "success": true,
  "data": {
    "authenticated": false
  },
  "timestamp": "2025-08-16T10:30:00.000Z"
}
```

---

### 7. Change Password
**Purpose**: Test password change functionality

⚠️ **Requires**: Valid authentication

```http
POST http://localhost:3000/api/v1/auth/change-password
Content-Type: application/json

{
  "currentPassword": "admin123",
  "newPassword": "newPassword123!",
  "confirmPassword": "newPassword123!"
}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  },
  "timestamp": "2025-08-16T10:30:00.000Z"
}
```

---

### 8. Trust Lookup
**Purpose**: Test trust information retrieval

```http
GET http://localhost:3000/api/v1/auth/trusts/demo
Content-Type: application/json
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "trust": {
      "id": 1,
      "name": "Demo Educational Trust",
      "trustCode": "demo"
    },
    "schools": [
      {
        "id": 1,
        "name": "Demo High School",
        "status": "active"
      },
      {
        "id": 2,
        "name": "Demo Primary School",
        "status": "active"
      }
    ]
  },
  "timestamp": "2025-08-16T10:30:00.000Z"
}
```

---

### 9. Forgot Password Request
**Purpose**: Test password reset request

```http
POST http://localhost:3000/api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "admin@demo.school",
  "trust_code": "demo"
}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "If an account with that email exists, we have sent password reset instructions."
  },
  "timestamp": "2025-08-16T10:30:00.000Z"
}
```

---

### 10. Get User Permissions
**Purpose**: Test user permissions and accessible routes

⚠️ **Requires**: Valid authentication

```http
GET http://localhost:3000/api/v1/auth/permissions
Content-Type: application/json
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "role": "SYSTEM_ADMIN",
    "permissions": ["*"],
    "accessibleRoutes": [
      "/admin",
      "/api/v1/system/*",
      "/dashboard",
      "/reports/*"
    ],
    "context": {
      "schoolId": null,
      "trustId": null
    }
  },
  "timestamp": "2025-08-16T10:30:00.000Z"
}
```

---

### 11. Logout
**Purpose**: Test user logout and session invalidation

⚠️ **Requires**: Valid authentication

```http
POST http://localhost:3000/api/v1/auth/logout
Content-Type: application/json
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Logout successful"
  },
  "timestamp": "2025-08-16T10:30:00.000Z"
}
```

---

## 🚨 Error Test Cases

### Rate Limiting Test
**Purpose**: Test rate limiting protection

Make 6 rapid login attempts within 15 minutes:

```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "test@test.com",
  "password": "wrongpassword"
}
```

**Expected Response** (429 Too Many Requests):
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many authentication attempts. Please wait 15 minutes and try again.",
    "retryAfter": 900
  }
}
```

### Validation Error Test
**Purpose**: Test input validation

```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "invalid-email",
  "password": ""
}
```

**Expected Response** (400 Bad Request):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid login credentials",
    "details": {
      "email": "Invalid email format",
      "password": "Password is required"
    }
  }
}
```

---

## 🔧 Test Automation Scripts

### Bash Test Script
```bash
#!/bin/bash
# AUTH Module API Test Runner

BASE_URL="http://localhost:3000/api/v1"

echo "🧪 Testing AUTH Module API..."

# Test 1: Health Check
echo "1️⃣ Testing Health Check..."
curl -s "$BASE_URL/health" | jq .

# Test 2: System Login
echo "2️⃣ Testing System Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.local","password":"admin123"}')

echo $LOGIN_RESPONSE | jq .

# Extract session cookie for subsequent requests
SESSION_COOKIE=$(echo $LOGIN_RESPONSE | jq -r '.data.session.sessionId')

# Test 3: Get Current User
echo "3️⃣ Testing Current User Info..."
curl -s "$BASE_URL/auth/me" \
  -H "Content-Type: application/json" \
  -b "sessionId=$SESSION_COOKIE" | jq .

echo "✅ AUTH Module API Tests Complete!"
```

### PowerShell Test Script
```powershell
# AUTH Module API Test Runner for Windows

$BaseUrl = "http://localhost:3000/api/v1"

Write-Host "🧪 Testing AUTH Module API..." -ForegroundColor Green

# Test 1: Health Check
Write-Host "1️⃣ Testing Health Check..." -ForegroundColor Yellow
$HealthResponse = Invoke-RestMethod -Uri "$BaseUrl/health" -Method GET
$HealthResponse | ConvertTo-Json -Depth 3

# Test 2: System Login
Write-Host "2️⃣ Testing System Login..." -ForegroundColor Yellow
$LoginBody = @{
    email = "admin@system.local"
    password = "admin123"
} | ConvertTo-Json

$LoginResponse = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method POST -Body $LoginBody -ContentType "application/json"
$LoginResponse | ConvertTo-Json -Depth 3

Write-Host "✅ AUTH Module API Tests Complete!" -ForegroundColor Green
```

---

## 📊 Test Results Checklist

- [ ] Health check returns 200 OK
- [ ] System admin login successful
- [ ] Trust user login successful
- [ ] Invalid login returns 401
- [ ] Authenticated user info retrieval works
- [ ] Authentication status check works
- [ ] Password change functionality works
- [ ] Trust lookup returns correct data
- [ ] Forgot password returns success (security)
- [ ] User permissions retrieval works
- [ ] Logout invalidates session
- [ ] Rate limiting protects against brute force
- [ ] Input validation prevents invalid data
- [ ] All error responses follow standard format
- [ ] Session management works correctly

---

## 🐛 Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure server is running: `npm run dev`
   - Check port 3000 is not in use

2. **Database Errors**
   - Run setup: `npm run setup`
   - Validate: `npm run validate`

3. **Authentication Failures**
   - Check credentials in validation script
   - Verify user exists in database

4. **Rate Limiting Issues**
   - Wait 15 minutes between test runs
   - Use different IP or clear rate limit data

### Debug Commands
```bash
# Check server status
npm run health

# Validate database setup
npm run validate

# Check logs
tail -f logs/app.log
tail -f logs/auth.log
tail -f logs/error.log
```

---

*Last Updated: August 16, 2025*
*Version: 1.0.0 - AUTH Module Complete*