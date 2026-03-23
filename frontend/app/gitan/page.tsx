'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Footer from '@/components/Footer'


export default function GitanLandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleKakaoShare = async () => {
    const url = 'https://somyung.cc/gitan'
    if (navigator.share) {
      try {
        await navigator.share({ title: '기탄교육 X SoMyung', text: '아이의 타고난 기질로 최적의 학습 방법을 찾아보세요.', url })
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      alert('링크가 복사되었습니다!')
    }
  }

  // Premium color palette - Deep Navy & Gold accents
  const colors = {
    primary: '#1E3A5F',      // Deep navy
    secondary: '#1A3D2E',    // Forest green
    accent: '#C9A227',       // Gold
    dark: '#0F1419',         // Almost black
    light: '#FEFDFB',        // Off white
    muted: '#64748B',        // Slate
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.light,
      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 40px',
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link href="/gitan" style={{ textDecoration: 'none' }}>
              <span style={{
                fontSize: '24px',
                fontWeight: 700,
                color: colors.dark,
                letterSpacing: '-0.04em'
              }}>
                ☯ SoMyung
              </span>
            </Link>
            <span style={{
              height: '24px',
              width: '1px',
              background: '#E5E5E5'
            }}></span>
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: colors.primary,
              background: 'rgba(30, 58, 95, 0.08)',
              padding: '6px 14px',
              borderRadius: '100px'
            }}>
              기탄교육 공식 파트너
            </span>
          </div>
          <Link href="/saju/input?ref=gitan">
            <button style={{
              height: '46px',
              padding: '0 28px',
              fontSize: '15px',
              fontWeight: 600,
              color: '#FFFFFF',
              background: colors.primary,
              border: 'none',
              borderRadius: '23px',
              cursor: 'pointer'
            }}>
              무료 분석 시작
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        width: '100%',
        background: colors.light,
        padding: '160px 40px 120px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Collab Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '16px',
            padding: '12px 24px',
            marginBottom: '48px',
            borderRadius: '100px',
            background: '#FFFFFF',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{
                fontSize: '15px',
                fontWeight: 700,
                color: colors.dark
              }}>기탄교육</span>
              <span style={{
                fontSize: '15px',
                color: '#D1D5DB'
              }}>×</span>
              <span style={{
                fontSize: '15px',
                fontWeight: 700,
                color: colors.primary
              }}>☯ SoMyung</span>
            </div>
            <span style={{
              width: '1px',
              height: '18px',
              background: '#E5E5E5'
            }}></span>
            <span style={{
              fontSize: '14px',
              color: colors.muted
            }}>
              공식 협업 프로그램
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(40px, 6vw, 60px)',
            fontWeight: 700,
            color: colors.dark,
            lineHeight: 1.15,
            letterSpacing: '-0.04em',
            marginBottom: '32px'
          }}>
            우리 아이,<br />
            <span style={{ color: colors.primary }}>어떤 학습법</span>이 맞을까요?
          </h1>

          <p style={{
            fontSize: '20px',
            color: colors.muted,
            lineHeight: 1.7,
            marginBottom: '48px',
            maxWidth: '520px',
            margin: '0 auto 48px'
          }}>
            아이의 타고난 기질을 분석해서<br />
            <strong style={{ color: colors.dark }}>기탄 학습지 중 최적의 조합</strong>을 찾아드립니다
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            alignItems: 'center',
            marginBottom: '36px'
          }}>
            <Link href="/saju/input?ref=gitan">
              <button style={{
                height: '64px',
                padding: '0 52px',
                fontSize: '18px',
                fontWeight: 600,
                color: '#FFFFFF',
                background: colors.primary,
                border: 'none',
                borderRadius: '32px',
                cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(30, 58, 95, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span>무료로 맞춤 학습법 찾기</span>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </Link>
            <p style={{
              fontSize: '14px',
              color: '#999999',
              display: 'flex',
              alignItems: 'center',
              gap: '20px'
            }}>
              <span>✓ 3분 소요</span>
              <span>✓ 회원가입 불필요</span>
              <span>✓ 즉시 결과</span>
            </p>
          </div>

          {/* Social Proof */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '48px',
            padding: '32px 0',
            borderTop: '1px solid #F1F5F9',
            marginTop: '40px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '32px', fontWeight: 700, color: colors.dark, marginBottom: '4px' }}>3분</p>
              <p style={{ fontSize: '14px', color: colors.muted }}>분석 소요 시간</p>
            </div>
            <div style={{ width: '1px', height: '48px', background: '#E5E5E5' }}></div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '32px', fontWeight: 700, color: colors.dark, marginBottom: '4px' }}>5단계</p>
              <p style={{ fontSize: '14px', color: colors.muted }}>간편 입력</p>
            </div>
            <div style={{ width: '1px', height: '48px', background: '#E5E5E5' }}></div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '32px', fontWeight: 700, color: colors.dark, marginBottom: '4px' }}>즉시</p>
              <p style={{ fontSize: '14px', color: colors.muted }}>결과 확인</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Section - Clean Dark Design */}
      <section style={{
        width: '100%',
        background: colors.dark,
        padding: '96px 40px'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: colors.accent,
              letterSpacing: '0.15em',
              marginBottom: '20px',
              display: 'block',
              textTransform: 'uppercase'
            }}>
              Why Somyung
            </span>
            <h2 style={{
              fontSize: '40px',
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.03em',
              marginBottom: '16px'
            }}>
              같은 학습지, 다른 결과?
            </h2>
            <p style={{
              fontSize: '18px',
              color: 'rgba(255, 255, 255, 0.6)',
              maxWidth: '480px',
              margin: '0 auto'
            }}>
              아이마다 타고난 기질이 다릅니다.<br />
              기질에 맞는 학습법을 찾으면 효과가 달라집니다.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px'
          }}>
            {[
              {
                title: '화(火) 기질',
                subtitle: '에너지 넘치는 아이',
                desc: '짧고 강렬한 학습이 효과적. 게임 요소가 있는 기탄수학 추천',
                color: '#EF4444'
              },
              {
                title: '수(水) 기질',
                subtitle: '깊이 생각하는 아이',
                desc: '조용한 환경에서 스스로 풀기. 기탄사고력수학이 잘 맞아요',
                color: '#3B82F6'
              },
              {
                title: '목(木) 기질',
                subtitle: '성장을 즐기는 아이',
                desc: '단계별 성취감이 중요. 기탄국어 시리즈로 차근차근',
                color: '#22C55E'
              },
            ].map((item, idx) => (
              <div key={idx} style={{
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '8px',
                padding: '32px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'all 200ms ease-in-out'
              }}>
                {/* Minimal color indicator bar */}
                <div style={{
                  width: '48px',
                  height: '4px',
                  borderRadius: '2px',
                  background: item.color,
                  marginBottom: '24px'
                }}></div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  marginBottom: '8px',
                  letterSpacing: '-0.01em'
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: item.color,
                  fontWeight: 500,
                  marginBottom: '16px'
                }}>
                  {item.subtitle}
                </p>
                <p style={{
                  fontSize: '16px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  lineHeight: 1.5,
                  margin: 0
                }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link href="/saju/input?ref=gitan">
              <button style={{
                height: '48px',
                padding: '0 32px',
                fontSize: '16px',
                fontWeight: 600,
                color: colors.dark,
                background: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                transition: 'all 200ms ease-in-out'
              }}>
                우리 아이 기질 확인하기
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{
        width: '100%',
        background: '#FFFFFF',
        padding: '120px 40px'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: colors.secondary,
              letterSpacing: '0.15em',
              marginBottom: '20px',
              display: 'block',
              textTransform: 'uppercase'
            }}>
              How It Works
            </span>
            <h2 style={{
              fontSize: '40px',
              fontWeight: 700,
              color: colors.dark,
              letterSpacing: '-0.03em'
            }}>
              3단계로 완성되는 맞춤 분석
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '40px'
          }}>
            {[
              {
                step: '1',
                title: '정보 입력',
                desc: '아이와 부모님의 생년월일을 입력하세요. 시간을 몰라도 괜찮아요.',
                time: '1분'
              },
              {
                step: '2',
                title: 'AI 기질 분석',
                desc: '명리학 + AI가 아이의 타고난 성향과 학습 스타일을 분석합니다.',
                time: '즉시'
              },
              {
                step: '3',
                title: '맞춤 가이드',
                desc: '아이에게 맞는 기탄 학습지와 공부법을 추천받으세요.',
                time: '즉시'
              },
            ].map((item, idx) => (
              <div key={idx} style={{ textAlign: 'center' }}>
                <div style={{
                  width: '88px',
                  height: '88px',
                  borderRadius: '28px',
                  background: colors.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 28px',
                  boxShadow: '0 12px 40px rgba(30, 58, 95, 0.2)'
                }}>
                  <span style={{
                    fontSize: '36px',
                    fontWeight: 700,
                    color: '#FFFFFF'
                  }}>
                    {item.step}
                  </span>
                </div>
                <h3 style={{
                  fontSize: '22px',
                  fontWeight: 600,
                  color: colors.dark,
                  marginBottom: '14px'
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontSize: '15px',
                  color: colors.muted,
                  lineHeight: 1.7,
                  marginBottom: '20px'
                }}>
                  {item.desc}
                </p>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: colors.secondary,
                  background: 'rgba(45, 90, 39, 0.08)',
                  padding: '8px 16px',
                  borderRadius: '100px'
                }}>
                  ⏱ {item.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features with Images - Equal Aspect Ratio */}
      <section style={{
        width: '100%',
        background: colors.light,
        padding: '120px 40px'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: colors.secondary,
              letterSpacing: '0.15em',
              marginBottom: '20px',
              display: 'block',
              textTransform: 'uppercase'
            }}>
              What You Get
            </span>
            <h2 style={{
              fontSize: '40px',
              fontWeight: 700,
              color: colors.dark,
              letterSpacing: '-0.03em'
            }}>
              분석 결과로 받을 수 있는 것
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px'
          }}>
            {[
              {
                image: '/assets/images/key_nature_sprout_new.png',
                title: '타고난 기질 리포트',
                desc: '아이가 왜 그렇게 행동하는지, 어떤 환경에서 집중을 잘 하는지 이해할 수 있어요.'
              },
              {
                image: '/assets/images/key_talent_gemstone_1769231816379.png',
                title: '맞춤 학습법 가이드',
                desc: '기탄수학, 기탄국어 중 아이에게 가장 효과적인 학습지와 공부 방법을 추천드려요.'
              },
              {
                image: '/assets/images/key_future_path_1769231832370.png',
                title: '부모-자녀 소통법',
                desc: '서로의 기질 차이를 이해하고, 갈등을 줄이는 대화법을 알려드려요.'
              },
            ].map((item, idx) => (
              <div key={idx} style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                {/* Image container - taller height to ensure full width coverage */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '320px',
                  background: '#F8F9FA'
                }}>
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    style={{
                      objectFit: 'cover',
                      objectPosition: 'center top'
                    }}
                  />
                </div>
                <div style={{ padding: '24px' }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: colors.dark,
                    marginBottom: '8px',
                    letterSpacing: '-0.01em'
                  }}>
                    {item.title}
                  </h3>
                  <p style={{
                    fontSize: '16px',
                    color: colors.muted,
                    lineHeight: 1.5,
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

      {/* Testimonials */}
      <section style={{
        width: '100%',
        background: '#FFFFFF',
        padding: '120px 40px'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: colors.accent,
              letterSpacing: '0.15em',
              marginBottom: '20px',
              display: 'block',
              textTransform: 'uppercase'
            }}>
              Testimonials
            </span>
            <h2 style={{
              fontSize: '40px',
              fontWeight: 700,
              color: colors.dark,
              letterSpacing: '-0.03em',
              marginBottom: '12px'
            }}>
              기탄교육 학부모님들의 후기
            </h2>
            <p style={{ fontSize: '16px', color: colors.muted }}>
              먼저 분석 받은 분들의 실제 경험담
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '24px'
          }}>
            {[
              {
                quote: '기탄수학 A단계부터 시작했는데, 아이가 화 기질이라 짧게 끊어서 하는 게 좋다고 해서 방법을 바꿨더니 집중력이 확 올라갔어요.',
                author: '7세 아들 맘 · 김○○',
                tag: '학습법 개선'
              },
              {
                quote: '매일 싸우던 중2 딸이 목 기질이라 인정받고 싶어한다는 걸 알고, 작은 것도 칭찬해주니 대화가 늘었어요. 분석이 참고가 많이 됐어요.',
                author: '중2 딸 맘 · 박○○',
                tag: '관계 개선'
              },
              {
                quote: '왜 학원을 3개나 보내도 효과가 없었는지 알았어요. 우리 아이는 혼자 조용히 푸는 타입이었어요. 이제 집에서 기탄으로만 해요.',
                author: '초4 아들 맘 · 이○○',
                tag: '학습 방향 발견'
              },
              {
                quote: '아이가 수 기질이라 생각이 깊은 대신 느리다는 걸 알고, 재촉 안 하게 됐어요. 오히려 스스로 하는 시간이 늘었습니다.',
                author: '9세 딸 맘 · 최○○',
                tag: '아이 이해'
              },
            ].map((item, idx) => (
              <div key={idx} style={{
                background: colors.light,
                borderRadius: '24px',
                padding: '36px',
                border: '1px solid rgba(0, 0, 0, 0.04)'
              }}>
                <div style={{ marginBottom: '24px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    borderRadius: '100px',
                    background: colors.primary,
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 600
                  }}>
                    {item.tag}
                  </span>
                </div>
                <p style={{
                  fontSize: '17px',
                  color: '#333333',
                  lineHeight: 1.8,
                  marginBottom: '28px'
                }}>
                  "{item.quote}"
                </p>
                <p style={{
                  fontSize: '14px',
                  color: colors.muted,
                  fontWeight: 600,
                  margin: 0
                }}>
                  — {item.author}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kakao Share Section - Elegant design matching page tone */}
      <section style={{
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
          <p style={{
            fontSize: '14px',
            fontWeight: 600,
            color: colors.primary,
            marginBottom: '16px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            Share & Get Benefits
          </p>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: colors.dark,
            marginBottom: '14px',
            letterSpacing: '-0.02em'
          }}>
            친구에게 공유하고 특별 혜택 받기
          </h2>
          <p style={{
            fontSize: '16px',
            color: colors.muted,
            marginBottom: '32px',
            lineHeight: 1.6
          }}>
            기탄 학습지로 고민하는 친구에게 알려주세요!<br />
            공유받은 분도 기탄 회원 혜택이 적용됩니다.
          </p>
          <button
            onClick={handleKakaoShare}
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
            공유하기
          </button>
        </div>
      </section>

      {/* Pricing - Clean Dark Design */}
      <section style={{
        width: '100%',
        background: colors.dark,
        padding: '96px 40px'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{
              display: 'inline-block',
              padding: '8px 16px',
              borderRadius: '4px',
              background: colors.accent,
              color: colors.dark,
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '24px'
            }}>
              기탄교육 회원 특별 혜택
            </span>
            <h2 style={{
              fontSize: '40px',
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.03em',
              marginBottom: '12px'
            }}>
              지금 무료로 시작하세요
            </h2>
            <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.6)' }}>
              기탄교육 회원이라면 프리미엄 분석까지 특별 할인
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '24px'
          }}>
            {/* Free */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '8px',
              padding: '32px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#FFFFFF', marginBottom: '8px' }}>기본 분석</h3>
              <p style={{ fontSize: '36px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>무료</p>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '32px' }}>영구 무료</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
                {['오행 기질 분석', '기본 학습 스타일 파악', '간단한 기탄 추천'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '16px' }}>
                    <svg width="16" height="16" fill={colors.secondary} viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/saju/input?ref=gitan" style={{ display: 'block' }}>
                <button style={{
                  width: '100%',
                  height: '48px',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 200ms ease-in-out'
                }}>
                  무료로 시작
                </button>
              </Link>
            </div>

            {/* Premium */}
            <div style={{
              background: colors.primary,
              borderRadius: '8px',
              padding: '32px',
              position: 'relative',
              border: `1px solid ${colors.accent}`
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '24px',
                background: colors.accent,
                color: colors.dark,
                fontSize: '12px',
                fontWeight: 600,
                padding: '4px 12px',
                borderRadius: '4px'
              }}>
                기탄 회원 50% 할인
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '8px' }}>프리미엄 분석</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)', textDecoration: 'line-through' }}>38,000원</p>
                <p style={{ fontSize: '36px', fontWeight: 700, color: '#FFFFFF' }}>19,000<span style={{ fontSize: '14px', fontWeight: 400 }}>원</span></p>
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '32px' }}>1회 결제 · 평생 이용</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
                {['심층 기질 분석 리포트', '맞춤 기탄 학습지 추천', '부모-자녀 궁합 분석', 'AI 상담 무제한', 'PDF 리포트 다운로드'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', color: '#FFFFFF', marginBottom: '16px' }}>
                    <svg width="16" height="16" fill={colors.accent} viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/saju/input?ref=gitan&plan=premium" style={{ display: 'block' }}>
                <button style={{
                  width: '100%',
                  height: '48px',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: colors.primary,
                  background: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  transition: 'all 200ms ease-in-out'
                }}>
                  프리미엄 분석 시작
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{
        width: '100%',
        background: colors.light,
        padding: '120px 40px'
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: colors.muted,
              letterSpacing: '0.15em',
              marginBottom: '20px',
              display: 'block',
              textTransform: 'uppercase'
            }}>
              FAQ
            </span>
            <h2 style={{
              fontSize: '36px',
              fontWeight: 700,
              color: colors.dark,
              letterSpacing: '-0.03em'
            }}>
              자주 묻는 질문
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { q: '기탄교육 회원 아닌데 이용할 수 있나요?', a: '네, 누구나 무료 분석은 이용 가능합니다. 다만 기탄교육 회원이시면 프리미엄 분석 50% 할인 혜택이 있어요.' },
              { q: '사주, 명리학이 정말 도움이 되나요?', a: '명리학은 수천 년간 축적된 동양의 기질 분류 체계입니다. 저희는 이를 현대적으로 해석해 "아이 이해의 참고 도구"로 활용합니다. 많은 부모님들이 "아이를 이해하는 데 도움이 됐다"고 말씀해 주셨어요.' },
              { q: '아이 생년월일만 알면 되나요?', a: '네, 시간을 모르셔도 70% 정도의 분석이 가능합니다. 부모님 정보도 함께 입력하시면 궁합 분석까지 받으실 수 있어요.' },
              { q: '결과는 어떻게 확인하나요?', a: '입력 즉시 웹에서 확인 가능합니다. 프리미엄 분석은 PDF 다운로드와 이메일 발송을 지원합니다.' },
              { q: '환불이 가능한가요?', a: '프리미엄 분석 결제 후 7일 이내, 리포트 확인 전이라면 전액 환불 가능합니다.' },
            ].map((item, idx) => (
              <div key={idx} style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid rgba(0, 0, 0, 0.04)',
                overflow: 'hidden'
              }}>
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '26px 32px',
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: '17px', fontWeight: 500, color: colors.dark }}>{item.q}</span>
                  <span style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: openFaq === idx ? colors.primary : '#F5F5F3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: openFaq === idx ? '#FFFFFF' : colors.muted,
                    fontSize: '20px',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}>
                    {openFaq === idx ? '−' : '+'}
                  </span>
                </button>
                {openFaq === idx && (
                  <div style={{ padding: '0 32px 26px' }}>
                    <p style={{ fontSize: '15px', color: colors.muted, lineHeight: 1.8, margin: 0 }}>
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Clean Design */}
      <section style={{
        width: '100%',
        background: colors.primary,
        padding: '96px 40px'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '-0.01em',
            marginBottom: '16px',
            lineHeight: 1.3
          }}>
            우리 아이에게 맞는 학습법,<br />지금 바로 찾아보세요
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '32px', lineHeight: 1.5 }}>
            3분 입력으로 아이의 기질과 최적의 기탄 학습지를 알아보세요
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <Link href="/saju/input?ref=gitan">
              <button style={{
                height: '48px',
                padding: '0 32px',
                fontSize: '16px',
                fontWeight: 600,
                color: colors.primary,
                background: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                transition: 'all 200ms ease-in-out'
              }}>
                무료 분석 시작하기
              </button>
            </Link>
            <button
              onClick={handleKakaoShare}
              style={{
                height: '44px',
                padding: '0 24px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#FFFFFF',
                background: '#2D3A35',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 200ms ease-in-out'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              공유하기
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
