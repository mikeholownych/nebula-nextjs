import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

function currentRevision(): string {
  if (process.env.NEBULA_BUILD_REVISION) return process.env.NEBULA_BUILD_REVISION
  try {
    const filePath = join(process.cwd(), 'app/lib/build-info.json')
    if (existsSync(filePath)) {
      const info = JSON.parse(readFileSync(filePath, 'utf8')) as { revision?: string }
      if (info.revision) return info.revision
    }
  } catch {
    // fall through
  }
  return 'unknown'
}

function formatError(error: unknown): { name: string; message: string } | null {
  if (error == null) return null
  if (error instanceof Error) {
    return { name: error.name, message: error.message }
  }
  return { name: 'Error', message: String(error) }
}

export function logApiError(
  message: string,
  context: {
    request_id?: string | null
    journey_id?: string | null
    error?: unknown
  } = {},
) {
  const payload: Record<string, unknown> = {
    msg: message,
    request_id: context.request_id ?? null,
    journey_id: context.journey_id ?? null,
    revision: currentRevision(),
  }
  const formatted = formatError(context.error)
  if (formatted) payload.error = formatted
  console.error(JSON.stringify(payload))
}
