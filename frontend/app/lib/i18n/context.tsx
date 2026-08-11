'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Language } from './translations'

type TranslationSet = typeof translations.ko

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  t: TranslationSet
  /**
   * False until the real language is known.
   *
   * Routes without a /[lang]/ prefix start at 'ko' and only learn the visitor's
   * actual language once the effect below runs. Anything that sends `lang` to the
   * API must wait for this, or an English visitor gets an English page with a
   * Korean report — the body language is baked into the AI call, so it cannot be
   * corrected after the fact.
   */
  ready: boolean
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children, initialLang }: { children: ReactNode; initialLang?: Language }) {
  const [lang, setLangState] = useState<Language>(initialLang ?? 'ko')
  // A /[lang]/ route already knows the language at first render; everything else
  // has to wait for the effect. Rendering starts on the server, so this cannot be
  // resolved during the initial render without a hydration mismatch.
  const [ready, setReady] = useState<boolean>(!!initialLang)

  useEffect(() => {
    if (initialLang) {
      localStorage.setItem('somyung-lang', initialLang)
      document.documentElement.lang = initialLang
      setReady(true)
      return
    }
    const saved = localStorage.getItem('somyung-lang') as Language | null
    if (saved && translations[saved]) {
      setLangState(saved)
      document.documentElement.lang = saved
    } else {
      const browserLang = navigator.language.slice(0, 2)
      const langMap: Record<string, Language> = { ko: 'ko', en: 'en', ja: 'ja', zh: 'zh', vi: 'vi', id: 'id', es: 'es', pt: 'pt', fr: 'fr', th: 'th' }
      if (langMap[browserLang]) {
        setLangState(langMap[browserLang])
        document.documentElement.lang = langMap[browserLang]
      }
    }
    setReady(true)
  }, [initialLang])

  const setLang = (newLang: Language) => {
    setLangState(newLang)
    localStorage.setItem('somyung-lang', newLang)
    document.documentElement.lang = newLang
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang], ready }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
