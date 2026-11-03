'use client'

import { useState, useEffect } from 'react'
import { Menu, Search, CalendarDays, Clock3, X } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { UserDropdown } from '@/components/user-dropdown'

interface HeaderProps {
  onMenuClick: () => void
  sidebarOpen: boolean
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession()
  const [now, setNow] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  const userInitials = session?.user?.name
    ? session.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'SA'

  return (
    <header className="sticky top-0 z-40 h-14 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-outline-variant/30 flex items-center justify-between px-margin">
      <div className="flex items-center gap-space-md flex-1 max-w-lg">
        <button
          onClick={onMenuClick}
          className="p-1 rounded text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface lg:hidden"
          type="button"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-outline" />
          <input
            className="w-full h-8 pl-8 pr-8 rounded bg-surface-container-low font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest border border-transparent focus:border-outline-variant/60 transition-all text-xs"
            placeholder="Search users, categories, requests..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-0.5 rounded transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-space-md">
        <div className="hidden md:flex items-center gap-2 rounded border border-outline-variant/30 bg-surface-container-low/70 px-2.5 py-1 font-mono-data text-[11px] text-secondary">
          <CalendarDays className="w-3.5 h-3.5 text-secondary" />
          <span>{dateStr}</span>
          <span className="text-outline-variant">•</span>
          <Clock3 className="w-3.5 h-3.5 text-secondary" />
          <span>{timeStr}</span>
        </div>

        <div className="flex items-center gap-space-sm pl-space-xs">
          <UserDropdown />
        </div>
      </div>
    </header>
  )
}
