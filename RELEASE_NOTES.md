# ChatJu Premium - Release Notes

## 🚀 Version 1.1.0 - Multi-AI Provider & Deployment Ready

**Release Date**: November 18, 2025

This release introduces major improvements for production deployment, including multi-AI provider support, comprehensive AWS Lambda deployment configuration, and an admin dashboard for managing AI providers.

---

## ✨ New Features

### 1. Multi-AI Provider Support

**What**: Support for multiple AI providers (OpenAI, Google Gemini, Anthropic Claude) with runtime switching capability.

**Benefits**:
- **Cost Optimization**: Switch to cheaper providers (Gemini has free tier)
- **Redundancy**: Automatic fallback if primary provider fails
- **Flexibility**: Choose best provider for your needs

**Files Changed**:
- `backend/src/services/ai.service.js` (NEW) - Unified AI service
- `backend/index.js` - Updated to use AI service
- `backend/src/services/saju.service.js` - Updated AI integration

**Usage**:
```javascript
// Set provider via environment variable
AI_PROVIDER=gemini  // Options: openai, gemini, claude

// Runtime switching via admin dashboard
// Or programmatically:
const aiService = getAIService();
aiService.setProvider('gemini');
```

**Provider Comparison**:
| Provider | Model | Cost per 1M tokens | Free Tier |
|----------|-------|-------------------|-----------|
| Gemini | gemini-1.5-flash | $0.00 | 60 req/min |
| OpenAI | gpt-4o-mini | $0.15 | No |
| Claude | claude-3-haiku | $0.25 | No |

---

### 2. AWS Lambda Deployment Configuration

**What**: Complete serverless deployment setup using Serverless Framework.

**Benefits**:
- **Auto-scaling**: Handles traffic spikes automatically
- **Cost-effective**: Pay only for actual usage
- **Zero maintenance**: No server management needed

**Files Changed**:
- `backend/serverless.yml` (NEW) - Complete AWS Lambda configuration
- `backend/package.json` - Added deployment scripts

**Deployment Scripts**:
```bash
# Deploy to production
npm run deploy

# Deploy to development
npm run deploy:dev

# View real-time logs
npm run logs

# Test locally with serverless-offline
npm run offline

# Remove deployment
npm run deploy:remove
```

**Configuration Highlights**:
- Node.js 18 runtime
- 512MB memory, 30s timeout
- Seoul region (ap-northeast-2)
- HTTP API Gateway with CORS
- CloudWatch logging (30-day retention)
- Environment-aware configuration

---

### 3. Admin Dashboard

**What**: Web-based admin interface for managing AI providers and viewing system status.

**Benefits**:
- **No code changes needed**: Switch AI providers via UI
- **Real-time updates**: Changes take effect immediately
- **Cost visibility**: See cost comparison across providers

**Files Changed**:
- `frontend/app/admin/settings/page.tsx` (NEW) - Admin UI
- `backend/src/routes/admin.routes.js` (NEW) - Admin API
- `frontend/lib/api.ts` - Added admin client functions
- `backend/index.js` - Registered admin routes

**Features**:
- View current AI provider and model
- Switch between available providers
- See provider costs and details
- View unconfigured providers
- Future: Statistics dashboard (users, payments, AI usage)

**Access**:
```
URL: https://chatju.pages.dev/admin/settings
Auth: Requires JWT token (any authenticated user)
TODO: Add admin role check for production
```

---

### 4. Enhanced Security Logging

**What**: Improved startup logging with AI provider status and warnings.

**Changes**:
- `backend/index.js` - Enhanced startup logs
- Shows active AI provider and available alternatives
- Warns if NODE_ENV is not set to production
- Logs CORS configuration for verification

**Example Output**:
```
🚀 ChatJu Backend Server Started
📍 Port: 3000
🌍 Environment: production
🔒 CORS: Allowing origins: https://chatju.pages.dev
🤖 AI Provider: Google Gemini (gemini)
   Model: gemini-1.5-flash
   Available: Google Gemini, OpenAI
```

---

## 📝 Documentation

### New Documentation Files

