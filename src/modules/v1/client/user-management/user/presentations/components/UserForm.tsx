'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { User } from '../../domains/user.entity'
import { UserRepository } from '../../repositories/user.repository'

interface UserFormProps {
  user?: User | null
  onClose: () => void
  onSaved: () => void
}

export function UserForm({ user, onClose, onSaved }: UserFormProps) {
  const [username, setUsername] = useState(user?.username || '')
  const [email, setEmail] = useState(user?.email || '')
  const [name, setName] = useState(user?.name || '')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => { nameRef.current?.focus() }, [])
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const body: Record<string, any> = { username, email, name }
      if (password) body.password = password

      if (user) {
        await UserRepository.update(user.id, body)
        toast.success('User updated successfully')
      } else {
        await UserRepository.create({ username, email, name, password })
        toast.success('User created successfully')
      }
      onSaved()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg bg-surface-container-lowest p-6 shadow-xl border border-outline-variant/30">
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-5">
          <div className="flex items-center gap-2">
            <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              {user ? 'Edit User' : 'New User'}
            </h3>
            <span className="px-1.5 py-0.5 rounded font-mono-data text-[10px] bg-secondary-container text-on-secondary-container">
              Directory
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-outline hover:text-on-surface rounded p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="user-name" className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block mb-1">
              Full Name *
            </Label>
            <Input
              id="user-name"
              ref={nameRef}
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="e.g. John Doe"
              className="rounded bg-surface-container-low border-outline-variant/40 text-on-surface text-xs focus:bg-surface-container-lowest focus:border-primary"
            />
          </div>

          <div>
            <Label htmlFor="user-username" className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block mb-1">
              Username *
            </Label>
            <Input
              id="user-username"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              required
              placeholder="e.g. jdoe"
              className="rounded bg-surface-container-low border-outline-variant/40 text-on-surface font-mono-data text-xs focus:bg-surface-container-lowest focus:border-primary"
            />
          </div>

          <div>
            <Label htmlFor="user-email" className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block mb-1">
              Email Address *
            </Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="e.g. jdoe@skeleton.local"
              className="rounded bg-surface-container-low border-outline-variant/40 text-on-surface font-mono-data text-xs focus:bg-surface-container-lowest focus:border-primary"
            />
          </div>

          <div>
            <Label htmlFor="user-password" className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block mb-1">
              Password {user ? '(leave blank to keep unchanged)' : '*'}
            </Label>
            <Input
              id="user-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required={!user}
              placeholder="••••••••"
              className="rounded bg-surface-container-low border-outline-variant/40 text-on-surface text-xs focus:bg-surface-container-lowest focus:border-primary"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-outline-variant/30 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="font-label-md text-label-md rounded border-outline-variant/60 text-secondary hover:text-on-surface"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#ec4899] hover:bg-[#db2777] text-black font-label-md text-label-md rounded shadow-sm gap-2 font-semibold"
          >
            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin text-black" /> Saving...</> : user ? 'Save Changes' : 'Create User'}
          </Button>
        </div>
      </form>
    </div>
  )
}
