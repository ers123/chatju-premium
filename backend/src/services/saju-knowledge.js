/**
 * 사주 지식 선택기 (Saju knowledge selector)
 *
 * 명리학 교안·단행본에서 증류한 지식 베이스(src/data/saju-knowledge/)에서
 * 계산된 사주 원국에 실제로 해당하는 조각만 골라 프롬프트용 컨텍스트로 만든다.
 *
 * 선택은 전적으로 만세력 계산값에 의해 결정된다(결정론적). AI가 지식을 고르지
 * 않으므로 같은 사주는 항상 같은 근거를 받는다.
 *
 * 주입 언어는 한국어지만 출력 언어는 상위 프롬프트가 지정하므로 10개 언어 전부에
 * 동일하게 적용된다.
 */

const { STEM_ELEMENT, BRANCH_ELEMENT } = require('../utils/mansae-wrapper');
const { TEN_GODS, TEN_GOD_MATRIX, GROUPS } = require('../data/saju-knowledge/ten-gods');
const BRANCH = require('../data/saju-knowledge/branch-relations');
const SEASONAL = require('../data/saju-knowledge/seasonal-tuning');
const ELEMENTS = require('../data/saju-knowledge/element-patterns');
const PARENT = require('../data/saju-knowledge/parent-child');
const { getCulturalRegister } = require('../data/saju-knowledge/cultural-register');
const { getLocalizedHarmfulPhrases } = require('../data/saju-knowledge/harmful-phrases-i18n');

const YANG_STEMS = new Set(['갑', '병', '무', '경', '임']);
const YANG_BRANCHES = new Set(['자', '인', '진', '오', '신', '술']);

const ELEMENT_RELATIONS = {
  목: { generates: '화', isGeneratedBy: '수', controls: '토', isControlledBy: '금' },
  화: { generates: '토', isGeneratedBy: '목', controls: '금', isControlledBy: '수' },
  토: { generates: '금', isGeneratedBy: '화', controls: '수', isControlledBy: '목' },
  금: { generates: '수', isGeneratedBy: '토', controls: '목', isControlledBy: '화' },
  수: { generates: '목', isGeneratedBy: '금', controls: '화', isControlledBy: '토' },
};

// 십성 → 그룹
const GROUP_OF = {
  비견: '비겁', 겁재: '비겁',
  식신: '식상', 상관: '식상',
  편재: '재성', 정재: '재성',
  편관: '관성', 정관: '관성',
  편인: '인성', 정인: '인성',
};

// 그룹별 대표 십성 (부재 설명에 사용 — 안정형인 정(正) 쪽을 대표로)
const GROUP_REPRESENTATIVE = {
  비겁: '비견', 식상: '식신', 재성: '정재', 관성: '정관', 인성: '정인',
};

const ELEMENT_KEY_MAP = { wood: '목', fire: '화', earth: '토', metal: '금', water: '수' };

function normalizeElements(raw) {
  const out = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const [k, v] of Object.entries(raw || {})) {
    const key = ELEMENT_KEY_MAP[k] || k;
    if (key in out) out[key] = v;
  }
  return out;
}

/** 일간 대비 대상 글자의 십성을 판정한다. */
function tenGodOf(dayElement, dayIsYang, targetElement, targetIsYang) {
  if (!dayElement || !targetElement) return null;
  const rel = ELEMENT_RELATIONS[dayElement];
  if (!rel) return null;
  const same = dayIsYang === targetIsYang;
  if (targetElement === dayElement) return TEN_GOD_MATRIX[same ? 'sameElementSameYin' : 'sameElementDiffYin'];
  if (rel.generates === targetElement) return TEN_GOD_MATRIX[same ? 'generatesSameYin' : 'generatesDiffYin'];
  if (rel.controls === targetElement) return TEN_GOD_MATRIX[same ? 'controlsSameYin' : 'controlsDiffYin'];
  if (rel.isControlledBy === targetElement) return TEN_GOD_MATRIX[same ? 'controlledBySameYin' : 'controlledByDiffYin'];
  if (rel.isGeneratedBy === targetElement) return TEN_GOD_MATRIX[same ? 'generatedBySameYin' : 'generatedByDiffYin'];
  return null;
}

