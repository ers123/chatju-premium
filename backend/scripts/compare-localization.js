#!/usr/bin/env node
// Score two already-generated reports against ONE canonical signal list, in a
// single judge call.
//
// measure-localization.js judges each report in its own call, so the judge is
// free to decompose the source material differently each time (21 signals for
// one run, 27 for another). That makes the per-run percentages incomparable —
// which matters, because the first two runs disagreed with the premise we were
// about to build on. Here the judge derives the signal list once and then marks
// both reports against that same list, so the two columns are directly
// comparable.
//
// Usage:
//   node scripts/compare-localization.js reference-ko baseline-fr

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { getAIService } = require('../src/services/ai.service');

const OUT_DIR = path.resolve(__dirname, '../../output/localization');
const [labelA, labelB] = process.argv.slice(2);

if (!labelA || !labelB) {
  console.error('usage: node scripts/compare-localization.js <labelA> <labelB>');
  process.exit(1);
}

const read = (label, ext) => {
  const p = path.join(OUT_DIR, `${label}.${ext}`);
  if (!fs.existsSync(p)) {
    console.error(`missing ${p} — run measure-localization.js first`);
    process.exit(1);
  }
  return fs.readFileSync(p, 'utf8');
};

const PROMPT_TAIL = `Return ONLY valid JSON, no prose, no code fence:
{
  "signals": [
    {"signal": "<short name>",
     "A": {"verdict": "concrete"|"generic"|"absent", "evidence": "<short quote or empty>"},
     "B": {"verdict": "concrete"|"generic"|"absent", "evidence": "<short quote or empty>"}}
  ],
  "lengthNote": "<one sentence on whether either report is conspicuously thinner>",
  "verdict": "<one sentence: which report carries the source material better, and why>"
}
"concrete" = the report states this specific behaviour or mechanism in a way a
parent could act on today. "generic" = the theme is gestured at in wording that
would fit almost any child. "absent" = not reflected.
Judge substance only. Do NOT reward or penalise a report for the language it is
written in, and do not treat a faithful paraphrase in another language as weaker
than a literal restatement.`;

(async () => {
  const source = read(labelA, 'knowledge.txt');
  const reportA = read(labelA, 'md');
  const reportB = read(labelB, 'md');

  console.log(`A = ${labelA}  (${reportA.length} chars)`);
  console.log(`B = ${labelB}  (${reportB.length} chars)`);
  console.log('Judging both against one signal list...\n');

  const ai = getAIService();
  const res = await ai.generateFortune([
    {
      role: 'system',
      content: 'You are a strict evaluator. First derive the list of distinct interpretive signals present in the SOURCE. Then mark EACH report against that same list. Reserve "concrete" for statements a parent could act on today. JSON only.',
    },
    {
      role: 'user',
      content: [
        '=== SOURCE MATERIAL (Korean reference data used to write both reports) ===',
        source.slice(0, 9000),
        '',
        `=== REPORT A (${labelA}) ===`,
        reportA.slice(0, 13000),
        '',
        `=== REPORT B (${labelB}) ===`,
        reportB.slice(0, 13000),
        '',
        '=== TASK ===',
        'Derive the distinct signals from the SOURCE once. Mark report A and report B against that identical list.',
        PROMPT_TAIL,
      ].join('\n'),
    },
  ], { maxTokens: 4000, temperature: 0 });

  const outPath = path.join(OUT_DIR, `compare-${labelA}-vs-${labelB}.json`);
  fs.writeFileSync(outPath, res.content);

  const cleaned = res.content.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.log('judge returned unparseable JSON; raw saved to', outPath);
    return;
  }

  const tally = (key) => {
    const c = { concrete: 0, generic: 0, absent: 0 };
    for (const s of parsed.signals || []) {
      const v = s[key]?.verdict;
      if (v in c) c[v] += 1;
    }
    return c;
  };
  const n = (parsed.signals || []).length || 1;
  const a = tally('A');
  const b = tally('B');
  const pct = (x) => `${((x / n) * 100).toFixed(0)}%`;

  console.log(`signals derived from source: ${n}\n`);
  console.log(`${''.padEnd(14)}${'concrete'.padStart(10)}${'generic'.padStart(10)}${'absent'.padStart(10)}${'retention'.padStart(12)}`);
  console.log(`${labelA.slice(0, 13).padEnd(14)}${String(a.concrete).padStart(10)}${String(a.generic).padStart(10)}${String(a.absent).padStart(10)}${pct(a.concrete).padStart(12)}`);
  console.log(`${labelB.slice(0, 13).padEnd(14)}${String(b.concrete).padStart(10)}${String(b.generic).padStart(10)}${String(b.absent).padStart(10)}${pct(b.concrete).padStart(12)}`);
  console.log(`\nlength: ${parsed.lengthNote}`);
  console.log(`verdict: ${parsed.verdict}`);
  console.log(`\nsaved: ${outPath}`);
})().catch((err) => {
  console.error(`compare-localization failed: ${err.message}`);
  process.exit(1);
});
