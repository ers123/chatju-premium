// Premium report presentation boundary.
// The AI can continue returning Markdown, while intentional PDF layouts can
// opt into this small, validated structure without teaching the renderer to
// guess at arbitrary prose.

const REQUIRED_SECTION_NUMBERS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9]);
const BLOCK_REQUIREMENTS = Object.freeze({
  text: ['title', 'text'],
  note: ['title', 'text'],
  insight: ['title', 'basis', 'behavior', 'action'],
  translator: ['title', 'looksLike', 'actual', 'response'],
  script: ['title', 'before', 'after', 'signal'],
  timeline: ['title', 'items'],
  checklist: ['title', 'items'],
  'parenting-card': ['title', 'stop', 'start', 'steps'],
  close: ['title', 'text'],
});

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function requireString(value, path) {
  if (!isNonEmptyString(value)) throw new Error(`Premium presentation requires non-empty ${path}.`);
}

function validateItems(items, path) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error(`Premium presentation requires non-empty ${path}.`);
  }
  items.forEach((item, index) => {
    requireString(item?.label, `${path}[${index}].label`);
    requireString(item?.text, `${path}[${index}].text`);
  });
}

function validateBlock(block, path) {
  if (!block || typeof block !== 'object') throw new Error(`Premium presentation requires ${path}.`);
  if (!Object.prototype.hasOwnProperty.call(BLOCK_REQUIREMENTS, block.type)) {
    throw new Error(`Premium presentation does not support ${path}.type: ${String(block.type)}.`);
  }
  BLOCK_REQUIREMENTS[block.type].forEach((field) => {
    if (field === 'items') validateItems(block.items, `${path}.items`);
    else requireString(block[field], `${path}.${field}`);
  });
}

function validateCoverAndOpening(presentation) {
  const { cover, opening } = presentation;
  if (!cover || typeof cover !== 'object') throw new Error('Premium presentation requires cover.');
  ['kicker', 'title', 'child', 'date'].forEach((field) => requireString(cover[field], `cover.${field}`));

  if (!opening || typeof opening !== 'object') throw new Error('Premium presentation requires opening.');
  requireString(opening.title, 'opening.title');
  if (!Array.isArray(opening.items) || opening.items.length === 0) {
    throw new Error('Premium presentation requires non-empty opening.items.');
  }
  requireString(opening.note, 'opening.note');
  opening.items.forEach((item, index) => {
    requireString(item?.title, `opening.items[${index}].title`);
    requireString(item?.text, `opening.items[${index}].text`);
    if (item.accent !== undefined && !isNonEmptyString(item.accent)) {
      throw new Error(`Premium presentation requires non-empty opening.items[${index}].accent when supplied.`);
    }
  });
}

