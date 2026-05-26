const PREMIUM_SAJU_PRODUCT = {
  id: 'premium_saju',
  amount: 4.99,
  currency: 'USD',
  description: 'Premium Saju Reading',
};

const PRODUCTS = {
  [PREMIUM_SAJU_PRODUCT.id]: PREMIUM_SAJU_PRODUCT,
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

module.exports = {
  PREMIUM_SAJU_PRODUCT,
  getProduct,
  isSupportedProduct,
  amountsMatch,
};
