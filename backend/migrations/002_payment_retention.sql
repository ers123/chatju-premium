-- ============================================
-- Migration: Payment Record Retention (전자상거래법)
-- Korean Electronic Commerce Act requires 5-year retention of transaction records.
-- Change payments FK from ON DELETE CASCADE to ON DELETE SET NULL
-- so payment records survive user account deletion.
-- Run this in Supabase SQL Editor.
-- ============================================

-- 1) Make user_id nullable (currently NOT NULL)
ALTER TABLE payments ALTER COLUMN user_id DROP NOT NULL;

-- 2) Drop the existing foreign key constraint
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;

-- 3) Re-add with ON DELETE SET NULL instead of CASCADE
ALTER TABLE payments
  ADD CONSTRAINT payments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
