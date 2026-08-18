// 퍼널 계측 — 날짜 · 이벤트 · 언어별 숫자만.
//
// 왜 있는가: 캠페인을 돌리기 전에 "유입이 프리뷰에서 끊겼는지 가격에서 끊겼는지"를
// 구분할 수 있어야 한다. 그 구분이 없으면 개입해도 배우는 것이 없다.
//
// 무엇을 저장하지 않는가: IP · user-agent · 세션/방문자 식별자 · 생년월일 · 이메일.
// 저장하는 것은 (날짜, 이벤트, 언어, 숫자) 네 칸이 전부다.
//
// 이것은 **이벤트 수**이지 사람 수가 아니다. 같은 사람의 프리뷰 3회는 3이다.
// 전환율을 읽을 때 이 사실을 잊으면 실제보다 나쁘게 보인다 — 다이제스트가 매번
// 같이 인쇄한다.

// supabase는 필요할 때 부른다. 라우트가 최상단에서 이 모듈을 require하는데, 모듈
// 로드 시점에 Supabase 설정을 요구하면 그 설정이 없는 테스트·도구가 전부 깨진다
// (report-job이 같은 이유로 같은 선택을 했다).
const getDb = () => require('../config/supabase').supabaseAdmin;

// 이벤트명은 화이트리스트다. 호출부 오타가 조용히 새 이벤트를 만들면 집계가
// 둘로 갈라지고, 갈라진 것은 아무도 알아채지 못한다.
const EVENTS = Object.freeze({
  PREVIEW: 'preview',              // 무료 프리뷰 생성 성공
  CHECKOUT_START: 'checkout_start', // PayPal 주문 생성 성공(결제창까지 감)
  PURCHASE: 'purchase',             // 결제 캡처 성공
  PROMO_REPORT: 'promo_report',     // 프로모 코드로 받은 유료 리포트(돈은 0)
  // 결제 수단이 없는 로케일(ko)에서 "결제하고 싶다" 버튼을 누른 횟수.
  // 한국 결제 레일(KCP 재신청, 월 ~5만원 고정비)을 다시 열지의 판단 근거다 —
  // 이 숫자 없이는 "한국 수요"가 영원히 느낌으로만 남는다.
  PURCHASE_INTENT: 'purchase_intent',
  // 공유 루프 — 팔로워 0인 계정 대신 제품 자신이 배포 경로가 되는지 본다.
  // 만든 링크(분모)와 그 링크로 들어온 조회(분자)를 나눠 세야 루프가 도는지 안다.
  SHARE_CREATED: 'share_created',
  SHARE_VIEW: 'share_view',
});

const KNOWN_EVENTS = new Set(Object.values(EVENTS));
const KNOWN_LANGUAGES = new Set(['ko', 'en', 'ja', 'zh', 'vi', 'id', 'es', 'pt', 'fr', 'th']);

// 테이블이 없을 때(마이그레이션 009 미실행) 요청마다 스택트레이스를 찍지 않는다.
// 한 번만 알리고 이후엔 조용히 건너뛴다 — 계측이 서비스를 시끄럽게 만들면 안 된다.
let storageUnavailableLogged = false;

function normalizeLanguage(language) {
  if (typeof language !== 'string') return 'unknown';
  const lang = language.trim().toLowerCase().split(/[-_]/)[0];
  return KNOWN_LANGUAGES.has(lang) ? lang : 'unknown';
}

