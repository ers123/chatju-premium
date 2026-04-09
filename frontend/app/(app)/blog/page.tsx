import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'

export default function BlogIndex() {
  const posts = getAllPosts()

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
          <Link href="/" className="logo-link" style={{ textDecoration: 'none', fontSize: '20px', fontWeight: 700, color: '#2C2420' }}>
            ☯ SoMyung
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

      {/* Blog Title */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 24px 40px' }}>
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 44px)',
          fontWeight: 700,
          color: '#2C2420',
          fontFamily: '"Nanum Myeongjo", serif',
          letterSpacing: '-0.03em',
          marginBottom: '12px',
        }}>
          Blog
        </h1>
        <p style={{ fontSize: '17px', color: '#6B5E52', lineHeight: 1.6 }}>
          Korean astrology, child temperament, and the science of understanding your child.
        </p>
      </div>

      {/* Post List */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px 80px' }}>
        {posts.map((post) => (
          <article key={post.slug} style={{
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            padding: '32px 0',
          }}>
            <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
              <time style={{ fontSize: '13px', color: '#9B8B7A', letterSpacing: '0.05em' }}>
                {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </time>
              <h2 style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#2C2420',
                fontFamily: '"Nanum Myeongjo", serif',
                letterSpacing: '-0.02em',
                marginTop: '8px',
                marginBottom: '8px',
                lineHeight: 1.4,
              }}>
                {post.title}
              </h2>
              <p style={{
                fontSize: '15px',
                color: '#6B5E52',
                lineHeight: 1.6,
                marginBottom: '12px',
              }}>
                {post.description}
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {post.tags.slice(0, 4).map(tag => (
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
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}
