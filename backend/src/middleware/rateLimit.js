// backend/src/middleware/rateLimit.js
// Rate Limiting Middleware

const rateLimit = require('express-rate-limit');

/**
 * Rate Limiting Strategy:
 *
 * 1. Strict limits on expensive operations (AI, payment)
 * 2. Moderate limits on authentication (prevent brute force)
 * 3. Generous limits on read operations
 * 4. IP-based rate limiting with custom key generation
 */

/**
 * General API rate limit - applies to all requests
 * 100 requests per 15 minutes per IP
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Authentication rate limit - prevent brute force attacks
 * 5 attempts per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * AI/Saju rate limit - expensive OpenAI operations
 * 10 requests per hour per IP (free preview)
 * Paid users bypass this via authentication
 */
const sajuPreviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 free previews per hour
  message: {
    success: false,
    error: 'Free preview limit reached. Please wait an hour or upgrade to premium.',
    code: 'PREVIEW_LIMIT_EXCEEDED',
    retryAfter: '1 hour',
    upgradeUrl: '/payment'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Premium Saju rate limit - paid calculations
 * 20 requests per hour per user (reasonable for paid tier)
 */
const sajuPremiumLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 premium readings per hour
  message: {
    success: false,
    error: 'Premium reading limit reached. Please wait before generating more readings.',
    code: 'PREMIUM_LIMIT_EXCEEDED',
    retryAfter: '1 hour'
  },
  // Key based on user ID (from auth middleware)
  keyGenerator: (req) => {
    return req.user?.id || req.ip; // Fall back to IP if no user
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Payment creation rate limit - prevent payment spam
 * 10 payment attempts per hour per user
 */
const paymentCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 payment creations per hour
  message: {
    success: false,
    error: 'Too many payment attempts. Please wait before creating another payment.',
    code: 'PAYMENT_LIMIT_EXCEEDED',
    retryAfter: '1 hour'
  },
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Payment confirmation rate limit - webhook protection
 * 30 confirmations per minute (generous for webhooks)
 */
const paymentConfirmLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 confirmations per minute
  message: {
    success: false,
    error: 'Too many payment confirmation attempts.',
    code: 'CONFIRMATION_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Webhook rate limit - protect against webhook spam
 * 100 requests per minute per IP
 */
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 webhook calls per minute
  message: {
    success: false,
    error: 'Webhook rate limit exceeded',
    code: 'WEBHOOK_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Read operations rate limit - generous limits
 * 50 requests per 5 minutes per user/IP
 */
const readLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 read requests per window
  message: {
    success: false,
    error: 'Too many requests, please slow down.',
    code: 'READ_LIMIT_EXCEEDED',
    retryAfter: '5 minutes'
  },
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Create custom rate limiter with specific options
 * @param {Object} options - Rate limit options
 * @returns {Function} Rate limit middleware
 */
function createRateLimiter(options) {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: options.message || {
      success: false,
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: options.keyGenerator || ((req) => req.ip),
    standardHeaders: true,
    legacyHeaders: false,
    ...options
  });
}

module.exports = {
  generalLimiter,
  authLimiter,
  sajuPreviewLimiter,
  sajuPremiumLimiter,
  paymentCreationLimiter,
  paymentConfirmLimiter,
  webhookLimiter,
  readLimiter,
  createRateLimiter,
};
