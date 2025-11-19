# ChatJu Premium - Deployment Checklist

**Estimated Time**: 30-45 minutes
**Difficulty**: Beginner-friendly

---

## ✅ Pre-Deployment Checklist

### 1. Get Your API Keys

- [ ] **Gemini API Key** (Recommended - FREE!)
  - Go to: https://makersuite.google.com/app/apikey
  - Click "Get API Key"
  - Copy and save: `GEMINI_API_KEY=AIza...`

- [ ] **Supabase Credentials**
  - Go to: https://supabase.com/dashboard
  - Select your project
  - Settings → API
  - Copy:
    - Project URL: `https://xxxxx.supabase.co`
    - Anon key: `eyJhbGci...`
    - Service role key: `eyJhbGci...`

- [ ] **Payment Gateway Keys**
  - **Toss** (Korea): https://www.tosspayments.com/
    - Client Key: `test_ck_...`
    - Secret Key: `test_sk_...`
  - **PayPal** (International): https://developer.paypal.com/
    - Client ID: `...`
    - Client Secret: `...`

- [ ] **AWS Account**
  - Create account: https://aws.amazon.com/
  - Get Access Key ID and Secret Access Key
  - Go to: IAM → Users → Your user → Security credentials → Create access key

---

## 🚀 Part 1: Backend Deployment (AWS Lambda)

### Step 1: Install Tools (One-time setup)

```bash
# Check Node.js version (must be 18+)
node --version

# If not installed or old version:
# macOS: brew install node
# Windows: Download from nodejs.org
# Linux: sudo apt-get install nodejs npm

# Install Serverless Framework globally
npm install -g serverless

# Verify installation
serverless --version
```

**✅ Checkpoint**: You should see `Framework Core: 3.x.x`

---

### Step 2: Clone Repository

```bash
# Clone the repo
git clone https://github.com/ers123/chatju-premium.git

# Navigate to backend
cd chatju-premium/backend

# Install dependencies
npm install
```

**✅ Checkpoint**: Should show "added XXX packages" with no errors

---

### Step 3: Configure AWS Credentials

```bash
# Option A: Using Serverless CLI (Easiest)
serverless config credentials \
  --provider aws \
  --key YOUR_AWS_ACCESS_KEY_ID \
  --secret YOUR_AWS_SECRET_ACCESS_KEY

# Option B: Using AWS CLI
aws configure
# Enter: Access Key, Secret Key, ap-northeast-2 (Seoul), json
```

**✅ Checkpoint**: Run `aws sts get-caller-identity` - should show your AWS account info

---

### Step 4: Create Environment File

```bash
# Copy example file
cp .env.example .env

# Edit the file
nano .env
# (or use your favorite editor: vim, code, etc.)
```

**Paste this into `.env`** (replace with your actual keys):

```bash
# ============================================
# Production Configuration
# ============================================
NODE_ENV=production

# ============================================
# AI Provider (Gemini is FREE!)
# ============================================
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSy...YOUR_ACTUAL_KEY_HERE

# Optional: Add OpenAI or Claude later
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...

# ============================================
# Supabase Database
# ============================================
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...YOUR_SERVICE_KEY

# ============================================
# Payment Gateways
# ============================================
# Toss Payments (Korea)
TOSS_CLIENT_KEY=test_ck_...
TOSS_SECRET_KEY=test_sk_...

# PayPal (International)
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# Stripe (Optional)
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Save the file**: `Ctrl+X`, then `Y`, then `Enter` (in nano)

**✅ Checkpoint**: Run `cat .env` - should show your configuration (with real keys)

---

### Step 5: Deploy to AWS!

```bash
# Make sure you're in backend directory
pwd
# Should show: /path/to/chatju-premium/backend

# Deploy to production
npm run deploy

# This will take 2-3 minutes...
# ☕ Grab coffee!
```

**Expected Output:**
```
✔ Service deployed to stack chatju-premium-backend-prod

endpoints:
  ANY - https://xxxxx.execute-api.ap-northeast-2.amazonaws.com/{proxy+}
  ANY - https://xxxxx.execute-api.ap-northeast-2.amazonaws.com
functions:
  api: chatju-premium-backend-prod-api
