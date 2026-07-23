'use client'

import posthog from 'posthog-js'

interface Props {
  href: string
}

export default function CheckoutCTAButton({ href }: Props) {
  const handleClick = () => {
    posthog.capture('checkout_initiated', {
      offer: 'fix-pack',
      destination: href,
    })
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className="block w-full rounded-2xl bg-accent px-8 py-4 text-center text-lg font-semibold text-bg transition-colors hover:bg-accent-light"
    >
      Continue to Secure Stripe Checkout
    </a>
  )
}
