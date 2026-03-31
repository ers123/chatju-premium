'use client'

import Link from 'next/link'
import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Footer from '@/components/Footer'
import { useLanguage } from '@/app/lib/i18n/context'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'


// Scroll reveal hook
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement
            el.style.opacity = '1'
            el.style.transform = 'translateY(0)'
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )
    const elements = node.querySelectorAll('[data-reveal]')
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return ref
}

const revealStyle: React.CSSProperties = {
  opacity: 0,
  transform: 'translateY(24px)',
  transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
}

function revealDelayStyle(delay: number): React.CSSProperties {
  return {
    ...revealStyle,
    transitionDelay: `${delay * 0.1}s`,
  }
}

// Animated counter hook — counts from 0 to target on scroll
function useAnimatedCounter(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0)
  const [triggered, setTriggered] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered) {
          setTriggered(true)
          const startTime = performance.now()
          const step = (now: number) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * target))
            if (progress < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [target, duration, triggered])

  return { count, ref }
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const pageRef = useScrollReveal()
  const { lang, setLang, t } = useLanguage()
  const sajuCounter = useAnimatedCounter(518400, 2400)
  const multiplierCounter = useAnimatedCounter(32400, 2000)

  const handleShare = useCallback(async () => {
    const url = 'https://somyung.cc'
    const title = t.share.heading
    const text = t.share.desc.replace('\n', ' ')

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
      } catch {
        // user cancelled — ignore
      }
    } else {
      await navigator.clipboard.writeText(url)
      alert('Link copied!')
    }
  }, [t.share.heading, t.share.desc])

  const images = [
    '/assets/images/key_nature_sprout_new.png',
    '/assets/images/key_talent_gemstone_1769231816379.png',
    '/assets/images/key_future_path_1769231832370.png',
  ]

  return (
    <div ref={pageRef} style={{
      minHeight: '100vh',
      background: '#FEFDFB',
      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(254, 253, 251, 0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '0 40px',
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#2C2420',
              letterSpacing: '-0.04em'
            }}>
              ☯ SoMyung
            </span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <LanguageSwitcher currentLang={lang} onSelect={setLang} mode="navigate" />
            <Link href="/saju/input" style={{
                height: '44px',
                padding: '0 28px',
                fontSize: '15px',
                fontWeight: 600,
                color: '#FFFFFF',
                background: '#2C2420',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {t.nav.start}
            </Link>
          </div>
        </div>
      </nav>

      {/* Free Beta Banner */}
      <div style={{
        position: 'fixed',
        top: '72px',
        left: 0,
        right: 0,
        zIndex: 49,
        background: 'linear-gradient(90deg, #1A3D2E, #2C5238)',
        padding: '10px 20px',
        textAlign: 'center'
      }}>
        <span style={{
          fontSize: '14px',
          color: '#FFFFFF',
          fontWeight: 500
        }}>
          {t.banner}
        </span>
      </div>

      {/* Hero Section */}
      <section style={{
        width: '100%',
        padding: 'clamp(160px, 25vw, 220px) clamp(20px, 5vw, 40px) clamp(60px, 10vw, 100px)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: 'clamp(36px, 5.5vw, 52px)',
            fontWeight: 700,
            color: '#2C2420',
            lineHeight: 1.2,
            letterSpacing: '-0.04em',
            marginBottom: '28px',
            fontFamily: '"Nanum Myeongjo", serif'
          }}>
            {t.hero.title1}<br />
            <span style={{ color: '#B8922D' }}>{t.hero.titleAccent}</span><br />
            {t.hero.title2}
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 4vw, 19px)',
            color: '#666666',
            lineHeight: 1.7,
            marginBottom: '20px',
            fontWeight: 400
          }}>
            {t.hero.subtitle}<br />
            {t.hero.subtitle2}
          </p>

          <p style={{
            fontSize: 'clamp(14px, 3.5vw, 16px)',
            color: '#9B8B7A',
            lineHeight: 1.8,
            fontStyle: 'italic',
            marginBottom: 'clamp(32px, 6vw, 48px)',
            fontFamily: '"Nanum Myeongjo", serif',
            whiteSpace: 'pre-line',
          }}>
            &ldquo;{t.coreInsight}&rdquo;
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            alignItems: 'center',
            marginBottom: '28px'
          }}>
            <Link href="/saju/input" style={{
                height: 'clamp(52px, 8vw, 60px)',
                padding: '0 clamp(28px, 6vw, 44px)',
                fontSize: 'clamp(15px, 3.5vw, 17px)',
                fontWeight: 600,
                color: '#FFFFFF',
                background: '#1A3D2E',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(26, 61, 46, 0.25)',
                transition: 'all 0.2s ease',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {t.hero.cta}
            </Link>
          </div>

          <p style={{
            fontSize: 'clamp(12px, 3vw, 14px)',
            color: '#767676',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap' as const,
            gap: 'clamp(10px, 3vw, 20px)'
          }}>
            <span>✓ {t.hero.check1}</span>
            <span>✓ {t.hero.check2}</span>
            <span>✓ {t.hero.check3}</span>
          </p>
        </div>
      </section>

      {/* Feature Cards */}
      <section style={{
        width: '100%',
        padding: 'clamp(40px, 8vw, 60px) clamp(20px, 5vw, 40px) clamp(60px, 12vw, 120px)'
      }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto'
        }}>
          <div data-reveal style={{ ...revealStyle, textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{
              fontSize: '36px',
              fontWeight: 700,
              color: '#2C2420',
              letterSpacing: '-0.03em',
              fontFamily: '"Nanum Myeongjo", serif'
            }}>
              {t.features.heading}
            </h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 'clamp(16px, 3vw, 24px)'
          }}>
            {t.features.items.map((item, idx) => (
              <div key={idx} data-reveal style={{
                ...revealDelayStyle(idx + 1),
                background: '#FFFFFF',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <div style={{
                  width: '100%',
                  background: '#F5F0EB',
                  overflow: 'hidden',
                }}>
                  <Image
                    src={images[idx]}
                    alt={item.title}
                    width={600}
                    height={400}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                    }}
                  />
                </div>
                <div style={{ padding: '28px 24px' }}>
                  <div style={{ width: '24px', height: '2px', background: '#B8922D', marginBottom: '16px' }} />
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#2C2420',
                    marginBottom: '10px',
                    letterSpacing: '-0.01em',
                    fontFamily: '"Nanum Myeongjo", serif'
                  }}>
                    {item.title}
                  </h3>
                  <p style={{
                    fontSize: '15px',
                    color: '#6B5E52',
                    lineHeight: 1.6,
                    margin: 0
                  }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Saju Definition — AI-citability anchor */}
      <section id="saju-definition" style={{
        width: '100%',
        background: '#FAF8F5',
        padding: 'clamp(40px, 8vw, 64px) clamp(20px, 5vw, 40px)',
        borderTop: '1px solid rgba(0,0,0,0.05)',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#9B8B7A',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}>
            {t.sajuDef.heading}
          </h2>
          <p style={{
            fontSize: '17px',
            lineHeight: 1.8,
            color: '#3D3028',
          }}>
            {t.sajuDef.body}
          </p>
        </div>
      </section>

      {/* Precision Section — 518,400 vs 16 */}
      <section style={{
        width: '100%',
        background: '#2A2420',
        padding: 'clamp(64px, 12vw, 120px) clamp(20px, 5vw, 40px)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Section heading */}
          <div data-reveal style={{ ...revealStyle, textAlign: 'center', marginBottom: 'clamp(48px, 8vw, 72px)' }}>
            <p style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#B8922D',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}>
              ☯
            </p>
            <h2 style={{
              fontSize: 'clamp(28px, 5vw, 40px)',
              fontWeight: 700,
              color: '#F5F0EB',
              letterSpacing: '-0.03em',
              fontFamily: '"Nanum Myeongjo", serif',
              lineHeight: 1.3,
            }}>
              {t.precision.heading}
            </h2>
          </div>

          {/* Two-column comparison — asymmetric: MBTI small, Saju emphasized */}
          <div data-reveal style={{
            ...revealDelayStyle(1),
            display: 'grid',
            gridTemplateColumns: '2fr 3fr',
            gap: 'clamp(16px, 3vw, 24px)',
            marginBottom: 'clamp(48px, 8vw, 64px)',
          }}>
            {/* MBTI Card — muted */}
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '20px',
              padding: 'clamp(28px, 5vw, 40px)',
              border: '1px solid rgba(255,255,255,0.06)',
              textAlign: 'center',
            }}>
              <p style={{
                fontSize: 'clamp(56px, 12vw, 80px)',
                fontWeight: 800,
                color: 'rgba(245, 240, 235, 0.25)',
                fontFamily: '"Nanum Myeongjo", serif',
                lineHeight: 1,
                marginBottom: '12px',
                letterSpacing: '-0.04em',
              }}>
                {t.precision.mbtiCount}
              </p>
              <p style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'rgba(245, 240, 235, 0.5)',
                marginBottom: '12px',
              }}>
                {t.precision.mbtiLabel}
              </p>
              <p style={{
                fontSize: '14px',
                color: 'rgba(245, 240, 235, 0.3)',
                lineHeight: 1.6,
              }}>
                {t.precision.mbtiDesc}
              </p>
            </div>

            {/* Saju Card — gold/highlighted */}
            <div ref={sajuCounter.ref} style={{
              background: 'linear-gradient(135deg, rgba(184, 146, 45, 0.12) 0%, rgba(184, 146, 45, 0.04) 100%)',
              borderRadius: '20px',
              padding: 'clamp(28px, 5vw, 40px)',
              border: '1px solid rgba(184, 146, 45, 0.25)',
              textAlign: 'center',
              boxShadow: '0 4px 24px rgba(184, 146, 45, 0.06)',
            }}>
              <p style={{
                fontSize: 'clamp(44px, 10vw, 72px)',
                fontWeight: 800,
                color: '#B8922D',
                fontFamily: '"Nanum Myeongjo", serif',
                lineHeight: 1,
                marginBottom: '12px',
                letterSpacing: '-0.04em',
              }}>
                {sajuCounter.count.toLocaleString()}
              </p>
              <p style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#F5F0EB',
                marginBottom: '12px',
              }}>
                {t.precision.sajuLabel}
              </p>
              <p style={{
                fontSize: '14px',
                color: 'rgba(245, 240, 235, 0.6)',
                lineHeight: 1.6,
              }}>
                {t.precision.sajuDesc}
              </p>
            </div>
          </div>

          {/* Multiplier stat */}
          <div data-reveal style={{
            ...revealDelayStyle(2),
            textAlign: 'center',
            marginBottom: '32px',
          }}>
            <div ref={multiplierCounter.ref} style={{
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: '4px',
            }}>
              <span style={{
                fontSize: 'clamp(48px, 10vw, 72px)',
                fontWeight: 800,
                color: '#B8922D',
                fontFamily: '"Nanum Myeongjo", serif',
                letterSpacing: '-0.04em',
                lineHeight: 1,
              }}>
                {multiplierCounter.count.toLocaleString()}{t.precision.multiplierSuffix}
              </span>
            </div>
            <p style={{
              fontSize: 'clamp(15px, 3.5vw, 18px)',
              color: 'rgba(245, 240, 235, 0.6)',
              marginTop: '12px',
            }}>
              {t.precision.multiplierLabel}
            </p>
          </div>

          {/* Tagline */}
          <div data-reveal style={{
            ...revealDelayStyle(3),
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: 'clamp(18px, 4vw, 24px)',
              fontWeight: 600,
              color: '#F5F0EB',
              fontFamily: '"Nanum Myeongjo", serif',
              letterSpacing: '-0.02em',
              lineHeight: 1.5,
            }}>
              {t.precision.tagline}
            </p>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section style={{
        width: '100%',
        background: '#FFFFFF',
        padding: 'clamp(60px, 12vw, 120px) clamp(20px, 5vw, 40px)'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div data-reveal style={{ ...revealStyle, textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{
              fontSize: '36px',
              fontWeight: 700,
              color: '#2C2420',
              letterSpacing: '-0.03em',
              fontFamily: '"Nanum Myeongjo", serif'
            }}>
              {t.problems.heading}
            </h2>
          </div>

          <div style={{
            maxWidth: '640px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '28px'
          }}>
            {t.problems.items.map((item, idx) => (
              <div key={idx} data-reveal style={{
                ...revealDelayStyle(idx + 1),
                paddingLeft: '24px',
                borderLeft: '2px solid rgba(184, 146, 45, 0.3)',
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#2C2420',
                  marginBottom: '8px',
                  letterSpacing: '-0.02em'
                }}>
                  &ldquo;{item.title}&rdquo;
                </h3>
                <p style={{
                  fontSize: '15px',
                  color: '#666666',
                  lineHeight: 1.7,
                  margin: 0
                }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Problem → Solution bridge */}
          <div data-reveal style={{
            ...revealStyle,
            textAlign: 'center',
            marginTop: '48px',
          }}>
            <p style={{
              fontSize: '17px',
              color: '#4A3F36',
              fontFamily: '"Nanum Myeongjo", serif',
              lineHeight: 1.7,
              marginBottom: '24px',
            }}>
              {t.problems.bridge || '아이의 타고난 기질을 알면, 답이 보입니다.'}
            </p>
            <Link href="/saju/input" style={{
                padding: '14px 36px',
                fontSize: '16px',
                fontWeight: 600,
                color: '#FFFFFF',
                background: '#1A3D2E',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(26, 61, 46, 0.12)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {t.problems.cta || '3분 무료 분석 시작하기'}
            </Link>
          </div>
        </div>
      </section>

      {/* Founder Story */}
      <section style={{
        width: '100%',
        background: '#FEFDFB',
        padding: 'clamp(48px, 10vw, 100px) clamp(20px, 5vw, 40px)'
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div data-reveal style={{
            ...revealStyle,
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: '56px 48px',
            border: '1px solid rgba(184, 146, 45, 0.15)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.05)'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '6px',
              background: 'rgba(184, 146, 45, 0.08)',
              border: '1px solid rgba(184, 146, 45, 0.2)',
              marginBottom: '32px'
            }}>
              <span style={{ fontSize: '16px' }}>☯</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#7A6420' }}>
                {t.founder.role}
              </span>
            </div>

            <h2 style={{
              fontSize: 'clamp(24px, 3.5vw, 32px)',
              fontWeight: 700,
              color: '#2C2420',
              letterSpacing: '-0.03em',
              marginBottom: '24px',
              fontFamily: '"Nanum Myeongjo", serif',
              lineHeight: 1.3
            }}>
              {t.founder.heading}
            </h2>

            <p style={{
              fontSize: '17px',
              color: '#4A3F36',
              lineHeight: 1.8,
              marginBottom: '20px'
            }}>
              {t.founder.story}
            </p>

            <p style={{
              fontSize: '17px',
              color: '#4A3F36',
              lineHeight: 1.8,
              marginBottom: '40px'
            }}>
              {t.founder.detail}
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              paddingTop: '32px',
              borderTop: '1px solid rgba(0,0,0,0.06)'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1A3D2E, #2C5238)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0
              }}>
                ☯
              </div>
              <div>
                <p style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#2C2420',
                  margin: '0 0 4px'
                }}>
                  {t.founder.name}
                </p>
                <p style={{
                  fontSize: '13px',
                  color: '#7A6420',
                  margin: 0,
                  lineHeight: 1.5
                }}>
                  {t.founder.credentials}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{
        width: '100%',
        background: '#F5EFED',
        padding: 'clamp(60px, 12vw, 120px) clamp(20px, 5vw, 40px)'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div data-reveal style={{ ...revealStyle, textAlign: 'center', marginBottom: '72px' }}>
            <h2 style={{
              fontSize: '36px',
              fontWeight: 700,
              color: '#2C2420',
              letterSpacing: '-0.03em',
              fontFamily: '"Nanum Myeongjo", serif'
            }}>
              {t.howItWorks.heading}
            </h2>
          </div>

          <div style={{
            maxWidth: '640px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {t.howItWorks.items.map((item, idx) => (
              <div key={idx} data-reveal style={{
                ...revealDelayStyle(idx + 1),
                display: 'flex',
                gap: '24px',
              }}>
                {/* Step number + connector line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#1A3D2E',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {idx + 1}
                  </div>
                  {idx < t.howItWorks.items.length - 1 && (
                    <div style={{ width: '1px', flex: 1, background: '#DDD6CC', margin: '8px 0' }} />
                  )}
                </div>

                {/* Content */}
                <div style={{ paddingBottom: '40px' }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#212529',
                    marginBottom: '10px',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.3
                  }}>
                    {item.title}
                  </h3>

                  <p style={{
                    fontSize: '16px',
                    color: '#6C757D',
                    lineHeight: 1.6,
                    marginBottom: '16px',
                  }}>
                    {item.desc}
                  </p>

                  <div style={{
                    borderLeft: '2px solid rgba(184, 146, 45, 0.3)',
                    paddingLeft: '16px',
                    background: '#F8F9FA',
                    padding: '14px 16px',
                    borderRadius: '0 8px 8px 0'
                  }}>
                    <p style={{
                      fontSize: '14px',
                      color: '#4A3F36',
                      lineHeight: 1.6,
                      margin: 0,
                      fontStyle: 'italic'
                    }}>
                      &ldquo;{item.example}&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '64px' }}>
            <Link href="/saju/input" style={{
                height: '60px',
                padding: '0 48px',
                fontSize: '17px',
                fontWeight: 600,
                color: '#FFFFFF',
                background: '#1A3D2E',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(26, 61, 46, 0.25)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {t.howItWorks.cta}
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{
        width: '100%',
        background: '#FFFFFF',
        padding: 'clamp(60px, 12vw, 120px) clamp(20px, 5vw, 40px)'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div data-reveal style={{ ...revealStyle, textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{
              fontSize: '36px',
              fontWeight: 700,
              color: '#2C2420',
              letterSpacing: '-0.03em',
              fontFamily: '"Nanum Myeongjo", serif'
            }}>
              {t.testimonials.heading}
            </h2>
          </div>

          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            {/* Featured testimonial */}
            {t.testimonials.items.length > 0 && (
              <div data-reveal style={{
                ...revealStyle,
                textAlign: 'center',
                marginBottom: '40px',
              }}>
                <span style={{
                  display: 'inline-block',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  background: 'rgba(184, 146, 45, 0.08)',
                  border: '1px solid rgba(184, 146, 45, 0.15)',
                  color: '#7A6420',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '24px'
                }}>
                  {t.testimonials.items[0].tag}
                </span>
                <p style={{
                  fontSize: '20px',
                  color: '#2C2420',
                  lineHeight: 1.8,
                  fontFamily: '"Nanum Myeongjo", serif',
                  marginBottom: '16px',
                  whiteSpace: 'pre-line',
                }}>
                  &ldquo;{t.testimonials.items[0].quote}&rdquo;
                </p>
                <p style={{ fontSize: '14px', color: '#9B8B7A' }}>
                  — {t.testimonials.items[0].author}
                </p>
              </div>
            )}

            {/* Supporting testimonials */}
            {t.testimonials.items.length > 1 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                paddingTop: '32px',
                borderTop: '1px solid rgba(0, 0, 0, 0.06)',
              }}>
                {t.testimonials.items.slice(1).map((item, idx) => (
                  <div key={idx} data-reveal style={{
                    ...revealDelayStyle(idx + 1),
                    background: '#FAF8F5',
                    borderRadius: '12px',
                    padding: '24px',
                  }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      background: 'rgba(184, 146, 45, 0.08)',
                      color: '#7A6420',
                      fontSize: '12px',
                      fontWeight: 600,
                      marginBottom: '14px'
                    }}>
                      {item.tag}
                    </span>
                    <p style={{
                      fontSize: '15px',
                      color: '#333333',
                      lineHeight: 1.7,
                      marginBottom: '12px'
                    }}>
                      &ldquo;{item.quote}&rdquo;
                    </p>
                    <p style={{ fontSize: '13px', color: '#9B8B7A', margin: 0 }}>
                      — {item.author}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Kakao Share Section */}
      <section data-reveal style={{
        ...revealStyle,
        width: '100%',
        background: '#FFFFFF',
        padding: 'clamp(48px, 10vw, 80px) clamp(20px, 5vw, 40px)',
        borderTop: '1px solid #F0F0F0',
        borderBottom: '1px solid #F0F0F0'
      }}>
        <div style={{
          maxWidth: '560px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#2C2420',
            marginBottom: '14px',
            letterSpacing: '-0.02em',
            fontFamily: '"Nanum Myeongjo", serif'
          }}>
            {t.share.heading}
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#666666',
            marginBottom: '32px',
            lineHeight: 1.6,
            whiteSpace: 'pre-line'
          }}>
            {t.share.desc}
          </p>
          <button
            onClick={handleShare}
            style={{
              height: '54px',
              padding: '0 32px',
              fontSize: '15px',
              fontWeight: 600,
              color: '#FFFFFF',
              background: '#2D3A35',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(45, 58, 53, 0.2)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.2s ease'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            {t.share.button}
          </button>
        </div>
      </section>

      {/* Trust Signals */}
      <section data-reveal style={{
        ...revealStyle,
        width: '100%',
        background: '#FEFDFB',
        padding: 'clamp(40px, 8vw, 60px) clamp(20px, 5vw, 40px)'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            {t.trust.map((badge, idx) => (
              <span key={idx} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                color: '#6B5E52',
                fontWeight: 500,
                padding: '10px 20px',
                borderRadius: '6px',
                background: 'rgba(184, 146, 45, 0.06)',
                border: '1px solid rgba(184, 146, 45, 0.12)'
              }}>
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{
        width: '100%',
        background: '#2A2420',
        padding: 'clamp(60px, 12vw, 120px) clamp(20px, 5vw, 40px)'
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div data-reveal style={{ ...revealStyle, textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{
              fontSize: '36px',
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.03em',
              marginBottom: '12px',
              fontFamily: '"Nanum Myeongjo", serif'
            }}>
              {t.pricing.heading}
            </h2>
            <p style={{ fontSize: '16px', color: '#888888' }}>
              {t.pricing.subtitle}
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {/* Free */}
            <div data-reveal style={{
              ...revealDelayStyle(1),
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '24px',
              padding: '40px 32px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 500,
                color: '#FFFFFF',
                marginBottom: '12px'
              }}>{t.pricing.free.name}</h3>
              <p style={{
                fontSize: '40px',
                fontWeight: 700,
                color: '#FFFFFF',
                marginBottom: '32px'
              }}>{t.pricing.free.price}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', flex: 1 }}>
                {t.pricing.free.features.map((item, i) => (
                  <li key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '15px',
                    color: '#AAAAAA',
                    marginBottom: '16px'
                  }}>
                    <span style={{ color: '#1A3D2E', fontSize: '18px' }}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link href="/saju/input" style={{
                  display: 'flex',
                  width: '100%',
                  height: '52px',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {t.pricing.free.cta}
              </Link>
            </div>

            {/* Premium */}
            <div data-reveal style={{
              ...revealDelayStyle(2),
              background: '#1A3D2E',
              borderRadius: '24px',
              padding: '40px 32px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <span style={{
                position: 'absolute',
                top: '-14px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#B8922D',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 600,
                padding: '6px 20px',
                borderRadius: '100px'
              }}>
                {t.pricing.premium.badge}
              </span>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '12px'
              }}>{t.pricing.premium.name}</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '4px' }}>
                <p style={{
                  fontSize: '40px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  margin: 0
                }}>{t.pricing.premium.price}</p>
                <p style={{
                  fontSize: '18px',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.4)',
                  textDecoration: 'line-through',
                  margin: 0
                }}>{t.pricing.premium.originalPrice}</p>
              </div>
              <p style={{
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '32px'
              }}>{t.pricing.premium.note}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', flex: 1 }}>
                {t.pricing.premium.features.map((item, i) => (
                  <li key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '15px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    marginBottom: '16px'
                  }}>
                    <span style={{ fontSize: '18px' }}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link href="/saju/input" style={{
                  display: 'flex',
                  marginTop: 'auto',
                  width: '100%',
                  height: '52px',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#1A3D2E',
                  background: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {t.pricing.premium.cta}
              </Link>
            </div>
          </div>
          {t.pricing.currencyNote && (
            <p data-reveal style={{ ...revealStyle, textAlign: 'center', fontSize: '12px', color: '#9B8B7A', marginTop: '16px' }}>
              {t.pricing.currencyNote}
            </p>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section style={{
        width: '100%',
        background: '#FEFDFB',
        padding: 'clamp(60px, 12vw, 120px) clamp(20px, 5vw, 40px)'
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div data-reveal style={{ ...revealStyle, textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{
              fontSize: '36px',
              fontWeight: 700,
              color: '#2C2420',
              letterSpacing: '-0.03em',
              fontFamily: '"Nanum Myeongjo", serif'
            }}>
              {t.faq.heading}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {t.faq.items.map((item, idx) => (
              <div key={idx} style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid rgba(0, 0, 0, 0.04)',
                overflow: 'hidden'
              }}>
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '24px 28px',
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{
                    fontSize: '16px',
                    fontWeight: 500,
                    color: '#2C2420'
                  }}>{item.q}</span>
                  <span style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: openFaq === idx ? '#1A3D2E' : '#F5EFED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: openFaq === idx ? '#FFFFFF' : '#666666',
                    fontSize: '18px',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}>
                    {openFaq === idx ? '−' : '+'}
                  </span>
                </button>
                {openFaq === idx && (
                  <div style={{ padding: '0 28px 24px' }}>
                    <p style={{
                      fontSize: '15px',
                      color: '#666666',
                      lineHeight: 1.8,
                      margin: 0
                    }}>
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section data-reveal style={{
        ...revealStyle,
        width: '100%',
        background: '#1A3D2E',
        padding: 'clamp(48px, 10vw, 100px) clamp(20px, 5vw, 40px)'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '-0.03em',
            marginBottom: '20px',
            lineHeight: 1.3,
            fontFamily: '"Nanum Myeongjo", serif'
          }}>
            {t.cta.title1}<br />{t.cta.title2}
          </h2>
          <p style={{
            fontSize: '17px',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '40px'
          }}>
            {t.cta.subtitle}
          </p>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            alignItems: 'center'
          }}>
            <Link href="/saju/input" style={{
                height: '60px',
                padding: '0 48px',
                fontSize: '17px',
                fontWeight: 600,
                color: '#1A3D2E',
                background: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {t.cta.button}
            </Link>
            <button
              onClick={handleShare}
              style={{
                height: '60px',
                padding: '0 48px',
                fontSize: '17px',
                fontWeight: 600,
                color: '#FFFFFF',
                background: '#2D3A35',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 20px rgba(45, 58, 53, 0.2)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              {t.cta.shareButton}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
