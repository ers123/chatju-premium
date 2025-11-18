require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const serverless = require('serverless-http');
const { generalLimiter } = require('./src/middleware/rateLimit');
const { globalErrorHandler } = require('./src/utils/responses');
const { buildMessages } = require('./src/config/prompts');
const logger = require('./src/utils/logger');
const { getAIService } = require('./src/services/ai.service');

const app = express();

// CORS 설정 (Environment-aware)
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://chatju.pages.dev'] // Production: Only allow production domain
    : ['https://chatju.pages.dev', 'http://localhost:8080', 'http://localhost:3001']; // Development: Allow local dev servers

const corsOptions = {
    origin: allowedOrigins,
    credentials: true, // Enable credentials for authenticated requests
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
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
app.post('/fortuneTell', async (req, res) => {
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
            payment: '/payment/*',
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
        logger.info(`  POST http://localhost:${PORT}/payment/toss/create (PRIMARY - Korea)`);
        logger.info(`  POST http://localhost:${PORT}/payment/paypal/create (PRIMARY - International)`);
        logger.info(`  POST http://localhost:${PORT}/payment/stripe/create (Optional)`);
        logger.info('=================================');
    });
}

// ============================================
// AWS Lambda용 핸들러 (배포 시 사용)
// ============================================
module.exports.handler = serverless(app);
