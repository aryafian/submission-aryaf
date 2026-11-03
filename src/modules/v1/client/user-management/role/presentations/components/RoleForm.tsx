'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Role } from '../../domains/role.entity'
import { RoleRepository } from '../../repositories/role.repository'

interface RoleFormProps {
  role?: Role | null
  onClose: () => void
  onSaved: () => void
}

export function RoleForm({ role, onClose, onSaved }: RoleFormProps) {
  const [name, setName] = useState(role?.name || '')
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
      if (role) {
        await RoleRepository.update(role.id, { name })
        toast.success('Role updated successfully')
      } else {
        await RoleRepository.create({ name })
        toast.success('Role created successfully')
      }
      onSaved()
    } catch {
      toast.error('Failed to save role')
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
              {role ? 'Edit Role' : 'New Role'}
            </h3>
            <span className="px-1.5 py-0.5 rounded font-mono-data text-[10px] bg-secondary-container text-on-secondary-container">
              RBAC Policy
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
            <Label htmlFor="role-name" className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block mb-1">
              Role Name *
            </Label>
            <Input
              id="role-name"
              ref={nameRef}
              value={name}
              onChange={e => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              required
              className="rounded bg-surface-container-low border-outline-variant/40 text-on-surface font-mono-data text-xs focus:bg-surface-container-lowest focus:border-primary"
              placeholder="e.g. auditor, compliance-officer"
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
            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin text-black" /> Saving...</> : role ? 'Save Changes' : 'Create Role'}
          </Button>
        </div>
      </form>
    </div>
  )
}
