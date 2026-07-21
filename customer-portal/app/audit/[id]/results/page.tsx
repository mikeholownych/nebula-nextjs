import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import ResultsClient from './ResultsClient'

interface Props {
  params: Promise<{ id: string }>
}

/**
 * Server component — reads the httpOnly unlock cookie and passes `unlocked`
 * as a prop to the client component. This prevents forging ?unlocked=true
 * in the URL from exposing all findings without a real email submission.
 */
export default async function ResultsPage({ params }: Props) {
  const { id } = await params

  // Validate UUID format before doing anything
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  if (!isUuid && id.length > 300) {
    notFound()
  }

  const cookieStore = await cookies()
  const unlockCookie = cookieStore.get(`audit_unlock_${id}`)
  const unlocked = unlockCookie !== undefined

  return <ResultsClient auditId={id} unlocked={unlocked} />
}
