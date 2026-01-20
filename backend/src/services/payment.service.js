// backend/src/services/payment.service.js
// Level 7: Real Payment Service (Toss Payments + PayPal + Stripe + Paddle)

const { supabaseAdmin } = require('../config/supabase');
const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Payment Service
 *
 * Supports four payment gateways:
 * 1. Toss Payments (PRIMARY - Korea) - Native Korean payment gateway, best for KRW
 * 2. PayPal (PRIMARY - International) - Available in Korea, works globally
 * 3. Stripe (OPTIONAL - International) - Requires non-Korean business registration
 * 4. Paddle (RECOMMENDED - International) - Merchant of Record, handles VAT/GST automatically
 *
 * Priority:
 * - Korea: Toss Payments (KRW)
 * - International: Paddle (automatic tax handling) or PayPal (fallback)
 */

// ========================================
// TOSS PAYMENTS (PRIMARY - Korea)
// ========================================

/**
 * Create Toss payment order
 * @param {string} userId - User UUID
 * @param {number} amount - Payment amount in KRW
 * @param {string} orderName - Order description
 * @returns {object} Payment creation result
 */
async function createTossPayment(userId, amount, orderName = '사주팔자 프리미엄 해석') {
  try {
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store payment intent in database
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .insert([{
        user_id: userId,
        order_id: orderId,
        amount: amount,
        currency: 'KRW',
        status: 'pending',
        payment_method: 'toss',
        order_name: orderName,
        metadata: {
          created_at: new Date().toISOString(),
        }
      }])
      .select()
      .single();

    if (error) {
      logger.error('Payment DB error', { error: error.message, context: 'createTossPayment' });
      throw new Error('Failed to create payment record');
    }

    // SECURITY: Don't log payment amounts in production
    logger.info('Toss payment created', {
      orderId,
      paymentId: payment.id,
      currency: 'KRW'
    });

    return {
      success: true,
      orderId: orderId,
      paymentId: payment.id,
      amount: amount,
      currency: 'KRW',
      customerName: orderName,
      // Client will use this to initiate Toss payment
      tossConfig: {
        clientKey: process.env.TOSS_CLIENT_KEY,
        orderId: orderId,
        orderName: orderName,
        amount: amount,
        successUrl: `${process.env.FRONTEND_URL}/payment/success`,
        failUrl: `${process.env.FRONTEND_URL}/payment/fail`,
      }
    };

  } catch (error) {
    console.error('[Payment Service] Create Toss payment error:', error);
    throw error;
  }
}

/**
 * Confirm Toss payment (after user approval)
 * Called from webhook or success callback
 * @param {string} paymentKey - Toss payment key
 * @param {string} orderId - Order ID
 * @param {number} amount - Payment amount
 * @returns {object} Confirmation result
 */
async function confirmTossPayment(paymentKey, orderId, amount) {
  try {
    // Call Toss API to confirm payment
    const tossSecretKey = process.env.TOSS_SECRET_KEY;
    const encodedKey = Buffer.from(tossSecretKey + ':').toString('base64');

    const response = await axios.post(
      'https://api.tosspayments.com/v1/payments/confirm',
      {
        paymentKey: paymentKey,
        orderId: orderId,
        amount: amount,
      },
      {
        headers: {
          'Authorization': `Basic ${encodedKey}`,
          'Content-Type': 'application/json',
        }
      }
    );

    const tossPayment = response.data;

    // Update payment record in database
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'completed',
        payment_key: paymentKey,
        confirmed_at: new Date().toISOString(),
        metadata: {
          ...tossPayment,
          confirmed_at: new Date().toISOString(),
        }
      })
      .eq('order_id', orderId)
      .select()
      .single();

    if (error) {
      logger.error('Payment update failed', { error: error.message, orderId, context: 'confirmTossPayment' });
      throw new Error('Payment confirmation failed');
    }

    logger.info('Toss payment confirmed', {
      orderId,
      status: payment.status,
    });

    return {
      success: true,
      payment: payment,
      tossPayment: tossPayment,
    };

  } catch (error) {
    console.error('[Payment Service] Confirm Toss payment error:', error);

    // Update payment as failed
    await supabaseAdmin
      .from('payments')
      .update({
        status: 'failed',
        metadata: {
          error: error.message,
          failed_at: new Date().toISOString(),
        }
      })
      .eq('order_id', orderId);

    throw error;
  }
}

