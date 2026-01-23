// backend/src/services/daeun.service.js
// 대운(大運) 및 세운(歲運) 계산 서비스
// Premium Version - Comprehensive Fortune Cycle Calculations

/**
 * 천간 (10 Heavenly Stems)
 */
const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const STEMS_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const STEMS_ELEMENTS = ['목', '목', '화', '화', '토', '토', '금', '금', '수', '수'];
const STEMS_YINYANG = ['양', '음', '양', '음', '양', '음', '양', '음', '양', '음'];

/**
 * 지지 (12 Earthly Branches)
 */
const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
const BRANCHES_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const BRANCHES_ELEMENTS = ['수', '토', '목', '목', '토', '화', '화', '토', '금', '금', '토', '수'];
const BRANCHES_ANIMALS = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];

/**
 * 오행 상생상극 관계
 */
const ELEMENT_RELATIONS = {
  목: { generates: '화', isGeneratedBy: '수', controls: '토', isControlledBy: '금' },
  화: { generates: '토', isGeneratedBy: '목', controls: '금', isControlledBy: '수' },
  토: { generates: '금', isGeneratedBy: '화', controls: '수', isControlledBy: '목' },
  금: { generates: '수', isGeneratedBy: '토', controls: '목', isControlledBy: '화' },
  수: { generates: '목', isGeneratedBy: '금', controls: '화', isControlledBy: '토' },
};

/**
 * 절기 정보 (월별 절기 시작일 대략적 기준)
 */
const SOLAR_TERMS = [
  { month: 1, name: '입춘', approxDay: 4 },
  { month: 2, name: '경칩', approxDay: 6 },
  { month: 3, name: '청명', approxDay: 5 },
  { month: 4, name: '입하', approxDay: 6 },
  { month: 5, name: '망종', approxDay: 6 },
  { month: 6, name: '소서', approxDay: 7 },
  { month: 7, name: '입추', approxDay: 8 },
  { month: 8, name: '백로', approxDay: 8 },
  { month: 9, name: '한로', approxDay: 8 },
  { month: 10, name: '입동', approxDay: 8 },
  { month: 11, name: '대설', approxDay: 7 },
  { month: 12, name: '소한', approxDay: 6 },
];

/**
 * 십신 (Ten Gods) 계산
 */
const TEN_GODS = {
  same_element_same_yin: '비견',      // 比肩
  same_element_diff_yin: '겁재',      // 劫財
  i_generate_same_yin: '식신',        // 食神
  i_generate_diff_yin: '상관',        // 傷官
  i_control_same_yin: '편재',         // 偏財
  i_control_diff_yin: '정재',         // 正財
  controls_me_same_yin: '편관',       // 偏官 (七殺)
  controls_me_diff_yin: '정관',       // 正官
  generates_me_same_yin: '편인',      // 偏印
  generates_me_diff_yin: '정인',      // 正印
};

/**
 * 천간에서 인덱스 가져오기
 */
function getStemIndex(stem) {
  const idx = STEMS.indexOf(stem);
  if (idx === -1) {
    // Try hanja
    return STEMS_HANJA.indexOf(stem);
  }
  return idx;
}

/**
 * 지지에서 인덱스 가져오기
 */
function getBranchIndex(branch) {
  const idx = BRANCHES.indexOf(branch);
  if (idx === -1) {
    return BRANCHES_HANJA.indexOf(branch);
  }
  return idx;
}

/**
 * 천간/지지 조합으로 육십갑자 정보 생성
 */
function createPillarInfo(stemIdx, branchIdx) {
  const stem = STEMS[stemIdx % 10];
  const branch = BRANCHES[branchIdx % 12];
  const stemHanja = STEMS_HANJA[stemIdx % 10];
  const branchHanja = BRANCHES_HANJA[branchIdx % 12];

  return {
    korean: `${stem}${branch}`,
    hanja: `${stemHanja}${branchHanja}`,
    full: `${stem}${branch}(${stemHanja}${branchHanja})`,
    stem: stem,
    branch: branch,
    stemElement: STEMS_ELEMENTS[stemIdx % 10],
    branchElement: BRANCHES_ELEMENTS[branchIdx % 12],
    stemYinYang: STEMS_YINYANG[stemIdx % 10],
    animal: BRANCHES_ANIMALS[branchIdx % 12],
  };
}

