import type { Metadata } from 'next'
import Script from 'next/script'
import '../../globals.css'
import { LanguageProvider } from '../../lib/i18n/context'
import { Language } from '../../lib/i18n/translations'
import { getMetadataForLang } from '../../lib/i18n/metadata'
import { getJsonLdForLang, getSpeakableJsonLd } from '../../lib/i18n/jsonld'

const SUPPORTED: Language[] = ['en', 'ja', 'zh', 'vi', 'id', 'es', 'pt', 'fr', 'th']
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export function generateStaticParams() {
  return SUPPORTED.map(lang => ({ lang }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  return getMetadataForLang(lang as Language)
}

export default async function I18nLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const jsonLd = getJsonLdForLang(lang as Language)
  const speakable = getSpeakableJsonLd(lang as Language)

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(speakable) }}
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
        <LanguageProvider initialLang={lang as Language}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
