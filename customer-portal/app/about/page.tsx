import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Nebula Components',
  description: 'Nebula Components publishes evidence-backed landing-page conversion guidance and implementation services.',
}

export default function AboutPage() {
  return (
    <main id="main-content" className="min-h-screen bg-[#050505] text-[#f5f7fb]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-6 text-4xl font-bold">About Nebula Components</h1>
        <p className="mb-6 text-lg leading-relaxed text-[#9aa7bd]">
          Nebula Components focuses on evidence-backed landing-page conversion guidance and bounded implementation work.
        </p>
        <section className="mb-8 rounded-2xl border border-[#253044] bg-[#111723] p-6">
          <h2 className="mb-3 text-2xl font-bold text-[#79f2c0]">Current audit status</h2>
          <p className="text-[#9aa7bd]">
            Automated URL submission and scoring are paused while the audit engine is rebuilt and independently verified. No automated score is issued during this maintenance period.
          </p>
          <Link href="/audit" className="mt-4 inline-block font-semibold text-[#79f2c0] hover:underline">
            View audit status →
          </Link>
        </section>
        <p className="text-[#9aa7bd]">
          Contact: <a href="mailto:hello@nebulacomponents.shop" className="text-[#79f2c0] hover:underline">hello@nebulacomponents.shop</a>
        </p>
      </div>
    </main>
  )
}
