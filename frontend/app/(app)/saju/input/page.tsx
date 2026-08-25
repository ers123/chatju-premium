'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/app/lib/i18n/context'
import { localizedLegalPath } from '@/app/lib/i18n/routes'
import { doorframeCopy, pencilFontStyle } from '@/app/lib/i18n/doorframe'
import { formatBirthDateForDisplay } from '@/app/lib/date-display'
import { YinYangIcon } from '@/components/ui/YinYangIcon'
import { Rail, type RailMark } from '@/components/doorframe/Rail'
import { Button } from '@/components/ui/Button'
import { IconLock, IconArrow } from '@/components/ui/pencil-icons'

// Consent policy version recorded with required agreements
const POLICY_VERSION = '2026-06-12'

// Birth date bounds: today (no future births) back to 18 years ago
const getTodayStr = () => new Date().toISOString().split('T')[0]
const getMinBirthDateStr = () => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 18)
  return d.toISOString().split('T')[0]
}

// Saju helpers — language-independent data, display names come from translations
const getZodiacInfo = (yearStr: string, monthStr?: string, dayStr?: string) => {
  const year = parseInt(yearStr)
  if (isNaN(year) || year < 1900 || year > 2100) return null
  const month = monthStr ? parseInt(monthStr) : NaN
  const day = dayStr ? parseInt(dayStr) : NaN
  const effectiveYear = !isNaN(month) && !isNaN(day) && (month < 2 || (month === 2 && day <= 4))
    ? year - 1
    : year

  const stems = [
    { key: 'metal', colorCode: '#6B7578' },
    { key: 'metal', colorCode: '#6B7578' },
    { key: 'water', colorCode: '#556B7E' },
    { key: 'water', colorCode: '#556B7E' },
    { key: 'wood', colorCode: '#5A7A66' },
    { key: 'wood', colorCode: '#5A7A66' },
    { key: 'fire', colorCode: '#A85544' },
    { key: 'fire', colorCode: '#A85544' },
    { key: 'earth', colorCode: '#BBA575' },
    { key: 'earth', colorCode: '#BBA575' },
  ]

  // Zodiac animals are content (the child's sign), not interface icons —
  // they stay as emoji deliberately; the anti-slop gate bans icon emoji only.
  const branches = [
    { key: 'monkey', icon: '🐵' },
    { key: 'rooster', icon: '🐔' },
    { key: 'dog', icon: '🐶' },
    { key: 'pig', icon: '🐷' },
    { key: 'rat', icon: '🐭' },
    { key: 'ox', icon: '🐮' },
    { key: 'tiger', icon: '🐯' },
    { key: 'rabbit', icon: '🐰' },
    { key: 'dragon', icon: '🐲' },
    { key: 'snake', icon: '🐍' },
    { key: 'horse', icon: '🐴' },
    { key: 'sheep', icon: '🐑' },
  ]

  return { stem: stems[effectiveYear % 10], branch: branches[effectiveYear % 12] }
}

