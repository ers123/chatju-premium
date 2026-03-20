'use client'

import Link from 'next/link'
import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Footer from '@/components/Footer'
import { useLanguage } from './lib/i18n/context'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

// 카카오 SDK 타입 정의
declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (options: {
          objectType: string;
          content: {
            title: string;
            description: string;
            imageUrl: string;
            link: { mobileWebUrl: string; webUrl: string };
          };
          buttons: Array<{
            title: string;
            link: { mobileWebUrl: string; webUrl: string };
          }>;
        }) => void;
      };
    };
  }
}

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

  // 카카오 SDK 초기화
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.5.0/kakao.min.js'
    script.async = true
    script.onload = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY || '')
      }
    }
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [])

  const handleShare = useCallback(() => {
    const url = 'https://somyung.kr'
    const text = lang === 'ko' ? '사주 명리학 기반으로 아이의 타고난 기질과 맞춤 학습법을 알아보세요.'
      : lang === 'ja' ? '四柱推命に基づいてお子様の気質と学習法を分析します。'
      : lang === 'zh' ? '基于四柱命理分析孩子的天生气质和学习方法。'
      : 'Discover your child\'s innate temperament through Saju-based analysis.'

    const platform = t.share.platform

    if (platform === 'kakao' && window.Kakao?.Share) {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: '소명 - 우리 아이 기질 분석',
          description: '사주 명리학 기반으로 아이의 타고난 기질과 맞춤 학습법을 알아보세요. 3분이면 충분해요!',
          imageUrl: 'https://somyung.kr/assets/images/key_nature_sprout_1769231800309.png',
          link: { mobileWebUrl: url, webUrl: url },
        },
        buttons: [{ title: '무료로 분석받기', link: { mobileWebUrl: `${url}/saju/input`, webUrl: `${url}/saju/input` } }],
      })
    } else if (platform === 'line') {
      window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank')
    } else if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, '_blank')
    } else {
      navigator.clipboard.writeText(url)
      alert(lang === 'zh' ? '链接已复制！分享给朋友吧。' : 'Link copied!')
    }
  }, [lang, t.share.platform])

  // Platform-specific share button config
  const shareConfig = {
    kakao: { bg: '#FEE500', color: '#3C1E1E', shadow: 'rgba(254, 229, 0, 0.3)', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="#3C1E1E"><path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.675 1.733 5.029 4.348 6.373-.168.63-.609 2.281-.697 2.635-.11.44.161.434.339.316.14-.093 2.23-1.52 3.124-2.131.618.091 1.255.139 1.886.139 5.523 0 10-3.463 10-7.332C21 6.463 17.523 3 12 3z" /></svg> },
    whatsapp: { bg: '#25D366', color: '#FFFFFF', shadow: 'rgba(37, 211, 102, 0.3)', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
    line: { bg: '#06C755', color: '#FFFFFF', shadow: 'rgba(6, 199, 85, 0.3)', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.271.173-.508.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg> },
    copy: { bg: '#2C2420', color: '#FFFFFF', shadow: 'rgba(44, 36, 32, 0.2)', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> },
  } as const
  const currentShare = shareConfig[t.share.platform as keyof typeof shareConfig] || shareConfig.copy

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
              소명
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
              color: currentShare.color,
              background: currentShare.bg,
              border: 'none',
              borderRadius: '27px',
              cursor: 'pointer',
              boxShadow: `0 2px 12px ${currentShare.shadow}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.2s ease'
            }}
          >
            {currentShare.icon}
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
                color: currentShare.color,
                background: currentShare.bg,
                border: 'none',
                borderRadius: '30px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: `0 4px 20px ${currentShare.shadow}`
              }}
            >
              {currentShare.icon}
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
