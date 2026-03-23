'use client'

import Link from 'next/link'
import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Footer from '@/components/Footer'
import { useLanguage } from './lib/i18n/context'
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

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const pageRef = useScrollReveal()
  const { lang, setLang, t } = useLanguage()

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
            <LanguageSwitcher currentLang={lang} onSelect={setLang} />
            <Link href="/saju/input">
              <button style={{
                height: '44px',
                padding: '0 28px',
                fontSize: '15px',
                fontWeight: 600,
                color: '#FFFFFF',
                background: '#2C2420',
                border: 'none',
                borderRadius: '22px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>
                {t.nav.start}
              </button>
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
        padding: '200px 40px 100px',
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
            fontSize: '19px',
            color: '#666666',
            lineHeight: 1.7,
            marginBottom: '48px',
            fontWeight: 400
          }}>
            {t.hero.subtitle}<br />
            {t.hero.subtitle2}
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            alignItems: 'center',
            marginBottom: '28px'
          }}>
            <Link href="/saju/input">
              <button style={{
                height: '60px',
                padding: '0 44px',
                fontSize: '17px',
                fontWeight: 600,
                color: '#FFFFFF',
                background: '#1A3D2E',
                border: 'none',
                borderRadius: '30px',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(26, 61, 46, 0.25)',
                transition: 'all 0.2s ease'
              }}>
                {t.hero.cta}
              </button>
            </Link>
          </div>

          <p style={{
            fontSize: '14px',
            color: '#999999',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px'
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
        padding: '60px 40px 120px'
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
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px'
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
                  position: 'relative',
                  width: '100%',
                  height: '280px',
                  background: '#F5F0EB'
                }}>
                  <Image
                    src={images[idx]}
                    alt={item.title}
                    fill
                    style={{
                      objectFit: 'cover',
                      objectPosition: 'center top'
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

      {/* Problem Section */}
      <section style={{
        width: '100%',
        background: '#FFFFFF',
        padding: '120px 40px'
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
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px'
          }}>
            {t.problems.items.map((item, idx) => (
              <div key={idx} data-reveal style={{
                ...revealDelayStyle((idx % 2) + 1),
                background: '#FEFDFB',
                borderRadius: '20px',
                padding: '32px',
                border: '1px solid rgba(0, 0, 0, 0.04)'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#2C2420',
                  marginBottom: '10px',
                  letterSpacing: '-0.02em'
                }}>
                  &ldquo;{item.title}&rdquo;
                </h3>
                <p style={{
                  fontSize: '15px',
                  color: '#666666',
                  lineHeight: 1.6,
                  margin: 0
                }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{
        width: '100%',
        background: '#F5EFED',
        padding: '120px 40px'
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
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px'
          }}>
            {t.howItWorks.items.map((item, idx) => (
              <div key={idx} data-reveal style={{
                ...revealDelayStyle(idx + 1),
                background: '#FFFFFF',
                borderRadius: '8px',
                padding: '32px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  width: '32px',
                  height: '3px',
                  background: '#B8922D',
                  marginBottom: '20px',
                  borderRadius: '2px'
                }} />

                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#212529',
                  marginBottom: '16px',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2
                }}>
                  {item.title}
                </h3>

                <p style={{
                  fontSize: '16px',
                  color: '#6C757D',
                  lineHeight: 1.5,
                  marginBottom: '24px',
                  flex: 1
                }}>
                  {item.desc}
                </p>

                <div style={{
                  borderLeft: '3px solid #B8922D',
                  paddingLeft: '16px',
                  background: '#F8F9FA',
                  padding: '16px',
                  borderRadius: '0 6px 6px 0'
                }}>
                  <p style={{
                    fontSize: '14px',
                    color: '#343A40',
                    lineHeight: 1.6,
                    margin: 0,
                    fontStyle: 'italic'
                  }}>
                    &ldquo;{item.example}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '64px' }}>
            <Link href="/saju/input">
              <button style={{
                height: '60px',
                padding: '0 48px',
                fontSize: '17px',
                fontWeight: 600,
                color: '#FFFFFF',
                background: '#1A3D2E',
                border: 'none',
                borderRadius: '30px',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(26, 61, 46, 0.25)'
              }}>
                {t.howItWorks.cta}
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{
        width: '100%',
        background: '#FFFFFF',
        padding: '120px 40px'
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

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px'
          }}>
            {t.testimonials.items.map((item, idx) => (
              <div key={idx} data-reveal style={{
                ...revealDelayStyle(idx + 1),
                background: '#FEFDFB',
                borderRadius: '20px',
                padding: '32px',
                border: '1px solid rgba(0, 0, 0, 0.04)'
              }}>
                <span style={{
                  display: 'inline-block',
                  padding: '6px 14px',
                  borderRadius: '100px',
                  background: 'rgba(184, 146, 45, 0.12)',
                  color: '#7A6420',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '20px'
                }}>
                  {item.tag}
                </span>
                <p style={{
                  fontSize: '16px',
                  color: '#333333',
                  lineHeight: 1.8,
                  marginBottom: '24px'
                }}>
                  &ldquo;{item.quote}&rdquo;
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#888888',
                  fontWeight: 500,
                  margin: 0
                }}>
                  — {item.author}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kakao Share Section */}
      <section data-reveal style={{
        ...revealStyle,
        width: '100%',
        background: '#FFFFFF',
        padding: '80px 40px',
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
              borderRadius: '27px',
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
        padding: '60px 40px'
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
                borderRadius: '100px',
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
        padding: '120px 40px'
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
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px'
          }}>
            {/* Free */}
            <div data-reveal style={{
              ...revealDelayStyle(1),
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '24px',
              padding: '40px 32px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
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
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
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
              <Link href="/saju/input" style={{ display: 'block' }}>
                <button style={{
                  width: '100%',
                  height: '52px',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '26px',
                  cursor: 'pointer'
                }}>
                  {t.pricing.free.cta}
                </button>
              </Link>
            </div>

            {/* Premium */}
            <div data-reveal style={{
              ...revealDelayStyle(2),
              background: '#1A3D2E',
              borderRadius: '24px',
              padding: '40px 32px',
              position: 'relative'
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
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
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
              <Link href="/saju/input" style={{ display: 'block' }}>
                <button style={{
                  width: '100%',
                  height: '52px',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#1A3D2E',
                  background: '#FFFFFF',
                  border: 'none',
                  borderRadius: '26px',
                  cursor: 'pointer'
                }}>
                  {t.pricing.premium.cta}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{
        width: '100%',
        background: '#FEFDFB',
        padding: '120px 40px'
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
        padding: '100px 40px'
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
            <Link href="/saju/input">
              <button style={{
                height: '60px',
                padding: '0 48px',
                fontSize: '17px',
                fontWeight: 600,
                color: '#1A3D2E',
                background: '#FFFFFF',
                border: 'none',
                borderRadius: '30px',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
              }}>
                {t.cta.button}
              </button>
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
                borderRadius: '30px',
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
