// backend/src/routes/payment.routes.js
// Level 7: Real Payment Routes (Toss Payments + PayPal + Stripe + Paddle)

const express = require('express');
const router = express.Router();
const paymentService = require('../services/payment.service');
const authMiddleware = require('../middleware/auth');
const {
  validatePaymentRequest,
  validateTossConfirmation,
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
  verifyTossWebhook,
  verifyStripeWebhook,
  verifyPayPalWebhook,
  webhookLogger,
  preventReplayAttack
} = require('../middleware/webhookVerify');

// Apply sanitization to all routes
router.use(sanitizeStrings);

/**
 * POST /payment/toss/create
 * Create Toss payment order (Korean users)
 * Requires authentication
 *
 * Body:
 * - amount: number (required) - Amount in KRW
 * - orderName: string (optional) - Order description
 */
router.post('/toss/create', authMiddleware, paymentCreationLimiter, validatePaymentRequest, async (req, res) => {
  try {
    const { amount, orderName } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        code: 'INVALID_AMOUNT',
      });
    }

    const result = await paymentService.createTossPayment(userId, amount, orderName);

    res.status(200).json(result);

  } catch (error) {
    console.error('[Payment Routes] Create Toss payment error:', error);
    res.status(500).json({
      error: error.message || 'Failed to create payment',
      code: 'PAYMENT_CREATE_ERROR',
    });
  }
});

/**
 * POST /payment/toss/confirm
 * Confirm Toss payment after user approval
 * Called from frontend after payment widget success
 *
 * SECURITY: Requires authentication to prevent unauthorized payment confirmation
 * Verifies payment ownership before confirming to prevent race conditions
 *
 * Body:
 * - paymentKey: string (required) - Toss payment key
 * - orderId: string (required) - Order ID
 * - amount: number (required) - Payment amount
 */
router.post('/toss/confirm', authMiddleware, paymentConfirmLimiter, validateTossConfirmation, async (req, res) => {
  try {
    const { paymentKey, orderId, amount } = req.body;
    const userId = req.user.id;

    if (!paymentKey || !orderId || !amount) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'MISSING_FIELDS',
      });
    }

    // SECURITY: Verify payment ownership before confirming
    // Prevents race conditions and unauthorized payment confirmation
    const payment = await paymentService.getPaymentByOrderId(orderId);

    if (payment.user_id !== userId) {
      console.warn('[Payment Routes] Payment ownership verification failed', {
        orderId,
        paymentUserId: payment.user_id,
        requestUserId: userId,
      });
      return res.status(403).json({
        error: 'Access denied - payment belongs to different user',
        code: 'ACCESS_DENIED',
      });
    }

    // Ownership verified - proceed with confirmation
    const result = await paymentService.confirmTossPayment(paymentKey, orderId, amount);

    res.status(200).json(result);

  } catch (error) {
    console.error('[Payment Routes] Confirm Toss payment error:', error);

    if (error.message === 'Payment not found') {
      return res.status(404).json({
        error: 'Payment not found',
        code: 'PAYMENT_NOT_FOUND',
      });
    }

    res.status(500).json({
      error: error.message || 'Payment confirmation failed',
      code: 'PAYMENT_CONFIRM_ERROR',
    });
  }
});

/**
 * POST /payment/toss/webhook
 * Webhook endpoint for Toss Payments
 * Called by Toss when payment status changes
 *
 * Body: Toss webhook payload
 */
router.post('/toss/webhook',
  webhookLimiter,
  express.raw({ type: 'application/json' }),
  webhookLogger('toss'),
  verifyTossWebhook,
  preventReplayAttack(),
  async (req, res) => {
  try {
    const webhookData = JSON.parse(req.body.toString());

    // Verify webhook signature (if configured)
    // TODO: Add signature verification for production

    const result = await paymentService.handleTossWebhook(webhookData);

    res.status(200).json(result);

  } catch (error) {
    console.error('[Payment Routes] Toss webhook error:', error);
    res.status(500).json({
      error: 'Webhook processing failed',
      code: 'WEBHOOK_ERROR',
    });
  }
});

