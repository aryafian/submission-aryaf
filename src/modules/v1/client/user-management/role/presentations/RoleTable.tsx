'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Loader2, Search, Pencil, Trash2, Shield, CheckCircle2, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useSession } from 'next-auth/react'
import { useTitle } from '@/src/shared/contexts/TitleContext'
import { Pagination } from '@/src/shared/partials/Pagination'
import { RoleForm } from './components/RoleForm'
import type { Role } from '../domains/role.entity'
import type { RoleList } from '../domains/role.list'
import { RoleRepository } from '../repositories/role.repository'

export function RoleTable() {
  const { data: session } = useSession()
  const { setTitle } = useTitle()
  const [pageData, setPageData] = useState<RoleList | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null)
  const canManage = session?.user?.permissions?.includes('role.manage')

  useEffect(() => {
    setTitle('Roles & Permissions')
  }, [setTitle])

  const fetchData = useCallback(async (q: string, p: number) => {
    setLoading(true)
    try {
      const data = await RoleRepository.getAll(p, 20, q)
      setPageData(data)
    } catch {
      toast.error('Failed to load roles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(debouncedSearch, page) }, [fetchData, debouncedSearch, page])

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 300)
    return () => clearTimeout(timer)
  }, [search])

  async function handleDelete(id: number) {
    try {
      await RoleRepository.softDelete(id)
      toast.success('Role deleted successfully')
      fetchData(debouncedSearch, page)
    } catch {
      toast.error('Failed to delete role')
    }
    setDeleteTarget(null)
  }

  const items = pageData?.items ?? []
  const totalRoles = pageData?.pagination?.total ?? items.length
  const totalPages = pageData?.pagination?.total_pages ?? 1

  const getRoleTag = (name: string) => {
    const lower = name.toLowerCase()
    if (lower === 'super-admin') return { label: 'ROOT', bg: 'bg-primary text-on-primary' }
    if (lower === 'admin') return { label: 'ADMIN', bg: 'bg-secondary-container text-on-secondary-container' }
    if (lower === 'approver') return { label: 'WORKFLOW', bg: 'bg-[#d0e1fb] text-[#004395]' }
    return { label: 'READ-ONLY', bg: 'bg-surface-container-high text-on-surface' }
  }

  return (
    <div className="flex flex-col w-full space-y-space-lg">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-secondary tracking-wider uppercase font-medium">
            <span>User Management</span>
            <span className="text-outline-variant font-mono-data">/</span>
            <span className="text-on-surface font-semibold">Roles & Permissions</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Roles & Permissions</h1>
        </div>

        {canManage && (
          <div className="flex items-center gap-space-sm self-start md:self-auto">
            <button
              onClick={() => { setEditing(null); setFormOpen(true) }}
              type="button"
              className="h-9 px-space-md rounded-lg bg-[#ec4899] hover:bg-[#db2777] text-black font-label-md text-label-md flex items-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-colors cursor-pointer font-semibold"
            >
              <Plus className="w-4 h-4 text-black" />
              <span className="text-black">New Role</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Table Container */}
      <div className="bg-surface-container-lowest rounded-lg shadow-sm border border-outline-variant/30 overflow-hidden">
        {/* Table Header & Controls Bar */}
        <div className="p-space-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-md border-b border-outline-variant/30">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search roles, keys, or policies..."
              className="w-full h-8 pl-8 pr-3 rounded bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container border border-transparent focus:border-outline-variant/60 transition-colors text-xs"
            />
          </div>

          <div className="flex items-center gap-space-sm">
            <button
              onClick={() => fetchData(debouncedSearch, page)}
              type="button"
              className="w-8 h-8 rounded bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
              title="Refresh dataset"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Data Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-outline" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-secondary font-body-md text-sm">
            {search ? 'No roles match your search.' : 'No roles found.'}
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="h-9 bg-surface-container-low/60 text-secondary font-label-sm text-label-sm uppercase tracking-wider">
                    <th className="px-space-md py-2 font-medium w-48">Role Name &amp; Code</th>
                    <th className="px-space-md py-2 font-medium">Policy Description</th>
                    <th className="px-space-md py-2 font-medium w-36">Permissions</th>
                    <th className="px-space-md py-2 font-medium w-28">Status</th>
                    {canManage && <th className="px-space-md py-2 font-medium text-right w-24">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 font-body-md text-body-md text-on-surface">
                  {items.map(role => {
                    const tag = getRoleTag(role.name)
                    const isRoot = role.name.toLowerCase() === 'super-admin'
                    const permsCount = (role as unknown as { permissions?: unknown[] }).permissions?.length ?? (isRoot ? 12 : 5)
                    const pct = Math.min(100, Math.round((permsCount / 12) * 100))

                    return (
                      <tr key={role.id} className="hover:bg-surface-container-low/40 transition-colors h-14">
                        <td className="px-space-md py-space-sm align-top">
                          <div className="flex items-center gap-space-xs">
                            <span className="font-label-md text-label-md font-semibold text-on-surface">{role.name}</span>
                            <span className={`px-1.5 py-0.5 rounded font-mono-data text-[10px] font-medium tracking-wide ${tag.bg}`}>
                              {tag.label}
                            </span>
                          </div>
                          <div className="font-mono-data text-mono-data text-secondary mt-0.5 text-[11px]">
                            code: {role.name.toLowerCase().replace(/\s+/g, '-')}
                          </div>
                        </td>

                        <td className="px-space-md py-space-sm align-top max-w-xs">
                          <p className="text-on-surface leading-snug line-clamp-2">
                            {role.description || (isRoot ? 'Full unrestricted root access to system modules, categories, users, roles, and approval engines.' : 'Role permissions defined for operational access control.')}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 font-mono-data text-[11px] text-secondary">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>System Policy</span>
                          </div>
                        </td>

                        <td className="px-space-md py-space-sm align-top">
                          <div className="flex flex-wrap gap-1 items-center">
                            <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-mono-data text-[10px] font-medium">
                              {isRoot ? 'all_scopes (*)' : `${permsCount} scopes`}
                            </span>
                            <span className="text-[11px] font-mono-data text-secondary ml-1">{permsCount}/12 granted</span>
                          </div>
                          <div className="w-24 h-1 bg-surface-container-high rounded-full mt-1.5 overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </td>

                        <td className="px-space-md py-space-sm align-top">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-label-sm font-label-sm font-medium ${
                            role.is_active
                              ? 'bg-[#ecfdf5] text-[#059669]'
                              : 'bg-surface-container-low text-secondary'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${role.is_active ? 'bg-[#059669]' : 'bg-outline'}`} />
                            {role.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        {canManage && (
                          <td className="px-space-md py-space-sm align-top text-right">
                            {isRoot ? (
                              <span className="px-2 py-1 rounded bg-surface-container-low text-secondary opacity-60 font-label-sm text-label-sm">
                                Locked
                              </span>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => { setEditing(role); setFormOpen(true) }}
                                  className="w-7 h-7 rounded hover:bg-surface-container-low flex items-center justify-center text-secondary hover:text-on-surface transition-colors cursor-pointer"
                                  title="Edit Role"
                                  type="button"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(role)}
                                  className="w-7 h-7 rounded hover:bg-error-container/40 flex items-center justify-center text-outline hover:text-error transition-colors cursor-pointer"
                                  title="Delete Role"
                                  type="button"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-space-sm px-space-md bg-surface-container-low/20 border-t border-outline-variant/30 flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-secondary">
                Showing <span className="font-semibold text-on-surface">{items.length}</span> of <span className="font-semibold text-on-surface">{totalRoles}</span> roles
              </span>
              <Pagination
                page={page}
                totalPages={totalPages}
                total={totalRoles}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      {formOpen && (
        <RoleForm
          role={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); fetchData(debouncedSearch, page) }}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget.id); return Promise.resolve() }}
        title="Delete Role"
        message={`Delete role "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
