'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function InputFormPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    calendar: 'solar',
    year: '',
    month: '',
    day: '',
    time: '',
    gender: '',
    location: '',
    unknownTime: false,
    privacyAgreed: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate processing
    setTimeout(() => {
      router.push('/saju/results')
    }, 2000)
  }

  const handleUnknownTime = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      unknownTime: checked,
      time: checked ? '12:00' : ''
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-stone-50">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="text-sm text-stone-600 hover:text-stone-900 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-semibold mb-4">Enter Your Birth Details</h1>
          <p className="text-lg text-stone-600">Accurate information ensures precise readings</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-200">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="Enter your name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            {/* Calendar Type */}
            <div>
              <label className="block text-sm font-medium mb-3">Calendar Type</label>
              <div className="grid grid-cols-2 gap-4">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="calendar"
                    value="solar"
                    checked={formData.calendar === 'solar'}
                    onChange={e => setFormData(prev => ({ ...prev, calendar: e.target.value }))}
                    className="absolute opacity-0"
                  />
                  <div className="flex items-center gap-3 radio-content">
                    <div className="w-5 h-5 border-2 border-stone-300 rounded-full flex items-center justify-center">
                      {formData.calendar === 'solar' && (
                        <div className="w-2.5 h-2.5 bg-amber-600 rounded-full" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">Solar Calendar</div>
                      <div className="text-xs text-stone-500 mt-0.5">양력 (Gregorian)</div>
                    </div>
                  </div>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="calendar"
                    value="lunar"
                    checked={formData.calendar === 'lunar'}
                    onChange={e => setFormData(prev => ({ ...prev, calendar: e.target.value }))}
                    className="absolute opacity-0"
                  />
                  <div className="flex items-center gap-3 radio-content">
                    <div className="w-5 h-5 border-2 border-stone-300 rounded-full flex items-center justify-center">
                      {formData.calendar === 'lunar' && (
                        <div className="w-2.5 h-2.5 bg-amber-600 rounded-full" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">Lunar Calendar</div>
                      <div className="text-xs text-stone-500 mt-0.5">음력 (Traditional)</div>
                    </div>
                  </div>
                </label>
              </div>
              <div className="info-badge mt-3">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
                  </svg>
                  <span>Most birth certificates use solar calendar. Choose lunar if you&apos;re certain.</span>
                </div>
              </div>
            </div>

            {/* Birth Date */}
            <div>
              <label className="block text-sm font-medium mb-3">Birth Date</label>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-stone-500 mb-2">Year</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="1990"
                    min="1900"
                    max="2025"
                    value={formData.year}
                    onChange={e => setFormData(prev => ({ ...prev, year: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-2">Month</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="12"
                    min="1"
                    max="12"
                    value={formData.month}
                    onChange={e => setFormData(prev => ({ ...prev, month: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-2">Day</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="25"
                    min="1"
                    max="31"
                    value={formData.day}
                    onChange={e => setFormData(prev => ({ ...prev, day: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Birth Time */}
            <div>
              <label className="block text-sm font-medium mb-2">Birth Time (24-hour format)</label>
              <input
                type="time"
                className="input-field"
                value={formData.time}
                onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))}
                disabled={formData.unknownTime}
                required
              />
              <div className="mt-3 space-y-2">
                <div className="info-badge">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
                    </svg>
                    <span>Exact birth time is crucial for accurate time pillar (時柱) calculation</span>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-stone-300"
                    checked={formData.unknownTime}
                    onChange={e => handleUnknownTime(e.target.checked)}
                  />
                  <span>I don&apos;t know my exact birth time (we&apos;ll use 12:00 PM)</span>
                </label>
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium mb-3">Gender</label>
              <div className="grid grid-cols-2 gap-4">
                {['male', 'female'].map(gender => (
                  <label key={gender} className="radio-option">
                    <input
                      type="radio"
                      name="gender"
                      value={gender}
                      checked={formData.gender === gender}
                      onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                      className="absolute opacity-0"
                      required
                    />
                    <div className="flex items-center gap-3 radio-content">
                      <div className="w-5 h-5 border-2 border-stone-300 rounded-full flex items-center justify-center">
                        {formData.gender === gender && (
                          <div className="w-2.5 h-2.5 bg-amber-600 rounded-full" />
                        )}
                      </div>
                      <span className="font-medium capitalize">{gender}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Birth Location */}
            <div>
              <label className="block text-sm font-medium mb-2">Birth Location</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Seoul, South Korea"
                value={formData.location}
                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                required
              />
              <div className="info-badge mt-3">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                  <span>Location is needed for precise time zone and longitude adjustments</span>
                </div>
              </div>
            </div>

            {/* Privacy Agreement */}
            <div className="pt-4">
              <label className="flex items-start gap-3 text-sm text-stone-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-stone-300"
                  checked={formData.privacyAgreed}
                  onChange={e => setFormData(prev => ({ ...prev, privacyAgreed: e.target.checked }))}
                  required
                />
                <span>
                  I agree to the processing of my birth information for Saju analysis. All data is encrypted and never shared with third parties.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Calculating Your Saju...' : 'Generate My Reading'}
              </button>
            </div>
          </form>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center text-sm text-stone-500">
          <div className="flex items-center justify-center gap-2 mb-4">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" />
            </svg>
            <span>Your information is encrypted and secure</span>
          </div>
        </div>
      </div>
    </div>
  )
}
