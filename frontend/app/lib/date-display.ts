// 사용자에게 보여 주는 생년월일.
//
// 입력 마법사는 `2017.06.14` 형태로 저장한다(백엔드가 이 형식을 받는다). 점으로
// 끊는 표기는 한국·일본의 관행인데 열 개 언어가 전부 그 표기를 보고 있었다.
// 저장 형식은 그대로 두고 화면에 그릴 때만 독자의 관행으로 옮긴다.
//
// 백엔드 `utils/report-date.js`의 같은 이름 함수와 짝이다. PDF와 화면이 다른
// 날짜를 보여 주면 안 되므로 로케일 표와 형식(dateStyle: 'long')을 맞춰 둔다.
const DISPLAY_LOCALES: Record<string, string> = {
  ko: 'ko-KR',
  en: 'en-US',
  ja: 'ja-JP',
  zh: 'zh-CN',
  vi: 'vi-VN',
  id: 'id-ID',
  es: 'es-ES',
  pt: 'pt-BR',
  fr: 'fr-FR',
  // 태국 로케일의 기본 달력은 불기(2560년)다. 리포트의 다른 연도 표기와 어긋나므로
  // 그레고리력으로 고정한다.
  th: 'th-TH-u-ca-gregory',
}

/**
 * `YYYY.MM.DD` 또는 `YYYY-MM-DD`를 독자 언어의 날짜 표기로 옮긴다.
 * 해석할 수 없는 값은 손대지 않고 그대로 돌려준다 — 빈 칸을 남기는 것보다 낫다.
 */
export function formatBirthDateForDisplay(birthDate: string | undefined, lang: string): string {
  if (!birthDate) return ''

  const parts = birthDate.trim().match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/)
  if (!parts) return birthDate

  const [, year, month, day] = parts
  // UTC 정오. 자정으로 만들면 브라우저 타임존에 따라 하루가 밀린다.
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12))
  if (Number.isNaN(date.getTime())) return birthDate

  try {
    return new Intl.DateTimeFormat(DISPLAY_LOCALES[lang] || DISPLAY_LOCALES.en, {
      timeZone: 'UTC',
      dateStyle: 'long',
    }).format(date)
  } catch {
    return birthDate
  }
}
