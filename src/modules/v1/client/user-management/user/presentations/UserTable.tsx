'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Loader2, Search, Pencil, Trash2, Shield, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useSession } from 'next-auth/react'
import { useTitle } from '@/src/shared/contexts/TitleContext'
import { Pagination } from '@/src/shared/partials/Pagination'
import { UserForm } from './components/UserForm'
import { AssignRoleModal } from './components/AssignRoleModal'
import type { User } from '../domains/user.entity'
import type { UserList } from '../domains/user.list'
import { UserRepository } from '../repositories/user.repository'

export function UserTable() {
  const { data: session } = useSession()
  const { setTitle } = useTitle()
  const [pageData, setPageData] = useState<UserList | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [roleTarget, setRoleTarget] = useState<User | null>(null)
  const canManage = session?.user?.permissions?.includes('user.manage')

  useEffect(() => {
    setTitle('Users')
  }, [setTitle])

  const fetchData = useCallback(async (q: string, p: number) => {
    setLoading(true)
    try {
      const data = await UserRepository.getAll(p, 20, q)
      setPageData(data)
    } catch {
      toast.error('Failed to load users')
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
      await UserRepository.softDelete(id)
      toast.success('User deleted successfully')
      fetchData(debouncedSearch, page)
    } catch {
      toast.error('Failed to delete user')
    }
    setDeleteTarget(null)
  }

  const allItems = pageData?.items ?? []
  const filteredItems = allItems.filter(u => {
    if (roleFilter !== 'all') {
      const hasRole = u.roles?.some(r => (typeof r === 'string' ? r : (r as { name: string }).name).toLowerCase() === roleFilter.toLowerCase())
      if (!hasRole) return false
    }
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'Active'
      if (u.is_active !== isActive) return false
    }
    return true
  })

  const totalUsers = pageData?.pagination?.total ?? allItems.length
  const totalPages = pageData?.pagination?.total_pages ?? 1

  return (
    <div className="flex flex-col w-full space-y-space-lg">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-secondary tracking-wider uppercase font-medium">
            <span>User Management</span>
            <span className="text-outline-variant font-mono-data">/</span>
            <span className="text-on-surface font-semibold">Users</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Users</h1>
        </div>

        {canManage && (
          <div className="flex items-center gap-space-sm self-start md:self-auto">
            <button
              onClick={() => { setEditing(null); setFormOpen(true) }}
              type="button"
              className="h-9 px-space-md rounded-lg bg-[#ec4899] hover:bg-[#db2777] text-black font-label-md text-label-md flex items-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-colors cursor-pointer font-semibold"
            >
              <Plus className="w-4 h-4 text-black" />
              <span className="text-black">New User</span>
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
              placeholder="Search users by name, username, or email..."
              className="w-full h-8 pl-8 pr-3 rounded bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container border border-transparent focus:border-outline-variant/60 transition-colors text-xs"
            />
          </div>

          <div className="flex items-center gap-space-sm flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 h-8 px-2.5 rounded bg-surface-container-low font-label-md text-label-md text-on-surface">
              <span className="text-secondary font-normal">Role:</span>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="bg-transparent font-medium text-on-surface focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">All</option>
                <option value="super-admin">super-admin</option>
                <option value="admin">admin</option>
                <option value="approver">approver</option>
                <option value="viewer">viewer</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 h-8 px-2.5 rounded bg-surface-container-low font-label-md text-label-md text-on-surface">
              <span className="text-secondary font-normal">Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-transparent font-medium text-on-surface focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

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
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-secondary font-body-md text-sm">
            {search ? 'No users match your search.' : 'No users found.'}
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/70">
                    <th className="py-2.5 px-margin font-label-sm text-label-sm font-semibold text-secondary uppercase tracking-wider">Name</th>
                    <th className="py-2.5 px-margin font-label-sm text-label-sm font-semibold text-secondary uppercase tracking-wider">Username</th>
                    <th className="py-2.5 px-margin font-label-sm text-label-sm font-semibold text-secondary uppercase tracking-wider">Email</th>
                    <th className="py-2.5 px-margin font-label-sm text-label-sm font-semibold text-secondary uppercase tracking-wider">Roles</th>
                    <th className="py-2.5 px-margin font-label-sm text-label-sm font-semibold text-secondary uppercase tracking-wider">Status</th>
                    {canManage && <th className="py-2.5 px-margin font-label-sm text-label-sm font-semibold text-secondary uppercase tracking-wider text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 font-body-md text-body-md text-on-surface">
                  {filteredItems.map(user => {
                    const initials = user.name
                      ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                      : user.username.slice(0, 2).toUpperCase()
                    const isRoot = user.roles?.some(r => (typeof r === 'string' ? r : (r as { name: string }).name) === 'super-admin')

                    return (
                      <tr key={user.id} className="hover:bg-surface-container-low/60 transition-colors group h-12">
                        <td className="py-3 px-margin font-body-md text-body-md font-semibold text-on-surface whitespace-nowrap">
                          <div className="flex items-center gap-space-sm">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-label-sm text-label-sm font-bold ${isRoot ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'}`}>
                              {initials}
                            </div>
                            <span>{user.name}</span>
                            {isRoot && (
                              <span className="px-1.5 py-0.2 rounded font-mono-data text-[10px] bg-primary text-on-primary font-medium tracking-wide">
                                ROOT
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-margin font-mono-data text-mono-data text-secondary whitespace-nowrap">
                          {user.username}
                        </td>
                        <td className="py-3 px-margin font-mono-data text-mono-data text-on-surface whitespace-nowrap">
                          {user.email || '-'}
                        </td>
                        <td className="py-3 px-margin whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {user.roles?.map((roleItem, rIdx) => {
                              const roleName = typeof roleItem === 'string' ? roleItem : (roleItem as { name: string }).name
                              return (
                                <span
                                  key={rIdx}
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono-data text-mono-data ${
                                    roleName === 'super-admin'
                                      ? 'bg-primary text-on-primary'
                                      : 'bg-secondary-container/60 text-on-secondary-container'
                                  }`}
                                >
                                  <Shield className="w-3 h-3" />
                                  <span>{roleName}</span>
                                </span>
                              )
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-margin whitespace-nowrap">
                          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-label-sm text-label-sm font-medium ${user.is_active ? 'bg-[#ecfdf5] text-[#059669]' : 'bg-surface-container-low text-secondary'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-[#10b981]' : 'bg-outline'}`} />
                            <span>{user.is_active ? 'Active' : 'Inactive'}</span>
                          </div>
                        </td>
                        {canManage && (
                          <td className="py-3 px-margin whitespace-nowrap text-right">
                            <div className="inline-flex items-center justify-end gap-1">
                              <button
                                onClick={() => setRoleTarget(user)}
                                className="w-7 h-7 rounded flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                                title="Manage Roles"
                                type="button"
                              >
                                <Shield className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => { setEditing(user); setFormOpen(true) }}
                                className="w-7 h-7 rounded flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                                title="Edit User"
                                type="button"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(user)}
                                className="w-7 h-7 rounded flex items-center justify-center text-outline hover:text-error hover:bg-error-container transition-colors cursor-pointer"
                                title="Delete User"
                                type="button"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
                Showing <span className="font-semibold text-on-surface">{filteredItems.length}</span> of <span className="font-semibold text-on-surface">{totalUsers}</span> users
              </span>
              <Pagination
                page={page}
                totalPages={totalPages}
                total={totalUsers}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      {formOpen && (
        <UserForm
          user={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); fetchData(debouncedSearch, page) }}
        />
      )}

      {roleTarget && (
        <AssignRoleModal
          user={roleTarget}
          onClose={() => setRoleTarget(null)}
          onSaved={() => { setRoleTarget(null); fetchData(debouncedSearch, page) }}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget.id); return Promise.resolve() }}
        title="Delete User"
        message={`Delete user "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
