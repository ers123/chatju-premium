'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { apiClient } from '@/lib/api'
import { useLanguage } from '@/app/lib/i18n/context'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ShareableResultCard from '@/components/saju/ShareableResultCard'

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'test'
const PRODUCT_AMOUNT = 4.99

// Types
interface FourPillar {
  천간: string
  지지: string
  천간오행: string
  지지오행: string
  십신?: string
}

interface SajuResult {
  fourPillars: {
    년주: FourPillar
    월주: FourPillar
    일주: FourPillar
    시주: FourPillar
  }
  dayMaster: string
  ohaengBalance: Record<string, number>
  interpretation?: string
  preview?: string
}

// Icons
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '1rem', height: '1rem' }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '1.25rem', height: '1.25rem' }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const StarIcon = ({ filled = true }: { filled?: boolean }) => (
  <svg viewBox="0 0 20 20" fill={filled ? "#B8922D" : "#E2DDD6"} style={{ width: '1rem', height: '1rem' }}>
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
)

// Element visual info (colors, emojis - language-independent)
const elementVisuals: Record<string, { emoji: string; color: string; bgColor: string }> = {
  '목': { emoji: '🌿', color: '#5A7A66', bgColor: '#E8F5E9' },
  '화': { emoji: '🔥', color: '#A85544', bgColor: '#FFEBEE' },
  '토': { emoji: '🏔️', color: '#B8922D', bgColor: '#FFF8E1' },
  '금': { emoji: '⚔️', color: '#6B7578', bgColor: '#F5F5F5' },
  '수': { emoji: '💧', color: '#556B7E', bgColor: '#E3F2FD' },
}

// Get dominant element from balance
const getDominantElement = (balance: Record<string, number>) => {
  let maxKey = '목'
  let maxValue = 0
  Object.entries(balance).forEach(([key, value]) => {
    if (value > maxValue) {
      maxValue = value
      maxKey = key
    }
  })
  return maxKey
}

// Get weak element from balance
const getWeakElement = (balance: Record<string, number>) => {
  let minKey = '목'
  let minValue = Infinity
  Object.entries(balance).forEach(([key, value]) => {
    if (value < minValue) {
      minValue = value
      minKey = key
    }
  })
  return minKey
}

// Element name translation map (backend returns Korean keys)
const elementNameMap: Record<string, Record<string, string>> = {
  ko: { '목': '목', '화': '화', '토': '토', '금': '금', '수': '수' },
  en: { '목': 'Wood', '화': 'Fire', '토': 'Earth', '금': 'Metal', '수': 'Water' },
  ja: { '목': '木', '화': '火', '토': '土', '금': '金', '수': '水' },
  zh: { '목': '木', '화': '火', '토': '土', '금': '金', '수': '水' },
  vi: { '목': 'Mộc', '화': 'Hỏa', '토': 'Thổ', '금': 'Kim', '수': 'Thủy' },
  id: { '목': 'Kayu', '화': 'Api', '토': 'Tanah', '금': 'Logam', '수': 'Air' },
  es: { '목': 'Madera', '화': 'Fuego', '토': 'Tierra', '금': 'Metal', '수': 'Agua' },
  pt: { '목': 'Madeira', '화': 'Fogo', '토': 'Terra', '금': 'Metal', '수': 'Água' },
  fr: { '목': 'Bois', '화': 'Feu', '토': 'Terre', '금': 'Métal', '수': 'Eau' },
  th: { '목': 'ไม้', '화': 'ไฟ', '토': 'ดิน', '금': 'ทอง', '수': 'น้ำ' },
}

function translateElement(korean: string, lang: string): string {
  return elementNameMap[lang]?.[korean] || korean
}

// Heavenly Stems (천간) translation map
const stemNameMap: Record<string, Record<string, string>> = {
  ko: { '갑': '갑', '을': '을', '병': '병', '정': '정', '무': '무', '기': '기', '경': '경', '신': '신', '임': '임', '계': '계' },
  ja: { '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊', '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸' },
  zh: { '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊', '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸' },
  en: { '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊', '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸' },
  fr: { '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊', '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸' },
  es: { '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊', '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸' },
  pt: { '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊', '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸' },
  id: { '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊', '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸' },
  th: { '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊', '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸' },
  vi: { '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊', '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸' },
}

// Earthly Branches (지지) translation map
const branchNameMap: Record<string, Record<string, string>> = {
  ko: { '자': '자', '축': '축', '인': '인', '묘': '묘', '진': '진', '사': '사', '오': '오', '미': '미', '신': '신', '유': '유', '술': '술', '해': '해' },
  ja: { '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳', '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥' },
  zh: { '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳', '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥' },
  en: { '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳', '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥' },
  fr: { '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳', '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥' },
  es: { '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳', '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥' },
  pt: { '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳', '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥' },
  id: { '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳', '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥' },
  th: { '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳', '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥' },
  vi: { '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳', '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥' },
}

function translateStem(korean: string, lang: string): string {
  return stemNameMap[lang]?.[korean] || korean
}

function translateBranch(korean: string, lang: string): string {
  return branchNameMap[lang]?.[korean] || korean
}

