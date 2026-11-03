'use client'

import { Loader2, Pencil, Trash2, ListOrdered, Search } from 'lucide-react'
import { Pagination } from '@/src/shared/partials/Pagination'
import type { ApprovalLine } from '../../domains/approval-line.entity'
import type { ApprovalLineList } from '../../domains/approval-line.list'

interface Props {
  pageData: ApprovalLineList | null
  loading: boolean
  search: string
  onSearchChange: (q: string) => void
  page: number
  onPageChange: (p: number) => void
  canManage: boolean
  onEdit: (item: ApprovalLine) => void
  onDelete: (item: ApprovalLine) => void
  onViewSteps: (item: ApprovalLine) => void
}

export function ApprovalLineTable({
  pageData,
  loading,
  search,
  onSearchChange,
  page,
  onPageChange,
  canManage,
  onEdit,
  onDelete,
  onViewSteps,
}: Props) {
  const items = pageData?.items ?? []
  const pagination = pageData?.pagination
  const totalPages = pagination?.total_pages ?? 1

  return (
    <div className="bg-surface-container-lowest rounded-lg shadow-sm border border-outline-variant/30 overflow-hidden">
      <div className="p-space-md border-b border-outline-variant/30">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            placeholder="Search approval lines..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded bg-surface-container-low font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container border border-transparent focus:border-outline-variant/60 transition-colors text-xs"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-outline" />
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center text-secondary font-body-md text-sm">
          {search ? 'No approval lines match your search.' : 'No approval lines configured yet.'}
        </div>
      ) : (
        <>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="h-9 bg-surface-container-low/60 text-secondary font-label-sm text-label-sm uppercase tracking-wider">
                  <th className="px-space-md py-2 font-medium">Workflow Name</th>
                  <th className="px-space-md py-2 font-medium">Feature Scope</th>
                  <th className="px-space-md py-2 font-medium">Steps</th>
                  <th className="px-space-md py-2 font-medium">Status</th>
                  {canManage && <th className="px-space-md py-2 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15 font-body-md text-body-md text-on-surface">
                {items.map(item => (
                  <tr key={item.id} className="h-12 hover:bg-surface-container-low/40 transition-colors">
                    <td className="px-space-md font-semibold text-on-surface">
                      {item.name}
                    </td>
                    <td className="px-space-md">
                      {item.featureName ? (
                        <span className="inline-flex items-center rounded-full bg-secondary-container px-2.5 py-0.5 font-mono-data text-[11px] font-semibold text-on-secondary-container">
                          {item.featureName}
                        </span>
                      ) : (
                        <span className="text-secondary text-xs">-</span>
                      )}
                    </td>
                    <td className="px-space-md">
                      <button
                        type="button"
                        onClick={() => onViewSteps(item)}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-mono-data text-[11px] transition-colors cursor-pointer"
                      >
                        <ListOrdered className="w-3.5 h-3.5 text-secondary" />
                        <span>{item.stepsCount ?? 0} sequential steps</span>
                      </button>
                    </td>
                    <td className="px-space-md">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-label-sm font-label-sm font-medium ${
                        item.isActive
                          ? 'bg-[#ecfdf5] text-[#059669]'
                          : 'bg-surface-container-low text-secondary'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-[#059669]' : 'bg-outline'}`} />
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-space-md text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="w-7 h-7 rounded hover:bg-surface-container-low flex items-center justify-center text-secondary hover:text-on-surface transition-colors cursor-pointer"
                            title="Edit Workflow"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(item)}
                            className="w-7 h-7 rounded hover:bg-error-container/40 flex items-center justify-center text-outline hover:text-error transition-colors cursor-pointer"
                            title="Delete Workflow"
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
              Showing <span className="font-semibold text-on-surface">{items.length}</span> of <span className="font-semibold text-on-surface">{pagination?.total ?? items.length}</span> workflows
            </span>
            <Pagination
              page={page}
              totalPages={totalPages}
              total={pagination?.total ?? 0}
              onPageChange={onPageChange}
            />
          </div>
        </>
      )}
    </div>
  )
}
