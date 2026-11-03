'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Category } from '../../domains/category.entity'
import { CategoryRepository } from '../../repositories/category.repository'

interface CategoryFormProps {
  category?: Category | null
  onClose: () => void
  onSaved: () => void
}

export function CategoryForm({ category, onClose, onSaved }: CategoryFormProps) {
  const [code, setCode] = useState(category?.code || '')
  const [name, setName] = useState(category?.name || '')
  const [description, setDescription] = useState(category?.description || '')
  const [saving, setSaving] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => { nameRef.current?.focus() }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      if (category) {
        await CategoryRepository.update(category.id, {
          code: code || undefined,
          name,
          description: description || undefined,
        })
        toast.success('Category updated successfully')
      } else {
        await CategoryRepository.create({
          code: code || undefined,
          name,
          description: description || undefined,
        })
        toast.success('Category created successfully')
      }
      onSaved()
    } catch {
      toast.error('Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg bg-surface-container-lowest p-6 shadow-xl border border-outline-variant/30">
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-5">
          <div className="flex items-center gap-2">
            <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              {category ? 'Edit Category' : 'New Category'}
            </h3>
            <span className="px-1.5 py-0.5 rounded font-mono-data text-[10px] bg-secondary-container text-on-secondary-container">
              Master Data
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-outline hover:text-on-surface rounded p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="category-code" className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block mb-1">
              Category Code
            </Label>
            <Input
              id="category-code"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
              placeholder="e.g. HR, FIN, IT, OPS"
              className="rounded bg-surface-container-low border-outline-variant/40 text-on-surface font-mono-data text-xs focus:bg-surface-container-lowest focus:border-primary"
            />
          </div>

          <div>
            <Label htmlFor="category-name" className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block mb-1">
              Category Name *
            </Label>
            <Input
              id="category-name"
              ref={nameRef}
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="e.g. Sumber Daya Manusia"
              className="rounded bg-surface-container-low border-outline-variant/40 text-on-surface text-xs focus:bg-surface-container-lowest focus:border-primary"
            />
          </div>

          <div>
            <Label htmlFor="category-desc" className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block mb-1">
              Description
            </Label>
            <Textarea
              id="category-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the category scope and document types..."
              className="rounded bg-surface-container-low border-outline-variant/40 text-on-surface text-xs focus:bg-surface-container-lowest focus:border-primary"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-outline-variant/30 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="font-label-md text-label-md rounded border-outline-variant/60 text-secondary hover:text-on-surface"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#ec4899] hover:bg-[#db2777] text-black font-label-md text-label-md rounded shadow-sm gap-2 font-semibold"
          >
            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin text-black" /> Saving...</> : (category ? 'Save Changes' : 'Create Category')}
          </Button>
        </div>
      </form>
    </div>
  )
}
