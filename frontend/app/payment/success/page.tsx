'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Shared styles
const s = {
  page: { minHeight: '100vh', background: '#FDFCFA' } as React.CSSProperties,
  header: { position: 'sticky' as const, top: 0, zIndex: 10, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(235,229,223,0.6)' },
  headerInner: { maxWidth: '36rem', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo: { textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  logoCircle: { width: '2rem', height: '2rem', borderRadius: '50%', background: '#2D3A35', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: 'serif', fontSize: '0.75rem', color: '#C5A059', fontWeight: 700 },
  logoName: { fontFamily: 'serif', fontSize: '1.25rem', color: '#2D3A35' },
  main: { maxWidth: '36rem', margin: '0 auto', padding: '2rem 1.5rem 4rem' },
  card: { background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(235,229,223,0.6)', borderRadius: '1.25rem', padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 4px 20px -4px rgba(45,58,53,0.06)' } as React.CSSProperties,
  h1: { fontSize: '1.5rem', fontWeight: 700, color: '#2D3A35', marginBottom: '0.5rem' },
  h2: { fontSize: '1rem', fontWeight: 600, color: '#2D3A35', marginBottom: '1rem' },
  text: { fontSize: '0.875rem', color: '#6B5E52', lineHeight: 1.6 },
  textMuted: { fontSize: '0.75rem', color: '#8B8580' },
  center: { textAlign: 'center' as const },
  spinner: { display: 'inline-block', width: '1rem', height: '1rem', border: '2px solid #C5A059', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  btnPrimary: { width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 700, border: 'none', borderRadius: '0.75rem', cursor: 'pointer', background: '#C5A059', color: '#2D3A35' },
  error: { marginTop: '1rem', padding: '0.75rem', background: 'rgba(198,123,111,0.08)', border: '1px solid rgba(198,123,111,0.2)', borderRadius: '0.75rem', fontSize: '0.875rem', color: '#C67B6F' },
  link: { fontSize: '0.875rem', color: '#8B8580', textDecoration: 'none' },
}

function PaymentSuccessContent() {
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking')
  const [error, setError] = useState('')
  const [orderIdState, setOrderIdState] = useState('')

  useEffect(() => {
    // Payment was already captured in the payment page via onApprove callback.
    // This page reads the completed payment info from sessionStorage.
    const completedRaw = sessionStorage.getItem('completed_payment')

    if (completedRaw) {
      try {
        const completed = JSON.parse(completedRaw)
        setOrderIdState(completed.orderId || '')
        setStatus('success')
      } catch {
        setError('결제 정보를 불러올 수 없습니다.')
        setStatus('error')
      }
    } else {
      setError('결제 정보를 찾을 수 없습니다. 이미 처리되었거나 유효하지 않은 접근입니다.')
      setStatus('error')
    }
  }, [])

  if (status === 'checking') {
    return (
      <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={s.center}>
          <div style={{ position: 'relative', width: '5rem', height: '5rem', margin: '0 auto 1.5rem' }}>
            <div style={{ position: 'absolute', inset: 0, border: '4px solid #EBE5DF', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', inset: 0, border: '4px solid #C5A059', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>💳</div>
          </div>
          <h2 style={{ fontFamily: 'serif', fontSize: '1.25rem', color: '#2D3A35', marginBottom: '0.5rem' }}>결제 확인 중</h2>
          <p style={{ color: '#8B8580' }}>잠시만 기다려주세요...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1.5rem' }}>
        <div style={{ ...s.center, maxWidth: '28rem' }}>
          <div style={{ width: '5rem', height: '5rem', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'rgba(198, 123, 111, 0.1)' }}>
            <span style={{ fontSize: '2.5rem' }}>😢</span>
          </div>
          <h2 style={{ fontFamily: 'serif', fontSize: '1.25rem', color: '#2D3A35', marginBottom: '0.5rem' }}>결제 확인 실패</h2>
          <p style={{ color: '#8B8580', marginBottom: '1.5rem' }}>{error}</p>
          <p style={{ fontSize: '0.875rem', color: '#8B8580', marginBottom: '1.5rem' }}>
            문제가 지속되면 support@harmonyon.kr로 문의해주세요.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={() => router.push('/payment')}
              style={s.btnPrimary}
            >
              다시 시도하기
            </button>
            <Link href="/" style={{ ...s.link, textAlign: 'center' }}>
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <Link href="/" style={s.logo}>
            <div style={s.logoCircle}>
              <span style={s.logoText}>소</span>
            </div>
            <span style={s.logoName}>소명</span>
          </Link>
        </div>
      </header>

      <main style={s.main}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: '6rem', height: '6rem', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'rgba(90, 125, 107, 0.1)' }}>
            <svg style={{ width: '3rem', height: '3rem', color: '#5A7D6B' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 style={{ fontFamily: 'serif', fontSize: '1.5rem', color: '#2D3A35', marginBottom: '0.5rem' }}>결제가 완료되었습니다!</h1>
          <p style={{ color: '#8B8580' }}>
            프리미엄 분석을 시작할 준비가 되었습니다.
          </p>
        </div>

        {/* Order Summary */}
        <div style={s.card}>
          <h2 style={s.h2}>주문 내역</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6B5E52' }}>상품명</span>
              <span style={{ fontWeight: 500, color: '#2D3A35' }}>사주팔자 프리미엄 분석</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6B5E52' }}>결제 금액</span>
              <span style={{ fontWeight: 700, color: '#C5A059' }}>$4.99</span>
            </div>
            {orderIdState && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6B5E52' }}>주문 번호</span>
                <span style={{ fontSize: '0.875rem', color: '#8B8580', fontFamily: 'monospace' }}>{orderIdState}</span>
              </div>
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div style={{ color: '#fff', padding: '1.5rem', marginBottom: '1rem', background: 'linear-gradient(135deg, #2D3A35, #3D5A4E)', borderRadius: '1rem' }}>
          <h2 style={{ fontFamily: 'serif', marginBottom: '1rem' }}>다음 단계</h2>
          <p style={{ marginBottom: '1rem', color: 'rgba(255, 255, 255, 0.8)' }}>
            이제 부모님 정보와 아이 정보를 입력하시면 심층 분석 결과를 받아보실 수 있습니다.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              '부모님 생년월일 입력',
              '아이 생년월일 입력',
              'AI가 심층 분석 수행',
              '맞춤 리포트 제공'
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '1.5rem', height: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.2)' }}>
                  {i + 1}
                </div>
                <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            onClick={() => {
              const sajuInput = sessionStorage.getItem('sajuInput')
              router.push(sajuInput ? '/saju/results' : '/saju/input')
            }}
            style={s.btnPrimary}
          >
            프리미엄 분석 시작하기
          </button>
          <Link href="/" style={{ ...s.link, textAlign: 'center' }}>
            나중에 하기
          </Link>
        </div>

        {/* Support */}
        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: '#8B8580' }}>
            문의사항이 있으시면{' '}
            <a href="mailto:support@harmonyon.kr" style={{ color: '#C5A059', textDecoration: 'none' }}>
              support@harmonyon.kr
            </a>
            로 연락해주세요.
          </p>
        </div>
      </main>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={s.center}>
        <div style={{ position: 'relative', width: '5rem', height: '5rem', margin: '0 auto 1.5rem' }}>
          <div style={{ position: 'absolute', inset: 0, border: '4px solid #EBE5DF', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', inset: 0, border: '4px solid #C5A059', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
        <h2 style={{ fontFamily: 'serif', fontSize: '1.25rem', color: '#2D3A35', marginBottom: '0.5rem' }}>로딩 중...</h2>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  )
}
