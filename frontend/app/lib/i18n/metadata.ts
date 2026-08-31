import type { Metadata } from 'next'
import { Language, translations } from './translations'

const BASE_URL = 'https://somyung.cc'

const LANGUAGES: Language[] = ['ko', 'en', 'ja', 'zh', 'vi', 'id', 'es', 'pt', 'fr', 'th']

function langUrl(lang: Language, path: string = '/'): string {
  return `${BASE_URL}/${lang}${path === '/' ? '/' : path}`
}

function buildHreflang(path: string = '/'): Record<string, string> {
  const hreflang: Record<string, string> = {}
  for (const lang of LANGUAGES) {
    hreflang[lang] = langUrl(lang, path)
  }
  hreflang['x-default'] = langUrl('en', path)
  return hreflang
}

const localeMap: Record<Language, string> = {
  ko: 'ko_KR', en: 'en_US', ja: 'ja_JP', zh: 'zh_CN',
  vi: 'vi_VN', id: 'id_ID', es: 'es_MX', pt: 'pt_BR',
  fr: 'fr_FR', th: 'th_TH',
}

// Market-specific OG images
const ogImageMap: Record<string, string> = {
  ko: '/assets/images/marketing/og-hero-ko.png',
  ja: '/assets/images/marketing/og-hero-ja.png',
}
const defaultOgImage = '/assets/images/marketing/og-hero-en.png'

// Languages that do not separate words with spaces.
const SPACELESS_LANGS = new Set<Language>(['ja', 'zh', 'th'])

function getOgImage(lang: Language): string {
  return ogImageMap[lang] || defaultOgImage
}

export function getMetadataForLang(lang: Language, path: string = '/'): Metadata {
  const t = translations[lang]
  const ogImage = getOgImage(lang)

  // hero.title1 / titleAccent / title2 are three fragments of ONE sentence and
  // must always be joined together. Using title1 alone shipped "SoMyung |
  // Struggling to" as og:title; dropping title2 left Spanish with an unclosed
  // "¿" and Chinese without its "？".
  // CJK/Thai do not word-space, so they join with no separator.
  const joiner = SPACELESS_LANGS.has(lang) ? '' : ' '
  const headline = [t.hero.title1, t.hero.titleAccent, t.hero.title2].join(joiner)
  const fullTitle = headline + ' — SoMyung'
  const fullDescription = t.hero.subtitle + ' ' + t.hero.subtitle2

  return {
    metadataBase: new URL(BASE_URL),
    title: fullTitle,
    description: fullDescription,
    keywords: ['saju', 'child temperament', 'four pillars', 'fortune', 'parenting', 'Korean astrology', 'myeongri', '명리심리상담사'],
    authors: [{ name: 'SungHa' }],
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url: langUrl(lang, path),
      siteName: 'SoMyung',
      locale: localeMap[lang],
      type: 'website',
      images: [{
        url: ogImage,
        width: 1200,
        height: 630,
        alt: 'SoMyung — Saju Child Temperament Analysis',
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: [ogImage],
    },
    robots: { index: true, follow: true },
    alternates: {
      canonical: langUrl(lang, path),
      languages: buildHreflang(path),
    },
  }
}
