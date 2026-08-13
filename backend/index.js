require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const serverless = require('serverless-http');
const { generalLimiter, fortuneTellLimiter } = require('./src/middleware/rateLimit');
const { globalErrorHandler } = require('./src/utils/responses');
const { buildMessages } = require('./src/config/prompts');
const logger = require('./src/utils/logger');
const { getAIService } = require('./src/services/ai.service');

const app = express();
app.set('trust proxy', 1);

// CORS 설정 (Environment-aware)
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://somyung.cc', 'https://somyung.pages.dev']
    : ['https://somyung.cc', 'https://somyung.pages.dev', 'http://localhost:8080', 'http://localhost:3001'];

const corsOptions = {
    origin: allowedOrigins,
    credentials: true, // Enable credentials for authenticated requests
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request logging middleware
app.use(logger.requestLogger);

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Initialize AI Service (supports OpenAI, Gemini, Claude)
const aiService = getAIService();

// ============================================
// 기존 무료 운세 엔드포인트
// ============================================
app.post('/fortuneTell', fortuneTellLimiter, async (req, res) => {
    try {
        logger.debug('Free Fortune: Received request', {
            userMessagesCount: req.body.userMessages?.length || 0,
            assistantMessagesCount: req.body.assistantMessages?.length || 0
        });

        const { userMessages = [], assistantMessages = [] } = req.body;
        const messages = buildMessages(userMessages, assistantMessages);

        // Use AI Service (supports OpenAI, Gemini, Claude)
        const result = await aiService.generateFortune(messages, {
            maxTokens: 250,
            temperature: 0.7,
        });

        logger.info('Free Fortune: Response generated', {
            tokens: result.tokensUsed,
            provider: result.provider,
            model: result.model
        });

        res.json({
            assistant: result.content,
            metadata: {
                provider: result.provider,
                model: result.model,
            }
        });

    } catch (error) {
        logger.logError(error, { context: 'Free Fortune' });
        res.status(500).json({
            error: '운세 요청 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

app.post('/saveChatHistory', (req, res) => {
    try {
        const { userMessages, assistantMessages } = req.body;
        logger.debug('Chat History: Saved', {
            userCount: userMessages?.length || 0,
            assistantCount: assistantMessages?.length || 0
        });
        res.status(200).json({ message: 'Chat history saved successfully' });
    } catch (error) {
        logger.logError(error, { context: 'Chat History' });
        res.status(500).json({
            error: '채팅 기록 저장 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// ============================================
// API Routes
// ============================================

// Authentication routes (Level 6)
const authRoutes = require('./src/routes/auth.routes');
app.use('/auth', authRoutes);

// Premium Saju routes (Level 5)
const sajuRoutes = require('./src/routes/saju.routes');
app.use('/saju', sajuRoutes);

// Real payment routes (Level 7)
const paymentRoutes = require('./src/routes/payment.routes');
app.use('/payment', paymentRoutes);

// Promo code routes
const promoRoutes = require('./src/routes/promo.routes');
app.use('/promo', promoRoutes);

// Admin routes (Settings & Statistics)
const adminRoutes = require('./src/routes/admin.routes');
app.use('/admin', adminRoutes);

// ============================================
// 헬스체크 엔드포인트
// ============================================
app.get('/', (req, res) => {
    res.json({
        message: 'ChatJu Premium API is running! ✨',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        version: '1.1.0',
        endpoints: {
            free: '/fortuneTell',
            auth: '/auth/*',
            premium: '/saju/calculate',
            promo: '/saju/calculate-promo',
            payment: '/payment/*',
            promoValidate: '/promo/validate',
            admin: '/admin/*',
            health: '/'
        }
    });
});

// ============================================
// Global Error Handler (must be last!)
// ============================================
app.use(globalErrorHandler);

// ============================================
// 로컬 개발 서버 (중요!)
// ============================================
if (require.main === module) {
    // 로컬에서 직접 실행할 때만 서버 시작
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        logger.info('=================================');
        logger.info('🚀 ChatJu Backend Server Started');
        logger.info('=================================');
        logger.info(`📍 Port: ${PORT}`);
        logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

        // SECURITY WARNING: Check if NODE_ENV is set correctly
        if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
            logger.warn('⚠️  WARNING: NODE_ENV is not set to "production"');
            logger.warn('⚠️  Stack traces and error details will be exposed in API responses');
            logger.warn('⚠️  Set NODE_ENV=production in AWS Lambda environment variables');
        }

        logger.info(`🔒 CORS: Allowing origins: ${allowedOrigins.join(', ')}`);

        // AI Provider status
        const providerInfo = aiService.getProviderInfo();
        const currentProvider = providerInfo.details[providerInfo.current];
        logger.info(`🤖 AI Provider: ${currentProvider.name} (${providerInfo.current})`);
        logger.info(`   Model: ${currentProvider.model}`);
        logger.info(`   Available: ${providerInfo.available.map(p => providerInfo.details[p].name).join(', ')}`);
        logger.info('=================================');
        logger.info('Available endpoints:');
        logger.info(`  GET  http://localhost:${PORT}/`);
        logger.info(`  POST http://localhost:${PORT}/fortuneTell`);
        logger.info(`  POST http://localhost:${PORT}/auth/signup`);
        logger.info(`  POST http://localhost:${PORT}/auth/signin`);
        logger.info(`  POST http://localhost:${PORT}/saju/preview (FREE)`);
        logger.info(`  POST http://localhost:${PORT}/saju/calculate`);
        logger.info(`  POST http://localhost:${PORT}/payment/paypal/create`);
        logger.info('=================================');
    });
}

// ============================================
// AWS Lambda용 핸들러 (배포 시 사용)
// ============================================
const httpHandler = serverless(app, {
  binary: ['application/pdf', 'image/png', 'image/jpeg'],
});

// 같은 Lambda가 두 종류의 이벤트를 받는다. API Gateway가 보낸 HTTP 요청과, 리포트
// 라우트가 스스로 띄운 생성 잡이다. 잡은 게이트웨이 뒤에 있지 않으므로 60초를 다
// 쓸 수 있다 — 30초 한도 때문에 정상 리포트가 503으로 보이던 문제의 해결책이다.
// (src/services/report-job.js의 주석 참고)
module.exports.handler = async (event, context) => {
    // 주간 신호 잡 — EventBridge가 부른다(serverless.yml의 schedule).
    // 사람이 매주 두 명령을 치는 대신 여기서 돌고 결과를 메일로 보낸다.
    if (event && event.__marker === 'somyung.weekly-signals') {
        const { runWeeklySignals } = require('./src/services/signals.service');
        const result = await runWeeklySignals({ days: event.days || 90, apply: true, notify: true });
        logger.info('[Weekly Signals] done', {
            reports: result.digest.reports.total,
            feedback: result.digest.feedback.responses ?? null,
            statusChanges: result.sync.changes.length,
            notified: result.notified,
        });
        return { ok: true, notified: result.notified, changes: result.sync.changes.length };
    }

    // 보존기간 청소 — EventBridge가 부른다. 정책(365일)이 문서에만 있고 실행이
    // 사람 기억에 달려 있으면, 아동 생년월일이 무기한 쌓이는 쪽으로 조용히 실패한다.
    if (event && event.__marker === 'somyung.retention-cleanup') {
        const { runRetentionCleanup } = require('./scripts/retention-cleanup');
        const summary = await runRetentionCleanup({ apply: event.apply !== false });
        logger.info('[Retention] scheduled run done', summary);
        return { ok: true, ...summary };
    }

    const { isReportJobEvent, runReportJob } = require('./src/services/report-job');
    if (isReportJobEvent(event)) {
        try {
            const result = await runReportJob(event);
            return { ok: true, readingId: result.readingId || null, skipped: !!result.skipped };
        } catch (error) {
            // 여기서 던지면 Lambda가 비동기 호출을 재시도한다. 재시도는 워커의
            // claim key 중복 검사에 걸려 걸러지지만, 실패 자체는 로그로 남겨야 한다.
            logger.logError(error, { context: 'Report Job' });
            throw error;
        }
    }
    return httpHandler(event, context);
};
