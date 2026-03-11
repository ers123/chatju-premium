'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input, Separator, Label, RadioGroup, RadioGroupItem, Progress } from '@/components/ui'

// Ambient Glow Orb
const AmbientOrb = ({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) => (
  <div
    className={`absolute rounded-full blur-[80px] opacity-30 mix-blend-multiply animate-pulse-glow pointer-events-none ${className}`}
    style={style}
  />
)

// Decorative floating element
const FloatingCloud = ({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) => (
  <div className={`absolute opacity-[0.08] pointer-events-none ${className}`} style={style}>
    <svg viewBox="0 0 100 40" fill="currentColor" className="w-32 h-12 text-[#B69B7D]">
      <ellipse cx="30" cy="25" rx="25" ry="12" />
      <ellipse cx="55" cy="20" rx="20" ry="15" />
      <ellipse cx="75" cy="25" rx="18" ry="10" />
    </svg>
  </div>
)

const getZodiacHint = (year: number): string => {
  const zodiac = ['원숭이', '닭', '개', '돼지', '쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양']
  return zodiac[year % 12]
}

export default function InputFormPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    calendar: 'solar',
    year: '',
    month: '',
    day: '',
    hour: '',
    minute: '',
    gender: '',
    unknownTime: false,
    privacyAgreed: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalSteps = 3
  const progress = (step / totalSteps) * 100

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Format birth data for API
      const birthDate = `${formData.year}.${formData.month.padStart(2, '0')}.${formData.day.padStart(2, '0')}`
      const birthTime = formData.unknownTime ? '12:00' : `${formData.hour.padStart(2, '0')}:${formData.minute.padStart(2, '0')}`

      // Store in sessionStorage for results page
      sessionStorage.setItem('sajuInput', JSON.stringify({
        name: formData.name,
        birthDate,
        birthTime,
        gender: formData.gender,
        calendar: formData.calendar,
        unknownTime: formData.unknownTime
      }))

      router.push('/saju/results')
    } catch (error) {
      console.error('Error:', error)
      setIsSubmitting(false)
    }
  }

  const handleUnknownTime = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      unknownTime: checked,
      hour: checked ? '12' : '',
      minute: checked ? '00' : ''
    }))
  }

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const canProceedStep1 = formData.name && formData.gender
  const canProceedStep2 = formData.year && formData.month && formData.day && formData.calendar
  const canProceedStep3 = (formData.unknownTime || (formData.hour && formData.minute)) && formData.privacyAgreed

  const yearHint = formData.year && parseInt(formData.year) >= 1900
    ? `${getZodiacHint(parseInt(formData.year))}띠`
    : null

  const stepTitles = [
    { icon: '✨', title: '기본 정보', subtitle: '이름과 성별을 알려주세요' },
    { icon: '🌙', title: '생년월일', subtitle: '태어난 날을 알려주세요' },
    { icon: '⭐', title: '태어난 시간', subtitle: '시주 계산에 필요해요' }
  ]

  return (
    <div className="relative min-h-screen overflow-hidden texture-noise bg-[#FAF8F6]">
      {/* Decorative Elements */}
      <AmbientOrb className="bg-[#B69B7D] top-[-10%] left-[-10%] w-[500px] h-[500px]" />
      <AmbientOrb className="bg-[#5A7D6B] bottom-[-10%] right-[-10%] w-[500px] h-[500px] animate-breathe" style={{ animationDelay: '2s' }} />

      <FloatingCloud className="top-20 -left-10 animate-float" />
      <FloatingCloud className="top-40 right-0 animate-float" style={{ animationDelay: '2s' }} />
      <FloatingCloud className="bottom-40 -left-5 animate-float" style={{ animationDelay: '4s' }} />

      {/* Header */}
      <header className="sticky top-0 z-10 glass-premium border-b border-[#EBE5DF]/50">
        <div className="max-w-[640px] mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="no-underline">
            <span className="font-serif-ko text-xl text-[#B69B7D]">소명</span>
          </Link>
          <span className="text-xs text-[#6B6560] font-sans-ko tracking-wide">
            {step} / {totalSteps}
          </span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-[640px] mx-auto px-6 pt-0">
        <div className="h-[2px] w-full bg-[#EBE5DF] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#B69B7D] to-[#D4C4A8] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-1 max-w-[640px] mx-auto px-6 py-12 pb-24">
        <form onSubmit={handleSubmit}>
          {/* Step Header */}
          <div className="text-center mb-10 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-gradient-warm flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner border border-[#FFFFFF]/50">
              {stepTitles[step - 1].icon}
            </div>
            <h1 className="text-3xl font-serif-ko text-[#2D3A35] mb-2 tracking-tight">
              {stepTitles[step - 1].title}
            </h1>
            <p className="text-[#6B6560] font-sans-ko text-[0.9375rem]">
              {stepTitles[step - 1].subtitle}
            </p>
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="card-paper p-8 border border-[#EBE5DF]">
                {/* Name */}
                <div className="mb-6">
                  <Label className="block text-[#433E3B] mb-3 text-[0.9375rem]">이름</Label>
                  <Input
                    type="text"
                    placeholder="예: 홍길동"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="text-lg p-4 rounded-xl border-[#EBE5DF] bg-white/50 focus:bg-white transition-all shadow-inner"
                  />
                  <p className="text-xs text-[#6B6560] mt-2 ml-1">* 정확한 분석을 위해 본명을 입력해주세요</p>
                </div>

                <div className="h-[1px] w-full bg-[#EBE5DF] my-8" />

                {/* Gender */}
                <div>
                  <Label className="block text-[#433E3B] mb-4 text-[0.9375rem]">성별</Label>
                  <RadioGroup
                    value={formData.gender}
                    onValueChange={(value: string) => setFormData(prev => ({ ...prev, gender: value }))}
                    className="grid grid-cols-2 gap-4"
                  >
                    <label className={`relative flex items-center justify-center p-6 rounded-2xl border transition-all cursor-pointer group ${formData.gender === 'male'
                        ? 'border-[#6B8BA4] bg-[#6B8BA4]/10 shadow-sm'
                        : 'border-[#EBE5DF] bg-white/50 hover:bg-white hover:border-[#B69B7D]/50'
                      }`}>
                      <RadioGroupItem value="male" className="absolute opacity-0" />
                      <div className="text-center transform group-hover:scale-105 transition-transform duration-300">
                        <div className="text-3xl mb-2">👨</div>
                        <div className="font-serif-ko text-[#2D3A35]">남자</div>
                      </div>
                    </label>
                    <label className={`relative flex items-center justify-center p-6 rounded-2xl border transition-all cursor-pointer group ${formData.gender === 'female'
                        ? 'border-[#C67B6F] bg-[#C67B6F]/10 shadow-sm'
                        : 'border-[#EBE5DF] bg-white/50 hover:bg-white hover:border-[#B69B7D]/50'
                      }`}>
                      <RadioGroupItem value="female" className="absolute opacity-0" />
                      <div className="text-center transform group-hover:scale-105 transition-transform duration-300">
                        <div className="text-3xl mb-2">👩</div>
                        <div className="font-serif-ko text-[#2D3A35]">여자</div>
                      </div>
                    </label>
                  </RadioGroup>
                  <p className="text-xs text-[#6B6560] mt-3 ml-1">* 대운 방향 계산에 필요합니다</p>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceedStep1}
                  className={`btn-primary px-8 py-3 ${!canProceedStep1 && 'opacity-50 cursor-not-allowed shadow-none bg-[#D4CFC9]'}`}
                >
                  다음으로 →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Birth Date */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="card-paper p-8 border border-[#EBE5DF]">
                {/* Calendar Type */}
                <div className="mb-6">
                  <Label className="block text-[#433E3B] mb-4 text-[0.9375rem]">달력 종류</Label>
                  <RadioGroup
                    value={formData.calendar}
                    onValueChange={(value: string) => setFormData(prev => ({ ...prev, calendar: value }))}
                    className="grid grid-cols-2 gap-4"
                  >
                    {['solar', 'lunar'].map((type) => (
                      <label key={type} className={`relative flex items-center p-4 rounded-xl border transition-all cursor-pointer ${formData.calendar === type
                          ? 'border-[#B69B7D] bg-[#B69B7D]/10'
                          : 'border-[#EBE5DF] bg-white/50 hover:bg-white hover:border-[#B69B7D]/50'
                        }`}>
                        <RadioGroupItem value={type} className="absolute opacity-0" />
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{type === 'solar' ? '☀️' : '🌙'}</div>
                          <div>
                            <div className="font-serif-ko text-[#2D3A35]">{type === 'solar' ? '양력' : '음력'}</div>
                            <div className="text-xs text-[#6B6560] uppercase">{type}</div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                  <div className="mt-3 px-4 py-3 rounded-lg bg-[#B69B7D]/10 text-xs text-[#433E3B] border-l-2 border-[#B69B7D]">
                    <strong>참고:</strong> 출생신고서/주민등록증은 대부분 양력입니다
                  </div>
                </div>

                <div className="h-[1px] w-full bg-[#EBE5DF] my-6" />

                {/* Birth Date */}
                <div>
                  <Label className="block text-[#433E3B] mb-4 text-[0.9375rem]">생년월일</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {['year', 'month', 'day'].map((field) => (
                      <div key={field}>
                        <label className="block text-xs text-[#6B6560] mb-2 capitalize">{field === 'year' ? '년' : field === 'month' ? '월' : '일'}</label>
                        <Input
                          type="number"
                          placeholder={field === 'year' ? '1990' : field === 'month' ? '8' : '22'}
                          value={formData[field as keyof typeof formData] as string}
                          onChange={e => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
                          className="text-center text-lg p-3 rounded-xl border-[#EBE5DF] bg-white/50 focus:bg-white"
                        />
                      </div>
                    ))}
                  </div>
                  {yearHint && (
                    <div className="text-center text-xs text-[#B69B7D] mt-2 font-medium">
                      {yearHint}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn-secondary px-6 py-3 border-[#EBE5DF] hover:bg-white"
                >
                  ← 이전
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceedStep2}
                  className={`btn-primary px-8 py-3 ${!canProceedStep2 && 'opacity-50 cursor-not-allowed shadow-none bg-[#D4CFC9]'}`}
                >
                  다음으로 →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Birth Time */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="card-paper p-8 border border-[#EBE5DF]">
                {/* Time Input */}
                <div className="mb-6">
                  <Label className="block text-[#433E3B] mb-4 text-[0.9375rem]">태어난 시간 (24시간)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {['hour', 'minute'].map((field) => (
                      <div key={field}>
                        <label className="block text-xs text-[#6B6560] mb-2 capitalize">{field === 'hour' ? '시' : '분'}</label>
                        <Input
                          type="number"
                          placeholder={field === 'hour' ? '11' : '00'}
                          value={formData[field as keyof typeof formData] as string}
                          onChange={e => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
                          disabled={formData.unknownTime}
                          className={`text-center text-lg p-3 rounded-xl border-[#EBE5DF] bg-white/50 focus:bg-white transition-opacity ${formData.unknownTime && 'opacity-50'}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Unknown Time Checkbox */}
                <label className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer mb-6 ${formData.unknownTime ? 'border-[#B69B7D] bg-[#B69B7D]/10' : 'border-[#EBE5DF] hover:bg-white'
                  }`}>
                  <input
                    type="checkbox"
                    checked={formData.unknownTime}
                    onChange={e => handleUnknownTime(e.target.checked)}
                    className="w-5 h-5 accent-[#B69B7D]"
                  />
                  <div>
                    <div className="font-medium text-[#2D3A35] text-[0.9375rem]">태어난 시간을 모릅니다</div>
                    <div className="text-xs text-[#6B6560]">정오(12:00)로 계산합니다</div>
                  </div>
                </label>

                <div className="py-3 px-4 rounded-lg bg-[#6B8BA4]/10 text-xs text-[#433E3B] border-l-2 border-[#6B8BA4] mb-6">
                  <strong>참고:</strong> 태어난 시간은 시주(時柱) 계산에 중요합니다. 정확한 시간을 알면 더 정밀한 분석이 가능해요.
                </div>

                <div className="h-[1px] w-full bg-[#EBE5DF] mb-6" />

                {/* Privacy Agreement */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.privacyAgreed}
                    onChange={e => setFormData(prev => ({ ...prev, privacyAgreed: e.target.checked }))}
                    className="mt-0.5 w-5 h-5 accent-[#B69B7D]"
                  />
                  <div className="text-xs text-[#6B6560] leading-relaxed">
                    사주 분석을 위한 개인정보 처리에 동의합니다.
                    모든 데이터는 암호화되어 안전하게 보호됩니다.{' '}
                    <a href="#" className="text-[#B69B7D] underline decoration-[#B69B7D]/50 hover:decoration-[#B69B7D]">개인정보처리방침</a>
                  </div>
                </label>
              </div>

              {/* Summary */}
              <div className="mt-6 p-6 rounded-2xl bg-[#B69B7D]/5 border border-[#B69B7D]/10">
                <h3 className="font-serif-ko text-[#2D3A35] mb-4">입력 정보 확인</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: '이름', value: formData.name },
                    { label: '성별', value: formData.gender === 'male' ? '남자' : '여자' },
                    { label: '생년월일', value: `${formData.year}.${formData.month}.${formData.day} (${formData.calendar === 'solar' ? '양력' : '음력'})` },
                    { label: '시간', value: formData.unknownTime ? '12:00 (미상)' : `${formData.hour}:${formData.minute}` }
                  ].map((item, idx) => (
                    <div key={idx}>
                      <span className="text-[#6B6560]">{item.label}:</span>
                      <span className="ml-2 font-medium text-[#2D3A35]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn-secondary px-6 py-3 border-[#EBE5DF] hover:bg-white"
                >
                  ← 이전
                </button>
                <button
                  type="submit"
                  disabled={!canProceedStep3 || isSubmitting}
                  className={`btn-primary px-10 py-3 shadow-lg flex items-center gap-2 ${(!canProceedStep3 || isSubmitting) && 'opacity-50 cursor-not-allowed shadow-none bg-[#D4CFC9]'}`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-5 h-5 text-white/50" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      분석 중...
                    </>
                  ) : (
                    <>
                      운명 열어보기
                      <span className="text-lg">✨</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Security Note */}
        <div className="mt-8 text-center flex items-center justify-center gap-2 text-xs text-[#6B6560]">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" />
          </svg>
          <span>모든 정보는 암호화되어 안전하게 보호됩니다</span>
        </div>
      </main>
    </div>
  )
}
