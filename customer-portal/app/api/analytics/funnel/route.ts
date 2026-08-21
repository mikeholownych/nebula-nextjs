import { NextRequest, NextResponse } from 'next/server'
import { recordFunnelEvent, type FunnelEventPayload } from '@/app/lib/funnel-ledger'
import { getEventDefinition, type EventStage } from '@/app/lib/analytics-registry'
import { MAX_JSON_BODY_BYTES, jsonBodyTooLarge, payloadTooLargeResponse } from '@/app/lib/request-limits'

/**
 * POST /api/analytics/funnel
 * Ingests canonical client funnel events into the internal append-only event ledger.
 * Server-owned and payment events are rejected; invalid payloads are not inserted.
 */
export async function POST(request: NextRequest) {
  try {
    if (jsonBodyTooLarge(request)) {
      return payloadTooLargeResponse()
    }
    const text = await request.text()
    if (!text) {
      return NextResponse.json({ error: 'Empty body' }, { status: 400 })
    }
    if (new TextEncoder().encode(text).byteLength > MAX_JSON_BODY_BYTES) {
      return payloadTooLargeResponse()
    }

    let raw: Record<string, unknown>
    try {
      raw = JSON.parse(text) as Record<string, unknown>
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    const eventName = (raw.eventName || raw.event_name) as string
    if (!eventName) {
      return NextResponse.json({ error: 'eventName is required' }, { status: 400 })
    }
    if (eventName === 'purchase_completed') {
      return NextResponse.json({ error: 'Event is not client-ingestible' }, { status: 400 })
    }
    const def = getEventDefinition(eventName)
    if (!def || def.source_of_truth !== 'client') {
      return NextResponse.json({ error: 'Event is not client-ingestible' }, { status: 400 })
    }

    const payload: FunnelEventPayload = {
      eventName,
      eventVersion: typeof raw.eventVersion === 'number' ? raw.eventVersion : typeof raw.event_version === 'number' ? raw.event_version : undefined,
      stage: typeof raw.stage === 'string' ? (raw.stage as EventStage) : undefined,
      sourceSystem: (raw.sourceSystem || raw.source_system || 'client_beacon') as string,
      occurredAt: typeof raw.occurredAt === 'string' ? raw.occurredAt : typeof raw.occurred_at === 'string' ? raw.occurred_at : undefined,
      anonymousUserId: typeof raw.anonymousUserId === 'string' ? raw.anonymousUserId : typeof raw.anonymous_user_id === 'string' ? raw.anonymous_user_id : undefined,
      sessionId: typeof raw.sessionId === 'string' ? raw.sessionId : typeof raw.session_id === 'string' ? raw.session_id : undefined,
      journeyId: typeof raw.journeyId === 'string' ? raw.journeyId : typeof raw.journey_id === 'string' ? raw.journey_id : undefined,
      userId: typeof raw.userId === 'string' ? raw.userId : typeof raw.user_id === 'string' ? raw.user_id : undefined,
      auditAttemptId: typeof raw.auditAttemptId === 'string' ? raw.auditAttemptId : typeof raw.audit_attempt_id === 'string' ? raw.audit_attempt_id : undefined,
      auditId: typeof raw.auditId === 'string' ? raw.auditId : typeof raw.audit_id === 'string' ? raw.audit_id : undefined,
      checkoutSessionId: typeof raw.checkoutSessionId === 'string' ? raw.checkoutSessionId : typeof raw.checkout_session_id === 'string' ? raw.checkout_session_id : undefined,
      transactionId: typeof raw.transactionId === 'string' ? raw.transactionId : typeof raw.transaction_id === 'string' ? raw.transaction_id : undefined,
      status: raw.status === 'success' || raw.status === 'failed' || raw.status === 'rejected' ? raw.status : undefined,
      failureReason: typeof raw.failureReason === 'string' ? raw.failureReason : typeof raw.failure_reason === 'string' ? raw.failure_reason : undefined,
      dedupKey: typeof raw.dedupKey === 'string' ? raw.dedupKey : typeof raw.dedup_key === 'string' ? raw.dedup_key : undefined,
      deviceClass: typeof raw.deviceClass === 'string' ? raw.deviceClass : typeof raw.device_class === 'string' ? raw.device_class : undefined,
      landingPath: typeof raw.landingPath === 'string' ? raw.landingPath : typeof raw.landing_path === 'string' ? raw.landing_path : undefined,
      referrerClass: typeof raw.referrerClass === 'string' ? raw.referrerClass : typeof raw.referrer_class === 'string' ? raw.referrer_class : undefined,
      utmSource: typeof raw.utmSource === 'string' ? raw.utmSource : typeof raw.utm_source === 'string' ? raw.utm_source : undefined,
      utmMedium: typeof raw.utmMedium === 'string' ? raw.utmMedium : typeof raw.utm_medium === 'string' ? raw.utm_medium : undefined,
      utmCampaign: typeof raw.utmCampaign === 'string' ? raw.utmCampaign : typeof raw.utm_campaign === 'string' ? raw.utm_campaign : undefined,
      properties: (typeof raw.properties === 'object' && raw.properties !== null ? raw.properties : {}) as Record<string, unknown>,
    }

    const result = await recordFunnelEvent(payload)
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Invalid payload' }, { status: 400 })
    }

    return NextResponse.json({
      received: true,
      id: result.id,
      duplicate: result.duplicate || false,
    })
  } catch (error) {
    console.error('[API Funnel Ingest Error]:', error)
    return NextResponse.json({ error: 'Failed to ingest funnel event' }, { status: 500 })
  }
}
