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
  getProduct,
  amountsMatch,
  resolveProductByPricing,
} = require('../src/config/products');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PRICING_TS = path.join(REPO_ROOT, 'frontend', 'lib', 'pricing.ts');
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

  test('every catalog product is reachable from some locale (no dead products)', () => {
    const usedTypes = new Set(entries.map((e) => e.productType));
    const orphans = Object.keys(PRODUCTS).filter((id) => !usedTypes.has(id));
    expect(orphans).toEqual([]);
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

// ── 3. Backend catalog ↔ database CHECK constraint ────────────────────────
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
