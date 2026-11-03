'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Loader2, Search, Pencil, Trash2, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useSession } from 'next-auth/react'
import { useTitle } from '@/src/shared/contexts/TitleContext'
import { Pagination } from '@/src/shared/partials/Pagination'
import { CategoryForm } from './components/CategoryForm'
import type { Category } from '../domains/category.entity'
import type { CategoryList } from '../domains/category.list'
import { CategoryRepository } from '../repositories/category.repository'

export function CategoryTable() {
  const { data: session } = useSession()
  const { setTitle } = useTitle()
  const [pageData, setPageData] = useState<CategoryList | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const canManage = session?.user?.permissions?.includes('master-data.manage')

  useEffect(() => {
    setTitle('Categories')
  }, [setTitle])

  const fetchData = useCallback(async (q: string, p: number) => {
    setLoading(true)
    try {
      const data = await CategoryRepository.getAll(p, 20, q)
      setPageData(data)
    } catch {
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(debouncedSearch, page) }, [fetchData, debouncedSearch, page])

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 300)
    return () => clearTimeout(timer)
  }, [search])

  function openNew() { setEditing(null); setFormOpen(true) }
  function openEdit(cat: Category) { setEditing(cat); setFormOpen(true) }

  async function handleDelete(id: number) {
    try {
      await CategoryRepository.softDelete(id)
      toast.success('Category deleted')
      fetchData(debouncedSearch, page)
    } catch {
      toast.error('Failed to delete category')
    }
    setDeleteTarget(null)
  }

  const allItems = pageData?.items ?? []
  const items = allItems.filter(item => {
    if (statusFilter === 'active') return item.is_active
    if (statusFilter === 'inactive') return !item.is_active
    return true
  })

  const pagination = pageData?.pagination
  const totalCount = pagination?.total ?? allItems.length
  const totalPages = pagination?.total_pages ?? 1

  return (
    <div className="flex flex-col w-full space-y-space-lg">
      {/* Top Context / Breadcrumb & Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-secondary tracking-wider uppercase font-medium">
            <span>Master Data</span>
            <span className="text-outline-variant font-mono-data">/</span>
            <span className="text-on-surface font-semibold">Categories</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Categories</h1>
        </div>

        {canManage && (
          <div className="flex items-center gap-space-sm self-start md:self-auto">
            <button
              onClick={openNew}
              type="button"
              className="h-9 px-space-md rounded-lg bg-[#ec4899] hover:bg-[#db2777] text-black font-label-md text-label-md flex items-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-colors cursor-pointer font-semibold"
            >
              <Plus className="w-4 h-4 text-black" />
              <span className="text-black">New Category</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Table Container */}
      <div className="bg-surface-container-lowest rounded-lg shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-outline-variant/30 overflow-hidden">
        {/* Filter & Search Toolbar */}
        <div className="p-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container-lowest border-b border-outline-variant/30">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="w-full h-8 pl-8 pr-8 rounded-lg bg-surface-container-low font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest border border-transparent focus:border-outline-variant/60 transition-colors text-xs"
            />
          </div>

          <div className="flex items-center gap-space-xs self-end sm:self-auto">
            <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-surface-container-low font-label-md text-label-md text-on-surface">
              <span className="text-secondary font-normal">Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="bg-transparent font-medium text-on-surface focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <button
              onClick={() => fetchData(debouncedSearch, page)}
              type="button"
              className="w-8 h-8 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
              title="Refresh table"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-outline" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-secondary font-body-md text-sm">
            {search ? 'No categories match your search.' : 'No categories yet.'}
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="h-9 bg-surface-container-low/60 font-label-sm text-label-sm uppercase tracking-wider text-secondary">
                    <th className="px-space-md font-semibold w-24">Code</th>
                    <th className="px-space-md font-semibold w-64">Name</th>
                    <th className="px-space-md font-semibold">Description</th>
                    <th className="px-space-md font-semibold w-32">Status</th>
                    {canManage && <th className="px-space-md font-semibold w-24 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 font-body-md text-body-md text-on-surface">
                  {items.map(cat => (
                    <tr key={cat.id} className="h-12 hover:bg-surface-container-low/40 transition-colors">
                      <td className="px-space-md whitespace-nowrap">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full font-mono-data text-[11px] font-semibold bg-secondary-container text-on-secondary-container tracking-wider">
                          {cat.code || '-'}
                        </span>
                      </td>
                      <td className="px-space-md whitespace-nowrap font-headline-sm text-headline-sm text-on-surface">
                        {cat.name}
                      </td>
                      <td className="px-space-md text-secondary max-w-md truncate">
                        {cat.description || 'No description provided'}
                      </td>
                      <td className="px-space-md whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-label-sm font-label-sm font-medium ${
                          cat.is_active
                            ? 'bg-[#ecfdf5] text-[#059669]'
                            : 'bg-surface-container-low text-secondary'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cat.is_active ? 'bg-[#059669]' : 'bg-outline'}`} />
                          {cat.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {canManage && (
                        <td className="px-space-md text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(cat)}
                              className="w-7 h-7 rounded hover:bg-surface-container-low flex items-center justify-center text-secondary hover:text-on-surface transition-colors cursor-pointer"
                              title="Edit Category"
                              type="button"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(cat)}
                              className="w-7 h-7 rounded hover:bg-error-container/40 flex items-center justify-center text-outline hover:text-error transition-colors cursor-pointer"
                              title="Delete Category"
                              type="button"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-space-sm px-space-md bg-surface-container-low/20 border-t border-outline-variant/30 flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-secondary">
                Showing <span className="font-semibold text-on-surface">{items.length}</span> of <span className="font-semibold text-on-surface">{totalCount}</span> categories
              </span>
              <Pagination
                page={page}
                totalPages={totalPages}
                total={totalCount}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      {formOpen && (
        <CategoryForm
          category={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); fetchData(debouncedSearch, page) }}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget.id); return Promise.resolve() }}
        title="Delete Category"
        message={`Delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
