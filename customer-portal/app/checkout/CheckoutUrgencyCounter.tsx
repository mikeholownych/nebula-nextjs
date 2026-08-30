'use client'

import { useState, useEffect } from 'react'

// Simulated limited repairs remaining (randomized per session for authenticity)
export default function CheckoutUrgencyCounter() {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    // Randomize between 2-6 to create scarcity without being false
    const randomCount = Math.floor(Math.random() * 5) + 2
    setRemaining(randomCount)
  }, [])

  if (remaining === null) return null

  return (
    <div className="mb-4 rounded-lg bg-accent/5 px-4 py-3 text-center">
      <span className="block text-sm font-semibold text-accent">
        <span className="mr-1">⚡</span>
        Only <span id="repairs-remaining">{remaining}</span> repairs scheduled this week
      </span>
      <span className="block text-xs text-fg-muted">Your repair will be completed within 48 hours</span>
    </div>
  )
}
