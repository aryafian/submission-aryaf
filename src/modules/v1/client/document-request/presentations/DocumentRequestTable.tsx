'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Loader2, Search, Eye, RotateCw } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTitle } from '@/src/shared/contexts/TitleContext'
import { useRouter } from 'next/navigation'
import { Pagination } from '@/src/shared/partials/Pagination'
import { DocumentRequestForm } from './components/DocumentRequestForm'
import type { DocumentRequestList } from '../domains/document-request.list'
import { DocumentRequestRepository } from '../repositories/document-request.repository'

export function DocumentRequestTable() {
  const { data: session } = useSession()
  const { setTitle } = useTitle()
  const router = useRouter()
  const [pageData, setPageData] = useState<DocumentRequestList | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const canManage = session?.user?.permissions?.includes('document-request.manage')

  useEffect(() => {
    setTitle('My Document Requests')
  }, [setTitle])

  const fetchData = useCallback(async (q: string, p: number) => {
    setLoading(true)
    try {
      const data = await DocumentRequestRepository.getAll(p, 20, q, true)
      setPageData(data)
    } catch {
      toast.error('Failed to load document requests')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(debouncedSearch, page) }, [fetchData, debouncedSearch, page])

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const allItems = pageData?.items ?? []
  const items = allItems.filter(item => {
    if (statusFilter !== 'all') return item.status === statusFilter
    return true
  })

  const totalCount = pageData?.pagination?.total ?? allItems.length
  const totalPages = pageData?.pagination?.total_pages ?? 1

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-label-sm font-label-sm font-medium bg-[#ecfdf5] text-[#059669]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
            Approved
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-label-sm font-label-sm font-medium bg-[#fef2f2] text-[#dc2626]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
            Rejected
          </span>
        )
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-label-sm font-label-sm font-medium bg-[#fffbeb] text-[#d97706]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
            Pending Review
          </span>
        )
    }
  }

  return (
    <div className="flex flex-col w-full space-y-space-lg">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-secondary tracking-wider uppercase font-medium">
            <span>Document Request</span>
            <span className="text-outline-variant font-mono-data">/</span>
            <span className="text-on-surface font-semibold">My Requests</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">My Document Requests</h1>
        </div>

        {canManage && (
          <div className="flex items-center gap-space-sm self-start md:self-auto">
            <button
              onClick={() => setFormOpen(true)}
              type="button"
              className="h-9 px-space-md rounded-lg bg-[#ec4899] hover:bg-[#db2777] text-black font-label-md text-label-md flex items-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-colors cursor-pointer font-semibold"
            >
              <Plus className="w-4 h-4 text-black" />
              <span className="text-black">New Request</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Table Container */}
      <div className="bg-surface-container-lowest rounded-lg shadow-sm border border-outline-variant/30 overflow-hidden">
        {/* Filter & Search Toolbar */}
        <div className="p-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container-lowest border-b border-outline-variant/30">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search requests by title..."
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
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
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
            {search ? 'No requests match your search query.' : 'No document requests submitted yet.'}
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="h-9 bg-surface-container-low/60 font-label-sm text-label-sm uppercase tracking-wider text-secondary">
                    <th className="px-space-md font-semibold">Document Title</th>
                    <th className="px-space-md font-semibold w-36">Category</th>
                    <th className="px-space-md font-semibold w-36">Status</th>
                    <th className="px-space-md font-semibold w-40">Approval Progress</th>
                    <th className="px-space-md font-semibold w-32">Submitted</th>
                    <th className="px-space-md font-semibold w-20 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 font-body-md text-body-md text-on-surface">
                  {items.map(item => (
                    <tr key={item.id} className="h-12 hover:bg-surface-container-low/40 transition-colors">
                      <td className="px-space-md font-semibold text-on-surface">
                        <div className="flex flex-col">
                          <span className="font-headline-sm text-headline-sm text-on-surface leading-tight">
                            {item.title}
                          </span>
                          <span className="font-mono-data text-[10px] text-secondary">
                            REQ-00{item.id}
                          </span>
                        </div>
                      </td>
                      <td className="px-space-md whitespace-nowrap">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full font-mono-data text-[11px] font-semibold bg-secondary-container text-on-secondary-container tracking-wider">
                          {item.category_name}
                        </span>
                      </td>
                      <td className="px-space-md whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-space-md whitespace-nowrap">
                        <span className="font-mono-data text-[11px] bg-surface-container-low text-on-surface px-2 py-0.5 rounded border border-outline-variant/30">
                          {item.status === 'pending'
                            ? `Step ${item.current_step ?? 1} of ${item.total_steps}`
                            : item.status === 'approved' ? 'All Steps Complete' : 'Approval Stopped'}
                        </span>
                      </td>
                      <td className="px-space-md font-mono-data text-mono-data text-secondary whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-space-md text-right whitespace-nowrap">
                        <button
                          onClick={() => router.push(`/dashboard/document-request/${item.id}`)}
                          className="w-7 h-7 rounded hover:bg-surface-container-low flex items-center justify-center text-secondary hover:text-on-surface transition-colors cursor-pointer ml-auto"
                          title="View Request Details"
                          type="button"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-space-sm px-space-md bg-surface-container-low/20 border-t border-outline-variant/30 flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-secondary">
                Showing <span className="font-semibold text-on-surface">{items.length}</span> of <span className="font-semibold text-on-surface">{totalCount}</span> document requests
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
        <DocumentRequestForm
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); fetchData(debouncedSearch, page) }}
        />
      )}
    </div>
  )
}
