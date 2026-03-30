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
