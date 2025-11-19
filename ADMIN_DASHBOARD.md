# Admin Dashboard Guide

## 🎛️ Overview

The ChatJu Premium Admin Dashboard provides real-time management of AI providers and system configuration. Built with Next.js and integrated with the backend API.

---

## 📍 Access

### Direct URL
```
https://chatju.pages.dev/admin/settings
```

### From Homepage
Scroll to footer → Click small "Admin" link (gray text at bottom)

### Authentication Required
- Must be logged in with JWT token
- Token stored in localStorage as `chatju_token`
- Redirects to login if not authenticated

---

## 🎨 Features

### 1. AI Provider Management

#### Current Provider Display
- **Large blue card** showing active provider
- Displays:
  - Provider name (Google Gemini / OpenAI / Anthropic Claude)
  - Current model being used
  - Cost per 1M tokens
  - Robot emoji indicator 🤖

#### Switch Providers
Available providers shown with:
- ✅ **Active badge** (indigo) for current provider
- **Switch button** (indigo) for available alternatives
- ❌ **Not Configured badge** (red) for providers without API keys

**How to Switch:**
1. Click "Switch" button on desired provider
2. Instant confirmation message appears
3. All new AI requests use new provider immediately
4. No server restart required

#### Provider Options

**Google Gemini (Recommended)**
- Model: `gemini-1.5-flash`
- Cost: **$0.00** (Free tier: 60 requests/minute)
- Status: Available if `GEMINI_API_KEY` is set

**OpenAI**
- Model: `gpt-4o-mini`
- Cost: **$0.15** per 1M tokens
- Status: Available if `OPENAI_API_KEY` is set

**Anthropic Claude**
- Model: `claude-3-haiku-20240307`
- Cost: **$0.25** per 1M tokens
- Status: Available if `ANTHROPIC_API_KEY` is set

---

### 2. Statistics Dashboard (Coming Soon)

Placeholder section for future features:
- Total users and active users
- Payment statistics and revenue tracking
- AI usage analytics (calls, tokens, costs)
- System health monitoring

---

## 🔧 Technical Details

### Frontend
- **Location**: `frontend/app/admin/settings/page.tsx`
- **Framework**: Next.js 14 App Router
- **Styling**: Tailwind CSS
- **State Management**: React useState/useEffect

### Backend API

#### Get Provider Info
```bash
GET /admin/ai-provider
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "current": "gemini",
    "available": ["gemini", "openai"],
    "details": {
      "gemini": {
        "name": "Google Gemini",
        "model": "gemini-1.5-flash",
        "costPer1MTokens": "$0.00 (Free tier)"
      },
      "openai": { ... },
      "claude": { ... }
    }
  }
}
```

#### Switch Provider
```bash
POST /admin/ai-provider
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "provider": "gemini"  // or "openai" or "claude"
}

Response:
{
  "success": true,
  "message": "AI provider switched to Google Gemini",
  "data": { ... }
}
```

### API Client
Located in `frontend/lib/api.ts`:
```typescript
// Get provider info
const info = await apiClient.getAIProviderInfo();

// Switch provider
const result = await apiClient.switchAIProvider('gemini');
```

---

## 🎯 Usage Examples

### Example 1: Switch to Gemini (Free Tier)

**Goal**: Save costs by using Gemini's free tier

**Steps**:
1. Visit `https://chatju.pages.dev/admin/settings`
2. Log in if prompted
3. Find "Google Gemini" card in available providers
4. Click "Switch" button
5. Confirmation: "AI provider switched to Google Gemini"
6. All fortune-telling requests now use Gemini (free!)

**Before**: $30/month with OpenAI
**After**: $0/month with Gemini free tier ✅

---

### Example 2: Handle Provider Downtime

**Scenario**: Gemini API is experiencing issues

**Steps**:
1. Visit admin dashboard
2. Notice error messages from Gemini
3. Click "Switch" on OpenAI card
4. Service restored immediately
5. Switch back to Gemini when restored

**Fallback happens automatically** if primary provider fails, but you can manually override via dashboard.

---

### Example 3: A/B Test Providers

**Goal**: Compare quality between providers

**Steps**:
1. Start with Gemini
2. Process 100 fortune readings
3. Switch to OpenAI via dashboard
4. Process 100 more readings
5. Compare user satisfaction
6. Keep best performing provider

---

## 🔐 Security Considerations

### Current Implementation
- ✅ JWT authentication required
- ✅ CORS protection
- ✅ Rate limiting on API endpoints
- ⚠️ **TODO**: Add admin role check

### Production Recommendations

**Add Admin Role Check:**
```javascript
// backend/src/routes/admin.routes.js
router.get('/ai-provider', authMiddleware, async (req, res) => {
  // TODO: Add this check
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
      code: 'FORBIDDEN'
    });
  }

  // ... rest of code
});
```

