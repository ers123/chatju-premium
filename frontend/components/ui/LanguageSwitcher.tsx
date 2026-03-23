'use client'

import { useState, useRef, useEffect } from 'react'
import { Language } from '@/app/lib/i18n/translations'

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'ko', label: '한국어', flag: 'KO' },
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'ja', label: '日本語', flag: 'JA' },
  { code: 'zh', label: '中文', flag: 'ZH' },
  { code: 'vi', label: 'Tiếng Việt', flag: 'VI' },
  { code: 'id', label: 'Indonesia', flag: 'ID' },
  { code: 'es', label: 'Español', flag: 'ES' },
  { code: 'pt', label: 'Português', flag: 'PT' },
  { code: 'fr', label: 'Français', flag: 'FR' },
  { code: 'th', label: 'ไทย', flag: 'TH' },
]

interface LanguageSwitcherProps {
  currentLang: Language
  onSelect: (lang: Language) => void
}

export function LanguageSwitcher({ currentLang, onSelect }: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const current = LANGUAGES.find((l) => l.code === currentLang)!

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: '100px',
          border: '1px solid #DDD6CC',
          background: 'transparent',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
          color: '#2C2420',
          transition: 'border-color 0.2s',
        }}
        aria-label="Select language"
      >
        <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em' }}>
          {current.flag}
        </span>
        <svg
          width="10" height="6" viewBox="0 0 10 6" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
        >
          <path d="M1 1L5 5L9 1" stroke="#6B5E52" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #EDE8E3',
          boxShadow: '0 8px 24px rgba(44, 36, 32, 0.1)',
          overflow: 'hidden',
          zIndex: 100,
          minWidth: '130px',
        }}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { onSelect(lang.code); setOpen(false) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 16px',
                border: 'none',
                background: currentLang === lang.code ? 'rgba(184, 146, 45, 0.06)' : 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                color: currentLang === lang.code ? '#2C2420' : '#6B5E52',
                fontWeight: currentLang === lang.code ? 600 : 400,
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (currentLang !== lang.code) e.currentTarget.style.background = 'rgba(0,0,0,0.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = currentLang === lang.code ? 'rgba(184, 146, 45, 0.06)' : 'transparent'
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', width: '22px' }}>
                {lang.flag}
              </span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
