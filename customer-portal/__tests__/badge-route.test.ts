/** @jest-environment node */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/badge/[id]/route'

const BADGE_ID = '11111111-1111-1111-1111-111111111111'

const badgeData = {
  badge_id: BADGE_ID,
  url: 'https://example.com',
  serial_number: 7,
  before_score: 3.8,
  after_score: 6.1,
  earned_year: 2026,
}

function request(referer?: string) {
  const headers: Record<string, string> = {}
  if (referer) headers['referer'] = referer
  return new NextRequest(`http://localhost:3000/api/badge/${BADGE_ID}`, { headers })
}

async function callWithParams(id: string, referer?: string) {
  return GET(request(referer), { params: Promise.resolve({ id }) })
}

describe('GET /api/badge/[id] domain-locked rendering', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('renders the passing badge when the Referer matches the audited domain', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(Response.json(badgeData))

    const response = await callWithParams(BADGE_ID, 'https://example.com/pricing')
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/svg+xml')
    expect(body).toContain('3.8')
    expect(body).toContain('6.1')
    expect(body).toContain('#7')
    expect(body).not.toContain('Unverified')
  })

  it('renders unverified when the Referer host does not match', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(Response.json(badgeData))

    const response = await callWithParams(BADGE_ID, 'https://a-different-site.com/')
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(body).toContain('Unverified placement')
    expect(body).not.toContain('3.8')
  })

  it('renders unverified when there is no Referer at all', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(Response.json(badgeData))

    const response = await callWithParams(BADGE_ID)
    const body = await response.text()

    expect(body).toContain('Unverified placement')
  })

  it('renders unverified when the badge does not exist upstream', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(null, { status: 404 }))

    const response = await callWithParams(BADGE_ID, 'https://example.com/')
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(body).toContain('Unverified placement')
  })

  it('renders unverified for a malformed badge id without calling upstream', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')

    const response = await callWithParams('not-a-uuid', 'https://example.com/')
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(body).toContain('Unverified placement')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('strips a leading www. before comparing hosts', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(Response.json(badgeData))

    const response = await callWithParams(BADGE_ID, 'https://www.example.com/pricing')
    const body = await response.text()

    expect(body).toContain('3.8')
    expect(body).not.toContain('Unverified')
  })

  it('never renders raw url content - only numbers are interpolated', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      Response.json({ ...badgeData, url: 'https://example.com/<script>alert(1)</script>' })
    )

    const response = await callWithParams(BADGE_ID, 'https://example.com/pricing')
    const body = await response.text()

    expect(body).not.toContain('<script>alert')
  })
})
