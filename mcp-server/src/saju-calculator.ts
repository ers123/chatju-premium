/**
 * Saju Calculator — Four Pillars of Destiny (사주팔자)
 *
 * Pure TypeScript implementation derived from SoMyung's mansae-wrapper.
 * Calculates Four Pillars, Five Element balance, and returns structured
 * temperament data for AI hosts to interpret.
 *
 * No external dependencies — all astronomical/calendar logic is self-contained.
 */

// ─── Constants ───────────────────────────────────────────────────────

const HEAVENLY_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"] as const;
const HEAVENLY_STEMS_HANJA = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;

const EARTHLY_BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"] as const;
const EARTHLY_BRANCHES_HANJA = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

const STEM_ELEMENT: Record<string, ElementKo> = {
  갑: "목", 을: "목", 병: "화", 정: "화",
  무: "토", 기: "토", 경: "금", 신: "금",
  임: "수", 계: "수",
};

const BRANCH_ELEMENT: Record<string, ElementKo> = {
  인: "목", 묘: "목", 사: "화", 오: "화",
  진: "토", 술: "토", 축: "토", 미: "토",
  신: "금", 유: "금", 해: "수", 자: "수",
};

const MONTH_BRANCHES = ["인", "묘", "진", "사", "오", "미", "신", "유", "술", "해", "자", "축"] as const;

const ELEMENT_EN: Record<ElementKo, ElementEn> = {
  목: "wood", 화: "fire", 토: "earth", 금: "metal", 수: "water",
};

const ELEMENT_KO: Record<ElementEn, ElementKo> = {
  wood: "목", fire: "화", earth: "토", metal: "금", water: "수",
};

const ELEMENT_HANJA: Record<ElementKo, string> = {
  목: "木", 화: "火", 토: "土", 금: "金", 수: "水",
};

const ELEMENT_EMOJI: Record<ElementEn, string> = {
  wood: "🌳", fire: "🔥", earth: "🏔️", metal: "⚔️", water: "💧",
};

// ─── Types ───────────────────────────────────────────────────────────

type ElementKo = "목" | "화" | "토" | "금" | "수";
type ElementEn = "wood" | "fire" | "earth" | "metal" | "water";

interface Pillar {
  stem: string;
  branch: string;
  stemHanja: string;
  branchHanja: string;
  element: string;
  korean: string;
  hanja: string;
}

interface FourPillars {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
}

