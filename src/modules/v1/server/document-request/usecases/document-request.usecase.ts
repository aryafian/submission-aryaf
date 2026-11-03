import { auth } from '@/src/core/auth/auth'
import { DocumentRequestRepository } from '../repositories/document-request.repository'
import { Loggers } from '@/src/shared/utils/logger'

const log = Loggers.document_request

export const DocumentRequestUsecase = {
  async list(page = 1, perPage = 20, keywords = '', myOnly = false) {
    const session = await auth()
    if (!session) {
      log.warn('list unauthorized')
      throw new Error('Unauthorized')
    }

    if (!session.user.permissions.includes('document-request.view')) {
      throw new Error('Forbidden')
    }

    const requesterId = myOnly ? Number(session.user.id) : undefined
    return DocumentRequestRepository.getAll(page, perPage, keywords, requesterId)
  },

  async getById(id: number) {
    const session = await auth()
    if (!session) {
      log.warn('getById unauthorized')
      throw new Error('Unauthorized')
    }

    if (!session.user.permissions.includes('document-request.view')) {
      throw new Error('Forbidden')
    }

    const result = await DocumentRequestRepository.getById(id)
    if (!result) throw new Error('Document request not found')
    return result
  },

  async create(data: { title: string; description?: string; categoryId: number }) {
    const session = await auth()
    if (!session?.user?.permissions?.includes('document-request.manage')) {
      log.warn('create forbidden', { user: session?.user?.name })
      throw new Error('Forbidden')
    }

    const result = await DocumentRequestRepository.create({
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      requesterId: Number(session.user.id),
    })

    log.info('created document request', { user: session.user.name, docRequestId: result.id })
    return result
  },

  async approve(id: number, comment?: string) {
    const session = await auth()
    if (!session?.user?.permissions?.includes('approval.review')) {
      log.warn('approve forbidden', { user: session?.user?.name })
      throw new Error('Forbidden')
    }

    const result = await DocumentRequestRepository.processApproval(
      id,
      Number(session.user.id),
      'approve',
      comment,
    )

    log.info('approved document request step', { user: session.user.name, instanceStepId: id })
    return result
  },

  async reject(id: number, comment: string) {
    const session = await auth()
    if (!session?.user?.permissions?.includes('approval.review')) {
      log.warn('reject forbidden', { user: session?.user?.name })
      throw new Error('Forbidden')
    }

    const result = await DocumentRequestRepository.processApproval(
      id,
      Number(session.user.id),
      'reject',
      comment,
    )

    log.info('rejected document request step', { user: session.user.name, instanceStepId: id, comment })
    return result
  },

  async inbox(page = 1, perPage = 20) {
    const session = await auth()
    if (!session?.user?.permissions?.includes('approval.review')) {
      log.warn('inbox forbidden', { user: session?.user?.name })
      throw new Error('Forbidden')
    }

    return DocumentRequestRepository.getInbox(Number(session.user.id), page, perPage)
  },

  async getCategories() {
    const session = await auth()
    if (!session) {
      throw new Error('Unauthorized')
    }
    return DocumentRequestRepository.getCategories()
  },
}

