'use client'

import Image from 'next/image'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface LoginFormProps {
  branding: {
    systemName: string
    systemDescription: string
    primaryColor: string | string[]
    secondaryColor: string
  }
  accounts?: {
    username: string
    name: string
    lastLogin: string
  }[]
  username?: string
  password?: string
  showPassword?: boolean
  onShowPasswordChange?: (show: boolean) => void
  onUsernameChange?: (username: string) => void
  onPasswordChange?: (password: string) => void
  onSubmit?: () => void
  onAccountClick?: (username: string) => void
  onAccountDelete?: (username: string) => void
  formErrors?: Record<string, string>
  loading?: boolean
}

export function LoginForm({
  branding,
  accounts = [],
  username = '',
  password = '',
  showPassword = false,
  onShowPasswordChange,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  onAccountClick,
  formErrors = {},
  loading = false,
}: LoginFormProps) {
  return (
    <div className="min-h-screen w-full flex bg-surface">
      {/* ================= DESKTOP LEFT HERO PANEL (60%) ================= */}
      <div className="hidden lg:flex w-[55%] xl:w-[58%] bg-[#0b1c30] text-white relative overflow-hidden flex-col justify-between p-12 xl:p-16 border-r border-[#1a2d47]">
        {/* Top Spacer */}
        <div className="h-10" />

        {/* Center Presentation */}
        <div className="my-auto py-8">
          {/* Two Brand Logos Side-by-Side */}
          <div className="flex items-center justify-center gap-5 mb-8">
            <Image
              src="/assets/cbc954a6519ff310baa5cbff4ac5fc4ac8ac03d0.png"
              alt="Mie Gacoan Logo"
              width={160}
              height={80}
              className="h-20 w-auto object-contain"
              priority
            />
            <Image
              src="/assets/cbc954a6519ff310baa5cbff4ac5fc4ac8ac03d1.png"
              alt="PT Pesta Pora Abadi Logo"
              width={160}
              height={80}
              className="h-20 w-auto object-contain"
              priority
            />
          </div>

          {/* Quick Select Accounts */}
          {accounts.length > 0 && (
            <div className="mt-8">
              <p className="font-label-sm uppercase tracking-wider text-[#7c839b] font-medium mb-3 text-xs">
                Quick Select Account
              </p>
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                {accounts.map((acc, idx) => (
                  <div
                    key={idx}
                    onClick={() => !loading && onAccountClick?.(acc.username)}
                    className="p-3.5 rounded-lg bg-[#111e33] border border-[#1e3455] hover:border-[#ec4899]/70 hover:bg-[#162742] transition-all cursor-pointer group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-9 h-9 rounded bg-[#1c2e4a] border border-[#2a456e] text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {loading && username === acc.username ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#ec4899]" />
                        ) : (
                          acc.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="truncate">
                        <p className="font-medium text-xs text-white truncate group-hover:text-[#adc6ff] transition-colors">{acc.name}</p>
                        <p className="font-mono-data text-[11px] text-[#7c839b] truncate">@{acc.username}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Spacer */}
        <div className="h-10" />
      </div>

      {/* ================= DESKTOP RIGHT LOGIN FORM (40%) ================= */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-surface px-8 py-12">
        <div className="w-full max-w-[420px]">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-[0_1px_8px_rgba(0,0,0,0.04)] p-8">
            <div className="mb-6">
              <h1 className="font-headline-xl text-2xl font-bold text-on-surface tracking-tight mt-1">Sign in to your account</h1>
              <p className="font-body-md text-secondary text-sm mt-1">
                Enter your credentials to access the administrative console.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                onSubmit?.()
              }}
              className="space-y-4"
            >
              <div>
                <label className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block mb-1.5 font-medium">
                  Username
                </label>
                <Input
                  type="text"
                  placeholder="e.g. admin or reviewer"
                  value={username}
                  onChange={(e) => onUsernameChange?.(e.target.value)}
                  autoComplete="username"
                  className="bg-surface-container-low border-outline-variant/40 focus:border-primary text-on-surface text-sm rounded h-10 px-3 font-body-md"
                />
                {formErrors.username && (
                  <p className="text-error font-body-sm text-xs mt-1">{formErrors.username}</p>
                )}
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block mb-1.5 font-medium">
                  Password
                </label>
                <div className="relative">
                  <Input
                    value={password}
                    onChange={(e) => onPasswordChange?.(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="bg-surface-container-low border-outline-variant/40 focus:border-primary text-on-surface text-sm rounded h-10 px-3 pr-10 font-body-md"
                  />
                  <button
                    type="button"
                    onClick={() => onShowPasswordChange?.(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-secondary hover:text-on-surface transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-error font-body-sm text-xs mt-1">{formErrors.password}</p>
                )}
              </div>

              <Button
                disabled={loading}
                type="submit"
                className="w-full mt-4 bg-none bg-[#ec4899] hover:bg-[#db2777] text-black font-label-md text-label-md py-2.5 rounded h-10 font-semibold shadow-sm transition-colors cursor-pointer"
                style={{ backgroundImage: 'none', backgroundColor: '#ec4899', color: '#000000' }}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span className="text-black">Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* ================= MOBILE VIEW ================= */}
      <div className="lg:hidden w-full min-h-screen flex items-center justify-center bg-surface px-6 py-8">
        <div className="w-full max-w-md">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <Image
                src="/assets/cbc954a6519ff310baa5cbff4ac5fc4ac8ac03d0.png"
                alt="Logo"
                width={120}
                height={36}
                className="h-9 w-auto object-contain"
                priority
              />
            </div>

            <div className="mb-6">
              <h1 className="font-headline-lg text-xl font-bold text-on-surface">Sign in</h1>
              <p className="font-body-md text-secondary text-xs mt-1">{branding.systemDescription}</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                onSubmit?.()
              }}
              className="space-y-4"
            >
              <div>
                <label className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block mb-1">
                  Username
                </label>
                <Input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => onUsernameChange?.(e.target.value)}
                  autoComplete="username"
                  className="bg-surface-container-low border-outline-variant/40 rounded h-10 px-3 text-sm"
                />
                {formErrors.username && (
                  <p className="text-error font-body-sm text-xs mt-1">{formErrors.username}</p>
                )}
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Input
                    value={password}
                    onChange={(e) => onPasswordChange?.(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="bg-surface-container-low border-outline-variant/40 rounded h-10 px-3 pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => onShowPasswordChange?.(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-secondary"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-error font-body-sm text-xs mt-1">{formErrors.password}</p>
                )}
              </div>

              <Button
                disabled={loading}
                type="submit"
                className="w-full mt-4 bg-none bg-[#ec4899] hover:bg-[#db2777] text-black rounded h-10 font-semibold"
                style={{ backgroundImage: 'none', backgroundColor: '#ec4899', color: '#000000' }}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span className="text-black">Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
