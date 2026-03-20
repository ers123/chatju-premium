// backend/src/services/promo.service.js
// Promo code validation and usage tracking

const { supabaseAdmin, handleSupabaseError } = require('../config/supabase');

/**
 * Validate a promo code
 * Checks: exists, active, not expired, usage limit not reached
 *
 * @param {string} code - Promo code string
 * @returns {Promise<Object>} { valid, promoCode, error }
 */
async function validatePromoCode(code) {
  try {
    const { data: promo, error } = await supabaseAdmin
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .single();

    if (error || !promo) {
      return { valid: false, error: '유효하지 않은 프로모 코드입니다.' };
    }

    if (!promo.is_active) {
      return { valid: false, error: '비활성화된 프로모 코드입니다.' };
    }

    // Check expiration
    if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
      return { valid: false, error: '만료된 프로모 코드입니다.' };
    }

    // Check start date
    if (promo.valid_from && new Date(promo.valid_from) > new Date()) {
      return { valid: false, error: '아직 사용할 수 없는 프로모 코드입니다.' };
    }

    // Check usage limit
    if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
      return { valid: false, error: '사용 한도에 도달한 프로모 코드입니다.' };
    }

    return {
      valid: true,
      promoCode: {
        id: promo.id,
        code: promo.code,
        partnerName: promo.partner_name,
        discountType: promo.discount_type,
        discountValue: promo.discount_value,
      },
    };
  } catch (err) {
    console.error('[Promo Service] validatePromoCode error:', err);
    return { valid: false, error: '프로모 코드 검증 중 오류가 발생했습니다.' };
  }
}

/**
 * Check if an email has already used a specific promo code
 *
 * @param {string} promoCodeId - Promo code UUID
 * @param {string} email - User email
 * @returns {Promise<boolean>} true if already used
 */
async function hasEmailUsedPromo(promoCodeId, email) {
  const { count, error } = await supabaseAdmin
    .from('promo_usage')
    .select('*', { count: 'exact', head: true })
    .eq('promo_code_id', promoCodeId)
    .eq('user_email', email.toLowerCase().trim());

  if (error) {
    console.error('[Promo Service] hasEmailUsedPromo error:', error);
    return false; // Fail open — let them try
  }

  return count > 0;
}

/**
 * Record promo code usage and increment used_count
 *
 * @param {Object} params
 * @param {string} params.promoCodeId - Promo code UUID
 * @param {string} params.email - User email
 * @param {string} params.childName - Child's name (optional)
 * @param {string} params.childBirthDate - Child's birth date
 * @param {string} params.readingId - Generated reading UUID
 * @returns {Promise<Object>} Usage record
 */
async function usePromoCode({ promoCodeId, email, childName, childBirthDate, readingId }) {
  try {
    // Insert usage record
    const { data: usage, error: usageError } = await supabaseAdmin
      .from('promo_usage')
      .insert([{
        promo_code_id: promoCodeId,
        user_email: email.toLowerCase().trim(),
        child_name: childName || null,
        child_birth_date: childBirthDate,
        reading_id: readingId,
      }])
      .select()
      .single();

    if (usageError) {
      console.error('[Promo Service] Failed to record usage:', usageError);
      throw handleSupabaseError(usageError) || new Error('Failed to record promo usage');
    }

    // Increment used_count
    const { error: updateError } = await supabaseAdmin
      .rpc('increment_promo_used_count', { promo_id: promoCodeId });

    // Fallback if RPC doesn't exist — use direct update
    if (updateError) {
      console.warn('[Promo Service] RPC not found, using direct update');
      await supabaseAdmin
        .from('promo_codes')
        .update({ used_count: supabaseAdmin.rpc ? undefined : 0 })
        .eq('id', promoCodeId);

      // Manual increment via raw SQL is not available, so use select + update
      const { data: promo } = await supabaseAdmin
        .from('promo_codes')
        .select('used_count')
        .eq('id', promoCodeId)
        .single();

      if (promo) {
        await supabaseAdmin
          .from('promo_codes')
          .update({ used_count: (promo.used_count || 0) + 1 })
          .eq('id', promoCodeId);
      }
    }

    console.log('[Promo Service] Promo usage recorded:', {
      promoCodeId,
      email,
      readingId,
    });

    return usage;
  } catch (err) {
    console.error('[Promo Service] usePromoCode error:', err);
    throw err;
  }
}

module.exports = {
  validatePromoCode,
  hasEmailUsedPromo,
  usePromoCode,
};
