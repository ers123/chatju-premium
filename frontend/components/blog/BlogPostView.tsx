import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { YinYangIcon } from '@/components/ui/YinYangIcon'
import { BlogPost, BlogLang, postUrl, blogIndexUrl } from '@/lib/blog'

const LABELS: Record<BlogLang, {
  backToBlog: string
  cta: string
  keepReading: string
  ctaHeading: string
  ctaSub: string
  ctaButton: string
  locale: string
}> = {
  en: {
    backToBlog: '← Blog',
    cta: 'Free Analysis',
    keepReading: 'Keep reading',
    ctaHeading: "Discover your child's temperament",
    ctaSub: '518,400 combinations. 3 minutes. Free.',
    ctaButton: 'Start Free Analysis',
    locale: 'en-US',
  },
  ko: {
    backToBlog: '← 블로그',
    cta: '무료 분석',
    keepReading: '이어서 읽기',
    ctaHeading: '아이의 타고난 기질을 확인해 보세요',
    ctaSub: '518,400가지 조합. 3분. 무료.',
    ctaButton: '무료로 시작하기',
    locale: 'ko-KR',
  },
  ja: {
    backToBlog: '← ブログ',
    cta: '無料診断',
    keepReading: '続けて読む',
    ctaHeading: 'お子様の生まれ持った気質を知る',
    ctaSub: '518,400通りの組み合わせ。3分。無料。',
    ctaButton: '無料で始める',
    locale: 'ja-JP',
  },
}

export default function BlogPostView({
  post,
  related,
  lang,
}: {
  post: BlogPost
  related: BlogPost[]
  lang: BlogLang
}) {
  const l = LABELS[lang]
  const inputHref = lang === 'en' ? '/saju/input' : '/saju/input'

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FEFDFB',
      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <header style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '24px 0' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href={blogIndexUrl(lang)} style={{ textDecoration: 'none', fontSize: '14px', color: '#9B8B7A' }}>
            {l.backToBlog}
          </Link>
          <Link href={lang === 'en' ? '/' : `/${lang}/`} className="logo-link" style={{ textDecoration: 'none', fontSize: '20px', fontWeight: 700, color: '#2C2420', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <YinYangIcon size={18} color="#2C2420" /> SoMyung
          </Link>
          <Link href={inputHref} style={{
            textDecoration: 'none', fontSize: '14px', fontWeight: 600, color: '#FFFFFF',
            background: '#1A3D2E', padding: '8px 20px', borderRadius: '20px',
          }}>
            {l.cta}
          </Link>
        </div>
      </header>

      <article style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 24px 80px' }}>
        <time dateTime={post.date} style={{ fontSize: '13px', color: '#9B8B7A', letterSpacing: '0.05em' }}>
          {new Date(post.date).toLocaleDateString(l.locale, { year: 'numeric', month: 'long', day: 'numeric' })}
        </time>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
          {[...new Set(post.tags)].map(tag => (
            <span key={tag} style={{
              fontSize: '12px', color: '#9B8B7A', padding: '3px 10px',
              borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)',
            }}>{tag}</span>
          ))}
        </div>

        <div style={{ marginTop: '40px' }}>
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 700, color: '#2C2420', fontFamily: '"Nanum Myeongjo", serif', letterSpacing: '-0.03em', lineHeight: 1.3, marginBottom: '24px' }}>{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#2C2420', fontFamily: '"Nanum Myeongjo", serif', letterSpacing: '-0.02em', marginTop: '48px', marginBottom: '16px' }}>{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2C2420', marginTop: '32px', marginBottom: '12px' }}>{children}</h3>
              ),
              p: ({ children }) => (
                <p style={{ fontSize: '17px', color: '#3D3028', lineHeight: 1.8, marginBottom: '16px' }}>{children}</p>
              ),
              strong: ({ children }) => <strong style={{ fontWeight: 700, color: '#2C2420' }}>{children}</strong>,
              em: ({ children }) => <em style={{ fontStyle: 'italic', color: '#6B5E52' }}>{children}</em>,
              a: ({ href, children }) => (
                <a href={href} style={{ color: '#B8922D', textDecoration: 'underline', textUnderlineOffset: '3px' }}>{children}</a>
              ),
              ul: ({ children }) => <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>{children}</ul>,
              li: ({ children }) => (
                <li style={{ fontSize: '17px', color: '#3D3028', lineHeight: 1.8, marginBottom: '4px' }}>{children}</li>
              ),
              hr: () => <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.08)', margin: '40px 0' }} />,
              blockquote: ({ children }) => (
                <blockquote style={{ borderLeft: '3px solid #B8922D', paddingLeft: '20px', margin: '24px 0', color: '#6B5E52', fontStyle: 'italic' }}>{children}</blockquote>
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

        {/* Related posts — internal links so each article is reachable from its
            neighbours instead of being a crawl dead end. */}
        {related.length > 0 && (
          <nav aria-label="Related articles" style={{ marginTop: '64px', paddingTop: '32px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9B8B7A', marginBottom: '20px' }}>
              {l.keepReading}
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '16px' }}>
              {related.map(r => (
                <li key={r.slug}>
                  <Link href={postUrl(r.slug, lang)} style={{ textDecoration: 'none', display: 'block' }}>
                    <span style={{ display: 'block', fontSize: '17px', fontWeight: 700, color: '#2C2420', fontFamily: '"Nanum Myeongjo", serif', lineHeight: 1.4, marginBottom: '4px' }}>
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

        <div style={{ marginTop: '60px', padding: '32px', background: 'linear-gradient(135deg, #1A3D2E, #2C5238)', borderRadius: '16px', textAlign: 'center' }}>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', fontFamily: '"Nanum Myeongjo", serif', marginBottom: '8px' }}>
            {l.ctaHeading}
          </p>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', marginBottom: '20px' }}>
            {l.ctaSub}
          </p>
          <Link href={inputHref} style={{
            display: 'inline-block', padding: '12px 32px', background: '#C5A059',
            color: '#1A3D2E', borderRadius: '24px', fontWeight: 700, fontSize: '15px', textDecoration: 'none',
          }}>
            {l.ctaButton}
          </Link>
        </div>
      </article>
    </div>
  )
}
