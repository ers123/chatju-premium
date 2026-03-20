// backend/src/services/saju.service.v5.js
// Level 5: Saju Reading Service with Supabase Database Integration

const { getAIService } = require('./ai.service');
const { supabaseAdmin, handleSupabaseError } = require('../config/supabase');
const { calculateFullFortuneCycles } = require('./daeun.service');
const { calculateMansae } = require('../utils/mansae-wrapper');

// Initialize AI service (supports OpenAI, Gemini, Claude)
const aiService = getAIService();

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
      birthDate,
      birthTime,
      gender,
      hasParentData: !!parentManseryeok,
    });

    // Step 1: Calculate Child Manseryeok using wrapper (CommonJS compatible)
    // Convert gender format (male/female → 남/여)
    const genderKorean = gender === 'male' ? '남' : '여';

    // Calculate with time or without
    const timeToUse = birthTime || '12:00'; // Default to noon if no time
    const locationOptions = {};
    if (birthPlace) locationOptions.birthPlace = birthPlace;
    if (latitude != null) locationOptions.latitude = latitude;
    if (longitude != null) locationOptions.longitude = longitude;

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
      birthDate,
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
    userId,
    orderId,
    birthDate,
    birthTime = null,
    gender,
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

    // Step 2: Calculate Manseryeok using wrapper
    // Convert gender format (male/female → 남/여)
    const genderKorean = gender === 'male' ? '남' : '여';

    // Calculate with time or without — with solar time correction
    const timeToUse = birthTime || '12:00'; // Default to noon if no time
    const locationOptions = {};
    if (birthPlace) locationOptions.birthPlace = birthPlace;
    if (latitude != null) locationOptions.latitude = latitude;
    if (longitude != null) locationOptions.longitude = longitude;

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
      parentManseryeok,
      parentRole,
      language,
      payment.product_type,
      birthTime === null, // indicate if time is unknown
      fortuneCycles,
      twinInfo
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
3. **부모-자녀 갈등 패턴** (2-3문장): ${parentLabel}(${parentDominant} 기질)과 아이(${childDominant} 기질)가 왜 부딪히는지, 어떤 상황에서 갈등이 생기는지 구체적으로
4. **오늘 바로 쓸 수 있는 대화법** (1문장): 아이가 열리는 말 vs 닫히는 말 예시`;
  }

  const timeDisclaimer = childTimeUnknown
    ? '\n**참고: 아이의 출생 시간을 모르므로 시주(時柱)는 정오(12시) 기준입니다.**\n'
    : '';

  const prompt = `당신은 20년 경력의 아동 심리 전문 사주 상담사입니다.
부모가 아이를 더 잘 이해하고, 갈등을 줄일 수 있도록 도와주세요.
${timeDisclaimer}

**아이 사주팔자:**
- 년주(年柱): ${childPillars.year.korean} (${childPillars.year.element})
- 월주(月柱): ${childPillars.month.korean} (${childPillars.month.element})
- 일주(日柱): ${childPillars.day.korean} (${childPillars.day.element}) - 일간(日干) 중심
- 시주(時柱): ${childPillars.hour.korean} (${childPillars.hour.element})

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
- 더 알고 싶게 만드는 티저
- 총 6-8문장`;

  try {
    console.log('[Saju Service] Calling AI service for relationship-focused preview...');

    const result = await aiService.generateFortune([
      {
        role: 'system',
        content: `당신은 부모-자녀 관계 전문 사주 상담사입니다.

**명리학 철학 (반드시 준수):**
- 사주(四柱)는 타고난 기질(命, 명)을 보여줄 뿐, 운명을 결정하지 않습니다.
- 같은 사주를 가진 사람도 환경(運, 운)에 따라 전혀 다른 삶을 삽니다.
- "좋은 사주/나쁜 사주"라는 이분법은 존재하지 않습니다. 완벽한 사주는 없고, 모든 사주에는 고유한 강점과 성장 포인트가 있습니다.
- 목표는 "아이 이해"가 아니라 "관계 갈등 해결"입니다.

