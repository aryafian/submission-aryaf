import { NextRequest } from 'next/server'
import { DocumentRequestUsecase } from '@/modules/v1/server/document-request/usecases/document-request.usecase'
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/src/shared/utils/api-response'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await DocumentRequestUsecase.getById(Number(id))
    return apiSuccess(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    if (message === 'Unauthorized') return apiUnauthorized()
    if (message === 'Forbidden') return apiForbidden()
    if (message === 'Document request not found') return apiError(message, 'E-404', 404)
    return apiError(message, 'E-000', 500)
  }
}