export default function InputFormPage() {
  const router = useRouter()
  const { lang, t } = useLanguage()
  useEffect(() => { document.title = t.sajuInput.pageTitle }, [t])
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
    parentCalendar: 'solar',
    parentYear: '',
    parentMonth: '',
    parentDay: '',
    parentHour: '',
    parentMinute: '',
    parentUnknownTime: false,
    // Agreements
    privacyAgreed: false,
    overseasProcessingAgreed: false,
    ageVerified: false,
    guardianConfirmed: false,
    marketingAgreed: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dateError, setDateError] = useState('')
  const [parentDateError, setParentDateError] = useState('')

  const todayStr = getTodayStr()
  const minBirthDateStr = getMinBirthDateStr()
  const invalidDateMsg = (t as any).input?.invalidDate
    || (t.sajuInput as any).invalidDate
    || 'Birth date cannot be in the future.'

  const totalSteps = 5

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Reject out-of-range birth dates (JS guard in addition to the input's
    // min/max attributes). The lower bound matters as much as the upper one: a
    // native date input will happily hand back year 0019 for a two-digit entry.
    const isoBirthDate = `${formData.year}-${formData.month.padStart(2, '0')}-${formData.day.padStart(2, '0')}`
    if (isoBirthDate > todayStr || isoBirthDate < minBirthDateStr) {
      setDateError(invalidDateMsg)
      setStep(2)
      return
    }

    if (parentDateError) return

    setIsSubmitting(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Child birth info — when birth time is unknown, send the flag instead of substituting noon
      const childBirthDate = `${formData.year}.${formData.month.padStart(2, '0')}.${formData.day.padStart(2, '0')}`
      const childBirthTime = formData.unknownTime ? undefined : `${formData.hour.padStart(2, '0')}:${formData.minute.padStart(2, '0')}`

      // Parent birth info is optional for privacy/data minimization.
      const hasParentProfile = !!(formData.parentRole && formData.parentYear && formData.parentMonth && formData.parentDay)
      const parentBirthDate = hasParentProfile
        ? `${formData.parentYear}.${formData.parentMonth.padStart(2, '0')}.${formData.parentDay.padStart(2, '0')}`
        : undefined
      const parentBirthTime = hasParentProfile
        ? (formData.parentUnknownTime ? '12:00' : `${formData.parentHour.padStart(2, '0')}:${formData.parentMinute.padStart(2, '0')}`)
        : undefined

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
        parentRole: hasParentProfile ? formData.parentRole : undefined,
        parentBirthDate,
        parentBirthTime,
        parentCalendar: hasParentProfile ? formData.parentCalendar : undefined,
        parentUnknownTime: hasParentProfile ? formData.parentUnknownTime : undefined,
        // Consent record (transmitted with /saju/calculate)
        consent: {
          dataProcessing: formData.privacyAgreed,
          // Cross-border transfer to AI/cloud processors is a SEPARATE consent
          // in law (PIPA §28-8, GDPR Art 13(1)(f)/49) and the UI already asks
          // for it separately. It used to be AND-ed into dataProcessing, which
          // meant the record could not answer "did they consent to the transfer?"
          // — the two were indistinguishable once merged.
          crossBorder: formData.overseasProcessingAgreed,
          // Legal-representative consent for the child (PIPA/COPPA/GDPR basis).
          // Distinct from the user's own 14+ age attestation (userAge14).
          guardian: formData.guardianConfirmed,
          userAge14: formData.ageVerified,
          marketing: formData.marketingAgreed,
          policyVersion: POLICY_VERSION,
          timestamp: new Date().toISOString()
        }
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
        hour: '',
        minute: ''
      }))
    }
  }

  const nextStep = () => { if (step < totalSteps) setStep(step + 1) }
  const prevStep = () => { if (step > 1) setStep(step - 1) }

  const clearParentInfo = () => {
    setFormData(prev => ({
      ...prev,
      parentRole: '',
      parentCalendar: 'solar',
      parentYear: '',
      parentMonth: '',
      parentDay: '',
      parentHour: '',
      parentMinute: '',
      parentUnknownTime: false,
    }))
  }

  const canProceedStep1 = formData.name && formData.gender
  const canProceedStep2 = formData.year && formData.month && formData.day && formData.calendar && !dateError
  const canProceedStep3 = formData.unknownTime || (formData.hour && formData.minute)
  const parentDateComplete = !!(formData.parentRole && formData.parentYear && formData.parentMonth && formData.parentDay)
  const parentTimeComplete = formData.parentUnknownTime || (formData.parentHour && formData.parentMinute)
  const canProceedStep4 = !formData.parentRole || parentDateComplete
  const canProceedStep5 = (!parentDateComplete || parentTimeComplete) && formData.privacyAgreed && formData.overseasProcessingAgreed && formData.ageVerified && formData.guardianConfirmed

  const childZodiacInfo = getZodiacInfo(formData.year, formData.month, formData.day)
  const parentZodiacInfo = getZodiacInfo(formData.parentYear, formData.parentMonth, formData.parentDay)

  const s = t.sajuInput
  const df = doorframeCopy(lang)

  // 비활성 버튼은 왜 눌리지 않는지 말해 주지 않는다. QA에서 부모 출생 시간을 비워 둔
  // 채 5단계에 도착한 사람이 회색 버튼 앞에서 멈췄고, 화면 어디에도 이유가 없었다.
  // 막힌 단계에서 무엇이 비었는지 이름으로 알려 준다.
  const parentLabel = formData.parentRole === 'mother' ? s.mother : s.father
  const missingFields: Record<number, string[]> = {
    1: [!formData.name && s.childName, !formData.gender && s.gender].filter(Boolean) as string[],
    // 날짜 오류(미래·범위 밖)는 입력 바로 아래에 이미 자기 문구로 뜬다.
    2: [!(formData.year && formData.month && formData.day) && s.birthDate].filter(Boolean) as string[],
    3: [!canProceedStep3 && s.childBirthTime].filter(Boolean) as string[],
    4: [!canProceedStep4 && s.parentBirthDate(parentLabel)].filter(Boolean) as string[],
    5: [
      parentDateComplete && !parentTimeComplete && s.parentBirthTime(parentLabel),
      !formData.ageVerified && s.ageVerification,
      !formData.guardianConfirmed && s.guardianConfirmation,
      !formData.privacyAgreed && s.privacyAgreement,
      !formData.overseasProcessingAgreed && s.overseasProcessingAgreement,
    ].filter(Boolean) as string[],
  }

  // 컴포넌트가 아니라 그냥 조각을 돌려주는 함수다. 렌더 안에서 컴포넌트를 정의하면
  // 매 렌더마다 새 타입이 되어 상태가 초기화된다(react-hooks/static-components).
  const missingHint = (hintStep: number) => {
    const fields = missingFields[hintStep]
    if (!fields || fields.length === 0) return null
    return (
      <p role="status" className="mt-3 text-[13px] text-center [color:var(--df-muted)]">
        {s.missingRequired(fields.join(', '))}
      </p>
    )
  }

  // --- Rail marks: the form's whole point — inputs leave a trace ------------
  const childYm = formData.year
    ? `${formData.year}${formData.month ? '.' + formData.month.padStart(2, '0') : ''}`
    : '····'
  const parentShort = formData.parentRole === 'mother' ? df.motherShort : df.fatherShort
  const parentYm = formData.parentYear
    ? `${formData.parentYear}${formData.parentMonth ? '.' + formData.parentMonth.padStart(2, '0') : ''}`
    : '····'
  const railMarks: RailMark[] = [
    {
      id: 'parent',
      top: 26,
      label: `${parentShort} — ${parentYm}`,
      hidden: !formData.parentRole,
    },
    {
      id: 'child',
      top: 58,
      label: `${formData.name || df.childFallback} — ${childYm}`,
      isNew: true,
      hidden: !formData.name && !formData.year,
    },
    {
      id: 'twin',
      top: 70,
      label: `${formData.twinSiblingName || ''} — ${childYm}`,
      hidden: !(formData.isTwin && formData.twinSiblingName),
    },
  ]

  const q = df.q[step - 1]

  const animalName = (key: string) =>
    (s.animals as Record<string, string>)?.[key] || key
  const elementName = (key: string) =>
    (s.elements as Record<string, string>)?.[key] || key

  return (
    <div className="min-h-dvh [background:var(--df-wall)]" style={pencilFontStyle(lang)}>
      {/* Casting overlay — the four pillars are drawn, one by one */}
      {isSubmitting && (
        <div className="df-cast" role="status">
          <div className="df-cast__marks" aria-hidden>
            {df.pillars.map((p, i) => (
              <div className="df-cast__pillar" key={p}>
                <i className="df-cast__line" style={{ animationDelay: `${i * 0.35}s` }} />
                <span className="df-cast__name">{p}</span>
              </div>
            ))}
          </div>
          <h3 className="text-2xl font-black [color:var(--df-ink)]" style={{ fontFamily: 'Pretendard, sans-serif' }}>
            {s.analyzing}
          </h3>
          <p className="[color:var(--df-muted)]">{s.analyzingDesc(formData.name)}</p>
        </div>
      )}

      <div className="df-form-grid">
        <Rail marks={railMarks} />

        <div className="df-form-body">
          {/* Header row */}
          <div className="flex items-center justify-between mb-9">
            <Link href="/" className="logo-link-dark flex items-center gap-2 no-underline">
              <span className="w-8 h-8 rounded-full grid place-items-center [background:var(--df-ink)]">
                <YinYangIcon size={18} color="#F7F4EE" />
              </span>
              <span className="text-xl [color:var(--df-ink)]" style={{ fontFamily: 'Nanum Myeongjo, serif' }}>SoMyung</span>
            </Link>
            <span className="df-mono text-[11.5px] tracking-[0.18em] [color:var(--df-wood-deep)]">
              {df.markOf(step, totalSteps)}
            </span>
          </div>

          {/* Question headline (E-copy) */}
          <div className="mb-8">
            <h1 className="df-q" style={{ fontFamily: 'Pretendard, sans-serif' }}>{q.title}</h1>
            <p className="df-q-sub">{q.sub}</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: name + gender */}
            {step === 1 && (
              <div className="flex flex-col gap-6">
                <div className="df-panel">
                  <div className="df-field">
                    <label className="df-label" htmlFor="child-name">{s.childName}</label>
                    <input
                      id="child-name"
                      type="text"
                      className="df-input"
                      placeholder={s.childNamePlaceholder}
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <p className={`df-pencil-note mt-2 ${formData.name ? 'is-on' : ''}`} aria-live="polite">
                      {formData.name ? df.noteNameReady(formData.name) : ''}
                    </p>
                  </div>

                  <div>
                    <span className="df-label">{s.gender}</span>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        className="df-tile"
                        aria-pressed={formData.gender === 'male'}
                        onClick={() => setFormData(prev => ({ ...prev, gender: 'male' }))}
                      >
                        <span className="df-tile__big">{s.male}</span>
                      </button>
                      <button
                        type="button"
                        className="df-tile"
                        aria-pressed={formData.gender === 'female'}
                        onClick={() => setFormData(prev => ({ ...prev, gender: 'female' }))}
                      >
                        <span className="df-tile__big">{s.female}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <Button type="button" onClick={nextStep} disabled={!canProceedStep1} className="w-full">
                  {df.drawNext}
                </Button>
                {missingHint(1)}
              </div>
            )}

            {/* Step 2: birth date */}
            {step === 2 && (
              <div className="flex flex-col gap-6">
                <div className="df-panel">
                  <div className="df-field">
                    <span className="df-label">{s.calendarType}</span>
                    <div className="df-seg">
                      {(['solar', 'lunar'] as const).map(type => (
                        <button
                          key={type}
                          type="button"
                          aria-pressed={formData.calendar === type}
                          onClick={() => setFormData(prev => ({ ...prev, calendar: type }))}
                        >
                          {type === 'solar' ? s.solar : s.lunar}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs [color:var(--df-muted)]">{s.calendarHint}</p>
                  </div>

                  <div className="df-field">
                    <label className="df-label" htmlFor="child-birth-date">{s.birthDate}</label>
                    <input
                      id="child-birth-date"
                      type="date"
                      className="df-input"
                      value={formData.year && formData.month && formData.day
                        ? `${formData.year}-${formData.month.padStart(2, '0')}-${formData.day.padStart(2, '0')}`
                        : ''}
                      onChange={e => {
                        const value = e.target.value
                        // Check both ends of the range. A native date input accepts a
                        // two-digit year and stores it literally — typing "19" yields
                        // 0019-06-30, which is earlier than today and so passed a
                        // max-only check, then rendered as "0019.06.30" on the report.
                        setDateError(value && (value > todayStr || value < minBirthDateStr) ? invalidDateMsg : '')
                        const [year, month, day] = value.split('-')
                        setFormData(prev => ({
                          ...prev,
                          year: year || '',
                          month: month ? String(parseInt(month)) : '',
                          day: day ? String(parseInt(day)) : ''
                        }))
                      }}
                      min={minBirthDateStr}
                      max={todayStr}
                      aria-invalid={!!dateError}
                      aria-describedby={dateError ? 'child-birth-date-error' : undefined}
                      style={dateError ? { borderColor: '#A85544' } : undefined}
                    />
                    {dateError && (
                      <p id="child-birth-date-error" role="alert" className="mt-2 text-[13px] font-semibold" style={{ color: '#A85544' }}>
                        {dateError}
                      </p>
                    )}
                    <p className="mt-2 text-xs [color:var(--df-muted)]">{s.birthDateHint}</p>
                  </div>

                  {/* Zodiac — the mark's pencil annotation, not a separate card */}
                  {childZodiacInfo && (
                    <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-dashed px-4 py-3 [border-color:var(--df-hair)] [background:var(--df-wall-deep)]">
                      <span className="text-3xl leading-none" aria-hidden>{childZodiacInfo.branch.icon}</span>
                      <div>
                        <p className="df-pencil-note is-on" style={{ fontSize: '18px' }}>
                          {df.noteZodiac(formData.name || df.childFallback, animalName(childZodiacInfo.branch.key) + s.zodiacSuffix)}
                        </p>
                        <p className="text-[12.5px] mt-0.5 [color:var(--df-muted)]">
                          {s.fiveElements}: <b style={{ color: childZodiacInfo.stem.colorCode }}>{elementName(childZodiacInfo.stem.key)}</b>
                          {' · '}{s.yearBornZodiac(formData.year, animalName(childZodiacInfo.branch.key))}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 items-center">
                  <Button type="button" variant="secondary" onClick={prevStep}>{s.prevStep}</Button>
                  <Button type="button" onClick={nextStep} disabled={!canProceedStep2} className="flex-1">
                    {df.drawNext}
                  </Button>
                </div>
                {missingHint(2)}
              </div>
            )}

            {/* Step 3: birth time + place + twin */}
            {step === 3 && (
              <div className="flex flex-col gap-5">
                <div className="df-panel">
                  <div className="df-field">
                    <label className="df-label" htmlFor="child-birth-time">{s.childBirthTime}</label>
                    <input
                      id="child-birth-time"
                      type="time"
                      className="df-input"
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
                      style={{ opacity: formData.unknownTime ? 0.4 : 1 }}
                    />
                    <p className={`df-pencil-note mt-2 ${(formData.hour || formData.unknownTime) ? 'is-on' : ''}`} aria-live="polite">
                      {formData.unknownTime ? '' : formData.hour ? df.noteHourSet : ''}
                    </p>
                  </div>

                  <label className="df-consent">
                    <input
                      type="checkbox"
                      checked={formData.unknownTime}
                      onChange={e => handleUnknownTime(e.target.checked, false)}
                    />
                    <span>
                      <span className="df-consent__title">{s.unknownTime}</span>
                      <span className="df-consent__desc block">{s.unknownTimeDesc}</span>
                    </span>
                  </label>
                  <p className="mt-3 text-xs [color:var(--df-muted)]">{s.timeHint}</p>
                </div>

                <div className="df-panel">
                  <label className="df-label" htmlFor="birth-place">
                    {s.birthPlace} <span className="font-normal opacity-70">{s.optional}</span>
                  </label>
                  <select
                    id="birth-place"
                    className="df-input cursor-pointer"
                    value={formData.birthPlace}
                    onChange={e => setFormData(prev => ({ ...prev, birthPlace: e.target.value, birthPlaceCustom: '' }))}
                    style={{ color: formData.birthPlace ? undefined : '#B9B29F' }}
                  >
                    {s.birthPlaceOptions.map((opt: { value: string; label: string }) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {formData.birthPlace === 'other' && (
                    <input
                      id="birth-place-custom"
                      type="text"
                      className="df-input mt-3"
                      aria-label={s.birthPlaceCustom}
                      placeholder={s.birthPlaceCustom}
                      value={formData.birthPlaceCustom}
                      onChange={e => setFormData(prev => ({ ...prev, birthPlaceCustom: e.target.value }))}
                    />
                  )}
                  <p className="mt-2 text-xs [color:var(--df-muted)]">{s.birthPlaceHint}</p>
                </div>

                <div className="df-panel">
                  <label className="df-consent">
                    <input
                      type="checkbox"
                      checked={formData.isTwin}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        isTwin: e.target.checked,
                        twinOrder: e.target.checked ? prev.twinOrder : '',
                        twinSiblingName: e.target.checked ? prev.twinSiblingName : ''
                      }))}
                    />
                    <span className="df-consent__title">{s.twinYes}</span>
                  </label>

                  {formData.isTwin && (
                    <div className="mt-4 flex flex-col gap-3">
                      <span className="df-label">{s.twinOrder}</span>
                      <div className="grid grid-cols-2 gap-3">
                        {(['1', '2'] as const).map(order => (
                          <button
                            key={order}
                            type="button"
                            className="df-tile"
                            aria-pressed={formData.twinOrder === order}
                            onClick={() => setFormData(prev => ({ ...prev, twinOrder: order }))}
                          >
                            <span className="df-tile__big">{order === '1' ? s.twinFirst : s.twinSecond}</span>
                          </button>
                        ))}
                      </div>
                      <input
                        id="twin-sibling-name"
                        type="text"
                        className="df-input"
                        aria-label={s.twinSiblingNamePlaceholder}
                        placeholder={s.twinSiblingNamePlaceholder}
                        value={formData.twinSiblingName}
                        onChange={e => setFormData(prev => ({ ...prev, twinSiblingName: e.target.value }))}
                      />
                      <p className="text-xs [color:var(--df-muted)]">{s.twinHint}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 items-center">
                  <Button type="button" variant="secondary" onClick={prevStep}>{s.prevStep}</Button>
                  <Button type="button" onClick={nextStep} disabled={!canProceedStep3} className="flex-1">
                    {df.drawNext}
                  </Button>
                </div>
                {missingHint(3)}
              </div>
            )}

            {/* Step 4: parent info */}
            {step === 4 && (
              <div className="flex flex-col gap-6">
                <div className="df-panel">
                  <span className="df-label">
                    {s.parentRoleQuestion} <span className="font-normal opacity-70">{s.optional}</span>
                  </span>
                  <p className="mb-4 text-[13px] leading-relaxed [color:var(--df-muted)]">{s.parentOptionalHint}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="df-tile"
                      aria-pressed={formData.parentRole === 'mother'}
                      onClick={() => setFormData(prev => ({ ...prev, parentRole: 'mother' }))}
                    >
                      <span className="df-tile__big">{s.mother}</span>
                    </button>
                    <button
                      type="button"
                      className="df-tile"
                      aria-pressed={formData.parentRole === 'father'}
                      onClick={() => setFormData(prev => ({ ...prev, parentRole: 'father' }))}
                    >
                      <span className="df-tile__big">{s.father}</span>
                    </button>
                  </div>
                  {formData.parentRole && (
                    <Button type="button" variant="ghost" onClick={clearParentInfo} className="mt-3 w-full">
                      {s.skipParentInfo}
                    </Button>
                  )}

                  {formData.parentRole && (
                    <>
                      <div className="h-px w-full my-6 [background:var(--df-hair)]" />

                      <div className="df-field">
                        <span className="df-label">{s.calendarType}</span>
                        <div className="df-seg">
                          {(['solar', 'lunar'] as const).map(type => (
                            <button
                              key={type}
                              type="button"
                              aria-pressed={formData.parentCalendar === type}
                              onClick={() => setFormData(prev => ({ ...prev, parentCalendar: type }))}
                            >
                              {type === 'solar' ? s.solar : s.lunar}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="df-field">
                        <label className="df-label" htmlFor="parent-birth-date">
                          {s.parentBirthDate(formData.parentRole === 'mother' ? s.mother : s.father)}
                        </label>
                        <input
                          id="parent-birth-date"
                          type="date"
                          className="df-input"
                          value={formData.parentYear && formData.parentMonth && formData.parentDay
                            ? `${formData.parentYear}-${formData.parentMonth.padStart(2, '0')}-${formData.parentDay.padStart(2, '0')}`
                            : ''}
                          onChange={e => {
                            const value = e.target.value
                            // Always keep what was typed. Dropping out-of-range values
                            // here made the field fight the user: a native date input
                            // emits every intermediate state, so a half-typed year is
                            // briefly year 0002 and the field appeared to snap back.
                            // Range is reported below and gates the submit instead.
                            setParentDateError(value && (value < '1945-01-01' || value > '2005-12-31') ? invalidDateMsg : '')
                            const [year, month, day] = value.split('-')
                            setFormData(prev => ({
                              ...prev,
                              parentYear: year || '',
                              parentMonth: month ? String(parseInt(month)) : '',
                              parentDay: day ? String(parseInt(day)) : ''
                            }))
                          }}
                          min="1945-01-01"
                          max="2005-12-31"
                          aria-invalid={!!parentDateError}
                          style={parentDateError ? { borderColor: '#A85544' } : undefined}
                        />
                        {parentDateError && (
                          <p className="mt-2 text-[13px]" style={{ color: '#A85544' }}>{parentDateError}</p>
                        )}
                        <p className={`df-pencil-note mt-2 ${parentDateComplete ? 'is-on' : ''}`} aria-live="polite">
                          {parentDateComplete ? df.noteParentMark(formData.parentRole === 'mother' ? s.mother : s.father) : ''}
                        </p>
                      </div>

                      {parentZodiacInfo && (
                        <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-dashed px-4 py-3 [border-color:var(--df-hair)] [background:var(--df-wall-deep)]">
                          <span className="text-2xl leading-none" aria-hidden>{parentZodiacInfo.branch.icon}</span>
                          <p className="text-[13px] [color:var(--df-muted)]">
                            {s.zodiacLabel}: <b className="[color:var(--df-ink)]">{animalName(parentZodiacInfo.branch.key)}{s.zodiacSuffix}</b>
                            {' · '}{s.fiveElements}: <b style={{ color: parentZodiacInfo.stem.colorCode }}>{elementName(parentZodiacInfo.stem.key)}</b>
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex gap-3 items-center">
                  <Button type="button" variant="secondary" onClick={prevStep}>{s.prevStep}</Button>
                  <Button type="button" onClick={nextStep} disabled={!canProceedStep4} className="flex-1">
                    {df.drawNext}
                  </Button>
                </div>
                {missingHint(4)}
              </div>
            )}

            {/* Step 5: parent time + summary + consent */}
            {step === 5 && (
              <div className="flex flex-col gap-5">
                {parentDateComplete && (
                  <div className="df-panel">
                    <label className="df-label" htmlFor="parent-birth-time">
                      {s.parentBirthTime(formData.parentRole === 'mother' ? s.mother : s.father)}
                    </label>
                    <input
                      id="parent-birth-time"
                      type="time"
                      className="df-input mb-3"
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
                      style={{ opacity: formData.parentUnknownTime ? 0.4 : 1 }}
                    />
                    <label className="df-consent">
                      <input
                        type="checkbox"
                        checked={formData.parentUnknownTime}
                        onChange={e => handleUnknownTime(e.target.checked, true)}
                      />
                      <span>
                        <span className="df-consent__title">{s.unknownTime}</span>
                        <span className="df-consent__desc block">{s.unknownTimeDesc}</span>
                      </span>
                    </label>
                  </div>
                )}

                {/* Summary — what is written on the frame */}
                <div className="df-panel">
                  <h4 className="df-label mb-3" style={{ fontFamily: 'Pretendard, sans-serif', color: 'var(--df-muted)' }}>{s.summaryTitle}</h4>
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="[color:var(--df-muted)]">{s.summaryChild}</span>
                      <span className="font-medium [color:var(--df-ink)]">
                        {formData.name} ({formData.gender === 'male' ? s.genderShortMale : s.genderShortFemale})
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="[color:var(--df-muted)]">{s.summaryChildBirth}</span>
                      <span className="df-mono font-medium [color:var(--df-ink)]">
                        {formatBirthDateForDisplay(`${formData.year}.${formData.month.padStart(2, '0')}.${formData.day.padStart(2, '0')}`, lang)}
                      </span>
                    </div>
                    {parentDateComplete && (
                      <div className="flex justify-between gap-4">
                        <span className="[color:var(--df-muted)]">{s.summaryParentBirth(formData.parentRole === 'mother' ? s.mother : s.father)}</span>
                        <span className="df-mono font-medium [color:var(--df-ink)]">
                          {formatBirthDateForDisplay(`${formData.parentYear}.${formData.parentMonth.padStart(2, '0')}.${formData.parentDay.padStart(2, '0')}`, lang)}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className={`df-pencil-note mt-3 ${parentDateComplete ? 'is-on' : ''}`}>
                    {parentDateComplete ? df.noteFamilyDone(formData.name || df.childFallback) : ''}
                  </p>
                </div>

                {/* Agreements */}
                <div className="df-panel flex flex-col gap-2">
                  <label className="df-consent">
                    <input
                      type="checkbox"
                      checked={formData.ageVerified}
                      onChange={e => setFormData(prev => ({ ...prev, ageVerified: e.target.checked }))}
                    />
                    <span>
                      <span className="df-consent__title">{s.ageVerification} <span className="df-consent__req">*</span></span>
                      <span className="df-consent__desc block">{s.ageVerificationDesc}</span>
                    </span>
                  </label>

                  <label className="df-consent">
                    <input
                      type="checkbox"
                      checked={formData.guardianConfirmed}
                      onChange={e => setFormData(prev => ({ ...prev, guardianConfirmed: e.target.checked }))}
                    />
                    <span>
                      <span className="df-consent__title">{s.guardianConfirmation} <span className="df-consent__req">*</span></span>
                      <span className="df-consent__desc block">{s.guardianConfirmationDesc}</span>
                    </span>
                  </label>

                  <label className="df-consent">
                    <input
                      type="checkbox"
                      checked={formData.privacyAgreed}
                      onChange={e => setFormData(prev => ({ ...prev, privacyAgreed: e.target.checked }))}
                    />
                    <span>
                      <span className="df-consent__title">{s.privacyAgreement} <span className="df-consent__req">*</span></span>
                      <span className="df-consent__desc block">
                        {s.privacyAgreementDesc}
                        <Link href={localizedLegalPath(lang, 'privacy')} className="ml-1 underline [color:var(--df-wood-deep)]">{s.privacyLink}</Link>
                      </span>
                    </span>
                  </label>

                  <label className="df-consent">
                    <input
                      type="checkbox"
                      checked={formData.overseasProcessingAgreed}
                      onChange={e => setFormData(prev => ({ ...prev, overseasProcessingAgreed: e.target.checked }))}
                    />
                    <span>
                      <span className="df-consent__title">{s.overseasProcessingAgreement} <span className="df-consent__req">*</span></span>
                      <span className="df-consent__desc block">{s.overseasProcessingAgreementDesc}</span>
                    </span>
                  </label>

                  <label className="df-consent">
                    <input
                      type="checkbox"
                      checked={formData.marketingAgreed}
                      onChange={e => setFormData(prev => ({ ...prev, marketingAgreed: e.target.checked }))}
                    />
                    <span>
                      <span className="df-consent__title">{s.marketingAgreement}</span>
                      <span className="df-consent__desc block">{s.marketingAgreementDesc}</span>
                    </span>
                  </label>
                </div>

                <div className="flex gap-3 items-center">
                  <Button type="button" variant="secondary" onClick={prevStep}>{s.prevStep}</Button>
                  <Button type="submit" disabled={!canProceedStep5 || isSubmitting} className="flex-1">
                    {df.drawLast} <IconArrow size={17} />
                  </Button>
                </div>
                {missingHint(5)}
              </div>
            )}
          </form>

          {/* Trust indicators */}
          <div className="mt-10 flex items-center justify-center gap-3 flex-wrap text-xs [color:var(--df-muted)]">
            <span className="flex items-center gap-1.5">
              <IconLock size={15} />
              {s.trustSecure}
            </span>
            <span aria-hidden>·</span>
            <span>{s.trustBeta}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
