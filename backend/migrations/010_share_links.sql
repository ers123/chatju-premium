-- ============================================
-- Migration 010: 공유 링크 (아이 이름·생년월일 없음)
--
-- 왜: Threads 팔로워 0명, 마지막 게시물 2025-09. 콘텐츠를 아무리 만들어도 볼
-- 사람이 없다. **팔로워가 필요 없는 유일한 배포 경로는 제품 자신**이다 —
-- 프리뷰를 본 부모가 결과를 공유하고, 받은 사람이 눌러서 들어온다.
-- 지금은 이미지 한 장만 공유되고 눌러 들어올 링크가 없어서 루프가 닫히지 않는다.
--
-- 개인정보 설계 (docs/DPIA_2026-08-13.md 기준):
--   1. **아이 이름을 넣지 않는다.** 공개 URL에 아동 식별자가 박히면 되돌릴 수 없다.
--      공유 페이지는 "우리 아이는 화(火) 기질" 수준의 오행 결과만 보여준다.
--   2. **생년월일·출생시각도 내보내지 않는다.** 원본 리포트는 토큰 소지자만 본다.
--   3. **옵트인.** 부모가 버튼을 누르기 전에는 토큰이 존재하지 않는다.
--      즉 링크를 만든 적 없는 리포트는 공유 URL 자체가 없다.
--   4. **철회 가능.** revoked_at 이 찍히면 즉시 404.
--   5. **추측 불가.** readings.id(UUID)를 재사용하지 않는다 — 그 id는 다른 경로에
--      쓰이므로, 공유용으로 노출하면 두 권한이 한 값에 묶인다.
--
-- Supabase SQL Editor에서 실행.
-- ============================================

CREATE TABLE IF NOT EXISTS report_shares (
  token       TEXT PRIMARY KEY,
  reading_id  UUID NOT NULL REFERENCES readings(id) ON DELETE CASCADE,

  -- 공유 페이지가 보여줄 값만 복사해 둔다. 조인하지 않는 이유: 보존기간이 지나
  -- 리포트가 지워져도 이미 나간 링크가 500을 뱉으면 안 되고, 무엇보다 **공유
  -- 경로가 readings 원본에 접근할 이유를 아예 없앤다.**
  dominant_element TEXT,
  element_counts   JSONB,
  language         TEXT,

  view_count  BIGINT NOT NULL DEFAULT 0,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS report_shares_reading_idx ON report_shares (reading_id);

-- 리포트 하나당 링크 하나. 다시 누르면 같은 링크가 나온다(링크가 늘어나면
-- 철회의 의미가 사라진다).
CREATE UNIQUE INDEX IF NOT EXISTS report_shares_reading_uniq ON report_shares (reading_id);

ALTER TABLE report_shares ENABLE ROW LEVEL SECURITY;

-- 조회수 증가는 원자적으로. 공유 링크는 여러 명이 동시에 열 수 있다.
CREATE OR REPLACE FUNCTION bump_share_view(p_token TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE report_shares SET view_count = view_count + 1
  WHERE token = p_token AND revoked_at IS NULL;
$$;

REVOKE ALL ON FUNCTION bump_share_view(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION bump_share_view(TEXT) FROM anon;