/**
 * 십신 계산
 * @param {string} dayMasterElement - 일간의 오행
 * @param {string} dayMasterYinYang - 일간의 음양
 * @param {string} targetElement - 대상의 오행
 * @param {string} targetYinYang - 대상의 음양
 */
function calculateTenGod(dayMasterElement, dayMasterYinYang, targetElement, targetYinYang) {
  const sameYinYang = dayMasterYinYang === targetYinYang;
  const relation = ELEMENT_RELATIONS[dayMasterElement];

  if (dayMasterElement === targetElement) {
    return sameYinYang ? '비견' : '겁재';
  } else if (relation.generates === targetElement) {
    return sameYinYang ? '식신' : '상관';
  } else if (relation.controls === targetElement) {
    return sameYinYang ? '편재' : '정재';
  } else if (relation.isControlledBy === targetElement) {
    return sameYinYang ? '편관' : '정관';
  } else if (relation.isGeneratedBy === targetElement) {
    return sameYinYang ? '편인' : '정인';
  }

  return '미상';
}

/**
 * 대운 방향 결정
 * @param {string} yearStemYinYang - 년간의 음양
 * @param {string} gender - '남' 또는 '여'
 * @returns {string} 'forward' 또는 'backward'
 */
function getDaeunDirection(yearStemYinYang, gender) {
  // 남자 + 양간 = 순행, 남자 + 음간 = 역행
  // 여자 + 양간 = 역행, 여자 + 음간 = 순행
  if (gender === '남' || gender === 'male') {
    return yearStemYinYang === '양' ? 'forward' : 'backward';
  } else {
    return yearStemYinYang === '양' ? 'backward' : 'forward';
  }
}

/**
 * 대운 시작 나이 계산
 * @param {string} birthDate - 생년월일 (YYYY-MM-DD)
 * @param {string} direction - 'forward' 또는 'backward'
 * @returns {Object} 대운 시작 정보
 */
function calculateDaeunStartAge(birthDate, direction) {
  const birth = new Date(birthDate);
  const birthMonth = birth.getMonth(); // 0-indexed
  const birthDay = birth.getDate();

  // 해당 월의 절기 찾기
  const currentTermInfo = SOLAR_TERMS[birthMonth];
  const nextTermInfo = SOLAR_TERMS[(birthMonth + 1) % 12];

  let daysToTerm;

  if (direction === 'forward') {
    // 순행: 다음 절기까지 일수
    if (birthMonth === 11) {
      // 12월이면 다음해 1월 절기
      const nextYear = birth.getFullYear() + 1;
      const nextTerm = new Date(nextYear, 0, SOLAR_TERMS[0].approxDay);
      daysToTerm = Math.ceil((nextTerm - birth) / (1000 * 60 * 60 * 24));
    } else {
      const nextTerm = new Date(birth.getFullYear(), birthMonth + 1, nextTermInfo.approxDay);
      daysToTerm = Math.ceil((nextTerm - birth) / (1000 * 60 * 60 * 24));
    }
  } else {
    // 역행: 이전 절기까지 일수
    if (birthDay >= currentTermInfo.approxDay) {
      // 절기 이후 출생: 현재 월 절기까지
      daysToTerm = birthDay - currentTermInfo.approxDay;
    } else {
      // 절기 이전 출생: 이전 월 절기까지
      const prevMonth = birthMonth === 0 ? 11 : birthMonth - 1;
      const prevTermInfo = SOLAR_TERMS[prevMonth];
      const prevYear = birthMonth === 0 ? birth.getFullYear() - 1 : birth.getFullYear();
      const prevTerm = new Date(prevYear, prevMonth, prevTermInfo.approxDay);
      daysToTerm = Math.ceil((birth - prevTerm) / (1000 * 60 * 60 * 24));
    }
  }

  // 3일 = 1세 환산
  const startAge = Math.round(daysToTerm / 3);

  return {
    startAge: Math.max(1, Math.min(startAge, 10)), // 1-10세 범위로 제한
    daysToTerm: daysToTerm,
    direction: direction,
    directionKorean: direction === 'forward' ? '순행' : '역행',
  };
}

