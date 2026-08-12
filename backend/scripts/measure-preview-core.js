#!/usr/bin/env node
// 프리뷰 표제와 AI 본문이 같은 오행을 말하는가.
//
// 화면 상단 상자는 **일간(日干)** 으로 기질을 정한다(프론트 `getCoreElement`).
// 그 아래 AI 본문이 **개수 최다** 오행을 "core temperament"라고 부르면, 부모는 한
// 화면에서 서로 다른 두 아이 얘기를 읽는다. 라이브 en 프리뷰에서 실제로 나왔다:
// 표제 `Water (水) Temperament` / 본문 "strongly fire-forward (many fire elements)".
//
// 재는 방법:
//   두 기준이 **어긋나는** 원국만 고른다(맞는 원국에서는 결함이 보이지 않는다).
//   생성된 본문에서 오행 글자를 순서대로 뽑아, **처음 등장하는 오행**이 일간 기질과
//   같은지 본다. 첫 오행이 기질을 규정하는 자리이기 때문이다.
//
//   한자(木火土金水)는 열 개 언어에서 모두 같은 글자라 언어별 파서가 필요 없다.
//   프롬프트가 "한자를 괄호에 함께 쓰라"고 요구하므로 비한국어 출력에도 나타난다.
//   한국어 출력은 한글 오행명(목/화/토/금/수)도 함께 인정한다.
//
// 실행:
//   node scripts/measure-preview-core.js                 # 10개 언어 × 기본 원국 3개
//   LANGS=en,ja FIXTURES=2 node scripts/measure-preview-core.js
//   OUT=../output/preview-core-after.json node scripts/measure-preview-core.js

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { calculateMansae, STEM_ELEMENT } = require('../src/utils/mansae-wrapper');
const sajuService = require('../src/services/saju.service');

const HANJA = { 목: '木', 화: '火', 토: '土', 금: '金', 수: '水' };
const ALL_LANGS = ['ko', 'en', 'ja', 'zh', 'vi', 'id', 'es', 'pt', 'fr', 'th'];

const langs = (process.env.LANGS || ALL_LANGS.join(',')).split(',').map((s) => s.trim());
const fixtureCount = Number(process.env.FIXTURES || 3);
const outPath = process.env.OUT || null;

// 계산기의 오행 개수는 영어 키다. 일간 기질은 한글이라 그냥 비교하면 항상 어긋나 보인다.
const EN_TO_KO = { wood: '목', fire: '화', earth: '토', metal: '금', water: '수' };

/** 개수 최다 오행(한글). 동점이면 키 순서 — 프로덕션과 같은 규칙이라 그대로 둔다. */
function dominantOf(elements) {
  const key = Object.entries(elements).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
  return EN_TO_KO[key] || key;
}

/**
 * 일간 기질과 개수 최다가 어긋나는 원국을 찾는다. 어긋나는 원국에서만 결함이 드러난다.
 * 날짜는 고정 순서로 훑으므로 실행할 때마다 같은 표본이 나온다.
 */
function findDisagreeingFixtures(limit) {
  const found = [];
  const seenCores = new Set();
  // 기질 오행이 서로 다른 원국을 고른다. 표본이 전부 '목'이면 그 오행 하나에서만
  // 재는 셈이고, 나머지 넷에서 무슨 일이 벌어지는지는 알 수 없다.
  for (let year = 2010; year <= 2024 && found.length < limit; year++) {
    for (let month = 1; month <= 12 && found.length < limit; month += 1) {
      const birthDate = `${year}-${String(month).padStart(2, '0')}-14`;
      const m = calculateMansae(birthDate, '14:30', '여', { hourUnknown: false });
      if (m.error || !m.pillars) continue;
      const core = STEM_ELEMENT[m.pillars.day.korean[0]];
      const dominant = dominantOf(m.elements);
      if (!core || core === dominant) continue;
      if (seenCores.has(core)) continue;
      seenCores.add(core);
      found.push({ birthDate, birthTime: '14:30', gender: 'female', core, dominant, elements: m.elements });
    }
  }
  return found;
}

/** 본문에 등장하는 오행을 나온 순서대로. 한자 우선, 한국어 출력은 한글명도 인정. */
function elementMentions(text, language) {
  const hits = [];
  const koNames = { 목: '목', 화: '화', 토: '토', 금: '금', 수: '수' };
  // 한국어 본문은 오행을 한글로 쓴다. 천간과 붙은 형태(갑목, 임수)도 기질을 부르는
  // 자리이므로 인정한다 — 처음 이 형태를 놓쳐서 ko 점수가 실제보다 낮게 나왔다.
  const STEMS = '갑을병정무기경신임계';
  const pattern = language === 'ko'
    ? new RegExp(`[木火土金水]|(?<=[${STEMS}])[목화토금수]|(?<![가-힣])[목화토금수]`, 'g')
    : /[木火土金水]/g;
  for (const match of text.matchAll(pattern)) {
    const ch = match[0];
    const ko = Object.keys(HANJA).find((k) => HANJA[k] === ch) || koNames[ch];
    if (ko) hits.push(ko);
  }
  return hits;
}

