import { execFile } from 'node:child_process'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { promisify } from 'node:util'
import path from 'node:path'

const execFileAsync = promisify(execFile)
const script = path.join(process.cwd(), 'scripts', 'check-sitemap-routes.mjs')

type RouteResponse = {
  body?: string
  delayMs?: number
  onFinish?: () => void
  status?: number
}

async function withFixtureServer(
  routes: Record<string, RouteResponse | ((baseUrl: string) => RouteResponse)>,
  run: (baseUrl: string) => Promise<void>,
) {
  const server = createServer((request, response) => {
    const address = server.address()
    const baseUrl = address && typeof address !== 'string' ? `http://127.0.0.1:${address.port}` : ''
    const configured = routes[request.url ?? '']
    const route = typeof configured === 'function' ? configured(baseUrl) : configured
    const { body = 'ok', delayMs = 0, onFinish, status = 200 } = route ?? { status: 404, body: 'missing' }

    setTimeout(() => {
      response.writeHead(status, { 'content-type': 'application/xml' })
      response.end(body)
      onFinish?.()
    }, delayMs)
  })

  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Fixture server did not expose a TCP address')

  try {
    await run(`http://127.0.0.1:${address.port}`)
  } finally {
    server.close()
    await once(server, 'close')
  }
}

function sitemap(baseUrl: string, paths: string[]) {
  return `<?xml version=\"1.0\"?><urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">${paths.map((route) => `<url><loc>${baseUrl}${route}</loc></url>`).join('')}</urlset>`
}

async function runChecker(baseUrl: string, timeoutMs = 40) {
  return execFileAsync('node', [
    script,
    '--sitemap-url', `${baseUrl}/sitemap.xml`,
    '--concurrency', '2',
    '--timeout-ms', String(timeoutMs),
    '--retries', '1',
    '--retry-delay-ms', '0',
  ])
}

describe('check-sitemap-routes', () => {
  test('accepts a sitemap when every route responds with a nonempty 200 body', async () => {
    await withFixtureServer({
      '/sitemap.xml': (baseUrl) => ({ body: sitemap(baseUrl, ['/healthy']) }),
      '/healthy': { body: '<html>healthy</html>' },
    }, async (baseUrl) => {
      await expect(runChecker(baseUrl, 200)).resolves.toBeDefined()
    })
  })

  test('decodes XML entities in sitemap route locations', async () => {
    await withFixtureServer({
      '/sitemap.xml': (baseUrl) => ({
        body: `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${baseUrl}/healthy?source=a&amp;campaign=b</loc></url></urlset>`,
      }),
      '/healthy?source=a&campaign=b': { body: '<html>healthy</html>' },
    }, async (baseUrl) => {
      await expect(runChecker(baseUrl)).resolves.toBeDefined()
    })
  })

  test('retries a transient 500 route and accepts its eventual 200 response', async () => {
    let attempts = 0
    await withFixtureServer({
      '/sitemap.xml': (baseUrl) => ({ body: sitemap(baseUrl, ['/flaky']) }),
      '/flaky': () => ({ status: ++attempts === 1 ? 500 : 200, body: '<html>recovered</html>' }),
    }, async (baseUrl) => {
      await expect(runChecker(baseUrl)).resolves.toBeDefined()
      expect(attempts).toBe(2)
    })
  })

  test('limits concurrent route requests to the configured bound', async () => {
    let inFlight = 0
    let highestConcurrency = 0
    const delayedResponse = () => {
      inFlight += 1
      highestConcurrency = Math.max(highestConcurrency, inFlight)
      return { body: '<html>slow but healthy</html>', delayMs: 60, onFinish: () => { inFlight -= 1 } }
    }

    await withFixtureServer({
      '/sitemap.xml': (baseUrl) => ({ body: sitemap(baseUrl, ['/one', '/two', '/three']) }),
      '/one': delayedResponse,
      '/two': delayedResponse,
      '/three': delayedResponse,
    }, async (baseUrl) => {
      await expect(runChecker(baseUrl, 200)).resolves.toBeDefined()
      expect(highestConcurrency).toBe(2)
    })
  })

  test.each([
    ['persistent 500', { '/broken': { status: 500, body: 'broken' } }],
    ['4xx response', { '/broken': { status: 404, body: 'missing' } }],
    ['timeout', { '/broken': { delayMs: 100, body: 'slow' } }],
    ['empty 200 response', { '/broken': { body: '' } }],
  ])('fails when a route has a %s', async (_name, route) => {
    await withFixtureServer({
      '/sitemap.xml': (baseUrl) => ({ body: sitemap(baseUrl, ['/broken']) }),
      ...route,
    }, async (baseUrl) => {
      await expect(runChecker(baseUrl)).rejects.toMatchObject({ code: 1 })
    })
  })

  test('fails when the sitemap itself remains unavailable', async () => {
    await withFixtureServer({
      '/sitemap.xml': { status: 500, body: 'unavailable' },
    }, async (baseUrl) => {
      await expect(runChecker(baseUrl)).rejects.toMatchObject({ code: 1 })
    })
  })

  test('fails when the sitemap XML is malformed', async () => {
    await withFixtureServer({
      '/sitemap.xml': { body: '<urlset><url><loc>https://example.test/broken</loc></urlset>' },
    }, async (baseUrl) => {
      await expect(runChecker(baseUrl)).rejects.toMatchObject({ code: 1 })
    })
  })

  test('fails when valid route entries are followed by malformed XML structure', async () => {
    await withFixtureServer({
      '/sitemap.xml': (baseUrl) => ({
        body: `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${baseUrl}/healthy</loc></url><trailing></urlset>`,
      }),
      '/healthy': { body: '<html>healthy</html>' },
    }, async (baseUrl) => {
      await expect(runChecker(baseUrl)).rejects.toMatchObject({ code: 1 })
    })
  })

  test('fails when a sitemap url entry contains multiple loc elements', async () => {
    await withFixtureServer({
      '/sitemap.xml': (baseUrl) => ({
        body: `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${baseUrl}/healthy</loc><loc>${baseUrl}/also-healthy</loc></url></urlset>`,
      }),
      '/healthy': { body: '<html>healthy</html>' },
      '/also-healthy': { body: '<html>also healthy</html>' },
    }, async (baseUrl) => {
      await expect(runChecker(baseUrl)).rejects.toMatchObject({ code: 1 })
    })
  })
})