/**
 * 대운 목록 생성 (10개 대운, 각 10년)
 * @param {Object} monthPillar - 월주 정보
 * @param {string} direction - 'forward' 또는 'backward'
 * @param {number} startAge - 대운 시작 나이
 * @param {Object} dayMaster - 일간 정보 (십신 계산용)
 * @returns {Array} 대운 목록
 */
function generateDaeunList(monthPillar, direction, startAge, dayMaster) {
  const daeunList = [];

  // 월주에서 시작점 찾기 (원본 인덱스 보존)
  const baseStemIdx = getStemIndex(monthPillar.stem);
  const baseBranchIdx = getBranchIndex(monthPillar.branch);

  const dayMasterElement = dayMaster.element;
  const dayMasterYinYang = dayMaster.yinyang;

  for (let i = 0; i < 10; i++) {
    let stemIdx, branchIdx;

    // 방향에 따라 이동 (원본 인덱스에서 계산)
    if (direction === 'forward') {
      stemIdx = (baseStemIdx + 1 + i) % 10;
      branchIdx = (baseBranchIdx + 1 + i) % 12;
    } else {
      stemIdx = (baseStemIdx - 1 - i + 100) % 10; // +100 to avoid negative
      branchIdx = (baseBranchIdx - 1 - i + 120) % 12;
    }

    const pillar = createPillarInfo(stemIdx, branchIdx);
    const ageStart = startAge + (i * 10);
    const ageEnd = ageStart + 9;

    // 십신 계산
    const stemTenGod = calculateTenGod(dayMasterElement, dayMasterYinYang, pillar.stemElement, pillar.stemYinYang);
    const branchTenGod = calculateTenGod(dayMasterElement, dayMasterYinYang, pillar.branchElement, pillar.stemYinYang);

    // 대운 해석 생성
    const interpretation = generateDaeunInterpretation(pillar, stemTenGod, branchTenGod, dayMasterElement);

    daeunList.push({
      order: i + 1,
      ageRange: `${ageStart}-${ageEnd}세`,
      ageStart: ageStart,
      ageEnd: ageEnd,
      pillar: pillar,
      tenGod: {
        stem: stemTenGod,
        branch: branchTenGod,
        combined: `${stemTenGod}/${branchTenGod}`,
      },
      interpretation: interpretation,
    });
  }

  return daeunList;
}

/**
 * 대운 해석 생성
 */
function generateDaeunInterpretation(pillar, stemTenGod, branchTenGod, dayMasterElement) {
  const interpretations = {
    비견: { keyword: '경쟁/협력', description: '동료, 경쟁자가 많아지는 시기. 독립, 창업에 유리하나 재물 다툼 주의.' },
    겁재: { keyword: '도전/손재', description: '과감한 도전 시기. 투자나 도박 조심, 형제/친구 관계 변화.' },
    식신: { keyword: '표현/안정', description: '재능 발휘, 안정적 수입. 먹고 사는 것이 편안해지는 시기.' },
    상관: { keyword: '창의/반항', description: '예술적 표현력 상승, 권위에 도전. 직장인은 이직 가능성.' },
    편재: { keyword: '투기/유동', description: '큰 돈이 오가는 시기. 사업 확장, 부동산, 투자 기회.' },
    정재: { keyword: '안정/축적', description: '꾸준한 재물 축적. 월급, 저축으로 자산 증가.' },
    편관: { keyword: '변화/압박', description: '직장, 환경 변화. 스트레스 있으나 성장의 기회.' },
    정관: { keyword: '명예/승진', description: '사회적 지위 상승. 승진, 합격, 명예 획득.' },
    편인: { keyword: '학문/고독', description: '공부, 자격증 취득에 유리. 정신적 성장 시기.' },
    정인: { keyword: '지원/보호', description: '귀인의 도움. 부모, 상사의 지원으로 성공.' },
  };

  const stemInterp = interpretations[stemTenGod] || { keyword: '미정', description: '' };
  const branchInterp = interpretations[branchTenGod] || { keyword: '미정', description: '' };

  // 오행 관계 분석
  const elementRelation = analyzeElementRelation(dayMasterElement, pillar.stemElement, pillar.branchElement);

  return {
    keywords: [stemInterp.keyword, branchInterp.keyword],
    stemDescription: stemInterp.description,
    branchDescription: branchInterp.description,
    elementAnalysis: elementRelation,
    overall: generateOverallDaeunSummary(stemTenGod, branchTenGod, pillar),
  };
}

