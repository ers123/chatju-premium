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
}

const PRICING_BY_LANG: Record<SupportedLanguage, PremiumPricing | null> = {
  ko: null, // Korea: free tier + promo only (PayPal cannot charge KRW)
  en: { amount: 4.99, currency: 'USD', display: 'US$4.99' },
  ja: { amount: 490, currency: 'JPY', display: '¥490' },
  zh: { amount: 4.99, currency: 'USD', display: 'US$4.99' }, // CNY unsupported for receiving
  vi: { amount: 4.99, currency: 'USD', display: 'US$4.99' }, // VND unsupported
  id: { amount: 4.99, currency: 'USD', display: 'US$4.99' }, // IDR unsupported
  es: { amount: 3.49, currency: 'EUR', display: '€3.49' },
  pt: { amount: 3.49, currency: 'EUR', display: '€3.49' }, // BRL deferred (no guest checkout)
  fr: { amount: 3.99, currency: 'EUR', display: '€3.99' },
  th: { amount: 89, currency: 'THB', display: '฿89' },
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
