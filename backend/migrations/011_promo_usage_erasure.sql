-- ============================================
-- Migration 011: 프로모 리포트가 삭제되지 않던 문제
--
-- 무엇이 잘못돼 있었나 (2026-08-18 공유 링크 검증 중 발견):
--   promo_usage.reading_id 가 readings(id)를 ON DELETE 규칙 없이 참조한다.
--   그래서 프로모로 만든 리포트는 **삭제 자체가 거부된다**:
--     update or delete on table "readings" violates foreign key constraint
--     "promo_usage_reading_id_fkey" on table "promo_usage"
--   실측 28건 중 19건(프로모 리딩 전부)이 삭제 불가 상태였다.
--
-- 왜 심각한가:
--   1. 어제 자동화한 보존기간 청소(매월 1일)가 이 행들에서 **조용히 실패**한다.
--      privacy policy 는 365일 삭제를 공개하고 있는데, 가장 오래된 리딩이
--      2026-03-20 이므로 2027-03-20 에 그 약속이 깨진다.
--   2. 삭제권(GDPR Art 17 / PIPA 제36조) 요청도 같은 이유로 이행 불가다.
--   3. DPIA(docs/DPIA_2026-08-13.md) §3.3 이 "365일 후 삭제"를 통제 수단으로
--      적어 두었는데, 그 통제가 프로모 경로에서 작동하지 않고 있었다.
--
-- 어떻게 고치나:
--   reading_id 를 ON DELETE SET NULL 로 바꾼다. 프로모 **사용 기록 자체는 남겨야**
--   한다(같은 코드 재사용을 막는 근거). 다만 그 기록이 아이 데이터를 붙들고 있을
--   이유는 없으므로, 리포트가 지워지면 연결만 끊는다.
--
--   그리고 promo_usage 가 들고 있던 아이 이름·생년월일도 함께 비운다. 재사용 방지에
--   필요한 것은 (프로모 코드, 이메일) 쌍이지 아이 정보가 아니다 — 애초에 저장할
--   이유가 없던 값이고, 남겨두면 리포트를 지워도 아이 데이터가 남는다.
--
-- Supabase SQL Editor에서 실행.
-- ============================================

-- 1) FK 를 ON DELETE SET NULL 로 교체
ALTER TABLE promo_usage DROP CONSTRAINT IF EXISTS promo_usage_reading_id_fkey;
ALTER TABLE promo_usage
  ADD CONSTRAINT promo_usage_reading_id_fkey
  FOREIGN KEY (reading_id) REFERENCES readings(id) ON DELETE SET NULL;

-- 2) 리포트가 이미 사라진 사용 기록의 아이 데이터를 비운다.
--    (연결이 끊긴 뒤에도 아이 이름이 남아 있으면 삭제가 삭제가 아니다.)
UPDATE promo_usage
SET child_name = NULL, child_birth_date = NULL
WHERE reading_id IS NULL;

-- 3) 앞으로 리포트가 지워질 때 아이 데이터도 같이 비도록 트리거를 건다.
--    SET NULL 은 reading_id 만 비우고 child_name 은 그대로 두기 때문이다.
CREATE OR REPLACE FUNCTION clear_promo_usage_child_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE promo_usage
  SET child_name = NULL, child_birth_date = NULL
  WHERE reading_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_clear_promo_child_data ON readings;
CREATE TRIGGER trg_clear_promo_child_data
  BEFORE DELETE ON readings
  FOR EACH ROW EXECUTE FUNCTION clear_promo_usage_child_data();
