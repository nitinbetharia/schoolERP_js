# School ERP System Flow Diagram

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Browser]
        API[API Clients]
    end
    
    subgraph "Application Layer"
        LB[Load Balancer]
        WEB --> LB
        API --> LB
        
        subgraph "Express.js Server"
            MIDDLEWARE[Middleware Stack]
            LB --> MIDDLEWARE
            
            MIDDLEWARE --> AUTH[Authentication]
            MIDDLEWARE --> RATE[Rate Limiting]
            MIDDLEWARE --> VALID[Validation]
            MIDDLEWARE --> CORS[CORS]
            MIDDLEWARE --> HELMET[Security Headers]
        end
        
        subgraph "Route Handlers"
            AUTH --> ROUTES[Route Layer]
            ROUTES --> AUTH_ROUTES[Auth Routes]
            ROUTES --> API_ROUTES[API Routes]
            ROUTES --> WEB_ROUTES[Web Routes]
        end
        
        subgraph "Business Logic Layer"
            AUTH_ROUTES --> AUTH_SERVICE[Auth Service]
            API_ROUTES --> SERVICES[Business Services]
            WEB_ROUTES --> SERVICES
            
            SERVICES --> USER_SERVICE[User Service]
            SERVICES --> STUDENT_SERVICE[Student Service]
            SERVICES --> FEE_SERVICE[Fee Service]
            SERVICES --> ATTENDANCE_SERVICE[Attendance Service]
            SERVICES --> REPORT_SERVICE[Report Service]
        end
        
        subgraph "Data Access Layer"
            AUTH_SERVICE --> DB_SERVICE[Database Service]
            SERVICES --> DB_SERVICE
            
            DB_SERVICE --> CONN_POOL[Connection Pool]
            DB_SERVICE --> QUERY_BUILDER[Query Builder]
            DB_SERVICE --> TRANSACTION[Transaction Manager]
        end
    end
    
    subgraph "Data Layer"
        subgraph "Master Database"
            MASTER_DB[(MySQL Master)]
            CONN_POOL --> MASTER_DB
            
            MASTER_DB --> SYSTEM_USERS[System Users]
            MASTER_DB --> TRUSTS[Trusts]
            MASTER_DB --> SESSIONS[Sessions]
            MASTER_DB --> AUDIT_LOGS[Audit Logs]
        end
        
        subgraph "Trust Databases"
            TRUST_DB1[(Trust DB 1)]
            TRUST_DB2[(Trust DB 2)]
            TRUST_DBN[(Trust DB N)]
            
            CONN_POOL --> TRUST_DB1
            CONN_POOL --> TRUST_DB2
            CONN_POOL --> TRUST_DBN
            
            TRUST_DB1 --> SCHOOLS[Schools]
            TRUST_DB1 --> TRUST_USERS[Trust Users]
            TRUST_DB1 --> STUDENTS[Students]
            TRUST_DB1 --> CLASSES[Classes]
            TRUST_DB1 --> FEES[Fee Records]
            TRUST_DB1 --> ATTENDANCE[Attendance]
        end
    end
    
    subgraph "External Systems"
        SMTP[Email Service]
        BACKUP[Backup Service]
        LOGS[Log Files]
        
        SERVICES --> SMTP
        DB_SERVICE --> BACKUP
        MIDDLEWARE --> LOGS
    end

    style WEB fill:#e1f5fe
    style API fill:#e1f5fe
    style MASTER_DB fill:#ffecb3
    style TRUST_DB1 fill:#ffecb3
    style TRUST_DB2 fill:#ffecb3
    style TRUST_DBN fill:#ffecb3
    style AUTH_SERVICE fill:#f3e5f5
    style SERVICES fill:#f3e5f5
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Server
    participant AuthService
    participant MasterDB
    participant TrustDB
    participant Session

    User->>Browser: Enter credentials
    Browser->>Server: POST /auth/login
    Server->>AuthService: authenticateUser()
    
    alt System Login
        AuthService->>MasterDB: Query system_users
        MasterDB-->>AuthService: User data
    else Trust Login
        AuthService->>TrustDB: Query users (trust specific)
        TrustDB-->>AuthService: User data
    end
    
    AuthService->>AuthService: Validate password
    AuthService->>Session: Create session
    Session-->>AuthService: Session ID
    
    AuthService-->>Server: Auth result
    Server->>Browser: Set session cookie
    Browser->>Browser: Redirect to dashboard
    Browser->>Server: GET /dashboard
    Server->>Session: Validate session
    Session-->>Server: User data
    Server-->>Browser: Dashboard page
