/**
 * School ERP - Main Server File
 * Bulletproof, simple, and maintainable school management system
 */

// Load environment variables first
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const fileUpload = require('express-fileupload');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const expressLayouts = require('express-ejs-layouts');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Core services and middleware
const appConfig = require('./config/app-config');
const logger = require('./config/logger');
const db = require('./modules/data/database-service');
const errorHandler = require('./middleware/error-handler');
const authMiddleware = require('./middleware/auth-middleware');
const validationMiddleware = require('./middleware/validation-middleware');
const flashMiddleware = require('./middleware/flash-middleware');
const {
  resolveTenant,
  requireSystemContext,
  requireTrustContext
} = require('./middleware/tenant-middleware');

// Initialize Express app
const app = express();

// Initialize error handling system
errorHandler.initialize();

// Trust proxy for rate limiting and security headers
app.set('trust proxy', 1);

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configure express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://cdnjs.cloudflare.com',
          'https://cdn.tailwindcss.com'
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdnjs.cloudflare.com',
          'https://cdn.tailwindcss.com'
        ],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = appConfig.security.allowedOrigins || ['http://localhost:3000'];
      // Allow requests with no origin (like mobile apps or curl requests) and development localhost
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: appConfig.rateLimiting.windowMs,
  max: appConfig.rateLimiting.maxRequests,
  message: {
    error: 'Too many requests',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// Basic middleware
app.use(compression());
app.use(express.json({ limit: appConfig.server.maxRequestSize }));
app.use(express.urlencoded({ extended: true, limit: appConfig.server.maxRequestSize }));

// File upload middleware
app.use(
  fileUpload({
    limits: { fileSize: appConfig.fileUpload.maxFileSize },
    abortOnLimit: true,
    responseOnLimit: 'File size limit exceeded',
    uploadTimeout: appConfig.fileUpload.uploadTimeout
  })
);

// Session configuration
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: appConfig.database.system.name,
  charset: appConfig.database.system.charset,
  clearExpired: appConfig.session.store.clearExpired,
  checkExpirationInterval: appConfig.session.store.checkExpirationInterval,
  expiration: appConfig.session.maxAge,
  createDatabaseTable: appConfig.session.store.createDatabaseTable,
  schema: {
    tableName: appConfig.session.store.tableName,
    columnNames: {
      session_id: appConfig.session.store.sessionIdColumn,
      expires: appConfig.session.store.expiresColumn,
      data: appConfig.session.store.dataColumn
    }
  }
});

app.use(
  session({
    key: appConfig.session.name,
    secret: process.env.SESSION_SECRET || 'school-erp-secret-key-change-in-production',
    store: sessionStore,
    resave: appConfig.session.resave,
    saveUninitialized: appConfig.session.saveUninitialized,
    rolling: appConfig.session.rolling,
    cookie: {
      maxAge: appConfig.session.cookie.maxAge,
      httpOnly: appConfig.session.cookie.httpOnly,
      secure: process.env.NODE_ENV === 'production' ? true : appConfig.session.cookie.secure,
      sameSite: appConfig.session.cookie.sameSite
    }
  })
);

// Request context middleware
app.use((req, res, next) => {
  req.id = require('crypto').randomUUID();
  req.timestamp = Date.now();

  // Extract trust code from subdomain or header
  const host = req.get('host') || '';
  const subdomain = host.split('.')[0];
  req.trustCode = req.headers['x-trust-code'] || subdomain || 'default';

  // Add helper methods to response
  res.success = (data, message = 'Success') => {
    res.json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  };

  res.error = (message, code = 'ERROR', statusCode = 400) => {
    res.status(statusCode).json({
      success: false,
      error: message,
      code,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  };

  next();
});

// Input sanitization
app.use(validationMiddleware.sanitizeInput());

// Multi-tenant context resolution (must be after session middleware)
app.use(resolveTenant);

// Static files
app.use(
  '/static',
  express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1y' : '0',
    etag: true,
    lastModified: true
  })
);

// Trust context middleware (must be before auth routes)
app.use(authMiddleware.extractTrustContext());

// Flash message middleware (must be after session middleware)
app.use(flashMiddleware);

