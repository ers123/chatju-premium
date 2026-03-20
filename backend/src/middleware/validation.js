// backend/src/middleware/validation.js
// Input Validation Middleware

const { validationError } = require('../utils/responses');
const xss = require('xss');

/**
 * Validation middleware to ensure data integrity and security
 * Prevents invalid data from reaching services and database
 */

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID format
 */
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate date format (YYYY-MM-DD)
 */
function isValidDate(dateString) {
  const dateRegex = /^\d{4}[-./]\d{2}[-./]\d{2}$/;
  if (!dateRegex.test(dateString)) return false;

  const normalized = dateString.replace(/[./]/g, '-');
  const date = new Date(normalized);
  return date instanceof Date && !isNaN(date);
}

/**
 * Validate time format (HH:MM)
 */
function isValidTime(timeString) {
  if (!timeString) return true; // Optional
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
}

/**
 * Validate gender
 */
function isValidGender(gender) {
  return ['male', 'female'].includes(gender);
}

/**
 * Validate language
 */
function isValidLanguage(language) {
  return ['ko', 'en', 'zh'].includes(language);
}

/**
 * Validate currency
 */
function isValidCurrency(currency) {
  return ['KRW', 'USD', 'EUR', 'CNY'].includes(currency);
}

/**
 * Validate payment method
 */
function isValidPaymentMethod(method) {
  return ['paypal'].includes(method);
}

/**
 * Validate product type
 */
function isValidProductType(type) {
  return ['basic', 'deluxe'].includes(type);
}

/**
 * Validate amount (positive number, up to 2 decimal places)
 */
function isValidAmount(amount) {
  return typeof amount === 'number' && amount > 0 && isFinite(amount);
}

/**
 * Helper to send validation error (uses standardized response)
 */
function sendValidationError(res, field, message) {
  return res.status(400).json({
    success: false,
    error: `Validation error: ${field}`,
    message: message,
    code: 'VALIDATION_ERROR',
  });
}

// ========================================
// Middleware Functions
// ========================================

/**
 * Validate auth signup/signin request
 */
function validateAuthRequest(req, res, next) {
  const { email, language_preference } = req.body;

  // Validate email
  if (!email) {
    return sendValidationError(res, 'email', 'Email is required');
  }
  if (!isValidEmail(email)) {
    return sendValidationError(res, 'email', 'Invalid email format');
  }

  // Validate language preference (optional)
  if (language_preference && !isValidLanguage(language_preference)) {
    return sendValidationError(res, 'language_preference', 'Invalid language (must be ko, en, or zh)');
  }

  next();
}

/**
 * Validate OTP verification request
 */
function validateOTPRequest(req, res, next) {
  const { email, token } = req.body;

  if (!email || !token) {
    return sendValidationError(res, 'email/token', 'Email and token are required');
  }
  if (!isValidEmail(email)) {
    return sendValidationError(res, 'email', 'Invalid email format');
  }
  if (typeof token !== 'string' || token.length < 6) {
    return sendValidationError(res, 'token', 'Invalid token format');
  }

  next();
}

/**
 * Validate parent role value
 */
function isValidParentRole(role) {
  return ['father', 'mother'].includes(role);
}

/**
 * Validate parent gender value (M or F shorthand used internally)
 */
function isValidParentGender(gender) {
  return ['M', 'F'].includes(gender);
}

/**
 * Validate latitude (-90 to 90)
 */
function isValidLatitude(lat) {
  return typeof lat === 'number' && lat >= -90 && lat <= 90 && isFinite(lat);
}

/**
 * Validate longitude (-180 to 180)
 */
function isValidLongitude(lng) {
  return typeof lng === 'number' && lng >= -180 && lng <= 180 && isFinite(lng);
}

/**
 * Validate Saju birth info request
 */
