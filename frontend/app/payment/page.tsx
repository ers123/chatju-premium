'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { apiClient } from '@/lib/api'
import type { PromoValidateResponse } from '@/types'

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'test'
const PRODUCT_AMOUNT = 4.99

const isAuthenticated = () => {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('chatju_token')
}

// Shared styles
const s = {
  page: { minHeight: '100vh', background: '#FDFCFA' } as React.CSSProperties,
  header: { position: 'sticky' as const, top: 0, zIndex: 10, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(235,229,223,0.6)' },
  headerInner: { maxWidth: '36rem', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo: { textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  logoCircle: { width: '2rem', height: '2rem', borderRadius: '50%', background: '#2D3A35', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: 'serif', fontSize: '0.75rem', color: '#C5A059', fontWeight: 700 },
  logoName: { fontFamily: 'serif', fontSize: '1.25rem', color: '#2D3A35' },
  back: { fontSize: '0.875rem', color: '#8B8580', background: 'none', border: 'none', cursor: 'pointer' },
  main: { maxWidth: '36rem', margin: '0 auto', padding: '2rem 1.5rem 4rem' },
  card: { background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(235,229,223,0.6)', borderRadius: '1.25rem', padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 4px 20px -4px rgba(45,58,53,0.06)' } as React.CSSProperties,
  h2: { fontSize: '1rem', fontWeight: 600, color: '#2D3A35', marginBottom: '1rem' },
  text: { fontSize: '0.875rem', color: '#6B5E52', lineHeight: 1.6 },
  textMuted: { fontSize: '0.75rem', color: '#8B8580' },
  row: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' },
  input: { width: '100%', padding: '0.75rem 1rem', fontSize: '0.875rem', border: '1px solid #EBE5DF', borderRadius: '0.75rem', outline: 'none', color: '#2D3A35', background: '#fff', boxSizing: 'border-box' as const },
  btnPrimary: { width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 700, border: 'none', borderRadius: '0.75rem', cursor: 'pointer', background: '#2D3A35', color: '#C5A059' },
  btnSmall: { padding: '0.75rem 1.25rem', fontSize: '0.875rem', fontWeight: 700, border: 'none', borderRadius: '0.75rem', cursor: 'pointer', background: '#2D3A35', color: '#C5A059' },
  error: { marginTop: '1rem', padding: '0.75rem', background: 'rgba(198,123,111,0.08)', border: '1px solid rgba(198,123,111,0.2)', borderRadius: '0.75rem', fontSize: '0.875rem', color: '#C67B6F' },
  promoApplied: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(90,122,102,0.08)', border: '1px solid rgba(90,122,102,0.2)', borderRadius: '0.75rem' },
  center: { textAlign: 'center' as const },
  spinner: { display: 'inline-block', width: '1rem', height: '1rem', border: '2px solid #C5A059', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' },
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        createOrder: () => Promise<string>
        onApprove: (data: { orderID: string }) => Promise<void>
        onError: (err: any) => void
        onCancel?: () => void
      }) => { render: (selector: string) => Promise<void> }
    }
  }
}

