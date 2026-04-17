// backend/src/services/auth.service.js
// Level 6: Authentication Service with Supabase Auth

const { supabase, supabaseAdmin, handleSupabaseError } = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Sign up a new user with email
 * Sends magic link to email for verification
 *
 * @param {string} email - User email
 * @param {string} languagePreference - User's preferred language (ko/en/zh)
 * @returns {Promise<Object>} User data
 */
async function signUp(email, languagePreference = 'ko') {
  try {
    logger.info('[Auth Service] Signing up user:', { email: logger.maskEmail(email) });

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        data: {
          language_preference: languagePreference,
        },
      },
    });

    if (error) {
      throw handleSupabaseError(error) || new Error('Signup failed');
    }

    // Create or update user profile in users table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .upsert([
        {
          email: email,
          language_preference: languagePreference,
        },
      ], {
        onConflict: 'email',
      })
      .select()
      .single();

    if (profileError) {
      console.warn('[Auth Service] Profile creation warning:', profileError);
    }

    logger.info('[Auth Service] Signup successful, magic link sent', { email: logger.maskEmail(email) });

    return {
      email: email,
      message: 'Magic link sent to your email',
      checkEmail: true,
    };

  } catch (error) {
    console.error('[Auth Service] Signup error:', error);
    throw error;
  }
}

/**
 * Sign in user with email (Magic Link)
 * Sends login link to email
 *
 * @param {string} email - User email
 * @returns {Promise<Object>} Response with message
 */
async function signIn(email) {
  try {
    logger.info('[Auth Service] Signing in user:', { email: logger.maskEmail(email) });

    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
    });

    if (error) {
      throw handleSupabaseError(error) || new Error('Sign in failed');
    }

    logger.info('[Auth Service] Magic link sent', { email: logger.maskEmail(email) });

    return {
      email: email,
      message: 'Magic link sent to your email',
      checkEmail: true,
    };

  } catch (error) {
    console.error('[Auth Service] Sign in error:', error);
    throw error;
  }
}

/**
 * Verify OTP token from magic link
 *
 * @param {string} email - User email
 * @param {string} token - OTP token from email
 * @returns {Promise<Object>} Session with access token
 */
async function verifyOTP(email, token) {
  try {
    logger.info('[Auth Service] Verifying OTP', { email: logger.maskEmail(email) });

    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: token,
      type: 'email',
    });

    if (error) {
      throw handleSupabaseError(error) || new Error('OTP verification failed');
    }

    logger.info('[Auth Service] OTP verified', { email: logger.maskEmail(email) });

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        emailConfirmed: data.user.email_confirmed_at !== null,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    };

  } catch (error) {
    console.error('[Auth Service] OTP verification error:', error);
    throw error;
  }
}

/**
 * Sign out user
 *
 * @param {string} accessToken - User's access token
 * @returns {Promise<void>}
 */
async function signOut(accessToken) {
  try {
    console.log('[Auth Service] Signing out user');

    const { error } = await supabase.auth.signOut(accessToken);

    if (error) {
      throw handleSupabaseError(error) || new Error('Sign out failed');
    }

    console.log('[Auth Service] User signed out successfully');

  } catch (error) {
    console.error('[Auth Service] Sign out error:', error);
    throw error;
  }
}

/**
 * Get user by ID
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User profile
 */
async function getUserById(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw handleSupabaseError(error) || new Error('User not found');
    }

    return data;

  } catch (error) {
    console.error('[Auth Service] Get user error:', error);
    throw error;
  }
}

/**
 * Update user profile
 *
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated user profile
 */
async function updateUserProfile(userId, updates) {
  try {
    console.log('[Auth Service] Updating user profile:', userId);

    const allowedFields = ['language_preference', 'timezone'];
    const filteredUpdates = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(filteredUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw handleSupabaseError(error) || new Error('Profile update failed');
    }

    console.log('[Auth Service] Profile updated for:', userId);
    return data;

  } catch (error) {
    console.error('[Auth Service] Update profile error:', error);
    throw error;
  }
}

/**
 * Refresh access token
 *
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New session with access token
 */
