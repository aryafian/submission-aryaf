import { DocumentRequestRepository } from '../repositories/document-request.repository'

export const DocumentRequestUsecase = {
  async list(page = 1, perPage = 20, keywords = '', myOnly = false) {
    return DocumentRequestRepository.getAll(page, perPage, keywords, myOnly)
  },

  async getById(id: number) {
    return DocumentRequestRepository.getById(id)
  },

  async create(data: { title: string; description?: string; categoryId: number }) {
    return DocumentRequestRepository.create(data)
  },

  async approve(instanceStepId: number, comment?: string) {
    return DocumentRequestRepository.approve(instanceStepId, comment)
  },

  async reject(instanceStepId: number, comment: string) {
    return DocumentRequestRepository.reject(instanceStepId, comment)
  },

  async inbox(page = 1, perPage = 20) {
    return DocumentRequestRepository.getInbox(page, perPage)
  },

  async getCategories() {
    return DocumentRequestRepository.getCategories()
  },
}

