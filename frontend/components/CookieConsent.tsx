'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  const pathname = usePathname()
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

  const isResultsPage = pathname?.includes('/saju/results') || pathname?.includes('/payment/success')
  const bottomOffset = isResultsPage
    ? 'calc(5.75rem + env(safe-area-inset-bottom, 0px))'
    : 'calc(1.25rem + env(safe-area-inset-bottom, 0px))'

  return (
    <div
      className="fixed z-50"
      style={{
        right: 'clamp(1rem, 2vw, 1.5rem)',
        bottom: bottomOffset,
        width: 'min(23.5rem, calc(100vw - 2rem))',
        pointerEvents: 'none',
      }}
    >
      <div
        className="rounded-[10px] border border-[#C5A059]/35 bg-[#173F2D] p-3.5 text-[#F8F2E7] shadow-[0_18px_40px_rgba(23,63,45,0.22)]"
        style={{ pointerEvents: 'auto' }}
      >
        <p className="m-0 text-sm leading-[1.45] text-[#F8F2E7]/90">
          {cc.message}{' '}
          <Link
            href={localizedLegalPath(lang, 'privacy')}
            className="text-[#E6C56F] underline underline-offset-[3px] transition-colors hover:text-[#F2D784] focus:outline-none focus:ring-2 focus:ring-[#E6C56F]/70 focus:ring-offset-2 focus:ring-offset-[#173F2D]"
          >
            {cc.learnMore}
          </Link>
        </p>
        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={() => handleChoice('accepted')}
            className="min-h-10 flex-1 rounded-lg border-0 bg-[#D8B55A] px-3.5 py-2 text-sm font-bold text-[#2B211D] transition-colors hover:bg-[#E4C36A] focus:outline-none focus:ring-2 focus:ring-[#F2D784] focus:ring-offset-2 focus:ring-offset-[#173F2D] active:bg-[#C9A84D]"
          >
            {cc.accept}
          </button>
          <button
            onClick={() => handleChoice('declined')}
            className="min-h-10 flex-1 rounded-lg border border-[#F8F2E7]/35 bg-white/[0.06] px-3.5 py-2 text-sm font-semibold text-[#F8F2E7] transition-colors hover:border-[#F8F2E7]/55 hover:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-[#E6C56F]/70 focus:ring-offset-2 focus:ring-offset-[#173F2D] active:bg-white/[0.16]"
          >
            {cc.decline}
          </button>
        </div>
      </div>
    </div>
  )
}
