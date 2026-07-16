'use client';

import Link from 'next/link';
import { useState } from 'react';
import { trackEvent } from './lib/analytics';

export default function NotFoundPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    trackEvent('error_page_email_capture', { error_type: '404', email });
    
    // Send lead to agentmail
    fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        trigger: '404_page_visit',
        source: 'error_page_conversion',
        intent: 'high'
      })
    }).finally(() => setStatus('idle'));
  };

  return (
    <div className="page error-page">
      <header className="header" role="banner">
        <div className="header-inner">
          <a href="/" className="logo" aria-label="Nebula Components home">
            <span className="logo-mark" aria-hidden="true">◆</span>
            <span className="logo-text">Nebula</span>
          </a>
        </div>
      </header>

      <main role="main" className="error-content">
        {/* Trigger Badge - Key ICP Signal */}
        <div className="hero-badge error-badge" role="status">
          <span className="badge-dot" aria-hidden="true"></span>
          Page missing? Your clicks just turned into wasted ad spend.
        </div>

        <div className="error-icon">404</div>
        
        <h1 className="error-title">
          Page not found — but your ad budget still needs to work
        </h1>
        
        <p className="error-subtitle">
          You landed on a broken link. That means someone clicked your ad expecting your offer — 
          and your funnel just leaked money.
        </p>

        {/* Quick Recovery - Free Audit Offer */}
        <div className="error-recovery">
          <h2 className="recovery-heading">
            Fix your funnel before your next campaign
          </h2>
          <p className="recovery-desc">
            Get a free landing page audit — see exactly why your clicks aren't converting 
            and the one fix that pays back fastest.
          </p>
          
          <form onSubmit={handleSubmit} className="error-form">
            <div className="form-group">
              <label htmlFor="error-email">Where should we send your audit?</label>
              <div className="form-row">
                <input
                  type="email"
                  id="error-email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-describedby="error-email-hint"
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
              <span id="error-email-hint" className="form-hint">
                Free diagnosis. $147 to fix. No calls.
              </span>
            </div>
          </form>
        </div>

        {/* Social Proof from 404 Visitors */}
        <div className="error-proof">
          <h3 className="proof-heading">Founders who found us via broken links</h3>
          <div className="proof-grid">
            <div className="proof-card">
              <span className="proof-number">$12.4k</span>
              <span className="proof-label">Wasted ad spend diagnosed</span>
            </div>
            <div className="proof-card">
              <span className="proof-number">2.3 days</span>
              <span className="proof-label">Avg. payback time</span>
            </div>
            <div className="proof-card">
              <span className="proof-number">94%</span>
              <span className="proof-label">Fix rate on 404 leads</span>
            </div>
          </div>
        </div>

        {/* Self-Help Links */}
        <div className="error-help">
          <h3 className="help-heading">Try these pages instead</h3>
          <div className="help-links">
            <Link href="/learning-centre" className="help-link">
              <strong>Learning Centre</strong>
              <span>Best practices for conversion-rate optimization</span>
            </Link>
            <Link href="/case-studies" className="help-link">
              <strong>Case Studies</strong>
              <span>Real results from founders like you</span>
            </Link>
            <Link href="/pricing" className="help-link">
              <strong>Pricing</strong>
              <span>Free audit → $147 Fix Pack</span>
            </Link>
          </div>
        </div>

        {/* Emergency Offer */}
        <div className="error-emergency">
          <p className="emergency-text">
            <strong>Your funnel is bleeding money right now.</strong>
            Get the audit before your next campaign — 
            fix what's broken before you spend another dollar.
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
