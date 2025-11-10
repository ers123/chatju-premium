# Level 5 Quick Start Guide

**For**: Developers ready to test Supabase integration
**Time Required**: 20-30 minutes
**Prerequisites**: Level 4 completed

---

## TL;DR - Fast Track

If you already know what you're doing:

```bash
# 1. Create Supabase project at https://database.new
# 2. Run database/schema.sql in SQL Editor
# 3. Update .env with real credentials
# 4. Deploy v5 files
cp src/services/saju.service.v5.js src/services/saju.service.js
cp src/services/payment.service.v5.js src/services/payment.service.js
cp src/middleware/auth.v5.js src/middleware/auth.js

# 5. Test
node tests/test-supabase-connection.js
node tests/test-level5-flow.js

# Done! ✅
```

---

## Step-by-Step Guide

### Step 1: Create Supabase Project (5 mins)

1. Go to https://database.new
2. Sign in with GitHub/Google
3. Click "New Project"
4. Fill in:
   - Name: `chatju-premium`
   - Database Password: (generate strong password)
   - Region: `Northeast Asia (Seoul)` or closest
5. Wait 2-3 minutes for setup

### Step 2: Get Credentials (2 mins)

1. Go to **Project Settings** → **API**
2. Copy these three values:

```bash
SUPABASE_URL=https://[your-project-id].supabase.co
SUPABASE_ANON_KEY=eyJhbGc... (long string starting with eyJ)
SUPABASE_SERVICE_KEY=eyJhbGc... (different long string)
```

3. Update `backend/.env`:
```bash
NODE_ENV=development
OPENAI=sk-proj-[your-existing-key]
SUPABASE_URL=[paste here]
SUPABASE_ANON_KEY=[paste here]
SUPABASE_SERVICE_KEY=[paste here]
```

### Step 3: Deploy Database Schema (3 mins)

1. In Supabase dashboard, click **SQL Editor**
2. Click **New Query**
3. Copy entire contents of `backend/database/schema.sql`
4. Paste into editor
5. Click **Run**
6. Wait for "Success" message

**Verify:**
- Go to **Table Editor**
- You should see: `users`, `payments`, `readings`

### Step 4: Deploy Code Files (2 mins)

**Option A: Safe (Manual)**
```bash
cd backend/src

# Backup old files
cp services/saju.service.js services/saju.service.v4.backup.js
cp middleware/auth.js middleware/auth.v4.backup.js

# Deploy new files
cp services/saju.service.v5.js services/saju.service.js
cp services/payment.service.v5.js services/payment.service.js
cp middleware/auth.v5.js middleware/auth.js
```

**Option B: Quick (Script)**
```bash
cd backend
./scripts/deploy-level5.sh  # If you create this script
```

### Step 5: Test Connection (1 min)

```bash
cd backend
node tests/test-supabase-connection.js
```

**Expected:**
```
✅ ALL TESTS PASSED
Supabase is configured correctly!
```

**If failed:** See [troubleshooting](#troubleshooting)

### Step 6: Run Full Test (5 mins)

```bash
node tests/test-level5-flow.js
```

**Expected:**
```
✅ Tests Passed: 9
❌ Tests Failed: 0

🎉 LEVEL 5 PASSED! 🎉
```

### Step 7: Verify in Dashboard (2 mins)

1. Go to Supabase **Table Editor**
2. Click `payments` table
   - Should see 1 row with status "completed"
3. Click `readings` table
   - Should see 1 row with saju_data and ai_interpretation
4. Check timestamps are recent

**Data persists!** Unlike Level 4, this data survives server restarts.

---

## What Changed from Level 4?

### Files Added
- ✅ `src/config/supabase.js` - Database client
- ✅ `src/services/payment.service.v5.js` - Real payment storage
- ✅ `database/schema.sql` - PostgreSQL schema

### Files Updated
- 🔄 `src/services/saju.service.js` - Now saves to database
- 🔄 `src/middleware/auth.js` - Real JWT verification

### Files Removed
- ❌ `src/services/payment.mock.js` - No longer needed
- ❌ `src/routes/payment.mock.routes.js` - Deprecated

### Key Behavioral Changes

| Feature | Level 4 | Level 5 |
|---------|---------|---------|
| Data storage | In-memory | PostgreSQL |
| Reading IDs | `reading_1730...` | UUID |
| Persistence | ❌ Lost on restart | ✅ Permanent |
| Scalability | 1 server | ✅ Multi-server |

---

## Troubleshooting

### "Invalid API key"
→ Check `.env` has correct keys with no quotes

### "Table not found"
→ Re-run `schema.sql` in SQL Editor

### "Connection timeout"
→ Check Supabase project not paused (free tier sleeps after 7 days)

### "OpenAI error"
→ Verify `OPENAI` key is valid and has credits

### "Test user not found"
→ Ensure `schema.sql` ran completely (includes test user insert)

---

## Quick Verification Commands

```bash
# Check environment variables
cat backend/.env | grep SUPABASE

# Test connection
node backend/tests/test-supabase-connection.js

# Run full test
node backend/tests/test-level5-flow.js

# Check logs
tail -f backend/logs/backend.log
```

---

## Next Steps

After Level 5 passes:

1. **Clean up**: Remove `.v4` backup files
2. **Update docs**: Mark Level 5 complete in progress.md
3. **Level 6**: Start planning Supabase Auth (Magic Link)
4. **Level 7**: Register for payment gateway test accounts

---

## Need Help?

- 📖 Detailed guide: See [LEVEL5_SETUP_GUIDE.md](./LEVEL5_SETUP_GUIDE.md)
- 🧪 Testing details: See [LEVEL5_TESTING.md](./LEVEL5_TESTING.md)
- 🐛 Issues: Check Supabase logs in dashboard
- 💬 Contact: yohan@harmonycon.com

---

**Estimated Time**: 20-30 minutes
**Difficulty**: ⭐⭐⭐ (Medium)
**Status**: Ready to Execute

Good luck! 🚀
