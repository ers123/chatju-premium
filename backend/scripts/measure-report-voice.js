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

// ── 독자 뷰 ───────────────────────────────────────────────────────────────
// 심판에게는 독자가 받는 것을 준다. 2026-08-13 이전 이 함수는 fullText 에서
// 마크다운만 벗겼는데, 그 텍스트에는 **파서가 버리는 산문**이 그대로 들어 있었다.
// 즉 심판은 독자가 한 번도 받은 적 없는 글을 채점하고 있었고, 그래서 점수가
// 실제 독자 경험보다 후하게 나왔다. 이제 렌더된 presentation 을 선형화해서 준다 —
// 웹/PDF 가 그리는 순서 그대로.
function presentationReaderView(presentation, { stripProse = false } = {}) {
  if (!presentation || !Array.isArray(presentation.sections)) return null;
  const L = [];
  const push = (v) => { if (v && String(v).trim()) L.push(String(v).trim()); };
  for (const sec of presentation.sections) {
    push(sec.title);
    for (const b of sec.blocks || []) {
      switch (b.type) {
        case 'prose':
          if (!stripProse) push(b.text);
          break;
        case 'text': case 'note': case 'close':
          push(`${b.title} — ${b.text}`);
          break;
        case 'insight':
          push(b.title);
          (Array.isArray(b.rows) && b.rows.length
            ? b.rows.map((r) => `${r.label} — ${r.text}`)
            : [`${b.basis || ''}`, `${b.behavior || ''}`, `${b.action || ''}`]
          ).forEach(push);
          break;
        case 'translator':
          push(b.title); push(b.looksLike); push(b.actual); push(b.response);
          break;
        case 'script':
          push(b.title); push(b.before); push(b.after); push(b.signal);
          break;
        case 'timeline': case 'checklist':
          push(b.title);
          (b.items || []).forEach((it) => push(`${it.label} — ${it.text}`));
          break;
        case 'parenting-card':
          push(b.title); push(b.stop); push(b.start); push(b.steps);
          break;
        default: break;
      }
    }
    L.push('');
  }
  return L.join('\n');
}

// fullText 폴백 — presentation 이 없는 옛 캐시 전용. 이 경로의 점수는 독자
// 경험이 아니라 원문 마크다운의 점수임을 결과에 명시한다.
function markdownFallbackView(text) {
  return text
    .replace(/^#+\s*\d*\.?\s*/gm, '')
    .replace(/^\s*(?:[-*]|\d+[).])\s*/gm, '')
    .replace(/\*\*([^*]+)\*\*\s*[:：]\s*/g, '$1 — ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\n{3,}/g, '\n\n');
}

function judgePrompt(readerText, lang) {
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
    readerText.slice(0, 6000),
  ].join('\n');
}

async function judgeReport(ai, readerText, lang) {
  const rounds = [];
  for (let i = 0; i < ROUNDS; i++) {
    const res = await ai.generateFortune([
      { role: 'system', content: 'Strict literary judge. JSON only.' },
      { role: 'user', content: judgePrompt(readerText, lang) },
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

  // AB=1 이면 같은 presentation 을 산문 블록 포함/제외 두 버전으로 심판한다.
  // 어젯밤 산문 슬롯이 **독자 기준으로** 무엇을 바꿨는지 이것으로만 알 수 있다.
  const AB = process.env.AB === '1';

  const rows = [];
  for (const f of files) {
    const lang = f.slice(11, 13);
    const cached = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, f)));
    const { fullText, presentation } = cached;
    const form = formStats(fullText);
    const rendered = presentationReaderView(presentation);
    const source = rendered ? 'rendered' : 'fullText-fallback';
    const view = rendered || markdownFallbackView(fullText);
    const proseBlocks = rendered
      ? presentation.sections.reduce((n, s2) => n + (s2.blocks || []).filter((b) => b.type === 'prose').length, 0)
      : 0;

    const scores = await judgeReport(ai, view, lang);
    const row = { file: f, lang, source, proseBlocks, ...form, ...scores };
    if (AB && rendered && proseBlocks > 0) {
      const stripped = presentationReaderView(presentation, { stripProse: true });
      row.withoutProse = await judgeReport(ai, stripped, lang);
    }
    rows.push(row);
    console.log(`${f.replace('.json', '').padEnd(16)} [${source}] 산문블록 ${proseBlocks} | nat ${scores?.nativeness} warm ${scores?.warmth} spec ${scores?.specificity}`
      + (row.withoutProse ? `  || 산문 제거 시: nat ${row.withoutProse.nativeness} warm ${row.withoutProse.warmth} spec ${row.withoutProse.specificity}` : ''));
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
