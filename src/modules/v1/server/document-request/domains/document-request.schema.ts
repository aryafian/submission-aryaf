import { z } from 'zod'

export const createDocumentRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long').transform((v) => v.trim()),
  description: z.string().max(2000, 'Description is too long').transform((v) => v.trim()).optional().nullable(),
  categoryId: z.coerce.number().int().positive('Category is required'),
})

export const approvalActionSchema = z.object({
  comment: z.string().max(2000, 'Comment is too long').transform((v) => v.trim()).optional().nullable(),
})

export const rejectActionSchema = z.object({
  comment: z.string().min(1, 'Comment is required for rejection').max(2000, 'Comment is too long').transform((v) => v.trim()),
})

export type CreateDocumentRequestInput = z.infer<typeof createDocumentRequestSchema>
export type ApprovalActionInput = z.infer<typeof approvalActionSchema>
export type RejectActionInput = z.infer<typeof rejectActionSchema>

