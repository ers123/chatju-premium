'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { useLanguage } from '@/app/lib/i18n/context'

export default function SignInPage() {
  const router = useRouter()
  const { t } = useLanguage()
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
      setError(err instanceof Error ? err.message : t.auth.loginFailed)
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
        setError(data.error || t.auth.devLoginFailed)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.auth.devLoginFailed)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FDFCFA',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Brand Header (Centered) */}
      <div style={{
        position: 'absolute',
        top: '2rem',
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: 10
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '1.875rem', fontWeight: 700, color: '#2D3A35' }}>☯ SoMyung</span>
        </Link>
      </div>

      <div style={{
        maxWidth: '420px',
        width: '100%',
        position: 'relative',
        zIndex: 10
      }}>
        {success ? (
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid rgba(235,229,223,0.6)',
            borderRadius: '1.25rem',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: '0 20px 40px -5px rgba(45,58,53,0.1)'
          }}>
            <div style={{
              width: '5rem',
              height: '5rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '2.25rem',
              background: 'linear-gradient(135deg, #F5EDE4, #EBE5DF)',
              border: '1px solid rgba(255,255,255,0.5)'
            }}>
              ✉️
            </div>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#2D3A35',
              marginBottom: '0.75rem',
              marginTop: 0
            }}>{t.auth.checkEmail}</h2>
            <p style={{
              color: '#6B6560',
              marginBottom: '2rem',
              lineHeight: 1.6,
              fontSize: '0.9375rem'
            }}>
              <span style={{ color: '#2D3A35', fontWeight: 500 }}>{email}</span>{t.auth.loginLinkSentTo}<br />
              {t.auth.loginLinkSent}
            </p>
            {redirectPath === '/payment' && (
              <p style={{
                fontSize: '0.875rem',
                color: '#B69B7D',
                fontWeight: 500,
                marginBottom: '1rem'
              }}>
                {t.auth.redirectAfterLoginSuccess}
              </p>
            )}
            <p style={{ fontSize: '0.75rem', color: '#8B8580' }}>
              {t.auth.checkSpam}
            </p>
          </div>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid rgba(235,229,223,0.6)',
            borderRadius: '1.25rem',
            padding: '2.5rem',
            boxShadow: '0 20px 40px -5px rgba(45,58,53,0.08)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: '#2D3A35',
                marginBottom: '0.5rem',
                marginTop: 0,
                letterSpacing: '-0.02em'
              }}>{t.auth.welcome}</h2>
              <p style={{
                color: '#6B6560',
                fontSize: '0.9375rem',
                margin: 0
              }}>
                {t.auth.welcomeSubtitle}
              </p>
              {redirectPath === '/payment' && (
                <p style={{
                  marginTop: '0.75rem',
                  fontSize: '0.875rem',
                  color: '#B69B7D',
                  fontWeight: 500
                }}>
                  {t.auth.redirectAfterLogin}
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  color: '#433E3B',
                  marginBottom: '0.75rem',
                  fontWeight: 500
                }}>
                  {t.auth.emailLabel}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem',
                    textAlign: 'center',
                    border: '1px solid #EBE5DF',
                    borderRadius: '0.75rem',
                    outline: 'none',
                    color: '#2D3A35',
                    background: '#fff',
                    boxSizing: 'border-box' as const
                  }}
                />
              </div>

              {error && (
                <div style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  background: 'rgba(198,123,111,0.1)',
                  border: '1px solid rgba(198,123,111,0.2)',
                  color: '#C67B6F',
                  fontSize: '0.875rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '0.75rem',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  background: '#2D3A35',
                  color: '#C5A059',
                  opacity: isLoading ? 0.7 : 1,
                  boxShadow: isLoading ? 'none' : '0 4px 12px rgba(45,58,53,0.15)'
                }}
              >
                {isLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <svg style={{ width: '1.25rem', height: '1.25rem', animation: 'spin 1s linear infinite', color: 'rgba(255,255,255,0.5)' }} viewBox="0 0 24 24">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t.auth.sending}
                  </span>
                ) : (
                  t.auth.getLoginLink
                )}
              </button>
            </form>

            <div style={{ margin: '2rem 0', position: 'relative' }}>
              <div style={{ height: '1px', background: '#EBE5DF' }} />
              <span style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                background: '#FEFDFB',
                padding: '0 1rem',
                fontSize: '0.75rem',
                color: '#6B6560',
                fontWeight: 500
              }}>
                {t.auth.or}
              </span>
            </div>

            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#6B6560', fontSize: '0.875rem', margin: 0 }}>
                {t.auth.newUser}{' '}
                <Link href="/auth/signup" style={{
                  color: '#B69B7D',
                  fontWeight: 500,
                  textDecoration: 'none'
                }}>
                  {t.auth.signup}
                </Link>
              </p>
            </div>

            {/* Dev-only login bypass */}
            {process.env.NODE_ENV === 'development' && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed rgba(198, 123, 111, 0.3)' }}>
                <button
                  onClick={handleDevLogin}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    backgroundColor: 'rgba(198, 123, 111, 0.08)',
                    color: '#C67B6F',
                    border: '1px solid rgba(198, 123, 111, 0.2)',
                    cursor: 'pointer'
                  }}
                >
                  {t.auth.devLogin}
                </button>
                <p style={{ fontSize: '10px', textAlign: 'center', marginTop: '0.25rem', color: 'rgba(198, 123, 111, 0.6)' }}>{t.auth.devLoginNote}</p>
              </div>
            )}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'rgba(107,101,96,0.5)' }}>
            {t.auth.copyright}
          </p>
        </div>
      </div>
    </div>
  )
}