/** UTC 기준 YYYY-MM-DD. Lambda 리전이 바뀌어도 같은 날은 같은 날이어야 한다. */
function utcDay(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/**
 * 이벤트 하나를 센다. **절대 throw하지 않는다** — 계측 실패가 사용자 응답을 망치는
 * 것은 계측의 가치보다 비싸다.
 *
 * **반드시 await할 것.** fire-and-forget으로 부르면 Lambda에서 한 건도 안 세진다:
 * serverless-http가 응답을 끝내는 순간 핸들러 프로미스가 resolve되고 Lambda는
 * 컨테이너를 얼린다. 남은 프로미스는 조용히 사라진다 — 에러 로그조차 없다.
 * (첫 배포에서 실제로 이렇게 잃었다. 프리뷰 200 응답, 카운터 0, 로그 무음.
 *  report-job.js 최상단이 같은 함정을 이미 적어 두었다.)
 * 비용은 Supabase RPC 왕복 한 번(수십 ms)이다.
 *
 * @param {string} event EVENTS 중 하나
 * @param {string} [language]
 * @returns {Promise<boolean>} 기록 여부
 */
async function recordFunnelEvent(event, language) {
  if (!KNOWN_EVENTS.has(event)) {
    console.warn('[Funnel] unknown event ignored:', event);
    return false;
  }
  try {
    const { error } = await getDb().rpc('bump_funnel_counter', {
      p_day: utcDay(),
      p_event: event,
      p_language: normalizeLanguage(language),
      p_delta: 1,
    });
    if (error) {
      if (!storageUnavailableLogged) {
        console.error('[Funnel] counter write failed (migration 009 실행 필요?):', error.message);
        storageUnavailableLogged = true;
      }
      return false;
    }
    return true;
  } catch (err) {
    if (!storageUnavailableLogged) {
      console.error('[Funnel] counter write threw:', err.message);
      storageUnavailableLogged = true;
    }
    return false;
  }
}

const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(1)}%` : '—');

/**
 * 집계. AI를 부르지 않는다.
 *
 * @param {{days?: number}} opts
 * @returns {Promise<Object>} 이벤트별 합계 · 언어별 · 일별 · 전환율
 */
async function getFunnelSummary({ days = 90 } = {}) {
  const since = utcDay(new Date(Date.now() - days * 86400000));

  const { data, error } = await getDb()
    .from('funnel_daily')
    .select('day, event, language, hits')
    .gte('day', since);

  if (error) {
    return { unavailable: 'funnel_daily 테이블 없음 — migrations/009 실행 필요', since, days };
  }

  const rows = data || [];
  const sum = (filter) => rows.filter(filter).reduce((a, r) => a + Number(r.hits || 0), 0);

  const totals = {};
  Object.values(EVENTS).forEach((e) => { totals[e] = sum((r) => r.event === e); });

  const byLanguage = {};
  rows.forEach((r) => {
    const lang = r.language || 'unknown';
    byLanguage[lang] ||= Object.fromEntries(Object.values(EVENTS).map((e) => [e, 0]));
    if (byLanguage[lang][r.event] !== undefined) byLanguage[lang][r.event] += Number(r.hits || 0);
  });

  const byDay = {};
  rows.forEach((r) => {
    byDay[r.day] ||= Object.fromEntries(Object.values(EVENTS).map((e) => [e, 0]));
    if (byDay[r.day][r.event] !== undefined) byDay[r.day][r.event] += Number(r.hits || 0);
  });

  // 전환율은 이벤트 기준이다. 반복 프리뷰가 분모를 부풀리므로 **하한**으로 읽는다.
  const conversion = {
    previewToCheckout: pct(totals[EVENTS.CHECKOUT_START], totals[EVENTS.PREVIEW]),
    checkoutToPurchase: pct(totals[EVENTS.PURCHASE], totals[EVENTS.CHECKOUT_START]),
    previewToPurchase: pct(totals[EVENTS.PURCHASE], totals[EVENTS.PREVIEW]),
  };

  const languageConversion = Object.fromEntries(
    Object.entries(byLanguage)
      .sort((a, b) => b[1][EVENTS.PREVIEW] - a[1][EVENTS.PREVIEW])
      .map(([lang, t]) => [lang, {
        preview: t[EVENTS.PREVIEW],
        checkout: t[EVENTS.CHECKOUT_START],
        purchase: t[EVENTS.PURCHASE],
        promo: t[EVENTS.PROMO_REPORT],
        previewToPurchase: pct(t[EVENTS.PURCHASE], t[EVENTS.PREVIEW]),
      }])
  );

  // 언제부터 실제로 세기 시작했는가. 이 날짜 이전 구간은 "0"이 아니라 "모름"이다.
  const firstDay = rows.map((r) => r.day).sort()[0] || null;

  return {
    window: { days, since },
    measuringSince: firstDay,
    totals,
    conversion,
    byLanguage: languageConversion,
    byDay,
  };
}

/** 다이제스트에 붙는 사람 읽는 형태. 콘솔과 메일이 같은 문자열을 쓴다. */
function renderFunnelText(funnel) {
  const L = [];
  if (!funnel || funnel.unavailable) {
    L.push(`퍼널: ${funnel?.unavailable || '집계 없음'}`);
    return L.join('\n');
  }
  const t = funnel.totals;
  L.push(`퍼널 (계측 시작 ${funnel.measuringSince || '아직 없음'})`);
  L.push(`  프리뷰 ${t.preview} → 결제시작 ${t.checkout_start} → 결제완료 ${t.purchase}`
    + (t.promo_report ? ` · 프로모 리포트 ${t.promo_report}` : ''));
  // ko 결제 레일 재개 판단 지표. EN/JA 유료 월 10건 트리거와 나란히 본다.
  if (t.purchase_intent) L.push(`  결제 의향(결제수단 없는 로케일): ${t.purchase_intent}건`);
  L.push(`  전환: 프리뷰→결제시작 ${funnel.conversion.previewToCheckout}`
    + ` · 결제시작→완료 ${funnel.conversion.checkoutToPurchase}`
    + ` · 프리뷰→완료 ${funnel.conversion.previewToPurchase}`);

  const langs = Object.entries(funnel.byLanguage).filter(([, v]) => v.preview || v.purchase);
  if (langs.length) {
    L.push('  언어별 (프리뷰 많은 순):');
    langs.slice(0, 10).forEach(([lang, v]) => {
      L.push(`    ${lang}: 프리뷰 ${v.preview} · 결제시작 ${v.checkout} · 완료 ${v.purchase}`
        + `${v.promo ? ` · 프로모 ${v.promo}` : ''} · 전환 ${v.previewToPurchase}`);
    });
  }
  L.push('  ※ 이벤트 수이지 사람 수가 아니다(같은 사람의 프리뷰 재생성 포함) — 전환율은 하한.');
  return L.join('\n');
}

module.exports = {
  EVENTS,
  recordFunnelEvent,
  getFunnelSummary,
  renderFunnelText,
  normalizeLanguage,
  utcDay,
};
