type Properties = Record<string, unknown>

type InitializedPostHog = {
  capture?: (event: string, properties?: Properties) => unknown
  captureException?: (error: unknown, properties?: Properties) => unknown
  identify?: (distinctId: string, properties?: Properties) => unknown
  get_distinct_id?: () => string | undefined
  get_session_id?: () => string | undefined
}

function initializedClient(): InitializedPostHog | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as Window & { posthog?: InitializedPostHog }).posthog
}

const posthog = {
  capture(event: string, properties?: Properties) {
    return initializedClient()?.capture?.(event, properties)
  },
  captureException(error: unknown, properties?: Properties) {
    return initializedClient()?.captureException?.(error, properties)
  },
  identify(distinctId: string, properties?: Properties) {
    return initializedClient()?.identify?.(distinctId, properties)
  },
  get_distinct_id() {
    return initializedClient()?.get_distinct_id?.()
  },
  get_session_id() {
    return initializedClient()?.get_session_id?.()
  },
}

export default posthog
