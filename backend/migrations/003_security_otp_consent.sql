-- ============================================
-- Migration: Launch security hardening
--   1) report_lookup_otp table (emailed-OTP possession check for report lookup)
--   2) readings.consent column (PIPA/GDPR proof of consent)
--   3) increment_promo_used_count RPC (atomic promo counter)
-- Run this in the Supabase SQL Editor.
-- ============================================

-- 1) Report lookup OTP store
CREATE TABLE IF NOT EXISTS report_lookup_otp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,            -- sha256(email:code), plaintext never stored
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,   -- 10-minute TTL enforced by backend
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_report_lookup_otp_email ON report_lookup_otp(email);
CREATE INDEX IF NOT EXISTS idx_report_lookup_otp_expires ON report_lookup_otp(expires_at);

-- Service-role only table: enable RLS with no policies so anon/auth roles get nothing.
ALTER TABLE report_lookup_otp ENABLE ROW LEVEL SECURITY;

-- Optional housekeeping: purge expired OTPs (run periodically or rely on backend delete-on-use)
-- DELETE FROM report_lookup_otp WHERE expires_at < NOW();

-- 2) Proof of consent on readings
ALTER TABLE readings ADD COLUMN IF NOT EXISTS consent JSONB;

-- 3) Atomic promo usage counter (fixes read-then-write race in promo.service.js)
CREATE OR REPLACE FUNCTION increment_promo_used_count(promo_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE promo_codes SET used_count = COALESCE(used_count, 0) + 1 WHERE id = promo_id;
$$;
