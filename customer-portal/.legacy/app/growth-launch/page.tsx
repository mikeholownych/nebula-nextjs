import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Growth Launch — First Customer Guarantee | Nebula Components',
  description: 'You get a paying customer in 60 days — or we work for free until you do. Landing page audit + rewrite, 200 triggered prospects, done-for-you outreach. $997. No demo required.',
  openGraph: {
    title: 'Growth Launch — First Customer Guarantee | Nebula Components',
    description: 'You get a paying customer in 60 days. Or we work for free until you do. That\'s the offer. $997. No demos. No sales calls. No fine print.',
    url: 'https://nebulacomponents.shop/growth-launch',
    images: [{ url: 'https://nebulacomponents.shop/og-growth-launch.png' }],
    type: 'website',
  },
};

export default function GrowthLaunchPage() {
  return (
    <>
      <nav className="gl-nav">
        <a href="/" className="gl-logo">Nebula</a>
        <div>
          <a href="/" style={{ marginRight: '20px' }}>Free Audit</a>
          <a href="/ai-sdr-vs-audit" style={{ marginRight: '20px' }}>AI SDR vs. Audit</a>
          <a href="https://buy.stripe.com/4gMcN5aYk92Qaa5drY43S09" className="gl-nav-cta">Get Growth Launch</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="gl-hero">
        <div className="gl-hero-bg" aria-hidden="true" />
        <span className="gl-badge">🚀 Live July 4, 2026</span>
        <h1>You Get a Paying Customer<br />in 60 Days — <span className="gl-highlight">or We Work Free</span></h1>
        <p className="gl-sub">We fix your landing page, find 200 triggered prospects, and run done-for-you outreach. You get a customer. That&apos;s the deal.</p>
        <p className="gl-guarantee-line">🛡️ Not a soft guarantee. If you haven&apos;t closed by day 60, we keep working until you do. No charge.</p>
        <a href="https://buy.stripe.com/4gMcN5aYk92Qaa5drY43S09" className="gl-hero-cta">Buy Growth Launch — $997 →</a>
        <div className="gl-trust-row">
          <span className="gl-pill">No demo required</span>
          <span className="gl-pill">No sales call</span>
          <span className="gl-pill">Self-serve checkout</span>
          <span className="gl-pill">60-day guarantee</span>
          <span className="gl-pill">$997 — one payment</span>
        </div>
      </section>

      {/* Guarantee Banner */}
      <div className="gl-guarantee-banner">
        <div className="gl-shield">🛡️</div>
        <h2>The &quot;No Customer, No Pay&quot; Guarantee</h2>
        <p>You close at least <strong>1 paying customer</strong> within 60 days of launch. If you don&apos;t, we continue working — <strong>free of charge</strong> — until you do. You keep every deliverable: the page rewrite, the prospect lists, the outreach templates, everything. There is <strong>no scenario where you lose money</strong> on this deal.</p>
      </div>

      {/* Pain Section */}
      <section className="gl-container">
        <div className="gl-narrow">
          <h2 className="gl-center">If You Have Zero Paying Customers, Fix This</h2>
          <p>You launched. You&apos;re getting traffic — or trying to. But the pipeline is empty. No inbound. No replies to outreach. Just the sound of your runway burning.</p>
          <p>The problem isn&apos;t that you need &quot;more leads.&quot; It&apos;s not that your product is bad. It&apos;s that three things are broken at the same time:</p>
          <ol>
            <li><strong>Your landing page leaks.</strong> Even people who want what you&apos;re selling can&apos;t figure out what you do in 5 seconds.</li>
            <li><strong>You&apos;re reaching the wrong people.</strong> Demographic filters find profiles. Buying triggers find people who are in pain right now.</li>
            <li><strong>Your outreach asks before it gives.</strong> Every email says &quot;hop on a call&quot; instead of &quot;here&apos;s a useful thing I built for you.&quot;</li>
          </ol>
          <p>Fix all three, and you get customers. We fix all three for you in one package.</p>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="gl-section-gray">
        <div className="gl-container gl-container-full">
          <h2 className="gl-center">Everything Included</h2>
          <div className="gl-deliverable-grid">
            <div className="gl-deliverable">
              <div className="gl-icon">📄</div>
              <h3>Landing Page Audit + Rewrite</h3>
              <p>We run your page through our conversion rubric, identify the top 5 leaks, and deliver rewritten copy for every section — deployed or ready to deploy.</p>
            </div>
            <div className="gl-deliverable">
              <div className="gl-icon">🎯</div>
              <h3>200 Triggered Prospects</h3>
              <p>Not a list of people who &quot;fit the ICP.&quot; A list of people who are actively showing buying signals — posting about ad bleed, asking for landing page help, announcing a launch with zero traction.</p>
            </div>
            <div className="gl-deliverable">
              <div className="gl-icon">📨</div>
              <h3>Done-for-You Outreach Campaign</h3>
              <p>We write and send value-first outreach to all 200 prospects. Personalized per prospect, not templated. Your voice, your offer, our execution.</p>
            </div>
            <div className="gl-deliverable">
              <div className="gl-icon">💬</div>
              <h3>14-Day Reply Management</h3>
              <p>Every reply is read same-day. Questions answered. Objections handled. Qualified prospects surfaced to you for the close. We don&apos;t disappear after sending.</p>
            </div>
            <div className="gl-deliverable">
              <div className="gl-icon">📊</div>
              <h3>Performance Dashboard</h3>
              <p>Live stats: emails sent, replies received, conversations in progress, meetings booked. No black box — you see everything in real time.</p>
            </div>
            <div className="gl-deliverable">
              <div className="gl-icon">♻️</div>
              <h3>30-Day Follow-Up Cycle</h3>
              <p>If a prospect doesn&apos;t reply, they get a second touch at day 7 and a third at day 21. New triggered prospects are added weekly to keep the pipeline full.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="gl-cta-section">
        <h2>The Offer That Makes Every Alternative Irrelevant</h2>
        <p>$25k AI SDR platform, no guarantee. $2k/mo freelancer, no guarantee. $997 Growth Launch with a &quot;we work free until you win&quot; guarantee. The choice is not hard.</p>
        <a href="https://buy.stripe.com/4gMcN5aYk92Qaa5drY43S09" className="gl-cta-big">Buy Growth Launch — $997 →</a>
        <p className="gl-cta-sub">🛡️ 60-day guarantee. Self-serve checkout. No demo. No sales call. No risk.</p>
      </section>

      {/* Footer Nav */}
      <nav className="gl-nav gl-footer-nav">
        <a href="/" className="gl-logo">Nebula Components</a>
        <div>
          <a href="/" style={{ marginRight: '16px' }}>Free Audit</a>
          <a href="/ai-sdr-vs-audit" style={{ marginRight: '16px' }}>AI SDR vs. Audit</a>
          <a href="/blog-trigger-aware-outreach">Blog</a>
        </div>
      </nav>

      <style>{`
        .gl-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          max-width: 1100px;
          margin: 0 auto;
        }
        .gl-nav a { color: #94a3b8; font-size: 14px; text-decoration: none; font-weight: 600; }
        .gl-nav a:hover { color: #e2e8f0; }
        .gl-logo { color: #a5b4fc !important; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
        .gl-nav-cta {
          background: #22c55e !important;
          color: #0a0a0f !important;
          padding: 8px 18px !important;
          border-radius: 8px;
          font-weight: 700 !important;
        }
        .gl-nav-cta:hover { background: #16a34a !important; color: #0a0a0f !important; }

        .gl-hero {
          text-align: center;
          padding: 100px 24px 80px;
          background: linear-gradient(180deg, #0a0a0f 0%, #12121c 30%, #1a1a2e 70%, #0a0a0f 100%);
          border-bottom: 1px solid #2d2d4e;
          position: relative;
          overflow: hidden;
        }
        .gl-hero-bg {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(ellipse at 30% 60%, rgba(99,102,241,0.08) 0%, transparent 60%),
                      radial-gradient(ellipse at 70% 40%, rgba(34,197,94,0.05) 0%, transparent 50%);
          pointer-events: none;
        }
        .gl-badge {
          display: inline-block;
          background: #1e1e2e;
          color: #818cf8;
          border: 1px solid #2d2d4e;
          padding: 8px 18px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.05em;
          margin-bottom: 24px;
          position: relative;
        }
        .gl-hero h1 {
          font-size: clamp(2.4rem, 6vw, 4rem);
          font-weight: 900;
          line-height: 1.05;
          color: #f8fafc;
          max-width: 850px;
          margin: 0 auto 16px;
          position: relative;
        }
        .gl-highlight { color: #22c55e; }
        .gl-sub {
          font-size: 1.2rem;
          color: #94a3b8;
          max-width: 620px;
          margin: 0 auto 12px;
          position: relative;
        }
        .gl-guarantee-line {
          font-size: 1.05rem;
          color: #fbbf24;
          font-weight: 700;
          margin-bottom: 32px;
          position: relative;
        }
        .gl-hero-cta {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: #22c55e;
          color: #0a0a0f;
          font-weight: 800;
          font-size: 1.2rem;
          padding: 20px 48px;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.2s;
          position: relative;
        }
        .gl-hero-cta:hover { background: #16a34a; transform: translateY(-2px); box-shadow: 0 20px 40px -10px rgba(34,197,94,0.3); }
        .gl-trust-row {
          display: flex;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 28px;
          position: relative;
        }
        .gl-pill {
          background: #1e1e2e;
          color: #94a3b8;
          border: 1px solid #2d2d4e;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 13px;
        }

        .gl-container { max-width: 820px; margin: 0 auto; padding: 0 24px; }
        .gl-container-full { padding-top: 60px; padding-bottom: 60px; }
        .gl-narrow { max-width: 680px; margin: 0 auto; }
        .gl-center { text-align: center; }

        .gl-guarantee-banner {
          background: linear-gradient(135deg, #1a1a1a 0%, #0d1117 100%);
          border: 2px solid #fbbf24;
          border-radius: 16px;
          padding: 36px 32px;
          text-align: center;
          margin: -40px auto 0;
          max-width: 760px;
          position: relative;
          z-index: 2;
        }
        .gl-shield { font-size: 2rem; margin-bottom: 8px; }
        .gl-guarantee-banner h2 {
          font-size: 1.5rem;
          font-weight: 800;
          color: #fbbf24;
          margin-bottom: 8px;
        }
        .gl-guarantee-banner p { color: #d1d5db; font-size: 1.05rem; max-width: 600px; margin: 0 auto; }
        .gl-guarantee-banner strong { color: #f8fafc; }

        .gl-section-gray {
          background: #0d1117;
          border-top: 1px solid #1e1e2e;
          border-bottom: 1px solid #1e1e2e;
        }

        h2.gl-center { font-size: 1.6rem; font-weight: 800; color: #f1f5f9; margin-bottom: 20px; }
        section.gl-container p { margin-bottom: 16px; color: #cbd5e1; }
        section.gl-container ol { padding-left: 24px; margin-bottom: 16px; }
        section.gl-container li { margin-bottom: 8px; color: #cbd5e1; }
        section.gl-container strong { color: #f1f5f9; }

        .gl-deliverable-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin: 24px 0;
        }
        @media (max-width: 640px) { .gl-deliverable-grid { grid-template-columns: 1fr; } }
        .gl-deliverable {
          background: #12121c;
          border: 1px solid #1e1e2e;
          border-radius: 14px;
          padding: 28px;
        }
        .gl-icon { font-size: 1.6rem; margin-bottom: 10px; }
        .gl-deliverable h3 { font-size: 1.1rem; font-weight: 700; color: #f1f5f9; margin-bottom: 8px; }
        .gl-deliverable p { font-size: 0.95rem; margin-bottom: 0; color: #94a3b8; }

        .gl-cta-section {
          text-align: center;
          padding: 80px 24px;
          background: linear-gradient(180deg, #0a0a0f 0%, #12121c 100%);
          border-top: 1px solid #1e1e2e;
          border-bottom: 1px solid #1e1e2e;
        }
        .gl-cta-section h2 { font-size: 2rem; font-weight: 900; color: #f8fafc; }
        .gl-cta-section > p { color: #94a3b8; max-width: 580px; margin: 0 auto 32px; }
        .gl-cta-big {
          display: inline-block;
          background: #22c55e;
          color: #0a0a0f;
          font-weight: 800;
          font-size: 1.3rem;
          padding: 22px 56px;
          border-radius: 14px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .gl-cta-big:hover { background: #16a34a; transform: translateY(-2px); box-shadow: 0 20px 40px -10px rgba(34,197,94,0.3); }
        .gl-cta-sub { color: #94a3b8; font-size: 0.9rem; margin-top: 20px; }

        .gl-footer-nav { border-top: 1px solid #1e1e2e; padding-top: 32px; margin-top: 0; }

        @media (max-width: 640px) {
          .gl-hero { padding: 60px 16px 50px; }
          .gl-guarantee-banner { margin: -30px 16px 0; padding: 28px 20px; }
          .gl-cta-big { font-size: 1.1rem; padding: 18px 36px; }
        }
      `}</style>
    </>
  );
}
