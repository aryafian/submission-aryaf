import { DocumentRequestDetail } from '@/modules/v1/client/document-request/presentations/DocumentRequestDetail'

export default async function DocumentRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <DocumentRequestDetail id={Number(id)} />
}

