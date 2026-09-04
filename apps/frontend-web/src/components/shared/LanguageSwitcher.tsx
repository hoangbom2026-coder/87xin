import * as React from 'react'
import { useLanguage } from '../../i18n/LanguageContext'

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage()
  return (
    <div className="flex items-center gap-1 text-xs font-bold">
      <button
        type="button"
        onClick={() => setLang('vi')}
        className={lang === 'vi' ? 'text-primary' : 'text-slate-400 hover:text-white'}
      >
        VI
      </button>
      <span className="text-slate-600">|</span>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={lang === 'en' ? 'text-primary' : 'text-slate-400 hover:text-white'}
      >
        EN
      </button>
    </div>
  )
}
