'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Clock, FileText, MessageSquare, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useSession } from 'next-auth/react'
import { useTitle } from '@/src/shared/contexts/TitleContext'
import { useRouter } from 'next/navigation'
import type { DocumentRequestDetail as DetailType } from '../domains/document-request.entity'
import { DocumentRequestRepository } from '../repositories/document-request.repository'

interface Props {
  id: number
}

export function DocumentRequestDetail({ id }: Props) {
  const { data: session } = useSession()
  const { setTitle } = useTitle()
  const router = useRouter()
  const [detail, setDetail] = useState<DetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectComment, setRejectComment] = useState('')
  const [approveComment, setApproveComment] = useState('')

  const canReview = session?.user?.permissions?.includes('approval.review')
  const userId = session?.user?.id ? Number(session.user.id) : null

  useEffect(() => {
    setTitle('Document Request Detail', 'View request details, multi-tier approval progress, and audit trail')
  }, [setTitle])

  const fetchDetail = useCallback(async () => {
    setLoading(true)
    try {
      const data = await DocumentRequestRepository.getById(id)
      setDetail(data)
    } catch {
      toast.error('Failed to load request detail')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchDetail() }, [fetchDetail])

  const activeStep = detail?.approval_steps?.find(
    (s) => s.status === 'pending' && s.step === detail.current_step && s.approver_id === userId
  )

  const isRequester = detail ? detail.requester_id === userId : false

  async function handleApprove() {
    if (!activeStep || !detail || !activeStep.instance_step_id) return
    setApproving(true)
    try {
      await DocumentRequestRepository.approve(activeStep.instance_step_id, approveComment || undefined)
      toast.success('Approved successfully')
      setApproveComment('')
      fetchDetail()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve')
    } finally {
      setApproving(false)
    }
  }

  async function handleReject() {
    if (!activeStep || !detail || !activeStep.instance_step_id || !rejectComment.trim()) {
      toast.error('Comment is required for rejection')
      return
    }
    setRejecting(true)
    try {
      await DocumentRequestRepository.reject(activeStep.instance_step_id, rejectComment.trim())
      toast.success('Rejected successfully')
      setRejectComment('')
      setShowRejectForm(false)
      fetchDetail()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject')
    } finally {
      setRejecting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-outline" />
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="p-12 text-center text-secondary font-body-md text-sm">
        Document request not found.
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm font-medium bg-[#ecfdf5] text-[#059669]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
            Approved
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm font-medium bg-[#fef2f2] text-[#dc2626]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
            Rejected
          </span>
        )
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm font-medium bg-[#fffbeb] text-[#d97706]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
            Pending Review
          </span>
        )
    }
  }

  return (
    <div className="flex flex-col w-full space-y-space-lg">
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 font-label-md text-label-md text-secondary hover:text-on-surface transition-colors cursor-pointer"
          type="button"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Requests</span>
        </button>

        <div className="font-mono-data text-[11px] text-secondary">
          DOCUMENT_ID: REQ-00{detail.id}
        </div>
      </div>

      {/* Main Request Header Card */}
      <div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm border border-outline-variant/30 flex flex-col space-y-space-md">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-space-sm pb-space-sm border-b border-outline-variant/20">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
                {detail.title}
              </h1>
            </div>
            <p className="font-body-md text-body-md text-secondary mt-1 max-w-2xl">
              {detail.description || 'No description provided.'}
            </p>
          </div>
          <div className="self-start">
            {getStatusBadge(detail.status)}
          </div>
        </div>

        {/* Metadata Properties Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md pt-2">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-medium">
              Category
            </span>
            <div className="mt-1">
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full font-mono-data text-[11px] font-semibold bg-secondary-container text-on-secondary-container">
                {detail.category_name}
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-medium">
              Requester
            </span>
            <span className="font-body-md text-body-md text-on-surface font-semibold mt-1">
              {detail.requester_name}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-medium">
              Current Step
            </span>
            <span className="font-mono-data text-[11px] text-on-surface mt-1">
              {detail.status === 'pending'
                ? `Step ${detail.current_step} of ${detail.total_steps}`
                : detail.status === 'approved' ? 'All Steps Complete' : 'Rejected at Step ' + detail.current_step}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-medium">
              Submitted Date
            </span>
            <span className="font-mono-data text-[11px] text-secondary mt-1">
              {new Date(detail.created_at).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* Sequential Multi-Step Approval Stepper */}
      <div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm border border-outline-variant/30">
        <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/30 mb-space-md">
          <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            Sequential Approval Workflow ({detail.total_steps} Steps)
          </h2>
          <span className="font-mono-data text-[11px] text-secondary">
            Category Rule: {detail.category_name}
          </span>
        </div>

        <div className="space-y-space-sm">
          {detail.approval_steps.map((step, index) => {
            const isActive = detail.status === 'pending' && step.step === detail.current_step
            const isApproved = step.status === 'approved'
            const isRejected = step.status === 'rejected'

            return (
              <div
                key={index}
                className={`p-space-md rounded-lg border flex items-start gap-space-md transition-colors ${
                  isActive
                    ? 'border-amber-300 bg-[#fffbeb]/40'
                    : isApproved
                    ? 'border-emerald-200 bg-[#ecfdf5]/20'
                    : isRejected
                    ? 'border-rose-200 bg-[#fef2f2]/30'
                    : 'border-outline-variant/20 bg-surface-container-low/30'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isApproved ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : isRejected ? (
                    <XCircle className="w-5 h-5 text-rose-600" />
                  ) : isActive ? (
                    <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
                  ) : (
                    <Clock className="w-5 h-5 text-outline" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-space-sm flex-wrap">
                    <span className="font-label-md text-label-md font-semibold text-on-surface">
                      Step {step.step}: {step.approver_name}
                    </span>
                    {isActive && (
                      <span className="px-1.5 py-0.2 rounded font-label-sm text-label-sm font-medium bg-[#fffbeb] text-[#d97706] border border-amber-300">
                        Active Step
                      </span>
                    )}
                    {isApproved && (
                      <span className="px-1.5 py-0.2 rounded font-label-sm text-label-sm font-medium bg-[#ecfdf5] text-[#059669]">
                        Approved
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-1.5 py-0.2 rounded font-label-sm text-label-sm font-medium bg-[#fef2f2] text-[#dc2626]">
                        Rejected
                      </span>
                    )}
                  </div>

                  <div className="font-mono-data text-[11px] text-secondary mt-1">
                    {isApproved && step.approved_at && (
                      <span>Approved on {new Date(step.approved_at).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                    {isRejected && step.approved_at && (
                      <span>Rejected on {new Date(step.approved_at).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                    {step.status === 'pending' && <span>Awaiting review by assigned approver</span>}
                  </div>

                  {step.notes && (
                    <div className="mt-2 text-xs bg-surface-container-low/70 rounded p-2.5 text-on-surface border border-outline-variant/20 flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-secondary mt-0.5 shrink-0" />
                      <span>{step.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Approver Action Card */}
      {canReview && activeStep && !isRequester && detail.status === 'pending' && (
        <div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm border border-amber-300 bg-amber-50/10">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              Your Action Required (Step {detail.current_step})
            </h3>
            <span className="px-2 py-0.5 rounded font-mono-data text-[10px] bg-amber-100 text-amber-800">
              Assigned Approver
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary mb-4">
            You are authorized as the designated approver for this active step. Select an action below:
          </p>

          {!showRejectForm ? (
            <div className="space-y-3">
              <Textarea
                value={approveComment}
                onChange={e => setApproveComment(e.target.value)}
                placeholder="Optional approval commentary for the audit log..."
                rows={2}
                className="rounded bg-surface-container-low border border-outline-variant/40 font-body-md text-xs text-on-surface focus:bg-surface-container-lowest focus:border-primary"
              />
              <div className="flex gap-2.5">
                <Button
                  onClick={handleApprove}
                  disabled={approving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-label-md text-label-md rounded shadow-sm gap-2"
                >
                  {approving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Approve Step
                </Button>
                <Button
                  onClick={() => setShowRejectForm(true)}
                  variant="outline"
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 font-label-md text-label-md rounded gap-2"
                >
                  <XCircle className="w-4 h-4" /> Reject Request
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-3 bg-surface-container-low/50 rounded border border-rose-200">
              <span className="font-label-sm text-label-sm text-rose-700 font-semibold block">
                Rejection Reason (Required)
              </span>
              <Textarea
                value={rejectComment}
                onChange={e => setRejectComment(e.target.value)}
                placeholder="State the reason for rejecting this document..."
                rows={3}
                required
                className="rounded bg-surface-container-lowest border border-outline-variant/60 font-body-md text-xs text-on-surface focus:border-error"
              />
              <div className="flex gap-2.5">
                <Button
                  onClick={handleReject}
                  disabled={rejecting || !rejectComment.trim()}
                  className="bg-error hover:bg-error/90 text-on-error font-label-md text-label-md rounded shadow-sm gap-2"
                >
                  {rejecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Confirm Rejection
                </Button>
                <Button
                  onClick={() => { setShowRejectForm(false); setRejectComment('') }}
                  variant="outline"
                  className="font-label-md text-label-md rounded border-outline-variant/60 text-secondary"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Requester Self-Approval Guard Notice */}
      {isRequester && activeStep && (
        <div className="bg-[#fffbeb] border border-amber-300 rounded-lg p-space-md flex items-center gap-space-sm text-amber-900 font-body-sm text-body-sm">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0" />
          <span>
            <strong>Self-Approval Guard:</strong> You are the author of this document. According to Section 3.2 of the specification, self-approval is strictly prohibited.
          </span>
        </div>
      )}

      {/* Immutable Audit Timeline */}
      <div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm border border-outline-variant/30">
        <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/30 mb-space-md">
          <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            Audit Trail &amp; Activity Log
          </h2>
          <span className="font-mono-data text-[11px] text-secondary">
            {detail.audit_logs.length} logged entries
          </span>
        </div>

        {detail.audit_logs.length === 0 ? (
          <p className="font-body-sm text-body-sm text-secondary">No audit logs recorded.</p>
        ) : (
          <div className="space-y-space-md">
            {detail.audit_logs.map(log => {
              const isApproved = log.action === 'approved'
              const isRejected = log.action === 'rejected'

              return (
                <div key={log.id} className="flex gap-space-sm items-start">
                  <div className="mt-0.5 shrink-0">
                    {isApproved ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : isRejected ? (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    ) : (
                      <FileText className="w-4 h-4 text-secondary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-label-md text-label-md font-semibold capitalize ${
                        isApproved ? 'text-emerald-700' : isRejected ? 'text-rose-700' : 'text-on-surface'
                      }`}>
                        {log.action}
                      </span>
                      <span className="font-mono-data text-[11px] text-secondary bg-surface-container-low px-1.5 py-0.2 rounded border border-outline-variant/30">
                        Step {log.step}
                      </span>
                      <span className="text-outline-variant">•</span>
                      <span className="font-body-md text-body-md text-on-surface font-medium">
                        {log.approver_name}
                      </span>
                    </div>

                    {log.comment && (
                      <p className="font-body-sm text-body-sm text-on-surface mt-1 bg-surface-container-low/50 p-2 rounded border border-outline-variant/20">
                        &quot;{log.comment}&quot;
                      </p>
                    )}

                    <p className="font-mono-data text-[10px] text-secondary mt-1">
                      {new Date(log.created_at).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
