'use client'

import { FormEvent, Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

const ERROR_MESSAGES: Record<string, string> = {
  invalid_token: 'That sign-in link is invalid or expired. Request a new one.',
  missing_token: 'No sign-in token provided.',
  no_token: 'Sign-in failed - please try again.',
  service_unavailable: 'Sign-in service is temporarily unavailable.',
  github_auth_failed: 'GitHub sign-in failed. Please try again.',
  github_unavailable: 'GitHub sign-in is temporarily unavailable.',
  github_missing_params: 'GitHub sign-in was interrupted. Please try again.',
  github_no_token: 'GitHub sign-in failed - no session created.',
  github_service_unavailable: 'GitHub service is temporarily unavailable.',
  google_auth_failed: 'Google sign-in failed. Please try again.',
  account_suspended: 'Your account has been suspended. Contact support.',
}

function LoginForm() {
  const params = useSearchParams()
  const errorCode = params.get('error')
  const returnTo = params.get('returnTo')

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(
    errorCode ? (ERROR_MESSAGES[errorCode] || 'An error occurred. Please try again.') : null
  )

  async function submitMagicLink(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || data.error || 'Unable to send sign-in link')
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send sign-in link')
    } finally {
      setBusy(false)
    }
  }

  function handleGoogleSignIn() {
    window.location.href = returnTo
      ? `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`
      : '/api/auth/google'
  }

  function handleGitHubSignIn() {
    window.location.href = returnTo
      ? `/api/auth/github?returnTo=${encodeURIComponent(returnTo)}`
      : '/api/auth/github'
  }

  return (
    <main className="min-h-screen bg-bg text-fg pt-24" id="main-content">
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-2xl font-bold tracking-tight text-fg">Sign In to Your Workspace to Access Your Free Audits</h1>
        <p className="mt-2 text-fg-muted">
          Access your audits, recommendations, and optimization history.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-danger/20 bg-danger/5 px-4 py-3" role="alert">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* OAuth Providers */}
        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-bg-panel px-4 py-3 text-sm font-medium text-fg transition-colors hover:bg-bg-elevated focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={handleGitHubSignIn}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-bg-panel px-4 py-3 text-sm font-medium text-fg transition-colors hover:bg-bg-elevated focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-fg-dim">or sign in with email</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Magic Link Form */}
        <form onSubmit={submitMagicLink} className="rounded-lg border border-border bg-bg-elevated p-6">
          {sent ? (
            <div>
              <p className="text-sm text-accent font-medium">Check your inbox</p>
              <p className="mt-1 text-sm text-fg-muted">
                We sent a sign-in link to <strong>{email}</strong>. It expires in 15 minutes.
              </p>
              <button
                type="button"
                onClick={() => { setSent(false); setEmail('') }}
                className="mt-3 text-xs text-fg-muted underline hover:text-fg"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <label htmlFor="login-email" className="block text-sm text-fg-muted mb-2">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-border bg-bg-panel px-4 py-2.5 text-fg placeholder:text-fg-dim focus:outline-none focus:ring-2 focus:ring-accent/40"
                placeholder="you@company.com"
              />
              <button
                type="submit"
                disabled={busy}
                className="mt-4 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg disabled:opacity-50 transition-opacity"
              >
                {busy ? 'Sending…' : 'Email me a sign-in link'}
              </button>
            </>
          )}
        </form>

        <p className="mt-6 text-center text-xs text-fg-dim">
          By signing in, you agree to our{' '}
          <a href="/terms" className="underline hover:text-fg">Terms</a> and{' '}
          <a href="/privacy-policy" className="underline hover:text-fg">Privacy Policy</a>.
        </p>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-bg text-fg pt-24" id="main-content">
        <div className="mx-auto max-w-md px-6 py-16">
          <h1 className="text-2xl font-bold tracking-tight text-fg">Sign In to Your Workspace to Access Your Free Audits</h1>
          <p className="mt-2 text-fg-muted">Access your audits, recommendations, and optimization history.</p>
          <div className="mt-8 text-center text-fg-muted">Loading sign-in options…</div>
        </div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  )
}
