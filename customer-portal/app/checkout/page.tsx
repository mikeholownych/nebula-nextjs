import Link from 'next/link'
import { Button, Card } from '@/components/ui'

const STRIPE_FIX_PACK_LINK = 'https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b'

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <Link href="/" className="text-xl font-semibold text-fg">
            Nebula
          </Link>
          <h1 className="mt-6 mb-2 text-3xl font-bold text-fg">Secure Checkout</h1>
          <p className="text-fg-muted">Payment is completed on Stripe&apos;s hosted checkout.</p>
        </div>

        <Card variant="bordered" className="mb-6">
          <h2 className="mb-4 font-semibold text-fg">Nebula Conversion Fix Pack</h2>
          <div className="flex justify-between border-t border-border pt-4 font-bold">
            <span className="text-fg">One-time total</span>
            <span className="text-accent">$147</span>
          </div>
        </Card>

        <a href={STRIPE_FIX_PACK_LINK} className="block">
          <Button size="lg" className="w-full">
            Continue to Secure Stripe Checkout
          </Button>
        </a>

        <p className="mt-6 text-center text-sm text-fg-muted">
          Card details are entered only on Stripe. Nebula does not collect or store them.
        </p>
      </div>
    </main>
  )
}
