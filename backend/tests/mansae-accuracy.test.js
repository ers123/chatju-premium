/**
 * Manseryeok (만세력) Accuracy Test Suite
 *
 * Verification method:
 * - Year pillars: Verified via (year - 4) % 10/12 formula, anchored to 1984=甲子
 * - Day pillars: Verified via Julian Day Number formula: (JDN + 49) % 60
 * - Month pillars: Derived from solar term boundaries + year stem (둔간법)
 * - Hour pillars: Derived from day stem + branch index (둔간법)
 *
 * Year and day pillars are independently verifiable via pure math.
 * Month and hour pillars depend on solar term tables and 둔간법 rules.
 */

const { calculateMansae } = require('../src/utils/mansae-wrapper');

describe('Manseryeok Four Pillar Calculations', () => {
  // ============================================================
  // Standard cases across decades (no location = no solar correction)
  // ============================================================
  const standardCases = [
    {
      desc: '1960-03-15 08:30 남 — 경자년',
      date: '1960-03-15', time: '08:30', gender: '남',
      expected: { year: '경자', month: '기묘', day: '임인', hour: '갑진' },
    },
    {
      desc: '1975-07-20 14:00 여 — 을묘년',
      date: '1975-07-20', time: '14:00', gender: '여',
      expected: { year: '을묘', month: '계미', day: '정묘', hour: '정미' },
    },
    {
      desc: '1985-01-10 06:15 남 — 갑자년 (입춘 전)',
      date: '1985-01-10', time: '06:15', gender: '남',
      expected: { year: '갑자', month: '정축', day: '기유', hour: '정묘' },
    },
    {
      desc: '1990-05-15 10:00 여 — 경오년',
      date: '1990-05-15', time: '10:00', gender: '여',
      expected: { year: '경오', month: '신사', day: '경진', hour: '신사' },
    },
    {
      desc: '2000-12-25 22:00 남 — 경진년',
      date: '2000-12-25', time: '22:00', gender: '남',
      expected: { year: '경진', month: '무자', day: '정사', hour: '신해' },
    },
    {
      desc: '2010-08-08 03:30 여 — 경인년',
      date: '2010-08-08', time: '03:30', gender: '여',
      expected: { year: '경인', month: '갑신', day: '경인', hour: '무인' },
    },
  ];

  test.each(standardCases)('$desc', ({ date, time, gender, expected }) => {
    const result = calculateMansae(date, time, gender);
    expect(result.error).toBeUndefined();
    expect(result.pillars.year.korean).toBe(expected.year);
    expect(result.pillars.month.korean).toBe(expected.month);
    expect(result.pillars.day.korean).toBe(expected.day);
    expect(result.pillars.hour.korean).toBe(expected.hour);
  });

  // ============================================================
  // Leap year
  // ============================================================
  test('2020-02-29 12:00 남 — Leap year birth', () => {
    const result = calculateMansae('2020-02-29', '12:00', '남');
    expect(result.error).toBeUndefined();
    expect(result.pillars.year.korean).toBe('경자');
    expect(result.pillars.month.korean).toBe('무인');
    expect(result.pillars.day.korean).toBe('임인');
    expect(result.pillars.hour.korean).toBe('병오');
  });

  // ============================================================
  // Solar term boundary (입춘 around Feb 4)
  // ============================================================
  test('2000-02-04 09:00 여 — Before 입춘 boundary', () => {
    const result = calculateMansae('2000-02-04', '09:00', '여');
    expect(result.error).toBeUndefined();
    expect(result.pillars.year.korean).toBe('기묘');
    expect(result.pillars.month.korean).toBe('정축');
    expect(result.pillars.day.korean).toBe('임진');
    expect(result.pillars.hour.korean).toBe('을사');
  });

  test('2000-02-04 22:00 여 — After 입춘 boundary', () => {
    const result = calculateMansae('2000-02-04', '22:00', '여');
    expect(result.error).toBeUndefined();
    expect(result.pillars.year.korean).toBe('경진');
    expect(result.pillars.month.korean).toBe('무인');
  });

  test('1983-02-04 18:30 여 — Before exact 입춘 keeps 축월', () => {
    const result = calculateMansae('1983-02-04', '18:30', '여');
    expect(result.error).toBeUndefined();
    expect(result.pillars.year.korean).toBe('임술');
    expect(result.pillars.month.korean).toBe('계축');
  });

  test('1983-02-04 18:45 여 — After exact 입춘 moves to 인월', () => {
    const result = calculateMansae('1983-02-04', '18:45', '여');
    expect(result.error).toBeUndefined();
    expect(result.pillars.year.korean).toBe('계해');
    expect(result.pillars.month.korean).toBe('갑인');
  });

  test('2024-03-05 12:00 남 — After exact 경칩 moves to 묘월', () => {
    const result = calculateMansae('2024-03-05', '12:00', '남');
    expect(result.error).toBeUndefined();
    expect(result.pillars.year.korean).toBe('갑진');
    expect(result.pillars.month.korean).toBe('정묘');
  });

  test('1983-01-26 12:00 여 — Before 입춘 should still be 임술년', () => {
    const result = calculateMansae('1983-01-26', '12:00', '여');
    expect(result.error).toBeUndefined();
    expect(result.pillars.year.korean).toBe('임술');
    expect(result.pillars.year.hanja).toBe('壬戌');
    expect(result.pillars.year.element).toBe('수 + 토');
    expect(result.pillars.month.korean).toBe('계축');
  });

  test('1983-02-05 12:00 여 — After 입춘 should be 계해년', () => {
    const result = calculateMansae('1983-02-05', '12:00', '여');
    expect(result.error).toBeUndefined();
    expect(result.pillars.year.korean).toBe('계해');
    expect(result.pillars.year.hanja).toBe('癸亥');
    expect(result.pillars.year.element).toBe('수 + 수');
  });

  test('lunar 1983-01-26 12:00 여 — Converts to solar 1983-03-10 before calculation', () => {
    const result = calculateMansae('1983-01-26', '12:00', '여', { isLunar: true });
    expect(result.error).toBeUndefined();
    expect(result.input.birthDate).toBe('1983-01-26');
    expect(result.input.solarDate).toBe('1983-03-10');
    expect(result.input.isLunar).toBe(true);
    expect(result.pillars.year.korean).toBe('계해');
    expect(result.pillars.month.korean).toBe('을묘');
    expect(result.pillars.day.korean).toBe('정유');
    expect(result.pillars.hour.korean).toBe('병오');
  });

  // ============================================================
  // 야자시 (夜子時) edge cases — hour 23:00-23:59
  // ============================================================
  describe('야자시 (Night Zi Hour) handling', () => {
    test('23:30 birth — should use next day stem for hour pillar', () => {
      const result = calculateMansae('1990-05-15', '23:30', '남');
      expect(result.error).toBeUndefined();
      // Branch should be 子 (자)
      expect(result.pillars.hour.korean).toMatch(/자$/);
      // Hour pillar uses next day's stem (경진 day → 신사 next day stem)
      expect(result.pillars.hour.korean).toBe('무자');
    });

    test('00:30 birth (early zi hour) — should use current day stem', () => {
      const result = calculateMansae('1990-05-16', '00:30', '남');
      expect(result.error).toBeUndefined();
      // Branch should be 子 (자) — same as 야자시
      expect(result.pillars.hour.korean).toMatch(/자$/);
      // But uses current day's stem (신사 day)
      expect(result.pillars.hour.korean).toBe('무자');
    });

    test('22:59 — should NOT trigger 야자시 (hour 11 = 亥)', () => {
      const result = calculateMansae('1990-05-15', '22:59', '남');
      expect(result.error).toBeUndefined();
      expect(result.pillars.hour.korean).toMatch(/해$/);
    });
  });

  // ============================================================
  // DST warning
  // ============================================================
  describe('Korean DST warning', () => {
    test('1988-07-15 — should flag DST warning', () => {
      const result = calculateMansae('1988-07-15', '14:00', '남');
      expect(result.error).toBeUndefined();
      expect(result.dstWarning).toBe(true);
    });

    test('1987-06-01 — should flag DST warning', () => {
      const result = calculateMansae('1987-06-01', '10:00', '여');
      expect(result.error).toBeUndefined();
      expect(result.dstWarning).toBe(true);
    });

    test('1949-08-15 — should flag DST warning', () => {
      const result = calculateMansae('1949-08-15', '09:00', '남');
      expect(result.error).toBeUndefined();
      expect(result.dstWarning).toBe(true);
    });

    test('1990-05-15 — should NOT flag DST warning (normal year)', () => {
      const result = calculateMansae('1990-05-15', '10:00', '남');
      expect(result.error).toBeUndefined();
      expect(result.dstWarning).toBe(false);
    });

    test('2024-07-15 — should NOT flag DST warning (recent year)', () => {
      const result = calculateMansae('2024-07-15', '14:00', '남');
      expect(result.error).toBeUndefined();
      expect(result.dstWarning).toBe(false);
    });
  });

  // ============================================================
  // Additional decades for coverage
  // ============================================================
  const additionalCases = [
    {
      desc: '1950-06-25 05:00 남 — 경인년 (Korean War start)',
      date: '1950-06-25', time: '05:00', gender: '남',
      expected: { year: '경인', month: '임오', day: '신묘', hour: '신묘' },
    },
    {
      desc: '1970-01-01 00:00 남 — 기유년 (입춘 전)',
      date: '1970-01-01', time: '00:00', gender: '남',
      expected: { year: '기유', month: '병자', day: '신사', hour: '무자' },
    },
    {
      desc: '1995-09-21 16:30 여 — 을해년',
      date: '1995-09-21', time: '16:30', gender: '여',
      expected: { year: '을해', month: '을유', day: '을묘', hour: '갑신' },
    },
    {
      desc: '2005-03-03 11:00 남 — 을유년',
      date: '2005-03-03', time: '11:00', gender: '남',
      expected: { year: '을유', month: '무인', day: '병술', hour: '갑오' },
    },
    {
      desc: '2015-11-11 18:00 여 — 을미년',
      date: '2015-11-11', time: '18:00', gender: '여',
      expected: { year: '을미', month: '정해', day: '신묘', hour: '정유' },
    },
    {
      desc: '2023-06-15 09:30 남 — 계묘년',
      date: '2023-06-15', time: '09:30', gender: '남',
      expected: { year: '계묘', month: '무오', day: '갑진', hour: '기사' },
    },
  ];

  test.each(additionalCases)('$desc', ({ date, time, gender, expected }) => {
    const result = calculateMansae(date, time, gender);
    expect(result.error).toBeUndefined();
    expect(result.pillars.year.korean).toBe(expected.year);
    expect(result.pillars.month.korean).toBe(expected.month);
    expect(result.pillars.day.korean).toBe(expected.day);
    expect(result.pillars.hour.korean).toBe(expected.hour);
  });

  // ============================================================
  // Error handling
  // ============================================================
  describe('Error handling', () => {
    test('invalid date produces null pillar stems (no crash)', () => {
      const result = calculateMansae('not-a-date', '10:00', '남');
      // Should not throw — returns result with null/undefined stems
      expect(result).toBeDefined();
    });
  });

  // ============================================================
  // Structure validation
  // ============================================================
  test('result includes all required fields', () => {
    const result = calculateMansae('2000-01-01', '12:00', '남');
    expect(result.error).toBeUndefined();
    expect(result.pillars).toBeDefined();
    expect(result.elements).toBeDefined();
    expect(result.dayMaster).toBeDefined();
    expect(result.gender).toBe('남');
    expect(result.input).toEqual(expect.objectContaining({
      birthDate: '2000-01-01',
      birthTime: '12:00',
      gender: '남',
      isLunar: false,
      isLeapMonth: false,
      solarDate: '2000-01-01',
    }));
    expect(typeof result.dstWarning).toBe('boolean');

    // Check pillar structure
    for (const key of ['year', 'month', 'day', 'hour']) {
      const p = result.pillars[key];
      expect(p.heavenlyStem).toBeDefined();
      expect(p.earthlyBranch).toBeDefined();
      expect(p.korean).toBeDefined();
      expect(p.hanja).toBeDefined();
      expect(p.element).toBeDefined();
    }

    // Check elements
    expect(result.elements.wood).toBeDefined();
    expect(result.elements.fire).toBeDefined();
    expect(result.elements.earth).toBeDefined();
    expect(result.elements.metal).toBeDefined();
    expect(result.elements.water).toBeDefined();
  });
});
