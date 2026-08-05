import { cookies, headers } from 'next/headers'
import { notFound } from 'next/navigation'
import ResultsClient from './ResultsClient'
import { verifyAuditUnlock } from '@/app/lib/audit-unlock-token'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ share?: string }>
}

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function ResultsPage({ params, searchParams }: Props) {
  const { id } = await params
  const { share } = await searchParams

  if (!UUID_RE.test(id)) notFound()

  const cookieStore = await cookies()
  const headersList = await headers()

  // --- Path 1: Cookie unlock (visitor submitted their email on this device) ---
  const cookieUnlocked = verifyAuditUnlock(id, cookieStore.get(`audit_unlock_${id}`)?.value)

  // --- Path 2: Workspace session (logged-in user bypasses the email gate) ---
  let sessionUnlocked = false
  const cookie = headersList.get('cookie')
  const authorization = headersList.get('authorization')
  if (!cookieUnlocked && (cookie || authorization)) {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          ...(cookie ? { cookie } : {}),
          ...(authorization ? { authorization } : {}),
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(3_000),
      })
      if (res.ok) {
        const user = await res.json()
        if (user.email) sessionUnlocked = true
      }
    } catch {
      // auth service down — fall through to other unlock paths
    }
  }

  // --- Path 3: Share-token unlock (third-party link) ---
  let sharedView = false
  let tokenUnlocked = false

  if (!cookieUnlocked && !sessionUnlocked && share && /^[\w-]{10,64}$/.test(share)) {
    try {
      const res = await fetch(`${API_BASE}/audit/${id}?share=${encodeURIComponent(share)}`, {
        next: { revalidate: 0 },
      })
      tokenUnlocked = res.ok
      if (res.ok) sharedView = true
    } catch {
      // upstream down — treat as locked; visitor will see the teaser
    }
  }

  const unlocked = cookieUnlocked || sessionUnlocked || tokenUnlocked

  return (
    <ResultsClient
      auditId={id}
      unlocked={unlocked}
      sharedView={sharedView}
    />
  )
}