// Four Pillars Display Component
function FourPillarsDisplay({ pillars, t, lang }: { pillars: SajuResult['fourPillars']; t: { pillarYear: string; pillarMonth: string; pillarDay: string; pillarHour: string }; lang: string }) {
  const pillarOrder = ['시주', '일주', '월주', '년주'] as const
  const pillarLabels = { 년주: t.pillarYear, 월주: t.pillarMonth, 일주: t.pillarDay, 시주: t.pillarHour }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
      {pillarOrder.map((key) => {
        const pillar = pillars[key]
        return (
          <div key={key} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', marginBottom: '0.5rem', color: '#8B8580' }}>{pillarLabels[key]}</div>
            <div style={{ background: '#1A3D2E', borderRadius: '0.75rem', overflow: 'hidden' }}>
              <div style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#FFFFFF' }}>{translateStem(pillar.천간, lang)}</div>
                <div style={{ fontSize: '0.75rem', color: '#B8922D', marginTop: '0.25rem' }}>{translateElement(pillar.천간오행, lang)}</div>
              </div>
              <div style={{ padding: '0.75rem 0' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#FFFFFF' }}>{translateBranch(pillar.지지, lang)}</div>
                <div style={{ fontSize: '0.75rem', color: '#B8922D', marginTop: '0.25rem' }}>{translateElement(pillar.지지오행, lang)}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Ohaeng Balance Chart
function OhaengBalanceChart({ balance, ohaengElements, elementCount }: { balance: Record<string, number>; ohaengElements: { key: string; name: string }[]; elementCount: string }) {
  const maxValue = Math.max(...Object.values(balance), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {ohaengElements.map(({ key, name }) => {
        const value = balance[key] || 0
        const percentage = (value / maxValue) * 100
        const visual = elementVisuals[key]

        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', backgroundColor: `${visual.color}20` }}>
              {visual.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                <span style={{ color: '#6B5E52' }}>{name}</span>
                <span style={{ fontWeight: 700, color: visual.color }}>{value}{elementCount}</span>
              </div>
              <div style={{ height: '0.5rem', borderRadius: '9999px', overflow: 'hidden', backgroundColor: '#EBE5DF' }}>
                <div
                  style={{ height: '100%', borderRadius: '9999px', transition: 'all 1s', width: `${percentage}%`, backgroundColor: visual.color }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}


export default function ResultsPage() {
  const router = useRouter()
  const { t, lang } = useLanguage()
  useEffect(() => { document.title = t.sajuResults.pageTitle }, [t])
  const sr = t.sajuResults
  const [result, setResult] = useState<SajuResult | null>(null)
  const [inputData, setInputData] = useState<{ name: string; birthDate: string; birthTime: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [premiumReport, setPremiumReport] = useState<Record<string, string> | null>(null)
  const [corrections, setCorrections] = useState<{ applied: boolean; note: string; adjustedTime?: string | null; isSouthernHemisphere?: boolean } | null>(null)
  const [premiumLoading, setPremiumLoading] = useState(false)
  const [premiumError, setPremiumError] = useState('')
  const [readingId, setReadingId] = useState<string | null>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  // Inline payment state
  const [showPayment, setShowPayment] = useState(false)
  const [paymentEmail, setPaymentEmail] = useState('')
  const paymentEmailRef = useRef('')
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [paypalSdkReady, setPaypalSdkReady] = useState(false)
  const paypalRendered = useRef(false)

  // Promo code state
  const [promoCode, setPromoCode] = useState('')
  const [promoValidating, setPromoValidating] = useState(false)
  const [promoResult, setPromoResult] = useState<{ valid: boolean; promoCode?: { id: string; code: string } } | null>(null)

  // Track if email is valid (controls PayPal container visibility in JSX)
  const emailValid = paymentEmail.trim() !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentEmail)

  // Reset PayPal rendered flag when conditions change that destroy the container div
  useEffect(() => {
    if (!showPayment || !emailValid) {
      paypalRendered.current = false
    }
  }, [showPayment, emailValid])

  // Render PayPal buttons when SDK is ready, panel is open, and email is valid (container div exists)
  useEffect(() => {
    if (!paypalSdkReady || !showPayment || !emailValid || paypalRendered.current) return
    if (typeof window === 'undefined' || !(window as any).paypal) return
    // Small delay to ensure DOM is rendered after email validation shows the container
    const timer = setTimeout(() => {
      const container = document.getElementById('inline-paypal-container')
      if (!container || paypalRendered.current) return
      paypalRendered.current = true

    try {
      ;(window as any).paypal.Buttons({
        createOrder: async () => {
          if (!paymentEmailRef.current.trim()) { setPaymentError('Please enter your email first'); throw new Error('Email required') }
          const response = await apiClient.createPayPalPayment({ amount: PRODUCT_AMOUNT, description: 'Premium Saju Reading', email: paymentEmailRef.current })
          if (response.success && response.paypalOrderId) {
            sessionStorage.setItem('pending_order', JSON.stringify({ orderId: response.orderId, paypalOrderId: response.paypalOrderId }))
            return response.paypalOrderId
          }
          throw new Error('Order creation failed')
        },
        onApprove: async (data: { orderID: string }) => {
          setPaymentProcessing(true)
          setPaymentError('')
          try {
            const captureResult = await apiClient.capturePayPalPayment(data.orderID)
            if (captureResult && (captureResult as any).success && (captureResult as any).payment) {
              const payment = (captureResult as any).payment
              sessionStorage.setItem('completed_payment', JSON.stringify({ orderId: payment.order_id, paymentId: payment.id, completedAt: new Date().toISOString(), email: paymentEmail }))
              sessionStorage.removeItem('pending_order')
              setShowPayment(false)
              // Trigger premium report fetch
              window.location.reload()
            } else {
              setPaymentError('Payment capture failed. Please try again.')
            }
          } catch { setPaymentError('Payment processing error. Please try again.') }
          finally { setPaymentProcessing(false) }
        },
        onError: () => setPaymentError('Payment error. Please try again.'),
        onCancel: () => {},
      }).render('#inline-paypal-container')
    } catch { setPaymentError('Failed to initialize payment.') }
    }, 100) // 100ms delay for DOM render
    return () => clearTimeout(timer)
  }, [paypalSdkReady, showPayment, emailValid])

  // Handle promo code submit inline
  // Poll for reading completion (used when API Gateway times out but Lambda continues)
  const pollForReading = async (email: string, maxAttempts = 12) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || ''
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 5000)) // 5s between polls
      try {
        const res = await fetch(`${API_URL}/saju/reading-check?email=${encodeURIComponent(email)}`)
        const data = await res.json()
        if (data.status === 'complete' && data.reading) {
          return data.reading
        }
      } catch { /* keep polling */ }
    }
    return null
  }

  const handleInlinePromo = async () => {
    if (!promoCode.trim() || !paymentEmail.trim()) return
    setPromoValidating(true)
    setPaymentError('')
    try {
      const validation = await apiClient.validatePromoCode(promoCode)
      if (!validation.valid) {
        setPaymentError(validation.error || 'Invalid promo code')
        setPromoValidating(false)
        return
      }
      setPromoResult(validation)
      setPaymentProcessing(true)
      const stored = sessionStorage.getItem('sajuInput')
      if (!stored) return
      const input = JSON.parse(stored)

      let reading = null
      try {
        // Try the direct call — may timeout at 30s via API Gateway
        reading = await apiClient.calculateWithPromo({
          promoCode,
          email: paymentEmail,
          birthDate: input.birthDate,
          birthTime: input.birthTime,
          gender: input.gender,
          isLunar: input.calendar === 'lunar',
          language: lang,
          subjectName: input.name,
          birthPlace: input.birthPlace,
          parentBirthDate: input.parentBirthDate,
          parentBirthTime: input.parentBirthTime,
          parentRole: input.parentRole,
          twinOrder: input.twinOrder,
          twinSiblingName: input.twinSiblingName,
        })
      } catch {
        // API Gateway likely timed out at 30s, but Lambda is still running.
        // Poll for the result — Lambda will save to DB when done.
        reading = await pollForReading(paymentEmail)
        if (!reading) {
          // Polling failed — try one more extended poll cycle on reload
          sessionStorage.setItem('pending_promo_email', paymentEmail)
          sessionStorage.setItem('completed_payment', JSON.stringify({ orderId: 'promo', completedAt: new Date().toISOString(), email: paymentEmail }))
          setPaymentError('Report is being generated. This page will refresh automatically...')
          setPaymentProcessing(false)
          setPromoValidating(false)
          setTimeout(() => window.location.reload(), 10000)
          return
        }
      }

      // Store and reload to show premium
      sessionStorage.setItem('promo_reading', JSON.stringify(reading))
      sessionStorage.setItem('completed_payment', JSON.stringify({ orderId: 'promo', completedAt: new Date().toISOString(), email: paymentEmail }))
      setShowPayment(false)
      window.location.reload()
    } catch (err: any) {
      setPaymentError(err.error || err.message || 'Error processing promo code')
    } finally {
      setPromoValidating(false)
      setPaymentProcessing(false)
    }
  }

  // Check for completed payment and fetch premium report
  useEffect(() => {
    if (!result || !inputData) return

    const completedRaw = sessionStorage.getItem('completed_payment')
    if (!completedRaw) return

    const fetchPremium = async () => {
      try {
        const completed = JSON.parse(completedRaw)
        if (!completed.orderId) return

        setPremiumLoading(true)

        // Check for promo reading (already fetched, stored in session)
        const promoReadingRaw = sessionStorage.getItem('promo_reading')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let r: any = null

        if (promoReadingRaw) {
          r = JSON.parse(promoReadingRaw)
          sessionStorage.removeItem('promo_reading') // One-time use
        } else if (completed.orderId === 'promo') {
          // Promo flow after reload — poll for the reading by email
          const promoEmail = sessionStorage.getItem('pending_promo_email') || completed.email
          if (promoEmail) {
            r = await pollForReading(promoEmail, 18) // 18 attempts = 90s
            sessionStorage.removeItem('pending_promo_email')
            if (!r) {
              setPremiumError('Report generation is still in progress. Please refresh the page in a moment.')
              return
            }
          } else {
            setPremiumError('Could not find your report. Please try again.')
            return
          }
        } else {
          const stored = sessionStorage.getItem('sajuInput')
          if (!stored) return
          const input = JSON.parse(stored)

          // Resolve language with localStorage fallback (same as preview)
          let resolvedLang = lang
          if (resolvedLang === 'ko') {
            const savedLang = localStorage.getItem('somyung-lang')
            if (savedLang && savedLang !== 'ko') {
              resolvedLang = savedLang as typeof lang
            }
          }

          const reading = await apiClient.getFullReading(completed.orderId, {
            birthDate: input.birthDate,
            birthTime: input.birthTime,
            gender: input.gender,
            isLunar: input.calendar === 'lunar',
            language: resolvedLang,
            // Location for solar time correction
            birthPlace: input.birthPlace,
            // Twin info
            twinOrder: input.twinOrder,
            twinSiblingName: input.twinSiblingName,
            // Parent data
            parentBirthDate: input.parentBirthDate,
            parentBirthTime: input.parentBirthTime,
            parentRole: input.parentRole,
            parentGender: input.parentGender,
            // Email for PDF delivery
            deliveryEmail: completed.email,
          })
          r = reading
        }

        // Store reading ID for PDF download (API returns readingId, DB row has id)
        const rid = r.readingId || r.id
        if (rid) setReadingId(rid)

        // Backend returns aiInterpretation: { fullText, sections, metadata }
        if (r.aiInterpretation?.fullText) {
          setPremiumReport({ fullText: r.aiInterpretation.fullText, ...(r.aiInterpretation.sections || {}) })
        } else if (r.premiumSections) {
          setPremiumReport(r.premiumSections)
        } else if (r.interpretation) {
          setPremiumReport({ fullText: r.interpretation })
        }
      } catch (err: unknown) {
        console.error('Premium report error:', err)
        setPremiumError(sr.errorFetch)
      } finally {
        setPremiumLoading(false)
      }
    }

    fetchPremium()
  }, [result, inputData])

  const handlePdfExport = useCallback(async () => {
    if (!readingId) return
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || ''
      const response = await fetch(`${API_URL}/saju/reading/${readingId}/pdf`)
      if (!response.ok) throw new Error('PDF download failed')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `SoMyung_${inputData?.name || 'report'}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF export error:', err)
      alert(sr.pdfError)
    }
  }, [readingId, inputData, sr.pdfError])

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const stored = sessionStorage.getItem('sajuInput')
        if (!stored) {
          router.push('/saju/input')
          return
        }

        const input = JSON.parse(stored)
        setInputData(input)

        // Resolve language: prefer context lang, but if still default 'ko',
        // check localStorage directly (context useEffect may not have run yet)
        let resolvedLang = lang
        if (resolvedLang === 'ko') {
          const savedLang = localStorage.getItem('somyung-lang')
          if (savedLang && savedLang !== 'ko') {
            resolvedLang = savedLang as typeof lang
          }
        }

        // Send both child and parent data for relationship analysis
        const previewData = await apiClient.getPreview({
          birthDate: input.birthDate,
          birthTime: input.birthTime,
          gender: input.gender,
          isLunar: input.calendar === 'lunar',
          language: resolvedLang,
          // Location for solar time correction
          birthPlace: input.birthPlace,
          // Twin info
          twinOrder: input.twinOrder,
          twinSiblingName: input.twinSiblingName,
          // Parent data for relationship-focused analysis
          parentBirthDate: input.parentBirthDate,
          parentBirthTime: input.parentBirthTime,
          parentRole: input.parentRole,
        })

        const manseryeok = previewData.manseryeok
        const transformedResult: SajuResult = {
          fourPillars: {
            년주: {
              천간: manseryeok.pillars.year.heavenlyStem,
              지지: manseryeok.pillars.year.earthlyBranch,
              천간오행: manseryeok.pillars.year.element.split(' + ')[0] || '',
              지지오행: manseryeok.pillars.year.element.split(' + ')[1] || '',
            },
            월주: {
              천간: manseryeok.pillars.month.heavenlyStem,
              지지: manseryeok.pillars.month.earthlyBranch,
              천간오행: manseryeok.pillars.month.element.split(' + ')[0] || '',
              지지오행: manseryeok.pillars.month.element.split(' + ')[1] || '',
            },
            일주: {
              천간: manseryeok.pillars.day.heavenlyStem,
              지지: manseryeok.pillars.day.earthlyBranch,
              천간오행: manseryeok.pillars.day.element.split(' + ')[0] || '',
              지지오행: manseryeok.pillars.day.element.split(' + ')[1] || '',
            },
            시주: {
              천간: manseryeok.pillars.hour.heavenlyStem,
              지지: manseryeok.pillars.hour.earthlyBranch,
              천간오행: manseryeok.pillars.hour.element.split(' + ')[0] || '',
              지지오행: manseryeok.pillars.hour.element.split(' + ')[1] || '',
            },
          },
          dayMaster: manseryeok.dayMaster,
          ohaengBalance: {
            목: manseryeok.elements.wood,
            화: manseryeok.elements.fire,
            토: manseryeok.elements.earth,
            금: manseryeok.elements.metal,
            수: manseryeok.elements.water,
          },
          preview: previewData.aiPreview?.shortText || previewData.message,
        }

        // Save solar time corrections if available
        if (manseryeok.corrections) {
          setCorrections(manseryeok.corrections)
        }

        setResult(transformedResult)
      } catch (err) {
        console.error('Error fetching results:', err)
        setError(sr.errorFetch)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [router, sr.errorFetch])

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#FDFCFA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '5rem', height: '5rem', margin: '0 auto 1.5rem' }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              border: '4px solid #F3F4F6',
              borderRadius: '50%'
            }} />
            <div style={{
              position: 'absolute',
              inset: 0,
              border: '4px solid #B8922D',
              borderRadius: '50%',
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>✨</div>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1A3D2E', marginBottom: '0.5rem' }}>
            {sr.loading}
          </h2>
          <p style={{ color: '#6B7280' }}>{sr.loadingDesc}</p>
        </div>
        <style jsx global>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#FDFCFA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '24rem',
          background: '#FFFFFF',
          padding: '3rem 2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>😢</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1A3D2E', marginBottom: '0.75rem' }}>
            {sr.errorTitle}
          </h2>
          <p style={{ color: '#6B7280', marginBottom: '0.5rem', lineHeight: 1.6 }}>
            {error || sr.errorDefault}
          </p>
          <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '2rem' }}>
            {sr.errorNetwork}
          </p>
          <button
            onClick={() => router.push('/saju/input')}
            style={{
              padding: '1rem 2rem',
              background: '#1A3D2E',
              color: '#FFFFFF',
              borderRadius: '10px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '1rem'
            }}
          >
            {sr.errorRetry}
          </button>
        </div>
      </div>
    )
  }

  const dominantElement = getDominantElement(result.ohaengBalance)
  const weakElement = getWeakElement(result.ohaengBalance)
  const dominantVisual = elementVisuals[dominantElement]
  const weakVisual = elementVisuals[weakElement]
  const dominantElInfo = sr.elements[dominantElement as keyof typeof sr.elements]
  const weakElInfo = sr.elements[weakElement as keyof typeof sr.elements]

  const getSupplementText = (el: string) => {
    const map: Record<string, string> = {
      '목': sr.supplementWood,
      '화': sr.supplementFire,
      '토': sr.supplementEarth,
      '금': sr.supplementMetal,
      '수': sr.supplementWater,
    }
    return map[el] || ''
  }

  const getTimeText = (el: string) => {
    const map: Record<string, string> = {
      '목': sr.timeWood,
      '화': sr.timeFire,
      '토': sr.timeEarth,
      '금': sr.timeMetal,
      '수': sr.timeWater,
    }
    return map[el] || ''
  }

  const getEnvText = (el: string) => {
    const map: Record<string, string> = {
      '목': sr.envWood,
      '화': sr.envFire,
      '토': sr.envEarth,
      '금': sr.envMetal,
      '수': sr.envWater,
    }
    return map[el] || ''
  }

  const getMotiveText = (el: string) => {
    const map: Record<string, string> = {
      '목': sr.motiveWood,
      '화': sr.motiveFire,
      '토': sr.motiveEarth,
      '금': sr.motiveMetal,
      '수': sr.motiveWater,
    }
    return map[el] || ''
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FDFCFA' }}>
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(235,229,223,0.6)' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" className="logo-link-dark" style={{ textDecoration: 'none', color: '#1A3D2E', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: '#1A3D2E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.1rem', lineHeight: 1, color: '#FFFFFF' }}>☯</span>
            </div>
            <span style={{ fontFamily: 'serif', fontSize: '1.25rem', color: '#1A3D2E' }}>SoMyung</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {readingId && (
              <button
                onClick={handlePdfExport}
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: '10px', border: '1px solid #EBE5DF', background: 'none', cursor: 'pointer' }}
              >
                {sr.savePdf}
              </button>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '48rem', margin: '0 auto', padding: '2rem 1.5rem' }} ref={reportRef}>
        {/* Hero Result Card */}
        <section style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(235,229,223,0.6)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 4px 20px -4px rgba(45,58,53,0.06)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: '6px', background: 'rgba(184,146,45,0.1)', color: '#B8922D', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem' }}>
              ✨ {sr.freeBadge}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'serif', color: '#1A3D2E', marginBottom: '0.5rem' }}>
              {inputData?.name}{sr.analysisTitle}
            </h1>
            <p style={{ color: '#8B8580' }}>
              {inputData?.birthDate} {inputData?.birthTime}
            </p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: 500, color: '#8B8580' }}>{sr.analysisSubtitle}</p>
          </div>

          {/* Main Temperament */}
          <div style={{ borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', backgroundColor: dominantVisual.bgColor }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ width: '4rem', height: '4rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.875rem', background: '#FFFFFF', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                {dominantVisual.emoji}
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#8B8580' }}>{sr.coreTemperament}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: dominantVisual.color }}>
                  {dominantElInfo.name}{sr.temperamentSuffix}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              {dominantElInfo.traits.map((trait, i) => (
                <span key={i} style={{ padding: '0.25rem 0.75rem', borderRadius: '6px', background: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500, color: dominantVisual.color }}>
                  {trait}
                </span>
              ))}
            </div>
            <p style={{ lineHeight: 1.7, color: '#6B5E52' }}>
              {inputData?.name}{sr.temperamentDesc1}<strong style={{ color: dominantVisual.color }}>{dominantElInfo.name}</strong>{sr.temperamentDesc2}{dominantElInfo.traits.slice(0, 2).join(', ')}{sr.temperamentDesc3}
            </p>
          </div>

          {/* AI Interpretation */}
          {result.preview && (
            <div style={{ borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', background: 'linear-gradient(to bottom right, #F8F6F3, #FFF8E1)', border: '1px solid rgba(184,146,45,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: 'rgba(184,146,45,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem' }}>🔮</div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1A3D2E' }}>{sr.aiInterpretation}</h3>
              </div>
              <div style={{ lineHeight: 1.7, whiteSpace: 'pre-line', fontSize: '0.95rem', color: '#6B5E52' }}>
                {result.preview}
              </div>
            </div>
          )}

          {/* Four Pillars */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'serif', color: '#1A3D2E', marginBottom: '1rem' }}>{sr.fourPillars}</h3>
            <FourPillarsDisplay pillars={result.fourPillars} t={sr} lang={lang} />

            {/* Solar Time Correction Note */}
            {corrections?.applied && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid #E2DDD6', background: '#FAF8F5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <span style={{ fontSize: '1rem' }}>🕐</span>
                  <span style={{ color: '#6B5E52' }}>
                    {sr.solarTimeLabel || 'Solar time correction'} {(corrections as any).solarTimeCorrection > 0 ? '+' : ''}{(corrections as any).solarTimeCorrection || ''}{lang === 'ko' ? '분' : 'min'}
                  </span>
                </div>
                {corrections.adjustedTime && (
                  <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem', marginLeft: '1.75rem' }}>
                    {sr.adjustedBirthTime}: {corrections.adjustedTime}
                    {corrections.isSouthernHemisphere && ` (${sr.southernHemisphere})`}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ohaeng Balance */}
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'serif', color: '#1A3D2E', marginBottom: '1rem' }}>{sr.ohaengBalance}</h3>
            <OhaengBalanceChart balance={result.ohaengBalance} ohaengElements={sr.ohaengElements} elementCount={sr.elementCount} />
          </div>
        </section>


        {/* FREE: Learning Style */}
        <section style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(235,229,223,0.6)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 4px 20px -4px rgba(45,58,53,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>📚</div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#5A7A66', fontWeight: 700 }}>{sr.learningFree}</div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'serif', color: '#1A3D2E' }}>{sr.learningTitle}</h2>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Recommended Learning Style */}
            <div style={{ padding: '1.25rem', borderRadius: '12px', backgroundColor: dominantVisual.bgColor }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.125rem' }}>{dominantVisual.emoji}</span>
                <h4 style={{ fontWeight: 700, color: dominantVisual.color }}>
                  {dominantElInfo.name}{sr.learningMethod}
                </h4>
              </div>
              <p style={{ lineHeight: 1.7, marginBottom: '1rem', color: '#6B5E52' }}>{dominantElInfo.learningStyle}</p>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.5)', borderRadius: '0.75rem' }}>
                <span style={{ fontSize: '1.125rem' }}>⚠️</span>
                <p style={{ fontSize: '0.875rem', color: '#6B5E52' }}>{dominantElInfo.caution}</p>
              </div>
            </div>

            {/* Weak Element Supplement */}
            <div style={{ padding: '1.25rem', borderRadius: '12px', backgroundColor: '#F8F6F3' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.125rem' }}>{weakVisual.emoji}</span>
                <h4 style={{ fontWeight: 700, color: '#6B5E52' }}>
                  {weakElInfo.name}{sr.supplementTitle}
                </h4>
              </div>
              <p style={{ lineHeight: 1.7, color: '#6B5E52' }}>
                {inputData?.name}{sr.supplementDesc1}<strong>{weakElInfo.name}</strong>{sr.supplementDesc2}
                {getSupplementText(weakElement)}
              </p>
            </div>

            {/* Quick Tips */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: '0.75rem', background: '#F8F6F3', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🕐</div>
                <div style={{ fontWeight: 700, color: '#1A3D2E', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{sr.optimalTime}</div>
                <div style={{ fontSize: '0.875rem', color: '#6B5E52' }}>
                  {getTimeText(dominantElement)}
                </div>
              </div>
              <div style={{ padding: '1rem', borderRadius: '0.75rem', background: '#F8F6F3', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📍</div>
                <div style={{ fontWeight: 700, color: '#1A3D2E', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{sr.recommendedEnv}</div>
                <div style={{ fontSize: '0.875rem', color: '#6B5E52' }}>
                  {getEnvText(dominantElement)}
                </div>
              </div>
              <div style={{ padding: '1rem', borderRadius: '0.75rem', background: '#F8F6F3', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎯</div>
                <div style={{ fontWeight: 700, color: '#1A3D2E', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{sr.motivation}</div>
                <div style={{ fontSize: '0.875rem', color: '#6B5E52' }}>
                  {getMotiveText(dominantElement)}
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* PREMIUM: Report or Locked CTA */}
        {premiumReport ? (
          <>
            {/* Premium Report Header */}
            <section style={{ background: 'linear-gradient(to bottom right, #1A3D2E, #2D4A3E)', borderRadius: '12px', padding: '1.5rem', color: '#FFFFFF', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '10rem', height: '10rem', background: 'rgba(184,146,45,0.1)', borderRadius: '50%', filter: 'blur(48px)' }} />
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 1rem', borderRadius: '6px', background: 'rgba(184,146,45,0.2)', color: '#B8922D', fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>
                  <CheckIcon /> {sr.premiumComplete}
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'serif' }}>{sr.premiumTitle}</h2>
              </div>
            </section>

            {/* Premium Report — rendered as markdown */}
            <section style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(235,229,223,0.6)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 4px 20px -4px rgba(45,58,53,0.06)' }}>
              <div style={{ color: '#4B4035', maxWidth: 'none' }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({ children }) => (
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'serif', color: '#1A3D2E', marginTop: '2.5rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #EBE5DF' }}>
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1A3D2E', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{children}</h3>
                    ),
                    p: ({ children }) => (
                      <p style={{ marginBottom: '1rem', lineHeight: 1.7, color: '#4B4035' }}>{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong style={{ fontWeight: 600, color: '#1A3D2E' }}>{children}</strong>
                    ),
                    ul: ({ children }) => (
                      <ul style={{ marginBottom: '1rem', marginLeft: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol style={{ marginBottom: '1rem', marginLeft: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyleType: 'decimal', listStylePosition: 'inside' }}>{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li style={{ lineHeight: 1.7, color: '#4B4035' }}>{children}</li>
                    ),
                    hr: () => (
                      <hr style={{ margin: '2rem 0', borderColor: '#EBE5DF' }} />
                    ),
                    table: ({ children }) => (
                      <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                        <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse', borderColor: '#EBE5DF' }}>{children}</table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#1A3D2E', borderBottom: '2px solid #EBE5DF', backgroundColor: '#FAF8F5' }}>{children}</th>
                    ),
                    td: ({ children }) => (
                      <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #F3F0ED' }}>{children}</td>
                    ),
                  }}
                >
                  {premiumReport.fullText || Object.entries(premiumReport)
                    .filter(([key]) => key !== 'metadata')
                    .map(([, value]) => value)
                    .join('\n\n')}
                </ReactMarkdown>
              </div>
            </section>
          </>
        ) : premiumLoading ? (
          <section style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(235,229,223,0.6)', borderRadius: '12px', padding: '2rem 1.5rem', marginBottom: '2rem', boxShadow: '0 4px 20px -4px rgba(45,58,53,0.06)', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '4rem', height: '4rem', margin: '0 auto 1.25rem' }}>
              <div style={{ position: 'absolute', inset: 0, border: '4px solid #EBE5DF', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', inset: 0, border: '4px solid #B8922D', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1A3D2E', marginBottom: '0.75rem' }}>{sr.premiumGenerating}</h3>
            <p style={{ color: '#6B5E52', fontSize: '1rem', lineHeight: 1.6, marginBottom: '1rem' }}>{sr.premiumGeneratingDesc}</p>
            <div style={{ background: '#F8F6F3', borderRadius: '10px', padding: '1rem', border: '1px solid #EBE5DF' }}>
              <p style={{ color: '#C5A059', fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>✉ {(() => { try { const c = sessionStorage.getItem('completed_payment'); return c ? JSON.parse(c).email : '' } catch { return '' } })()}</p>
              <p style={{ color: '#6B5E52', fontSize: '0.9375rem' }}>
                {lang === 'ko'
                  ? '리포트는 위 이메일로도 전송됩니다. 이 페이지를 닫아도 괜찮습니다.'
                  : lang === 'ja'
                  ? 'レポートは上記のメールにも送信されます。このページを閉じても大丈夫です。'
                  : 'Your report will also be sent to this email. Feel free to close this page.'}
              </p>
            </div>
          </section>
        ) : premiumError ? (
          <section style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(235,229,223,0.6)', borderRadius: '12px', padding: '2rem 1.5rem', marginBottom: '2rem', boxShadow: '0 4px 20px -4px rgba(45,58,53,0.06)', textAlign: 'center' }}>
            <p style={{ color: '#C67B6F', fontSize: '1rem', marginBottom: '1rem' }}>{premiumError}</p>
            <div style={{ background: '#F8F6F3', borderRadius: '10px', padding: '1rem', border: '1px solid #EBE5DF' }}>
              <p style={{ color: '#6B5E52', fontSize: '0.9375rem' }}>
                {lang === 'ko'
                  ? '리포트는 이메일로도 전송됩니다. 잠시 후 새로고침하시거나 이메일을 확인해주세요.'
                  : lang === 'ja'
                  ? 'レポートはメールでも送信されます。しばらくしてからページを更新するか、メールをご確認ください。'
                  : 'Your report will also be delivered by email. Please refresh shortly or check your inbox.'}
              </p>
            </div>
          </section>
        ) : (
          <section style={{ background: 'linear-gradient(to bottom right, #1A3D2E, #2D4A3E)', borderRadius: '12px', padding: '1.5rem', color: '#FFFFFF', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '10rem', height: '10rem', background: 'rgba(184,146,45,0.1)', borderRadius: '50%', filter: 'blur(48px)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <LockIcon />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#B8922D' }}>{sr.premiumContent}</span>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'serif', marginBottom: '1.5rem' }}>{sr.premiumTitle}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {sr.premiumItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '1.5rem' }}>{item.icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#FFFFFF' }}>{item.title}</div>
                      <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              {!showPayment ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button
                    onClick={() => setShowPayment(true)}
                    style={{ flex: 1, padding: '1rem', borderRadius: '10px', fontWeight: 700, color: '#2D3A35', backgroundColor: '#C5A059', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                  >
                    {sr.premiumStartCta} — {t.pricing.premium.price}
                  </button>
                </div>
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1.25rem', marginTop: '0.5rem' }}>
                  {/* Step 1: Email */}
                  <label style={{ display: 'block', fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                    {t.payment.emailLabel} <span style={{ color: '#C5A059' }}>*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={paymentEmail}
                    onChange={(e) => { setPaymentEmail(e.target.value); paymentEmailRef.current = e.target.value }}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', fontSize: '0.875rem', boxSizing: 'border-box' as const, marginBottom: '0.75rem' }}
                  />

                  {/* Step 2: Payment options — only show when email is entered */}
                  {paymentEmail.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentEmail) ? (
                    <>
                      {/* Promo code */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <input
                          type="text"
                          placeholder={t.payment.promoCodePlaceholder || 'Promo code'}
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          style={{ flex: 1, padding: '0.625rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', fontSize: '0.8125rem' }}
                        />
                        <button
                          onClick={handleInlinePromo}
                          disabled={!promoCode.trim() || promoValidating}
                          style={{ padding: '0.625rem 1rem', borderRadius: '8px', background: '#C5A059', color: '#2D3A35', border: 'none', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', opacity: (!promoCode.trim() || promoValidating) ? 0.5 : 1 }}
                        >
                          {promoValidating ? '...' : (t.payment.promoApply || 'Apply')}
                        </button>
                      </div>

                      {/* Divider */}
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: '0.75rem' }}>
                        {(t.payment as any).orPayWith || 'Or pay with'}
                      </div>

                      {/* PayPal buttons */}
                      <div id="inline-paypal-container" />
                      <Script
                        src={`https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&components=buttons,googlepay`}
                        onReady={() => setPaypalSdkReady(true)}
                      />
                    </>
                  ) : (
                    <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '1rem 0' }}>
                      Enter your email above to see payment options
                    </p>
                  )}

                  {paymentProcessing && (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'rgba(197,160,89,0.1)', borderRadius: '12px', marginTop: '1rem' }}>
                      <div style={{ display: 'inline-block', width: '2.5rem', height: '2.5rem', border: '4px solid #C5A059', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                      <p style={{ color: '#FFFFFF', fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        {sr.premiumGeneratingDesc || 'Generating your premium report...'}
                      </p>
                      <p style={{ color: '#C5A059', fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                        ✉ {paymentEmail}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                        {lang === 'ko'
                          ? '리포트가 준비되면 위 이메일로도 전송됩니다.\n이 페이지를 닫아도 괜찮습니다.'
                          : lang === 'ja'
                          ? 'レポートは上記のメールにも送信されます。\nこのページを閉じても大丈夫です。'
                          : 'Your report will also be sent to the email above.\nFeel free to close this page.'}
                      </p>
                    </div>
                  )}

                  {paymentError && (
                    <div style={{ textAlign: 'center', padding: '1.5rem 1rem', background: 'rgba(197,160,89,0.08)', borderRadius: '12px', marginTop: '1rem' }}>
                      <p style={{ color: '#C5A059', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        ✉ {paymentEmail}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                        {paymentError}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                        {lang === 'ko'
                          ? '리포트는 이메일로도 전송됩니다. 창을 닫아도 괜찮습니다.'
                          : lang === 'ja'
                          ? 'レポートはメールでも送信されます。ページを閉じても大丈夫です。'
                          : 'Your report will also be delivered by email. You can safely close this page.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}


        {/* Share Card + Sibling Prompt */}
        <section style={{ paddingBottom: '3rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Visual share card */}
            {result && inputData && (() => {
              const dominant = getDominantElement(result.ohaengBalance)
              const visual = elementVisuals[dominant]
              if (!visual) return null
              const elInfo = sr.elements?.[dominant as keyof typeof sr.elements]
              const dominantName = elInfo?.name || dominant
              const traitList = elInfo?.traits || []
              return (
                <ShareableResultCard
                  childName={inputData.name}
                  dominantElement={dominant}
                  elementEmoji={visual.emoji}
                  elementColor={visual.color}
                  elementBgColor={visual.bgColor}
                  traits={traitList}
                  ohaengBalance={result.ohaengBalance}
                  elementLabel={dominantName}
                  shareText={sr.shareText}
                  shareTitle={`${inputData.name}${sr.shareTitle}`}
                  buttonLabel={sr.shareResult}
                  downloadLabel={sr.shareResult}
                />
              )
            })()}

            {/* Sibling comparison prompt */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(184, 146, 45, 0.06) 0%, rgba(90, 122, 102, 0.06) 100%)',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '1px solid rgba(184, 146, 45, 0.15)',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2C2420', marginBottom: '0.5rem', fontFamily: 'serif' }}>
                {sr.siblingHeading || 'Want to understand why they\'re so different?'}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#6B5E52', marginBottom: '1rem', lineHeight: 1.6 }}>
                {sr.siblingDesc || 'Analyze a sibling to compare temperaments'}
              </p>
              <Link href={`/saju/input?from=sibling&siblingName=${encodeURIComponent(inputData?.name || '')}&siblingElement=${getDominantElement(result?.ohaengBalance || {})}`} style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '10px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  background: '#1A3D2E',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  width: '100%',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxSizing: 'border-box',
                }}>
                  {sr.siblingCta || 'Analyze Sibling'}
              </Link>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link href="/" style={{ fontSize: '0.875rem', color: '#8B8580', textDecoration: 'none' }}>
              {sr.goHome}
            </Link>
          </div>
        </section>
      </main>

      {/* Sticky Premium CTA — shows when no premium report and not in payment flow */}
      {!premiumReport && !premiumLoading && !showPayment && result && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          background: 'linear-gradient(to right, #1A3D2E, #2D4A3E)',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem', fontWeight: 500 }}>
            {sr.premiumTitle}
          </span>
          <button
            onClick={() => {
              setShowPayment(true);
              document.querySelector('[id="inline-paypal-container"]')?.closest('section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              background: '#C5A059',
              color: '#2D3A35',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {t.pricing.premium.price} →
          </button>
        </div>
      )}

      {/* Footer */}
      <footer style={{ padding: !premiumReport ? '2rem 0 5rem' : '2rem 0', borderTop: '1px solid #EBE5DF', backgroundColor: '#FEFDFB' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: '#8B8580' }}>
            {sr.footerDisclaimer}
          </p>
        </div>
      </footer>
    </div>
  )
}
