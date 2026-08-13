// 장 도입 산문의 계약.
//
// 왜 이 파일이 있나: 2026-08-13 모델 비교에서 nano/luna/terra/sol 네 모델이
// 문체 점수 4/3/4로 **완전히 동일**했고, 심판이 넷 모두에게 같은 약점을 적었다 —
// "라벨 반복이 편지가 아니라 양식처럼 읽힌다". 모델을 25배 비싼 것으로 바꿔도
// 안 움직였다는 뜻이다.
//
// 원인은 렌더러였다. `parseLabelGroups`는 첫 라벨 앞의 줄을 조용히 버린다
// (lastLabel 이 없으면 appendContinuation 이 아무것도 붙이지 않는다). 그런데
// 섹션 1 프롬프트는 처음부터 "따뜻한 3문장으로 시작"을 요구하고 있었다.
// **모델은 산문을 쓰고 있었고, 파서가 그것을 독자에게 닿기 전에 지우고 있었다.**
// 프롬프트로 warmth 를 올리려던 작업은 산문을 삭제하는 렌더러와 싸운 셈이다.
//
// 지키려는 것:
//   1. 라벨 앞 산문은 보존된다.
//   2. 라벨 파싱은 **한 글자도 달라지지 않는다** — 계약을 넓히는 것이지 바꾸는 게 아니다.
//   3. 산문이 없던 리포트는 이전과 동일하게 렌더된다(빈 블록을 만들지 않는다).

// report-presentation.js 는 최상단에서 무거운 것을 끌고 오지 않지만, 순수 함수만
// 떼어 쓰기 위해 모듈을 그대로 require 한다.
const presentation = require('../src/services/report-presentation');

const { extractSectionIntro } = presentation;

const KO_LABELS = ['오해', '실제', '더 나은 반응'];

describe('도입 산문 추출', () => {
  test('첫 라벨 앞의 산문을 살린다 — 이전에는 버려졌다', () => {
    const content = [
      '세나는 아침마다 현관에서 한 번 멈춥니다.',
      '당신이 재촉하는 그 순간, 아이는 마지막 점검을 하는 중일지도 모릅니다.',
      '',
      '- **오해:** 고집이 세다',
      '- **실제:** 예열이 필요하다',
      '- **더 나은 반응:** 5분 전에 예고한다',
    ].join('\n');
    const intro = extractSectionIntro(content, KO_LABELS);
    expect(intro).toContain('현관에서 한 번 멈춥니다');
    expect(intro).toContain('마지막 점검');
    // 라벨 내용은 도입부로 새어 들어오지 않는다.
    expect(intro).not.toContain('고집이 세다');
  });

  test('산문 없이 라벨로 시작하면 빈 문자열 — 빈 블록을 만들지 않는다', () => {
    const content = '- **오해:** 고집이 세다\n- **실제:** 예열이 필요하다';
    expect(extractSectionIntro(content, KO_LABELS)).toBe('');
  });

  test('헤딩으로 시작해도 도입부로 오해하지 않는다', () => {
    const content = '### 첫 번째 장면\n- **오해:** 고집이 세다';
    expect(extractSectionIntro(content, KO_LABELS)).toBe('');
  });

  test('모르는 라벨(볼드 콜론)도 산문이 아니다', () => {
    const content = '**어떤 항목:** 값\n\n- **오해:** 고집';
    expect(extractSectionIntro(content, KO_LABELS)).toBe('');
  });

  test('장 전체를 산문으로 삼키지 않는다 (상한 존재)', () => {
    const long = ('이 아이는 오래 생각합니다. '.repeat(80));
    const intro = extractSectionIntro(long, KO_LABELS);
    expect(intro.length).toBeLessThan(700);
  });

  test('빈 입력에서 터지지 않는다', () => {
    expect(extractSectionIntro('', KO_LABELS)).toBe('');
    expect(extractSectionIntro(null, KO_LABELS)).toBe('');
    expect(extractSectionIntro(undefined, KO_LABELS)).toBe('');
  });
});

describe('라벨 계약은 그대로다', () => {
  test('adaptMarkdownToPresentation 이 여전히 export 되고 호출 가능하다', () => {
    // 계약을 넓히면서 기존 진입점을 깨지 않았는지 확인한다.
    expect(typeof presentation.adaptMarkdownToPresentation).toBe('function');
  });
});
