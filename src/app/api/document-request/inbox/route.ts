import { NextRequest } from 'next/server'
import { DocumentRequestUsecase } from '@/modules/v1/server/document-request/usecases/document-request.usecase'
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/src/shared/utils/api-response'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const page = Number(searchParams.get('page')) || 1
    const perPage = Number(searchParams.get('per_page')) || 20

    const result = await DocumentRequestUsecase.inbox(page, perPage)
    return apiSuccess(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    if (message === 'Unauthorized') return apiUnauthorized()
    if (message === 'Forbidden') return apiForbidden()
    return apiError(message, 'E-000', 500)
  }
}

