'use client'

import Link from 'next/link'
import { useLanguage } from '@/app/lib/i18n/context'

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://somyung.cc' },
    { '@type': 'ListItem', position: 2, name: 'About', item: 'https://somyung.cc/about' },
  ],
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'About SoMyung — Saju Child Temperament Analysis by SungHa',
  description:
    'SoMyung was created by SungHa, a certified Myeongri Psychology Counselor (Level 1) with a Master of Science in Decision Making and Applied Analytics, and a parent of three children.',
  url: 'https://somyung.cc/about',
  author: {
    '@type': 'Person',
    name: 'SungHa',
    hasCredential: [
      { '@type': 'EducationalOccupationalCredential', name: 'Myeongri Psychology Counselor Level 1 (명리심리상담사 1급)' },
      { '@type': 'EducationalOccupationalCredential', name: 'Master of Science in Decision Making and Applied Analytics (MDA)' },
    ],
  },
  publisher: { '@type': 'Organization', name: 'SoMyung', url: 'https://somyung.cc' },
  speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', 'h2', 'blockquote'] },
}

const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'SungHa',
  jobTitle: 'Founder & Creator of SoMyung',
  worksFor: { '@type': 'Organization', name: 'SoMyung', url: 'https://somyung.cc' },
  hasCredential: [
    {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'Professional Certification',
      name: 'Myeongri Psychology Counselor Level 1 (명리심리상담사 1급)',
    },
    {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'Degree',
      name: 'Master of Science in Decision Making and Applied Analytics (MDA)',
    },
  ],
  knowsAbout: ['Saju (Four Pillars of Destiny)', 'Myeongri Psychology', 'Child Temperament Analysis', 'Korean Astrology', 'Five Elements (오행)'],
}

const pStyle = { fontSize: '16px', lineHeight: 1.85 as const, color: '#C8B89A', marginBottom: '16px' }
const h2Style = { fontSize: '22px', fontWeight: 700, color: '#FFFFFF', marginBottom: '20px' }
const cardStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(196,168,130,0.15)',
  borderRadius: '12px',
  padding: '24px',
}

export default function AboutContent() {
  const { t } = useLanguage()
  const a = t.about

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />

      <main style={{ background: '#1A1410', minHeight: '100vh', color: '#E8DDD0' }}>
        <div style={{ padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/" style={{ fontSize: '14px', color: '#888888', textDecoration: 'none' }}>
            ← SoMyung
          </Link>
        </div>

        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 40px 80px' }}>

          {/* Header */}
          <div style={{ marginBottom: '48px' }}>
            <p style={{ fontSize: '13px', color: '#C4A882', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
              {a.label}
            </p>
            <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2, marginBottom: '16px' }}>
              SungHa
            </h1>
            <p style={{ fontSize: '18px', color: '#C4A882', lineHeight: 1.5 }}>
              {a.tagline}
            </p>
          </div>

          {/* Credential badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '48px' }}>
            {['명리심리상담사 1급', 'MS Decision Making & Applied Analytics', a.badge3].map((badge) => (
              <span key={badge} style={{
                background: 'rgba(196, 168, 130, 0.12)',
                border: '1px solid rgba(196, 168, 130, 0.3)',
                color: '#C4A882',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 500,
              }}>
                {badge}
              </span>
            ))}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', marginBottom: '48px' }} />

          {/* Story */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={h2Style}>{a.whyTitle}</h2>
            <p style={pStyle}>
              {a.whyP1Start}<em style={{ color: '#E8DDD0' }}>{a.whyP1Highlight}</em>
            </p>
            <p style={pStyle}>{a.whyP2}</p>
            <p style={{ ...pStyle, marginBottom: 0 }}>{a.whyP3}</p>
          </section>

          {/* Methodology */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={h2Style}>{a.methodTitle}</h2>
            <p style={pStyle}>{a.methodP1}</p>
            <p style={pStyle}>{a.methodP2}</p>
            <p style={{ ...pStyle, marginBottom: 0 }}>{a.methodP3}</p>
          </section>

          {/* Credentials detail */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={h2Style}>{a.credTitle}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={cardStyle}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#E8DDD0', marginBottom: '8px' }}>명리심리상담사 1급</h3>
                <p style={{ fontSize: '13px', color: '#888888', marginBottom: '10px' }}>{a.cred1Subtitle}</p>
                <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#C8B89A' }}>{a.cred1Desc}</p>
              </div>
              <div style={cardStyle}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#E8DDD0', marginBottom: '8px' }}>MS in Decision Making and Applied Analytics (MDA)</h3>
                <p style={{ fontSize: '13px', color: '#888888', marginBottom: '10px' }}>{a.cred2Subtitle}</p>
                <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#C8B89A' }}>{a.cred2Desc}</p>
              </div>
            </div>
          </section>

          {/* Testimonials — reuse existing translations */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={h2Style}>{a.testimonialTitle}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {t.testimonials.items.map(({ quote, author }) => (
                <blockquote key={author} style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderLeft: '3px solid #C4A882',
                  borderRadius: '0 8px 8px 0',
                  padding: '20px 24px',
                  margin: 0,
                }}>
                  <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#C8B89A', marginBottom: '10px' }}>
                    &ldquo;{quote}&rdquo;
                  </p>
                  <cite style={{ fontSize: '13px', color: '#888888', fontStyle: 'normal' }}>— {author}</cite>
                </blockquote>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(196,168,130,0.08), rgba(196,168,130,0.03))',
            border: '1px solid rgba(196,168,130,0.2)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '16px', color: '#C8B89A', marginBottom: '20px', lineHeight: 1.6 }}>
              {a.ctaText}
            </p>
            <Link href="/saju/input" style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #C4A882, #A67C52)',
              color: '#1A1410',
              padding: '14px 32px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '15px',
              textDecoration: 'none',
            }}>
              {a.ctaButton}
            </Link>
          </div>

        </div>
      </main>
    </>
  )
}
