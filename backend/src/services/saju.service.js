// backend/src/services/saju.service.v5.js
// Level 5: Saju Reading Service with Supabase Database Integration

const { getAIService } = require('./ai.service');
const { supabaseAdmin, handleSupabaseError } = require('../config/supabase');
const { calculateFullFortuneCycles } = require('./daeun.service');
const { calculateMansae } = require('../utils/mansae-wrapper');
const { createAccessToken, verifyAccessToken } = require('../utils/accessToken');
const { assertPaymentMatchesProduct } = require('./payment.service');
const { buildMultipleBirthSection } = require('../utils/multiple-birth');
const { adaptMarkdownToPresentation, mergePresentationResult, getPremiumPresentationLocale } = require('./report-presentation');
const { buildKnowledgeContext } = require('./saju-knowledge');

// Initialize AI service (supports OpenAI, Gemini, Claude)
const aiService = getAIService();

// Lambda timeout is 60s (serverless.yml). Past this much elapsed time the
// report email is sent without its PDF attachment, so a slow AI call costs the
// attachment rather than the whole delivery.
const EMAIL_PDF_BUDGET_MS = Number(process.env.EMAIL_PDF_BUDGET_MS || 40000);

/**
 * Generate FREE Saju preview/teaser (no authentication required)
 * Returns: Basic Four Pillars + truncated AI interpretation
 *
 * @param {Object} params
 * @param {string} params.birthDate - Birth date (YYYY-MM-DD)
 * @param {string} params.birthTime - Birth time (HH:MM) or null
 * @param {string} params.gender - 'male' or 'female'
 * @param {string} params.timezone - IANA timezone string
 * @param {string} params.language - 'ko' or 'en'
 * @returns {Promise<Object>} Preview result (no database storage)
 */
async function generateSajuPreview(params) {
  const {
    birthDate,
    birthTime = null,
    gender,
    isLunar = false,
    isLeapMonth = false,
    timezone = 'Asia/Seoul',
    language = 'ko',
    // Location for solar time correction
    birthPlace = null,
    latitude = null,
    longitude = null,
    // Parent data for relationship analysis
    parentManseryeok = null,
    parentRole = null,
  } = params;

  try {
    console.log('[Saju Service] Starting preview generation:', {
      birthYear: birthDate?.slice(0, 4),
      gender,
      hasParentData: !!parentManseryeok,
    });

    // Step 1: Calculate Child Manseryeok using wrapper (CommonJS compatible)
    // Convert gender format (male/female → 남/여)
    const genderKorean = gender === 'male' ? '남' : '여';

    // Calculate with time or without. When birth time is unknown we still use a
    // noon anchor for date-boundary math, but the hour pillar is OMITTED (not fabricated).
    const hourUnknown = !birthTime;
    const timeToUse = birthTime || '12:00';
    const locationOptions = {};
    if (birthPlace) locationOptions.birthPlace = birthPlace;
    if (latitude != null) locationOptions.latitude = latitude;
    if (longitude != null) locationOptions.longitude = longitude;
    locationOptions.isLunar = isLunar === true;
    locationOptions.isLeapMonth = isLeapMonth === true;
    locationOptions.timezone = timezone; // IANA tz (or UTC offset) of the birth wall-clock
    locationOptions.hourUnknown = hourUnknown;

    const childManseryeok = calculateMansae(birthDate, timeToUse, genderKorean, locationOptions);

    // Validate calculation result
    if (childManseryeok.error) {
      throw new Error(`Manseryeok calculation failed: ${childManseryeok.error}`);
    }

    if (!childManseryeok.pillars) {
      throw new Error('Invalid Manseryeok result structure');
    }

    console.log('[Saju Service] Child Manseryeok calculation successful', {
      corrections: childManseryeok.corrections?.applied ? childManseryeok.corrections.note : 'none',
    });

    // Step 2: Calculate fortune cycles (대운/세운) - Premium feature
    const fortuneCycles = calculateFullFortuneCycles(
      childManseryeok,
      childManseryeok.input?.solarDate || birthDate,
      genderKorean,
      new Date().getFullYear()
    );

    console.log('[Saju Service] Fortune cycles calculated:', {
      currentAge: fortuneCycles.currentAge,
      daeunDirection: fortuneCycles.daeunInfo.direction,
      currentDaeun: fortuneCycles.currentDaeun?.pillar?.korean,
    });

    // Step 3: Generate PREVIEW AI interpretation with RELATIONSHIP FOCUS
    const aiPreview = await generateAIPreview(
      childManseryeok,
      parentManseryeok,  // Pass parent data for relationship analysis
      parentRole,
      language,
      birthTime === null // indicate if time is unknown
    );

    console.log('[Saju Service] Relationship-focused preview generated');

    // Step 4: Return preview (NO database storage)
    return {
      manseryeok: childManseryeok,
      fortuneCycles: {
        dayMaster: fortuneCycles.dayMaster,
        currentAge: fortuneCycles.currentAge,
        daeunInfo: fortuneCycles.daeunInfo,
        currentDaeun: fortuneCycles.currentDaeun,
        currentSeun: fortuneCycles.currentSeun,
        isPreview: true,
        fullDataAvailable: 'Upgrade to Premium for complete relationship analysis',
      },
      aiPreview: aiPreview,
      hasParentAnalysis: !!parentManseryeok,
      metadata: {
        birthDate,
        solarDate: childManseryeok.input?.solarDate || null,
        isLunar: isLunar === true,
        isLeapMonth: isLeapMonth === true,
        birthTime,
        gender,
        language,
        timezone,
        parentRole,
      },
    };

  } catch (error) {
    console.error('[Saju Service] Error in generateSajuPreview:', error);
    throw error;
  }
}

/**
 * Generate premium Saju reading with Manseryeok calculation and AI interpretation
 * NOW WITH REAL DATABASE STORAGE!
 *
 * @param {Object} params
 * @param {string} params.userId - User ID from JWT
 * @param {string} params.orderId - Payment order ID
 * @param {string} params.birthDate - Birth date (YYYY-MM-DD)
 * @param {string} params.birthTime - Birth time (HH:MM) or null
 * @param {string} params.gender - 'male' or 'female'
 * @param {string} params.timezone - IANA timezone string
 * @param {string} params.language - 'ko', 'en', or 'zh'
 * @param {string} params.subjectName - Name of person (optional)
 * @returns {Promise<Object>} Reading result with database ID
 */
async function generateSajuReading(params) {
  const {
    userId = null,
    orderId = null,
    paymentAccessToken = null,
    birthDate,
    birthTime = null,
    gender,
    isLunar = false,
    isLeapMonth = false,
    timezone = 'Asia/Seoul',
    language = 'ko',
    subjectName = null,
    // Location for solar time correction
    birthPlace = null,
    latitude = null,
    longitude = null,
    parentManseryeok = null,
    parentRole = null,
    // Twin info (optional)
    twinInfo = null, // { order: 1|2, siblingName?: string }
    // Promo code support (optional)
    promoCodeId = null,
    deliveryEmail = null,
    skipPaymentCheck = false,
    // PIPA/GDPR proof of consent (normalized by route layer)
    consent = null,
    // Per-transaction claim key hash (sha256 of raw client secret) — never store raw key
    claimKeyHash = null,
  } = params;

  // Wall clock for this invocation. Used to decide whether there is still
  // budget to render the PDF attachment before the Lambda's 60s hard stop.
  const invocationStart = Date.now();

  try {
    console.log('[Saju Service] Starting reading generation:', {
      orderId,
      birthYear: birthDate?.slice(0, 4),
      gender,
    });

    // Step 1: Verify payment (skip for promo code flow)
    let payment = null;
    if (!skipPaymentCheck) {
      let paymentQuery = supabaseAdmin
        .from('payments')
        .select('*')
        .eq('order_id', orderId);

      if (userId) {
        paymentQuery = paymentQuery.eq('user_id', userId);
      } else {
        const tokenPayload = verifyAccessToken(paymentAccessToken, {
          purpose: 'payment',
          orderId,
        });
        paymentQuery = paymentQuery
          .eq('id', tokenPayload.paymentId)
          .eq('payment_key', tokenPayload.paypalOrderId);
      }

      const { data: paymentData, error: paymentError } = await paymentQuery.single();

      if (paymentError) {
        throw handleSupabaseError(paymentError) || new Error('Payment not found');
      }

      if (paymentData.status !== 'completed') {
        throw new Error(`Payment not completed. Current status: ${paymentData.status}`);
      }
      // Validate against the product this payment was created for (multi-currency
      // catalog) — defaulting to premium_saju would reject every non-USD payment.
      assertPaymentMatchesProduct(paymentData, paymentData.metadata?.product_type);

      payment = {
        ...paymentData,
        product_type: paymentData.metadata?.product_type || 'premium_saju',
      };
      console.log('[Saju Service] Payment verified:', payment.product_type);
    } else {
      console.log('[Saju Service] Skipping payment check (promo flow)');
    }

    // Step 2: Calculate Manseryeok using wrapper
    // Convert gender format (male/female → 남/여)
    const genderKorean = gender === 'male' ? '남' : '여';

    // Calculate with time or without — with solar time correction. When birth time
    // is unknown we still use a noon anchor for date-boundary math, but the hour
    // pillar is OMITTED (not fabricated).
    const hourUnknown = !birthTime;
    const timeToUse = birthTime || '12:00';
    const locationOptions = {};
    if (birthPlace) locationOptions.birthPlace = birthPlace;
    if (latitude != null) locationOptions.latitude = latitude;
    if (longitude != null) locationOptions.longitude = longitude;
    locationOptions.isLunar = isLunar === true;
    locationOptions.isLeapMonth = isLeapMonth === true;
    locationOptions.timezone = timezone; // IANA tz (or UTC offset) of the birth wall-clock
    locationOptions.hourUnknown = hourUnknown;

    const manseryeokResult = calculateMansae(birthDate, timeToUse, genderKorean, locationOptions);

    // Validate calculation result
    if (manseryeokResult.error) {
      throw new Error(`Manseryeok calculation failed: ${manseryeokResult.error}`);
    }

    if (!manseryeokResult.pillars) {
      throw new Error('Invalid Manseryeok result structure');
    }

    console.log('[Saju Service] Manseryeok calculation successful:', {
      year: manseryeokResult.pillars.year.korean,
      month: manseryeokResult.pillars.month.korean,
      day: manseryeokResult.pillars.day.korean,
      hour: manseryeokResult.pillars.hour?.korean || '(unknown)',
    });

    // Step 3: Calculate fortune cycles (대운/세운) - Full Premium version
    const fortuneCycles = calculateFullFortuneCycles(
      manseryeokResult,
      manseryeokResult.input?.solarDate || birthDate,
      genderKorean,
      new Date().getFullYear()
    );

    console.log('[Saju Service] Fortune cycles calculated for premium:', {
      currentAge: fortuneCycles.currentAge,
      daeunCount: fortuneCycles.daeunList.length,
      seunCount: fortuneCycles.seunList.length,
    });

    // Step 4: Generate AI interpretation
    const aiInterpretation = await generateAIInterpretation(
      manseryeokResult,
      parentManseryeok,
      parentRole,
      language,
      payment ? payment.product_type : 'premium_saju',
      birthTime === null, // indicate if time is unknown
      fortuneCycles,
      twinInfo,
      subjectName
    );

    console.log('[Saju Service] AI interpretation generated');

    // Step 5: Store reading in database (NEW - Real persistence!)
    // Include fortune cycles in saju_data for complete storage
    const completeReadingData = {
      ...manseryeokResult,
      fortuneCycles: fortuneCycles,
    };

    const readingRow = {
      birth_date: birthDate,
      birth_time: birthTime,
      gender: gender,
      subject_name: subjectName,
      saju_data: completeReadingData,
      ai_interpretation: aiInterpretation,
      language: language,
      product_type: payment ? payment.product_type : 'premium_saju',
    };

    // Conditional fields
    if (userId) readingRow.user_id = userId;
    if (payment) readingRow.payment_id = payment.id;
    if (promoCodeId) readingRow.promo_code_id = promoCodeId;
    if (deliveryEmail) readingRow.delivery_email = deliveryEmail.toLowerCase().trim();
    // PIPA/GDPR proof of consent — stored with the reading row
    if (consent) readingRow.consent = consent;
    // Per-transaction claim key hash — possession of raw secret authorizes in-flow polling
    if (claimKeyHash) readingRow.claim_key_hash = claimKeyHash;

    let { data: reading, error: insertError } = await supabaseAdmin
      .from('readings')
      .insert([readingRow])
      .select()
      .single();

    // Fallback: if the readings.consent column doesn't exist yet (migration not run),
    // embed consent inside the saju_data JSONB so proof of consent is never dropped.
    // TODO: run migrations/003_security_otp_consent.sql, then this fallback is dead code.
    if (insertError && consent && /consent/i.test(insertError.message || '')) {
      console.warn('[Saju Service] readings.consent column missing — embedding consent in saju_data. Run migrations/003_security_otp_consent.sql');
      const fallbackRow = { ...readingRow, saju_data: { ...completeReadingData, _consent: consent } };
      delete fallbackRow.consent;
      ({ data: reading, error: insertError } = await supabaseAdmin
        .from('readings')
        .insert([fallbackRow])
        .select()
        .single());
    }

    // Fallback: if claim_key_hash column doesn't exist yet (migration 004 not run), drop it and retry.
    if (insertError && claimKeyHash && /claim_key_hash/i.test(insertError.message || '')) {
      console.warn('[Saju Service] readings.claim_key_hash column missing — dropping field and retrying. Run migrations/004_claim_key.sql');
      const fallbackRow = { ...readingRow };
      delete fallbackRow.claim_key_hash;
      ({ data: reading, error: insertError } = await supabaseAdmin
        .from('readings')
        .insert([fallbackRow])
        .select()
        .single());
    }

    if (insertError) {
      console.error('[Saju Service] Failed to store reading:', insertError);
      throw handleSupabaseError(insertError) || new Error('Failed to save reading');
    }

    console.log('[Saju Service] Reading saved to database:', reading.id);

    const reportAccessToken = createAccessToken({
      purpose: 'report',
      readingId: reading.id,
      email: deliveryEmail ? deliveryEmail.toLowerCase().trim() : undefined,
      orderId: orderId || undefined,
    }, 24 * 60 * 60);

    // Step 6: Email delivery (if deliveryEmail provided). Awaited: on Lambda,
    // un-awaited work after the response is sent runs in a frozen execution
    // environment and may never complete — the email is a paid deliverable, so
    // it must finish (or be recorded as failed) before we return. An email
    // failure still must not fail the reading itself; email_status tracks it.
    if (deliveryEmail) {
      try {
        const emailService = require('./email.service');
        // Rendering the CJK PDF attachment costs seconds. If AI generation
        // already ate most of the 60s budget, drop the attachment rather than
        // risk the Lambda being killed mid-send — the email body carries a
        // download link, so an email without the attachment still delivers.
        const elapsedMs = Date.now() - invocationStart;
        const skipPdf = elapsedMs > EMAIL_PDF_BUDGET_MS;
        if (skipPdf) {
          console.warn(`[Saju Service] ${elapsedMs}ms elapsed — sending report email without PDF attachment to stay inside the Lambda budget`);
        }
        await emailService.sendReportEmail({
          email: deliveryEmail,
          childName: subjectName,
          readingId: reading.id,
          manseryeok: manseryeokResult,
          aiInterpretation,
          birthDate,
          gender,
          language,
          reportAccessToken,
          skipPdf,
        });
        await supabaseAdmin
          .from('readings')
          .update({ email_status: 'sent', email_sent_at: new Date().toISOString() })
          .eq('id', reading.id);
        console.log('[Saju Service] Report email sent to:', require('../utils/logger').maskEmail(deliveryEmail));
      } catch (emailErr) {
        console.error('[Saju Service] Email delivery failed:', emailErr.message);
        try {
          await supabaseAdmin
            .from('readings')
            .update({ email_status: 'failed' })
            .eq('id', reading.id);
        } catch (statusErr) {
          console.error('[Saju Service] Failed to record email_status:', statusErr.message);
        }
      }
    }

    // Step 7: Return complete reading with database ID
    return {
      readingId: reading.id, // Real UUID from database!
      reportAccessToken,
      manseryeok: manseryeokResult,
      fortuneCycles: fortuneCycles, // Full 대운/세운 data for Premium
      aiInterpretation: aiInterpretation,
      createdAt: reading.created_at,
      viewUrl: `https://chatju.pages.dev/reading/${reading.id}`,
      metadata: {
        birthDate,
        solarDate: manseryeokResult.input?.solarDate || null,
        isLunar: isLunar === true,
        isLeapMonth: isLeapMonth === true,
        birthTime,
        gender,
        language,
        subjectName,
        timezone,
      },
    };

  } catch (error) {
    console.error('[Saju Service] Error in generateSajuReading:', error);
    throw error;
  }
}

