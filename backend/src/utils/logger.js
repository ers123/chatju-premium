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

/**
 * Add file transports in production
 */
if (isProduction) {
  // Error logs - separate file for errors only
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }));

  // Combined logs - all log levels
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }));
}

/**
 * Helper function to log HTTP requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} duration - Request duration in ms
 */
logger.logRequest = (req, res, duration) => {
  const logData = {
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent'),
  };

  // Add user info if authenticated
  if (req.user) {
    logData.userId = req.user.id;
    logData.userEmail = req.user.email;
  }

  const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
  logger.log(level, `${req.method} ${req.originalUrl}`, logData);
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
    email: data.email,
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
    birthDate: data.birthDate,
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
