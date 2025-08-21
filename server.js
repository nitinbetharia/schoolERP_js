const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['DB_USER', 'DB_PASSWORD', 'SESSION_SECRET', 'NODE_ENV'];

console.log('🔍 Validating environment variables...');
const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missingVars.length > 0) {
   console.error('❌ Missing required environment variables:', missingVars.join(', '));
   console.error('💡 Please check your .env file and ensure all required variables are set');
   process.exit(1);
}
console.log('✅ All required environment variables are present');

// Import configurations and utilities
const appConfig = require('./config/app-config.json');
const { logger, logSystem, logError } = require('./utils/logger');

// Import middleware
const {
   securityMiddleware,
   tenantDetection,
   validateTenant,
   errorHandler,
   notFoundHandler,
   requestLogger,
   sanitizeInput,
} = require('./middleware');

// Import connection pool monitoring
const {
   connectionPoolMonitor,
   startConnectionPoolMonitoring,
   emergencyCleanup,
} = require('./middleware/connectionPool');

// Import routes
const routes = require('./routes');

// Initialize models
const { initializeSystemModels } = require('./models');

class SchoolERPServer {
   constructor() {
      this.app = express();
      this.server = null;
   }

   /**
    * Initialize the application
    */
   async initialize() {
      try {
         logSystem('Starting School ERP Application');

         // Initialize database models
         await this.initializeDatabase();

         // Setup middleware
         this.setupMiddleware();

         // Setup session management
         this.setupSession();

         // Setup routes
         this.setupRoutes();

         // Setup error handling
         this.setupErrorHandling();

         logSystem('Application initialized successfully');
      } catch (error) {
         logError(error, { context: 'server initialization' });
         throw error;
      }
   }

   /**
    * Initialize database connections and models
    */
   async initializeDatabase() {
      try {
         logSystem('Initializing database connections');

         // Initialize system models
         await initializeSystemModels();

         logSystem('Database initialized successfully');
      } catch (error) {
         logError(error, { context: 'database initialization' });
         throw error;
      }
   }

   /**
    * Setup Express middleware
    */
   setupMiddleware() {
      logSystem('Setting up middleware');

      // Security middleware (helmet, cors, compression, rate limiting)
      const securityMW = securityMiddleware();
      securityMW.forEach((mw) => this.app.use(mw));

      // Add Content Security Policy for XSS protection
      this.app.use((req, res, next) => {
         res.setHeader(
            'Content-Security-Policy',
            "default-src 'self'; " +
               "script-src 'self' 'unsafe-inline' 'unsafe-eval' cdn.tailwindcss.com unpkg.com; " +
               "style-src 'self' 'unsafe-inline' cdn.tailwindcss.com fonts.googleapis.com cdnjs.cloudflare.com; " +
               "font-src 'self' fonts.gstatic.com cdnjs.cloudflare.com; " +
               "img-src 'self' data: https:; " +
               "connect-src 'self'; " +
               "frame-src 'none';"
         );
         res.setHeader('X-Content-Type-Options', 'nosniff');
         res.setHeader('X-Frame-Options', 'DENY');
         res.setHeader('X-XSS-Protection', '1; mode=block');
         next();
      });

      // Request parsing middleware
      this.app.use(express.json({ limit: appConfig.app.requestSizeLimit }));
      this.app.use(
         express.urlencoded({
            extended: true,
            limit: appConfig.app.requestSizeLimit,
         })
      );

      // Input sanitization
      this.app.use(sanitizeInput);

      // Request logging
      this.app.use(requestLogger);

      // Static files
      this.app.use('/static', express.static(path.join(__dirname, 'public')));

      // View engine setup with single layout
      this.app.use(expressLayouts);
      this.app.set('view engine', 'ejs');
      this.app.set('views', path.join(__dirname, 'views'));
      this.app.set('layout', 'layout'); // Use our single layout.ejs file
      this.app.set('layout extractScripts', true);
      this.app.set('layout extractStyles', true);
   }

