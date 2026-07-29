import { PostHog } from 'posthog-node'

export function getPostHogClient(): PostHog {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) {
    throw new Error(
      'NEXT_PUBLIC_POSTHOG_KEY variable required by PostHog is missing or un-configured, ' +
        'this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_KEY is configured'
    )
  }
  return new PostHog(key, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    flushAt: 1,
    flushInterval: 0,
  })
}

export function captureServerException(
  error: unknown,
  context?: { route?: string; distinctId?: string; properties?: Record<string, unknown> },
): void {
  try {
    const ph = getPostHogClient()
    const err = error instanceof Error ? error : new Error(String(error))
    ph.captureException(err, context?.distinctId ?? 'server', {
      $exception_source: 'server',
      route: context?.route,
      ...context?.properties,
    })
    void ph.flush().catch(() => undefined)
  } catch {
    // Never let analytics break the response path
  }
}
