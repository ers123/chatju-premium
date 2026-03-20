-- ============================================
-- Migration: Promo Code + Email Delivery Support
-- Run this in Supabase SQL Editor
-- ============================================

-- 1) readings 테이블 변경: user_id nullable + 이메일/프로모 필드
ALTER TABLE readings ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE readings ADD COLUMN IF NOT EXISTS delivery_email TEXT;
ALTER TABLE readings ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;
ALTER TABLE readings ADD COLUMN IF NOT EXISTS email_status TEXT DEFAULT 'pending';
ALTER TABLE readings ADD COLUMN IF NOT EXISTS promo_code_id UUID;

-- 2) promo_codes 테이블 생성
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  partner_name VARCHAR(100) NOT NULL,
  discount_type VARCHAR(20) NOT NULL,  -- 'free' | 'percent' | 'fixed'
  discount_value DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) promo_usage 테이블 생성
CREATE TABLE IF NOT EXISTS promo_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID REFERENCES promo_codes(id),
  user_email TEXT NOT NULL,
  child_name TEXT,
  child_birth_date TEXT,
  reading_id UUID REFERENCES readings(id),
  used_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- 4) FK: readings → promo_codes
ALTER TABLE readings ADD CONSTRAINT fk_readings_promo
  FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id);

-- 5) 인덱스
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_usage_code ON promo_usage(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_email ON promo_usage(user_email);
CREATE INDEX IF NOT EXISTS idx_readings_delivery_email ON readings(delivery_email);

-- 6) 테스트 프로모 코드
INSERT INTO promo_codes (code, partner_name, discount_type, discount_value, max_uses)
VALUES ('TEST2026', '테스트', 'free', 0, 100)
ON CONFLICT (code) DO NOTHING;
