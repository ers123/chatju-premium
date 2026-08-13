// backend/src/routes/saju.routes.js
// API routes for premium Saju calculation - RELATIONSHIP FOCUSED

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const sajuService = require('../services/saju.service');
const authMiddleware = require('../middleware/auth');
const promoService = require('../services/promo.service');
const { validateBirthInfo, validateUUIDParam, sanitizeStrings } = require('../middleware/validation');
const { sajuPreviewLimiter, sajuPremiumLimiter, readLimiter, otpRequestLimiter, feedbackLimiter } = require('../middleware/rateLimit');
const reportLookupOtp = require('../services/reportLookupOtp.service');
const { calculateMansae } = require('../utils/mansae-wrapper');
const { createAccessToken, verifyAccessToken } = require('../utils/accessToken');
const { dispatchReportJob } = require('../services/report-job');
const { recordFunnelEvent, EVENTS: FUNNEL } = require('../services/funnel.service');

// Apply sanitization to all routes
router.use(sanitizeStrings);

/**
 * Hash a raw claim key with sha256 → hex string.
 * Always use this function — never log raw claim keys.
 */
function hashClaimKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Validate a client-supplied claimKey: must be hex or base64url, 32–128 chars.
 * Returns the validated string or null (invalid/absent treated as absent, not an error).
 */
const CLAIM_KEY_REGEX = /^[A-Za-z0-9+/=_-]{32,128}$/;
function validateClaimKey(value) {
  if (typeof value !== 'string') return null;
  return CLAIM_KEY_REGEX.test(value) ? value : null;
}

/**
 * 클라이언트가 202 + 폴링 방식을 감당할 수 있다고 밝혔는가.
 *
 * 새 프론트만 `async: true`를 보낸다. 이미 브라우저에 캐시된 옛 번들은 202를 받으면
 * 그것을 완성된 리포트로 착각하므로, 명시적으로 밝힌 클라이언트에게만 새 경로를 준다.
 * 프론트가 전부 교체되면 이 게이트는 지워도 된다.
 */
function wantsAsyncReport(req) {
  return req.body?.async === true || req.body?.async === 'true';
}

/**
 * Helper: Validate and calculate parent manseryeok
 */
function calculateParentManseryeok(parentBirthDate, parentBirthTime, parentRole, calendarOptions = {}) {
  if (!parentBirthDate || !parentRole) return null;

  try {
    // Parent gender: mother = female, father = male
    const parentGender = parentRole === 'mother' ? '여' : '남';
    const timeToUse = parentBirthTime || '12:00';
    return calculateMansae(parentBirthDate, timeToUse, parentGender, calendarOptions);
  } catch (error) {
    console.warn('[Saju Route] Parent manseryeok calculation failed:', error.message);
    return null;
  }
}

/**
 * Best-effort client IP for proof-of-consent (Lambda behind API Gateway).
 */
function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim().slice(0, 64);
  return (req.ip || '').slice(0, 64) || null;
}

/**
 * Validate and normalize the consent payload (PIPA/GDPR proof of consent).
 * dataProcessing and guardian (legal-representative) consent are mandatory.
 *
 * @param {Object} consent - { dataProcessing, guardian, userAge14, marketing, policyVersion, timestamp }
 * @param {Object} [meta]  - { ip, language } captured server-side for the consent record
 * @returns {{ ok: boolean, error?: string, normalized?: Object }}
 */
function validateConsent(consent, meta = {}) {
  if (!consent || typeof consent !== 'object') {
    return { ok: false, error: 'Consent is required (dataProcessing and guardian consent must be granted)' };
  }
  if (consent.dataProcessing !== true || consent.guardian !== true) {
    return { ok: false, error: 'dataProcessing and guardian consent must both be true' };
  }

  const parsedTimestamp = consent.timestamp ? new Date(consent.timestamp) : null;
  return {
    ok: true,
    normalized: {
      dataProcessing: true,
      guardian: true, // legal-representative consent for the child
      userAge14: consent.userAge14 === true, // user's own 14+ attestation (distinct)
      marketing: consent.marketing === true,
      policyVersion: String(consent.policyVersion || '').slice(0, 50),
      language: meta.language ? String(meta.language).slice(0, 10) : null,
      ip: meta.ip || null,
      timestamp: parsedTimestamp && !isNaN(parsedTimestamp) ? parsedTimestamp.toISOString() : null,
      recordedAt: new Date().toISOString(), // server-side timestamp (authoritative)
    },
  };
}

