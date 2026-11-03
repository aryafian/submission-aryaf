import { DocumentRequestUsecase } from '@/modules/v1/server/document-request/usecases/document-request.usecase'
import { apiSuccess, apiError, apiUnauthorized } from '@/src/shared/utils/api-response'

export async function GET() {
  try {
    const result = await DocumentRequestUsecase.getCategories()
    return apiSuccess(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    if (message === 'Unauthorized') return apiUnauthorized()
    return apiError(message, 'E-000', 500)
  }
}

