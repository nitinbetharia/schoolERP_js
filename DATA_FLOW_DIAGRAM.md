# School ERP Data Flow Diagram

## Level 0 - Context Diagram

```mermaid
graph TB
    subgraph "External Entities"
        SYSTEM_ADMIN[System Administrator]
        TRUST_ADMIN[Trust Administrator]
        SCHOOL_ADMIN[School Administrator]
        TEACHER[Teacher]
        ACCOUNTANT[Accountant]
        PARENT[Parent]
        STUDENT[Student]
    end
    
    subgraph "School ERP System"
        ERP_SYSTEM[School ERP System]
    end
    
    subgraph "Data Stores"
        MASTER_DATA[(Master Database)]
        TRUST_DATA[(Trust Databases)]
        LOG_FILES[Log Files]
        BACKUP_DATA[Backup Storage]
    end
    
    SYSTEM_ADMIN --> |Manage Trusts & System Users| ERP_SYSTEM
    TRUST_ADMIN --> |Manage Schools & Users| ERP_SYSTEM
    SCHOOL_ADMIN --> |Manage School Operations| ERP_SYSTEM
    TEACHER --> |Attendance & Student Data| ERP_SYSTEM
    ACCOUNTANT --> |Fee Management| ERP_SYSTEM
    PARENT --> |View Student Progress| ERP_SYSTEM
    STUDENT --> |View Own Data| ERP_SYSTEM
    
    ERP_SYSTEM --> |System Data| MASTER_DATA
    ERP_SYSTEM --> |School Data| TRUST_DATA
    ERP_SYSTEM --> |Audit Logs| LOG_FILES
    ERP_SYSTEM --> |Backup Data| BACKUP_DATA
    
    ERP_SYSTEM --> |Reports & Notifications| SYSTEM_ADMIN
    ERP_SYSTEM --> |Reports & Analytics| TRUST_ADMIN
    ERP_SYSTEM --> |School Reports| SCHOOL_ADMIN
    ERP_SYSTEM --> |Student Reports| TEACHER
    ERP_SYSTEM --> |Fee Reports| ACCOUNTANT
    ERP_SYSTEM --> |Progress Reports| PARENT
    ERP_SYSTEM --> |Academic Info| STUDENT
```

## Level 1 - System Breakdown

```mermaid
graph TB
    subgraph "Authentication & Authorization"
        AUTH_PROCESS[1.0 Authentication Process]
        SESSION_MGT[1.1 Session Management]
        RBAC_CHECK[1.2 Role-Based Access Control]
    end
    
    subgraph "User Management"
        USER_MGT[2.0 User Management]
        PROFILE_MGT[2.1 Profile Management]
        ROLE_ASSIGNMENT[2.2 Role Assignment]
    end
    
    subgraph "Academic Management"
        STUDENT_MGT[3.0 Student Management]
        CLASS_MGT[3.1 Class Management]
        ACADEMIC_YEAR[3.2 Academic Year Management]
    end
    
    subgraph "Attendance System"
        ATTENDANCE_ENTRY[4.0 Attendance Entry]
        ATTENDANCE_REPORT[4.1 Attendance Reporting]
    end
    
    subgraph "Fee Management"
        FEE_STRUCTURE[5.0 Fee Structure Management]
        FEE_COLLECTION[5.1 Fee Collection]
        FEE_REPORTING[5.2 Fee Reporting]
    end
    
    subgraph "Reporting & Analytics"
        REPORT_GEN[6.0 Report Generation]
        ANALYTICS[6.1 Analytics Engine]
        DASHBOARD[6.2 Dashboard Services]
    end
    
    subgraph "Data Stores"
        USERS_DB[(Users Database)]
        STUDENTS_DB[(Students Database)]
        ACADEMIC_DB[(Academic Database)]
        FEES_DB[(Fees Database)]
        LOGS_DB[(Audit Logs)]
        SESSIONS_DB[(Sessions Database)]
    end
    
    %% Authentication flows
    AUTH_PROCESS --> USERS_DB
    SESSION_MGT --> SESSIONS_DB
    RBAC_CHECK --> USERS_DB
    
    %% User management flows
    USER_MGT --> USERS_DB
    PROFILE_MGT --> USERS_DB
    ROLE_ASSIGNMENT --> USERS_DB
    
    %% Academic flows
    STUDENT_MGT --> STUDENTS_DB
    CLASS_MGT --> ACADEMIC_DB
    ACADEMIC_YEAR --> ACADEMIC_DB
    
    %% Attendance flows
    ATTENDANCE_ENTRY --> ACADEMIC_DB
    ATTENDANCE_REPORT --> ACADEMIC_DB
    
    %% Fee flows
    FEE_STRUCTURE --> FEES_DB
    FEE_COLLECTION --> FEES_DB
    FEE_REPORTING --> FEES_DB
    
    %% Reporting flows
    REPORT_GEN --> STUDENTS_DB
    REPORT_GEN --> ACADEMIC_DB
    REPORT_GEN --> FEES_DB
    ANALYTICS --> STUDENTS_DB
    ANALYTICS --> ACADEMIC_DB
    ANALYTICS --> FEES_DB
    DASHBOARD --> USERS_DB
    DASHBOARD --> STUDENTS_DB
    DASHBOARD --> ACADEMIC_DB
    DASHBOARD --> FEES_DB
    
    %% Audit logging
    AUTH_PROCESS --> LOGS_DB
    USER_MGT --> LOGS_DB
    STUDENT_MGT --> LOGS_DB
    FEE_COLLECTION --> LOGS_DB
```

