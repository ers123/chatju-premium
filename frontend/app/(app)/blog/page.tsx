import type { Metadata } from 'next'
import { getAllPosts } from '@/lib/blog'
import { blogIndexMetadata } from '@/lib/blog-meta'
import BlogIndexView from '@/components/blog/BlogIndexView'

export const metadata: Metadata = blogIndexMetadata('en')

export default function BlogIndex() {
  return <BlogIndexView posts={getAllPosts('en')} lang="en" />
}