function getPreviewMessage(language = 'ko', hasParentAnalysis = false) {
  const messages = {
    ko: {
      withParent: '부모-자녀 관계 미리보기입니다. 프리미엄으로 갈등 해결 가이드를 받아보세요!',
      withoutParent: '이것은 미리보기입니다. 프리미엄으로 전체 해석을 확인하세요!',
    },
    en: {
      withParent: 'This is a parent-child relationship preview. Upgrade for the full conflict-resolution guide.',
      withoutParent: 'This is a preview. Upgrade to Premium for the full interpretation.',
    },
    ja: {
      withParent: '親子関係のプレビューです。プレミアムで詳しい関係改善ガイドをご確認ください。',
      withoutParent: 'これはプレビューです。全体の解釈はプレミアムでご確認ください。',
    },
    zh: {
      withParent: '这是亲子关系预览。升级高级报告可查看完整的沟通与冲突解决指南。',
      withoutParent: '这是预览。升级高级报告可查看完整解读。',
    },
    vi: {
      withParent: 'Đây là bản xem trước mối quan hệ cha mẹ - con. Nâng cấp Premium để nhận hướng dẫn xử lý xung đột đầy đủ.',
      withoutParent: 'Đây là bản xem trước. Nâng cấp Premium để xem phần diễn giải đầy đủ.',
    },
    id: {
      withParent: 'Ini adalah pratinjau hubungan orang tua-anak. Upgrade ke Premium untuk panduan penyelesaian konflik lengkap.',
      withoutParent: 'Ini adalah pratinjau. Upgrade ke Premium untuk interpretasi lengkap.',
    },
    es: {
      withParent: 'Esta es una vista previa de la relación padre-hijo. Actualiza a Premium para ver la guía completa de comunicación y conflictos.',
      withoutParent: 'Esta es una vista previa. Actualiza a Premium para ver la interpretación completa.',
    },
    pt: {
      withParent: 'Esta é uma prévia da relação entre pais e filho. Faça upgrade para o Premium para ver o guia completo de comunicação e conflitos.',
      withoutParent: 'Esta é uma prévia. Faça upgrade para o Premium para ver a interpretação completa.',
    },
    fr: {
      withParent: 'Ceci est un aperçu de la relation parent-enfant. Passez à Premium pour obtenir le guide complet de communication et de gestion des conflits.',
      withoutParent: 'Ceci est un aperçu. Passez à Premium pour consulter l’interprétation complète.',
    },
    th: {
      withParent: 'นี่คือตัวอย่างความสัมพันธ์พ่อแม่-ลูก อัปเกรดเป็น Premium เพื่อดูคู่มือการสื่อสารและการจัดการความขัดแย้งฉบับเต็ม',
      withoutParent: 'นี่คือตัวอย่าง อัปเกรดเป็น Premium เพื่อดูคำอธิบายฉบับเต็ม',
    },
  };

  const copy = messages[language] || messages.en;
  return hasParentAnalysis ? copy.withParent : copy.withoutParent;
}

/**
 * POST /saju/preview
 * Generate FREE Saju preview/teaser - NOW WITH RELATIONSHIP ANALYSIS
 * No authentication required - open to everyone
 * Returns: Basic Four Pillars + relationship-focused AI interpretation
 */
