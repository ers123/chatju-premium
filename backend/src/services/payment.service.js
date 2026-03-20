// backend/src/services/payment.service.js
// Payment Service (PayPal only)

const { supabaseAdmin } = require('../config/supabase');
const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Payment Service
 *
 * Supports PayPal as the sole payment gateway.
 * PayPal is available globally and works for both Korean and international users.
 */

// ========================================
// PAYPAL
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

    // Fetch existing payment to merge metadata
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('metadata')
      .eq('payment_key', paypalOrderId)
      .single();

    // Update payment record in database (merge metadata to preserve original data)
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'completed',
        confirmed_at: new Date().toISOString(),
        metadata: {
          ...(existingPayment?.metadata || {}),
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
        // Payment already captured via frontend — just ensure DB status is up to date
        const orderId = resource.supplementary_data?.related_ids?.order_id;
        if (orderId) {
          const { data: existing } = await supabaseAdmin
            .from('payments')
            .select('status, metadata')
            .eq('payment_key', orderId)
            .single();

          if (existing && existing.status !== 'completed') {
            await supabaseAdmin
              .from('payments')
              .update({
                status: 'completed',
                confirmed_at: new Date().toISOString(),
                metadata: {
                  ...(existing.metadata || {}),
                  webhook_confirmed: true,
                  webhook_confirmed_at: new Date().toISOString(),
                }
              })
              .eq('payment_key', orderId);
          }
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
 * Get payment by payment key (PayPal order ID)
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
  // PayPal
  createPayPalPayment,
  capturePayPalPayment,
  handlePayPalWebhook,

  // Common
  getPaymentByOrderId,
  getPaymentById,
  getPaymentByPaymentKey,
  getUserPayments,
};
