#!/usr/bin/env node
// 언어별 리포트 품질 계측기.
//
// 이전 도구(measure-localization.js / compare-localization.js)의 문제
// ---------------------------------------------------------------
// 심판에게 소스를 주고 "신호를 뽑아서 채점하라"고 시켰다. 심판이 호출마다 소스를
// 10~13개로 다르게 쪼갰고, 그래서 같은 산출물이 50%와 77%로 나왔다. 잡음 ±25pt가
// 재려는 효과보다 커서 어떤 개입도 판정할 수 없었다
// (localization_findings_2026-08-11.md §5).
//
// 이 도구가 바꾼 것
// ---------------------------------------------------------------
// 1. 채점 대상 고정 — 신호 목록을 buildKnowledgeContext().signals에서 결정론적으로
//    받는다. 심판은 뽑지 않고 채점만 한다.
// 2. 반복 채점 — 같은 리포트를 여러 번 채점해 신호별 다수결, 점수는 중앙값.
// 3. 원국 복수 — 한 원국의 특성에 과적합된 결론을 막는다.
// 4. 루브릭 판정 — 언어별 임계값(localization-rubric.js)으로 합격/불합격을 낸다.
//    나중에 출력 게이트로 승격시킬 때 같은 데이터를 쓴다.
//
// 생성물은 캐시된다. 심판만 바꿔 다시 돌릴 때 리포트를 다시 만들지 않는다.
//
// 사용법:
//   node scripts/eval-localization.js --langs=ko,fr --charts=3 --rounds=3
//   node scripts/eval-localization.js --langs=fr --label=voice-on --regenerate
//   SAJU_LOCALIZED_VOICE=1 node scripts/eval-localization.js --langs=fr --label=voice-on --regenerate

require('dotenv').config();

const fs = require('fs');
const path = require('path');

const { calculateMansae } = require('../src/utils/mansae-wrapper');
const { calculateFullFortuneCycles } = require('../src/services/daeun.service');
const { buildKnowledgeContext } = require('../src/services/saju-knowledge');
const { generateAIInterpretation } = require('../src/services/saju.service');
const { getAIService } = require('../src/services/ai.service');
const { SHARED_CRITERIA, getRubric, evaluateAgainstRubric } = require('../src/data/saju-knowledge/localization-rubric');

const args = process.argv.slice(2);
const arg = (n, d) => {
  const hit = args.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.split('=').slice(1).join('=') : d;
};
const flag = (n) => args.includes(`--${n}`);

const LANGS = arg('langs', 'ko,fr').split(',').map((s) => s.trim()).filter(Boolean);
const CHART_COUNT = Number(arg('charts', '3'));
const ROUNDS = Number(arg('rounds', '3'));
const LABEL = arg('label', 'default');
const REGENERATE = flag('regenerate');

const OUT_DIR = path.resolve(__dirname, '../../output/localization');
const CACHE_DIR = path.join(OUT_DIR, 'cache');

const LANG_NAMES = {
  ko: 'Korean', en: 'English', ja: 'Japanese', zh: 'Chinese', vi: 'Vietnamese',
  id: 'Indonesian', es: 'Spanish', pt: 'Portuguese', fr: 'French', th: 'Thai',
};

// 서로 다른 원국 패턴. 한 원국에만 맞는 결론이 나오지 않도록 일부러 흩어 놓았다.
const CHARTS = [
  { id: 'c1-summer-fire', birthDate: '2018-05-14', birthTime: '09:30', gender: 'female', childAge: 7, childName: 'A' },
  { id: 'c2-winter-water', birthDate: '2016-12-03', birthTime: '22:10', gender: 'male', childAge: 9, childName: 'B' },
  { id: 'c3-spring-wood', birthDate: '2014-03-21', birthTime: '06:45', gender: 'female', childAge: 11, childName: 'C' },
  { id: 'c4-autumn-metal', birthDate: '2019-09-08', birthTime: '14:20', gender: 'male', childAge: 6, childName: 'D' },
  { id: 'c5-earth-mid', birthDate: '2012-07-30', birthTime: '11:05', gender: 'female', childAge: 13, childName: 'E' },
];

const median = (xs) => {
  const s = xs.filter((x) => typeof x === 'number').sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const majority = (verdicts) => {
  const c = {};
  for (const v of verdicts) c[v] = (c[v] || 0) + 1;
  return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] || 'absent';
};

