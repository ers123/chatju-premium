const { calculateMansae } = require('../src/utils/mansae-wrapper');
const { calculateFullFortuneCycles } = require('../src/services/daeun.service');

describe('Daeun start age precision', () => {
  test('forward daeun before exact 경칩 uses the next precise term, not the next approximate month', () => {
    const manseryeok = calculateMansae('2024-03-05', '10:00', '남');
    const cycles = calculateFullFortuneCycles(manseryeok, manseryeok.input.solarDate, '남', 2026);

    expect(manseryeok.pillars.month.korean).toBe('병인');
    expect(cycles.daeunInfo.direction).toBe('순행');
    expect(cycles.daeunInfo.daysToTerm).toBe(1);
    expect(cycles.daeunInfo.startAge).toBe(1);
  });

  test('backward daeun before exact 경칩 uses the previous precise term, not same-day approximation', () => {
    const manseryeok = calculateMansae('2024-03-05', '10:00', '여');
    const cycles = calculateFullFortuneCycles(manseryeok, manseryeok.input.solarDate, '여', 2026);

    expect(manseryeok.pillars.month.korean).toBe('병인');
    expect(cycles.daeunInfo.direction).toBe('역행');
    expect(cycles.daeunInfo.daysToTerm).toBeGreaterThanOrEqual(28);
    expect(cycles.daeunInfo.startAge).toBe(10);
  });
});

describe('Fortune cycle de-duplication (same stem/branch ten-god)', () => {
  // 2018-05-05 → 정사 대운(비견/비견) + 2026 병오 세운(겁재/겁재): both pillars have
  // identical stem and branch ten-gods, which previously produced duplicated
  // keywords/advice/descriptions ("도전, 변화, 손재, 도전, 변화, 손재").
  const manseryeok = calculateMansae('2018-05-05', '10:30', '남');
  const cycles = calculateFullFortuneCycles(manseryeok, manseryeok.input.solarDate, '남', 2026);

  test('daeun keywords are de-duplicated and identical descriptions collapse', () => {
    const daeun = cycles.currentDaeun;
    expect(daeun.tenGod.stem).toBe(daeun.tenGod.branch); // precondition: same ten-god
    const kw = daeun.interpretation.keywords;
    expect(kw).toEqual([...new Set(kw)]);
    expect(kw.length).toBe(1);
    expect(daeun.interpretation.branchDescription).toBe('');
  });

  test('seun keywords/advice are de-duplicated and summary has no repeated group', () => {
    const seun = cycles.currentSeun;
    expect(seun.tenGod.stem).toBe(seun.tenGod.branch); // precondition: same ten-god
    expect(seun.interpretation.keywords.length).toBe(1);
    expect(seun.interpretation.advice.length).toBe(1);
    // The duplicated-summary signature was "...손재, 도전, 변화, 손재"; assert the
    // single keyword group appears exactly once in the summary string.
    const group = seun.interpretation.keywords[0];
    const occurrences = cycles.summary.split(group).length - 1;
    expect(occurrences).toBe(1);
  });
});
