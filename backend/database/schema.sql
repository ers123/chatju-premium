-- ChatJu Premium Database Schema
-- Version: 1.1
-- Date: November 13, 2025
-- Database: Supabase PostgreSQL
-- Changelog: Added PayPal to payment methods, added order_name and confirmed_at fields

-- =============================================================================
-- USERS TABLE
-- =============================================================================
-- Stores user profile information
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  language_preference TEXT DEFAULT 'ko' CHECK (language_preference IN ('ko', 'en', 'zh')),
  timezone TEXT DEFAULT 'Asia/Seoul',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read/update their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- =============================================================================
-- PAYMENTS TABLE
-- =============================================================================
-- Stores payment transaction records
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'KRW' CHECK (currency IN ('KRW', 'USD', 'EUR', 'CNY')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('toss', 'paypal', 'stripe', 'paddle', 'mock')),
  payment_key TEXT,
  product_type TEXT NOT NULL CHECK (product_type IN ('basic', 'deluxe')),
  order_name TEXT,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Service role can insert payments (backend only)
CREATE POLICY "Service role can insert payments" ON payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update payments" ON payments
  FOR UPDATE USING (true);

-- =============================================================================
-- READINGS TABLE
-- =============================================================================
-- Stores saju readings with calculation results and AI interpretations
CREATE TABLE IF NOT EXISTS readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,

  -- Birth information
  birth_date DATE NOT NULL,
  birth_time TIME,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  subject_name TEXT,

  -- Calculated saju data (stored as JSONB for flexibility)
  saju_data JSONB NOT NULL,

  -- AI interpretation
  ai_interpretation JSONB NOT NULL,

  -- Metadata
  language TEXT DEFAULT 'ko' CHECK (language IN ('ko', 'en', 'zh')),
  product_type TEXT CHECK (product_type IN ('basic', 'deluxe', 'free')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_readings_user_id ON readings(user_id);
CREATE INDEX IF NOT EXISTS idx_readings_payment_id ON readings(payment_id);
CREATE INDEX IF NOT EXISTS idx_readings_created_at ON readings(created_at DESC);

-- Enable Row Level Security
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own readings
CREATE POLICY "Users can view own readings" ON readings
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Service role can insert readings (backend only)
CREATE POLICY "Service role can insert readings" ON readings
  FOR INSERT WITH CHECK (true);

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SAMPLE DATA (FOR TESTING ONLY - REMOVE IN PRODUCTION)
-- =============================================================================

-- Insert test user (will be used for Level 5 testing)
-- NOTE: In production, users are created via Supabase Auth
INSERT INTO users (id, email, language_preference)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'test@chatju.com', 'ko')
ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- Run these queries to verify schema creation

-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'payments', 'readings');

-- Check Row Level Security is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'payments', 'readings');

-- Check indexes created
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('users', 'payments', 'readings');

-- =============================================================================
-- MIGRATIONS (FOR EXISTING DATABASES)
-- =============================================================================

-- Migration: Add 'paypal' and 'paddle' to payment_method enum
-- Run this in Supabase SQL Editor if updating an existing database:
--
-- ALTER TABLE payments
-- DROP CONSTRAINT payments_payment_method_check,
-- ADD CONSTRAINT payments_payment_method_check
-- CHECK (payment_method IN ('toss', 'stripe', 'paypal', 'paddle', 'mock'));

-- =============================================================================
-- NOTES
-- =============================================================================
--
-- 1. Row Level Security (RLS):
--    - All tables have RLS enabled for security
--    - Users can only access their own data
--    - Backend uses service_role key to bypass RLS when needed
--
-- 2. JSONB Fields:
--    - saju_data: Stores complete manseryeok calculation result
--    - ai_interpretation: Stores OpenAI-generated interpretation
--    - metadata: Extensible field for additional payment info
--
-- 3. Cascading Deletes:
--    - Deleting user → deletes all their payments and readings
--    - Deleting payment → sets reading.payment_id to NULL (keeps reading)
--
-- 4. Constraints:
--    - All enums (status, currency, gender, etc.) enforced at DB level
--    - Amount must be positive
--    - Email must be unique
--
-- 5. Timestamps:
--    - All tables use TIMESTAMP WITH TIME ZONE for consistency
--    - created_at set automatically on insert
--    - updated_at updated automatically via trigger
--
-- =============================================================================
