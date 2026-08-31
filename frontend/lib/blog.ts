import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const BLOG_DIR = path.join(process.cwd(), 'content/blog')

export interface BlogPost {
  slug: string
  title: string
  titleKo: string
  date: string
  description: string
  descriptionKo: string
  tags: string[]
  content: string
}

export function getAllPosts(): BlogPost[] {
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'))
  return files
    .map(filename => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf-8')
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
      }
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPostBySlug(slug: string): BlogPost | null {
  const posts = getAllPosts()
  return posts.find(p => p.slug === slug) || null
}

export function getAllSlugs(): string[] {
  return getAllPosts().map(p => p.slug)
}

/**
 * Posts most related to `slug`, ranked by shared tags then recency.
 *
 * The blog had zero links between its 18 posts, so every article was a
 * crawl dead end: no internal link equity moved between them and neither
 * readers nor crawlers had a path from one post to the next.
 */
export function getRelatedPosts(slug: string, limit: number = 3): BlogPost[] {
  const posts = getAllPosts()
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
