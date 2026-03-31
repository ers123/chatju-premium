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
  vi: 'vi_VN', id: 'id_ID', es: 'es_ES', pt: 'pt_BR',
  fr: 'fr_FR', th: 'th_TH',
}

// Market-specific OG images
const ogImageMap: Record<string, string> = {
  ko: '/assets/images/marketing/og-hero-ko.png',
  ja: '/assets/images/marketing/og-hero-ja.png',
}
const defaultOgImage = '/assets/images/marketing/og-hero-en.png'

function getOgImage(lang: Language): string {
  return ogImageMap[lang] || defaultOgImage
}

export function getMetadataForLang(lang: Language, path: string = '/'): Metadata {
  const t = translations[lang]
  const ogImage = getOgImage(lang)

  return {
    metadataBase: new URL(BASE_URL),
    title: t.hero.title1 + ' ' + t.hero.titleAccent + ' — SoMyung',
    description: t.hero.subtitle + ' ' + t.hero.subtitle2,
    keywords: ['saju', 'child temperament', 'four pillars', 'fortune', 'parenting', 'Korean astrology', 'myeongri', '명리심리상담사'],
    authors: [{ name: 'SungHa' }],
    openGraph: {
      title: 'SoMyung | ' + t.hero.title1,
      description: t.hero.subtitle + ' ' + t.hero.subtitle2,
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
      title: 'SoMyung | ' + t.hero.title1,
      description: t.hero.subtitle,
      images: [ogImage],
    },
    robots: { index: true, follow: true },
    alternates: {
      canonical: langUrl(lang, path),
      languages: buildHreflang(path),
    },
  }
}
