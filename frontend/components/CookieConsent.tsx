'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLanguage } from '../app/lib/i18n/context'
import { localizedLegalPath } from '../app/lib/i18n/routes'

const CONSENT_KEY = 'somyung-cookie-consent'
const POLICY_VERSION = '2026-04-15'

export function getCookieConsent(): string | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(CONSENT_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return parsed.choice || null
  } catch {
    return raw // legacy plain string
  }
}

export function resetCookieConsent() {
  localStorage.removeItem(CONSENT_KEY)
  window.dispatchEvent(new Event('cookie-consent-change'))
  window.dispatchEvent(new Event('cookie-consent-reset'))
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const { lang, t } = useLanguage()

  useEffect(() => {
    const checkVisibility = () => {
      const stored = localStorage.getItem(CONSENT_KEY)
      if (!stored) {
        setVisible(true)
        return
      }
      // Check if policy version changed — re-prompt
      try {
        const parsed = JSON.parse(stored)
        if (parsed.policyVersion !== POLICY_VERSION) {
          setVisible(true)
          return
        }
      } catch {
        // Legacy plain string value — re-prompt with new format
        setVisible(true)
        return
      }
      setVisible(false)
    }

    checkVisibility()
    window.addEventListener('cookie-consent-reset', checkVisibility)
    return () => window.removeEventListener('cookie-consent-reset', checkVisibility)
  }, [])

  const handleChoice = (choice: 'accepted' | 'declined') => {
    const record = {
      choice,
      timestamp: new Date().toISOString(),
      policyVersion: POLICY_VERSION,
    }
    localStorage.setItem(CONSENT_KEY, JSON.stringify(record))
    setVisible(false)
    window.dispatchEvent(new Event('cookie-consent-change'))
  }

  if (!visible) return null

  const cc = (t as Record<string, unknown>).cookieConsent as {
    message: string
    accept: string
    decline: string
    learnMore: string
  } | undefined

  if (!cc) return null

  return (
    <div
      className="fixed z-50 px-4 md:px-6"
      style={{
        left: 0,
        right: 0,
        bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        className="mx-auto max-w-md rounded-xl bg-white shadow-xl border border-gray-200 p-4 md:p-5"
        style={{ pointerEvents: 'auto', width: 'min(28rem, calc(100vw - 2rem))' }}
      >
        <p className="text-sm text-gray-700 mb-3 leading-relaxed">
          {cc.message}{' '}
          <Link href={localizedLegalPath(lang, 'privacy')} className="underline text-gray-800 hover:text-black">
            {cc.learnMore}
          </Link>
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => handleChoice('accepted')}
            className="flex-1 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            {cc.accept}
          </button>
          <button
            onClick={() => handleChoice('declined')}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {cc.decline}
          </button>
        </div>
      </div>
    </div>
  )
}