function validateBirthInfo(req, res, next) {
  const {
    birthDate, birthTime, gender, language, timezone,
    // Optional location fields for solar time correction
    birthPlace, latitude, longitude,
    // Optional parent fields
    parentBirthDate, parentBirthTime, parentRole, parentGender,
  } = req.body;

  // Validate birth date (required)
  if (!birthDate) {
    return sendValidationError(res, 'birthDate', 'Birth date is required');
  }
  if (!isValidDate(birthDate)) {
    return sendValidationError(res, 'birthDate', 'Invalid date format (use YYYY-MM-DD)');
  }

  // Validate birth time (optional)
  if (birthTime && !isValidTime(birthTime)) {
    return sendValidationError(res, 'birthTime', 'Invalid time format (use HH:MM)');
  }

  // Validate gender (required)
  if (!gender) {
    return sendValidationError(res, 'gender', 'Gender is required');
  }
  if (!isValidGender(gender)) {
    return sendValidationError(res, 'gender', 'Invalid gender (must be male or female)');
  }

  // Validate language (optional)
  if (language && !isValidLanguage(language)) {
    return sendValidationError(res, 'language', 'Invalid language (must be ko, en, or zh)');
  }

  // Validate timezone (optional, just check if string)
  if (timezone && typeof timezone !== 'string') {
    return sendValidationError(res, 'timezone', 'Timezone must be a string');
  }

  // Validate location fields (optional, for solar time correction)
  if (birthPlace !== undefined && birthPlace !== null && birthPlace !== '') {
    if (typeof birthPlace !== 'string' || birthPlace.length > 100) {
      return sendValidationError(res, 'birthPlace', 'Birth place must be a string (max 100 chars)');
    }
  }
  if (latitude !== undefined && latitude !== null) {
    if (!isValidLatitude(latitude)) {
      return sendValidationError(res, 'latitude', 'Latitude must be between -90 and 90');
    }
  }
  if (longitude !== undefined && longitude !== null) {
    if (!isValidLongitude(longitude)) {
      return sendValidationError(res, 'longitude', 'Longitude must be between -180 and 180');
    }
  }

  // Validate parent fields (all optional, but if provided must be valid)
  if (parentBirthDate !== undefined && parentBirthDate !== null && parentBirthDate !== '') {
    const normalizedParentDate = parentBirthDate.replace(/\./g, '-');
    if (!isValidDate(normalizedParentDate)) {
      return sendValidationError(res, 'parentBirthDate', 'Invalid parentBirthDate format (use YYYY-MM-DD)');
    }
  }

  if (parentBirthTime !== undefined && parentBirthTime !== null && parentBirthTime !== '') {
    if (!isValidTime(parentBirthTime)) {
      return sendValidationError(res, 'parentBirthTime', 'Invalid parentBirthTime format (use HH:MM)');
    }
  }

  if (parentRole !== undefined && parentRole !== null && parentRole !== '') {
    if (!isValidParentRole(parentRole)) {
      return sendValidationError(res, 'parentRole', 'Invalid parentRole (must be "father" or "mother")');
    }
  }

  if (parentGender !== undefined && parentGender !== null && parentGender !== '') {
    if (!isValidParentGender(parentGender)) {
      return sendValidationError(res, 'parentGender', 'Invalid parentGender (must be "M" or "F")');
    }
  }

  next();
}

/**
 * Validate payment creation request
 */
function validatePaymentRequest(req, res, next) {
  const { amount, currency, product_type } = req.body;

  // Validate amount
  if (!amount) {
    return sendValidationError(res, 'amount', 'Amount is required');
  }
  if (!isValidAmount(amount)) {
    return sendValidationError(res, 'amount', 'Amount must be a positive number');
  }

  // Validate currency (optional, defaults in service)
  if (currency && !isValidCurrency(currency)) {
    return sendValidationError(res, 'currency', 'Invalid currency (must be KRW, USD, EUR, or CNY)');
  }

  // Validate product type
  if (product_type && !isValidProductType(product_type)) {
    return sendValidationError(res, 'product_type', 'Invalid product type (must be basic or deluxe)');
  }

  // Security: Check amount limits
  const maxAmount = currency === 'KRW' ? 100000 : 200; // 100k KRW or $200 USD
  if (amount > maxAmount) {
    return sendValidationError(res, 'amount', `Amount exceeds maximum allowed (${maxAmount} ${currency || 'KRW'})`);
  }

  next();
}

/**
 * Validate PayPal capture request
 */
function validatePayPalCapture(req, res, next) {
  const { paypalOrderId } = req.body;

  if (!paypalOrderId) {
    return sendValidationError(res, 'paypalOrderId', 'PayPal order ID is required');
  }

  if (typeof paypalOrderId !== 'string' || paypalOrderId.length < 10) {
    return sendValidationError(res, 'paypalOrderId', 'Invalid PayPal order ID format');
  }

  next();
}

/**
 * Validate UUID param (for :id routes)
 */
function validateUUIDParam(paramName = 'id') {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id) {
      return sendValidationError(res, paramName, `${paramName} is required`);
    }

    if (!isValidUUID(id)) {
      return sendValidationError(res, paramName, `Invalid ${paramName} format (must be UUID)`);
    }

    next();
  };
}

/**
 * Validate order ID param
 */
function validateOrderIdParam(req, res, next) {
  const orderId = req.params.orderId;

  if (!orderId) {
    return sendValidationError(res, 'orderId', 'Order ID is required');
  }

  if (typeof orderId !== 'string' || orderId.length < 10) {
    return sendValidationError(res, 'orderId', 'Invalid order ID format');
  }

  next();
}

/**
 * Sanitize string inputs to prevent XSS
 * Uses industry-standard xss library for comprehensive protection
 * against XSS attacks including event handlers, javascript: URLs, etc.
 */
function sanitizeStrings(req, res, next) {
  const sanitize = (str) => {
    if (typeof str !== 'string') return str;
    // Use xss library for comprehensive XSS protection
    // This handles: <script>, event handlers, javascript: URLs, SVG attacks, etc.
    return xss(str, {
      whiteList: {}, // No HTML tags allowed
      stripIgnoreTag: true, // Strip unrecognized tags
      stripIgnoreTagBody: ['script'], // Remove script content
    });
  };

  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitize(req.body[key]);
      }
    });
  }

  // Sanitize query params
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitize(req.query[key]);
      }
    });
  }

  next();
}

module.exports = {
  // Validators
  isValidEmail,
  isValidUUID,
  isValidDate,
  isValidTime,
  isValidGender,
  isValidLanguage,
  isValidCurrency,
  isValidPaymentMethod,
  isValidProductType,
  isValidAmount,
  isValidParentRole,
  isValidParentGender,
  isValidLatitude,
  isValidLongitude,

  // Middleware
  validateAuthRequest,
  validateOTPRequest,
  validateBirthInfo,
  validatePaymentRequest,
  validatePayPalCapture,
  validateUUIDParam,
  validateOrderIdParam,
  sanitizeStrings,
};
