'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Loader2, KeyRound, RotateCw } from 'lucide-react'
import { useTitle } from '@/src/shared/contexts/TitleContext'
import type { Permission } from '../domains/permission.entity'
import { PermissionRepository } from '../repositories/permission.repository'

export function PermissionTable() {
  const { setTitle } = useTitle()
  const [items, setItems] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTitle('Permissions')
  }, [setTitle])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await PermissionRepository.getAll()
      setItems(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load permissions')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const safeItems = Array.isArray(items) ? items : []

  return (
    <div className="flex flex-col w-full space-y-space-lg">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-secondary tracking-wider uppercase font-medium">
            <span>User Management</span>
            <span className="text-outline-variant font-mono-data">/</span>
            <span className="text-on-surface font-semibold">Permissions</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">System Permissions</h1>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-surface-container-lowest rounded-lg shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="p-space-md flex items-center justify-between border-b border-outline-variant/30">
          <div className="flex items-center gap-2">
            <span className="font-label-md text-label-md font-semibold text-on-surface">Capability Scopes</span>
            <span className="px-2 py-0.5 rounded-full font-mono-data text-[11px] bg-secondary-container text-on-secondary-container">
              {safeItems.length} permissions
            </span>
          </div>

          <button
            onClick={fetchData}
            type="button"
            className="w-8 h-8 rounded bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
            title="Refresh permissions"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-outline" />
          </div>
        ) : safeItems.length === 0 ? (
          <div className="p-12 text-center text-secondary font-body-md text-sm">No permissions found.</div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="h-9 bg-surface-container-low/60 text-secondary font-label-sm text-label-sm uppercase tracking-wider">
                  <th className="px-space-md py-2 font-medium w-72">Scope Key</th>
                  <th className="px-space-md py-2 font-medium">Description</th>
                  <th className="px-space-md py-2 font-medium w-28 text-right">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15 font-body-md text-body-md text-on-surface">
                {safeItems.map(perm => (
                  <tr key={perm.id} className="h-12 hover:bg-surface-container-low/40 transition-colors">
                    <td className="px-space-md font-medium text-on-surface whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-3.5 h-3.5 text-secondary shrink-0" />
                        <span className="font-mono-data text-[12px] bg-surface-container-low px-2 py-0.5 rounded border border-outline-variant/30 text-on-surface">
                          {perm.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-space-md text-secondary">
                      {perm.description || 'System module operational permission'}
                    </td>
                    <td className="px-space-md text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono-data bg-surface-container-low text-secondary border border-outline-variant/30">
                        system
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