/** 원국 8글자(또는 6글자)에서 일간을 제외한 십성 분포를 센다. */
function countTenGods(pillars, dayStem) {
  const dayElement = STEM_ELEMENT[dayStem];
  const dayIsYang = YANG_STEMS.has(dayStem);
  const counts = {};
  const groupCounts = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };

  for (const key of ['year', 'month', 'day', 'hour']) {
    const p = pillars?.[key];
    if (!p?.korean) continue;
    const stem = p.korean[0];
    const branch = p.korean[1];
    // 일간 자신(아신)은 십성 계산에서 제외한다
    if (!(key === 'day')) {
      const g = tenGodOf(dayElement, dayIsYang, STEM_ELEMENT[stem], YANG_STEMS.has(stem));
      if (g) { counts[g] = (counts[g] || 0) + 1; groupCounts[GROUP_OF[g]] += 1; }
    }
    if (branch) {
      const g = tenGodOf(dayElement, dayIsYang, BRANCH_ELEMENT[branch], YANG_BRANCHES.has(branch));
      if (g) { counts[g] = (counts[g] || 0) + 1; groupCounts[GROUP_OF[g]] += 1; }
    }
  }
  return { counts, groupCounts };
}

/** 원국 지지에서 실제로 성립하는 합/충/형을 찾는다. */
function findBranchRelations(branchList) {
  const has = (b) => branchList.includes(b);
  const found = { samhap: [], banhap: [], yukhap: [], chung: [], hyeong: [] };

  for (const [key, val] of Object.entries(BRANCH.SAMHAP || {})) {
    if (key.split('').every(has)) found.samhap.push({ key, ...val });
  }
  for (const [key, val] of Object.entries(BRANCH.BANHAP || {})) {
    if (key.split('').every(has)) found.banhap.push({ key, ...val });
  }
  for (const [key, val] of Object.entries(BRANCH.YUKHAP || {})) {
    if (key.split('').every(has)) found.yukhap.push({ key, ...val });
  }
  for (const [key, val] of Object.entries(BRANCH.CHUNG || {})) {
    if (key.split('').every(has)) found.chung.push({ key, ...val });
  }
  for (const [key, val] of Object.entries(BRANCH.HYEONG || {})) {
    const chars = key.split('');
    // 자형(같은 글자 2개)은 해당 글자가 2번 이상 나와야 성립
    const isSelf = new Set(chars).size === 1;
    const ok = isSelf
      ? branchList.filter((b) => b === chars[0]).length >= 2
      : chars.every(has);
    if (ok) found.hyeong.push({ key, ...val });
  }
  // 삼합이 성립하면 그 안의 반합은 중복이므로 제거
  if (found.samhap.length) {
    const covered = new Set(found.samhap.flatMap((s) => s.key.split('')));
    found.banhap = found.banhap.filter((b) => !b.key.split('').every((c) => covered.has(c)));
  }
  return found;
}

function ageGroupKey(age) {
  if (age <= 3) return '영유아';
  if (age <= 7) return '유아기';
  if (age <= 10) return '초등저학년';
  if (age <= 13) return '초등고학년';
  if (age <= 16) return '중학생';
  return '고등학생';
}

function parentRelationKey(parentElement, childElement) {
  if (!parentElement || !childElement) return null;
  if (parentElement === childElement) return 'same';
  const rel = ELEMENT_RELATIONS[parentElement];
  if (!rel) return null;
  if (rel.generates === childElement) return 'parentGeneratesChild';
  if (rel.isGeneratedBy === childElement) return 'childGeneratesParent';
  if (rel.controls === childElement) return 'parentControlsChild';
  if (rel.isControlledBy === childElement) return 'childControlsParent';
  return null;
}