async function generateReport(chart, lang) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cachePath = path.join(CACHE_DIR, `${LABEL}-${chart.id}-${lang}.md`);
  const metaPath = `${cachePath}.meta.json`;

  const manseryeok = calculateMansae(chart.birthDate, chart.birthTime, chart.gender, { timezone: 'Asia/Seoul' });
  const knowledge = buildKnowledgeContext({
    childManseryeok: manseryeok,
    childAge: chart.childAge,
    language: lang,
    outputLangName: LANG_NAMES[lang] || 'English',
  });

  if (!REGENERATE && fs.existsSync(cachePath)) {
    const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : {};
    return { report: fs.readFileSync(cachePath, 'utf8'), knowledge, cached: true, presentationStatus: meta.presentationStatus };
  }

  const fortuneCycles = calculateFullFortuneCycles(manseryeok, chart.birthDate, chart.gender);
  const interp = await generateAIInterpretation(
    manseryeok, null, null, lang, 'premium_saju', false, fortuneCycles, null, chart.childName
  );
  const report = interp.fullText || '';
  fs.writeFileSync(cachePath, report);
  fs.writeFileSync(metaPath, JSON.stringify({ presentationStatus: interp.presentationStatus, chars: report.length }, null, 2));
  return { report, knowledge, cached: false, presentationStatus: interp.presentationStatus };
}

function judgePrompt({ signals, report, lang }) {
  const rubric = getRubric(lang);
  const langName = LANG_NAMES[lang] || 'English';
  const signalList = signals.map((s) => `${s.id}\t[${s.block}] ${s.text}`).join('\n');

  return [
    `A parenting report was generated in ${langName}. Mark it against the fixed signal list below.`,
    '',
    '=== SIGNALS THAT WERE INJECTED (score every one, by id) ===',
    signalList,
    '',
    `=== REPORT (${langName}) ===`,
    report.slice(0, 15000),
    '',
    '=== HOW TO SCORE ===',
    SHARED_CRITERIA.map((c) => `- ${c.id}: ${c.prompt}`).join('\n'),
    '',
    `Native cues for ${langName}: ${rubric.nativeCues.join(' | ')}`,
    `Known failure modes for ${langName}: ${rubric.failureModes.join(' | ')}`,
    '',
    'Return ONLY JSON, no prose, no code fence:',
    '{',
    '  "signals": [{"id": "<id from the list>", "verdict": "concrete"|"generic"|"absent"}],',
    '  "nativeness": <1-5>, "register": <1-5>, "actionability": <1-5>,',
    '  "notes": "<one sentence on the weakest point>"',
    '}',
    'Score EVERY id in the list exactly once. "concrete" = a parent could act on it today.',
  ].join('\n');
}

async function judgeOnce(ai, payload) {
  const res = await ai.generateFortune([
    { role: 'system', content: 'You are a strict evaluator of parenting reports. JSON only. Be conservative: "concrete" is reserved for statements a parent could act on today.' },
    { role: 'user', content: judgePrompt(payload) },
  ], { maxTokens: 3000, temperature: 0 });
  const cleaned = res.content.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  return JSON.parse(cleaned);
}

async function scoreReport({ signals, report, lang }) {
  const ai = getAIService();
  const rounds = [];
  for (let i = 0; i < ROUNDS; i += 1) {
    try {
      rounds.push(await judgeOnce(ai, { signals, report, lang }));
    } catch (err) {
      console.log(`    round ${i + 1} failed: ${err.message}`);
    }
  }
  if (!rounds.length) return null;

  // 신호별 다수결 — 대상 목록이 고정이므로 라운드끼리 직접 비교된다.
  const perSignal = signals.map((s) => {
    const verdicts = rounds
      .map((r) => (r.signals || []).find((x) => String(x.id) === s.id)?.verdict)
      .filter(Boolean);
    return { id: s.id, block: s.block, verdict: verdicts.length ? majority(verdicts) : 'absent', agreement: verdicts.length ? verdicts.filter((v) => v === majority(verdicts)).length / verdicts.length : 0 };
  });

  const concrete = perSignal.filter((s) => s.verdict === 'concrete').length;
  // 종류별로 나눠 본다. 전체 보존율은 신호 개수에 눌려 어느 언어나 낮게 깔리므로,
  // 언어 간 차이는 script(부모가 읽는 대사) 계열에서 봐야 드러난다.
  const byKind = (kind) => {
    const ids = new Set(signals.filter((s) => s.kind === kind).map((s) => s.id));
    const rows = perSignal.filter((s) => ids.has(s.id));
    if (!rows.length) return null;
    return rows.filter((s) => s.verdict === 'concrete').length / rows.length;
  };
  return {
    rounds: rounds.length,
    perSignal,
    grounding: concrete / (signals.length || 1),
    groundingScript: byKind('script'),
    groundingAnalytic: byKind('analytic'),
    signalCounts: {
      script: signals.filter((s) => s.kind === 'script').length,
      analytic: signals.filter((s) => s.kind === 'analytic').length,
    },
    nativeness: median(rounds.map((r) => r.nativeness)),
    register: median(rounds.map((r) => r.register)),
    actionability: median(rounds.map((r) => r.actionability)),
    meanAgreement: perSignal.reduce((a, s) => a + s.agreement, 0) / (perSignal.length || 1),
    notes: rounds.map((r) => r.notes).filter(Boolean),
  };
}

