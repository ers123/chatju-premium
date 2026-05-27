// backend/src/routes/saju.routes.js
// API routes for premium Saju calculation - RELATIONSHIP FOCUSED

const express = require('express');
const router = express.Router();
const sajuService = require('../services/saju.service');
const authMiddleware = require('../middleware/auth');
const promoService = require('../services/promo.service');
const { validateBirthInfo, validateUUIDParam, sanitizeStrings } = require('../middleware/validation');
const { sajuPreviewLimiter, sajuPremiumLimiter, readLimiter } = require('../middleware/rateLimit');
const { calculateMansae } = require('../utils/mansae-wrapper');
const { createAccessToken, verifyAccessToken } = require('../utils/accessToken');

// Apply sanitization to all routes
router.use(sanitizeStrings);

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
    if (birthTime) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(birthTime)) {
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
      birthTime,
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
      gender,
      isLunar,
      isLeapMonth,
      timezone,
      language,
      subjectName,
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
    } = req.body;

    // Validate required fields
    if (!orderId || !birthDate || !gender) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['orderId', 'birthDate', 'gender'],
      });
    }

    // Validate birth date format (YYYY-MM-DD)
    const normalizedBirthDate = birthDate.replace(/\./g, '-');
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(normalizedBirthDate)) {
      return res.status(400).json({
        error: 'Invalid birthDate format. Use YYYY-MM-DD',
      });
    }

    // Validate birth time format (HH:MM) if provided
    if (birthTime) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(birthTime)) {
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

    // Generate reading
    const reading = await sajuService.generateSajuReading({
      userId,
      orderId,
      paymentAccessToken,
      birthDate: normalizedBirthDate,
      birthTime,
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
    });

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
      gender,
      isLunar,
      isLeapMonth,
      timezone,
      language,
      subjectName,
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

    // Validate birth time if provided
    if (birthTime) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(birthTime)) {
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

    // Step 4: Generate reading first (before consuming promo code)
    // If AI generation fails, the promo code stays available for retry
    const reading = await sajuService.generateSajuReading({
      userId: null,
      orderId: null,
      birthDate: normalizedBirthDate,
      birthTime,
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
    });

    // Step 5: Reading succeeded — now consume the promo code
    await promoService.usePromoCode({
      promoCodeId: promoResult.promoCode.id,
      email,
      childName: subjectName,
      childBirthDate: normalizedBirthDate,
      readingId: reading.readingId,
    });

    console.log('[Saju Route] Promo reading generated:', {
      readingId: reading.readingId,
      promoCode: promoResult.promoCode.code,
      email: require('../utils/logger').maskEmail(email),
    });

    // Step 6: Return reading data (email is sent fire-and-forget from saju.service)
    res.status(200).json(reading);

  } catch (error) {
    console.error('[Saju Route] Promo calculate error:', error);

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

router.post('/report-lookup-token', readLimiter, async (req, res) => {
  try {
    const { email, orderId, promoCode } = req.body;
    if (!email || (!orderId && !promoCode)) {
      return res.status(400).json({ error: 'Email and orderId or promoCode required', code: 'MISSING_LOOKUP_SCOPE' });
    }

    const claims = {
      purpose: 'report_lookup',
      email: email.toLowerCase().trim(),
      orderId: orderId || undefined,
      promoCodeId: undefined,
    };

    if (promoCode) {
      const promoResult = await promoService.validatePromoCode(promoCode);
      if (!promoResult.valid) {
        return res.status(400).json({ error: promoResult.error, code: 'INVALID_PROMO' });
      }
      claims.promoCodeId = promoResult.promoCode.id;
    }

    const reportLookupToken = createAccessToken(claims, 2 * 60 * 60);
    return res.status(200).json({ success: true, reportLookupToken });
  } catch (error) {
    console.error('[Saju Route] Report lookup token error:', error);
    return res.status(500).json({ error: 'Failed to create report lookup token', code: 'REPORT_LOOKUP_TOKEN_ERROR' });
  }
});

/**
 * GET /saju/reading-check
 * Poll for a completed reading by email (used after API Gateway timeout)
 * The Lambda continues running after timeout and saves to DB — this endpoint checks if it's done.
 */
router.get('/reading-check', readLimiter, async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(401).json({ error: 'Report access token required', code: 'MISSING_REPORT_ACCESS_TOKEN' });
    }

    const { supabaseAdmin } = require('../config/supabase');
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
      const { data: payment } = await supabaseAdmin
        .from('payments')
        .select('id')
        .eq('order_id', tokenPayload.orderId)
        .single();
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
    return res.status(200).json({ status: 'pending' });
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