```

## Request Processing Flow

```mermaid
graph TD
    REQUEST[Incoming Request] --> TRUST_CONTEXT[Determine Trust Context]
    TRUST_CONTEXT --> AUTH_CHECK[Authentication Check]
    
    AUTH_CHECK --> |Authenticated| RBAC[Role-Based Access Control]
    AUTH_CHECK --> |Not Authenticated| LOGIN_REDIRECT[Redirect to Login]
    
    RBAC --> |Authorized| BUSINESS_LOGIC[Business Logic]
    RBAC --> |Not Authorized| ACCESS_DENIED[Access Denied]
    
    BUSINESS_LOGIC --> VALIDATION[Input Validation]
    VALIDATION --> |Valid| DATABASE[Database Operations]
    VALIDATION --> |Invalid| VALIDATION_ERROR[Validation Error]
    
    DATABASE --> |Success| RESPONSE[Success Response]
    DATABASE --> |Error| DB_ERROR[Database Error]
    
    RESPONSE --> AUDIT_LOG[Audit Logging]
    DB_ERROR --> ERROR_HANDLER[Error Handler]
    VALIDATION_ERROR --> ERROR_HANDLER
    ACCESS_DENIED --> ERROR_HANDLER
    
    ERROR_HANDLER --> ERROR_RESPONSE[Error Response]
    AUDIT_LOG --> FINAL_RESPONSE[Final Response]
    ERROR_RESPONSE --> FINAL_RESPONSE
```

## Multi-Tenant Database Architecture

```mermaid
graph TB
    subgraph "Application Server"
        APP[Express.js Application]
        DB_SERVICE[Database Service]
        APP --> DB_SERVICE
    end
    
    subgraph "Database Layer"
        subgraph "Master Database (school_erp)"
            SYSTEM_USERS[system_users]
            TRUSTS[trusts]
            SYSTEM_SESSIONS[system_user_sessions]
            SYSTEM_AUDIT[system_audit_logs]
            EXPRESS_SESSIONS[sessions]
        end
        
        subgraph "Trust Database 1 (school_erp_trust_demo)"
            SCHOOLS1[schools]
            USERS1[users]
            STUDENTS1[students]
            CLASSES1[classes]
            FEES1[fee_records]
            ATTENDANCE1[attendance]
            SESSIONS1[user_sessions]
        end
        
        subgraph "Trust Database N (school_erp_trust_N)"
            SCHOOLSN[schools]
            USERSN[users]
            STUDENTSN[students]
            CLASSESN[classes]
            FEESN[fee_records]
            ATTENDANCEN[attendance]
            SESSIONSN[user_sessions]
        end
    end
    
    DB_SERVICE --> |System Operations| SYSTEM_USERS
    DB_SERVICE --> |Trust Management| TRUSTS
    DB_SERVICE --> |Trust 1 Operations| SCHOOLS1
    DB_SERVICE --> |Trust N Operations| SCHOOLSN
    
    style SYSTEM_USERS fill:#ffcdd2
    style TRUSTS fill:#ffcdd2
    style SCHOOLS1 fill:#c8e6c9
    style SCHOOLSN fill:#c8e6c9
```

## Error Handling Flow

```mermaid
graph TD
    ERROR[Error Occurs] --> CATCH[Error Caught]
    CATCH --> LOG[Log Error Details]
    LOG --> CLASSIFY[Classify Error Type]
    
    CLASSIFY --> |Validation Error| VALIDATION_RESPONSE[400 Bad Request]
    CLASSIFY --> |Authentication Error| AUTH_RESPONSE[401 Unauthorized]
    CLASSIFY --> |Authorization Error| AUTHZ_RESPONSE[403 Forbidden]
    CLASSIFY --> |Not Found Error| NOT_FOUND_RESPONSE[404 Not Found]
    CLASSIFY --> |Database Error| DB_ERROR_RESPONSE[500 Internal Server Error]
    CLASSIFY --> |Unknown Error| GENERIC_ERROR[500 Generic Error]
    
    VALIDATION_RESPONSE --> AUDIT[Audit Log]
    AUTH_RESPONSE --> AUDIT
    AUTHZ_RESPONSE --> AUDIT
    NOT_FOUND_RESPONSE --> AUDIT
    DB_ERROR_RESPONSE --> AUDIT
    GENERIC_ERROR --> AUDIT
    
    AUDIT --> RESPONSE[Send Response to Client]
```

## Session Management Flow

```mermaid
graph TD
    LOGIN[User Login] --> CREATE_SESSION[Create Session]
    CREATE_SESSION --> STORE_DB[Store in Database]
    STORE_DB --> SET_COOKIE[Set Session Cookie]
    
    REQUEST[Subsequent Requests] --> EXTRACT_SESSION[Extract Session ID]
    EXTRACT_SESSION --> VALIDATE_DB[Validate in Database]
    
    VALIDATE_DB --> |Valid| UPDATE_ACTIVITY[Update Last Activity]
    VALIDATE_DB --> |Invalid/Expired| DESTROY_SESSION[Destroy Session]
    
    UPDATE_ACTIVITY --> ATTACH_USER[Attach User to Request]
    DESTROY_SESSION --> REDIRECT_LOGIN[Redirect to Login]
    
    LOGOUT[User Logout] --> INVALIDATE_DB[Invalidate in Database]
    INVALIDATE_DB --> CLEAR_COOKIE[Clear Session Cookie]
```