   /**
    * Setup session management with optimized connection pooling
    */
   setupSession() {
      logSystem('Setting up session management with optimized connection pool');

      // Create separate MySQL connection pool for sessions to prevent pool exhaustion
      const sessionStoreConfig = appConfig.database.sessionStore?.pool || {
         connectionLimit: 5,
         acquireTimeout: 30000,
         timeout: 30000,
         reconnect: true,
         idleTimeout: 10000,
      };

      const sessionStore = new MySQLStore({
         host: appConfig.database.connection.host,
         port: appConfig.database.connection.port,
         user: process.env.DB_USER,
         password: process.env.DB_PASSWORD,
         database: appConfig.database.system.name,
         createDatabaseTable: true,
         connectionLimit: sessionStoreConfig.connectionLimit,
         acquireTimeout: sessionStoreConfig.acquireTimeout,
         timeout: sessionStoreConfig.timeout,
         reconnect: sessionStoreConfig.reconnect,
         idleTimeout: sessionStoreConfig.idleTimeout,
         schema: {
            tableName: 'sessions',
            columnNames: {
               session_id: 'session_id',
               expires: 'expires',
               data: 'data',
            },
         },
         // Clear expired sessions every hour
         clearExpired: true,
         checkExpirationInterval: 3600000,
         // Expire sessions after 1 day of inactivity
         expiration: appConfig.security.sessionMaxAge,
      });

      // Handle session store errors to prevent app crashes
      sessionStore.onReady(() => {
         logSystem('Session store ready');
      });

      sessionStore.onError((error) => {
         logError(error, { context: 'sessionStore' });
      });

      this.app.use(
         session({
            key: 'school_erp_session',
            secret: process.env.SESSION_SECRET,
            store: sessionStore,
            resave: false,
            saveUninitialized: false,
            rolling: true,
            cookie: {
               secure: process.env.NODE_ENV === 'production',
               httpOnly: true,
               maxAge: appConfig.security.sessionMaxAge,
               sameSite: 'strict', // Enhanced: Changed from 'lax' to 'strict' for better security
               domain: process.env.NODE_ENV === 'production' ? process.env.DOMAIN : undefined, // Add domain in production
            },
            // Enhanced session security
            name: 'school_erp_session', // Hide default session name
            genid: () => {
               // Generate cryptographically secure session IDs
               const crypto = require('crypto');
               return crypto.randomBytes(32).toString('hex');
            },
            // Regenerate session ID on login/privilege change
            proxy: process.env.NODE_ENV === 'production', // Trust proxy in production
         })
      );
   }

   /**
    * Setup application routes
    */
   setupRoutes() {
      logSystem('Setting up routes');

      // Connection pool monitoring middleware
      this.app.use(connectionPoolMonitor);

      // Flash message middleware for web routes
      const { setupFlashMessages } = require('./middleware/flash');
      this.app.use(setupFlashMessages);

      // Tenant detection middleware (for all routes except system admin and trust-scoped routes)
      this.app.use((req, res, next) => {
         if (
            req.path.startsWith('/api/v1/admin/system') ||
            req.path.startsWith('/api/v1/trust/') ||
            req.path === '/api/v1/health' ||
            req.path === '/api/v1/status' ||
            req.path === '/health' ||
            req.path === '/status'
         ) {
            return next();
         }
         return tenantDetection(req, res, next);
      });

      // Tenant validation middleware (for tenant-specific routes except trust-scoped routes)
      this.app.use((req, res, next) => {
         if (
            req.path.startsWith('/api/v1/admin/system') ||
            req.path.startsWith('/api/v1/trust/') ||
            req.path === '/api/v1/health' ||
            req.path === '/api/v1/status' ||
            req.path === '/health' ||
            req.path === '/status'
         ) {
            return next();
         }
         if (req.tenantCode && !req.path.startsWith('/api')) {
            return validateTenant(req, res, next);
         }
         return next();
      });

      // Mount web routes (for EJS templates)
      const webRoutes = require('./routes/web');
      this.app.use('/', webRoutes);
      this.app.use('/auth', webRoutes);

      // Mount API routes
      this.app.use('/api/v1', routes);
   }

   /**
    * Setup error handling middleware
    */
   setupErrorHandling() {
      logSystem('Setting up error handling');

      // 404 handler
      this.app.use(notFoundHandler);

      // Global error handler
      this.app.use(errorHandler);
   }

   /**
    * Start the server
    */
   async start() {
      try {
         await this.initialize();

         const port = process.env.PORT || appConfig.app.port;

         this.server = this.app.listen(port, () => {
            logSystem(`Server started successfully on port ${port}`, {
               port,
               environment: process.env.NODE_ENV,
               version: '2.0.0',
            });

            console.log('\n🚀 School ERP Server is running!');
            console.log(`📍 URL: http://localhost:${port}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
            console.log(`📊 Health Check: http://localhost:${port}/api/v1/admin/system/health`);
            console.log(`📚 API Status: http://localhost:${port}/api/v1/status\n`);

            // Start connection pool monitoring
            startConnectionPoolMonitoring();
         });

         // Handle server shutdown gracefully
         this.setupGracefulShutdown();
      } catch (error) {
         logError(error, { context: 'server startup' });
         process.exit(1);
      }
   }

   /**
    * Setup graceful shutdown
    */
   setupGracefulShutdown() {
      const gracefulShutdown = async (signal) => {
         logSystem(`Received ${signal}, starting graceful shutdown`);

         if (this.server) {
            this.server.close(() => {
               logSystem('HTTP server closed');
            });
         }

         try {
            // Emergency cleanup of connection pools
            await emergencyCleanup();

            // Close database connections
            const { dbManager } = require('./models/database');
            await dbManager.closeAllConnections();
            logSystem('Database connections closed');

            logSystem('Graceful shutdown completed');
            process.exit(0);
         } catch (error) {
            logError(error, { context: 'graceful shutdown' });
            process.exit(1);
         }
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));

      process.on('uncaughtException', (error) => {
         logError(error, { context: 'uncaught exception' });
         process.exit(1);
      });

      process.on('unhandledRejection', (reason, promise) => {
         logError(new Error(`Unhandled Rejection: ${reason}`), {
            context: 'unhandled rejection',
            promise: promise.toString(),
         });
         process.exit(1);
      });
   }
}

// Start the server if this file is run directly
if (require.main === module) {
   const server = new SchoolERPServer();
   server.start();
}

module.exports = SchoolERPServer;
