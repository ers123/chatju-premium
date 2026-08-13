#!/usr/bin/env node
// 유료 리포트의 표면 아티팩트 측정.
//
// 프리뷰는 6개 지표로 재서 100%를 확인했는데(§11), **돈을 받는 산출물은 같은 측정이
// 없었다.** zh 간체 수정도 유료 프롬프트(langNameMap)에 들어갔지만 유료 출력으로는
// 확인된 적이 없다. 상용 서비스에서 검증 순서가 거꾸로였던 셈이다.
//
// 재는 것 (모두 결정론적 — LLM 심판 없음):
//   1. coreFirst    — 본문에서 처음 언급되는 오행이 일간 오행인가 (프리뷰 §11과 동일)
//   2. hangulLeak   — 비한국어 리포트의 한글 낱말([가-힣]{2,}) 개수
//   3. englishResidue — 비영어 리포트에 남은 영어 지시 어휘(temperament 등)
//   4. hanjaDup     — `水（水）` 형태의 자기중복 (공백 형태 포함)
//   5. traditionalZh — zh 리포트의 번체 글자 (간체 로케일 정합성)
//   6. ready        — presentationStatus === 'ready' (fallback 아님)
//
// 생성물은 output/premium-artifacts/에 캐시된다. 지표만 바꿔 다시 돌릴 때 리포트를
// 다시 만들지 않는다. --regenerate로 강제 재생성.
//
// 사용법:
//   node scripts/measure-premium-artifacts.js                    # ko,en,ja,zh,fr × 3원국
//   LANGS=zh CHARTS=3 node scripts/measure-premium-artifacts.js
//   node scripts/measure-premium-artifacts.js --regenerate

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { calculateMansae, STEM_ELEMENT } = require('../src/utils/mansae-wrapper');
const { calculateFullFortuneCycles } = require('../src/services/daeun.service');
const sajuService = require('../src/services/saju.service');

const CACHE_DIR = path.resolve(__dirname, '../../output/premium-artifacts');
const REGEN = process.argv.includes('--regenerate');
const HANJA = { 목: '木', 화: '火', 토: '土', 금: '金', 수: '水' };

const langs = (process.env.LANGS || 'ko,en,ja,zh,fr').split(',').map((s) => s.trim());
const chartCount = Number(process.env.CHARTS || 3);

// 프리뷰 측정과 같은 원국 풀 — 일간 오행이 서로 다른, 기질≠최다인 원국.
// (scripts/measure-preview-core.js와 같은 선택 규칙, 같은 날짜가 나온다.)
function findFixtures(limit) {
  const EN_TO_KO = { wood: '목', fire: '화', earth: '토', metal: '금', water: '수' };
  const found = [];
  const seen = new Set();
  for (let year = 2010; year <= 2024 && found.length < limit; year++) {
    for (let month = 1; month <= 12 && found.length < limit; month++) {
      const birthDate = `${year}-${String(month).padStart(2, '0')}-14`;
      const m = calculateMansae(birthDate, '14:30', '여', { hourUnknown: false });
      if (m.error || !m.pillars) continue;
      const core = STEM_ELEMENT[m.pillars.day.korean[0]];
      const key = Object.entries(m.elements).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
      const dominant = EN_TO_KO[key];
      if (!core || core === dominant || seen.has(core)) continue;
      seen.add(core);
      found.push({ birthDate, core, dominant, manseryeok: m });
    }
  }
  return found;
}

async function generateOrLoad(fixture, lang) {
  const cacheFile = path.join(CACHE_DIR, `${fixture.birthDate}-${lang}.json`);
  if (!REGEN && fs.existsSync(cacheFile)) {
    return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  }
  const fortuneCycles = calculateFullFortuneCycles(
    fixture.manseryeok,
    fixture.manseryeok.input?.solarDate || fixture.birthDate,
    '여',
    new Date().getFullYear()
  );
  const interp = await sajuService.generateAIInterpretation(
    fixture.manseryeok, null, null, lang, 'premium_saju', false, fortuneCycles, null, 'Minseo'
  );
  const slim = {
    fullText: interp.fullText,
    presentationStatus: interp.presentationStatus,
    presentationStatusReason: interp.presentationStatusReason || null,
    // 렌더된 presentation 도 캐시에 남긴다. 문체 측정이 fullText 를 심판하면
    // **파서가 버린 산문까지 점수에 들어간다** — 독자가 받지 않는 글을 재는 셈이다
    // (2026-08-13 발견). 심판은 이쪽을 읽어야 한다.
    presentation: interp.presentation || null,
  };
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(slim, null, 2));
  return slim;
}

