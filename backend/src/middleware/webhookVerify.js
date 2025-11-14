// backend/src/middleware/webhookVerify.js
// Webhook Signature Verification Middleware

const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Webhook Security
 *
 * Payment gateways send webhooks to notify us of payment events.
 * We must verify these webhooks to ensure they're authentic and not
 * from attackers trying to fake payment completions.
 *
 * Each gateway has its own verification method:
 * - Toss Payments: X-Signature header with HMAC-SHA256
 * - PayPal: Uses PayPal SDK verification (not implemented here)
 * - Stripe: stripe-signature header with HMAC-SHA256
 */

/**
 * Verify Toss Payments webhook signature
 *
 * Toss sends webhooks with an X-Signature header containing HMAC-SHA256
 * of the request body using the secret key.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
function verifyTossWebhook(req, res, next) {
  try {
    const signature = req.headers['x-signature'];
    const secretKey = process.env.TOSS_SECRET_KEY;

    // Skip verification if no secret key configured (development)
    if (!secretKey) {
      logger.warn('Toss webhook verification skipped - no secret key configured');
      return next();
    }

    // Check if signature exists
    if (!signature) {
      logger.error('Toss webhook verification failed - no signature header');
      return res.status(401).json({
        success: false,
        error: 'Webhook signature missing',
        code: 'WEBHOOK_SIGNATURE_MISSING'
      });
    }

    // Get raw body (must be raw buffer, not parsed JSON)
    const rawBody = req.body.toString();

    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(rawBody)
      .digest('base64');

    // Compare signatures (timing-safe comparison)
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      logger.error('Toss webhook verification failed - signature mismatch', {
        receivedSignature: signature.substring(0, 10) + '...',
        expectedSignature: expectedSignature.substring(0, 10) + '...'
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature',
        code: 'WEBHOOK_SIGNATURE_INVALID'
      });
    }

    logger.info('Toss webhook verified successfully');
    next();

  } catch (error) {
    logger.logError(error, { context: 'Toss webhook verification' });
    return res.status(500).json({
      success: false,
      error: 'Webhook verification error',
      code: 'WEBHOOK_VERIFICATION_ERROR'
    });
  }
}

/**
 * Verify Stripe webhook signature
 *
 * Stripe sends webhooks with a stripe-signature header containing:
 * - Timestamp
 * - Signature(s)
 *
 * We use the Stripe SDK to verify the signature.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
function verifyStripeWebhook(req, res, next) {
  try {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Skip verification if no webhook secret configured (development)
    if (!webhookSecret) {
      logger.warn('Stripe webhook verification skipped - no webhook secret configured');
      return next();
    }

    // Check if signature exists
    if (!signature) {
      logger.error('Stripe webhook verification failed - no signature header');
      return res.status(401).json({
        success: false,
        error: 'Webhook signature missing',
        code: 'WEBHOOK_SIGNATURE_MISSING'
      });
    }

    // Verify using Stripe SDK
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    try {
      // constructEvent will throw if signature is invalid
      const event = stripe.webhooks.constructEvent(
        req.body, // Raw body buffer
        signature,
        webhookSecret
      );

      // Attach verified event to request
      req.stripeEvent = event;

      logger.info('Stripe webhook verified successfully', {
        eventType: event.type,
        eventId: event.id
      });

      next();

    } catch (err) {
      logger.error('Stripe webhook verification failed', {
        error: err.message
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature',
        code: 'WEBHOOK_SIGNATURE_INVALID',
        details: err.message
      });
    }

  } catch (error) {
    logger.logError(error, { context: 'Stripe webhook verification' });
    return res.status(500).json({
      success: false,
      error: 'Webhook verification error',
      code: 'WEBHOOK_VERIFICATION_ERROR'
    });
  }
}

/**
 * Verify PayPal webhook signature
 *
 * PayPal webhooks should be verified using PayPal SDK.
 * This is a placeholder implementation.
 *
 * For production, implement using:
 * https://github.com/paypal/PayPal-node-SDK/blob/master/samples/notifications/webhook-verify.js
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
function verifyPayPalWebhook(req, res, next) {
  try {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    // Skip verification if no webhook ID configured (development)
    if (!webhookId) {
      logger.warn('PayPal webhook verification skipped - no webhook ID configured');
      return next();
    }

    // TODO: Implement PayPal webhook verification using PayPal SDK
    // For now, we'll just log and proceed
    logger.info('PayPal webhook received (verification not yet implemented)', {
      eventType: req.body.event_type,
      resourceId: req.body.resource?.id
    });

    next();

  } catch (error) {
    logger.logError(error, { context: 'PayPal webhook verification' });
    return res.status(500).json({
      success: false,
      error: 'Webhook verification error',
      code: 'WEBHOOK_VERIFICATION_ERROR'
    });
  }
}

/**
 * Generic webhook verification middleware
 * Logs webhook receipt and basic validation
 *
 * @param {string} source - Webhook source (toss, stripe, paypal)
 */
function webhookLogger(source) {
  return (req, res, next) => {
    logger.info(`Webhook received: ${source}`, {
      source,
      headers: {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent'],
      },
      bodySize: req.body?.length || 0,
      ip: req.ip
    });

    next();
  };
}

/**
 * Replay attack prevention
 * Checks webhook timestamp to ensure it's recent
 *
 * @param {number} toleranceSeconds - Max age of webhook in seconds (default: 300 = 5 minutes)
 */
function preventReplayAttack(toleranceSeconds = 300) {
  return (req, res, next) => {
    const timestamp = req.body?.created || req.body?.timestamp || req.body?.create_time;

    if (!timestamp) {
      logger.warn('Webhook replay check skipped - no timestamp in payload');
      return next();
    }

    const webhookTime = new Date(timestamp).getTime();
    const currentTime = Date.now();
    const age = (currentTime - webhookTime) / 1000; // age in seconds

    if (age > toleranceSeconds) {
      logger.warn('Webhook rejected - too old', {
        age: `${age}s`,
        tolerance: `${toleranceSeconds}s`
      });

      return res.status(400).json({
        success: false,
        error: 'Webhook too old - possible replay attack',
        code: 'WEBHOOK_TOO_OLD'
      });
    }

    logger.debug('Webhook timestamp verified', {
      age: `${age}s`
    });

    next();
  };
}

module.exports = {
  verifyTossWebhook,
  verifyStripeWebhook,
  verifyPayPalWebhook,
  webhookLogger,
  preventReplayAttack,
};
