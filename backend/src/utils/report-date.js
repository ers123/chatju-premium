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

// 표지에 찍히는 아이의 생년월일.
//
// 프론트가 `2017.06.14` 형태로 보낸다. 점으로 끊는 표기는 한국·일본에서만 쓰이는
// 관행인데 열 개 언어 전부가 그 표기를 받고 있었다. 프랑스 독자에게 `2017.06.14`는
// 낯설고, 미국 독자에게는 월/일 순서가 뒤집힌 것처럼 읽힐 여지도 있다.
//
// 달력은 그레고리력으로 고정한다. 태국 로케일의 기본값은 불기(2560년)라서, 그대로
// 두면 리포트 안의 다른 연도 표기(대운·세운)와 어긋난다.
const DISPLAY_LOCALES = {
  ko: 'ko-KR',
  en: 'en-US',
  ja: 'ja-JP',
  zh: 'zh-CN',
  vi: 'vi-VN',
  id: 'id-ID',
  es: 'es-ES',
  pt: 'pt-BR',
  fr: 'fr-FR',
  th: 'th-TH-u-ca-gregory',
};

/**
 * @param {string} birthDate - `YYYY.MM.DD` 또는 `YYYY-MM-DD`
 * @param {string} [language] - 서비스 언어 코드(ko, en, ja …)
 * @returns {string} 해당 언어의 관행에 맞는 날짜. 해석 불가면 입력을 그대로 돌려준다.
 */
function formatBirthDate(birthDate, language) {
  if (typeof birthDate !== 'string') return '';

  const parts = birthDate.trim().match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/);
  // 형식이 예상과 다르면 손대지 않는다. 표지에 빈 칸을 남기는 것보다 낫다.
  if (!parts) return birthDate;

  const [, year, month, day] = parts;
  // UTC 정오로 만든다. 자정으로 만들면 포매터의 타임존에 따라 하루가 밀린다.
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
  if (Number.isNaN(date.getTime())) return birthDate;

  try {
    return new Intl.DateTimeFormat(DISPLAY_LOCALES[language] || DISPLAY_LOCALES.en, {
      timeZone: 'UTC',
      dateStyle: 'long',
    }).format(date);
  } catch {
    return birthDate;
  }
}

module.exports = { formatReportDate, formatBirthDate, DEFAULT_TIME_ZONE, DISPLAY_LOCALES };
