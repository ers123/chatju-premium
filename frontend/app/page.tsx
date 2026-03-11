'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

// Ambient Glow Orb
const AmbientOrb = ({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) => (
  <div
    className={`absolute rounded-full blur-[80px] opacity-40 mix-blend-multiply animate-pulse-glow pointer-events-none ${className}`}
    style={style}
  />
)

// Decorative floating cloud - Refined
const FloatingCloud = ({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) => (
  <div className={`absolute opacity-[0.08] pointer-events-none ${className}`} style={style}>
    <svg viewBox="0 0 120 50" fill="currentColor" className="w-40 h-16 text-[#B69B7D]">
      <ellipse cx="35" cy="30" rx="28" ry="14" />
      <ellipse cx="65" cy="25" rx="24" ry="18" />
      <ellipse cx="90" cy="30" rx="20" ry="12" />
    </svg>
  </div>
)

// Refined Sparkle - Slower, subtler
const Sparkle = ({ style = {} }: { style?: React.CSSProperties }) => (
  <div className="absolute pointer-events-none animate-float" style={{ ...style }}>
    <svg viewBox="0 0 24 24" fill="#B69B7D" className="w-3 h-3 opacity-30">
      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
    </svg>
  </div>
)

// KakaoTalk icon
const KakaoIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.675 1.733 5.029 4.348 6.373-.168.63-.609 2.281-.697 2.635-.11.44.161.434.339.316.14-.093 2.23-1.52 3.124-2.131.618.091 1.255.139 1.886.139 5.523 0 10-3.463 10-7.332C21 6.463 17.523 3 12 3z" />
  </svg>
)

// Check icon
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

// Quote icon
const QuoteIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 opacity-20">
    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
  </svg>
)

// Icon components for features
const BookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
)

const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

const CompassIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill="currentColor" opacity="0.3" />
  </svg>
)

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // KakaoTalk share function
  const handleKakaoShare = () => {
    if (typeof window !== 'undefined' && (window as typeof window & { Kakao?: { Share?: { sendDefault: (config: unknown) => void } } }).Kakao?.Share) {
      (window as typeof window & { Kakao: { Share: { sendDefault: (config: unknown) => void } } }).Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: '소명 - 우리 아이 사주로 숨겨진 재능 발견하기',
          description: '밤새 고민하지 마세요. 천년의 지혜로 아이의 타고난 기질을 알아보세요.',
          imageUrl: 'https://somyung.kr/og-image.jpg',
          link: {
            mobileWebUrl: 'https://somyung.kr',
            webUrl: 'https://somyung.kr',
          },
        },
        buttons: [
          {
            title: '무료로 시작하기',
            link: {
              mobileWebUrl: 'https://somyung.kr/saju/input',
              webUrl: 'https://somyung.kr/saju/input',
            },
          },
        ],
      })
    } else {
      // Fallback: copy link
      navigator.clipboard.writeText('https://somyung.kr')
      alert('링크가 복사되었습니다!')
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden texture-noise">
      {/* Ambient Background Orbs */}
      <AmbientOrb className="bg-[#B69B7D] top-0 left-0 w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 opacity-20" />
      <AmbientOrb className="bg-[#5A7D6B] top-[40%] right-0 w-[600px] h-[600px] translate-x-1/2 opacity-15 animate-breathe" style={{ animationDelay: '2s' }} />
      <AmbientOrb className="bg-[#C67B6F] bottom-0 left-20 w-[400px] h-[400px] opacity-10 animate-breathe" style={{ animationDelay: '4s' }} />

      {/* Floating Elements (Clouds & Sparkles) */}
      <FloatingCloud className="top-32 -left-16 animate-float" style={{ animationDelay: '0s' }} />
      <FloatingCloud className="top-64 -right-10 animate-float" style={{ animationDelay: '2s' }} />
      <FloatingCloud className="bottom-96 -left-8 animate-float" style={{ animationDelay: '4s' }} />

      <Sparkle style={{ top: '15%', left: '10%', animationDelay: '0s' }} />
      <Sparkle style={{ top: '25%', right: '15%', animationDelay: '1s' }} />
      <Sparkle style={{ top: '45%', left: '8%', animationDelay: '2s' }} />

      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-[#EBE5DF]/50' : 'bg-transparent'
          }`}
      >
        <div className="max-w-[1100px] mx-auto px-6 py-5 flex justify-between items-center">
          <Link href="/" className="no-underline">
            <span className="font-serif-ko text-2xl text-[#2D3A35]">소명</span>
          </Link>

          <div className="flex items-center gap-8">
            <a href="#reviews" className="text-sm text-[#6B6560] hover:text-[#2D3A35] transition-colors no-underline">후기</a>
            <a href="#pricing" className="text-sm text-[#6B6560] hover:text-[#2D3A35] transition-colors no-underline">상담안내</a>
            <Link href="/auth/signin">
              <button className="px-5 py-2 text-sm text-[#FAF8F6] bg-[#2D3A35] rounded-full hover:bg-[#3D4A45] transition-all shadow-md hover:shadow-lg">
                시작하기
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center pt-28 pb-20 px-6 relative z-10">
        <div className="max-w-[700px] mx-auto text-center">
          {/* Decorative vertical line */}
          <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-[#B69B7D] to-transparent mx-auto mb-6" />

          <p className="font-sans-ko text-sm text-[#B69B7D] tracking-[0.2em] mb-8 animate-fade-in uppercase">
            Private Fortune Lounge
          </p>

          {/* Main Headline */}
          <h1 className="font-serif-ko text-[clamp(2.5rem,6vw,4rem)] font-normal text-[#2D3A35] leading-[1.3] mb-6 animate-fade-up">
            우리 아이,<br />
            <span className="relative inline-block px-2">
              <span className="absolute inset-0 bg-[#B69B7D]/10 -skew-x-6 rounded-sm"></span>
              <span className="relative text-[#2D3A35]">어떤 사람이 될까요?</span>
            </span>
          </h1>

          {/* Subtext */}
          <div className="space-y-2 mb-12">
            <p className="font-sans-ko text-[1.125rem] text-[#6B6560] animate-fade-in stagger-2">
              밤새 고민하신 적 있으시죠.
            </p>
            <p className="font-sans-ko text-[1rem] text-[#8B8580] animate-fade-in stagger-3">
              천년의 지혜로 아이의 숨겨진 가능성을 발견하세요.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-4 items-center animate-fade-in stagger-4">
            <Link href="/saju/input">
              <button className="btn-primary text-lg px-12 py-4 shadow-[0_12px_36px_rgba(45,58,53,0.15)] hover:shadow-[0_16px_48px_rgba(45,58,53,0.2)]">
                우리 아이 알아보기
              </button>
            </Link>
            <Link href="/chat" className="no-underline group">
              <span className="text-sm text-[#B69B7D] border-b border-[#D4C4A8] pb-0.5 group-hover:text-[#2D3A35] group-hover:border-[#2D3A35] transition-colors">
                나의 운세 먼저 보기
              </span>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex justify-center gap-8 mt-16 flex-wrap animate-fade-in stagger-5">
            {['프라이빗 1:1 분석', '정통 만세력 기반', '즉시 결과 확인'].map((text, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[#B69B7D]"><CheckIcon /></span>
                <span className="text-xs text-[#6B6560] tracking-wide">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Point Recognition Section */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] mb-4">
              이런 고민, 혼자 하고 계셨나요?
            </h2>
            <p className="text-[#6B6560]">
              많은 엄마들이 같은 고민을 안고 찾아오셨어요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <BookIcon />,
                worry: '"아이가 공부에 흥미가 없어요"',
                answer: '타고난 학습 스타일이 따로 있어요',
                color: '#5A7D6B'
              },
              {
                icon: <HeartIcon />,
                worry: '"왜 이렇게 예민한지 모르겠어요"',
                answer: '섬세함이 오히려 큰 재능이에요',
                color: '#C67B6F'
              },
              {
                icon: <CompassIcon />,
                worry: '"어떤 길로 이끌어줘야 할지..."',
                answer: '아이만의 빛나는 방향이 있어요',
                color: '#6B8BA4'
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="card-paper p-8 flex flex-col items-start"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-6"
                  style={{ background: `${item.color}15`, color: item.color }}
                >
                  {item.icon}
                </div>
                <p className="font-serif-ko text-lg text-[#433E3B] mb-4 leading-relaxed">
                  {item.worry}
                </p>
                <div className="mt-auto flex items-center gap-2 pt-4 border-t border-[#EBE5DF]/50 w-full">
                  <span className="text-[#B69B7D] text-lg">→</span>
                  <p className="text-sm text-[#B69B7D] font-medium">
                    {item.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Dark Mode */}
      <section id="reviews" className="py-24 px-6 bg-[#2D3A35] relative overflow-hidden">
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23B69B7D' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />

        <div className="max-w-[1000px] mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] text-[#FAF8F6] mb-4">
              엄마들이 경험한 변화
            </h2>
            <p className="text-[#B69B7D]/80">
              실제 이용하신 분들의 이야기예요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: '사실 혼내기만 했는데... 아이 성격을 이해하니까 대화가 달라졌어요. 왜 진작 몰랐을까 싶어요.',
                author: '45세, 중학생 엄마'
              },
              {
                quote: '둘째가 첫째랑 너무 달라서 걱정이었는데, 각자 다른 재능이 있다는 걸 알게 됐어요.',
                author: '38세, 초등학생 엄마'
              },
              {
                quote: '아이한테 맞는 학습법을 찾았어요. 억지로 시키던 걸 그만두니 오히려 성적이 올랐어요.',
                author: '42세, 고등학생 엄마'
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-[#3D4A45]/80 backdrop-blur-md rounded-[1.25rem] p-8 border border-[#B69B7D]/10 hover:border-[#B69B7D]/30 transition-colors"
              >
                <div className="text-[#B69B7D] mb-6"><QuoteIcon /></div>
                <p className="font-sans-ko text-[#FAF8F6]/90 leading-loose mb-6">
                  {item.quote}
                </p>
                <p className="text-xs text-[#B69B7D] uppercase tracking-wider">
                  — {item.author}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Five Types Section */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] mb-4">
              우리 아이는 어떤 타입일까요?
            </h2>
            <p className="text-[#6B6560]">
              사주로 알아보는 다섯 가지 기질
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
            {[
              { icon: '🌳', name: '리더 타입', trait: '책임감 있고 든든한', color: '#5A7D6B' },
              { icon: '🔥', name: '열정가 타입', trait: '에너지 넘치고 활발한', color: '#C67B6F' },
              { icon: '⭐', name: '조화 타입', trait: '균형 잡히고 안정적인', color: '#C4A574' },
              { icon: '✨', name: '감성가 타입', trait: '섬세하고 예술적인', color: '#8B8D8F' },
              { icon: '💧', name: '사색가 타입', trait: '깊이 생각하고 지혜로운', color: '#6B8BA4' }
            ].map((type, idx) => (
              <div
                key={idx}
                className="card-paper p-6 text-center group cursor-default"
              >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 transform origin-center">{type.icon}</div>
                <p className="font-serif-ko text-base mb-1 font-medium" style={{ color: type.color }}>
                  {type.name}
                </p>
                <p className="text-xs text-[#6B6560]">{type.trait}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/saju/input">
              <button className="btn-secondary px-10 py-3">
                우리 아이 타입 알아보기
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section - Gift framing */}
      <section id="pricing" className="py-24 px-6 bg-gradient-to-b from-[#EBE5DF]/30 to-transparent">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] mb-4">
              나와 아이를 위한 시간
            </h2>
            <p className="text-[#6B6560]">
              원하시는 만큼, 깊이 있게 알아보세요
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {[
              {
                name: '인연',
                price: '12,000',
                desc: '아이의 기본 성향 이해하기',
                features: ['타고난 기질 분석', '숨겨진 재능 발견', '기본 성격 유형'],
                recommended: false
              },
              {
                name: '화목',
                price: '29,000',
                desc: '온 가족의 조화 이해하기',
                features: ['심층 성향 분석', '부모-자녀 궁합', '형제 관계 분석', '맞춤 양육 조언', '무제한 질문'],
                recommended: true
              },
              {
                name: '풍요',
                price: '59,000',
                desc: '삶의 모든 순간을 함께',
                features: ['화목 코스 전체 포함', '학업/진로 심층 분석', '월별 운세', '길일 선택 안내', '전문 상담 연결'],
                recommended: false
              }
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`relative rounded-[1.25rem] p-8 border transition-all ${plan.recommended
                    ? 'bg-[#2D3A35] text-[#FAF8F6] border-none shadow-xl transform scale-[1.02]'
                    : 'glass-premium border-[#EBE5DF] text-[#2D3A35]'
                  }`}
              >
                {plan.recommended && (
                  <div className="absolute top-0 left-8 -translate-y-1/2 bg-gradient-to-r from-[#B69B7D] to-[#C4A574] text-white px-4 py-1.5 rounded-full text-xs font-medium shadow-lg">
                    가장 많이 선택해요
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-8">
                  {/* Name & Price */}
                  <div className="min-w-[140px]">
                    <p className={`font-serif-ko text-2xl mb-1 ${plan.recommended ? 'text-[#FAF8F6]' : 'text-[#2D3A35]'}`}>
                      {plan.name}
                    </p>
                    <p className="font-serif-ko text-xl text-[#B69B7D] mb-2">
                      ₩{plan.price}
                    </p>
                    <p className={`text-xs ${plan.recommended ? 'text-[#FAF8F6]/60' : 'text-[#6B6560]'}`}>
                      {plan.desc}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="flex-1 min-w-[200px]">
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {plan.features.map((f, fi) => (
                        <li key={fi} className={`text-xs flex items-center gap-2 ${plan.recommended ? 'text-[#FAF8F6]/80' : 'text-[#6B6560]'}`}>
                          <span className="text-[#B69B7D]"><CheckIcon /></span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <div>
                    <Link href="/saju/input">
                      <button className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${plan.recommended
                          ? 'bg-gradient-to-r from-[#B69B7D] to-[#C4A574] text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                          : 'bg-transparent border border-[#EBE5DF] hover:border-[#B69B7D] hover:text-[#B69B7D]'
                        }`}>
                        선택하기
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 relative z-10 text-center">
        <div className="max-w-[600px] mx-auto">
          <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-[#B69B7D] to-transparent mx-auto mb-8" />

          <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] mb-4">
            오늘, 우리 아이를 이해하는<br />
            <span className="text-[#B69B7D]">첫 걸음</span>을 시작하세요
          </h2>

          <p className="text-[#6B6560] mb-10 leading-relaxed">
            밤새 혼자 고민하지 마세요.<br />
            천 년의 지혜가 당신 곁에 있습니다.
          </p>

          <div className="flex flex-col gap-4 items-center">
            <Link href="/saju/input">
              <button className="btn-primary text-lg px-12 py-4 shadow-[0_12px_36px_rgba(45,58,53,0.15)] hover:shadow-[0_16px_48px_rgba(45,58,53,0.2)]">
                무료로 시작하기
              </button>
            </Link>

            {/* KakaoTalk Share Button - Enhanced */}
            <button
              onClick={handleKakaoShare}
              className="flex items-center gap-2 px-6 py-3 bg-[#FEE500] text-[#3C1E1E] rounded-full text-sm font-medium hover:bg-[#FFEB33] transition-colors"
            >
              <KakaoIcon />
              카카오톡으로 공유하기
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[#EBE5DF]">
        <div className="max-w-[1000px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <span className="font-serif-ko text-lg text-[#B69B7D]">소명</span>
            <p className="text-xs text-[#6B6560] mt-2">
              © 2025 소명. All rights reserved.
            </p>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-[#6B6560] hover:text-[#2D3A35] no-underline">이용약관</a>
            <a href="#" className="text-xs text-[#6B6560] hover:text-[#2D3A35] no-underline">개인정보처리방침</a>
            <a href="#" className="text-xs text-[#6B6560] hover:text-[#2D3A35] no-underline">문의하기</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