async function refreshSession(refreshToken) {
  try {
    console.log('[Auth Service] Refreshing session');

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw handleSupabaseError(error) || new Error('Token refresh failed');
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    };

  } catch (error) {
    console.error('[Auth Service] Refresh session error:', error);
    throw error;
  }
}

/**
 * Delete user account and all associated data
 * Cascades to payments and readings via DB foreign keys
 *
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
async function deleteUser(userId) {
  try {
    logger.info('[Auth Service] Deleting user account', { userId });

    // Step 0: Get user email for orphan cleanup (promo tables have no FK to users)
    const { data: user, error: lookupError } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (lookupError || !user) {
      throw new Error('User not found');
    }

    // Normalize for case-insensitive match — readings.delivery_email /
    // promo_usage.user_email are raw TEXT, and pre-normalization rows may exist
    // from older code paths. Escape LIKE metacharacters so emails containing
    // '_' or '%' cannot match unrelated rows.
    const normalizedEmail = user.email.toLowerCase().trim();
    const ilikePattern = normalizedEmail.replace(/([\\%_])/g, '\\$1');

    // Step 1a: Clean promo_usage rows (stores email + child PII, not cascaded)
    const { error: promoError } = await supabaseAdmin
      .from('promo_usage')
      .delete()
      .ilike('user_email', ilikePattern);

    if (promoError) {
      throw new Error(`Failed to clean promo usage: ${promoError.message}`);
    }

    // Step 1b: Clean orphaned readings from promo flow (user_id = NULL but delivery_email matches)
    const { error: orphanError } = await supabaseAdmin
      .from('readings')
      .delete()
      .ilike('delivery_email', ilikePattern)
      .is('user_id', null);

    if (orphanError) {
      throw new Error(`Failed to clean orphaned readings: ${orphanError.message}`);
    }

    // Step 2: Anonymize payments for 전자상거래법 5-year retention.
    // Merge with existing metadata to preserve paypal_capture (capture_id, amounts,
    // payer info) required for refund + audit within the retention window.
    const { data: existingPayments, error: paymentLookupError } = await supabaseAdmin
      .from('payments')
      .select('id, metadata')
      .eq('user_id', userId);

    if (paymentLookupError) {
      throw new Error(`Failed to load payments: ${paymentLookupError.message}`);
    }

    const anonymizedAt = new Date().toISOString();
    for (const payment of existingPayments || []) {
      const mergedMetadata = {
        ...(payment.metadata || {}),
        anonymized: true,
        anonymized_at: anonymizedAt,
      };
      const { error: paymentError } = await supabaseAdmin
        .from('payments')
        .update({ user_id: null, metadata: mergedMetadata })
        .eq('id', payment.id);

      if (paymentError) {
        throw new Error(`Failed to anonymize payment ${payment.id}: ${paymentError.message}`);
      }
    }

    // Step 3: Delete readings owned by user (birth PII)
    const { error: readingsError } = await supabaseAdmin
      .from('readings')
      .delete()
      .eq('user_id', userId);

    if (readingsError) {
      throw new Error(`Failed to delete readings: ${readingsError.message}`);
    }

    // Step 4: Delete user profile
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (dbError) {
      throw handleSupabaseError(dbError) || new Error('Failed to delete user data');
    }

    // Step 5: Delete from Supabase Auth — fail-closed per GDPR Art. 17 /
    // 개인정보보호법. A lingering auth.users row lets the email sign back in
    // via magic link and the signUp() upsert resurrects the profile, so we
    // must surface the failure instead of silently reporting success.
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      logger.error('[Auth Service] Auth deletion failed after data deletion', { userId, error: authError.message });
      throw new Error(`Failed to delete auth record: ${authError.message}`);
    }

    logger.info('[Auth Service] User account deleted', { userId });

  } catch (error) {
    logger.error('[Auth Service] Delete user error', { userId, error: error.message });
    throw error;
  }
}

module.exports = {
  signUp,
  signIn,
  verifyOTP,
  signOut,
  getUserById,
  updateUserProfile,
  refreshSession,
  deleteUser,
};