const DYNAMIC_KEY_MAP = {
  parentGeneratesChild: 'generates',
  childGeneratesParent: 'generatedBy',
  parentControlsChild: 'controls',
  childControlsParent: 'controlledBy',
  same: 'same',
};

// 비한국어 리포트에서 이 블록을 "어떻게 쓸지" 지시한다.
//
// 이전 지시문은 "Translate every idea here into {language}"였다. 그 결과를 재보니
// (2026-08-11, output/localization/) 프랑스어는 주제는 살리지만 문구 수준 신호를
// 잃고 일반 육아 조언으로 후퇴했다 — 근거 보존율 ko 75% vs fr 50%. 번역을 시키니
// 번역체가 나오거나, 번역이 어려운 대사는 통째로 일반론으로 대체된 것이다.
//
// 그래서 지시를 "번역"에서 "기능 이식"으로 바꾼다. 한국어 대사는 옮겨야 할 문장이
// 아니라 '무엇을 해내는 말인지'를 보여주는 예시로 규정하고, 같은 기능을 하는 그
// 나라 부모의 실제 말을 새로 쓰게 한다. 한국어 금지·간지 표기 같은 기존 제약은
// 힘들게 얻은 것이므로 그대로 유지한다.
// 2026-08-11 판정 (localization_findings_2026-08-11.md §7)
//
// 처음 잰 결과로는 "효과 없음"이었으나 그 계측기가 망가져 있었다. 신호 목록을
// 결정론화하고 3회 채점·복수 원국으로 다시 재니 결론이 뒤집혔다. fr 3원국 기준
// 대사(script) 보존율:
//   꺼짐 36% / 25%   (평균 30%)
//   켜짐 57% / 55%   (평균 56%, 두 실행 편차 2pt)
// 26pt 차이가 재현됐고 두 조건의 범위가 겹치지 않는다.
//
// 단, 처음엔 켜면 6건 중 4건이 presentationStatus=fallback으로 떨어졌다. 원인은
// 내용이 아니라 형태였다 — 지시를 번호 목록으로 쓰자 모델이 그 구조를 출력
// 템플릿으로 모방해 라벨 계약을 깼다. 평문으로 낮추자 보존율 57%를 유지한 채
// 폴백이 0/3이 됐다.
//
// 켜는 범위는 "측정된 언어만"이다. 각 언어를 3원국 × 조건당 2회로 재고, 범위가
// 겹치지 않을 때만 목록에 넣는다. 나머지 언어는 대사 저작본이 없어 한국어로
// 폴백한다.
//
//   fr: 30% -> 56% (범위 25-36 / 55-57, 겹침 없음), fallback 0
//   ja: 43% -> 61% (범위 33-53 / 57-65, 겹침 없음), fallback 3/6 -> 0/6
//
// 일본어는 부수 효과가 더 컸다. 꺼짐 상태에서는 모델이 한국어 원본 대사를
// 그대로 베껴 「넌 왜 네 의견이 없어?」 같은 문장이 일본어 유료 리포트의
// 「避ける言葉」에 인쇄됐다(6건 중 5낱말). 대사가 처음부터 일본어면 베낄 것이
// 없어 0이 됐다.
const LOCALIZED_VOICE_LANGUAGES = new Set(
  (process.env.SAJU_LOCALIZED_VOICE_LANGUAGES || 'fr,ja')
    .split(',').map((s) => s.trim()).filter(Boolean)
);
// 전체를 강제로 켜고/끄고 재볼 때 쓰는 노브 (측정용).
const LOCALIZED_VOICE_FORCE = process.env.SAJU_LOCALIZED_VOICE;

function isLocalizedVoiceEnabled(language) {
  if (LOCALIZED_VOICE_FORCE === '1') return true;
  if (LOCALIZED_VOICE_FORCE === '0') return false;
  return LOCALIZED_VOICE_LANGUAGES.has(language);
}