/**
 * Retrieve an existing reading from database
 *
 * @param {string} readingId - Reading UUID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>} Reading data
 */
async function getReading(readingId, userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('readings')
      .select('*')
      .eq('id', readingId)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw handleSupabaseError(error) || new Error('Reading not found');
    }

    return {
      readingId: data.id,
      manseryeok: data.saju_data,
      aiInterpretation: data.ai_interpretation,
      createdAt: data.created_at,
      viewUrl: `https://chatju.pages.dev/reading/${data.id}`,
      metadata: {
        birthDate: data.birth_date,
        birthTime: data.birth_time,
        gender: data.gender,
        language: data.language,
        subjectName: data.subject_name,
      },
    };

  } catch (error) {
    console.error('[Saju Service] Error fetching reading:', error);
    throw error;
  }
}

/**
 * Get all readings for a user
 *
 * @param {string} userId - User ID
 * @param {number} limit - Max number of readings to return
 * @returns {Promise<Array>} List of readings
 */
async function getUserReadings(userId, limit = 20) {
  try {
    const { data, error } = await supabaseAdmin
      .from('readings')
      .select('id, birth_date, gender, language, product_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw handleSupabaseError(error);
    }

    return data || [];

  } catch (error) {
    console.error('[Saju Service] Error fetching user readings:', error);
    throw error;
  }
}

/**
 * Generate AI preview/teaser (shorter version for free users)
 * NOW WITH PARENT-CHILD RELATIONSHIP FOCUS
 *
 * @param {Object} childManseryeok - Child's Four Pillars from mansae-calculator
 * @param {Object} parentManseryeok - Parent's Four Pillars (optional)
 * @param {string} parentRole - 'mother' or 'father'
 * @param {string} language - Target language
 * @param {boolean} childTimeUnknown - Whether child's birth time is unknown
 * @returns {Promise<Object>} AI preview (truncated)
 */
async function generateAIPreview(childManseryeok, parentManseryeok = null, parentRole = null, language = 'ko', childTimeUnknown = false) {
  const { pillars: childPillars, elements: childElements } = childManseryeok;

  // Get dominant elements for quick reference
  const getStrongestElement = (elements) => {
    return Object.entries(elements).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  };

  const childDominant = getStrongestElement(childElements);

  let parentInfo = '';
  let relationshipAnalysis = '';

  if (parentManseryeok) {
    const parentDominant = getStrongestElement(parentManseryeok.elements);
    const parentLabel = parentRole === 'mother' ? '엄마' : '아빠';

    parentInfo = `
**${parentLabel} 사주 (궁합 분석용):**
- 일주(日柱): ${parentManseryeok.pillars.day.korean} (${parentManseryeok.pillars.day.element})
- 주 오행: ${parentDominant} (${parentManseryeok.elements[parentDominant]}개)
`;

    relationshipAnalysis = `
3. **부모-자녀 관계 힌트** (2문장): ${parentLabel}(${parentDominant} 기질)과 아이(${childDominant} 기질)의 관계에서 가장 자주 발생하는 갈등 패턴 1가지만 짧게. 구체적 해결 방법은 언급하지 말고 "왜 부딪히는지"만 설명.
4. **프리미엄 티저** (1문장): "상세 리포트에서는 이 아이만의 행동 시그니처, 6가지 상황별 대응 스크립트, 7일 양육 실험까지 확인할 수 있습니다." 라고 마무리.`;
  }

  const timeDisclaimer = childTimeUnknown
    ? '\n**참고: 아이의 출생 시간을 모르므로 시주(時柱)는 제외하고 년/월/일 세 기둥만으로 분석합니다.**\n'
    : '';

  // Language names for preview prompt (premium uses langNameMap defined later)
  const previewLangNames = { en: 'English', ja: 'Japanese', zh: 'Chinese', vi: 'Vietnamese', id: 'Indonesian', es: 'Spanish', pt: 'Portuguese', fr: 'French', th: 'Thai' };
  const previewOutputLang = previewLangNames[language] || 'English';
  const languageInstruction = language !== 'ko' ? `\n**Write ALL output in ${previewOutputLang}. Translate Korean terms into ${previewOutputLang}. Show Chinese characters in parentheses. No Korean text in the output.**\n` : '';

  const prompt = `당신은 20년 경력의 아동 심리 전문 사주 상담사입니다.
부모가 아이를 더 잘 이해하고, 갈등을 줄일 수 있도록 도와주세요.
${timeDisclaimer}${languageInstruction}

**아이 사주팔자:**
- 년주(年柱): ${childPillars.year.korean} (${childPillars.year.element})
- 월주(月柱): ${childPillars.month.korean} (${childPillars.month.element})
- 일주(日柱): ${childPillars.day.korean} (${childPillars.day.element}) - 일간(日干) 중심
- 시주(時柱): ${childPillars.hour?.korean ? `${childPillars.hour.korean} (${childPillars.hour.element})` : '출생 시간 미상 — 시주 제외'}

**아이 오행 분포:**
${Object.entries(childElements).map(([elem, count]) => `- ${elem}: ${count}개`).join('\n')}
${parentInfo}

**분석 요청 (미리보기 - 관계 중심):**
1. **이 아이의 핵심 기질** (2문장): 타고난 성향과 에너지 방향
2. **부모가 가장 오해하기 쉬운 점** (2문장): "이래서 그랬구나" 싶은 행동의 진짜 이유
${parentManseryeok ? relationshipAnalysis : `3. **한 줄 양육 조언** (1문장): 이 기질의 아이에게 가장 중요한 것`}

**작성 원칙:**
- "아이를 분석"하는 게 아니라 "관계를 이해"하는 관점
- 부모의 죄책감을 덜어주는 따뜻한 톤
- 추상적 설명 대신 구체적 상황/예시
- 핵심 기질과 오해 포인트는 구체적으로, 하지만 "구체적 해결법/대화법"은 절대 주지 말 것
- 읽으면 "아, 그래서 그랬구나!"는 느끼지만 "그래서 어떻게 해야 하지?"가 궁금하게 끝나야 함
- 마지막에 상세 리포트 티저를 자연스럽게
- 총 5-7문장`;

  try {
    console.log('[Saju Service] Calling AI service for relationship-focused preview...');

    const previewSystemKo = `당신은 부모-자녀 관계 전문 사주 상담사입니다.

**명리학 철학 (반드시 준수):**
- 사주(四柱)는 타고난 기질(命, 명)을 보여줄 뿐, 운명을 결정하지 않습니다.
- 같은 사주를 가진 사람도 환경(運, 운)에 따라 전혀 다른 삶을 삽니다.
- "좋은 사주/나쁜 사주"라는 이분법은 존재하지 않습니다. 완벽한 사주는 없고, 모든 사주에는 고유한 강점과 성장 포인트가 있습니다.
- 목표는 "아이 이해"가 아니라 "관계 갈등 해결"입니다.

**톤:**
- 부모의 답답함, 죄책감, 불안을 공감하면서 실질적 조언 제공
- 점술 용어 남발 금지, 일상 언어로 설명
- 삼재, 원진살 등 공포 마케팅 소재 사용 금지`;

    const previewSystemEn = `You are a parent-child relationship specialist using Saju (Four Pillars) analysis.

**CRITICAL: Write the ENTIRE preview in ${previewOutputLang}.** All text must be in ${previewOutputLang}. Translate Korean terms. Show Chinese characters in parentheses. No Korean text in the output.

**Myeongri Philosophy (must follow):**
- Saju (四柱) reveals innate temperament, it does NOT determine destiny.
- People with the same Saju live completely different lives depending on environment.
- There is no "good Saju / bad Saju." Every chart has unique strengths and growth areas.
- The goal is resolving relationship friction, not just understanding the child.

**Tone:**
- Empathize with parents' frustration, guilt, and anxiety while providing practical insight
- No fortune-telling jargon — explain in everyday language
- No fear-based concepts (samjae, wonjinsal, etc.)`;

    const result = await aiService.generateFortune([
      {
        role: 'system',
        content: language === 'ko' ? previewSystemKo : previewSystemEn,
      },
      {
        role: 'user',
        content: prompt,
      },
    ], {
      maxTokens: 1200, // GPT-5.4-mini uses reasoning tokens within this budget
      temperature: 0.7,
    });

    const previewText = result.content || '';

    if (!previewText) {
      console.warn('[Saju Service] AI returned empty preview content, provider:', result.provider);
    }

    console.log('[Saju Service] Relationship preview received:', {
      length: previewText.length,
      tokens: result.tokensUsed,
      provider: result.provider,
      hasParentData: !!parentManseryeok,
    });

    return {
      shortText: previewText,
      sections: parsePreviewSections(previewText),
      metadata: {
        provider: result.provider,
        model: result.model,
        tokens: result.tokensUsed,
        generatedAt: new Date().toISOString(),
        isPreview: true,
        hasParentAnalysis: !!parentManseryeok,
      },
    };

  } catch (error) {
    console.error('[Saju Service] Error generating AI preview:', error);
    throw new Error(`Failed to generate preview: ${error.message}`);
  }
}