**Add Admin Field to Users Table:**
```sql
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
UPDATE users SET is_admin = TRUE WHERE email = 'admin@chatju.com';
```

---

## 🎨 UI Components

### Color Scheme
- **Primary**: Indigo (`bg-indigo-600`, `text-indigo-600`)
- **Success**: Green (`bg-green-50`, `text-green-800`)
- **Error**: Red (`bg-red-50`, `text-red-800`)
- **Warning**: Yellow/Gray (`bg-gray-50`, `text-gray-600`)

### Key Components

**Provider Card (Active)**:
```tsx
<div className="border-indigo-500 bg-indigo-50">
  <span className="bg-indigo-600 text-white">Active</span>
</div>
```

**Provider Card (Available)**:
```tsx
<div className="border-gray-200 hover:border-indigo-300">
  <button className="bg-indigo-600 text-white">Switch</button>
</div>
```

**Provider Card (Not Configured)**:
```tsx
<div className="border-gray-200 bg-gray-50 opacity-60">
  <span className="bg-red-100 text-red-800">Not Configured</span>
</div>
```

---

## 🚀 Future Enhancements

### Planned Features (v1.2.0)

1. **User Management**
   - View all users
   - Edit user roles
   - Suspend/activate accounts
   - View user activity

2. **Payment Dashboard**
   - Total revenue
   - Revenue by period (day/week/month)
   - Payment method breakdown
   - Failed payment tracking

3. **AI Analytics**
   - Requests per provider
   - Token usage tracking
   - Cost analysis
   - Response time metrics
   - Error rate monitoring

4. **System Health**
   - Server status
   - Database connections
   - API response times
   - Error logs viewer

5. **Configuration Manager**
   - Edit system settings
   - Manage feature flags
   - Configure rate limits
   - Update pricing

### Potential Features (v2.0.0)

- Real-time WebSocket dashboard
- Multi-user admin with granular permissions
- Audit log for all admin actions
- Email notification for critical events
- Export reports (CSV, PDF)
- A/B testing framework
- Custom AI prompt templates
- Webhook management UI

---

## 🐛 Troubleshooting

### Issue: "Failed to load AI provider information"

**Causes**:
- Not authenticated (JWT token missing/expired)
- Backend server down
- Network connectivity issue

**Solutions**:
1. Check browser console for errors
2. Verify localStorage has `chatju_token`
3. Try logging out and logging back in
4. Check backend logs: `npm run logs`

### Issue: "Provider not configured" error when switching

**Cause**: API key not set in environment variables

**Solution**:
1. Add API key to backend `.env`:
   ```bash
   GEMINI_API_KEY=your_key_here
   ```
2. Redeploy backend:
   ```bash
   npm run deploy
   ```
3. Refresh admin dashboard

### Issue: Switch button not responding

**Causes**:
- Already on selected provider
- Network request failed

**Solutions**:
1. Check if provider already has "Active" badge
2. Check browser network tab for failed requests
3. Check backend logs for errors
4. Refresh page and try again

---

## 📱 Mobile Responsive

Dashboard is fully responsive:
- **Desktop**: Full 2-column layout
- **Tablet**: Single column, large cards
- **Mobile**: Stacked cards, mobile-optimized buttons

Tested on:
- Chrome (Desktop & Mobile)
- Safari (iOS)
- Firefox
- Edge

---

## ⌨️ Keyboard Shortcuts (Future)

Planned keyboard shortcuts:
- `Ctrl+K`: Open command palette
- `G → D`: Go to Dashboard
- `G → S`: Go to Settings
- `P → G`: Switch to Gemini
- `P → O`: Switch to OpenAI
- `P → C`: Switch to Claude

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Load dashboard while authenticated
- [ ] Load dashboard while not authenticated (should redirect)
- [ ] View current provider info
- [ ] Switch to different provider
- [ ] Verify success message appears
- [ ] Verify provider changed in backend logs
- [ ] Test with provider that's not configured
- [ ] Test mobile responsive layout
- [ ] Test back button navigation

### API Testing

```bash
# Get provider info
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://YOUR_API/admin/ai-provider

# Switch provider
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider":"gemini"}' \
  https://YOUR_API/admin/ai-provider
```

---

## 📞 Support

For issues with the admin dashboard:
1. Check browser console for errors
2. Check backend logs: `npm run logs`
3. Review DEPLOYMENT.md for configuration
4. Create GitHub issue with:
   - Steps to reproduce
   - Browser/OS version
   - Console error messages
   - Backend log excerpt

---

**Last Updated**: November 18, 2025
**Version**: 1.1.0
**Status**: Production Ready ✅