function buildNonKoreanUsageBlock(language, outputLangName) {
  const lang = outputLangName || 'the report language';

  if (!isLocalizedVoiceEnabled(language)) {
    // 측정된 기존 동작 (2026-08-08 이후 프로덕션에서 돌던 그대로).
    return [
      `※ This reference block is written in Korean, but the report is written in ${lang}.`,
      '   Your output must not contain a single Korean character. Translate every idea here into',
      `   ${lang} — including inside quoted parent scripts, month names, and pillar names.`,
      '   Write pillar names in Chinese characters (丁酉), never in Korean letters (정유).',
    ];
  }

  const register = getCulturalRegister(language);

  return [
    `※ HOW TO USE THIS BLOCK — the report is written in ${lang}.`,
    // 형태 주의: 번호 목록·소제목·불릿을 쓰지 않는다. 이 블록 맨 위 경고대로
    // 모델은 참고 블록의 생김새를 출력 템플릿으로 모방하는 습성이 있고, 실제로
    // 번호 목록으로 썼을 때 6건 중 4건이 presentationStatus=fallback으로 떨어졌다
    // (2026-08-11 측정). 지시 내용은 그대로 두고 형태만 주변 ※ 주석과 같게 낮춘다.
    '   The Korean lines below are source data. They are NOT text to translate.',
    '   The analytic lines (distribution, which signal applies, why) are facts about this',
    '   chart, and are the basis of what you claim.',
    `   The quoted parent lines show what a sentence must accomplish, not the sentence to`,
    `   reproduce. Work out what each one does, then write a fresh line that a ${lang}-speaking`,
    '   parent would really say to accomplish the same thing. A translated Korean sentence is',
    '   a failure, and so is replacing it with generic advice such as "be patient" — that drops',
    '   the very thing the parent paid for.',
    '   Every concrete mechanism in the source (an agreed stop-signal, a specific substitution',
    `   of words, a named activity) must survive as an equally concrete mechanism in ${lang},`,
    `   rebuilt from ${lang} family life rather than transplanted.`,
    '   Output must not contain a single Korean character, including inside quoted parent lines,',
    '   month names, and pillar names. Write pillar names in Chinese characters (丁酉), never in',
    '   Korean letters (정유).',
    ...(register ? [
      `※ When you write any quoted line, match how parents actually talk in ${register.label}.`,
      '   These are common defaults, not rules about any one family.',
      ...register.lines.map((l) => `   ${l}`),
    ] : []),
  ];
}

/**
 * 계산된 사주에 해당하는 지식만 골라 프롬프트 주입용 마크다운을 만든다.
 *
 * @returns {{ text: string, selected: Object }} text=프롬프트 주입 문자열, selected=선택 근거(로깅/테스트용)
 */
