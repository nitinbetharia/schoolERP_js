# Database Connection Retries Implementation

## 🎯 **What Are Database Connection Retries?**

Database connection retries are automatic mechanisms that re-attempt failed database operations when they fail due to **temporary** issues like:

- Network connectivity problems
- Connection timeouts
- Connection pool exhaustion
- Database server temporary overload
- MySQL "Too many connections" errors

## 🤔 **Do You Need Database Retries?**

**YES, you need them**, and here's why:

### ✅ **Already Implemented:**

1. **Sequelize Built-in Retries**: Your connection pools already have `handleDisconnects: true`
2. **Session Store Reconnection**: MySQL session store has `reconnect: true`
3. **Connection Pool Self-Healing**: Dead connections are automatically detected and replaced

### 🚀 **Now Added (Application Level):**

4. **Smart Application Retries**: Retry logic for critical business operations
5. **Configurable Retry Behavior**: Control retry attempts, delays, and conditions
6. **Operation-Specific Retries**: Different retry strategies for different operations

## 📋 **Retry Strategies Implemented**

### 1. **Critical Business Operations** (`withCriticalRetry`)

- **Use for**: Student enrollment, fee payments, grade submissions
- **Max Attempts**: 5 (configurable)
- **Delay**: 2-10 seconds with exponential backoff
- **Example**: Student enrollment must succeed even with temporary connection issues

### 2. **Regular Database Operations** (`withSequelizeRetry`)

- **Use for**: Normal queries, data retrieval, attendance marking
- **Max Attempts**: 3 (configurable)
- **Delay**: 1-5 seconds with exponential backoff
- **Example**: Loading student list, searching records

### 3. **Transaction Operations** (`withTransactionRetry`)

- **Use for**: Multi-step database operations
- **Max Attempts**: 3 (configurable)
- **Delay**: 1.5-8 seconds with exponential backoff
- **Example**: Fee payment processing with balance updates

### 4. **Health Check Operations** (`healthCheckWithRetry`)

- **Use for**: Connection validation, monitoring
- **Max Attempts**: 2 (quick checks)
- **Delay**: 0.5-2 seconds
- **Example**: Database health monitoring

## 🛠️ **How to Use Retry Logic**

### **Basic Usage:**

```javascript
const { withSequelizeRetry } = require('../utils/databaseRetry');

// Retry a simple query
const students = await withSequelizeRetry(
   async () => {
      return await Student.findAll();
   },
   {
      operation: 'fetch_students',
      context: 'student_management',
   }
);
```

### **Critical Operations:**

```javascript
const { withCriticalRetry } = require('../utils/databaseRetry');

// Critical student enrollment
const enrollment = await withCriticalRetry(
   async () => {
      return await enrollStudent(studentData);
   },
   {
      operation: 'student_enrollment',
      studentName: studentData.name,
      context: 'critical_enrollment',
   }
);
```

### **Transaction Operations:**

```javascript
const { withTransactionRetry } = require('../utils/databaseRetry');

// Fee payment with transaction
const payment = await withTransactionRetry(
   async () => {
      const transaction = await db.transaction();
      try {
         // Do payment processing
         await transaction.commit();
         return result;
      } catch (error) {
         await transaction.rollback();
         throw error;
      }
   },
   {
      operation: 'fee_payment',
      amount: paymentData.amount,
   }
);
```

## ⚙️ **Configuration**

Retry behavior is configured in `config/app-config.json`:

```json
{
   "database": {
      "retry": {
         "maxAttempts": 3,
         "baseDelayMs": 1000,
         "maxDelayMs": 5000,
         "backoffMultiplier": 2,
         "jitterRange": 0.1,
         "enableForCriticalOps": true,
         "enableForHealthChecks": true,
         "enableForTenantOps": true
      }
   }
}
```

### **Configuration Options:**

