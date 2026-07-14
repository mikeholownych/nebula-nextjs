'use client';

import { useState } from 'react';
import './ad-burn-leaderboard.css';

export default function AdBurnLeaderboardPage() {
  const [formData, setFormData] = useState({
    url: '',
    email: '',
    signal: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setStatusMessage('Capturing...');

    try {
      const response = await fetch('/api/leaderboard-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Submit failed');
      
      setStatus('success');
      setStatusMessage('Captured. Run the instant audit next.');
      setTimeout(() => {
        window.location.href = `/audit?url=${encodeURIComponent(formData.url)}&email=${encodeURIComponent(formData.email)}`;
      }, 900);
    } catch {
      setStatus('error');
      setStatusMessage('Could not capture here. Opening the audit tool.');
      setTimeout(() => {
        window.location.href = '/audit';
      }, 900);
    }
  };

  return (
    <>
      <nav className="nav">
        <div className="wrap">
          <a className="brand" href="/">Nebula<span>Components</span></a>
          <div className="navlinks">
            <a href="#board">Leak board</a>
            <a href="#submit">Submit URL</a>
            <a href="/audit">Audit tool</a>
          </div>
        </div>
      </nav>

      <main>
        <section className="hero wrap">
          <div className="hero-content">
            <div className="kicker">Public proof for founders burning ad budget</div>
            <h1>Ad clicks are easy. Conversions are where the money leaks.</h1>
            <p>Your ads are not broken by default. If paid traffic lands and does not act, the page usually failed trust, message match, or proof.</p>
            <div className="cta">
              <a className="btn primary" href="#submit">Get first leak free</a>
              <a className="btn secondary" href="https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b">Fix it for $147</a>
            </div>
          </div>
          <aside className="proof-panel" aria-label="Current board metrics">
            <div className="metric">
              <span>Pages audited from public ad pain</span>
              <b>8</b>
            </div>
            <div className="metric">
              <span>Common issue found</span>
              <b>Trust</b>
            </div>
            <div className="metric">
              <span>Typical fix window</span>
              <b>&lt;60m</b>
            </div>
            <div className="metric">
              <span>Leak severity this week</span>
              <b>74%</b>
              <div className="meter">
                <div className="fill" style={{ width: '74%' }}></div>
              </div>
            </div>
          </aside>
        </section>

        <section id="board">
          <div className="wrap">
            <h2>Ad Burn Leak Board</h2>
            <p className="lead">Real public pain signals. Short diagnosis. One implementation path. The board is designed to attract founders already paying for clicks.</p>
            <div className="board">
              <article className="row">
                <div className="rank">#1</div>
                <div>
                  <div className="site">Time Technologies</div>
                  <span className="tag">Google/Facebook clicks</span>
                </div>
                <div className="signal">50+ paid clicks, zero form fills or bookings.</div>
                <div className="leak">Offer promise and form intent do not match cold traffic.</div>
                <div className="score">7.2/10</div>
              </article>
              <article className="row">
                <div className="rank">#2</div>
                <div>
                  <div className="site">FunghiClear</div>
                  <span className="tag">7,500 clicks</span>
                </div>
                <div className="signal">Thousands of visitors, only two sales.</div>
                <div className="leak">Product trust proof appears too late for a cold buyer.</div>
                <div className="score">7.2/10</div>
              </article>
              <article className="row">
                <div className="rank">#3</div>
                <div>
                  <div className="site">LowTDFW</div>
                  <span className="tag">Low CPC traffic</span>
                </div>
                <div className="signal">Cheap paid traffic, weak booking and show rate.</div>
                <div className="leak">CTA asks for commitment before trust is built.</div>
                <div className="score">7.2/10</div>
              </article>
              <article className="row">
                <div className="rank">#4</div>
                <div>
                  <div className="site">CaliSim</div>
                  <span className="tag">191 clicks</span>
                </div>
                <div className="signal">5% CTR on Google Ads, no conversions.</div>
                <div className="leak">Headline clarity and social proof are underpowered.</div>
                <div className="score">6.6/10</div>
              </article>
            </div>
          </div>
        </section>

        <section>
          <div className="wrap">
            <h2>What we look for first</h2>
            <p className="lead">No abstract CRO essay. The first leak needs to be visible, fixable, and tied to the traffic source.</p>
            <div className="grid">
              <div className="card">
                <h3>Message match</h3>
                <p>The ad promise and the first headline must say the same thing in plain language.</p>
              </div>
              <div className="card">
                <h3>Trust above fold</h3>
                <p>Cold visitors need proof before they give you money, email, or a booking request.</p>
              </div>
              <div className="card">
                <h3>CTA friction</h3>
                <p>The first action must match the buyer&apos;s readiness, not your sales process.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="submit">
          <div className="wrap submit">
            <div className="submit-info">
              <h2>Submit your ad-burn page.</h2>
              <p className="lead">Drop the URL and what traffic is failing. We will capture it, score the first leak, and route you to the audit tool.</p>
              <div className="cta">
                <a className="btn secondary" href="/audit">Run instant audit</a>
                <a className="btn primary" href="https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b">Start $147 fix</a>
              </div>
            </div>
            <form className="formbox" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="url">Founder URL</label>
                <input
                  id="url"
                  name="url"
                  type="url"
                  placeholder="https://yourlandingpage.com"
                  required
                  value={formData.url}
                  onChange={handleChange}
                />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="founder@company.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="field">
                <label htmlFor="signal">Traffic problem</label>
                <textarea
                  id="signal"
                  name="signal"
                  placeholder="Example: $800 Meta Ads, 236 clicks, 0 sales"
                  value={formData.signal}
                  onChange={handleChange}
                />
              </div>
              <button type="submit">Capture my first leak</button>
              <div id="formStatus" className={status !== 'idle' ? 'visible' : ''} role="status">
                {statusMessage}
              </div>
              <p className="note">No call. No calendar. If the leak is obvious, the fix starts through checkout.</p>
            </form>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap foot">
          <span>&copy; 2026 Nebula Components</span>
          <span><a href="mailto:ops@launchcrate.io">ops@launchcrate.io</a></span>
        </div>
      </footer>
    </>
  );
}
