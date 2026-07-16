'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function AuditResultsContent() {
  const searchParams = useSearchParams();
  const url = searchParams?.get('url') || '';

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
          <Link href="/audit">New Audit</Link>
        </nav>
      </header>

      {/* Processing State */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge" style={{ borderColor: '#fbbf24' }}>
            <span className="pulse-dot" style={{ background: '#fbbf24' }} />
            Processing Your Audit
          </div>
          <h1 className="hero-title">
            Analyzing Your Page...<br />
            <span className="text-gradient">This takes about 60 seconds.</span>
          </h1>
          <p className="hero-sub" style={{ maxWidth: '600px' }}>
            We're scanning <strong>{url || 'your landing page'}</strong> for conversion leaks.
            You'll see your score and top 3 fixes shortly.
          </p>
          
          {/* Progress indicator */}
          <div style={{
            width: '100%',
            maxWidth: '500px',
            height: '4px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '4px',
            margin: '40px auto',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '30%',
              height: '100%',
              background: 'linear-gradient(90deg, var(--accent), #fbbf24)',
              borderRadius: '4px',
              animation: 'shimmer 2s ease-in-out infinite'
            }} />
          </div>

          <p style={{ color: 'var(--fg-muted)', fontSize: '14px' }}>
            <span className="check">✓</span> Analyzing headline clarity
            <span className="check" style={{ marginLeft: '24px' }}>✓</span> Checking CTA visibility
          </p>
          <p style={{ color: 'var(--fg-muted)', fontSize: '14px', marginTop: '8px' }}>
            <span className="check">✓</span> Scanning trust signals
            <span className="check" style={{ marginLeft: '24px' }}>✓</span> Testing mobile layout
          </p>

          {/* What happens next */}
          <div style={{ marginTop: '60px', padding: '32px', background: 'var(--bg-panel)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>What You'll Get</h3>
            <div style={{ display: 'grid', gap: '12px', textAlign: 'left' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ color: 'var(--accent)', fontSize: '24px' }}>📊</span>
                <span style={{ color: 'var(--fg-muted)' }}>Overall conversion score (0-10)</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ color: 'var(--accent)', fontSize: '24px' }}>💸</span>
                <span style={{ color: 'var(--fg-muted)' }}>Dollar-figured waste estimate</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ color: 'var(--accent)', fontSize: '24px' }}>🎯</span>
                <span style={{ color: 'var(--fg-muted)' }}>Top 3 leaks ranked by impact</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
