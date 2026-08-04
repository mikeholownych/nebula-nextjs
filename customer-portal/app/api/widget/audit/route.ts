import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { assertPublicHttpUrl } from '@/app/lib/ssrf-guard'

/**
 * Embeddable audit widget API (Play 4: agencies as distribution layer).
 *
 * POST /api/widget/audit
 * Body: { url, partner_id, visitor_email? }
 *
 * - Validates partner_id against nebula_audit.partners (via platform API)
 * - Enforces CORS: only Origins registered on the partner's allowlist
 * - Rate limits: 10 audits/hour per partner, 3 audits/day per visitor IP
 * - Runs the same audit engine as /api/audit/start (direct upstream call,
 *   NOT the x402-gated /api/audit/run)
 * - Records attribution in nebula_audit.audits (source=widget, partner_id)
 *   and in lead_state.db (leads row with source_partner)
 */

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'
const LEAD_DB = process.env.LEAD_STATE_DB ?? '/home/mike/nebula/lead_state.db'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nebulacomponents.com'

const PARTNER_HOURLY_LIMIT = 10
const IP_DAILY_LIMIT = 3

// ── Rate-limit store (SQLite, durable across restarts) ─────────────────────

function openUsageDb(): DatabaseSync {
  const db = new DatabaseSync(LEAD_DB)
  db.exec(`
    CREATE TABLE IF NOT EXISTS widget_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      partner_id TEXT NOT NULL,
      ip TEXT NOT NULL,
      ts TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE INDEX IF NOT EXISTS idx_widget_usage_partner ON widget_usage(partner_id, ts);
    CREATE INDEX IF NOT EXISTS idx_widget_usage_ip ON widget_usage(ip, ts);
  `)
  return db
}

function countSince(db: DatabaseSync, column: string, value: string, minutesAgo: number): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS cnt FROM widget_usage
       WHERE ${column} = ? AND ts >= strftime('%Y-%m-%dT%H:%M:%fZ','now', ?)`
    )
    .get(value, `-${minutesAgo} minutes`) as { cnt: number }
  return Number(row.cnt)
}

function recordUsage(db: DatabaseSync, partnerId: string, ip: string) {
  db.prepare('INSERT INTO widget_usage (partner_id, ip) VALUES (?, ?)').run(partnerId, ip)
}

function visitorIp(request: NextRequest): string {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}

function originDomain(origin: string | null): string | null {
  if (!origin) return null
  try {
    return new URL(origin).hostname.toLowerCase()
  } catch {
    return null
  }
}

// ── Partner validation via platform API ─────────────────────────────────────

async function lookupPartner(partnerId: string) {
  try {
    const res = await fetch(`${API_BASE}/audit/partners/${encodeURIComponent(partnerId)}`, {
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// ── CORS helpers ────────────────────────────────────────────────────────────

function corsHeaders(allowOrigin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
  if (allowOrigin) {
    headers['Access-Control-Allow-Origin'] = allowOrigin
  }
  return headers
}

// ── Route handlers ──────────────────────────────────────────────────────────

export async function OPTIONS(request: NextRequest) {
  const origin = originDomain(request.headers.get('origin'))
  const partnerId = request.headers.get('x-widget-partner') ?? ''
  const partner = partnerId ? await lookupPartner(partnerId) : null
  const allowed =
    origin && partner?.valid && (partner.domains ?? []).includes(origin)
      ? `https://${origin}`
      : null
  return new NextResponse(null, { status: allowed ? 204 : 403, headers: corsHeaders(allowed) })
}

