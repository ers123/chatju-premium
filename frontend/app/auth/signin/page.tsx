'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input, Separator } from '@/components/ui'
import { apiClient } from '@/lib/api'

// Ambient Glow Orb
const AmbientOrb = ({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) => (
  <div
    className={`absolute rounded-full blur-[80px] opacity-40 mix-blend-multiply animate-pulse-glow pointer-events-none ${className}`}
    style={style}
  />
)

// Decorative moon element
const MoonDecoration = () => (
  <div className="absolute top-20 right-20 opacity-10 pointer-events-none animate-float" style={{ animationDuration: '15s' }}>
    <svg viewBox="0 0 100 100" fill="currentColor" className="w-48 h-48 text-[#B69B7D]">
      <circle cx="50" cy="50" r="40" />
      <circle cx="35" cy="40" r="8" fill="#2D3A35" opacity="0.3" />
      <circle cx="55" cy="55" r="6" fill="#2D3A35" opacity="0.2" />
      <circle cx="45" cy="65" r="4" fill="#2D3A35" opacity="0.25" />
    </svg>
  </div>
)

// Floating sparkle
const Sparkle = ({ style = {} }: { style?: React.CSSProperties }) => (
  <div className="absolute pointer-events-none animate-float" style={{ ...style }}>
    <svg viewBox="0 0 24 24" fill="#B69B7D" className="w-3 h-3 opacity-30">
      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
    </svg>
  </div>
)

const StarField = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(12)].map((_, i) => (
      <Sparkle
        key={i}
        style={{
          left: `${10 + (i * 7) % 80}%`,
          top: `${15 + (i * 11) % 70}%`,
          animationDelay: `${i * 0.5}s`,
          opacity: 0.15 + (i % 3) * 0.05
        }}
      />
    ))}
  </div>
)

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await apiClient.login({ email })
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '로그인 링크 전송에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#FAF8F6] flex items-center justify-center p-4 texture-noise relative overflow-hidden">
        <AmbientOrb className="bg-[#B69B7D] top-0 left-0 w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 opacity-20" />
        <AmbientOrb className="bg-[#5A7D6B] bottom-0 right-0 w-[500px] h-[500px] translate-x-1/2 translate-y-1/2 opacity-20 animate-breathe" />

        <div className="max-w-[420px] w-full relative z-10 animate-fade-in">
          <div className="card-paper p-12 text-center border-none shadow-[0_20px_40px_-5px_rgba(45,58,53,0.1)]">
            <div className="w-20 h-20 bg-gradient-warm rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner border border-[#FFFFFF]/50">
              ✉️
            </div>
            <h2 className="font-serif-ko text-[1.75rem] text-[#2D3A35] mb-3">이메일을 확인하세요</h2>
            <p className="font-sans-ko text-[#6B6560] mb-8 leading-relaxed">
              <span className="text-[#2D3A35] font-medium">{email}</span>으로<br />
              로그인 링크를 전송했습니다.
            </p>
            <p className="text-xs text-[#8B8580]">
              이메일이 도착하지 않았다면 스팸함을 확인해주세요.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF8F6] flex texture-noise">
      {/* Left side - Branding */}
      <div className="hidden lg:flex w-1/2 bg-[#2D3A35] p-12 flex-col justify-between relative overflow-hidden">
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23B69B7D' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />

        <StarField />
        <MoonDecoration />

        {/* Decorative Light */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#B69B7D] blur-[150px] opacity-10 rounded-full translate-x-1/3 -translate-y-1/3" />

        <div className="relative z-10">
          <Link href="/" className="no-underline">
            <span className="font-serif-ko text-2xl text-[#B69B7D]">소명</span>
          </Link>
        </div>

        <div className="relative z-10 animate-fade-in stagger-1">
          <h1 className="font-serif-ko text-[3.5rem] text-[#FAF8F6] font-normal leading-tight mb-8">
            당신의 운명을<br />
            <span className="text-[#B69B7D]">알아보세요</span>
          </h1>
          <p className="font-sans-ko text-[#FAF8F6]/60 text-lg max-w-md leading-relaxed animate-fade-in stagger-2">
            천년의 지혜가 당신 곁에 있습니다.<br />
            프라이빗한 공간에서 나와 아이의 이야기를 만나보세요.
          </p>

          {/* Feature badges */}
          <div className="grid grid-cols-2 gap-4 mt-12 animate-fade-in stagger-3">
            {[
              { icon: '🌙', label: '정통 만세력' },
              { icon: '✨', label: '프라이빗 분석' },
              { icon: '💬', label: '1:1 상담' },
              { icon: '🔒', label: '안전한 보호' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#B69B7D]/15 flex items-center justify-center text-lg backdrop-blur-sm">
                  {item.icon}
                </div>
                <span className="text-sm text-[#FAF8F6]/70 tracking-wide">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-[#FAF8F6]/30 relative z-10">
          © 2025 소명. All rights reserved.
        </div>
      </div>

      {/* Right side - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <AmbientOrb className="bg-[#B69B7D] hidden lg:block bottom-0 right-0 w-[400px] h-[400px] translate-x-1/2 translate-y-1/2 opacity-15" />

        <div className="max-w-[420px] w-full relative z-10 animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <Link href="/" className="no-underline">
              <span className="font-serif-ko text-3xl text-[#B69B7D]">소명</span>
            </Link>
          </div>

          <div className="card-paper p-10 border-none shadow-[0_20px_40px_-5px_rgba(45,58,53,0.08)]">
            <div className="text-center mb-10">
              <h2 className="font-serif-ko text-[1.75rem] text-[#2D3A35] mb-2">환영합니다</h2>
              <p className="font-sans-ko text-[#6B6560] text-[0.9375rem]">이메일로 간편하게 시작하세요</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block font-sans-ko text-sm text-[#433E3B] mb-2 font-medium">
                  이메일
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full p-4 text-base rounded-xl border-[#EBE5DF] bg-white/50 focus:bg-white transition-all shadow-inner"
                />
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-[#C67B6F]/10 border border-[#C67B6F]/20 text-[#C67B6F] text-sm mb-6 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full btn-primary py-4 shadow-lg text-[0.9375rem] ${isLoading && 'opacity-70 cursor-not-allowed shadow-none'}`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5 text-white/50" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    전송 중...
                  </span>
                ) : (
                  '로그인 링크 받기'
                )}
              </button>
            </form>

            <div className="my-8 relative">
              <Separator className="bg-[#EBE5DF]" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-xs text-[#6B6560] font-medium">
                또는
              </span>
            </div>

            <div className="text-center">
              <p className="font-sans-ko text-[#6B6560] text-sm">
                처음이신가요?{' '}
                <Link href="/auth/signup" className="text-[#B69B7D] font-medium hover:text-[#2D3A35] transition-colors no-underline">
                  회원가입
                </Link>
              </p>
            </div>
          </div>

          {/* Back to home */}
          <div className="mt-8 text-center">
            <Link href="/" className="text-xs text-[#6B6560] hover:text-[#2D3A35] no-underline inline-flex items-center gap-1.5 transition-colors">
              <span>←</span> 홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
