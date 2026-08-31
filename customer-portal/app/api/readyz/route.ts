import { NextResponse } from 'next/server'
import type { PoolClient } from 'pg'
import { pool } from '@/app/lib/db'

const CONNECT_TIMEOUT_MS = 200
const STATEMENT_TIMEOUT_MS = 150
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

function connectWithTimeout(): Promise<PoolClient> {
  return Promise.race([
    pool.connect(),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('database readiness connection timeout')), CONNECT_TIMEOUT_MS)
    }),
  ])
}

export async function GET() {
  let client: PoolClient | undefined
  let failed = false
  let failure: unknown

  try {
    client = await connectWithTimeout()
    await client.query('BEGIN')
    await client.query(`SET LOCAL statement_timeout = '${STATEMENT_TIMEOUT_MS}ms'`)
    await client.query('SELECT 1')
    await client.query('COMMIT')

    return NextResponse.json(
      { status: 'ready', timestamp: new Date().toISOString() },
      { headers: NO_STORE_HEADERS },
    )
  } catch (error) {
    failed = true
    failure = error
    if (client) {
      try {
        await client.query('ROLLBACK')
      } catch {
        // The client is discarded below when rollback cannot recover it.
      }
    }

    return NextResponse.json(
      { status: 'not_ready', timestamp: new Date().toISOString() },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  } finally {
    if (client) {
      if (failed) client.release(failure instanceof Error ? failure : new Error('readiness probe failed'))
      else client.release()
    }
  }
}
