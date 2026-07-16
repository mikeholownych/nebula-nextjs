import Link from "next/link";

// Force dynamic rendering to bypass Cloudflare cache
export const dynamic = 'force-dynamic';

export default function AuditPage() {
  return (
    <>
      {/* Ambient glow orbs */}
      <div className="glow-orb glow-orb-1" aria-hidden="true" />
      <div className="glow-orb glow-orb-2" aria-hidden="true" />

      {/* Header */}
      <header>
        <Link href="/" className="logo">Nebula</Link>
        <nav>
          <Link href="/">Home</Link>
          <Link href="#what">What You Get</Link>
          <Link href="#sample">Sample Audit</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="pulse-dot" /> Free. 60 Seconds. No Signup.
          </div>
          <h1 className="hero-title">
            Your Landing Page Has a Leak.<br />
            <span className="text-gradient">Find It Before Your Next $1k in Ads.</span>
          </h1>
          <p className="hero-sub">
            Paste your URL. Get a scored teardown ranking your <strong>top 3 conversion leaks</strong>.
            Know exactly what to fix — and how much money it's costing you.
          </p>
          <form className="hero-form" action="/api/audit" method="POST">
            <input
              type="url"
              placeholder="your-landing-page.com"
              required
              name="url"
              aria-label="Your landing page URL"
            />
            <button type="submit" className="btn btn-primary">
              Find My Money Leak →
            </button>
          </form>
          <p className="hero-trust">
            <span className="check">✓</span> No signup
            <span className="check">✓</span> No credit card
            <span className="check">✓</span> Results in 60s
          </p>
        </div>
      </section>

      {/* What You Get */}
      <section className="proof-section" id="what">
        <h2 className="section-title">What You Get — Free</h2>
        <p className="section-sub">5 dimensions. 3 top leaks. Exact fix priorities.</p>

        <div className="how-grid">
          <div className="step">
            <div className="step-num">⚡</div>
            <h3>Dimension Scores</h3>
            <p>
              Headline Clarity. CTA Actionability. Trust Signals. Page Speed. Mobile Layout.
              Each scored 0-10 with benchmarks.
            </p>
          </div>
          <div className="step">
            <div className="step-num">💰</div>
            <h3>Dollar Waste Estimate</h3>
            <p>
              Based on your ad spend, see exactly how much each leak is costing you monthly.
              Real numbers. Real urgency.
            </p>
          </div>
          <div className="step">
            <div className="step-num">🎯</div>
            <h3>Prioritized Fixes</h3>
            <p>
              Top 3 leaks ranked by impact. Clear fix instructions. Implement today yourself
              or hand off for $147.
            </p>
          </div>
        </div>
      </section>

      {/* Why It Matters */}
      <section className="shift-section" id="why">
        <h2 className="section-title">Stop Guessing. Start Fixing.</h2>
        <div className="shift-grid">
          <div className="shift-card old">
            <div className="shift-label">Without Audit</div>
            <p>You spend $5K/month on ads. Landing page converts at 1.2%. You don't know why.</p>
            <p>Your agency says "give it time."</p>
            <p className="sad-result">You pause the campaign. Wasted budget. Same leak for your next product.</p>
          </div>
          <div className="shift-card new">
            <div className="shift-label">With Nebula Audit</div>
            <p>Paste your URL. 60 seconds later: "Headline vague. CTA same color as header. Trust below fold."</p>
            <p>Headline vague? <span className="tag-fix">Fix: $0</span></p>
            <p className="happy-result">You see the exact leak. You fix it. Conversion rate climbs to 3.4%.</p>
          </div>
        </div>
      </section>

      {/* Sample Audit */}
      <section className="proof-section" id="sample">
        <h2 className="section-title">See What an Audit Looks Like</h2>
        <p className="section-sub">Real teardown. Real numbers.</p>

        <div className="sample-card">
          <div className="sample-header">
            <span className="sample-label">SAMPLE AUDIT</span>
            <div className="sample-score">
              <span className="score-num">6.8</span>
              <span className="score-divider">/</span>
              <span className="score-total">10</span>
              <span className="score-grade">Grade: C</span>
            </div>
          </div>
          <div className="sample-content">
            <p className="sample-summary">
              This page has <strong>3 significant conversion leaks</strong>. At $5k/mo ad spend,
              the headline and CTA alone are costing an estimated <strong className="highlight-red">$850-$1,700/mo</strong>.
            </p>
            <div className="sample-leaks">
              <div className="leak-item">
                <span className="leak-rank">#1</span>
                <span className="leak-name">Headline vague</span>
                <span className="leak-impact">— wastes $400-$800/mo</span>
              </div>
              <div className="leak-item">
                <span className="leak-rank">#2</span>
                <span className="leak-name">CTA invisible</span>
                <span className="leak-impact">— wastes $300-$600/mo</span>
              </div>
              <div className="leak-item">
                <span className="leak-rank">#3</span>
                <span className="leak-name">Trust below fold</span>
                <span className="leak-impact">— wastes $150-$300/mo</span>
              </div>
            </div>
            <p className="sample-cta">
              Fix all 3 yourself for <strong>$0</strong>, or we'll rewrite everything for <strong>$147</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* Zero Risk Section */}
      <section className="proof-section" id="risk">
        <h2 className="section-title">Zero Risk. Zero Access Required.</h2>
        <div className="risk-grid">
          <div className="risk-card">
            <h3>🔒 Public HTML Only</h3>
            <p>We analyze only what any visitor can see. No analytics. No ad accounts. No CMS access. Ever.</p>
          </div>
          <div className="risk-card">
            <h3>⚡ Instant Results</h3>
            <p>60 seconds from URL paste to full teardown. No signup. No credit card. No demo call.</p>
          </div>
          <div className="risk-card">
            <h3>✅ Fix Pack Guarantee</h3>
            <p>Upgrade to $147 Fix Pack? Full refund if your conversion rate doesn't improve in 14 days.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta-section" id="audit">
        <h2 className="section-title">Your Next Ad Dollar Shouldn't Be a Guess.</h2>
        <p className="cta-sub">Find the leak. Fix it. Stop burning cash.</p>
        <form className="hero-form" action="/api/audit" method="POST">
          <input
            type="url"
            placeholder="your-landing-page.com"
            required
            name="url"
            aria-label="Your landing page URL"
          />
          <button type="submit" className="btn btn-primary">
            Find My Money Leak →
          </button>
        </form>
        <p className="cta-risk">
          <span className="check">✓</span> Free forever
          <span className="check">✓</span> No signup required
          <span className="check">✓</span> 60-second delivery
        </p>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-inner">
          <div className="footer-links">
            <Link href="/learning-centre">Learning Centre</Link>
            <Link href="/case-studies">Case Studies</Link>
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
          </div>
          <p className="footer-copy">© 2026 Nebula Components. Founded to stop conversion leaks.</p>
        </div>
      </footer>
    </>
  );
}
