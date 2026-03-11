# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ChatJu Premium is an AI-powered Korean fortune-telling service (사주팔자/Saju) with a freemium model. The platform calculates Four Pillars of Destiny based on birth data and generates AI interpretations.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Next.js 14 + TypeScript)                         │
│  Cloudflare Pages: chatju.pages.dev                         │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│  Backend (Express + Node.js)                                │
│  AWS Lambda via serverless-http                             │
│                                                             │
│  Routes:                                                    │
│  ├── /fortuneTell (free chat-style fortune)                 │
│  ├── /auth/* (signup, signin, verify, me)                   │
│  ├── /saju/preview (free preview, no auth)                  │
│  ├── /saju/calculate (premium, requires payment)            │
│  └── /payment/* (Toss, PayPal, Stripe)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  External Services                                          │
│  ├── Supabase PostgreSQL (users, payments, readings)        │
│  ├── OpenAI GPT-4o-mini (AI interpretations)                │
│  └── mansae-calculator (Four Pillars calculation)           │
└─────────────────────────────────────────────────────────────┘
```

## Key Technical Details

**Mansae Calculator Integration**: The mansae-calculator is an ES6 module loaded via dynamic import in CommonJS context:
```javascript
const { default: calculateMansae } = await import('mansae-calculator/mansae.js');
```

**Authentication**: JWT-based via Supabase Auth. The `authMiddleware` extracts user ID and attaches to `req.user`.

**Payment Flow**: Free preview → Payment (Toss/PayPal) → Premium reading stored in database.

**Supabase Clients**: Two clients exist in `backend/src/config/supabase.js`:
- `supabase` - Uses anon key, respects RLS
- `supabaseAdmin` - Uses service role key, bypasses RLS for backend operations

## Commands

### Backend
```bash
cd backend
npm install
npm run dev          # Start with nodemon (hot reload)
npm start            # Production start
npm test             # Run all tests (Jest)
npm run test:unit    # Run unit tests only
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
```

### Frontend
```bash
cd frontend
npm install
npm run dev          # Next.js dev server
npm run build        # Production build
npm run lint         # ESLint check
```

### Running Tests

Backend tests are in `backend/tests/`. Run specific test files:
```bash
cd backend
node tests/test-level5-flow.js      # Database flow test
node tests/test-level6-auth.js      # Auth integration test
node tests/test-level7-payments.js  # Payment integration test
```

## Environment Variables

Backend requires `.env` with:
- `OPENAI` or `OPENAI_API_KEY` - OpenAI API key
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` - Supabase credentials
- Payment credentials: `TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `STRIPE_SECRET_KEY`

Frontend requires `.env.local` for API endpoints.

## Code Organization

### Backend (`backend/src/`)
- `config/supabase.js` - Database client configuration
- `middleware/auth.js` - JWT validation middleware
- `routes/` - Express route handlers (auth, saju, payment)
- `services/` - Business logic (saju.service.js, payment.service.js, auth.service.js)

### Frontend (`frontend/`)
- `app/` - Next.js 14 App Router pages
- `components/ui/` - Reusable UI components (Button, Card, Input, Modal, Loading)
- `lib/api.ts` - API client with all backend endpoints
- `lib/utils.ts` - Utility functions

## API Endpoints Summary

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `POST /fortuneTell` | No | Free chat-style fortune |
| `POST /saju/preview` | No | Free Saju preview (conversion hook) |
| `POST /saju/calculate` | JWT | Premium Saju with full AI reading |
| `POST /auth/signup` | No | Register with email |
| `POST /auth/signin` | No | Magic link login |
| `GET /auth/me` | JWT | Get current user |
| `POST /payment/toss/create` | JWT | Create Toss payment order |
| `POST /payment/paypal/create` | JWT | Create PayPal order |

## Korean Terminology

- **사주팔자 (Saju)** - Four Pillars of Destiny, Korean astrology system
- **만세력 (Manseryeok)** - Calendar for calculating Four Pillars
- **오행 (Ohaeng)** - Five Elements (Wood, Fire, Earth, Metal, Water)
- **년주/월주/일주/시주** - Year/Month/Day/Hour pillars