/**
 * Handle Toss webhook
 * @param {object} webhookData - Webhook payload from Toss
 * @returns {object} Webhook processing result
 */
async function handleTossWebhook(webhookData) {
  try {
    const { eventType, data } = webhookData;

    console.log('[Payment Service] Toss webhook received:', eventType);

    if (eventType === 'PAYMENT_COMPLETED') {
      const { orderId, paymentKey, amount } = data;
      return await confirmTossPayment(paymentKey, orderId, amount);
    }

    return { success: true, message: 'Webhook processed' };

  } catch (error) {
    console.error('[Payment Service] Toss webhook error:', error);
    throw error;
  }
}

// ========================================
// PAYPAL (PRIMARY - International)
// ========================================

/**
 * Get PayPal access token (reusable helper)
 * @returns {Promise<string>} Access token
 */
async function getPayPalAccessToken() {
  try {
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

    return tokenResponse.data.access_token;
  } catch (error) {
    console.error('[Payment Service] Failed to get PayPal access token:', error);
    throw new Error('PayPal authentication failed');
  }
}

/**
 * Create PayPal payment order
 * @param {string} userId - User UUID
 * @param {number} amount - Payment amount in USD
 * @param {string} description - Payment description
 * @returns {object} Payment creation result
 */
async function createPayPalPayment(userId, amount, description = 'Premium Fortune Reading') {
  try {
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Create PayPal order
    const orderResponse = await axios.post(
      `${process.env.PAYPAL_API_BASE_URL}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: orderId,
          description: description,
          amount: {
            currency_code: 'USD',
            value: amount.toFixed(2)
          }
        }],
        application_context: {
          return_url: `${process.env.FRONTEND_URL}/payment/success`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
          brand_name: 'ChatJu Premium',
          user_action: 'PAY_NOW'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      }
    );

    const paypalOrder = orderResponse.data;

    // Store payment intent in database
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .insert([{
        user_id: userId,
        order_id: orderId,
        amount: amount,
        currency: 'USD',
        status: 'pending',
        payment_method: 'paypal',
        payment_key: paypalOrder.id,
        order_name: description,
        metadata: {
          paypal_order_id: paypalOrder.id,
          created_at: new Date().toISOString(),
        }
      }])
      .select()
      .single();

    if (error) {
      console.error('[Payment Service] Database error:', error);
      throw new Error('Failed to create payment record');
    }

    // Get approval URL
    const approvalLink = paypalOrder.links.find(link => link.rel === 'approve');

    console.log('[Payment Service] PayPal payment created:', {
      orderId,
      amount,
      paypalOrderId: paypalOrder.id,
    });

    return {
      success: true,
      orderId: orderId,
      paymentId: payment.id,
      amount: amount,
      currency: 'USD',
      paypalOrderId: paypalOrder.id,
      approvalUrl: approvalLink ? approvalLink.href : null,
    };

  } catch (error) {
    console.error('[Payment Service] Create PayPal payment error:', error);
    throw error;
  }
}

/**
 * Capture PayPal payment (after user approval)
 * @param {string} paypalOrderId - PayPal order ID
 * @returns {object} Capture result
 */
async function capturePayPalPayment(paypalOrderId) {
  try {
    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Capture payment
    const captureResponse = await axios.post(
      `${process.env.PAYPAL_API_BASE_URL}/v2/checkout/orders/${paypalOrderId}/capture`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      }
    );

    const captureData = captureResponse.data;

    if (captureData.status !== 'COMPLETED') {
      throw new Error(`PayPal capture failed: ${captureData.status}`);
    }

    // Update payment record in database
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'completed',
        confirmed_at: new Date().toISOString(),
        metadata: {
          paypal_capture: captureData,
          confirmed_at: new Date().toISOString(),
        }
      })
      .eq('payment_key', paypalOrderId)
      .select()
      .single();

    if (error) {
      console.error('[Payment Service] Failed to update payment:', error);
      throw new Error('Payment confirmation failed');
    }

    console.log('[Payment Service] PayPal payment captured:', {
      paypalOrderId,
      status: payment.status,
    });

    return {
      success: true,
      payment: payment,
      paypalCapture: captureData,
    };

  } catch (error) {
    console.error('[Payment Service] Capture PayPal payment error:', error);

    // Update payment as failed
    await supabaseAdmin
      .from('payments')
      .update({
        status: 'failed',
        metadata: {
          error: error.message,
          failed_at: new Date().toISOString(),
        }
      })
      .eq('payment_key', paypalOrderId);

    throw error;
  }
}

/**
 * Handle PayPal webhook
 * @param {object} webhookData - Webhook payload from PayPal
 * @returns {object} Webhook processing result
 */
async function handlePayPalWebhook(webhookData) {
  try {
    const { event_type, resource } = webhookData;

    console.log('[Payment Service] PayPal webhook received:', event_type);

    // Handle different webhook events
    switch (event_type) {
      case 'CHECKOUT.ORDER.APPROVED':
        // Order approved but not captured yet
        return { success: true, message: 'Order approved' };

      case 'PAYMENT.CAPTURE.COMPLETED':
        // Payment captured successfully
        const orderId = resource.supplementary_data?.related_ids?.order_id;
        if (orderId) {
          return await capturePayPalPayment(orderId);
        }
        return { success: true, message: 'Payment captured' };

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REFUNDED':
        // Update payment as failed/refunded
        const failedOrderId = resource.supplementary_data?.related_ids?.order_id;
        if (failedOrderId) {
          await supabaseAdmin
            .from('payments')
            .update({
              status: event_type.includes('DENIED') ? 'failed' : 'refunded',
              metadata: {
                event_type: event_type,
                failed_at: new Date().toISOString(),
              }
            })
            .eq('payment_key', failedOrderId);
        }
        return { success: true, message: 'Payment status updated' };

      default:
        return { success: true, message: 'Event ignored' };
    }

  } catch (error) {
    console.error('[Payment Service] PayPal webhook error:', error);
    throw error;
  }
}

// ========================================
// STRIPE (OPTIONAL - International)
// ========================================

/**
 * Create Stripe payment intent
 * @param {string} userId - User UUID
 * @param {number} amount - Payment amount in USD cents
 * @param {string} description - Payment description
 * @returns {object} Payment intent result
 */
async function createStripePayment(userId, amount, description = 'Premium Fortune Reading') {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: 'usd',
      description: description,
      metadata: {
        orderId: orderId,
        userId: userId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Store payment intent in database
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .insert([{
        user_id: userId,
        order_id: orderId,
        amount: amount,
        currency: 'USD',
        status: 'pending',
        payment_method: 'stripe',
        payment_key: paymentIntent.id,
        order_name: description,
        metadata: {
          stripe_client_secret: paymentIntent.client_secret,
          created_at: new Date().toISOString(),
        }
      }])
      .select()
      .single();

    if (error) {
      console.error('[Payment Service] Database error:', error);
      throw new Error('Failed to create payment record');
    }

    console.log('[Payment Service] Stripe payment created:', {
      orderId,
      amount,
      paymentIntentId: paymentIntent.id,
    });

    return {
      success: true,
      orderId: orderId,
      paymentId: payment.id,
      amount: amount,
      currency: 'USD',
      clientSecret: paymentIntent.client_secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    };

  } catch (error) {
    console.error('[Payment Service] Create Stripe payment error:', error);
    throw error;
  }
}

/**
 * Confirm Stripe payment
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @returns {object} Confirmation result
 */
async function confirmStripePayment(paymentIntentId) {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Payment not succeeded: ${paymentIntent.status}`);
    }

    // Update payment record in database
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'completed',
        confirmed_at: new Date().toISOString(),
        metadata: {
          stripe_payment_intent: paymentIntent,
          confirmed_at: new Date().toISOString(),
        }
      })
      .eq('payment_key', paymentIntentId)
      .select()
      .single();

    if (error) {
      console.error('[Payment Service] Failed to update payment:', error);
      throw new Error('Payment confirmation failed');
    }

    console.log('[Payment Service] Stripe payment confirmed:', {
      paymentIntentId,
      status: payment.status,
    });

    return {
      success: true,
      payment: payment,
      stripePayment: paymentIntent,
    };

  } catch (error) {
    console.error('[Payment Service] Confirm Stripe payment error:', error);

    // Update payment as failed
    await supabaseAdmin
      .from('payments')
      .update({
        status: 'failed',
        metadata: {
          error: error.message,
          failed_at: new Date().toISOString(),
        }
      })
      .eq('payment_key', paymentIntentId);

    throw error;
  }
}