/**
 * 오행 관계 분석
 */
function analyzeElementRelation(dayMasterElement, stemElement, branchElement) {
  const relation = ELEMENT_RELATIONS[dayMasterElement];
  const analysis = [];

  // 천간 분석
  if (stemElement === relation.isGeneratedBy) {
    analysis.push(`천간 ${stemElement}(${getElementName(stemElement)})이 일간을 생함 → 도움/지원`);
  } else if (stemElement === relation.isControlledBy) {
    analysis.push(`천간 ${stemElement}(${getElementName(stemElement)})이 일간을 극함 → 압박/시련`);
  } else if (stemElement === relation.generates) {
    analysis.push(`일간이 천간 ${stemElement}(${getElementName(stemElement)})을 생함 → 에너지 소모`);
  } else if (stemElement === relation.controls) {
    analysis.push(`일간이 천간 ${stemElement}(${getElementName(stemElement)})을 극함 → 재물/성취`);
  } else if (stemElement === dayMasterElement) {
    analysis.push(`천간이 일간과 같은 ${stemElement} → 경쟁/협력`);
  }

  // 지지 분석
  if (branchElement === relation.isGeneratedBy) {
    analysis.push(`지지 ${branchElement}(${getElementName(branchElement)})이 일간을 생함 → 기반/지원`);
  } else if (branchElement === relation.isControlledBy) {
    analysis.push(`지지 ${branchElement}(${getElementName(branchElement)})이 일간을 극함 → 환경적 어려움`);
  }

  return analysis;
}

/**
 * 오행 한글명
 */
function getElementName(element) {
  const names = { 목: '木', 화: '火', 토: '土', 금: '金', 수: '水' };
  return names[element] || element;
}

/**
 * 대운 종합 요약 생성
 */
function generateOverallDaeunSummary(stemTenGod, branchTenGod, pillar) {
  const positiveGods = ['정관', '정인', '정재', '식신'];
  const stemPositive = positiveGods.includes(stemTenGod);
  const branchPositive = positiveGods.includes(branchTenGod);

  if (stemPositive && branchPositive) {
    return `길운(吉運): ${pillar.korean} 대운은 천간과 지지 모두 좋은 기운. 안정과 성취의 시기.`;
  } else if (stemPositive || branchPositive) {
    return `반길반흉(半吉半凶): ${pillar.korean} 대운은 좋은 면과 어려운 면이 공존. 선택적 행동 필요.`;
  } else {
    return `도전운(挑戰運): ${pillar.korean} 대운은 시련과 변화가 있으나, 극복 시 큰 성장 가능.`;
  }
}

/**
 * 세운 (연운) 계산
 * @param {number} year - 연도
 * @param {Object} dayMaster - 일간 정보
 * @returns {Object} 세운 정보
 */
function calculateSeun(year, dayMaster) {
  // 연도로 천간/지지 계산
  // 갑자년 기준: 1984년이 갑자년
  const baseYear = 1984;
  const diff = year - baseYear;

  const stemIdx = ((diff % 10) + 10) % 10;
  const branchIdx = ((diff % 12) + 12) % 12;

  const pillar = createPillarInfo(stemIdx, branchIdx);

  // 십신 계산
  const stemTenGod = calculateTenGod(dayMaster.element, dayMaster.yinyang, pillar.stemElement, pillar.stemYinYang);
  const branchTenGod = calculateTenGod(dayMaster.element, dayMaster.yinyang, pillar.branchElement, pillar.stemYinYang);

  // 해석 생성
  const interpretation = generateSeunInterpretation(year, pillar, stemTenGod, branchTenGod, dayMaster);

  return {
    year: year,
    pillar: pillar,
    tenGod: {
      stem: stemTenGod,
      branch: branchTenGod,
      combined: `${stemTenGod}/${branchTenGod}`,
    },
    interpretation: interpretation,
  };
}

/**
 * 세운 해석 생성
 */
