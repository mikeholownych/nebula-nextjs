/** @jest-environment node */
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/newsletter/confirm/route'

const origin = 'https://nebulacomponents.com'
const fetchMock = jest.fn()
const originalFetch = global.fetch
beforeEach(() => { global.fetch = fetchMock; fetchMock.mockReset() })
afterAll(() => { global.fetch = originalFetch })

test('missing token is rejected without touching upstream', async () => {
  const response = await GET(new NextRequest(`${origin}/api/newsletter/confirm`))
  expect(response.status).toBe(400)
  expect(fetchMock).not.toHaveBeenCalled()
})

test('valid token reaches platform exactly once with manual redirect and no cache', async () => {
  const token = 'isolated+token/with?reserved=&characters'
  fetchMock.mockResolvedValue(new Response(null, {status: 307, headers: {location: `${origin}/newsletter/confirmed`}}))
  const response = await GET(new NextRequest(`${origin}/api/newsletter/confirm?token=${encodeURIComponent(token)}`))
  expect(fetchMock).toHaveBeenCalledTimes(1)
  const [url, options] = fetchMock.mock.calls[0]
  expect(new URL(url).pathname).toBe('/api/newsletter/confirm')
  expect(new URL(url).searchParams.get('token')).toBe(token)
  expect(options).toEqual({cache: 'no-store', redirect: 'manual'})
  expect(response.status).toBe(307)
  expect(response.headers.get('location')).toBe(`${origin}/newsletter/confirmed`)
})

test('invalid token preserves upstream rejection without success redirect', async () => {
  fetchMock.mockResolvedValue(Response.json({detail: 'Invalid or expired confirmation link'}, {status: 400}))
  const response = await GET(new NextRequest(`${origin}/api/newsletter/confirm?token=isolated-invalid`))
  expect(response.status).toBe(400)
  expect(await response.json()).toEqual({detail: 'Invalid or expired confirmation link'})
  expect(response.headers.get('location')).toBeNull()
})
