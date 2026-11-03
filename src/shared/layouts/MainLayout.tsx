'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/src/shared/partials/Sidebar'
import { Header } from '@/src/shared/partials/Header'
import { TitleProvider } from '@/src/shared/contexts/TitleContext'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setSidebarOpen(window.innerWidth >= 1024)
  }, [])

  return (
    <TitleProvider>
      <div className="min-h-screen flex bg-surface font-body-md text-on-surface antialiased">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 min-w-0 flex flex-col lg:pl-64 transition-all duration-300">
          <Header onMenuClick={() => setSidebarOpen(prev => !prev)} sidebarOpen={sidebarOpen} />

          <main className="w-full flex-1 px-gutter lg:px-margin py-space-lg bg-surface">
            {children}
          </main>
        </div>
      </div>
    </TitleProvider>
  )
}
