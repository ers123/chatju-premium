'use client'

import { useState } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/api'
import { useLanguage } from '@/app/lib/i18n/context'

export default function SignUpPage() {
  const { t } = useLanguage()
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
      setError(err instanceof Error ? err.message : t.auth.signupFailed)
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
            }}>{t.auth.signupWelcome}</h2>
            <p style={{
              color: '#6B6560',
              marginBottom: '2rem',
              lineHeight: 1.6,
              fontSize: '0.9375rem'
            }}>
              <span style={{ color: '#2D3A35', fontWeight: 500 }}>{formData.email}</span>{t.auth.confirmEmailSentTo}<br />
              {t.auth.confirmEmailSent}
            </p>
            <p style={{
              fontSize: '0.875rem',
              color: '#8B8580',
              marginBottom: '2rem'
            }}>
              {t.auth.clickLinkToComplete}
            </p>
            <Link href="/auth/signin">
              <button style={{
                padding: '1rem 2rem',
                fontSize: '0.9375rem',
                fontWeight: 700,
                border: 'none',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                background: '#2D3A35',
                color: '#C5A059',
                boxShadow: '0 4px 12px rgba(45,58,53,0.15)'
              }}>
                {t.auth.goToLogin}
              </button>
            </Link>
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
              }}>{t.auth.signupTitle}</h2>
              <p style={{
                color: '#6B6560',
                fontSize: '0.9375rem',
                margin: 0
              }}>
                {t.auth.signupSubtitle}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  color: '#433E3B',
                  marginBottom: '0.75rem',
                  fontWeight: 500
                }}>
                  {t.auth.nameLabel}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder={t.auth.namePlaceholder}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem',
                    border: '1px solid #EBE5DF',
                    borderRadius: '0.75rem',
                    outline: 'none',
                    color: '#2D3A35',
                    background: '#fff',
                    boxSizing: 'border-box' as const
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  color: '#433E3B',
                  marginBottom: '0.75rem',
                  fontWeight: 500
                }}>
                  {t.auth.emailLabelShort}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="name@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem',
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
                  boxShadow: isLoading ? 'none' : '0 4px 12px rgba(45,58,53,0.15)',
                  marginBottom: '1.5rem'
                }}
              >
                {isLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <svg style={{ width: '1.25rem', height: '1.25rem', animation: 'spin 1s linear infinite', color: 'rgba(255,255,255,0.5)' }} viewBox="0 0 24 24">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t.auth.processing}
                  </span>
                ) : (
                  t.auth.signupButton
                )}
              </button>

              <p style={{ fontSize: '0.75rem', color: '#8B8580', textAlign: 'center', margin: 0 }}>
                {t.auth.termsAgreePre}{' '}
                <Link href="/terms" style={{ color: '#C5A059', textDecoration: 'none' }}>{t.auth.terms}</Link>
                {' '}{t.auth.termsAnd}{' '}
                <Link href="/privacy" style={{ color: '#C5A059', textDecoration: 'none' }}>{t.auth.privacy}</Link>
                {t.auth.termsAgreePost}
              </p>
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
                {t.auth.alreadyHaveAccount}{' '}
                <Link href="/auth/signin" style={{
                  color: '#B69B7D',
                  fontWeight: 500,
                  textDecoration: 'none'
                }}>
                  {t.auth.login}
                </Link>
              </p>
            </div>
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
