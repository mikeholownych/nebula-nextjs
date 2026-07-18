import Link from 'next/link'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main id="main-content" role="main" className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <nav aria-label="Primary" className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-fg">Nebula</Link>
          <div className="flex items-center gap-5">
            <Link href="/learning-centre" className="text-sm text-fg-muted hover:text-fg">Learning</Link>
            <Link href="/pricing" className="text-sm text-fg-muted hover:text-fg">Pricing</Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="mx-auto flex min-h-[70vh] max-w-4xl flex-col justify-center px-6 py-24 text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          Free Landing Page Audit
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-fg md:text-6xl">
          Find Out Why Your Ads Aren't Converting
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-fg-muted">
          Get an evidence-backed diagnosis of your landing page in 60 seconds.
          No signup required to start — just enter your URL.
        </p>
        
        {/* CTA Button */}
        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link 
            href="/audit" 
            className="rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light transition-colors text-lg"
          >
            Run Free Audit →
          </Link>
        </div>
      </section>

      {/* What You'll Get Section */}
      <section className="border-t border-border bg-bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-fg">
            What You'll Get
          </h2>
          <div className="grid gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="mb-3 text-4xl">📊</div>
              <h3 className="mb-2 font-semibold text-fg">Evidence-Based Score</h3>
              <p className="text-sm text-fg-muted">
                Not opinions — actual analysis of above-fold content, signals, and speed.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-3 text-4xl">🎯</div>
              <h3 className="mb-2 font-semibold text-fg">Prioritized Fixes</h3>
              <p className="text-sm text-fg-muted">
                Quick wins vs major projects, ranked by impact and effort.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-3 text-4xl">💰</div>
              <h3 className="mb-2 font-semibold text-fg">Conversion Focus</h3>
              <p className="text-sm text-fg-muted">
                We diagnose landing pages leaking ad spend — that's our specialty.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-3 text-4xl">✓</div>
              <h3 className="mb-2 font-semibold text-fg">No Commitment</h3>
              <p className="text-sm text-fg-muted">
                Start free. Share email only if you want the full report.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-fg">
            How It Works
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl font-bold text-bg">
                1
              </div>
              <h3 className="mb-2 font-semibold text-fg">Enter Your URL</h3>
              <p className="text-sm text-fg-muted">
                Drop in any landing page URL — no account needed.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl font-bold text-bg">
                2
              </div>
              <h3 className="mb-2 font-semibold text-fg">Get Your Score</h3>
              <p className="text-sm text-fg-muted">
                We analyze above-fold content, SEO foundations, ad signals, and speed.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl font-bold text-bg">
                3
              </div>
              <h3 className="mb-2 font-semibold text-fg">See Your Fixes</h3>
              <p className="text-sm text-fg-muted">
                Get prioritized recommendations with impact/effort scores.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="border-t border-border bg-bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-8 text-2xl font-bold text-fg">
            Built by Conversion Specialists
          </h2>
          <p className="mx-auto max-w-2xl text-fg-muted">
            Nebula Components specializes in one thing: diagnosing landing pages that leak ad spend.
            We've helped founders stop burning budget on ads that never convert by fixing the page — not the ad.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-2xl font-bold text-fg">
            Ready to See Why Your Ads Aren't Converting?
          </h2>
          <p className="mb-8 text-fg-muted">
            Get your free landing page audit in 60 seconds.
          </p>
          <Link 
            href="/audit" 
            className="inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light transition-colors text-lg"
          >
            Run Free Audit →
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
