// Server-authoritative product catalog. The client never sets a price — it may
// only select one of these fixed products (by product_type, or by its
// currency+amount pair for older clients). Must stay in sync with
// frontend/lib/pricing.ts (PRICING_BY_LANG).
const PREMIUM_SAJU_PRODUCT = {
  id: 'premium_saju',
  amount: 4.99,
  currency: 'USD',
  description: 'Premium Saju Reading',
};

const PRODUCTS = {
  [PREMIUM_SAJU_PRODUCT.id]: PREMIUM_SAJU_PRODUCT,
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

module.exports = {
  PREMIUM_SAJU_PRODUCT,
  PRODUCTS,
  getProduct,
  isSupportedProduct,
  amountsMatch,
  resolveProductByPricing,
  formatPayPalAmount,
};
