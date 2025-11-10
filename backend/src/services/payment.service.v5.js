// backend/src/services/payment.service.v5.js
// Level 5: Payment Service with Supabase Database Integration

const { supabaseAdmin, handleSupabaseError } = require('../config/supabase');

/**
 * Create a new payment record (for testing Level 5)
 * In production, this will be called by webhook from Toss Payments/Stripe
 *
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {string} params.orderId - Unique order ID
 * @param {number} params.amount - Payment amount
 * @param {string} params.currency - Currency code (KRW, USD, etc.)
 * @param {string} params.productType - 'basic' or 'deluxe'
 * @param {string} params.paymentMethod - 'toss', 'stripe', or 'mock'
 * @returns {Promise<Object>} Created payment record
 */
async function createPayment(params) {
  const {
    userId,
    orderId,
    amount,
    currency = 'KRW',
    productType = 'basic',
    paymentMethod = 'mock',
  } = params;

  try {
    console.log('[Payment Service] Creating payment:', { orderId, amount, currency });

    // Insert payment into database
    const { data, error } = await supabaseAdmin
      .from('payments')
      .insert([
        {
          user_id: userId,
          order_id: orderId,
          amount: amount,
          currency: currency,
          status: 'pending', // Will be updated to 'completed' after payment
          payment_method: paymentMethod,
          product_type: productType,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[Payment Service] Insert failed:', error);
      throw handleSupabaseError(error) || new Error('Failed to create payment');
    }

    console.log('[Payment Service] Payment created:', data.id);
    return data;

  } catch (error) {
    console.error('[Payment Service] Error in createPayment:', error);
    throw error;
  }
}

/**
 * Update payment status (e.g., from 'pending' to 'completed')
 *
 * @param {string} orderId - Order ID
 * @param {string} status - New status: 'completed', 'failed', 'refunded'
 * @param {string} paymentKey - Payment key from payment gateway (optional)
 * @returns {Promise<Object>} Updated payment record
 */
async function updatePaymentStatus(orderId, status, paymentKey = null) {
  try {
    console.log('[Payment Service] Updating payment status:', { orderId, status });

    const updateData = {
      status: status,
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    if (paymentKey) {
      updateData.payment_key = paymentKey;
    }

    const { data, error } = await supabaseAdmin
      .from('payments')
      .update(updateData)
      .eq('order_id', orderId)
      .select()
      .single();

    if (error) {
      throw handleSupabaseError(error) || new Error('Payment not found');
    }

    console.log('[Payment Service] Payment updated:', data.id);
    return data;

  } catch (error) {
    console.error('[Payment Service] Error updating payment:', error);
    throw error;
  }
}

/**
 * Get payment by order ID
 *
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Payment record
 */
async function getPayment(orderId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error) {
      throw handleSupabaseError(error) || new Error('Payment not found');
    }

    return data;

  } catch (error) {
    console.error('[Payment Service] Error fetching payment:', error);
    throw error;
  }
}

/**
 * Get all payments for a user
 *
 * @param {string} userId - User ID
 * @param {number} limit - Max number of payments to return
 * @returns {Promise<Array>} List of payment records
 */
async function getUserPayments(userId, limit = 20) {
  try {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw handleSupabaseError(error);
    }

    return data || [];

  } catch (error) {
    console.error('[Payment Service] Error fetching user payments:', error);
    throw error;
  }
}

/**
 * Create test payment (for Level 5 testing only)
 * This automatically sets status to 'completed' to simplify testing
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Created and completed payment
 */
async function createTestPayment(userId) {
  const orderId = `pay_test_${Date.now()}`;

  try {
    // Create payment
    const payment = await createPayment({
      userId: userId,
      orderId: orderId,
      amount: 13000,
      currency: 'KRW',
      productType: 'basic',
      paymentMethod: 'mock',
    });

    // Immediately mark as completed (for testing)
    const completed = await updatePaymentStatus(orderId, 'completed');

    console.log('[Payment Service] Test payment created and completed:', orderId);
    return completed;

  } catch (error) {
    console.error('[Payment Service] Error creating test payment:', error);
    throw error;
  }
}

module.exports = {
  createPayment,
  updatePaymentStatus,
  getPayment,
  getUserPayments,
  createTestPayment,
};
