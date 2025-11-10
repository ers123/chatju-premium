# Level 5 File Structure

Complete list of all Level 5 files and their purposes.

---

## New Files Created

### Configuration
```
src/config/supabase.js
```
- Initializes Supabase clients (anon + admin)
- Handles database connection
- Error handling utilities
- **Status**: ✅ Ready to use

### Services (v5 versions)
```
src/services/saju.service.v5.js
src/services/payment.service.v5.js
```
- Real database operations
- Replaces mock storage
- UUID-based IDs
- **Status**: ✅ Ready to deploy (replace current files)

### Middleware (v5 version)
```
src/middleware/auth.v5.js
```
- Real Supabase JWT verification
- Replaces mock authentication
- Optional auth support
- **Status**: ✅ Ready to deploy (replace current file)

### Database
```
database/schema.sql
```
- PostgreSQL schema definition
- Creates users, payments, readings tables
- Row Level Security policies
- Indexes and triggers
- **Status**: ✅ Ready to run in Supabase SQL Editor

### Tests
```
tests/test-supabase-connection.js
tests/test-level5-flow.js
```
- Connection verification
- Full integration test
- 9 test cases
- **Status**: ✅ Ready to execute

### Documentation
```
LEVEL5_SETUP_GUIDE.md    # Detailed setup instructions
LEVEL5_TESTING.md        # Complete testing guide
LEVEL5_QUICKSTART.md     # Fast track guide (this file)
LEVEL5_FILES.md          # File structure overview
```
- **Status**: ✅ Complete

---

## File Locations (Absolute Paths)

```
/Users/yohan/projects/fortune/chatju-premium/backend/
├── src/
│   ├── config/
│   │   └── supabase.js                        # NEW
│   ├── middleware/
│   │   ├── auth.js                            # CURRENT (Level 4)
│   │   └── auth.v5.js                         # NEW (to replace)
│   ├── services/
│   │   ├── saju.service.js                    # CURRENT (Level 4)
│   │   ├── saju.service.v5.js                 # NEW (to replace)
│   │   ├── payment.mock.js                    # OLD (to remove)
│   │   └── payment.service.v5.js              # NEW
│   └── routes/
│       └── payment.mock.routes.js             # OLD (to remove)
├── database/
│   └── schema.sql                             # NEW
├── tests/
│   ├── test-supabase-connection.js            # NEW
│   ├── test-level5-flow.js                    # NEW
│   ├── test-complete-flow.sh                  # OLD (Level 4)
│   └── mansae-integration-test.js             # OLD (Level 2)
├── LEVEL5_SETUP_GUIDE.md                      # NEW
├── LEVEL5_TESTING.md                          # NEW
├── LEVEL5_QUICKSTART.md                       # NEW
├── LEVEL5_FILES.md                            # NEW (this file)
├── .env                                       # UPDATE REQUIRED
└── package.json                               # No changes needed
```

---

## Deployment Checklist

### Phase 1: Database Setup
- [ ] Create Supabase project
- [ ] Get credentials (URL, anon key, service key)
- [ ] Update `.env` file
- [ ] Run `database/schema.sql` in Supabase SQL Editor
- [ ] Verify tables created in Table Editor

### Phase 2: Code Deployment
- [ ] Copy `src/config/supabase.js` (new file)
- [ ] Copy `src/services/payment.service.v5.js` (new file)
- [ ] Replace `src/services/saju.service.js` with v5 version
- [ ] Replace `src/middleware/auth.js` with v5 version
- [ ] Remove `src/services/payment.mock.js`
- [ ] Remove `src/routes/payment.mock.routes.js`

### Phase 3: Testing
- [ ] Run `node tests/test-supabase-connection.js`
- [ ] Verify all checks pass
- [ ] Run `node tests/test-level5-flow.js`
- [ ] Verify 9/9 tests pass
- [ ] Check data in Supabase Table Editor

### Phase 4: Verification
- [ ] Restart server, verify data persists
- [ ] Check reading IDs are UUIDs
- [ ] Verify timestamps in database
- [ ] Test retrieval of stored readings

---

## File Size Reference

Approximate file sizes:

```
schema.sql                    ~5 KB
supabase.js                   ~3 KB
saju.service.v5.js           ~12 KB
payment.service.v5.js         ~5 KB
auth.v5.js                    ~3 KB
test-supabase-connection.js   ~3 KB
test-level5-flow.js           ~8 KB
LEVEL5_SETUP_GUIDE.md        ~15 KB
LEVEL5_TESTING.md            ~20 KB
```

Total: ~74 KB of new/updated code

---

## Dependencies

### Required npm Packages

