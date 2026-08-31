import type { Metadata } from 'next'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { getAllSlugs, getPostBySlug, getRelatedPosts } from '@/lib/blog'
import { YinYangIcon } from '@/components/ui/YinYangIcon'

const SITE = 'https://somyung.cc'

export function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }))
}

// Without an explicit canonical here, posts inherit the (app) layout's
// canonical (the Korean homepage), which tells crawlers every article is a
// duplicate of the homepage and must not be indexed on its own.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return { title: 'Post not found — SoMyung', robots: { index: false, follow: false } }

  const url = `${SITE}/blog/${post.slug}/`
  return {
    title: `${post.title} — SoMyung`,
    description: post.description,
    keywords: post.tags,
    authors: [{ name: 'SungHa' }],
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      siteName: 'SoMyung',
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

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    return <div style={{ padding: '100px', textAlign: 'center' }}>Post not found</div>
  }

  const related = getRelatedPosts(slug, 3)

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${SITE}/blog/${post.slug}/#article`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE}/blog/${post.slug}/` },
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    keywords: post.tags.join(', '),
    inLanguage: 'en',
    author: {
      '@type': 'Person',
      name: 'SungHa',
      jobTitle: 'Certified Myeongri Psychology Counselor (Level 1)',
      url: `${SITE}/about`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'SoMyung',
      url: SITE,
    },
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FEFDFB',
      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '24px 0',
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/blog" style={{ textDecoration: 'none', fontSize: '14px', color: '#9B8B7A' }}>
            ← Blog
          </Link>
          <Link href="/" className="logo-link" style={{ textDecoration: 'none', fontSize: '20px', fontWeight: 700, color: '#2C2420', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <YinYangIcon size={18} color="#2C2420" /> SoMyung
          </Link>
          <Link href="/saju/input" style={{
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 600,
            color: '#FFFFFF',
            background: '#1A3D2E',
            padding: '8px 20px',
            borderRadius: '20px',
          }}>
            Free Analysis
          </Link>
        </div>
      </header>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      {/* Article */}
      <article style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 24px 80px' }}>
        <time dateTime={post.date} style={{ fontSize: '13px', color: '#9B8B7A', letterSpacing: '0.05em' }}>
          {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </time>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
          {post.tags.map(tag => (
            <span key={tag} style={{
              fontSize: '12px',
              color: '#9B8B7A',
              padding: '3px 10px',
              borderRadius: '12px',
              border: '1px solid rgba(0,0,0,0.08)',
            }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Markdown Content */}
        <div style={{ marginTop: '40px' }}>
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 style={{
                  fontSize: 'clamp(28px, 5vw, 40px)',
                  fontWeight: 700,
                  color: '#2C2420',
                  fontFamily: '"Nanum Myeongjo", serif',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.3,
                  marginBottom: '24px',
                }}>{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#2C2420',
                  fontFamily: '"Nanum Myeongjo", serif',
                  letterSpacing: '-0.02em',
                  marginTop: '48px',
                  marginBottom: '16px',
                }}>{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#2C2420',
                  marginTop: '32px',
                  marginBottom: '12px',
                }}>{children}</h3>
              ),
              p: ({ children }) => (
                <p style={{
                  fontSize: '17px',
                  color: '#3D3028',
                  lineHeight: 1.8,
                  marginBottom: '16px',
                }}>{children}</p>
              ),
              strong: ({ children }) => (
                <strong style={{ fontWeight: 700, color: '#2C2420' }}>{children}</strong>
              ),
              em: ({ children }) => (
                <em style={{ fontStyle: 'italic', color: '#6B5E52' }}>{children}</em>
              ),
              a: ({ href, children }) => (
                <a href={href} style={{ color: '#B8922D', textDecoration: 'underline', textUnderlineOffset: '3px' }}>{children}</a>
              ),
              ul: ({ children }) => (
                <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>{children}</ul>
              ),
              li: ({ children }) => (
                <li style={{ fontSize: '17px', color: '#3D3028', lineHeight: 1.8, marginBottom: '4px' }}>{children}</li>
              ),
              hr: () => (
                <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.08)', margin: '40px 0' }} />
              ),
              blockquote: ({ children }) => (
                <blockquote style={{
                  borderLeft: '3px solid #B8922D',
                  paddingLeft: '20px',
                  margin: '24px 0',
                  color: '#6B5E52',
                  fontStyle: 'italic',
                }}>{children}</blockquote>
              ),
              table: ({ children }) => (
                <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>{children}</table>
                </div>
              ),
              th: ({ children }) => (
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #EBE5DF', fontWeight: 700, color: '#2C2420' }}>{children}</th>
              ),
              td: ({ children }) => (
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #EBE5DF', color: '#3D3028' }}>{children}</td>
              ),
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Related posts — internal links so each article is reachable from
            its neighbours instead of being a crawl dead end. */}
        {related.length > 0 && (
          <nav
            aria-label="Related articles"
            style={{ marginTop: '64px', paddingTop: '32px', borderTop: '1px solid rgba(0,0,0,0.08)' }}
          >
            <h2 style={{
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#9B8B7A',
              marginBottom: '20px',
            }}>
              Keep reading
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '16px' }}>
              {related.map(r => (
                <li key={r.slug}>
                  <Link
                    href={`/blog/${r.slug}`}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <span style={{
                      display: 'block',
                      fontSize: '17px',
                      fontWeight: 700,
                      color: '#2C2420',
                      fontFamily: '"Nanum Myeongjo", serif',
                      lineHeight: 1.4,
                      marginBottom: '4px',
                    }}>
                      {r.title}
                    </span>
                    <span style={{ display: 'block', fontSize: '14px', color: '#6B5E52', lineHeight: 1.6 }}>
                      {r.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* CTA */}
        <div style={{
          marginTop: '60px',
          padding: '32px',
          background: 'linear-gradient(135deg, #1A3D2E, #2C5238)',
          borderRadius: '16px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', fontFamily: '"Nanum Myeongjo", serif', marginBottom: '8px' }}>
            Discover your child&apos;s temperament
          </p>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', marginBottom: '20px' }}>
            518,400 combinations. 3 minutes. Free.
          </p>
          <Link href="/saju/input" style={{
            display: 'inline-block',
            padding: '12px 32px',
            background: '#C5A059',
            color: '#1A3D2E',
            borderRadius: '24px',
            fontWeight: 700,
            fontSize: '15px',
            textDecoration: 'none',
          }}>
            Start Free Analysis
          </Link>
        </div>
      </article>
    </div>
  )
}
