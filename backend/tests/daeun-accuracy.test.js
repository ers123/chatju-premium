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
