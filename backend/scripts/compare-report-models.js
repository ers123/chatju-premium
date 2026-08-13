#!/usr/bin/env node
/**
 * 모델 비교 — 같은 프롬프트, 같은 원국, 모델만 바꾼다.
 *
 * 왜: 2026-08-13 기준 주 모델이 gpt-5.4-nano(최저가 티어)인데, 그 위에서 문체를
 * 올리려고 프롬프트 작업을 반복했다(warmth 2.6→3.1에서 천장). 가격을 $19.99로
 * 올린 지금, 리포트 1건의 AI 원가는 매출의 0.05~1.2% 구간이다 — 즉 **비용은
 * 선택 변수가 아니고 품질이 선택 변수다.** 그런데 어느 모델이 더 잘 쓰는지는
 * 재 본 적이 없다. 이 스크립트가 그것을 잰다.
 *
 * 공정성 규칙:
 *   - 프롬프트·원국·언어를 고정하고 모델만 바꾼다
 *   - 심판은 `measure-report-voice.js`의 축·프롬프트를 그대로 쓴다(축이 바뀌면
 *     과거 측정과 비교가 끊긴다)
 *   - 심판 모델은 **후보와 무관하게 하나로 고정**한다. 후보가 자기를 채점하면
 *     자기선호가 섞인다
 *   - 라운드 중앙값을 쓴다. 동일 텍스트 재채점이 ±0.67 흔들린 전례가 있다
 *
 * Usage:
 *   node scripts/compare-report-models.js                    # 기본 후보군, en
 *   MODELS=gpt-5.6-terra,gpt-5.6-luna LANGS=en,ko node scripts/compare-report-models.js
 *
 * 출력: output/model-compare/<model>__<lang>.json + 콘솔 표
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { calculateMansae } = require('../src/utils/mansae-wrapper');
const { calculateFullFortuneCycles } = require('../src/services/daeun.service');

const MODELS = (process.env.MODELS || 'gpt-5.4-nano,gpt-5.6-luna,gpt-5.6-terra,gpt-5.6-sol').split(',').map((s) => s.trim());
const LANGS = (process.env.LANGS || 'en').split(',').map((s) => s.trim());
const ROUNDS = Number(process.env.ROUNDS || 3);
// 심판은 고정. 후보 중 하나를 심판으로 쓰면 자기 답안을 채점하는 라운드가 생긴다.
const JUDGE_MODEL = process.env.JUDGE_MODEL || 'gpt-5.6-terra';
const OUT_DIR = path.resolve(__dirname, '../output/model-compare');

// 고정 원국 — 실제 서비스에서 흔한 조합(2018년생, 시간 있음, 부모 정보 있음)
const SUBJECT = {
  birthDate: '2018-05-05',
  birthTime: '09:30',
  gender: 'female',
  subjectName: 'Sena',
  timezone: 'Asia/Seoul',
};

const LANG_NAMES = { ko: 'Korean', en: 'English', ja: 'Japanese' };

// ── 심판 (measure-report-voice.js와 동일 축·동일 문구) ─────────────────────
function readerView(text) {
  return text
    .replace(/^#+\s*\d*\.?\s*/gm, '')
    .replace(/^\s*(?:[-*]|\d+[).])\s*/gm, '')
    .replace(/\*\*([^*]+)\*\*\s*[:：]\s*/g, '$1 — ')
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

// ── 결정론 지표 ───────────────────────────────────────────────────────────
function formStats(text, subjectName) {
  const lines = text.split('\n');
  const bullets = lines.filter((l) => /^\s*(?:[-*]|\d+[).])\s/.test(l)).length;
  const proseLines = lines.filter((l) => {
    const t = l.trim();
    return t && !/^(?:[-*#>|]|\d+[).])/.test(t) && !/^\*\*[^*]+\*\*\s*$/.test(t);
  });
  const sections = (text.match(/^#{1,3}\s*\d+[.)]/gm) || []).length;
  return {
    chars: text.length,
    bullets,
    proseRatio: +(proseLines.join('').length / Math.max(1, text.length)).toFixed(3),
    sections,
    nameCount: subjectName ? (text.match(new RegExp(subjectName, 'g')) || []).length : 0,
    // 오늘 고친 결함이 모델을 바꿔도 재발하지 않는지 본다
    promptLeak: /Translate every element name|Never print the Korean element names|Use these labels/i.test(text),
    hangulLeak: /[가-힣]/.test(text.replace(/[一-鿿]/g, '')),
  };
}

async function callJudge(model, messages, maxTokens) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI || process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, max_completion_tokens: maxTokens }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`${model}: ${j.error?.message || res.status}`);
  return {
    content: j.choices?.[0]?.message?.content || '',
    usage: j.usage || {},
  };
}

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

