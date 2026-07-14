'use client';

import { useState, useCallback } from 'react';

const defaultValues = {
  badge: '✦ Now in Public Beta',
  headline: 'Build Faster. Ship Smarter.',
  highlight: 'Ship Smarter.',
  subtitle: 'The developer platform that handles the boilerplate so you can focus on what matters — building products your users love.',
  cta1: 'Start Building Free →',
  cta2: 'See How It Works',
};

export default function GeneratorPage() {
  const [form, setForm] = useState(defaultValues);
  const [copyMsg, setCopyMsg] = useState(false);

  const generateHero = useCallback(() => {
    const { badge, headline, highlight, subtitle, cta1, cta2 } = form;
    const parts = headline.split(highlight);
    const beforeHL = parts[0] || '';
    const afterHL = parts.slice(1).join(highlight) || '';

    return `<!DOCTYPE html><html><head><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter',sans-serif;background:#0a0a0f;color:#e2e8f0;min-height:100vh;display:flex;align-items:center;justify-content:center}
    .hero{text-align:center;max-width:800px;padding:80px 24px;position:relative}
    .hero::before{content:'';position:absolute;width:500px;height:500px;background:#4f46e5;filter:blur(120px);opacity:0.1;top:-200px;left:-200px;border-radius:50%}
    .hero::after{content:'';position:absolute;width:300px;height:300px;background:#22d3ee;filter:blur(120px);opacity:0.08;bottom:-150px;right:-100px;border-radius:50%}
    .hero-content{position:relative;z-index:1}
    .badge{display:inline-flex;align-items:center;gap:6px;padding:6px 16px;border-radius:100px;font-size:0.8125rem;font-weight:500;border:1px solid rgba(99,102,241,0.25);background:rgba(99,102,241,0.08);color:#818cf8;margin-bottom:24px}
    h1{font-size:clamp(2.5rem,5vw,4rem);font-weight:800;line-height:1.1;letter-spacing:-0.03em;margin-bottom:20px}
    .highlight{background:linear-gradient(135deg,#818cf8,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    p{font-size:1.125rem;color:#94a3b8;line-height:1.7;max-width:560px;margin:0 auto 32px}
    .btns{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap}
    .btn{display:inline-flex;align-items:center;gap:8px;padding:14px 32px;border-radius:10px;font-size:1rem;font-weight:600;border:none;cursor:pointer;transition:all 0.2s;text-decoration:none}
    .btn-primary{background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;box-shadow:0 4px 24px rgba(99,102,241,0.35)}
    .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(99,102,241,0.5)}
    .btn-secondary{background:rgba(255,255,255,0.06);color:#e2e8f0;border:1px solid rgba(255,255,255,0.1)}
    .btn-secondary:hover{background:rgba(255,255,255,0.1)}
  </style></head><body>
  <div class="hero">
    <div class="hero-content">
      <div class="badge">${badge}</div>
      <h1>${beforeHL}<span class="highlight">${highlight}</span>${afterHL}</h1>
      ${subtitle ? `<p>${subtitle}</p>` : ''}
      <div class="btns">
        <a href="#" class="btn btn-primary">${cta1}</a>
        <a href="#" class="btn btn-secondary">${cta2}</a>
      </div>
    </div>
  </div>
  </body></html>`;
  }, [form]);

  const copyHTML = useCallback(async () => {
    const html = generateHero();
    try {
      await navigator.clipboard.writeText(html);
      setCopyMsg(true);
      setTimeout(() => setCopyMsg(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = html;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopyMsg(true);
      setTimeout(() => setCopyMsg(false), 2000);
    }
  }, [generateHero]);

  const resetFields = useCallback(() => {
    setForm(defaultValues);
  }, []);

  const previewSrcDoc = generateHero();

  return (
    <>
      <div className="generator-top-bar">
        ✦ <a href="https://nebulacomponents.shop">Nebula Components</a> — Get 7 premium SaaS landing page sections for <strong>$7</strong> →
      </div>

      <div className="generator-app">
        {/* Editor */}
        <div className="generator-editor">
          <h1>SaaS Hero Generator</h1>
          <p>Customize your hero section below. The preview updates in real-time. Free to use — grab the HTML when you&apos;re done.</p>

          <div className="generator-field">
            <label htmlFor="badge">Badge Text</label>
            <input
              type="text"
              id="badge"
              value={form.badge}
              onChange={(e) => setForm(f => ({ ...f, badge: e.target.value }))}
            />
          </div>

          <div className="generator-field">
            <label htmlFor="headline">Headline</label>
            <input
              type="text"
              id="headline"
              value={form.headline}
              onChange={(e) => setForm(f => ({ ...f, headline: e.target.value }))}
            />
          </div>

          <div className="generator-field">
            <label htmlFor="highlight">Headline Highlight (gradient text)</label>
            <input
              type="text"
              id="highlight"
              value={form.highlight}
              onChange={(e) => setForm(f => ({ ...f, highlight: e.target.value }))}
            />
          </div>

          <div className="generator-field">
            <label htmlFor="subtitle">Subtitle</label>
            <textarea
              id="subtitle"
              value={form.subtitle}
              onChange={(e) => setForm(f => ({ ...f, subtitle: e.target.value }))}
            />
          </div>

          <div className="generator-row">
            <div className="generator-field">
              <label htmlFor="cta1">Primary CTA Text</label>
              <input
                type="text"
                id="cta1"
                value={form.cta1}
                onChange={(e) => setForm(f => ({ ...f, cta1: e.target.value }))}
              />
            </div>
            <div className="generator-field">
              <label htmlFor="cta2">Secondary CTA Text</label>
              <input
                type="text"
                id="cta2"
                value={form.cta2}
                onChange={(e) => setForm(f => ({ ...f, cta2: e.target.value }))}
              />
            </div>
          </div>

          <div className="generator-actions">
            <button className="btn btn-primary" onClick={copyHTML}>📋 Copy HTML</button>
            <button className="btn btn-outline" onClick={resetFields}>↺ Reset</button>
          </div>
          {copyMsg && <div className="generator-copy-msg">✅ Copied to clipboard!</div>}
        </div>

        {/* Preview */}
        <div className="generator-preview">
          <div className="generator-preview-label">⚡ Live Preview</div>
          <iframe srcDoc={previewSrcDoc} title="Hero Preview" />
        </div>
      </div>

      <div className="generator-upsell">
        <p>⚡ Love the hero? Get <strong>7 components</strong> (Features, Pricing, Testimonials, FAQ, CTA, Footer + Hero) for <span className="price">$7</span> — <a href="https://nebulacomponents.shop">Buy Nebula Components →</a></p>
        <p className="generator-upsell-sub">
          Share this tool: <a href="https://news.ycombinator.com/item?id=48639668" target="_blank" rel="noopener noreferrer">HN</a> · <a href="https://nebulacomponents.shop">Nebula</a>
        </p>
      </div>

      <style>{`
        .generator-top-bar {
          background: linear-gradient(90deg, #6366f1, #22d3ee);
          padding: 8px;
          text-align: center;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .generator-top-bar a { color: #fff; text-decoration: none; }

        .generator-app {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: calc(100vh - 80px);
        }
        @media (max-width: 900px) {
          .generator-app { grid-template-columns: 1fr; }
        }

        .generator-editor {
          padding: 32px;
          overflow-y: auto;
          border-right: 1px solid rgba(255,255,255,0.06);
        }
        .generator-editor h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 4px; }
        .generator-editor > p { font-size: 0.8125rem; color: #94a3b8; margin-bottom: 24px; }

        .generator-field { margin-bottom: 16px; }
        .generator-field label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #94a3b8;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .generator-field input,
        .generator-field textarea {
          width: 100%;
          padding: 10px 14px;
          background: #080812;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          color: #e2e8f0;
          font-family: inherit;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .generator-field input:focus,
        .generator-field textarea:focus { border-color: #a5b4fc; }
        .generator-field textarea { resize: vertical; min-height: 60px; }

        .generator-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }
        .btn-primary { background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; }
        .btn-primary:hover { transform: translateY(-2px); }
        .btn-outline { background: transparent; color: #818cf8; border: 1px solid rgba(99,102,241,0.3); }
        .btn-outline:hover { background: rgba(99,102,241,0.08); }

        .generator-actions { display: flex; gap: 8px; margin-top: 20px; flex-wrap: wrap; }
        .generator-copy-msg { font-size: 0.75rem; color: #34d399; margin-top: 8px; }

        .generator-preview {
          background: #080812;
          position: relative;
          overflow: hidden;
          padding: 0;
        }
        .generator-preview iframe {
          width: 100%;
          height: 100%;
          border: none;
          min-height: 500px;
        }
        .generator-preview-label {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(99,102,241,0.12);
          color: #818cf8;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.6875rem;
          font-weight: 600;
          z-index: 10;
        }

        .generator-upsell {
          text-align: center;
          padding: 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
          background: #0d0d1a;
        }
        .generator-upsell > p { font-size: 0.8125rem; color: #94a3b8; }
        .generator-upsell a { color: #fbbf24; font-weight: 700; text-decoration: none; }
        .generator-upsell .price { color: #fbbf24; font-weight: 800; }
        .generator-upsell-sub { font-size: 0.75rem; color: #94a3b8; margin-top: 6px; }
        .generator-upsell-sub a { color: #818cf8; font-weight: 600; }
      `}</style>
    </>
  );
}
