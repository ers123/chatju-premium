// backend/src/utils/responses.js
// Standardized API Response Helpers

const logger = require('./logger');

/**
 * Standardized API Response Format
 *
 * All API responses follow this structure:
 * {
 *   success: boolean,
 *   data?: any,           // Present on success
 *   error?: string,       // Present on failure
 *   message?: string,     // Optional human-readable message
 *   code?: string,        // Optional error code
 *   meta?: object         // Optional metadata (pagination, etc.)
 * }
 */

/**
 * Send a successful response
 * @param {Object} res - Express response object
 * @param {any} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} message - Optional success message
 * @param {Object} meta - Optional metadata
 */
function success(res, data, statusCode = 200, message = null, meta = null) {
  const response = {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
    ...(meta && { meta }),
  };

  return res.status(statusCode).json(response);
}

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {string} error - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {string} code - Optional error code
 * @param {any} details - Optional error details (only in development)
 */
function error(res, error, statusCode = 500, code = null, details = null) {
  const response = {
    success: false,
    error,
    ...(code && { code }),
  };

  // Only include details in development
  if (process.env.NODE_ENV !== 'production' && details) {
    response.details = details;
  }

  // Log the error
  logger.error(error, {
    statusCode,
    code,
    details: details?.stack || details,
  });

  return res.status(statusCode).json(response);
}

/**
 * Send a validation error response
 * @param {Object} res - Express response object
 * @param {string} field - Field that failed validation
 * @param {string} message - Validation error message
 */
function validationError(res, field, message) {
  return error(res, `Validation error: ${field}`, 400, 'VALIDATION_ERROR', message);
}

/**
 * Send an authentication error response
 * @param {Object} res - Express response object
 * @param {string} message - Auth error message
 * @param {string} code - Error code
 */
function authError(res, message = 'Authentication required', code = 'UNAUTHORIZED') {
  return error(res, message, 401, code);
}

/**
 * Send a forbidden error response
 * @param {Object} res - Express response object
 * @param {string} message - Forbidden error message
 */
function forbiddenError(res, message = 'Access denied') {
  return error(res, message, 403, 'FORBIDDEN');
}

/**
 * Send a not found error response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource that was not found
 */
function notFoundError(res, resource = 'Resource') {
  return error(res, `${resource} not found`, 404, 'NOT_FOUND');
}

/**
 * Send a conflict error response (duplicate, etc.)
 * @param {Object} res - Express response object
 * @param {string} message - Conflict error message
 */
function conflictError(res, message = 'Resource already exists') {
  return error(res, message, 409, 'CONFLICT');
}

/**
 * Send a rate limit error response
 * @param {Object} res - Express response object
 * @param {string} retryAfter - Time to retry after
 */
function rateLimitError(res, retryAfter = '15 minutes') {
  return error(res, 'Too many requests, please try again later', 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
}

/**
 * Send a server error response
 * @param {Object} res - Express response object
 * @param {Error} err - Error object
 * @param {string} context - Context where error occurred
 */
function serverError(res, err, context = 'Server') {
  logger.logError(err, { context });
  return error(
    res,
    `${context} error occurred`,
    500,
    'SERVER_ERROR',
    process.env.NODE_ENV !== 'production' ? err.message : null
  );
}

/**
 * Send a paginated success response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 */
function paginatedSuccess(res, data, page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;

  return success(res, data, 200, null, {
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore,
    },
  });
}

/**
 * Send a created response (201)
 * @param {Object} res - Express response object
 * @param {any} data - Created resource data
 * @param {string} message - Optional success message
 */
function created(res, data, message = 'Resource created successfully') {
  return success(res, data, 201, message);
}

/**
 * Send a no content response (204)
 * @param {Object} res - Express response object
 */
function noContent(res) {
  return res.status(204).send();
}

/**
 * Async handler wrapper to catch errors
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped handler
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global error handler middleware
 * Should be added as the last middleware in the app
 */
function globalErrorHandler(err, req, res, next) {
  // Log the error
  logger.logError(err, {
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Default to 500 server error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const code = err.code || 'SERVER_ERROR';

  return error(res, message, statusCode, code, err.stack);
}

module.exports = {
  success,
  error,
  validationError,
  authError,
  forbiddenError,
  notFoundError,
  conflictError,
  rateLimitError,
  serverError,
  paginatedSuccess,
  created,
  noContent,
  asyncHandler,
  globalErrorHandler,
};
