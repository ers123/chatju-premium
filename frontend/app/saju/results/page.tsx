'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResultsPage() {
  const router = useRouter()

  // Mock data - in production this would come from the API
  const userData = {
    elements: [
      { label: '天干: 庚金 (Metal)', type: 'metal' },
      { label: '地支: 戌土 (Earth)', type: 'earth' },
      { label: '藏干: 壬水 (Water)', type: 'water' }
    ],
    personality: {
      main: [
        'Your dominant Metal element suggests a natural inclination toward structure, analysis, and precision. You possess strong organizational abilities and excel at bringing order to complex situations.',
        'The Earth foundation provides stability and practicality to your character. You\'re someone who values tangible results and prefers tested methods over experimental approaches.'
      ],
      strength: 'Strategic thinking, attention to detail, reliable decision-making'
    },
    career: {
      intro: 'Your elemental composition indicates strong potential in fields requiring analytical precision and systematic thinking. Consider careers in:',
      paths: [
        'Financial analysis and strategic planning',
        'Engineering and systems design',
        'Legal and compliance roles'
      ]
    },
    fortune: [
      {
        period: 'Q1 2025 - Growth Phase',
        description: 'Career opportunities emerge, favorable for new initiatives',
        color: 'green'
      },
      {
        period: 'Q2 2025 - Consolidation',
        description: 'Focus on strengthening existing foundations',
        color: 'amber'
      },
      {
        period: 'Q3 2025 - Opportunities',
        description: 'Relationship and partnership developments',
        color: 'blue'
      },
      {
        period: 'Q4 2025 - Reflection',
        description: 'Time for strategic planning and goal setting',
        color: 'purple'
      }
    ]
  }

  const getElementClass = (type: string) => {
    const classes = {
      wood: 'element-wood',
      fire: 'element-fire',
      earth: 'element-earth',
      metal: 'element-metal',
      water: 'element-water'
    }
    return `element-badge ${classes[type as keyof typeof classes] || ''}`
  }

  const getBorderColor = (color: string) => {
    const colors = {
      green: 'border-green-500',
      amber: 'border-amber-500',
      blue: 'border-blue-500',
      purple: 'border-purple-500'
    }
    return colors[color as keyof typeof colors] || 'border-stone-500'
  }

  return (
    <div className="min-h-screen p-6 bg-stone-50">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div>
            <Link href="/" className="text-sm text-stone-600 hover:text-stone-900 mb-2 inline-block">
              ← Back to Home
            </Link>
            <h1 className="text-3xl font-semibold">Your Saju Reading</h1>
          </div>
          <button className="px-4 py-2 text-sm bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors">
            Download PDF
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Quick Summary - Elements */}
        <div className="section-card">
          <h2 className="text-2xl font-semibold mb-4">Your Elements</h2>
          <div className="flex flex-wrap gap-3">
            {userData.elements.map((element, index) => (
              <span key={index} className={getElementClass(element.type)}>
                {element.label}
              </span>
            ))}
          </div>
        </div>

        {/* Personality Analysis */}
        <div className="section-card">
          <h2 className="text-2xl font-semibold mb-4">Personality Insights</h2>
          <div className="space-y-4 text-stone-700 leading-relaxed">
            {userData.personality.main.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="font-semibold text-amber-900 mb-2">Strength</h3>
              <p className="text-sm text-amber-800">{userData.personality.strength}</p>
            </div>
          </div>
        </div>

        {/* Career Guidance */}
        <div className="section-card">
          <h2 className="text-2xl font-semibold mb-4">Career Path</h2>
          <div className="space-y-4 text-stone-700 leading-relaxed">
            <p>{userData.career.intro}</p>
            <ul className="space-y-2 ml-6">
              {userData.career.paths.map((path, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-amber-600 mr-2">•</span>
                  <span>{path}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Fortune Timeline */}
        <div className="section-card">
          <h2 className="text-2xl font-semibold mb-4">Next 12 Months</h2>
          <div className="space-y-6">
            {userData.fortune.map((period, index) => (
              <div key={index} className={`border-l-4 ${getBorderColor(period.color)} pl-4`}>
                <h3 className="font-semibold mb-1">{period.period}</h3>
                <p className="text-sm text-stone-600">{period.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA - Start Chat */}
        <div className="section-card bg-stone-900 text-white text-center">
          <h2 className="text-2xl font-semibold mb-4">Want to dive deeper?</h2>
          <p className="mb-6 text-stone-300">Ask follow-up questions through our interactive chat</p>
          <button
            onClick={() => router.push('/chat')}
            className="px-8 py-3 bg-white text-stone-900 rounded-lg font-medium hover:bg-stone-100 transition-colors"
          >
            Start Chat Session
          </button>
        </div>
      </div>
    </div>
  )
}
