-- Expand persisted language constraints to match the 10-language product surface.
-- Intended for manual Supabase SQL editor execution after review.

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_language_preference_check,
  ADD CONSTRAINT users_language_preference_check
  CHECK (language_preference IN ('ko', 'en', 'ja', 'zh', 'vi', 'id', 'es', 'pt', 'fr', 'th'));

ALTER TABLE readings
  DROP CONSTRAINT IF EXISTS readings_language_check,
  ADD CONSTRAINT readings_language_check
  CHECK (language IN ('ko', 'en', 'ja', 'zh', 'vi', 'id', 'es', 'pt', 'fr', 'th'));

ALTER TABLE readings
  DROP CONSTRAINT IF EXISTS readings_product_type_check,
  ADD CONSTRAINT readings_product_type_check
  CHECK (product_type IN ('basic', 'deluxe', 'free', 'premium_saju'));

ALTER TABLE readings
  ALTER COLUMN user_id DROP NOT NULL;
