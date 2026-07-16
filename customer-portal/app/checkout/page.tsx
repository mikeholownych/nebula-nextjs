'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Input, Card } from '@/components/ui'

declare global {
  interface Window {
    Stripe?: (key: string) => StripeInstance
  }
}

interface StripeInstance {
  elements: () => StripeElements
  createPaymentMethod: (type: string) => Promise<{ paymentMethod?: { id: string }; error?: { message: string } }>
  confirmCardPayment: (secret: string, opts: { payment_method: { card: Element } }) => Promise<{ error?: { message: string }; paymentIntent?: { status: string } }>
}

interface StripeElements {
  create: (type: string, opts?: object) => Element
  getNode: (element: Element) => Element
}

interface Element {
  mount: (selector: string) => void
  on: (event: string, callback: (evt: { complete: boolean; error?: { message: string } }) => void) => void
}

const FIX_PACK_PRICE = 9700 // $97 in cents
const RETAINER_MONTHLY_PRICE = 7900 // $79 in cents (20% off)
const RETAINER_YEARLY_PRICE = 94800 // $79 * 12 months

function CheckoutPageContent() {
  const searchParams = useSearchParams()
  const auditId = searchParams.get('audit')
  const addRetainer = searchParams.get('add')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [cardComplete, setCardComplete] = useState(false)

  // Calculate total
  const total = addRetainer === 'retainer' 
    ? FIX_PACK_PRICE + RETAINER_YEARLY_PRICE 
    : FIX_PACK_PRICE

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`

  // Load Stripe.js
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Stripe) {
      // In production, use env var for publishable key
      const stripe = window.Stripe(process.env.NEXT_PUBLIC_STRIPE_KEY!)
      const elements = stripe.elements()
      const card = elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#e5e5e5',
            '::placeholder': { color: '#737373' },
          },
        },
      })
      card.mount('#card-element')
      card.on('change', (evt) => {
        setCardComplete(evt.complete)
        setError(evt.error?.message || '')
      })
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Create payment intent
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          items: addRetainer === 'retainer' 
            ? [{ type: 'fix-pack', price: FIX_PACK_PRICE }, { type: 'retainer-yearly', price: RETAINER_YEARLY_PRICE }]
            : [{ type: 'fix-pack', price: FIX_PACK_PRICE }],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed')
      }

      // Redirect to success page
      window.location.href = `/thank-you?session=${data.sessionId}&audit=${auditId}${addRetainer ? '&oto=retainer' : ''}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg py-12 px-6">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="text-xl font-semibold text-fg">
            Nebula
          </Link>
          <h1 className="text-3xl font-bold text-fg mt-6 mb-2">Complete Your Purchase</h1>
          <p className="text-fg-muted">Secure checkout powered by Stripe</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Order Summary */}
          <Card variant="bordered" className="mb-6">
            <h2 className="font-semibold text-fg mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-fg">
                <span>Fix Pack — Landing Page Audit</span>
                <span>{formatPrice(FIX_PACK_PRICE)}</span>
              </div>
              {addRetainer === 'retainer' && (
                <div className="flex justify-between text-fg">
                  <span>Monthly Retainer (Yearly — 20% off)</span>
                  <span>{formatPrice(RETAINER_YEARLY_PRICE)}</span>
                </div>
              )}
              <div className="border-t border-border pt-3 flex justify-between font-bold">
                <span className="text-fg">Total</span>
                <span className="text-accent">{formatPrice(total)}</span>
              </div>
            </div>
          </Card>

          {/* Email */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-fg-muted mb-2">
              Email Address
            </label>
            <Input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Card */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-fg-muted mb-2">
              Card Details
            </label>
            <div className="bg-bg-elevated border border-border rounded-lg p-4">
              {!process.env.NEXT_PUBLIC_STRIPE_KEY ? (
                <div className="text-center py-4">
                  <p className="text-fg-muted text-sm mb-3">Stripe test mode</p>
                  <p className="text-fg-dim text-xs">
                    Test card: 4242 4242 4242 4242<br />
                    Any future expiry, any CVC
                  </p>
                </div>
              ) : (
                <div id="card-element" className="min-h-[40px]" />
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 mb-6">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            isLoading={loading}
          >
            Pay {formatPrice(total)}
          </Button>

          {/* Trust */}
          <div className="mt-6 text-center text-fg-dim text-sm">
            <p>🔒 Secured by Stripe</p>
            <p className="mt-2">30-day money-back guarantee — no questions asked</p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="min-h-screen bg-bg flex items-center justify-center"><p className="text-fg-muted">Loading...</p></div>
  return <CheckoutPageContent />
}