1. **DEPLOYMENT.md** - Complete production deployment guide
   - AWS Lambda setup
   - Cloudflare Pages deployment
   - Environment configuration
   - Payment gateway setup
   - Monitoring and troubleshooting
   - Cost estimation

2. **RELEASE_NOTES.md** (this file) - Feature documentation

---

## 🔧 Technical Changes

### Dependencies Added

**Backend**:
```json
{
  "@google/generative-ai": "^0.24.1",
  "@anthropic-ai/sdk": "^0.70.0",
  "serverless-offline": "^13.3.0" (dev)
}
```

**Frontend**:
No new dependencies (uses existing axios and Next.js)

### Environment Variables

**New Required Variables**:
```bash
# Choose at least one AI provider
AI_PROVIDER=gemini  # Default provider
GEMINI_API_KEY=xxx  # Google Gemini
OPENAI_API_KEY=xxx  # OpenAI (already existed)
ANTHROPIC_API_KEY=xxx  # Anthropic Claude
```

**All Variables** (see DEPLOYMENT.md for details):
- NODE_ENV
- AI_PROVIDER, GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY
- SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- TOSS_CLIENT_KEY, TOSS_SECRET_KEY
- PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET
- STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY (optional)

### API Endpoints

**New Admin Endpoints**:
```
GET  /admin/ai-provider      - Get current provider info
POST /admin/ai-provider      - Switch AI provider
GET  /admin/stats            - Get usage statistics (coming soon)
```

**Updated Response Format**:
All AI-powered endpoints now include provider metadata:
```json
{
  "assistant": "오늘은 좋은 날입니다...",
  "metadata": {
    "provider": "gemini",
    "model": "gemini-1.5-flash"
  }
}
```

---

## 🔄 Migration Guide

### For Existing Deployments

1. **Install new dependencies**:
```bash
cd backend
npm install
```

2. **Add AI provider environment variables**:
```bash
# Recommended: Add Gemini for free tier
GEMINI_API_KEY=your_key_here
AI_PROVIDER=gemini
```

3. **Deploy updates**:
```bash
# Backend
cd backend
npm run deploy

# Frontend (if using Cloudflare Pages GitHub integration)
git push  # Auto-deploys
```

4. **Verify deployment**:
```bash
# Check AI provider
curl https://YOUR_API_URL/ | jq .

# Access admin dashboard
https://chatju.pages.dev/admin/settings
```

### Backward Compatibility

✅ **Fully backward compatible** with existing OpenAI-only setups:
- If only `OPENAI_API_KEY` is set, system uses OpenAI
- If `AI_PROVIDER` is not set, defaults to Gemini (if key exists)
- All existing API endpoints work unchanged
- Response format extended (old clients ignore metadata)

---

## 🐛 Bug Fixes

No bug fixes in this release (features only).

---

## 📊 Performance Improvements

1. **Startup Time**: Added lazy initialization for AI clients
2. **Memory Usage**: Singleton pattern prevents duplicate clients
3. **Logging**: Structured logging with Winston (no PII)

---

## 🚨 Breaking Changes

**None** - This release is fully backward compatible.

---

## 🔮 Future Enhancements (Roadmap)

### Next Release (v1.2.0)
- [ ] Admin role-based access control
- [ ] Usage statistics dashboard
- [ ] AI cost tracking per request
- [ ] Rate limiting per user
- [ ] Admin user management UI

### Later (v2.0.0)
- [ ] Multi-region deployment
- [ ] A/B testing for AI providers
- [ ] Custom model configuration
- [ ] Prompt template management
- [ ] Real-time WebSocket support

---

## 🙏 Credits

**Development Team**: CodexNine
**Testing**: (Add testers here)
**Documentation**: AI-assisted with Claude

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/YOUR_ORG/chatju-premium/issues)
- **Email**: support@chatju.com
- **Deployment Guide**: See `DEPLOYMENT.md`

---

## 📜 License

MIT License - See LICENSE file for details

---

**Upgrade today to take advantage of multi-AI provider support and simplified deployment!** 🚀