function parseNumberedSections(fullText) {
  if (!fullText || !fullText.trim()) return [];

  const matches = [...fullText.matchAll(/^#{1,4}\s*(\d+)\.\s*(.+?)\s*$/gm)];
  return matches.map((match, index) => {
    const contentStart = match.index + match[0].length;
    const contentEnd = index + 1 < matches.length ? matches[index + 1].index : fullText.length;
    return {
      number: Number(match[1]),
      title: match[2].trim(),
      // The heading is deliberately excluded: it is drawn exactly once by the PDF renderer.
      content: fullText.slice(contentStart, contentEnd).trim(),
    };
  });
}

function normalizePresentation(presentation) {
  if (!presentation || !Array.isArray(presentation.sections)) return null;

  validateCoverAndOpening(presentation);

  const sections = presentation.sections.map((section) => ({
    number: Number(section.number),
    title: String(section.title || '').trim(),
    blocks: Array.isArray(section.blocks) ? section.blocks : [],
    startOnNewPage: section.startOnNewPage !== false,
  }));
  const numbers = sections.map((section) => section.number);
  const ordered = REQUIRED_SECTION_NUMBERS.every((number, index) => numbers[index] === number);

  if (!ordered || sections.some((section) => !section.title || section.blocks.length === 0)) {
    throw new Error('Premium presentation must contain non-empty sections 1 through 9 in order.');
  }
  sections.forEach((section, sectionIndex) => {
    if (typeof presentation.sections[sectionIndex].startOnNewPage !== 'undefined' && typeof presentation.sections[sectionIndex].startOnNewPage !== 'boolean') {
      throw new Error(`Premium presentation requires sections[${sectionIndex}].startOnNewPage to be boolean when supplied.`);
    }
    section.blocks.forEach((block, blockIndex) => validateBlock(block, `sections[${sectionIndex}].blocks[${blockIndex}]`));
  });

  return {
    cover: presentation.cover,
    opening: presentation.opening,
    sections,
  };
}

function normalizedBody(value) {
  return String(value || '').normalize('NFKC')
    .replace(/\*\*|__|`/g, '')
    .replace(/^\s*(?:[-*•]|\d+[.)])\s*/gm, '')
    .replace(/^\s*[^:\n]{1,24}\s*[:：]\s*/gm, '')
    .replace(/[\s\p{P}\p{S}]+/gu, '')
    .trim();
}

function trigramSet(value) {
  const text = normalizedBody(value);
  if (text.length < 40) return null;
  return new Set([...Array(text.length - 2)].map((_, i) => text.slice(i, i + 3)));
}

function hasRepeatedContent(values) {
  const sets = values.map(trigramSet).filter(Boolean);
  for (let i = 0; i < sets.length; i += 1) for (let j = i + 1; j < sets.length; j += 1) {
    let common = 0;
    sets[i].forEach((gram) => { if (sets[j].has(gram)) common += 1; });
    if (common / Math.min(sets[i].size, sets[j].size) >= 0.9) return true;
  }
  return false;
}

function parseLabelGroups(content, labels) {
  const wanted = new Set(labels);
  const groups = [];
  let current = {};
  let lastLabel = null;
  const lines = String(content || '').split(/\r?\n/);
  lines.forEach((line) => {
    const match = line.match(/^\s*(?:[-*]\s*)?(?:\*\*([^*]+?)\s*[:：]\*\*|\*\*([^*]+?)\*\*\s*[:：]|([^:*\n]+?)\s*[:：])\s*(.*)$/);
    const looksLikeStandaloneLabel = /^\s*(?:[-*]\s*)?\*\*[^*]+?(?:[:：]\*\*|\*\*\s*[:：])/.test(line);
    const appendContinuation = () => {
      const continuation = line.trim().replace(/^\s*(?:[-*]|\d+[.)])\s*/, '');
      if (lastLabel && continuation && !/^#{1,6}\s+/.test(continuation) && !/^-{2,}$/.test(continuation)) current[lastLabel] = [current[lastLabel], continuation].filter(Boolean).join(' ');
    };
    if (!match) {
      appendContinuation();
      return;
    }
    const label = (match[1] || match[2] || match[3] || '').trim();
    if (!wanted.has(label)) {
      if (looksLikeStandaloneLabel) {
        current.__invalidLabel = label;
        lastLabel = null;
        return;
      }
      appendContinuation();
      return;
    }
    if (label === labels[0] && current[labels[0]]) { groups.push(current); current = {}; }
    current[label] = match[4].trim();
    lastLabel = label;
  });
  if (Object.keys(current).length) groups.push(current);
  return groups;
}
function parseTitledGroups(content, expectedCount, labels) {
  const parts = String(content).split(/^###\s+(.+)$/gm).slice(1);
  if (parts.length === expectedCount * 2) {
    const groups = [];
    for (let i = 0; i < parts.length; i += 2) {
      const title = parts[i].trim(); const fields = parseLabelGroups(parts[i + 1], labels);
      if (fields.length !== 1 || fields[0].__invalidLabel || !labels.every((label) => isNonEmptyString(fields[0][label]))) return null;
      groups.push({ title, fields: fields[0] });
    }
    return groups;
  }
  const cardMatches = [...String(content).matchAll(/^\s*(?:[-*]|\d+[.)])\s*\*\*\[?([^*\]\n:]+)\]?\*\*\s*$/gm)];
  if (cardMatches.length !== expectedCount) return null;
  const groups = [];
  for (let index = 0; index < cardMatches.length; index += 1) {
    const match = cardMatches[index];
    const contentStart = match.index + match[0].length;
    const contentEnd = index + 1 < cardMatches.length ? cardMatches[index + 1].index : String(content).length;
    const title = match[1].trim(); const fields = parseLabelGroups(String(content).slice(contentStart, contentEnd), labels);
    if (fields.length !== 1 || fields[0].__invalidLabel || !labels.every((label) => isNonEmptyString(fields[0][label]))) return null;
    groups.push({ title, fields: fields[0] });
  }
  return groups;
}
function mergePresentationResult(baseInterpretation, presentationResult) {
  return { ...baseInterpretation, presentationStatus: presentationResult.presentationStatus, ...(presentationResult.presentationStatusReason ? { presentationStatusReason: presentationResult.presentationStatusReason } : {}), ...(presentationResult.presentation ? { presentation: presentationResult.presentation } : {}) };
}

function adaptMarkdownToPresentation({ fullText, manseryeok, fortuneCycles = null, childName = '아이', generatedAt = new Date().toISOString(), language = 'ko' }) {
  if (language !== 'ko') return { presentationStatus: 'fallback', presentationStatusReason: 'unsupported_locale' };
  const sections = parseNumberedSections(fullText);
  if (sections.length !== 9 || sections.some((s, i) => s.number !== i + 1 || !s.content)) {
    return { presentationStatus: 'fallback', presentationStatusReason: 'missing_or_reordered_sections' };
  }
  if (/things to remember|de-escalation steps|before\/after/i.test(fullText)) return { presentationStatus: 'fallback', presentationStatusReason: 'localization_leak' };
  const unsafeScanText = fullText
    .replace(/건강\s*진단\s*(?:이나|\/)\s*(?:운명\s*확정|방위\s*풍수)[이가]\s*아(?:닙니다|니라)/gi, '')
    .replace(/의학적\s*진단이나\s*치료가\s*아닙니다/gi, '')
    .replace(/치료나\s*처방이\s*아닙니다/gi, '');
  if (/(건강\s*(?:문제|위험|악화|회복|치료|진단|처방)|질병|치료|처방|신장|폐|대장|심장|방위|풍수|재물|연애|반드시 성공|확정(?:됩니다|이다)|직업으로 확정|진로가 정해)/i.test(unsafeScanText)) return { presentationStatus: 'fallback', presentationStatusReason: 'unsafe_claim' };
  if (/산출\s*근거\s*[:：]|계산된\s*사주/i.test(fullText)) return { presentationStatus: 'fallback', presentationStatusReason: 'unsafe_claim' };
  const order = ['year', 'month', 'day', 'hour'];
  const pillarValues = manseryeok?.pillars ? order.map((key) => manseryeok.pillars[key]).filter((p) => p && (p.korean || p.hanja)) : [];
  const elementMap = { wood: '목', fire: '화', earth: '토', metal: '금', water: '수' };
  const elementValues = manseryeok?.elements ? Object.entries(elementMap).map(([key]) => manseryeok.elements[key]) : [];
  const basis = pillarValues.length >= 3 && elementValues.length >= 5 && elementValues.every((v) => Number.isFinite(Number(v)))
    ? `산출 근거: ${pillarValues.map((p) => p.korean || p.hanja).join('·')} / 오행 ${Object.entries(elementMap).map(([key, name]) => `${name}${manseryeok.elements[key]}`).join('·')}`
    : null;
  if (!basis) return { presentationStatus: 'fallback', presentationStatusReason: 'insufficient_calculated_basis' };
  const cycleMeaningful = fortuneCycles && ((Array.isArray(fortuneCycles.daeunList) && fortuneCycles.daeunList.length > 0) || (Array.isArray(fortuneCycles.seunList) && fortuneCycles.seunList.length > 0));
  if (!cycleMeaningful) return { presentationStatus: 'fallback', presentationStatusReason: 'insufficient_calculated_basis' };
  const bodies = sections.flatMap((s) => [s.title, s.content]);
  // The adapter is intentionally strict: only an explicitly labelled Markdown
  // contract becomes cards; ordinary model prose remains a safe legacy report.
  try {
    if (!/효과적인 말(?:\*\*)?\s*[:：]/.test(sections[0].content)) return { presentationStatus: 'fallback', presentationStatusReason: 'partial_required_labels' };
    const s1 = parseLabelGroups(sections[0].content, ['가장 흔한 오해', '가장 도움이 되는 것', '피해야 할 말', '효과적인 말', '이번 달 양육 포커스']);
    const s2 = parseLabelGroups(sections[1].content, ['오해', '실제', '더 나은 반응']);
    const s3 = parseLabelGroups(sections[2].content, ['관찰되는 행동', '내면의 논리', '악화 조건', '개선 조건']);
    const s4 = parseLabelGroups(sections[3].content, ['부모가 흔히 하는 말', '왜 역효과인지', '더 나은 스크립트', '개선 신호']);
    const titled5 = parseTitledGroups(sections[4].content, 3, ['약점으로 오해받는 상황', '이 강점이 빛나는 환경', '키워줄 활동 1가지', '진로 방향 힌트']);
    const section6MonthlyContent = sections[5].content.replace(/\n\s*(?:[-*]|\d+[.)])\s*\*\*\[?부모가\s+이\s+시기에\s+집중할\s+양육\s+포인트[\s\S]*$/m, '');
    const titled6 = parseTitledGroups(section6MonthlyContent, 4, ['압력 포인트', '주시할 행동 변화', '도움이 되는 것', '피해야 할 것']);
    const s5 = titled5 ? titled5.map((x) => x.fields) : [];
    const s6 = titled6 ? titled6.map((x) => x.fields) : [];
    const s7 = parseLabelGroups(sections[6].content, ['부모 행동 변화', '예상되는 아이 반응', '성공 신호']);
    const s8a = parseLabelGroups(sections[7].content, ['이 아이에게 기억할 5가지']);
    const s8b = parseLabelGroups(sections[7].content, ['멈출 말 3가지']);
    const s8c = parseLabelGroups(sections[7].content, ['시작할 말 3가지']);
    const s8d = parseLabelGroups(sections[7].content, ['감정이 높아질 때 3단계']);
    const s9 = parseLabelGroups(sections[8].content, ['색상', '음식', '활동', '핵심 한 문장', '마무리', '요약', '한 줄 요약', '요약 한 문장', '요약(한 문장)', '이 리포트의 핵심 요약(한 문장)']);
    const complete = (groups, labels) => groups.length > 0 && groups.every((g) => !g.__invalidLabel && labels.every((l) => isNonEmptyString(g[l])));
    const listGroup = (content, heading, count) => { const m = String(content).match(new RegExp(`(?:\\*\\*|\\[)${heading}(?:\\*\\*|\\])[^\\n]*\\n([\\s\\S]*?)(?=\\n\\s*(?:[-*]\\s*)?(?:\\*\\*)?\\[|\\n\\s*\\*\\*|$)`)); if (m) { const values = m[1].split(/\n/).map((x) => x.replace(/^\s*(?:[-*]|\d+[.)])\s*/, '').trim()).filter((x) => x && !/^-{2,}$/.test(x)); return values.length === count ? values : null; } const repeated = [...String(content).matchAll(new RegExp(`(?:\\*\\*)?${heading}(?:\\*\\*)?\\s*[:：]\s*([^\\n]+)`, 'g'))].map((x) => x[1].trim()); return repeated.length === count ? repeated : null; };
    const memory = listGroup(sections[7].content, '이 아이에게 기억할 5가지', 5); const stop = listGroup(sections[7].content, '멈출 말 3가지', 3); const start = listGroup(sections[7].content, '시작할 말 3가지', 3); const steps = listGroup(sections[7].content, '감정이 높아질 때 3단계', 3);
    if (!complete(s1, ['가장 흔한 오해','가장 도움이 되는 것','피해야 할 말','효과적인 말','이번 달 양육 포커스']) || !complete(s2, ['오해','실제','더 나은 반응']) || s2.length < 4 || s2.length > 6 || !complete(s3, ['관찰되는 행동','내면의 논리','악화 조건','개선 조건']) || s3.length < 5 || s3.length > 7 || !complete(s4, ['부모가 흔히 하는 말','왜 역효과인지','더 나은 스크립트','개선 신호']) || s4.length !== 6 || !complete(s5, ['약점으로 오해받는 상황','이 강점이 빛나는 환경','키워줄 활동 1가지','진로 방향 힌트']) || s5.length !== 3 || !complete(s6, ['압력 포인트','주시할 행동 변화','도움이 되는 것','피해야 할 것']) || s6.length !== 4 || !complete(s7, ['부모 행동 변화','예상되는 아이 반응','성공 신호']) || s7.length !== 3 || !memory || memory.length !== 5 || !stop || stop.length !== 3 || !start || start.length !== 3 || !steps || steps.length !== 3 || !complete(s9, ['색상','음식','활동','핵심 한 문장','마무리']) || s9.length !== 1) return { presentationStatus: 'fallback', presentationStatusReason: 'partial_required_labels' };
    const semanticBodies = [...s2, ...s3, ...s4, ...s5, ...s6].flatMap((g) => Object.values(g));
    const longBodies = semanticBodies.map(normalizedBody).filter((body) => body.length >= 80);
    if (new Set(longBodies).size < longBodies.length || hasRepeatedContent(semanticBodies)) return { presentationStatus: 'fallback', presentationStatusReason: 'duplicate_content' };
    const text = (title, value) => ({ type: 'text', title, text: value });
    const basisText = basis;
    const presentation = {
      cover: { kicker: 'SoMyung Premium', title: '아이의 속도를 읽는 양육 가이드', child: childName, date: String(generatedAt).slice(0, 10) },
      opening: { title: '이번 리포트의 사용법', items: [{ title: '관찰', text: s1[0]['가장 흔한 오해'] }, { title: '대화', text: s1[0]['효과적인 말'] }, { title: '실험', text: s1[0]['이번 달 양육 포커스'] }], note: s1[0]['가장 도움이 되는 것'] },
      sections: [
        { number: 1, title: sections[0].title, blocks: [text('가장 흔한 오해', s1[0]['가장 흔한 오해']), { type: 'insight', title: '이번 달 양육 포커스', basis: basisText, behavior: s1[0]['가장 도움이 되는 것'], action: s1[0]['효과적인 말'] }, text('피해야 할 말', s1[0]['피해야 할 말'])] },
        { number: 2, title: sections[1].title, blocks: s2.map((g, i) => ({ type: 'translator', title: `오해를 푸는 장면 ${i + 1}`, looksLike: g['오해'], actual: g['실제'], response: g['더 나은 반응'] })) },
        { number: 3, title: sections[2].title, blocks: s3.map((g, i) => ({ type: 'insight', title: `행동 시그니처 ${i + 1}`, basis: `추론: ${g['내면의 논리']}`, behavior: g['관찰되는 행동'], action: `${g['개선 조건']} 악화 조건: ${g['악화 조건']}` })) },
        { number: 4, title: sections[3].title, blocks: s4.map((g, i) => ({ type: 'script', title: `대화 스크립트 ${i + 1}`, before: `${g['부모가 흔히 하는 말']} (${g['왜 역효과인지']})`, after: g['더 나은 스크립트'], signal: g['개선 신호'] })) },
        { number: 5, title: sections[4].title, blocks: s5.map((g, i) => ({ type: 'insight', title: titled5[i].title, basis: `참고: ${g['이 강점이 빛나는 환경']}`, behavior: g['약점으로 오해받는 상황'], action: `${g['키워줄 활동 1가지']} / 진로 방향 힌트: ${g['진로 방향 힌트']}` })) },
        { number: 6, title: sections[5].title, blocks: [{ type: 'timeline', title: '이번 시기의 참고 흐름', items: s6.map((g, i) => ({ label: titled6[i].title, text: `${g['압력 포인트']} ${g['주시할 행동 변화']} ${g['도움이 되는 것']} 피해야 할 것: ${g['피해야 할 것']}` })) }, text('읽는 방법', '미래를 확정하는 예언이 아니라 관찰을 위한 참고선입니다.') ] },
        { number: 7, title: sections[6].title, blocks: [{ type: 'checklist', title: '작은 실험', items: s7.map((g, i) => ({ label: `${i + 1}일`, text: `${g['부모 행동 변화']} / 반응: ${g['예상되는 아이 반응']} / 성공: ${g['성공 신호']}` })) }] },
        { number: 8, title: sections[7].title, blocks: [{ type: 'checklist', title: '기억할 말', items: memory.map((v, i) => ({ label: `${i + 1}`, text: v })) }, { type: 'parenting-card', title: '곁에 두는 양육 카드', stop: stop.join(' '), start: start.join(' '), steps: steps.join(' ') }] },
        { number: 9, title: sections[8].title, startOnNewPage: false, blocks: [text('선택적 참고 아이디어', `${s9[0].색상} / ${s9[0].음식} / ${s9[0].활동}`), { type: 'close', title: '방법과 한계', text: `${s9[0]['핵심 한 문장']} ${s9[0]['마무리']}` }] },
      ],
    };
    return { presentationStatus: 'ready', presentation: normalizePresentation(presentation) };
  } catch (error) {
    return { presentationStatus: 'fallback', presentationStatusReason: 'invalid_presentation_contract', diagnostic: error.message };
  }
}

module.exports = {
  REQUIRED_SECTION_NUMBERS,
  BLOCK_REQUIREMENTS,
  parseNumberedSections,
  normalizePresentation,
  normalizedBody,
  hasRepeatedContent,
  adaptMarkdownToPresentation,
  mergePresentationResult,
  parseTitledGroups,
};
