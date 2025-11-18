# ChatJu Premium - Production Deployment Guide

Complete guide for deploying ChatJu Premium to production using Cloudflare Pages (frontend) and AWS Lambda (backend).

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Backend Deployment (AWS Lambda)](#backend-deployment-aws-lambda)
4. [Frontend Deployment (Cloudflare Pages)](#frontend-deployment-cloudflare-pages)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Admin Access](#admin-access)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)
9. [Cost Estimation](#cost-estimation)

---

## 🔧 Prerequisites

### Required Accounts
- **AWS Account** (for Lambda backend)
- **Cloudflare Account** (for Pages hosting)
- **Supabase Account** (for database)
- **GitHub Account** (for version control)
- **At least one AI Provider API key**:
  - Google Gemini API (recommended - has free tier)
  - OpenAI API (alternative)
  - Anthropic Claude API (alternative)

### Required Tools
```bash
# Install Node.js 18+
node --version  # Should be >= 18.0.0

# Install Serverless Framework globally
npm install -g serverless

# Install AWS CLI (optional but recommended)
brew install awscli  # macOS
# OR
sudo apt-get install awscli  # Linux
```

---

## 🌍 Environment Setup

### 1. Get AI Provider API Keys

#### Option A: Google Gemini (Recommended - Free Tier)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Get API Key"
3. Copy your `GEMINI_API_KEY`

**Pricing**: Free tier includes 60 requests/minute

#### Option B: OpenAI
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create new API key
3. Copy your `OPENAI_API_KEY`

**Pricing**: ~$0.15 per 1M tokens (gpt-4o-mini)

#### Option C: Anthropic Claude
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create API key
3. Copy your `ANTHROPIC_API_KEY`

**Pricing**: ~$0.25 per 1M tokens (claude-3-haiku)

### 2. Setup Supabase Database

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your credentials:
   - Project URL: `https://xxxxx.supabase.co`
   - Anon key: `eyJhbGci...` (public key)
   - Service role key: `eyJhbGci...` (secret key)

3. Run database migrations (if needed):
```sql
-- Already created in previous setup
-- Tables: users, payments, saju_readings
```

### 3. Payment Gateway Setup

#### Toss Payments (Korea)
1. Sign up at [Toss Payments](https://www.tosspayments.com/)
2. Get: `TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`

#### PayPal (International)
1. Sign up at [PayPal Developer](https://developer.paypal.com/)
2. Create app in Dashboard
3. Get: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`

---

## 🚀 Backend Deployment (AWS Lambda)

### Step 1: Configure AWS Credentials

```bash
# Option A: Using Serverless CLI
serverless config credentials \
  --provider aws \
  --key YOUR_AWS_ACCESS_KEY \
  --secret YOUR_AWS_SECRET_KEY

# Option B: Using AWS CLI
aws configure
# Enter: Access Key, Secret Key, Region (ap-northeast-2), Format (json)
```

### Step 2: Set Environment Variables

Create `.env` file in `backend/` directory:

```bash
# backend/.env

# ============================================
# Production Configuration
# ============================================
NODE_ENV=production

# ============================================
# AI Provider (choose one or all)
# ============================================
AI_PROVIDER=gemini  # Options: openai, gemini, claude

# AI API Keys (set at least one)
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# ============================================
# Supabase Database
# ============================================
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# ============================================
# Payment Gateways
# ============================================
# Toss Payments (Korea)
TOSS_CLIENT_KEY=test_ck_xxx
TOSS_SECRET_KEY=test_sk_xxx

# PayPal (International)
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx

# Stripe (Optional)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### Step 3: Install Dependencies

```bash
cd backend
npm install
```

### Step 4: Deploy to AWS Lambda

```bash
# Deploy to production
npm run deploy

# OR using serverless directly
serverless deploy --stage prod

# Expected output:
# ✅ Service deployed successfully!
# endpoints:
#   ANY - https://xxxxx.execute-api.ap-northeast-2.amazonaws.com/{proxy+}
#   ANY - https://xxxxx.execute-api.ap-northeast-2.amazonaws.com/
```

### Step 5: Save API Gateway URL

Copy the API Gateway URL from deployment output:
```
https://xxxxx.execute-api.ap-northeast-2.amazonaws.com
```

You'll need this for frontend configuration!

### Step 6: Test Backend

```bash
# Health check
curl https://YOUR_API_URL.execute-api.ap-northeast-2.amazonaws.com/

# Expected response:
# {
#   "message": "ChatJu Premium API is running! ✨",
#   "environment": "production",
#   "endpoints": { ... }
# }
```

---

## 🌐 Frontend Deployment (Cloudflare Pages)

### Step 1: Configure Environment Variables

Create `.env.production` in `frontend/` directory:

```bash
# frontend/.env.production

# Backend API URL (from AWS Lambda deployment)
NEXT_PUBLIC_API_URL=https://xxxxx.execute-api.ap-northeast-2.amazonaws.com

# Supabase (for authentication)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Payment Gateway Public Keys
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_xxx
NEXT_PUBLIC_PAYPAL_CLIENT_ID=xxx
```

### Step 2: Build Frontend

```bash
cd frontend
npm install
npm run build

# Verify build succeeds
```

### Step 3: Deploy to Cloudflare Pages

#### Option A: Connect GitHub Repository (Recommended)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → Pages
2. Click "Create a project" → "Connect to Git"
3. Select your GitHub repository: `chatju-premium`
4. Configure build settings:
   ```
   Framework preset: Next.js
   Build command: npm run build
   Build output directory: .next
   Root directory: frontend
   Node version: 18
   ```

5. Add environment variables (same as `.env.production`)

6. Click "Save and Deploy"

7. Your site will be available at: `https://chatju.pages.dev`

#### Option B: Direct Upload (Alternative)

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
cd frontend
npm run build
wrangler pages deploy .next
```

### Step 4: Configure Custom Domain (Optional)

1. Go to Cloudflare Pages → Your project → Custom domains
2. Add your domain: `chatju.com`
3. Update DNS records as instructed
4. Wait for SSL certificate provisioning (automatic)

---

## ⚙️ Post-Deployment Configuration

### 1. Update CORS Settings

After deploying frontend, update backend CORS in `backend/index.js`:

```javascript
// If using custom domain, update this:
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://chatju.pages.dev', 'https://chatju.com']  // Add custom domain
    : ['http://localhost:8080', 'http://localhost:3001'];
```

Redeploy backend:
```bash
cd backend
npm run deploy
```

### 2. Configure Payment Webhooks

#### Toss Payments
1. Go to Toss Dashboard → Settings → Webhooks
2. Add webhook URL: `https://YOUR_API_URL/payment/toss/webhook`
3. Enable events: `Payment.Approved`, `Payment.Canceled`

#### PayPal
1. Go to PayPal Dashboard → Webhooks
2. Add webhook URL: `https://YOUR_API_URL/payment/paypal/webhook`
3. Enable events: `PAYMENT.CAPTURE.COMPLETED`

### 3. Set Environment Variables in AWS Lambda Console

For sensitive keys, you can set them directly in AWS:

1. Go to AWS Lambda Console
2. Find function: `chatju-premium-backend-prod-api`
3. Configuration → Environment variables
4. Add/edit variables as needed

---

## 👤 Admin Access

### Access Admin Dashboard

1. Navigate to: `https://chatju.pages.dev/admin/settings`
2. Login with admin credentials (any authenticated user for now)

### Switch AI Provider

From admin dashboard:
1. View current AI provider
2. See available providers (configured API keys)
3. Click "Switch" to change provider
4. Change takes effect immediately (no restart needed)

### Future Admin Features

- User management
- Payment history
- AI usage statistics
- System health monitoring

---

## 📊 Monitoring & Maintenance

### View Backend Logs

```bash
# Real-time logs
cd backend
npm run logs

# OR
serverless logs -f api --stage prod --tail

# View specific time range
serverless logs -f api --stage prod --startTime 1h
```

### CloudWatch Logs

1. Go to AWS Console → CloudWatch → Log groups
2. Find: `/aws/lambda/chatju-premium-backend-prod-api`
3. View logs in real-time

### Performance Monitoring

- **AWS Lambda**: CloudWatch metrics (Invocations, Duration, Errors)
- **Cloudflare Pages**: Analytics dashboard (Requests, Bandwidth)
- **Supabase**: Dashboard → Database → Performance

### Update Deployment

```bash
# Backend updates
cd backend
git pull
npm run deploy

# Frontend updates (with GitHub integration)
git push  # Automatically triggers Cloudflare Pages rebuild
```

---

## 🔧 Troubleshooting

### Backend Issues

#### 500 Internal Server Error
```bash
# Check logs
serverless logs -f api --stage prod --tail

# Common causes:
# 1. Missing environment variables
# 2. Supabase connection issue
# 3. AI API key invalid
```

#### CORS Error
```javascript
// Update allowedOrigins in backend/index.js
// Redeploy: npm run deploy
```

#### Payment Gateway Error
```bash
# Verify API keys in AWS Lambda environment variables
# Check webhook configuration
```

### Frontend Issues

#### API Connection Failed
- Verify `NEXT_PUBLIC_API_URL` in Cloudflare Pages environment variables
- Check backend deployment is successful
- Test API endpoint directly: `curl https://YOUR_API_URL/`

#### Build Failed
```bash
# Check Node.js version (must be 18+)
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

---

## 💰 Cost Estimation

### AWS Lambda (Backend)
- **Free Tier**: 1M requests/month, 400K GB-seconds compute
- **After Free Tier**: ~$0.20 per 1M requests
- **Estimated**: $0-10/month for most startups

### Cloudflare Pages (Frontend)
- **Free Tier**: Unlimited bandwidth, 500 builds/month
- **Custom domain**: Free SSL
- **Estimated**: $0/month

### Supabase Database
- **Free Tier**: 500MB storage, 2GB bandwidth
- **Pro Plan**: $25/month (unlimited API calls)
- **Estimated**: $0-25/month

### AI Provider (Gemini Recommended)
- **Google Gemini**: 60 requests/minute FREE
- **OpenAI**: ~$0.15 per 1M tokens
- **Estimated**: $0-20/month depending on usage

### Total Monthly Cost
- **Startup Phase**: $0-10/month (within free tiers)
- **Growth Phase**: $50-100/month (10K+ users)
- **Scale Phase**: $200-500/month (100K+ users)

---

## 🎯 Next Steps

1. ✅ Deploy backend to AWS Lambda
2. ✅ Deploy frontend to Cloudflare Pages
3. ✅ Configure payment webhooks
4. ✅ Test end-to-end payment flow
5. ✅ Access admin dashboard
6. 🔄 Monitor logs and performance
7. 🔄 Scale as needed

---

## 📚 Additional Resources

- [Serverless Framework Docs](https://www.serverless.com/framework/docs)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Guides](https://supabase.com/docs/guides)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)

---

## 🆘 Support

For issues or questions:
- GitHub Issues: `https://github.com/YOUR_ORG/chatju-premium/issues`
- Email: `support@chatju.com`

---

**Last Updated**: 2025-11-18
**Version**: 1.0.0