function buildKnowledgeContext({
  childManseryeok,
  parentManseryeok = null,
  parentRole = null,
  childAge = null,
  language = 'ko',
  outputLangName = null,
} = {}) {
  const pillars = childManseryeok?.pillars;
  if (!pillars?.day?.korean) return { text: '', selected: { reason: 'no_pillars' } };

  const dayStem = pillars.day.korean[0];
  const dayElement = STEM_ELEMENT[dayStem];
  const elements = normalizeElements(childManseryeok.elements);
  const selected = {};
  const blocks = [];

  // ── 1. 십성 분포 ──────────────────────────────────────────────
  const { counts, groupCounts } = countTenGods(pillars, dayStem);
  selected.tenGodCounts = counts;
  selected.tenGodGroups = groupCounts;

  const groupLine = Object.entries(groupCounts)
    .map(([g, n]) => `${g} ${n}`).join(' / ');
  const tenGodLines = [`**십성 분포(일간 제외):** ${groupLine}`];

  // 과다 그룹(3개 이상) — 그 안에서 실제로 가장 많이 나온 십성을 대표로
  const excessGroup = Object.entries(groupCounts)
    .filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1])[0];
  if (excessGroup) {
    const [gName] = excessGroup;
    const dominant = Object.entries(counts)
      .filter(([g]) => GROUP_OF[g] === gName)
      .sort((a, b) => b[1] - a[1])[0];
    const godName = dominant ? dominant[0] : GROUP_REPRESENTATIVE[gName];
    const g = TEN_GODS[godName];
    if (g) {
      selected.excessTenGod = godName;
      tenGodLines.push(
        `**${gName} 과다 — 대표 십성 ${godName}(${g.hanja})**`,
        `- 아이 특성: ${g.childTrait}`,
        `- 강점: ${g.strength}`,
        `- 살펴볼 지점: ${g.watchFor}`,
        `- 과다할 때: ${g.excess}`,
        `- 부모 대화: ${g.parentScript}`,
      );
    }
  }

  // 부재 그룹(0개)
  const absentGroups = Object.entries(groupCounts).filter(([, n]) => n === 0).map(([g]) => g);
  if (absentGroups.length) {
    selected.absentGroups = absentGroups;
    for (const gName of absentGroups.slice(0, 2)) {
      const godName = GROUP_REPRESENTATIVE[gName];
      const g = TEN_GODS[godName];
      if (g) {
        tenGodLines.push(
          `**${gName} 부재(0개)** — ${GROUPS[gName] || ''}`,
          `- 없을 때: ${g.absent}`,
        );
      }
    }
  }
  blocks.push({ title: '십성(十星) — 관계와 심리의 코드', lines: tenGodLines });

  // ── 2. 조후: 일간 × 태어난 계절 ────────────────────────────────
  const monthBranch = pillars.month?.korean?.[1];
  const season = monthBranch ? SEASONAL.BRANCH_SEASON?.[monthBranch] : null;
  const seasonEntry = season ? SEASONAL.DAY_MASTER_SEASON?.[dayStem]?.[season] : null;
  if (seasonEntry) {
    selected.season = season;
    blocks.push({
      title: `조후(調候) — ${dayStem}일간이 ${season}(${monthBranch}월)에 태어남`,
      lines: [
        `- 상태: ${seasonEntry.state}`,
        `- 아이 특성: ${seasonEntry.childTrait}`,
        `- 필요한 것: ${seasonEntry.needs}`,
        `- 부모 팁: ${seasonEntry.parentTip}`,
      ],
    });
  }

  // ── 3. 지지 관계(합·충·형) ─────────────────────────────────────
  const branchList = ['year', 'month', 'day', 'hour']
    .map((k) => pillars[k]?.korean?.[1]).filter(Boolean);
  const rel = findBranchRelations(branchList);
  const relLines = [];
  for (const s of rel.samhap.slice(0, 2)) relLines.push(`**삼합 ${s.key} → ${s.name || s.element}:** ${s.childMeaning}`);
  for (const s of rel.banhap.slice(0, 2)) relLines.push(`**반합 ${s.key} → ${s.name || s.element}국:** ${s.childMeaning}`);
  for (const s of rel.yukhap.slice(0, 1)) relLines.push(`**육합 ${s.key}:** ${s.childMeaning}`);
  for (const s of rel.chung.slice(0, 2)) relLines.push(`**${s.name || s.key + '충'}(변화·자극):** ${s.childMeaning} → ${s.parentTip}`);
  for (const s of rel.hyeong.slice(0, 1)) relLines.push(`**${s.name || s.key + '형'}(조율):** ${s.childMeaning} → ${s.parentTip}`);
  if (relLines.length) {
    selected.branchRelations = {
      samhap: rel.samhap.map((x) => x.key), banhap: rel.banhap.map((x) => x.key),
      yukhap: rel.yukhap.map((x) => x.key), chung: rel.chung.map((x) => x.key),
      hyeong: rel.hyeong.map((x) => x.key),
    };
    blocks.push({ title: '지지 관계 — 원국 안에서 실제로 성립하는 것만', lines: relLines });
  }

  // ── 4. 십이운성(일지·월지) + 신살 ──────────────────────────────
  const stageMap = BRANCH.TWELVE_STAGE_MAP?.[dayStem];
  const stageLines = [];
  if (stageMap) {
    for (const [label, key] of [['일지(자기 자리)', 'day'], ['월지(자라는 환경)', 'month']]) {
      const b = pillars[key]?.korean?.[1];
      const stage = b ? stageMap[b] : null;
      const info = stage ? BRANCH.TWELVE_STAGES?.[stage] : null;
      if (info) stageLines.push(`**${label} ${b} → ${stage}:** ${info.energy} — ${info.childMeaning}`);
    }
  }
  const sinsalLines = [];
  for (const [name, s] of Object.entries(BRANCH.SINSAL || {})) {
    if (Array.isArray(s.branches) && s.branches.some((b) => branchList.includes(b))) {
      sinsalLines.push(`**${name}(${s.hanja}):** ${s.childMeaning} → ${s.parentTip}`);
    }
  }
  const cheoneul = BRANCH.CHEONEUL_MAP?.[dayStem];
  if (Array.isArray(cheoneul) && cheoneul.some((b) => branchList.includes(b)) && BRANCH.SINSAL?.['천을귀인']) {
    sinsalLines.push(`**천을귀인(天乙貴人):** ${BRANCH.SINSAL['천을귀인'].childMeaning}`);
  }
  if (stageLines.length || sinsalLines.length) {
    selected.stages = stageLines.length;
    selected.sinsal = sinsalLines.length;
    blocks.push({ title: '십이운성 · 신살', lines: [...stageLines, ...sinsalLines.slice(0, 3)] });
  }

  // ── 5. 오행 편중 패턴 ──────────────────────────────────────────
  const elemLines = [];
  const excessElem = Object.entries(elements).filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1])[0];
  if (excessElem && ELEMENTS.EXCESS?.[excessElem[0]]) {
    const e = ELEMENTS.EXCESS[excessElem[0]];
    selected.excessElement = excessElem[0];
    elemLines.push(
      `**${e.label}(${excessElem[1]}개)**`,
      `- 내면: ${e.psychology}`,
      `- 관찰되는 장면: ${e.behavior}`,
      `- 반복되는 마찰: ${e.friction}`,
      `- 대응: ${e.parentTip}`,
    );
  }
  const absentElem = Object.entries(elements).filter(([, n]) => n === 0).map(([k]) => k);
  for (const el of absentElem.slice(0, 1)) {
    const a = ELEMENTS.ABSENT?.[el];
    if (!a) continue;
    selected.absentElement = el;
    elemLines.push(
      `**${a.label}(0개)**`,
      `- 내면: ${a.psychology}`,
      `- 관찰되는 장면: ${a.behavior}`,
      `- 대응: ${a.parentTip}`,
      `- 생활 보완 — 색: ${a.supplement.colors} / 음식: ${a.supplement.foods} / 활동: ${a.supplement.activities} / 공간: ${a.supplement.space}`,
    );
  }
  for (const [key, t] of Object.entries(ELEMENTS.TENSION || {})) {
    if ((elements[t.controller] || 0) >= 2 && (elements[t.controlled] || 0) >= 2) {
      selected.tension = key;
      elemLines.push(
        `**${t.controller}·${t.controlled} 긴장:** ${t.childMeaning}`,
        `- 통관 오행 ${t.mediator}: ${t.parentTip}`,
      );
      break;
    }
  }
  if (elemLines.length) blocks.push({ title: '오행 편중 패턴', lines: elemLines });

  // ── 6. 연령대 발달 ─────────────────────────────────────────────
  if (childAge != null) {
    const stage = PARENT.AGE_STAGES?.[ageGroupKey(childAge)];
    if (stage) {
      selected.ageStage = ageGroupKey(childAge);
      blocks.push({
        title: `연령 발달 — ${selected.ageStage}(${stage.range})`,
        lines: [
          `- 발달 과제: ${stage.developmental}`,
          `- 사주가 드러나는 방식: ${stage.sajuLens}`,
          `- 부모 초점: ${stage.parentFocus}`,
          `- 흔한 오해: ${stage.cautions}`,
        ],
      });
    }
  }

  // ── 7. 부모-자녀 관계 역학 ─────────────────────────────────────
  if (parentManseryeok?.pillars?.day?.korean) {
    const pStem = parentManseryeok.pillars.day.korean[0];
    const pElement = STEM_ELEMENT[pStem];
    const relKey = parentRelationKey(pElement, dayElement);
    const dyn = relKey ? PARENT.RELATION_DYNAMICS?.[relKey] : null;
    const label = parentRole === 'father' ? '아빠' : '엄마';
    if (dyn) {
      selected.parentRelation = relKey;
      const lines = [
        `${label} 일간 ${pStem}(${pElement}) × 아이 일간 ${dayStem}(${dayElement}) — ${dyn.label}`,
        `- 겉으로 보이는 것: ${dyn.surface}`,
        `- 실제로 일어나는 것: ${dyn.hidden}`,
        `- 반복되는 갈등 장면: ${dyn.commonConflict}`,
        `- 관점 전환: ${dyn.reframe}`,
        `- 실제 대사: ${dyn.script}`,
      ];
      const short = ELEMENTS.PARENT_CHILD_DYNAMIC?.[DYNAMIC_KEY_MAP[relKey]];
      if (short) lines.push(`- 오행 관점: ${short.meaning} (주의: ${short.risk}) → ${short.tip}`);
      blocks.push({ title: '부모-자녀 관계 역학', lines });
    }
  }

  // ── 8. 아이 기질 오행에 특히 상처가 되는 말 ────────────────────
  const harmful = PARENT.HARMFUL_PHRASES?.[dayElement];
  if (Array.isArray(harmful) && harmful.length) {
    selected.harmfulPhrases = dayElement;
    // 이 블록은 부모가 그대로 소리 내어 읽는 대사다. 한국어 원문을 그대로 주면
    // 비한국어 리포트에서는 모델이 옮기다 지쳐 통째로 일반 조언으로 바꿔 버린다
    // (측정: output/localization/, 손실이 집중된 지점이 정확히 여기였다).
    // 저작본이 있는 언어에는 그 언어의 대사를 그대로 주고, why(분석)만 원문을
    // 유지한다. 저작본이 없으면 기존 동작대로 한국어를 준다.
    // 측정 결과 개선이 없었고(90% → 80%) 그 실행에서 레이아웃이 fallback으로
    // 떨어졌다. n=1이라 인과를 단정할 수는 없지만, 이득이 확인되지 않은 변경을
    // 유료 리포트에 켜 둘 이유가 없어 기본값은 꺼짐이다.
    const localized = isLocalizedVoiceEnabled(language) ? getLocalizedHarmfulPhrases(language, dayElement) : null;
    selected.harmfulPhrasesLocalized = !!localized;
    const pairs = harmful.slice(0, 3);
    blocks.push({
      title: `${dayElement} 기질 아이에게 특히 상처가 되는 말`,
      lines: pairs.map((p, i) => {
        const loc = localized?.[i];
        return loc
          ? `- 피할 말 ${loc.avoid} (${p.why}) → 대신 ${loc.instead}`
          : `- 피할 말 "${p.avoid}" (${p.why}) → 대신 "${p.instead}"`;
      }),
    });
  }

  // ── 9. 대운/세운을 설명하는 방식 ───────────────────────────────
  const framing = PARENT.FORTUNE_FRAMING;
  if (framing) {
    blocks.push({
      title: '대운·세운 설명 원칙 (공포를 주지 않는 서술)',
      lines: [
        `- 대운: ${framing.daeun}`,
        `- 세운: ${framing.seun}`,
        `- 전환기: ${framing.transition}`,
        `- 핵심 원칙: ${framing.principle}`,
      ],
    });
  }

  if (!blocks.length) return { text: '', selected };

  // 출력 형식 오염 방지: 이 블록은 참고 자료일 뿐이므로 리포트 본문이 쓰는 마크다운
  // 서식(### 제목, **라벨:**, 불릿)을 절대 쓰지 않는다. 모델이 이 블록의 구조를
  // 출력 템플릿으로 모방하면 섹션 라벨 계약이 깨진다.
  const plain = (s) => String(s).replace(/\*\*/g, '').replace(/^\s*[-*]\s*/, '');

  const text = [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '[참고 자료] 명리 해석 근거 — 교재 기반, 이 아이 원국에 해당하는 것만 선별',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '※ 이 블록은 해석의 재료일 뿐 출력 형식이 아니다. 아래의 제목·들여쓰기·문장을',
    '   그대로 옮겨 쓰지 말 것. 리포트의 섹션 구조와 라벨은 시스템 메시지의',
    '   라벨 계약만을 따른다.',
    '※ 용어(십성·합충·십이운성 등)를 그대로 나열하지 말고 반드시',
    '   "보이는 근거 → 관찰되는 행동 → 부모 행동" 순서로 풀어서 쓸 것.',
    '※ 아래에 없는 내용을 지어내지 말 것.',
    // 이 블록은 한국어로 쓰여 있고 출력 언어는 상위 프롬프트가 정한다. 언어가 가까운
    // 일본어에서는 모델이 주입된 한국어 낱말을 부모 대사 안에 그대로 섞어 쓰는 일이 있어
    // (예: 「なんで 말이 없어？」) 비한국어 리포트에는 명시적 금지를 덧붙인다.
    ...(language === 'ko' ? [] : buildNonKoreanUsageBlock(language, outputLangName)),
    '',
    ...blocks.map((b) => [
      `〈${plain(b.title)}〉`,
      ...b.lines.map((l) => `   ${plain(l)}`),
      '',
    ].join('\n')),
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '[참고 자료 끝] 이제부터 출력은 시스템 메시지의 섹션·라벨 계약을 그대로 따른다.',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  ].join('\n');

  // 평가용 신호 목록. 주입된 블록의 각 줄이 곧 "이 리포트가 담아야 할 근거" 하나다.
  //
  // 왜 여기서 만드는가: 2026-08-11 평가에서 심판에게 소스를 주고 신호를 직접
  // 뽑게 했더니 호출마다 10~13개로 요동쳤고, 그 탓에 같은 산출물이 50%와 77%로
  // 나왔다(localization_findings_2026-08-11.md §5). 채점 대상 목록이 흔들리면
  // 어떤 개입도 판정할 수 없다. 목록은 주입 시점에 결정론적으로 확정하고,
  // 심판에게는 채점만 시킨다.
  // 신호에 종류를 붙인다. 42개를 한 덩어리로 세면 언어별 차이가 희석된다 —
  // 리포트 하나가 주입된 모든 줄을 구체적으로 담을 수는 없으므로 전체 보존율은
  // 어느 언어나 낮게 깔리고, 정작 차이가 나는 지점이 묻힌다.
  // 'script'는 부모가 그대로 소리 내어 읽는 대사(따옴표가 있거나 대화/팁 계열),
  // 'analytic'은 판단 근거다. 번역 부하가 걸리는 쪽은 script다.
  const SCRIPT_HINT = /(부모 대화|부모 팁|피할 말|대신|"|“|»|«)/;
  const signals = blocks.flatMap((b, bi) => b.lines.map((l, li) => {
    const text = plain(l);
    return {
      id: `${bi + 1}.${li + 1}`,
      block: plain(b.title),
      kind: SCRIPT_HINT.test(text) ? 'script' : 'analytic',
      text,
    };
  }));

  return { text, selected, signals };
}

module.exports = {
  buildKnowledgeContext,
  // 테스트/검증용
  tenGodOf,
  countTenGods,
  findBranchRelations,
  parentRelationKey,
  ageGroupKey,
};
