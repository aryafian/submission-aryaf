'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthRepository } from '../repositories/auth.repository'
import { toast } from 'sonner'
import { getLastLoggedAccounts, addLastLoggedAccount, removeLastLoggedAccount } from '@/src/shared/utils/last-logged'
import { LoginForm } from './components/LoginForm'

const DEFAULT_ACCOUNTS = [
  { username: 'admin', name: 'Super Admin', lastLogin: new Date().toISOString() },
  { username: 'approver1', name: 'Approver One', lastLogin: new Date().toISOString() },
  { username: 'approver2', name: 'Approver Two', lastLogin: new Date().toISOString() },
  { username: 'viewer', name: 'Viewer User', lastLogin: new Date().toISOString() },
]

const DEFAULT_PASSWORDS: Record<string, string> = {
  admin: 'admin123',
  viewer: 'viewer123',
  approver1: 'approver123',
  approver2: 'approver123',
  approver3: 'approver123',
}

const branding = {
  systemName: 'Skeleton',
  systemDescription: 'A reusable application skeleton for building modern web applications with role-based access control, master data management, and modular architecture.',
  primaryColor: ['#131b2e', '#0b1c30'],
  secondaryColor: '#131b2e',
}

export default function LoginPage({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter()

  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [accounts, setAccounts] = useState<{ username: string; name: string; lastLogin: string }[]>([])

  useEffect(() => {
    const saved = getLastLoggedAccounts()
    if (saved && saved.length > 0) {
      setAccounts(saved.map(a => ({ ...a, lastLogin: new Date(a.lastLogin).toISOString() })))
    } else {
      setAccounts(DEFAULT_ACCOUNTS)
    }
  }, [])

  const handleLogin = async () => {
    setLoading(true)
    setFormErrors({})

    try {
      const result = await AuthRepository.login({ username, password })

      if (result?.error) {
        toast.error('Username atau password salah')
        setFormErrors({ username: 'Invalid credentials' })
        return
      }

      const matched = accounts.find(a => a.username === username)
      const name = matched?.name || username
      addLastLoggedAccount({ username, name })
      setAccounts(getLastLoggedAccounts().map(a => ({ ...a, lastLogin: new Date(a.lastLogin).toISOString() })))

      toast.success('Welcome back!')
      window.location.href = redirectTo || '/dashboard'
    } catch {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAccountClick = async (selectedUsername: string) => {
    const pwd = DEFAULT_PASSWORDS[selectedUsername] || 'admin123'
    setUsername(selectedUsername)
    setPassword(pwd)
    setFormErrors({})

    setLoading(true)
    try {
      const result = await AuthRepository.login({ username: selectedUsername, password: pwd })

      if (result?.error) {
        toast.error('Username atau password salah')
        setFormErrors({ username: 'Invalid credentials' })
        return
      }

      const matched = accounts.find(a => a.username === selectedUsername)
      const name = matched?.name || selectedUsername
      addLastLoggedAccount({ username: selectedUsername, name })
      setAccounts(getLastLoggedAccounts().map(a => ({ ...a, lastLogin: new Date(a.lastLogin).toISOString() })))

      toast.success(`Welcome back, ${name}!`)
      window.location.href = redirectTo || '/dashboard'
    } catch {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = (accountUsername: string) => {
    removeLastLoggedAccount(accountUsername)
    setAccounts(getLastLoggedAccounts().map(a => ({ ...a, lastLogin: new Date(a.lastLogin).toISOString() })))
  }

  return (
    <LoginForm
      branding={branding}
      accounts={accounts}
      username={username}
      password={password}
      showPassword={showPassword}
      onShowPasswordChange={setShowPassword}
      onUsernameChange={setUsername}
      onPasswordChange={setPassword}
      onSubmit={handleLogin}
      onAccountClick={handleAccountClick}
      onAccountDelete={handleDeleteAccount}
      formErrors={formErrors}
      loading={loading}
    />
  )
}
