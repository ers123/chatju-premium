// 리포트 표지에 찍히는 날짜.
//
// 원래는 `new Date(generatedAt).toISOString().split('T')[0]` 이었다. 이것은 항상
// UTC 날짜라서, KST/JST 사용자가 00:00~09:00 사이에 리포트를 만들면 표지에
// **전날 날짜**가 찍힌다. 하루 중 9시간이 그 구간이다. 유료 상품 표지 첫 줄에서
// 눈에 띄는 오류라 그대로 둘 수 없다.
//
// 읽는 사람의 타임존을 알면 그것을 쓰고(프론트가 입력 단계에서 보낸다),
// 모르면 서비스가 이미 다른 곳에서 쓰고 있는 기본값(Asia/Seoul)으로 떨어진다.
// UTC로 떨어뜨리지 않는 이유는, UTC는 어느 사용자에게도 맞지 않는 값이기 때문이다.

const DEFAULT_TIME_ZONE = 'Asia/Seoul';

/**
 * @param {string|Date} generatedAt - ISO 문자열 또는 Date
 * @param {string} [timeZone] - IANA 타임존. 유효하지 않으면 기본값으로 떨어진다.
 * @returns {string} YYYY-MM-DD
 */
function formatReportDate(generatedAt, timeZone) {
  const date = generatedAt instanceof Date ? generatedAt : new Date(generatedAt);
  if (Number.isNaN(date.getTime())) return formatReportDate(new Date(), timeZone);

  for (const zone of [timeZone, DEFAULT_TIME_ZONE]) {
    if (!zone || typeof zone !== 'string') continue;
    try {
      // en-CA는 YYYY-MM-DD를 내므로 직접 조립할 필요가 없다.
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: zone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date);
    } catch {
      // 알 수 없는 타임존 문자열 — 다음 후보로 넘어간다.
    }
  }
  return date.toISOString().slice(0, 10);
}

module.exports = { formatReportDate, DEFAULT_TIME_ZONE };
