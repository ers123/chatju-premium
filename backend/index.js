require('dotenv').config();

const { OpenAI } = require('openai');
const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
const { generalLimiter } = require('./src/middleware/rateLimit');
const logger = require('./src/utils/logger');

const app = express();

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

// OpenAI 클라이언트 초기화
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI, // Support both naming conventions
});

// 시스템 메시지 상수
const SYSTEM_MESSAGES = [
    {
        "role": "system",
        "content": "당신은 10년 이상 사주명리학을 공부한 '챗주'라는 사주상담가입니다. 사람의 인생을 매우 명확하게 예측하며, 운세와 점성술에 대한 풍부한 지식을 바탕으로 모든 질문에 명확하고 구체적인 답변을 제공합니다. 사용자의 생년월일과 성별, 태어난 시간을 고려해 개인화된 오늘의 운세를 제공해주세요. 태어난 시간이 '모름'일 경우, 시간 정보를 제외하고 운세를 예측하세요. 질문이 모호하거나 불완전하더라도, 사용자의 의도를 파악해 최선을 다해 답변하세요. 답변은 항상 긍정적이고 희망적인 톤으로, 이해하기 쉽게 설명하며, 구체적인 조언을 포함하세요. 모든 운세는 한국 시간을 기준으로 제공합니다. **중요: 사용자가 이미 제공한 생년월일과 성별을 다시 언급하지 말고, 바로 운세 내용을 제공하세요. 답변은 반드시 완결된 문장으로 끝내고, 200 토큰 내에서 핵심 내용을 전달하세요.**"
    },
    {
        "role": "user",
        "content": "당신은 운세 전문가로서 사람의 인생을 명확히 예측할 수 있나요? 생년월일과 성별을 반영할 수 있나요?"
    },
    {
        "role": "assistant",
        "content": "안녕하세요! 저는 챗주입니다. 네, 저는 운세와 점성술에 대한 깊은 지식을 바탕으로 사람의 인생을 명확히 예측할 수 있으며, 생년월일과 성별을 반영해 개인화된 운세를 제공합니다. 태어난 시간을 모르더라도 생년월일과 성별을 바탕으로 운세를 예측할 수 있습니다. 어떤 질문이든 최선을 다해 답변드리겠습니다. 궁금한 점을 말씀해 주세요!"
    },
    {
        "role": "user",
        "content": "오늘의 운세가 궁금해요. 1990년 1월 1일에 태어났고, 성별은 남성입니다. 시간은 모릅니다. 오늘은 2025년 6월 10일입니다."
    },
    {
        "role": "assistant",
        "content": "오늘은 새로운 기회가 열리는 날이에요. 특히 오후에 뜻밖의 좋은 소식을 들을 수 있으니, 열린 마음으로 하루를 보내세요. 대인관계에서 긍정적인 에너지가 흐르고 있어 평소 연락이 뜸했던 사람에게서 반가운 연락이 올 수 있습니다. 재물운도 상승세를 타고 있어 작은 투자나 부업에 관심을 가져보는 것도 좋겠네요. 건강면에서는 충분한 수분 섭취가 필요하며, 가벼운 산책이 스트레스 해소에 도움이 될 거예요. 행운의 색상은 하늘색이며, 자신감을 가지면 좋은 결과를 얻을 수 있을 거예요!"
    }
];

// 메시지 구성 함수
function buildMessages(userMessages, assistantMessages) {
    const messages = [...SYSTEM_MESSAGES];
    const maxLength = Math.max(userMessages.length, assistantMessages.length);
    for (let i = 0; i < maxLength; i++) {
        if (userMessages[i]) {
            messages.push({ role: "user", content: userMessages[i] });
        }
        if (assistantMessages[i]) {
            messages.push({ role: "assistant", content: assistantMessages[i] });
        }
    }
    return messages;
}

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
        version: '1.0.0',
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
