import Link from 'next/link'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main id="main-content" role="main" className="min-h-screen bg-bg">
      <header className="border-b border-border px-6 py-4">
        <nav aria-label="Primary" className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-fg">Nebula</Link>
          <div className="flex items-center gap-5">
            <Link href="/learning-centre" className="text-sm text-fg-muted hover:text-fg">Learning</Link>
            <Link href="/pricing" className="text-sm text-fg-muted hover:text-fg">Pricing</Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center px-6 py-24 text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">Transparent maintenance notice</p>
        <h1 className="text-4xl font-bold tracking-tight text-fg md:text-6xl">The automated audit is temporarily paused.</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-fg-muted">
          We are replacing the previous scoring flow with a deterministic, evidence-backed audit. We will not generate a score or collect your email until that work is independently verified.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link href="/audit" className="rounded-xl bg-accent px-6 py-3 font-semibold text-bg hover:bg-accent-light">
            View audit status
          </Link>
          <Link href="/learning-centre" className="rounded-xl border border-border px-6 py-3 font-semibold text-fg hover:border-accent">
            Browse learning resources
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  )
}
