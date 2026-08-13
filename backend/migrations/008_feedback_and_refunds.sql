-- ============================================
-- Migration 008: 실사용자 신호 수집 (리뷰 + 환불)
--
-- 왜: 리포트 품질을 LLM 심판으로 올릴 만큼 올렸고(warmth 2.6→3.1), 그 위는
-- 심판 노이즈(±0.67)에 묻힌다. 다음 신호는 돈을 낸 사람이 준다 —
-- 별점과 환불. 둘 다 지금은 **아무 데도 기록되지 않는다.**
--
-- Supabase SQL Editor에서 실행.
-- ============================================

-- 1) 리포트 평가 ------------------------------------------------------------
-- 한 리포트에 한 번. 별점만 남기고 갈 수 있어야 하므로 comment는 선택.
-- 이메일·이름 등 새 개인정보를 만들지 않는다 — reading_id로만 잇는다.
CREATE TABLE IF NOT EXISTS report_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reading_id UUID NOT NULL REFERENCES readings(id) ON DELETE CASCADE,

  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT CHECK (comment IS NULL OR char_length(comment) <= 2000),

  -- 신호를 원인에 잇기 위한 사본. readings에서 조인해도 되지만, 리포트가
  -- 지워져도(보존기간 만료) 집계는 남아야 하므로 여기에 복사해 둔다.
  language TEXT,
  prompt_version TEXT,
  product_type TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 리포트 하나당 평가 하나. 같은 사람이 다시 보내면 UPDATE로 덮는다.
CREATE UNIQUE INDEX IF NOT EXISTS report_feedback_reading_uniq
  ON report_feedback (reading_id);

CREATE INDEX IF NOT EXISTS report_feedback_created_idx
  ON report_feedback (created_at DESC);

-- 서비스 롤만 접근한다(백엔드 전용). 익명 키로는 읽지도 쓰지도 못한다.
ALTER TABLE report_feedback ENABLE ROW LEVEL SECURITY;

-- 2) 환불 추적 --------------------------------------------------------------
-- 웹훅은 PAYPAL_WEBHOOK_ID가 없으면 프로덕션에서 fail-closed로 거부된다.
-- 그래서 환불 상태는 폴링으로도 채운다(scripts/sync-payment-status.js).
-- 어느 경로로 확인했는지와 시각을 남겨 두면, 나중에 웹훅을 켰을 때
-- 폴링이 놓친 구간이 있었는지 알 수 있다.
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status_source TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status_checked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS payments_status_idx ON payments (status);
