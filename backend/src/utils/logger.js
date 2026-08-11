// backend/src/utils/logger.js
// Structured Logging with Winston

const winston = require('winston');

/**
 * Structured logging configuration for production and development
 *
 * Log Levels (in order of priority):
 * - error: Critical errors that need immediate attention
 * - warn: Warning messages for potential issues
 * - info: General informational messages
 * - http: HTTP request logs
 * - debug: Detailed debug information
 *
 * Environment-based behavior:
 * - Development: Console output with colors, human-readable
 * - Production: JSON format for CloudWatch/log aggregation, file output
 */

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

/**
 * Custom format for development (colorized, readable)
 */
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = '\n' + JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

/**
 * Custom format for production (JSON for log aggregation)
 */
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Winston logger instance
 */
const logger = winston.createLogger({
  level: logLevel,
  format: isProduction ? prodFormat : devFormat,
  defaultMeta: {
    service: 'chatju-backend',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console output (always enabled)
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
  ],
  // Don't exit on uncaught errors
  exitOnError: false,
});

// Note: File transports removed — Lambda has read-only filesystem.
// All production logs go to stdout → CloudWatch via console transport.

/**
 * Mask email for logging: "john@example.com" → "jo***@example.com".
 * Keeps the domain intact so log triage can still distinguish user cohorts
 * (e.g. @gmail.com vs @somyung.cc) without exposing the identifying local part.
 * Single-char local parts fall back to one visible char + mask.
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string') return '[redacted]';
  const [local, domain] = email.split('@');
  if (!domain || !local) return '[redacted]';
  const visible = local.length >= 2 ? local.slice(0, 2) : local;
  return `${visible}***@${domain}`;
}
logger.maskEmail = maskEmail;

function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return url;
  try {
    const parsed = new URL(url, 'https://log.local');
    for (const key of parsed.searchParams.keys()) {
      if (/token|secret|key|authorization|password/i.test(key)) {
        parsed.searchParams.set(key, '[redacted]');
      }
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url.replace(/([?&][^=]*(?:token|secret|key|authorization|password)[^=]*=)[^&]+/gi, '$1[redacted]');
  }
}
logger.sanitizeUrl = sanitizeUrl;

/**
 * Helper function to log HTTP requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} duration - Request duration in ms
 */
logger.logRequest = (req, res, duration) => {
  const logData = {
    method: req.method,
    url: sanitizeUrl(req.originalUrl || req.url),
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    userAgent: req.get('user-agent')?.slice(0, 50),
  };

  // Add user info if authenticated
  if (req.user) {
    logData.userId = req.user.id;
    logData.userEmail = maskEmail(req.user.email);
  }

  const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
  logger.log(level, `${req.method} ${sanitizeUrl(req.originalUrl || req.url)}`, logData);
};

/**
 * Helper function to log errors with context
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
logger.logError = (error, context = {}) => {
  logger.error(error.message, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...context,
  });
};

/**
 * Helper function to log payment events
 * @param {string} event - Event name
 * @param {Object} data - Payment data
 */
logger.logPayment = (event, data) => {
  logger.info(`Payment: ${event}`, {
    event,
    orderId: data.orderId || data.order_id,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    paymentMethod: data.payment_method || data.paymentMethod,
    userId: data.user_id || data.userId,
  });
};

/**
 * Helper function to log authentication events
 * @param {string} event - Event name
 * @param {Object} data - Auth data
 */
logger.logAuth = (event, data) => {
  logger.info(`Auth: ${event}`, {
    event,
    email: maskEmail(data.email),
    userId: data.userId || data.user_id,
    success: data.success !== false,
  });
};

/**
 * Helper function to log Saju calculations
 * @param {string} type - 'preview' or 'premium'
 * @param {Object} data - Calculation data
 */
logger.logSaju = (type, data) => {
  logger.info(`Saju: ${type} calculation`, {
    type,
    userId: data.userId,
    birthYear: data.birthDate?.slice(0, 4),
    gender: data.gender,
    hasTime: !!data.birthTime,
    language: data.language,
    tokens: data.tokens,
  });
};

/**
 * Middleware to log all HTTP requests
 */
logger.requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.logRequest(req, res, duration);
  });

  next();
};

/**
 * Stream for Morgan HTTP logger integration
 */
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

module.exports = logger;
