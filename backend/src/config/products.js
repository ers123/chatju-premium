// Server-authoritative product catalog. The client never sets a price — it may
// only select one of these fixed products (by product_type, or by its
// currency+amount pair for older clients). Must stay in sync with
// frontend/lib/pricing.ts (PRICING_BY_LANG).
// 기본 상품 = product_type 을 보내지 않는 클라이언트가 청구받는 상품.
// 인상할 때 이 상수를 그대로 두면 구버전 클라이언트만 조용히 옛 가격으로
// 남는다 — 가격이 두 개가 되고, 어느 쪽이 팔린 건지 나중에 구분할 수 없다.
const PREMIUM_SAJU_PRODUCT = {
  id: 'premium_saju_usd_1999',
  amount: 19.99,
  currency: 'USD',
  description: 'Premium Saju Reading',
};

/** 인상 전 기본 상품. 진행 중이던 주문의 재검증에만 쓰인다. */
const LEGACY_PREMIUM_SAJU_PRODUCT = {
  id: 'premium_saju',
  amount: 4.99,
  currency: 'USD',
  description: 'Premium Saju Reading',
};

// ── 2026-08-13 가격 인상 ────────────────────────────────────────────────────
// 왜 올렸나: 90일 실결제 5건 중 4건이 같은 사람의 테스트였다. 즉 가격 저항
// 데이터가 존재한 적이 없다. 실매출이 사실상 0이므로 인상으로 잃을 돈도 0이고,
// $4.99는 카테고리(16Personalities $29, CliftonStrengths $25, Etsy 사주 리딩
// $15~40)보다 4~6배 아래라 저가 자체가 품질 신호를 깎고 있었다.
// 작게 올리면 이 표본 수에서 측정이 불가능하다 — 신호가 나올 만큼 크게 움직인다.
//
// 판정: 프리뷰 200건 누적 후 checkout_start/preview 가 기준선의 절반 미만이면
// 되돌린다(funnel_daily 로 측정). 그 전에는 숫자를 보고 해석하지 않는다.
//
// 구 상품을 지우지 않는 이유: paymentAccessToken 과 payments.metadata 가
// product_type 을 들고 있고 capture 가 그 값으로 금액을 재검증한다. 지우면
// **배포 순간 결제창에 떠 있던 주문이 캡처에서 실패한다.** 신규 주문만 v2를 쓴다.
const PRODUCTS = {
  // 현행 (신규 주문). en, zh, vi, id — PayPal 미지원 통화는 USD로 청구.
  [PREMIUM_SAJU_PRODUCT.id]: PREMIUM_SAJU_PRODUCT,
  premium_saju_jpy_2480: {
    id: 'premium_saju_jpy_2480',
    amount: 2480,
    currency: 'JPY',
    description: 'Premium Saju Reading',
  },
  premium_saju_eur_1799: {
    id: 'premium_saju_eur_1799', // es, pt, fr — 인상 전 나뉘어 있던 두 티어를 하나로
    amount: 17.99,
    currency: 'EUR',
    description: 'Premium Saju Reading',
  },
  premium_saju_thb_449: {
    id: 'premium_saju_thb_449',
    amount: 449,
    currency: 'THB',
    description: 'Premium Saju Reading',
  },

  // 레거시 — 신규 주문에는 쓰이지 않는다. 인상 시점에 진행 중이던 주문과
  // 과거 결제 조회를 위해 남긴다. 되돌릴 때도 이 항목이 그대로 필요하다.
  [LEGACY_PREMIUM_SAJU_PRODUCT.id]: LEGACY_PREMIUM_SAJU_PRODUCT,
  premium_saju_jpy: {
    id: 'premium_saju_jpy',
    amount: 490,
    currency: 'JPY',
    description: 'Premium Saju Reading',
  },
  premium_saju_eur_349: {
    id: 'premium_saju_eur_349', // es, pt locales
    amount: 3.49,
    currency: 'EUR',
    description: 'Premium Saju Reading',
  },
  premium_saju_eur_399: {
    id: 'premium_saju_eur_399', // fr locale
    amount: 3.99,
    currency: 'EUR',
    description: 'Premium Saju Reading',
  },
  premium_saju_thb: {
    id: 'premium_saju_thb',
    amount: 89,
    currency: 'THB',
    description: 'Premium Saju Reading',
  },
};

function getProduct(productId = PREMIUM_SAJU_PRODUCT.id) {
  return PRODUCTS[productId] || null;
}

function isSupportedProduct(productId) {
  return !!getProduct(productId);
}

function amountsMatch(left, right) {
  return Number(left).toFixed(2) === Number(right).toFixed(2);
}

/**
 * Resolve a product from a client's (currency, amount) pair — for clients that
 * don't send product_type. Returns null when no catalog entry matches, so an
 * arbitrary client-chosen price can never become an order.
 */
function resolveProductByPricing(currency, amount) {
  if (!currency || amount === undefined || amount === null) return null;
  return Object.values(PRODUCTS).find(
    (p) => p.currency === currency && amountsMatch(p.amount, amount)
  ) || null;
}

// PayPal rejects decimal amounts for zero-decimal currencies.
const ZERO_DECIMAL_CURRENCIES = new Set(['JPY', 'TWD', 'HUF']);

/** Format a product's amount the way the PayPal Orders API expects it. */
function formatPayPalAmount(product) {
  return ZERO_DECIMAL_CURRENCIES.has(product.currency)
    ? String(Math.round(product.amount))
    : product.amount.toFixed(2);
}

/**
 * 어떤 로케일도 더는 선택하지 않지만 카탈로그에 남겨 둔 상품.
 *
 * 죽은 상품이 쌓이는 것을 막는 계약 테스트가 있는데(“no dead products”),
 * 인상 직후에는 **의도적으로** 도달 불가능한 상품이 생긴다 — 배포 순간
 * 결제창에 떠 있던 주문이 capture 때 이 정의로 금액을 재검증하기 때문이다.
 * 그래서 "지워도 되는가"의 답을 주석이 아니라 목록으로 남긴다.
 *
 * 비우는 시점: 인상 전 pending 주문이 전부 만료·정리된 뒤(정산 주기 한 번).
 */
const LEGACY_PRODUCT_IDS = Object.freeze([
  'premium_saju',
  'premium_saju_jpy',
  'premium_saju_eur_349',
  'premium_saju_eur_399',
  'premium_saju_thb',
]);

module.exports = {
  PREMIUM_SAJU_PRODUCT,
  LEGACY_PRODUCT_IDS,
  PRODUCTS,
  getProduct,
  isSupportedProduct,
  amountsMatch,
  resolveProductByPricing,
  formatPayPalAmount,
};