```

**🎯 IMPORTANT**: Copy the endpoint URL! You'll need it for frontend deployment.

**Example**: `https://abc123xyz.execute-api.ap-northeast-2.amazonaws.com`

**✅ Checkpoint**: Test your backend
```bash
curl https://YOUR_API_URL.execute-api.ap-northeast-2.amazonaws.com/

# Should return:
# {"message":"ChatJu Premium API is running! ✨", ...}
```

**🎉 Backend Deployed!** Save your API URL - you'll need it next.

---

## 🌐 Part 2: Frontend Deployment (Cloudflare Pages)

### Step 1: Login to Cloudflare

- [ ] Go to: https://dash.cloudflare.com/
- [ ] Sign up or log in
- [ ] Click **"Pages"** in left sidebar

---

### Step 2: Connect to GitHub

- [ ] Click **"Create a project"**
- [ ] Click **"Connect to Git"**
- [ ] Authorize Cloudflare to access GitHub
- [ ] Select repository: **`ers123/chatju-premium`**
- [ ] Click **"Begin setup"**

---

### Step 3: Configure Build Settings

Fill in these settings:

```
Project name: chatju-premium
Production branch: claude/security-code-review-012ZevESQFoQo31Jxo1xqDzU

Build settings:
  Framework preset: Next.js
  Build command: npm run build
  Build output directory: .next
  Root directory: frontend

Environment variables (Node.js version):
  NODE_VERSION = 18
```

---

### Step 4: Add Environment Variables

Click **"Add environment variable"** for each of these:

| Name | Value | Notes |
|------|-------|-------|
| `NEXT_PUBLIC_API_URL` | `https://xxxxx.execute-api.ap-northeast-2.amazonaws.com` | **Use YOUR backend URL from Step 5 above!** |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | Your Supabase anon key |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | `test_ck_...` | Toss client key (public) |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | `...` | PayPal client ID (public) |

**Important**:
- All frontend env vars must start with `NEXT_PUBLIC_`
- Use the **backend API URL** from Part 1, Step 5
- These are PUBLIC keys only (never secret keys!)

---

### Step 5: Deploy!