Already installed in Level 4:
- ✅ `@supabase/supabase-js@^2.39.0`
- ✅ `openai@^5.1.0`
- ✅ `express@^4.21.2`
- ✅ `dotenv@^16.5.0`
- ✅ `mansae-calculator` (from GitHub)

No new dependencies needed for Level 5!

---

## Environment Variables

### Required (.env file)

```bash
NODE_ENV=development
OPENAI=sk-proj-[your-key]
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=eyJhbGc[...]
SUPABASE_SERVICE_KEY=eyJhbGc[...]
```

### Validation

Run this to check your .env:
```bash
node -e "
require('dotenv').config();
const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY'];
const missing = required.filter(k => !process.env[k] || process.env[k] === 'placeholder');
if (missing.length) {
  console.log('❌ Missing:', missing.join(', '));
} else {
  console.log('✅ All environment variables configured');
}
"
```

---

## Backup Strategy

### Before Deployment

Create backups of files that will be replaced:

```bash
# Backup current Level 4 files
cp src/services/saju.service.js src/services/saju.service.v4.backup.js
cp src/middleware/auth.js src/middleware/auth.v4.backup.js

# Create backup directory
mkdir -p backups/level4
cp src/services/saju.service.js backups/level4/
cp src/services/payment.mock.js backups/level4/
cp src/middleware/auth.js backups/level4/
```

### Rollback (if needed)

If Level 5 fails and you need to revert:

```bash
# Restore Level 4 files
cp backups/level4/saju.service.js src/services/
cp backups/level4/payment.mock.js src/services/
cp backups/level4/auth.js src/middleware/

# Revert .env
# (manually restore placeholders)
```

---

## Git Workflow

### Recommended Git Strategy

```bash
# Create Level 5 branch
git checkout -b level-5-supabase-integration

# Add new files
git add src/config/supabase.js
git add src/services/*.v5.js
git add src/middleware/auth.v5.js
git add database/schema.sql
git add tests/test-level5-*.js
git add LEVEL5_*.md

# Commit
git commit -m "feat: Add Level 5 Supabase integration files

- Add Supabase client configuration
- Add v5 service files with database integration
- Add database schema and test scripts
- Add comprehensive documentation"

# After testing passes, deploy v5 files
git add src/services/saju.service.js
git add src/middleware/auth.js
git add .env  # Be careful - may want to ignore this
git commit -m "feat: Deploy Level 5 (Supabase integration)

- Replace mock storage with real database
- Enable persistent data storage
- Pass all Level 5 tests"

# Merge to main
git checkout main
git merge level-5-supabase-integration
```

---

## What Each File Does

### `src/config/supabase.js`
- Creates Supabase client instances
- Validates environment variables
- Provides helper functions
- Exports `supabase` (anon) and `supabaseAdmin` (service role)

### `src/services/saju.service.v5.js`
- Generates saju readings (same as v4)
- **NEW**: Stores readings in `readings` table
- **NEW**: Queries payments from database
- **NEW**: Returns UUID-based reading IDs
- **NEW**: `getReading()` and `getUserReadings()` functions

### `src/services/payment.service.v5.js`
- Creates payment records in database
- Updates payment status
- Queries payment history
- Test payment creation helper

### `src/middleware/auth.v5.js`
- Verifies JWT tokens with Supabase
- Extracts user info from token
- Attaches user to request object
- Optional auth middleware variant

### `database/schema.sql`
- Defines table structures
- Creates indexes for performance
- Sets up Row Level Security
- Adds test user
- Includes verification queries

### `tests/test-supabase-connection.js`
- Checks environment variables
- Tests database connection
- Verifies tables exist
- Quick smoke test

### `tests/test-level5-flow.js`
- End-to-end integration test
- 9 comprehensive test cases
- Validates data persistence
- Simulates complete flow

---

## File Dependencies Graph

```
.env
 ├─→ src/config/supabase.js
 │    ├─→ src/services/saju.service.v5.js
 │    ├─→ src/services/payment.service.v5.js
 │    └─→ src/middleware/auth.v5.js
 │
 └─→ tests/test-supabase-connection.js
      └─→ tests/test-level5-flow.js
           ├─→ uses payment.service.v5.js
           └─→ uses saju.service.v5.js

database/schema.sql (run in Supabase, not imported in code)
```

---

## Quick Reference Commands

```bash
# Navigate to backend
cd /Users/yohan/projects/fortune/chatju-premium/backend

# Check current files
ls -la src/services/
ls -la src/middleware/
ls -la database/
ls -la tests/

# Verify environment
cat .env | grep SUPABASE

# Test connection
node tests/test-supabase-connection.js

# Run Level 5 test
node tests/test-level5-flow.js

# Start dev server
npm run dev
```

---

**Document Version**: 1.0
**Last Updated**: November 7, 2025
**Status**: Complete and Ready for Use