router.post('/preview', sajuPreviewLimiter, validateBirthInfo, async (req, res) => {
  try {
    const {
      // Child info
      birthDate,
      birthTime,
      unknownTime, // true → birth time unknown, omit hour pillar
      gender,
      isLunar,
      isLeapMonth,
      timezone,
      language,
      // Location info (optional, for solar time correction)
      birthPlace,
      latitude,
      longitude,
      // Parent info (optional but recommended)
      parentBirthDate,
      parentBirthTime,
      parentRole, // 'mother' or 'father'
      parentIsLunar,
      parentIsLeapMonth,
    } = req.body;

    const effectiveBirthTime = unknownTime === true ? null : birthTime;

    // Validate required fields
    if (!birthDate || !gender) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['birthDate', 'gender'],
      });
    }

    // Validate birth date format (YYYY-MM-DD or YYYY.MM.DD)
    const normalizedBirthDate = birthDate.replace(/\./g, '-');
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(normalizedBirthDate)) {
      return res.status(400).json({
        error: 'Invalid birthDate format. Use YYYY-MM-DD',
      });
    }

    // Validate birth time format (HH:MM) if provided
    if (effectiveBirthTime) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(effectiveBirthTime)) {
        return res.status(400).json({
          error: 'Invalid birthTime format. Use HH:MM (24-hour)',
        });
      }
    }

    // Validate gender
    if (!['male', 'female'].includes(gender)) {
      return res.status(400).json({
        error: 'Invalid gender. Must be "male" or "female"',
      });
    }

    // Calculate parent manseryeok if provided
    let parentManseryeok = null;
    if (parentBirthDate && parentRole) {
      const normalizedParentDate = parentBirthDate.replace(/\./g, '-');
      parentManseryeok = calculateParentManseryeok(normalizedParentDate, parentBirthTime, parentRole, {
        isLunar: parentIsLunar === true,
        isLeapMonth: parentIsLeapMonth === true,
      });
    }

    // Generate preview (free version with relationship focus)
    const preview = await sajuService.generateSajuPreview({
      birthDate: normalizedBirthDate,
      birthTime: effectiveBirthTime || null,
      gender,
      isLunar: isLunar === true,
      isLeapMonth: isLeapMonth === true,
      timezone: timezone || 'Asia/Seoul',
      language: language || 'ko',
      // Location for solar time correction
      birthPlace,
      latitude,
      longitude,
      // Parent data for relationship analysis
      parentManseryeok,
      parentRole,
    });

    // 퍼널 최상단. 프리뷰는 DB에 남지 않으므로 여기서 세지 않으면 영원히 안 보인다.
    // 숫자만 올린다 — 생년월일도 IP도 가지 않는다. 응답을 기다리게 하지 않는다.
    await recordFunnelEvent(FUNNEL.PREVIEW, language || 'ko');

    // Return preview with relationship context
    res.status(200).json({
      ...preview,
      isPaid: false,
      hasParentAnalysis: !!parentManseryeok,
      message: getPreviewMessage(language || 'ko', !!parentManseryeok),
      upgradeUrl: '/payment',
    });

  } catch (error) {
    console.error('[Saju Route] Preview error:', error);

    if (error.message.includes('Manseryeok calculation failed')) {
      return res.status(500).json({
        error: 'Failed to calculate Four Pillars. Please check birth data.',
        code: 'CALCULATION_ERROR',
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * POST /saju/calculate
 * Generate premium Saju reading (FULL VERSION)
 * Requires: completed payment plus either JWT auth or a server-issued payment access token
 */
router.post('/calculate', authMiddleware.optionalAuth, sajuPremiumLimiter, validateBirthInfo, async (req, res) => {
  try {
    const {
      orderId,
      paymentAccessToken,
      birthDate,
      birthTime,
      unknownTime, // true → birth time unknown, omit hour pillar
      gender,
      isLunar,
      isLeapMonth,
      timezone,
      language,
      subjectName,
      consent, // { dataProcessing, guardian, marketing, policyVersion, timestamp } — REQUIRED
      // Location for solar time correction
      birthPlace,
      latitude,
      longitude,
      // Optional parent data for relationship analysis
      parentBirthDate,
      parentBirthTime,
      parentRole,   // 'mother' or 'father'
      parentIsLunar,
      parentIsLeapMonth,
      parentGender, // 'M' or 'F' (overrides role-derived gender if provided)
      deliveryEmail,
      // Optional twin info
      twinOrder,      // 1 (first born) or 2 (second born)
      twinSiblingName, // sibling's name (optional)
      // Per-transaction claim key (raw secret; hashed before storage, never logged)
      claimKey,
    } = req.body;

    // Validate required fields
    if (!orderId || !birthDate || !gender) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['orderId', 'birthDate', 'gender'],
      });
    }

    // PIPA/GDPR: dataProcessing + guardian consent are mandatory for premium readings
    const consentResult = validateConsent(consent, { ip: getClientIp(req), language });
    if (!consentResult.ok) {
      return res.status(400).json({
        error: consentResult.error,
        code: 'CONSENT_REQUIRED',
      });
    }

    const effectiveBirthTime = unknownTime === true ? null : birthTime;

    // Validate birth date format (YYYY-MM-DD)
    const normalizedBirthDate = birthDate.replace(/\./g, '-');
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(normalizedBirthDate)) {
      return res.status(400).json({
        error: 'Invalid birthDate format. Use YYYY-MM-DD',
      });
    }

    // Validate birth time format (HH:MM) if provided
    if (effectiveBirthTime) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(effectiveBirthTime)) {
        return res.status(400).json({
          error: 'Invalid birthTime format. Use HH:MM (24-hour)',
        });
      }
    }

    // Validate gender
    if (!['male', 'female'].includes(gender)) {
      return res.status(400).json({
        error: 'Invalid gender. Must be "male" or "female"',
      });
    }

    // Calculate parent manseryeok if parent birth date and role are provided
    let parentManseryeok = null;
    if (parentBirthDate && parentRole) {
      const normalizedParentDate = parentBirthDate.replace(/\./g, '-');
      parentManseryeok = calculateParentManseryeok(normalizedParentDate, parentBirthTime, parentRole, {
        isLunar: parentIsLunar === true,
        isLeapMonth: parentIsLeapMonth === true,
      });
      if (parentManseryeok) {
        console.log('[Saju Route] Parent manseryeok calculated for role:', parentRole);
      }
    }

    // Get user ID from JWT (set by authMiddleware)
    const userId = req.user?.id || null;
    if (!userId && !paymentAccessToken) {
      return res.status(401).json({
        error: 'Payment access token required for guest premium reports',
        code: 'MISSING_PAYMENT_ACCESS_TOKEN',
      });
    }

    // Hash claim key if provided (raw key must never be logged or stored)
    const validatedClaimKey = validateClaimKey(claimKey);
    const claimKeyHash = validatedClaimKey ? hashClaimKey(validatedClaimKey) : null;

    const readingParams = {
      userId,
      orderId,
      paymentAccessToken,
      birthDate: normalizedBirthDate,
      birthTime: effectiveBirthTime || null,
      consent: consentResult.normalized,
      gender,
      isLunar: isLunar === true,
      isLeapMonth: isLeapMonth === true,
      timezone: timezone || 'Asia/Seoul',
      language: language || 'ko',
      subjectName,
      // Location for solar time correction
      birthPlace,
      latitude,
      longitude,
      parentManseryeok,
      parentRole: parentRole || null,
      // Twin info
      twinInfo: twinOrder ? { order: twinOrder, siblingName: twinSiblingName || null } : null,
      deliveryEmail,
      claimKeyHash,
    };

    // 비동기 경로는 claim key를 가진 클라이언트만 쓸 수 있다. 폴링할 열쇠가 없으면
    // 202를 받아도 결과를 가져올 방법이 없다. 오래된 번들은 async를 보내지 않으므로
    // 지금까지와 똑같이 동기로 처리된다.
    if (wantsAsyncReport(req) && claimKeyHash) {
      // 결제 문제는 잡 안이 아니라 여기서 잡아야 한다. 202를 준 뒤 잡이 실패하면
      // 사용자는 이유도 모른 채 폴링만 하게 된다.
      await sajuService.verifyPaymentForReading({ orderId, userId, paymentAccessToken });

      const dispatch = await dispatchReportJob({ reading: readingParams });
      if (dispatch.mode === 'async') {
        return res.status(202).json({ status: 'pending', pollWith: 'claim' });
      }
      // 디스패치가 실패해 인라인으로 돌았다 — 완성본이 있으면 그대로 준다.
      return dispatch.reading
        ? res.status(200).json(dispatch.reading)
        : res.status(202).json({ status: 'pending', pollWith: 'claim' });
    }

    // Generate reading
    const reading = await sajuService.generateSajuReading(readingParams);

    // Return success response
    res.status(200).json(reading);

  } catch (error) {
    console.error('[Saju Route] Error:', error);

    // Handle specific errors
    if (error.message.includes('Payment not found')) {
      return res.status(404).json({
        error: 'Payment order not found',
        code: 'PAYMENT_NOT_FOUND',
      });
    }

    if (error.message.includes('Payment not completed')) {
      return res.status(403).json({
        error: 'Payment has not been completed',
        code: 'PAYMENT_INCOMPLETE',
      });
    }

    if (error.message && error.message.includes('access token')) {
      return res.status(401).json({
        error: 'Invalid or expired payment access token',
        code: 'INVALID_PAYMENT_ACCESS_TOKEN',
      });
    }

    if (error.message.includes('Manseryeok calculation failed')) {
      return res.status(500).json({
        error: 'Failed to calculate Four Pillars. Please check birth data.',
        code: 'CALCULATION_ERROR',
      });
    }

    // Generic error
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * POST /saju/calculate-promo
 * Generate premium Saju reading via promo code (NO AUTH required)
 * Requires: valid promo code + email + birth data
 */
router.post('/calculate-promo', sajuPremiumLimiter, validateBirthInfo, async (req, res) => {
  try {
    const {
      promoCode,
      email,
      birthDate,
      birthTime,
      unknownTime, // true → birth time unknown, omit hour pillar
      gender,
      isLunar,
      isLeapMonth,
      timezone,
      language,
      subjectName,
      consent, // { dataProcessing, guardian, ... } — REQUIRED (same child PII as paid flow)
      birthPlace,
      latitude,
      longitude,
      parentBirthDate,
      parentBirthTime,
      parentRole,
      parentIsLunar,
      parentIsLeapMonth,
      parentGender,
      twinOrder,
      twinSiblingName,
      // Per-transaction claim key (raw secret; hashed before storage, never logged)
      claimKey,
    } = req.body;

    // Validate required fields
    if (!promoCode || !email || !birthDate || !gender) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['promoCode', 'email', 'birthDate', 'gender'],
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        code: 'INVALID_EMAIL',
      });
    }

    // Validate birth date format
    const normalizedBirthDate = birthDate.replace(/\./g, '-');
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(normalizedBirthDate)) {
      return res.status(400).json({
        error: 'Invalid birthDate format. Use YYYY-MM-DD',
      });
    }

    const effectiveBirthTime = unknownTime === true ? null : birthTime;

    // PIPA/GDPR: the promo flow stores the same child PII as the paid flow, so
    // dataProcessing + guardian consent are mandatory here too (no longer optional).
    const consentResult = validateConsent(consent, { ip: getClientIp(req), language });
    if (!consentResult.ok) {
      return res.status(400).json({
        error: consentResult.error,
        code: 'CONSENT_REQUIRED',
      });
    }
    const normalizedConsent = consentResult.normalized;

    // Validate birth time if provided
    if (effectiveBirthTime) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(effectiveBirthTime)) {
        return res.status(400).json({
          error: 'Invalid birthTime format. Use HH:MM (24-hour)',
        });
      }
    }

    // Validate gender
    if (!['male', 'female'].includes(gender)) {
      return res.status(400).json({
        error: 'Invalid gender. Must be "male" or "female"',
      });
    }

    // Step 1: Validate promo code
    const promoResult = await promoService.validatePromoCode(promoCode);
    if (!promoResult.valid) {
      return res.status(400).json({
        error: promoResult.error,
        code: 'INVALID_PROMO',
      });
    }

    // Step 2: Check if email already used this promo
    const alreadyUsed = await promoService.hasEmailUsedPromo(
      promoResult.promoCode.id,
      email
    );
    if (alreadyUsed) {
      return res.status(409).json({
        error: '이미 이 프로모 코드를 사용하셨습니다.',
        code: 'PROMO_ALREADY_USED',
      });
    }

    // Step 3: Calculate parent manseryeok if provided
    let parentManseryeok = null;
    if (parentBirthDate && parentRole) {
      const normalizedParentDate = parentBirthDate.replace(/\./g, '-');
      parentManseryeok = calculateParentManseryeok(normalizedParentDate, parentBirthTime, parentRole, {
        isLunar: parentIsLunar === true,
        isLeapMonth: parentIsLeapMonth === true,
      });
    }

    // Hash claim key if provided (raw key must never be logged or stored)
    const validatedClaimKeyPromo = validateClaimKey(claimKey);
    const claimKeyHashPromo = validatedClaimKeyPromo ? hashClaimKey(validatedClaimKeyPromo) : null;

    const promoReadingParams = {
      userId: null,
      orderId: null,
      birthDate: normalizedBirthDate,
      birthTime: effectiveBirthTime || null,
      consent: normalizedConsent,
      gender,
      isLunar: isLunar === true,
      isLeapMonth: isLeapMonth === true,
      timezone: timezone || 'Asia/Seoul',
      language: language || 'ko',
      subjectName,
      birthPlace,
      latitude,
      longitude,
      parentManseryeok,
      parentRole: parentRole || null,
      twinInfo: twinOrder ? { order: twinOrder, siblingName: twinSiblingName || null } : null,
      promoCodeId: promoResult.promoCode.id,
      deliveryEmail: email,
      skipPaymentCheck: true,
      claimKeyHash: claimKeyHashPromo,
    };

    // 프로모 소진은 생성 성공 뒤에만 한다. 실패했으면 코드를 다시 쓸 수 있어야 한다.
    // 비동기 경로에서는 이 순서를 잡이 그대로 지킨다.
    const promoConsumption = {
      promoCodeId: promoResult.promoCode.id,
      email,
      childName: subjectName,
      childBirthDate: normalizedBirthDate,
    };

    if (wantsAsyncReport(req) && claimKeyHashPromo) {
      const dispatch = await dispatchReportJob({
        reading: promoReadingParams,
        promo: promoConsumption,
      });
      if (dispatch.mode === 'async') {
        return res.status(202).json({ status: 'pending', pollWith: 'claim' });
      }
      return dispatch.reading
        ? res.status(200).json(dispatch.reading)
        : res.status(202).json({ status: 'pending', pollWith: 'claim' });
    }

    // Step 4: Generate reading first (before consuming promo code)
    // If AI generation fails, the promo code stays available for retry
    const reading = await sajuService.generateSajuReading(promoReadingParams);

    // Step 5: Reading succeeded — now consume the promo code
    await promoService.usePromoCode({
      ...promoConsumption,
      readingId: reading.readingId,
    });

    // 동기 경로. 비동기·인라인 경로는 report-job에서 센다.
    await recordFunnelEvent(FUNNEL.PROMO_REPORT, language);

    console.log('[Saju Route] Promo reading generated:', {
      readingId: reading.readingId,
      promoCode: promoResult.promoCode.code,
      email: require('../utils/logger').maskEmail(email),
    });

    // Step 6: Return reading data (email is sent fire-and-forget from saju.service)
    res.status(200).json(reading);

  } catch (error) {
    console.error('[Saju Route] Promo calculate error:', error);

    // Lost the redemption race to a concurrent request (unique index 23505).
    if (error.code === 'PROMO_ALREADY_USED') {
      return res.status(409).json({
        error: '이미 이 프로모 코드를 사용하셨습니다.',
        code: 'PROMO_ALREADY_USED',
      });
    }

    if (error.message.includes('Manseryeok calculation failed')) {
      return res.status(500).json({
        error: 'Failed to calculate Four Pillars. Please check birth data.',
        code: 'CALCULATION_ERROR',
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
});

// ── Report lookup: emailed-OTP possession check ──────────────────────────
// Flow: POST /report-lookup-otp (send code to email) → POST /report-lookup-token
// (exchange email+otp+scope for a short-lived report lookup token).

const LOOKUP_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidLookupEmail(email) {
  return typeof email === 'string'
    && email.length <= 254
    && LOOKUP_EMAIL_REGEX.test(email)
    && !/[\r\n]/.test(email);
}

/**
 * Verify the caller-supplied (email, orderId|promoCode) tuple actually maps to
 * a reading/payment owned by that email. Returns { owned, promoCodeId }.
 * Never throws — failures count as "not owned".
 */
async function verifyLookupOwnership(email, orderId, promoCode) {
  const { supabaseAdmin } = require('../config/supabase');
  const normalizedEmail = email.toLowerCase().trim();

  try {
    if (orderId) {
      const { data: payment } = await supabaseAdmin
        .from('payments')
        .select('id, metadata')
        .eq('order_id', orderId)
        .maybeSingle();

      if (!payment) return { owned: false };

      // Payment metadata stores the buyer email at order creation — covers the
      // Lambda-timeout case where the reading row doesn't exist yet.
      const paymentEmail = (payment.metadata?.email || '').toLowerCase().trim();
      if (paymentEmail && paymentEmail === normalizedEmail) {
        return { owned: true };
      }

      const { count } = await supabaseAdmin
        .from('readings')
        .select('id', { count: 'exact', head: true })
        .eq('payment_id', payment.id)
        .eq('delivery_email', normalizedEmail);
      return { owned: (count || 0) > 0 };
    }

    if (promoCode) {
      // Direct code→id lookup (NOT validatePromoCode: expired/maxed codes must
      // still allow looking up readings that were legitimately generated).
      const { data: promo } = await supabaseAdmin
        .from('promo_codes')
        .select('id')
        .eq('code', String(promoCode).toUpperCase().trim())
        .maybeSingle();
      if (!promo) return { owned: false };

      const { count } = await supabaseAdmin
        .from('readings')
        .select('id', { count: 'exact', head: true })
        .eq('promo_code_id', promo.id)
        .eq('delivery_email', normalizedEmail);
      return { owned: (count || 0) > 0, promoCodeId: promo.id };
    }
  } catch (err) {
    console.error('[Saju Route] Lookup ownership check error:', err.message);
  }
  return { owned: false };
}

/**
 * POST /saju/report-lookup-otp
 * Step 1 of report lookup: send a 6-digit OTP to the claimed email, but ONLY if
 * a matching reading/payment exists for that email+scope (so we never email
 * strangers). Response is always generic — does not leak whether a match exists.
 * Body: { email, orderId?, promoCode?, language? }
 */
router.post('/report-lookup-otp', otpRequestLimiter, async (req, res) => {
  const genericResponse = { success: true, otpRequired: true };
  try {
    const { email, orderId, promoCode, language } = req.body;

    if (!isValidLookupEmail(email)) {
      return res.status(400).json({ error: 'Valid email required', code: 'INVALID_EMAIL' });
    }
    if (!orderId && !promoCode) {
      return res.status(400).json({ error: 'orderId or promoCode required', code: 'MISSING_LOOKUP_SCOPE' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const ownership = await verifyLookupOwnership(normalizedEmail, orderId, promoCode);

    if (ownership.owned) {
      const code = await reportLookupOtp.createOtp(normalizedEmail);
      try {
        const emailService = require('../services/email.service');
        await emailService.sendReportLookupOtp(normalizedEmail, code, language || 'en');
      } catch (sendErr) {
        // Still return the generic response — error details must not leak existence
        console.error('[Saju Route] OTP email send failed:', sendErr.message);
      }
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error('[Saju Route] Report lookup OTP error:', error);
    return res.status(200).json(genericResponse);
  }
});

/**
 * POST /saju/report-lookup-token
 * Step 2 of report lookup: exchange a verified OTP for a short-lived lookup token.
 * Requires proof of email possession (OTP) AND re-verifies that the requested
 * scope (orderId/promoCode) belongs to that email — the OTP alone must not be
 * exchangeable for someone else's order.
 * Body: { email, otp, orderId?, promoCode? }
 */
router.post('/report-lookup-token', readLimiter, async (req, res) => {
  try {
    const { email, otp, orderId, promoCode } = req.body;
    if (!isValidLookupEmail(email) || (!orderId && !promoCode)) {
      return res.status(400).json({ error: 'Email and orderId or promoCode required', code: 'MISSING_LOOKUP_SCOPE' });
    }
    if (!otp) {
      return res.status(400).json({ error: 'Verification code required', code: 'MISSING_OTP' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const otpValid = await reportLookupOtp.verifyOtp(normalizedEmail, otp);
    if (!otpValid) {
      // Generic rejection: bad code, expired, and too-many-attempts all look identical
      return res.status(400).json({ error: 'Invalid or expired verification code', code: 'INVALID_OTP' });
    }

    const ownership = await verifyLookupOwnership(normalizedEmail, orderId, promoCode);
    if (!ownership.owned) {
      return res.status(400).json({ error: 'Invalid or expired verification code', code: 'INVALID_OTP' });
    }

    const claims = {
      purpose: 'report_lookup',
      email: normalizedEmail,
      orderId: orderId || undefined,
      promoCodeId: ownership.promoCodeId || undefined,
    };

    const reportLookupToken = createAccessToken(claims, 2 * 60 * 60);
    return res.status(200).json({ success: true, reportLookupToken });
  } catch (error) {
    console.error('[Saju Route] Report lookup token error:', error);
    return res.status(500).json({ error: 'Failed to create report lookup token', code: 'REPORT_LOOKUP_TOKEN_ERROR' });
  }
});

/**
 * GET /saju/reading-check
 * Poll for a completed reading (used after API Gateway timeout).
 * The Lambda continues running after timeout and saves to DB — this endpoint checks if done.
 *
 * Two auth branches (mutually exclusive; claim takes priority when both present):
 *   ?claim=<rawClaimKey>  — possession of the random secret is the authz (in-flow, no OTP)
 *   ?token=<accessToken>  — existing signed token branch (unchanged, back-compat)
 */
/**
 * POST /saju/feedback
 * 리포트를 받은 사람이 남기는 별점(1-5)과 선택 코멘트.
 *
 * 인증: 리포트를 실제로 받은 사람만 — 이미 있는 두 가지 소유 증명을 그대로 쓴다.
 *   - reportAccessToken (리포트 화면이 이미 들고 있다)
 *   - claimKey (in-flow 폴링에 쓰는 그 열쇠)
 * 새 로그인도, 새 개인정보도 만들지 않는다. 이메일을 받지 않는 이유이기도 하다 —
 * 평가 하나 받자고 연락처를 새로 모으면 동의 범위가 넓어진다.
 *
 * Body: { rating: 1-5, comment?: string, readingId?, token?, claimKey? }
 */
router.post('/feedback', feedbackLimiter, async (req, res) => {
  try {
    const { rating, comment, token, claimKey } = req.body || {};
    const { supabaseAdmin } = require('../config/supabase');

    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: 'rating must be an integer between 1 and 5', code: 'INVALID_RATING' });
    }
    if (comment != null && (typeof comment !== 'string' || comment.length > 2000)) {
      return res.status(400).json({ error: 'comment must be a string of at most 2000 characters', code: 'INVALID_COMMENT' });
    }

    // ── 소유 증명 → reading 한 건 ─────────────────────────────────────────
    let reading = null;
    if (token) {
      let payload;
      try {
        payload = verifyAccessToken(token, { purpose: 'report' });
      } catch {
        return res.status(401).json({ error: 'Invalid report access token', code: 'INVALID_REPORT_ACCESS_TOKEN' });
      }
      if (!payload.readingId) {
        return res.status(401).json({ error: 'Invalid report access token', code: 'INVALID_REPORT_ACCESS_TOKEN' });
      }
      const { data } = await supabaseAdmin
        .from('readings')
        .select('id, language, product_type, ai_interpretation')
        .eq('id', payload.readingId)
        .maybeSingle();
      reading = data;
    } else if (claimKey) {
      const validClaim = validateClaimKey(claimKey);
      if (!validClaim) {
        return res.status(401).json({ error: 'Invalid claim key', code: 'INVALID_CLAIM_KEY' });
      }
      const { data } = await supabaseAdmin
        .from('readings')
        .select('id, language, product_type, ai_interpretation')
        .eq('claim_key_hash', hashClaimKey(validClaim))
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      reading = data;
    } else {
      return res.status(401).json({ error: 'Report access token or claim key required', code: 'MISSING_REPORT_PROOF' });
    }

    if (!reading) {
      return res.status(404).json({ error: 'Reading not found', code: 'READING_NOT_FOUND' });
    }

    // 평가를 원인에 잇는 값들. 리포트가 보존기간으로 지워져도 집계는 남아야 하므로
    // 조인 대신 복사한다.
    const row = {
      reading_id: reading.id,
      rating: parsedRating,
      comment: comment ? comment.trim() || null : null,
      language: reading.language || null,
      prompt_version: reading.ai_interpretation?.metadata?.promptVersion || 'unknown',
      product_type: reading.product_type || null,
    };

    // 같은 리포트를 다시 평가하면 덮어쓴다(마음이 바뀌는 것은 정상이다).
    const { error } = await supabaseAdmin
      .from('report_feedback')
      .upsert(row, { onConflict: 'reading_id' });

    if (error) {
      // 마이그레이션 008 미실행 등 — 평가 하나 때문에 사용자에게 에러를 보이지
      // 않는다. 로그에는 남겨서 우리가 알아채게 한다.
      console.error('[Saju Route] feedback upsert failed:', error.message);
      return res.status(503).json({ error: 'Feedback storage unavailable', code: 'FEEDBACK_STORE_FAILED' });
    }

    console.log('[Saju Route] Feedback stored:', { readingId: reading.id, rating: parsedRating, hasComment: !!row.comment, promptVersion: row.prompt_version });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Saju Route] feedback error:', error);
    return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

router.get('/reading-check', readLimiter, async (req, res) => {
  try {
    const { token, claim } = req.query;
    const { supabaseAdmin } = require('../config/supabase');

    // ── Branch A: claim key (in-flow polling, no OTP required) ──────────────
    if (claim) {
      const validClaim = validateClaimKey(claim);
      if (!validClaim) {
        // Invalid format — treat as pending (no information leak)
        return res.status(200).json({ status: 'pending' });
      }

      const claimHash = hashClaimKey(validClaim);
      const { data: reading, error } = await supabaseAdmin
        .from('readings')
        .select('*')
        .eq('claim_key_hash', claimHash)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // PGRST116 = no rows yet (genuinely pending). Anything else is a real
      // backend fault — log it and return 503 so monitoring can see it
      // (pollers parse the JSON status and just keep polling).
      if (error && error.code !== 'PGRST116') {
        console.error('[Saju Route] reading-check claim query failed:', error);
        return res.status(503).json({ status: 'error', code: 'READING_CHECK_FAILED' });
      }
      if (error || !reading) {
        return res.status(200).json({ status: 'pending' });
      }

      // Mint a report-scoped access token so the caller can use all downstream APIs
      const reportAccessToken = createAccessToken({
        purpose: 'report',
        readingId: reading.id,
        email: reading.delivery_email || undefined,
      }, 24 * 60 * 60);

      return res.status(200).json({ status: 'complete', reading: { ...reading, reportAccessToken } });
    }

    // ── Branch B: existing signed-token branch (unchanged) ──────────────────
    if (!token) {
      return res.status(401).json({ error: 'Report access token required', code: 'MISSING_REPORT_ACCESS_TOKEN' });
    }

    let tokenPayload;
    try {
      tokenPayload = verifyAccessToken(token, { purpose: 'report' });
    } catch {
      tokenPayload = verifyAccessToken(token, { purpose: 'report_lookup' });
    }

    let query = supabaseAdmin.from('readings').select('*');

    if (tokenPayload.purpose === 'report') {
      if (!tokenPayload.readingId) {
        return res.status(401).json({ error: 'Invalid report access token', code: 'INVALID_REPORT_ACCESS_TOKEN' });
      }
      query = query.eq('id', tokenPayload.readingId);
    } else if (tokenPayload.orderId) {
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from('payments')
        .select('id')
        .eq('order_id', tokenPayload.orderId)
        .single();
      if (paymentError && paymentError.code !== 'PGRST116') {
        console.error('[Saju Route] reading-check payment lookup failed:', paymentError);
        return res.status(503).json({ status: 'error', code: 'READING_CHECK_FAILED' });
      }
      if (!payment) return res.status(200).json({ status: 'pending' });
      query = query.eq('payment_id', payment.id);
    } else {
      query = query
        .eq('delivery_email', tokenPayload.email)
        .eq('promo_code_id', tokenPayload.promoCodeId);
    }

    const { data: reading, error } = await query
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[Saju Route] reading-check token query failed:', error);
      return res.status(503).json({ status: 'error', code: 'READING_CHECK_FAILED' });
    }
    if (error || !reading) {
      return res.status(200).json({ status: 'pending' });
    }

    const reportAccessToken = tokenPayload.purpose === 'report'
      ? token
      : createAccessToken({
          purpose: 'report',
          readingId: reading.id,
          email: reading.delivery_email || tokenPayload.email,
          orderId: tokenPayload.orderId,
        }, 24 * 60 * 60);

    return res.status(200).json({ status: 'complete', reading: { ...reading, reportAccessToken } });
  } catch (error) {
    console.error('[Saju Route] Reading check error:', error);
    if (error.message && error.message.includes('access token')) {
      return res.status(401).json({ error: 'Invalid or expired report access token', code: 'INVALID_REPORT_ACCESS_TOKEN' });
    }
    // Real fault, not "still generating" — 503 so it shows up in monitoring
    // instead of masquerading as pending forever.
    return res.status(503).json({ status: 'error', code: 'READING_CHECK_FAILED' });
  }
});

/**
 * GET /saju/reading/:id/pdf
 * Download reading as PDF
 */
router.get('/reading/:id/pdf', readLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid reading ID' });
    }
    if (!token) {
      return res.status(401).json({ error: 'Report access token required' });
    }

    verifyAccessToken(token, {
      purpose: 'report',
      readingId: id,
    });

    const { supabaseAdmin } = require('../config/supabase');
    const { data: reading, error } = await supabaseAdmin
      .from('readings')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !reading) {
      return res.status(404).json({ error: 'Reading not found' });
    }

    const pdfService = require('../services/pdf.service');
    const pdfBuffer = await pdfService.generateReportPDF({
      childName: reading.subject_name,
      birthDate: reading.birth_date,
      gender: reading.gender,
      manseryeok: reading.saju_data,
      aiInterpretation: reading.ai_interpretation,
      language: reading.language || 'ko',
      generatedAt: reading.ai_interpretation?.metadata?.generatedAt || reading.created_at,
    });

    const filename = 'SoMyung_Report.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('[Saju Route] PDF download error:', error);
    if (error.message && error.message.includes('access token')) {
      return res.status(401).json({ error: 'Invalid or expired report access token' });
    }
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

module.exports = router;
