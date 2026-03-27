'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/app/lib/i18n/context'
// UI components (using native elements with inline styles)

// Check icon
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

// Saju Helpers
const getZodiacInfo = (yearStr: string) => {
  const year = parseInt(yearStr)
  if (isNaN(year) || year < 1900 || year > 2100) return null

  const stems = [
    { name: '경', color: '백', colorName: '흰색(金)', colorCode: '#6B7578', element: '금' },
    { name: '신', color: '백', colorName: '흰색(金)', colorCode: '#6B7578', element: '금' },
    { name: '임', color: '흑', colorName: '검정(水)', colorCode: '#1A3D2E', element: '수' },
    { name: '계', color: '흑', colorName: '검정(水)', colorCode: '#1A3D2E', element: '수' },
    { name: '갑', color: '청', colorName: '파랑(木)', colorCode: '#5A7A66', element: '목' },
    { name: '을', color: '청', colorName: '파랑(木)', colorCode: '#5A7A66', element: '목' },
    { name: '병', color: '적', colorName: '빨강(火)', colorCode: '#A85544', element: '화' },
    { name: '정', color: '적', colorName: '빨강(火)', colorCode: '#A85544', element: '화' },
    { name: '무', color: '황', colorName: '노랑(土)', colorCode: '#B8922D', element: '토' },
    { name: '기', color: '황', colorName: '노랑(土)', colorCode: '#B8922D', element: '토' },
  ]

  const branches = [
    { name: '신', animal: '원숭이', icon: '🐵' },
    { name: '유', animal: '닭', icon: '🐔' },
    { name: '술', animal: '개', icon: '🐶' },
    { name: '해', animal: '돼지', icon: '🐷' },
    { name: '자', animal: '쥐', icon: '🐭' },
    { name: '축', animal: '소', icon: '🐮' },
    { name: '인', animal: '호랑이', icon: '🐯' },
    { name: '묘', animal: '토끼', icon: '🐰' },
    { name: '진', animal: '용', icon: '🐲' },
    { name: '사', animal: '뱀', icon: '🐍' },
    { name: '오', animal: '말', icon: '🐴' },
    { name: '미', animal: '양', icon: '🐑' },
  ]

  const stem = stems[year % 10]
  const branch = branches[year % 12]

  return { stem, branch }
}


