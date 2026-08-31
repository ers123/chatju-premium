import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BlogLang, BLOG_LANGS, getAllSlugs, getPostBySlug, getRelatedPosts } from '@/lib/blog'
import { blogPostMetadata, blogPostJsonLd } from '@/lib/blog-meta'
import BlogPostView from '@/components/blog/BlogPostView'

// Only the languages the blog is actually translated into get routes. Other
// locales keep their landing pages and fall back to the English blog.
const LOCALIZED: BlogLang[] = BLOG_LANGS.filter(l => l !== 'en')

export function generateStaticParams() {
  return LOCALIZED.flatMap(lang =>
    getAllSlugs(lang).map(slug => ({ lang, slug }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}): Promise<Metadata> {
  const { lang, slug } = await params
  const post = getPostBySlug(slug, lang as BlogLang)
  if (!post) return { title: 'Post not found — SoMyung', robots: { index: false, follow: false } }
  return blogPostMetadata(post, lang as BlogLang)
}

export default async function LocalizedBlogPost({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}) {
  const { lang, slug } = await params
  const post = getPostBySlug(slug, lang as BlogLang)
  if (!post) notFound()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostJsonLd(post, lang as BlogLang)) }}
      />
      <BlogPostView post={post} related={getRelatedPosts(slug, 3, lang as BlogLang)} lang={lang as BlogLang} />
    </>
  )
}
