const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const appConfig = require("../config/app-config.json");
const { logSystem } = require("../utils/logger");

/**
 * Security middleware configuration
 */
const securityMiddleware = () => {
  const middlewares = [];

  // Compression middleware
  middlewares.push(
    compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers["x-no-compression"]) {
          return false;
        }
        return compression.filter(req, res);
      },
    }),
  );

  // Helmet for security headers
  middlewares.push(
    helmet({
      contentSecurityPolicy: appConfig.security.helmet.contentSecurityPolicy,
      crossOriginEmbedderPolicy:
        appConfig.security.helmet.crossOriginEmbedderPolicy,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // CORS configuration
  middlewares.push(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin or null origin (same-origin requests, form posts)
        if (!origin || origin === "null") return callback(null, true);

        // In development, allow all localhost origins
        if (process.env.NODE_ENV === "development") {
          // Allow localhost with any port
          if (origin.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)) {
            return callback(null, true);
          }
        }

        // Allow subdomain-based origins
        const allowedDomains = appConfig.cors?.allowedDomains || [];
        const isAllowed = allowedDomains.some((domain) =>
          origin.endsWith(domain),
        );

        if (isAllowed) {
          return callback(null, true);
        }

        // Log the rejected origin for debugging
        console.log("CORS rejected origin:", origin);
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    }),
  );

  // Global rate limiting
  middlewares.push(
    rateLimit({
      windowMs: appConfig.security.rateLimiting.windowMs,
      max: appConfig.security.rateLimiting.globalMaxRequests,
      message: {
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests, please try again later",
          timestamp: new Date().toISOString(),
        },
      },
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  logSystem("Security middleware configured");
  return middlewares;
};

/**
 * API-specific rate limiting
 */
const apiRateLimit = rateLimit({
  windowMs: appConfig.security.rateLimiting.windowMs,
  max: appConfig.security.rateLimiting.maxRequests,
  message: {
    success: false,
    error: {
      code: "API_RATE_LIMIT_EXCEEDED",
      message: "API rate limit exceeded, please slow down",
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Sensitive operation rate limiting (password changes, etc.)
 */
const sensitiveRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  message: {
    success: false,
    error: {
      code: "SENSITIVE_RATE_LIMIT_EXCEEDED",
      message: "Too many sensitive operations, please try again later",
      timestamp: new Date().toISOString(),
    },
  },
});

/**
 * Input sanitization middleware
 */
const sanitizeInput = (req, res, next) => {
  const xss = require("xss");

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();

  function sanitizeObject(obj) {
    if (typeof obj === "string") {
      return xss(obj.trim());
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    if (obj && typeof obj === "object") {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }

    return obj;
  }
};

/**
 * Request size limiting middleware
 */
const requestSizeLimit = (req, res, next) => {
  const maxSize = appConfig.app.requestSizeLimit || "10mb";

  // This is handled by express.json() and express.urlencoded() middleware
  // but we can add additional checks here if needed

  next();
};

/**
 * IP whitelist middleware for sensitive endpoints
 */
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip;

    // In development, allow localhost
    if (process.env.NODE_ENV === "development") {
      if (
        clientIP === "127.0.0.1" ||
        clientIP === "::1" ||
        clientIP.startsWith("192.168.")
      ) {
        return next();
      }
    }

    if (allowedIPs.length === 0 || allowedIPs.includes(clientIP)) {
      return next();
    }

    logSystem("IP access denied", { clientIP, allowedIPs, path: req.path });

    res.status(403).json({
      success: false,
      error: {
        code: "IP_NOT_ALLOWED",
        message: "Access denied from your IP address",
        timestamp: new Date().toISOString(),
      },
    });
  };
};

module.exports = {
  securityMiddleware,
  apiRateLimit,
  sensitiveRateLimit,
  sanitizeInput,
  requestSizeLimit,
  ipWhitelist,
};
