# Level 5 Testing Guide

**Document Version**: 1.0
**Date**: November 7, 2025
**Purpose**: Complete testing procedures for Level 5 (Supabase Integration)

---

## Overview

Level 5 introduces **real database persistence** using Supabase PostgreSQL. This replaces all mock in-memory storage from Level 4.

**Key Changes:**
- Mock payment storage → Real `payments` table
- Mock reading storage → Real `readings` table
- Mock authentication → Real Supabase JWT (partial - full in Level 6)
- Data persists across server restarts
- UUIDs instead of timestamp-based IDs

---

## Pre-Test Checklist

Before running Level 5 tests, ensure:

- [ ] Supabase project created (https://database.new)
- [ ] Database schema deployed (run `database/schema.sql`)
- [ ] `.env` file updated with real Supabase credentials
- [ ] All new service files copied to correct locations
- [ ] Backend dependencies installed (`npm install`)
- [ ] Level 1-4 tests passed previously

---

## File Deployment Checklist

### New Files (Copy these to project)

```bash
# Configuration
✓ backend/src/config/supabase.js

# Updated Services (v5 versions)
✓ backend/src/services/saju.service.v5.js
✓ backend/src/services/payment.service.v5.js

# Updated Middleware (v5 version)
✓ backend/src/middleware/auth.v5.js

# Database
✓ backend/database/schema.sql

# Tests
✓ backend/tests/test-supabase-connection.js
✓ backend/tests/test-level5-flow.js

# Documentation
✓ backend/LEVEL5_SETUP_GUIDE.md
✓ backend/LEVEL5_TESTING.md (this file)
```

### Deployment Steps

**Option A: Manual Deployment (Safer for first time)**
1. Review each `.v5` file carefully
2. Copy manually one at a time
3. Keep backups of old files (`.v4` extension)

**Option B: Automated Deployment**
```bash
# Backup current files
cp src/services/saju.service.js src/services/saju.service.v4.js
cp src/middleware/auth.js src/middleware/auth.v4.js

# Deploy v5 files
cp src/services/saju.service.v5.js src/services/saju.service.js
cp src/services/payment.service.v5.js src/services/payment.service.js
cp src/middleware/auth.v5.js src/middleware/auth.js

# Remove old mock files
rm src/services/payment.mock.js
rm src/routes/payment.mock.routes.js
```

---

## Environment Configuration

### Step 1: Update .env File

Replace placeholder values with real Supabase credentials:

```bash
NODE_ENV=development
OPENAI=sk-proj-[your-key]

# Supabase Configuration (REPLACE THESE!)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find these:**
1. Go to your Supabase project dashboard
2. Click **Project Settings** → **API**
3. Copy:
   - Project URL → `SUPABASE_URL`
   - anon public key → `SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_KEY`

---

## Database Setup

### Step 1: Open SQL Editor

1. Go to Supabase dashboard
2. Click **SQL Editor** in left sidebar
3. Click **New Query**

### Step 2: Run Schema

1. Copy entire contents of `database/schema.sql`
2. Paste into SQL editor
3. Click **Run** button
4. Wait for success message

### Step 3: Verify Tables

Go to **Table Editor** and verify these tables exist:
- ✓ `users` (with test user: test@chatju.com)
- ✓ `payments` (empty initially)
- ✓ `readings` (empty initially)

---

## Test Execution

### Test 1: Connection Test

**Purpose**: Verify Supabase is configured correctly

**Run:**
```bash
cd backend
node tests/test-supabase-connection.js
```

**Expected Output:**
```
========================================
Level 5: Supabase Connection Test
========================================

Test 1: Checking environment variables...
✅ SUPABASE_URL configured: https://xxx.supabase.co
✅ SUPABASE_ANON_KEY configured (length: 220)
✅ SUPABASE_SERVICE_KEY configured (length: 220)

Test 2: Testing database connection...
✅ Successfully connected to Supabase

Test 3: Checking database tables...
✅ Table 'users' exists and is accessible
✅ Table 'payments' exists and is accessible
✅ Table 'readings' exists and is accessible

Test 4: Testing user query...
✅ Can query users table
   Found 1 user(s)

========================================
✅ ALL TESTS PASSED
Supabase is configured correctly!
You can now proceed to Level 5 integration test.
========================================
```

**If Failed:**
- Check `.env` file has correct values
- Verify schema.sql was run completely
- Check Supabase project is active (not paused)

---

### Test 2: Full Integration Test

**Purpose**: Test complete flow with database persistence

**Run:**
```bash
node tests/test-level5-flow.js
```

**Expected Output:**
```
========================================
Level 5: Complete Flow Integration Test
Database: Real Supabase PostgreSQL
========================================

Test 1: Verifying test user exists...
✅ Test user found: test@chatju.com

Test 2: Creating test payment...
✅ Payment created and completed
   Order ID: pay_test_1730000000000
   Status: completed
   Amount: 13000 KRW
   Product: basic

Test 3: Verifying payment persists in database...
✅ Payment persists in database
   Database ID: 550e8400-e29b-41d4-a716-446655440000

Test 4: Generating saju reading with database storage...
✅ Saju reading generated and saved
   Reading ID: 660e8400-e29b-41d4-a716-446655440001
   Created at: 2025-11-07T08:30:00.000Z
   View URL: https://chatju.pages.dev/reading/660e8400-...

Test 5: Verifying Manseryeok calculation...
✅ Manseryeok calculation valid
   Year Pillar: 경오 (금)
   Month Pillar: 신사 (금)
   Day Pillar: 기해 (토)
   Hour Pillar: 신미 (금)
   Elements: {"목":1,"화":2,"토":2,"금":4,"수":1}

Test 6: Verifying AI interpretation...
✅ AI interpretation generated
   Length: 823 characters
   Tokens: 425
   Model: gpt-4o-mini
   Sections: 5

Test 7: Retrieving reading from database...
✅ Reading successfully retrieved from database
   Data persists after generation

Test 8: Verifying reading in Supabase table...
✅ Reading exists in Supabase
   Birth date: 1990-05-15
   Gender: male
   Language: ko
   Has saju_data: true
   Has ai_interpretation: true

Test 9: Testing data persistence...
   (Simulating server restart...)
✅ Data persists across queries
   Payment still exists: true
   Reading still exists: true

========================================
LEVEL 5 TEST RESULTS
========================================
✅ Tests Passed: 9
❌ Tests Failed: 0
========================================

🎉 LEVEL 5 PASSED! 🎉

Key Achievements:
  ✓ Real Supabase database integration
  ✓ Payment records persist in PostgreSQL
  ✓ Reading data stored permanently
  ✓ Manseryeok + AI integration working
  ✓ Data survives server restarts

Next Steps:
  → Level 6: Implement real Supabase Auth
  → Level 7: Integrate real payment gateways
```

---

## Verification Steps

### Manual Verification in Supabase Dashboard

After tests pass, manually verify data in Supabase:

#### 1. Check Payments Table

Go to **Table Editor** → `payments`

You should see:
- Order ID starting with `pay_test_`
- Status: `completed`
- Amount: `13000`
- Currency: `KRW`
- Product type: `basic`
- User ID matches test user
- Timestamps populated

#### 2. Check Readings Table

Go to **Table Editor** → `readings`

You should see:
- Reading ID (UUID format)
- Birth date: `1990-05-15`
- Gender: `male`
- `saju_data` (JSONB with pillars)
- `ai_interpretation` (JSONB with text)
- Linked to payment via `payment_id`

#### 3. Verify Data Persistence

1. Stop backend server (if running): `Ctrl+C`
2. Restart server: `npm run dev`
3. Run test again: `node tests/test-level5-flow.js`
4. Check Supabase Table Editor - previous records should still exist

**This proves data persists across restarts (unlike Level 4 mock storage!)**

---

## Common Issues & Solutions

### Issue 1: "Invalid API key"

**Symptoms:**
```
❌ Connection failed: Invalid API key
```

**Solution:**
1. Check `.env` file for typos
2. Ensure no quotes around keys
3. Verify keys copied completely from Supabase
4. Try regenerating keys in Supabase dashboard

---

### Issue 2: "relation 'readings' does not exist"

**Symptoms:**
```
❌ Table 'readings' not found or not accessible
Error: relation "readings" does not exist
```

**Solution:**
1. Re-run `database/schema.sql` in Supabase SQL Editor
2. Check for SQL errors in schema execution
3. Verify all tables created in Table Editor

---

### Issue 3: "Payment not found"

**Symptoms:**
```
❌ Payment not found
```

**Solution:**
1. Check test user ID matches schema.sql
2. Verify payment creation succeeded
3. Check Supabase logs for errors
4. Ensure service_role key has correct permissions

---

### Issue 4: "Row Level Security policy violation"

**Symptoms:**
```
❌ new row violates row-level security policy
```

**Solution:**
1. Ensure using `supabaseAdmin` (not `supabase`) for inserts
2. Check RLS policies are created correctly
3. Verify service_role key is configured

---

### Issue 5: OpenAI API Error

**Symptoms:**
```
❌ Failed to generate interpretation: 401 Unauthorized
```

**Solution:**
1. Check `OPENAI` key in `.env` is valid
2. Verify OpenAI account has credits
3. Test API key: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`

---

## Performance Benchmarks

Expected timings for Level 5 test:

| Operation | Expected Time | Status |
|-----------|---------------|--------|
| Connection test | < 2 seconds | ✅ |
| Payment creation | < 500ms | ✅ |
| Manseryeok calculation | < 100ms | ✅ |
| OpenAI interpretation | 2-4 seconds | ✅ |
| Database insert | < 500ms | ✅ |
| Total test duration | 5-10 seconds | ✅ |

If tests take significantly longer:
- Check network latency to Supabase
- Verify Supabase project region (use Seoul for Korea)
- Check OpenAI API response time

---

## Comparison: Level 4 vs Level 5

| Feature | Level 4 (Mock) | Level 5 (Real DB) |
|---------|----------------|-------------------|
| **Storage** | In-memory (lost on restart) | PostgreSQL (persists) |
| **Payment ID** | Timestamp string | UUID |
| **Reading ID** | `reading_${timestamp}` | UUID |
| **Auth** | Hardcoded mock | Supabase JWT (partial) |
| **Data Query** | JavaScript object lookup | SQL queries |
| **Scalability** | Single server only | Multi-server ready |
| **Data Recovery** | None | Full database backup |

---

## Success Criteria

Level 5 is considered **PASSED** when:

- [x] Connection test passes (all 4 checks)
- [x] Integration test passes (all 9 tests)
- [x] Data visible in Supabase Table Editor
- [x] Data persists after server restart
- [x] Reading IDs are UUIDs (not timestamps)
- [x] Payment status workflow works
- [x] Manseryeok + AI still functioning
- [x] No mock files in production code

---

## Next Steps After Level 5

Once Level 5 passes:

### Cleanup Tasks
1. Remove `.v4` backup files (if no longer needed)
2. Delete `payment.mock.js` and related mock files
3. Update `progress.md` with Level 5 completion

### Level 6 Preparation
1. Study Supabase Auth documentation
2. Plan Magic Link email flow
3. Design user registration UI
4. Test JWT generation/verification

### Level 7 Planning
1. Register for Toss Payments test account (Korea)
2. Register for Stripe test account (International)
3. Study webhook implementation
4. Plan payment flow UX

---

## Support & Resources

### Documentation
- Supabase Docs: https://supabase.com/docs
- Supabase JS Client: https://supabase.com/docs/reference/javascript/introduction
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security

### Debugging Tools
- Supabase Dashboard: Check logs, table data, SQL queries
- PostgreSQL Logs: View in Supabase dashboard under "Logs"
- Network Inspector: Use browser DevTools for API calls

### Contact
- Project Lead: yohan@harmonycon.com
- GitHub Issues: https://github.com/ers123/chatju-premium/issues

---

**Status**: Ready for Execution
**Last Updated**: November 7, 2025
**Next Review**: Upon Level 5 Completion
