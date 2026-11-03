import type { DocumentRequestList, InboxList } from '../domains/document-request.list'
import type { DocumentRequestDetail, CategoryOption } from '../domains/document-request.entity'

export const DocumentRequestRepository = {
  async getAll(page = 1, perPage = 20, keywords = '', myOnly = false): Promise<DocumentRequestList> {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('per_page', String(perPage))
    if (keywords) params.set('keywords', keywords)
    if (myOnly) params.set('my_only', 'true')

    const res = await fetch(`/api/document-request?${params.toString()}`)
    if (!res.ok) throw new Error('Failed to fetch document requests')
    const json = await res.json()
    return json.data ?? json
  },

  async getById(id: number): Promise<DocumentRequestDetail> {
    const res = await fetch(`/api/document-request/${id}`)
    if (!res.ok) throw new Error('Failed to fetch document request detail')
    const json = await res.json()
    return json.data ?? json
  },

  async create(data: { title: string; description?: string; categoryId: number }): Promise<{ id: number }> {
    const res = await fetch('/api/document-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error(json.message || 'Failed to create document request')
    }
    const json = await res.json()
    return json.data ?? json
  },

  async approve(instanceStepId: number, comment?: string): Promise<void> {
    const res = await fetch(`/api/document-request/${instanceStepId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment }),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error(json.message || 'Failed to approve')
    }
  },

  async reject(instanceStepId: number, comment: string): Promise<void> {
    const res = await fetch(`/api/document-request/${instanceStepId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment }),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error(json.message || 'Failed to reject')
    }
  },

  async getInbox(page = 1, perPage = 20): Promise<InboxList> {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('per_page', String(perPage))

    const res = await fetch(`/api/document-request/inbox?${params.toString()}`)
    if (!res.ok) throw new Error('Failed to fetch inbox')
    const json = await res.json()
    return json.data ?? json
  },

  async getCategories(): Promise<CategoryOption[]> {
    const res = await fetch('/api/document-request/categories')
    if (!res.ok) throw new Error('Failed to fetch categories')
    const json = await res.json()
    return json.data ?? json
  },
}