## Level 2 - Authentication Process Detailed

```mermaid
graph TD
    subgraph "Authentication Subprocess"
        LOGIN_REQUEST[Login Request] --> DETERMINE_TYPE[2.1 Determine Login Type]
        DETERMINE_TYPE --> |System Admin| SYSTEM_AUTH[2.2 System Authentication]
        DETERMINE_TYPE --> |Trust User| TRUST_AUTH[2.3 Trust Authentication]
        
        SYSTEM_AUTH --> VALIDATE_SYSTEM[2.4 Validate System Credentials]
        TRUST_AUTH --> VALIDATE_TRUST[2.5 Validate Trust Credentials]
        
        VALIDATE_SYSTEM --> |Valid| CREATE_SESSION[2.6 Create Session]
        VALIDATE_TRUST --> |Valid| CREATE_SESSION
        VALIDATE_SYSTEM --> |Invalid| LOGIN_FAILED[2.7 Login Failed]
        VALIDATE_TRUST --> |Invalid| LOGIN_FAILED
        
        CREATE_SESSION --> SET_PERMISSIONS[2.8 Set User Permissions]
        SET_PERMISSIONS --> REDIRECT_DASHBOARD[2.9 Redirect to Dashboard]
        
        LOGIN_FAILED --> LOG_ATTEMPT[2.10 Log Failed Attempt]
        LOG_ATTEMPT --> SHOW_ERROR[2.11 Show Error Message]
    end
    
    subgraph "Data Stores"
        SYSTEM_USERS[(System Users)]
        TRUST_USERS[(Trust Users)]
        SESSIONS[(User Sessions)]
        AUDIT_LOG[(Audit Logs)]
    end
    
    VALIDATE_SYSTEM --> SYSTEM_USERS
    VALIDATE_TRUST --> TRUST_USERS
    CREATE_SESSION --> SESSIONS
    LOG_ATTEMPT --> AUDIT_LOG
    SET_PERMISSIONS --> SESSIONS
```

## Level 2 - Student Management Process

