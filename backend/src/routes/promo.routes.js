// backend/src/routes/promo.routes.js
// Promo code validation endpoint

const express = require('express');
const router = express.Router();
const promoService = require('../services/promo.service');
const { sanitizeStrings } = require('../middleware/validation');
const { generalLimiter } = require('../middleware/rateLimit');

router.use(sanitizeStrings);

/**
 * POST /promo/validate
 * Validate a promo code (for frontend UI feedback)
 * No authentication required
 */
router.post('/validate', generalLimiter, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return res.status(400).json({
        valid: false,
        error: '프로모 코드를 입력해주세요.',
      });
    }

    const result = await promoService.validatePromoCode(code);

    res.status(200).json(result);
  } catch (error) {
    console.error('[Promo Route] Validate error:', error);
    res.status(500).json({
      valid: false,
      error: '프로모 코드 검증 중 오류가 발생했습니다.',
    });
  }
});

module.exports = router;
