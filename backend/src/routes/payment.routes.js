// backend/src/routes/payment.routes.js
// Payment Routes (PayPal only)

const express = require('express');
const router = express.Router();
const paymentService = require('../services/payment.service');
const authMiddleware = require('../middleware/auth');
const {
  validatePaymentRequest,
  validatePayPalCapture,
  validateOrderIdParam,
  sanitizeStrings
} = require('../middleware/validation');
const {
  paymentCreationLimiter,
  paymentConfirmLimiter,
  webhookLimiter,
  readLimiter
} = require('../middleware/rateLimit');
const {
  verifyPayPalWebhook,
  webhookLogger,
  preventReplayAttack
} = require('../middleware/webhookVerify');

// Apply sanitization to all routes
router.use(sanitizeStrings);

/**
 * POST /payment/paypal/create
 * Create PayPal payment order
 * Requires authentication
 *
 * Body:
 * - amount: number (required) - Amount in USD (e.g., 10.00 = $10.00)
 * - description: string (optional) - Payment description
 */
router.post('/paypal/create', authMiddleware, paymentCreationLimiter, validatePaymentRequest, async (req, res) => {
  try {
    const { amount, description } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        code: 'INVALID_AMOUNT',
      });
    }

    const result = await paymentService.createPayPalPayment(userId, amount, description);

    res.status(200).json(result);

  } catch (error) {
    console.error('[Payment Routes] Create PayPal payment error:', error);
    res.status(500).json({
      error: error.message || 'Failed to create payment',
      code: 'PAYMENT_CREATE_ERROR',
    });
  }
});

/**
 * POST /payment/paypal/capture
 * Capture PayPal payment after user approval
 * Called from frontend after PayPal approval
 *
 * SECURITY: Requires authentication to prevent unauthorized payment capture
 * Verifies payment ownership before capturing to prevent race conditions
 *
 * Body:
 * - paypalOrderId: string (required) - PayPal order ID
 */
router.post('/paypal/capture', authMiddleware, paymentConfirmLimiter, validatePayPalCapture, async (req, res) => {
  try {
    const { paypalOrderId } = req.body;
    const userId = req.user.id;

    if (!paypalOrderId) {
      return res.status(400).json({
        error: 'PayPal order ID is required',
        code: 'MISSING_ORDER_ID',
      });
    }

    // SECURITY: Verify payment ownership before capturing
    // Prevents race conditions and unauthorized payment capture
    const payment = await paymentService.getPaymentByPaymentKey(paypalOrderId);

    if (payment.user_id !== userId) {
      console.warn('[Payment Routes] Payment ownership verification failed', {
        paypalOrderId,
        paymentUserId: payment.user_id,
        requestUserId: userId,
      });
      return res.status(403).json({
        error: 'Access denied - payment belongs to different user',
        code: 'ACCESS_DENIED',
      });
    }

    // Ownership verified - proceed with capture
    const result = await paymentService.capturePayPalPayment(paypalOrderId);

    res.status(200).json(result);

  } catch (error) {
    console.error('[Payment Routes] Capture PayPal payment error:', error);

    if (error.message === 'Payment not found') {
      return res.status(404).json({
        error: 'Payment not found',
        code: 'PAYMENT_NOT_FOUND',
      });
    }

    res.status(500).json({
      error: error.message || 'Payment capture failed',
      code: 'PAYMENT_CAPTURE_ERROR',
    });
  }
});

/**
 * POST /payment/paypal/webhook
 * Webhook endpoint for PayPal
 * Called by PayPal when payment events occur
 *
 * Body: PayPal webhook payload
 */
router.post('/paypal/webhook',
  webhookLimiter,
  express.json(),
  webhookLogger('paypal'),
  verifyPayPalWebhook,
  preventReplayAttack(),
  async (req, res) => {
  try {
    const webhookData = req.body;

    // TODO: Add PayPal webhook signature verification for production
    // https://developer.paypal.com/api/rest/webhooks/

    const result = await paymentService.handlePayPalWebhook(webhookData);

    res.status(200).json(result);

  } catch (error) {
    console.error('[Payment Routes] PayPal webhook error:', error);
    res.status(500).json({
      error: 'Webhook processing failed',
      code: 'WEBHOOK_ERROR',
    });
  }
});

/**
 * GET /payment/:orderId
 * Get payment status by order ID
 * Requires authentication
 */
router.get('/:orderId', authMiddleware, readLimiter, validateOrderIdParam, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const payment = await paymentService.getPaymentByOrderId(orderId);

    // Verify payment belongs to user
    if (payment.user_id !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED',
      });
    }

    res.status(200).json({
      success: true,
      payment: payment,
    });

  } catch (error) {
    console.error('[Payment Routes] Get payment error:', error);
    res.status(404).json({
      error: error.message || 'Payment not found',
      code: 'PAYMENT_NOT_FOUND',
    });
  }
});

/**
 * GET /payment/history/me
 * Get current user's payment history
 * Requires authentication
 */
router.get('/history/me', authMiddleware, readLimiter, async (req, res) => {
  try {
    const userId = req.user.id;

    const payments = await paymentService.getUserPayments(userId);

    res.status(200).json({
      success: true,
      count: payments.length,
      payments: payments,
    });

  } catch (error) {
    console.error('[Payment Routes] Get payment history error:', error);
    res.status(500).json({
      error: error.message || 'Failed to retrieve payment history',
      code: 'PAYMENT_HISTORY_ERROR',
    });
  }
});

module.exports = router;
