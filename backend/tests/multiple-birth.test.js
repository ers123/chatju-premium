const { buildMultipleBirthSection } = require('../src/utils/multiple-birth');

describe('multiple birth interpretation context', () => {
  test('same-sex identical-chart twins are differentiated by expression, not invented chart changes', () => {
    const section = buildMultipleBirthSection({
      order: 1,
      total: 2,
      sameSex: true,
      siblingName: '민준',
    });

    expect(section).toContain('첫째');
    expect(section).toContain('동성');
    expect(section).toContain('같은 사주');
    expect(section).toContain('서로 다른 사주처럼 꾸며내지 마세요');
    expect(section).toContain('양/음 표현');
    expect(section).toContain('부모의 반응');
  });

  test('different-sex multiples mention gender-dependent 운 flow without changing pillars', () => {
    const section = buildMultipleBirthSection({
      order: 2,
      total: 3,
      sameSex: false,
    });

    expect(section).toContain('둘째');
    expect(section).toContain('세쌍둥이');
    expect(section).toContain('성별이 다르면');
    expect(section).toContain('대운 방향');
    expect(section).toContain('사주 원국 자체를 임의로 바꾸지 마세요');
  });
});
