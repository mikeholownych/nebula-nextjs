import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Landing Page Audit — Find Your Conversion Leak in 60 Seconds',
  description: 'Paste your URL. Get a scored teardown in 60 seconds. Know exactly where your landing page leaks conversions.',
};

export default function HomePage() {
  return (
    <>
      {/* Ambient glow effects */}
      <div className="glow-orb glow-orb-1" aria-hidden="true" />
      <div className="glow-orb glow-orb-2" aria-hidden="true" />

      {/* Header */}
      <header>
        <a href="/" className="logo">Nebula</a>
        <nav>
          <a href="#shift">How it works</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">Free Landing Page Audit</div>
          <h1 className="hero-title">Find Your Conversion Leak in 60 Seconds</h1>
          <p className="hero-sub">
            Paste your URL. Get a scored teardown ranking your top 3 leaks. Know exactly what to fix before your next ad dollar.
          </p>

          <form className="hero-form" action="/audit" method="GET">
            <input
              type="url"
              name="url"
              placeholder="your-landing-page.com"
              required
            />
            <button type="submit" className="btn btn-primary">
              Get Free Audit
            </button>
          </form>

          <p className="hero-trust">
            No signup <span>·</span> No credit card <span>·</span> Instant results
          </p>
        </div>
      </section>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-item">
          <div className="stat-num">200+</div>
          <div className="stat-label">Pages Scored</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">$4,200</div>
          <div className="stat-label">Avg Monthly Burn Found</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">60s</div>
          <div className="stat-label">Audit Delivery</div>
        </div>
      </div>

      {/* The Shift Section */}
      <section className="shift-section" id="shift">
        <h2 className="section-title">Stop Guessing. Start Fixing.</h2>

        <div className="shift-grid">
          <div className="shift-card old">
            <div className="shift-label">Without Diagnosis</div>
            <p>
              You spend $5K/month on ads. Your landing page converts at 1.2%. You don&apos;t know why. Your agency says &quot;give it time.&quot; You pause the campaign before finding the leak.
            </p>
            <p style={{ marginTop: '24px', opacity: 0.6 }}>Result: Wasted budget. No insights.</p>
          </div>
          <div className="shift-card new">
            <div className="shift-label">After 60 Seconds</div>
            <p>
              You paste your URL. You get a scored teardown: headline vague, CTA invisible, trust signals below fold. Each leak ranked by impact. Fix the top one first.
            </p>
            <p>Your audit is ready before your next coffee.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-section" id="how">
        <h2 className="section-title">Three Steps. Five Minutes.</h2>

        <div className="steps-grid">
          <div className="step">
            <div className="step-num">1</div>
            <h3>Paste your URL</h3>
            <p>Drop your landing page URL and email. Takes 10 seconds.</p>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <h3>Get your audit</h3>
            <p>5 dimensions scored. Top 3 leaks ranked. In your inbox in 60 seconds.</p>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <h3>Fix or hand off</h3>
            <p>Use the free insights — or get the $147 Fix Pack with rewritten copy.</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section" id="faq">
        <h2 className="section-title">Frequently Asked Questions</h2>

        <div className="faq-list">
          <details className="faq-item">
            <summary>What exactly do I get in the free audit?</summary>
            <p>
              You get a scored teardown across 5 dimensions: clarity, CTA friction, trust gap, offer specificity, and implementation difficulty. Each dimension includes the exact issue, why it matters, and a prioritized fix. Delivered to your inbox in 60 seconds.
            </p>
          </details>
          <details className="faq-item">
            <summary>Is this just generic advice?</summary>
            <p>
              No. The audit analyzes your specific page — your headline, your CTA, your trust signals, your offer positioning. Every recommendation is tied to an element we found on your page with a concrete fix.
            </p>
          </details>
          <details className="faq-item">
            <summary>What&apos;s the $147 Fix Pack?</summary>
            <p>
              If the audit finds leaks you want fixed but don&apos;t have time to rewrite yourself, the Fix Pack delivers rewritten copy for your top 3 issues. Headlines, CTAs, trust line — ready to paste. 24-hour turnaround.
            </p>
          </details>
          <details className="faq-item">
            <summary>Do you need access to my ad accounts or analytics?</summary>
            <p>
              No. Just your landing page URL. We analyze the page itself — the copy, structure, and conversion elements visible to visitors. No login, no tracking code, no data access.
            </p>
          </details>
          <details className="faq-item">
            <summary>What if my page scores well?</summary>
            <p>
              Great — you&apos;ll know there&apos;s no obvious conversion leak. But most pages score in the 4-6/10 range. The audit explains exactly what would push it to 8+
            </p>
          </details>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" id="pricing">
        <h2 className="section-title">Your Next Ad Dollar Shouldn&apos;t Be a Guess</h2>
        <p>Free audit. No signup. Instant results.</p>

        <form className="hero-form" action="/audit" method="GET">
          <input
            type="url"
            name="url"
            placeholder="your-landing-page.com"
            required
          />
          <button type="submit" className="btn btn-primary">
            Get Free Audit
          </button>
        </form>

        <p className="cta-alt">
          Or get the <a href="/checkout">$147 Fix Pack</a> with rewritten copy in 24h
        </p>
      </section>

      {/* Footer */}
      <footer>
        <p>© 2026 Nebula Components. Founded to stop conversion leaks.</p>
      </footer>
    </>
  );
}