export async function POST(request: NextRequest) {
  let body: { url?: string; partner_id?: string; visitor_email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { url, partner_id, visitor_email } = body

  // 1. Partner must exist and be active
  if (!partner_id || typeof partner_id !== 'string') {
    return NextResponse.json({ error: 'partner_id is required' }, { status: 400 })
  }
  const partner = await lookupPartner(partner_id)
  if (!partner || partner.error) {
    return NextResponse.json({ error: 'Unknown partner', code: 'PARTNER_NOT_FOUND' }, { status: 403 })
  }
  if (!partner.valid) {
    return NextResponse.json({ error: 'Partner is not active', code: 'PARTNER_INACTIVE' }, { status: 403 })
  }

  // 2. CORS: if an Origin is present, it must be on the partner allowlist
  const origin = originDomain(request.headers.get('origin'))
  const allowOrigin = origin && (partner.domains ?? []).includes(origin) ? `https://${origin}` : null
  if (origin && !allowOrigin) {
    return NextResponse.json(
      { error: 'Origin not allowed for this partner', code: 'CORS_DENIED' },
      { status: 403, headers: corsHeaders(null) }
    )
  }

  // 3. URL validation + SSRF guard (same as /api/audit/start)
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }
  let processedUrl = url.trim()
  if (!processedUrl.match(/^https?:\/\//i)) {
    processedUrl = 'https://' + processedUrl
  }
  let parsedUrl: URL
  try {
    parsedUrl = new URL(processedUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
  }
  try {
    await assertPublicHttpUrl(parsedUrl)
  } catch {
    return NextResponse.json({ error: 'URL is not a public address' }, { status: 400 })
  }

  // 4. Rate limits (10/hr per partner, 3/day per IP)
  const ip = visitorIp(request)
  const usageDb = openUsageDb()
  try {
    const partnerHourly = countSince(usageDb, 'partner_id', partner_id, 60)
    if (partnerHourly >= PARTNER_HOURLY_LIMIT) {
      return NextResponse.json(
        { error: 'Partner hourly limit reached', code: 'PARTNER_RATE_LIMIT', retryInMinutes: 60 },
        { status: 429, headers: corsHeaders(allowOrigin) }
      )
    }
    if (ip !== 'unknown') {
      const ipDaily = countSince(usageDb, 'ip', ip, 60 * 24)
      if (ipDaily >= IP_DAILY_LIMIT) {
        return NextResponse.json(
          { error: 'Daily audit limit reached for this visitor', code: 'IP_RATE_LIMIT', retryInHours: 24 },
          { status: 429, headers: corsHeaders(allowOrigin) }
        )
      }
    }
  } finally {
    // Keep the connection open for the usage write after a successful run
  }

  // 5. Run the audit (direct upstream, same engine as /api/audit/start)
  const anonymousEmail = `anonymous+${randomUUID()}@invalid.nebulacomponents.com`
  const normalizedEmail =
    typeof visitor_email === 'string' && visitor_email.trim()
      ? visitor_email.trim().toLowerCase()
      : null

  const upstream = await fetch(`${API_BASE}/audit/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: processedUrl,
      email: anonymousEmail,
      name: null,
      source: 'widget',
      partner_id,
    }),
    signal: AbortSignal.timeout(120_000),
  })

  if (!upstream.ok) {
    return NextResponse.json(
      { error: 'Audit engine unavailable' },
      { status: 503, headers: corsHeaders(allowOrigin) }
    )
  }

  let data: {
    audit_id?: string
    score?: number | null
    grade?: string | null
    findings?: Array<{ key?: string; issue?: string; impact?: number; label?: string }> | null
  }
  try {
    data = await upstream.json()
  } catch {
    return NextResponse.json(
      { error: 'Audit engine returned an invalid response' },
      { status: 502, headers: corsHeaders(allowOrigin) }
    )
  }

  // Record usage + lead attribution
  try {
    recordUsage(usageDb, partner_id, ip)
    const leads = new DatabaseSync(LEAD_DB)
    // SQLite has no ADD COLUMN IF NOT EXISTS — check then ALTER (idempotent)
    const cols = leads.prepare('PRAGMA table_info(leads)').all().map((c) => c.name)
    if (!cols.includes('source_partner')) {
      leads.exec('ALTER TABLE leads ADD COLUMN source_partner TEXT')
    }
    leads
      .prepare(
        `INSERT INTO leads (email, url, stage, source, trigger_context, audit_score, audit_grade, source_partner, discovered_at, updated_at)
         VALUES (?, ?, 'widget', 'widget', ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'))`
      )
      .run(
        normalizedEmail ?? `anonymous+${randomUUID()}@invalid.nebulacomponents.com`,
        processedUrl,
        partner_id,
        data.score ?? null,
        data.grade ?? null,
        partner_id
      )
    leads.close()
  } catch (e) {
    // Attribution is best-effort — never fail the audit response on a DB hiccup
    console.error('[widget] attribution write failed:', e)
  } finally {
    usageDb.close()
  }

  // 6. Build the score card response
  const findings = Array.isArray(data.findings) ? data.findings : []
  const findingsSummary = findings
    .sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0))
    .slice(0, 3)
    .map((f) => ({
      key: f.key ?? null,
      label: f.label ?? f.key ?? 'Finding',
      issue: (f.issue ?? '').slice(0, 140),
    }))

  const auditId = data.audit_id ?? ''
  const fullReportUrl = `${SITE_URL}/audit/${auditId}/results?partner=${encodeURIComponent(partner_id)}`

  return NextResponse.json(
    {
      audit_id: auditId,
      url: processedUrl,
      score: data.score ?? null,
      grade: data.grade ?? null,
      findings_summary: findingsSummary,
      full_report_url: fullReportUrl,
    },
    { headers: corsHeaders(allowOrigin) }
  )
}
