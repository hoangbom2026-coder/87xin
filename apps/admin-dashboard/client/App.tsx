import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from '@/components/layout/AdminLayout'
import '@/global.css'

export default function App() {
  return (
    <BrowserRouter>
      <AdminLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route
            path="/admin/*"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold">TC Gaming Admin Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                  System operational. Management panel ready.
                </p>
              </div>
            }
          />
        </Routes>
      </AdminLayout>
    </BrowserRouter>
  )
}

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
