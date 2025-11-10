// backend/src/routes/saju.routes.js
// API routes for premium Saju calculation

const express = require('express');
const router = express.Router();
const sajuService = require('../services/saju.service');
const authMiddleware = require('../middleware/auth');

/**
 * POST /saju/calculate
 * Generate premium Saju reading
 * Requires: JWT authentication + completed payment
 */
router.post('/calculate', authMiddleware, async (req, res) => {
  try {
    const {
      orderId,
      birthDate,
      birthTime,
      gender,
      timezone,
      language,
      subjectName,
    } = req.body;

    // Validate required fields
    if (!orderId || !birthDate || !gender) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['orderId', 'birthDate', 'gender'],
      });
    }

    // Validate birth date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birthDate)) {
      return res.status(400).json({
        error: 'Invalid birthDate format. Use YYYY-MM-DD',
      });
    }

    // Validate birth time format (HH:MM) if provided
    if (birthTime) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(birthTime)) {
        return res.status(400).json({
          error: 'Invalid birthTime format. Use HH:MM (24-hour)',
        });
      }
    }

    // Validate gender
    if (!['male', 'female'].includes(gender)) {
      return res.status(400).json({
        error: 'Invalid gender. Must be "male" or "female"',
      });
    }

    // Get user ID from JWT (set by authMiddleware)
    const userId = req.user.id;

    // Generate reading
    const reading = await sajuService.generateSajuReading({
      userId,
      orderId,
      birthDate,
      birthTime,
      gender,
      timezone: timezone || 'Asia/Seoul',
      language: language || 'ko',
      subjectName,
    });

    // Return success response
    res.status(200).json(reading);

  } catch (error) {
    console.error('[Saju Route] Error:', error);

    // Handle specific errors
    if (error.message.includes('Payment not found')) {
      return res.status(404).json({
        error: 'Payment order not found',
        code: 'PAYMENT_NOT_FOUND',
      });
    }

    if (error.message.includes('Payment not completed')) {
      return res.status(403).json({
        error: 'Payment has not been completed',
        code: 'PAYMENT_INCOMPLETE',
      });
    }

    if (error.message.includes('Manseryeok calculation failed')) {
      return res.status(500).json({
        error: 'Failed to calculate Four Pillars. Please check birth data.',
        code: 'CALCULATION_ERROR',
      });
    }

    // Generic error
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
});

module.exports = router;
