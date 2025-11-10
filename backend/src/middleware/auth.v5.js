// backend/src/middleware/auth.v5.js
// Level 5: Real Supabase JWT Authentication Middleware

const { supabase } = require('../config/supabase');

/**
 * Middleware to verify JWT token from Supabase Auth
 * Replaces mock authentication from Level 4
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
async function authMiddleware(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'No authorization header',
        code: 'UNAUTHORIZED',
      });
    }

    // Extract token (format: "Bearer <token>")
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'No token provided',
        code: 'UNAUTHORIZED',
      });
    }

    // Verify JWT with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('[Auth Middleware] Token verification failed:', error.message);
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
        details: error.message,
      });
    }

    if (!data.user) {
      return res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    // Attach user to request object
    req.user = {
      id: data.user.id,
      email: data.user.email,
      emailConfirmed: data.user.email_confirmed_at !== null,
    };

    console.log('[Auth Middleware] User authenticated:', req.user.email);
    next();

  } catch (error) {
    console.error('[Auth Middleware] Unexpected error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      code: 'AUTH_ERROR',
      details: error.message,
    });
  }
}

/**
 * Optional auth middleware - allows both authenticated and unauthenticated requests
 * Attaches user to request if token is valid, but doesn't block if invalid
 *
 * Use for endpoints that have different behavior for logged-in vs anonymous users
 */
async function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    req.user = null;
    return next();
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const { data, error } = await supabase.auth.getUser(token);

    if (!error && data.user) {
      req.user = {
        id: data.user.id,
        email: data.user.email,
        emailConfirmed: data.user.email_confirmed_at !== null,
      };
    } else {
      req.user = null;
    }
  } catch (error) {
    console.error('[Optional Auth] Error:', error);
    req.user = null;
  }

  next();
}

module.exports = authMiddleware;
module.exports.optionalAuth = optionalAuthMiddleware;
