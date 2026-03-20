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
        <div className="text-center">
          {/* Icon */}
          <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center"
            style={{ borderRadius: '50%', backgroundColor: isCancelled ? '#FFF8E1' : 'rgba(198, 123, 111, 0.1)' }}>
            <span className="text-5xl">{isCancelled ? '🔙' : '😢'}</span>
          </div>

          {/* Title */}
          <h1 className="font-serif-ko text-2xl text-[#2D3A35] mb-2">
            {isCancelled ? '결제가 취소되었습니다' : '결제에 실패했습니다'}
          </h1>

          {/* Message */}
          <p className="text-[#8B8580] mb-8 max-w-sm mx-auto">
            {message}
          </p>

          {/* Error Details (for debugging) */}
          {!isCancelled && orderId && (
            <div className="p-4 mb-8 text-left max-w-sm mx-auto" style={{ backgroundColor: 'rgba(235, 229, 223, 0.4)', borderRadius: '12px' }}>
              <p className="text-xs text-[#8B8580] mb-2">오류 정보</p>
              <p className="text-sm text-[#6B5E52] font-mono break-all">
                주문번호: {orderId}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-4 max-w-sm mx-auto">
            <button
              onClick={() => router.push('/payment')}
              className="w-full py-4 btn-primary font-bold"
            >
              다시 시도하기
            </button>

            <Link
              href="/saju/results"
              className="w-full py-4 btn-secondary font-bold text-center"
            >
              무료 분석 결과로 돌아가기
            </Link>

            <Link href="/" className="text-sm text-[#8B8580] hover:text-[#C5A059]">
              홈으로 돌아가기
            </Link>
          </div>

          {/* Help */}
          <div className="mt-12 card-paper p-6">
            <h3 className="font-serif-ko text-[#2D3A35] mb-3">결제가 계속 실패하나요?</h3>
            <ul className="text-sm text-[#6B5E52] text-left space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-[#C5A059]">•</span>
                <span>PayPal 계정 잔액 또는 연결된 카드를 확인해보세요</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C5A059]">•</span>
                <span>다른 브라우저나 시크릿 모드를 사용해보세요</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C5A059]">•</span>
                <span>PayPal 계정에 로그인하여 결제 제한 여부를 확인해보세요</span>
              </li>
            </ul>
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(235, 229, 223, 0.6)' }}>
              <p className="text-sm text-[#8B8580]">
                그래도 문제가 해결되지 않으면{' '}
                <a href="mailto:support@harmonyon.kr" className="text-[#C5A059] hover:underline">
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

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentFailContent />
    </Suspense>
  )
}
