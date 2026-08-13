// 퍼널 계측의 계약.
//
// 지키려는 것:
//   1. 저장하는 것은 (날짜, 이벤트, 언어, +1)뿐이다. 개인정보가 붙으면 이 표의
//      존재 이유(동의 게이트 밖에서 세기)가 무너진다.
//   2. 계측 실패는 **사용자 요청을 절대 깨뜨리지 않는다.** 테이블이 없어도, RPC가
//      죽어도 조용히 0을 센다.
//   3. 이벤트명은 화이트리스트. 오타로 만든 새 이벤트는 집계를 둘로 가르고, 갈라진
//      집계는 아무도 못 알아챈다.
//   4. 전환율은 이벤트 기준이라는 사실이 출력에 늘 붙어 있어야 한다 — 이 숫자를
//      사람 수로 읽으면 캠페인 판정이 틀린다.

const mockRpcCalls = [];
let mockRpcError = null;
let mockRpcThrows = false;
let mockSelectRows = [];
let mockSelectError = null;

jest.mock('../src/config/supabase', () => ({
  supabaseAdmin: {
    rpc: async (fn, args) => {
      if (mockRpcThrows) throw new Error('network down');
      mockRpcCalls.push({ fn, args });
      return { error: mockRpcError };
    },
    from: () => {
      const chain = {
        select: () => chain,
        gte: async () => ({ data: mockSelectRows, error: mockSelectError }),
      };
      return chain;
    },
  },
  handleSupabaseError: (e) => e,
}));

const funnel = require('../src/services/funnel.service');

beforeEach(() => {
  mockRpcCalls.length = 0;
  mockRpcError = null;
  mockRpcThrows = false;
  mockSelectRows = [];
  mockSelectError = null;
});