async function judge(text, lang) {
  const rounds = [];
  for (let i = 0; i < ROUNDS; i++) {
    try {
      const r = await callJudge(JUDGE_MODEL, [
        { role: 'system', content: 'Strict literary judge. JSON only.' },
        { role: 'user', content: judgePrompt(text, lang) },
      ], 1500);
      const cleaned = r.content.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
      rounds.push(JSON.parse(cleaned));
    } catch { /* 라운드 실패는 버린다 */ }
  }
  if (!rounds.length) return null;
  return {
    nativeness: median(rounds.map((r) => r.nativeness)),
    warmth: median(rounds.map((r) => r.warmth)),
    specificity: median(rounds.map((r) => r.specificity)),
    weakest: rounds[0].weakest,
    roundsOk: rounds.length,
  };
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 원국은 실제 서비스 경로와 똑같이 계산한다.
  const manseryeok = calculateMansae(SUBJECT.birthDate, SUBJECT.birthTime, '여', { hourUnknown: false });
  if (manseryeok.error) { console.error('만세력 계산 실패:', manseryeok.error); process.exit(1); }
  const fortuneCycles = calculateFullFortuneCycles(
    manseryeok, manseryeok.input?.solarDate || SUBJECT.birthDate, '여', new Date().getFullYear()
  );

  const results = [];
  for (const lang of LANGS) {
    for (const model of MODELS) {
      process.stdout.write(`${model} / ${lang} ... `);
      // 모델은 환경변수로만 바꾼다 — 프롬프트·원국·후처리는 서비스 코드 그대로다.
      // 여기서 프롬프트를 다시 쓰면 "모델 비교"가 아니라 "프롬프트 비교"가 된다.
      process.env.OPENAI_MODEL = model;
      process.env.OPENAI_FALLBACK_MODEL = model;
      Object.keys(require.cache).filter((k) => /src\/services\/(ai|saju)\.service|src\/config\/openai/.test(k))
        .forEach((k) => delete require.cache[k]);
      const sajuService = require('../src/services/saju.service');

      // 폴백이 조용히 다른 제공자로 넘어가면 "모델 비교"가 거짓말이 된다.
      // 실제로 어떤 제공자가 답했는지 잡아 두고, openai 가 아니면 그 행을 버린다.
      const seenProviders = new Set();
      const logger = require('../src/utils/logger');
      const origWarn = logger.warn;
      logger.warn = (msg, meta) => { if (/fallback provider/i.test(String(msg))) seenProviders.add('fallback'); return origWarn.call(logger, msg, meta); };

      const t0 = Date.now();
      let interp;
      try {
        interp = await sajuService.generateAIInterpretation(
          manseryeok, null, null, lang, 'premium_saju', false, fortuneCycles, null, SUBJECT.subjectName
        );
      } catch (e) {
        console.log('FAILED:', e.message);
        results.push({ model, lang, error: e.message });
        continue;
      }
      logger.warn = origWarn;
      const secs = ((Date.now() - t0) / 1000).toFixed(1);
      if (seenProviders.has('fallback')) {
        console.log('CONTAMINATED — 폴백 발생, 이 모델의 출력이 아님. 행 폐기');
        results.push({ model, lang, error: 'fell back to another provider' });
        continue;
      }
      const text = interp.fullText || '';
      const form = formStats(text, SUBJECT.subjectName);
      form.ready = interp.presentationStatus === 'ready';
      form.statusReason = interp.presentationStatusReason || null;
      const voice = await judge(text, lang);

      fs.writeFileSync(path.join(OUT_DIR, `${model}__${lang}.json`),
        JSON.stringify({ model, lang, form, voice, presentationStatus: interp.presentationStatus, text }, null, 2));
      console.log(`${secs}s · ${form.chars}자 · ${form.ready ? 'ready' : 'fallback(' + form.statusReason + ')'} · voice ${voice ? `${voice.nativeness}/${voice.warmth}/${voice.specificity}` : 'n/a'}`);
      results.push({ model, lang, secs: +secs, form, voice });
    }
  }

  console.log('\n모델 비교 (심판 고정: ' + JUDGE_MODEL + `, ${ROUNDS}라운드 중앙값)\n`);
  console.log(['model'.padEnd(15), 'lang', 'nat', 'wrm', 'spec', 'prose', 'blt', 'name', 'ready', '초'].join(' '));
  for (const r of results.filter((x) => !x.error)) {
    console.log([
      r.model.padEnd(15), r.lang.padEnd(4),
      String(r.voice?.nativeness ?? '-').padEnd(3),
      String(r.voice?.warmth ?? '-').padEnd(3),
      String(r.voice?.specificity ?? '-').padEnd(4),
      String(r.form.proseRatio).padEnd(5),
      String(r.form.bullets).padEnd(3),
      String(r.form.nameCount).padEnd(4),
      (r.form.ready ? 'Y' : 'N').padEnd(5),
      String(r.secs),
      r.form.promptLeak ? '⚠누출' : '',
      (r.form.hangulLeak && r.lang !== 'ko') ? '⚠한글' : '',
    ].join(' '));
  }
  for (const r of results.filter((x) => !x.error && x.voice?.weakest)) {
    console.log(`  ${r.model}/${r.lang} 약점: ${r.voice.weakest}`);
  }
  console.log('\n산출물:', OUT_DIR);
})();