function generateSeunInterpretation(year, pillar, stemTenGod, branchTenGod, dayMaster) {
  const monthlyFortunes = generateMonthlyFortunes(year, dayMaster);

  return {
    yearSummary: `${year}년 ${pillar.full}년 - ${stemTenGod}/${branchTenGod} 운`,
    keywords: getSeunKeywords(stemTenGod, branchTenGod),
    advice: getSeunAdvice(stemTenGod, branchTenGod),
    monthlyFortunes: monthlyFortunes,
  };
}

/**
 * 세운 키워드
 */
function getSeunKeywords(stemTenGod, branchTenGod) {
  const keywords = {
    비견: '경쟁, 독립, 동료',
    겁재: '도전, 변화, 손재',
    식신: '안정, 수입, 건강',
    상관: '창의, 표현, 변동',
    편재: '투자, 확장, 유동',
    정재: '저축, 안정, 수입',
    편관: '변화, 스트레스, 성장',
    정관: '승진, 명예, 직장',
    편인: '학문, 자격, 사고',
    정인: '지원, 귀인, 보호',
  };

  return [keywords[stemTenGod] || '', keywords[branchTenGod] || ''];
}

/**
 * 세운 조언
 */
function getSeunAdvice(stemTenGod, branchTenGod) {
  const advices = {
    비견: '협력과 경쟁 사이에서 균형을 찾으세요.',
    겁재: '무리한 투자나 보증은 삼가세요.',
    식신: '건강 관리와 자기 개발에 집중하세요.',
    상관: '감정 표현을 절제하고 창작 활동에 에너지를 쏟으세요.',
    편재: '기회를 잡되 리스크 관리를 철저히 하세요.',
    정재: '꾸준한 저축과 안정적인 투자를 추천합니다.',
    편관: '변화에 유연하게 대처하고 건강을 챙기세요.',
    정관: '책임감 있는 행동으로 신뢰를 쌓으세요.',
    편인: '새로운 공부나 자격증 취득에 도전하세요.',
    정인: '주변의 도움에 감사하고 관계를 소중히 하세요.',
  };

  return [advices[stemTenGod] || '', advices[branchTenGod] || ''];
}

/**
 * 월운 (월별 운세) 생성
 * @param {number} year - 연도
 * @param {Object} dayMaster - 일간 정보
 * @returns {Array} 12개월 월운
 */
function generateMonthlyFortunes(year, dayMaster) {
  const months = [];

  // 연간 지지로 월건 시작점 계산
  // 寅월(1월) 시작 기준
  const yearDiff = year - 1984;
  const yearBranchIdx = ((yearDiff % 12) + 12) % 12;

  for (let month = 1; month <= 12; month++) {
    // 월건 계산 (복잡한 공식 간소화)
    const monthBranchIdx = (month + 1) % 12; // 인월(1월) = 2
    const monthStemIdx = ((year * 12 + month + 3) % 10);

    const pillar = createPillarInfo(monthStemIdx, monthBranchIdx);
    const stemTenGod = calculateTenGod(dayMaster.element, dayMaster.yinyang, pillar.stemElement, pillar.stemYinYang);

    months.push({
      month: month,
      monthName: `${month}월`,
      pillar: pillar,
      tenGod: stemTenGod,
      brief: getMonthBrief(stemTenGod),
    });
  }

  return months;
}

/**
 * 월운 간략 설명
 */
function getMonthBrief(tenGod) {
  const briefs = {
    비견: '경쟁 활발, 지출 주의',
    겁재: '변수 발생, 신중히',
    식신: '안정적, 건강 좋음',
    상관: '창의력 up, 말조심',
    편재: '수입 증가 가능',
    정재: '재정 안정',
    편관: '바쁨, 스트레스',
    정관: '인정받는 달',
    편인: '공부/사색 시기',
    정인: '귀인 만남',
  };
  return briefs[tenGod] || '평온';
}

/**
 * 종합 대운/세운 계산 (메인 함수)
 * @param {Object} manseryeokResult - mansae-calculator 결과
 * @param {string} birthDate - 생년월일 (YYYY-MM-DD)
 * @param {string} gender - '남' 또는 '여'
 * @param {number} currentYear - 현재 연도 (세운 계산용)
 * @returns {Object} 종합 대운/세운 정보
 */