```mermaid
graph TD
    subgraph "Student Management Subprocess"
        STUDENT_REQUEST[Student Operation Request] --> AUTH_CHECK[3.1 Authorization Check]
        AUTH_CHECK --> |Authorized| OPERATION_TYPE[3.2 Determine Operation]
        AUTH_CHECK --> |Not Authorized| ACCESS_DENIED[3.3 Access Denied]
        
        OPERATION_TYPE --> |Create| VALIDATE_DATA[3.4 Validate Student Data]
        OPERATION_TYPE --> |Update| VALIDATE_UPDATE[3.5 Validate Update Data]
        OPERATION_TYPE --> |Delete| CHECK_DEPENDENCIES[3.6 Check Dependencies]
        OPERATION_TYPE --> |View| FETCH_DATA[3.7 Fetch Student Data]
        
        VALIDATE_DATA --> |Valid| CREATE_STUDENT[3.8 Create Student Record]
        VALIDATE_DATA --> |Invalid| VALIDATION_ERROR[3.9 Validation Error]
        
        VALIDATE_UPDATE --> |Valid| UPDATE_STUDENT[3.10 Update Student Record]
        VALIDATE_UPDATE --> |Invalid| VALIDATION_ERROR
        
        CHECK_DEPENDENCIES --> |Safe to Delete| DELETE_STUDENT[3.11 Delete Student Record]
        CHECK_DEPENDENCIES --> |Has Dependencies| DEPENDENCY_ERROR[3.12 Dependency Error]
        
        CREATE_STUDENT --> LOG_ACTION[3.13 Log Action]
        UPDATE_STUDENT --> LOG_ACTION
        DELETE_STUDENT --> LOG_ACTION
        FETCH_DATA --> RETURN_DATA[3.14 Return Student Data]
        
        LOG_ACTION --> SUCCESS_RESPONSE[3.15 Success Response]
    end
    
    subgraph "Data Stores"
        STUDENTS[(Students)]
        CLASSES[(Classes)]
        FEES[(Fee Records)]
        ATTENDANCE[(Attendance)]
        AUDIT[(Audit Logs)]
        SESSIONS[(User Sessions)]
    end
    
    AUTH_CHECK --> SESSIONS
    VALIDATE_DATA --> STUDENTS
    VALIDATE_UPDATE --> STUDENTS
    CHECK_DEPENDENCIES --> FEES
    CHECK_DEPENDENCIES --> ATTENDANCE
    CREATE_STUDENT --> STUDENTS
    UPDATE_STUDENT --> STUDENTS
    DELETE_STUDENT --> STUDENTS
    FETCH_DATA --> STUDENTS
    FETCH_DATA --> CLASSES
    LOG_ACTION --> AUDIT
```

## Level 2 - Fee Management Process

```mermaid
graph TD
    subgraph "Fee Management Subprocess"
        FEE_REQUEST[Fee Operation Request] --> AUTH_FEE[5.1 Fee Authorization Check]
        AUTH_FEE --> |Authorized| FEE_OPERATION[5.2 Determine Fee Operation]
        AUTH_FEE --> |Not Authorized| FEE_ACCESS_DENIED[5.3 Access Denied]
        
        FEE_OPERATION --> |Structure Setup| SETUP_STRUCTURE[5.4 Setup Fee Structure]
        FEE_OPERATION --> |Fee Collection| COLLECT_FEE[5.5 Collect Fee Payment]
        FEE_OPERATION --> |Generate Receipt| GENERATE_RECEIPT[5.6 Generate Receipt]
        FEE_OPERATION --> |Fee Report| GENERATE_FEE_REPORT[5.7 Generate Fee Report]
        
        SETUP_STRUCTURE --> VALIDATE_STRUCTURE[5.8 Validate Structure Data]
        COLLECT_FEE --> VALIDATE_PAYMENT[5.9 Validate Payment Data]
        
        VALIDATE_STRUCTURE --> |Valid| SAVE_STRUCTURE[5.10 Save Fee Structure]
        VALIDATE_STRUCTURE --> |Invalid| STRUCTURE_ERROR[5.11 Structure Validation Error]
        
        VALIDATE_PAYMENT --> |Valid| PROCESS_PAYMENT[5.12 Process Payment]
        VALIDATE_PAYMENT --> |Invalid| PAYMENT_ERROR[5.13 Payment Validation Error]
        
        PROCESS_PAYMENT --> UPDATE_BALANCE[5.14 Update Student Balance]
        UPDATE_BALANCE --> CREATE_TRANSACTION[5.15 Create Transaction Record]
        CREATE_TRANSACTION --> GENERATE_RECEIPT
        
        GENERATE_RECEIPT --> LOG_FEE_ACTION[5.16 Log Fee Action]
        SAVE_STRUCTURE --> LOG_FEE_ACTION
        GENERATE_FEE_REPORT --> LOG_FEE_ACTION
        
        LOG_FEE_ACTION --> FEE_SUCCESS[5.17 Fee Success Response]
    end
    
    subgraph "Data Stores"
        FEE_STRUCTURES[(Fee Structures)]
        FEE_PAYMENTS[(Fee Payments)]
        STUDENT_BALANCES[(Student Balances)]
        TRANSACTIONS[(Transactions)]
        STUDENTS_FEE[(Students)]
        AUDIT_FEE[(Audit Logs)]
        SESSIONS_FEE[(User Sessions)]
    end
    
    AUTH_FEE --> SESSIONS_FEE
    SETUP_STRUCTURE --> FEE_STRUCTURES
    COLLECT_FEE --> FEE_PAYMENTS
    PROCESS_PAYMENT --> STUDENT_BALANCES
    CREATE_TRANSACTION --> TRANSACTIONS
    GENERATE_FEE_REPORT --> FEE_PAYMENTS
    GENERATE_FEE_REPORT --> STUDENTS_FEE
    LOG_FEE_ACTION --> AUDIT_FEE
```

