import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import ResultsClient from './ResultsClient'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ share?: string }>
}

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Server component — determines unlock state via two paths:
 *
 * 1. Cookie path  — the visitor submitted their email on this device.
 *    The httpOnly `audit_unlock_{id}` cookie was set by /api/audit/unlock.
 *
 * 2. Share-token path — a third party opened a ?share=<token> link.
 *    We verify the token against FastAPI server-side (never in the browser)
 *    so the token can't be brute-forced client-side.
 *
 * Both paths render the full ResultsClient with unlocked=true.
 * The share path also sets sharedView=true so the client can suppress
 * the email-gate form and magic-link offer.
 */
export default async function ResultsPage({ params, searchParams }: Props) {
  const { id } = await params
  const { share } = await searchParams

  if (!UUID_RE.test(id)) notFound()

  // --- Cookie unlock (own device) ---
  const cookieStore = await cookies()
  const cookieUnlocked = cookieStore.get(`audit_unlock_${id}`) !== undefined

  // --- Share-token unlock (third-party link) ---
  let sharedView = false
  let tokenUnlocked = false

  if (share && /^[\w-]{10,64}$/.test(share)) {
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

  const unlocked = cookieUnlocked || tokenUnlocked

  return (
    <ResultsClient
      auditId={id}
      unlocked={unlocked}
      sharedView={sharedView}
    />
  )
}
