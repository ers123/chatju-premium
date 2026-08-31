import type { Metadata } from 'next'
import { BlogPost, BlogLang, BLOG_LANGS, getLangsForSlug, postUrl, blogIndexUrl } from '@/lib/blog'

const SITE = 'https://somyung.cc'

const OG_LOCALE: Record<BlogLang, string> = {
  en: 'en_US',
  ko: 'ko_KR',
  ja: 'ja_JP',
}

/**
 * hreflang for one post, listing only the languages it is ACTUALLY published
 * in — never a translation that is merely planned. English is x-default.
 */
function alternates(slug: string) {
  const langs = getLangsForSlug(slug)
  const languages: Record<string, string> = {}
  for (const l of langs) languages[l] = `${SITE}${postUrl(slug, l)}`
  if (langs.includes('en')) languages['x-default'] = `${SITE}${postUrl(slug, 'en')}`
  return languages
}

/**
 * Post metadata. Without an explicit canonical here, posts inherit their
 * layout's canonical (a homepage), which tells crawlers every article is a
 * duplicate of the homepage and must not be indexed on its own.
 */
export function blogPostMetadata(post: BlogPost, lang: BlogLang): Metadata {
  const url = `${SITE}${postUrl(post.slug, lang)}`
  return {
    title: `${post.title} — SoMyung`,
    description: post.description,
    keywords: post.tags,
    authors: [{ name: 'SungHa' }],
    alternates: { canonical: url, languages: alternates(post.slug) },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      siteName: 'SoMyung',
      locale: OG_LOCALE[lang],
      type: 'article',
      publishedTime: post.date,
      authors: ['SungHa'],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  }
}

export function blogPostJsonLd(post: BlogPost, lang: BlogLang) {
  const url = `${SITE}${postUrl(post.slug, lang)}`
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    keywords: post.tags.join(', '),
    inLanguage: lang,
    author: {
      '@type': 'Person',
      name: 'SungHa',
      jobTitle: 'Certified Myeongri Psychology Counselor (Level 1)',
      url: `${SITE}/about`,
    },
    publisher: { '@type': 'Organization', name: 'SoMyung', url: SITE },
  }
}

const INDEX_COPY: Record<BlogLang, { title: string; description: string }> = {
  en: {
    title: 'Blog — SoMyung',
    description: "Articles on Saju, the Five Elements, and understanding a child's innate temperament.",
  },
  ko: {
    title: '블로그 — SoMyung',
    description: '사주와 오행, 그리고 아이의 타고난 기질을 이해하는 법에 대한 글.',
  },
  ja: {
    title: 'ブログ — SoMyung',
    description: '四柱推命と五行、そしてお子様の生まれ持った気質を理解するための記事。',
  },
}

export function blogIndexMetadata(lang: BlogLang): Metadata {
  const url = `${SITE}${blogIndexUrl(lang)}`
  const copy = INDEX_COPY[lang]
  const languages: Record<string, string> = {}
  for (const l of BLOG_LANGS) languages[l] = `${SITE}${blogIndexUrl(l)}`
  languages['x-default'] = `${SITE}${blogIndexUrl('en')}`

  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: url, languages },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url,
      siteName: 'SoMyung',
      type: 'website',
    },
  }
}