## Data Flow for Multi-Tenant Architecture

```mermaid
graph TB
    subgraph "Request Context Flow"
        REQUEST[Incoming Request] --> EXTRACT_HOST[Extract Host/Subdomain]
        EXTRACT_HOST --> DETERMINE_TRUST[Determine Trust Context]
        DETERMINE_TRUST --> TRUST_CODE[Extract Trust Code]
        TRUST_CODE --> DB_SELECTION[Select Database]
    end
    
    subgraph "Database Selection Logic"
        DB_SELECTION --> |System Request| MASTER_DB[Route to Master Database]
        DB_SELECTION --> |Trust Request| TRUST_LOOKUP[Lookup Trust Database]
        TRUST_LOOKUP --> TRUST_DB[Route to Trust Database]
    end
    
    subgraph "Data Access Pattern"
        MASTER_DB --> SYSTEM_OPERATIONS[System Operations]
        TRUST_DB --> TRUST_OPERATIONS[Trust Operations]
        
        SYSTEM_OPERATIONS --> |CRUD| SYSTEM_TABLES[System Tables]
        TRUST_OPERATIONS --> |CRUD| TRUST_TABLES[Trust Tables]
    end
    
    subgraph "Cross-Database Operations"
        TRUST_VALIDATION[Trust Validation] --> MASTER_DB
        TRUST_VALIDATION --> TRUST_DB
        USER_CONTEXT[User Context Loading] --> MASTER_DB
        USER_CONTEXT --> TRUST_DB
    end
    
    subgraph "Data Consistency"
        TRANSACTION_START[Begin Transaction] --> MULTIPLE_DBS[Multiple Database Updates]
        MULTIPLE_DBS --> |Success| COMMIT_ALL[Commit All]
        MULTIPLE_DBS --> |Failure| ROLLBACK_ALL[Rollback All]
    end
```

## Audit Trail Data Flow

