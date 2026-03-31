import type { Metadata } from "next";
import Script from "next/script";
import "../globals.css";
import { LanguageProvider } from "../lib/i18n/context";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  metadataBase: new URL("https://somyung.cc"),
  title: "SoMyung | Discover Your Child's Hidden Talents Through Saju",
  description: "Saju child temperament analysis designed by SungHa — Certified Myeongri Psychology Counselor (Level 1) & MS in Decision Making and Applied Analytics. Parent of three.",
  keywords: ["saju", "child temperament", "four pillars", "fortune", "parenting", "child talent", "personality analysis", "Korean astrology", "myeongri", "명리심리상담사"],
  authors: [{ name: "SungHa" }],
  openGraph: {
    title: "SoMyung | Saju Child Temperament Analysis",
    description: "Designed by a certified Myeongri Psychology Counselor and parent of three. Discover your child's innate temperament through ancient Saju wisdom.",
    url: "https://somyung.cc",
    siteName: "SoMyung",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/assets/images/marketing/og-hero-ko.png",
        width: 1200,
        height: 630,
        alt: "SoMyung — Saju Child Temperament Analysis",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SoMyung | Discover Your Child's Hidden Talents Through Saju",
    description: "Created by a certified Myeongri Psychology Counselor & MS in Analytics. Understand your child's innate temperament in 3 minutes.",
    images: ["/assets/images/marketing/og-hero-ko.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://somyung.cc/ko/",
    languages: {
      "ko": "https://somyung.cc/ko/",
      "en": "https://somyung.cc/en/",
      "ja": "https://somyung.cc/ja/",
      "zh": "https://somyung.cc/zh/",
      "vi": "https://somyung.cc/vi/",
      "id": "https://somyung.cc/id/",
      "es": "https://somyung.cc/es/",
      "pt": "https://somyung.cc/pt/",
      "fr": "https://somyung.cc/fr/",
      "th": "https://somyung.cc/th/",
      "x-default": "https://somyung.cc/en/",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
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
                "sameAs": [
                  "https://somyung.cc",
                  "mailto:support@somyung.cc"
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
              },
              {
                "@type": "WebSite",
                "@id": "https://somyung.cc/#website",
                "url": "https://somyung.cc",
                "name": "SoMyung",
                "description": "Saju-based child temperament analysis designed by a certified Myeongri Psychology Counselor",
                "inLanguage": ["ko", "en", "ja", "zh", "vi", "id", "es", "pt", "fr", "th"],
                "publisher": { "@id": "https://somyung.cc" }
              },
              {
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
                      "text": "Birth date information is used solely for analysis. We don't collect personal identification data such as name or phone number. Free analysis requires no signup, and all data is encrypted during transmission."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "How is the paid version different?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "The free preview shows Five Elements analysis, basic personality, and learning tips. The Premium Report ($4.99) includes an 8-section deep analysis: parent-child relationship guide, age-specific parenting advice with conversation scripts, career aptitude analysis, fortune cycle forecast, monthly fortune, and actionable weekly tasks. For the price of a cup of coffee, you get a complete guide to understanding your child."
                    }
                  }
                ]
              },
              {
                "@type": "Product",
                "@id": "https://somyung.cc/#premium-report",
                "name": "SoMyung Premium Saju Report",
                "description": "An 8-section deep-dive child temperament analysis based on Saju (Four Pillars of Destiny). Includes parent-child relationship guide, age-specific parenting advice, career aptitude analysis, fortune cycle forecast, monthly fortune, and actionable weekly tasks.",
                "url": "https://somyung.cc",
                "brand": {
                  "@type": "Brand",
                  "name": "SoMyung"
                },
                "offers": {
                  "@type": "Offer",
                  "price": "4.99",
                  "priceCurrency": "USD",
                  "availability": "https://schema.org/InStock",
                  "url": "https://somyung.cc"
                },
                "review": [
                  {
                    "@type": "Review",
                    "reviewBody": "My son and I fought every day. Once I learned we have completely opposite temperaments and took a step back first, real conversations finally started.",
                    "author": { "@type": "Person", "name": "Mom of a 8th-grader" }
                  },
                  {
                    "@type": "Review",
                    "reviewBody": "We tried three math tutoring centers. Turned out my daughter is a self-study type. Switching to online lessons made things so much easier for her.",
                    "author": { "@type": "Person", "name": "Mom of a 5th-grade girl" }
                  },
                  {
                    "@type": "Review",
                    "reviewBody": "I blamed myself for how sensitive my child was. Knowing it's an innate temperament gave me such peace of mind.",
                    "author": { "@type": "Person", "name": "Mom of a 7-year-old boy" }
                  }
                ]
              }
            ]
          })}}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
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
          })}}
        />
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}</Script>
          </>
        )}
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