function calculateFullFortuneCycles(manseryeokResult, birthDate, gender, currentYear = new Date().getFullYear()) {
  const { pillars } = manseryeokResult;

  // 일간 정보 추출
  const dayMasterStem = pillars.day.stem;
  const dayMasterIdx = getStemIndex(dayMasterStem);
  const dayMaster = {
    stem: dayMasterStem,
    element: STEMS_ELEMENTS[dayMasterIdx],
    yinyang: STEMS_YINYANG[dayMasterIdx],
  };

  // 년간 정보 추출 (대운 방향 결정용)
  const yearStemIdx = getStemIndex(pillars.year.stem);
  const yearStemYinYang = STEMS_YINYANG[yearStemIdx];

  // 대운 방향 결정
  const direction = getDaeunDirection(yearStemYinYang, gender);

  // 대운 시작 나이 계산
  const daeunStart = calculateDaeunStartAge(birthDate, direction);

  // 월주 정보 추출
  const monthPillar = {
    stem: pillars.month.stem,
    branch: pillars.month.branch,
  };

  // 대운 목록 생성
  const daeunList = generateDaeunList(monthPillar, direction, daeunStart.startAge, dayMaster);

  // 현재 나이 계산
  const birthYear = parseInt(birthDate.split('-')[0]);
  const currentAge = currentYear - birthYear + 1; // 한국 나이

  // 현재 대운 찾기
  const currentDaeun = daeunList.find(d => currentAge >= d.ageStart && currentAge <= d.ageEnd);

  // 세운 계산 (현재년도 + 향후 5년)
  const seunList = [];
  for (let y = currentYear; y <= currentYear + 5; y++) {
    seunList.push(calculateSeun(y, dayMaster));
  }

  return {
    dayMaster: {
      stem: dayMaster.stem,
      stemHanja: STEMS_HANJA[dayMasterIdx],
      element: dayMaster.element,
      elementHanja: getElementName(dayMaster.element),
      yinyang: dayMaster.yinyang,
      description: getDayMasterDescription(dayMaster.stem),
    },
    daeunInfo: {
      direction: daeunStart.directionKorean,
      startAge: daeunStart.startAge,
      daysToTerm: daeunStart.daysToTerm,
    },
    currentAge: currentAge,
    currentDaeun: currentDaeun,
    daeunList: daeunList,
    currentSeun: seunList[0],
    seunList: seunList,
    summary: generateFortuneSummary(currentDaeun, seunList[0], dayMaster),
  };
}

/**
 * 일간 설명
 */
function getDayMasterDescription(stem) {
  const descriptions = {
    갑: '갑목(甲木) - 큰 나무, 리더십, 진취적, 고집',
    을: '을목(乙木) - 풀/꽃, 유연함, 적응력, 예술성',
    병: '병화(丙火) - 태양, 열정적, 밝음, 리더',
    정: '정화(丁火) - 촛불/별, 섬세함, 따뜻함, 지혜',
    무: '무토(戊土) - 산/대지, 신뢰, 안정, 중재',
    기: '기토(己土) - 논밭, 실용적, 포용력, 신중',
    경: '경금(庚金) - 철/도검, 결단력, 의리, 강직',
    신: '신금(辛金) - 보석/귀금속, 섬세함, 예민, 완벽주의',
    임: '임수(壬水) - 바다/강, 지혜, 포용력, 유동적',
    계: '계수(癸水) - 비/이슬, 직관, 침착, 내성적',
  };
  return descriptions[stem] || '';
}

/**
 * 종합 운세 요약 생성
 */
function generateFortuneSummary(currentDaeun, currentSeun, dayMaster) {
  if (!currentDaeun) {
    return '대운 정보를 계산할 수 없습니다.';
  }

  const daeunGod = currentDaeun.tenGod.combined;
  const seunGod = currentSeun.tenGod.combined;

  return `현재 ${currentDaeun.pillar.korean} 대운(${daeunGod})과 ${currentSeun.year}년 ${currentSeun.pillar.korean}년(${seunGod})이 교차하는 시기입니다. ` +
    `${currentDaeun.interpretation.overall} ` +
    `올해는 ${currentSeun.interpretation.keywords.join(', ')}의 기운이 강합니다.`;
}

module.exports = {
  calculateFullFortuneCycles,
  calculateSeun,
  getStemIndex,
  getBranchIndex,
  STEMS,
  STEMS_HANJA,
  BRANCHES,
  BRANCHES_HANJA,
};
