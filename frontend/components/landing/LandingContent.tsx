'use client'

import Link from 'next/link'
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Footer from '@/components/Footer'
import { useLanguage } from '@/app/lib/i18n/context'
import DoorframeHero from '@/components/landing/DoorframeHero'
import { YinYangIcon } from '@/components/ui/YinYangIcon'
import QuestionsBand from '@/components/landing/QuestionsBand'


// Scroll reveal hook. The one-time querySelectorAll ran before the localized
// content had rendered, so every [data-reveal] stayed at opacity 0 — sections
// past the fold never appeared. A MutationObserver picks up nodes added after
// mount and hands them to the same IntersectionObserver.
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement
            el.style.opacity = '1'
            el.style.transform = 'translateY(0)'
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )
    const seen = new WeakSet<Element>()
    const observeAll = () => {
      node.querySelectorAll('[data-reveal]').forEach((el) => {
        if (!seen.has(el)) {
          seen.add(el)
          io.observe(el)
        }
      })
    }
    observeAll()
    const mo = new MutationObserver(observeAll)
    mo.observe(node, { childList: true, subtree: true })
    return () => {
      mo.disconnect()
      io.disconnect()
    }
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

// useLayoutEffect on the client, useEffect on the server (avoids the SSR warning).
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

/** Digits of a localized number string: "43.200" / "43 200" / "43,200" -> 43200. */
function parseLocalizedNumber(s: string): number {
  return Number(s.replace(/\D/g, '')) || 0
}

/**
 * Format `value` with the same grouping separator the source string uses.
 *
 * toLocaleString() formats for the RUNTIME locale, not the page's, so a French
 * page rendered "518,400" where its own copy says "518 400".
 */
function formatLike(value: number, sample: string): string {
  const sep = sample.includes(' ') ? ' ' : sample.includes('.') ? '.' : ','
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, sep)
}

