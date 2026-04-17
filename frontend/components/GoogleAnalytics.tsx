'use client'

import Script from 'next/script'
import { useState, useEffect } from 'react'

const CONSENT_KEY = 'somyung-cookie-consent'
const POLICY_VERSION = '2026-04-15'

function hasCurrentConsent(): boolean {
  const raw = localStorage.getItem(CONSENT_KEY)
  if (!raw) return false
  try {
    const parsed = JSON.parse(raw)
    // Must match BOTH choice and current policy version
    return parsed.choice === 'accepted' && parsed.policyVersion === POLICY_VERSION
  } catch {
    return false // legacy plain string = stale, re-consent needed
  }
}

export default function GoogleAnalytics({ gaId }: { gaId: string }) {
  const [consentGiven, setConsentGiven] = useState(false)

  useEffect(() => {
    const checkConsent = () => setConsentGiven(hasCurrentConsent())
    checkConsent()
    window.addEventListener('cookie-consent-change', checkConsent)
    return () => window.removeEventListener('cookie-consent-change', checkConsent)
  }, [])

  if (!consentGiven) return null

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}');
      `}</Script>
    </>
  )
}