/**
 * Handle Stripe webhook
 * @param {object} event - Stripe webhook event
 * @returns {object} Webhook processing result
 */
async function handleStripeWebhook(event) {
  try {
    console.log('[Payment Service] Stripe webhook received:', event.type);

    switch (event.type) {
      case 'payment_intent.succeeded':
        return await confirmStripePayment(event.data.object.id);

      case 'payment_intent.payment_failed':
        await supabaseAdmin
          .from('payments')
          .update({
            status: 'failed',
            metadata: {
              error: 'Payment failed',
              failed_at: new Date().toISOString(),
            }
          })
          .eq('payment_key', event.data.object.id);
        return { success: true, message: 'Payment failure recorded' };

      default:
        return { success: true, message: 'Event ignored' };
    }

  } catch (error) {
    console.error('[Payment Service] Stripe webhook error:', error);
    throw error;
  }
}

// ========================================
// PADDLE (RECOMMENDED - International with MoR)
// ========================================

// Initialize Paddle client lazily to avoid errors when API key not configured
let paddleClient = null;

function getPaddleClient() {
  if (!paddleClient && process.env.PADDLE_API_KEY) {
    const { Paddle, Environment } = require('@paddle/paddle-node-sdk');
    paddleClient = new Paddle(process.env.PADDLE_API_KEY, {
      environment: process.env.PADDLE_ENVIRONMENT === 'production'
        ? Environment.production
        : Environment.sandbox
    });
  }
  return paddleClient;
}