// ── 지표 ──────────────────────────────────────────────────────────────────

/**
 * 본문이 "이 아이는 X다"라고 주장하는 오행.
 *
 * 프리뷰의 "첫 언급" 휴리스틱은 유료 형식에 맞지 않는다 — 유료 리포트는 첫 문단에서
 * 약점 오행("水의 부분이 약하다")을 정당하게 먼저 말할 수 있다. 그건 모순이 아니다.
 * 모순은 **비(非)일간 오행이 정체성 어휘와 붙어 있을 때**다: "土 기질", "气质是水".
 *
 * 오행 한자 주변 ±15자 안에 정체성 어휘가 있으면 "정체성 주장"으로 기록한다.
 * 출력 규약이 비한국어에서도 한자 병기("Wood (木)")를 요구하므로 열 개 언어 전부
 * 한자 스캔으로 잡힌다. 한국어는 한글 오행명도 본다.
 */
const IDENTITY_WORDS = /기질|기본 성향|타고난|気質|性質|本質|气质|性情|本质|天性|temperament|temperamento|tempérament|nature|natureza|naturaleza|índole|tính cách|bản chất|thiên bẩm|sifat dasar|watak|temperamen|อุปนิสัย|นิสัยพื้นฐาน|ธาตุแท้/i;

function identityClaims(text, lang) {
  const claims = [];
  const pattern = lang === 'ko' ? /[木火土金水]|(?<![가-힣])[목화토금수](?=\s*기질)/g : /[木火土金水]/g;
  for (const m of text.matchAll(pattern)) {
    const ch = m[0];
    const ko = Object.keys(HANJA).find((k) => HANJA[k] === ch) || ch;
    const around = text.slice(Math.max(0, m.index - 15), m.index + 16);
    // 정체성 어휘가 붙어 있거나, 은유 프레임("这个孩子像…的火", "〜のような火")으로
    // 아이를 그 오행에 빗대고 있으면 정체성 주장이다. zh 리포트가 첫 문장에서 은유로
    // 기질을 정확히 서술했는데 어휘 창만 보던 이전 판은 그걸 놓쳤다.
    const metaphor = new RegExp(`(像|如同|就像|のような|みたいな)[^。.]{0,15}${ch}`).test(around);
    if (IDENTITY_WORDS.test(around) || metaphor) claims.push(ko);
  }
  return claims;
}

/** 비한국어 리포트에 남은 실제 한국어 낱말 목록. */
function hangulWords(text) {
  return [...new Set(text.match(/[가-힣]{2,}/g) || [])];
}

/** 비영어 리포트에 남은 영어 지시 어휘. 스페인/프랑스/포르투갈어 동계어는 제외. */
function englishResidue(text) {
  const hits = text.match(/\btemperament\b(?![a-zà-ÿ])/gi) || [];
  return hits.length;
}

/** `水（水）` 자기중복 — 공백 형태 포함. */
function hanjaDupCount(text) {
  return (text.match(/([一-鿿]{1,4})\s*[（(]\s*\1\s*[)）]/g) || []).length;
}

// 간체 로케일에서 나오면 안 되는 대표 번체 글자. (양쪽에서 같은 글자는 제외)
const TRAD_CHARS = /[從氣質這個樣體學區關發過來為們與時對邊讓誰壓覺點鐘轉變歲聽讀寫話說語愛媽爸長開門問間]/g;
function traditionalCount(text) {
  return (text.match(TRAD_CHARS) || []).length;
}

// ── 실행 ──────────────────────────────────────────────────────────────────

