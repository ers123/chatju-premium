'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [error, setError] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get tokens from URL hash or query params (Supabase auth)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token')

        if (accessToken) {
          // Store token in localStorage
          localStorage.setItem('chatju_token', accessToken)
          if (refreshToken) {
            localStorage.setItem('chatju_refresh_token', refreshToken)
          }

          setStatus('success')

          // Check for redirect path
          const redirectPath = sessionStorage.getItem('redirect_after_login')
          sessionStorage.removeItem('redirect_after_login')

          // Redirect after brief delay to show success
          setTimeout(() => {
            router.push(redirectPath || '/')
          }, 1500)
        } else {
          // Check for error
          const errorDesc = hashParams.get('error_description') || searchParams.get('error_description')
          if (errorDesc) {
            setError(errorDesc)
            setStatus('error')
          } else {
            // No token and no error - might be expired link
            setError('인증 링크가 만료되었거나 유효하지 않습니다.')
            setStatus('error')
          }
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        setError('인증 처리 중 오류가 발생했습니다.')
        setStatus('error')
      }
    }

    handleCallback()
  }, [router, searchParams])

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-[#FAF8F6] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-[#EBE5DF] rounded-full" />
            <div className="absolute inset-0 border-4 border-[#B69B7D] rounded-full border-t-transparent animate-spin" />
          </div>
          <h2 className="font-serif-ko text-xl text-[#2D3A35] mb-2">로그인 처리 중...</h2>
          <p className="text-[#6B6560] text-sm">잠시만 기다려주세요</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#FAF8F6] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#C67B6F]/10 flex items-center justify-center">
            <span className="text-4xl">😢</span>
          </div>
          <h2 className="font-serif-ko text-xl text-[#2D3A35] mb-2">로그인 실패</h2>
          <p className="text-[#6B6560] mb-6">{error}</p>
          <Link
            href="/auth/signin"
            className="inline-block px-6 py-3 bg-[#2D3A35] text-white rounded-xl font-medium hover:bg-[#B69B7D] transition-colors"
          >
            다시 로그인하기
          </Link>
        </div>
      </div>
    )
  }

  // Success state
  return (
    <div className="min-h-screen bg-[#FAF8F6] flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#5A7D6B]/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-[#5A7D6B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="font-serif-ko text-xl text-[#2D3A35] mb-2">로그인 완료!</h2>
        <p className="text-[#6B6560] text-sm">잠시 후 이동합니다...</p>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#FAF8F6] flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-[#EBE5DF] rounded-full" />
          <div className="absolute inset-0 border-4 border-[#B69B7D] rounded-full border-t-transparent animate-spin" />
        </div>
        <h2 className="font-serif-ko text-xl text-[#2D3A35] mb-2">로딩 중...</h2>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  )
}
