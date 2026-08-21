/** @jest-environment node */

import { readFileSync } from 'node:fs'
import path from 'node:path'

const query = jest.fn()
const release = jest.fn()
const connect = jest.fn()

jest.mock('@/app/lib/db', () => ({
  pool: {
    query: (...args: unknown[]) => query(...args),
    connect: (...args: unknown[]) => connect(...args),
  },
}))

import { NextRequest } from 'next/server'
import { GET as healthzGet } from '@/app/api/healthz/route'
import { GET as readyzGet } from '@/app/api/readyz/route'

function mockReadyClient() {
  release.mockReset()
  query.mockReset()
  connect.mockReset()
  connect.mockResolvedValue({ query, release })
}

describe('GET /api/healthz', () => {
  beforeEach(() => {
    mockReadyClient()
  })

  it('returns 200 without querying the database or calling /audit/run', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')
    const response = await healthzGet()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe('ok')
    expect(query).not.toHaveBeenCalled()
    expect(connect).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})

describe('GET /api/readyz', () => {
  beforeEach(() => {
    mockReadyClient()
    query.mockResolvedValue({ rows: [{ ok: 1 }] })
  })

  it('returns 503 when SELECT 1 throws', async () => {
    query.mockRejectedValue(new Error('connection refused'))

    const response = await readyzGet()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.status).toBe('not_ready')
    expect(release).toHaveBeenCalled()
  })

  it('returns 503 when SELECT 1 times out and releases the client', async () => {
    query.mockImplementation((sql: unknown) => {
      const text = typeof sql === 'string' ? sql : String(sql)
      if (text.includes('SELECT 1')) {
        return Promise.reject(new Error('canceling statement due to statement timeout'))
      }
      return Promise.resolve({ rows: [{ ok: 1 }] })
    })

    const response = await readyzGet()

    expect(response.status).toBe(503)
    expect((await response.json()).status).toBe('not_ready')
    expect(release).toHaveBeenCalled()
  }, 1500)

  it('returns 503 within ~200ms when pool.connect hangs', async () => {
    connect.mockImplementation(() => new Promise(() => {}))

    const started = Date.now()
    const response = await readyzGet()
    const elapsed = Date.now() - started

    expect(response.status).toBe(503)
    expect((await response.json()).status).toBe('not_ready')
    expect(elapsed).toBeGreaterThanOrEqual(150)
    expect(elapsed).toBeLessThan(500)
  }, 1500)

  it('does not return a failed transaction client to the pool', async () => {
    query.mockImplementation((sql: unknown) => {
      const text = typeof sql === 'string' ? sql : String(sql)
      if (text.includes('SELECT 1')) {
        return Promise.reject(new Error('canceling statement due to statement timeout'))
      }
      return Promise.resolve({ rows: [{ ok: 1 }] })
    })

    const response = await readyzGet()
    expect(response.status).toBe(503)

    const rolledBack = query.mock.calls.some((args) => /ROLLBACK/i.test(String(args[0])))
    const discarded = release.mock.calls.some((args) => args.length > 0 && Boolean(args[0]))
    expect(rolledBack || discarded).toBe(true)
    if (!discarded) {
      expect(release).toHaveBeenCalled()
    } else {
      expect(release.mock.calls.some((args) => args.length === 0)).toBe(false)
    }
  })

  it('returns 200 when SELECT 1 succeeds and releases the client', async () => {
    const response = await readyzGet()

    expect(response.status).toBe(200)
    expect((await response.json()).status).toBe('ready')
    expect(JSON.stringify(query.mock.calls)).toContain('SELECT 1')
    expect(release).toHaveBeenCalled()
  })

  it('does not call /audit/run', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')

    await readyzGet(new NextRequest('http://localhost/api/readyz'))

    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('bounds the probe with statement_timeout and releases the client in finally', () => {
    const source = readFileSync(path.join(process.cwd(), 'app/api/readyz/route.ts'), 'utf8')
    expect(source).toMatch(/statement_timeout/)
    expect(source).toMatch(/finally/)
    expect(source).toMatch(/\.release\(/)
    expect(source).not.toMatch(/\/audit\/run/)
  })
})
