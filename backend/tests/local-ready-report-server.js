// Local-only harness mounting the real saju router with injected memory dependencies.
const express = require('express');
const http = require('http');
const { fixtureMansae } = require('./generate-reference-premium-report');
const { buildProviderMarkdown } = require('./generate-runtime-ready-report');
const { adaptMarkdownToPresentation } = require('../src/services/report-presentation');
const readingId = '33333333-3333-4333-8333-333333333333';
process.env.ACCESS_TOKEN_SECRET = 'local-ready-fixture-secret';
const { createAccessToken } = require('../src/utils/accessToken');
const generatedAt = '2026-07-22T00:00:00.000Z';
const fullText = buildProviderMarkdown();
const ready = adaptMarkdownToPresentation({ fullText, manseryeok: fixtureMansae, fortuneCycles: { daeunList: [{ age: 10 }], seunList: [{ year: 2026 }] }, childName: '민서', generatedAt });
const mockReading = { id: readingId, subject_name: '민서', birth_date: '2015-11-12', gender: 'female', language: 'ko', saju_data: fixtureMansae, ai_interpretation: { fullText, sections: {}, metadata: { generatedAt }, presentationStatus: 'ready', presentation: ready.presentation } };
const supabasePath = require.resolve('../src/config/supabase');
require.cache[supabasePath] = { id: supabasePath, filename: supabasePath, loaded: true, exports: { supabaseAdmin: { from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: mockReading, error: null }) }) }) }) }, handleSupabaseError: (e) => e } };
const ratePath = require.resolve('../src/middleware/rateLimit'); const pass = (_req, _res, next) => next(); require.cache[ratePath] = { id: ratePath, filename: ratePath, loaded: true, exports: { sajuPreviewLimiter: pass, sajuPremiumLimiter: pass, readLimiter: pass, otpRequestLimiter: pass } };
const routePath = require.resolve('../src/routes/saju.routes'); delete require.cache[routePath]; const sajuRoutes = require(routePath);
const token = createAccessToken({ purpose: 'report', readingId });
const app = express(); app.use(express.json()); app.get('/', (_req, res) => res.send(`<a href="/saju/reading/${readingId}/pdf?token=${token}">Download PDF</a>`)); app.use('/saju', sajuRoutes);
if (require.main === module) { const server = http.createServer(app).listen(Number(process.env.SOMYUNG_LOCAL_PORT || 18765), '127.0.0.1', () => console.log(`http://127.0.0.1:${server.address().port}/?readingId=${readingId}`)); }
module.exports = { app, readingId, token, generatedAt };
