const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { generateReportPDF, parseNumberedSections, normalizePresentation } = require('../src/services/pdf.service');
const { hasRepeatedContent, adaptMarkdownToPresentation, normalizePresentation: normalizeAdapterPresentation, mergePresentationResult } = require('../src/services/report-presentation');
const { presentation, fixtureMansae, fixtureBasis, createReferenceParams } = require('./generate-reference-premium-report');
const { buildProviderMarkdown } = require('./generate-runtime-ready-report');

const markdown = Array.from({ length: 9 }, (_, index) => `## ${index + 1}. 섹션 ${index + 1}\n내용 ${index + 1}`).join('\n\n');

describe('premium report presentation contract', () => {
  test('keeps nine ordered sections and strips each major heading from its body', () => {
    const sections = parseNumberedSections(markdown);
    expect(sections).toHaveLength(9);
    expect(sections.map((section) => section.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(sections.every((section) => section.content.length > 0)).toBe(true);
    expect(sections.slice(0, 5).every((section) => section.content.length > 0)).toBe(true);
    expect(sections.slice(5).every((section) => section.content.length > 0)).toBe(true);
    expect(sections[0].content).not.toContain('섹션 1');
  });

  test('rejects repeated, missing, or unsupported section sequences', () => {
    const missing = structuredClone(presentation);
    missing.sections = missing.sections.slice(0, 8);
    expect(() => normalizePresentation(missing)).toThrow('1 through 9');
    const duplicated = structuredClone(presentation);
    duplicated.sections[8] = { ...duplicated.sections[8], number: 8 };
    expect(() => normalizePresentation(duplicated)).toThrow('1 through 9');
  });

  test('rejects malformed blocks, unsupported types, and incomplete cover/opening data before rendering', async () => {
    const malformedInsight = structuredClone(presentation);
    malformedInsight.sections[0].blocks[0].basis = '';
    await expect(generateReportPDF({ ...createReferenceParams(), aiInterpretation: { presentationStatus: 'ready', presentation: malformedInsight } }))
      .rejects.toThrow('sections[0].blocks[0].basis');

    const unsupported = structuredClone(presentation);
    unsupported.sections[0].blocks[0].type = 'table';
    expect(() => normalizePresentation(unsupported)).toThrow('does not support sections[0].blocks[0].type');

    const missingCover = structuredClone(presentation);
    missingCover.cover.title = '';
    expect(() => normalizePresentation(missingCover)).toThrow('cover.title');

    const missingOpening = structuredClone(presentation);
    missingOpening.opening.items[0].text = '';
    expect(() => normalizePresentation(missingOpening)).toThrow('opening.items[0].text');
  });

  test('uses Korean-only parenting-card scaffold in the Korean prompt source', () => {
    const prompt = fs.readFileSync(path.resolve(__dirname, '../src/services/saju.service.js'), 'utf8');
    expect(prompt).toContain('[이 아이에게 기억할 5가지]');
    expect(prompt).toContain('리포트 언어로 작성하거나 번역');
    expect(prompt).not.toContain('모든 레이블/볼드 제목은 한국어로 작성.');
    expect(prompt).not.toContain('[5 things to remember about this child]');
    expect(prompt).not.toContain('[3 de-escalation steps when emotions rise]');
  });

  test('derives the visible fixture basis from the local mansae calculation', () => {
    expect(fixtureMansae.pillars.year.hanja).toBe('乙未');
    expect(fixtureMansae.pillars.month.hanja).toBe('丁亥');
    expect(fixtureMansae.pillars.day.hanja).toBe('壬辰');
    expect(fixtureMansae.pillars.hour.hanja).toBe('甲辰');
    expect(fixtureMansae.elements).toEqual({ wood: 2, fire: 1, earth: 3, metal: 0, water: 2 });
    expect(fixtureBasis).toContain('일간 임수(壬水)');
    expect(fixtureBasis).toContain('목2·화1·토3·금0·수2');
  });

  test('renders every major fixture heading and calculated basis exactly once in ten pages', async () => {
    const tmpPdf = path.join(os.tmpdir(), `somyung-presentation-${process.pid}.pdf`);
    const pdf = await generateReportPDF(createReferenceParams());
    fs.writeFileSync(tmpPdf, pdf);
    const text = execFileSync('pdftotext', ['-layout', tmpPdf, '-'], { encoding: 'utf8' });
    for (const section of presentation.sections) {
      expect(text.split(section.title).length - 1).toBe(1);
    }
    expect(text.replace(/\s+/g, '')).toContain(fixtureBasis.replace(/\s+/g, ''));
    expect(text).toContain('7일 양육 실험');
    expect(text).toContain('방법과 한계');
    expect(text).not.toContain('5 things to remember about this child');
    expect(presentation.sections[8].startOnNewPage).toBe(false);
    const info = execFileSync('pdfinfo', [tmpPdf], { encoding: 'utf8' });
    expect(info).toMatch(/Pages:\s+10/);
  });

  test('repetition guard rejects duplicate bodies but permits shared Korean vocabulary', () => {
    const a = '아이가 낯선 전환 앞에서 충분히 생각할 시간을 갖고 첫 단계를 고르면 시작이 쉬워집니다. 부모는 예고와 선택지를 짧게 건네며 회복할 틈을 지켜봅니다.';
    const b = '아이가 낯선 전환 앞에서 충분히 생각할 시간을 갖고 첫 단계를 고르면 시작이 쉬워집니다. 부모는 예고와 선택지를 짧게 건네며 회복할 틈을 지켜봅니다.';
    const c = '숙제 전에는 조명을 낮추고 물을 건네며, 오늘 할 일은 제목 쓰기 한 단계로 좁혀 주세요. 끝난 뒤에는 노력한 지점을 한 문장으로 짚습니다.';
    expect(hasRepeatedContent([a, b])).toBe(true);
    expect(hasRepeatedContent([a, c])).toBe(false);
    expect(hasRepeatedContent([a.replace('을 ', '를 '), a])).toBe(true);
  });

  test('strict Markdown adapter falls back for partial content and unsupported locale', () => {
    expect(adaptMarkdownToPresentation({ fullText: '# 1. 하나\n짧은 내용', manseryeok: fixtureMansae, language: 'ko' })).toEqual(expect.objectContaining({ presentationStatus: 'fallback', presentationStatusReason: 'missing_or_reordered_sections' }));
    expect(adaptMarkdownToPresentation({ fullText: '# 1. one', manseryeok: fixtureMansae, language: 'en' })).toEqual(expect.objectContaining({ presentationStatus: 'fallback', presentationStatusReason: 'unsupported_locale' }));
  });

  test('adapter never trusts fabricated insight basis', () => {
    const labelled = Array.from({ length: 9 }, (_, i) => `# ${i + 1}. 섹션\n보이는 근거: 관찰\n관찰할 모습: 행동\n오늘의 대응: 대응\n오해: 오해\n실제: 실제\n더 나은 반응: 반응`).join('\n');
    const candidate = structuredClone(presentation);
    candidate.sections[0].blocks[0].basis = '개인 운명은 반드시 성공합니다.';
    const result = adaptMarkdownToPresentation({ fullText: labelled, manseryeok: fixtureMansae, candidatePresentation: candidate });
    expect(result.presentationStatus).toBe('fallback');
    expect(result.presentationStatusReason).toBe('insufficient_calculated_basis');
  });

  test('caller-supplied candidate is ignored by the runtime adapter', () => {
    const labelled = Array.from({ length: 9 }, (_, i) => `# ${i + 1}. 섹션 ${i + 1}\n보이는 근거: 관찰 기록 ${i}에서 확인한 장면과 시간대입니다.\n관찰할 모습: 아이가 서로 다른 환경 ${i}에서 보이는 구체적인 행동과 말투를 적습니다.\n오늘의 대응: 부모는 ${i}번째 상황에서 선택지를 좁히고 회복 시간을 보장합니다.\n오해: 오해 ${i}가 생길 수 있습니다.\n실제: 실제 모습은 관찰 가능한 신호 ${i}로 다시 확인합니다.\n더 나은 반응: 반응 ${i}를 한 문장으로 제안하고 다음 관찰을 남깁니다.`).join('\n');
    const result = adaptMarkdownToPresentation({ fullText: labelled, manseryeok: fixtureMansae, candidatePresentation: presentation });
    expect(result.presentationStatus).toBe('fallback');
  });

  test('structurally empty manseryeok is insufficient basis', () => {
    const labelled = Array.from({ length: 9 }, (_, i) => `# ${i + 1}. 섹션 ${i + 1}\n보이는 근거: 관찰\n관찰할 모습: 행동\n오늘의 대응: 대응\n오해: 오해\n실제: 실제\n더 나은 반응: 반응`).join('\n');
    const result = adaptMarkdownToPresentation({ fullText: labelled, manseryeok: { pillars: {}, elements: {} }, candidatePresentation: presentation });
    expect(result).toEqual(expect.objectContaining({ presentationStatus: 'fallback', presentationStatusReason: 'insufficient_calculated_basis' }));
  });

  test('realistic provider-style Korean Markdown reaches ready without candidatePresentation', () => {
    const runtimeResult = adaptMarkdownToPresentation({ fullText: buildProviderMarkdown(), manseryeok: fixtureMansae, fortuneCycles: { daeunList: [{ age: 10 }], seunList: [{ year: 2026 }] }, childName: '민서', generatedAt: '2026-07-22T00:00:00.000Z' });
    expect(runtimeResult.presentationStatus).toBe('ready');
    expect(normalizeAdapterPresentation(runtimeResult.presentation).sections).toHaveLength(9);
  });

  test('allows non-medical healthy parenting phrasing', () => {
    const text = buildProviderMarkdown().replace('아이가 선택지를 고릅니다.', '아이가 건강한 거리두기를 배우며 선택지를 고릅니다.');
    expect(adaptMarkdownToPresentation({ fullText: text, manseryeok: fixtureMansae, fortuneCycles: { daeunList: [{ age: 10 }], seunList: [{ year: 2026 }] }, childName: '민서', generatedAt: '2026-07-22T00:00:00.000Z' }).presentationStatus).toBe('ready');
  });

  test('allows safety disclaimer while rejecting affirmative medical claims', () => {
    const disclaimer = buildProviderMarkdown().replace('이 리포트는 관찰과 대화를 위한 참고 언어입니다.', '이 리포트는 건강 진단이나 운명 확정이 아닙니다. 관찰과 대화를 위한 참고 언어입니다.');
    expect(adaptMarkdownToPresentation({ fullText: disclaimer, manseryeok: fixtureMansae, fortuneCycles: { daeunList: [{ age: 10 }], seunList: [{ year: 2026 }] }, childName: '민서', generatedAt: '2026-07-22T00:00:00.000Z' }).presentationStatus).toBe('ready');
    const providerDisclaimer = buildProviderMarkdown().replace('이 리포트는 관찰과 대화를 위한 참고 언어입니다.', '이 리포트는 건강 진단이나 방위 풍수가 아닙니다. 관찰과 대화를 위한 참고 언어입니다.');
    expect(adaptMarkdownToPresentation({ fullText: providerDisclaimer, manseryeok: fixtureMansae, fortuneCycles: { daeunList: [{ age: 10 }], seunList: [{ year: 2026 }] }, childName: '민서', generatedAt: '2026-07-22T00:00:00.000Z' }).presentationStatus).toBe('ready');
    const slashDisclaimer = buildProviderMarkdown().replace('이 리포트는 관찰과 대화를 위한 참고 언어입니다.', '이 리포트는 건강 진단/운명 확정이 아닙니다. 관찰과 대화를 위한 참고 언어입니다.');
    expect(adaptMarkdownToPresentation({ fullText: slashDisclaimer, manseryeok: fixtureMansae, fortuneCycles: { daeunList: [{ age: 10 }], seunList: [{ year: 2026 }] }, childName: '민서', generatedAt: '2026-07-22T00:00:00.000Z' }).presentationStatus).toBe('ready');
    expect(adaptMarkdownToPresentation({ fullText: `${buildProviderMarkdown()}\n건강 진단이 필요합니다.`, manseryeok: fixtureMansae, fortuneCycles: { daeunList: [{ age: 10 }], seunList: [{ year: 2026 }] }, childName: '민서', generatedAt: '2026-07-22T00:00:00.000Z' }).presentationStatusReason).toBe('unsafe_claim');
  });

  test('accepts provider bullet-card section titles and bracket list headings', () => {
    const text = buildProviderMarkdown()
      .replace('### 세부를 연결하는 힘', '- **[세부를 연결하는 힘]**')
      .replace('### 깊이 묻는 힘', '- **[깊이 묻는 힘]**')
      .replace('### 조율하는 힘', '- **[조율하는 힘]**')
      .replace('[이 아이에게 기억할 5가지]', '- [이 아이에게 기억할 5가지]')
      .replace('[멈출 말 3가지]', '- [멈출 말 3가지]')
      .replace('[시작할 말 3가지]', '- [시작할 말 3가지]')
      .replace('[감정이 높아질 때 3단계]', '- [감정이 높아질 때 3단계]');
    expect(adaptMarkdownToPresentation({ fullText: text, manseryeok: fixtureMansae, fortuneCycles: { daeunList: [{ age: 10 }], seunList: [{ year: 2026 }] }, childName: '민서', generatedAt: '2026-07-22T00:00:00.000Z' }).presentationStatus).toBe('ready');
  });

  test('accepts provider numbered-card section titles', () => {
    const text = buildProviderMarkdown()
      .replace('### 세부를 연결하는 힘', '1) **[세부를 연결하는 힘]**')
      .replace('### 깊이 묻는 힘', '2) **[깊이 묻는 힘]**')
      .replace('### 조율하는 힘', '3) **[조율하는 힘]**');
    expect(adaptMarkdownToPresentation({ fullText: text, manseryeok: fixtureMansae, fortuneCycles: { daeunList: [{ age: 10 }], seunList: [{ year: 2026 }] }, childName: '민서', generatedAt: '2026-07-22T00:00:00.000Z' }).presentationStatus).toBe('ready');
  });

  test('accepts provider bold bracket list headings', () => {
    const text = buildProviderMarkdown()
      .replace('[이 아이에게 기억할 5가지]', '- **[이 아이에게 기억할 5가지]**')
      .replace('[멈출 말 3가지]', '- **[멈출 말 3가지]**')
      .replace('[시작할 말 3가지]', '- **[시작할 말 3가지]**')
      .replace('[감정이 높아질 때 3단계]', '- **[감정이 높아질 때 3단계]**');
    expect(adaptMarkdownToPresentation({ fullText: text, manseryeok: fixtureMansae, fortuneCycles: { daeunList: [{ age: 10 }], seunList: [{ year: 2026 }] }, childName: '민서', generatedAt: '2026-07-22T00:00:00.000Z' }).presentationStatus).toBe('ready');
  });

  test('unknown standalone labels keep provider drift on fallback', () => {
    const text = buildProviderMarkdown().replace('- **이번 달 양육 포커스:**', '- **임의 레이블:** 허용되지 않는 드리프트\n- **이번 달 양육 포커스:**');
    expect(adaptMarkdownToPresentation({ fullText: text, manseryeok: fixtureMansae, fortuneCycles: { daeunList: [{ age: 10 }], seunList: [{ year: 2026 }] }, childName: '민서', generatedAt: '2026-07-22T00:00:00.000Z' }).presentationStatusReason).toBe('partial_required_labels');
  });

  test('allows natural colon-containing continuation lines', () => {
    const text = buildProviderMarkdown().replace('아이가 선택지를 고릅니다.', '아이가 선택지를 고릅니다.\n예를 들어: 숙제 전 10분 예고처럼 짧게 붙여 주세요.');
    expect(adaptMarkdownToPresentation({ fullText: text, manseryeok: fixtureMansae, fortuneCycles: { daeunList: [{ age: 10 }], seunList: [{ year: 2026 }] }, childName: '민서', generatedAt: '2026-07-22T00:00:00.000Z' }).presentationStatus).toBe('ready');
  });

  test('allows optional closing summary label', () => {
    const text = buildProviderMarkdown().replace('- **마무리:** 이 리포트는 관찰과 대화를 위한 참고 언어입니다.', '- **마무리:** 이 리포트는 관찰과 대화를 위한 참고 언어입니다.\n- **요약:** 오늘의 관찰을 한 문장으로 정리합니다.');
    expect(adaptMarkdownToPresentation({ fullText: text, manseryeok: fixtureMansae, fortuneCycles: { daeunList: [{ age: 10 }], seunList: [{ year: 2026 }] }, childName: '민서', generatedAt: '2026-07-22T00:00:00.000Z' }).presentationStatus).toBe('ready');
    const oneLine = buildProviderMarkdown().replace('- **마무리:** 이 리포트는 관찰과 대화를 위한 참고 언어입니다.', '- **마무리:** 이 리포트는 관찰과 대화를 위한 참고 언어입니다.\n- **한 줄 요약:** 오늘의 관찰을 한 문장으로 정리합니다.');
    expect(adaptMarkdownToPresentation({ fullText: oneLine, manseryeok: fixtureMansae, fortuneCycles: { daeunList: [{ age: 10 }], seunList: [{ year: 2026 }] }, childName: '민서', generatedAt: '2026-07-22T00:00:00.000Z' }).presentationStatus).toBe('ready');
    const parenthesized = buildProviderMarkdown().replace('- **마무리:** 이 리포트는 관찰과 대화를 위한 참고 언어입니다.', '- **마무리:** 이 리포트는 관찰과 대화를 위한 참고 언어입니다.\n- **요약(한 문장):** 오늘의 관찰을 한 문장으로 정리합니다.');
    expect(adaptMarkdownToPresentation({ fullText: parenthesized, manseryeok: fixtureMansae, fortuneCycles: { daeunList: [{ age: 10 }], seunList: [{ year: 2026 }] }, childName: '민서', generatedAt: '2026-07-22T00:00:00.000Z' }).presentationStatus).toBe('ready');
  });

  test('named stable fallback reasons', () => {
    expect(adaptMarkdownToPresentation({ fullText: '# 2. x\na\n# 1. y\nb', manseryeok: fixtureMansae, fortuneCycles: { daeunList: [{ age: 1 }] } }).presentationStatusReason).toBe('missing_or_reordered_sections');
    expect(adaptMarkdownToPresentation({ fullText: `${buildProviderMarkdown()}\n건강 치료가 확정됩니다.`, manseryeok: fixtureMansae, fortuneCycles: { daeunList: [{ age: 1 }] } }).presentationStatusReason).toBe('unsafe_claim');
    expect(adaptMarkdownToPresentation({ fullText: `${buildProviderMarkdown()}\n[5 things to remember]`, manseryeok: fixtureMansae, fortuneCycles: { daeunList: [{ age: 1 }] } }).presentationStatusReason).toBe('localization_leak');
    expect(adaptMarkdownToPresentation({ fullText: buildProviderMarkdown(), manseryeok: { pillars: {}, elements: {} }, fortuneCycles: { daeunList: [{ age: 1 }] } }).presentationStatusReason).toBe('insufficient_calculated_basis');
    expect(adaptMarkdownToPresentation({ fullText: buildProviderMarkdown(), manseryeok: fixtureMansae, fortuneCycles: { daeunList: [], seunList: [] } }).presentationStatusReason).toBe('insufficient_calculated_basis');
    expect(adaptMarkdownToPresentation({ fullText: buildProviderMarkdown(), manseryeok: fixtureMansae, fortuneCycles: { daeunList: [{ age: 1 }] }, language: 'en' }).presentationStatusReason).toBe('unsupported_locale');
  });

  test('semantic duplicate field returns duplicate_content', () => {
    const repeated = '아이의 장면을 천천히 관찰하고 다음 순서를 함께 확인하면 시작이 쉬워집니다. 부모는 예고와 선택지를 짧게 건네고 회복할 시간을 지켜봅니다.';
    const text = buildProviderMarkdown().replace('자극을 정리할 시간이 필요한 신호일 수 있습니다.', repeated).replace('틀린 흔적을 줄이며 기준을 확인하는 과정입니다.', repeated);
    expect(adaptMarkdownToPresentation({ fullText: text, manseryeok: fixtureMansae, fortuneCycles: { daeunList: [{ age: 1 }] } }).presentationStatusReason).toBe('duplicate_content');
  });

  test('extra section-8 list item returns partial_required_labels', () => {
    const text = buildProviderMarkdown().replace('5. 노력의 과정을 말합니다.', '5. 노력의 과정을 말합니다.\n6. 추가 항목은 허용되지 않습니다.');
    expect(adaptMarkdownToPresentation({ fullText: text, manseryeok: fixtureMansae, fortuneCycles: { daeunList: [{ age: 1 }] } }).presentationStatusReason).toBe('partial_required_labels');
  });

  test('missing required label returns partial_required_labels', () => {
    const text = buildProviderMarkdown().replace('# 1. 양육 포커스', '# 1. 양육 포커스\n- **가장 흔한 오해:** only');
    expect(adaptMarkdownToPresentation({ fullText: text, manseryeok: fixtureMansae, fortuneCycles: { daeunList: [{ age: 1 }] } }).presentationStatusReason).toBe('partial_required_labels');
  });

  test('provider-authored 산출 근거 returns unsafe_claim', () => {
    expect(adaptMarkdownToPresentation({ fullText: `${buildProviderMarkdown()}\n산출 근거: 임의 계산`, manseryeok: fixtureMansae, fortuneCycles: { daeunList: [{ age: 1 }] } }).presentationStatusReason).toBe('unsafe_claim');
  });

  test('compatibility merge leaves fullText sections metadata unchanged', () => {
    const original = { fullText: '원문', sections: { one: '섹션' }, metadata: { provider: 'fixture' } };
    const merged = mergePresentationResult(original, { presentationStatus: 'fallback', presentationStatusReason: 'partial_required_labels' });
    expect(merged.fullText).toBe(original.fullText); expect(merged.sections).toBe(original.sections); expect(merged.metadata).toBe(original.metadata);
  });

  test('missing strength heading returns partial_required_labels', () => {
    const text = buildProviderMarkdown().replace('### 깊이 묻는 힘', '');
    expect(adaptMarkdownToPresentation({ fullText: text, manseryeok: fixtureMansae, fortuneCycles: { daeunList: [{ age: 1 }] } }).presentationStatusReason).toBe('partial_required_labels');
  });
  test('missing month heading returns partial_required_labels', () => {
    const text = buildProviderMarkdown().replace('### 10월', '');
    expect(adaptMarkdownToPresentation({ fullText: text, manseryeok: fixtureMansae, fortuneCycles: { daeunList: [{ age: 1 }] } }).presentationStatusReason).toBe('partial_required_labels');
  });
});
