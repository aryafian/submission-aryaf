'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { Loader2, Shield, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { User } from '../../domains/user.entity'
import { RoleRepository } from '@/modules/v1/client/user-management/role/repositories/role.repository'
import { UserRepository } from '../../repositories/user.repository'

interface AssignRoleModalProps {
  user: User
  onClose: () => void
  onSaved: () => void
}

interface RoleOption {
  id: number
  name: string
}

export function AssignRoleModal({ user, onClose, onSaved }: AssignRoleModalProps) {
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    async function loadRoles() {
      try {
        const data = await RoleRepository.getAll(1, 100)
        setRoles(data.items || [])
      } catch {
        toast.error('Failed to load roles')
      } finally {
        setLoading(false)
      }
    }
    loadRoles()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function handleAssign() {
    if (!selectedRoleId) return
    setSaving(true)
    try {
      await UserRepository.assignRole(user.id, selectedRoleId)
      toast.success('Role assigned successfully')
      onSaved()
    } catch {
      toast.error('Failed to assign role')
    } finally {
      setSaving(false)
    }
  }

  async function handleRevoke(roleName: string) {
    const role = roles.find(r => r.name === roleName)
    if (!role) return
    setSaving(true)
    try {
      await UserRepository.revokeRole(user.id, role.id)
      toast.success('Role revoked successfully')
      onSaved()
    } catch {
      toast.error('Failed to revoke role')
    } finally {
      setSaving(false)
    }
  }

  const assignedRoleNames = (user.roles || []).map(r => (typeof r === 'string' ? r : (r as { name: string }).name))
  const availableRoles = roles.filter(r => !assignedRoleNames.includes(r.name))

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-lg bg-surface-container-lowest p-6 shadow-xl border border-outline-variant/30">
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-4">
          <div>
            <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Manage User Roles</h3>
            <p className="font-mono-data text-mono-data text-secondary mt-0.5">user: {user.name} ({user.username})</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-outline hover:text-on-surface rounded p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current roles */}
        <div className="mb-5">
          <label className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block mb-2">
            Active Assigned Roles
          </label>
          <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-surface-container-low rounded border border-outline-variant/20">
            {assignedRoleNames.length ? assignedRoleNames.map(role => (
              <span
                key={role}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono-data text-[11px] font-medium bg-secondary-container text-on-secondary-container"
              >
                <Shield className="w-3 h-3" />
                <span>{role}</span>
                <button
                  type="button"
                  onClick={() => handleRevoke(role)}
                  className="hover:text-error transition-colors ml-0.5"
                  disabled={saving}
                  title={`Revoke ${role}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )) : (
              <span className="font-body-sm text-body-sm text-secondary">No roles currently assigned.</span>
            )}
          </div>
        </div>

        {/* Assign new role */}
        {availableRoles.length > 0 ? (
          <div className="mb-5">
            <label className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block mb-2">
              Add New Role Assignment
            </label>
            <div className="flex gap-2">
              <select
                value={selectedRoleId ?? ''}
                onChange={e => setSelectedRoleId(Number(e.target.value) || null)}
                className="flex-1 rounded bg-surface-container-low border border-outline-variant/40 px-3 py-1.5 font-body-md text-xs text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:border-primary"
              >
                <option value="">Select a role to assign...</option>
                {availableRoles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <Button
                onClick={handleAssign}
                disabled={!selectedRoleId || saving}
                size="sm"
                className="bg-[#ec4899] hover:bg-[#db2777] text-black font-label-md text-label-md rounded shadow-sm px-4 font-semibold"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin text-black" /> : 'Assign'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mb-5 p-2 bg-surface-container-low/50 rounded font-body-sm text-body-sm text-secondary">
            All defined roles have already been assigned to this user.
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-outline-variant/30">
          <Button
            variant="outline"
            onClick={onClose}
            className="font-label-md text-label-md rounded border-outline-variant/60 text-secondary hover:text-on-surface"
          >
            Done
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
