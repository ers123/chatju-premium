// ============================================
// SoMyung - Premium pricing per locale
// ============================================
//
// Rule: we only charge in currencies PayPal can actually process for
// receiving payments. KRW, VND, IDR and CNY are NOT supported by PayPal,
// so those locales are charged in USD and the displayed price MUST equal
// the charged price (t.pricing.premium.price is kept in sync by i18n).
//
// ko (Korea) has no PayPal checkout at all: free tier + promo codes only.

import type { SupportedLanguage } from '@/types'

export interface PremiumPricing {
  /** Numeric amount sent to PayPal (charged price) */
  amount: number
  /** PayPal-supported ISO currency code */
  currency: 'USD' | 'JPY' | 'EUR' | 'THB'
  /** Human-readable price string; must match t.pricing.premium.price */
  display: string
  /** Server catalog id (backend/src/config/products.js) — the charged product */
  productType: string
}

// 2026-08-13 인상. 근거와 되돌리는 조건은 backend/src/config/products.js 상단에.
// display 는 translations.ts 의 t.pricing.premium.price 와 반드시 같아야 한다 —
// 표시가와 청구가가 다르면 사용자를 속이는 것이고, 한국 PG 카드사 심사도
// "노출 금액 = 결제창 금액"을 요구한다.
const PRICING_BY_LANG: Record<SupportedLanguage, PremiumPricing | null> = {
  ko: null, // Korea: free tier + promo only (PayPal cannot charge KRW)
  en: { amount: 19.99, currency: 'USD', display: 'US$19.99', productType: 'premium_saju_usd_1999' },
  ja: { amount: 2480, currency: 'JPY', display: '¥2,480', productType: 'premium_saju_jpy_2480' },
  zh: { amount: 19.99, currency: 'USD', display: 'US$19.99', productType: 'premium_saju_usd_1999' }, // CNY unsupported for receiving
  vi: { amount: 19.99, currency: 'USD', display: 'US$19.99', productType: 'premium_saju_usd_1999' }, // VND unsupported
  id: { amount: 19.99, currency: 'USD', display: 'US$19.99', productType: 'premium_saju_usd_1999' }, // IDR unsupported
  es: { amount: 17.99, currency: 'EUR', display: '€17.99', productType: 'premium_saju_eur_1799' },
  pt: { amount: 17.99, currency: 'EUR', display: '€17.99', productType: 'premium_saju_eur_1799' }, // BRL deferred (no guest checkout)
  fr: { amount: 17.99, currency: 'EUR', display: '€17.99', productType: 'premium_saju_eur_1799' },
  th: { amount: 449, currency: 'THB', display: '฿449', productType: 'premium_saju_thb_449' },
}

/**
 * Returns the chargeable premium pricing for a locale,
 * or null when paid checkout is unavailable (ko).
 * Unknown locales fall back to the English (USD) price.
 */
export function getPremiumPricing(lang: string): PremiumPricing | null {
  if (lang in PRICING_BY_LANG) {
    return PRICING_BY_LANG[lang as SupportedLanguage]
  }
  return PRICING_BY_LANG.en
}

/** PayPal JS SDK query params; `currency` must match the charged currency. */
export function buildPayPalSdkParams(currency: PremiumPricing['currency']): string {
  return `currency=${currency}&components=buttons,googlepay&enable-funding=venmo,card&disable-funding=credit,paylater&commit=true`
}
