// 언어별 리포트 합격 기준 (루브릭)
//
// 목적
// ---------------------------------
// "번역이 됐는가"가 아니라 "그 언어권 부모가 읽고 자기 얘기라고 느끼는가"를 잰다.
// 지금은 오프라인 평가(scripts/eval-localization.js)가 소비하지만, 임계값을
// 넘지 못한 생성물을 출력 단계로 보내지 않는 게이트로도 그대로 쓸 수 있게
// 데이터로 분리해 둔다.
//
// 왜 언어마다 다른가
// ---------------------------------
// 실패하는 방식이 언어마다 다르다. 프랑스어는 근거 없는 칭찬 남발과 규칙에 이유를
// 안 붙이는 데서 티가 나고, 일본어는 명령형과 과한 친밀 어투에서, 태국어는
// 대립적 화법에서 티가 난다. 공통 점수 하나로는 이걸 못 잡는다.
//
// 채점 주체
// ---------------------------------
// grounding은 주입된 신호 목록(buildKnowledgeContext().signals)에 대해 신호별로
// 채점하므로 대상이 고정돼 있다. 나머지 축은 LLM 심판이 1~5로 매긴다.
// 심판 점수는 흔들리므로 여러 번 채점해 다수결/중앙값을 쓴다.

// 모든 언어에 공통으로 적용되는 축
const SHARED_CRITERIA = [
  {
    id: 'grounding',
    label: 'Grounding retention',
    prompt: 'For each injected signal, does the report carry it as something a parent could act on today (concrete), merely gesture at the theme in wording that would fit any child (generic), or omit it (absent)?',
  },
  // 주: 게이트가 보는 축은 grounding 전체가 아니라 groundingScript다. 이유는
  // 아래 THRESHOLD 주석 참고.
  {
    id: 'nativeness',
    label: 'Native writing',
    prompt: 'Does this read as though it was written in this language from the start, or as a translation? Judge sentence rhythm, collocations, and whether any phrasing is a calque.',
  },
  {
    id: 'register',
    label: 'Parent-child register',
    prompt: 'Would a parent in this culture actually say the quoted lines to their child, in that tone, at that level of directness?',
  },
  {
    id: 'actionability',
    label: 'Actionability',
    prompt: 'Can the parent do something specific today from this report, or is the advice mostly general encouragement?',
  },
];

