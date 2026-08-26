import { randomBytes } from 'node:crypto'
import { readFile, writeFile, mkdir, chmod } from 'node:fs/promises'
import { NextResponse } from 'next/server'

const CONFIG = '/home/mike/.config/bing-webmaster/client.json'
const STATE = '/home/mike/.config/bing-webmaster/oauth-state.json'

async function readClient() {
  return JSON.parse(await readFile(CONFIG, 'utf8')) as {
    client_id: string
    client_secret: string
    redirect_uri: string
    scope: string
  }
}

export async function GET() {
  try {
    const client = await readClient()
    const state = randomBytes(32).toString('base64url')
    await mkdir('/home/mike/.config/bing-webmaster', { recursive: true, mode: 0o700 })
    await writeFile(STATE, JSON.stringify({ state, created_at: Date.now() }), { mode: 0o600 })
    await chmod(STATE, 0o600)

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: client.client_id,
      redirect_uri: client.redirect_uri,
      scope: client.scope,
      state,
    })
    return NextResponse.redirect(`https://www.bing.com/webmasters/oauth/authorize?${params}`)
  } catch (error) {
    console.error('[bing oauth start]', error)
    return NextResponse.json({ error: 'Bing OAuth is not configured' }, { status: 503 })
  }
}