interface ElementBalance {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

export interface TemperamentProfile {
  fourPillars: FourPillars;
  dayMaster: {
    stem: string;
    hanja: string;
    element: ElementEn;
    elementKo: ElementKo;
    elementHanja: string;
  };
  elementBalance: ElementBalance;
  dominantElement: ElementEn;
  weakestElement: ElementEn;
  personalityTraits: string[];
  learningStyle: string;
  socialStyle: string;
  emotionalPattern: string;
  parentTips: string[];
  elementDescription: string;
  birthInfo: {
    date: string;
    time: string | null;
    gender: "M" | "F";
    childName: string | null;
    timeProvided: boolean;
  };
}

// ─── Element Trait Data ──────────────────────────────────────────────

export const ELEMENT_TRAITS: Record<ElementEn, {
  personality: string[];
  learningStyle: string;
  socialStyle: string;
  emotionalPattern: string;
  parentTips: string[];
  description: string;
  strengths: string[];
  challenges: string[];
  compatibleElements: ElementEn[];
  conflictElements: ElementEn[];
}> = {
  wood: {
    personality: [
      "Creative and imaginative",
      "Independent and self-directed",
      "Growth-oriented — always reaching for the next challenge",
      "Compassionate and generous with friends",
      "Can be stubborn when set on an idea",
    ],
    learningStyle: "Self-paced, autonomous learning. Thrives when given freedom to explore topics in their own way. Benefits from hands-on projects and creative assignments.",
    socialStyle: "Natural leader among peers. Prefers small, close-knit friend groups. May clash with authority figures due to independent streak.",
    emotionalPattern: "Expresses frustration through anger or withdrawal. Needs physical outlets (sports, outdoor play) to process emotions. Resilient — bounces back quickly.",
    parentTips: [
      "Give them choices rather than direct orders",
      "Channel their independence into leadership roles (class monitor, team captain)",
      "Provide outdoor time and nature exposure — wood energy needs physical expression",
      "Avoid overly rigid schedules; allow creative free time",
      "Encourage their ideas even when impractical — nurture the creative spark",
    ],
    description: "Wood (목/木) represents growth, flexibility, and new beginnings — like a tree reaching toward the sky. Wood children are natural creators and pioneers who need room to grow.",
    strengths: ["Creativity", "Leadership", "Resilience", "Vision"],
    challenges: ["Stubbornness", "Impatience", "Overextending themselves"],
    compatibleElements: ["water", "fire"],
    conflictElements: ["metal"],
  },
  fire: {
    personality: [
      "Passionate and enthusiastic about everything",
      "Expressive and warm — lights up a room",
      "Quick to laugh, quick to cry — emotionally vivid",
      "Loves being the center of attention",
      "Can burn out quickly if overstimulated",
    ],
    learningStyle: "Short bursts of intense focus. Active, social learning environments. Excels with games, performances, and group activities. Needs variety — gets bored with repetition.",
    socialStyle: "Magnetic personality that attracts friends easily. The entertainer of the group. May struggle with deeper one-on-one connections due to need for stimulation.",
    emotionalPattern: "Emotions flare up fast and settle quickly. Needs validation and praise. Can become anxious if ignored or understimulated. Joy is their default state.",
    parentTips: [
      "Keep activities varied — fire children wilt with monotony",
      "Celebrate their achievements enthusiastically (they feed on encouragement)",
      "Teach them to pace themselves — rest is not weakness",
      "Use storytelling and dramatic play for difficult lessons",
      "Help them develop patience through cooking, gardening, or art projects",
    ],
    description: "Fire (화/火) represents passion, warmth, and illumination — like a flame that draws everyone closer. Fire children are natural performers who bring joy and energy wherever they go.",
    strengths: ["Enthusiasm", "Charisma", "Emotional intelligence", "Creativity"],
    challenges: ["Impulsiveness", "Burnout", "Difficulty with routine"],
    compatibleElements: ["wood", "earth"],
    conflictElements: ["water"],
  },
  earth: {
    personality: [
      "Stable and grounding presence among friends",
      "Nurturing — the caretaker of the group",
      "Reliable and follows through on commitments",
      "Thoughtful and methodical in approach",
      "Can be overly cautious or resistant to change",
    ],
    learningStyle: "Routine-based, familiar environments. Learns best with consistent schedules and trusted teachers. Excels at building knowledge step by step. Needs time to absorb before moving on.",
    socialStyle: "The loyal, dependable friend. Prefers established friend groups over new acquaintances. Mediates conflicts naturally. May struggle with transitions (new school, new class).",
    emotionalPattern: "Internalizes emotions — may seem calm on the surface while worrying inside. Needs physical comfort (hugs, favorite blanket) during stress. Seeks reassurance from trusted adults.",
    parentTips: [
      "Maintain consistent daily routines — predictability is their anchor",
      "Give advance notice before changes (new school, moving, schedule shifts)",
      "Create a cozy, stable home environment with their own dedicated space",
      "Encourage them to try new things gently — don't force sudden changes",
      "Validate their feelings even when they seem to be 'overthinking'",
    ],
    description: "Earth (토/土) represents stability, nourishment, and trustworthiness — like the ground that supports all life. Earth children are the reliable foundation of any group.",
    strengths: ["Reliability", "Empathy", "Patience", "Loyalty"],
    challenges: ["Resistance to change", "Worry/anxiety", "Overaccommodating others"],
    compatibleElements: ["fire", "metal"],
    conflictElements: ["wood"],
  },
  metal: {
    personality: [
      "Precise and detail-oriented",
      "Strong sense of right and wrong",
      "Focused and disciplined when engaged",
      "Values quality over quantity in everything",
      "Can be perfectionistic and self-critical",
    ],
    learningStyle: "Structured, step-by-step instruction. Thrives with clear rules and expectations. Excels in subjects requiring precision (math, music, coding). Needs quiet, organized workspace.",
    socialStyle: "Selective about friends — quality over quantity. Respects rules and expects others to as well. Can come across as rigid or bossy. Deeply loyal once trust is established.",
    emotionalPattern: "Controls emotions tightly — may seem detached. Expresses sadness through withdrawal rather than tears. Needs structured ways to process feelings (journaling, music).",
    parentTips: [
      "Provide clear structure and expectations — ambiguity causes anxiety",
      "Celebrate effort, not just perfection — counteract their self-critical tendency",
      "Give them organizing tasks they can excel at (sorting, cataloging, planning)",
      "Teach flexibility through games where rules change mid-play",
      "Model emotional expression — show them it's safe to be imperfect",
    ],
    description: "Metal (금/金) represents precision, strength, and clarity — like a finely crafted blade. Metal children are natural perfectionists who bring order and excellence to everything they do.",
    strengths: ["Focus", "Discipline", "Precision", "Integrity"],
    challenges: ["Perfectionism", "Rigidity", "Difficulty expressing emotions"],
    compatibleElements: ["earth", "water"],
    conflictElements: ["fire"],
  },
  water: {
    personality: [
      "Intuitive and deeply perceptive",
      "Sensitive to others' emotions and environment",
      "Adaptable — flows around obstacles",
      "Imaginative with a rich inner world",
      "Can be fearful or anxious in unfamiliar situations",
    ],
    learningStyle: "Quiet, flexible environments. Learns through observation and reflection. Benefits from creative expression (art, music, writing). Needs freedom to learn at their own pace without pressure.",
    socialStyle: "The empathic listener in the group. Deeply connected to a few close friends. May absorb others' emotions and need alone time to recharge. Natural counselor even as a child.",
    emotionalPattern: "Highly sensitive — picks up on subtle emotional cues. May cry easily or seem overwhelmed in chaotic environments. Needs quiet downtime and a safe space to retreat to.",
    parentTips: [
      "Respect their need for alone time — it's recharging, not withdrawing",
      "Create a calm, low-stimulation environment for homework and rest",
      "Use gentle approaches — harsh discipline backfires with water children",
      "Encourage journaling, drawing, or music as emotional outlets",
      "Build their confidence gradually — avoid pushing into spotlight situations",
    ],
    description: "Water (수/水) represents intuition, depth, and adaptability — like a river that always finds its way. Water children are natural empaths with profound emotional intelligence.",
    strengths: ["Intuition", "Empathy", "Adaptability", "Wisdom beyond their years"],
    challenges: ["Anxiety", "Oversensitivity", "Indecisiveness"],
    compatibleElements: ["metal", "wood"],
    conflictElements: ["earth"],
  },
};

// ─── Solar Terms ─────────────────────────────────────────────────────

const SOLAR_TERMS = [
  { month: 2, day: 4 },   // 입춘 — 寅月 start
  { month: 3, day: 6 },   // 경칩 — 卯月 start
  { month: 4, day: 5 },   // 청명 — 辰月 start
  { month: 5, day: 6 },   // 입하 — 巳月 start
  { month: 6, day: 6 },   // 망종 — 午月 start
  { month: 7, day: 7 },   // 소서 — 未月 start
  { month: 8, day: 8 },   // 입추 — 申月 start
  { month: 9, day: 8 },   // 백로 — 酉月 start
  { month: 10, day: 8 },  // 한로 — 戌月 start
  { month: 11, day: 7 },  // 입동 — 亥月 start
  { month: 12, day: 7 },  // 대설 — 子月 start
  { month: 1, day: 6 },   // 소한 — 丑月 start
];

// ─── Pillar Calculations ─────────────────────────────────────────────

function getLunarMonthIndex(gMonth: number, gDay: number): number {
  for (let i = SOLAR_TERMS.length - 1; i >= 0; i--) {
    const term = SOLAR_TERMS[i];
    if (term.month === 1) {
      if (gMonth === 1 && gDay > term.day) return 11;
      continue;
    }
    if (term.month === 12) {
      if (gMonth === 12 && gDay > term.day) return 10;
      if (gMonth === 1) return 10;
      continue;
    }
    if (gMonth > term.month || (gMonth === term.month && gDay > term.day)) {
      return i;
    }
  }
  return 11;
}

function calculateYearPillar(year: number) {
  const cycleIndex = ((year - 4) % 60 + 60) % 60;
  const stemIndex = cycleIndex % 10;
  const branchIndex = cycleIndex % 12;
  return { stemIndex, branchIndex };
}

function calculateMonthPillar(gMonth: number, gDay: number, yearStemIndex: number) {
  const lunarMonthIndex = getLunarMonthIndex(gMonth, gDay);
  const branch = MONTH_BRANCHES[lunarMonthIndex];
  const branchIndex = EARTHLY_BRANCHES.indexOf(branch);

  let effectiveYearStemIndex = yearStemIndex;
  if (gMonth === 1 || (gMonth === 2 && gDay < 4)) {
    effectiveYearStemIndex = (yearStemIndex - 1 + 10) % 10;
  }

  const yearStemGroup = effectiveYearStemIndex % 5;
  const firstMonthStem = [2, 4, 6, 8, 0][yearStemGroup];
  const stemIndex = (firstMonthStem + lunarMonthIndex) % 10;

  return { stemIndex, branchIndex };
}

function calculateDayPillar(year: number, month: number, day: number) {
  // Julian Day Number algorithm
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y +
    Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  // Day pillar cycles from a known reference
  // Jan 1, 1900 (JDN 2415021) = 갑자 (index 0 in 60-cycle) — actually index 0
  const reference = 2415021;
  const cycleIndex = ((jdn - reference) % 60 + 60) % 60;
  const stemIndex = cycleIndex % 10;
  const branchIndex = cycleIndex % 12;

  return { stemIndex, branchIndex };
}

function calculateHourPillar(hour: number, dayStemIndex: number) {
  // Hour → Earthly Branch (2-hour periods, starting from 자시 23:00-01:00)
  const branchIndex = Math.floor(((hour + 1) % 24) / 2);

  // Hour stem from day stem
  const dayGroup = dayStemIndex % 5;
  const firstHourStem = [0, 2, 4, 6, 8][dayGroup];
  const stemIndex = (firstHourStem + branchIndex) % 10;

  return { stemIndex, branchIndex };
}

function buildPillar(stemIndex: number, branchIndex: number): Pillar {
  const stem = HEAVENLY_STEMS[stemIndex];
  const branch = EARTHLY_BRANCHES[branchIndex];
  return {
    stem,
    branch,
    stemHanja: HEAVENLY_STEMS_HANJA[stemIndex],
    branchHanja: EARTHLY_BRANCHES_HANJA[branchIndex],
    element: `${STEM_ELEMENT[stem]} + ${BRANCH_ELEMENT[branch]}`,
    korean: stem + branch,
    hanja: HEAVENLY_STEMS_HANJA[stemIndex] + EARTHLY_BRANCHES_HANJA[branchIndex],
  };
}

// ─── Element Balance Calculation ─────────────────────────────────────

function calculateElementBalance(pillars: FourPillars): ElementBalance {
  const counts: ElementBalance = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };

  for (const pillar of [pillars.year, pillars.month, pillars.day, pillars.hour]) {
    const stemEl = STEM_ELEMENT[pillar.stem];
    const branchEl = BRANCH_ELEMENT[pillar.branch];
    if (stemEl) counts[ELEMENT_EN[stemEl]]++;
    if (branchEl) counts[ELEMENT_EN[branchEl]]++;
  }

  return counts;
}

// ─── Main Calculator ─────────────────────────────────────────────────

export function calculateTemperament(
  birthDate: string,
  birthTime: string | null,
  gender: "M" | "F",
  childName: string | null = null,
): TemperamentProfile {
  const [year, month, day] = birthDate.split("-").map(Number);
  if (!year || !month || !day) {
    throw new Error(`Invalid birth date format: ${birthDate}. Expected YYYY-MM-DD.`);
  }

  const timeProvided = birthTime !== null && birthTime !== undefined;
  const [hour, minute] = timeProvided
    ? birthTime!.split(":").map(Number)
    : [12, 0]; // Default to noon when time unknown

  // Calculate four pillars
  const yearCalc = calculateYearPillar(year);
  const monthCalc = calculateMonthPillar(month, day, yearCalc.stemIndex);
  const dayCalc = calculateDayPillar(year, month, day);
  const hourCalc = calculateHourPillar(hour, dayCalc.stemIndex);

  const fourPillars: FourPillars = {
    year: buildPillar(yearCalc.stemIndex, yearCalc.branchIndex),
    month: buildPillar(monthCalc.stemIndex, monthCalc.branchIndex),
    day: buildPillar(dayCalc.stemIndex, dayCalc.branchIndex),
    hour: buildPillar(hourCalc.stemIndex, hourCalc.branchIndex),
  };

  // Element balance
  const elementBalance = calculateElementBalance(fourPillars);

  // Determine dominant and weakest elements
  const entries = Object.entries(elementBalance) as [ElementEn, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const dominantElement = entries[0][0];
  const weakestElement = entries[entries.length - 1][0];

  // Day master
  const dayMasterStem = fourPillars.day.stem;
  const dayMasterElementKo = STEM_ELEMENT[dayMasterStem];
  const dayMasterElement = ELEMENT_EN[dayMasterElementKo];

  // Get trait data for dominant element
  const traits = ELEMENT_TRAITS[dominantElement];

  return {
    fourPillars,
    dayMaster: {
      stem: dayMasterStem,
      hanja: fourPillars.day.stemHanja,
      element: dayMasterElement,
      elementKo: dayMasterElementKo,
      elementHanja: ELEMENT_HANJA[dayMasterElementKo],
    },
    elementBalance,
    dominantElement,
    weakestElement,
    personalityTraits: traits.personality,
    learningStyle: traits.learningStyle,
    socialStyle: traits.socialStyle,
    emotionalPattern: traits.emotionalPattern,
    parentTips: traits.parentTips,
    elementDescription: traits.description,
    birthInfo: {
      date: birthDate,
      time: birthTime,
      gender,
      childName,
      timeProvided,
    },
  };
}

/**
 * Get detailed element information.
 */
export function getElementDetails(element: ElementEn) {
  const traits = ELEMENT_TRAITS[element];
  const ko = ELEMENT_KO[element];

  return {
    element,
    elementKo: ko,
    elementHanja: ELEMENT_HANJA[ko],
    emoji: ELEMENT_EMOJI[element],
    ...traits,
    generationCycle: getGenerationCycle(element),
    controlCycle: getControlCycle(element),
  };
}

function getGenerationCycle(element: ElementEn): { generates: ElementEn; generatedBy: ElementEn } {
  const cycle: Record<ElementEn, { generates: ElementEn; generatedBy: ElementEn }> = {
    wood: { generates: "fire", generatedBy: "water" },
    fire: { generates: "earth", generatedBy: "wood" },
    earth: { generates: "metal", generatedBy: "fire" },
    metal: { generates: "water", generatedBy: "earth" },
    water: { generates: "wood", generatedBy: "metal" },
  };
  return cycle[element];
}

function getControlCycle(element: ElementEn): { controls: ElementEn; controlledBy: ElementEn } {
  const cycle: Record<ElementEn, { controls: ElementEn; controlledBy: ElementEn }> = {
    wood: { controls: "earth", controlledBy: "metal" },
    fire: { controls: "metal", controlledBy: "water" },
    earth: { controls: "water", controlledBy: "wood" },
    metal: { controls: "wood", controlledBy: "fire" },
    water: { controls: "fire", controlledBy: "earth" },
  };
  return cycle[element];
}