/**
 * Describe the parent-child element relationship in plain Korean
 */
function getParentChildRelation(parentElement, childElement) {
  const relations = {
    목: { generates: '화', isGeneratedBy: '수', controls: '토', isControlledBy: '금' },
    화: { generates: '토', isGeneratedBy: '목', controls: '금', isControlledBy: '수' },
    토: { generates: '금', isGeneratedBy: '화', controls: '수', isControlledBy: '목' },
    금: { generates: '수', isGeneratedBy: '토', controls: '목', isControlledBy: '화' },
    수: { generates: '목', isGeneratedBy: '금', controls: '화', isControlledBy: '토' },
  };

  const rel = relations[parentElement];
  if (!rel) return '관계 분석 불가';

  if (parentElement === childElement) {
    return `동일 오행(${parentElement}×${childElement}) — 서로 이해가 빠르지만 같은 약점도 공유. 부모가 자신의 단점을 아이에게서 발견하면 과잉 반응할 수 있음.`;
  } else if (rel.generates === childElement) {
    return `상생 관계: 부모(${parentElement})가 아이(${childElement})를 자연스럽게 키워줌 — 부모가 에너지를 주는 쪽. 과보호 경향 주의.`;
  } else if (rel.isGeneratedBy === childElement) {
    return `역상생 관계: 아이(${childElement})가 부모(${parentElement})에게 에너지를 줌 — 부모가 아이에게 의지하는 구조가 될 수 있음. 아이의 부담감 주의.`;
  } else if (rel.controls === childElement) {
    return `상극 관계: 부모(${parentElement})가 아이(${childElement})를 무의식적으로 억누를 수 있음 — 훈육이 아닌 통제가 되지 않도록 주의. 아이의 자존감 보호 필요.`;
  } else if (rel.isControlledBy === childElement) {
    return `역상극 관계: 아이(${childElement})의 에너지가 부모(${parentElement})를 압도할 수 있음 — 부모가 아이에게 끌려다니는 느낌. 부모의 중심 잡기 필요.`;
  }
  return '관계 분석 불가';
}

/**
 * Generate PREMIUM AI interpretation - Parent-Child Relationship Focus
 * This is the paid report that parents will pay for.
 *
 * Key value propositions:
 * 1. 갈등 패턴 진단 - Why do we keep fighting?
 * 2. 훈육 가이드 - When to be firm vs flexible
 * 3. 대화 스크립트 - Exact phrases to use
 * 4. 죄책감 해소 - It's not your fault
 * 5. 실천 과제 - What to do TODAY
 *
 * @param {Object} childManseryeok - Child's Four Pillars
 * @param {Object} parentManseryeok - Parent's Four Pillars (optional but recommended)
 * @param {string} parentRole - 'mother' or 'father'
 * @param {string} language - Target language
 * @param {string} productType - 'basic' or 'deluxe'
 * @param {boolean} childTimeUnknown - Whether child's birth time is unknown
 * @returns {Promise<Object>} AI interpretation with relationship focus
 */
