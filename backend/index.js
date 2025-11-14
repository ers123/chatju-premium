require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const serverless = require('serverless-http');
const { generalLimiter } = require('./src/middleware/rateLimit');
const { globalErrorHandler } = require('./src/utils/responses');
const { getOpenAIClient } = require('./src/config/openai');
const { buildMessages } = require('./src/config/prompts');
const logger = require('./src/utils/logger');

const app = express();

// Security headers with Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// CORS 설정
const corsOptions = {
    origin: ['https://chatju.pages.dev', 'http://localhost:8080', 'http://localhost:3001'],
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

// Initialize shared OpenAI client (singleton pattern - optimized)
const client = getOpenAIClient();

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

        const completion = await client.chat.completions.create({
            messages: messages,
            model: "gpt-4o-mini",
            max_tokens: 250,
            temperature: 0.7,
        });

        const fortune = completion.choices[0].message.content;
        logger.info('Free Fortune: Response generated', {
            tokens: completion.usage.total_tokens,
            model: 'gpt-4o-mini'
        });

        res.json({ assistant: fortune });

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
        logger.info(`🤖 OpenAI: ${(process.env.OPENAI_API_KEY || process.env.OPENAI) ? 'Connected ✅' : 'Not configured ❌'}`);
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
