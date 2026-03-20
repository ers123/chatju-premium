'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { apiClient } from '@/lib/api'

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'test'
const PRODUCT_AMOUNT = 4.99

// Check if user is authenticated
const isAuthenticated = () => {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('chatju_token')
}

// PayPal types
declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        createOrder: () => Promise<string>
        onApprove: (data: { orderID: string }) => Promise<void>
        onError: (err: any) => void
        onCancel?: () => void
      }) => {
        render: (selector: string) => Promise<void>
      }
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

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', '/payment')
      router.push('/auth/signin')
      return
    }
    setIsLoading(false)
  }, [router])

  // Render PayPal buttons when SDK is ready
  useEffect(() => {
    if (!sdkReady || isLoading || !window.paypal || buttonsRenderedRef.current) return

    buttonsRenderedRef.current = true

    try {
      window.paypal.Buttons({
        createOrder: async () => {
          try {
            const response = await apiClient.createPayPalPayment({
              amount: PRODUCT_AMOUNT,
              description: 'Premium Saju Reading',
            })

            if (response.success && response.paypalOrderId) {
              // Store order info in session
              sessionStorage.setItem('pending_order', JSON.stringify({
                orderId: response.orderId,
                paypalOrderId: response.paypalOrderId,
                amount: PRODUCT_AMOUNT,
              }))
              return response.paypalOrderId
            }
            throw new Error('주문 생성에 실패했습니다.')
          } catch (err: any) {
            console.error('Order creation error:', err)
            setError(err.error || '주문 생성 중 오류가 발생했습니다.')
            throw err
          }
        },
        onApprove: async (data: { orderID: string }) => {
          setIsProcessing(true)
          setError('')
          try {
            const result = await apiClient.capturePayPalPayment(data.orderID)

            // Backend returns { success, payment, paypalCapture }
            if (result && (result as any).success && (result as any).payment) {
              const payment = (result as any).payment
              sessionStorage.setItem('completed_payment', JSON.stringify({
                orderId: payment.order_id,
                paymentId: payment.id,
                completedAt: new Date().toISOString(),
              }))
              sessionStorage.removeItem('pending_order')
              router.push('/payment/success')
            } else {
              setError('결제 확인에 실패했습니다.')
            }
          } catch (err: any) {
            console.error('Payment capture error:', err)
            setError(err.error || '결제 처리 중 오류가 발생했습니다.')
          } finally {
            setIsProcessing(false)
          }
        },
        onError: (err: any) => {
          console.error('PayPal error:', err)
          setError('결제 중 오류가 발생했습니다. 다시 시도해주세요.')
        },
        onCancel: () => {
          // User cancelled - no error needed
        },
      }).render('#paypal-button-container')
    } catch (err) {
      console.error('PayPal buttons render error:', err)
      setError('결제 시스템 초기화에 실패했습니다.')
    }
  }, [sdkReady, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF8F6' }}>
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-[#EBE5DF]" style={{ borderRadius: '50%' }} />
            <div className="absolute inset-0 border-4 border-[#C5A059] border-t-transparent animate-spin" style={{ borderRadius: '50%' }} />
          </div>
          <p className="text-[#8B8580]">결제 정보를 준비하고 있습니다...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Load PayPal JS SDK */}
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`}
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
      />

      <div className="min-h-screen" style={{ backgroundColor: '#FAF8F6' }}>
        {/* Header */}
        <header className="sticky top-0 z-10 glass-premium" style={{ borderBottom: '1px solid rgba(235, 229, 223, 0.6)' }}>
          <div className="max-w-2xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="no-underline flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center" style={{ borderRadius: '50%', backgroundColor: '#2D3A35' }}>
                <span className="font-serif text-xs text-[#C5A059] font-bold">소</span>
              </div>
              <span className="font-serif-ko text-xl text-[#2D3A35]">소명</span>
            </Link>
            <button
              onClick={() => router.back()}
              className="text-sm text-[#8B8580] hover:text-[#C5A059]"
            >
              ← 뒤로가기
            </button>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-6 py-8">
          {/* Product Info */}
          <section className="card-paper p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 flex items-center justify-center text-2xl" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #2D3A35, #3D5A4E)' }}>
                👨‍👩‍👧
              </div>
              <div className="flex-1">
                <h1 className="font-serif-ko text-lg text-[#2D3A35] mb-1">사주팔자 프리미엄 분석</h1>
                <p className="text-sm text-[#8B8580] mb-3">부모-자녀 궁합 분석 · 연령별 발달 가이드 · 진로 심층 분석</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-[#C5A059]">$4.99</span>
                  <span className="text-sm text-[#8B8580]" style={{ textDecoration: 'line-through' }}>$9.99</span>
                  <span className="px-2 py-0.5 text-[#C67B6F] text-xs font-bold" style={{ backgroundColor: 'rgba(198, 123, 111, 0.1)', borderRadius: '4px' }}>50% OFF</span>
                </div>
              </div>
            </div>
          </section>

          {/* What's Included */}
          <section className="card-paper p-6 mb-6">
            <h2 className="font-serif-ko text-[#2D3A35] mb-4">프리미엄에 포함된 내용</h2>
            <div className="space-y-3">
              {[
                { icon: '👨‍👩‍👧', text: '부모-자녀 궁합 분석' },
                { icon: '📈', text: '연령별 발달 가이드 (미취학/초등/사춘기)' },
                { icon: '🎯', text: '진로/적성 심층 분석' },
                { icon: '🔮', text: '대운/세운 운세 흐름 분석' },
                { icon: '📅', text: '월별 운세 리포트' },
                { icon: '📄', text: 'PDF 리포트 다운로드' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-[#6B5E52]">{item.text}</span>
                </div>
              ))}
            </div>
          </section>

          {/* PayPal Payment Section */}
          <section className="card-paper p-6 mb-6">
            <h2 className="font-serif-ko text-[#2D3A35] mb-4">결제 수단</h2>

            {isProcessing && (
              <div className="flex items-center justify-center py-6">
                <div className="relative w-12 h-12 mr-3">
                  <div className="absolute inset-0 border-4 border-[#EBE5DF]" style={{ borderRadius: '50%' }} />
                  <div className="absolute inset-0 border-4 border-[#C5A059] border-t-transparent animate-spin" style={{ borderRadius: '50%' }} />
                </div>
                <p className="text-[#8B8580]">결제를 처리하고 있습니다...</p>
              </div>
            )}

            {/* PayPal Buttons Container */}
            <div id="paypal-button-container" className={isProcessing ? 'hidden' : ''} />

            {!sdkReady && !isProcessing && (
              <div className="flex items-center justify-center py-6">
                <div className="relative w-8 h-8 mr-3">
                  <div className="absolute inset-0 border-[3px] border-[#EBE5DF]" style={{ borderRadius: '50%' }} />
                  <div className="absolute inset-0 border-[3px] border-[#C5A059] border-t-transparent animate-spin" style={{ borderRadius: '50%' }} />
                </div>
                <p className="text-sm text-[#8B8580]">결제 시스템을 불러오는 중...</p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3" style={{ backgroundColor: 'rgba(198, 123, 111, 0.08)', border: '1px solid rgba(198, 123, 111, 0.2)', borderRadius: '12px' }}>
                <p className="text-sm text-[#C67B6F]">{error}</p>
              </div>
            )}
          </section>

          {/* Terms Notice */}
          <section className="mb-6">
            <p className="text-xs text-[#8B8580] text-center leading-relaxed">
              결제를 진행하시면 <Link href="/terms" className="text-[#C5A059] hover:underline">이용약관</Link>,{' '}
              <Link href="/privacy" className="text-[#C5A059] hover:underline">개인정보처리방침</Link>,{' '}
              <Link href="/refund" className="text-[#C5A059] hover:underline">환불정책</Link>에 동의하게 됩니다.
              <br />
              결과 생성 시작 시 청약철회가 제한될 수 있습니다.
            </p>
          </section>

          {/* Security Notice */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#8B8580]">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>PayPal 안전 결제</span>
          </div>
        </main>
      </div>
    </>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF8F6' }}>
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-[#EBE5DF]" style={{ borderRadius: '50%' }} />
          <div className="absolute inset-0 border-4 border-[#C5A059] border-t-transparent animate-spin" style={{ borderRadius: '50%' }} />
        </div>
        <p className="text-[#8B8580]">로딩 중...</p>
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
