'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF8F6' }}>
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-[#EBE5DF]" style={{ borderRadius: '50%' }} />
            <div className="absolute inset-0 border-4 border-[#C5A059] border-t-transparent animate-spin" style={{ borderRadius: '50%' }} />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">💳</div>
          </div>
          <h2 className="font-serif-ko text-xl text-[#2D3A35] mb-2">결제 확인 중</h2>
          <p className="text-[#8B8580]">잠시만 기다려주세요...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#FAF8F6' }}>
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center" style={{ borderRadius: '50%', backgroundColor: 'rgba(198, 123, 111, 0.1)' }}>
            <span className="text-4xl">😢</span>
          </div>
          <h2 className="font-serif-ko text-xl text-[#2D3A35] mb-2">결제 확인 실패</h2>
          <p className="text-[#8B8580] mb-6">{error}</p>
          <p className="text-sm text-[#8B8580] mb-6">
            문제가 지속되면 support@harmonyon.kr로 문의해주세요.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/payment')}
              className="btn-primary px-6 py-3"
            >
              다시 시도하기
            </button>
            <Link href="/" className="text-sm text-[#8B8580] hover:text-[#C5A059]">
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  return (
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
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center" style={{ borderRadius: '50%', backgroundColor: 'rgba(90, 125, 107, 0.1)' }}>
            <svg className="w-12 h-12 text-[#5A7D6B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="font-serif-ko text-2xl text-[#2D3A35] mb-2">결제가 완료되었습니다!</h1>
          <p className="text-[#8B8580]">
            프리미엄 분석을 시작할 준비가 되었습니다.
          </p>
        </div>

        {/* Order Summary */}
        <section className="card-paper p-6 mb-8">
          <h2 className="font-serif-ko text-[#2D3A35] mb-4">주문 내역</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[#6B5E52]">상품명</span>
              <span className="font-medium text-[#2D3A35]">사주팔자 프리미엄 분석</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6B5E52]">결제 금액</span>
              <span className="font-bold text-[#C5A059]">$4.99</span>
            </div>
            {orderIdState && (
              <div className="flex justify-between items-center">
                <span className="text-[#6B5E52]">주문 번호</span>
                <span className="text-sm text-[#8B8580] font-mono">{orderIdState}</span>
              </div>
            )}
          </div>
        </section>

        {/* Next Steps */}
        <section className="p-6 text-white mb-8" style={{ background: 'linear-gradient(135deg, #2D3A35, #3D5A4E)', borderRadius: '16px' }}>
          <h2 className="font-serif-ko mb-4">다음 단계</h2>
          <p className="mb-4" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            이제 부모님 정보와 아이 정보를 입력하시면 심층 분석 결과를 받아보실 수 있습니다.
          </p>
          <div className="space-y-3">
            {[
              '부모님 생년월일 입력',
              '아이 생년월일 입력',
              'AI가 심층 분석 수행',
              '맞춤 리포트 제공'
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 flex items-center justify-center text-sm font-bold" style={{ borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                  {i + 1}
                </div>
                <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{step}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => {
              const sajuInput = sessionStorage.getItem('sajuInput')
              router.push(sajuInput ? '/saju/results' : '/saju/input')
            }}
            className="w-full py-4 font-bold text-lg text-[#2D3A35] hover:opacity-90 transition-all"
            style={{ borderRadius: '12px', backgroundColor: '#C5A059' }}
          >
            프리미엄 분석 시작하기
          </button>
          <Link href="/" className="text-center text-sm text-[#8B8580] hover:text-[#C5A059]">
            나중에 하기
          </Link>
        </div>

        {/* Support */}
        <div className="mt-10 text-center">
          <p className="text-sm text-[#8B8580]">
            문의사항이 있으시면{' '}
            <a href="mailto:support@harmonyon.kr" className="text-[#C5A059] hover:underline">
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
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF8F6' }}>
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-[#EBE5DF]" style={{ borderRadius: '50%' }} />
          <div className="absolute inset-0 border-4 border-[#C5A059] border-t-transparent animate-spin" style={{ borderRadius: '50%' }} />
        </div>
        <h2 className="font-serif-ko text-xl text-[#2D3A35] mb-2">로딩 중...</h2>
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
