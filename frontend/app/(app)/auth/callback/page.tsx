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
      <div style={{ minHeight: '100vh', background: '#FDFCFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '4rem', height: '4rem', margin: '0 auto 1.5rem' }}>
            <div style={{ position: 'absolute', inset: 0, border: '4px solid #EBE5DF', borderRadius: '9999px' }} />
            <div style={{ position: 'absolute', inset: 0, border: '4px solid #C5A059', borderRadius: '9999px', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
          </div>
          <h2 style={{ fontFamily: 'serif', fontSize: '1.25rem', color: '#2D3A35', marginBottom: '0.5rem' }}>로그인 처리 중...</h2>
          <p style={{ color: '#8B8580', fontSize: '0.875rem' }}>잠시만 기다려주세요</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={{ minHeight: '100vh', background: '#FDFCFA', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
          <div style={{ width: '5rem', height: '5rem', margin: '0 auto 1.5rem', borderRadius: '9999px', background: 'rgba(198,123,111,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '2.25rem' }}>😢</span>
          </div>
          <h2 style={{ fontFamily: 'serif', fontSize: '1.25rem', color: '#2D3A35', marginBottom: '0.5rem' }}>로그인 실패</h2>
          <p style={{ color: '#8B8580', marginBottom: '1.5rem' }}>{error}</p>
          <Link
            href="/auth/signin"
            style={{ display: 'inline-block', padding: '0.75rem 1.5rem', background: '#2D3A35', color: '#ffffff', borderRadius: '0.75rem', fontWeight: 500, textDecoration: 'none', transition: 'background 0.2s' }}
          >
            다시 로그인하기
          </Link>
        </div>
      </div>
    )
  }

  // Success state
  return (
    <div style={{ minHeight: '100vh', background: '#FDFCFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '5rem', height: '5rem', margin: '0 auto 1.5rem', borderRadius: '9999px', background: 'rgba(90,125,107,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg style={{ width: '2.5rem', height: '2.5rem', color: '#5A7D6B' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 style={{ fontFamily: 'serif', fontSize: '1.25rem', color: '#2D3A35', marginBottom: '0.5rem' }}>로그인 완료!</h2>
        <p style={{ color: '#8B8580', fontSize: '0.875rem' }}>잠시 후 이동합니다...</p>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div style={{ minHeight: '100vh', background: '#FDFCFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ position: 'relative', width: '4rem', height: '4rem', margin: '0 auto 1.5rem' }}>
          <div style={{ position: 'absolute', inset: 0, border: '4px solid #EBE5DF', borderRadius: '9999px' }} />
          <div style={{ position: 'absolute', inset: 0, border: '4px solid #C5A059', borderRadius: '9999px', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
        </div>
        <h2 style={{ fontFamily: 'serif', fontSize: '1.25rem', color: '#2D3A35', marginBottom: '0.5rem' }}>로딩 중...</h2>
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
