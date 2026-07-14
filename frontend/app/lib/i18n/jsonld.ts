import { Language, translations } from './translations'

const BASE_URL = 'https://somyung.cc'

function langUrl(lang: Language, path: string = '/'): string {
  return `${BASE_URL}/${lang}${path === '/' ? '/' : path}`
}

export function getJsonLdForLang(lang: Language) {
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
        "@type": "Product",
        "@id": `${BASE_URL}/#premium-report`,
        "name": "SoMyung Premium Saju Report",
        "description": "An 8-section deep-dive child temperament analysis based on Saju (Four Pillars of Destiny).",
        "url": BASE_URL,
        "brand": { "@type": "Brand", "name": "SoMyung" },
        "offers": {
          "@type": "Offer",
          "price": "4.99",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "url": BASE_URL
        },
        "review": t.testimonials.items.map(item => ({
          "@type": "Review",
          "reviewBody": item.quote,
          "author": { "@type": "Person", "name": item.author }
        }))
      }
    ]
  }

  return graph
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
