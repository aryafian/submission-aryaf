'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { CategoryOption } from '../../domains/document-request.entity'
import { DocumentRequestRepository } from '../../repositories/document-request.repository'

interface DocumentRequestFormProps {
  onClose: () => void
  onSaved: () => void
}

export function DocumentRequestForm({ onClose, onSaved }: DocumentRequestFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [saving, setSaving] = useState(false)
  const [loadingCats, setLoadingCats] = useState(true)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => { titleRef.current?.focus() }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    DocumentRequestRepository.getCategories()
      .then(setCategories)
      .catch(() => toast.error('Failed to load categories'))
      .finally(() => setLoadingCats(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!categoryId) { toast.error('Please select a category'); return }

    setSaving(true)
    try {
      await DocumentRequestRepository.create({
        title,
        description: description || undefined,
        categoryId: Number(categoryId),
      })
      toast.success('Document request submitted')
      onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit request')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-[#dce9ff]/80">
        <div className="mb-5 flex items-center justify-between border-b border-[#e5eeff]/70 pb-3">
          <h3 className="text-base font-bold text-[#0b1c30]">New Document Request</h3>
          <span className="text-[11px] font-mono text-[#505f76] bg-[#eff4ff] px-2 py-0.5 rounded border border-[#dce9ff]">SOP Workflow</span>
        </div>

        <div className="mb-4">
          <Label htmlFor="dr-title" className="mb-1.5 block text-xs font-medium text-[#505f76]">Title *</Label>
          <Input
            id="dr-title"
            ref={titleRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            placeholder="Enter document title"
            className="rounded-lg border-[#dce9ff] text-xs focus:ring-[#d0e1fb] focus:border-[#d0e1fb]"
          />
        </div>

        <div className="mb-4">
          <Label htmlFor="dr-category" className="mb-1.5 block text-xs font-medium text-[#505f76]">Category *</Label>
          {loadingCats ? (
            <div className="flex items-center gap-2 text-xs text-[#76777d] py-2">
              <Loader2 size={13} className="animate-spin" /> Loading categories...
            </div>
          ) : (
            <select
              id="dr-category"
              value={categoryId}
              onChange={e => setCategoryId(Number(e.target.value))}
              required
              className="w-full rounded-lg border border-[#dce9ff] bg-white px-3 py-2 text-xs text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#d0e1fb] focus:border-[#d0e1fb]"
            >
              <option value="">Select category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.code ? `[${c.code}] ` : ''}{c.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="mb-5">
          <Label htmlFor="dr-desc" className="mb-1.5 block text-xs font-medium text-[#505f76]">Description</Label>
          <Textarea
            id="dr-desc"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe the document you need"
            className="rounded-lg border-[#dce9ff] text-xs focus:ring-[#d0e1fb] focus:border-[#d0e1fb]"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-[#e5eeff]/70">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="rounded-lg text-xs h-9">
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={saving}
            className="rounded-lg bg-[#ec4899] hover:bg-[#db2777] text-black shadow-sm gap-2 h-9 text-xs font-semibold"
          >
            {saving ? <><Loader2 size={13} className="animate-spin text-black" /> Submitting...</> : 'Submit Request'}
          </Button>
        </div>
      </form>
    </div>
  )
}
