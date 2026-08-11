-- ============================================
-- Migration: Track report-email delivery attempts
-- Enables the retry sweeper (scripts/retry-report-emails.js) to bound retries
-- so a permanently-undeliverable address is not retried forever.
--
-- email_status already exists (migration 001, TEXT DEFAULT 'pending'):
--   pending -> row created, send not yet confirmed (or the Lambda was frozen
--              mid-send, which is exactly the case this sweeper recovers)
--   sent    -> Resend accepted the message
--   failed  -> send raised an error
--
-- Run this in the Supabase SQL Editor after 006_payments_currency_jpy_thb.sql.
-- ============================================

ALTER TABLE readings ADD COLUMN IF NOT EXISTS email_attempts INTEGER NOT NULL DEFAULT 0;

-- Partial index: the sweeper only ever scans undelivered rows.
CREATE INDEX IF NOT EXISTS idx_readings_email_undelivered
  ON readings (created_at)
  WHERE delivery_email IS NOT NULL AND email_status IS DISTINCT FROM 'sent';
