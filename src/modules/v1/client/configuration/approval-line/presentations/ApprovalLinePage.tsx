'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useSession } from 'next-auth/react'
import { useTitle } from '@/src/shared/contexts/TitleContext'
import { useApprovalLineTable } from './hooks/useApprovalLineTable'
import { ApprovalLineTable } from './components/ApprovalLineTable'
import { ApprovalLineForm } from './components/ApprovalLineForm'
import { ApprovalLineSteps } from './components/ApprovalLineSteps'
import type { ApprovalLine } from '../domains/approval-line.entity'

export function ApprovalLinePage() {
  const { data: session } = useSession()
  const { setTitle } = useTitle()
  const { pageData, loading, search, setSearch, page, setPage, fetchData, handleDelete, handleCreate, handleUpdate } = useApprovalLineTable()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ApprovalLine | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ApprovalLine | null>(null)
  const [stepsTarget, setStepsTarget] = useState<ApprovalLine | null>(null)

  const canManage = session?.user?.permissions?.includes('configuration.approval-line.manage')

  useEffect(() => {
    setTitle('Approval Lines', 'Configure approval workflows per feature and category')
  }, [setTitle])

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(item: ApprovalLine) {
    setEditing(item)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (deleteTarget) {
      await handleDelete(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="flex flex-col w-full space-y-space-lg">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-secondary tracking-wider uppercase font-medium">
            <span>Configuration</span>
            <span className="text-outline-variant font-mono-data">/</span>
            <span className="text-on-surface font-semibold">Approval Lines</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Approval Lines</h1>
          <p className="font-body-md text-body-md text-secondary">
            Configure multi-tier sequential approval workflow chains per category and feature.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-space-sm self-start md:self-auto">
            <button
              onClick={openNew}
              type="button"
              className="h-9 px-space-md rounded-lg bg-[#ec4899] hover:bg-[#db2777] text-black font-label-md text-label-md flex items-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-colors cursor-pointer font-semibold"
            >
              <Plus className="w-4 h-4 text-black" />
              <span className="text-black">New Approval Line</span>
            </button>
          </div>
        )}
      </div>

      <ApprovalLineTable
        pageData={pageData}
        loading={loading}
        search={search}
        onSearchChange={setSearch}
        page={page}
        onPageChange={setPage}
        canManage={!!canManage}
        onEdit={openEdit}
        onDelete={item => setDeleteTarget(item)}
        onViewSteps={item => setStepsTarget(item)}
      />

      {formOpen && (
        <ApprovalLineForm
          open={formOpen}
          item={editing}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onSaved={() => {
            setFormOpen(false)
            fetchData()
          }}
          onClose={() => setFormOpen(false)}
        />
      )}

      {stepsTarget && (
        <ApprovalLineSteps
          open={!!stepsTarget}
          workflow={stepsTarget}
          onClose={() => {
            setStepsTarget(null)
            fetchData()
          }}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Approval Line"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
