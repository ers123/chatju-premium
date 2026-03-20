'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '@/lib/api'
import { useLanguage } from '@/app/lib/i18n/context'

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
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const StarIcon = ({ filled = true }: { filled?: boolean }) => (
  <svg viewBox="0 0 20 20" fill={filled ? "#B8922D" : "#E2DDD6"} className="w-4 h-4">
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

// Four Pillars Display Component
function FourPillarsDisplay({ pillars, t }: { pillars: SajuResult['fourPillars']; t: { pillarYear: string; pillarMonth: string; pillarDay: string; pillarHour: string } }) {
  const pillarOrder = ['시주', '일주', '월주', '년주'] as const
  const pillarLabels = { 년주: t.pillarYear, 월주: t.pillarMonth, 일주: t.pillarDay, 시주: t.pillarHour }

  return (
    <div className="grid grid-cols-4 gap-2 md:gap-4">
      {pillarOrder.map((key) => {
        const pillar = pillars[key]
        return (
          <div key={key} className="text-center">
            <div className="text-xs mb-2" style={{ color: '#8B8580' }}>{pillarLabels[key]}</div>
            <div className="bg-[#1A3D2E] rounded-xl overflow-hidden">
              <div className="py-3 md:py-4 border-b border-white/10">
                <div className="text-2xl md:text-3xl font-bold text-white">{pillar.천간}</div>
                <div className="text-xs text-[#B8922D] mt-1">{pillar.천간오행}</div>
              </div>
              <div className="py-3 md:py-4">
                <div className="text-2xl md:text-3xl font-bold text-white">{pillar.지지}</div>
                <div className="text-xs text-[#B8922D] mt-1">{pillar.지지오행}</div>
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
    <div className="space-y-4">
      {ohaengElements.map(({ key, name }) => {
        const value = balance[key] || 0
        const percentage = (value / maxValue) * 100
        const visual = elementVisuals[key]

        return (
          <div key={key} className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: `${visual.color}20` }}>
              {visual.emoji}
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: '#6B5E52' }}>{name}</span>
                <span className="font-bold" style={{ color: visual.color }}>{value}{elementCount}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#EBE5DF' }}>
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${percentage}%`, backgroundColor: visual.color }}
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
  const sr = t.sajuResults
  const [result, setResult] = useState<SajuResult | null>(null)
  const [inputData, setInputData] = useState<{ name: string; birthDate: string; birthTime: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [premiumReport, setPremiumReport] = useState<Record<string, string> | null>(null)
  const [corrections, setCorrections] = useState<{ applied: boolean; note: string; adjustedTime?: string | null; isSouthernHemisphere?: boolean } | null>(null)
  const [premiumLoading, setPremiumLoading] = useState(false)
  const [premiumError, setPremiumError] = useState('')
  const reportRef = useRef<HTMLDivElement>(null)

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
        const stored = sessionStorage.getItem('sajuInput')
        if (!stored) return
        const input = JSON.parse(stored)

        const reading = await apiClient.getFullReading(completed.orderId, {
          birthDate: input.birthDate,
          birthTime: input.birthTime,
          gender: input.gender,
          isLunar: input.calendar === 'lunar',
          language: lang,
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
        })

        if (reading.premiumSections) {
          setPremiumReport(reading.premiumSections as Record<string, string>)
        } else if (reading.interpretation) {
          setPremiumReport({ fullText: reading.interpretation as string })
        }
      } catch (err: unknown) {
        console.error('Premium report error:', err)
        setPremiumError('프리미엄 보고서를 불러오는 데 실패했습니다.')
      } finally {
        setPremiumLoading(false)
      }
    }

    fetchPremium()
  }, [result, inputData])

  const handlePdfExport = useCallback(async () => {
    if (!reportRef.current) return

    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FDFCFA',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pdfWidth - 20
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 10

      // Header
      pdf.setFontSize(12)
      pdf.setTextColor(45, 58, 53)
      pdf.text(`소명 - ${inputData?.name || ''}`, 10, 8)
      pdf.setFontSize(8)
      pdf.setTextColor(139, 133, 128)
      pdf.text(new Date().toLocaleDateString('ko-KR'), pdfWidth - 30, 8)

      // Add image pages
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
      heightLeft -= (pdfHeight - position)

      while (heightLeft > 0) {
        position = 10
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 10, position - (imgHeight - heightLeft), imgWidth, imgHeight)
        heightLeft -= (pdfHeight - position)
      }

      pdf.save(`소명_${inputData?.name || 'report'}_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (err) {
      console.error('PDF export error:', err)
      alert('PDF 저장에 실패했습니다. 다시 시도해주세요.')
    }
  }, [inputData])

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

        // Send both child and parent data for relationship analysis
        const previewData = await apiClient.getPreview({
          birthDate: input.birthDate,
          birthTime: input.birthTime,
          gender: input.gender,
          isLunar: input.calendar === 'lunar',
          language: lang,
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
          borderRadius: '1.5rem',
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
              borderRadius: '0.75rem',
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
    <div className="min-h-screen bg-[#FDFCFA]">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-premium" style={{ borderBottom: '1px solid rgba(235, 229, 223, 0.6)' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="no-underline flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1A3D2E] flex items-center justify-center">
              <span className="font-serif text-xs text-[#B8922D] font-bold">소</span>
            </div>
            <span className="font-serif text-xl text-[#1A3D2E]">소명</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePdfExport}
              className="px-4 py-2 text-sm font-semibold rounded-lg hover:border-[#B8922D] transition-all"
              style={{ border: '1px solid #EBE5DF' }}
            >
              {sr.savePdf}
            </button>
            <button
              onClick={() => router.push('/chat')}
              className="px-4 py-2 text-sm font-bold text-white bg-[#B8922D] rounded-lg hover:bg-[#D4B67D] transition-all"
            >
              {sr.aiConsult}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8" ref={reportRef}>
        {/* Hero Result Card */}
        <section className="card-paper rounded-3xl p-6 md:p-10 mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B8922D]/10 text-[#B8922D] text-sm font-semibold mb-4">
              ✨ {sr.freeBadge}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-serif text-[#1A3D2E] mb-2">
              {inputData?.name}{sr.analysisTitle}
            </h1>
            <p style={{ color: '#8B8580' }}>
              {inputData?.birthDate} {inputData?.birthTime}
            </p>
            <p className="text-sm mt-2 font-medium" style={{ color: '#8B8580' }}>{sr.analysisSubtitle}</p>
          </div>

          {/* Main Temperament */}
          <div className="rounded-2xl p-6 mb-8" style={{ backgroundColor: dominantVisual.bgColor }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl bg-white shadow-sm">
                {dominantVisual.emoji}
              </div>
              <div>
                <div className="text-sm" style={{ color: '#8B8580' }}>{sr.coreTemperament}</div>
                <div className="text-2xl font-bold" style={{ color: dominantVisual.color }}>
                  {dominantElInfo.name}{sr.temperamentSuffix}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {dominantElInfo.traits.map((trait, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-white text-sm font-medium" style={{ color: dominantVisual.color }}>
                  {trait}
                </span>
              ))}
            </div>
            <p className="leading-relaxed" style={{ color: '#6B5E52' }}>
              {inputData?.name}{sr.temperamentDesc1}<strong style={{ color: dominantVisual.color }}>{dominantElInfo.name}</strong>{sr.temperamentDesc2}{dominantElInfo.traits.slice(0, 2).join(', ')}{sr.temperamentDesc3}
            </p>
          </div>

          {/* AI Interpretation */}
          {result.preview && (
            <div className="rounded-2xl p-6 mb-8 bg-gradient-to-br from-[#F8F6F3] to-[#FFF8E1] border border-[#B8922D]/20">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#B8922D]/10 flex items-center justify-center text-lg">🔮</div>
                <h3 className="text-lg font-bold text-[#1A3D2E]">{sr.aiInterpretation}</h3>
              </div>
              <div className="leading-relaxed whitespace-pre-line text-[0.95rem]" style={{ color: '#6B5E52' }}>
                {result.preview}
              </div>
            </div>
          )}

          {/* Four Pillars */}
          <div className="mb-8">
            <h3 className="text-lg font-bold font-serif text-[#1A3D2E] mb-4">{sr.fourPillars}</h3>
            <FourPillarsDisplay pillars={result.fourPillars} t={sr} />

            {/* Solar Time Correction Note */}
            {corrections?.applied && (
              <div className="mt-3 px-4 py-3 rounded-xl border border-[#E2DDD6] bg-[#FAF8F5]">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-base">🕐</span>
                  <span className="text-[#6B5E52]">{corrections.note}</span>
                </div>
                {corrections.adjustedTime && (
                  <div className="text-xs text-[#9CA3AF] mt-1 ml-7">
                    보정된 출생 시각: {corrections.adjustedTime}
                    {corrections.isSouthernHemisphere && ' (남반구 만세력 적용)'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ohaeng Balance */}
          <div>
            <h3 className="text-lg font-bold font-serif text-[#1A3D2E] mb-4">{sr.ohaengBalance}</h3>
            <OhaengBalanceChart balance={result.ohaengBalance} ohaengElements={sr.ohaengElements} elementCount={sr.elementCount} />
          </div>
        </section>


        {/* FREE: Learning Style */}
        <section className="card-paper rounded-3xl p-6 md:p-10 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] flex items-center justify-center text-xl">📚</div>
            <div>
              <div className="text-xs text-[#5A7A66] font-bold">{sr.learningFree}</div>
              <h2 className="text-xl font-bold font-serif text-[#1A3D2E]">{sr.learningTitle}</h2>
            </div>
          </div>

          <div className="space-y-6">
            {/* Recommended Learning Style */}
            <div className="p-5 rounded-2xl" style={{ backgroundColor: dominantVisual.bgColor }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{dominantVisual.emoji}</span>
                <h4 className="font-bold" style={{ color: dominantVisual.color }}>
                  {dominantElInfo.name}{sr.learningMethod}
                </h4>
              </div>
              <p className="leading-relaxed mb-4" style={{ color: '#6B5E52' }}>{dominantElInfo.learningStyle}</p>
              <div className="flex items-start gap-2 p-3 bg-white/50 rounded-xl">
                <span className="text-lg">⚠️</span>
                <p className="text-sm" style={{ color: '#6B5E52' }}>{dominantElInfo.caution}</p>
              </div>
            </div>

            {/* Weak Element Supplement */}
            <div className="p-5 rounded-2xl" style={{ backgroundColor: '#F8F6F3' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{weakVisual.emoji}</span>
                <h4 className="font-bold" style={{ color: '#6B5E52' }}>
                  {weakElInfo.name}{sr.supplementTitle}
                </h4>
              </div>
              <p className="leading-relaxed" style={{ color: '#6B5E52' }}>
                {inputData?.name}{sr.supplementDesc1}<strong>{weakElInfo.name}</strong>{sr.supplementDesc2}
                {getSupplementText(weakElement)}
              </p>
            </div>

            {/* Quick Tips */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#F8F6F3] text-center">
                <div className="text-2xl mb-2">🕐</div>
                <div className="font-bold text-[#1A3D2E] text-sm mb-1">{sr.optimalTime}</div>
                <div className="text-sm" style={{ color: '#6B5E52' }}>
                  {getTimeText(dominantElement)}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#F8F6F3] text-center">
                <div className="text-2xl mb-2">📍</div>
                <div className="font-bold text-[#1A3D2E] text-sm mb-1">{sr.recommendedEnv}</div>
                <div className="text-sm" style={{ color: '#6B5E52' }}>
                  {getEnvText(dominantElement)}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#F8F6F3] text-center">
                <div className="text-2xl mb-2">🎯</div>
                <div className="font-bold text-[#1A3D2E] text-sm mb-1">{sr.motivation}</div>
                <div className="text-sm" style={{ color: '#6B5E52' }}>
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
            <section className="bg-gradient-to-br from-[#1A3D2E] to-[#2D4A3E] rounded-3xl p-6 md:p-10 text-white mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#B8922D]/10 rounded-full blur-3xl" />
              <div className="relative z-10 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#B8922D]/20 text-[#B8922D] text-sm font-bold mb-4">
                  <CheckIcon /> 프리미엄 분석 완료
                </div>
                <h2 className="text-2xl font-bold font-serif">{sr.premiumTitle}</h2>
              </div>
            </section>

            {/* Premium Sections */}
            {premiumReport.fullText ? (
              <section className="card-paper rounded-3xl p-6 md:p-10 mb-8">
                <div className="leading-relaxed whitespace-pre-line" style={{ color: '#6B5E52' }}>
                  {premiumReport.fullText}
                </div>
              </section>
            ) : (
              <>
                {[
                  { key: 'coreProfile', icon: '🎯', title: '사주 핵심 프로필' },
                  { key: 'parentChildAnalysis', icon: '👨‍👩‍👧', title: '부모-자녀 궁합 분석' },
                  { key: 'developmentGuide', icon: '📈', title: '연령별 발달 가이드' },
                  { key: 'careerAptitude', icon: '💼', title: '진로/적성 심층 분석' },
                  { key: 'fortuneCycles', icon: '🔮', title: '대운/세운 운세 흐름' },
                  { key: 'monthlyFortune', icon: '📅', title: '월별 운세 리포트' },
                  { key: 'elementBalance', icon: '⚖️', title: '오행 밸런스 & 개운법' },
                  { key: 'weeklyActions', icon: '✅', title: '이번 주 실천 과제' },
                ].map(({ key, icon, title }) => {
                  const content = premiumReport[key]
                  if (!content) return null
                  return (
                    <section key={key} className="card-paper rounded-3xl p-6 md:p-10 mb-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: 'rgba(184, 146, 45, 0.1)' }}>
                          {icon}
                        </div>
                        <h3 className="text-lg font-bold font-serif text-[#1A3D2E]">{title}</h3>
                      </div>
                      <div className="leading-relaxed whitespace-pre-line" style={{ color: '#6B5E52' }}>
                        {content}
                      </div>
                    </section>
                  )
                })}
              </>
            )}
          </>
        ) : premiumLoading ? (
          <section className="card-paper rounded-3xl p-6 md:p-10 mb-8 text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 border-4 rounded-full" style={{ borderColor: '#EBE5DF' }} />
              <div className="absolute inset-0 border-4 rounded-full animate-spin" style={{ borderColor: '#B8922D', borderTopColor: 'transparent' }} />
            </div>
            <h3 className="text-lg font-bold text-[#1A3D2E] mb-2">프리미엄 분석 생성 중...</h3>
            <p style={{ color: '#8B8580' }}>AI가 심층 분석을 수행하고 있습니다. 잠시만 기다려주세요.</p>
          </section>
        ) : premiumError ? (
          <section className="card-paper rounded-3xl p-6 md:p-10 mb-8 text-center">
            <p style={{ color: '#C67B6F' }}>{premiumError}</p>
          </section>
        ) : (
          <section className="bg-gradient-to-br from-[#1A3D2E] to-[#2D4A3E] rounded-3xl p-6 md:p-10 text-white mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#B8922D]/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <LockIcon />
                <span className="text-sm font-semibold text-[#B8922D]">{sr.premiumContent}</span>
              </div>
              <h2 className="text-2xl font-bold font-serif mb-6">{sr.premiumTitle}</h2>
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {sr.premiumItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/5">
                    <div className="text-2xl">{item.icon}</div>
                    <div>
                      <div className="font-bold text-white">{item.title}</div>
                      <div className="text-sm text-white/60">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push('/payment')}
                  className="flex-1 py-4 rounded-xl font-bold text-[#2D3A35] hover:opacity-90 transition-all"
                  style={{ backgroundColor: '#C5A059' }}
                >
                  프리미엄 분석 시작하기 — $4.99
                </button>
              </div>
            </div>
          </section>
        )}


        {/* Actions */}
        <section className="text-center pb-12">
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && navigator.share) {
                  navigator.share({
                    title: `${inputData?.name}${sr.shareTitle}`,
                    text: sr.shareText,
                    url: window.location.href
                  })
                }
              }}
              className="px-6 py-3 rounded-xl font-semibold hover:border-[#B8922D] transition-all"
              style={{ border: '2px solid #EBE5DF', color: '#6B5E52' }}
            >
              {sr.shareResult}
            </button>
            <Link href="/saju/input">
              <button
                className="px-6 py-3 rounded-xl font-semibold hover:border-[#B8922D] transition-all"
                style={{ border: '2px solid #EBE5DF', color: '#6B5E52' }}
              >
                {sr.analyzeAnother}
              </button>
            </Link>
          </div>
          <Link href="/" className="text-sm hover:text-[#B8922D] transition-colors" style={{ color: '#8B8580' }}>
            {sr.goHome}
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8" style={{ borderTop: '1px solid #EBE5DF', backgroundColor: '#FEFDFB' }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs" style={{ color: '#8B8580' }}>
            {sr.footerDisclaimer}
          </p>
        </div>
      </footer>
    </div>
  )
}