// Health check endpoint
app.get(
  '/health',
  errorHandler.asyncHandler(async (req, res) => {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };

    try {
      // Check database connectivity
      const dbHealth = await db.healthCheck();
      healthCheck.database = dbHealth;

      // Check error handler
      const errorHandlerHealth = errorHandler.healthCheck();
      healthCheck.errorHandler = errorHandlerHealth;

      res.status(200).json(healthCheck);
    } catch (error) {
      healthCheck.status = 'unhealthy';
      healthCheck.error = error.message;
      res.status(503).json(healthCheck);
    }
  })
);

// Public routes (no auth required)
app.use('/auth', require('./routes/auth-routes'));

// Web routes - handle authentication per route
app.use('/', require('./routes/web-routes'));

// System-level routes (Developer/Super-Admin only)
app.use('/system', requireSystemContext, authMiddleware.requireAuth(), (req, res, next) => {
  // Add system-specific routes here
  res.json({ message: 'System routes - Coming soon' });
});

app.use('/api/system', requireSystemContext, authMiddleware.requireAuth(), (req, res, next) => {
  // System API routes
  res.json({ message: 'System API routes - Coming soon' });
});

// Trust-level routes (Trust-specific operations)
app.use(
  '/api/setup',
  requireTrustContext,
  authMiddleware.requireAuth(),
  require('./routes/setup-routes')
);
app.use(
  '/api/users',
  requireTrustContext,
  authMiddleware.requireAuth(),
  require('./routes/user-routes')
);
app.use(
  '/api/students',
  requireTrustContext,
  authMiddleware.requireAuth(),
  require('./routes/student-routes')
);
app.use(
  '/api/fees',
  requireTrustContext,
  authMiddleware.requireAuth(),
  require('./routes/fee-routes')
);
app.use(
  '/api/attendance',
  requireTrustContext,
  authMiddleware.requireAuth(),
  require('./routes/attendance-routes')
);
app.use(
  '/api/reports',
  requireTrustContext,
  authMiddleware.requireAuth(),
  require('./routes/report-routes')
);
app.use(
  '/api/dashboard',
  requireTrustContext,
  authMiddleware.requireAuth(),
  require('./routes/dashboard-routes')
);
app.use('/api/system-dashboard', requireTrustContext, require('./routes/system-dashboard-routes'));
app.use(
  '/api/communication',
  requireTrustContext,
  authMiddleware.requireAuth(),
  require('./routes/communication-routes')
);

// 404 handler
app.use(errorHandler.notFound());

// Global error handler
app.use(errorHandler.handle());

// Graceful shutdown
process.on('SIGTERM', async () => {
  const shutdownMessage = 'SIGTERM received, shutting down gracefully';
  console.log(shutdownMessage);
  logger.info(shutdownMessage);

  try {
    // Close database connections
    await db.close();
    const dbCloseMessage = 'Database connections closed';
    console.log(dbCloseMessage);
    logger.info(dbCloseMessage);

    // Close session store
    sessionStore.close();
    const sessionCloseMessage = 'Session store closed';
    console.log(sessionCloseMessage);
    logger.info(sessionCloseMessage);

    //exit without error code
    process.exit(0);
  } catch (error) {
    const shutdownErrorMessage = `Error during shutdown: ${error.message}`;
    console.error(shutdownErrorMessage);
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Server startup
const PORT = process.env.PORT || appConfig.server.port;
const HOST = process.env.HOST || appConfig.server.host;

const server = app.listen(PORT, HOST, async () => {
  // Simple startup message
  console.log(`\n🚀 School ERP Server`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Server: http://${HOST}:${PORT}`);

  logger.info('🚀 School ERP Server Started');

  try {
    // Initialize database service
    await db.init();

    // Test database connectivity on startup
    const dbHealth = await db.healthCheck();
    if (dbHealth.system && dbHealth.system.status === 'connected') {
      console.log(`   Database: ✅ Connected`);
      logger.info('Database connected successfully');
    } else {
      console.log(`   Database: ❌ Connection issues`);
      logger.warn('Database connection issues detected');
    }
  } catch (error) {
    console.log(`   Database: ❌ Failed - ${error.message}`);
    logger.error(`Database connection failed: ${error.message}`);
  }

  console.log(`\n⚡ Ready!`);
});

// Handle server errors
server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    const portErrorMessage = `❌ Port ${PORT} is already in use`;
    console.error(portErrorMessage);
    logger.error(portErrorMessage);
  } else {
    const serverErrorMessage = `❌ Server error: ${error.message}`;
    console.error(serverErrorMessage);
    logger.error('❌ Server error:', error);
  }
  process.exit(1);
});

module.exports = app;
