import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BlogLang, BLOG_LANGS, getAllPosts } from '@/lib/blog'
import { blogIndexMetadata } from '@/lib/blog-meta'
import BlogIndexView from '@/components/blog/BlogIndexView'

const LOCALIZED: BlogLang[] = BLOG_LANGS.filter(l => l !== 'en')

export function generateStaticParams() {
  return LOCALIZED.map(lang => ({ lang }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  return blogIndexMetadata(lang as BlogLang)
}

export default async function LocalizedBlogIndex({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!LOCALIZED.includes(lang as BlogLang)) notFound()
  return <BlogIndexView posts={getAllPosts(lang as BlogLang)} lang={lang as BlogLang} />
}
