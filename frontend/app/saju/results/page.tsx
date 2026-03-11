'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge, Separator, Progress, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import { apiClient } from '@/lib/api'

// Types
interface FourPillar {
  천간: string
  지지: string
  천간오행: string
  지지오행: string
  십신?: string
}

interface DaeunCycle {
  age: number
  startYear: number
  endYear: number
  stem: string
  branch: string
  element: string
  interpretation?: string
}

interface SeunCycle {
  year: number
  stem: string
  branch: string
  element: string
  interpretation?: string
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
  fortuneCycles?: {
    daeunList: DaeunCycle[]
    seunList: SeunCycle[]
    currentDaeun?: DaeunCycle
    daeunStartAge: number
    direction: string
  }
  interpretation?: string
  preview?: string
}

// Element color mapping
const elementColors: Record<string, { bg: string; text: string; border: string }> = {
  '목': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-400' },
  '木': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-400' },
  '화': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-400' },
  '火': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-400' },
  '토': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-400' },
  '土': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-400' },
  '금': { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-400' },
  '金': { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-400' },
  '수': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-400' },
  '水': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-400' },
}

const getElementStyle = (element: string) => {
  const firstChar = element?.charAt(0) || ''
  return elementColors[firstChar] || { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-400' }
}

// Components
function FourPillarsDisplay({ pillars }: { pillars: SajuResult['fourPillars'] }) {
  const pillarOrder = ['시주', '일주', '월주', '년주'] as const
  const pillarLabels = {
    년주: { kr: '년주', en: 'Year', icon: '🌳' },
    월주: { kr: '월주', en: 'Month', icon: '🌙' },
    일주: { kr: '일주', en: 'Day', icon: '☀️' },
    시주: { kr: '시주', en: 'Hour', icon: '⏰' },
  }

  return (
    <div className="grid grid-cols-4 gap-3 md:gap-6">
      {pillarOrder.map((key) => {
        const pillar = pillars[key]
        const label = pillarLabels[key]
        const stemStyle = getElementStyle(pillar.천간오행)
        const branchStyle = getElementStyle(pillar.지지오행)

        return (
          <div key={key} className="text-center">
            <div className="text-xs md:text-sm text-stone-500 mb-2 flex items-center justify-center gap-1">
              <span>{label.icon}</span>
              <span className="hidden md:inline">{label.kr}</span>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
              {/* 천간 (Heavenly Stem) */}
              <div className={`py-3 md:py-4 ${stemStyle.bg}`}>
                <div className={`text-2xl md:text-3xl font-semibold ${stemStyle.text}`}>
                  {pillar.천간}
                </div>
                <div className={`text-xs ${stemStyle.text} opacity-75`}>
                  {pillar.천간오행}
                </div>
              </div>
              {/* 지지 (Earthly Branch) */}
              <div className={`py-3 md:py-4 ${branchStyle.bg}`}>
                <div className={`text-2xl md:text-3xl font-semibold ${branchStyle.text}`}>
                  {pillar.지지}
                </div>
                <div className={`text-xs ${branchStyle.text} opacity-75`}>
                  {pillar.지지오행}
                </div>
              </div>
            </div>
            {/* 십신 (if available) */}
            {pillar.십신 && (
              <div className="mt-2 text-xs text-stone-600">
                {pillar.십신}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function OhaengBalanceChart({ balance }: { balance: Record<string, number> }) {
  const elements = [
    { key: '목', name: '木', kr: '목', color: 'bg-emerald-500' },
    { key: '화', name: '火', kr: '화', color: 'bg-red-500' },
    { key: '토', name: '土', kr: '토', color: 'bg-amber-500' },
    { key: '금', name: '金', kr: '금', color: 'bg-gray-400' },
    { key: '수', name: '水', kr: '수', color: 'bg-blue-500' },
  ]

  const maxValue = Math.max(...Object.values(balance), 1)

  return (
    <div className="space-y-4">
      {elements.map(({ key, name, kr, color }) => {
        const value = balance[key] || balance[name] || 0
        const percentage = (value / maxValue) * 100

        return (
          <div key={key} className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-medium`}>
              {name}
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-stone-600">{kr} ({name})</span>
                <span className="font-medium text-stone-900">{value}개</span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DaeunTimeline({ cycles, startAge, currentYear }: {
  cycles: DaeunCycle[]
  startAge: number
  currentYear: number
}) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-stone-600 mb-4">
        대운 시작 나이: <span className="font-medium text-stone-900">{startAge}세</span>
      </div>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-2 min-w-max">
          {cycles.map((cycle, idx) => {
            const isCurrent = currentYear >= cycle.startYear && currentYear <= cycle.endYear
            const isPast = cycle.endYear < currentYear
            const style = getElementStyle(cycle.element)

            return (
              <div
                key={idx}
                className={`relative p-4 rounded-xl border-2 min-w-[120px] transition-all ${
                  isCurrent
                    ? `${style.bg} ${style.border} shadow-lg scale-105`
                    : isPast
                    ? 'bg-stone-50 border-stone-200 opacity-60'
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                {isCurrent && (
                  <Badge variant="ohaeng-earth" className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs">
                    현재
                  </Badge>
                )}
                <div className="text-center">
                  <div className="text-lg font-semibold text-stone-900">
                    {cycle.stem}{cycle.branch}
                  </div>
                  <div className={`text-xs ${style.text} mb-2`}>
                    {cycle.element}
                  </div>
                  <div className="text-xs text-stone-500">
                    {cycle.age}세 ~ {cycle.age + 9}세
                  </div>
                  <div className="text-xs text-stone-400">
                    {cycle.startYear}-{cycle.endYear}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SeunCards({ cycles, currentYear }: { cycles: SeunCycle[]; currentYear: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cycles.map((cycle, idx) => {
        const isCurrent = cycle.year === currentYear
        const style = getElementStyle(cycle.element)

        return (
          <div
            key={idx}
            className={`p-4 rounded-xl border-2 text-center transition-all ${
              isCurrent
                ? `${style.bg} ${style.border} shadow-lg`
                : 'bg-white border-stone-200'
            }`}
          >
            {isCurrent && (
              <Badge variant="secondary" className="mb-2 text-xs">올해</Badge>
            )}
            <div className="text-lg font-semibold text-stone-900">
              {cycle.stem}{cycle.branch}
            </div>
            <div className={`text-xs ${style.text} mb-1`}>
              {cycle.element}
            </div>
            <div className="text-sm text-stone-600">
              {cycle.year}년
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ResultsPage() {
  const router = useRouter()
  const [result, setResult] = useState<SajuResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  const currentYear = new Date().getFullYear()

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // Get input from sessionStorage
        const inputData = sessionStorage.getItem('sajuInput')
        if (!inputData) {
          router.push('/saju/input')
          return
        }

        const input = JSON.parse(inputData)

        // First try preview (free)
        const previewData = await apiClient.getPreview({
          birthDate: input.birthDate,
          birthTime: input.birthTime,
          gender: input.gender,
          isLunar: input.calendar === 'lunar'
        })

        // Transform preview data to match our interface
        // API returns manseryeok which contains pillars and elements
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

        setResult(transformedResult)
      } catch (err) {
        console.error('Error fetching results:', err)
        setError('사주 분석 중 오류가 발생했습니다. 다시 시도해주세요.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-6">
            <div className="text-4xl animate-pulse">☯</div>
          </div>
          <h2 className="text-xl font-semibold text-stone-900 mb-2">사주 분석 중...</h2>
          <p className="text-stone-600">잠시만 기다려주세요</p>
          <Progress value={65} className="w-48 mx-auto mt-4" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-xl font-semibold text-stone-900 mb-2">오류가 발생했습니다</h2>
          <p className="text-stone-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/saju/input')}
            className="px-6 py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  if (!result) {
    return null
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-semibold">ChatJu</span>
                <Badge variant="secondary" className="text-[10px]">Premium</Badge>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <span className="text-stone-600">사주풀이 결과</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-sm border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors">
                PDF 저장
              </button>
              <button
                onClick={() => router.push('/chat')}
                className="px-4 py-2 text-sm bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
              >
                AI 상담하기
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero Section - Four Pillars */}
        <section className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl p-8 mb-8 text-white">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold mb-2">사주팔자 분석 결과</h1>
            <p className="text-stone-400">
              일간 <span className="text-amber-400 font-medium">{result.dayMaster}</span> 기준 분석
            </p>
          </div>
          <FourPillarsDisplay pillars={result.fourPillars} />
        </section>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto">
            <TabsTrigger value="overview">종합 분석</TabsTrigger>
            <TabsTrigger value="ohaeng">오행 균형</TabsTrigger>
            <TabsTrigger value="daeun">대운</TabsTrigger>
            <TabsTrigger value="seun">세운</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="bg-white rounded-2xl p-8 border border-stone-200">
              <h2 className="text-2xl font-semibold text-stone-900 mb-6">기본 해석</h2>
              {result.preview ? (
                <div className="prose prose-stone max-w-none">
                  <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">
                    {result.preview}
                  </p>
                </div>
              ) : (
                <div className="p-6 bg-amber-50 rounded-xl border border-amber-200">
                  <h3 className="font-medium text-amber-900 mb-2">프리미엄 분석을 원하시나요?</h3>
                  <p className="text-sm text-amber-800 mb-4">
                    심층 AI 해석, 대운/세운 상세 분석, 직업/연애/재물운 등
                    더욱 자세한 분석을 받아보세요.
                  </p>
                  <button className="px-6 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-400 transition-colors">
                    프리미엄 분석 받기
                  </button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Ohaeng Balance Tab */}
          <TabsContent value="ohaeng" className="space-y-6">
            <div className="bg-white rounded-2xl p-8 border border-stone-200">
              <h2 className="text-2xl font-semibold text-stone-900 mb-6">오행 균형 분석</h2>
              <OhaengBalanceChart balance={result.ohaengBalance} />

              <Separator className="my-8" />

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <h3 className="font-medium text-emerald-900 mb-2">강한 오행</h3>
                  <p className="text-sm text-emerald-700">
                    사주에서 가장 많이 나타나는 오행으로, 당신의 주요 성향을 나타냅니다.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <h3 className="font-medium text-blue-900 mb-2">보완이 필요한 오행</h3>
                  <p className="text-sm text-blue-700">
                    부족한 오행을 보완하면 더욱 균형 잡힌 삶을 살 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Daeun Tab */}
          <TabsContent value="daeun" className="space-y-6">
            <div className="bg-white rounded-2xl p-8 border border-stone-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-stone-900">대운 (大運)</h2>
                  <p className="text-stone-600">10년 단위로 변화하는 인생의 큰 흐름</p>
                </div>
                {result.fortuneCycles && (
                  <Badge variant="outline" className="text-sm">
                    {result.fortuneCycles.direction === 'forward' ? '순행' : '역행'}
                  </Badge>
                )}
              </div>

              {result.fortuneCycles?.daeunList ? (
                <DaeunTimeline
                  cycles={result.fortuneCycles.daeunList}
                  startAge={result.fortuneCycles.daeunStartAge}
                  currentYear={currentYear}
                />
              ) : (
                <div className="text-center py-12 text-stone-500">
                  <p>대운 정보를 불러올 수 없습니다.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Seun Tab */}
          <TabsContent value="seun" className="space-y-6">
            <div className="bg-white rounded-2xl p-8 border border-stone-200">
              <h2 className="text-2xl font-semibold text-stone-900 mb-2">세운 (歲運)</h2>
              <p className="text-stone-600 mb-6">연간 운세 흐름</p>

              {result.fortuneCycles?.seunList ? (
                <SeunCards
                  cycles={result.fortuneCycles.seunList}
                  currentYear={currentYear}
                />
              ) : (
                <div className="text-center py-12 text-stone-500">
                  <p>세운 정보를 불러올 수 없습니다.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <section className="mt-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-semibold mb-3">더 궁금한 것이 있으신가요?</h2>
          <p className="text-amber-100 mb-6">
            AI와 실시간 대화로 사주에 대해 더 자세히 알아보세요
          </p>
          <button
            onClick={() => router.push('/chat')}
            className="px-8 py-3 bg-white text-amber-600 rounded-xl font-medium hover:bg-amber-50 transition-colors"
          >
            AI 상담 시작하기 →
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 mt-12 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-stone-500">
          <p>© 2025 ChatJu Premium. 사주풀이 결과는 참고용이며, 중요한 결정은 전문가와 상담하세요.</p>
        </div>
      </footer>
    </div>
  )
}
