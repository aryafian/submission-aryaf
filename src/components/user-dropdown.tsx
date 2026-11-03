'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { User, Settings, LogOut } from 'lucide-react'

export function UserDropdown() {
  const { data: session } = useSession()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const user = session?.user
  if (!user) return null

  const handleLogout = async () => {
    setConfirmOpen(false)
    await signOut({ redirect: true, callbackUrl: '/auth/login' })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="w-8 h-8 rounded-lg border border-outline-variant/40 bg-surface-container-low/70 hover:bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface transition-colors cursor-pointer outline-none"
          title={user.name || 'User Profile'}
        >
          <User className="w-4 h-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-56 bg-surface-container-lowest border border-outline-variant/30 shadow-lg rounded-lg">
          <div className="px-3 py-2 border-b border-outline-variant/20">
            <p className="font-label-md text-label-md font-semibold text-on-surface">{user.name}</p>
            <p className="font-mono-data text-mono-data text-secondary text-xs">{user.email}</p>
          </div>

          <div className="py-1">
            <DropdownMenuItem render={<Link href="/dashboard/settings" />} className="flex items-center gap-2 px-3 py-2 text-sm text-secondary hover:text-on-surface hover:bg-surface-container-low cursor-pointer font-body-md">
              <Settings className="w-4 h-4" />
              Settings
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator className="bg-outline-variant/20" />

          <div className="py-1">
            <DropdownMenuItem
              variant="destructive"
              className="flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error-container/30 cursor-pointer font-body-md"
              onClick={() => setConfirmOpen(true)}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        confirmLabel="Logout"
        variant="danger"
      />
    </>
  )
}
