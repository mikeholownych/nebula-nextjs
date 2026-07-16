import { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'AI Marketing Ops — Nebula Components',
  description: 'Autonomous lead gen, outreach, audit delivery, and monthly CRO — running 24/7 for your business. No agency retainer. No headcount. $497/mo.',
  openGraph: {
    title: 'AI Marketing Ops — Nebula Components',
    description: 'Autonomous lead gen, outreach, audit delivery, and monthly CRO — running 24/7 for your business. No agency retainer. No headcount. $497/mo.',
    url: 'https://nebulacomponents.shop/marketing-ops',
    type: 'website',
  },
};

export default function MarketingOpsPage() {
  return (
    <>
      <header className="mops-header">
        <div className="mops-logo-mark">N</div>
        <div className="mops-logo-name">Nebula Components</div>
      </header>

      <div className="mops-page">
        {/* HERO */}
        <div className="mops-hero">
          <div className="mops-badge">AI Marketing Ops</div>
          <h1>Your marketing engine,<br /><span>running 24/7 without you.</span></h1>
          <p>We deploy the same autonomous lead-gen + conversion stack we built for ourselves — running continuously for your business. No agency markup. No headcount. No Monday morning stand-ups.</p>
          <div className="mops-hero-cta-row">
            <a href="mailto:ops@launchcrate.io?subject=AI Marketing Ops inquiry" className="mops-btn-primary">Talk to us →</a>
            <a href="#pricing" className="mops-btn-ghost">See pricing ↓</a>
          </div>
        </div>

        {/* WHAT IT IS */}
        <div className="mops-section">
          <div className="mops-section-label">What it is</div>
          <h2>A full outbound + conversion loop — autonomous</h2>
          <p>We run a multi-agent pipeline that continuously finds leads with active buying signals, reaches out with a useful artifact (a real audit of their page), and pushes qualified respondents toward your offer — all without human handoff.</p>
        </div>

        {/* AGENT LOOP */}
        <div className="mops-section">
          <div className="mops-section-label">How it works</div>
          <h2>The agent loop</h2>
          <div className="mops-loop-grid">
            <div className="mops-loop-step">
              <div className="mops-step-num">1</div>
              <div className="mops-step-body">
                <strong>Trigger detection</strong>
                <p>Agents scan Reddit, Upwork, LinkedIn, and Product Hunt 24/7 for founders posting buying signals — "my page isn&apos;t converting," "running ads with no ROI," "bounce rate too high."</p>
              </div>
            </div>
            <div className="mops-loop-step">
              <div className="mops-step-num">2</div>
              <div className="mops-step-body">
                <strong>ICP qualification</strong>
                <p>Every lead scored against your ICP — budget signals, company size, platform, vertical. Off-ICP leads discarded automatically.</p>
              </div>
            </div>
            <div className="mops-loop-step">
              <div className="mops-step-num">3</div>
              <div className="mops-step-body">
                <strong>Value-first outreach</strong>
                <p>Lead receives a personalized artifact — a real audit of their landing page with specific findings — before any pitch. Not a cold email. A free consult frame.</p>
              </div>
            </div>
            <div className="mops-loop-step">
              <div className="mops-step-num">4</div>
              <div className="mops-step-body">
                <strong>Auto follow-up + upsell</strong>
                <p>Responders are tracked. Non-buyers get a retainer pitch at 24h. Buyers get delivery confirmation + onboarding automatically.</p>
              </div>
            </div>
            <div className="mops-loop-step">
              <div className="mops-step-num">5</div>
              <div className="mops-step-body">
                <strong>Daily ops report</strong>
                <p>Every morning you get a digest: leads contacted, replies received, proposals queued, revenue events logged. Nothing to manage.</p>
              </div>
            </div>
          </div>
        </div>

        {/* WHAT&apos;S INCLUDED */}
        <div className="mops-section">
          <div className="mops-section-label">What&apos;s included</div>
          <h2>Full stack, configured for your business</h2>
          <div className="mops-includes-grid">
            <div className="mops-inc-item">
              <div className="mops-icon">🔍</div>
              <strong>Trigger-aware lead scraper</strong>
              <p>Reddit, Upwork, LinkedIn — qualified by buying signal, not demographics</p>
            </div>
            <div className="mops-inc-item">
              <div className="mops-icon">📊</div>
              <strong>Automated audit engine</strong>
              <p>5-dimension page audit generated per lead, delivered as a personalized email</p>
            </div>
            <div className="mops-inc-item">
              <div className="mops-icon">✉️</div>
              <strong>Outreach + follow-up sequences</strong>
              <p>Initial contact, retainer upsell, and digest — all autonomous via AgentMail</p>
            </div>
            <div className="mops-inc-item">
              <div className="mops-icon">💳</div>
              <strong>Self-serve checkout pipeline</strong>
              <p>Stripe-linked delivery — buyer pays, receives deliverables automatically</p>
            </div>
            <div className="mops-inc-item">
              <div className="mops-icon">📈</div>
              <strong>Lead state tracking</strong>
              <p>SQLite ledger — every lead tracked from discovery to paid, with full audit trail</p>
            </div>
            <div className="mops-inc-item">
              <div className="mops-icon">🛡️</div>
              <strong>SRE + health monitoring</strong>
              <p>Cron health checks, dead letter queue, bounce handling, Telegram alerts</p>
            </div>
          </div>
        </div>

        {/* WHO IT&apos;S FOR */}
        <div className="mops-section">
          <div className="mops-section-label">Who it&apos;s for</div>
          <h2>SMBs replacing manual marketing ops</h2>
          <div className="mops-icp-grid">
            <div className="mops-icp-item">
              <div className="mops-icp-icon">🏢</div>
              <div>
                <strong>Agencies with a productized service</strong>
                <p>You have an offer. You just need a machine that finds buyers and books the work.</p>
              </div>
            </div>
            <div className="mops-icp-item">
              <div className="mops-icp-icon">🚀</div>
              <div>
                <strong>SaaS companies running performance marketing</strong>
                <p>Outbound + landing page optimization running as a single autonomous loop.</p>
              </div>
            </div>
            <div className="mops-icp-item">
              <div className="mops-icp-icon">🛒</div>
              <div>
                <strong>E-commerce brands spending on ads</strong>
                <p>Continuous CRO audit loop — catch conversion drops before they compound.</p>
              </div>
            </div>
          </div>
        </div>

        {/* VS TABLE */}
        <div className="mops-section">
          <div className="mops-section-label">Why not an agency</div>
          <h2>Autonomous ops vs. traditional agency</h2>
          <table className="mops-vs-table">
            <thead>
              <tr><th>Factor</th><th>Agency retainer</th><th>Nebula AI Ops</th></tr>
            </thead>
            <tbody>
              <tr><td>Monthly cost</td><td className="mops-bad">$3,000–$10,000</td><td className="mops-good">$497/mo</td></tr>
              <tr><td>Lead gen</td><td className="mops-bad">Manual SDR team</td><td className="mops-good">Autonomous, 24/7</td></tr>
              <tr><td>Outreach personalization</td><td className="mops-bad">Templates + bulk sends</td><td className="mops-good">Per-lead artifact (real audit)</td></tr>
              <tr><td>Reporting</td><td className="mops-bad">Monthly PDF deck</td><td className="mops-good">Daily digest, real data</td></tr>
              <tr><td>Human required</td><td className="mops-bad">Account manager + weekly calls</td><td className="mops-good">None (escalation only)</td></tr>
              <tr><td>Setup time</td><td className="mops-bad">4–8 weeks onboarding</td><td className="mops-good">1 week</td></tr>
            </tbody>
          </table>
        </div>

        {/* PRICING */}
        <div className="mops-section" id="pricing">
          <div className="mops-section-label">Pricing</div>
          <h2>One flat monthly rate</h2>
          <div className="mops-pricing-card">
            <div className="mops-price-row">
              <div className="mops-price-big">$497</div>
              <div className="mops-price-period">/month</div>
            </div>
            <div className="mops-price-note">No contract. Cancel any time. Setup fee: $0.</div>
            <ul className="mops-price-list">
              <li><span className="mops-chk">✓</span> Full trigger-aware lead scraper (Reddit + Upwork + LinkedIn)</li>
              <li><span className="mops-chk">✓</span> Automated audit generation + outreach emails</li>
              <li><span className="mops-chk">✓</span> Retainer upsell + follow-up sequences</li>
              <li><span className="mops-chk">✓</span> Self-serve Stripe checkout + automated delivery</li>
              <li><span className="mops-chk">✓</span> Lead state DB + daily ops digest</li>
              <li><span className="mops-chk">✓</span> SRE health monitoring + Telegram alerts</li>
              <li><span className="mops-chk">✓</span> 1-week setup + handover documentation</li>
              <li><span className="mops-chk">✓</span> Monthly strategy call (optional, 30 min)</li>
            </ul>
            <a href="mailto:ops@launchcrate.io?subject=AI Marketing Ops — let%27s talk" className="mops-cta-full">Get started — email us →</a>
            <p className="mops-cta-sub">We onboard 2–3 clients/month. Reply and we&apos;ll confirm availability.</p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mops-section">
          <div className="mops-section-label">FAQ</div>
          <h2>Common questions</h2>
          <div className="mops-faq-list">
            <div className="mops-faq-item">
              <strong>Is this just a SaaS tool I configure myself?</strong>
              <p>No. We deploy, configure, and operate the full pipeline for your business. You receive daily reports. We handle everything else.</p>
            </div>
            <div className="mops-faq-item">
              <strong>What do I need to provide?</strong>
              <p>Your offer URL, your ICP definition, and your Stripe account. We handle scraping, outreach infrastructure, audit generation, and delivery.</p>
            </div>
            <div className="mops-faq-item">
              <strong>How many leads does it generate per month?</strong>
              <p>Depends on your ICP density. Typical range: 30–150 qualified leads/month contacted. We track reply rate and iterate on messaging.</p>
            </div>
            <div className="mops-faq-item">
              <strong>What if I already have a CRM?</strong>
              <p>We export lead data as JSON/CSV daily. HubSpot/Airtable webhook integration available on request.</p>
            </div>
            <div className="mops-faq-item">
              <strong>Do I need to approve every outreach email?</strong>
              <p>No. The pipeline is autonomous. You can review the proposals queue before submission if preferred — that&apos;s a config toggle.</p>
            </div>
            <div className="mops-faq-item">
              <strong>What&apos;s the cancellation policy?</strong>
              <p>Cancel any time. No long-term contract. Your data is exported and handed off on cancel.</p>
            </div>
          </div>
        </div>

        {/* BOTTOM CTA */}
        <div className="mops-bottom-cta">
          <h2>Ready to run on autopilot?</h2>
          <p>Email us and we&apos;ll confirm availability. Onboarding takes 1 week.</p>
          <a href="mailto:ops@launchcrate.io?subject=AI Marketing Ops — let%27s talk" className="mops-btn-primary">ops@launchcrate.io →</a>
        </div>
      </div>
    </>
  );
}
