import type { Metadata } from 'next'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'Subscription Confirmed - Nebula Components',
  description: 'Your Nebula Components newsletter subscription is confirmed.',
  robots: { index: false, follow: false },
}

export default function NewsletterConfirmedPage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-16 flex items-center">
      <div className="mx-auto w-full max-w-2xl">
        <section className="text-center mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-3">
            Subscription confirmed
          </p>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-3xl text-accent">
            ✓
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-fg mb-4">
            You&apos;re on the list.
          </h1>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-fg-muted">
            Every Wednesday morning, you&apos;ll get one real landing-page finding, one practical fix, and one before-and-after worth studying.
          </p>
        </section>

        <Card variant="elevated" className="border-accent/20 p-8 md:p-10">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="mb-2 text-2xl">📊</p>
              <h2 className="font-bold text-fg">Specific</h2>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">The exact conversion signal, not generic advice.</p>
            </div>
            <div>
              <p className="mb-2 text-2xl">🔧</p>
              <h2 className="font-bold text-fg">Practical</h2>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">A fix you can understand and test without a developer.</p>
            </div>
            <div>
              <p className="mb-2 text-2xl">💸</p>
              <h2 className="font-bold text-fg">Commercial</h2>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">Why the leak matters when paid traffic is already running.</p>
            </div>
          </div>

          <div className="mt-10 border-t border-border pt-8 text-center">
            <h2 className="text-2xl font-extrabold text-fg mb-2">Want to find your leak now?</h2>
            <p className="mx-auto mb-6 max-w-lg leading-relaxed text-fg-muted">
              Run the free audit before the next email arrives. See your score, your three biggest leaks, and the exact fixes.
            </p>
            <Link
              href="/audit"
              className="inline-block rounded-lg bg-danger px-6 py-3 font-semibold text-white transition-colors hover:bg-danger-light"
            >
              Start Free Audit
            </Link>
          </div>
        </Card>

        <p className="mt-8 text-center text-sm text-fg-muted">
          Changed your mind?{' '}
          <Link href="/unsubscribe" className="text-accent underline underline-offset-4 hover:text-fg">
            Unsubscribe anytime
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
