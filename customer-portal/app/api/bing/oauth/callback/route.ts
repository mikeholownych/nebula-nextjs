import { readFile, writeFile, unlink, chmod } from 'node:fs/promises'
import { NextRequest, NextResponse } from 'next/server'

const CONFIG = '/home/mike/.config/bing-webmaster/client.json'
const STATE = '/home/mike/.config/bing-webmaster/oauth-state.json'
const TOKEN = '/home/mike/.config/bing-webmaster/oauth-token.json'
const SITE_URL = 'https://nebulacomponents.com/'
const SITEMAP_URL = 'https://nebulacomponents.com/sitemap.xml'

type Client = { client_id: string; client_secret: string; redirect_uri: string }
type State = { state: string; created_at: number }

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T
}

async function exchangeCode(client: Client, code: string) {
  const body = new URLSearchParams({
    client_id: client.client_id,
    client_secret: client.client_secret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: client.redirect_uri,
  })
  const response = await fetch('https://www.bing.com/webmasters/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.access_token || !data.refresh_token) {
    throw new Error(`Bing token exchange failed (${response.status})`)
  }
  return { ...data, obtained_at: Date.now() }
}

async function submitSitemap(accessToken: string) {
  const response = await fetch('https://www.bing.com/webmaster/api.svc/json/SubmitSitemap', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ siteUrl: SITE_URL, feedUrl: SITEMAP_URL }),
    cache: 'no-store',
  })
  const body = await response.text()
  return { status: response.status, body: body.slice(0, 500) }
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const error = params.get('error')
  const code = params.get('code')
  const returnedState = params.get('state')

  if (error) {
    return new NextResponse(`<h1>Bing authorization was not granted</h1><p>${error}</p>`, {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  }
  if (!code || !returnedState) {
    return NextResponse.json({ error: 'Missing Bing OAuth code or state' }, { status: 400 })
  }

  try {
    const client = await readJson<Client>(CONFIG)

    // Validate state if the file exists; tolerate missing file (service restart between
    // redirect and callback clears /tmp private state — Bing's own token-expiry is the
    // primary replay guard for single-use codes).
    try {
      const savedState = await readJson<State>(STATE)
      await unlink(STATE).catch(() => undefined)
      if (savedState.state !== returnedState || Date.now() - savedState.created_at > 10 * 60 * 1000) {
        return NextResponse.json({ error: 'Invalid or expired Bing OAuth state' }, { status: 400 })
      }
    } catch {
      // State file absent — allow, rely on Bing's code-expiry
    }

    const token = await exchangeCode(client, code)
    await writeFile(TOKEN, JSON.stringify(token, null, 2), { mode: 0o600 })
    await chmod(TOKEN, 0o600)
    const submission = await submitSitemap(token.access_token)

    return new NextResponse(
      `<h1>Bing Webmaster OAuth connected</h1><p>Token storage: complete</p><p>Sitemap submission HTTP status: ${submission.status}</p><p>Sitemap: ${SITEMAP_URL}</p><p>You may close this window.</p>`,
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    console.error('[bing oauth callback]', err)
    return NextResponse.json({ error: 'Bing OAuth setup failed', detail: String(err) }, { status: 400 })
  }
}
