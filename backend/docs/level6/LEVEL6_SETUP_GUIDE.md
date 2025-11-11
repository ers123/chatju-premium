# Level 6 Setup Guide - Supabase Authentication

**Document Version**: 1.0
**Date**: November 10, 2025
**Purpose**: Guide for implementing real Supabase Authentication with Magic Link

---

## Overview

Level 6 replaces mock authentication with real Supabase Auth, enabling:
- Email-based authentication with Magic Link
- Secure JWT token management
- User session handling
- Profile management

---

## Prerequisites

- ✅ Level 5 completed (Supabase database integrated)
- ✅ Supabase project active
- ✅ Email provider configured (or using Supabase's default)

---

## Step 1: Enable Supabase Auth

### 1.1 Configure Email Auth

1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable **Email** provider
4. Configure settings:
   - ✅ Enable Email provider
   - ✅ Confirm email: **Enabled** (recommended)
   - ✅ Secure email change: **Enabled**
   - ✅ Enable sign ups: **Enabled**

### 1.2 Configure Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize these templates:
   - **Magic Link**: For sign in/sign up
   - **Confirm Signup**: Email confirmation
   - **Change Email Address**: Email change verification

**Default template works fine for testing!**

### 1.3 Configure Site URL

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `https://chatju.pages.dev` (your frontend URL)
3. Add **Redirect URLs**:
   - `https://chatju.pages.dev/auth/callback`
   - `http://localhost:8080/auth/callback` (for local dev)

---

## Step 2: Verify Code Deployment

All authentication code has been created. Verify these files exist:

```bash
backend/
├── src/
│   ├── services/
│   │   └── auth.service.js       ✅ Created
│   ├── routes/
│   │   └── auth.routes.js        ✅ Created
│   └── middleware/
│       └── auth.js                ✅ Already configured
└── index.js                       ✅ Updated with auth routes
```

---

## Step 3: Available Auth Endpoints

### POST /auth/signup
Register new user and send magic link

**Request**:
```json
{
  "email": "user@example.com",
  "language_preference": "ko"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Magic link sent to your email",
  "email": "user@example.com"
}
```

### POST /auth/signin
Sign in existing user with magic link

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Magic link sent to your email",
  "email": "user@example.com"
}
```

### POST /auth/verify
Verify OTP token from magic link

**Request**:
```json
{
  "email": "user@example.com",
  "token": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "emailConfirmed": true
  },
  "session": {
    "access_token": "eyJhbG...",
    "refresh_token": "eyJhbG...",
    "expires_at": 1699999999
  }
}
```

### POST /auth/signout
Sign out current user (requires auth)

**Headers**:
```
Authorization: Bearer {access_token}
```

**Response**:
```json
{
  "success": true,
  "message": "Signed out successfully"
}
```

### GET /auth/me
Get current user profile (requires auth)

**Headers**:
```
Authorization: Bearer {access_token}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "language_preference": "ko",
    "timezone": "Asia/Seoul",
    "created_at": "2025-11-10T...",
    "updated_at": "2025-11-10T..."
  }
}
```

### PATCH /auth/me
Update user profile (requires auth)

**Headers**:
```
Authorization: Bearer {access_token}
```

**Request**:
```json
{
  "language_preference": "en",
  "timezone": "America/New_York"
}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "language_preference": "en",
    "timezone": "America/New_York"
  }
}
```

### POST /auth/refresh
Refresh access token

**Request**:
```json
{
  "refresh_token": "eyJhbG..."
}
```

**Response**:
```json
{
  "success": true,
  "session": {
    "access_token": "eyJhbG...",
    "refresh_token": "eyJhbG...",
    "expires_at": 1699999999
  }
}
```

---

## Step 4: Testing Authentication Flow

### Manual Test (Using curl)

**1. Sign up**:
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","language_preference":"ko"}'
```

**2. Check email** for magic link (6-digit code)

**3. Verify OTP**:
```bash
curl -X POST http://localhost:3000/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","token":"123456"}'
```

**4. Use access token** in subsequent requests:
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Step 5: Integration with Existing Saju Routes

The existing `/saju/calculate` endpoint already uses the auth middleware.

**Test Premium Saju with Auth**:
```bash
curl -X POST http://localhost:3000/saju/calculate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "pay_test_123",
    "birthDate": "1990-05-15",
    "birthTime": "14:30",
    "gender": "male"
  }'
```

---

## Step 6: Email Provider Configuration (Optional)

For production, configure a custom email provider:

### Option A: SendGrid
1. Go to **Settings** → **API** → **SMTP**
2. Add SendGrid credentials
3. Configure in Supabase Dashboard

### Option B: AWS SES
1. Set up AWS SES
2. Verify domain
3. Add credentials to Supabase

### Option C: Use Supabase's Default (Testing)
- Supabase provides free email sending
- Limited to 4 emails/hour on free tier
- Good enough for testing!

---

## Security Considerations

### Access Token
- Short-lived (1 hour by default)
- Use for API requests
- Store securely in frontend (httpOnly cookie recommended)

### Refresh Token
- Long-lived (can be configured)
- Use to get new access tokens
- Never expose to client-side JavaScript

### Best Practices
- ✅ Always use HTTPS in production
- ✅ Validate tokens on every protected route
- ✅ Implement rate limiting on auth endpoints
- ✅ Log authentication attempts
- ✅ Monitor for suspicious activity

---

## Troubleshooting

### Issue: "Magic link not received"
**Solution**:
- Check spam folder
- Verify email provider configuration
- Check Supabase logs for email sending errors
- Ensure email is not blocked

### Issue: "Invalid OTP token"
**Solution**:
- OTP expires after 60 seconds (default)
- Request a new magic link
- Check for typos in token

### Issue: "JWT expired"
**Solution**:
- Use refresh token to get new access token
- Implement automatic token refresh in frontend

### Issue: "User not found"
**Solution**:
- User might not have confirmed email
- Check users table in Supabase
- Verify user creation succeeded

---

## Next Steps After Level 6

Once authentication is working:

1. **Frontend Integration**:
   - Add login/signup UI
   - Store JWT tokens
   - Handle token refresh
   - Protected routes

2. **Level 7: Real Payments**:
   - Integrate Toss Payments (Korea)
   - Integrate Stripe (International)
   - Webhook handling

3. **Production Deployment**:
   - AWS Lambda deployment
   - Environment variables
   - Domain configuration

---

## Useful Commands

```bash
# Start dev server
npm run dev

# Test signup
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com"}'

# View Supabase Auth users
# Go to: Dashboard → Authentication → Users

# Check logs
tail -f logs/backend.log
```

---

**Status**: Ready for Testing
**Last Updated**: November 10, 2025
