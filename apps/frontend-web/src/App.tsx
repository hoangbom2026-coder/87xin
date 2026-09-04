import React from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { store } from './store'
import { LanguageProvider } from './i18n/LanguageContext'
import LanguageSwitcher from './components/shared/LanguageSwitcher'

export default function App() {
  return (
    <Provider store={store}>
      <LanguageProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-[#0d131c] text-white flex flex-col">
            <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40">
              <div className="flex items-center gap-4">
                <span className="text-xl font-black tracking-wider text-amber-400">
                  TC GAMING
                </span>
              </div>
              <div className="flex items-center gap-4">
                <LanguageSwitcher />
              </div>
            </header>
            <main className="flex-1 p-6">
              <Routes>
                <Route
                  path="*"
                  element={
                    <div className="max-w-4xl mx-auto py-12 text-center">
                      <h1 className="text-3xl font-bold mb-4">Welcome to TC Gaming</h1>
                      <p className="text-white/60">
                        Player site operational. Select games and promotions from the lobby.
                      </p>
                    </div>
                  }
                />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </LanguageProvider>
    </Provider>
  )
}
