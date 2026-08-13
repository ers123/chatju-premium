// Contract tests — guard the BOUNDARIES, not the units.
//
// Both production bugs found on 2026-07-06 were boundary mismatches that unit
// tests and code review could not see, because each side was internally correct:
//
//   1. frontend/lib/pricing.ts charged ¥490 / €3.49 / €3.99 / ฿89, but the
//      backend catalog only had USD 4.99 → checkout 400'd for 5 locales.
//   2. The backend catalog accepted JPY/THB, but the payments.currency CHECK
//      constraint only allowed USD/KRW/EUR/CNY → INSERT failed after the
//      PayPal order had already been created.
//
// These tests fail loudly the moment either boundary drifts again.

const fs = require('fs');
const path = require('path');

const {
  PRODUCTS,
  LEGACY_PRODUCT_IDS,
  getProduct,
  amountsMatch,
  resolveProductByPricing,
} = require('../src/config/products');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PRICING_TS = path.join(REPO_ROOT, 'frontend', 'lib', 'pricing.ts');
const TRANSLATIONS_TS = path.join(REPO_ROOT, 'frontend', 'app', 'lib', 'i18n', 'translations.ts');
const JSONLD_TS = path.join(REPO_ROOT, 'frontend', 'app', 'lib', 'i18n', 'jsonld.ts');
const ROOT_LAYOUT = path.join(REPO_ROOT, 'frontend', 'app', '(app)', 'layout.tsx');
const SCHEMA_SQL = path.join(__dirname, '..', 'database', 'schema.sql');
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

// ── Parse frontend/lib/pricing.ts without a TS toolchain ───────────────────
// Matches lines like:
//   ja: { amount: 490, currency: 'JPY', display: '¥490', productType: 'premium_saju_jpy' },
// and the intentional `ko: null` (no paid checkout in Korea).
function parseFrontendPricing() {
  const src = fs.readFileSync(PRICING_TS, 'utf8');
  const block = src.match(/PRICING_BY_LANG[^=]*=\s*\{([\s\S]*?)\n\}/);
  if (!block) throw new Error('Could not locate PRICING_BY_LANG in pricing.ts');

  const entries = [];
  const nullLocales = [];
  for (const line of block[1].split('\n')) {
    const nullMatch = line.match(/^\s*(\w+):\s*null/);
    if (nullMatch) {
      nullLocales.push(nullMatch[1]);
      continue;
    }
    const m = line.match(
      /^\s*(\w+):\s*\{\s*amount:\s*([\d.]+),\s*currency:\s*'([A-Z]{3})'[^}]*?productType:\s*'([\w]+)'/
    );
    if (m) {
      entries.push({ lang: m[1], amount: Number(m[2]), currency: m[3], productType: m[4] });
    }
  }
  return { entries, nullLocales };
}

// ── Compute the effective payments.currency CHECK constraint ───────────────
// schema.sql defines it; later migrations may DROP + re-ADD it. The last
// definition in (schema, then migrations by number) wins — same order the
// production database saw them.
function effectiveCurrencyConstraint() {
  const sources = [SCHEMA_SQL];
  const migrations = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
    .map((f) => path.join(MIGRATIONS_DIR, f));
  sources.push(...migrations);

  let allowed = null;
  let definedIn = null;
  for (const file of sources) {
    const sql = fs.readFileSync(file, 'utf8');
    const matches = [...sql.matchAll(/CHECK\s*\(\s*currency\s+IN\s*\(([^)]*)\)/gi)];
    if (matches.length === 0) continue;
    const last = matches[matches.length - 1];
    allowed = last[1]
      .split(',')
      .map((s) => s.trim().replace(/^'|'$/g, ''))
      .filter(Boolean);
    definedIn = path.basename(file);
  }
  if (!allowed) throw new Error('No payments.currency CHECK constraint found');
  return { allowed, definedIn };
}

