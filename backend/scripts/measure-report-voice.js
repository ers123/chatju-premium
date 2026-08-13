#!/usr/bin/env node
// 리포트 문체(보고서체 vs 상담사의 편지) 측정.
//
// 배경: ko 리포트조차 nativeness 3/5 — 번역이 아니라 문체 문제(2026-08-11 계측).
// The Pattern의 세련됨은 구체성·심리적 결·매끄러운 산문에서 온다. 우리 리포트는
// 계약상 라벨 구조를 유지해야 하므로(presentation 파서), 개입 지점은 내러티브
// 슬롯과 필드 문장의 문체다.
//
// 토큰 경제:
// - 리포트는 measure-premium-artifacts.js의 캐시를 그대로 읽는다. 재생성 0.
// - 결정론 형태 지표(공짜)를 먼저 찍고, 심판은 리포트당 N회(기본 3)만 부른다.
// - 심판 입력은 리포트 앞 6000자만 준다 — 문체는 앞부분에서 결정되고,
//   전체를 주면 호출당 입력이 3배가 되는데 판정은 달라지지 않는다.
//
// 심판 축(1-5, 중앙값):
//   nativeness  — 그 언어 원어민 상담사가 쓴 글로 읽히는가
//   warmth      — 양식/보고서가 아니라 이 가족에게 쓴 편지로 읽히는가
//   specificity — 장면이 구체적인가(과교정 감시 — 산문화가 내용을 비우면 여기가 떨어진다)
//
// 사용법:
//   LANGS=ko,en node scripts/measure-report-voice.js --label=baseline
//   node scripts/measure-report-voice.js --label=after   # 캐시 전체

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { getAIService } = require('../src/services/ai.service');

const CACHE_DIR = path.resolve(__dirname, process.env.CACHE || '../../output/premium-artifacts');
const OUT_DIR = path.resolve(__dirname, '../../output/voice');
const ROUNDS = Number(process.env.ROUNDS || 3);
const label = (process.argv.find((a) => a.startsWith('--label=')) || '--label=run').split('=')[1];
const langsFilter = process.env.LANGS ? process.env.LANGS.split(',') : null;

const LANG_NAMES = { ko: 'Korean', en: 'English', ja: 'Japanese', zh: 'Simplified Chinese', vi: 'Vietnamese', id: 'Indonesian', es: 'Spanish', pt: 'Brazilian Portuguese', fr: 'French', th: 'Thai' };

// ── 결정론 형태 지표 ──────────────────────────────────────────────────────
function formStats(text) {
  const lines = text.split('\n');
  const bulletLines = lines.filter((l) => /^\s*(?:[-*]|\d+[).])\s/.test(l));
  // 산문 = 불릿도 헤딩도 라벨도 아닌, 이어지는 문장 줄
  const proseLines = lines.filter((l) => {
    const t = l.trim();
    return t && !/^(?:[-*#>|]|\d+[).])/.test(t) && !/^\*\*[^*]+\*\*\s*$/.test(t) && !/^━/.test(t);
  });
  const proseChars = proseLines.join('').length;
  return {
    bullets: bulletLines.length,
    proseRatio: +(proseChars / Math.max(1, text.length)).toFixed(3),
    chars: text.length,
  };
}

// ── 심판 ──────────────────────────────────────────────────────────────────
// 심판에게는 독자가 보는 형태를 준다. 실제 독자는 마크다운이 아니라 presentation
// 카드를 본다 — 라벨 마크업과 목록 기호를 벗기고 문장만 남긴다. 원시 마크다운을
// 주면 심판이 양식 구조 자체에 warmth 감점을 주는데, 그 구조는 파서 계약이지
// 독자 경험이 아니다.
function readerView(text) {
  return text
    .replace(/^#+\s*\d*\.?\s*/gm, '')            // 헤딩 마커
    .replace(/^\s*(?:[-*]|\d+[).])\s*/gm, '')      // 목록 기호
    .replace(/\*\*([^*]+)\*\*\s*[:：]\s*/g, '$1 — ') // **라벨:** → 라벨 —
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\n{3,}/g, '\n\n');
}

