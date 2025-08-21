# MySQL Connection Pool Fix Implementation

## Problem Description

Your School ERP system was experiencing "Too many connections" errors causing the session system to fail. This was due to connection pool exhaustion from multiple sources competing for database connections.

## Root Causes Identified

1. **Multiple Connection Sources**:
   - Sequelize pools for system database
   - Sequelize pools for each tenant database
   - Express-session MySQL store creating separate connections

2. **High Connection Limits**: Each pool was configured with max: 15 connections
3. **Poor Connection Management**: No cleanup of idle connections
4. **No Monitoring**: No visibility into connection usage

## Fixes Applied

### 1. Optimized Connection Pool Configuration

**Before:**

```json
"pool": {
  "max": 15,
  "min": 2,
  "acquire": 60000,
  "idle": 300000
}
```

**After:**

```json
"pool": {
  "max": 10,
  "min": 1,
  "acquire": 30000,
  "idle": 10000,
  "evict": 5000,
  "handleDisconnects": true
},
"sessionStore": {
  "pool": {
    "connectionLimit": 5,
    "acquireTimeout": 30000,
    "timeout": 30000,
    "reconnect": true,
    "idleTimeout": 10000
  }
}
```

### 2. Enhanced Session Store Configuration

- Separate connection pool for sessions (limit: 5 connections)
- Automatic cleanup of expired sessions
- Better error handling and reconnection logic
- Optimized timeouts to prevent hanging connections

### 3. Added Connection Pool Monitoring

- **Real-time monitoring** of connection usage
- **Periodic health checks** every 2 minutes
- **Automatic cleanup** of idle connections every 5 minutes
- **Warning alerts** when connection usage is high (>25 total)

### 4. Connection Management Tools

New npm scripts for managing connections:

```bash
npm run connections:status    # Check current connection status
npm run connections:cleanup   # Clean up idle connections
npm run connections:reset     # Reset all connections
npm run connections:report    # Full connection report
```

## Connection Usage Calculation

**Before (Potential Maximum):**

- System DB pool: 15 connections
- Each tenant pool: 15 connections × N tenants
- Session store: Unlimited (problematic)
- **Total**: Could easily exceed MySQL's default limit (151)

**After (Optimized Maximum):**

- System DB pool: 10 connections
- Each tenant pool: 10 connections × N tenants
- Session store pool: 5 connections
- Automatic cleanup prevents pool exhaustion
- **Total**: Much more controlled and predictable

## Monitoring Features Added

1. **Request-level monitoring**: Tracks slow requests that might indicate connection issues
2. **Periodic health checks**: Logs connection pool status every 2 minutes
3. **Emergency cleanup**: Available for critical situations
4. **Graceful shutdown**: Properly closes all connections on app termination

## Usage Instructions

### Check Connection Status

```bash
npm run connections:status
```

### If You See "Too Many Connections" Error

```bash
# Quick fix - cleanup idle connections
npm run connections:cleanup

# Nuclear option - reset all connections
npm run connections:reset

# Get detailed report
npm run connections:report
```

### Monitor Connection Usage

The application now automatically logs connection status. Look for entries like:

```
[SYSTEM] Connection Pool Status: {
  systemDB: true,
  tenantConnections: 2,
  activeTenants: 2,
  totalConnections: 8
}
```

### Warning Signs to Watch For

- Log messages about "High connection usage detected"
- Slow request warnings (>5 seconds)
- Connection timeout errors
- Session store errors

## Prevention Best Practices

1. **Regular Monitoring**: Check `npm run connections:status` periodically
2. **Cleanup Routine**: Run `npm run connections:cleanup` during low usage periods
3. **Log Monitoring**: Watch application logs for connection warnings
4. **MySQL Configuration**: Ensure your MySQL server's `max_connections` is appropriate

## MySQL Server Recommendations

Consider increasing MySQL's connection limit if needed:

```sql
-- Check current limit
SHOW VARIABLES LIKE 'max_connections';

-- Increase if necessary (requires restart)
SET GLOBAL max_connections = 300;
```

Add to MySQL configuration file:

```ini
[mysqld]
max_connections = 300
max_user_connections = 250
```

## Emergency Procedures

If the application becomes unresponsive due to connection exhaustion:

1. **Immediate Fix**: Restart the application
2. **Cleanup**: Run `npm run connections:cleanup`
3. **Investigation**: Run `npm run connections:report`
4. **MySQL Level**: Check MySQL process list and kill hanging connections if needed

## Files Modified

- `config/app-config.json` - Updated pool configuration
- `config/database.js` - Updated Sequelize pool settings
- `models/database.js` - Added connection management and monitoring
- `server.js` - Integrated session store optimization and monitoring
- `middleware/connectionPool.js` - New connection monitoring middleware
- `scripts/connection-manager.js` - New connection management tool
- `package.json` - Added connection management scripts

## Expected Results

- ✅ No more "Too many connections" errors
- ✅ Stable session management
- ✅ Better application performance
- ✅ Proactive connection monitoring
- ✅ Easy troubleshooting tools

The connection pool is now optimally configured and actively monitored to prevent exhaustion while maintaining good performance.
