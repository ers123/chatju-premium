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

function toSafeRouteError(error) {
  return {
    message: error.message,
    code: error.code,
    status: error.response?.status,
    paypalDebugId: error.response?.headers?.['paypal-debug-id'],
    paypalName: error.response?.data?.name,
    paypalIssue: error.response?.data?.details?.[0]?.issue,
  };
}

// Apply sanitization to all routes
router.use(sanitizeStrings);

/**
 * POST /payment/paypal/create
 * Create PayPal payment order
 * Requires authentication
 *
 * Body:
 * - amount: number (optional display check) - Server charges the fixed product price
 * - description: string (optional) - Payment description
 */
router.post('/paypal/create', paymentCreationLimiter, validatePaymentRequest, async (req, res) => {
  try {
    const { amount, description, email, product_type } = req.body;
    // Use authenticated user ID if available, otherwise use email as identifier
    const userId = req.user?.id || null;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        code: 'EMAIL_REQUIRED',
      });
    }

    const result = await paymentService.createPayPalPayment(userId, amount, description, email, product_type);

    res.status(200).json(result);

  } catch (error) {
    console.error('[Payment Routes] Create PayPal payment error:', toSafeRouteError(error));
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
 * SECURITY: Requires a server-issued paymentAccessToken bound to the PayPal order.
 *
 * Body:
 * - paypalOrderId: string (required) - PayPal order ID
 */
router.post('/paypal/capture', paymentConfirmLimiter, validatePayPalCapture, async (req, res) => {
  try {
    const { paypalOrderId, paymentAccessToken } = req.body;

    if (!paypalOrderId) {
      return res.status(400).json({
        error: 'PayPal order ID is required',
        code: 'MISSING_ORDER_ID',
      });
    }

    // Capture payment — PayPal handles payment authentication
    if (!paymentAccessToken) {
      return res.status(401).json({
        error: 'Payment access token is required',
        code: 'MISSING_PAYMENT_ACCESS_TOKEN',
      });
    }

    const result = await paymentService.capturePayPalPayment(paypalOrderId, paymentAccessToken);

    res.status(200).json(result);

  } catch (error) {
    console.error('[Payment Routes] Capture PayPal payment error:', toSafeRouteError(error));

    if (error.message === 'Payment not found') {
      return res.status(404).json({
        error: 'Payment not found',
        code: 'PAYMENT_NOT_FOUND',
      });
    }

    if (error.message && error.message.includes('access token')) {
      return res.status(401).json({
        error: 'Invalid or expired payment access token',
        code: 'INVALID_PAYMENT_ACCESS_TOKEN',
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
