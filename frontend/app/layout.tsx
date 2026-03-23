import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { LanguageProvider } from "./lib/i18n/context";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  title: "SoMyung | Discover Your Child's Hidden Talents Through Saju",
  description: "Discover your child's innate temperament and learning style with private Saju analysis trusted by 10,000+ parents. Based on traditional Manseryeok.",
  keywords: ["saju", "child temperament", "four pillars", "fortune", "parenting", "child talent", "personality analysis", "Korean astrology"],
  authors: [{ name: "SoMyung" }],
  openGraph: {
    title: "SoMyung | Private Fortune Lounge for You and Your Child",
    description: "What kind of person will your child become? Discover hidden potential with ancient wisdom. Trusted by 10,000+ parents.",
    url: "https://somyung.cc",
    siteName: "SoMyung",
    locale: "ko_KR",
    type: "website",
    images: [],
  },
  twitter: {
    card: "summary_large_image",
    title: "SoMyung | Discover Your Child's Hidden Talents Through Saju",
    description: "Stop worrying all night. Ancient wisdom is by your side.",
    images: [],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://somyung.cc",
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
