import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog'

// Required for output: export — the sitemap is generated at build time.
export const dynamic = 'force-static'

const SITE = 'https://somyung.cc'
const LANGS = ['ko', 'en', 'ja', 'zh', 'vi', 'id', 'es', 'pt', 'fr', 'th'] as const

// Localized routes that exist under /[lang]/. Each gets a full hreflang set.
const LOCALIZED_PATHS = ['', 'about', 'privacy', 'terms'] as const

function alternates(path: string) {
  const languages: Record<string, string> = {}
  for (const l of LANGS) languages[l] = `${SITE}/${l}/${path}`
  languages['x-default'] = `${SITE}/en/${path}`
  return { languages }
}

/**
 * Generated sitemap.
 *
 * Replaces a hand-maintained public/sitemap.xml that listed 34 URLs while the
 * build produced 78 pages — it was missing every localized /about (the E-E-A-T
 * page carrying the founder's credentials) as well as /privacy and /terms.
 * Generating it means the sitemap cannot drift from the routes again.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const path of LOCALIZED_PATHS) {
    const suffix = path ? `${path}/` : ''
    for (const lang of LANGS) {
      entries.push({
        url: `${SITE}/${lang}/${suffix}`,
        changeFrequency: path === '' ? 'weekly' : 'monthly',
        priority: path === '' ? 1.0 : path === 'about' ? 0.8 : 0.3,
        alternates: alternates(suffix),
      })
    }
  }

  entries.push({
    url: `${SITE}/blog/`,
    changeFrequency: 'weekly',
    priority: 0.8,
  })

  for (const post of getAllPosts()) {
    entries.push({
      url: `${SITE}/blog/${post.slug}/`,
      lastModified: post.date ? new Date(post.date) : undefined,
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  }

  return entries
}