/**
 * POST /payment/paypal/create
 * Create PayPal payment order (International users)
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
 * POST /payment/stripe/create
 * Create Stripe payment intent (International users - Optional)
 * Requires authentication
 *
 * Body:
 * - amount: number (required) - Amount in USD cents (e.g., 1000 = $10.00)
 * - description: string (optional) - Payment description
 */
router.post('/stripe/create', authMiddleware, paymentCreationLimiter, validatePaymentRequest, async (req, res) => {
  try {
    const { amount, description } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        code: 'INVALID_AMOUNT',
      });
    }

    const result = await paymentService.createStripePayment(userId, amount, description);

    res.status(200).json(result);

  } catch (error) {
    console.error('[Payment Routes] Create Stripe payment error:', error);
    res.status(500).json({
      error: error.message || 'Failed to create payment',
      code: 'PAYMENT_CREATE_ERROR',
    });
  }
});

/**
 * POST /payment/stripe/webhook
 * Webhook endpoint for Stripe
 * Called by Stripe when payment events occur
 *
 * Headers:
 * - stripe-signature: Webhook signature for verification
 */
router.post('/stripe/webhook',
  webhookLimiter,
  express.raw({ type: 'application/json' }),
  webhookLogger('stripe'),
  verifyStripeWebhook,
  preventReplayAttack(),
  async (req, res) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];

    let event;

    // Verify webhook signature
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        console.error('[Payment Routes] Stripe webhook signature verification failed:', err.message);
        return res.status(400).json({
          error: 'Webhook signature verification failed',
          code: 'INVALID_SIGNATURE',
        });
      }
    } else {
      // For development without webhook secret
      event = JSON.parse(req.body.toString());
    }

    const result = await paymentService.handleStripeWebhook(event);

    res.status(200).json(result);

  } catch (error) {
    console.error('[Payment Routes] Stripe webhook error:', error);
    res.status(500).json({
      error: 'Webhook processing failed',
      code: 'WEBHOOK_ERROR',
    });
  }
});

/**
 * POST /payment/paddle/create
 * Create Paddle checkout session for Overlay checkout (International users - MoR)
 * Requires authentication
 *
 * Body:
 * - productType: string (required) - 'basic' or 'deluxe'
 * - email: string (required) - Customer email address
 */
router.post('/paddle/create', authMiddleware, async (req, res) => {
  try {
    const { productType, email } = req.body;
    const userId = req.user.id;

    if (!productType || !email) {
      return res.status(400).json({
        error: 'productType and email are required',
        code: 'MISSING_FIELDS',
      });
    }

    if (!['basic', 'deluxe'].includes(productType)) {
      return res.status(400).json({
        error: 'productType must be "basic" or "deluxe"',
        code: 'INVALID_PRODUCT_TYPE',
      });
    }

    const result = await paymentService.createPaddlePayment(userId, productType, email);

    res.status(200).json(result);

  } catch (error) {
    console.error('[Payment Routes] Create Paddle payment error:', error);
    res.status(500).json({
      error: error.message || 'Failed to create payment',
      code: 'PAYMENT_CREATE_ERROR',
    });
  }
});

/**
 * POST /payment/paddle/webhook
 * Webhook endpoint for Paddle
 * Called by Paddle when payment events occur
 * No authentication - verified by Paddle signature
 *
 * Headers:
 * - paddle-signature: Webhook signature for verification
 */
router.post('/paddle/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['paddle-signature'];

    if (!signature) {
      return res.status(400).json({
        error: 'Missing Paddle-Signature header',
        code: 'MISSING_SIGNATURE',
      });
    }

    const result = await paymentService.handlePaddleWebhook(req.body, signature);

    res.status(200).json(result);

  } catch (error) {
    console.error('[Payment Routes] Paddle webhook error:', error);
    res.status(400).json({
      error: error.message || 'Webhook processing failed',
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
