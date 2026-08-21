import { NextResponse } from 'next/server'

export const MAX_JSON_BODY_BYTES = 16 * 1024

export function jsonBodyTooLarge(request: Request): boolean {
  const raw = request.headers.get('content-length')
  if (raw == null || raw.trim() === '') return false
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n > MAX_JSON_BODY_BYTES
}

export function payloadTooLargeResponse() {
  return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
}

export async function readCappedJson<T>(request: Request): Promise<
  { ok: true; body: T } | { ok: false; response: NextResponse }
> {
  if (jsonBodyTooLarge(request)) {
    return { ok: false, response: payloadTooLargeResponse() }
  }
  let text: string
  try {
    text = await request.text()
  } catch {
    return { ok: false, response: NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }
  }
  if (new TextEncoder().encode(text).byteLength > MAX_JSON_BODY_BYTES) {
    return { ok: false, response: payloadTooLargeResponse() }
  }
  try {
    return { ok: true, body: JSON.parse(text) as T }
  } catch {
    return { ok: false, response: NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }
  }
}
