// backend/src/routes/admin.routes.js
// Admin routes for managing AI provider settings

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getAIService } = require('../services/ai.service');
const logger = require('../utils/logger');

// Get AI service instance
const aiService = getAIService();

/**
 * GET /admin/ai-provider
 * Get current AI provider information
 * Requires: JWT authentication (admin only)
 */
router.get('/ai-provider', authMiddleware, async (req, res) => {
  try {
    // TODO: Add admin role check here
    // For now, any authenticated user can access (add proper admin check in production)

    const providerInfo = aiService.getProviderInfo();

    logger.info('Admin: AI provider info requested', {
      userId: req.user.id,
      currentProvider: providerInfo.current,
    });

    res.status(200).json({
      success: true,
      data: providerInfo,
    });

  } catch (error) {
    logger.error('Admin: Error getting AI provider info', {
      error: error.message,
      userId: req.user.id,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get AI provider information',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * POST /admin/ai-provider
 * Switch AI provider
 * Requires: JWT authentication (admin only)
 * Body: { provider: 'openai' | 'gemini' | 'claude' }
 */
router.post('/ai-provider', authMiddleware, async (req, res) => {
  try {
    // TODO: Add admin role check here
    // For now, any authenticated user can access (add proper admin check in production)

    const { provider } = req.body;

    // Validate provider
    if (!provider) {
      return res.status(400).json({
        success: false,
        error: 'Provider is required',
        code: 'VALIDATION_ERROR',
      });
    }

    const validProviders = ['openai', 'gemini', 'claude'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({
        success: false,
        error: `Invalid provider. Must be one of: ${validProviders.join(', ')}`,
        code: 'VALIDATION_ERROR',
      });
    }

    // Check if provider is available
    const providerInfo = aiService.getProviderInfo();
    if (!providerInfo.available.includes(provider)) {
      return res.status(400).json({
        success: false,
        error: `Provider "${provider}" is not configured. Please add API key to environment variables.`,
        code: 'PROVIDER_NOT_CONFIGURED',
        availableProviders: providerInfo.available,
      });
    }

    // Switch provider
    aiService.setProvider(provider);

    logger.info('Admin: AI provider switched', {
      userId: req.user.id,
      from: providerInfo.current,
      to: provider,
    });

    // Get updated provider info
    const updatedInfo = aiService.getProviderInfo();

    res.status(200).json({
      success: true,
      message: `AI provider switched to ${updatedInfo.details[provider].name}`,
      data: updatedInfo,
    });

  } catch (error) {
    logger.error('Admin: Error switching AI provider', {
      error: error.message,
      userId: req.user.id,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to switch AI provider',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * GET /admin/stats
 * Get basic usage statistics
 * Requires: JWT authentication (admin only)
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // TODO: Add admin role check here
    // TODO: Implement actual statistics from database

    logger.info('Admin: Stats requested', {
      userId: req.user.id,
    });

    // Placeholder stats (implement with real data from Supabase)
    res.status(200).json({
      success: true,
      data: {
        message: 'Statistics endpoint - coming soon',
        // Future implementation:
        // totalUsers: 0,
        // totalPayments: 0,
        // totalReadings: 0,
        // revenue: { total: 0, thisMonth: 0 },
        // aiUsage: { calls: 0, tokens: 0, cost: 0 },
      },
    });

  } catch (error) {
    logger.error('Admin: Error getting stats', {
      error: error.message,
      userId: req.user.id,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
      code: 'INTERNAL_ERROR',
    });
  }
});

module.exports = router;