describe('기록', () => {
  test('이벤트 하나 = 날짜·이벤트·언어·+1. 그 밖에는 아무것도 보내지 않는다', async () => {
    const ok = await funnel.recordFunnelEvent(funnel.EVENTS.PREVIEW, 'ja');

    expect(ok).toBe(true);
    expect(mockRpcCalls).toHaveLength(1);
    expect(mockRpcCalls[0].fn).toBe('bump_funnel_counter');
    // 인자 목록 자체를 고정한다 — 나중에 누가 ip/ua를 끼워 넣으면 여기서 깨진다.
    expect(Object.keys(mockRpcCalls[0].args).sort()).toEqual(['p_day', 'p_delta', 'p_event', 'p_language']);
    expect(mockRpcCalls[0].args).toMatchObject({ p_event: 'preview', p_language: 'ja', p_delta: 1 });
    expect(mockRpcCalls[0].args.p_day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('모르는 이벤트명은 기록하지 않는다', async () => {
    const ok = await funnel.recordFunnelEvent('previews', 'ko'); // 오타
    expect(ok).toBe(false);
    expect(mockRpcCalls).toHaveLength(0);
  });

  test('언어는 지원 목록으로 정규화된다 — 임의 문자열이 표를 늘리지 못한다', () => {
    expect(funnel.normalizeLanguage('KO')).toBe('ko');
    expect(funnel.normalizeLanguage('pt-BR')).toBe('pt');
    expect(funnel.normalizeLanguage('klingon')).toBe('unknown');
    expect(funnel.normalizeLanguage(undefined)).toBe('unknown');
    expect(funnel.normalizeLanguage({ evil: true })).toBe('unknown');
  });

  test('저장소가 없어도 throw하지 않는다 (마이그레이션 009 미실행)', async () => {
    mockRpcError = { message: 'function bump_funnel_counter does not exist' };
    await expect(funnel.recordFunnelEvent(funnel.EVENTS.PURCHASE, 'en')).resolves.toBe(false);
  });

  test('RPC가 던져도 삼킨다 — 결제 응답이 계측 때문에 실패하면 안 된다', async () => {
    mockRpcThrows = true;
    await expect(funnel.recordFunnelEvent(funnel.EVENTS.PURCHASE, 'en')).resolves.toBe(false);
  });

  // Lambda에서 fire-and-forget은 한 건도 안 세진다(응답 끝 → 컨테이너 동결 →
  // 남은 프로미스 소멸, 에러 로그도 없음). 첫 배포에서 실제로 그렇게 잃었다.
  // 그래서 호출부는 await해야 하고, 그러려면 이 함수가 항상 resolve해야 한다.
  test('어떤 실패에서도 resolve한다 — 호출부가 안심하고 await할 수 있다', async () => {
    mockRpcThrows = true;
    await expect(funnel.recordFunnelEvent(funnel.EVENTS.CHECKOUT_START, 'fr')).resolves.toBe(false);
    mockRpcThrows = false;
    mockRpcError = { message: 'boom' };
    await expect(funnel.recordFunnelEvent(funnel.EVENTS.CHECKOUT_START, 'fr')).resolves.toBe(false);
  });

  test('fire-and-forget 헬퍼를 다시 만들지 않는다 — Lambda에서 소리 없이 사라진다', () => {
    expect(funnel.trackFunnelEvent).toBeUndefined();
  });
});

describe('집계', () => {
  const rows = [
    { day: '2026-08-10', event: 'preview', language: 'en', hits: 100 },
    { day: '2026-08-10', event: 'checkout_start', language: 'en', hits: 10 },
    { day: '2026-08-10', event: 'purchase', language: 'en', hits: 4 },
    { day: '2026-08-11', event: 'preview', language: 'ko', hits: 50 },
    { day: '2026-08-11', event: 'purchase', language: 'ko', hits: 5 },
    { day: '2026-08-11', event: 'promo_report', language: 'ko', hits: 2 },
  ];

  test('이벤트·언어·일자별로 합산하고 전환율을 낸다', async () => {
    mockSelectRows = rows;
    const s = await funnel.getFunnelSummary({ days: 90 });

    expect(s.totals).toEqual({ preview: 150, checkout_start: 10, purchase: 9, promo_report: 2, purchase_intent: 0 });
    expect(s.conversion.previewToPurchase).toBe('6.0%');
    expect(s.conversion.checkoutToPurchase).toBe('90.0%');
    expect(s.byLanguage.en).toMatchObject({ preview: 100, checkout: 10, purchase: 4, previewToPurchase: '4.0%' });
    expect(s.byLanguage.ko).toMatchObject({ preview: 50, purchase: 5, promo: 2 });
    expect(s.byDay['2026-08-10'].preview).toBe(100);
    // 언제부터 실제로 셌는가 — 이 날짜 이전은 0이 아니라 "모름"이다.
    expect(s.measuringSince).toBe('2026-08-10');
  });

  test('분모가 0이면 전환율은 0%가 아니라 —', async () => {
    mockSelectRows = [{ day: '2026-08-10', event: 'purchase', language: 'en', hits: 1 }];
    const s = await funnel.getFunnelSummary({});
    expect(s.conversion.previewToPurchase).toBe('—');
  });

  test('테이블이 없으면 unavailable을 돌려준다 — 다이제스트를 깨뜨리지 않는다', async () => {
    mockSelectError = { message: 'relation "funnel_daily" does not exist' };
    const s = await funnel.getFunnelSummary({});
    expect(s.unavailable).toMatch(/009/);
  });

  test('출력에 "이벤트 수이지 사람 수가 아니다"가 항상 붙는다', async () => {
    mockSelectRows = rows;
    const text = funnel.renderFunnelText(await funnel.getFunnelSummary({}));
    expect(text).toContain('프리뷰 150');
    expect(text).toContain('사람 수가 아니다');
  });

  test('집계가 없어도 렌더는 문자열을 돌려준다', () => {
    expect(typeof funnel.renderFunnelText({ unavailable: 'x' })).toBe('string');
    expect(typeof funnel.renderFunnelText(null)).toBe('string');
  });
});
