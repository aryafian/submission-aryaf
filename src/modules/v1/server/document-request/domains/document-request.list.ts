import type { DocumentRequest, InboxItem } from './document-request.entity'
import type { IPagination } from '@/src/shared/types/pagination'

export interface DocumentRequestList {
  items: DocumentRequest[]
  pagination: IPagination
}

export interface InboxList {
  items: InboxItem[]
  pagination: IPagination
}

