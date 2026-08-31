import Link from 'next/link'
import { YinYangIcon } from '@/components/ui/YinYangIcon'
import { BlogPost, BlogLang, postUrl } from '@/lib/blog'

const LABELS: Record<BlogLang, { cta: string; heading: string; sub: string; locale: string }> = {
  en: {
    cta: 'Free Analysis',
    heading: 'Blog',
    sub: 'Korean astrology, child temperament, and the science of understanding your child.',
    locale: 'en-US',
  },
  ko: {
    cta: '무료 분석',
    heading: '블로그',
    sub: '사주와 오행, 그리고 아이의 타고난 기질을 이해하는 법.',
    locale: 'ko-KR',
  },
  ja: {
    cta: '無料診断',
    heading: 'ブログ',
    sub: '四柱推命と五行、そしてお子様の生まれ持った気質を理解するために。',
    locale: 'ja-JP',
  },
}

export default function BlogIndexView({ posts, lang }: { posts: BlogPost[]; lang: BlogLang }) {
  const l = LABELS[lang]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FEFDFB',
      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <header style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '24px 0' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href={lang === 'en' ? '/' : `/${lang}/`} className="logo-link" style={{ textDecoration: 'none', fontSize: '20px', fontWeight: 700, color: '#2C2420', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <YinYangIcon size={18} color="#2C2420" /> SoMyung
          </Link>
          <Link href="/saju/input" style={{
            textDecoration: 'none', fontSize: '14px', fontWeight: 600, color: '#FFFFFF',
            background: '#1A3D2E', padding: '8px 20px', borderRadius: '20px',
          }}>
            {l.cta}
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 24px 40px' }}>
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 44px)', fontWeight: 700, color: '#2C2420',
          fontFamily: '"Nanum Myeongjo", serif', letterSpacing: '-0.03em', marginBottom: '12px',
        }}>
          {l.heading}
        </h1>
        <p style={{ fontSize: '17px', color: '#6B5E52', lineHeight: 1.6 }}>{l.sub}</p>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px 80px' }}>
        {posts.map(post => (
          <article key={post.slug} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '32px 0' }}>
            <Link href={postUrl(post.slug, lang)} style={{ textDecoration: 'none' }}>
              <time dateTime={post.date} style={{ fontSize: '13px', color: '#9B8B7A', letterSpacing: '0.05em' }}>
                {new Date(post.date).toLocaleDateString(l.locale, { year: 'numeric', month: 'long', day: 'numeric' })}
              </time>
              <h2 style={{
                fontSize: '22px', fontWeight: 700, color: '#2C2420',
                fontFamily: '"Nanum Myeongjo", serif', letterSpacing: '-0.02em',
                marginTop: '8px', marginBottom: '8px', lineHeight: 1.4,
              }}>
                {post.title}
              </h2>
              <p style={{ fontSize: '15px', color: '#6B5E52', lineHeight: 1.6, marginBottom: '12px' }}>
                {post.description}
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[...new Set(post.tags)].slice(0, 4).map(tag => (
                  <span key={tag} style={{
                    fontSize: '12px', color: '#9B8B7A', padding: '3px 10px',
                    borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)',
                  }}>{tag}</span>
                ))}
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}
