'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Language } from './translations'

type TranslationSet = typeof translations.ko

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  t: TranslationSet
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('ko')

  useEffect(() => {
    const saved = localStorage.getItem('somyung-lang') as Language | null
    if (saved && translations[saved]) {
      setLangState(saved)
    } else {
      const browserLang = navigator.language.slice(0, 2)
      const langMap: Record<string, Language> = { ko: 'ko', en: 'en', ja: 'ja', zh: 'zh', vi: 'vi', id: 'id', es: 'es', pt: 'pt', fr: 'fr', th: 'th' }
      if (langMap[browserLang]) {
        setLangState(langMap[browserLang])
      }
    }
  }, [])

  const setLang = (newLang: Language) => {
    setLangState(newLang)
    localStorage.setItem('somyung-lang', newLang)
    document.documentElement.lang = newLang
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
