// 프로모 리포트 요청이 30초 안에 끝나는가.
//
// API Gateway는 30초에서 끊는데 리포트는 40~50초가 걸린다. 새 클라이언트가
// `async: true`를 보내면 라우트는 생성을 잡으로 넘기고 **즉시 202**를 준다.
// 옛 클라이언트(플래그 없음)는 예전 그대로 200 + 완성본을 받아야 한다.

jest.mock('../src/config/supabase', () => ({
  supabaseAdmin: { from: () => ({ select: () => ({ eq: () => Promise.resolve({ count: 0, error: null }) }) }) },
  handleSupabaseError: (e) => e,
}));
jest.mock('../src/middleware/auth', () => { const m = (_q, _s, n) => n(); m.optionalAuth = m; m.requireAdmin = m; return m; });
jest.mock('../src/middleware/rateLimit', () => { const m = (_q, _s, n) => n(); return { sajuPreviewLimiter: m, sajuPremiumLimiter: m, readLimiter: m, otpRequestLimiter: m }; });
jest.mock('../src/services/reportLookupOtp.service', () => ({}));
jest.mock('../src/services/saju.service', () => ({
  generateSajuReading: jest.fn(),
  verifyPaymentForReading: jest.fn(),
}));
jest.mock('../src/services/promo.service', () => ({
  validatePromoCode: jest.fn(),
  hasEmailUsedPromo: jest.fn(),
  usePromoCode: jest.fn(),
}));
jest.mock('../src/services/report-job', () => ({ dispatchReportJob: jest.fn() }));

const express = require('express');
const request = require('supertest');
const sajuService = require('../src/services/saju.service');
const promoService = require('../src/services/promo.service');
const { dispatchReportJob } = require('../src/services/report-job');
const sajuRoutes = require('../src/routes/saju.routes');

const app = express();
app.use(express.json());
app.use('/saju', sajuRoutes);

const CLAIM_KEY = 'a'.repeat(64);

function body(extra = {}) {
  return {
    promoCode: 'TEST2026',
    email: 'reader@example.com',
    birthDate: '2017-06-14',
    birthTime: '14:30',
    gender: 'female',
    language: 'en',
    subjectName: 'Minseo',
    claimKey: CLAIM_KEY,
    consent: {
      dataProcessing: true,
      guardian: true,
      policyVersion: '2026-06-12',
      timestamp: '2026-08-12T00:00:00.000Z',
    },
    ...extra,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  promoService.validatePromoCode.mockResolvedValue({ valid: true, promoCode: { id: 'promo-1', code: 'TEST2026' } });
  promoService.hasEmailUsedPromo.mockResolvedValue(false);
});

test('async: true → 202 pending, 생성은 잡으로 넘어간다', async () => {
  dispatchReportJob.mockResolvedValue({ mode: 'async' });

  const res = await request(app).post('/saju/calculate-promo').send(body({ async: true }));

  expect(res.status).toBe(202);
  expect(res.body).toEqual({ status: 'pending', pollWith: 'claim' });
  // 요청 핸들러 안에서는 생성도, 프로모 소진도 일어나지 않는다.
  expect(sajuService.generateSajuReading).not.toHaveBeenCalled();
  expect(promoService.usePromoCode).not.toHaveBeenCalled();
  // 잡에는 프로모 소진 정보가 함께 실린다 — 성공 뒤 소진은 워커의 책임이다.
  expect(dispatchReportJob).toHaveBeenCalledWith(expect.objectContaining({
    promo: expect.objectContaining({ promoCodeId: 'promo-1', email: 'reader@example.com' }),
  }));
});

test('잡을 띄우지 못하면 완성본을 200으로 준다', async () => {
  dispatchReportJob.mockResolvedValue({ mode: 'inline', reading: { readingId: 'r-7' } });

  const res = await request(app).post('/saju/calculate-promo').send(body({ async: true }));

  expect(res.status).toBe(200);
  expect(res.body).toEqual({ readingId: 'r-7' });
});

