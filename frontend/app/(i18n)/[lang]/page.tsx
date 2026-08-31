import LandingContent from '@/components/landing/LandingContent'
import { Language } from '../../lib/i18n/translations'
import { getLandingJsonLdForLang, getSpeakableJsonLd } from '../../lib/i18n/jsonld'

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  return (
    <>
      {/* FAQPage / Product / the speakable WebPage node describe this page.
          They used to come from the [lang] layout, which put them on every
          localized about/privacy/terms page too. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getLandingJsonLdForLang(lang as Language)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getSpeakableJsonLd(lang as Language)),
        }}
      />
      <LandingContent />
    </>
  )
}