- `maxAttempts`: Maximum retry attempts (default: 3)
- `baseDelayMs`: Initial delay in milliseconds (default: 1000)
- `maxDelayMs`: Maximum delay cap (default: 5000)
- `backoffMultiplier`: Exponential backoff multiplier (default: 2)
- `jitterRange`: Random jitter to prevent thundering herd (default: 0.1 = 10%)
- `enableFor*`: Enable/disable retries for specific operation types

## 🎖️ **What Errors Are Retryable?**

The system automatically detects and retries these error types:

### **Network/Connection Errors:**

- `ECONNRESET` - Connection reset by peer
- `ETIMEDOUT` - Operation timed out
- `ECONNREFUSED` - Connection refused
- `ENOTFOUND` - Host not found

### **MySQL Specific:**

- `ER_CON_COUNT_ERROR` - Too many connections
- `ER_CONNECTION_KILLED` - Connection was killed
- `ER_QUERY_INTERRUPTED` - Query was interrupted

### **Sequelize Errors:**

- `SequelizeConnectionError`
- `SequelizeConnectionTimedOutError`
- `SequelizeConnectionRefusedError`
- `SequelizeConnectionAcquireTimeoutError`

## 📊 **Monitoring and Logging**

### **Success Logs:**

```
[SYSTEM] Database operation succeeded after retry {
  operationId: "student_enrollment_1692622800000",
  operation: "student_enrollment",
  attempt: 2,
  duration: 1250
}
```

### **Retry Logs:**

```
[SYSTEM] Retrying database operation in 2000ms {
  operationId: "fee_payment_1692622800000",
  operation: "fee_payment",
  attempt: 2,
  delay: 2000
}
```

### **Error Logs:**

```
[ERROR] Database operation failed {
  operation: "attendance_marking",
  attempt: 3,
  maxAttempts: 3,
  willRetry: false,
  retryable: true
}
```

## 🔧 **Checking Retry Status**

Use the connection manager to see retry configuration:

```bash
npm run connections:status
```

Output includes:

```
--- Retry Configuration ---
Max Retry Attempts: 3
Base Delay: 1000ms
Max Delay: 5000ms
Backoff Multiplier: 2x
✅ Database retry system is active
```

## 🚨 **When NOT to Use Retries**

**Don't use retries for:**

1. **Logic Errors**: SQL syntax errors, constraint violations
2. **Data Validation Errors**: Invalid data, missing required fields
3. **Permission Errors**: Access denied, authentication failed
4. **Non-transient Errors**: Permanent failures that won't resolve

## 📈 **Performance Impact**

### **Minimal Overhead:**

- **No retries needed**: Zero overhead
- **Successful operations**: Microseconds of overhead
- **Failed operations**: Only retries transient errors

### **Resource Usage:**

- **Memory**: Minimal (just retry logic)
- **CPU**: Negligible overhead
- **Network**: Only retries genuinely failed operations

## 🎯 **Best Practices**

### **1. Use Appropriate Retry Types**

```javascript
// ✅ Critical operations
await withCriticalRetry(() => processPayment(data));

// ✅ Regular operations
await withSequelizeRetry(() => fetchStudents());

// ❌ Don't retry validation errors
// await withRetry(() => validateEmail(email)); // WRONG
```

### **2. Include Context Information**

```javascript
await withCriticalRetry(operation, {
   operation: 'student_enrollment',
   studentId: student.id,
   className: student.class_name,
   context: 'admission_process',
});
```

### **3. Handle Final Failures Gracefully**

```javascript
try {
   const result = await withCriticalRetry(() => criticalOperation());
   return result;
} catch (error) {
   // This error has already been retried maximum times
   logError(error, { context: 'final_failure_handling' });
   throw new Error('Operation failed after all retry attempts');
}
```

## ✅ **Benefits You Get**

1. **🛡️ Resilience**: Application handles temporary database issues gracefully
2. **🚀 Performance**: Users don't experience failures due to transient issues
3. **📊 Visibility**: Full logging of retry attempts and patterns
4. **⚙️ Control**: Configurable retry behavior for different operations
5. **🔄 Automatic**: No manual intervention needed for temporary failures

Your application is now much more resilient to temporary database connectivity issues while maintaining excellent performance for normal operations.