async function measureOne(fixture, language) {
  const preview = await sajuService.generateSajuPreview({
    birthDate: fixture.birthDate,
    birthTime: fixture.birthTime,
    gender: fixture.gender,
    language,
  });

  const text = preview?.aiPreview?.shortText || '';
  const mentions = elementMentions(String(text), language);
  const first = mentions[0] || null;

  return {
    language,
    birthDate: fixture.birthDate,
    core: fixture.core,
    dominant: fixture.dominant,
    firstMention: first,
    // 첫 오행이 일간 기질이면 표제와 본문이 같은 아이를 말한다.
    agrees: first === fixture.core,
    // 오행을 하나도 안 쓴 경우는 별도로 센다 — 합격도 불합격도 아니다.
    noMention: first === null,
    // 편중 오행도 언급했는가. 표제 일치만 좇다가 "원국에 무엇이 많은가"를 통째로
    // 잃으면 프리뷰가 얇아진다 — 두 값을 같이 봐야 과교정을 알아챌 수 있다.
    mentionsDominant: mentions.includes(fixture.dominant),
    // 비한국어 출력에 한글이 섞였는가. 프롬프트 본문이 한국어라 항상 새어나갈 위험이 있다.
    hangulLeak: language !== 'ko' && /[가-힣]/.test(String(text)),
    mentions: mentions.slice(0, 6),
    excerpt: String(text).slice(0, 220).replace(/\s+/g, ' '),
  };
}

(async () => {
  const fixtures = findDisagreeingFixtures(fixtureCount);
  if (fixtures.length === 0) throw new Error('일간 기질과 개수 최다가 어긋나는 원국을 찾지 못했다');

  console.log('측정 대상 원국 (일간 기질 ≠ 개수 최다):');
  fixtures.forEach((f) => console.log(`  ${f.birthDate}  기질 ${f.core}(${HANJA[f.core]})  최다 ${f.dominant}(${HANJA[f.dominant]})`));
  console.log(`언어: ${langs.join(', ')}\n`);

  const rows = [];
  for (const language of langs) {
    for (const fixture of fixtures) {
      try {
        const row = await measureOne(fixture, language);
        rows.push(row);
        const mark = row.noMention ? '·' : row.agrees ? 'OK' : 'X ';
        console.log(`${mark} ${language.padEnd(3)} ${row.birthDate}  기질 ${row.core} / 최다 ${row.dominant} → 첫 언급 ${row.firstMention || '(없음)'}`);
        if (!row.agrees && !row.noMention) console.log(`     "${row.excerpt}"`);
      } catch (err) {
        console.log(`!  ${language} ${fixture.birthDate} 실패: ${err.message}`);
        rows.push({ language, birthDate: fixture.birthDate, error: err.message });
      }
    }
  }

  const scored = rows.filter((r) => !r.error && !r.noMention);
  const agreed = scored.filter((r) => r.agrees);
  console.log(`\n일치 ${agreed.length}/${scored.length} (${scored.length ? Math.round((agreed.length / scored.length) * 100) : 0}%)`);

  const byLang = {};
  for (const r of scored) {
    byLang[r.language] = byLang[r.language] || { ok: 0, total: 0 };
    byLang[r.language].total++;
    if (r.agrees) byLang[r.language].ok++;
  }
  for (const [lang, s] of Object.entries(byLang)) console.log(`  ${lang.padEnd(3)} ${s.ok}/${s.total}`);

  const withDominant = scored.filter((r) => r.mentionsDominant).length;
  console.log(`편중 오행도 언급 ${withDominant}/${scored.length}`);

  const nonKo = rows.filter((r) => !r.error && r.language !== 'ko');
  const leaks = nonKo.filter((r) => r.hangulLeak);
  console.log(`비한국어 출력의 한글 혼입 ${leaks.length}/${nonKo.length}${leaks.length ? ' — ' + leaks.map((r) => r.language).join(', ') : ''}`);

  const noMention = rows.filter((r) => r.noMention).length;
  const errors = rows.filter((r) => r.error).length;
  if (noMention) console.log(`  (오행 언급 없음 ${noMention}건 — 채점에서 제외)`);
  if (errors) console.log(`  (생성 실패 ${errors}건)`);

  if (outPath) {
    const abs = path.resolve(__dirname, outPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, JSON.stringify({ fixtures, rows }, null, 2));
    console.log(`\n기록: ${abs}`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