function judgePrompt(text, lang) {
  const name = LANG_NAMES[lang] || 'English';
  return [
    `You are judging the WRITING VOICE of a paid parenting report written in ${name}.`,
    'The benchmark for 5s: a seasoned counsellor writing personally to one family —',
    'flowing, specific, psychologically textured. The failure mode for 1-2s: a',
    'consultant filing a form — telegraphic fragments, generic advice, clinical labels.',
    '',
    'Score 1-5 on each axis. Judge only the voice, not the layout markers (##, **, -).',
    '- nativeness: reads as written BY a native-speaker counsellor, not translated or templated',
    '- warmth: reads as a letter to THIS family, not a report about a case',
    '- specificity: scenes a parent recognizes from their own kitchen, not abstractions',
    '',
    'Return ONLY JSON: {"nativeness":N,"warmth":N,"specificity":N,"weakest":"<one short sentence>"}',
    '',
    '--- REPORT (opening portion) ---',
    readerView(text).slice(0, 6000),
  ].join('\n');
}

async function judgeReport(ai, text, lang) {
  const rounds = [];
  for (let i = 0; i < ROUNDS; i++) {
    const res = await ai.generateFortune([
      { role: 'system', content: 'Strict literary judge. JSON only.' },
      { role: 'user', content: judgePrompt(text, lang) },
    ], { maxTokens: 1200, temperature: 0 });
    try {
      const cleaned = res.content.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
      rounds.push(JSON.parse(cleaned));
    } catch { /* 한 라운드 파싱 실패는 버린다 */ }
  }
  const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
  if (!rounds.length) return null;
  return {
    nativeness: median(rounds.map((r) => r.nativeness)),
    warmth: median(rounds.map((r) => r.warmth)),
    specificity: median(rounds.map((r) => r.specificity)),
    weakest: rounds[0].weakest,
  };
}

(async () => {
  const ai = getAIService();
  const files = fs.readdirSync(CACHE_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}-[a-z]{2}\.json$/.test(f))
    .filter((f) => !langsFilter || langsFilter.includes(f.slice(11, 13)));

  const rows = [];
  for (const f of files) {
    const lang = f.slice(11, 13);
    const { fullText } = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, f)));
    const form = formStats(fullText);
    const scores = await judgeReport(ai, fullText, lang);
    rows.push({ file: f, lang, ...form, ...scores });
    console.log(`${f.replace('.json', '').padEnd(16)} 불릿 ${String(form.bullets).padStart(3)} 산문율 ${form.proseRatio} | nat ${scores?.nativeness} warm ${scores?.warmth} spec ${scores?.specificity}`);
    if (scores?.weakest) console.log(`   약점: ${scores.weakest}`);
  }

  // 언어별 요약
  console.log('\nlang  n  불릿(평균)  산문율  nat  warm  spec');
  const byLang = {};
  rows.forEach((r) => { (byLang[r.lang] = byLang[r.lang] || []).push(r); });
  const avg = (xs) => +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2);
  for (const [lang, rs] of Object.entries(byLang)) {
    console.log(`${lang.padEnd(4)} ${rs.length}  ${String(avg(rs.map((r) => r.bullets))).padStart(8)}  ${avg(rs.map((r) => r.proseRatio))}   ${avg(rs.map((r) => r.nativeness || 0))}  ${avg(rs.map((r) => r.warmth || 0))}  ${avg(rs.map((r) => r.specificity || 0))}`);
  }
  const all = rows.filter((r) => r.nativeness);
  console.log(`\n전체 중앙값 — nat ${avg(all.map((r) => r.nativeness))} warm ${avg(all.map((r) => r.warmth))} spec ${avg(all.map((r) => r.specificity))}`);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, `${label}.json`), JSON.stringify(rows, null, 2));
  console.log(`기록: output/voice/${label}.json`);
})().catch((e) => { console.error(e); process.exit(1); });
