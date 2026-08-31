import type { Metadata } from "next";
import "../globals.css";
import { siteGraph } from "../lib/jsonld-site";
import { LanguageProvider } from "../lib/i18n/context";
import GoogleAnalytics from "../../components/GoogleAnalytics";
import CookieConsent from "../../components/CookieConsent";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteGraph) }}
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <LanguageProvider>
          {children}
          {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
          <CookieConsent />
        </LanguageProvider>
      </body>
    </html>
  );
}
