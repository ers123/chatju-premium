'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input, Separator } from '@/components/ui'
import { apiClient } from '@/lib/api'

// Ambient Glow Orb
const AmbientOrb = ({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) => (
  <div
    className={`absolute rounded-full blur-[80px] opacity-40 mix-blend-multiply animate-pulse-glow pointer-events-none ${className}`}
    style={style}
  />
)

// Decorative floating cloud
const FloatingCloud = ({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) => (
  <div className={`absolute opacity-[0.08] pointer-events-none ${className}`} style={style}>
    <svg viewBox="0 0 120 50" fill="currentColor" className="w-40 h-16 text-[#B69B7D]">
      <ellipse cx="35" cy="30" rx="28" ry="14" />
      <ellipse cx="65" cy="25" rx="24" ry="18" />
      <ellipse cx="90" cy="30" rx="20" ry="12" />
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

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await apiClient.signup({ email: formData.email, name: formData.name })
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F6] flex items-center justify-center p-4 texture-noise relative overflow-hidden">
      {/* Decorative Background */}
      <AmbientOrb className="bg-[#B69B7D] top-0 left-0 w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 opacity-20" />
      <AmbientOrb className="bg-[#5A7D6B] bottom-0 right-0 w-[500px] h-[500px] translate-x-1/2 translate-y-1/2 opacity-20 animate-breathe" />

      <FloatingCloud className="top-20 left-[10%] animate-float" />
      <FloatingCloud className="bottom-20 right-[10%] animate-float" style={{ animationDelay: '3s' }} />

      <Sparkle style={{ top: '20%', left: '20%', animationDelay: '0s' }} />
      <Sparkle style={{ top: '70%', right: '20%', animationDelay: '2s' }} />

      {/* Brand Header (Centered) */}
      <div className="absolute top-8 left-0 right-0 text-center z-10">
        <Link href="/" className="no-underline">
          <span className="font-serif-ko text-3xl text-[#2D3A35]">소명</span>
        </Link>
      </div>

      <div className="max-w-[420px] w-full relative z-10 animate-fade-up">
        {success ? (
          <div className="card-paper p-12 text-center border-none shadow-[0_20px_40px_-5px_rgba(45,58,53,0.1)]">
            <div className="w-20 h-20 bg-gradient-warm rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner border border-[#FFFFFF]/50">
              ✉️
            </div>
            <h2 className="font-serif-ko text-[1.75rem] text-[#2D3A35] mb-3">가입을 환영합니다!</h2>
            <p className="font-sans-ko text-[#6B6560] mb-8 leading-relaxed">
              <span className="text-[#2D3A35] font-medium">{formData.email}</span>으로<br />
              확인 이메일을 전송했습니다.
            </p>
            <p className="text-sm text-[#8B8580] mb-8">
              이메일의 링크를 클릭하여 가입을 완료해주세요.
            </p>
            <Link href="/auth/signin">
              <button className="btn-primary py-4 px-8 shadow-lg text-[0.9375rem]">
                로그인 페이지로
              </button>
            </Link>
          </div>
        ) : (
          <div className="card-paper p-10 border-none shadow-[0_20px_40px_-5px_rgba(45,58,53,0.08)]">
            <div className="text-center mb-10">
              <h2 className="font-serif-ko text-[1.75rem] text-[#2D3A35] mb-2 tracking-tight">회원가입</h2>
              <p className="font-sans-ko text-[#6B6560] text-[0.9375rem]">
                프리미엄 서비스를 시작하세요
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block font-sans-ko text-sm text-[#433E3B] mb-3 font-medium">
                  이름
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="홍길동"
                  required
                  className="w-full p-4 text-base rounded-xl border-[#EBE5DF] bg-white/50 focus:bg-white transition-all shadow-inner placeholder:text-[#6B6560]/40"
                />
              </div>

              <div>
                <label className="block font-sans-ko text-sm text-[#433E3B] mb-3 font-medium">
                  이메일
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="name@example.com"
                  required
                  className="w-full p-4 text-base rounded-xl border-[#EBE5DF] bg-white/50 focus:bg-white transition-all shadow-inner placeholder:text-[#6B6560]/40"
                />
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-[#C67B6F]/10 border border-[#C67B6F]/20 text-[#C67B6F] text-sm flex items-center justify-center gap-2">
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
                    처리 중...
                  </span>
                ) : (
                  '가입하기'
                )}
              </button>

              <p className="text-xs text-[#8B8580] text-center">
                가입하시면{' '}
                <Link href="/terms" className="text-[#C5A059] hover:text-[#2D3A35] transition-colors no-underline">이용약관</Link>
                {' '}및{' '}
                <Link href="/privacy" className="text-[#C5A059] hover:text-[#2D3A35] transition-colors no-underline">개인정보처리방침</Link>
                에 동의하게 됩니다.
              </p>
            </form>

            <div className="my-8 relative">
              <Separator className="bg-[#EBE5DF]" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FEFDFB] px-4 text-xs text-[#6B6560] font-medium">
                또는
              </span>
            </div>

            <div className="text-center">
              <p className="font-sans-ko text-[#6B6560] text-sm">
                이미 계정이 있으신가요?{' '}
                <Link href="/auth/signin" className="text-[#B69B7D] font-medium hover:text-[#2D3A35] transition-colors no-underline">
                  로그인
                </Link>
              </p>
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <p className="text-xs text-[#6B6560]/50 font-sans-ko">
            © 2025 소명. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
