// 리포트 평가 엔드포인트의 계약.
//
// 지키려는 것:
//   1. 리포트를 받은 사람만 평가할 수 있다(토큰 또는 claim key). 아무나 못 넣는다.
//   2. 별점은 1-5 정수만.
//   3. 평가는 **프롬프트 버전과 언어를 함께** 기록한다 — 버전 없이 모인 평점은
//      "언젠가 어떤 프롬프트가 받은 점수"일 뿐이라 비교에 못 쓴다.
//   4. 같은 리포트를 다시 평가하면 덮어쓴다(마음이 바뀌는 것은 정상).

const upserted = [];

const readingRow = {
  id: '33333333-3333-4333-8333-333333333333',
  language: 'ja',
  product_type: 'premium_saju',
  ai_interpretation: { metadata: { promptVersion: 'v2-voice-2026-08-13' } },
};

jest.mock('../src/config/supabase', () => ({
  supabaseAdmin: {
    from: (table) => {
      if (table === 'report_feedback') {
        return { upsert: async (row) => { upserted.push(row); return { error: null }; } };
      }
      // readings — 토큰/claim 두 경로 모두 같은 행을 돌려준다
      const chain = {
        select: () => chain,
        eq: () => chain,
        order: () => chain,
        limit: () => chain,
        maybeSingle: async () => ({ data: global.__readingFound ? readingRow : null }),
      };
      return chain;
    },
  },
  handleSupabaseError: (e) => e,
}));
jest.mock('../src/middleware/auth', () => { const m = (_q, _s, n) => n(); m.optionalAuth = m; m.requireAdmin = m; return m; });
jest.mock('../src/middleware/rateLimit', () => {
  // 어떤 리미터 이름이 와도 통과 미들웨어를 준다. 이름을 하나씩 나열하면 리미터를
  // 새로 만들 때마다 무관한 스위트가 "callback undefined"로 깨진다(실제로 3건 깨졌다).
  const pass = (_req, _res, next) => next();
  return new Proxy({}, { get: (_t, key) => (key === 'createRateLimiter' ? () => pass : pass) });
});
jest.mock('../src/services/saju.service', () => ({}));
jest.mock('../src/services/promo.service', () => ({}));
jest.mock('../src/services/reportLookupOtp.service', () => ({}));
jest.mock('../src/services/report-job', () => ({ dispatchReportJob: jest.fn() }));

process.env.ACCESS_TOKEN_SECRET = 'feedback-test-secret';

const express = require('express');
const request = require('supertest');
const { createAccessToken } = require('../src/utils/accessToken');
const sajuRoutes = require('../src/routes/saju.routes');

const app = express();
app.use(express.json());
app.use('/saju', sajuRoutes);

const CLAIM_KEY = 'b'.repeat(64);
const token = () => createAccessToken({ purpose: 'report', readingId: readingRow.id }, 3600);

beforeEach(() => { upserted.length = 0; global.__readingFound = true; });

test('리포트 토큰으로 별점을 남긴다 — 버전·언어가 함께 기록된다', async () => {
  const res = await request(app).post('/saju/feedback').send({ rating: 5, token: token() });

  expect(res.status).toBe(200);
  expect(upserted[0]).toMatchObject({
    reading_id: readingRow.id,
    rating: 5,
    language: 'ja',
    prompt_version: 'v2-voice-2026-08-13',
    product_type: 'premium_saju',
  });
});

test('claim key로도 남길 수 있다 — 로그인 없는 구매자의 경로', async () => {
  const res = await request(app).post('/saju/feedback').send({ rating: 4, claimKey: CLAIM_KEY });
  expect(res.status).toBe(200);
  expect(upserted[0].rating).toBe(4);
});

test('소유 증명이 없으면 401 — 아무나 평점을 채워 넣을 수 없다', async () => {
  const res = await request(app).post('/saju/feedback').send({ rating: 5 });
  expect(res.status).toBe(401);
  expect(upserted).toHaveLength(0);
});

test('남의 토큰이 아니라 잘못된 토큰이면 401', async () => {
  const res = await request(app).post('/saju/feedback').send({ rating: 5, token: 'not-a-token' });
  expect(res.status).toBe(401);
  expect(upserted).toHaveLength(0);
});

test('별점 범위를 벗어나면 400', async () => {
  for (const rating of [0, 6, 2.5, 'five', null]) {
    const res = await request(app).post('/saju/feedback').send({ rating, token: token() });
    expect(res.status).toBe(400);
  }
  expect(upserted).toHaveLength(0);
});

test('코멘트가 2000자를 넘으면 400', async () => {
  const res = await request(app).post('/saju/feedback').send({ rating: 3, comment: 'x'.repeat(2001), token: token() });
  expect(res.status).toBe(400);
});

test('리포트가 없으면 404', async () => {
  global.__readingFound = false;
  const res = await request(app).post('/saju/feedback').send({ rating: 3, token: token() });
  expect(res.status).toBe(404);
});

test('코멘트는 공백만 있으면 null로 저장한다', async () => {
  await request(app).post('/saju/feedback').send({ rating: 3, comment: '   ', token: token() });
  expect(upserted[0].comment).toBeNull();
});
