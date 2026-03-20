// backend/src/middleware/webhookVerify.js
// Webhook Signature Verification Middleware

const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Verify PayPal webhook signature
 *
 * PayPal uses webhook signature verification to ensure webhooks are authentic.
 * The signature includes transmission_id, transmission_time, cert_url, and auth_algo headers.
 *
 * For production, this implementation verifies using PayPal's REST API endpoint.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
async function verifyPayPalWebhook(req, res, next) {
  try {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    // Skip verification if no webhook ID configured (development)
    if (!webhookId) {
      logger.warn('PayPal webhook verification skipped - no webhook ID configured');
      return next();
    }

    // Get verification headers from PayPal webhook
    const transmissionId = req.headers['paypal-transmission-id'];
    const transmissionTime = req.headers['paypal-transmission-time'];
    const certUrl = req.headers['paypal-cert-url'];
    const transmissionSig = req.headers['paypal-transmission-sig'];
    const authAlgo = req.headers['paypal-auth-algo'];

    // Check if all required headers are present
    if (!transmissionId || !transmissionTime || !certUrl || !transmissionSig || !authAlgo) {
      logger.error('PayPal webhook verification failed - missing required headers', {
        hasTransmissionId: !!transmissionId,
        hasTransmissionTime: !!transmissionTime,
        hasCertUrl: !!certUrl,
        hasTransmissionSig: !!transmissionSig,
        hasAuthAlgo: !!authAlgo
      });

      return res.status(401).json({
        success: false,
        error: 'Missing PayPal webhook verification headers',
        code: 'WEBHOOK_HEADERS_MISSING'
      });
    }

    // Get PayPal access token
    const axios = require('axios');
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString('base64');

    const tokenResponse = await axios.post(
      `${process.env.PAYPAL_API_BASE_URL}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Verify webhook signature using PayPal API
    const verificationResponse = await axios.post(
      `${process.env.PAYPAL_API_BASE_URL}/v1/notifications/verify-webhook-signature`,
      {
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: webhookId,
        webhook_event: req.body
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      }
    );

    const verificationStatus = verificationResponse.data.verification_status;

    if (verificationStatus !== 'SUCCESS') {
      logger.error('PayPal webhook verification failed', {
        status: verificationStatus,
        eventType: req.body.event_type
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid PayPal webhook signature',
        code: 'WEBHOOK_SIGNATURE_INVALID'
      });
    }

    logger.info('PayPal webhook verified successfully', {
      eventType: req.body.event_type,
      resourceId: req.body.resource?.id
    });

    next();

  } catch (error) {
    logger.logError(error, { context: 'PayPal webhook verification' });

    // In development, log error but allow webhook through
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('PayPal webhook verification failed in development - allowing through');
      return next();
    }

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
 * @param {string} source - Webhook source (e.g. 'paypal')
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
  verifyPayPalWebhook,
  webhookLogger,
  preventReplayAttack,
};
