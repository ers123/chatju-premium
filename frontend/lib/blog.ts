import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const BLOG_ROOT = path.join(process.cwd(), 'content/blog')

/** Languages the blog is published in. English lives at the root of content/blog. */
export const BLOG_LANGS = ['en', 'ko', 'ja'] as const
export type BlogLang = (typeof BLOG_LANGS)[number]

export interface BlogPost {
  slug: string
  title: string
  titleKo: string
  date: string
  description: string
  descriptionKo: string
  tags: string[]
  content: string
  lang: BlogLang
}

function dirFor(lang: BlogLang): string {
  return lang === 'en' ? BLOG_ROOT : path.join(BLOG_ROOT, lang)
}

/** URL path for a post in a given language. English keeps the bare /blog/ path. */
export function postUrl(slug: string, lang: BlogLang): string {
  return lang === 'en' ? `/blog/${slug}/` : `/${lang}/blog/${slug}/`
}

export function blogIndexUrl(lang: BlogLang): string {
  return lang === 'en' ? '/blog/' : `/${lang}/blog/`
}

export function getAllPosts(lang: BlogLang = 'en'): BlogPost[] {
  const dir = dirFor(lang)
  if (!fs.existsSync(dir)) return []

  return fs
    .readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(filename => {
      const raw = fs.readFileSync(path.join(dir, filename), 'utf-8')
      const { data, content } = matter(raw)
      return {
        slug: data.slug || filename.replace('.md', ''),
        title: data.title || '',
        titleKo: data.titleKo || data.title || '',
        date: data.date || '',
        description: data.description || '',
        descriptionKo: data.descriptionKo || data.description || '',
        tags: data.tags || [],
        content,
        lang,
      }
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPostBySlug(slug: string, lang: BlogLang = 'en'): BlogPost | null {
  return getAllPosts(lang).find(p => p.slug === slug) || null
}

export function getAllSlugs(lang: BlogLang = 'en'): string[] {
  return getAllPosts(lang).map(p => p.slug)
}

/**
 * Languages a given post actually exists in — drives hreflang. Only emit an
 * alternate for a translation that is really published, never for one that is
 * merely planned.
 */
export function getLangsForSlug(slug: string): BlogLang[] {
  return BLOG_LANGS.filter(l => fs.existsSync(path.join(dirFor(l), `${slug}.md`)))
}

/**
 * Posts most related to `slug`, ranked by shared tags then recency.
 *
 * The blog had zero links between its posts, so every article was a crawl
 * dead end: no internal link equity moved between them and neither readers
 * nor crawlers had a path from one post to the next.
 */
export function getRelatedPosts(slug: string, limit: number = 3, lang: BlogLang = 'en'): BlogPost[] {
  const posts = getAllPosts(lang)
  const current = posts.find(p => p.slug === slug)
  if (!current) return []

  const tags = new Set(current.tags)
  return posts
    .filter(p => p.slug !== slug)
    .map(p => ({ post: p, shared: p.tags.filter(t => tags.has(t)).length }))
    .sort((a, b) =>
      b.shared - a.shared ||
      new Date(b.post.date).getTime() - new Date(a.post.date).getTime()
    )
    .slice(0, limit)
    .map(x => x.post)
}
