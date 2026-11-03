import { auth } from '@/src/core/auth/auth'
import { redirect } from 'next/navigation'
import { ApprovalInbox } from './ApprovalInbox'

export async function ApprovalInboxPage() {
  const session = await auth()
  if (!session) redirect('/auth/login')
  if (!session.user.permissions.includes('approval.review')) redirect('/dashboard')

  return <ApprovalInbox />
}