// ── 1. Frontend pricing ↔ backend catalog ─────────────────────────────────
describe('contract: frontend pricing ↔ backend product catalog', () => {
  const { entries, nullLocales } = parseFrontendPricing();

  test('parser actually found the pricing table (guards against silent drift)', () => {
    // If pricing.ts is refactored into a shape this parser cannot read, the
    // tests below would vacuously pass. Fail here instead.
    expect(entries.length).toBeGreaterThanOrEqual(9);
    expect(nullLocales).toContain('ko'); // Korea: free tier + promo only
  });

  test.each(entries.map((e) => [e.lang, e]))(
    '%s: productType resolves to a catalog product with the same price',
    (_lang, entry) => {
      const product = getProduct(entry.productType);
      expect(product).not.toBeNull();
      expect(product.currency).toBe(entry.currency);
      expect(amountsMatch(product.amount, entry.amount)).toBe(true);
    }
  );

  test.each(entries.map((e) => [e.lang, e]))(
    '%s: (currency, amount) also resolves via the back-compat path',
    (_lang, entry) => {
      // Old cached frontend bundles send only currency+amount, with no
      // product_type. That path must keep working across deploys.
      const product = resolveProductByPricing(entry.currency, entry.amount);
      expect(product).not.toBeNull();
      expect(product.currency).toBe(entry.currency);
    }
  );

  test('every catalog product is reachable from some locale, except declared legacy', () => {
    // 가격을 올리면 구 상품은 일시적으로 도달 불가능해진다. 그건 정상이지만
    // **선언된 경우에만** 정상이다 — 목록에 없는 고아는 그냥 죽은 코드다.
    const usedTypes = new Set(entries.map((e) => e.productType));
    const orphans = Object.keys(PRODUCTS).filter((id) => !usedTypes.has(id));
    expect(orphans.sort()).toEqual([...LEGACY_PRODUCT_IDS].sort());
  });

  test('legacy ids still resolve — in-flight orders must still capture', () => {
    // 배포 순간 결제창이 떠 있던 주문은 capture 에서 이 정의로 금액을 재검증한다.
    for (const id of LEGACY_PRODUCT_IDS) {
      expect(getProduct(id)).not.toBeNull();
    }
  });
});

