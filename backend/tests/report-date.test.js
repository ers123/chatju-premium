// 표지·이메일에 찍히는 날짜 두 종류.
//
// 두 결함에서 나왔다. (1) 표지 날짜가 UTC라 KST/JST 독자는 하루 중 9시간 동안
// 전날 날짜를 봤다. (2) 생년월일을 `2017.06.14`로 찍었는데, 그 표기는 한국·일본의
// 관행이지 프랑스나 미국 독자의 것이 아니다.

const { formatReportDate, formatBirthDate } = require('../src/utils/report-date');

describe('formatReportDate', () => {
  it('KST 새벽에 만든 리포트가 전날로 찍히지 않는다', () => {
    // 2026-08-12 01:00 KST = 2026-08-11 16:00 UTC. UTC로 찍으면 8/11이 된다.
    expect(formatReportDate('2026-08-11T16:00:00Z', 'Asia/Seoul')).toBe('2026-08-12');
  });

  it('타임존을 모르면 서울로 떨어진다 — UTC로는 떨어지지 않는다', () => {
    expect(formatReportDate('2026-08-11T16:00:00Z')).toBe('2026-08-12');
    expect(formatReportDate('2026-08-11T16:00:00Z', 'Not/AZone')).toBe('2026-08-12');
  });

  it('독자의 타임존을 알면 그것을 쓴다', () => {
    // 같은 순간이 뉴욕에서는 아직 8월 11일 정오다.
    expect(formatReportDate('2026-08-11T16:00:00Z', 'America/New_York')).toBe('2026-08-11');
  });
});

describe('formatBirthDate', () => {
  it('언어마다 그 언어의 관행으로 찍는다', () => {
    expect(formatBirthDate('2017.06.14', 'ko')).toBe('2017년 6월 14일');
    expect(formatBirthDate('2017.06.14', 'en')).toBe('June 14, 2017');
    expect(formatBirthDate('2017.06.14', 'fr')).toBe('14 juin 2017');
    expect(formatBirthDate('2017.06.14', 'ja')).toBe('2017年6月14日');
  });

  it('태국어는 불기가 아니라 그레고리력으로 찍는다', () => {
    // 태국 로케일의 기본값은 불기(2560)다. 리포트의 대운·세운 연도와 어긋난다.
    const th = formatBirthDate('2017.06.14', 'th');
    expect(th).toContain('2017');
    expect(th).not.toContain('2560');
  });

  it('점 표기와 하이픈 표기를 모두 받는다', () => {
    expect(formatBirthDate('2017-06-14', 'en')).toBe(formatBirthDate('2017.06.14', 'en'));
  });

  it('타임존 때문에 하루가 밀리지 않는다', () => {
    // UTC 자정으로 만들면 서쪽 타임존에서 6월 13일이 된다.
    expect(formatBirthDate('2017.06.14', 'en')).toContain('14');
  });

  it('해석할 수 없는 값은 손대지 않는다', () => {
    expect(formatBirthDate('unknown', 'en')).toBe('unknown');
    expect(formatBirthDate('', 'en')).toBe('');
    expect(formatBirthDate(undefined, 'en')).toBe('');
  });

  it('모르는 언어 코드는 영어로 떨어진다', () => {
    expect(formatBirthDate('2017.06.14', 'xx')).toBe('June 14, 2017');
  });
});
