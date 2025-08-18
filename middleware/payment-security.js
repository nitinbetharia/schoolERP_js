const crypto = require('crypto');
const logger = require('../config/logger');
const databaseService = require('../modules/data/database-service');

/**
 * Payment Security Middleware
 * Handles webhook signature verification and security for payment gateways
 */
class PaymentSecurityMiddleware {
  /**
   * Verify Razorpay webhook signature
   */
  static verifyRazorpayWebhook(req, res, next) {
    try {
      const signature = req.get('X-Razorpay-Signature');
      if (!signature) {
        return res.status(400).json({ error: 'Missing webhook signature' });
      }

      // Get webhook secret from database
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!webhookSecret) {
        logger.error('Razorpay webhook secret not configured');
        return res.status(500).json({ error: 'Webhook not configured' });
      }

      const body = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );

      if (!isValid) {
        logger.warn('Invalid Razorpay webhook signature', {
          signature,
          body: body.substring(0, 100)
        });
        return res.status(400).json({ error: 'Invalid signature' });
      }

      req.verifiedWebhook = true;
      next();
    } catch (error) {
      logger.error('Razorpay webhook verification error:', error);
      return res.status(500).json({ error: 'Webhook verification failed' });
    }
  }

  /**
   * Verify Paytm webhook signature
   */
  static verifyPaytmWebhook(req, res, next) {
    try {
      const checksum = req.get('X-VERIFY');
      if (!checksum) {
        return res.status(400).json({ error: 'Missing webhook checksum' });
      }

      // Get merchant key from database
      const merchantKey = process.env.PAYTM_MERCHANT_KEY;
      if (!merchantKey) {
        logger.error('Paytm merchant key not configured');
        return res.status(500).json({ error: 'Webhook not configured' });
      }

      const paytmChecksum = require('paytmchecksum');
      const isValid = paytmChecksum.verifySignature(req.body, merchantKey, checksum);

      if (!isValid) {
        logger.warn('Invalid Paytm webhook checksum', {
          checksum,
          body: JSON.stringify(req.body).substring(0, 100)
        });
        return res.status(400).json({ error: 'Invalid checksum' });
      }

      req.verifiedWebhook = true;
      next();
    } catch (error) {
      logger.error('Paytm webhook verification error:', error);
      return res.status(500).json({ error: 'Webhook verification failed' });
    }
  }

  /**
   * Verify PayU webhook signature
   */
  static verifyPayUWebhook(req, res, next) {
    try {
      const { key, txnid, amount, productinfo, firstname, email, status, salt } = req.body;

      if (!salt) {
        return res.status(400).json({ error: 'Missing webhook data' });
      }

      // Get salt from database
      const merchantSalt = process.env.PAYU_SALT;
      if (!merchantSalt) {
        logger.error('PayU salt not configured');
        return res.status(500).json({ error: 'Webhook not configured' });
      }

      // Construct hash string for verification
      const hashString = `${merchantSalt}|${status}|${req.body.udf1 || ''}|${req.body.udf2 || ''}|${req.body.udf3 || ''}|${req.body.udf4 || ''}|${req.body.udf5 || ''}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;

      const expectedHash = crypto.createHash('sha512').update(hashString).digest('hex');

      const receivedHash = req.body.hash;

      if (expectedHash !== receivedHash) {
        logger.warn('Invalid PayU webhook hash', {
          expected: expectedHash,
          received: receivedHash,
          txnid
        });
        return res.status(400).json({ error: 'Invalid hash' });
      }

      req.verifiedWebhook = true;
      next();
    } catch (error) {
      logger.error('PayU webhook verification error:', error);
      return res.status(500).json({ error: 'Webhook verification failed' });
    }
  }

  /**
   * Rate limiting for payment endpoints
   */
  static rateLimit(maxRequests = 10, windowMs = 60000) {
    const requests = new Map();

    return (req, res, next) => {
      const clientIP = req.ip || req.connection.remoteAddress;
      const now = Date.now();

      // Clean old entries
      for (const [ip, data] of requests) {
        if (now - data.firstRequest > windowMs) {
          requests.delete(ip);
        }
      }

      const clientData = requests.get(clientIP);

      if (!clientData) {
        requests.set(clientIP, {
          firstRequest: now,
          requests: 1
        });
        return next();
      }

      if (now - clientData.firstRequest > windowMs) {
        // Reset window
        requests.set(clientIP, {
          firstRequest: now,
          requests: 1
        });
        return next();
      }

      clientData.requests++;

      if (clientData.requests > maxRequests) {
        logger.warn('Rate limit exceeded for payment endpoint', {
          ip: clientIP,
          requests: clientData.requests,
          path: req.path
        });
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil((windowMs - (now - clientData.firstRequest)) / 1000)
        });
      }

      next();
    };
  }

  /**
   * Validate payment request data
   */
  static validatePaymentRequest(req, res, next) {
    try {
      const { amount, student_id } = req.body;

      // Basic validation
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      if (!student_id || !Number.isInteger(parseInt(student_id))) {
        return res.status(400).json({ error: 'Invalid student ID' });
      }

      // Amount limits
      const maxAmount = 1000000; // 10 lakhs
      const minAmount = 1;

      if (amount > maxAmount) {
        return res.status(400).json({ error: 'Amount exceeds maximum limit' });
      }

      if (amount < minAmount) {
        return res.status(400).json({ error: 'Amount below minimum limit' });
      }

      next();
    } catch (error) {
      logger.error('Payment request validation error:', error);
      return res.status(500).json({ error: 'Validation failed' });
    }
  }

  /**
   * Log payment activities for audit
   */
  static auditLog(req, res, next) {
    const originalSend = res.send;

    res.send = function (data) {
      // Log the request and response
      logger.info('Payment API Activity', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.method === 'POST' ? JSON.stringify(req.body).substring(0, 200) : undefined,
        statusCode: res.statusCode,
        responseTime: Date.now() - req.startTime
      });

      originalSend.call(this, data);
    };

    req.startTime = Date.now();
    next();
  }

  /**
   * Validate webhook timestamp to prevent replay attacks
   */
  static validateWebhookTimestamp(toleranceSeconds = 300) {
    return (req, res, next) => {
      const timestamp = req.get('X-Timestamp') || req.body.timestamp;

      if (!timestamp) {
        return res.status(400).json({ error: 'Missing timestamp' });
      }

      const requestTime = parseInt(timestamp);
      const currentTime = Math.floor(Date.now() / 1000);
      const timeDiff = Math.abs(currentTime - requestTime);

      if (timeDiff > toleranceSeconds) {
        logger.warn('Webhook timestamp too old', {
          requestTime,
          currentTime,
          timeDiff,
          path: req.path
        });
        return res.status(400).json({ error: 'Request timestamp too old' });
      }

      next();
    };
  }

  /**
   * Sanitize and validate payment callback data
   */
  static sanitizeCallbackData(req, res, next) {
    try {
      // Common fields to sanitize
      const fieldsToSanitize = [
        'txnid',
        'amount',
        'productinfo',
        'firstname',
        'email',
        'phone',
        'address1',
        'city',
        'state',
        'country',
        'zipcode'
      ];

      fieldsToSanitize.forEach(field => {
        if (req.body[field]) {
          // Basic XSS protection
          req.body[field] = req.body[field]
            .toString()
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
        }
      });

      // Validate email format if present
      if (req.body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Validate amount format
      if (
        req.body.amount &&
        (isNaN(parseFloat(req.body.amount)) || parseFloat(req.body.amount) <= 0)
      ) {
        return res.status(400).json({ error: 'Invalid amount format' });
      }

      next();
    } catch (error) {
      logger.error('Callback data sanitization error:', error);
      return res.status(500).json({ error: 'Data validation failed' });
    }
  }

  /**
   * CORS configuration for payment endpoints
   */
  static configureCORS(req, res, next) {
    // Allow specific payment gateway domains
    const allowedOrigins = [
      'https://api.razorpay.com',
      'https://secure.paytm.in',
      'https://sandboxsecure.paytm.in',
      'https://secure.payu.in',
      'https://test.payu.in',
      'https://secure.ccavenue.com',
      'https://test.ccavenue.com',
      'https://www.instamojo.com',
      'https://test.instamojo.com'
    ];

    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Razorpay-Signature, X-VERIFY, X-Timestamp'
    );
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    next();
  }
}

module.exports = PaymentSecurityMiddleware;