**톤:**
- 부모의 답답함, 죄책감, 불안을 공감하면서 실질적 조언 제공
- 점술 용어 남발 금지, 일상 언어로 설명
- 삼재, 원진살 등 공포 마케팅 소재 사용 금지`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ], {
      maxTokens: 400,
      temperature: 0.7,
    });

    const previewText = result.content;

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
async function generateAIInterpretation(childManseryeok, parentManseryeok = null, parentRole = null, language = 'ko', productType = 'basic', childTimeUnknown = false, fortuneCycles = null, twinInfo = null) {
  const { pillars: childPillars, elements: childElements } = childManseryeok;

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
    ? '\n**참고: 출생 시간 미상으로 시주는 정오(12시) 기준이며, 실제와 다를 수 있습니다. 시주가 달라지면 일부 해석이 변할 수 있습니다.**\n'
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

  // Build parent section using 육친 framework — ENHANCED
  let parentSection = '';
  let parentDominant = null;

  if (parentManseryeok) {
    parentDominant = getStrongestElement(parentManseryeok.elements);
    const parentWeak = getWeakestElement(parentManseryeok.elements);
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
${Object.entries(parentManseryeok.elements).map(([k, v]) => `- ${k}: ${v}개${v >= 3 ? ' ▶ 강함' : v === 0 ? ' ▶ 없음!' : ''}`).join('\n')}

**부모-자녀 오행 관계:**
- ${parentLabel} 일간(${parentDayMasterElement}) × 아이 일간(${dayMasterElement}): ${parentChildRelation}
- 양육 팁: ${parentTraits.parentTip}
`;
  }

  // Build twin context if applicable
  let twinSection = '';
  if (twinInfo) {
    const orderLabel = twinInfo.order === 1 ? '첫째(먼저 태어난 아이)' : '둘째(나중에 태어난 아이)';
    twinSection = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👶👶 쌍둥이 정보
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**이 아이는 쌍둥이 중 ${orderLabel}입니다.**

**쌍둥이 해석 원칙 (반드시 준수):**
같은 사주를 가진 쌍둥이도 전혀 다른 성격과 인생을 삽니다.
이유: 부모가 무의식적으로 두 아이를 다르게 대하기 때문입니다.
- 먼저 태어난 아이에게 더 큰 기대와 책임감을 부여하는 경향
- 나중에 태어난 아이에게 더 자유롭거나 편안한 역할을 주는 경향
- 외모, 체력, 성향의 미세한 차이가 부모의 반응을 다르게 만들고, 그 반응이 다시 아이의 성격을 형성

**이 리포트에서:**
- 사주 데이터(命)는 동일하나, 이 아이가 ${orderLabel}라는 환경적 맥락(運)을 반영하세요
- ${twinInfo.order === 1 ? '첫째에게 흔한 패턴: 책임감 과부하, 완벽주의 경향, 동생과의 비교 의식' : '둘째에게 흔한 패턴: 자유로움과 방임의 경계, 관심 경쟁, "나도 보여줄게" 의식'}
- 부모에게: "같은 아이인데 왜 이렇게 다르지?"라는 의문에 답해주세요
${twinInfo.siblingName ? `**쌍둥이 형제/자매 이름:** ${twinInfo.siblingName}` : ''}
`;
  }

  // Language instruction for non-Korean reports
  const languageInstruction = language !== 'ko' ? `\n**언어 지시:** 이 리포트는 반드시 ${language === 'en' ? '영어(English)' : language === 'zh' ? '중국어(中文)' : language === 'ja' ? '일본어(日本語)' : language}로 작성하세요. 사주 용어는 원어(한자)를 병기하되, 설명과 조언은 모두 해당 언어로 작성.\n` : '';

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

  // Construct 8-section premium prompt
  const premiumPrompt = `당신은 20년 경력의 아동심리 전문 사주 상담사입니다.
부모가 아이를 더 깊이 이해하고, 관계의 갈등을 줄이고 성장을 돕고 싶어서 찾아왔습니다.

**중요 전제:** 사주는 아이의 타고난 기질(命)을 보여주는 지도이지, 정해진 운명이 아닙니다. 같은 사주를 가진 아이도 부모의 양육(運)에 따라 전혀 다른 사람이 됩니다. 이 리포트는 아이에게 가장 잘 맞는 양육 방향을 찾는 나침반입니다.
${timeDisclaimer}
${correctionNote}
${languageInstruction}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 아이 사주 데이터
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**사주팔자 (四柱八字):**
| 구분 | 천간 | 지지 | 오행 |
|------|------|------|------|
| 년주 | ${childPillars.year.korean[0]} | ${childPillars.year.korean[1]} | ${childPillars.year.element} |
| 월주 | ${childPillars.month.korean[0]} | ${childPillars.month.korean[1]} | ${childPillars.month.element} |
| 일주 | ${childPillars.day.korean[0]} | ${childPillars.day.korean[1]} | ${childPillars.day.element} |
| 시주 | ${childPillars.hour.korean[0]} | ${childPillars.hour.korean[1]} | ${childPillars.hour.element} |

**일간(日干):** ${dayMasterDesc}
**일간 상세 프로필:** ${dayStem} = ${deepProfile.nature}, 이미지: ${deepProfile.image}, 계절: ${deepProfile.season}
  강점: ${deepProfile.strengths} / 성장 포인트: ${deepProfile.weaknesses}
  아이 특성: ${deepProfile.childTrait}
  양육 팁: ${deepProfile.parentAdvice}
  건강 주의: ${deepProfile.health} / 진로 방향: ${deepProfile.career}
**일주 강약:** ${strengthLabel} — ${strengthDesc}
**현재 나이:** ${childAge}세 (한국 나이) — ${ageGroup}

**오행 분포 (총 8자 중):**
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
${fortuneCyclesSection}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 프리미엄 리포트 작성 요청 (8개 섹션)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**반드시 아래 순서로, 각 헤더를 정확히 "## N. 제목" 형식으로 작성하세요.**
**헤더에 (~000자), (최소 000자) 같은 분량 지시를 절대 포함하지 마세요. 제목만 깔끔하게.**
**부정적 특성은 모두 "성장 포인트"로 긍정적으로 재프레이밍하세요.**

## 1. 사주 핵심 프로필 (최소 800자)

이 아이의 일간 ${dayMasterDesc}을 중심으로 깊이 있게 분석:

**기질 핵심 (5가지 키워드):**
- 각 키워드마다 "${ageGroup}" 나이에서 나타나는 구체적 일상 장면 포함
- ${deepProfile.nature || ''} 기질의 자연적 이미지(${deepProfile.image || ''})를 활용해 아이의 성향을 직관적으로 설명
- 강점: ${deepProfile.strengths || ''}
- 성장 포인트: ${deepProfile.weaknesses || ''} → 반드시 "아직 개발 중인 강점"으로 재프레이밍

**${strengthLabel}의 영향:**
- ${strengthDesc}
- 신강/신약이 일상 행동에서 어떻게 드러나는지 구체적 예시 2개

**에너지 방향과 감정 표현:**
- 내향/외향, 주도/반응 — 학교/가정 각각에서의 모습
- 감정 표현 방식 (바로 표출형 vs 축적 후 폭발형 vs 회피형)
- 또래 관계에서의 위치와 특징 (${ageGroup} 시기)

**부모가 꼭 알아야 할 것:**
- ${childTraits.parentTip}
- 이 기질의 아이에게 절대 하면 안 되는 말 1가지와 그 이유
${twinInfo ? `- 쌍둥이 맥락: 이 아이가 ${twinInfo.order === 1 ? '첫째' : '둘째'}로서 갖는 기질적 특징 반영` : ''}

## 2. 부모-자녀 관계 심층 분석 (최소 800자)

**핵심 원칙:** 궁합은 "맞다/안 맞다"의 판정이 아닙니다. 이 관계를 가장 효율적으로 유지하고 성장시키는 전략을 찾는 것이 목표입니다.

${parentManseryeok && parentDominant ? `**${parentRole === 'mother' ? '엄마' : '아빠'}(${parentDominant} 기질) × 아이(${childDominant} 기질) 관계 역학:**

A. 오행 역학 분석:
- 이 조합의 상생/상극 관계가 일상에서 어떤 역동으로 나타나는지 구체적으로
- 이 조합이 자연스럽게 빠지는 갈등 패턴 3가지 (각각 구체적 일상 상황 묘사)

B. 상처가 되는 말 vs 힘이 되는 말:
- 부모가 무심코 하지만 이 기질의 아이에게 특히 상처가 되는 말 3가지 (구체적 예시)
- 같은 의도를 전달하되 아이가 열리는 대안 표현 3가지

C. 이 조합만의 특별한 강점:
- 다른 부모-자녀 조합에는 없는 이 조합만의 시너지
- 이 강점을 살리는 일상 활동 2가지 (구체적 방법)

D. 갈등 상황 대화 스크립트:
- 실제 갈등 상황 1개를 설정하고, 단계별 대화 예시를 작성 (부모 말 → 아이 반응 → 효과적 전환)` : `**아이(${childDominant} 기질)의 부모-자녀 관계 패턴:**
- 이 기질의 아이가 부모와 가장 자주 겪는 갈등 유형 3가지
- 각 갈등에서 아이의 겉 행동 vs 진짜 속마음
- 부모가 무심코 하지만 이 아이에게 특히 상처가 되는 말 3가지
- 같은 의도를 전달하는 대안 표현 3가지
- 이 아이에게 가장 잘 맞는 소통 스타일 (대화 예시 포함)
- 관계를 강화하는 일상 활동 2가지`}

## 3. 연령별 발달 가이드 (~500자)

**현재 발달 단계: ${ageGroup} (${childAge}세)**

${childAge <= 7 ? `- 이 나이의 ${childDominant} 기질 아이에게 나타나는 특징적 행동
- 떼쓰기, 고집, 감정 폭발에 대한 이 기질 맞춤 대응법
- 훈육 원칙: 엄격함 vs 유연함의 황금 비율
- 상황별 대응 가이드:
  | 상황 | 피해야 할 대응 | 효과적 대응 |
  |------|---------------|-------------|
  | 떼쓸 때 | (이 기질에 맞게) | |
  | 안 먹을 때 | | |
  | 분리불안 | | |
- 초등 입학 전 준비해야 할 것` :
childAge <= 13 ? `- 이 나이의 ${childDominant} 기질 아이에게 나타나는 특징적 행동
- 학교생활 적응 패턴 (이 기질의 강점과 도전)
- 훈육 원칙: 엄격함 vs 유연함의 황금 비율
- 상황별 대응 가이드:
  | 상황 | 피해야 할 대응 | 효과적 대응 |
  |------|---------------|-------------|
  | 숙제 안 할 때 | (이 기질에 맞게) | |
  | 친구 갈등 | | |
  | 게임/미디어 과몰입 | | |
- 사춘기 초입 징후와 대비법` :
`- 이 나이의 ${childDominant} 기질 청소년에게 나타나는 특징적 행동
- 사춘기 + 이 기질이 만나면 나타나는 특수한 패턴
- 소통 원칙: 이 나이 아이와의 대화에서 절대 하면 안 되는 것
- 상황별 대응 가이드:
  | 상황 | 피해야 할 대응 | 효과적 대응 |
  |------|---------------|-------------|
  | 말 안 들을 때 | (이 기질에 맞게) | |
  | 진로 갈등 | | |
  | 이성교제/외모 관심 | | |
- 대학/취업 준비기에 예상되는 변화`}

## 4. 진로/적성 심층 분석 (최소 600자)

**일간 기반 적성 방향:** ${deepProfile.career || ''}

- 타고난 강점 영역: 이 일간의 자연적 이미지(${deepProfile.image || ''})에서 유추되는 적성
- ${ageGroup}에서 지금 바로 시작할 수 있는 강점 계발 활동 3가지 (각각 왜 이 기질에 맞는지 설명)
- 학습 스타일 상세:
  · 이 기질에 최적화된 공부 방식 (시각/청각/체험 중 어떤 타입?)
  · 집중이 잘 되는 환경 (소음/조용/혼자/함께)
  · 최적 학습 시간대와 집중 지속 시간
  · 효과적인 동기부여 방식 (보상형/목표형/관계형)
- 주의해야 할 학습 함정: 이 기질의 아이가 빠지기 쉬운 비효율적 공부 패턴
- 미래 진로 방향성: 강점 오행을 살린 구체적 분야 5가지 이상

## 5. 대운/세운 운세 흐름 (~500자)

**해석 원칙:** 대운(大運)의 '大'는 행운의 크기가 아닌 시간 규모(10년)입니다. 대운이 바뀐다는 것은 삶의 무대 배경이 전환되는 것이지, 좋고 나쁨이 아닙니다. 실제 구체적 사건은 세운(歲運)에서 나타납니다.

${fortuneCycles ? `현재 대운(${fortuneCycles.currentDaeun ? `${fortuneCycles.currentDaeun.pillar?.korean} 대운` : '정보 없음'})과 올해 세운을 중심으로:
- 현재 대운이 만드는 '무대 배경' — 아이에게 어떤 환경적 맥락이 펼쳐지는 시기인지
- 올해 세운에서 구체적으로 펼쳐질 기운과 기회
- 대운 전환기(아홉수)가 가까운 경우, 환절기 같은 적응기로서의 의미
- 향후 대운 흐름에서 중요한 전환점과 부모의 양육 전략
- 재물운이 있다면: "아이의 꿈을 펼칠 자원이 갖춰지는 시기"로 해석` : `아이의 사주 기반 생애 운세 흐름:
- 현재 나이대의 주요 기운과 특징
- 가까운 미래(3~5년)에 예상되는 환경 변화
- 부모가 지금 준비해야 할 것`}

## 6. 월별 운세 리포트 (~400자)
${monthlyFortuneData}
현재 월(${new Date().getMonth() + 1}월)부터 향후 3개월, 각 달마다:
- **학업/성장 에너지:** 이 달에 학습이 잘 되는 분야와 방식
- **교우 관계:** 친구 관계에서 주의할 점과 기회
- **가정 내 기운:** 부모-자녀 관계에서 이 달의 주요 흐름
- **부모 양육 포인트:** 이 달에 부모가 특별히 신경 쓸 한 가지
- 각 달의 에너지를 표 형태로 요약

## 7. 오행 밸런스 & 생활 속 개운법 (최소 600자)

**부족한 ${childWeak}(${elementTraits[childWeak].name}) 에너지 보완법:**
(원리: 사람은 무의식적으로 자기에게 필요한 오행의 기운을 찾게 되어 있습니다. 아이가 특정 색상/활동에 끌린다면 그것이 이유입니다.)

· **색상:** ${weakElementRemedies.colors || ''} — 옷, 학용품, 방 인테리어 포인트 컬러로 활용
· **음식:** ${weakElementRemedies.foods || ''} — 식탁에서 자연스럽게 보완하는 법
· **활동:** ${weakElementRemedies.activities || ''} — 주 2~3회 추천 활동과 구체적 방법
· **방향/공간:** ${weakElementRemedies.direction || ''}쪽 — 책상 배치, 잠자리 방향 팁
· **건강 주의:** ${weakElementRemedies.body || ''} 관련 — 이 기질의 아이가 아프기 쉬운 부위와 예방법

**강한 오행(${childDominant}, ${dominantElementRemedies.colors || ''}) 에너지 조절법:**
- ${childDominant} 기운이 과할 때 나타나는 증상 (행동/감정/신체)
- 균형을 잡아주는 반대 오행 활용법
- ${dominantElementRemedies.avoidExcess || ''} — 주의해야 할 환경

**계절별 에너지 관리:**
- 이 아이가 가장 컨디션이 좋은 계절과 그 이유
- 힘들어하는 계절의 대처법

## 8. 오늘부터 실천 가이드 (최소 400자)

**이번 주 실천 미션 7가지** — 각각 왜 이 기질에 효과적인지 한 줄 설명 포함:

1. **[말 바꾸기]** 이 아이에게 상처가 되는 말 → 열리는 말로 (구체적 before/after 예시)
2. **[5분 연결]** 매일 이 아이와 하는 구체적 활동 1가지 (왜 이 활동인지 설명)
3. **[관찰 미션]** 이번 주 아이에게서 새로 발견할 포인트
4. **[환경 조성]** 아이의 기질에 맞게 바꿀 한 가지 (방, 책상, 일과 등)
5. **[오행 보완]** 부족한 ${childWeak} 기운을 채우는 구체적 행동 1가지
6. **[감정 코칭]** 아이의 감정 표현을 도와주는 질문 1가지
7. **[부모 돌봄]** 부모 자신의 에너지를 충전하는 방법 1가지

**마무리 메시지:**
이 리포트에서 가장 중요한 한 가지만 요약해서 부모에게 전달.
"완벽한 부모는 없습니다. 아이를 이해하려는 마음이 이미 가장 큰 선물입니다." 톤으로.
절대 "다음에는 더 자세한 분석을 해드리겠습니다" 같은 추가 서비스 유도 멘트를 넣지 마세요. 이 리포트가 완결된 하나의 작품이어야 합니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**작성 원칙:**
- 십신/용신 등 점술 전문 용어 사용 금지 (일상 언어로)
- 삼재, 원진살, 도화살 등 공포를 유발하는 개념 사용 금지
- "좋은 사주/나쁜 사주" 이분법 금지 — 모든 사주는 고유한 강점과 성장점이 있음
- 모든 설명에 구체적 대화/상황 예시 포함
- 부정적 특성은 "성장 포인트"로 긍정 재프레이밍
- 재물운을 말할 때: "큰돈"이 아닌 "꿈을 펼칠 자원이 갖춰지는 시기"로
- 대운을 말할 때: "대박 운"이 아닌 "삶의 무대 배경 전환"으로
- 궁합을 말할 때: "잘 맞다/안 맞다"가 아닌 "관계를 효율적으로 유지하는 법"으로
- 판단하지 않고 공감하는 따뜻한 톤
- **전체 분량 최소 5000자 이상 (8개 섹션 합계)**
- 각 섹션이 "이것만으로도 돈 값한다"는 느낌이 들어야 함
- 절대 "다음에 더 자세히", "추가 분석이 필요하면" 같은 추가 서비스 유도 멘트 금지 — 이 리포트가 완결된 작품이어야 합니다
- 돈을 낸 부모가 "커피 한 잔 가격에 이 정도면 대단하다"고 느낄 수 있는 퀄리티`;

  // Premium reports: generous token budgets for comprehensive reports
  // gpt-5.4-mini: ~$0.01-0.02 per report at these token levels
  const maxTokens = productType === 'deluxe' ? 10000 : 7000;

  try {
    console.log('[Saju Service] Generating premium 8-section report...');

    const result = await aiService.generateFortune([
      {
        role: 'system',
        content: `당신은 부모-자녀 관계 전문 사주 상담사입니다.

**명리학 핵심 철학 (반드시 준수):**

1. **命(명)과 運(운)의 구분**: 사주팔자는 타고난 기질과 잠재력(命)을 보여줍니다. 하지만 어떤 환경에서 어떤 양육을 받느냐(運)에 따라 같은 사주도 전혀 다른 삶을 살게 됩니다. 한국에서 같은 사주를 가진 사람은 약 100명 — 하지만 같은 부모 밑에서 같은 환경으로 자라는 사람은 없습니다.

2. **완벽한 사주는 존재하지 않습니다**: 하나를 고치면 다른 것이 어긋나는 것이 사주의 본질입니다. 모든 사주에는 고유한 강점과 성장 포인트가 공존합니다. "좋은 사주/나쁜 사주"라는 이분법은 명리학에 존재하지 않습니다.

3. **재물운의 진짜 의미**: 재물운은 복권 당첨이나 큰돈이 아닙니다. 자신의 타고난 소명(命)을 실현하는 데 필요한 자원(돈, 기회, 인연)이 얼마나 갖춰지는가입니다. 아이에게 재물운을 논할 때는 "꿈을 펼칠 자원이 갖춰지는 시기"로 설명하세요.

4. **대운(大運)은 행운이 아닙니다**: '大'는 크기가 아니라 시간 규모입니다. 대운은 10년 주기의 우주적 환경 변화를 의미합니다. 새 대운이 시작된다고 좋은 일이 생기는 것이 아니라, 삶의 무대 배경이 바뀌는 것입니다. 실제 결과를 만드는 것은 세운(歲運, 연운)입니다.

5. **아홉수와 대운 전환기**: 대운이 10년 주기이므로, 끝나는 해(9번째 해)는 계절이 바뀌는 환절기와 같습니다. 감기에 걸리기 쉬운 것처럼, 이 시기에는 변화에 대한 적응이 필요합니다. 이것은 불행이 아니라 전환입니다.

6. **궁합은 운명 판정이 아닙니다**: 명리학에서 "이 궁합은 안 맞는다"는 존재하지 않습니다. 궁합 분석의 목적은 관계를 가장 효율적으로 유지하는 방법을 찾는 것입니다. 부모-자녀 관계도 마찬가지입니다.

7. **삼재(三災)는 현대에 맞지 않습니다**: 100년 전 삼재 개념은 전쟁, 질병, 재난이 일상이던 시대의 산물입니다. 현대 명리학은 공포가 아닌 성장의 프레임으로 해석해야 합니다. 삼재, 원진살 등 공포를 유발하는 개념은 사용하지 마세요.

**작성 원칙:**
1. "아이 분석"이 아니라 "관계 이해와 성장 지원"이 목표
2. 부정적 측면은 반드시 "성장 포인트"로 재프레이밍
3. 부모의 죄책감을 덜어주면서 실질적 도움 제공
4. 오늘 바로 쓸 수 있는 구체적 대화/행동 예시
5. 점술 전문 용어 대신 일상 언어 사용
6. 판단 없이 공감하는 따뜻한 톤
7. 반드시 ## 1. ~ ## 8. 형식의 8개 섹션으로 작성

**부모가 이 리포트를 읽고 느껴야 할 것:**
- "아, 그래서 그랬구나" (이해)
- "내 탓만은 아니었구나" (안도)
- "이렇게 하면 되겠구나" (방향)
- "오늘부터 해볼 수 있겠다" (실행 가능성)`,
      },
      {
        role: 'user',
        content: premiumPrompt,
      },
    ], {
      maxTokens: maxTokens,
      temperature: 0.7,
    });

    const interpretationText = result.content;

    console.log('[Saju Service] Premium report generated:', {
      length: interpretationText.length,
      tokens: result.tokensUsed,
      provider: result.provider,
      hasParentData: !!parentManseryeok,
    });

    return {
      fullText: interpretationText,
      sections: parsePremiumSections(interpretationText),
      metadata: {
        provider: result.provider,
        model: result.model,
        tokens: result.tokensUsed,
        generatedAt: new Date().toISOString(),
        reportType: 'relationship_focused',
        hasParentAnalysis: !!parentManseryeok,
      },
    };

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
    'coreProfile',          // 1. 사주 핵심 프로필
    'parentChildAnalysis',  // 2. 부모-자녀 궁합 분석
    'developmentGuide',     // 3. 연령별 발달 가이드
    'careerAptitude',       // 4. 진로/적성 심층 분석
    'fortuneCycles',        // 5. 대운/세운 운세 흐름
    'monthlyFortune',       // 6. 월별 운세 리포트
    'elementBalance',       // 7. 오행 밸런스 & 개운법
    'weeklyActions',        // 8. 이번 주 실천 과제
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

  // Fallback: if nothing parsed, dump everything into coreProfile
  if (Object.keys(result).length === 0) {
    result['coreProfile'] = text;
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
