#!/usr/bin/env node
// Measure how much of the 명리 grounding survives into a non-Korean report,
// and whether the result reads as natively written or as translated Korean.
//
// Why this exists: the distilled knowledge base is Korean prose, and for every
// non-Korean language it is shipped verbatim with a four-line "translate this"
// note. The model therefore interprets and translates in one pass, and
// progress_2026-08-11.md §6 reports that the specific signals (도화, 편관 …)
// wear down to generic phrasing on the way out. Cultural fit is a second,
// separate problem: a faithful translation of a Korean parenting script is
// still a Korean parenting script.
//
// Neither property is keyword-measurable, so an LLM judge scores the report
// against the exact signal set that was fed in. Baseline and intervention are
// scored by the same judge on the same chart, so the comparison is what counts,
// not the absolute number.
//
// Usage:
//   node scripts/measure-localization.js --lang=fr --label=baseline
//   node scripts/measure-localization.js --lang=fr --label=cultural-layer
//   node scripts/measure-localization.js --lang=ko --label=reference   # the bar to match

require('dotenv').config();

const fs = require('fs');
const path = require('path');

const { calculateMansae } = require('../src/utils/mansae-wrapper');
const { calculateFullFortuneCycles } = require('../src/services/daeun.service');
const { buildKnowledgeContext } = require('../src/services/saju-knowledge');
const { generateAIInterpretation } = require('../src/services/saju.service');
const { getAIService } = require('../src/services/ai.service');

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : fallback;
};

const LANG = arg('lang', 'fr');
const LABEL = arg('label', 'run');
const OUT_DIR = path.resolve(__dirname, '../../output/localization');

// One fixed chart for every run, so differences come from the pipeline and not
// from the chart. Summer-born 병 day master with a 겁재 excess and two empty
// groups — a chart with plenty of specific signal to lose.
const FIXTURE = {
  birthDate: '2018-05-14',
  birthTime: '09:30',
  gender: 'female',
  childAge: 7,
  childName: 'Camille',
};

const LANG_NAMES = {
  ko: 'Korean', en: 'English', ja: 'Japanese', zh: 'Chinese', vi: 'Vietnamese',
  id: 'Indonesian', es: 'Spanish', pt: 'Portuguese', fr: 'French', th: 'Thai',
};

const JUDGE_SCHEMA_HINT = `Return ONLY valid JSON, no prose and no code fence:
{
  "signals": [
    {"signal": "<short name of the source signal>",
     "verdict": "concrete" | "generic" | "absent",
     "evidence": "<short quote from the report, or empty>"}
  ],
  "nativeness": {"score": <1-5>, "reason": "<one sentence>"},
  "culturalFit": {"score": <1-5>, "reason": "<one sentence>"},
  "koreanResidue": {"found": true|false, "examples": []}
}
"concrete" = the report states this specific behaviour//mechanism in a way a
parent could act on. "generic" = the theme is gestured at with wording that
would fit almost any child. "absent" = not reflected at all.
nativeness 5 = indistinguishable from a text originally written in the language;
1 = obviously translated. culturalFit 5 = the parenting advice, examples and
register match how parents in that culture actually talk; 1 = imported norms.`;

async function judge({ knowledgeText, report, langName, selected }) {
  const ai = getAIService();
  const messages = [
    {
      role: 'system',
      content: 'You are a strict bilingual evaluator of parenting reports. You are not generous: "concrete" is reserved for statements a parent could act on today. Answer with JSON only.',
    },
    {
      role: 'user',
      content: [
        `The report below was generated in ${langName} from the Korean source material that follows.`,
        `The source signals actually selected for this chart were: ${JSON.stringify(selected)}`,
        '',
        '=== SOURCE MATERIAL (Korean) ===',
        knowledgeText,
        '',
        `=== GENERATED REPORT (${langName}) ===`,
        report.slice(0, 14000),
        '',
        '=== TASK ===',
        `For every distinct signal in the source material, decide whether the ${langName} report carries it concretely, only generically, or not at all.`,
        `Then judge how natively ${langName} the writing reads, and whether the parenting guidance fits ${langName}-speaking family culture rather than Korean norms.`,
        JUDGE_SCHEMA_HINT,
      ].join('\n'),
    },
  ];
  const res = await ai.generateFortune(messages, { maxTokens: 3000, temperature: 0 });
  return res.content;
}

function summarize(raw) {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.log('  (judge returned unparseable JSON — raw output saved)');
    return null;
  }
  const counts = { concrete: 0, generic: 0, absent: 0 };
  for (const s of parsed.signals || []) counts[s.verdict] = (counts[s.verdict] || 0) + 1;
  const total = (parsed.signals || []).length || 1;
  console.log(`  signals: concrete ${counts.concrete} / generic ${counts.generic} / absent ${counts.absent}  (n=${total})`);
  console.log(`  grounding retention: ${((counts.concrete / total) * 100).toFixed(0)}%`);
  console.log(`  nativeness:   ${parsed.nativeness?.score}/5 — ${parsed.nativeness?.reason}`);
  console.log(`  culturalFit:  ${parsed.culturalFit?.score}/5 — ${parsed.culturalFit?.reason}`);
  console.log(`  korean residue: ${parsed.koreanResidue?.found ? JSON.stringify(parsed.koreanResidue.examples) : 'none'}`);
  return parsed;
}

(async () => {
  const langName = LANG_NAMES[LANG] || 'English';
  console.log(`Measuring ${LANG} (${langName}) — label="${LABEL}"`);

  const manseryeok = calculateMansae(FIXTURE.birthDate, FIXTURE.birthTime, FIXTURE.gender, { timezone: 'Asia/Seoul' });
  const fortuneCycles = calculateFullFortuneCycles(manseryeok, FIXTURE.birthDate, FIXTURE.gender);
  const knowledge = buildKnowledgeContext({
    childManseryeok: manseryeok,
    childAge: FIXTURE.childAge,
    language: LANG,
    outputLangName: langName,
  });
  console.log(`  knowledge context: ${knowledge.text.length} chars`);

  const started = Date.now();
  const interpretation = await generateAIInterpretation(
    manseryeok, null, null, LANG, 'premium_saju', false, fortuneCycles, null, FIXTURE.childName
  );
  const report = interpretation.fullText || '';
  console.log(`  generated: ${report.length} chars in ${((Date.now() - started) / 1000).toFixed(0)}s, presentation=${interpretation.presentationStatus || 'n/a'}`);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const base = path.join(OUT_DIR, `${LABEL}-${LANG}`);
  fs.writeFileSync(`${base}.md`, report);
  fs.writeFileSync(`${base}.knowledge.txt`, knowledge.text);

  const verdictRaw = await judge({
    knowledgeText: knowledge.text,
    report,
    langName,
    selected: knowledge.selected,
  });
  fs.writeFileSync(`${base}.judge.json`, verdictRaw);

  console.log('\n--- judge ---');
  summarize(verdictRaw);
  console.log(`\nsaved: ${base}.md / .knowledge.txt / .judge.json`);
})().catch((err) => {
  console.error(`measure-localization failed: ${err.message}`);
  process.exit(1);
});
