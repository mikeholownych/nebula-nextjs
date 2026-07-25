/** @jest-environment node */

// Live production logs showed recurring "SyntaxError: Unexpected end of
// JSON input" 500s on this route — request.json() and apiResponse.json()
// both throw uncaught on an empty/malformed body, and the route's outer
// catch turned that into an opaque 500 with no useful signal. Fixed to
// return clean, typed error responses instead.

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/audit/start/route'

function rawRequest(body: string) {
  return new NextRequest('http://localhost/api/audit/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
}

describe('POST /api/audit/start malformed-body handling', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  it('returns 400 for an empty request body instead of a raw 500', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')

    const response = await POST(rawRequest(''))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Invalid request body')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('returns 400 for a truncated/malformed JSON body', async () => {
    const response = await POST(rawRequest('{"url": "https://example.com"'))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Invalid request body')
  })

  it('returns 502 when FastAPI responds 2xx with a non-JSON/empty body', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response('', { status: 200, headers: { 'Content-Type': 'application/json' } })
    )

    const response = await POST(rawRequest(JSON.stringify({ url: 'https://example.com' })))
    const body = await response.json()

    expect(response.status).toBe(502)
    expect(body.error).toBe('Audit service returned an invalid response')
  })
})
