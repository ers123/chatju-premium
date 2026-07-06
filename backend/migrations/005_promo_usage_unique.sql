-- ============================================
-- Migration: Enforce one promo redemption per (code, email) at the DB level
-- Fixes TOCTOU race: hasEmailUsedPromo (SELECT) and usePromoCode (INSERT) are
-- separate statements, so concurrent requests could both redeem the same code.
-- Run this in the Supabase SQL Editor after 004_claim_key.sql.
-- ============================================

-- 1) Dedupe existing rows (keep the earliest redemption per pair) so the
--    unique index can be created. As of 2026-07-06 prod has exactly one
--    duplicated (promo_code_id, user_email) pair.
DELETE FROM promo_usage a
USING promo_usage b
WHERE a.promo_code_id = b.promo_code_id
  AND a.user_email = b.user_email
  AND a.ctid > b.ctid;

-- 2) Unique index: the INSERT in usePromoCode now fails with 23505 on a
--    duplicate, which the backend maps to PROMO_ALREADY_USED (409).
CREATE UNIQUE INDEX IF NOT EXISTS uq_promo_usage_code_email
  ON promo_usage (promo_code_id, user_email);
