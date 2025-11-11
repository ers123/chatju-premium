// backend/src/services/auth.service.js
// Level 6: Authentication Service with Supabase Auth

const { supabase, supabaseAdmin, handleSupabaseError } = require('../config/supabase');

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
    console.log('[Auth Service] Signing up user:', email);

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

    console.log('[Auth Service] Signup successful, magic link sent to:', email);

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
    console.log('[Auth Service] Signing in user:', email);

    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
    });

    if (error) {
      throw handleSupabaseError(error) || new Error('Sign in failed');
    }

    console.log('[Auth Service] Magic link sent to:', email);

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
    console.log('[Auth Service] Verifying OTP for:', email);

    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: token,
      type: 'email',
    });

    if (error) {
      throw handleSupabaseError(error) || new Error('OTP verification failed');
    }

    console.log('[Auth Service] OTP verified for:', email);

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

module.exports = {
  signUp,
  signIn,
  verifyOTP,
  signOut,
  getUserById,
  updateUserProfile,
  refreshSession,
};
