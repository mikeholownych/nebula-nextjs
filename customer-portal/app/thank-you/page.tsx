import Link from 'next/link'
import { Card } from '@/components/ui'

export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-12 flex items-center justify-center">
      <Card variant="elevated" className="max-w-lg text-center">
        <h1 className="mb-3 text-3xl font-bold text-fg">Payment Status</h1>
        <p className="mb-6 text-fg-muted">
          This page cannot verify a purchase. Use the receipt from Stripe as your payment confirmation.
          We will contact verified customers at the email used during checkout.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl border border-border px-5 py-3 font-semibold text-fg transition-colors hover:border-accent"
        >
          Back to Home
        </Link>
      </Card>
    </main>
  )
}
