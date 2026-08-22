// Server-side read layer for public teardowns. Reads from the Platform API
// (ISR, 300s) with a last-good in-memory cache so an API blip degrades to
// stale content, never a 500 or an empty page.
const PLATFORM_API = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

function internalHeaders(): Record<string, string> {
  const secret = (process.env.INTERNAL_API_SECRET || '').trim()
  return secret ? { Authorization: `Bearer ${secret}` } : {}
}

export type TeardownFinding = {
  key: string
  label: string
  priority: number
  quadrant: string
  issue: string
  evidence: string
  fix: string
}

export type TeardownRecord = {
  slug: string
  name: string
  url: string
  domain: string
  score: number
  grade: string
  audited_at: string | null
  audited_at_iso?: string | null
  summary: string
  context: string
  findings: TeardownFinding[]
  screenshot_path: string | null
  claim: {
    status: string
    verification_method: string
    response_status: string | null
    response_text?: string | null
  } | null
}

export type TeardownListItem = {
  slug: string
  name: string
  domain: string
  score: number
  grade: string
  audited_at: string | null
  claimed: boolean
  /** Present on current list responses; used only as an index-card copy fallback. */
  summary?: string
}

// Presentation snapshot: display strings the shipped HTML carried before the
// read switch, for values the API does not currently model exactly (audit
// dates recorded at month precision, one legacy domain label). Keyed by slug;
// Tasks 10/11/14 consume fetchTeardown() and this map instead of per-page
// constants.
const DISPLAY_SNAPSHOT: Record<string, { domain?: string; auditedAt?: string }> = {
  folioverse: { domain: 'www.folioverse.app' },
  linear: { auditedAt: 'August 2026' },
  loom: { auditedAt: 'August 2026' },
  miro: { auditedAt: 'August 2026' },
  clickup: { auditedAt: 'August 2026' },
  airtable: { auditedAt: 'August 2026' },
  pipedrive: { auditedAt: 'August 2026' },
  mixpanel: { auditedAt: 'August 2026' },
  amplitude: { auditedAt: 'August 2026' },
  drift: { auditedAt: 'August 2026' },
}

const lastGood = new Map<string, TeardownRecord>()
let lastGoodList: TeardownListItem[] = []

export async function fetchTeardown(slug: string): Promise<TeardownRecord | null> {
  try {
    const res = await fetch(`${PLATFORM_API}/teardowns/${encodeURIComponent(slug)}`, {
      headers: internalHeaders(),
      next: { revalidate: 300 },
    })
    if (!res.ok) throw new Error(String(res.status))
    const data = (await res.json()) as TeardownRecord
    const snapshot = DISPLAY_SNAPSHOT[slug]
    if (snapshot?.domain) data.domain = snapshot.domain
    lastGood.set(slug, data)
    return data
  } catch {
    // Cold start after a deploy: the ISR/data cache may be empty and the
    // platform API blip-prone. Retry once bypassing the data cache so a
    // transient failure never bakes a null-metadata render into ISR.
    try {
      const res = await fetch(`${PLATFORM_API}/teardowns/${encodeURIComponent(slug)}`, {
        headers: internalHeaders(),
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as TeardownRecord
      const snapshot = DISPLAY_SNAPSHOT[slug]
      if (snapshot?.domain) data.domain = snapshot.domain
      lastGood.set(slug, data)
      return data
    } catch {
      return lastGood.get(slug) ?? null
    }
  }
}

export async function fetchTeardownList(): Promise<TeardownListItem[]> {
  try {
    const res = await fetch(`${PLATFORM_API}/teardowns/`, {
      headers: internalHeaders(),
      next: { revalidate: 300 },
    })
    if (!res.ok) throw new Error(String(res.status))
    const data = await res.json()
    const rows = data.teardowns as TeardownListItem[]
    lastGoodList = rows
    return rows
  } catch {
    // Same cold-start retry as fetchTeardown: never let a transient blip
    // prerender or revalidate the index as an empty grid.
    try {
      const res = await fetch(`${PLATFORM_API}/teardowns/`, {
        headers: internalHeaders(),
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(String(res.status))
      const data = await res.json()
      const rows = data.teardowns as TeardownListItem[]
      lastGoodList = rows
      return rows
    } catch {
      return lastGoodList
    }
  }
}

export function formatAuditedDate(t: TeardownRecord): string {
  const iso = t.audited_at_iso ?? (t.audited_at ? t.audited_at.slice(0, 10) : null)
  if (iso) {
    const d = new Date(`${iso}T00:00:00Z`)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      })
    }
  }
  return DISPLAY_SNAPSHOT[t.slug]?.auditedAt ?? ''
}
