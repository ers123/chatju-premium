// 공유 링크 — 팔로워가 필요 없는 유일한 배포 경로.
//
// 왜 있는가: Threads 팔로워 0명, 마지막 게시물 2025-09. 콘텐츠를 아무리 만들어도
// 볼 사람이 없다. 반면 프리뷰를 본 부모는 이미 여기 있고, "우리 애는 화 3, 수 0"은
// 원래 공유하고 싶어지는 종류의 결과다. 지금까지는 이미지 한 장만 공유되고 눌러
// 들어올 링크가 없어서 루프가 닫히지 않았다.
//
// 개인정보 원칙(docs/DPIA_2026-08-13.md):
//   - **아이 이름·생년월일은 공유 데이터에 존재하지 않는다.** 이 파일 어디에서도
//     읽지 않는다 — 실수로 넣을 수 있는 경로를 만들지 않는 것이 최선의 방어다.
//   - 부모가 명시적으로 만들 때까지 토큰은 존재하지 않는다(옵트인).
//   - 언제든 철회 가능하고, 철회하면 즉시 404.

const crypto = require('crypto');

const getDb = () => require('../config/supabase').supabaseAdmin;

/** 추측 불가능한 공유 토큰. readings.id 를 재사용하지 않는다. */
function newShareToken() {
  return crypto.randomBytes(16).toString('base64url'); // 22자
}

/**
 * saju_data 에서 **공유해도 되는 것만** 뽑는다.
 * 화이트리스트 방식이다 — 원본을 그대로 넘기고 민감한 키를 지우는 방식이면
 * 새 필드가 추가될 때마다 조용히 새는 쪽으로 실패한다.
 */
function publicSummaryFrom(sajuData) {
  const counts = sajuData?.elements || {};
  const keys = ['wood', 'fire', 'earth', 'metal', 'water'];
  const elementCounts = {};
  for (const k of keys) elementCounts[k] = Number(counts[k]) || 0;

  // 가장 많은 오행. 동수면 목→화→토→금→수 순서로 하나를 고른다(표시용이라
  // 결정론적이기만 하면 된다).
  let dominant = null;
  let max = -1;
  for (const k of keys) {
    if (elementCounts[k] > max) { max = elementCounts[k]; dominant = k; }
  }
  return { dominantElement: dominant, elementCounts };
}

/**
 * 공유 링크 생성(또는 기존 링크 반환).
 * 호출부가 **이미 소유 증명을 끝낸 뒤** 부른다 — 이 함수는 인증하지 않는다.
 */
async function createShare(reading) {
  const db = getDb();
  const { data: existing } = await db
    .from('report_shares')
    .select('token, revoked_at')
    .eq('reading_id', reading.id)
    .maybeSingle();

  if (existing && !existing.revoked_at) return { token: existing.token, reused: true };

  const summary = publicSummaryFrom(reading.saju_data);
  const token = newShareToken();

  if (existing) {
    // 철회했다가 다시 켜는 경우: **새 토큰을 준다.** 옛 링크가 되살아나면
    // "껐다"는 부모의 결정이 취소되는 셈이다.
    await db.from('report_shares').delete().eq('reading_id', reading.id);
  }

  const { error } = await db.from('report_shares').insert([{
    token,
    reading_id: reading.id,
    dominant_element: summary.dominantElement,
    element_counts: summary.elementCounts,
    language: reading.language || 'ko',
  }]);
  if (error) throw new Error(error.message);
  return { token, reused: false };
}

/** 공개 조회. 없거나 철회됐으면 null. */
async function getShare(token) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const { data } = await getDb()
    .from('report_shares')
    .select('token, dominant_element, element_counts, language, revoked_at')
    .eq('token', token)
    .maybeSingle();
  if (!data || data.revoked_at) return null;
  return {
    dominantElement: data.dominant_element,
    elementCounts: data.element_counts || {},
    language: data.language || 'ko',
  };
}

async function revokeShare(readingId) {
  const { error } = await getDb()
    .from('report_shares')
    .update({ revoked_at: new Date().toISOString() })
    .eq('reading_id', readingId);
  return !error;
}

/** 조회수. 실패해도 페이지는 떠야 하므로 절대 throw 하지 않는다. */
async function countShareView(token) {
  try {
    await getDb().rpc('bump_share_view', { p_token: token });
  } catch { /* 계측이 공유 페이지를 막지 않는다 */ }
}

module.exports = { createShare, getShare, revokeShare, countShareView, publicSummaryFrom, newShareToken };