test('플래그 없는 옛 클라이언트는 예전 경로 그대로다', async () => {
  sajuService.generateSajuReading.mockResolvedValue({ readingId: 'r-legacy' });

  const res = await request(app).post('/saju/calculate-promo').send(body());

  expect(res.status).toBe(200);
  expect(res.body).toEqual({ readingId: 'r-legacy' });
  expect(dispatchReportJob).not.toHaveBeenCalled();
  expect(promoService.usePromoCode).toHaveBeenCalledWith(expect.objectContaining({ readingId: 'r-legacy' }));
});

test('claim key가 없으면 async를 밝혔어도 동기로 처리한다 — 폴링할 열쇠가 없다', async () => {
  sajuService.generateSajuReading.mockResolvedValue({ readingId: 'r-noclaim' });

  const res = await request(app).post('/saju/calculate-promo').send(body({ async: true, claimKey: undefined }));

  expect(res.status).toBe(200);
  expect(dispatchReportJob).not.toHaveBeenCalled();
});

test('프로모가 무효하면 잡을 띄우지 않는다', async () => {
  promoService.validatePromoCode.mockResolvedValue({ valid: false, error: 'expired' });

  const res = await request(app).post('/saju/calculate-promo').send(body({ async: true }));

  expect(res.status).toBe(400);
  expect(dispatchReportJob).not.toHaveBeenCalled();
});

test('이미 쓴 프로모면 409 — 잡을 띄우지 않는다', async () => {
  promoService.hasEmailUsedPromo.mockResolvedValue(true);

  const res = await request(app).post('/saju/calculate-promo').send(body({ async: true }));

  expect(res.status).toBe(409);
  expect(dispatchReportJob).not.toHaveBeenCalled();
});

test('동의가 없으면 잡을 띄우지 않는다', async () => {
  const res = await request(app).post('/saju/calculate-promo').send(body({ async: true, consent: undefined }));

  expect(res.status).toBe(400);
  expect(res.body.code).toBe('CONSENT_REQUIRED');
  expect(dispatchReportJob).not.toHaveBeenCalled();
});

// ── 유료 경로 ────────────────────────────────────────────────────────────────
// 결제 확인은 잡 안이 아니라 요청 안에서 해야 한다. 202를 준 뒤 잡이 결제 문제로
// 실패하면 결제한 사람은 이유도 모른 채 폴링만 하게 된다.

function paidBody(extra = {}) {
  const { promoCode, email, ...rest } = body();
  return { ...rest, orderId: 'order-1', paymentAccessToken: 'tok', deliveryEmail: email, ...extra };
}

test('유료: 결제를 먼저 확인한 뒤 202를 준다', async () => {
  sajuService.verifyPaymentForReading.mockResolvedValue({ id: 'pay-1', product_type: 'premium_saju' });
  dispatchReportJob.mockResolvedValue({ mode: 'async' });

  const res = await request(app).post('/saju/calculate').send(paidBody({ async: true }));

  expect(res.status).toBe(202);
  expect(sajuService.verifyPaymentForReading).toHaveBeenCalledWith(
    expect.objectContaining({ orderId: 'order-1', paymentAccessToken: 'tok' })
  );
  expect(dispatchReportJob).toHaveBeenCalled();
});

test('유료: 결제가 완료되지 않았으면 403이고 잡을 띄우지 않는다', async () => {
  sajuService.verifyPaymentForReading.mockRejectedValue(new Error('Payment not completed. Current status: pending'));

  const res = await request(app).post('/saju/calculate').send(paidBody({ async: true }));

  expect(res.status).toBe(403);
  expect(res.body.code).toBe('PAYMENT_INCOMPLETE');
  expect(dispatchReportJob).not.toHaveBeenCalled();
});

test('유료: 결제를 찾을 수 없으면 404이고 잡을 띄우지 않는다', async () => {
  sajuService.verifyPaymentForReading.mockRejectedValue(new Error('Payment not found'));

  const res = await request(app).post('/saju/calculate').send(paidBody({ async: true }));

  expect(res.status).toBe(404);
  expect(dispatchReportJob).not.toHaveBeenCalled();
});
