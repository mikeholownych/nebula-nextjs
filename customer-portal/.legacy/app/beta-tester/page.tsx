'use client';

import { useState } from 'react';
import type { Metadata } from 'next';

export default function BetaTesterPage() {
  const [formData, setFormData] = useState({
    email: '',
    url: '',
    name: '',
    company: '',
    role: '',
    source: 'beta_tester_page'
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resultMessage, setResultMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setResultMessage('');

    try {
      const resp = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          url: formData.url.trim(),
          name: formData.name.trim(),
          company: formData.company.trim(),
          role: formData.role.trim(),
          source: formData.source
        })
      });

      const data = await resp.json();

      if (resp.ok) {
        setStatus('success');
        setResultMessage(data.message || "Application submitted! We'll review and get back to you within 24 hours.");
        setFormData({
          email: '',
          url: '',
          name: '',
          company: '',
          role: '',
          source: 'beta_tester_page'
        });
      } else {
        setStatus('error');
        setResultMessage(data.message || 'Something went wrong. Try again or email us directly.');
      }
    } catch {
      setStatus('error');
      setResultMessage('Network error. Try again.');
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-canvas)' }}>
      {/* Hero Header */}
      <header style={{
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        padding: '60px 20px',
        textAlign: 'center',
        borderBottom: '1px solid #1e293b'
      }}>
        <h1 style={{
          fontSize: '2.4rem',
          fontWeight: 800,
          margin: '0 0 12px',
          color: '#f8fafc'
        }}>
          Become a Beta Tester
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: '#94a3b8',
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: 1.5
        }}>
          Get the $147 Conversion Fix Pack free. In exchange: your honest feedback, a case study, and permission to share results publicly.
        </p>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '700px', margin: '24px auto', padding: '0 20px 60px' }}>
        {/* Price Card */}
        <div className="card" style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '28px',
          margin: '18px 0',
          textAlign: 'center'
        }}>
          <span style={{
            display: 'inline-block',
            background: '#4f46e5',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            Limited Beta Slots
          </span>
          <p style={{ margin: '20px 0 8px', color: '#94a3b8' }}>Normal price</p>
          <p>
            <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '1.2rem' }}>$147</span>{' '}
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#22c55e' }}>FREE</span>
          </p>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            You pay $0. The Fix Pack is built and delivered within 24 hours.
          </p>
        </div>

        {/* What You Get */}
        <div className="card" style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '28px',
          margin: '18px 0'
        }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '16px' }}>
            What you get
          </h2>
          <ul style={{ paddingLeft: '20px' }}>
            <li style={{ margin: '10px 0', color: '#cbd5e1' }}>
              <strong>Free Fix Pack</strong> — hero rewrite, CTA redesign, trust proof placement, FAQ section. Delivered as HTML you can paste directly into your page.
            </li>
            <li style={{ margin: '10px 0', color: '#cbd5e1' }}>
              <strong>Priority support</strong> — direct line to the team building your fixes.
            </li>
            <li style={{ margin: '10px 0', color: '#cbd5e1' }}>
              <strong>Lifetime access</strong> — keep everything even after the beta ends.
            </li>
            <li style={{ margin: '10px 0', color: '#cbd5e1' }}>
              <strong>Early adopter badge</strong> — featured on our site if you want.
            </li>
          </ul>
        </div>

        {/* What We Ask */}
        <div className="card" style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '28px',
          margin: '18px 0'
        }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '16px' }}>
            What we ask
          </h2>
          <ul style={{ paddingLeft: '20px' }}>
            <li style={{ margin: '10px 0', color: '#cbd5e1' }}>
              <strong>15-minute feedback call</strong> — review the Fix Pack results together.
            </li>
            <li style={{ margin: '10px 0', color: '#cbd5e1' }}>
              <strong>Written case study</strong> — 3-5 paragraphs about your experience and results.
            </li>
            <li style={{ margin: '10px 0', color: '#cbd5e1' }}>
              <strong>Permission to share</strong> — LinkedIn post, case study page, or testimonial quote. We'll never share without your approval on the final text.
            </li>
            <li style={{ margin: '10px 0', color: '#cbd5e1' }}>
              <strong>That's it.</strong> No NDA. No exclusivity. No ongoing commitment.
            </li>
          </ul>
        </div>

        {/* Who We're Looking For */}
        <div className="card" style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '28px',
          margin: '18px 0'
        }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '16px' }}>
            Who we're looking for
          </h2>
          <ul style={{ paddingLeft: '20px' }}>
            <li style={{ margin: '10px 0', color: '#cbd5e1' }}>
              Running paid ads (Google, Facebook, LinkedIn) with conversion under 2%
            </li>
            <li style={{ margin: '10px 0', color: '#cbd5e1' }}>
              Have a landing page you can share (URL only, no CMS access needed)
            </li>
            <li style={{ margin: '10px 0', color: '#cbd5e1' }}>
              Willing to implement our fixes and track results for 7 days
            </li>
            <li style={{ margin: '10px 0', color: '#cbd5e1' }}>
              Founder, marketer, or owner — decision-maker on your page
            </li>
          </ul>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
            {['SaaS', 'Ecom', 'Service Business', 'Lead Gen'].map((tag) => (
              <span key={tag} style={{
                display: 'inline-block',
                background: 'var(--bg-panel)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)'
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Application Form */}
        <div className="card" style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '28px',
          margin: '18px 0'
        }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '4px' }}>
            Apply for beta access
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 12px' }}>
            We review every application. If accepted, you'll get the Fix Pack within 24 hours.
          </p>

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              placeholder="Your email address"
              required
              value={formData.email}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--bg-panel)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                margin: '6px 0'
              }}
            />
            <input
              type="url"
              name="url"
              placeholder="Your landing page URL"
              required
              value={formData.url}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--bg-panel)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                margin: '6px 0'
              }}
            />
            <input
              type="text"
              name="name"
              placeholder="Your name"
              required
              value={formData.name}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--bg-panel)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                margin: '6px 0'
              }}
            />
            <input
              type="text"
              name="company"
              placeholder="Company name"
              value={formData.company}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--bg-panel)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                margin: '6px 0'
              }}
            />
            <input
              type="text"
              name="role"
              placeholder="Your role (founder / marketer / owner)"
              value={formData.role}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--bg-panel)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                margin: '6px 0'
              }}
            />

            <input type="hidden" name="source" value="beta_tester_page" />

            {status !== 'idle' && (
              <div style={{
                margin: '12px 0',
                padding: '10px 14px',
                borderRadius: '8px',
                background: status === 'success' ? '#064e3b' : status === 'error' ? '#7f1d1d' : 'transparent',
                color: status === 'success' ? '#6ee7b7' : status === 'error' ? '#fca5a5' : 'var(--text-muted)'
              }}>
                {status === 'loading' && 'Submitting...'}
                {status === 'success' && resultMessage}
                {status === 'error' && resultMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                width: '100%',
                padding: '14px 32px',
                background: '#4f46e5',
                color: 'white',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 700,
                fontSize: '1.05rem',
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                opacity: status === 'loading' ? 0.7 : 1,
                transition: 'all 0.15s'
              }}
            >
              {status === 'loading' ? 'Submitting...' : 'Apply for Beta Access'}
            </button>
          </form>

          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '12px 0 0' }}>
            No spam. We'll only email about your beta application and delivery.
          </p>
        </div>
      </main>
    </div>
  );
}
