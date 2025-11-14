// backend/src/routes/auth.routes.js
// Level 6: Authentication Routes

const express = require('express');
const router = express.Router();
const authService = require('../services/auth.service');
const authMiddleware = require('../middleware/auth');
const { validateAuthRequest, validateOTPRequest, sanitizeStrings } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimit');

// Apply sanitization to all routes
router.use(sanitizeStrings);

/**
 * POST /auth/signup
 * Register a new user (sends magic link)
 *
 * Body:
 * - email: string (required)
 * - language_preference: string (optional, default: 'ko')
 */
router.post('/signup', authLimiter, validateAuthRequest, async (req, res) => {
  try {
    const { email, language_preference = 'ko' } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        code: 'MISSING_EMAIL',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        code: 'INVALID_EMAIL',
      });
    }

    // Validate language preference
    const validLanguages = ['ko', 'en', 'zh'];
    if (language_preference && !validLanguages.includes(language_preference)) {
      return res.status(400).json({
        error: 'Invalid language preference',
        code: 'INVALID_LANGUAGE',
      });
    }

    const result = await authService.signUp(email, language_preference);

    res.status(200).json({
      success: true,
      message: result.message,
      email: result.email,
    });

  } catch (error) {
    console.error('[Auth Routes] Signup error:', error);
    res.status(500).json({
      error: error.message || 'Signup failed',
      code: 'SIGNUP_ERROR',
    });
  }
});

/**
 * POST /auth/signin
 * Sign in existing user (sends magic link)
 *
 * Body:
 * - email: string (required)
 */
router.post('/signin', authLimiter, validateAuthRequest, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        code: 'MISSING_EMAIL',
      });
    }

    const result = await authService.signIn(email);

    res.status(200).json({
      success: true,
      message: result.message,
      email: result.email,
    });

  } catch (error) {
    console.error('[Auth Routes] Sign in error:', error);
    res.status(500).json({
      error: error.message || 'Sign in failed',
      code: 'SIGNIN_ERROR',
    });
  }
});

/**
 * POST /auth/verify
 * Verify OTP token from magic link
 *
 * Body:
 * - email: string (required)
 * - token: string (required)
 */
router.post('/verify', authLimiter, validateOTPRequest, async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({
        error: 'Email and token are required',
        code: 'MISSING_CREDENTIALS',
      });
    }

    const result = await authService.verifyOTP(email, token);

    res.status(200).json({
      success: true,
      user: result.user,
      session: result.session,
    });

  } catch (error) {
    console.error('[Auth Routes] Verify error:', error);
    res.status(401).json({
      error: error.message || 'Verification failed',
      code: 'VERIFY_ERROR',
    });
  }
});

/**
 * POST /auth/signout
 * Sign out current user
 * Requires authentication
 */
router.post('/signout', authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    await authService.signOut(token);

    res.status(200).json({
      success: true,
      message: 'Signed out successfully',
    });

  } catch (error) {
    console.error('[Auth Routes] Sign out error:', error);
    res.status(500).json({
      error: error.message || 'Sign out failed',
      code: 'SIGNOUT_ERROR',
    });
  }
});

/**
 * POST /auth/refresh
 * Refresh access token
 *
 * Body:
 * - refresh_token: string (required)
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        error: 'Refresh token is required',
        code: 'MISSING_REFRESH_TOKEN',
      });
    }

    const session = await authService.refreshSession(refresh_token);

    res.status(200).json({
      success: true,
      session: session,
    });

  } catch (error) {
    console.error('[Auth Routes] Refresh error:', error);
    res.status(401).json({
      error: error.message || 'Token refresh failed',
      code: 'REFRESH_ERROR',
    });
  }
});

/**
 * GET /auth/me
 * Get current user profile
 * Requires authentication
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.id);

    res.status(200).json({
      success: true,
      user: user,
    });

  } catch (error) {
    console.error('[Auth Routes] Get profile error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get profile',
      code: 'GET_PROFILE_ERROR',
    });
  }
});

/**
 * PATCH /auth/me
 * Update current user profile
 * Requires authentication
 *
 * Body:
 * - language_preference: string (optional)
 * - timezone: string (optional)
 */
router.patch('/me', authMiddleware, async (req, res) => {
  try {
    const updates = req.body;

    const user = await authService.updateUserProfile(req.user.id, updates);

    res.status(200).json({
      success: true,
      user: user,
    });

  } catch (error) {
    console.error('[Auth Routes] Update profile error:', error);
    res.status(500).json({
      error: error.message || 'Failed to update profile',
      code: 'UPDATE_PROFILE_ERROR',
    });
  }
});

module.exports = router;
