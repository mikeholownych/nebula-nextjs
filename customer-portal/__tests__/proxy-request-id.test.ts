/** @jest-environment node */

import { NextRequest } from 'next/server'
import { proxy } from '@/proxy'

function apiRequest(headers: Record<string, string> = {}) {
  return new NextRequest('https://nebulacomponents.com/api/healthz', {
    headers: { host: 'nebulacomponents.com', ...headers },
  })
}

describe('proxy X-Request-ID', () => {
  it('does not redirect the canonical apex host to itself', () => {
    const response = proxy(apiRequest())
    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
  })
  it('mints a UUID when X-Request-ID is missing', () => {
    const response = proxy(apiRequest())
    const id = response.headers.get('x-request-id')
    expect(id).toEqual(expect.stringMatching(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    ))
  })

  it('mints a UUID when X-Request-ID is empty', () => {
    const response = proxy(apiRequest({ 'x-request-id': '   ' }))
    const id = response.headers.get('x-request-id')
    expect(id).toEqual(expect.stringMatching(/\S+/))
    expect(id?.trim()).not.toBe('')
  })

  it('forwards an existing X-Request-ID on the response', () => {
    const response = proxy(apiRequest({ 'x-request-id': 'req-existing-1' }))
    expect(response.headers.get('x-request-id')).toBe('req-existing-1')
  })
})