// ── 1b. Charged price ↔ displayed price ───────────────────────────────────
// 위 테스트는 "청구가 == 전송가"만 본다. 정작 사용자가 보는 숫자는 세 번째
// 파일(translations.ts)에 있고, 실제로 어긋났다 — 인상 전 ja 배너는
// "プレミアムレポートはUS$4.99"라고 광고하면서 결제는 ¥490을 받고 있었다.
// 표시가와 청구가가 다르면 사용자를 속이는 것이고, 한국 PG 카드사 심사도
// "노출 금액 = 결제창 금액"을 요구한다.
describe('contract: charged price ↔ displayed price', () => {
  const { entries } = parseFrontendPricing();
  const src = fs.readFileSync(TRANSLATIONS_TS, 'utf8');

  // 로케일 블록은 고정된 순서로 나오고, 각 블록에 premium.price 가 하나씩 있다.
  const localeStarts = [...src.matchAll(/^  (\w{2}):\s*\{/gm)].map((m) => ({ lang: m[1], at: m.index }));
  const priceHits = [...src.matchAll(/premium:\s*\{[\s\S]{0,400}?price:\s*'([^']*)'/g)];
  const displayed = {};
  for (const hit of priceHits) {
    const owner = [...localeStarts].reverse().find((l) => l.at < hit.index);
    if (owner && !(owner.lang in displayed)) displayed[owner.lang] = hit[1];
  }

  test('parser found a displayed price for every locale (guards silent drift)', () => {
    expect(Object.keys(displayed).length).toBeGreaterThanOrEqual(10);
  });

  test.each(entries.map((e) => [e.lang, e]))(
    '%s: the number shown equals the number charged',
    (lang, entry) => {
      // 구분자와 통화기호는 로케일마다 다르다(€17,99 vs US$19.99). 숫자만 본다.
      // 비교 대상은 표시 문자열이 아니라 **실제 청구액**이다 — 표시끼리 비교하면
      // 둘 다 틀린 경우를 통과시킨다.
      const digits = (s) => String(s == null ? '' : s).replace(/[^\d]/g, '');
      expect(displayed[lang]).toBeDefined();
      expect(digits(displayed[lang])).toBe(digits(entry.amount));
    }
  );

  test('schema.org Offer advertises the real USD price', () => {
    // 검색엔진과 LLM이 읽는 값이다. 틀리면 우리가 지키지 않는 가격이 인용된다.
    const usd = entries.find((e) => e.currency === 'USD');
    expect(usd).toBeDefined();
    for (const file of [JSONLD_TS, ROOT_LAYOUT]) {
      const m = fs.readFileSync(file, 'utf8').match(/"price":\s*"([\d.]+)"/);
      expect(m).not.toBeNull();
      expect(amountsMatch(m[1], usd.amount)).toBe(true);
    }
  });
});

// ── 2. Tuning knobs ↔ how serverless.yml actually injects them ────────────
// serverless.yml declares each knob as ${env:NAME, ''}, so on a deploy where
// the shell has no value the Lambda receives an EMPTY STRING, not an absent
// variable. A knob read as Number(process.env.X) would become 0 — which for
// the rate limiter means every free preview is blocked. Every knob must fall
// back to its default when the value is ''.
describe('contract: env tuning knobs survive serverless.yml empty-string injection', () => {
  const KNOBS = [
    ['SAJU_PREVIEW_MAX_PER_HOUR', () => Number(process.env.SAJU_PREVIEW_MAX_PER_HOUR || 30), 30],
    ['AI_CALL_TIMEOUT_MS', () => parseInt(process.env.AI_CALL_TIMEOUT_MS || '45000', 10), 45000],
    ['EMAIL_PDF_BUDGET_MS', () => Number(process.env.EMAIL_PDF_BUDGET_MS || 40000), 40000],
    ['SAJU_HANGUL_LIMIT', () => Number(process.env.SAJU_HANGUL_LIMIT || 0.005), 0.005],
  ];

  test.each(KNOBS)('%s falls back to its default when injected as an empty string', (name, read, expected) => {
    const saved = process.env[name];
    process.env[name] = '';
    try {
      const value = read();
      expect(value).toBe(expected);
      expect(value).toBeGreaterThan(0);
    } finally {
      if (saved === undefined) delete process.env[name];
      else process.env[name] = saved;
    }
  });

  test('serverless.yml declares every knob (otherwise it cannot be tuned in the console)', () => {
    const sls = fs.readFileSync(path.join(__dirname, '..', 'serverless.yml'), 'utf8');
    for (const [name] of KNOBS) {
      expect(sls).toContain(`${name}:`);
    }
  });
});

// ── 3. Localized voice is only on for languages that were measured ────────
// The localized-voice path (rewritten usage block + cultural register +
// authored parent lines) was measured on French only: script retention 30% ->
// 56% across two runs each, with no presentation fallback once the instruction
// was flattened. No other language has authored lines yet, and none has been
// measured. Turning one on without measuring is exactly the mistake this
// session spent its time undoing, so the enabled set is pinned here.
describe('contract: localized voice is enabled only where it was measured', () => {
  const { calculateMansae } = require('../src/utils/mansae-wrapper');
  const { buildKnowledgeContext } = require('../src/services/saju-knowledge');
  const { localizedLanguages, PENDING_MEASUREMENT } = require('../src/data/saju-knowledge/harmful-phrases-i18n');

  const chart = () => calculateMansae('2018-05-14', '09:30', 'female', { timezone: 'Asia/Seoul' });
  const build = (language, outputLangName) => buildKnowledgeContext({
    childManseryeok: chart(), childAge: 7, language, outputLangName,
  });

  const ALL_LANGS = ['ko', 'en', 'ja', 'zh', 'vi', 'id', 'es', 'pt', 'fr', 'th'];

  // Data-driven so that measuring and enabling a new language does not also
  // require editing a hardcoded list here — the lists in the data module are
  // the single source of truth.
  test.each(ALL_LANGS.filter((l) => !localizedLanguages().includes(l)).map((l) => [l]))(
    '%s has no authored lines, so it falls back to the Korean source',
    (lang) => {
      expect(build(lang, 'X').selected.harmfulPhrasesLocalized).toBeFalsy();
    }
  );

  test.each(localizedLanguages().filter((l) => !PENDING_MEASUREMENT.includes(l)).map((l) => [l]))(
    '%s is authored and measured, so it gets its own parent lines',
    (lang) => {
      expect(build(lang, 'X').selected.harmfulPhrasesLocalized).toBe(true);
    }
  );

  test('every authored language is either enabled or explicitly awaiting measurement', () => {
    // The intended order is author -> measure -> enable, so "authored but off"
    // is a legitimate state — as long as it is declared. What must not happen is
    // lines authored for a language that is neither enabled nor on the pending
    // list, because that work would silently never reach a reader.
    for (const lang of localizedLanguages()) {
      const enabled = build(lang, 'X').selected.harmfulPhrasesLocalized === true;
      const pending = PENDING_MEASUREMENT.includes(lang);
      expect(enabled || pending).toBe(true);
      // And it cannot claim to be both.
      expect(enabled && pending).toBe(false);
    }
  });

  test('a language cannot be enabled before its lines are authored', () => {
    // The reverse mistake: enabling a language with no authored lines silently
    // ships the Korean source lines under a "localized" flag.
    for (const lang of ['ko', 'en', 'ja', 'zh', 'vi', 'id', 'es', 'pt', 'fr', 'th']) {
      if (build(lang, 'X').selected.harmfulPhrasesLocalized === true) {
        expect(localizedLanguages()).toContain(lang);
      }
    }
  });

  test('serverless.yml exposes the kill switch and the language list', () => {
    // Without these declared, the Lambda has no way to disable the localized
    // path if it misbehaves in production — the only remedy would be a redeploy.
    const sls = fs.readFileSync(path.join(__dirname, '..', 'serverless.yml'), 'utf8');
    expect(sls).toContain('SAJU_LOCALIZED_VOICE:');
    expect(sls).toContain('SAJU_LOCALIZED_VOICE_LANGUAGES:');
  });

  test('the Korean report is untouched by any of this', () => {
    const ko = build('ko', 'Korean');
    expect(ko.selected.harmfulPhrasesLocalized).toBeFalsy();
    expect(ko.text).not.toContain('HOW TO USE THIS BLOCK');
  });
});

// ── 3b. Localized element remedies carry no Korean ────────────────────────
// The colour/food/activity table is injected into every non-Korean report. While
// it was Korean-only, its words leaked verbatim: an English report printed 미역,
// 해조류 and 기준. Any authored table must therefore be complete and Hangul-free,
// or it reintroduces exactly the defect it exists to remove.
describe('contract: localized element remedies', () => {
  const {
    getLocalizedRemedies, localizedRemedyLanguages, elementLabel,
  } = require('../src/data/saju-knowledge/element-remedies-i18n');
  const ELEMENTS = ['목', '화', '토', '금', '수'];

  test.each(localizedRemedyLanguages().map((l) => [l]))('%s covers all five elements', (lang) => {
    const table = getLocalizedRemedies(lang);
    expect(Object.keys(table).sort()).toEqual([...ELEMENTS].sort());
    for (const el of ELEMENTS) {
      for (const field of ['colors', 'foods', 'activities', 'season', 'avoidExcess']) {
        expect(typeof table[el][field]).toBe('string');
        expect(table[el][field].length).toBeGreaterThan(0);
      }
    }
  });

  test.each(localizedRemedyLanguages().map((l) => [l]))('%s contains no Hangul', (lang) => {
    const table = getLocalizedRemedies(lang);
    const all = Object.values(table).flatMap((e) => Object.values(e)).join('');
    expect(all).not.toMatch(/[가-힣]/);
  });

  test('element names are written in hanja for non-Korean reports', () => {
    // The bare Korean element name used to be interpolated into the prompt, and
    // 목 / 수 turned up in English reports as a result.
    expect(elementLabel('수', 'ko')).toBe('수');
    expect(elementLabel('수', 'en')).toBe('水 (Water)');
    for (const el of ELEMENTS) {
      expect(elementLabel(el, 'fr')).not.toMatch(/[가-힣]/);
    }
  });
});

// ── 4. Backend catalog ↔ database CHECK constraint ────────────────────────
describe('contract: catalog currencies ⊆ payments.currency CHECK constraint', () => {
  const { allowed, definedIn } = effectiveCurrencyConstraint();

  test('constraint was parsed from a real definition', () => {
    expect(allowed.length).toBeGreaterThan(0);
    expect(definedIn).toMatch(/\.sql$/);
  });

  test('every product currency is accepted by the payments table', () => {
    const catalogCurrencies = [...new Set(Object.values(PRODUCTS).map((p) => p.currency))];
    const rejected = catalogCurrencies.filter((c) => !allowed.includes(c));
    // A currency here means: PayPal order succeeds, then the INSERT throws
    // 23514 and the customer sees a generic failure. Never ship that.
    expect(rejected).toEqual([]);
  });
});
