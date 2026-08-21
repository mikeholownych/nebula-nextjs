import { NextRequest, NextResponse } from 'next/server'
import type { PoolClient } from 'pg'
import { pool } from '@/app/lib/db'

export const dynamic = 'force-dynamic'

const READY_TIMEOUT_MS = 200

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  return new Promise<T>((resolve, reject) => {
    timer = setTimeout(() => reject(new Error('readyz_timeout')), ms)
    promise.then(
      (value) => {
        if (timer) clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        if (timer) clearTimeout(timer)
        reject(err)
      },
    )
  })
}

export async function GET(_request?: NextRequest) {
  let client: PoolClient | undefined
  let probeError: unknown
  const connectPromise = pool.connect()
  try {
    client = await withTimeout(connectPromise, READY_TIMEOUT_MS)
    await client.query('BEGIN')
    await client.query('SET LOCAL statement_timeout = 200')
    await client.query('SELECT 1')
    await client.query('COMMIT')
    return NextResponse.json(
      { status: 'ready' },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    probeError = err
    if (!client) {
      void connectPromise
        .then((late) => {
          try {
            late.release()
          } catch {
            // ignore
          }
        })
        .catch(() => {})
    } else {
      try {
        await client.query('ROLLBACK')
      } catch {
        // ignore
      }
    }
    return NextResponse.json(
      { status: 'not_ready' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  } finally {
    if (client) {
      if (probeError) {
        client.release(probeError instanceof Error ? probeError : true)
      } else {
        client.release()
      }
    }
  }
}
