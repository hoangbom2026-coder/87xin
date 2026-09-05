import * as React from 'react'
import vi from './locales/vi.json'
import en from './locales/en.json'

export type Lang = 'vi' | 'en'
export type AppLanguage = Lang

const LOCALES: Record<Lang, Record<string, unknown>> = { vi, en }

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }
  return typeof current === 'string' ? current : undefined
}

export type LanguageContextValue = {
  lang: Lang
  language: Lang
  setLang: (lang: Lang) => void
  t: (key: string, fallback?: string) => string
}

const LanguageContext = React.createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>(() => {
    try {
      const saved = localStorage.getItem('lang')
      return saved === 'en' || saved === 'vi' ? saved : 'vi'
    } catch {
      return 'vi'
    }
  })

  const setLang = React.useCallback((l: Lang) => {
    try {
      localStorage.setItem('lang', l)
    } catch {
      // ignore
    }
    setLangState(l)
  }, [])

  const t = React.useCallback((key: string, fallback?: string): string => {
    const locale = LOCALES[lang]
    const value = getNestedValue(locale, key)
    if (value !== undefined) return value
    if (fallback !== undefined) return fallback
    return key
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, language: lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const ctx = React.useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return ctx
}

export default LanguageContext