function PaymentContent() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [sdkReady, setSdkReady] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const buttonsRenderedRef = useRef(false)

  const [promoCode, setPromoCode] = useState('')
  const [promoResult, setPromoResult] = useState<PromoValidateResponse | null>(null)
  const [promoValidating, setPromoValidating] = useState(false)
  const [email, setEmail] = useState('')
  const [isPromoFlow, setIsPromoFlow] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const promoParam = params.get('promo')
    if (promoParam) {
      setPromoCode(promoParam)
      setIsPromoFlow(true)
      setIsLoading(false)
      apiClient.validatePromoCode(promoParam).then((result) => {
        setPromoResult(result)
        if (!result.valid) {
          setError(result.error || '유효하지 않은 프로모 코드입니다.')
          setIsPromoFlow(false)
        }
      }).catch(() => { setIsPromoFlow(false) })
      return
    }
    if (!isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', '/payment')
      router.push('/auth/signin')
      return
    }
    setIsLoading(false)
  }, [router])

  useEffect(() => {
    if (!sdkReady || isLoading || !window.paypal || buttonsRenderedRef.current) return
    if (promoResult?.valid) return
    buttonsRenderedRef.current = true
    try {
      window.paypal.Buttons({
        createOrder: async () => {
          try {
            const response = await apiClient.createPayPalPayment({ amount: PRODUCT_AMOUNT, description: 'Premium Saju Reading' })
            if (response.success && response.paypalOrderId) {
              sessionStorage.setItem('pending_order', JSON.stringify({ orderId: response.orderId, paypalOrderId: response.paypalOrderId, amount: PRODUCT_AMOUNT }))
              return response.paypalOrderId
            }
            throw new Error('주문 생성에 실패했습니다.')
          } catch (err: any) {
            setError(err.error || '주문 생성 중 오류가 발생했습니다.')
            throw err
          }
        },
        onApprove: async (data: { orderID: string }) => {
          setIsProcessing(true); setError('')
          try {
            const result = await apiClient.capturePayPalPayment(data.orderID)
            if (result && (result as any).success && (result as any).payment) {
              const payment = (result as any).payment
              sessionStorage.setItem('completed_payment', JSON.stringify({ orderId: payment.order_id, paymentId: payment.id, completedAt: new Date().toISOString() }))
              sessionStorage.removeItem('pending_order')
              router.push('/payment/success')
            } else { setError('결제 확인에 실패했습니다.') }
          } catch (err: any) { setError(err.error || '결제 처리 중 오류가 발생했습니다.') }
          finally { setIsProcessing(false) }
        },
        onError: () => { setError('결제 중 오류가 발생했습니다. 다시 시도해주세요.') },
        onCancel: () => {},
      }).render('#paypal-button-container')
    } catch { setError('결제 시스템 초기화에 실패했습니다.') }
  }, [sdkReady, isLoading, router, promoResult])

  const handlePromoValidate = async () => {
    if (!promoCode.trim()) return
    setPromoValidating(true); setError('')
    try {
      const result = await apiClient.validatePromoCode(promoCode.trim())
      setPromoResult(result)
      if (result.valid) { setIsPromoFlow(true) }
      else { setError(result.error || '유효하지 않은 프로모 코드입니다.') }
    } catch (err: any) { setError(err.error || '프로모 코드 검증 중 오류가 발생했습니다.') }
    finally { setPromoValidating(false) }
  }

  const handlePromoSubmit = async () => {
    if (!email.trim()) { setError('이메일을 입력해주세요.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('올바른 이메일 주소를 입력해주세요.'); return }
    setIsProcessing(true); setError('')
    try {
      const sajuInput = sessionStorage.getItem('sajuInput')
      if (!sajuInput) { setError('생년월일 정보가 없습니다. 처음부터 다시 시도해주세요.'); setIsProcessing(false); return }
      const birthInfo = JSON.parse(sajuInput)
      const result = await apiClient.calculateWithPromo({
        promoCode: promoCode.trim(), email: email.trim(), subjectName: birthInfo.name,
        birthDate: birthInfo.birthDate, birthTime: birthInfo.birthTime, gender: birthInfo.gender,
        timezone: birthInfo.timezone, language: birthInfo.language, birthPlace: birthInfo.birthPlace,
        latitude: birthInfo.latitude, longitude: birthInfo.longitude,
        parentBirthDate: birthInfo.parentBirthDate, parentBirthTime: birthInfo.parentBirthTime,
        parentRole: birthInfo.parentRole, twinOrder: birthInfo.twinOrder, twinSiblingName: birthInfo.twinSiblingName,
      })
      sessionStorage.setItem('completed_payment', JSON.stringify({ orderId: `promo_${promoCode.trim()}`, promoCode: promoCode.trim(), completedAt: new Date().toISOString() }))
      sessionStorage.setItem('promo_reading', JSON.stringify(result))
      router.push('/payment/success')
    } catch (err: any) { setError(err.error || '리포트 생성 중 오류가 발생했습니다.') }
    finally { setIsProcessing(false) }
  }

  const handlePromoClear = () => {
    setPromoResult(null); setPromoCode(''); setIsPromoFlow(false); setError('')
    buttonsRenderedRef.current = false
  }

  if (isLoading) {
    return (
      <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={s.center}>
          <div style={{ ...s.spinner, width: '3rem', height: '3rem', borderWidth: '4px', marginBottom: '1rem' }} />
          <p style={s.textMuted}>결제 정보를 준비하고 있습니다...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {!isPromoFlow && (
        <Script
          src={`https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`}
          strategy="afterInteractive"
          onLoad={() => setSdkReady(true)}
        />
      )}

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
            <button onClick={() => router.back()} style={s.back}>← 뒤로가기</button>
          </div>
        </header>

        <main style={s.main}>
          {/* Product Info */}
          <div style={s.card}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ width: '4rem', height: '4rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #2D3A35, #3D5A4E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                👨‍👩‍👧
              </div>
              <div>
                <h1 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#2D3A35', marginBottom: '0.25rem' }}>사주팔자 프리미엄 분석</h1>
                <p style={{ ...s.textMuted, marginBottom: '0.75rem' }}>부모-자녀 궁합 분석 · 연령별 발달 가이드 · 진로 심층 분석</p>
                {promoResult?.valid ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#5A7A66' }}>무료</span>
                    <span style={{ fontSize: '0.875rem', color: '#8B8580', textDecoration: 'line-through' }}>$4.99</span>
                    <span style={{ padding: '0.125rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#5A7A66', background: 'rgba(90,122,102,0.1)', borderRadius: '4px' }}>프로모 코드 적용</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#C5A059' }}>$4.99</span>
                    <span style={{ fontSize: '0.875rem', color: '#8B8580', textDecoration: 'line-through' }}>$9.99</span>
                    <span style={{ padding: '0.125rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#C67B6F', background: 'rgba(198,123,111,0.1)', borderRadius: '4px' }}>50% OFF</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* What's Included */}
          <div style={s.card}>
            <h2 style={s.h2}>프리미엄에 포함된 내용</h2>
            {[
              { icon: '🌊', text: '아이의 타고난 기질 심층 분석' },
              { icon: '🌳', text: '부모 양육 스타일 분석' },
              { icon: '👨‍👩‍👧', text: '부모-자녀 관계 패턴 & 갈등 해법' },
              { icon: '💪', text: '아이의 강점·약점 & 스트레스 신호' },
              { icon: '🔮', text: '올해 운세 흐름 (대운/세운)' },
              { icon: '🧘', text: '오행 밸런스 생활 조절법' },
              { icon: '✅', text: '바로 실천할 수 있는 7가지 미션' },
              { icon: '📧', text: 'PDF 리포트 + 이메일 발송' },
            ].map((item, i) => (
              <div key={i} style={s.row}>
                <span style={{ fontSize: '1.125rem' }}>{item.icon}</span>
                <span style={s.text}>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Promo Code */}
          <div style={s.card}>
            <h2 style={s.h2}>프로모 코드</h2>
            {promoResult?.valid ? (
              <div style={s.promoApplied}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#5A7A66', margin: 0 }}>{promoResult.promoCode?.code} 적용 완료</p>
                  <p style={{ ...s.textMuted, margin: '0.25rem 0 0' }}>{promoResult.promoCode?.partnerName} 제휴 혜택</p>
                </div>
                <button onClick={handlePromoClear} style={{ ...s.back, fontSize: '0.75rem' }}>취소</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handlePromoValidate()}
                  placeholder="프로모 코드 입력"
                  style={{ ...s.input, flex: 1, width: 'auto' }}
                />
                <button
                  onClick={handlePromoValidate}
                  disabled={promoValidating || !promoCode.trim()}
                  style={{ ...s.btnSmall, opacity: promoValidating || !promoCode.trim() ? 0.5 : 1 }}
                >
                  {promoValidating ? '확인중...' : '적용'}
                </button>
              </div>
            )}
          </div>

          {/* Email (promo flow) */}
          {promoResult?.valid && (
            <div style={s.card}>
              <h2 style={s.h2}>이메일 주소</h2>
              <p style={{ ...s.textMuted, marginBottom: '0.75rem' }}>리포트를 이메일로도 받아보실 수 있습니다.</p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                style={s.input}
              />
            </div>
          )}

          {/* Action Button */}
          {promoResult?.valid ? (
            <div style={s.card}>
              <button
                onClick={handlePromoSubmit}
                disabled={isProcessing || !email.trim()}
                style={{ ...s.btnPrimary, opacity: isProcessing || !email.trim() ? 0.5 : 1 }}
              >
                {isProcessing ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span style={s.spinner} />
                    리포트 생성 중...
                  </span>
                ) : '무료로 리포트 받기'}
              </button>
              {isProcessing && (
                <p style={{ ...s.textMuted, textAlign: 'center', marginTop: '1rem', lineHeight: 1.6 }}>
                  AI가 리포트를 작성하고 있습니다 (30~40초 소요).<br />
                  이메일로도 발송되니, 창을 닫으셔도 됩니다.
                </p>
              )}
              {error && <div style={s.error}>{error}</div>}
            </div>
          ) : (
            <div style={s.card}>
              <h2 style={s.h2}>결제 수단</h2>
              {isProcessing && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 0' }}>
                  <div style={{ ...s.spinner, width: '2rem', height: '2rem', borderWidth: '3px', marginRight: '0.75rem' }} />
                  <p style={s.textMuted}>결제를 처리하고 있습니다...</p>
                </div>
              )}
              <div id="paypal-button-container" style={{ display: isProcessing ? 'none' : 'block' }} />
              {!sdkReady && !isProcessing && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 0' }}>
                  <div style={{ ...s.spinner, width: '1.5rem', height: '1.5rem', borderWidth: '2px', marginRight: '0.75rem' }} />
                  <p style={{ ...s.textMuted, fontSize: '0.875rem' }}>결제 시스템을 불러오는 중...</p>
                </div>
              )}
              {error && <div style={s.error}>{error}</div>}
            </div>
          )}

          {/* Terms */}
          <p style={{ ...s.textMuted, textAlign: 'center', lineHeight: 1.8, marginTop: '1.5rem' }}>
            {promoResult?.valid ? '리포트를 받으시면' : '결제를 진행하시면'}{' '}
            <Link href="/terms" style={{ color: '#C5A059' }}>이용약관</Link>,{' '}
            <Link href="/privacy" style={{ color: '#C5A059' }}>개인정보처리방침</Link>,{' '}
            <Link href="/refund" style={{ color: '#C5A059' }}>환불정책</Link>에 동의하게 됩니다.
            <br />결과 생성 시작 시 청약철회가 제한될 수 있습니다.
          </p>

          {/* Security */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', ...s.textMuted }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>{promoResult?.valid ? '안전한 리포트 생성' : 'PayPal 안전 결제'}</span>
          </div>
        </main>
      </div>
    </>
  )
}

function LoadingFallback() {
  return (
    <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={s.center}>
        <p style={s.textMuted}>로딩 중...</p>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentContent />
    </Suspense>
  )
}
