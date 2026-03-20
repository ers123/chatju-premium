'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function PaymentFailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const reason = searchParams.get('reason') || ''
  const orderId = searchParams.get('orderId')

  const isCancelled = reason === 'cancelled'

  const message = isCancelled
    ? '결제가 취소되었습니다.'
    : reason || '결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.'

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
              <span style={{ fontFamily: 'serif', fontSize: '0.75rem', color: '#C5A059', fontWeight: 700 }}>소</span>
            </div>
            <span style={{ fontFamily: 'serif', fontSize: '1.25rem', color: '#2D3A35' }}>소명</span>
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
            {isCancelled ? '결제가 취소되었습니다' : '결제에 실패했습니다'}
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
              <p style={{ fontSize: '0.75rem', color: '#8B8580', marginBottom: '0.5rem' }}>오류 정보</p>
              <p style={{ fontSize: '0.875rem', color: '#6B5E52', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                주문번호: {orderId}
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
              다시 시도하기
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
              무료 분석 결과로 돌아가기
            </Link>

            <Link href="/" style={{ fontSize: '0.875rem', color: '#8B8580', textDecoration: 'none' }}>
              홈으로 돌아가기
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
            <h3 style={{ fontFamily: 'serif', color: '#2D3A35', marginBottom: '0.75rem' }}>결제가 계속 실패하나요?</h3>
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
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: '#C5A059' }}>•</span>
                <span>PayPal 계정 잔액 또는 연결된 카드를 확인해보세요</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: '#C5A059' }}>•</span>
                <span>다른 브라우저나 시크릿 모드를 사용해보세요</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: '#C5A059' }}>•</span>
                <span>PayPal 계정에 로그인하여 결제 제한 여부를 확인해보세요</span>
              </li>
            </ul>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(235, 229, 223, 0.6)' }}>
              <p style={{ fontSize: '0.875rem', color: '#8B8580' }}>
                그래도 문제가 해결되지 않으면{' '}
                <a href="mailto:support@harmonyon.kr" style={{ color: '#C5A059', textDecoration: 'none' }}>
                  support@harmonyon.kr
                </a>
                로 문의해주세요.
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
        <p style={{ color: '#8B8580' }}>로딩 중...</p>
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
