'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/app/lib/i18n/context'

function PaymentFailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()

  const reason = searchParams.get('reason') || ''
  const orderId = searchParams.get('orderId')

  const isCancelled = reason === 'cancelled'

  const message = isCancelled
    ? t.payment.failCancelledMsg
    : reason || t.payment.failDefaultMsg

  return (
    <div style={{ minHeight: '100vh', background: '#FDFCFA' }}>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(253, 252, 250, 0.8)',
        borderBottom: '1px solid rgba(235, 229, 223, 0.6)',
      }}>
        <div style={{
          maxWidth: '36rem',
          margin: '0 auto',
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: '#2D3A35',
            }}>
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>☯</span>
            </div>
            <span style={{ fontFamily: 'serif', fontSize: '1.25rem', color: '#2D3A35' }}>SoMyung</span>
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: '36rem', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ textAlign: 'center' }}>
          {/* Icon */}
          <div style={{
            width: '6rem',
            height: '6rem',
            margin: '0 auto 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            backgroundColor: isCancelled ? '#FFF8E1' : 'rgba(198, 123, 111, 0.1)',
          }}>
            <span style={{ fontSize: '3rem' }}>{isCancelled ? '🔙' : '😢'}</span>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: 'serif',
            fontSize: '1.5rem',
            color: '#2D3A35',
            marginBottom: '0.5rem',
          }}>
            {isCancelled ? t.payment.failCancelled : t.payment.failTitle}
          </h1>

          {/* Message */}
          <p style={{
            color: '#8B8580',
            marginBottom: '2rem',
            maxWidth: '24rem',
            margin: '0 auto 2rem',
          }}>
            {message}
          </p>

          {/* Error Details (for debugging) */}
          {!isCancelled && orderId && (
            <div style={{
              padding: '1rem',
              marginBottom: '2rem',
              textAlign: 'left',
              maxWidth: '24rem',
              margin: '0 auto 2rem',
              backgroundColor: 'rgba(235, 229, 223, 0.4)',
              borderRadius: '12px',
            }}>
              <p style={{ fontSize: '0.75rem', color: '#8B8580', marginBottom: '0.5rem' }}>{t.payment.failErrorInfo}</p>
              <p style={{ fontSize: '0.875rem', color: '#6B5E52', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {t.payment.failOrderId}: {orderId}
              </p>
            </div>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            maxWidth: '24rem',
            margin: '0 auto',
          }}>
            <button
              onClick={() => router.push('/payment')}
              style={{
                width: '100%',
                padding: '1rem',
                fontWeight: 700,
                backgroundColor: '#2D3A35',
                color: '#C5A059',
                border: 'none',
                borderRadius: '1.25rem',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              {t.payment.failRetry}
            </button>

            <Link
              href="/saju/results"
              style={{
                width: '100%',
                padding: '1rem',
                fontWeight: 700,
                textAlign: 'center',
                textDecoration: 'none',
                backgroundColor: 'transparent',
                color: '#2D3A35',
                border: '1px solid rgba(235, 229, 223, 0.8)',
                borderRadius: '1.25rem',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            >
              {t.payment.failBackToResults}
            </Link>

            <Link href="/" style={{ fontSize: '0.875rem', color: '#8B8580', textDecoration: 'none' }}>
              {t.payment.failGoHome}
            </Link>
          </div>

          {/* Help */}
          <div style={{
            marginTop: '3rem',
            padding: '1.5rem',
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(235, 229, 223, 0.6)',
            borderRadius: '1.25rem',
          }}>
            <h3 style={{ fontFamily: 'serif', color: '#2D3A35', marginBottom: '0.75rem' }}>{t.payment.failHelpTitle}</h3>
            <ul style={{
              fontSize: '0.875rem',
              color: '#6B5E52',
              textAlign: 'left',
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}>
              {t.payment.failHelpItems.map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ color: '#C5A059' }}>•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(235, 229, 223, 0.6)' }}>
              <p style={{ fontSize: '0.875rem', color: '#8B8580' }}>
                {t.payment.failContactPrefix}{' '}
                <a href="mailto:support@harmonyon.kr" style={{ color: '#C5A059', textDecoration: 'none' }}>
                  support@harmonyon.kr
                </a>
                {t.payment.failContactSuffix}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FDFCFA',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ position: 'relative', width: '4rem', height: '4rem', margin: '0 auto 1rem' }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            border: '4px solid #EBE5DF',
            borderRadius: '50%',
          }} />
          <div style={{
            position: 'absolute',
            inset: 0,
            border: '4px solid #C5A059',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
        </div>
        <p style={{ color: '#8B8580' }}>Loading...</p>
      </div>
    </div>
  )
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentFailContent />
    </Suspense>
  )
}
