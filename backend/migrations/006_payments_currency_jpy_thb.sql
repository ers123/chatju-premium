-- ============================================
-- Migration: Allow JPY and THB in payments.currency
-- The original CHECK constraint only allowed USD/KRW/EUR/CNY, so the
-- multi-currency catalog (premium_saju_jpy / premium_saju_thb) fails at
-- INSERT for ja/th locales even though the PayPal order succeeds.
-- Run this in the Supabase SQL Editor after 005_promo_usage_unique.sql.
-- ============================================

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_currency_check;
ALTER TABLE payments ADD CONSTRAINT payments_currency_check
  CHECK (currency IN ('USD', 'KRW', 'EUR', 'CNY', 'JPY', 'THB'));
