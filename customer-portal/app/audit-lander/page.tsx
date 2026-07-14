'use client';

import { useState } from 'react';
import './audit-lander.css';

export default function AuditLanderPage() {
  const [formData, setFormData] = useState({
    url: '',
    email: '',
    goal: 'sales',
    adSpend: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resultMessage, setResultMessage] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const escapeHtml = (text: string) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setResultMessage('');

    try {
      const resp = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: formData.url,
          email: formData.email,
          goal: formData.goal
        })
      });

      const data = await resp.json();

      if (data.error) {
        setResultMessage(data.error);
        setStatus('error');
      } else {
        setResultMessage(`Check ${formData.email} in ~60 seconds.`);
        setStatus('success');
        if (data.redirect) {
          setRedirectUrl(data.redirect);
          setTimeout(() => { window.location.href = data.redirect; }, 2000);
        }
      }
    } catch {
      setResultMessage('Network error. Please try again or email ops@launchcrate.io');
      setStatus('error');
    }
  };

  return (
    <>
      <div className="hero">
        <h1>Ads send traffic. <em>Your landing page</em> kills it.</h1>
        <p className="sub">You paid for the click. Now watch it bounce. Paste your URL — in 60 seconds you get a priority-ranked fix list with specific code changes for each leak.</p>
        <div className="stat">97% of ad clicks don&apos;t convert. <span>Most founders buy more traffic. Smart ones fix the page first.</span></div>
        <div className="trust-row">
          <span className="pill">No sales call</span>
          <span className="pill">Priority-ranked fixes</span>
          <span className="pill">Private link in 60s</span>
          <span className="pill">See a real audit ↓</span>
          <span className="pill highlight">You own the data forever</span>
        </div>
      </div>

      <div className="center">
        <a href="/audit" className="sample-link">📋 See a real audit report before you submit →</a>

        <div className="card">
          <h2>What&apos;s included in your free audit <span className="badge green">full scope</span></h2>
          <p className="micro" style={{ marginBottom: '12px' }}>No guesswork. Every audit scores these 5 dimensions and delivers a prioritized fix list tailored to your page:</p>
          <ul className="scope-list">
            <li><strong>1. Headline Clarity</strong> — Does your headline name the visitor&apos;s problem or just describe your product? We score specificity, emotional resonance, and promise clarity.</li>
            <li><strong>2. CTA Friction</strong> — Is your call-to-action buried, vague, or competing with too many options? We measure actionability and visual prominence.</li>
            <li><strong>3. Trust Proof</strong> — Testimonials, case studies, logos, guarantees. We check if proof exists where the visitor needs it (before the decision, not after).</li>
            <li><strong>4. Offer Specificity</strong> — Does your page say exactly what happens when they click? Vague offers kill conversions. We flag generic language.</li>
            <li><strong>5. Implementation Difficulty</strong> — Can the fixes be done in 24h or do they need a redesign? We prioritize quick wins first.</li>
          </ul>
          <p className="micro" style={{ marginTop: '8px' }}>Plus: page speed score, mobile responsiveness check, ad-to-page alignment audit, and a prioritized opportunity matrix ranked by impact vs. effort.</p>
        </div>

        <div className="card" id="audit-form-card">
          <h2 style={{ fontSize: '20px', marginBottom: '6px' }}>See exactly what is leaking</h2>
          <p className="micro" style={{ marginBottom: '10px' }}>The audit checks 5 dimensions and delivers a priority-ranked fix list to your inbox. Each fix comes with specific code + effort estimate. No login. No sales call. No follow-up spam.</p>
          
          <form id="audit-form" onSubmit={handleSubmit}>
            <label htmlFor="url">Your landing page URL</label>
            <input
              id="url"
              name="url"
              type="url"
              placeholder="https://your-landing-page.com"
              required
              value={formData.url}
              onChange={handleChange}
            />

            <label htmlFor="email">Email for delivery</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              value={formData.email}
              onChange={handleChange}
            />

            <label htmlFor="goal">Primary conversion goal</label>
            <select id="goal" name="goal" value={formData.goal} onChange={handleChange}>
              <option value="sales">Sales</option>
              <option value="leads">Leads</option>
              <option value="signups">Signups</option>
              <option value="bookings">Bookings</option>
            </select>

            <label htmlFor="adSpend">Monthly ad spend (helps us prioritize fixes)</label>
            <select id="adSpend" name="adSpend" value={formData.adSpend} onChange={handleChange}>
              <option value="">Select if applicable</option>
              <option value="0-500">$0 - $500/mo</option>
              <option value="500-2k">$500 - $2k/mo</option>
              <option value="2k-10k">$2k - $10k/mo</option>
              <option value="10k+">$10k+/mo</option>
            </select>

            <p className="micro" style={{ marginTop: '8px' }}>
              Your URL and email are used to generate, email, and log the audit. No resale. No spam.{' '}
              <a href="/privacy-policy" style={{ color: 'var(--accent)' }}>Privacy Policy</a>
            </p>

            <button type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Running audit...' : 'Run my free teardown →'}
            </button>

            <div className="guarantee-badge">🏷️ Full refund if the $147 fix doesn&apos;t improve your conversion rate</div>
          </form>

          {status !== 'idle' && (
            <div id="audit-result" className="audit-result" style={{ display: 'block' }}>
              {status === 'loading' && <p style={{ color: 'var(--text-muted)' }}>Processing...</p>}
              {status === 'success' && (
                <p style={{ color: '#047857', fontWeight: 700 }}>
                  ✓ Audit running. Check <strong>{formData.email}</strong> in ~60 seconds.
                </p>
              )}
              {status === 'error' && (
                <>
                  <p style={{ color: '#dc2626' }}>{escapeHtml(resultMessage) || 'An error occurred'}</p>
                  <p className="micro">Email ops@launchcrate.io with your URL and we&apos;ll route it through the audit queue.</p>
                </>
              )}
            </div>
          )}
        </div>

        <div className="how">
          <div className="how-step">
            <span className="num">01</span>
            <p>Paste your URL. No login, no extension, no account.</p>
          </div>
          <div className="how-step">
            <span className="num">02</span>
            <p>AI scores 5 dimensions against a fixed conversion rubric.</p>
          </div>
          <div className="how-step">
            <span className="num">03</span>
            <p>Private fix list + opportunity matrix lands in your inbox. 60 seconds total.</p>
          </div>
          <div className="how-step">
            <span className="num">04</span>
            <p>Optional: $147 ships the top fixes in 24h. Full refund if CVR doesn&apos;t improve.</p>
          </div>
        </div>

        <div className="testimonial">
          <div className="quote">&quot;The audit nailed exactly why my Google Ads weren&apos;t converting. Fixed the headline in 20 minutes. First conversion by end of week.&quot;</div>
          <div className="name">— Danny R., Founder, Repair &amp; Square</div>
        </div>

        <div className="card">
          <h2>$147 fix pack — zero risk, full refund <span className="badge green">guaranteed</span></h2>
          <p style={{ fontSize: '14px', marginBottom: '12px' }}>After your free audit, you can buy the fix implementation. Here&apos;s exactly what that includes — and how we protect you:</p>
          <div className="offer-grid">
            <div className="offer-card">
              <div className="price">$147 <small>one-time</small></div>
              <div className="label">24-hour implementation</div>
              <div className="guarantee">📋 We duplicate your page — zero risk to live campaigns</div>
            </div>
            <div className="offer-card">
              <div className="price">$0 <small>if it doesn&apos;t work</small></div>
              <div className="label">Full refund guarantee</div>
              <div className="guarantee">📈 Full refund if your conversion rate doesn&apos;t improve within 14 days</div>
            </div>
          </div>
          <p className="micro" style={{ textAlign: 'center' }}>
            No call required. No retainer. No commitment beyond the fix.{' '}
            <a href="/primer" style={{ color: '#60a5fa' }}>Full FAQ →</a>
          </p>
        </div>

        <div className="card" id="data-privacy">
          <h2>Data privacy — exactly what we access <span className="badge blue">transparent</span></h2>
          <p className="micro" style={{ marginBottom: '12px' }}>This is the #1 question founders ask. Here&apos;s the honest answer — no fine print:</p>
          <div className="privacy-grid">
            <div className="privacy-col yes">
              <h3>✓ What we access</h3>
              <ul>
                <li>Your landing page URL (public content only — same as visiting it in a browser)</li>
                <li>Page HTML, meta tags, and inline content (what any visitor sees)</li>
                <li>Your email address (for delivery — stored securely, never shared)</li>
                <li>Conversion goal you select (to tailor the fix priority)</li>
              </ul>
            </div>
            <div className="privacy-col no">
              <h3>✗ What we NEVER access</h3>
              <ul>
                <li>Your analytics dashboard or login credentials</li>
                <li>Customer data, PII, or payment info</li>
                <li>Your ad accounts (Google, Meta, LinkedIn)</li>
                <li>Your CMS, backend, or server access</li>
                <li>Cookies, sessions, or tracking data</li>
              </ul>
            </div>
          </div>
          <p className="micro" style={{ marginTop: '8px' }}>The audit is a public-page analysis — the same data any visitor sees, scored against a conversion rubric. If you later buy the $147 fix and choose to share access for implementation, we sign a data processing agreement and provide a documented rollback plan before any work begins.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">60s</div>
            <div className="micro">audit delivery time</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">5</div>
            <div className="micro">dimensions scored</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">$0</div>
            <div className="micro">no hidden upsell</div>
          </div>
        </div>

        <div className="card warning-card">
          <h2>Who this isn&apos;t for <span className="badge amber">save us both the time</span></h2>
          <p className="micro" style={{ marginBottom: '12px' }}>This audit is built for founders actively losing money on ads. If any of these apply, you&apos;d be better served elsewhere:</p>
          <ul className="scope-list" style={{ borderLeftColor: '#f59e0b' }}>
            <li><strong>No ad spend yet</strong> — If you haven&apos;t run paid traffic, there&apos;s nothing to fix. Go run ads first, then come back.</li>
            <li><strong>No live landing page</strong> — The audit needs a public URL. If your page isn&apos;t live, we can&apos;t score it.</li>
            <li><strong>Want brand strategy</strong> — This is a conversion fix, not a rebrand. If you need visual identity work, hire a brand agency.</li>
            <li><strong>No budget to implement</strong> — The audit is free. The fix is $147. If you can&apos;t spend $147 within 30 days, the data just gets stale.</li>
          </ul>
          <p className="micro" style={{ marginTop: '8px', color: '#f59e0b' }}><strong>Still here?</strong> You&apos;re in the right place. Paste your URL above.</p>
        </div>

        <div className="card own-data-card">
          <h2>Your audit is yours forever <span className="badge green">you own it</span></h2>
          <p className="micro" style={{ marginBottom: '12px' }}>Most audit tools lock you into a subscription or hide the data. Not here:</p>
          <ul className="scope-list">
            <li><strong>Download the full report</strong> — JSON + HTML. Yours to keep, share, or archive.</li>
            <li><strong>Share with your team</strong> — Private link. No login required. Forward it to your dev, your designer, your agency.</li>
            <li><strong>Re-run anytime</strong> — The $1,497 retainer includes weekly re-scans. Track improvements over time.</li>
            <li><strong>No vendor lock-in</strong> — If you cancel, you keep every audit you ever received. We can&apos;t revoke access.</li>
          </ul>
          <p className="micro" style={{ marginTop: '8px' }}>Your data. Your fixes. Your conversion rate.</p>
        </div>

        <div className="card ai-search-card">
          <h2 style={{ color: '#818cf8' }}>Google&apos;s AI answers are eating your clicks</h2>
          <p className="micro" style={{ marginBottom: '12px' }}>Your SEO playbook was built for blue links. But search changed:</p>
          <ul className="scope-list" style={{ borderLeftColor: '#818cf8' }}>
            <li><strong>Traffic is up, conversions are flat</strong> — AI Overviews answer questions without sending clicks. Your ranking doesn&apos;t matter if nobody visits.</li>
            <li><strong>Named, you show up. Described, you disappear</strong> — AI assistants mention brands they know. Category questions (&quot;best X for Y&quot;) are where money moves — and where most brands are invisible.</li>
            <li><strong>Your landing page is the new front door</strong> — When AI does send a click, your page has seconds to prove value. We measure those seconds.</li>
          </ul>
          <p className="micro" style={{ marginTop: '8px', color: '#818cf8' }}><strong>Fix the page first.</strong> Then worry about AI visibility. Audit above ↑</p>
        </div>

        <p className="micro" style={{ textAlign: 'center', margin: '8px 0 24px' }}>
          Questions? <a href="mailto:ops@launchcrate.io" style={{ color: '#60a5fa' }}>ops@launchcrate.io</a>
        </p>
      </div>
    </>
  );
}