async function generateAIInterpretation(childManseryeok, parentManseryeok = null, parentRole = null, language = 'ko', productType = 'basic', childTimeUnknown = false, fortuneCycles = null, twinInfo = null, childName = '아이') {
  const { pillars: childPillars, elements: rawElements } = childManseryeok;

  // Normalize element keys to Korean (mansae-wrapper returns English keys)
  const ELEMENT_KEY_MAP = { wood: '목', fire: '화', earth: '토', metal: '금', water: '수' };
  const childElements = {};
  for (const [key, value] of Object.entries(rawElements)) {
    childElements[ELEMENT_KEY_MAP[key] || key] = value;
  }

  // 일간(日干) natural imagery mapping
  const dayMasterImagery = {
    '갑': '큰 나무(갑목) — 하늘을 향해 곧게 자라는 거목. 위로 뻗으려는 에너지가 강하고, 꺾이기보다 부러지는 타입.',
    '을': '작은 풀/넝쿨(을목) — 바람에 유연하게 휘어지지만 절대 뿌리째 뽑히지 않는 생명력. 부드러우나 끈질김.',
    '병': '태양(병화) — 세상을 밝히는 뜨거운 태양. 숨기지 못하는 솔직함, 주변을 밝히지만 너무 가까이 오면 뜨거움.',
    '정': '촛불/별(정화) — 은은하게 타오르는 내면의 불꽃. 섬세하고 따뜻하지만, 바람에 흔들리기 쉬움.',
    '무': '산/대지(무토) — 묵직하고 든든한 큰 산. 쉽게 흔들리지 않는 안정감, 하지만 한번 마음먹으면 움직이지 않는 고집.',
    '기': '논밭/정원(기토) — 모든 것을 품어 기르는 기름진 땅. 실용적이고 포용력 있지만, 자기 것에 집착할 수 있음.',
    '경': '바위/도검(경금) — 단단하고 예리한 원석. 결단력과 의리가 강하지만, 때로 지나치게 날카로움.',
    '신': '보석/귀금속(신금) — 세공된 금속처럼 정밀하고 섬세함. 완벽주의 성향, 자존심이 높음.',
    '임': '큰 강/바다(임수) — 도도하게 흐르는 대하. 지혜롭고 포용력 있지만, 감정의 파도가 깊음.',
    '계': '빗물/이슬(계수) — 스며들고 적시는 이슬비. 직관적이고 섬세하지만, 불안과 걱정이 쉽게 스며듦.',
  };

  // Five element traits — expanded with parenting context
  const elementTraits = {
    '목': { name: '나무(木)', traits: '성장 지향, 유연함, 새로운 시도, 계획형', stress: '압박/통제/구속', needs: '기다림, 격려, 자유, 스스로 결정할 기회', parentTip: '이 아이를 나무에 비유하면, 부모는 적절한 물과 햇빛을 제공하는 역할입니다. 가지를 자르려 하면 반발합니다.' },
    '화': { name: '불(火)', traits: '열정, 표현력, 활동적, 즉흥적', stress: '무시/억압/칭찬 부재', needs: '인정, 발산 기회, 즉각 반응, 관객', parentTip: '불은 산소가 있어야 타오릅니다. 이 아이의 산소는 "관심"과 "반응"입니다. 무반응이 가장 큰 벌입니다.' },
    '토': { name: '흙(土)', traits: '안정 추구, 신뢰형, 실용적, 소유욕', stress: '변화/불안정/약속 파기', needs: '예측 가능성, 루틴, 안전감, 일관성', parentTip: '흙은 단단한 지반이 필요합니다. 갑작스러운 변화나 불일치한 규칙은 이 아이를 크게 흔듭니다.' },
    '금': { name: '쇠(金)', traits: '논리적, 완벽주의, 명확함, 원칙형', stress: '모호함/실패/불공정', needs: '명확한 기준, 성취감, 인정, 공정한 대우', parentTip: '쇠는 담금질을 통해 강해집니다. 적절한 도전과 명확한 기준 제시가 성장의 열쇠입니다.' },
    '수': { name: '물(水)', traits: '지혜, 적응력, 감성, 관찰형', stress: '정서 불안/소외감/고립', needs: '공감, 정서적 안정, 경청, 함께하는 시간', parentTip: '물은 그릇의 모양을 따릅니다. 환경의 영향을 가장 많이 받는 기질이므로, 안정적인 정서 환경이 핵심입니다.' },
  };

  // Deep 일간(Day Master) reference knowledge — sourced from 명리학 교재
  // Used to feed rich, grounded context into the AI prompt
  const dayMasterDeepProfile = {
    '갑': { nature: '양목(陽木)', image: '큰 나무, 거목, 소나무', season: '봄', direction: '동쪽', color: '청색/녹색', strengths: '추진력, 정의감, 리더십, 진취성', weaknesses: '고집, 독선, 융통성 부족', health: '간, 담, 근육, 신경계', career: '경영, 정치, 법조, 교육, 건축', childTrait: '자기 주장이 강하고 리더 역할을 하려 함. 규칙보다 자기 방식을 선호. 꺾으려 하면 더 강해짐.', parentAdvice: '방향만 제시하고 스스로 결정하게 하라. "하지 마"보다 "어떻게 하고 싶어?"가 효과적.' },
    '을': { nature: '음목(陰木)', image: '넝쿨, 잔디, 꽃, 덩굴', season: '봄', direction: '동쪽', color: '연두색/초록색', strengths: '적응력, 사교성, 인내력, 협상력', weaknesses: '의존성, 우유부단, 눈치 과다', health: '간, 담, 알레르기, 피부', career: '예술, 디자인, 외교, 상담, 서비스', childTrait: '눈치가 빠르고 분위기에 민감. 겉으로는 순응하지만 속으로 불만을 쌓을 수 있음.', parentAdvice: '감정을 표현할 안전한 공간을 만들어라. 칭찬에 민감하므로 작은 것도 인정해줄 것.' },
    '병': { nature: '양화(陽火)', image: '태양, 용광로, 큰 불', season: '여름', direction: '남쪽', color: '빨간색/주황색', strengths: '밝음, 열정, 솔직함, 카리스마', weaknesses: '급한 성격, 지속력 부족, 과시욕', health: '심장, 소장, 혈압, 눈', career: '방송, 마케팅, 영업, 교육, 예체능', childTrait: '에너지가 넘치고 주목받고 싶어 함. 감정 표현이 즉각적이고 과장됨.', parentAdvice: '에너지를 발산할 채널을 만들어라. 억누르면 폭발. 짧게 집중하고 자주 쉬게 할 것.' },
    '정': { nature: '음화(陰火)', image: '촛불, 별빛, 등불', season: '여름', direction: '남쪽', color: '분홍색/보라색', strengths: '섬세함, 감성, 예술적 감각, 따뜻함', weaknesses: '감정 기복, 예민함, 질투심', health: '심장, 혈액순환, 시력', career: '문학, 음악, 미술, 심리상담, 요리', childTrait: '감정이 풍부하고 눈물이 많을 수 있음. 분위기와 말투에 매우 민감.', parentAdvice: '감정을 부정하지 말라. "울지 마" 대신 "많이 속상했구나". 예술/음악 활동이 정서 안정에 도움.' },
    '무': { nature: '양토(陽土)', image: '큰 산, 바위산, 대지', season: '환절기', direction: '중앙', color: '갈색/황토색', strengths: '신뢰감, 포용력, 안정감, 책임감', weaknesses: '고집, 변화 거부, 게으름', health: '위장, 비장, 소화기', career: '부동산, 농업, 건설, 공무원, 관리직', childTrait: '느리지만 한번 시작하면 꾸준함. 변화를 싫어하고 예측 가능한 환경을 선호.', parentAdvice: '충분한 시간을 주고 재촉하지 말라. 루틴과 일관성이 이 아이의 안전지대.' },
    '기': { nature: '음토(陰土)', image: '논밭, 정원, 화분의 흙', season: '환절기', direction: '중앙', color: '노란색/베이지', strengths: '실용적, 양육적, 섬세한 배려, 현실감', weaknesses: '소유욕, 집착, 걱정 과다', health: '위장, 비장, 당뇨', career: '교육, 의료, 복지, 요식업, 유통', childTrait: '돌봄 본능이 있고 동생이나 동물을 잘 챙김. 자기 물건/영역에 대한 소유욕 강함.', parentAdvice: '"네 거야"라는 안정감을 주면서 나눔의 경험을 자연스럽게. 음식과 요리가 좋은 유대 활동.' },
    '경': { nature: '양금(陽金)', image: '바위, 원석, 칼, 도끼', season: '가을', direction: '서쪽', color: '흰색/은색', strengths: '결단력, 의리, 정의감, 실행력', weaknesses: '날카로움, 융통성 부족, 외로움', health: '폐, 대장, 호흡기, 피부', career: '법조, 군인, 의사, 엔지니어, IT', childTrait: '옳고 그름이 명확하고 불공정에 강하게 반응. 감정 표현은 서툴지만 속정은 깊음.', parentAdvice: '규칙은 명확하되 공정하게. 불공정하다고 느끼면 절대 따르지 않음. 논리적 설명이 효과적.' },
    '신': { nature: '음금(陰金)', image: '보석, 귀금속, 바늘, 가위', season: '가을', direction: '서쪽', color: '흰색/크림색', strengths: '정밀함, 미적 감각, 자존심, 분석력', weaknesses: '완벽주의, 비판적, 자존심 상처에 약함', health: '폐, 대장, 피부, 치아', career: '보석, 패션, 금융, 분석, 프로그래밍', childTrait: '자존심이 높고 실수를 인정하기 어려워함. 외모와 소유물에 관심이 많을 수 있음.', parentAdvice: '공개적 망신 절대 금지. 조용히 1:1로 피드백. 노력 과정을 칭찬하면 완벽주의가 건강한 방향으로.' },
    '임': { nature: '양수(陽水)', image: '바다, 큰 강, 호수, 지하수', season: '겨울', direction: '북쪽', color: '검은색/남색', strengths: '포용력, 통찰력, 전략적 사고, 유연성, 갈등 조정력', weaknesses: '우유부단, 방향 상실, 에너지 분산, 수동성', health: '신장, 방광, 비뇨기, 생식기, 만성 피로', career: '교육, 연구, 외교, 상담, 미디어, 기획', childTrait: '겉으로는 조용하고 차분해 보이지만 속으로는 생각과 감정의 흐름이 바다처럼 깊고 넓음. 한번 납득하면 오래 가지만, 납득 안 되면 겉으로는 조용히 속으로 강하게 저항. 다양한 것에 관심이 분산되기 쉬움.', parentAdvice: '방향을 정해주되 물길을 막지는 말 것. "이렇게 해"보다 "어디로 가고 싶어?"가 효과적. 충분한 생각 정리 시간을 주고 바로 답을 요구하지 말 것.' },
    '계': { nature: '음수(陰水)', image: '빗물, 이슬, 안개, 시냇물', season: '겨울', direction: '북쪽', color: '검은색/회색', strengths: '직관력, 감수성, 치유 능력, 스며드는 영향력', weaknesses: '불안, 걱정 과다, 의심, 감정에 휩쓸림', health: '신장, 방광, 냉증, 불면', career: '심리, 종교, 예술, 의료, 연구', childTrait: '눈에 보이지 않는 것을 잘 느낌. 직관적이고 상대방 감정을 흡수하기 쉬움. 혼자만의 시간이 반드시 필요.', parentAdvice: '감정의 스펀지 같은 아이. 부모의 감정 상태가 바로 전달되므로 부모 자신의 정서 관리가 먼저. 자연(특히 물가)에서의 시간이 치유.' },
  };

  // 오행 색상/음식/방향/활동 — 색채 명리학 및 교재 기반
  const elementRemedies = {
    '목': { colors: '파란색, 초록색, 연두색', foods: '시금치, 브로콜리 등 녹색 채소, 신맛 과일(귤, 레몬), 콩나물', activities: '등산, 산책, 원예, 그림 그리기, 목공', direction: '동쪽', season: '봄', body: '간, 담, 근육, 눈', avoidExcess: '과도한 성장 압박, 지나친 경쟁 환경' },
    '화': { colors: '빨간색, 주황색, 보라색', foods: '토마토, 당근, 붉은 과일, 쓴맛 식품(녹차, 쑥)', activities: '달리기, 무용, 연극, 발표, 체육 활동', direction: '남쪽', season: '여름', body: '심장, 소장, 혈액', avoidExcess: '과도한 자극, 수면 부족, 미디어 과다 노출' },
    '토': { colors: '노란색, 갈색, 베이지, 황토색', foods: '고구마, 감자, 호박, 단맛 식품, 현미', activities: '요리, 도예, 정리정돈, 텃밭 가꾸기, 보드게임', direction: '중앙', season: '환절기', body: '위장, 비장, 소화기', avoidExcess: '급격한 환경 변화, 일관성 없는 규칙' },
    '금': { colors: '흰색, 은색, 회색, 크림색', foods: '배, 무, 양파, 흰쌀밥, 매운맛 식품(도라지, 생강)', activities: '퍼즐, 레고, 악기 연습, 글쓰기, 프로그래밍', direction: '서쪽', season: '가을', body: '폐, 대장, 호흡기, 피부', avoidExcess: '모호한 기준, 불공정한 대우, 공개적 비판' },
    '수': { colors: '검은색, 남색, 진한 파란색', foods: '미역, 해조류, 검은콩, 짠맛 식품, 두부', activities: '수영, 독서, 명상, 일기 쓰기, 자연 탐험', direction: '북쪽', season: '겨울', body: '신장, 방광, 비뇨기', avoidExcess: '정서적 고립, 과도한 걱정/불안 환경' },
  };

  // Get dominant and weak elements
  const getStrongestElement = (elements) => Object.entries(elements).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  const getWeakestElement = (elements) => Object.entries(elements).reduce((a, b) => a[1] < b[1] ? a : b)[0];

  const childDominant = getStrongestElement(childElements);
  const childWeak = getWeakestElement(childElements);
  const childTraits = elementTraits[childDominant];

  // Determine 신강/신약 — enhanced with 월령(月令) consideration
  const dayStem = childPillars.day.korean[0]; // First char = heavenly stem
  const { STEM_ELEMENT, BRANCH_ELEMENT } = require('../utils/mansae-wrapper');
  const dayMasterElement = STEM_ELEMENT[dayStem]; // 일간의 오행
  const monthBranch = childPillars.month.korean[1]; // 월지
  const monthBranchElement = BRANCH_ELEMENT[monthBranch];

  // 월령 득령 여부 (일간이 월지에서 힘을 얻는가?)
  const ELEMENT_RELATIONS = {
    목: { generates: '화', isGeneratedBy: '수', controls: '토', isControlledBy: '금' },
    화: { generates: '토', isGeneratedBy: '목', controls: '금', isControlledBy: '수' },
    토: { generates: '금', isGeneratedBy: '화', controls: '수', isControlledBy: '목' },
    금: { generates: '수', isGeneratedBy: '토', controls: '목', isControlledBy: '화' },
    수: { generates: '목', isGeneratedBy: '금', controls: '화', isControlledBy: '토' },
  };
  const monthSupports = dayMasterElement === monthBranchElement || ELEMENT_RELATIONS[dayMasterElement]?.isGeneratedBy === monthBranchElement;

  // Count supporting elements (same as day master + elements that generate day master)
  const supportCount = (childElements[dayMasterElement] || 0) + (childElements[ELEMENT_RELATIONS[dayMasterElement]?.isGeneratedBy] || 0);
  const totalElements = Object.values(childElements).reduce((s, v) => s + v, 0);
  const isStrong = monthSupports && supportCount >= Math.ceil(totalElements / 2);
  const strengthLabel = isStrong ? '신강(身強)' : '신약(身弱)';
  const strengthDesc = isStrong
    ? '월령에서 힘을 얻어 에너지가 강합니다. 자기 주장이 뚜렷하고 추진력이 있지만, 고집과 독선에 주의.'
    : '월령의 지원이 약해 외부 도움을 필요로 합니다. 섬세하고 적응력이 좋지만, 자신감과 독립성을 키워줘야 합니다.';
  const dayMasterDesc = dayMasterImagery[dayStem] || `${dayStem}일간`;
  const deepProfile = dayMasterDeepProfile[dayStem] || {};
  const weakElementRemedies = elementRemedies[childWeak] || {};
  const dominantElementRemedies = elementRemedies[childDominant] || {};

  const timeDisclaimer = childTimeUnknown
    ? '\n**참고: 출생 시간 미상으로 시주(時柱)는 제외하고 년/월/일 세 기둥(6자)만으로 분석합니다. 시주를 임의로 추정하지 마세요.**\n'
    : '';

  // Calculate child's current age for age-appropriate guidance
  const birthYear = parseInt(childManseryeok.input.birthDate.split('-')[0]);
  const currentYear = new Date().getFullYear();
  const childAge = currentYear - birthYear + 1; // Korean age
  const ageGroup = childAge <= 3 ? '영유아(0~3세)'
    : childAge <= 7 ? '유아기(4~7세)'
    : childAge <= 10 ? '초등 저학년(8~10세)'
    : childAge <= 13 ? '초등 고학년(11~13세)'
    : childAge <= 16 ? '중학생(14~16세)'
    : childAge <= 19 ? '고등학생(17~19세)'
    : '성인';

  // 비한국어 지시문에서 쓰는 영어 연령 구간 라벨. 한국어 ageGroup을 그대로 끼워 넣으면
  // 모델이 그 한국어를 출력에 옮겨 쓰는 일이 생긴다.
  const ageGroupEn = childAge <= 3 ? 'infant/toddler (0-3)'
    : childAge <= 7 ? 'preschool (4-7)'
    : childAge <= 10 ? 'lower elementary (8-10)'
    : childAge <= 13 ? 'upper elementary (11-13)'
    : childAge <= 16 ? 'middle school (14-16)'
    : childAge <= 19 ? 'high school (17-19)'
    : 'adult';

  // Build parent section using 육친 framework — ENHANCED
  let parentSection = '';
  let parentDominant = null;

  if (parentManseryeok) {
    // Normalize parent element keys to Korean
    const parentElements = {};
    for (const [key, value] of Object.entries(parentManseryeok.elements)) {
      parentElements[ELEMENT_KEY_MAP[key] || key] = value;
    }
    parentDominant = getStrongestElement(parentElements);
    const parentWeak = getWeakestElement(parentElements);
    const parentTraits = elementTraits[parentDominant];
    const parentLabel = parentRole === 'mother' ? '엄마' : '아빠';
    const parentDayStem = parentManseryeok.pillars.day.korean[0];
    const parentDayMasterElement = STEM_ELEMENT[parentDayStem];
    const parentDayDesc = dayMasterImagery[parentDayStem] || `${parentDayStem}일간`;

    // 부모-자녀 일간 관계 (육친)
    const parentChildRelation = getParentChildRelation(parentDayMasterElement, dayMasterElement);

    parentSection = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👨‍👩‍👧 ${parentLabel} 사주 데이터 (관계 분석용)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**${parentLabel} 사주팔자:**
| 구분 | 천간 | 지지 | 오행 |
|------|------|------|------|
| 년주 | ${parentManseryeok.pillars.year.korean[0]} | ${parentManseryeok.pillars.year.korean[1]} | ${parentManseryeok.pillars.year.element} |
| 월주 | ${parentManseryeok.pillars.month.korean[0]} | ${parentManseryeok.pillars.month.korean[1]} | ${parentManseryeok.pillars.month.element} |
| 일주 | ${parentManseryeok.pillars.day.korean[0]} | ${parentManseryeok.pillars.day.korean[1]} | ${parentManseryeok.pillars.day.element} |
| 시주 | ${parentManseryeok.pillars.hour.korean[0]} | ${parentManseryeok.pillars.hour.korean[1]} | ${parentManseryeok.pillars.hour.element} |

**${parentLabel} 일간:** ${parentDayDesc}
**${parentLabel} 주 오행:** ${parentDominant} (${parentTraits.name})
**${parentLabel} 부족 오행:** ${parentWeak} (${elementTraits[parentWeak].name})
**${parentLabel} 기질:** ${parentTraits.traits}
**${parentLabel} 스트레스 요인:** ${parentTraits.stress}

**${parentLabel} 오행 분포:**
${Object.entries(parentElements).map(([k, v]) => `- ${k}: ${v}개${v >= 3 ? ' ▶ 강함' : v === 0 ? ' ▶ 없음!' : ''}`).join('\n')}

**부모-자녀 오행 관계:**
- ${parentLabel} 일간(${parentDayMasterElement}) × 아이 일간(${dayMasterElement}): ${parentChildRelation}
- 양육 팁: ${parentTraits.parentTip}
`;
  }

  // Build twin context if applicable
  const twinSection = buildMultipleBirthSection(twinInfo);

  // 교재 기반 명리 근거 — 계산된 원국에 실제로 해당하는 조각만 결정론적으로 선별한다.
  // 지식은 한국어로 주입되고 출력 언어는 아래 language 지시가 결정하므로 전 언어에 적용된다.
  // 언어 허용 목록: 지식은 한국어로 주입되는데, 한국어와 가까운 표기 체계를 쓰는
  // 언어(특히 일본어)에서는 모델이 주입된 한국어를 그대로 출력에 섞어 쓴다.
  // 측정 결과 일본어 리포트의 한글 비율이 5.4%(미주입) → 56.1%(주입)로 치솟았다.
  // 검증된 언어만 켜고, 나머지는 언어별로 검증한 뒤 하나씩 추가한다.
  const KNOWLEDGE_LANGUAGES = new Set(
    (process.env.SAJU_KNOWLEDGE_LANGUAGES || 'ko').split(',').map((x) => x.trim()).filter(Boolean)
  );

  let knowledgeContext = '';
  try {
    if (process.env.SAJU_KNOWLEDGE_DISABLED === '1') throw new Error('disabled by SAJU_KNOWLEDGE_DISABLED');
    if (!KNOWLEDGE_LANGUAGES.has(language)) throw new Error(`knowledge not enabled for language=${language}`);
    const knowledge = buildKnowledgeContext({
      childManseryeok,
      parentManseryeok,
      parentRole,
      childAge,
    });
    knowledgeContext = knowledge.text;
    console.log('[Saju Service] Knowledge context selected:', {
      chars: knowledgeContext.length,
      ...knowledge.selected,
    });
  } catch (err) {
    // 지식 주입 실패가 리포트 생성 자체를 막아서는 안 된다
    console.error('[Saju Service] Knowledge context build failed, continuing without it:', err.message);
  }
  const premiumLocale = getPremiumPresentationLocale(language);
  const langNameMap = { ko: 'Korean', en: 'English', ja: 'Japanese', zh: 'Chinese', vi: 'Vietnamese', id: 'Indonesian', es: 'Spanish', pt: 'Portuguese', fr: 'French', th: 'Thai' };
  const outputLangName = langNameMap[language] || 'English';
  const premiumLabels = premiumLocale.labels;
  const exactLabelContract = `
**Premium structured label contract**
Use these exact labels in ${outputLangName}. Do not substitute synonyms. Do not leave any label in Korean unless the report language is Korean.
- Section 1 labels: ${premiumLabels.s1.map((x) => `**${x}:**`).join(' / ')}
- Section 2 labels: ${premiumLabels.s2.map((x) => `**${x}:**`).join(' / ')}
- Section 3 labels: ${premiumLabels.s3.map((x) => `**${x}:**`).join(' / ')}
- Section 4 labels: ${premiumLabels.s4.map((x) => `**${x}:**`).join(' / ')}
- Section 5 labels: ${premiumLabels.s5.map((x) => `**${x}:**`).join(' / ')}
- Section 6 labels: ${premiumLabels.s6.map((x) => `**${x}:**`).join(' / ')}
- Section 7 labels: ${premiumLabels.s7.map((x) => `**${x}:**`).join(' / ')}
- Section 8 headings: ${premiumLabels.s8.map((x) => `[${x}]`).join(' / ')}
- Section 9 labels: ${premiumLabels.s9.map((x) => `**${x}:**`).join(' / ')}
`;

  // Language instruction for non-Korean reports
  // Note: for premium reports, the system message (systemMessageBaseEn) already
  // includes the output language instruction. This is kept as a user-prompt
  // reinforcement for the data context sections.
  const languageInstruction = language !== 'ko' ? `\n**Reminder: Write ALL output in ${outputLangName}. Translate Korean terms from the data below into ${outputLangName}. Show Chinese characters in parentheses. No Korean text in the output.**\n` : '';

  // Build solar time correction context for AI
  let correctionNote = '';
  if (childManseryeok.corrections?.applied) {
    correctionNote = `
**진태양시 보정:** ${childManseryeok.corrections.note}
${childManseryeok.corrections.adjustedTime ? `**보정된 출생 시각:** ${childManseryeok.corrections.adjustedTime}` : ''}
${childManseryeok.corrections.isSouthernHemisphere ? '**남반구 출생 → 남반구 만세력 적용 (계절 에너지 반전)**' : ''}
`;
  }

  // Build fortune cycles context
  let fortuneCyclesSection = '';
  if (fortuneCycles) {
    const currentDaeun = fortuneCycles.currentDaeun;
    const currentSeun = fortuneCycles.currentSeun;
    const daeunList = fortuneCycles.daeunList || [];

    // Detect 아홉수 (대운 transition year)
    let transitionNote = '';
    if (currentDaeun) {
      const yearsIntoDaeun = fortuneCycles.currentAge - currentDaeun.ageStart;
      if (yearsIntoDaeun >= 8) {
        transitionNote = '\n⚠️ **대운 전환기 (아홉수):** 현재 대운의 마지막 해에 가까워 환경 전환기입니다. 환절기에 감기 걸리기 쉽듯, 이 시기에는 적응과 준비가 필요합니다. 불행이 아닌 변화의 신호로 해석하세요.';
      }
    }

    fortuneCyclesSection = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔮 대운/세운 데이터
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**현재 나이:** ${fortuneCycles.currentAge}세
**현재 대운:** ${currentDaeun ? `${currentDaeun.pillar?.korean || '?'} (${currentDaeun.startAge}~${currentDaeun.endAge}세)` : '정보 없음'}
**현재 세운(올해):** ${currentSeun ? `${currentSeun.pillar?.korean || '?'} (${currentSeun.year}년)` : '정보 없음'}
**향후 대운 흐름:** ${daeunList.slice(0, 4).map(d => `${d.pillar?.korean || '?'}(${d.startAge}세)`).join(' → ')}
${transitionNote}

**참고 — 대운/세운 해석 원칙:**
- 대운(大運)의 '大'는 행운의 크기가 아니라 시간 규모(10년)입니다.
- 대운은 삶의 무대 배경이 바뀌는 것이지, 좋은 일이 자동으로 생기는 것이 아닙니다.
- 실제 사건과 결과는 세운(歲運, 연운)에서 구체화됩니다.
- 아홉수(대운 전환기)는 불행이 아닌 적응기입니다.
`;
  }

  // Get secondary element
  const getSecondElement = (elements) => {
    const sorted = Object.entries(elements).sort((a, b) => b[1] - a[1]);
    return sorted[1] ? sorted[1][0] : null;
  };
  const childSecond = getSecondElement(childElements);
  const childSecondTraits = childSecond ? elementTraits[childSecond] : null;

  // Build monthly fortune data for Section 6
  let monthlyFortuneData = '';
  if (fortuneCycles?.currentSeun?.interpretation?.monthlyFortunes) {
    const currentMonth = new Date().getMonth() + 1;
    const relevantMonths = fortuneCycles.currentSeun.interpretation.monthlyFortunes
      .filter(m => m.month >= currentMonth && m.month <= currentMonth + 3);
    if (relevantMonths.length > 0) {
      monthlyFortuneData = `\n**월운 데이터 (AI 참고용):**\n${relevantMonths.map(m =>
        `- ${m.month}월: ${m.pillar.korean}(${m.pillar.stemElement}+${m.pillar.branchElement}) — ${m.tenGod} — ${m.brief}`
      ).join('\n')}\n`;
    }
  }

  // ── Data Context: split into 3 layers (core / fortune / remedy) ──

  // coreDataContext — used by BOTH Call 1 and Call 2
  const coreDataContext = `당신은 아동 기질 해석 전문가이자 개인화된 양육 전략가입니다.
부모가 아이를 더 깊이 이해하고, 관계의 갈등을 줄이고 성장을 돕고 싶어서 찾아왔습니다.

**중요 전제:** 사주는 아이의 타고난 기질(命)을 보여주는 지도이지, 정해진 운명이 아닙니다. 같은 사주를 가진 아이도 부모의 양육(運)에 따라 전혀 다른 사람이 됩니다. 이 리포트는 아이에게 가장 잘 맞는 양육 방향을 찾는 나침반입니다.
${timeDisclaimer}
${correctionNote}
${languageInstruction}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 아이 사주 데이터
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**사주팔자 (四柱八字):**
| 구분 | 천간 | 지지 | 한자 | 오행 |
|------|------|------|------|------|
| 년주 | ${childPillars.year.korean[0]} | ${childPillars.year.korean[1]} | ${childPillars.year.hanja || ''} | ${childPillars.year.element} |
| 월주 | ${childPillars.month.korean[0]} | ${childPillars.month.korean[1]} | ${childPillars.month.hanja || ''} | ${childPillars.month.element} |
| 일주 | ${childPillars.day.korean[0]} | ${childPillars.day.korean[1]} | ${childPillars.day.hanja || ''} | ${childPillars.day.element} |
${childPillars.hour?.korean ? `| 시주 | ${childPillars.hour.korean[0]} | ${childPillars.hour.korean[1]} | ${childPillars.hour.hanja || ''} | ${childPillars.hour.element} |` : '| 시주 | (출생 시간 미상 — 제외) | — | — | — |'}

**일간(日干):** ${dayStem}${childPillars.day.hanja ? '(' + childPillars.day.hanja[0] + ')' : ''} — ${dayMasterDesc}
**일간 상세 프로필:** ${dayStem}${childPillars.day.hanja ? '(' + childPillars.day.hanja[0] + ')' : ''} = ${deepProfile.nature}, 이미지: ${deepProfile.image}, 계절: ${deepProfile.season}
  강점: ${deepProfile.strengths} / 성장 포인트: ${deepProfile.weaknesses}
  아이 특성: ${deepProfile.childTrait}
  양육 팁: ${deepProfile.parentAdvice}
**일주 강약:** ${strengthLabel} — ${strengthDesc}
**현재 나이:** ${childAge}세 (한국 나이) — ${ageGroup}

**오행 분포 (총 ${childPillars.hour?.korean ? 8 : 6}자 중):**
- 목(木): ${childElements['목']}개 ${childElements['목'] >= 3 ? '▶ 강함' : childElements['목'] === 0 ? '▶ 없음!' : ''}
- 화(火): ${childElements['화']}개 ${childElements['화'] >= 3 ? '▶ 강함' : childElements['화'] === 0 ? '▶ 없음!' : ''}
- 토(土): ${childElements['토']}개 ${childElements['토'] >= 3 ? '▶ 강함' : childElements['토'] === 0 ? '▶ 없음!' : ''}
- 금(金): ${childElements['금']}개 ${childElements['금'] >= 3 ? '▶ 강함' : childElements['금'] === 0 ? '▶ 없음!' : ''}
- 수(水): ${childElements['수']}개 ${childElements['수'] >= 3 ? '▶ 강함' : childElements['수'] === 0 ? '▶ 없음!' : ''}

**주 기질:** ${childDominant} (${childTraits.name}) — ${childTraits.traits}
${childSecond && childSecondTraits ? `**부 기질:** ${childSecond} (${childSecondTraits.name}) — ${childSecondTraits.traits}` : ''}
**부족 오행:** ${childWeak} (${elementTraits[childWeak].name}) — ${elementTraits[childWeak].stress}에 취약
${parentSection}
${twinSection}
${knowledgeContext}`;

  // fortuneDataContext — used by Call 2 ONLY (fortune cycles)
  const fortuneDataContext = `${fortuneCyclesSection}
${monthlyFortuneData}`;

  // remedyDataContext — used by Call 2 ONLY (lifestyle remedies)
  const remedyDataContext = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌿 오행 밸런스 데이터
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**부족 오행 (${childWeak}) 보완:**
- 색상: ${weakElementRemedies.colors || '정보 없음'}
- 음식: ${weakElementRemedies.foods || '정보 없음'}
- 활동: ${weakElementRemedies.activities || '정보 없음'}
- 피해야 할 환경: ${weakElementRemedies.avoidExcess || '정보 없음'}

**강한 오행 (${childDominant}) 조절:**
- 과할 때 주의: ${dominantElementRemedies.avoidExcess || '정보 없음'}
- 계절 에너지: ${weakElementRemedies.season || '정보 없음'}이 가장 보완이 필요한 시기`;

  // ── Call 1: Sections 1-5 (Executive summary, misconceptions, behavioral, playbook, strengths) ──
  const call1SectionInstructionsKo = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 개인화된 양육 리포트 (섹션 1~5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**반드시 ## N. 형식을 사용하세요. 제목은 자연스럽게 작성하되, 각 섹션의 포맷을 정확히 따르세요.**

## 1. 아이 한눈에 보기

따뜻한 3문장으로 시작: 이 아이의 일간 기질(${deepProfile.image || ''})을 자연 비유로 소개하되, 바로 일상 행동으로 연결.

그다음 아래 5개 항목으로 구조화. **각 볼드 레이블은 반드시 아래 지정된 리포트 언어 번역만 사용하고, 영어나 대괄호([])는 출력에 절대 포함하지 마세요.** (아래 한국어 예시는 리포트 언어에 맞게 번역해 사용)

- **가장 흔한 오해:** (1문장, 구체적 상황)
- **가장 도움이 되는 것:** (1문장, 실행 가능)
- **피해야 할 말:** — 3개, 각각 이유 포함
- **효과적인 말:** — 3개, 각각 왜 효과적인지
- **이번 달 양육 포커스:** (1문장, 리포트 언어로)

## 2. 이 아이는 ○○이 아닙니다

4-6개 항목. 부모의 흔한 오해를 정면 반박.
각 항목:
- **오해:** "..." (부모가 실제로 생각하는 것)
- **실제:** ... (내면에서 일어나는 일, 구체적으로)
- **더 나은 반응:** "..." (부모가 할 수 있는 말이나 행동)

짧고 직접적으로. 장식 금지. 이 섹션은 펀치력이 생명.

## 3. 아이의 행동 시그니처

5-7개 고확률 행동 패턴. ${ageGroup}(${childAge}세) 기준.
각 패턴마다:

짧은 일상 장면 (2-3문장, 집에서 일어나는 일: 숙제, 아침, 식사, 스크린, 친구):
그다음:
- **관찰되는 행동:** ...
- **내면의 논리:** ...
- **악화 조건:** ...
- **개선 조건:** ...

## 4. 상황별 대응 플레이북

다음 6가지 상황을 다루세요:
① 숙제 거부/미루기 ② 침묵/지연 반응 ③ 친구 관계 상처 ④ 스크린/게임 전환 ⑤ 방과후 감정 과부하 ⑥ 부모가 너무 몰아붙일 때

각 상황:
- **부모가 흔히 하는 말:** "..."
- **왜 역효과인지:** ... (이 기질에서 어떻게 받아들여지는지)
- **더 나은 스크립트:** "..."
- **개선 신호:** ... (이 방법이 통하고 있다는 증거)

이 섹션이 리포트의 심장입니다. 대화 스크립트가 현실적이어야 합니다.

## 5. 숨겨진 강점

3가지 강점. 각 항목:
- **[강점명]**
- 약점으로 오해받는 상황: ... (구체적 장면)
- 이 강점이 빛나는 환경: ...
- 키워줄 활동 1가지: ... (이 나이에 바로 시작 가능한 것)
- 진로 방향 힌트: 확정이 아닌 흥미·활동을 탐색하는 참고 문장 1개

따뜻한 서사로 감싸되, 구체적 행동으로 마무리.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

모든 섹션에서: 인식(insight) + 실행(action)이 반드시 함께. 인식만 있는 문단 금지.
- 절대 "다음에 더 자세히", "추가 분석이 필요하면" 같은 추가 서비스 유도 멘트 금지 — 이 리포트가 완결된 작품이어야 합니다.
- 섹션 5의 끝에서 자연스럽게 마무리하되, 리포트 전체의 최종 결론은 쓰지 마세요 (후반부에서 이어집니다).

<execution_order>
1단계: 입력 데이터(사주 팔자, 오행 분포) 파싱
2단계: 해당 섹션들에 대해 데이터 기반 분석
3단계: 출력 형식에 맞춰 마크다운으로 렌더
</execution_order>`;

  // ── Call 2: Sections 6-9 (Timeline, experiment, co-parent, lifestyle) ──
  const call2SectionInstructionsKo = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 개인화된 양육 리포트 (섹션 6~9)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**반드시 ## N. 형식을 사용하세요. 제목은 자연스럽게 작성하되, 각 섹션의 포맷을 정확히 따르세요.**

## 6. 이 시기의 흐름

${fortuneCycles ? `현재 대운(${fortuneCycles.currentDaeun?.pillar?.korean || '?'})과 올해 세운(${fortuneCycles.currentSeun?.pillar?.korean || '?'})을 중심으로.
- "대운"을 자연어로 설명 (10년 주기의 환경 배경 전환, 운명이 아닌 무대 배경)
- 지금 이 시기가 아이에게 어떤 의미인지 (운영적 톤, 신비주의 아님)
- 부모가 이 시기에 집중해야 할 양육 포인트` : `현재 나이대(${ageGroup})의 주요 흐름과 가까운 미래 변화`}

아래 월별 정보를 리포트 언어로 작성하세요 (${new Date().getMonth() + 1}월~${new Date().getMonth() + 4}월).
월 간지는 한자(漢字)로 표기하세요 (예: 甲午, 乙未).

**형식: 각 달을 소제목(### 또는 볼드)으로 구분하고, 아래 4항목을 불릿으로 작성하세요:**
- **압력 포인트:** ...
- **주시할 행동 변화:** ...
- **도움이 되는 것:** ...
- **피해야 할 것:** ...

각 항목은 구체적으로 1-2문장.

## 7. 7일 양육 실험

3가지 작은 변화. 각 항목:
- **부모 행동 변화:** ... (구체적, 오늘 저녁부터 할 수 있는 것)
- **예상되는 아이 반응:** ... (첫 1-2일 / 3-4일 / 5-7일)
- **성공 신호:** ... (이 방법이 통하고 있다는 증거)

실험이므로 부담 없이 시작할 수 있어야 합니다. "하루 5분"이면 충분한 수준.

## 8. 함께 읽는 양육 카드

이 섹션은 스크린샷으로 공유할 수 있을 만큼 간결해야 합니다. 장식 없이 핵심만.

모든 레이블/볼드 제목은 **리포트 언어로 작성하거나 번역**하세요. 한국어 리포트에서는 아래 한국어 예시를 그대로 사용하고, 다른 언어 리포트에서는 같은 의미를 해당 언어로 번역합니다. 포맷:

- [이 아이에게 기억할 5가지] — 번호 리스트
- [멈출 말 3가지] — 각각 왜 역효과인지 1문장
- [시작할 말 3가지] — 각각 왜 효과적인지 1문장
- [감정이 높아질 때 3단계] — 즉시/5분 후/안정 후

## 9. 생활 속 밸런스 (참고 사항)

⚠️ **이 섹션은 참고 사항입니다. 건강 진단이나 방위 풍수가 아닙니다.**
⚠️ **아래 데이터의 한국어(목, 화, 토, 금, 수, 나무, 불, 흙, 쇠, 물 등)는 리포트 언어로 번역하세요. 한국어 그대로 출력 금지.**

부족한 오행(${childWeak} = Wood/Fire/Earth/Metal/Water 중 해당)을 위한 선택적 참고 아이디어(치료·처방·운명 확정이 아님):
- **핵심 한 문장:** 이 리포트에서 오늘 기억할 문장
- **마무리:** 관찰과 대화를 위한 마무리 문장
- **색상:** ${weakElementRemedies.colors || '정보 없음'} — 옷, 학용품, 방 소품에서 활용
- **음식:** ${weakElementRemedies.foods || '정보 없음'} — 식탁에서 자연스럽게
- **활동:** ${weakElementRemedies.activities || '정보 없음'} — 왜 이 활동이 이 기질에 좋은지 1문장

마지막에 이 리포트의 핵심을 한 문장으로 요약하고, 부모의 마음을 어루만지는 완결형 메시지로 끝내세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

모든 섹션에서: 인식(insight) + 실행(action)이 반드시 함께. 인식만 있는 문단 금지.
- 절대 "다음에 더 자세히", "추가 분석이 필요하면" 같은 추가 서비스 유도 멘트 금지 — 이 리포트가 완결된 작품이어야 합니다.
- 마지막에 부모의 마음을 어루만지는 완결형 메시지로 끝내세요.

<execution_order>
1단계: 입력 데이터(사주 팔자, 오행 분포, 대운/세운, 오행 밸런스) 파싱
2단계: 해당 섹션들에 대해 데이터 기반 분석
3단계: 출력 형식에 맞춰 마크다운으로 렌더
</execution_order>`;

  // ── 비한국어 섹션 지시문 ────────────────────────────────────────────────
  // 한국어 지시문을 전 언어에 쓰던 것이 다국어 품질 문제의 근원이었다. 한국어 라벨
  // 예시를 주고 "리포트 언어로 번역해 쓰라"고 하면, 일본어는 번역 대신 한국어를 그대로
  // 옮겨 적고(실측 한글 비율 최대 29.5%), 영어는 매번 새로 번역해 계약과 어긋나는
  // 의역을 만든다("What parents often say" → "Parent's common words").
  //
  // 해결책은 번역을 시키지 않는 것이다. premiumLabels는 이미 출력 언어의 정확한 계약
  // 라벨을 갖고 있으므로, 그 문자열을 지시문에 그대로 끼워 넣어 쓸 라벨을 못 박는다.
  const L = premiumLabels;
  const bullet = (label) => `- **${label}:**`;

  const call1SectionInstructionsEn = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Personalized parenting report (Sections 1-5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Use the "## N." heading format. Write the section titles naturally in ${outputLangName}, but follow each section's structure exactly.**

**Every bold label below is already written in ${outputLangName}. Reproduce each label exactly as printed here — do not translate it again, do not reword it, do not add parentheses or extra words to it. Write the report body in ${outputLangName}.**

## 1. At a Glance

Open with three warm sentences introducing this child's core temperament through a natural image, then connect it immediately to everyday behavior.

Then these five items, in this order:

${bullet(L.s1[0])} one sentence, a concrete situation
${bullet(L.s1[1])} one sentence, actionable
${bullet(L.s1[2])} exactly 3 items as a numbered list under this single label, each with its reason
${bullet(L.s1[3])} exactly 3 items as a numbered list under this single label, each with why it works
${bullet(L.s1[4])} one sentence

## 2. This Child Is NOT...

Write 4 to 6 items that confront a common parental misreading head-on. Each item:

${bullet(L.s2[0])} "..." what the parent actually thinks
${bullet(L.s2[1])} what is really happening inside, concretely
${bullet(L.s2[2])} "..." something the parent can say or do

Short and direct. No ornament. This section lives on its punch.

## 3. Behavioral Signatures

Write 5 to 7 high-probability behavior patterns for a child in ${ageGroupEn}, age ${childAge}.
Start each with a 2-3 sentence everyday scene at home (homework, mornings, meals, screens, friends), then:

${bullet(L.s3[0])} ...
${bullet(L.s3[1])} ...
${bullet(L.s3[2])} ...
${bullet(L.s3[3])} ...

## 4. Situational Playbook

Cover all six of these situations, in order. All six are required — do not merge, skip, or shorten the list:
1) refusing or delaying homework
2) silence or delayed response
3) hurt from a friendship
4) transitioning off screens/games
5) after-school emotional overload
6) when the parent pushes too hard

Give each of the six its own subheading, then these four labels:

${bullet(L.s4[0])} "..."
${bullet(L.s4[1])} how it lands for this particular temperament
${bullet(L.s4[2])} "..."
${bullet(L.s4[3])} evidence that this is working

This section is the heart of the report. The scripts must sound like real speech.

## 5. Hidden Strengths

Exactly 3 strengths. Introduce each one with a numbered list item holding only the strength's short bold name — like "1) **<strength name>**" — on its own line, with no colon and no other text on that line. The parser identifies each strength card by that line. Then, underneath it:

${bullet(L.s5[0])} a concrete scene
${bullet(L.s5[1])} ...
${bullet(L.s5[2])} something startable at this age
${bullet(L.s5[3])} one exploratory sentence about interests and activities — never a fixed career claim

Wrap each in warm narrative but land on concrete behavior.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Throughout: insight and action always travel together. No insight-only paragraph.
- Never write upsell language such as "we'll analyze this further next time." This report must stand as a complete work.
- Let Section 5 end naturally, but do not write a conclusion for the whole report — the second half continues.

<execution_order>
Step 1: parse the input data (Four Pillars, Five Element distribution)
Step 2: analyze the assigned sections from that data
Step 3: render as markdown in the required format
</execution_order>`;

  const call2SectionInstructionsEn = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Personalized parenting report (Sections 6-9)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Use the "## N." heading format. Write the section titles naturally in ${outputLangName}, but follow each section's structure exactly.**

**Every bold label and bracketed heading below is already written in ${outputLangName}. Reproduce each one exactly as printed here — do not translate it again, do not reword it, do not add parentheses or extra words to it. Write the report body in ${outputLangName}.**

## 6. The Current Flow

${fortuneCycles ? `Center this on the current 10-year cycle (${fortuneCycles.currentDaeun?.pillar?.hanja || fortuneCycles.currentDaeun?.pillar?.korean || '?'}) and this year's cycle (${fortuneCycles.currentSeun?.pillar?.hanja || fortuneCycles.currentSeun?.pillar?.korean || '?'}).
- Explain the 10-year cycle in plain language: a shift of environmental backdrop, a stage set — not destiny.
- What this period means for this child, in an operational tone, never mystical.
- What the parent should focus on during it.` : `Describe the main flow of the child's current stage (${ageGroupEn}) and the changes just ahead.`}

Then cover the four months from month ${new Date().getMonth() + 1} through month ${new Date().getMonth() + 4}.
Write each month as its own subheading and print the month's pillar in Chinese characters (e.g. 甲午, 乙未).
Under each month, these four items:

${bullet(L.s6[0])} ...
${bullet(L.s6[1])} ...
${bullet(L.s6[2])} ...
${bullet(L.s6[3])} ...

One to two concrete sentences each.

## 7. 7-Day Parenting Experiment

Exactly 3 small changes. For each:

${bullet(L.s7[0])} concrete, startable this evening
${bullet(L.s7[1])} cover days 1-2, then 3-4, then 5-7 as one continuous sentence on this same line — never as sub-bullets or nested bold labels
${bullet(L.s7[2])} evidence that it is working

Under these three labels, write plain prose only. Do not introduce any additional bold label followed by a colon anywhere inside this section.

Keep them light enough to start without pressure — "five minutes a day" is the right scale.

## 8. Parenting Card to Share

This section must be concise enough to screenshot. Essentials only, no ornament.
Write these four bracketed headings exactly as printed. **Each heading must be a bullet list item beginning with "- " — never a markdown heading, so never start these lines with "#".** Follow each heading with its numbered list:

- [${L.s8[0]}] — exactly 5 numbered items
- [${L.s8[1]}] — exactly 3 items, each with one sentence on why it backfires
- [${L.s8[2]}] — exactly 3 items, each with one sentence on why it works
- [${L.s8[3]}] — exactly 3 items: immediately / after five minutes / once calm

## 9. Everyday Balance (reference)

⚠️ **This section is reference only. It is not a medical assessment and not geomancy.**
⚠️ **Translate every element name into ${outputLangName}. Never print the Korean element names.**

Offer optional, everyday ideas supporting the element this child has least of — never treatment, prescription, or fixed fate. Use these labels exactly:

${bullet(L.s9[0])} clothing, school supplies, room accents
${bullet(L.s9[1])} easy to bring to the table
${bullet(L.s9[2])} plus one sentence on why it suits this temperament
${bullet(L.s9[3])} the one sentence to remember from this report today
${bullet(L.s9[4])} a closing line for observation and conversation

End with a complete, warm message that settles the parent's heart.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Throughout: insight and action always travel together. No insight-only paragraph.
- Never write upsell language. This report must stand as a complete work.

<execution_order>
Step 1: parse the input data (Four Pillars, Five Elements, fortune cycles, balance data)
Step 2: analyze the assigned sections from that data
Step 3: render as markdown in the required format
</execution_order>`;

  const call1SectionInstructions = language === 'ko' ? call1SectionInstructionsKo : call1SectionInstructionsEn;
  const call2SectionInstructions = language === 'ko' ? call2SectionInstructionsKo : call2SectionInstructionsEn;

  // Shared system message base — v2 prompt redesign
  // Korean version (for ko locale)
  const systemMessageBaseKo = `당신은 아동 기질 해석 전문가입니다. 동양 철학(명리학)의 기질 분석 프레임워크와 현대 발달심리학을 결합하여, 부모가 아이의 행동 패턴을 이해하고 일상에서 바로 쓸 수 있는 양육 전략을 제공합니다.

당신은 점술가가 아닙니다. 당신은 개인화된 양육 해석 전문가입니다.

**품질 기준 (우선순위 순):**
1. 구체적(specific): "감정이 풍부합니다" ✗ → "저녁 식사 때 학교 이야기를 하다가 갑자기 울 수 있습니다" ✓
2. 행동 기반(behavioral): "창의적인 아이" ✗ → "레고를 설명서 없이 자기만의 방식으로 조립하려 합니다" ✓
3. 실행 가능(actionable): 모든 문단에 인식(insight) + 실행(action)이 함께
4. 따뜻하되 허술하지 않게(warm but not fluffy): 공감은 짧게, 해결책은 구체적으로
5. 프리미엄 톤: 명확하고 세련되게. 학술적이거나 신비주의적이지 않게

**금지 패턴:**
1. 반복 금지: 같은 인사이트를 다른 표현으로 반복하지 마세요. 한 번 말한 것은 다시 말하지 않습니다.
2. 장식적 은유 제한: 자연 비유는 섹션당 1개만. 행동 변화로 이어지지 않는 은유는 삭제.
3. 광범위 주장 금지: "이 아이는 리더십이 있습니다" ✗ → "4명 이상 모이면 자연스럽게 역할을 나누려 합니다" ✓
4. 신비주의 과잉 금지: 오행을 설명할 때 물리적 비유만. "우주의 기운" 같은 표현 금지.
5. 의학적 추측 금지: 건강 진단 금지. "활동량이 많은 시기에 충분한 수면이 중요합니다" ✓
6. 긴 직업 목록 금지: 진로 방향은 3개 이하, 각각 왜 이 기질에 맞는지 1문장 설명.
7. 진단적 압축: 3문장으로 설명 가능한 것을 6문장으로 늘리지 마세요. 같은 뜻의 다른 표현 연속 사용은 "물 타기"로 느껴집니다.

**확신도 보정:**
- 사주 데이터에서 직접 도출 → "~하는 경향이 뚜렷합니다"
- 기질에서 추론 가능한 패턴 → "~할 수 있습니다"
- 환경 의존적 발현 → "환경에 따라 ~하는 모습을 보이기도 합니다"

**비유 규칙:** 자연 비유를 사용했으면 바로 다음 문장에서 구체적 행동으로 연결하세요.

**용어 사용:** 명리학 용어는 쓰되, 바로 옆에 일상어로 풀어서 설명. 삼재/원진살/도화살 등 공포 유발 개념 금지. "좋은 사주/나쁜 사주" 이분법 금지.
**한자 표기:** 천간/지지를 언급할 때 반드시 한자를 괄호 안에 표기하세요. 예: 신금(辛金), 을목(乙木), 갑오(甲午). 데이터의 '한자' 열을 참조하세요. 빈 괄호 ( ) 금지.

**핵심 철학:** 기질은 지도이지 운명이 아닙니다. 같은 기질의 아이도 부모의 양육에 따라 전혀 다른 사람이 됩니다.`;

  // English version (for all non-ko locales — prompting in English produces
  // dramatically better output quality than Korean prompt + translate instruction)
  const systemMessageBaseEn = `You are a child temperament interpretation specialist. You combine the temperament analysis framework of East Asian philosophy (Myeongri/Four Pillars) with modern developmental psychology, helping parents understand their child's behavioral patterns and providing actionable parenting strategies.

You are NOT a fortune-teller. You are a personalized parenting interpretation expert.

**CRITICAL: Write the ENTIRE report in ${outputLangName}.** All section headings, bold labels, table headers, and body text must be in ${outputLangName}. Korean text (목, 화, 토, 금, 수) in the input data must be translated to the equivalent terms in ${outputLangName}. Heavenly Stems/Earthly Branches should be shown in Chinese characters in parentheses. No Korean text in the output.

**Quality Criteria (in priority order):**
1. Specific: "emotionally rich" ✗ → "may suddenly cry while talking about school at dinner" ✓
2. Behavioral: "creative child" ✗ → "tries to build LEGO their own way without the manual" ✓
3. Actionable: every paragraph pairs an insight with an action
4. Warm but not fluffy: empathy is brief, solutions are specific
5. Premium tone: clear and refined, never academic or mystical

**Forbidden Patterns:**
1. No repetition: do not restate the same insight in different words. Once said, move on.
2. Limit decorative metaphors: max 1 nature metaphor per section. Delete any metaphor that does not lead to behavioral change.
3. No sweeping claims: "this child has leadership" ✗ → "in groups of 4+, they naturally start assigning roles" ✓
4. No mystical excess: only physical analogies for Five Elements. No "cosmic energy" language.
5. No medical speculation: no health diagnoses. "Adequate sleep is important during high-activity periods" ✓
6. No long career lists: max 3 career directions, each with a 1-sentence explanation of why it fits this temperament.
7. Diagnostic compression: if it can be said in 3 sentences, do not stretch to 6. Consecutive synonymous rephrasing feels like filler.

**Confidence Calibration:**
- Directly derived from Saju data → "shows a clear tendency to..."
- Inferrable pattern from temperament → "may..."
- Environment-dependent expression → "depending on the environment, may show..."

**Metaphor Rule:** If you use a nature metaphor, the very next sentence must connect to a concrete behavior.

**Terminology:** Use Myeongri terms but immediately explain in everyday language. No fear-inducing concepts (samjae/wonjinsal/dohwasal). No "good Saju / bad Saju" binary.
**Chinese Characters:** When mentioning Heavenly Stems / Earthly Branches, always show Chinese characters in parentheses. Reference the 'hanja' column from the data. No empty parentheses.

**Core Philosophy:** Temperament is a map, not a destiny. Children with the same temperament become entirely different people depending on their parents' approach.`;

  const systemMessageBase = language === 'ko' ? systemMessageBaseKo : systemMessageBaseEn;

  // Call 1 system message: sections 1-5 structure guidance
  const call1SectionsKo = `
**이번 요청은 9개 섹션 리포트 중 섹션 1~5를 작성하는 것입니다.**
각 라벨은 반드시 굵은 Markdown 형식의 라벨과 콜론으로 쓰고, 값을 생략하거나 합치지 마세요.
- 섹션 1: 한눈에 보기 (Executive Summary) — 서사 3문장 + 구조화 불릿
- 섹션 2: 이 아이는 ~이 아닙니다 — 오해 정면 반박, 펀치력
- 섹션 3: 행동 시그니처 — 일상 장면 + 패턴 분석
- 섹션 4: 상황별 대응 플레이북 — 6가지 상황 대화 스크립트
- 섹션 5: 숨겨진 강점 — 서사 + 구체적 행동
- "다음에 더 자세히 분석해드리겠습니다" 같은 추가 서비스 유도 멘트 절대 금지.
- 섹션 5의 끝에서 자연스럽게 마무리하되, 리포트 전체의 최종 결론은 쓰지 마세요 (후반부에서 이어집니다).

**중요: 사주팔자 테이블, 오행 분포, 대운/세운 요약은 리포트 앞에 별도로 첨부됩니다. 본문에서 이 데이터를 표로 반복하지 마세요. 바로 해석과 이야기로 들어가세요.**`;

  const call1SectionsEn = `
**This request is for Sections 1-5 of a 9-section report.**
- Section 1: At a Glance (Executive Summary) — 3-sentence narrative + structured bullets
- Section 2: This Child Is NOT... — directly confront common misconceptions, punchy tone
- Section 3: Behavioral Signatures — everyday scenes + pattern analysis
- Section 4: Situational Playbook — conversation scripts for 6 common situations
- Section 5: Hidden Strengths — narrative + specific observable behaviors
- NEVER include upsell language like "we'll analyze more in the next session."
- End Section 5 naturally but do NOT write a final conclusion for the whole report (the second half continues).

**IMPORTANT: The Four Pillars table, Five Elements distribution, and fortune cycle summary are attached separately before the report. Do NOT repeat this data as tables in the body. Jump straight into interpretation and narrative.**`;

  const call1SystemMessage = `${systemMessageBase}\n${exactLabelContract}\n${language === 'ko' ? call1SectionsKo : call1SectionsEn}`;

  // Call 2 system message: sections 6-9 structure guidance
  const call2SectionsKo = `
**이번 요청은 9개 섹션 리포트 중 섹션 6~9를 작성하는 것입니다.**
각 라벨은 반드시 굵은 Markdown 형식의 라벨과 콜론으로 쓰고, 값을 생략하거나 합치지 마세요.
**참고: 섹션 1~5(한눈에 보기, 오해 반박, 행동 시그니처, 상황별 플레이북, 숨겨진 강점)는 이미 작성 완료되었습니다. 섹션 6부터 이어서 작성하세요.**

- 섹션 6: 이 시기의 흐름 — 대운/세운 기반 월별 테이블, 운영적 톤
- 섹션 7: 7일 양육 실험 — 3가지 작은 변화, 각각 행동→반응→성공 신호
- 섹션 8: 함께 읽는 양육 카드 — 스크린샷 공유 최적화, 핵심만
- 섹션 9: 생활 속 밸런스 — "참고 사항" 톤, 색상/음식/활동 간결하게
- "다음에 더 자세히 분석해드리겠습니다" 같은 추가 서비스 유도 멘트 절대 금지. 이 리포트가 완결된 작품이어야 합니다.
- 마지막에 부모의 마음을 어루만지는 완결형 메시지로 끝내세요.

**중요: 사주팔자 테이블, 오행 분포 요약은 리포트 앞에 별도로 첨부됩니다. 본문에서 이 데이터를 표로 반복하지 마세요. 바로 해석과 이야기로 들어가세요.**`;

  const call2SectionsEn = `
**This request is for Sections 6-9 of a 9-section report.**
**Note: Sections 1-5 (At a Glance, Misconceptions, Behavioral Signatures, Situational Playbook, Hidden Strengths) are already written. Continue from Section 6.**

- Section 6: The Current Flow — monthly table based on major/annual fortune cycles, operational tone
- Section 7: 7-Day Parenting Experiment — 3 small changes, each with action → response → success signals
- Section 8: Parenting Card to Share — optimized for screenshot sharing, essentials only
- Section 9: Everyday Balance — "reference" tone, colors/foods/activities, keep it concise
- NEVER include upsell language. This report must feel like a complete, finished work.
- End with a warm, conclusive message that touches the parent's heart.

**IMPORTANT: The Four Pillars table and Five Elements summary are attached separately. Do NOT repeat them as tables in the body. Jump straight into interpretation and narrative.**`;

  const call2SystemMessage = `${systemMessageBase}\n${exactLabelContract}\n${language === 'ko' ? call2SectionsKo : call2SectionsEn}`;

  // Premium reports: split into 2 calls of ~5000 tokens each
  // Total budget stays the same (~10000 tokens)
  const halfTokens = productType === 'deluxe' ? 7000 : 5000;

  try {
    console.log('[Saju Service] Generating premium 9-section report (2-call split)...');
    const totalStart = Date.now();

    // ── Call 1: Sections 1-5 ──
    const call1Start = Date.now();
    console.log('[Saju Service] Call 1/2: Generating sections 1-5...');

    // ── Call 2: Sections 6-9 ──
    const call2Start = Date.now();
    console.log('[Saju Service] Call 2/2: Generating sections 6-9...');

    // Whether a report satisfies the structured contract is partly a matter of luck:
    // the same prompt and chart can land on ready one run and fallback the next,
    // purely on where the model puts its line breaks. Keep the two calls callable
    // more than once so a format miss can be retried instead of shipped.
    const runBothCalls = (temperature) => Promise.all([
      aiService.generateFortune([
        { role: 'system', content: call1SystemMessage },
        { role: 'user', content: coreDataContext + call1SectionInstructions },
      ], {
        maxTokens: halfTokens,
        temperature,
      }),
      aiService.generateFortune([
        { role: 'system', content: call2SystemMessage },
        { role: 'user', content: coreDataContext + fortuneDataContext + remedyDataContext + call2SectionInstructions },
      ], {
        maxTokens: halfTokens,
        temperature,
      }),
    ]);

    const [result1, result2] = await runBothCalls(0.7);

    const call1Duration = Date.now() - call1Start;
    const call2Duration = Date.now() - call2Start;
    const totalDuration = Date.now() - totalStart;
    console.log(`[Saju Service] Call 1/2 (sections 1-5) complete: ${call1Duration}ms, ${result1.content.length} chars, ${result1.tokensUsed} tokens`);
    console.log(`[Saju Service] Call 2/2 (sections 6-9) complete: ${call2Duration}ms, ${result2.content.length} chars, ${result2.tokensUsed} tokens`);

    // Each half must carry real section content. A paid reading must never be
    // saved (and emailed) with a blank or truncated half — fail here so the
    // reading is not persisted and the client's retry/polling path applies.
    const MIN_HALF_LENGTH = 200;
    if (result1.content.trim().length < MIN_HALF_LENGTH || result2.content.trim().length < MIN_HALF_LENGTH) {
      throw new Error(
        `AI returned too-short premium content (call1=${result1.content.trim().length} chars, call2=${result2.content.trim().length} chars, min=${MIN_HALF_LENGTH})`
      );
    }

    // Combine results
    let interpretationText = result1.content + '\n\n' + result2.content;
    const generatedAt = new Date().toISOString();
    let totalTokens = (result1.tokensUsed || 0) + (result2.tokensUsed || 0);

    console.log('[Saju Service] Premium report generated (2-call split):', {
      length: interpretationText.length,
      totalTokens,
      call1: { duration: `${call1Duration}ms`, tokens: result1.tokensUsed, provider: result1.provider },
      call2: { duration: `${call2Duration}ms`, tokens: result2.tokensUsed, provider: result2.provider },
      totalDuration: `${totalDuration}ms`,
      hasParentData: !!parentManseryeok,
    });

    const adapt = (text) => adaptMarkdownToPresentation({
      fullText: text,
      manseryeok: childManseryeok,
      fortuneCycles,
      childName,
      generatedAt,
      language,
    });

    let presentationResult = adapt(interpretationText);

    // A format miss costs the reader the whole editorial layout, so it is worth one
    // more attempt. Only shape problems are retried: unsafe_claim is the safety
    // filter doing its job, and re-rolling until a safety check passes would be
    // exactly the wrong behaviour. insufficient_calculated_basis is a data problem
    // that a second generation cannot change.
    const RETRYABLE_FALLBACKS = new Set([
      'missing_or_reordered_sections',
      'partial_required_labels',
      'localization_leak',
    ]);
    if (
      presentationResult.presentationStatus !== 'ready'
      && RETRYABLE_FALLBACKS.has(presentationResult.presentationStatusReason)
      && process.env.SAJU_PRESENTATION_RETRY_DISABLED !== '1'
    ) {
      const firstReason = presentationResult.presentationStatusReason;
      console.warn(`[Saju Service] Presentation fallback (${firstReason}) — retrying generation once`);
      try {
        // Lower temperature on the retry: the first pass already produced usable
        // substance, so the second only needs to land the structure.
        const [retry1, retry2] = await runBothCalls(0.4);
        const retryText = `${retry1.content}\n\n${retry2.content}`;
        if (retry1.content.trim().length >= MIN_HALF_LENGTH && retry2.content.trim().length >= MIN_HALF_LENGTH) {
          const retryPresentation = adapt(retryText);
          totalTokens += (retry1.tokensUsed || 0) + (retry2.tokensUsed || 0);
          if (retryPresentation.presentationStatus === 'ready') {
            console.log('[Saju Service] Retry succeeded — presentation ready');
            interpretationText = retryText;
            presentationResult = retryPresentation;
          } else {
            console.warn(`[Saju Service] Retry still ${retryPresentation.presentationStatusReason} — keeping first result`);
          }
        } else {
          console.warn('[Saju Service] Retry returned too-short content — keeping first result');
        }
      } catch (retryError) {
        // The first result is already usable as fallback markdown; never let a
        // failed retry take down a paid reading.
        console.error('[Saju Service] Retry failed, keeping first result:', retryError.message);
      }
    }

    const parsedSections = parsePremiumSections(interpretationText);
    return mergePresentationResult({
      fullText: interpretationText,
      sections: parsedSections,
      metadata: {
        provider: result1.provider,
        model: result1.model,
        tokens: totalTokens,
        generatedAt,
        reportType: 'relationship_focused',
        hasParentAnalysis: !!parentManseryeok,
        splitCalls: {
          call1: { duration: call1Duration, tokens: result1.tokensUsed },
          call2: { duration: call2Duration, tokens: result2.tokensUsed },
          totalDuration,
        },
      },
    }, presentationResult);

  } catch (error) {
    console.error('[Saju Service] Error generating premium report:', error);
    throw new Error(`Failed to generate premium report: ${error.message}`);
  }
}

/**
 * Parse premium report sections
 * Splits on "## N." pattern and maps sections by order (position-based, not title-based).
 */
function parsePremiumSections(text) {
  if (!text) return {};

  const sectionKeys = [
    'executiveSummary',     // 1. 한눈에 보기
    'whatChildIsNot',       // 2. 이 아이는 ~이 아닙니다
    'behavioralSignature',  // 3. 행동 시그니처
    'situationPlaybook',    // 4. 상황별 대응 플레이북
    'hiddenStrengths',      // 5. 숨겨진 강점
    'timelineFocus',        // 6. 이 시기의 흐름
    'sevenDayExperiment',   // 7. 7일 양육 실험
    'coParentSummary',      // 8. 함께 읽는 양육 카드
    'lifestyleHarmony',     // 9. 생활 속 밸런스
  ];

  const result = {};

  // Split the text into parts on "## N." or "# N." boundaries
  // Use lookahead so the delimiter stays with the following part
  const parts = text.split(/(?=\n#{1,2}\s*\d+\.\s)/);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const headerMatch = trimmed.match(/^#{1,2}\s*(\d+)\.\s*/);
    if (headerMatch) {
      const sectionNum = parseInt(headerMatch[1], 10) - 1; // 0-indexed
      const key = sectionKeys[sectionNum] !== undefined
        ? sectionKeys[sectionNum]
        : `section${sectionNum + 1}`;
      // Strip the header line itself, keep the body
      result[key] = trimmed.replace(/^#{1,2}\s*\d+\.\s*[^\n]*\n?/, '').trim();
    } else {
      // Content before the first numbered section
      result['preamble'] = trimmed;
    }
  }

  // Fallback: if nothing parsed, dump everything into executiveSummary
  if (Object.keys(result).length === 0) {
    result['executiveSummary'] = text;
  }

  return result;
}

/**
 * Parse preview text into sections (simplified version)
 *
 * @param {string} text - Preview text
 * @returns {Object} Parsed sections
 */
function parsePreviewSections(text) {
  const sections = {
    overview: '',
    personality: '',
    advice: '',
  };

  // Split by numbered sections (1. 2. 3.)
  const parts = text.split(/\d+\.\s+\*?\*?/);

  if (parts.length >= 4) {
    sections.overview = parts[1]?.trim() || '';
    sections.personality = parts[2]?.trim() || '';
    sections.advice = parts[3]?.trim() || '';
  } else {
    // Fallback: just use full text
    sections.overview = text;
  }

  return sections;
}

/**
 * Parse interpretation text into sections
 * (Unchanged from Level 4)
 *
 * @param {string} text - Full interpretation text
 * @returns {Object} Parsed sections
 */
function parseInterpretationSections(text) {
  const sections = {
    overview: '',
    personality: '',
    career: '',
    relationships: '',
    advice: '',
  };

  // Split by numbered sections (1. 2. 3. etc.)
  const parts = text.split(/\d+\.\s+\*?\*?/);

  if (parts.length >= 6) {
    sections.overview = parts[1]?.trim() || '';
    sections.personality = parts[2]?.trim() || '';
    sections.career = parts[3]?.trim() || '';
    sections.relationships = parts[4]?.trim() || '';
    sections.advice = parts[5]?.trim() || '';
  } else {
    // Fallback: just use full text
    sections.overview = text;
  }

  return sections;
}

module.exports = {
  generateSajuPreview, // NEW: Free preview function
  generateSajuReading,
  getReading,
  getUserReadings,
};