(async () => {
  const fixtures = findFixtures(chartCount);
  console.log('원국:', fixtures.map((f) => `${f.birthDate}(기질 ${f.core}/최다 ${f.dominant})`).join('  '));
  console.log('언어:', langs.join(', '), '\n');

  const rows = [];
  for (const lang of langs) {
    for (const fixture of fixtures) {
      try {
        const report = await generateOrLoad(fixture, lang);
        const text = report.fullText || '';
        const row = {
          lang,
          birthDate: fixture.birthDate,
          core: fixture.core,
          ready: report.presentationStatus === 'ready',
          reason: report.presentationStatusReason,
          // 유료 리포트는 설계상 주 기질(일간) + 부 기질을 함께 말한다. 모순은 **첫 번째**
          // 정체성 주장이 일간이 아닐 때다 — 독자가 처음 읽는 정체성이 표지와 다르면
          // 프리뷰 §11과 같은 "두 아이" 문제가 된다. 이후 주장은 부 기질로 정당하다.
          // 주장이 아예 없는 것도 정상이다(은유로 서술) — 표지는 코드가 결정론적으로 찍는다.
          identity: (() => {
            const claims = identityClaims(text, lang);
            return { first: claims[0] || null, count: claims.length, ok: claims.length === 0 || claims[0] === fixture.core };
          })(),
          hangul: lang === 'ko' ? [] : hangulWords(text),
          english: lang === 'en' || lang === 'ko' ? 0 : englishResidue(text),
          hanjaDup: hanjaDupCount(text),
          // `1) 1. **…**` — 지시문의 번호 예시를 모델이 한 번 더 붙인 것.
          doubleNum: (text.match(/^\s*(\d+)[).]\s+\1[.)]\s/gm) || []).length,
          // 아이 이름 호명 횟수. 0이면 범용 문서로 읽힌다 — 경쟁 서비스와 가장 크게
          // 갈리는 지점이라 지표로 고정한다. 목표: 본문에서 3회 이상.
          nameMentions: (text.match(/Minseo/g) || []).length,
          trad: lang === 'zh' ? traditionalCount(text) : 0,
          chars: text.length,
        };
        rows.push(row);
        const flags = [
          !row.ready && `FALLBACK(${row.reason})`,
          !row.identity.ok && `첫 정체성이 ${row.identity.first} (기질 ${fixture.core})`,
          row.hangul.length && `한글 ${row.hangul.length}낱말`,
          row.english && `영어 ${row.english}`,
          row.hanjaDup && `한자중복 ${row.hanjaDup}`,
          row.doubleNum && `이중번호 ${row.doubleNum}`,
          row.trad && `번체 ${row.trad}자`,
          row.nameMentions < 3 && `이름 ${row.nameMentions}회`,
        ].filter(Boolean);
        console.log(`${flags.length ? 'X ' : 'OK'} ${lang.padEnd(3)} ${fixture.birthDate} ${flags.join(' | ')}`);
        if (row.hangul.length) console.log(`      한글: ${row.hangul.slice(0, 8).join(', ')}`);
      } catch (err) {
        rows.push({ lang, birthDate: fixture.birthDate, error: err.message });
        console.log(`!  ${lang} ${fixture.birthDate} 실패: ${err.message}`);
      }
    }
  }

  const ok = rows.filter((r) => !r.error);
  console.log('\n── 요약 ──');
  console.log(`ready         ${ok.filter((r) => r.ready).length}/${ok.length}`);
  console.log(`정체성 일치    ${ok.filter((r) => r.identity.ok).length}/${ok.length}`);
  console.log(`한글 혼입 0    ${ok.filter((r) => r.lang === 'ko' || r.hangul.length === 0).length}/${ok.length}`);
  console.log(`영어 잔류 0    ${ok.filter((r) => r.english === 0).length}/${ok.length}`);
  console.log(`한자중복 0     ${ok.filter((r) => r.hanjaDup === 0).length}/${ok.length}`);
  console.log(`이중번호 0     ${ok.filter((r) => r.doubleNum === 0).length}/${ok.length}`);
  console.log(`이름 3회 이상  ${ok.filter((r) => r.nameMentions >= 3).length}/${ok.length}`);
  const zh = ok.filter((r) => r.lang === 'zh');
  if (zh.length) console.log(`zh 번체 0      ${zh.filter((r) => r.trad === 0).length}/${zh.length}`);

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(path.join(CACHE_DIR, `results-${Date.now()}.json`), JSON.stringify(rows, null, 2));
})().catch((e) => { console.error(e); process.exit(1); });
