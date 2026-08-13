// Route-level tests for the emailed-OTP report lookup flow (IDOR fix)
// and consent enforcement on /saju/calculate.

const express = require('express');
const request = require('supertest');

// ── In-memory fake Supabase ─────────────────────────────────────────────
const db = {
  payments: [],
  readings: [],
  promo_codes: [],
  report_lookup_otp: [],
};

function matches(row, filters) {
  return Object.entries(filters).every(([k, v]) => row[k] === v);
}

// Note: jest.mock factories are hoisted by Babel and may only reference identifiers
// prefixed with "mock" (case-insensitive). The helper is therefore named mockCreateQuery.
function mockCreateQuery(table) {
  const q = { filters: {}, op: 'select' };
  const exec = () => {
    const rows = db[table].filter((r) => matches(r, q.filters));
    if (q.op === 'count') return { count: rows.length, data: null, error: null };
    if (q.op === 'insert') {
      q.rows.forEach((r, i) => db[table].push({ id: `${table}-${db[table].length + i + 1}`, ...r }));
      return { data: q.rows, error: null };
    }
    if (q.op === 'update') {
      rows.forEach((r) => Object.assign(r, q.values));
      return { data: rows, error: null };
    }
    if (q.op === 'delete') {
      db[table] = db[table].filter((r) => !matches(r, q.filters));
      return { data: null, error: null };
    }
    return { data: rows, error: null };
  };
  const chain = {
    select(cols, opts) { if (opts && opts.head) q.op = 'count'; return chain; },
    insert(rows) { q.op = 'insert'; q.rows = rows; return chain; },
    update(values) { q.op = 'update'; q.values = values; return chain; },
    delete() { q.op = 'delete'; return chain; },
    eq(k, v) { q.filters[k] = v; return chain; },
    order() { return chain; },
    limit() { return chain; },
    maybeSingle() {
      const r = exec();
      return Promise.resolve({ data: (r.data && r.data[0]) || null, error: null });
    },
    single() {
      const r = exec();
      const row = (r.data && r.data[0]) || null;
      // Mirror real PostgREST: empty .single() → PGRST116 ("no rows returned")
      return Promise.resolve({ data: row, error: row ? null : { code: 'PGRST116', message: 'not found' } });
    },
    then(resolve, reject) { return Promise.resolve(exec()).then(resolve, reject); },
  };
  return chain;
}

jest.mock('../src/config/supabase', () => ({
  supabaseAdmin: { from: (table) => mockCreateQuery(table) },
  handleSupabaseError: (e) => e,
}));

jest.mock('../src/middleware/auth', () => {
  const middleware = (req, res, next) => next();
  middleware.optionalAuth = (req, res, next) => { req.user = null; next(); };
  middleware.requireAdmin = (req, res, next) => next();
  return middleware;
});

jest.mock('../src/services/saju.service', () => ({
  generateSajuPreview: jest.fn(),
  generateSajuReading: jest.fn(),
}));

jest.mock('../src/services/pdf.service', () => ({
  generateReportPDF: jest.fn(async () => Buffer.from('%PDF-mock')),
}));

// Rate limiters are module-level singletons shared across every buildApp() in
// this file; their per-IP counters would otherwise leak between tests (all
// supertest requests originate from 127.0.0.1), throttling later tests and
// suppressing OTP sends. Mock them to passthrough for deterministic isolation.
jest.mock('../src/middleware/rateLimit', () => {
  // 어떤 리미터 이름이 와도 통과 미들웨어를 준다. 이름을 하나씩 나열하면 리미터를
  // 새로 만들 때마다 무관한 스위트가 "callback undefined"로 깨진다(실제로 3건 깨졌다).
  const pass = (_req, _res, next) => next();
  return new Proxy({}, { get: (_t, key) => (key === 'createRateLimiter' ? () => pass : pass) });
});

const sentOtps = [];
jest.mock('../src/services/email.service', () => ({
  sendReportEmail: jest.fn(),
  sendReportLookupOtp: jest.fn(async (email, code, lang) => {
    sentOtps.push({ email, code, lang });
    return { id: 'mock-email' };
  }),
}));

process.env.ACCESS_TOKEN_SECRET = 'test-secret';

const emailService = require('../src/services/email.service');
const { verifyAccessToken } = require('../src/utils/accessToken');
const sajuRoutes = require('../src/routes/saju.routes');
const pdfService = require('../src/services/pdf.service');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/saju', sajuRoutes);
  return app;
}

