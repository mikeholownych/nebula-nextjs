const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
const consentKey = 'nebula-cookie-consent'
let initialization: Promise<void> | undefined

function hasAnalyticsConsent() {
  try {
    const stored = localStorage.getItem(consentKey)
    if (!stored) return false
    const state = JSON.parse(stored) as { level?: unknown; version?: unknown }
    return state.level === 'all' && typeof state.version === 'number' && state.version >= 1
  } catch {
    return false
  }
}

function initializePostHog() {
  if (!key || !hasAnalyticsConsent() || initialization) return

  initialization = import('posthog-js').then(({ default: posthog }) => {
    posthog.init(key, {
      api_host: '/ingest',
      ui_host: 'https://us.posthog.com',
      defaults: '2026-01-30',
      capture_exceptions: true,
      debug: process.env.NODE_ENV === 'development',
    })
  })
}

if (!key) {
  if (process.env.NODE_ENV !== 'production') {
    console.error(
      'NEXT_PUBLIC_POSTHOG_KEY variable required by PostHog is missing or un-configured, ' +
        'this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_KEY is configured'
    )
  }
} else {
  initializePostHog()
  window.addEventListener('cookie-consent-update', initializePostHog)
}