export default function InputFormPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // Child info
    name: '',
    calendar: 'solar',
    year: '',
    month: '',
    day: '',
    hour: '',
    minute: '',
    gender: '',
    unknownTime: false,
    // Birth place (for solar time correction)
    birthPlace: '',
    birthPlaceCustom: '',
    // Twin info
    isTwin: false,
    twinOrder: '' as '' | '1' | '2',
    twinSiblingName: '',
    // Parent info
    parentRole: '', // 'mother' | 'father'
    parentName: '',
    parentCalendar: 'solar',
    parentYear: '',
    parentMonth: '',
    parentDay: '',
    parentHour: '',
    parentMinute: '',
    parentUnknownTime: false,
    // Agreements
    privacyAgreed: false,
    ageVerified: false,
    marketingAgreed: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalSteps = 5
  const progress = (step / totalSteps) * 100

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Child birth info
      const childBirthDate = `${formData.year}.${formData.month.padStart(2, '0')}.${formData.day.padStart(2, '0')}`
      const childBirthTime = formData.unknownTime ? '12:00' : `${formData.hour.padStart(2, '0')}:${formData.minute.padStart(2, '0')}`

      // Parent birth info
      const parentBirthDate = `${formData.parentYear}.${formData.parentMonth.padStart(2, '0')}.${formData.parentDay.padStart(2, '0')}`
      const parentBirthTime = formData.parentUnknownTime ? '12:00' : `${formData.parentHour.padStart(2, '0')}:${formData.parentMinute.padStart(2, '0')}`

      // Resolve birth place
      const resolvedBirthPlace = formData.birthPlace === 'other'
        ? formData.birthPlaceCustom
        : formData.birthPlace || undefined;

      sessionStorage.setItem('sajuInput', JSON.stringify({
        // Child
        name: formData.name,
        birthDate: childBirthDate,
        birthTime: childBirthTime,
        gender: formData.gender,
        calendar: formData.calendar,
        unknownTime: formData.unknownTime,
        // Location
        birthPlace: resolvedBirthPlace || undefined,
        // Twin
        isTwin: formData.isTwin || undefined,
        twinOrder: formData.isTwin && formData.twinOrder ? parseInt(formData.twinOrder) : undefined,
        twinSiblingName: formData.isTwin && formData.twinSiblingName ? formData.twinSiblingName : undefined,
        // Parent
        parentRole: formData.parentRole,
        parentName: formData.parentName,
        parentBirthDate,
        parentBirthTime,
        parentCalendar: formData.parentCalendar,
        parentUnknownTime: formData.parentUnknownTime
      }))

      router.push('/saju/results')
    } catch (error) {
      console.error('Error:', error)
      setIsSubmitting(false)
    }
  }

  const handleUnknownTime = (checked: boolean, isParent: boolean = false) => {
    if (isParent) {
      setFormData(prev => ({
        ...prev,
        parentUnknownTime: checked,
        parentHour: checked ? '12' : '',
        parentMinute: checked ? '00' : ''
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        unknownTime: checked,
        hour: checked ? '12' : '',
        minute: checked ? '00' : ''
      }))
    }
  }

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const canProceedStep1 = formData.name && formData.gender
  const canProceedStep2 = formData.year && formData.month && formData.day && formData.calendar
  const canProceedStep3 = formData.unknownTime || (formData.hour && formData.minute)
  const canProceedStep4 = formData.parentRole && formData.parentYear && formData.parentMonth && formData.parentDay
  const canProceedStep5 = (formData.parentUnknownTime || (formData.parentHour && formData.parentMinute)) && formData.privacyAgreed && formData.ageVerified

  const childZodiacInfo = getZodiacInfo(formData.year)
  const parentZodiacInfo = getZodiacInfo(formData.parentYear)

  const s = t.sajuInput
  const stepTitles = s.steps

  return (
    <div style={{ minHeight: '100vh', background: '#FDFCFA' }}>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #F3F4F6'
      }}>
        <div style={{
          maxWidth: '36rem',
          margin: '0 auto',
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '50%',
              background: '#1A3D2E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>☯</span>
            </div>
            <span style={{ fontFamily: 'serif', fontSize: '1.25rem', color: '#1A3D2E' }}>SoMyung</span>
          </Link>
          <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            {step} / {totalSteps} {s.stepOf}
          </span>
        </div>
      </header>

      {/* Progress Bar */}
      <div style={{ maxWidth: '36rem', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{
          height: '4px',
          width: '100%',
          background: '#F3F4F6',
          borderRadius: '9999px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            background: '#B8922D',
            transition: 'width 0.5s ease-out',
            borderRadius: '9999px',
            width: `${progress}%`
          }} />
        </div>
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: '36rem', margin: '0 auto', padding: '2rem 1.5rem 6rem' }}>
        {/* Loading Overlay */}
        {isSubmitting && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ position: 'relative', width: '6rem', height: '6rem', marginBottom: '2rem' }}>
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
                fontSize: '1.875rem'
              }}>✨</div>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1A3D2E', marginBottom: '0.5rem' }}>
              {s.analyzing}
            </h3>
            <p style={{ color: '#6B7280' }}>
              {s.analyzingDesc(formData.name)}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step Header */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '1rem',
              background: '#F8F6F3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              fontSize: '1.5rem'
            }}>
              {stepTitles[step - 1].icon}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1A3D2E', marginBottom: '0.5rem' }}>
              {stepTitles[step - 1].title}
            </h1>
            <p style={{ color: '#6B7280' }}>
              {stepTitles[step - 1].subtitle}
            </p>
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{
                background: '#FFFFFF',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid #F3F4F6',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                {/* Name */}
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', color: '#1A3D2E', marginBottom: '0.75rem', fontWeight: 600 }}>
                    {s.childName}
                  </label>
                  <input
                    type="text"
                    placeholder={s.childNamePlaceholder}
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    style={{
                      width: '100%',
                      fontSize: '1.125rem',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #E5E7EB',
                      background: '#F8F6F3',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                  />
                </div>

                {/* Gender */}
                <div>
                  <label style={{ display: 'block', color: '#1A3D2E', marginBottom: '0.75rem', fontWeight: 600 }}>
                    {s.gender}
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, gender: 'male' }))}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.5rem',
                        borderRadius: '0.75rem',
                        border: formData.gender === 'male' ? '2px solid #5A7A66' : '2px solid #E5E7EB',
                        background: formData.gender === 'male' ? 'rgba(74, 99, 84, 0.05)' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👦</span>
                      <span style={{ fontWeight: 600, color: '#1A3D2E' }}>{s.male}</span>
                      {formData.gender === 'male' && (
                        <div style={{
                          position: 'absolute',
                          top: '0.75rem',
                          right: '0.75rem',
                          width: '1.25rem',
                          height: '1.25rem',
                          borderRadius: '50%',
                          background: '#5A7A66',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}>
                          <CheckIcon />
                        </div>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, gender: 'female' }))}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.5rem',
                        borderRadius: '0.75rem',
                        border: formData.gender === 'female' ? '2px solid #A85544' : '2px solid #E5E7EB',
                        background: formData.gender === 'female' ? 'rgba(178, 94, 84, 0.05)' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👧</span>
                      <span style={{ fontWeight: 600, color: '#1A3D2E' }}>{s.female}</span>
                      {formData.gender === 'female' && (
                        <div style={{
                          position: 'absolute',
                          top: '0.75rem',
                          right: '0.75rem',
                          width: '1.25rem',
                          height: '1.25rem',
                          borderRadius: '50%',
                          background: '#A85544',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}>
                          <CheckIcon />
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={nextStep}
                disabled={!canProceedStep1}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: canProceedStep1 ? 'pointer' : 'not-allowed',
                  background: canProceedStep1 ? '#1A3D2E' : '#F3F4F6',
                  color: canProceedStep1 ? '#FFFFFF' : '#9CA3AF',
                  transition: 'all 0.2s'
                }}
              >
                {s.nextStep}
              </button>
            </div>
          )}

          {/* Step 2: Birth Date */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{
                background: '#FFFFFF',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid #F3F4F6',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                {/* Calendar Type */}
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', color: '#1A3D2E', marginBottom: '0.75rem', fontWeight: 600 }}>
                    {s.calendarType}
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', background: '#F8F6F3', padding: '0.25rem', borderRadius: '0.75rem' }}>
                    {['solar', 'lunar'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, calendar: type }))}
                        style={{
                          flex: 1,
                          textAlign: 'center',
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          background: formData.calendar === type ? '#FFFFFF' : 'transparent',
                          color: formData.calendar === type ? '#1A3D2E' : '#6B7280',
                          fontWeight: formData.calendar === type ? 600 : 400,
                          boxShadow: formData.calendar === type ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                      >
                        {type === 'solar' ? s.solar : s.lunar}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.5rem' }}>{s.calendarHint}</p>
                </div>

                {/* Birth Date */}
                <div>
                  <label style={{ display: 'block', color: '#1A3D2E', marginBottom: '0.75rem', fontWeight: 600 }}>
                    {s.birthDate}
                  </label>
                  <input
                    type="date"
                    value={formData.year && formData.month && formData.day
                      ? `${formData.year}-${formData.month.padStart(2, '0')}-${formData.day.padStart(2, '0')}`
                      : ''}
                    onChange={e => {
                      const [year, month, day] = e.target.value.split('-')
                      setFormData(prev => ({
                        ...prev,
                        year: year || '',
                        month: month ? String(parseInt(month)) : '',
                        day: day ? String(parseInt(day)) : ''
                      }))
                    }}
                    min="1995-01-01"
                    max="2025-12-31"
                    style={{
                      width: '100%',
                      fontSize: '1.125rem',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #E5E7EB',
                      background: '#F8F6F3',
                      outline: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.5rem' }}>
                    {s.birthDateHint}
                  </p>
                </div>

                {/* Zodiac Preview */}
                {childZodiacInfo && (
                  <div style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    background: '#F8F6F3',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(197, 160, 89, 0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '2.5rem' }}>{childZodiacInfo.branch.icon}</span>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>{s.zodiacLabel}</div>
                        <div style={{ fontWeight: 700, color: '#1A3D2E' }}>{childZodiacInfo.branch.animal}{s.zodiacSuffix}</div>
                      </div>
                      <div style={{ width: '1px', height: '2rem', background: '#E5E7EB' }} />
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>{s.fiveElements}</div>
                        <div style={{ fontWeight: 700, color: childZodiacInfo.stem.colorCode }}>
                          {childZodiacInfo.stem.element}({childZodiacInfo.stem.colorName})
                        </div>
                      </div>
                    </div>
                    <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#4B5563' }}>
                      {s.yearBornZodiac(formData.year, childZodiacInfo.branch.animal)}
                    </p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={prevStep}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    border: '2px solid #E5E7EB',
                    background: 'transparent',
                    color: '#4B5563',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {s.prevStep}
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceedStep2}
                  style={{
                    flex: 2,
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: canProceedStep2 ? 'pointer' : 'not-allowed',
                    background: canProceedStep2 ? '#1A3D2E' : '#F3F4F6',
                    color: canProceedStep2 ? '#FFFFFF' : '#9CA3AF',
                    transition: 'all 0.2s'
                  }}
                >
                  {s.nextStep}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Child Birth Time */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{
                background: '#FFFFFF',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid #F3F4F6',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                {/* Time Input */}
                <div>
                  <label style={{ display: 'block', color: '#1A3D2E', marginBottom: '0.75rem', fontWeight: 600 }}>
                    {s.childBirthTime}
                  </label>
                  <input
                    type="time"
                    value={formData.hour && formData.minute
                      ? `${formData.hour.padStart(2, '0')}:${formData.minute.padStart(2, '0')}`
                      : ''}
                    onChange={e => {
                      const [hour, minute] = e.target.value.split(':')
                      setFormData(prev => ({
                        ...prev,
                        hour: hour ? String(parseInt(hour)) : '',
                        minute: minute ? String(parseInt(minute)) : ''
                      }))
                    }}
                    disabled={formData.unknownTime}
                    style={{
                      width: '100%',
                      fontSize: '1.125rem',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #E5E7EB',
                      background: '#F8F6F3',
                      outline: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      opacity: formData.unknownTime ? 0.4 : 1,
                      marginBottom: '1rem'
                    }}
                  />

                  {/* Unknown Time */}
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: formData.unknownTime ? '2px solid #B8922D' : '2px solid #E5E7EB',
                    background: formData.unknownTime ? 'rgba(197, 160, 89, 0.05)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.unknownTime}
                      onChange={e => handleUnknownTime(e.target.checked, false)}
                      style={{ width: '1.25rem', height: '1.25rem', accentColor: '#B8922D' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: '#1A3D2E' }}>{s.unknownTime}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>{s.unknownTimeDesc}</div>
                    </div>
                  </label>

                  <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.75rem' }}>
                    {s.timeHint}
                  </p>
                </div>
              </div>

              {/* Birth Place (optional) */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid #F3F4F6',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <label style={{ display: 'block', color: '#1A3D2E', marginBottom: '0.75rem', fontWeight: 600 }}>
                  {s.birthPlace} <span style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 400 }}>(선택)</span>
                </label>
                <select
                  value={formData.birthPlace}
                  onChange={e => setFormData(prev => ({ ...prev, birthPlace: e.target.value, birthPlaceCustom: '' }))}
                  style={{
                    width: '100%',
                    fontSize: '1rem',
                    padding: '0.875rem',
                    borderRadius: '0.75rem',
                    border: '1px solid #E5E7EB',
                    background: '#F8F6F3',
                    outline: 'none',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    color: formData.birthPlace ? '#1A3D2E' : '#9CA3AF'
                  }}
                >
                  {s.birthPlaceOptions.map((opt: { value: string; label: string }) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {formData.birthPlace === 'other' && (
                  <input
                    type="text"
                    placeholder={s.birthPlaceCustom}
                    value={formData.birthPlaceCustom}
                    onChange={e => setFormData(prev => ({ ...prev, birthPlaceCustom: e.target.value }))}
                    style={{
                      width: '100%',
                      fontSize: '1rem',
                      padding: '0.875rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #E5E7EB',
                      background: '#F8F6F3',
                      outline: 'none',
                      marginTop: '0.75rem'
                    }}
                  />
                )}
                <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.5rem' }}>
                  {s.birthPlaceHint}
                </p>
              </div>

              {/* Twin (optional) */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid #F3F4F6',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  border: formData.isTwin ? '2px solid #B8922D' : '2px solid #E5E7EB',
                  background: formData.isTwin ? 'rgba(197, 160, 89, 0.05)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.isTwin}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      isTwin: e.target.checked,
                      twinOrder: e.target.checked ? prev.twinOrder : '',
                      twinSiblingName: e.target.checked ? prev.twinSiblingName : ''
                    }))}
                    style={{ width: '1.25rem', height: '1.25rem', accentColor: '#B8922D' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: '#1A3D2E' }}>{s.twinYes}</div>
                  </div>
                </label>

                {formData.isTwin && (
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label style={{ display: 'block', color: '#1A3D2E', fontWeight: 600, fontSize: '0.875rem' }}>
                      {s.twinOrder}
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, twinOrder: '1' }))}
                        style={{
                          padding: '0.875rem',
                          borderRadius: '0.75rem',
                          border: formData.twinOrder === '1' ? '2px solid #B8922D' : '2px solid #E5E7EB',
                          background: formData.twinOrder === '1' ? 'rgba(197, 160, 89, 0.05)' : '#FFFFFF',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: formData.twinOrder === '1' ? 600 : 400,
                          color: '#1A3D2E',
                          transition: 'all 0.2s'
                        }}
                      >
                        {s.twinFirst}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, twinOrder: '2' }))}
                        style={{
                          padding: '0.875rem',
                          borderRadius: '0.75rem',
                          border: formData.twinOrder === '2' ? '2px solid #B8922D' : '2px solid #E5E7EB',
                          background: formData.twinOrder === '2' ? 'rgba(197, 160, 89, 0.05)' : '#FFFFFF',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: formData.twinOrder === '2' ? 600 : 400,
                          color: '#1A3D2E',
                          transition: 'all 0.2s'
                        }}
                      >
                        {s.twinSecond}
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder={s.twinSiblingNamePlaceholder}
                      value={formData.twinSiblingName}
                      onChange={e => setFormData(prev => ({ ...prev, twinSiblingName: e.target.value }))}
                      style={{
                        width: '100%',
                        fontSize: '1rem',
                        padding: '0.875rem',
                        borderRadius: '0.75rem',
                        border: '1px solid #E5E7EB',
                        background: '#F8F6F3',
                        outline: 'none'
                      }}
                    />
                    <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{s.twinHint}</p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={prevStep}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    border: '2px solid #E5E7EB',
                    background: 'transparent',
                    color: '#4B5563',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {s.prevStep}
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceedStep3}
                  style={{
                    flex: 2,
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: canProceedStep3 ? 'pointer' : 'not-allowed',
                    background: canProceedStep3 ? '#1A3D2E' : '#F3F4F6',
                    color: canProceedStep3 ? '#FFFFFF' : '#9CA3AF',
                    transition: 'all 0.2s'
                  }}
                >
                  {s.nextStep}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Parent Info */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{
                background: '#FFFFFF',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid #F3F4F6',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                {/* Parent Role Selection */}
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', color: '#1A3D2E', marginBottom: '0.75rem', fontWeight: 600 }}>
                    {s.parentRoleQuestion}
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, parentRole: 'mother' }))}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.5rem',
                        borderRadius: '0.75rem',
                        border: formData.parentRole === 'mother' ? '2px solid #A85544' : '2px solid #E5E7EB',
                        background: formData.parentRole === 'mother' ? 'rgba(178, 94, 84, 0.05)' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👩</span>
                      <span style={{ fontWeight: 600, color: '#1A3D2E' }}>{s.mother}</span>
                      {formData.parentRole === 'mother' && (
                        <div style={{
                          position: 'absolute',
                          top: '0.75rem',
                          right: '0.75rem',
                          width: '1.25rem',
                          height: '1.25rem',
                          borderRadius: '50%',
                          background: '#A85544',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}>
                          <CheckIcon />
                        </div>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, parentRole: 'father' }))}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.5rem',
                        borderRadius: '0.75rem',
                        border: formData.parentRole === 'father' ? '2px solid #5A7A66' : '2px solid #E5E7EB',
                        background: formData.parentRole === 'father' ? 'rgba(74, 99, 84, 0.05)' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👨</span>
                      <span style={{ fontWeight: 600, color: '#1A3D2E' }}>{s.father}</span>
                      {formData.parentRole === 'father' && (
                        <div style={{
                          position: 'absolute',
                          top: '0.75rem',
                          right: '0.75rem',
                          width: '1.25rem',
                          height: '1.25rem',
                          borderRadius: '50%',
                          background: '#5A7A66',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}>
                          <CheckIcon />
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Parent Birth Date */}
                {formData.parentRole && (
                  <>
                    <div style={{ height: '1px', width: '100%', background: '#F3F4F6', margin: '1.5rem 0' }} />

                    {/* Calendar Type */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', color: '#1A3D2E', marginBottom: '0.75rem', fontWeight: 600 }}>
                        {s.calendarType}
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem', background: '#F8F6F3', padding: '0.25rem', borderRadius: '0.75rem' }}>
                        {['solar', 'lunar'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, parentCalendar: type }))}
                            style={{
                              flex: 1,
                              textAlign: 'center',
                              padding: '0.75rem',
                              borderRadius: '0.5rem',
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              background: formData.parentCalendar === type ? '#FFFFFF' : 'transparent',
                              color: formData.parentCalendar === type ? '#1A3D2E' : '#6B7280',
                              fontWeight: formData.parentCalendar === type ? 600 : 400,
                              boxShadow: formData.parentCalendar === type ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                          >
                            {type === 'solar' ? s.solar : s.lunar}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Parent Birth Date */}
                    <div>
                      <label style={{ display: 'block', color: '#1A3D2E', marginBottom: '0.75rem', fontWeight: 600 }}>
                        {s.parentBirthDate(formData.parentRole === 'mother' ? s.mother : s.father)}
                      </label>
                      <input
                        type="date"
                        value={formData.parentYear && formData.parentMonth && formData.parentDay
                          ? `${formData.parentYear}-${formData.parentMonth.padStart(2, '0')}-${formData.parentDay.padStart(2, '0')}`
                          : ''}
                        onChange={e => {
                          const [year, month, day] = e.target.value.split('-')
                          setFormData(prev => ({
                            ...prev,
                            parentYear: year || '',
                            parentMonth: month ? String(parseInt(month)) : '',
                            parentDay: day ? String(parseInt(day)) : ''
                          }))
                        }}
                        min="1945-01-01"
                        max="2005-12-31"
                        style={{
                          width: '100%',
                          fontSize: '1.125rem',
                          padding: '1rem',
                          borderRadius: '0.75rem',
                          border: '1px solid #E5E7EB',
                          background: '#F8F6F3',
                          outline: 'none',
                          cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}
                      />
                    </div>

                    {/* Parent Zodiac Preview */}
                    {parentZodiacInfo && (
                      <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: '#F8F6F3',
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(197, 160, 89, 0.2)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '1.875rem' }}>{parentZodiacInfo.branch.icon}</span>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>{s.zodiacLabel}</div>
                            <div style={{ fontWeight: 700, color: '#1A3D2E' }}>{parentZodiacInfo.branch.animal}{s.zodiacSuffix}</div>
                          </div>
                          <div style={{ width: '1px', height: '2rem', background: '#E5E7EB' }} />
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>{s.fiveElements}</div>
                            <div style={{ fontWeight: 700, color: parentZodiacInfo.stem.colorCode }}>
                              {parentZodiacInfo.stem.element}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={prevStep}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    border: '2px solid #E5E7EB',
                    background: 'transparent',
                    color: '#4B5563',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {s.prevStep}
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceedStep4}
                  style={{
                    flex: 2,
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: canProceedStep4 ? 'pointer' : 'not-allowed',
                    background: canProceedStep4 ? '#1A3D2E' : '#F3F4F6',
                    color: canProceedStep4 ? '#FFFFFF' : '#9CA3AF',
                    transition: 'all 0.2s'
                  }}
                >
                  {s.nextStep}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Parent Time & Agreements */}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Parent Birth Time */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid #F3F4F6',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', color: '#1A3D2E', marginBottom: '0.75rem', fontWeight: 600 }}>
                    {s.parentBirthTime(formData.parentRole === 'mother' ? s.mother : s.father)}
                  </label>
                  <input
                    type="time"
                    value={formData.parentHour && formData.parentMinute
                      ? `${formData.parentHour.padStart(2, '0')}:${formData.parentMinute.padStart(2, '0')}`
                      : ''}
                    onChange={e => {
                      const [hour, minute] = e.target.value.split(':')
                      setFormData(prev => ({
                        ...prev,
                        parentHour: hour ? String(parseInt(hour)) : '',
                        parentMinute: minute ? String(parseInt(minute)) : ''
                      }))
                    }}
                    disabled={formData.parentUnknownTime}
                    style={{
                      width: '100%',
                      fontSize: '1.125rem',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #E5E7EB',
                      background: '#F8F6F3',
                      outline: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      opacity: formData.parentUnknownTime ? 0.4 : 1,
                      marginBottom: '1rem'
                    }}
                  />

                  {/* Unknown Time */}
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: formData.parentUnknownTime ? '2px solid #B8922D' : '2px solid #E5E7EB',
                    background: formData.parentUnknownTime ? 'rgba(197, 160, 89, 0.05)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.parentUnknownTime}
                      onChange={e => handleUnknownTime(e.target.checked, true)}
                      style={{ width: '1.25rem', height: '1.25rem', accentColor: '#B8922D' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: '#1A3D2E' }}>{s.unknownTime}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>{s.unknownTimeDesc}</div>
                    </div>
                  </label>
                </div>

                {/* Summary */}
                <div style={{ padding: '1rem', background: '#F8F6F3', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontWeight: 600, color: '#1A3D2E', marginBottom: '0.75rem' }}>{s.summaryTitle}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6B7280' }}>{s.summaryChild}</span>
                      <span style={{ color: '#1A3D2E', fontWeight: 500 }}>{formData.name} ({formData.gender === 'male' ? s.genderShortMale : s.genderShortFemale})</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6B7280' }}>{s.summaryChildBirth}</span>
                      <span style={{ color: '#1A3D2E', fontWeight: 500 }}>{formData.year}.{formData.month}.{formData.day}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6B7280' }}>{s.summaryParentBirth(formData.parentRole === 'mother' ? s.mother : s.father)}</span>
                      <span style={{ color: '#1A3D2E', fontWeight: 500 }}>{formData.parentYear}.{formData.parentMonth}.{formData.parentDay}</span>
                    </div>
                  </div>
                </div>

                <div style={{ height: '1px', width: '100%', background: '#F3F4F6', margin: '1.5rem 0' }} />

                {/* Agreements */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Age Verification */}
                  <label style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: formData.ageVerified ? '2px solid #5A7A66' : '2px solid #E5E7EB',
                    background: formData.ageVerified ? 'rgba(74, 99, 84, 0.05)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.ageVerified}
                      onChange={e => setFormData(prev => ({ ...prev, ageVerified: e.target.checked }))}
                      style={{ width: '1.25rem', height: '1.25rem', accentColor: '#5A7A66', marginTop: '0.125rem' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: '#1A3D2E' }}>
                        {s.ageVerification} <span style={{ color: '#A85544' }}>*</span>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                        {s.ageVerificationDesc}
                      </div>
                    </div>
                  </label>

                  {/* Privacy Agreement */}
                  <label style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: formData.privacyAgreed ? '2px solid #5A7A66' : '2px solid #E5E7EB',
                    background: formData.privacyAgreed ? 'rgba(74, 99, 84, 0.05)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.privacyAgreed}
                      onChange={e => setFormData(prev => ({ ...prev, privacyAgreed: e.target.checked }))}
                      style={{ width: '1.25rem', height: '1.25rem', accentColor: '#5A7A66', marginTop: '0.125rem' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: '#1A3D2E' }}>
                        {s.privacyAgreement} <span style={{ color: '#A85544' }}>*</span>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6B7280', lineHeight: 1.6 }}>
                        {s.privacyAgreementDesc}
                        <a href="/privacy" style={{ color: '#B8922D', textDecoration: 'underline', marginLeft: '0.25rem' }}>{s.privacyLink}</a>
                      </div>
                    </div>
                  </label>

                  {/* Marketing (Optional) */}
                  <label style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: formData.marketingAgreed ? '2px solid #B8922D' : '2px solid #E5E7EB',
                    background: formData.marketingAgreed ? 'rgba(197, 160, 89, 0.05)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.marketingAgreed}
                      onChange={e => setFormData(prev => ({ ...prev, marketingAgreed: e.target.checked }))}
                      style={{ width: '1.25rem', height: '1.25rem', accentColor: '#B8922D', marginTop: '0.125rem' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: '#1A3D2E' }}>{s.marketingAgreement}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                        {s.marketingAgreementDesc}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={prevStep}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    border: '2px solid #E5E7EB',
                    background: 'transparent',
                    color: '#4B5563',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {s.prevStep}
                </button>
                <button
                  type="submit"
                  disabled={!canProceedStep5 || isSubmitting}
                  style={{
                    flex: 2,
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: (canProceedStep5 && !isSubmitting) ? 'pointer' : 'not-allowed',
                    background: (canProceedStep5 && !isSubmitting) ? '#B8922D' : '#F3F4F6',
                    color: (canProceedStep5 && !isSubmitting) ? '#FFFFFF' : '#9CA3AF',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {s.analyzeButton}
                  <span>✨</span>
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Trust Indicators */}
        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', fontSize: '0.75rem', color: '#9CA3AF', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {s.trustSecure}
            </span>
            <span>·</span>
            <span>{s.trustBeta}</span>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
