'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Loader2, Eye, CheckCircle2, XCircle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useSession } from 'next-auth/react'
import { useTitle } from '@/src/shared/contexts/TitleContext'
import { useRouter } from 'next/navigation'
import { Pagination } from '@/src/shared/partials/Pagination'
import type { InboxList } from '../domains/document-request.list'
import { DocumentRequestRepository } from '../repositories/document-request.repository'

export function ApprovalInbox() {
  const { data: session } = useSession()
  const { setTitle } = useTitle()
  const router = useRouter()
  const [pageData, setPageData] = useState<InboxList | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [actionTarget, setActionTarget] = useState<{ id: number; action: 'approve' | 'reject' } | null>(null)
  const [comment, setComment] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    setTitle('Approval Inbox')
  }, [setTitle])

  const fetchData = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const data = await DocumentRequestRepository.getInbox(p, 20)
      setPageData(data)
    } catch {
      toast.error('Failed to load inbox')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(page) }, [fetchData, page])

  async function handleAction() {
    if (!actionTarget) return
    if (actionTarget.action === 'reject' && !comment.trim()) {
      toast.error('Comment is required for rejection')
      return
    }

    setProcessing(true)
    try {
      if (actionTarget.action === 'approve') {
        await DocumentRequestRepository.approve(actionTarget.id, comment || undefined)
        toast.success('Approved successfully')
      } else {
        await DocumentRequestRepository.reject(actionTarget.id, comment.trim())
        toast.success('Rejected successfully')
      }
      setActionTarget(null)
      setComment('')
      fetchData(page)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setProcessing(false)
    }
  }

  const items = pageData?.items ?? []
  const pagination = pageData?.pagination
  const totalCount = pagination?.total ?? items.length
  const totalPages = pagination?.total_pages ?? 1

  return (
    <div className="flex flex-col w-full space-y-space-lg">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-secondary tracking-wider uppercase font-medium">
            <span>Document Request</span>
            <span className="text-outline-variant font-mono-data">/</span>
            <span className="text-on-surface font-semibold">Approval Inbox</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Approval Inbox</h1>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-surface-container-lowest rounded-lg shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="p-space-md flex items-center justify-between border-b border-outline-variant/30">
          <div className="flex items-center gap-2">
            <span className="font-label-md text-label-md font-semibold text-on-surface">Pending Requests</span>
            <span className="px-2 py-0.5 rounded-full font-mono-data text-[11px] font-semibold bg-secondary-container text-on-secondary-container">
              {totalCount} awaiting
            </span>
          </div>

          <button
            onClick={() => fetchData(page)}
            type="button"
            className="w-8 h-8 rounded bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
            title="Refresh inbox"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-outline" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-secondary font-body-md text-sm">
            No pending approvals. You&apos;re completely caught up!
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="h-9 bg-surface-container-low/60 text-secondary font-label-sm text-label-sm uppercase tracking-wider">
                    <th className="px-space-md font-semibold">Document Title</th>
                    <th className="px-space-md font-semibold w-32">Category</th>
                    <th className="px-space-md font-semibold w-40">Requester</th>
                    <th className="px-space-md font-semibold w-36">Current Step</th>
                    <th className="px-space-md font-semibold w-32">Date</th>
                    <th className="px-space-md font-semibold w-28 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 font-body-md text-body-md text-on-surface">
                  {items.map(item => (
                    <tr key={item.instance_step_id} className="h-12 hover:bg-surface-container-low/40 transition-colors">
                      <td className="px-space-md font-semibold text-on-surface">
                        <div className="flex flex-col">
                          <span className="font-headline-sm text-headline-sm text-on-surface leading-tight">
                            {item.title}
                          </span>
                          <span className="font-mono-data text-[10px] text-secondary">
                            REQ-00{item.document_request_id}
                          </span>
                        </div>
                      </td>
                      <td className="px-space-md whitespace-nowrap">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full font-mono-data text-[11px] font-semibold bg-secondary-container text-on-secondary-container tracking-wider">
                          {item.category_name}
                        </span>
                      </td>
                      <td className="px-space-md text-on-surface whitespace-nowrap font-medium text-xs">
                        {item.requester_name}
                      </td>
                      <td className="px-space-md whitespace-nowrap">
                        <span className="font-mono-data text-[11px] bg-surface-container-low text-on-surface px-2 py-0.5 rounded border border-outline-variant/30">
                          Step {item.current_step} of {item.total_steps}
                        </span>
                      </td>
                      <td className="px-space-md font-mono-data text-mono-data text-secondary whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-space-md text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => router.push(`/dashboard/document-request/${item.document_request_id}`)}
                            className="w-7 h-7 rounded hover:bg-surface-container-low flex items-center justify-center text-secondary hover:text-on-surface transition-colors cursor-pointer"
                            title="View Detail"
                            type="button"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setActionTarget({ id: item.instance_step_id, action: 'approve' }); setComment('') }}
                            className="w-7 h-7 rounded hover:bg-[#ecfdf5] flex items-center justify-center text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                            title="Approve Request"
                            type="button"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setActionTarget({ id: item.instance_step_id, action: 'reject' }); setComment('') }}
                            className="w-7 h-7 rounded hover:bg-[#fef2f2] flex items-center justify-center text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                            title="Reject Request"
                            type="button"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-space-sm px-space-md bg-surface-container-low/20 border-t border-outline-variant/30 flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-secondary">
                Showing <span className="font-semibold text-on-surface">{items.length}</span> of <span className="font-semibold text-on-surface">{totalCount}</span> actionable requests
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

      {/* Action Modal */}
      {actionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-lg bg-surface-container-lowest p-6 shadow-xl border border-outline-variant/30">
            <h3 className="mb-2 font-headline-sm text-headline-sm font-semibold text-on-surface">
              {actionTarget.action === 'approve' ? 'Approve Document Request' : 'Reject Document Request'}
            </h3>
            <p className="font-body-sm text-body-sm text-secondary mb-4">
              {actionTarget.action === 'approve'
                ? 'Confirm approval for this sequential step. An optional comment will be recorded in the immutable audit trail.'
                : 'A reason for rejection is required and will be displayed on the document timeline.'}
            </p>
            <Textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder={actionTarget.action === 'approve' ? 'Optional approval notes...' : 'Reason for rejection (mandatory)...'}
              rows={3}
              className="rounded bg-surface-container-low border border-outline-variant/40 font-body-md text-xs text-on-surface focus:bg-surface-container-lowest focus:border-primary mb-4"
            />
            <div className="flex justify-end gap-2.5 pt-3 border-t border-outline-variant/30">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setActionTarget(null); setComment('') }}
                className="font-label-md text-label-md rounded border-outline-variant/60 text-secondary hover:text-on-surface"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAction}
                disabled={processing || (actionTarget.action === 'reject' && !comment.trim())}
                className={`font-label-md text-label-md rounded shadow-sm gap-2 ${
                  actionTarget.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-error hover:bg-error/90 text-on-error'
                }`}
              >
                {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {actionTarget.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
