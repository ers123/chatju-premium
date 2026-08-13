const express = require('express');
const request = require('supertest');
const { createAccessToken } = require('../src/utils/accessToken');
const { fixtureMansae } = require('./generate-reference-premium-report');
const { buildProviderMarkdown } = require('./generate-runtime-ready-report');
const { adaptMarkdownToPresentation } = require('../src/services/report-presentation');
const pdfService = require('../src/services/pdf.service');

const readingId = '22222222-2222-4222-8222-222222222222';
const fullText = buildProviderMarkdown();
const ready = adaptMarkdownToPresentation({ fullText, manseryeok: fixtureMansae, fortuneCycles: { daeunList: [{ age: 10 }], seunList: [{ year: 2026 }] }, childName: '민서', generatedAt: '2026-07-22T00:00:00.000Z' });
const mockReading = { id: readingId, subject_name: '민서', birth_date: '2015-11-12', gender: 'female', language: 'ko', created_at: '2026-07-21T00:00:00.000Z', saju_data: fixtureMansae, ai_interpretation: { fullText, sections: {}, metadata: { generatedAt: '2026-07-22T00:00:00.000Z' }, presentationStatus: 'ready', presentation: ready.presentation } };

jest.mock('../src/config/supabase', () => ({ supabaseAdmin: { from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: mockReading, error: null }) }) }) }) }, handleSupabaseError: (e) => e }));
jest.mock('../src/middleware/auth', () => { const m = (_req, _res, next) => next(); m.optionalAuth = m; m.requireAdmin = m; return m; });
jest.mock('../src/middleware/rateLimit', () => {
  // 어떤 리미터 이름이 와도 통과 미들웨어를 준다. 이름을 하나씩 나열하면 리미터를
  // 새로 만들 때마다 무관한 스위트가 "callback undefined"로 깨진다(실제로 3건 깨졌다).
  const pass = (_req, _res, next) => next();
  return new Proxy({}, { get: (_t, key) => (key === 'createRateLimiter' ? () => pass : pass) });
});
jest.mock('../src/services/saju.service', () => ({}));
jest.mock('../src/services/promo.service', () => ({}));
jest.mock('../src/services/reportLookupOtp.service', () => ({}));

const sajuRoutes = require('../src/routes/saju.routes');
test('actual saju router renders runtime-derived ready reading', async () => {
  process.env.ACCESS_TOKEN_SECRET = 'local-ready-fixture-secret';
  const app = express(); app.use(express.json()); app.use('/saju', sajuRoutes);
  const token = createAccessToken({ purpose: 'report', readingId });
  const originalGenerate = pdfService.generateReportPDF;
  const capture = jest.spyOn(pdfService, 'generateReportPDF').mockImplementation(async (params) => originalGenerate(params));
  const res = await request(app).get(`/saju/reading/${readingId}/pdf`).query({ token });
  expect(res.status).toBe(200); expect(res.headers['content-type']).toMatch(/application\/pdf/); expect(res.body.slice(0, 4).toString()).toBe('%PDF');
  const fs = require('fs'); const os = require('os'); const path = require('path'); const p = path.join(os.tmpdir(), `ready-${process.pid}.pdf`); fs.writeFileSync(p, res.body);
  const { execFileSync } = require('child_process'); expect(execFileSync('pdftotext', ['-layout', p, '-'], { encoding: 'utf8' })).toContain('생활 속 밸런스 (참고 사항)');
  expect(capture).toHaveBeenCalledWith(expect.objectContaining({ aiInterpretation: mockReading.ai_interpretation }));
  expect(capture.mock.calls[0][0].aiInterpretation).toEqual(mockReading.ai_interpretation);
  expect(capture.mock.calls[0][0].generatedAt).toBe(mockReading.ai_interpretation.metadata.generatedAt);
  capture.mockRestore();
});
