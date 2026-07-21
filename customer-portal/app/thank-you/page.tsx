import Link from 'next/link'
import { Card } from '@/components/ui'

export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-12 flex items-start justify-center pt-[72px]">
      <div className="mx-auto max-w-lg w-full space-y-6">

        {/* Confirmation */}
        <Card variant="elevated" className="text-center">
          <div className="mb-4 text-4xl">✓</div>
          <h1 className="mb-3 text-3xl font-bold text-fg">You&apos;re in.</h1>
          <p className="mb-2 text-fg-muted">
            Your Fix Pack is confirmed. We&apos;ll contact you at the email used during checkout — expect to hear from us within a few hours.
          </p>
          <p className="text-sm text-fg-muted">
            Your Stripe receipt is your payment confirmation.
          </p>
        </Card>

        {/* Bring someone with you — referral moment #2 */}
        <Card variant="bordered" className="border-accent/30">
          <p className="font-semibold text-fg mb-1">Know someone else bleeding ad budget?</p>
          <p className="text-sm text-fg-muted mb-4">
            A lot of founders go through this with a business partner or someone in the same position.
            Their audit is free — takes 60 seconds and names the exact leaks.
          </p>
          <a
            href="/audit"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-accent px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
          >
            Send them a free audit ↗
          </a>
        </Card>

        {/* Home nav */}
        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-fg-muted transition-colors hover:text-fg"
          >
            ← Back to Home
          </Link>
        </div>

      </div>
    </main>
  )
}
