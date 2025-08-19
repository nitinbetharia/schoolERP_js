const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
require('dotenv').config();

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

      // View engine setup (for future frontend implementation)
      this.app.set('view engine', 'ejs');
      this.app.set('views', path.join(__dirname, 'views'));
   }

   /**
    * Setup session management
    */
   setupSession() {
      logSystem('Setting up session management');

      const sessionStore = new MySQLStore({
         host: appConfig.database.connection.host,
         port: appConfig.database.connection.port,
         user: process.env.DB_USER,
         password: process.env.DB_PASSWORD,
         database: appConfig.database.system.name,
         createDatabaseTable: true,
         schema: {
            tableName: 'sessions',
            columnNames: {
               session_id: 'session_id',
               expires: 'expires',
               data: 'data',
            },
         },
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
               sameSite: 'lax',
            },
         })
      );
   }

   /**
    * Setup application routes
    */
   setupRoutes() {
      logSystem('Setting up routes');

      // Tenant detection middleware (for all routes except system admin)
      this.app.use((req, res, next) => {
         if (
            req.path.startsWith('/api/v1/admin/system') ||
            req.path === '/api/v1/health' ||
            req.path === '/api/v1/status' ||
            req.path === '/health' ||
            req.path === '/status'
         ) {
            return next();
         }
         return tenantDetection(req, res, next);
      });

      // Tenant validation middleware (for tenant-specific routes)
      this.app.use((req, res, next) => {
         if (
            req.path.startsWith('/api/v1/admin/system') ||
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

      // Mount API routes
      this.app.use('/api/v1', routes);

      // Root endpoint
      this.app.get('/', (req, res) => {
         res.json({
            success: true,
            message: 'Welcome to School ERP System',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            tenant: req.tenantCode || 'system',
            environment: process.env.NODE_ENV,
         });
      });
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
               version: '1.0.0',
            });

            console.log(`\n🚀 School ERP Server is running!`);
            console.log(`📍 URL: http://localhost:${port}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
            console.log(`📊 Health Check: http://localhost:${port}/api/v1/admin/system/health`);
            console.log(`📚 API Status: http://localhost:${port}/api/v1/status\n`);
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