/**
 * Create Paddle checkout session for Overlay checkout
 * Returns data needed by frontend Paddle.js
 * @param {string} userId - User UUID
 * @param {string} productType - 'basic' or 'deluxe'
 * @param {string} customerEmail - Customer email address
 * @returns {object} Checkout configuration for frontend
 */
async function createPaddlePayment(userId, productType, customerEmail) {
  try {
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Select price ID based on product type
    const priceId = productType === 'deluxe'
      ? process.env.PADDLE_PRICE_DELUXE
      : process.env.PADDLE_PRICE_BASIC;

    if (!priceId) {
      throw new Error(`Paddle price ID not configured for product type: ${productType}`);
    }

    // Create pending payment record
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .insert([{
        user_id: userId,
        order_id: orderId,
        amount: 1, // Placeholder, will be updated from webhook when completed
        currency: 'USD',
        status: 'pending',
        payment_method: 'paddle',
        product_type: productType,
        order_name: productType === 'deluxe' ? '사주풀이 Deluxe' : '사주풀이 Basic',
        metadata: {
          priceId,
          customerEmail,
          created_at: new Date().toISOString(),
        }
      }])
      .select()
      .single();

    if (error) {
      console.error('[Payment Service] Database error:', error);
      throw new Error('Failed to create payment record');
    }

    console.log('[Payment Service] Paddle payment created:', {
      orderId,
      productType,
      paymentId: payment.id,
    });

    // Return data for frontend Paddle.js Overlay checkout
    return {
      success: true,
      orderId: orderId,
      paymentId: payment.id,
      priceId: priceId,
      customData: { orderId, userId },
      customerEmail: customerEmail,
      clientToken: process.env.PADDLE_CLIENT_TOKEN,
    };

  } catch (error) {
    console.error('[Payment Service] Create Paddle payment error:', error);
    throw error;
  }
}

/**
 * Handle Paddle webhook events
 * @param {Buffer|string} rawBody - Raw request body
 * @param {string} signature - Paddle-Signature header value
 * @returns {object} Webhook processing result
 */
