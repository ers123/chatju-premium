// backend/src/services/saju.service.v5.js
// Level 5: Saju Reading Service with Supabase Database Integration

const { getAIService } = require('./ai.service');
const { supabaseAdmin, handleSupabaseError } = require('../config/supabase');
const { calculateFullFortuneCycles } = require('./daeun.service');

// Initialize AI service (supports OpenAI, Gemini, Claude)
const aiService = getAIService();

// Dynamic import for ES6 module (mansae-calculator) - Load once at module initialization
let calculateMansae = null;
let calculatorLoadPromise = null;

async function loadMansaeCalculator() {
  // If already loaded, return immediately
  if (calculateMansae) {
    return calculateMansae;
  }

  // If loading is in progress, wait for it
  if (calculatorLoadPromise) {
    return calculatorLoadPromise;
  }

  // Start loading and cache the promise
  calculatorLoadPromise = import('mansae-calculator/mansae.js')
    .then(module => {
      calculateMansae = module.default;
      return calculateMansae;
    });

  return calculatorLoadPromise;
}

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
    timezone = 'Asia/Seoul',
    language = 'ko',
  } = params;

  try {
    console.log('[Saju Service] Starting preview generation:', {
      birthDate,
      birthTime,
      gender,
    });

    // Step 1: Load and calculate Manseryeok (same as paid version)
    const mansaeCalculator = await loadMansaeCalculator();

    // Convert gender format (male/female → 남/여)
    const genderKorean = gender === 'male' ? '남' : '여';

    // Calculate with time or without
    const timeToUse = birthTime || '12:00'; // Default to noon if no time
    const manseryeokResult = mansaeCalculator(birthDate, timeToUse, genderKorean);

    // Validate calculation result
    if (manseryeokResult.error) {
      throw new Error(`Manseryeok calculation failed: ${manseryeokResult.error}`);
    }

    if (!manseryeokResult.pillars) {
      throw new Error('Invalid Manseryeok result structure');
    }

    console.log('[Saju Service] Preview Manseryeok calculation successful');

    // Step 2: Calculate fortune cycles (대운/세운) - Premium feature
    const fortuneCycles = calculateFullFortuneCycles(
      manseryeokResult,
      birthDate,
      genderKorean,
      new Date().getFullYear()
    );

    console.log('[Saju Service] Fortune cycles calculated:', {
      currentAge: fortuneCycles.currentAge,
      daeunDirection: fortuneCycles.daeunInfo.direction,
      currentDaeun: fortuneCycles.currentDaeun?.pillar?.korean,
    });

    // Step 3: Generate PREVIEW AI interpretation (shorter version)
    const aiPreview = await generateAIPreview(
      manseryeokResult,
      language,
      birthTime === null // indicate if time is unknown
    );

    console.log('[Saju Service] Preview interpretation generated');

    // Step 4: Return preview (NO database storage)
    // Note: For preview, we only include basic fortune cycle info
    return {
      manseryeok: manseryeokResult,
      fortuneCycles: {
        dayMaster: fortuneCycles.dayMaster,
        currentAge: fortuneCycles.currentAge,
        daeunInfo: fortuneCycles.daeunInfo,
        currentDaeun: fortuneCycles.currentDaeun,
        currentSeun: fortuneCycles.currentSeun,
        // Full data hidden in preview - teaser only
        isPreview: true,
        fullDataAvailable: 'Upgrade to Premium for complete 대운/세운 analysis',
      },
      aiPreview: aiPreview,
      metadata: {
        birthDate,
        birthTime,
        gender,
        language,
        timezone,
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
    userId,
    orderId,
    birthDate,
    birthTime = null,
    gender,
    timezone = 'Asia/Seoul',
    language = 'ko',
    subjectName = null,
  } = params;

  try {
    console.log('[Saju Service] Starting reading generation:', {
      orderId,
      birthDate,
      birthTime,
      gender,
    });

    // Step 1: Verify payment exists and is completed (Real DB query!)
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .eq('user_id', userId)
      .single();

    if (paymentError) {
      throw handleSupabaseError(paymentError) || new Error('Payment not found');
    }

    if (payment.status !== 'completed') {
      throw new Error(`Payment not completed. Current status: ${payment.status}`);
    }

    console.log('[Saju Service] Payment verified:', payment.product_type);

    // Step 2: Load and calculate Manseryeok
    const mansaeCalculator = await loadMansaeCalculator();

    // Convert gender format (male/female → 남/여)
    const genderKorean = gender === 'male' ? '남' : '여';

    // Calculate with time or without
    const timeToUse = birthTime || '12:00'; // Default to noon if no time
    const manseryeokResult = mansaeCalculator(birthDate, timeToUse, genderKorean);

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
      hour: manseryeokResult.pillars.hour.korean,
    });

    // Step 3: Calculate fortune cycles (대운/세운) - Full Premium version
    const fortuneCycles = calculateFullFortuneCycles(
      manseryeokResult,
      birthDate,
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
      language,
      payment.product_type,
      birthTime === null // indicate if time is unknown
    );

    console.log('[Saju Service] AI interpretation generated');

    // Step 5: Store reading in database (NEW - Real persistence!)
    // Include fortune cycles in saju_data for complete storage
    const completeReadingData = {
      ...manseryeokResult,
      fortuneCycles: fortuneCycles,
    };

    const { data: reading, error: insertError } = await supabaseAdmin
      .from('readings')
      .insert([
        {
          user_id: userId,
          payment_id: payment.id,
          birth_date: birthDate,
          birth_time: birthTime,
          gender: gender,
          subject_name: subjectName,
          saju_data: completeReadingData,
          ai_interpretation: aiInterpretation,
          language: language,
          product_type: payment.product_type,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('[Saju Service] Failed to store reading:', insertError);
      throw handleSupabaseError(insertError) || new Error('Failed to save reading');
    }

    console.log('[Saju Service] Reading saved to database:', reading.id);

    // Step 6: Return complete reading with database ID
    return {
      readingId: reading.id, // Real UUID from database!
      manseryeok: manseryeokResult,
      fortuneCycles: fortuneCycles, // Full 대운/세운 data for Premium
      aiInterpretation: aiInterpretation,
      createdAt: reading.created_at,
      viewUrl: `https://chatju.pages.dev/reading/${reading.id}`,
      metadata: {
        birthDate,
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
 *
 * @param {Object} manseryeokData - Calculated Four Pillars from mansae-calculator
 * @param {string} language - Target language
 * @param {boolean} timeUnknown - Whether birth time is unknown
 * @returns {Promise<Object>} AI preview (truncated)
 */
async function generateAIPreview(manseryeokData, language, timeUnknown) {
  const { pillars, elements } = manseryeokData;

  // Construct language-specific prompt (PREVIEW VERSION - shorter)
  const timeDisclaimer = timeUnknown
    ? '\n**참고: 태어난 시간을 모르므로 시주(時柱) 분석은 정오(12시)를 기준으로 합니다.**\n'
    : '';

  const prompts = {
    ko: `당신은 20년 경력의 사주명리학 전문가입니다. 다음 사주팔자를 간단히 분석해주세요 (미리보기용):
${timeDisclaimer}
**사주팔자:**
- 년주(年柱): ${pillars.year.korean} (${pillars.year.element})
- 월주(月柱): ${pillars.month.korean} (${pillars.month.element})
- 일주(日柱): ${pillars.day.korean} (${pillars.day.element}) - 일간(日干) 중심
- 시주(時柱): ${pillars.hour.korean} (${pillars.hour.element})

**오행 분포:**
${Object.entries(elements).map(([elem, count]) => `- ${elem}: ${count}개`).join('\n')}

**미리보기 분석 (간단 버전):**
1. **전체 운세 개요** (1-2문장): 사주의 전반적 기운과 특징
2. **핵심 성격** (2-3문장): 타고난 기질과 가장 두드러진 특징
3. **한 줄 조언** (1문장): 가장 중요한 삶의 조언

**작성 원칙:**
- 긍정적이고 흥미로운 톤
- 더 알고 싶게 만드는 미리보기
- 총 4-6문장으로 간결하게`,

    en: `You are an expert in Korean Saju (Four Pillars of Destiny) with 20 years of experience. Please provide a brief analysis (preview version):
${timeUnknown ? '\n**Note: Birth time is unknown, so the Hour Pillar is based on noon (12:00).**\n' : ''}
**Four Pillars:**
- Year Pillar: ${pillars.year.korean} (${pillars.year.element})
- Month Pillar: ${pillars.month.korean} (${pillars.month.element})
- Day Pillar: ${pillars.day.korean} (${pillars.day.element}) - Day Master
- Hour Pillar: ${pillars.hour.korean} (${pillars.hour.element})

**Element Distribution:**
${Object.entries(elements).map(([elem, count]) => `- ${elem}: ${count}`).join('\n')}

**Preview Analysis (Short Version):**
1. **Overall Fortune** (1-2 sentences): General energy and key characteristics
2. **Core Personality** (2-3 sentences): Innate temperament and most prominent traits
3. **One-Line Advice** (1 sentence): Most important life guidance

**Writing Principles:**
- Positive and intriguing tone
- Make readers want to know more
- Keep it brief: 4-6 sentences total`,
  };

  const prompt = prompts[language] || prompts.ko;

  try {
    console.log('[Saju Service] Calling AI service for preview...');

    // Use AI service (supports OpenAI, Gemini, Claude)
    const result = await aiService.generateFortune([
      {
        role: 'system',
        content: 'You are a professional Saju fortune-teller providing brief, intriguing previews that make people want the full reading.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ], {
      maxTokens: 300, // Much shorter than paid version (800-1500)
      temperature: 0.7,
    });

    const previewText = result.content;

    console.log('[Saju Service] Preview response received:', {
      length: previewText.length,
      tokens: result.tokensUsed,
      provider: result.provider,
    });

    // Return truncated preview
    return {
      shortText: previewText,
      sections: parsePreviewSections(previewText),
      metadata: {
        provider: result.provider,
        model: result.model,
        tokens: result.tokensUsed,
        generatedAt: new Date().toISOString(),
        isPreview: true,
      },
    };

  } catch (error) {
    console.error('[Saju Service] Error generating AI preview:', error);
    throw new Error(`Failed to generate preview: ${error.message}`);
  }
}

/**
 * Generate AI interpretation of Manseryeok data
 * (Unchanged from Level 4)
 *
 * @param {Object} manseryeokData - Calculated Four Pillars from mansae-calculator
 * @param {string} language - Target language
 * @param {string} productType - 'basic' or 'deluxe'
 * @param {boolean} timeUnknown - Whether birth time is unknown
 * @returns {Promise<Object>} AI interpretation
 */
async function generateAIInterpretation(manseryeokData, language, productType, timeUnknown) {
  const { pillars, elements } = manseryeokData;

  // Construct language-specific prompt
  const timeDisclaimer = timeUnknown
    ? '\n**참고: 태어난 시간을 모르므로 시주(時柱) 분석은 정오(12시)를 기준으로 합니다.**\n'
    : '';

  const prompts = {
    ko: `당신은 20년 경력의 사주명리학 전문가입니다. 다음 사주팔자를 깊이 분석해주세요:
${timeDisclaimer}
**사주팔자:**
- 년주(年柱): ${pillars.year.korean} (${pillars.year.element})
- 월주(月柱): ${pillars.month.korean} (${pillars.month.element})
- 일주(日柱): ${pillars.day.korean} (${pillars.day.element}) - 일간(日干) 중심
- 시주(時柱): ${pillars.hour.korean} (${pillars.hour.element})

**오행 분포:**
${Object.entries(elements).map(([elem, count]) => `- ${elem}: ${count}개`).join('\n')}

**분석 요청:**
1. **전체 운세 개요** (2-3문장): 사주의 전반적 기운과 특징
2. **성격과 재능** (3-4문장): 타고난 기질, 강점, 특별한 재능
3. **직업운과 재물운** (3-4문장): 적합한 직업 방향, 재물 축적 방식
4. **대인관계와 건강** (3-4문장): 인간관계 패턴, 주의할 건강 분야
5. **실천 가능한 조언** (2-3문장): 구체적이고 실행 가능한 삶의 조언

**작성 원칙:**
- 긍정적이고 희망적인 톤 유지
- 일반론이 아닌 이 사주만의 특징 강조
- 추상적 표현 대신 구체적 예시 포함
- 부정적 요소도 성장 기회로 재해석`,

    en: `You are an expert in Korean Saju (Four Pillars of Destiny) with 20 years of experience. Please provide a deep analysis of this birth chart:
${timeUnknown ? '\n**Note: Birth time is unknown, so the Hour Pillar is based on noon (12:00).**\n' : ''}
**Four Pillars:**
- Year Pillar: ${pillars.year.korean} (${pillars.year.element})
- Month Pillar: ${pillars.month.korean} (${pillars.month.element})
- Day Pillar: ${pillars.day.korean} (${pillars.day.element}) - Day Master (center)
- Hour Pillar: ${pillars.hour.korean} (${pillars.hour.element})

**Element Distribution:**
${Object.entries(elements).map(([elem, count]) => `- ${elem}: ${count}`).join('\n')}

**Analysis Sections:**
1. **Overall Fortune** (2-3 sentences): General energy and characteristics of this chart
2. **Personality & Talents** (3-4 sentences): Innate temperament, strengths, special abilities
3. **Career & Wealth** (3-4 sentences): Suitable career paths, wealth accumulation style
4. **Relationships & Health** (3-4 sentences): Interpersonal patterns, health areas to watch
5. **Actionable Advice** (2-3 sentences): Specific, practical life guidance

**Writing Principles:**
- Maintain positive and encouraging tone
- Focus on unique characteristics of THIS chart, not generalities
- Include specific examples instead of abstract descriptions
- Reframe challenges as growth opportunities`,
  };

  const prompt = prompts[language] || prompts.ko;
  const maxTokens = productType === 'deluxe' ? 1500 : 800;

  try {
    console.log('[Saju Service] Calling AI service...');

    // Use AI service (supports OpenAI, Gemini, Claude)
    const result = await aiService.generateFortune([
      {
        role: 'system',
        content: 'You are a professional Saju fortune-teller providing insightful, personalized readings based on traditional Korean astrology.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ], {
      maxTokens: maxTokens,
      temperature: 0.7,
    });

    const interpretationText = result.content;

    console.log('[Saju Service] AI response received:', {
      length: interpretationText.length,
      tokens: result.tokensUsed,
      provider: result.provider,
    });

    // Return structured interpretation
    return {
      fullText: interpretationText,
      sections: parseInterpretationSections(interpretationText),
      metadata: {
        provider: result.provider,
        model: result.model,
        tokens: result.tokensUsed,
        generatedAt: new Date().toISOString(),
      },
    };

  } catch (error) {
    console.error('[Saju Service] Error generating AI interpretation:', error);
    throw new Error(`Failed to generate interpretation: ${error.message}`);
  }
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
