import type { Metadata } from 'next'
import { getAllSlugs, getPostBySlug, getRelatedPosts } from '@/lib/blog'
import { blogPostMetadata, blogPostJsonLd } from '@/lib/blog-meta'
import BlogPostView from '@/components/blog/BlogPostView'

export function generateStaticParams() {
  return getAllSlugs('en').map(slug => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug, 'en')
  if (!post) return { title: 'Post not found — SoMyung', robots: { index: false, follow: false } }
  return blogPostMetadata(post, 'en')
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug, 'en')

  if (!post) {
    return <div style={{ padding: '100px', textAlign: 'center' }}>Post not found</div>
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostJsonLd(post, 'en')) }}
      />
      <BlogPostView post={post} related={getRelatedPosts(slug, 3, 'en')} lang="en" />
    </>
  )
}