```mermaid
graph TD
    subgraph "Audit Logging Flow"
        USER_ACTION[User Action] --> CAPTURE_CONTEXT[Capture Action Context]
        CAPTURE_CONTEXT --> EXTRACT_DETAILS[Extract Action Details]
        EXTRACT_DETAILS --> FORMAT_LOG[Format Audit Log Entry]
        FORMAT_LOG --> DETERMINE_LOG_DB[Determine Log Database]
        
        DETERMINE_LOG_DB --> |System Action| SYSTEM_AUDIT[System Audit Log]
        DETERMINE_LOG_DB --> |Trust Action| TRUST_AUDIT[Trust Audit Log]
        
        SYSTEM_AUDIT --> STORE_SYSTEM_LOG[Store in Master DB]
        TRUST_AUDIT --> STORE_TRUST_LOG[Store in Trust DB]
        
        STORE_SYSTEM_LOG --> LOG_SUCCESS[Log Success]
        STORE_TRUST_LOG --> LOG_SUCCESS
    end
    
    subgraph "Audit Data Elements"
        ACTION_TYPE[Action Type]
        USER_ID[User ID]
        ENTITY_TYPE[Entity Type]
        ENTITY_ID[Entity ID]
        OLD_VALUES[Previous Values]
        NEW_VALUES[New Values]
        TIMESTAMP[Timestamp]
        IP_ADDRESS[IP Address]
        USER_AGENT[User Agent]
    end
    
    EXTRACT_DETAILS --> ACTION_TYPE
    EXTRACT_DETAILS --> USER_ID
    EXTRACT_DETAILS --> ENTITY_TYPE
    EXTRACT_DETAILS --> ENTITY_ID
    EXTRACT_DETAILS --> OLD_VALUES
    EXTRACT_DETAILS --> NEW_VALUES
    EXTRACT_DETAILS --> TIMESTAMP
    EXTRACT_DETAILS --> IP_ADDRESS
    EXTRACT_DETAILS --> USER_AGENT
```

## Session Data Flow

```mermaid
graph TD
    subgraph "Session Lifecycle"
        LOGIN_SUCCESS[Successful Login] --> CREATE_SESSION_DATA[Create Session Data]
        CREATE_SESSION_DATA --> GENERATE_SESSION_ID[Generate Session ID]
        GENERATE_SESSION_ID --> STORE_SESSION[Store Session in Database]
        STORE_SESSION --> SET_COOKIE[Set Session Cookie]
        
        SUBSEQUENT_REQUEST[Subsequent Request] --> EXTRACT_SESSION_ID[Extract Session ID from Cookie]
        EXTRACT_SESSION_ID --> VALIDATE_SESSION[Validate Session in Database]
        
        VALIDATE_SESSION --> |Valid| LOAD_USER_DATA[Load User Data]
        VALIDATE_SESSION --> |Invalid/Expired| DESTROY_SESSION[Destroy Session]
        
        LOAD_USER_DATA --> UPDATE_LAST_ACTIVITY[Update Last Activity]
        UPDATE_LAST_ACTIVITY --> ATTACH_TO_REQUEST[Attach User to Request]
        
        LOGOUT_REQUEST[Logout Request] --> INVALIDATE_SESSION[Invalidate Session in Database]
        INVALIDATE_SESSION --> CLEAR_COOKIE[Clear Session Cookie]
        
        DESTROY_SESSION --> REDIRECT_TO_LOGIN[Redirect to Login]
    end
    
    subgraph "Session Storage"
        SYSTEM_SESSIONS[(System User Sessions)]
        TRUST_SESSIONS[(Trust User Sessions)]
        EXPRESS_SESSIONS[(Express Sessions)]
    end
    
    subgraph "Session Data Structure"
        SESSION_ID[Session ID]
        USER_DATA[User Data]
        LOGIN_TYPE[Login Type]
        EXPIRES_AT[Expires At]
        LAST_ACTIVITY[Last Activity]
        IP_ADDRESS_SESSION[IP Address]
        USER_AGENT_SESSION[User Agent]
    end
    
    STORE_SESSION --> |System User| SYSTEM_SESSIONS
    STORE_SESSION --> |Trust User| TRUST_SESSIONS
    STORE_SESSION --> |Express Session| EXPRESS_SESSIONS
    
    CREATE_SESSION_DATA --> SESSION_ID
    CREATE_SESSION_DATA --> USER_DATA
    CREATE_SESSION_DATA --> LOGIN_TYPE
    CREATE_SESSION_DATA --> EXPIRES_AT
    CREATE_SESSION_DATA --> LAST_ACTIVITY
    CREATE_SESSION_DATA --> IP_ADDRESS_SESSION
    CREATE_SESSION_DATA --> USER_AGENT_SESSION
```