// Animated counter hook — counts from 0 to target on scroll.
//
// Seeded with `target`, NOT 0. These counters hold the two most quotable numbers
// on the site (518,400 combinations / 32,400x). Seeding at 0 meant the server
// rendered a literal "0" into the HTML, so crawlers, AI models and no-JS users
// all saw "0 Saju combinations". The client resets to 0 in a layout effect —
// before paint, so the animation still starts from zero with no visible flash.
function useAnimatedCounter(target: number, duration: number = 2000) {
  const [count, setCount] = useState(target)
  const [triggered, setTriggered] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useIsomorphicLayoutEffect(() => {
    // Only zero out when we can actually animate back up. If the observer can
    // never fire (no IntersectionObserver) or the user asked for reduced
    // motion, keep the real number rather than stranding the page at "0".
    const canAnimate =
      typeof IntersectionObserver !== 'undefined' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (canAnimate && !triggered) setCount(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
  // Doorframe redesign: one family, hierarchy by weight (900/700/400).
  const serifFont = '"Pretendard", -apple-system, sans-serif'
  // Both figures come from the copy, never hardcoded. The multiplier is
  // market-specific — Korea compares against MBTI's 16 types (32,400x), Japan
  // against the four blood types (129,600x), everywhere else against the 12
  // zodiac signs (43,200x) — so a single hardcoded 32,400 was the wrong number
  // on nine of the ten locales.
  const sajuCounter = useAnimatedCounter(parseLocalizedNumber(t.precision.sajuCount), 2400)
  const multiplierCounter = useAnimatedCounter(parseLocalizedNumber(t.precision.multiplier), 2000)

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
      background: '#F7F4EE',
      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <DoorframeHero />

      <QuestionsBand />

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
              color: '#33302A',
              letterSpacing: '-0.03em',
              fontFamily: serifFont
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
                  background: '#F0EBE1',
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
                  <div style={{ width: '24px', height: '2px', background: '#8A6A45', marginBottom: '16px' }} />
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#33302A',
                    marginBottom: '10px',
                    letterSpacing: '-0.01em',
                    fontFamily: serifFont
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
            color: '#8A6A45',
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
              color: '#8A6A45',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}>
              <YinYangIcon size={28} />
            </p>
            <h2 style={{
              fontSize: 'clamp(28px, 5vw, 40px)',
              fontWeight: 700,
              color: '#F0EBE1',
              letterSpacing: '-0.03em',
              fontFamily: serifFont,
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
                fontFamily: serifFont,
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
                color: '#8A6A45',
                fontFamily: serifFont,
                lineHeight: 1,
                marginBottom: '12px',
                letterSpacing: '-0.04em',
              }}>
                {formatLike(sajuCounter.count, t.precision.sajuCount)}
              </p>
              <p style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#F0EBE1',
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
                color: '#8A6A45',
                fontFamily: serifFont,
                letterSpacing: '-0.04em',
                lineHeight: 1,
              }}>
                {formatLike(multiplierCounter.count, t.precision.multiplier)}{t.precision.multiplierSuffix}
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
              color: '#F0EBE1',
              fontFamily: serifFont,
              letterSpacing: '-0.02em',
              lineHeight: 1.5,
            }}>
              {t.precision.tagline}
            </p>
          </div>
        </div>
      </section>

      {/* Basis Section — 계산 근거 공개.
          정밀도(518,400)를 주장한 바로 다음에 온다: "가짓수가 많다"는 주장은
          검증할 수 없으면 광고 문구일 뿐이고, 이 섹션이 그 검증 경로를 준다.
          The Pattern류 앱의 최대 비판이 블랙박스인데 우리는 원래 근거를 화면에
          보여주고 있었다 — 다만 그 사실을 아무 데서도 말하지 않았다. */}
      <section style={{
        width: '100%',
        background: '#FFFFFF',
        padding: 'clamp(60px, 12vw, 120px) clamp(20px, 5vw, 40px)'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div data-reveal style={{ ...revealStyle, textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{
              fontSize: 'clamp(26px, 5vw, 36px)',
              fontWeight: 700,
              color: '#33302A',
              letterSpacing: '-0.03em',
              fontFamily: serifFont,
              lineHeight: 1.35,
              marginBottom: '20px',
            }}>
              {t.basis.heading}
            </h2>
            <p style={{
              fontSize: 'clamp(15px, 2.6vw, 17px)',
              color: '#6B6560',
              lineHeight: 1.75,
              maxWidth: '640px',
              margin: '0 auto',
            }}>
              {t.basis.lead}
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '40px',
          }}>
            {t.basis.items.map((item, i) => (
              <div key={i} data-reveal style={{
                ...revealDelayStyle(i + 1),
                background: '#FAF8F5',
                border: '1px solid rgba(44, 36, 32, 0.08)',
                borderRadius: '16px',
                padding: '28px 24px',
              }}>
                <h3 style={{
                  fontSize: '17px',
                  fontWeight: 600,
                  color: '#33302A',
                  marginBottom: '10px',
                  lineHeight: 1.4,
                  fontFamily: serifFont,
                }}>{item.title}</h3>
                <p style={{
                  fontSize: '14.5px',
                  color: '#6B6560',
                  lineHeight: 1.7,
                  margin: 0,
                }}>{item.desc}</p>
              </div>
            ))}
          </div>

          <p data-reveal style={{
            ...revealDelayStyle(4),
            textAlign: 'center',
            fontSize: 'clamp(17px, 3vw, 21px)',
            fontWeight: 600,
            color: '#4A6354',
            fontFamily: serifFont,
            letterSpacing: '-0.02em',
            lineHeight: 1.5,
            margin: 0,
          }}>
            {t.basis.closing}
          </p>
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
              color: '#33302A',
              letterSpacing: '-0.03em',
              fontFamily: serifFont
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
                  color: '#33302A',
                  marginBottom: '8px',
                  letterSpacing: '-0.02em'
                }}>
                  &ldquo;{item.title}&rdquo;
                </h3>
                <p style={{
                  fontSize: '15px',
                  color: '#78715F',
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
              fontFamily: serifFont,
              lineHeight: 1.7,
              marginBottom: '24px',
            }}>
              {t.problems.bridge || '아이의 타고난 기질을 알면, 답이 보입니다.'}
            </p>
            <Link href="/saju/input" className="df-btn df-btn--primary" style={{ padding: '15px 36px', fontSize: '16px' }}>
                {t.problems.cta || '3분 무료 분석 시작하기'}
            </Link>
          </div>
        </div>
      </section>

      {/* Founder Story */}
      <section style={{
        width: '100%',
        background: '#F7F4EE',
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
              <YinYangIcon size={16} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#7A6420' }}>
                {t.founder.role}
              </span>
            </div>

            <h2 style={{
              fontSize: 'clamp(24px, 3.5vw, 32px)',
              fontWeight: 700,
              color: '#33302A',
              letterSpacing: '-0.03em',
              marginBottom: '24px',
              fontFamily: serifFont,
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
                background: 'linear-gradient(135deg, #33302A, #2C5238)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0
              }}>
                <YinYangIcon size={14} />
              </div>
              <div>
                <p style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#33302A',
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
              color: '#33302A',
              letterSpacing: '-0.03em',
              fontFamily: serifFont
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
                    background: '#33302A',
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
            <Link href="/saju/input" className="df-btn df-btn--primary" style={{ padding: '15px 36px', fontSize: '16px' }}>
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
              color: '#33302A',
              letterSpacing: '-0.03em',
              fontFamily: serifFont
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
                  color: '#33302A',
                  lineHeight: 1.8,
                  fontFamily: serifFont,
                  marginBottom: '16px',
                  whiteSpace: 'pre-line',
                }}>
                  &ldquo;{t.testimonials.items[0].quote}&rdquo;
                </p>
                <p style={{ fontSize: '14px', color: '#8A6A45' }}>
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
                    <p style={{ fontSize: '13px', color: '#8A6A45', margin: 0 }}>
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
            color: '#33302A',
            marginBottom: '14px',
            letterSpacing: '-0.02em',
            fontFamily: serifFont
          }}>
            {t.share.heading}
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#78715F',
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
              background: '#33302A',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(51, 48, 42, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'background 0.2s ease, transform 0.2s ease'
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
        background: '#F7F4EE',
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

      {/* Sample excerpt — 리포트 실물 한 조각. 블러 대신 실제 두 항목을 그대로 보여준다.
          출처는 측정 스크립트의 가상 원국(Minseo) 리포트, output/premium-artifacts. */}
      {(t as any).sampleExcerpt && (
        <section data-reveal style={{
          ...revealStyle,
          width: '100%',
          background: '#F7F3EC',
          padding: 'clamp(60px, 10vw, 100px) clamp(20px, 5vw, 40px)'
        }}>
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <span style={{ display: 'inline-block', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8A6A45', fontWeight: 600, marginBottom: '12px' }}>
                {(t as any).sampleExcerpt.badge}
              </span>
              <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 700, color: '#2A2420', fontFamily: 'serif', margin: '0 0 12px' }}>
                {(t as any).sampleExcerpt.heading}
              </h2>
              <p style={{ fontSize: '15px', color: '#6B5E52', lineHeight: 1.7, margin: 0 }}>
                {(t as any).sampleExcerpt.sub}
              </p>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid rgba(184,146,45,0.18)', borderRadius: '14px', padding: 'clamp(20px, 4vw, 32px)', boxShadow: '0 8px 30px rgba(42,36,32,0.06)' }}>
              <div style={{ fontSize: '13px', color: '#8A6A45', fontWeight: 600, marginBottom: '18px' }}>
                {(t as any).sampleExcerpt.section}
              </div>
              {(t as any).sampleExcerpt.items.map((it: { mis: string; real: string; better: string }, i: number) => (
                <div key={i} style={{ paddingBottom: '18px', marginBottom: '18px', borderBottom: i === 0 ? '1px dashed rgba(42,36,32,0.12)' : 'none' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '15px', lineHeight: 1.7, color: '#2A2420' }}>
                    <strong style={{ color: '#8A6D1F' }}>{(t as any).sampleExcerpt.mis}:</strong> {it.mis}
                  </p>
                  <p style={{ margin: '0 0 8px', fontSize: '15px', lineHeight: 1.7, color: '#2A2420' }}>
                    <strong style={{ color: '#8A6D1F' }}>{(t as any).sampleExcerpt.real}:</strong> {it.real}
                  </p>
                  <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.7, color: '#2A2420' }}>
                    <strong style={{ color: '#33302A' }}>{(t as any).sampleExcerpt.better}:</strong> {it.better}
                  </p>
                </div>
              ))}
              <p style={{ margin: 0, fontSize: '13px', color: '#6B5E52', lineHeight: 1.6 }}>
                {(t as any).sampleExcerpt.note}
              </p>
            </div>
          </div>
        </section>
      )}

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
              fontFamily: serifFont
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
                    <span style={{ color: '#33302A', fontSize: '18px' }}>✓</span> {item}
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
                  WebkitTextFillColor: '#FFFFFF',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
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
              background: '#33302A',
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
                background: '#8A6A45',
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
                {t.pricing.premium.originalPrice && (
                  <p style={{
                    fontSize: '18px',
                    fontWeight: 500,
                    color: 'rgba(255, 255, 255, 0.4)',
                    textDecoration: 'line-through',
                    margin: 0
                  }}>{t.pricing.premium.originalPrice}</p>
                )}
              </div>
              <p style={{
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '32px'
              }}>{t.pricing.premium.note}</p>
              {/* 실재 가격 앵커. 가짜 정가 취소선 대신 검증된 카테고리 비교만 쓴다
                  (Etsy 사주 PDF $10~36 실측, CliftonStrengths 34 $59.99, 대면 상담 $30~300 — 2026-08). */}
              {(t.pricing.premium as any).priceContext && (
                <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.45)', lineHeight: 1.6, margin: '-24px 0 32px' }}>
                  {(t.pricing.premium as any).priceContext}
                </p>
              )}
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
                  color: '#33302A',
                  WebkitTextFillColor: '#33302A',
                  background: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
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
            <p data-reveal style={{ ...revealStyle, textAlign: 'center', fontSize: '12px', color: '#8A6A45', marginTop: '16px' }}>
              {t.pricing.currencyNote}
            </p>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section style={{
        width: '100%',
        background: '#F7F4EE',
        padding: 'clamp(60px, 12vw, 120px) clamp(20px, 5vw, 40px)'
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div data-reveal style={{ ...revealStyle, textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{
              fontSize: '36px',
              fontWeight: 700,
              color: '#33302A',
              letterSpacing: '-0.03em',
              fontFamily: serifFont
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
                    color: '#33302A'
                  }}>{item.q}</span>
                  <span style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: openFaq === idx ? '#33302A' : '#F5EFED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: openFaq === idx ? '#FFFFFF' : '#78715F',
                    fontSize: '18px',
                    fontWeight: 600,
                    transition: 'color 0.2s ease, transform 0.2s ease',
                    flexShrink: 0
                  }}>
                    {openFaq === idx ? '−' : '+'}
                  </span>
                </button>
                {openFaq === idx && (
                  <div style={{ padding: '0 28px 24px' }}>
                    <p style={{
                      fontSize: '15px',
                      color: '#78715F',
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
        background: '#33302A',
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
            fontFamily: serifFont
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
                color: '#33302A',
                WebkitTextFillColor: '#33302A',
                background: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: 'none',
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
                background: '#33302A',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 20px rgba(51, 48, 42, 0.15)'
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