(async () => {
  const charts = CHARTS.slice(0, Math.max(1, Math.min(CHART_COUNT, CHARTS.length)));
  console.log(`label="${LABEL}"  langs=${LANGS.join(',')}  charts=${charts.length}  rounds=${ROUNDS}`);
  console.log(`SAJU_LOCALIZED_VOICE=${process.env.SAJU_LOCALIZED_VOICE || '(off)'}\n`);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const results = [];

  for (const lang of LANGS) {
    for (const chart of charts) {
      process.stdout.write(`  ${lang} / ${chart.id} ... `);
      const { report, knowledge, cached, presentationStatus } = await generateReport(chart, lang);
      if (!knowledge.signals?.length) { console.log('no signals, skipped'); continue; }
      process.stdout.write(`${cached ? 'cached' : 'generated'} ${report.length}c, ${knowledge.signals.length} signals, judging x${ROUNDS} ... `);

      const score = await scoreReport({ signals: knowledge.signals, report, lang });
      if (!score) { console.log('judging failed'); continue; }

      const verdict = evaluateAgainstRubric(
        {
          grounding: score.grounding,
          // 게이트가 보는 축. 전체 보존율은 analytic 신호에 눌려 언어 차이를 못 잡는다.
          groundingScript: score.groundingScript,
          nativeness: score.nativeness,
          register: score.register,
          actionability: score.actionability,
        },
        report, lang
      );
      results.push({ lang, chart: chart.id, presentationStatus, ...score, verdict });
      console.log(`grounding ${(score.grounding * 100).toFixed(0)}%  ${verdict.pass ? 'PASS' : 'FAIL'}`);
    }
  }

  console.log('\n=== per language ===');
  console.log(`${'lang'.padEnd(6)}${'charts'.padStart(7)}${'all'.padStart(7)}${'script'.padStart(8)}${'analytic'.padStart(10)}${'native'.padStart(8)}${'register'.padStart(10)}${'agree'.padStart(8)}${'pass'.padStart(7)}`);
  const summary = {};
  for (const lang of LANGS) {
    const rows = results.filter((r) => r.lang === lang);
    if (!rows.length) continue;
    const g = rows.reduce((a, r) => a + r.grounding, 0) / rows.length;
    const s = {
      charts: rows.length,
      grounding: g,
      nativeness: median(rows.map((r) => r.nativeness)),
      register: median(rows.map((r) => r.register)),
      actionability: median(rows.map((r) => r.actionability)),
      agreement: rows.reduce((a, r) => a + r.meanAgreement, 0) / rows.length,
      passed: rows.filter((r) => r.verdict.pass).length,
    };
    const avg = (key) => {
      const vals = rows.map((r) => r[key]).filter((v) => typeof v === 'number');
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    s.groundingScript = avg('groundingScript');
    s.groundingAnalytic = avg('groundingAnalytic');
    summary[lang] = s;
    const pctOrDash = (v) => (typeof v === 'number' ? `${(v * 100).toFixed(0)}%` : '-');
    console.log(
      `${lang.padEnd(6)}${String(s.charts).padStart(7)}${pctOrDash(g).padStart(7)}${pctOrDash(s.groundingScript).padStart(8)}${pctOrDash(s.groundingAnalytic).padStart(10)}${String(s.nativeness).padStart(8)}${String(s.register).padStart(10)}${`${(s.agreement * 100).toFixed(0)}%`.padStart(8)}${`${s.passed}/${s.charts}`.padStart(7)}`
    );
  }

  const failures = results.flatMap((r) => r.verdict.failures.map((f) => `${r.lang}/${r.chart}: ${f.label}`));
  if (failures.length) {
    console.log('\n=== rubric failures ===');
    failures.forEach((f) => console.log(`  ${f}`));
  }

  const outPath = path.join(OUT_DIR, `eval-${LABEL}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ label: LABEL, langs: LANGS, rounds: ROUNDS, summary, results }, null, 2));
  console.log(`\nsaved: ${outPath}`);
  console.log('agree% is judge self-consistency across rounds — below ~80% means the instrument, not the report, is the variable.');
})().catch((err) => {
  console.error(`eval-localization failed: ${err.message}`);
  process.exit(1);
});