- [ ] Click **"Save and Deploy"**
- [ ] Wait 3-5 minutes while Cloudflare builds
- [ ] Watch the build log (it's fascinating!)

**Expected Output:**
```
✅ Build successful!
🚀 Deployment complete!

Your site is live at: https://chatju.pages.dev
```

**✅ Checkpoint**: Visit `https://chatju.pages.dev` - should see your homepage!

---

## 🎯 Part 3: Post-Deployment Verification

### Test Frontend

- [ ] Visit: `https://chatju.pages.dev`
- [ ] Homepage loads ✅
- [ ] Click "Start Your Reading" → Form appears ✅
- [ ] Scroll to footer → Click "Admin" link

### Test Backend API

```bash
# Health check
curl https://YOUR_API_URL.execute-api.ap-northeast-2.amazonaws.com/

# Should return JSON with: "ChatJu Premium API is running! ✨"
```

### Test Admin Dashboard

- [ ] Visit: `https://chatju.pages.dev/admin/settings`
- [ ] If not logged in → redirects to login (expected!)
- [ ] Sign up for account
- [ ] Login
- [ ] Visit admin settings again
- [ ] Should see: **Current AI Provider: Google Gemini** ✅

### Test AI Provider

**Option A: Via Admin Dashboard**
- [ ] Login to admin dashboard
- [ ] Current provider shows: Google Gemini
- [ ] Try switching to OpenAI (if you added key)
- [ ] Success message appears ✅

**Option B: Via API**
```bash
# Get your JWT token (login first via frontend)
TOKEN="your_jwt_token_here"

# Get provider info
curl -H "Authorization: Bearer $TOKEN" \
  https://YOUR_API_URL/admin/ai-provider

# Should return provider details
```

### Test Fortune Telling

- [ ] Go to: `https://chatju.pages.dev/chat`
- [ ] Enter a question
- [ ] Receive AI response ✅
- [ ] Response should be from Gemini (free!)

---

## 🔧 Part 4: Configure Payment Webhooks (Optional)

### Toss Payments Webhook

1. Go to Toss Dashboard → Settings → Webhooks
2. Add webhook URL:
   ```
   https://YOUR_API_URL.execute-api.ap-northeast-2.amazonaws.com/payment/toss/webhook
   ```
3. Enable events: `Payment.Approved`, `Payment.Canceled`
4. Save

### PayPal Webhook

1. Go to PayPal Dashboard → Webhooks
2. Add webhook URL:
   ```
   https://YOUR_API_URL.execute-api.ap-northeast-2.amazonaws.com/payment/paypal/webhook
   ```
3. Enable event: `PAYMENT.CAPTURE.COMPLETED`
4. Save

---

## 📊 Part 5: Monitoring

### View Backend Logs

```bash
# From backend directory
npm run logs

# Or using Serverless directly
serverless logs -f api --stage prod --tail
```

### View Frontend Logs

1. Go to Cloudflare Dashboard
2. Pages → chatju-premium
3. Click latest deployment
4. View build logs and function logs

### CloudWatch (AWS)

1. Go to AWS Console → CloudWatch
2. Log groups → `/aws/lambda/chatju-premium-backend-prod-api`
3. View real-time logs

---

## 🎉 Success! You're Live!

Your production URLs:
- **Frontend**: https://chatju.pages.dev
- **Backend**: https://YOUR_API_URL.execute-api.ap-northeast-2.amazonaws.com
- **Admin**: https://chatju.pages.dev/admin/settings

---

## 🔄 Making Updates

### Update Frontend (Easy!)

```bash
# Just push to GitHub - Cloudflare auto-deploys!
git add .
git commit -m "Update frontend"
git push

# Cloudflare rebuilds automatically ✅
```

### Update Backend

```bash
cd chatju-premium/backend
git pull
npm run deploy
```

---

## 🆘 Troubleshooting

### Backend Deploy Failed

**Error**: `AWS credentials not found`
```bash
# Solution: Reconfigure AWS credentials
serverless config credentials --provider aws --key YOUR_KEY --secret YOUR_SECRET
```

**Error**: `serverless: command not found`
```bash
# Solution: Install serverless globally
npm install -g serverless
```

**Error**: `Cannot find module 'dotenv'`
```bash
# Solution: Install dependencies
npm install
```

### Frontend Build Failed

**Error**: `Environment variable NEXT_PUBLIC_API_URL is not defined`
- Solution: Add it in Cloudflare Pages → Settings → Environment variables

**Error**: `Build exceeded timeout`
- Solution: Check build logs for errors
- Try rebuilding (sometimes network issues)

### Admin Dashboard Not Loading

**Error**: Redirects to login
- Expected! You must login first
- Create account → Login → Try again

**Error**: "Failed to load provider info"
- Check backend is deployed
- Check NEXT_PUBLIC_API_URL is correct
- Check browser console for errors

---

## 📞 Need Help?

1. **Check logs first**:
   ```bash
   npm run logs  # Backend
   ```

2. **Review documentation**:
   - `DEPLOYMENT.md` - Full deployment guide
   - `ADMIN_DASHBOARD.md` - Admin features
   - `RELEASE_NOTES.md` - What's new

3. **Common issues**: See DEPLOYMENT.md troubleshooting section

4. **Still stuck?**: Create GitHub issue with:
   - What you tried
   - Error messages
   - Log excerpts

---

## 💰 Cost Tracker

After deployment, your monthly costs should be:

- **AWS Lambda**: $0 (free tier: 1M requests)
- **Cloudflare Pages**: $0 (free tier: unlimited)
- **Supabase**: $0 (free tier: 500MB)
- **Gemini AI**: $0 (free tier: 60 req/min)

**Total**: $0/month for first 6-12 months! 🎉

---

## ✅ Final Checklist

- [ ] Backend deployed to AWS Lambda
- [ ] Frontend deployed to Cloudflare Pages
- [ ] Admin dashboard accessible
- [ ] Can switch AI providers
- [ ] Fortune telling works
- [ ] Monitoring/logs configured
- [ ] Payment webhooks configured (optional)

**Congratulations! You're in production!** 🚀

---

**Created**: November 18, 2025
**Version**: 1.0.0
**Estimated Time**: 30-45 minutes
**Difficulty**: ⭐⭐☆☆☆ (Easy)
