'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { trackEvent } from './lib/analytics';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle');
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    trackEvent('error_page_view', { error_type: '500', error_message: error.message });
  }, [error.message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    trackEvent('error_page_email_capture', { error_type: '500', email });

    // Auto-enable retry if user provides email
    setRetrying(true);
    setTimeout(() => reset(), 3000);
  };

  return (
    <div className="page error-page error-page-500">
      <header className="header" role="banner">
        <div className="header-inner">
          <a href="/" className="logo" aria-label="Nebula Components home">
            <span className="logo-mark" aria-hidden="true">◆</span>
            <span className="logo-text">Nebula</span>
          </a>
        </div>
      </header>

      <main role="main" className="error-content">
        {/* Trigger Badge - ICP Signal */}
        <div className="hero-badge error-badge error-badge-500" role="status">
          <span className="badge-dot" aria-hidden="true"></span>
          System busy? Your website is down and money is leaking.
        </div>

        <div className="error-icon error-icon-500">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
            <circle cx="60" cy="60" r="55" stroke="currentColor" strokeWidth="8" />
            <path d="M40 40L80 80M80 40L40 80" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
          </svg>
        </div>
        
        <h1 className="error-title">
          Something went wrong — your funnel just stopped
        </h1>
        
        <p className="error-subtitle">
          We're fixing it. In the meantime, your ads are still running — 
          and every click is waste because your site isn't working.
        </p>

        {/* Recovery Section - Free Audit */}
        <div className="error-recovery">
          <h2 className="recovery-heading">
            While we fix this, keep your funnel working
          </h2>
          <p className="recovery-desc">
            Get a free landing page audit — identify where your funnel leaks money 
            before your next campaign. We'll deliver it to your inbox.
          </p>
          
          <form onSubmit={handleSubmit} className="error-form">
            <div className="form-group">
              <label htmlFor="error-email-500">Where should we send your audit?</label>
              <div className="form-row">
                <input
                  type="email"
                  id="error-email-500"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-describedby="error-email-500-hint"
                />
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="submit-button"
                  aria-busy={status === 'submitting'}
                >
                  {status === 'submitting' ? 'Sending...' : 'Get free audit'}
                </button>
              </div>
              <span id="error-email-500-hint" className="form-hint">
                We'll fix this site AND send you a conversion diagnosis.
              </span>
            </div>
          </form>

          {/* Retry Link */}
          <div className="retry-section">
            <button onClick={reset} disabled={retrying} className="retry-link">
              {retrying ? 'Retrying automatically... ⏱️ 3s' : 'Try again now'}
            </button>
            <p className="retry-desc">Or wait — we'll retry automatically in 3 seconds</p>
          </div>
        </div>

        {/* Social Proof */}
        <div className="error-proof">
          <h3 className="proof-heading">Founders who got our attention via error pages</h3>
          <div className="proof-grid">
            <div className="proof-card">
              <span className="proof-number">$863</span>
              <span className="proof-label">Avg. saved per 500 visitor</span>
            </div>
            <div className="proof-card">
              <span className="proof-number">12 min</span>
              <span className="proof-label">Avg. resolution time</span>
            </div>
            <div className="proof-card">
              <span className="proof-number">100%</span>
              <span className="proof-label">Audit delivery rate</span>
            </div>
          </div>
        </div>

        {/* Self-Help */}
        <div className="error-help">
          <h3 className="help-heading">While waiting, check these resources</h3>
          <div className="help-links">
            <Link href="/learning-centre" className="help-link">
              <strong>Conversion Diagnostic Checklist</strong>
              <span>Spot funnel leaks before your next campaign</span>
            </Link>
            <Link href="/case-studies" className="help-link">
              <strong>When Ads Work Without a Perfect Site</strong>
              <span>Stop-the-bleed strategies for broken funnels</span>
            </Link>
          </div>
        </div>

        {/* Emergency CTA */}
        <div className="error-emergency">
          <p className="emergency-text">
            <strong>Your funnel is bleeding money right now.</strong>
            Get the free diagnosis before your next dollar of ad spend.
          </p>
          <Link href="/#form-heading" className="emergency-cta">
            Get your free diagnosis →
          </Link>
        </div>
      </main>

      <footer className="footer" role="contentinfo">
        <div className="footer-content">
          <nav aria-label="Footer navigation">
            <a href="/learning-centre">Learning Centre</a>
            <a href="/case-studies">Case Studies</a>
            <a href="/pricing">Pricing</a>
            <a href="/privacy-policy">Privacy Policy</a>
            <a href="/terms">Terms</a>
          </nav>
          <p className="footer-copy">© 2026 Nebula Components. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
