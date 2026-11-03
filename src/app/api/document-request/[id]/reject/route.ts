import { NextRequest } from 'next/server'
import { DocumentRequestUsecase } from '@/modules/v1/server/document-request/usecases/document-request.usecase'
import { rejectActionSchema } from '@/modules/v1/server/document-request/domains/document-request.schema'
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/src/shared/utils/api-response'
import { ZodError } from 'zod'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const validated = rejectActionSchema.parse(body)

    const result = await DocumentRequestUsecase.reject(Number(id), validated.comment)
    return apiSuccess(result, 'Rejected successfully')
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      const message = err.errors.map((e) => e.message).join(', ')
      return apiError(message, 'E-VAL', 400)
    }
    const message = err instanceof Error ? err.message : 'Internal server error'
    if (message === 'Unauthorized') return apiUnauthorized()
    if (message === 'Forbidden') return apiForbidden()
    return apiError(message, 'E-000', 400)
  }
}