async function handlePaddleWebhook(rawBody, signature) {
  try {
    const paddle = getPaddleClient();

    if (!paddle) {
      throw new Error('Paddle client not configured');
    }

    // Verify signature and unmarshal event
    let event;
    try {
      event = paddle.webhooks.unmarshal(
        rawBody.toString(),
        process.env.PADDLE_WEBHOOK_SECRET,
        signature
      );
    } catch (err) {
      console.error('[Payment Service] Paddle webhook signature verification failed:', err);
      throw new Error('Invalid webhook signature');
    }

    console.log('[Payment Service] Paddle webhook received:', event.eventType);

    const customData = event.data?.customData || {};
    const { orderId, userId } = customData;

    if (!orderId) {
      console.warn('[Payment Service] Paddle webhook missing orderId in customData');
      return { received: true, message: 'No orderId in customData' };
    }

    switch (event.eventType) {
      case 'transaction.completed': {
        const totalAmount = parseInt(event.data.details?.totals?.total || 0);
        const { error } = await supabaseAdmin
          .from('payments')
          .update({
            status: 'completed',
            payment_key: event.data.id,
            amount: totalAmount,
            confirmed_at: new Date().toISOString(),
            metadata: {
              paddleTransactionId: event.data.id,
              paddleCustomerId: event.data.customerId,
              currency: event.data.currencyCode,
              completed_at: new Date().toISOString(),
            }
          })
          .eq('order_id', orderId);

        if (error) {
          console.error('[Payment Service] Failed to update payment:', error);
        }

        console.log('[Payment Service] Paddle payment completed:', {
          orderId,
          transactionId: event.data.id,
          amount: totalAmount,
        });
        break;
      }

      case 'transaction.payment_failed': {
        const { error } = await supabaseAdmin
          .from('payments')
          .update({
            status: 'failed',
            metadata: {
              error: event.data.payments?.[0]?.errorCode || 'Payment failed',
              paddleTransactionId: event.data.id,
              failed_at: new Date().toISOString(),
            }
          })
          .eq('order_id', orderId);

        if (error) {
          console.error('[Payment Service] Failed to update payment:', error);
        }

        console.log('[Payment Service] Paddle payment failed:', {
          orderId,
          transactionId: event.data.id,
        });
        break;
      }

      case 'transaction.updated':
        // Log for debugging, no action needed
        console.log('[Payment Service] Paddle transaction updated:', event.data.id);
        break;

      default:
        console.log('[Payment Service] Unhandled Paddle event:', event.eventType);
    }

    return { received: true, eventType: event.eventType };

  } catch (error) {
    console.error('[Payment Service] Handle Paddle webhook error:', error);
    throw error;
  }
}

// ========================================
// COMMON FUNCTIONS
// ========================================

/**
 * Get payment by order ID
 * @param {string} orderId - Order ID
 * @returns {object} Payment record
 */
async function getPaymentByOrderId(orderId) {
  try {
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error) {
      console.error('[Payment Service] Get payment error:', error);
      throw new Error('Payment not found');
    }

    return payment;

  } catch (error) {
    console.error('[Payment Service] Get payment error:', error);
    throw error;
  }
}

/**
 * Get payment by ID
 * @param {string} paymentId - Payment UUID
 * @returns {object} Payment record
 */
async function getPaymentById(paymentId) {
  try {
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error) {
      console.error('[Payment Service] Get payment error:', error);
      throw new Error('Payment not found');
    }

    return payment;

  } catch (error) {
    console.error('[Payment Service] Get payment error:', error);
    throw error;
  }
}

/**
 * Get payment by payment key (PayPal order ID, Toss payment key, etc.)
 * @param {string} paymentKey - Payment key from gateway
 * @returns {object} Payment record
 */
async function getPaymentByPaymentKey(paymentKey) {
  try {
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('payment_key', paymentKey)
      .single();

    if (error) {
      console.error('[Payment Service] Get payment by key error:', error);
      throw new Error('Payment not found');
    }

    return payment;

  } catch (error) {
    console.error('[Payment Service] Get payment by key error:', error);
    throw error;
  }
}

/**
 * Get user's payment history
 * @param {string} userId - User UUID
 * @returns {array} List of payments
 */
async function getUserPayments(userId) {
  try {
    const { data: payments, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Payment Service] Get user payments error:', error);
      throw new Error('Failed to retrieve payments');
    }

    return payments;

  } catch (error) {
    console.error('[Payment Service] Get user payments error:', error);
    throw error;
  }
}

module.exports = {
  // Toss Payments (PRIMARY for Korea)
  createTossPayment,
  confirmTossPayment,
  handleTossWebhook,

  // PayPal (PRIMARY for International)
  createPayPalPayment,
  capturePayPalPayment,
  handlePayPalWebhook,

  // Stripe (OPTIONAL for International)
  createStripePayment,
  confirmStripePayment,
  handleStripeWebhook,

  // Paddle (RECOMMENDED for International - MoR)
  createPaddlePayment,
  handlePaddleWebhook,

  // Common
  getPaymentByOrderId,
  getPaymentById,
  getPaymentByPaymentKey,
  getUserPayments,
};
