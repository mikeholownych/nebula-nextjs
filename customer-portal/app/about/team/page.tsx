import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mike H — Founder, Nebula Components',
  description: 'Mike H is the founder of Nebula Components.',
}

export default function TeamPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg text-fg">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-2 text-4xl font-bold">Mike H</h1>
        <p className="mb-6 font-medium text-accent">Founder, Nebula Components</p>
        <p className="mb-8 text-lg leading-relaxed text-fg-muted">
          Nebula Components publishes evidence-backed landing-page conversion guidance and implementation services. Automated audit scoring is currently paused pending independent verification.
        </p>
        <span className="text-accent">mike{'\u0040'}nebulacomponents.shop</span>
      </div>
    </main>
  )
}