// 실패로 간주하는 절대 조건 (점수와 무관하게 탈락)
const HARD_FAILURES = [
  {
    id: 'korean_residue',
    label: 'Korean characters in a non-Korean report',
    check: (report, language) => (language === 'ko' ? false : /[가-힣]/.test(report)),
  },
  {
    id: 'korean_pillar_names',
    label: 'Pillar names written in Hangul instead of hanja',
    check: (report, language) => (language === 'ko' ? false : /[가-힣]{2}\s*\(/.test(report)),
  },
];

// THRESHOLD 보정 근거 (2026-08-11 측정, output/localization/eval-v2.json)
// ---------------------------------
// 게이트는 grounding 전체가 아니라 groundingScript를 본다.
//
// 주입 신호를 줄 단위로 세면 원국 하나에 29~42개가 나오는데, 리포트 하나가 그걸
// 전부 구체적으로 담는 것은 애초에 불가능하다. 게다가 analytic 신호(십성 분포 같은
// 판단 근거)는 프롬프트가 "그대로 나열하지 말라"고 금지하고 있어 낮게 나오는 것이
// 정상이다. 실제로 analytic 보존율은 ko 6% / fr 5%로 언어와 무관하게 바닥이다.
//
// 언어 간 차이가 실제로 드러나는 축은 script(부모가 소리 내어 읽는 대사)다:
//   ko 68% / fr 47% (심판 자기일관성 88~92%)
// 그래서 임계값은 script 축에 건다. ko 0.65는 현재 통과선 바로 아래, 다른 언어
// 0.6은 "한국어에 크게 뒤지지 않을 것"을 뜻한다. 프랑스어는 현재 이 선에서 떨어지며,
// 그것이 이 게이트가 잡아내야 할 상태다.
const LANGUAGE_RUBRIC = {
  ko: {
    label: 'Korean',
    thresholds: { groundingScript: 0.65, nativeness: 4, register: 4, actionability: 4 },
    nativeCues: [
      '부모가 소리 내어 읽을 수 있는 길이의 대사인가',
      '진단하듯 단정하지 않고 경향으로 서술하는가',
    ],
    failureModes: [
      '명리 용어를 풀지 않고 그대로 나열',
      '보고서형 라벨이 많아 번역체처럼 읽힘',
    ],
  },
  en: {
    label: 'English',
    thresholds: { groundingScript: 0.6, nativeness: 4, register: 4, actionability: 4 },
    nativeCues: [
      'Choice-giving phrasing ("Do you want A or B?") rather than bare commands',
      'Praise names the specific effort, not the child\'s worth',
    ],
    failureModes: [
      'Fortune-telling register instead of parenting-guide register',
      'Advice that only a Korean household context makes sense of',
    ],
  },
  ja: {
    label: 'Japanese',
    thresholds: { groundingScript: 0.6, nativeness: 4, register: 4, actionability: 4 },
    nativeCues: [
      '「〜しようね」「〜してみようか」のような誘いかけになっているか',
      '控えめで具体的な称賛になっているか',
    ],
    failureModes: [
      '命令形が強すぎる／親子の距離感が近すぎる',
      '韓国語の語彙がそのまま台詞に混ざる',
    ],
  },
  zh: {
    label: 'Chinese',
    thresholds: { groundingScript: 0.6, nativeness: 4, register: 4, actionability: 4 },
    nativeCues: [
      '以努力和进步为框架，而非天赋论',
      '家庭作为归属感而非亏欠感',
    ],
    failureModes: [
      '出现「别人家的孩子」式比较',
      '把家庭说成孩子欠下的债',
    ],
  },
  vi: {
    label: 'Vietnamese',
    thresholds: { groundingScript: 0.6, nativeness: 4, register: 4, actionability: 4 },
    nativeCues: [
      'Dùng đại từ thân mật (con, mẹ, ba) trong lời thoại',
      'Giọng khuyến khích trực tiếp và ấm áp',
    ],
    failureModes: [
      'Văn phong lạnh, mang tính lâm sàng',
      'Lời khuyên phê bình trước mặt người khác',
    ],
  },
  id: {
    label: 'Indonesian',
    thresholds: { groundingScript: 0.6, nativeness: 4, register: 4, actionability: 4 },
    nativeCues: [
      'Sapaan Bunda/Ayah dan Nak terasa wajar dalam kutipan',
      'Koreksi disampaikan dengan tenang dan tidak mempermalukan',
    ],
    failureModes: [
      'Nada terlalu langsung atau keras',
      'Membuat anak kehilangan muka di depan orang lain',
    ],
  },
  es: {
    label: 'Spanish',
    thresholds: { groundingScript: 0.6, nativeness: 4, register: 4, actionability: 4 },
    nativeCues: [
      'Diminutivos y trato afectuoso naturales en las frases citadas',
      'Escenas de familia (comidas, hermanos) como contexto',
    ],
    failureModes: [
      'Redacción fría o clínica',
      'Horarios rígidos que ignoran el ritmo familiar real',
    ],
  },
  pt: {
    label: 'Portuguese',
    thresholds: { groundingScript: 0.6, nativeness: 4, register: 4, actionability: 4 },
    nativeCues: [
      'Tratamento afetuoso e informal nas falas',
      'Humor como forma de baixar a tensão',
    ],
    failureModes: [
      'Formalidade excessiva',
      'Rotina única e rígida assumida como padrão',
    ],
  },
  fr: {
    label: 'French',
    thresholds: { groundingScript: 0.6, nativeness: 4, register: 4, actionability: 4 },
    nativeCues: [
      'La règle est accompagnée d\'une raison courte ("parce que…")',
      'Chaleur mesurée plutôt qu\'éloges empilés',
      'Guillemets français « » pour les paroles citées',
    ],
    failureModes: [
      'Éloges superlatifs à chaque action',
      'Rituels importés qu\'aucun parent français ne dirait',
      'Vocabulaire de "cycles/destin" laissé tel quel',
    ],
  },
  th: {
    label: 'Thai',
    thresholds: { groundingScript: 0.6, nativeness: 4, register: 4, actionability: 4 },
    nativeCues: [
      'ใช้คำลงท้ายสุภาพและเรียกลูกว่า "หนู" อย่างเป็นธรรมชาติ',
      'การตักเตือนเป็นไปอย่างนุ่มนวลและเป็นส่วนตัว',
    ],
    failureModes: [
      'บทพูดที่เป็นการเผชิญหน้าหรือเสียงดัง',
      'การทำให้เด็กเสียหน้าต่อหน้าผู้อื่น',
    ],
  },
};

function getRubric(language) {
  return LANGUAGE_RUBRIC[language] || LANGUAGE_RUBRIC.en;
}

/**
 * 루브릭 통과 여부를 판정한다.
 * @param {Object} scores { grounding: 0~1, nativeness: 1~5, register: 1~5, actionability: 1~5 }
 * @param {string} report 생성된 리포트 본문 (하드 실패 검사용)
 * @param {string} language
 */
function evaluateAgainstRubric(scores, report, language) {
  const rubric = getRubric(language);
  const failures = [];

  for (const hard of HARD_FAILURES) {
    if (hard.check(report || '', language)) failures.push({ type: 'hard', id: hard.id, label: hard.label });
  }
  for (const [key, min] of Object.entries(rubric.thresholds)) {
    const got = scores?.[key];
    if (typeof got !== 'number') {
      failures.push({ type: 'missing', id: key, label: `${key} not scored` });
    } else if (got < min) {
      failures.push({ type: 'threshold', id: key, label: `${key} ${got} < ${min}` });
    }
  }
  return { pass: failures.length === 0, failures, thresholds: rubric.thresholds };
}

module.exports = {
  SHARED_CRITERIA,
  HARD_FAILURES,
  LANGUAGE_RUBRIC,
  getRubric,
  evaluateAgainstRubric,
};
