'use client'

import { useState, useEffect } from 'react'
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

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [redirectPath, setRedirectPath] = useState('')

  // Check for redirect after login
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const redirect = sessionStorage.getItem('redirect_after_login')
      if (redirect) {
        setRedirectPath(redirect)
      }
    }
  }, [])

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

  // Dev-only: bypass magic link for local testing
  const handleDevLogin = async () => {
    setError('')
    setIsLoading(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const res = await fetch(`${API_URL}/auth/dev-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'dev-test@somyung.local' }),
      })
      const data = await res.json()
      if (data.success && data.session) {
        localStorage.setItem('chatju_token', data.session.access_token)
        if (data.session.refresh_token) {
          localStorage.setItem('chatju_refresh_token', data.session.refresh_token)
        }
        const redirect = sessionStorage.getItem('redirect_after_login')
        sessionStorage.removeItem('redirect_after_login')
        router.push(redirect || '/')
      } else {
        setError(data.error || 'Dev login failed')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Dev login failed')
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
            <h2 className="font-serif-ko text-[1.75rem] text-[#2D3A35] mb-3">이메일을 확인하세요</h2>
            <p className="font-sans-ko text-[#6B6560] mb-8 leading-relaxed">
              <span className="text-[#2D3A35] font-medium">{email}</span>으로<br />
              로그인 링크를 전송했습니다.
            </p>
            {redirectPath === '/payment' && (
              <p className="text-sm text-[#B69B7D] font-medium mb-4">
                로그인 후 결제 페이지로 자동 이동됩니다
              </p>
            )}
            <p className="text-xs text-[#8B8580]">
              이메일이 도착하지 않았다면 스팸함을 확인해주세요.
            </p>
          </div>
        ) : (
          <div className="card-paper p-10 border-none shadow-[0_20px_40px_-5px_rgba(45,58,53,0.08)]">
            <div className="text-center mb-10">
              <h2 className="font-serif-ko text-[1.75rem] text-[#2D3A35] mb-2 tracking-tight">환영합니다</h2>
              <p className="font-sans-ko text-[#6B6560] text-[0.9375rem]">
                천년의 지혜와 만나는 시작점입니다
              </p>
              {redirectPath === '/payment' && (
                <p className="mt-3 text-sm text-[#B69B7D] font-medium">
                  로그인 후 결제 페이지로 이동합니다
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-6 text-center">
                <label className="block font-sans-ko text-sm text-[#433E3B] mb-3 font-medium">
                  이메일 주소
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full p-4 text-base text-center rounded-xl border-[#EBE5DF] bg-white/50 focus:bg-white transition-all shadow-inner placeholder:text-[#6B6560]/40"
                />
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-[#C67B6F]/10 border border-[#C67B6F]/20 text-[#C67B6F] text-sm mb-6 flex items-center justify-center gap-2">
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
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FEFDFB] px-4 text-xs text-[#6B6560] font-medium">
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

            {/* Dev-only login bypass */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 pt-4" style={{ borderTop: '1px dashed rgba(198, 123, 111, 0.3)' }}>
                <button
                  onClick={handleDevLogin}
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl text-sm font-medium transition-colors"
                  style={{ backgroundColor: 'rgba(198, 123, 111, 0.08)', color: '#C67B6F', border: '1px solid rgba(198, 123, 111, 0.2)' }}
                >
                  Dev Login (skip magic link)
                </button>
                <p className="text-[10px] text-center mt-1" style={{ color: 'rgba(198, 123, 111, 0.6)' }}>Development only — not visible in production</p>
              </div>
            )}
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
