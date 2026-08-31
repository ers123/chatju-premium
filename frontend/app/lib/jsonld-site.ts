// Site-wide and landing-page structured data.
//
// Split deliberately: Organization and WebSite describe the entity and belong
// on every page, but FAQPage, Product and the home WebPage node describe the
// LANDING PAGE only. They used to be emitted from the (app) root layout, which
// meant all 18 blog posts shipped the product sales FAQ and an Offer as their
// own markup — duplicate markup across unrelated URLs, and a signal to search
// and AI crawlers that each article was a sales page.

export const organizationNode = {
  "@type": "Organization",
  "@id": "https://somyung.cc",
  "name": "SoMyung",
  "url": "https://somyung.cc",
  "email": "support@somyung.cc",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Seoul",
    "addressCountry": "KR"
  },
  "taxID": "341-15-02349",
  // sameAs exists to tie this entity to its profiles on OTHER sites, which is
  // what lets a search engine or model tell this SoMyung apart from the
  // manufacturer, the two churches and the webtoon character that share the
  // name. The self URL and the mailto did neither — `url` and `email` already
  // carry those — so they are replaced with the real external profiles.
  "sameAs": [
    "https://github.com/ers123/somyung-saju-mcp",
    "https://www.npmjs.com/package/somyung-saju-mcp",
    "https://smithery.ai/servers/harmonyon24/somyung-saju"
  ],
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
}

export const webSiteNode = {
  "@type": "WebSite",
  "@id": "https://somyung.cc/#website",
  "url": "https://somyung.cc",
  "name": "SoMyung",
  "description": "Saju-based child temperament analysis designed by a certified Myeongri Psychology Counselor",
  "inLanguage": ["ko", "en", "ja", "zh", "vi", "id", "es", "pt", "fr", "th"],
  "publisher": { "@id": "https://somyung.cc" }
}

export const faqNode = {
  "@type": "FAQPage",
  "@id": "https://somyung.cc/#faq",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is Saju just superstition?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Saju Myeongri is an Eastern philosophical system with thousands of years of history. SoMyung's analysis was designed by SungHa, a certified Myeongri Psychology Counselor (Level 1) who holds a Master of Science in Decision Making and Applied Analytics. The methodology combines traditional Myeongri studies with modern psychology — similar to how MBTI or the Enneagram provides a framework for understanding innate personality types, not predicting the future. SungHa developed SoMyung after applying this approach to raising three children and experiencing firsthand how understanding each child's temperament transformed family communication."
      }
    },
    {
      "@type": "Question",
      "name": "What if I don't know the birth time?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can still get about 70% of the analysis without the birth time. Three pillars (year, month, day) are enough to identify core temperament and Five Elements balance. If you know the exact time, you'll get a more precise four-pillar analysis. You can find the birth time on official birth records or medical documents."
      }
    },
    {
      "@type": "Question",
      "name": "How do I use the results?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Use them as a reference for communication style, learning environment, and motivation strategies. For example, a Fire temperament child benefits from short focus sessions and active learning. Every child is unique — use this as a starting point for understanding, not an absolute guide."
      }
    },
    {
      "@type": "Question",
      "name": "Are results available immediately?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, results are generated within about 10 seconds after entering the birth date. The Manseryeok calculation and AI interpretation happen in real-time. You can view results on the web and share them instantly."
      }
    },
    {
      "@type": "Question",
      "name": "Can I analyze other children too?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Absolutely. You can analyze siblings or other children anytime. Just click Analyze Another Child on the results page. Comparing different temperaments gives you even deeper insights into family dynamics."
      }
    },
    {
      "@type": "Question",
      "name": "Is my personal information safe?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We collect only the birth information needed to generate your report, and — for paid reports — an email address and a name (or nickname) you choose to label the report. Free previews are not stored in our database. All data is encrypted in transit, and you can request deletion at any time. See our Privacy Policy at somyung.cc/privacy for details."
      }
    },
    {
      "@type": "Question",
      "name": "How is the paid version different?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The free preview shows Five Elements analysis, basic personality, and learning tips. The Premium Report (US$19.99) includes an 8-section deep analysis: parent-child relationship guide, age-specific parenting advice with conversation scripts, aptitude tendencies, life-cycle themes with monthly guidance, a 7-day parenting experiment, and a shareable parenting card. Written to the standard of a certified Korean Saju practitioner — for a fraction of what one consultation costs."
      }
    }
  ]
}

// No `review` nodes here. Google requires reviewRating on every Review, and
// these were self-authored, anonymous testimonials with no ratings — 3 invalid
// items in Search Console, and self-serving reviews on your own Product are
// not eligible for review snippets in the first place. The legitimate path to
// review rich results is aggregateRating built from the real rating widget.
export const productNode = {
  "@type": "Product",
  "@id": "https://somyung.cc/#premium-report",
  "name": "SoMyung Premium Saju Report",
  // Required by Google for Product structured data — its absence was the one
  // critical issue in the Merchant listings report.
  "image": ["https://somyung.cc/assets/images/marketing/og-hero-en.png"],
  "description": "An 8-section deep-dive child temperament analysis based on Saju (Four Pillars of Destiny). Includes parent-child relationship guide, age-specific parenting advice with conversation scripts, aptitude tendencies, life-cycle themes with monthly guidance, a 7-day parenting experiment, and a shareable parenting card.",
  "url": "https://somyung.cc",
  "brand": {
    "@type": "Brand",
    "name": "SoMyung"
  },
  "offers": {
    "@type": "Offer",
    "price": "19.99",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "url": "https://somyung.cc"
  }
}

export const homeWebPageNode = {
"@context": "https://schema.org",
"@type": "WebPage",
"@id": "https://somyung.cc/#webpage",
"url": "https://somyung.cc",
"name": "SoMyung | Saju Child Temperament Analysis",
"speakable": {
  "@type": "SpeakableSpecification",
  "cssSelector": ["#saju-definition", "#founder-story", "h1"]
},
"breadcrumb": {
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://somyung.cc" }
  ]
}
          }

/** Emitted on every (app) route. */
export const siteGraph = {
  '@context': 'https://schema.org',
  '@graph': [organizationNode, webSiteNode]
}

/** Emitted on the landing page only. */
export const landingGraph = {
  '@context': 'https://schema.org',
  '@graph': [faqNode, productNode, homeWebPageNode]
}
