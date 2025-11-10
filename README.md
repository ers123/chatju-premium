# ChatJu Premium

AI-powered Korean fortune-telling service with professional Saju (사주) readings.

## 🎯 Project Status

**Current Phase**: Level 5 Complete ✅
**Next Phase**: Level 6 - Real Supabase Authentication

### Completed Milestones
- ✅ Level 1-2: Mansae Calculator Integration
- ✅ Level 3: API Endpoints & Mock Auth
- ✅ Level 4: Mock Payment System
- ✅ Level 5: Real Database Integration (Supabase PostgreSQL)

### In Progress
- ⏳ Level 6: Supabase Auth (Magic Link)
- ⏳ Level 7: Payment Gateway Integration (Toss Payments, Stripe)

---

## 🏗️ Architecture

### Technology Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| **Frontend** | Vanilla JS + HTML/CSS (Cloudflare Pages) | ✅ |
| **Backend** | Express + Node.js + AWS Lambda | ✅ |
| **Database** | Supabase PostgreSQL | ✅ |
| **AI** | OpenAI GPT-4o-mini | ✅ |
| **Payment (KR)** | Toss Payments | ⏳ |
| **Payment (INT)** | Stripe | ⏳ |
| **Saju Library** | [manse-calculator](https://github.com/ers123/manse-calculator) | ✅ |

### System Architecture

```
Frontend (Cloudflare Pages: chatju.pages.dev)
    ↓ HTTPS
API Gateway (AWS)
    ↓
Lambda Function (Express)
    ├─ Middleware Layer (Auth, CORS, Error Handling)
    ├─ Routes Layer (/fortuneTell, /saju/calculate, /payment/*)
    ├─ Services Layer (Business Logic)
    └─ External APIs
        ├─ OpenAI API (AI Interpretation)
        ├─ Mansae Calculator (Saju Calculation)
        └─ Supabase PostgreSQL (Data Persistence)
```

---

## 📁 Project Structure

```
chatju-premium/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js              # Supabase client
│   │   ├── middleware/
│   │   │   └── auth.js                  # JWT authentication
│   │   ├── routes/
│   │   │   └── saju.routes.js           # API routes
│   │   └── services/
│   │       ├── saju.service.js          # Saju calculation + AI
│   │       └── payment.service.js       # Payment management
│   ├── database/
│   │   └── schema.sql                   # PostgreSQL schema
│   ├── tests/
│   │   ├── test-supabase-connection.js  # DB connection test
│   │   └── test-level5-flow.js          # Integration test
│   ├── docs/
│   │   └── progress/                    # Level documentation
│   ├── index.js                         # Express server
│   ├── package.json                     # Dependencies
│   └── .env                             # Environment variables (not committed)
├── progress.md                          # Development progress report
└── README.md                            # This file
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ers123/chatju-premium.git
   cd chatju-premium/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials:
   # - OPENAI: Your OpenAI API key
   # - SUPABASE_URL: Your Supabase project URL
   # - SUPABASE_ANON_KEY: Supabase anon public key
   # - SUPABASE_SERVICE_KEY: Supabase service role key
   ```

4. **Deploy database schema**
   - Go to your Supabase project dashboard
   - Open SQL Editor
   - Run `backend/database/schema.sql`

5. **Test the setup**
   ```bash
   # Test database connection
   node tests/test-supabase-connection.js

   # Run full integration test
   node tests/test-level5-flow.js
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

---

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Individual Tests
```bash
# Database connection
node tests/test-supabase-connection.js

# Full Level 5 integration
node tests/test-level5-flow.js
```

### Expected Output
```
✅ Tests Passed: 9
❌ Tests Failed: 0
🎉 LEVEL 5 PASSED!
```

---

## 📊 Database Schema

### Tables

**users** - User profiles
- `id` (UUID, primary key)
- `email` (unique)
- `language_preference` (ko/en/zh)
- `timezone`

**payments** - Payment records
- `id` (UUID, primary key)
- `user_id` (foreign key → users)
- `order_id` (unique)
- `amount`, `currency`
- `status` (pending/completed/failed/refunded)
- `product_type` (basic/deluxe)

**readings** - Saju readings
- `id` (UUID, primary key)
- `user_id` (foreign key → users)
- `payment_id` (foreign key → payments)
- `birth_date`, `birth_time`, `gender`
- `saju_data` (JSONB - manseryeok result)
- `ai_interpretation` (JSONB - OpenAI result)

---

## 🔐 Security

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ JWT authentication with Supabase
- ✅ Environment variables for sensitive keys
- ✅ CORS restricted to chatju.pages.dev
- ✅ .gitignore excludes .env and node_modules

**Important**: Never commit `.env` file or expose service_role key!

---

## 📝 API Endpoints

### Public Endpoints
- `GET /` - Health check
- `POST /fortuneTell` - Free fortune telling (no auth)

### Protected Endpoints (Requires JWT)
- `POST /saju/calculate` - Premium saju reading
- `GET /readings/:id` - Retrieve reading by ID

---

## 🛠️ Development

### Running Locally
```bash
npm run dev  # Starts with nodemon (auto-reload)
```

### Code Structure
- **Config**: Supabase client, environment setup
- **Middleware**: Authentication, CORS, error handling
- **Routes**: API endpoint definitions
- **Services**: Business logic (saju calculation, payments)

---

## 📈 Progress & Milestones

See [progress.md](progress.md) for detailed development progress.

### Level 5 Achievements ✅
- Real Supabase PostgreSQL integration
- Payment records persist in database
- Reading data stored permanently
- UUID-based IDs for all entities
- Data survives server restarts
- 9/9 integration tests passing

### Next Steps
- Level 6: Implement Supabase Auth (Magic Link)
- Level 7: Integrate Toss Payments + Stripe
- Production deployment to AWS Lambda

---

## 📚 Documentation

- [Progress Report](progress.md) - Detailed development status
- [Level 5 Docs](backend/docs/progress/) - Supabase integration guide
- [Database Schema](backend/database/schema.sql) - PostgreSQL schema

---

## 🤝 Contributing

This is a private project. For questions or suggestions, contact:

**Email**: contact@harmonycon.com
**Developer**: CodexNine

---

## 📄 License

MIT License

Copyright (c) 2025 CodexNine / HarmonyCon

---

## 🔗 Related Repositories

- [manse-calculator](https://github.com/ers123/manse-calculator) - Korean Saju calculation library

---

**Last Updated**: November 10, 2025
**Version**: 1.1 (Level 5 Complete)
