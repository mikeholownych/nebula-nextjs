import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mike H — Founder, Nebula Components',
  description: 'Mike H is the founder of Nebula Components.',
}

export default function TeamPage() {
  return (
    <main id="main-content" className="min-h-screen bg-[#050505] text-[#f5f7fb]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-2 text-4xl font-bold">Mike H</h1>
        <p className="mb-6 font-medium text-[#79f2c0]">Founder, Nebula Components</p>
        <p className="mb-8 text-lg leading-relaxed text-[#9aa7bd]">
          Nebula Components publishes evidence-backed landing-page conversion guidance and implementation services. Automated audit scoring is currently paused pending independent verification.
        </p>
        <a href="mailto:mike@nebulacomponents.shop" className="text-[#79f2c0] hover:underline">Email Mike</a>
      </div>
    </main>
  )
}