describe('Report lookup OTP flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sentOtps.length = 0;
    db.payments = [
      { id: 'pay-1', order_id: 'ORDER-OWNED', metadata: { email: 'owner@example.com' } },
      { id: 'pay-2', order_id: 'ORDER-OTHER', metadata: { email: 'someoneelse@example.com' } },
    ];
    db.readings = [];
    db.promo_codes = [];
    db.report_lookup_otp = [];
  });

  test('sends OTP when payment email matches, returns generic response', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/saju/report-lookup-otp')
      .send({ email: 'owner@example.com', orderId: 'ORDER-OWNED' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, otpRequired: true });
    expect(emailService.sendReportLookupOtp).toHaveBeenCalledTimes(1);
    expect(sentOtps[0].code).toMatch(/^\d{6}$/);
    // OTP stored hashed, never plaintext
    expect(db.report_lookup_otp).toHaveLength(1);
    expect(db.report_lookup_otp[0].otp_hash).not.toContain(sentOtps[0].code);
  });

  test('does NOT send OTP for unowned order, but response is identical (no leak)', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/saju/report-lookup-otp')
      .send({ email: 'attacker@example.com', orderId: 'ORDER-OWNED' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, otpRequired: true });
    expect(emailService.sendReportLookupOtp).not.toHaveBeenCalled();
  });

  test('rejects invalid email (CRLF injection guard)', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/saju/report-lookup-otp')
      .send({ email: 'a@b.com\r\nBcc: victim@example.com', orderId: 'ORDER-OWNED' });
    expect(res.status).toBe(400);
  });

  test('token endpoint rejects wrong OTP with generic 400', async () => {
    const app = buildApp();
    await request(app)
      .post('/saju/report-lookup-otp')
      .send({ email: 'owner@example.com', orderId: 'ORDER-OWNED' });

    const res = await request(app)
      .post('/saju/report-lookup-token')
      .send({ email: 'owner@example.com', otp: '000000', orderId: 'ORDER-OWNED' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_OTP');
    expect(res.body.reportLookupToken).toBeUndefined();
  });

  test('correct OTP issues a scoped lookup token, single-use', async () => {
    const app = buildApp();
    await request(app)
      .post('/saju/report-lookup-otp')
      .send({ email: 'owner@example.com', orderId: 'ORDER-OWNED' });
    const code = sentOtps[0].code;

    const res = await request(app)
      .post('/saju/report-lookup-token')
      .send({ email: 'owner@example.com', otp: code, orderId: 'ORDER-OWNED' });

    expect(res.status).toBe(200);
    const payload = verifyAccessToken(res.body.reportLookupToken, { purpose: 'report_lookup' });
    expect(payload.email).toBe('owner@example.com');
    expect(payload.orderId).toBe('ORDER-OWNED');

    // Single-use: same OTP cannot be exchanged twice
    const replay = await request(app)
      .post('/saju/report-lookup-token')
      .send({ email: 'owner@example.com', otp: code, orderId: 'ORDER-OWNED' });
    expect(replay.status).toBe(400);
  });

  test('valid OTP cannot be exchanged for someone else\'s order (scope re-check)', async () => {
    const app = buildApp();
    await request(app)
      .post('/saju/report-lookup-otp')
      .send({ email: 'owner@example.com', orderId: 'ORDER-OWNED' });
    const code = sentOtps[0].code;

    const res = await request(app)
      .post('/saju/report-lookup-token')
      .send({ email: 'owner@example.com', otp: code, orderId: 'ORDER-OTHER' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_OTP');
  });

  test('OTP locks out after 5 failed attempts even with the right code afterwards', async () => {
    const app = buildApp();
    await request(app)
      .post('/saju/report-lookup-otp')
      .send({ email: 'owner@example.com', orderId: 'ORDER-OWNED' });
    const code = sentOtps[0].code;
    const wrong = code === '111111' ? '222222' : '111111';

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/saju/report-lookup-token')
        .send({ email: 'owner@example.com', otp: wrong, orderId: 'ORDER-OWNED' });
    }

    const res = await request(app)
      .post('/saju/report-lookup-token')
      .send({ email: 'owner@example.com', otp: code, orderId: 'ORDER-OWNED' });
    expect(res.status).toBe(400);
  });
});

describe('reading-check claim key branch', () => {
  const crypto = require('crypto');

  function sha256hex(s) {
    return crypto.createHash('sha256').update(s).digest('hex');
  }

  const RAW_CLAIM = 'a'.repeat(64); // 64-char hex-like string — satisfies CLAIM_KEY_REGEX
  const CLAIM_HASH = sha256hex(RAW_CLAIM);
  const WRONG_CLAIM = 'b'.repeat(64);

  beforeEach(() => {
    jest.clearAllMocks();
    db.payments = [];
    db.readings = [
      {
        id: 'reading-claim-1',
        claim_key_hash: CLAIM_HASH,
        delivery_email: 'user@example.com',
        ai_interpretation: { fullText: 'test' },
        created_at: new Date().toISOString(),
      },
    ];
    db.promo_codes = [];
    db.report_lookup_otp = [];
  });

  test('returns complete+reportAccessToken for correct claim key', async () => {
    const app = buildApp();
    const res = await request(app).get(`/saju/reading-check?claim=${RAW_CLAIM}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('complete');
    expect(res.body.reading).toBeDefined();
    expect(res.body.reading.reportAccessToken).toBeDefined();
    // Verify the minted token is a valid report-scoped token
    const payload = verifyAccessToken(res.body.reading.reportAccessToken, { purpose: 'report' });
    expect(payload.readingId).toBe('reading-claim-1');
  });

  test('returns pending for wrong claim key (no information leak)', async () => {
    const app = buildApp();
    const res = await request(app).get(`/saju/reading-check?claim=${WRONG_CLAIM}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('pending');
    expect(res.body.reading).toBeUndefined();
  });

  test('returns pending for invalid-format claim key', async () => {
    const app = buildApp();
    const res = await request(app).get('/saju/reading-check?claim=short');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('pending');
  });

  test('report-lookup-token still rejects without OTP (standalone path unchanged)', async () => {
    const app = buildApp();
    // Directly hitting report-lookup-token without going through OTP → must fail
    const res = await request(app)
      .post('/saju/report-lookup-token')
      .send({ email: 'user@example.com', otp: '000000', orderId: 'ORDER-X' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_OTP');
  });

  test('sha256 hash helper is consistent', () => {
    // Belt-and-suspenders: verify our test setup matches what the route does
    const hash1 = sha256hex(RAW_CLAIM);
    const hash2 = sha256hex(RAW_CLAIM);
    expect(hash1).toBe(hash2);
    expect(hash1).toBe(CLAIM_HASH);
    expect(hash1).not.toBe(sha256hex(WRONG_CLAIM));
  });
});

describe('Consent enforcement on /saju/calculate', () => {
  test('rejects when consent is missing', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/saju/calculate')
      .send({ orderId: 'ORDER-OWNED', birthDate: '2020-01-01', birthTime: '10:00', gender: 'male' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('CONSENT_REQUIRED');
  });

  test('rejects when guardian consent is false', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/saju/calculate')
      .send({
        orderId: 'ORDER-OWNED',
        birthDate: '2020-01-01',
        birthTime: '10:00',
        gender: 'male',
        consent: { dataProcessing: true, guardian: false, policyVersion: 'v1', timestamp: new Date().toISOString() },
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('CONSENT_REQUIRED');
  });
});

describe('Completed report PDF contract', () => {
  test('passes explicit fallback interpretation to the renderer without polishing it', async () => {
    const readingId = '11111111-1111-4111-8111-111111111111';
    const aiInterpretation = { fullText: '# 1. legacy', sections: { 1: 'legacy' }, metadata: { provider: 'fixture' }, presentationStatus: 'fallback', presentationStatusReason: 'partial_required_labels' };
    db.readings = [{ id: readingId, status: 'complete', subject_name: '민서', birth_date: '2015-11-12', gender: 'female', language: 'ko', saju_data: {}, ai_interpretation: aiInterpretation }];
    const { createAccessToken } = require('../src/utils/accessToken');
    const token = createAccessToken({ purpose: 'report', readingId });
    const res = await request(buildApp()).get(`/saju/reading/${readingId}/pdf`).query({ token });
    expect(res.status).toBe(200);
    expect(pdfService.generateReportPDF).toHaveBeenCalledWith(expect.objectContaining({ aiInterpretation }));
    expect(pdfService.generateReportPDF.mock.calls.at(-1)[0].aiInterpretation).toEqual(aiInterpretation);
  });
});
