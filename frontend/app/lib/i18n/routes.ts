import type { Language } from './translations'

const SUPPORTED_LANGUAGES: Language[] = ['ko', 'en', 'ja', 'zh', 'vi', 'id', 'es', 'pt', 'fr', 'th']

export function localizedLegalPath(lang: Language, page: 'privacy' | 'terms') {
  return SUPPORTED_LANGUAGES.includes(lang) ? `/${lang}/${page}` : `/${page}`
}
