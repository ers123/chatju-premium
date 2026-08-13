-- ============================================
-- Migration 009: 퍼널 계측 (개인정보 0)
--
-- 왜: 주간 다이제스트는 리포트·결제·별점을 본다. 안 보이는 것은 **몇 명이
-- 프리뷰까지 왔는가**다. 프리뷰는 설계상 DB에 저장하지 않으므로(개인정보 약속)
-- 카운터도 없고, GA는 동의 게이트 뒤라 거부한 사용자를 못 잡는다.
-- 그래서 캠페인을 돌려도 "프리뷰에서 이탈"과 "가격에서 이탈"을 구분할 수 없다.
--
-- 무엇을 저장하는가: 날짜 · 이벤트명 · 언어 · 숫자. 그게 전부다.
-- 저장하지 않는 것: IP, user-agent, 세션·방문자 식별자, 생년월일, 이메일.
-- 행 하나가 한 사람에 대응하지 않으므로 되짚을 대상 자체가 없다.
--
-- 한계(알고 쓰는 것): 이것은 **이벤트 수**이지 사람 수가 아니다. 같은 사람이
-- 프리뷰를 세 번 만들면 3이다. 방문자 단위가 필요해지면 그때 별도 결정한다 —
-- 방문자 단위는 어떤 형태로든 식별자를 만들어야 하고, 그건 지금 약속을 바꾼다.
--
-- Supabase SQL Editor에서 실행.
-- ============================================

CREATE TABLE IF NOT EXISTS funnel_daily (
  day        DATE NOT NULL,
  event      TEXT NOT NULL,
  language   TEXT NOT NULL DEFAULT 'unknown',
  hits       BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (day, event, language)
);

CREATE INDEX IF NOT EXISTS funnel_daily_day_idx ON funnel_daily (day DESC);

-- 서비스 롤만. 익명 키로는 읽지도 쓰지도 못한다.
ALTER TABLE funnel_daily ENABLE ROW LEVEL SECURITY;

-- 원자적 증가. 애플리케이션에서 SELECT → +1 → UPDATE를 하면 동시 요청이
-- 서로를 덮어쓴다(Lambda는 병렬로 뜬다). upsert 한 문장으로 끝낸다.
CREATE OR REPLACE FUNCTION bump_funnel_counter(
  p_day DATE,
  p_event TEXT,
  p_language TEXT,
  p_delta INT DEFAULT 1
) RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO funnel_daily (day, event, language, hits, updated_at)
  VALUES (p_day, p_event, COALESCE(NULLIF(p_language, ''), 'unknown'), p_delta, now())
  ON CONFLICT (day, event, language)
  DO UPDATE SET hits = funnel_daily.hits + EXCLUDED.hits,
                updated_at = now();
$$;

-- 익명 키에게는 주지 않는다. 백엔드(service_role)만 부른다.
REVOKE ALL ON FUNCTION bump_funnel_counter(DATE, TEXT, TEXT, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION bump_funnel_counter(DATE, TEXT, TEXT, INT) FROM anon;
