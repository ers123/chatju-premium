import { Language, translations } from './translations'

const BASE_URL = 'https://somyung.cc'

// Only ko and ja have their own market artwork; everything else uses the English hero.
const PRODUCT_IMAGE: Partial<Record<Language, string>> & { en: string } = {
  en: '/assets/images/marketing/og-hero-en.png',
  ko: '/assets/images/marketing/og-hero-ko.png',
  ja: '/assets/images/marketing/og-hero-ja.png',
}

function langUrl(lang: Language, path: string = '/'): string {
  return `${BASE_URL}/${lang}${path === '/' ? '/' : path}`
}

/**
 * Site-wide entity nodes (Organization + WebSite) for a locale.
 *
 * FAQPage and Product describe the LANDING PAGE, not every localized route.
 * Emitting them from the [lang] layout put the sales FAQ and a $19.99 Offer
 * on all 30 localized about/privacy/terms pages — a Product Offer on a terms
 * of service page is simply wrong markup.
 */
export function getSiteJsonLdForLang(lang: Language) {
  const full = buildFullGraph(lang)
  return {
    "@context": "https://schema.org",
    "@graph": full.filter(n => n["@type"] === "Organization" || n["@type"] === "WebSite"),
  }
}

/** Landing-page-only nodes (FAQPage + Product) for a locale. */
export function getLandingJsonLdForLang(lang: Language) {
  const full = buildFullGraph(lang)
  return {
    "@context": "https://schema.org",
    "@graph": full.filter(n => n["@type"] === "FAQPage" || n["@type"] === "Product"),
  }
}

function buildFullGraph(lang: Language) {
  const t = translations[lang]

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": BASE_URL,
        "name": "SoMyung",
        "legalName": "HarmonyOn",
        "url": BASE_URL,
        "email": "support@somyung.cc",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "197 Seoun-ro, 106-dong 804-ho, Seocho-gu",
          "addressRegion": "Seoul",
          "addressLocality": "Seoul",
          "addressCountry": "KR"
        },
        "taxID": "341-15-02349",
        "sameAs": [BASE_URL, "mailto:support@somyung.cc"],
        "knowsAbout": ["Saju", "Four Pillars of Destiny", "사주팔자", "Korean Astrology", "Child Temperament Analysis", "Myeongri Psychology"],
        "founder": {
          "@type": "Person",
          "name": "SungHa",
          "jobTitle": "Founder & Creator",
          "hasCredential": [
            {
              "@type": "EducationalOccupationalCredential",
              "credentialCategory": "Professional Certification",
              "name": "Myeongri Psychology Counselor Level 1 (명리심리상담사 1급)"
            },
            {
              "@type": "EducationalOccupationalCredential",
              "credentialCategory": "Degree",
              "name": "Master of Science in Decision Making and Applied Analytics (MDA)"
            }
          ]
        }
      },
      {
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        "url": BASE_URL,
        "name": "SoMyung",
        "description": "Saju-based child temperament analysis designed by a certified Myeongri Psychology Counselor",
        "inLanguage": ["ko", "en", "ja", "zh", "vi", "id", "es", "pt", "fr", "th"],
        "publisher": { "@id": BASE_URL }
      },
      {
        "@type": "FAQPage",
        "@id": `${langUrl(lang)}#faq`,
        "mainEntity": t.faq.items.map(item => ({
          "@type": "Question",
          "name": item.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.a
          }
        }))
      },
      {
        // No `review` here: Google requires reviewRating on every Review, and
        // these were self-authored anonymous testimonials without ratings —
        // reported as invalid items, and self-serving reviews on your own
        // Product are not eligible for review snippets anyway.
        "@type": "Product",
        "@id": `${BASE_URL}/#premium-report`,
        "name": "SoMyung Premium Saju Report",
        // Required by Google for Product structured data — its absence was the
        // one critical issue in the Merchant listings report. Matches the
        // per-market OG art where one exists.
        "image": [`${BASE_URL}${PRODUCT_IMAGE[lang] || PRODUCT_IMAGE.en}`],
        "description": "An 8-section deep-dive child temperament analysis based on Saju (Four Pillars of Destiny).",
        "url": BASE_URL,
        "brand": { "@type": "Brand", "name": "SoMyung" },
        "offers": {
          "@type": "Offer",
          "price": "19.99",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "url": BASE_URL
        }
      }
    ]
  }

  return graph["@graph"] as Array<Record<string, unknown> & { "@type": string }>
}

export function getSpeakableJsonLd(lang: Language) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${langUrl(lang)}#webpage`,
    "url": langUrl(lang),
    "name": "SoMyung | Saju Child Temperament Analysis",
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": ["#saju-definition", "#founder-story", "h1"]
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": langUrl(lang) }
      ]
    }
  }
}
