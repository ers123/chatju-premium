-- ============================================
-- Migration: Per-transaction claim key for in-flow polling
-- Adds claim_key_hash to readings so the frontend can poll
-- without an emailed OTP (possession of the random secret IS the authz).
-- Run this in the Supabase SQL Editor after 003_security_otp_consent.sql.
-- ============================================

-- 1) Add claim_key_hash column (nullable for back-compat with existing rows)
ALTER TABLE readings ADD COLUMN IF NOT EXISTS claim_key_hash TEXT;

-- 2) Index for O(1) lookup on reading-check?claim= queries
CREATE INDEX IF NOT EXISTS idx_readings_claim_key_hash ON readings(claim_key_hash)
  WHERE claim_key_hash IS NOT NULL;
