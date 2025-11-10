# Level 5 Setup Guide - Supabase Integration

**Document Version**: 1.0
**Date**: November 7, 2025
**Purpose**: Guide for integrating real Supabase database into ChatJu Premium backend

---

## Overview

Level 5 replaces all mock data storage with real Supabase PostgreSQL database, enabling:
- Persistent data storage for readings, payments, and users
- Real JWT authentication with Supabase Auth
- Secure database queries with Row Level Security (RLS)

---

## Prerequisites

- ✅ Level 1-4 tests passed
- ✅ Supabase account created (https://supabase.com)
- ✅ Node.js 18+ installed
- ✅ Backend dependencies installed

---

## Step 1: Create Supabase Project

### 1.1 Create New Project
1. Go to https://database.new
2. Click "New Project"
3. Fill in project details:
   - **Name**: `chatju-premium`
   - **Database Password**: Generate strong password (save it!)
   - **Region**: `Northeast Asia (Seoul)` or closest region
   - **Pricing Plan**: Free tier is sufficient for testing

4. Wait 2-3 minutes for project initialization

### 1.2 Get Project Credentials
Once project is ready:

1. Go to **Project Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - Go to **Service Role** tab and copy **service_role** key (secret!)

3. Update `.env` file:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 2: Deploy Database Schema

### 2.1 Open SQL Editor
1. Go to **SQL Editor** in Supabase dashboard
2. Click **New Query**

### 2.2 Run Schema Creation Script
Copy and paste the contents of `database/schema.sql` (provided below) and click **Run**

This will create:
- `users` table
- `payments` table
- `readings` table
- Necessary indexes
- Row Level Security policies

### 2.3 Verify Tables Created
1. Go to **Table Editor**
2. You should see three tables: `users`, `payments`, `readings`

---

## Step 3: Update Backend Code

### 3.1 Files to Replace
The following files need to be updated for Supabase integration:

| File | Purpose | Status |
|------|---------|--------|
| `src/config/supabase.js` | Supabase client initialization | NEW |
| `src/middleware/auth.js` | JWT verification with Supabase | UPDATE |
| `src/services/saju.service.js` | Database queries for readings | UPDATE |
| `src/services/payment.service.js` | Real payment storage | NEW |

### 3.2 Deployment Steps
1. Copy new files from `src-updated/` folder to `src/`
2. Remove old mock files:
   - `src/services/payment.mock.js`
   - `src/routes/payment.mock.routes.js`

3. Restart the server:
```bash
npm run dev
```

---

## Step 4: Test Supabase Connection

### 4.1 Quick Connection Test
Run the connection test script:
```bash
node tests/test-supabase-connection.js
```

Expected output:
```
✅ Supabase connected successfully
✅ Can query database
✅ Database tables exist: users, payments, readings
```

### 4.2 Create Test User
The test script will automatically create a test user in Supabase Auth.

Verify in dashboard:
1. Go to **Authentication** → **Users**
2. You should see test user: `test@chatju.com`

---

## Step 5: Run Level 5 Integration Test

### 5.1 Execute Test Script
```bash
./tests/test-level5-flow.sh
```

### 5.2 Expected Test Flow
1. **User Registration** → Creates user in `users` table
2. **Payment Creation** → Stores payment in `payments` table with status "pending"
3. **Payment Confirmation** → Updates status to "completed"
4. **Saju Calculation** → Verifies payment, calculates saju, stores in `readings` table
5. **Data Retrieval** → Queries reading from database

### 5.3 Success Criteria
✅ All 5 steps complete without errors
✅ Data persists in Supabase (verify in Table Editor)
✅ Auth middleware validates JWT correctly
✅ Reading ID is UUID format (not `reading_timestamp`)

---

## Step 6: Verify Data Persistence

### 6.1 Check Database Records
In Supabase dashboard → **Table Editor**:

**users table:**
```
id | email | language_preference | created_at
--------------------------------------------
uuid | test@chatju.com | ko | timestamp
```

**payments table:**
```
id | user_id | order_id | amount | status | created_at
--------------------------------------------------------
uuid | uuid | pay_xxx | 13000 | completed | timestamp
```

**readings table:**
```
id | user_id | birth_date | saju_data | ai_interpretation | created_at
-----------------------------------------------------------------------
uuid | uuid | 1990-05-15 | {...} | {...} | timestamp
```

### 6.2 Test Server Restart Persistence
1. Stop the backend server (Ctrl+C)
2. Restart: `npm run dev`
3. Query the reading again using reading ID
4. ✅ Data should still be available (not lost like mock storage)

---

## Step 7: Clean Up Mock Code

After Level 5 passes, remove mock-related code:

### Files to Delete:
```bash
rm src/services/payment.mock.js
rm src/routes/payment.mock.routes.js
rm tests/test-complete-flow.sh  # Old Level 4 test
```

### Code to Remove:
- Any `// MOCK` comments
- Development-only bypass code in auth.js

---

## Troubleshooting

### Problem: "Invalid API key"
**Solution**: Check `.env` file has correct `SUPABASE_ANON_KEY` (no quotes, no spaces)

### Problem: "relation 'readings' does not exist"
**Solution**: Re-run schema.sql in Supabase SQL Editor

### Problem: "JWT expired"
**Solution**: Supabase JWT expires after 1 hour. Regenerate test token:
```bash
node tests/generate-test-token.js
```

### Problem: "Row Level Security policy violation"
**Solution**: Ensure RLS policies are created correctly. Check `schema.sql` was fully executed.

### Problem: Connection timeout
**Solution**:
1. Check Supabase project is not paused (free tier pauses after 7 days inactivity)
2. Verify SUPABASE_URL is correct
3. Check network/firewall settings

---

## Security Checklist

Before deploying to production:

- [ ] `.env` file is in `.gitignore`
- [ ] Never commit `SUPABASE_SERVICE_KEY` to git
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] Anon key used for client requests
- [ ] Service key only used in backend (never exposed to frontend)
- [ ] JWT tokens validated on all protected endpoints

---

## Next Steps After Level 5

Once Level 5 passes:

1. **Level 6**: Implement real Supabase Auth (Magic Link)
2. **Level 7**: Integrate real payment gateways (Toss Payments, Stripe)
3. **Production**: Deploy to AWS Lambda with environment variables

---

## Useful Commands

```bash
# Start dev server
npm run dev

# Run Level 5 test
./tests/test-level5-flow.sh

# Check Supabase connection
node tests/test-supabase-connection.js

# Generate new test JWT
node tests/generate-test-token.js

# View logs
tail -f logs/backend.log
```

---

## Database Schema Reference

See `database/schema.sql` for complete schema definition.

Key relationships:
- `users.id` → `payments.user_id` (one-to-many)
- `users.id` → `readings.user_id` (one-to-many)
- `payments.id` → `readings.payment_id` (one-to-one, optional)

---

## Support Resources

- Supabase Docs: https://supabase.com/docs
- Supabase JS Client: https://supabase.com/docs/reference/javascript
- Supabase Auth: https://supabase.com/docs/guides/auth
- ChatJu Project: Contact yohan@harmonycon.com

---

**Status**: Ready for Level 5 Testing
**Last Updated**: November 7, 2025
