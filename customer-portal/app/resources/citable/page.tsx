import type { Metadata } from 'next'

// ---------------------------------------------------------------------------
// Build-time GitHub signals — fetched once at static render, not client-side
// ---------------------------------------------------------------------------
type WorkflowStatus = 'passing' | 'failing' | 'unknown'

async function getWorkflowStatus(workflow: string): Promise<WorkflowStatus> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/mikeholownych/citable/actions/workflows/${workflow}/runs?per_page=1&branch=main`,
      { next: { revalidate: 3600 }, headers: { Accept: 'application/vnd.github+json' } }
    )
    if (!res.ok) return 'unknown'
    const data = await res.json()
    const conclusion = data?.workflow_runs?.[0]?.conclusion
    if (conclusion === 'success') return 'passing'
    if (conclusion === 'failure') return 'failing'
    return 'unknown'
  } catch { return 'unknown' }
}

async function getLastRelease(): Promise<{ tag: string; date: string }> {
  try {
    const res = await fetch(
      'https://api.github.com/repos/mikeholownych/citable/releases/latest',
      { next: { revalidate: 3600 }, headers: { Accept: 'application/vnd.github+json' } }
    )
    if (!res.ok) return { tag: 'v1.12.0', date: '2026-07-19' }
    const data = await res.json()
    const date = data.published_at ? data.published_at.slice(0, 10) : '2026-07-19'
    return { tag: data.tag_name ?? 'v1.12.0', date }
  } catch { return { tag: 'v1.12.0', date: '2026-07-19' } }
}

export const metadata: Metadata = {
  title: 'Citable v1.12.0 — Evidence Layer for Defensible SEO, AEO, and GEO Audits | Nebula Components',
  description:
    'Citable audits what a site makes retrievable, extractable, supportable, and observable — then preserves the artifacts required to defend every finding and verify every change. 123 detectors across 18 namespaces. Apache 2.0 licensed.',
  alternates: { canonical: 'https://nebulacomponents.shop/resources/citable' },
  openGraph: {
    title: 'Citable — The Evidence Layer for Defensible SEO, AEO, and GEO Audits',
    description:
      'Not another AI visibility score. Citable manages evidence, eligibility, provenance, remediation, and validation. 123 detectors. 19 schema-validated registries. Apache 2.0.',
    url: 'https://nebulacomponents.shop/resources/citable',
    siteName: 'Nebula Components',
    type: 'website',
    images: [{ url: 'https://nebulacomponents.shop/og-citable.png', width: 1024, height: 576, alt: 'Citable — Evidence Layer for Defensible SEO, AEO, and GEO Audits' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Citable — The Evidence Layer for Defensible SEO, AEO, and GEO Audits',
    description:
      'Citable audits retrieval eligibility, extraction quality, claim support, and observed citations — without collapsing them into a single score. Apache 2.0.',
    images: ['https://nebulacomponents.shop/og-citable.png'],
  },
}

const citableSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'TechArticle',
      '@id': 'https://nebulacomponents.shop/resources/citable#article',
      headline: 'Citable — The Evidence Layer for Defensible SEO, AEO, and GEO Audits',
      description:
        'Citable audits what a site makes retrievable, extractable, supportable, and observable — then preserves the artifacts required to defend every finding and verify every change. 123 detectors across 18 namespaces. Apache 2.0 licensed.',
      author: {
        '@type': 'Organization',
        '@id': 'https://nebulacomponents.shop/#organization',
        name: 'Nebula Components',
      },
      datePublished: '2026-07-08',
      dateModified: '2026-07-19',
      publisher: { '@id': 'https://nebulacomponents.shop/#organization' },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': 'https://nebulacomponents.shop/resources/citable',
      },
      about: {
        '@type': 'SoftwareApplication',
        '@id': 'https://nebulacomponents.shop/resources/citable#software',
        name: 'Citable',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Node.js >=24',
        url: 'https://nebulacomponents.shop/resources/citable',
        downloadUrl: 'https://www.npmjs.com/package/@nebulacomponents/citable',
        softwareVersion: '1.12.0',
        license: 'https://www.apache.org/licenses/LICENSE-2.0',
        author: { '@id': 'https://nebulacomponents.shop/#organization' },
      },
    },
  ],
}

export default async function CitablePage() {
  const [ciStatus, publishStatus, releaseGatesStatus, release] = await Promise.all([
    getWorkflowStatus('ci.yml'),
    getWorkflowStatus('npm-publish.yml'),
    getWorkflowStatus('release-gates.yml'),
    getLastRelease(),
  ])

  const statusColor = (s: WorkflowStatus) =>
    s === 'passing' ? '#10b981' : s === 'failing' ? '#f37979' : '#9e9e9e'
  const statusLabel = (s: WorkflowStatus) =>
    s === 'passing' ? 'passing' : s === 'failing' ? 'failing' : 'unknown'
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(citableSchema) }}
      />
      <style>{`
.citable-page { color-scheme: dark; --bg:#050505; --panel:#111111; --text:#ffffff; --muted:#9e9e9e; --line:rgba(255,255,255,0.06); --hot:#10b981; --gold:#10b981; --red:#f37979; --amber:#f59e0b; --ease-out-quart:cubic-bezier(0.25,1,0.5,1); --ease-out-quint:cubic-bezier(0.22,1,0.36,1); --ease-out-expo:cubic-bezier(0.16,1,0.3,1); }
.citable-page * { box-sizing: border-box; }
.citable-page { background: var(--bg); color:var(--text); min-height: 100vh; }
.citable-page a { color: var(--hot); text-decoration: none; }
.citable-page a:hover { text-decoration: underline; }
.citable-page .wrap { width:min(1120px,92vw); margin:0 auto; padding:56px 0 96px; }
.citable-page .hero { display:grid; gap:22px; padding:48px; border:1px solid var(--line); border-radius:24px; background:var(--panel); }
.citable-page .eyebrow { color:var(--gold); text-transform:uppercase; letter-spacing:.12em; font-size:12px; font-weight:800; }
.citable-page h1.citable-h1 { font-size:clamp(36px,5.5vw,64px); line-height:.94; margin:0; letter-spacing:-.05em; }
.citable-page h2.citable-h2 { font-size:26px; margin:48px 0 14px; letter-spacing:-.03em; }
.citable-page h3.citable-h3 { font-size:17px; margin:10px 0 6px; letter-spacing:-.02em; }
.citable-page .lede { color:var(--muted); font-size:19px; max-width:780px; line-height:1.5; }
.citable-page .tagline { font-size:22px; font-weight:800; color:var(--hot); letter-spacing:-.02em; margin:0; }
.citable-page .badges { display:flex; flex-wrap:wrap; gap:8px; margin:8px 0; }
.citable-page .badge { border:1px solid var(--line); border-radius:999px; padding:6px 14px; color:var(--muted); background:#0a0a0a; font-size:13px; }
.citable-page .badge.green { border-color:rgba(16,185,129,.35); color:var(--hot); }
.citable-page .badge.gold { border-color:rgba(16,185,129,.3); color:var(--gold); }
.citable-page .actions { display:flex; flex-wrap:wrap; gap:14px; margin-top:8px; }
.citable-page .citable-button { display:inline-flex; align-items:center; justify-content:center; border-radius:12px; padding:13px 24px; background:var(--hot); color:#050505; font-weight:900; font-size:15px; text-decoration:none; }
.citable-page .citable-button:hover { opacity:.9; text-decoration:none; }
.citable-page .citable-button.secondary { background:transparent; color:var(--text); border:1px solid var(--line); }
.citable-page .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:16px; margin:16px 0; }
.citable-page .grid-2 { display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:16px; margin:16px 0; }
.citable-page .card { background:var(--panel); border:1px solid var(--line); border-radius:16px; padding:24px; }
.citable-page .card p { color:var(--muted); line-height:1.55; font-size:15px; margin:6px 0 0; }
.citable-page .panel { background:var(--panel); border:1px solid var(--line); border-radius:16px; padding:28px 32px; margin:16px 0; }
.citable-page .panel p,.citable-page .panel li { color:var(--muted); line-height:1.6; font-size:15px; }
.citable-page .panel ul { padding-left:20px; margin:10px 0; }
.citable-page .panel li { margin-bottom:6px; }
.citable-page blockquote { border-left:3px solid var(--hot); margin:20px 0; padding:14px 22px; background:rgba(16,185,129,.04); border-radius:0 14px 14px 0; }
.citable-page blockquote p { color:var(--text); font-size:17px; line-height:1.55; margin:0; font-style:italic; }
.citable-page .table-wrap { overflow-x:auto; margin:16px 0; }
.citable-page table { width:100%; border-collapse:collapse; font-size:14px; }
.citable-page th { text-align:left; color:var(--muted); font-weight:600; padding:10px 14px; border-bottom:1px solid var(--line); font-size:13px; }
.citable-page td { padding:10px 14px; border-bottom:1px solid rgba(255,255,255,.08); color:var(--muted); vertical-align:top; font-size:14px; }
.citable-page td:first-child { color:var(--text); }
.citable-page .assess-strong { color:var(--hot); font-weight:700; }
.citable-page .assess-good { color:var(--gold); font-weight:700; }
.citable-page .assess-weak { color:var(--muted); }
.citable-page .assess-low { color:var(--red); font-weight:600; }
.citable-page code { font-family:monospace; background:rgba(16,185,129,.08); border:1px solid rgba(16,185,129,.15); border-radius:6px; padding:2px 7px; font-size:13px; color:var(--hot); }
.citable-page pre { background:#0a0a0a; border:1px solid var(--line); border-radius:14px; padding:20px 24px; overflow-x:auto; font-size:13px; line-height:1.6; color:var(--muted); }
.citable-page pre code { background:none; border:none; padding:0; font-size:13px; color:var(--muted); }
.citable-page .version-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(16,185,129,.08); border:1px solid rgba(16,185,129,.25); border-radius:999px; padding:4px 12px; font-size:12px; color:var(--hot); font-weight:700; letter-spacing:.04em; }
.citable-page .back { display:inline-flex; align-items:center; gap:6px; color:var(--muted); font-size:14px; margin-bottom:32px; }
.citable-page .back:hover { color:var(--text); }
.citable-page .not-list { display:grid; gap:8px; }
.citable-page .not-item { display:flex; align-items:flex-start; gap:10px; }
.citable-page .not-x { color:var(--red); font-weight:900; font-size:16px; flex-shrink:0; margin-top:1px; }
.citable-page .yes-check { color:var(--hot); font-weight:900; font-size:16px; flex-shrink:0; margin-top:1px; }
.citable-page .not-text,.citable-page .yes-text { color:var(--muted); font-size:15px; line-height:1.5; }
.citable-page .yes-text strong { color:var(--text); }
.citable-page .caution-panel { border-color:rgba(245,158,11,.25); background:rgba(245,158,11,.04); }
.citable-page .caution-panel p,.citable-page .caution-panel li { color:var(--muted); }
.citable-page .caution-panel strong { color:var(--amber); }
.citable-page .section-divider { border:none; border-top:1px solid var(--line); margin:48px 0; }
.citable-page .changelog { display:grid; gap:12px; }
.citable-page .release { border:1px solid var(--line); border-radius:12px; padding:16px 20px; background:var(--panel); }
.citable-page .release.latest { border-color:rgba(16,185,129,.35); background:rgba(16,185,129,.03); }
.citable-page .release-version { color:var(--text); font-weight:800; font-size:15px; }
.citable-page .release-date { color:var(--muted); font-size:13px; margin-left:10px; }
.citable-page .release ul { margin:8px 0; padding-left:18px; }
.citable-page .release li { color:var(--muted); font-size:14px; line-height:1.55; }
.citable-page .first-audit { border:1px solid rgba(16,185,129,.3); border-radius:16px; padding:32px; margin:24px 0; background:rgba(16,185,129,.03); }
.citable-page .step-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px; margin:16px 0; }
.citable-page .step { background:var(--panel); border:1px solid var(--line); border-radius:16px; padding:20px; }
.citable-page .step-num { color:var(--hot); font-weight:900; font-size:22px; margin-bottom:8px; }
.citable-page .step h4 { color:var(--text); font-size:15px; margin:0 0 6px; }
.citable-page .step p { color:var(--muted); font-size:14px; line-height:1.5; margin:0; }
.citable-page .commissioned-note { font-size:12px; color:var(--muted); border:1px solid var(--line); border-radius:8px; padding:8px 14px; margin-top:12px; display:inline-block; }
@media(max-width:640px){ .citable-page .hero{padding:28px;} .citable-page .citable-h1{font-size:36px;} .citable-page .panel{padding:20px;} }

/* ============================================================
   MOTION — KEYFRAMES
   ============================================================ */
@keyframes fadeUp {
  from { opacity:0; transform:translateY(18px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes fadeIn {
  from { opacity:0; }
  to   { opacity:1; }
}
@keyframes slideRight {
  from { opacity:0; transform:translateX(-10px); }
  to   { opacity:1; transform:translateX(0); }
}
@keyframes hotPulse {
  0%,100% { box-shadow:0 0 0 0 rgba(16,185,129,0); }
  40%      { box-shadow:0 0 0 6px rgba(16,185,129,.18); }
}
@keyframes badgeReveal {
  from { opacity:0; transform:scale(0.88); }
  to   { opacity:1; transform:scale(1); }
}

/* ============================================================
   HERO ORCHESTRATION — each child animates in sequence
   ============================================================ */
/* Initial hidden state — rely on animation-fill-mode:both */
.citable-page .hero-animate-eyebrow,
.citable-page .hero-animate-title,
.citable-page .hero-animate-tagline,
.citable-page .hero-animate-lede,
.citable-page .hero-animate-cta {
  opacity: 0;
}

.citable-page .hero-animate-eyebrow {
  animation: slideRight 420ms var(--ease-out-quint) 80ms both;
}
.citable-page .hero-animate-title {
  animation: fadeUp 480ms var(--ease-out-expo) 160ms both;
}
.citable-page .hero-animate-tagline {
  animation: fadeUp 400ms var(--ease-out-quart) 280ms both;
}
.citable-page .hero-animate-lede {
  animation: fadeUp 380ms var(--ease-out-quart) 380ms both;
}
.citable-page .hero-animate-badges {
  animation: fadeIn 360ms var(--ease-out-quart) 480ms both;
}
.citable-page .hero-animate-cta {
  animation: fadeUp 340ms var(--ease-out-quart) 560ms both;
}

/* ============================================================
   STEP CARD STAGGER — real sequence, legitimate stagger
   ============================================================ */
.citable-page .step { opacity:0; animation: fadeUp 400ms var(--ease-out-quint) both; }
.citable-page .step:nth-child(1) { animation-delay: 640ms; }
.citable-page .step:nth-child(2) { animation-delay: 710ms; }
.citable-page .step:nth-child(3) { animation-delay: 780ms; }
.citable-page .step:nth-child(4) { animation-delay: 850ms; }

/* ============================================================
   LATEST RELEASE PULSE — one-time on load, signals freshness
   ============================================================ */
.citable-page .release.latest {
  animation: hotPulse 1400ms var(--ease-out-quart) 900ms both;
}

/* ============================================================
   BADGE STAGGER in hero — each badge pops in sequence
   ============================================================ */
.citable-page .badges .badge,
.citable-page .badges a { opacity:0; animation: badgeReveal 280ms var(--ease-out-quint) both; }
.citable-page .badges > *:nth-child(1)  { animation-delay: 520ms; }
.citable-page .badges > *:nth-child(2)  { animation-delay: 555ms; }
.citable-page .badges > *:nth-child(3)  { animation-delay: 590ms; }
.citable-page .badges > *:nth-child(4)  { animation-delay: 625ms; }
.citable-page .badges > *:nth-child(5)  { animation-delay: 660ms; }
.citable-page .badges > *:nth-child(6)  { animation-delay: 695ms; }
.citable-page .badges > *:nth-child(7)  { animation-delay: 730ms; }
.citable-page .badges > *:nth-child(8)  { animation-delay: 765ms; }
.citable-page .badges > *:nth-child(9)  { animation-delay: 800ms; }
.citable-page .badges > *:nth-child(10) { animation-delay: 835ms; }
.citable-page .badges > *:nth-child(11) { animation-delay: 870ms; }

/* ============================================================
   MICRO-INTERACTIONS
   ============================================================ */

/* Primary button */
.citable-page .citable-button {
  transition: opacity 140ms ease, transform 140ms var(--ease-out-quart), box-shadow 200ms var(--ease-out-quart);
}
.citable-page .citable-button:hover {
  opacity: .92;
  transform: translateY(-1px);
  box-shadow: 0 0 16px rgba(16,185,129,.25);
  text-decoration: none;
}
.citable-page .citable-button:active {
  transform: translateY(0) scale(0.97);
  transition-duration: 80ms;
}

/* Secondary button */
.citable-page .citable-button.secondary:hover {
  background: rgba(255,255,255,.04);
  box-shadow: none;
}

/* Cards — border glow lift */
.citable-page .card {
  transition: border-color 220ms var(--ease-out-quart), box-shadow 220ms var(--ease-out-quart), transform 220ms var(--ease-out-quart);
}
.citable-page .card:hover {
  border-color: rgba(16,185,129,.25);
  box-shadow: 0 0 24px rgba(16,185,129,.12), 0 0 0 1px rgba(16,185,129,.08);
  transform: translateY(-2px);
}

/* Back link — subtle slide */
.citable-page .back {
  transition: color 160ms ease, transform 160ms var(--ease-out-quart);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.citable-page .back:hover {
  color: var(--text);
  transform: translateX(-3px);
  text-decoration: none;
}

/* Version pill — breath */
.citable-page .version-pill {
  transition: box-shadow 200ms var(--ease-out-quart);
}
.citable-page .version-pill:hover {
  box-shadow: 0 0 0 4px rgba(16,185,129,.12);
}

/* Badges in hero — glow on hover */
.citable-page .badges .badge,
.citable-page .badges a .badge {
  transition: border-color 180ms ease, color 180ms ease, box-shadow 180ms var(--ease-out-quart);
}
.citable-page .badges a:hover .badge {
  box-shadow: 0 0 8px rgba(16,185,129,.2);
  text-decoration: none;
}

/* Release items — border glow on hover */
.citable-page .release {
  transition: border-color 200ms ease;
}
.citable-page .release:hover {
  border-color: rgba(16,185,129,.4);
}
.citable-page .release.latest:hover {
  border-color: var(--hot);
}

/* Table rows — subtle highlight */
.citable-page tbody tr {
  transition: background 140ms ease;
}
.citable-page tbody tr:hover {
  background: rgba(255,255,255,.04);
}

/* ============================================================
   REDUCED MOTION — full override, single rule
   ============================================================ */
@media (prefers-reduced-motion: reduce) {
  .citable-page *, .citable-page *::before, .citable-page *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .citable-page .hero-animate-eyebrow,
  .citable-page .hero-animate-title,
  .citable-page .hero-animate-tagline,
  .citable-page .hero-animate-lede,
  .citable-page .hero-animate-cta,
  .citable-page .step,
  .citable-page .badges .badge,
  .citable-page .badges a { opacity:1; }
}
      `}</style>
      <div className="citable-page">
        <main id="main-content" className="wrap">

          <a className="back" href="/resources">← Resources</a>

          {/* HERO */}
          <section className="hero">
            <div>
              <p className="eyebrow hero-animate-eyebrow">Nebula Components Open Source</p>
              <div className="hero-animate-title" style={{display:'flex',alignItems:'center',gap:'14px',flexWrap:'wrap',marginBottom:'14px'}}>
                <h1 className="citable-h1">Citable</h1>
                <span className="version-pill">v1.12.0</span>
              </div>
              <p className="tagline hero-animate-tagline">The evidence layer for defensible SEO, AEO, and GEO audits.</p>
              <p className="lede hero-animate-lede" style={{marginTop:'14px'}}>Audits what a site makes retrievable, extractable, supportable, and observable — then preserves the artifacts required to defend every finding and verify every change.</p>
              <div className="badges" style={{marginTop:'16px'}}>
                <span className="badge green">123 detectors</span>
                <span className="badge green">18 namespaces</span>
                <span className="badge green">19 registries</span>
                <span className="badge green">SEO · AEO · GEO</span>
                <span className="badge green">Agent-readiness</span>
                <span className="badge">Apache 2.0</span>
                <span className="badge">Node.js ≥24</span>
                {/* Build-time workflow status badges */}
                <a
                  href="https://github.com/mikeholownych/citable/actions/workflows/ci.yml"
                  target="_blank" rel="noopener noreferrer"
                  style={{textDecoration:'none'}}
                >
                  <span className="badge" style={{borderColor:`${statusColor(ciStatus)}55`,color:statusColor(ciStatus)}}>
                    CI {statusLabel(ciStatus)}
                  </span>
                </a>
                <a
                  href="https://github.com/mikeholownych/citable/actions/workflows/npm-publish.yml"
                  target="_blank" rel="noopener noreferrer"
                  style={{textDecoration:'none'}}
                >
                  <span className="badge" style={{borderColor:`${statusColor(publishStatus)}55`,color:statusColor(publishStatus)}}>
                    publish {statusLabel(publishStatus)}
                  </span>
                </a>
                <a
                  href="https://github.com/mikeholownych/citable/actions/workflows/release-gates.yml"
                  target="_blank" rel="noopener noreferrer"
                  style={{textDecoration:'none'}}
                >
                  <span className="badge" style={{borderColor:`${statusColor(releaseGatesStatus)}55`,color:statusColor(releaseGatesStatus)}}>
                    release-gates {statusLabel(releaseGatesStatus)}
                  </span>
                </a>
                <a
                  href="https://github.com/mikeholownych/citable/releases"
                  target="_blank" rel="noopener noreferrer"
                  style={{textDecoration:'none'}}
                >
                  <span className="badge" style={{borderColor:'rgba(16,185,129,.3)',color:'#10b981'}}>
                    released {release.date}
                  </span>
                </a>
              </div>
            </div>
            <div className="actions hero-animate-cta">
              <a className="citable-button" href="https://github.com/mikeholownych/citable" target="_blank" rel="noopener noreferrer">View on GitHub</a>
              <a className="citable-button secondary" href="https://www.npmjs.com/package/@nebulacomponents/citable" target="_blank" rel="noopener noreferrer">npm package</a>
              <a className="citable-button secondary" href="#quickstart">Quick start</a>
            </div>
          </section>

          {/* FIRST DEFENSIBLE AUDIT */}
          <hr className="section-divider" />
          <h2 className="citable-h2" id="quickstart">Your first defensible audit</h2>
          <p style={{color:'var(--muted)',fontSize:'15px',maxWidth:'780px',lineHeight:'1.6',marginBottom:'20px'}}>No account, no signup. One command produces an evidence package you can inspect, share, or diff.</p>

          <div className="first-audit">
            <div className="step-grid">
              <div className="step">
                <div className="step-num">1</div>
                <h4>Install</h4>
                <p>Run the installer to add Citable to your coding agent harness (Claude Code, Codex, Cursor, and more).</p>
              </div>
              <div className="step">
                <div className="step-num">2</div>
                <h4>Init</h4>
                <p>Initialise 19 schema-validated registries and a project profile in your repo root.</p>
              </div>
              <div className="step">
                <div className="step-num">3</div>
                <h4>Audit</h4>
                <p>Run against a live URL. Findings are backed by captured artifacts — not assertions.</p>
              </div>
              <div className="step">
                <div className="step-num">4</div>
                <h4>Act</h4>
                <p>Generate an ordered action plan from findings. Apply reviewed, hash-locked remediations with dry-run default.</p>
              </div>
            </div>

            <pre style={{marginTop:'20px'}}><code>{`# Step 1 — install into your agent harness
npx @nebulacomponents/citable@latest install

# Step 2 — initialise registries (non-destructive)
npx @nebulacomponents/citable@latest init

# Step 3 — run a full audit against your live site
npx @nebulacomponents/citable@latest audit \\
  --target https://your-domain.com \\
  --base-url https://your-domain.com

# Step 3b — audit with mobile + desktop rendering
npx @nebulacomponents/citable@latest observe render \
  --target https://your-domain.com \
  --interactions

# Step 3c — run Lighthouse performance profiling
npx @nebulacomponents/citable@latest observe performance \
  --target https://your-domain.com \
  --lighthouse

# Step 4 — turn findings into an ordered action plan
npx @nebulacomponents/citable@latest action-plan

# Apply a reviewed remediation spec (dry-run by default)
npx @nebulacomponents/citable@latest apply --input .citable/remediations/remediation-spec.json`}</code></pre>

            <p style={{marginTop:'14px',color:'var(--muted)',fontSize:'14px'}}>Every run writes an evidence package to <code>.citable/runs/&lt;run-id&gt;/</code> — manifest, findings.json, report.md, captured headers, robots.txt, sitemaps, schema, link graph, checksums. <strong style={{color:'var(--text)'}}>A report without its evidence package is not a deliverable.</strong></p>
          </div>

          {/* WHAT IT IS / IS NOT */}
          <hr className="section-divider" />
          <h2 className="citable-h2">What Citable is — and is not</h2>
          <div className="grid-2">
            <div className="panel">
              <h3 className="citable-h3" style={{color:'var(--hot)',marginTop:'0'}}>What it manages</h3>
              <div className="not-list">
                <div className="not-item"><span className="yes-check">✓</span><span className="yes-text"><strong>Evidence</strong> — every finding is backed by a captured artifact</span></div>
                <div className="not-item"><span className="yes-check">✓</span><span className="yes-text"><strong>Eligibility</strong> — retrieval, extraction, support, observability as separate states</span></div>
                <div className="not-item"><span className="yes-check">✓</span><span className="yes-text"><strong>Provenance</strong> — checksums, source runs, immutable run IDs</span></div>
                <div className="not-item"><span className="yes-check">✓</span><span className="yes-text"><strong>Remediation</strong> — bound to source state, hash-locked, dry-run by default</span></div>
                <div className="not-item"><span className="yes-check">✓</span><span className="yes-text"><strong>Validation</strong> — post-change verification against the same evidence baseline</span></div>
                <div className="not-item"><span className="yes-check">✓</span><span className="yes-text"><strong>Governance</strong> — reviewer registries, review policies, separation-of-duty, exception tracking</span></div>
              </div>
            </div>
            <div className="panel">
              <h3 className="citable-h3" style={{color:'var(--red)',marginTop:'0'}}>What it explicitly rejects</h3>
              <div className="not-list">
                <div className="not-item"><span className="not-x">✗</span><span className="not-text">Content generator — never writes around a gap</span></div>
                <div className="not-item"><span className="not-x">✗</span><span className="not-text">Lighthouse wrapper — detectors are independent, not delegated</span></div>
                <div className="not-item"><span className="not-x">✗</span><span className="not-text">Opaque AI visibility score — collapses unlike states into one number</span></div>
                <div className="not-item"><span className="not-x">✗</span><span className="not-text">Guaranteed outcomes — speaks in eligibility and probability, never promises citation, ranking, or traffic</span></div>
                <div className="not-item"><span className="not-x">✗</span><span className="not-text">Manufactured corroboration — refuses fake reviews, fabricated statistics, hidden LLM instructions</span></div>
              </div>
            </div>
          </div>

          <div className="panel" style={{marginTop:'0'}}>
            <p>A site audit cannot honestly prove that ChatGPT, Gemini, Google AI Overviews, or Perplexity will cite a page in the future. It can establish five distinct states:</p>
            <ul>
              <li>Whether the page is technically retrievable</li>
              <li>Whether content can be extracted reliably</li>
              <li>Whether claims are supportable by evidence</li>
              <li>Whether machine-readable identity and structure are coherent</li>
              <li>Whether observed systems have cited or represented it under controlled conditions</li>
            </ul>
            <p>Citable keeps these states separate rather than collapsing them into a single score. That separation is the project's most important design decision.</p>
          </div>

          {/* WHAT IT DOES NOT PROVE */}
          <h2 className="citable-h2">What Citable does not prove</h2>
          <div className="panel caution-panel">
            <p>The following capability gaps are documented honestly. Citable's architecture aligns with the reality of what is provable — it does not overstate.</p>
            <ul>
              <li><strong>Comprehensive first-party answer-engine observation.</strong> No equivalent to Profound's direct browser-based consumer AI collection or Ahrefs Brand Radar's prompt dataset scale.</li>
              <li><strong>End-to-end crawler identity verification.</strong> Cannot fully verify source IP, provider-published CIDR membership, reverse/forward DNS, CDN/WAF treatment, or geographic behaviour.</li>
              <li><strong>Rendered extraction parity.</strong> v1.12 adds independent desktop, mobile, and JS-disabled Chromium profiles with bounded interaction discovery. It does not replicate exactly what a commercial answer engine extracts — no mobile-viewport cross-browser comparison and no interaction-gated content for arbitrary SPAs beyond declared disclosure patterns.</li>
              <li><strong>Causal uplift.</strong> Citable can audit conditions and record observed citations. It cannot establish that a remediation caused a citation improvement without controlled experiment design.</li>
              <li><strong>Field performance data.</strong> v1.12 adds local Lighthouse execution with pinned runtime metadata and lab/field separation. Field data (CrUX) supports optional live collection via the CrUX API when <code>CRUX_API_KEY</code> is configured; otherwise import via connector or CSV.</li>
              <li><strong>Media semantic understanding.</strong> PDF extraction covers text and metadata within defined bounds; it does not validate reading order, tables, or scanned content. Transcript evidence does not prove speaker identity or timing accuracy. Image evidence covers alt text and captions — not visual meaning.</li>
            </ul>
            <p style={{marginTop:'14px'}}><em>A report that cannot be challenged is not a report — it is a claim. Citable is designed to be challenged.</em></p>
          </div>

          {/* CAPABILITY SURFACE */}
          <hr className="section-divider" />
          <h2 className="citable-h2">Full capability surface</h2>
          <p style={{color:'var(--muted)',fontSize:'15px',maxWidth:'780px',lineHeight:'1.6',marginBottom:'16px'}}>Commands verified against <code>@nebulacomponents/citable@1.12.0</code>.</p>

          <div className="grid">
            <div className="card"><h3 className="citable-h3"><code>audit</code></h3><p>Full site audit across selected scopes. Writes immutable evidence package to <code>.citable/runs/</code>. Scopes: technical, seo, aeo, geo, architecture, entity, claims, evidence, schema, lifecycle, corroboration, agent.</p></div>
            <div className="card"><h3 className="citable-h3"><code>observe render</code></h3><p>Independent desktop, mobile, and JS-disabled Chromium render profiles with raw/rendered parity artifacts. Pass <code>--interactions</code> for bounded discovery of disclosure controls, unselected tabs, <code>aria-expanded=false</code> elements, and load-more triggers. Pass <code>--resume-run</code> to reuse successful immutable profiles.</p></div>
            <div className="card"><h3 className="citable-h3"><code>observe performance</code></h3><p>Local, repeated Lighthouse execution with pinned runtime metadata, per-run artifacts, lab/field separation, and median metric summaries. Pass <code>--lighthouse</code>.</p></div>
            <div className="card"><h3 className="citable-h3"><code>action-plan</code></h3><p>Converts audit findings into ordered remediation artifacts with owners, blockers, unsafe shortcut warnings, semantic review gates, and detector-specific verification commands.</p></div>
            <div className="card"><h3 className="citable-h3"><code>apply</code></h3><p>Apply a reviewed, hash-locked remediation spec. Dry-run by default. Operations bound to source run; stale or ambiguous operations fail closed.</p></div>
            <div className="card"><h3 className="citable-h3"><code>monitor</code></h3><p>Compare observation runs and emit regression alerts for observation-state, index, canonical, and citation regressions across immutable runs.</p></div>
            <div className="card"><h3 className="citable-h3"><code>governance validate/evaluate</code></h3><p>Validate reviewer, policy, and exception controls. Produce immutable enforcement dispositions without changing findings. Accepted exceptions preserve <code>technical_state: failed</code>.</p></div>
            <div className="card"><h3 className="citable-h3"><code>reviews queue/prioritize/plan/sample/evaluate</code></h3><p>Materiality-ranked semantic review queues with explicit missing-input states, reviewer assignment, hash-bound decisions, reproducible sampling plans, and independent adjudication.</p></div>
            <div className="card"><h3 className="citable-h3"><code>connect status/configure/sync</code></h3><p>Optional read-only connectors for Google Search Console and GA4. Collect declared metrics into immutable observations without storing access tokens. Non-secret connection state only.</p></div>
            <div className="card"><h3 className="citable-h3"><code>objectives init/validate/evaluate</code></h3><p>Metric-referenced objective contracts with baseline/evaluation window comparison and explicit inconclusive outcomes.</p></div>
            <div className="card"><h3 className="citable-h3"><code>schedules run</code></h3><p>Execute an active version-pinned audit schedule by ID. Schedules are defined in the schedules registry — not created ad-hoc via CLI flags.</p></div>
            <div className="card"><h3 className="citable-h3"><code>project github</code></h3><p>Render non-authoritative GitHub annotations from a completed run. Hash-bound to immutable artifacts. GitHub never becomes a parallel state authority.</p></div>
          </div>

          {/* THREE DISCIPLINES */}
          <hr className="section-divider" />
          <h2 className="citable-h2">Three disciplines — never collapsed into one score</h2>
          <div className="grid">
            <div className="card">
              <h3 className="citable-h3">SEO</h3>
              <p>Sustained visibility on commercially relevant queries; qualified traffic; conversion. Measured per URL, query, impression, click.</p>
            </div>
            <div className="card">
              <h3 className="citable-h3">AEO</h3>
              <p>Direct-answer eligibility, passage extraction, supporting citation, accurate attribution. Measured per question, answer passage, citation share.</p>
            </div>
            <div className="card">
              <h3 className="citable-h3">GEO</h3>
              <p>Correct entity understanding, accurate synthesis, comparison inclusion, defensible recommendation. Measured per entity, claim, prompt, recommendation.</p>
            </div>
          </div>
          <p style={{color:'var(--muted)',fontSize:'14px',marginTop:'8px'}}>Reports posture per dimension (e.g. <code>retrieval_eligibility: strong</code>, <code>answer_extractability: weak</code>) — never one opaque 0–100 score.</p>

          {/* NAMESPACES */}
          <hr className="section-divider" />
          <h2 className="citable-h2">Namespaces — 123 detectors across 18 areas</h2>
          <p style={{color:'var(--muted)',fontSize:'13px',marginBottom:'12px'}}>Counts derived from published package <code>@nebulacomponents/citable@1.12.0</code>. Not all detectors are deterministic — each declares its determinism posture explicitly.</p>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Namespace</th><th>Count</th><th>Coverage</th></tr></thead>
              <tbody>
                <tr><td>TECH</td><td>18</td><td>Technical SEO — headers, redirects, status codes</td></tr>
                <tr><td>PAGE</td><td>9</td><td>On-page content, meta, structure</td></tr>
                <tr><td>CLAIM</td><td>9</td><td>Claim substantiation and verification lifecycle</td></tr>
                <tr><td>ANS</td><td>10</td><td>Answer engine eligibility, passage extraction, prompt-to-page coverage</td></tr>
                <tr><td>SCHEMA</td><td>8</td><td>Structured data validation against schema.org and registries</td></tr>
                <tr><td>ENTITY</td><td>7</td><td>Entity identity and consistency</td></tr>
                <tr><td>EVD</td><td>7</td><td>Evidence registry quality and freshness</td></tr>
                <tr><td>CRAWL</td><td>6</td><td>Robots.txt, sitemaps, crawler directives</td></tr>
                <tr><td>ARCH</td><td>6</td><td>Site architecture and crawl depth</td></tr>
                <tr><td>GEO</td><td>6</td><td>Generative engine optimization signals and entity mapping</td></tr>
                <tr><td>LIFE</td><td>6</td><td>Content freshness and lifecycle governance</td></tr>
                <tr><td>AGENT</td><td>10</td><td>Agent-readiness — llms.txt, x402, MCP, A2A, Web Bot Auth, Markdown negotiation</td></tr>
                <tr><td>LINK</td><td>4</td><td>Internal/external link quality</td></tr>
                <tr><td>MEAS</td><td>3</td><td>Measurement and tracking infrastructure</td></tr>
                <tr><td>HREFLANG</td><td>3</td><td>International SEO validation</td></tr>
                <tr><td>CWV</td><td>3</td><td>Core Web Vitals infrastructure readiness</td></tr>
                <tr><td>EXT</td><td>2</td><td>External corroboration checks</td></tr>
                <tr><td>RECO</td><td>6</td><td>Strategy recommendations</td></tr>
              </tbody>
            </table>
          </div>

          {/* REGISTRIES */}
          <h2 className="citable-h2">Registries — 19 schema-validated YAML files</h2>
          <div className="panel">
            <p><code>.citable/</code> holds 19 registries — schema-validated on save, with declared cross-registry relationships checked during registry validation. The full list, derived from the published package:</p>
            <div className="grid-2" style={{marginTop:'14px'}}>
              <ul>
                <li><strong>queries</strong> — target search queries and intent mapping</li>
                <li><strong>prompts</strong> — AEO/GEO prompt corpus for monitored runs</li>
                <li><strong>entities</strong> — canonical entity definitions with stable <code>@id</code>s</li>
                <li><strong>claims</strong> — factual assertions with lifecycle status (unverified → supported → verified)</li>
                <li><strong>evidence</strong> — evidence backing claims, with freshness expiry</li>
                <li><strong>pages</strong> — page inventory and metadata</li>
                <li><strong>crawlers</strong> — per-crawler access policy decisions</li>
                <li><strong>competitors</strong> — competitive landscape (never invented — marked incomplete if unknown)</li>
                <li><strong>experiments</strong> — active test log with controlled conditions</li>
                <li><strong>metrics</strong> — declared metric observations</li>
              </ul>
              <ul>
                <li><strong>objectives</strong> — measurable objective contracts</li>
                <li><strong>interventions</strong> — tracked remediation interventions</li>
                <li><strong>connections</strong> — non-secret connector state (GSC, GA4)</li>
                <li><strong>reviewers</strong> — reviewer identities and roles</li>
                <li><strong>review-policies</strong> — governance policy definitions</li>
                <li><strong>exceptions</strong> — accepted exceptions with residual risk and expiry</li>
                <li><strong>review-items</strong> — semantic review work queue</li>
                <li><strong>sampling-plans</strong> — reproducible census and seeded random plans</li>
                <li><strong>schedules</strong> — version-pinned audit schedules</li>
              </ul>
            </div>
            <p style={{marginTop:'14px'}}>Automation only <em>downgrades</em> claim status. A claim cannot reach <code>verified</code> without existing evidence plus human semantic review. Accepted exceptions do not alter technical finding state — <code>technical_state: failed</code> is preserved. Fail-closed.</p>
          </div>

          {/* COMPETITIVE POSITION */}
          <hr className="section-divider" />
          <h2 className="citable-h2">Competitive position</h2>
          <p style={{color:'var(--muted)',fontSize:'15px',maxWidth:'780px',lineHeight:'1.6',marginBottom:'16px'}}>Citable's defensible differentiation: other platforms measure what AI systems appear to say. Citable records whether the underlying property is technically eligible, extractable, supportable, governable, and verifiably changed.</p>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Capability</th>
                  <th>Citable</th>
                  <th>Profound / Scrunch</th>
                  <th>Ahrefs / Semrush</th>
                  <th>Technical crawlers</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Technical site audit</td><td className="assess-strong">Strong</td><td>Moderate</td><td className="assess-strong">Strong</td><td className="assess-strong">Strong</td></tr>
                <tr><td>Claim / evidence registry</td><td className="assess-strong">Strong</td><td>Limited / opaque</td><td>Weak</td><td>Weak</td></tr>
                <tr><td>Immutable evidence package</td><td className="assess-strong">Strong</td><td>Unknown / proprietary</td><td>Limited</td><td>Variable</td></tr>
                <tr><td>Browser rendering (desktop + mobile)</td><td className="assess-strong">Strong (v1.12)</td><td>Proprietary</td><td>Moderate</td><td>Variable</td></tr>
                <tr><td>Consumer AI monitoring</td><td>Partial</td><td className="assess-strong">Strong</td><td className="assess-strong">Strong</td><td>Weak</td></tr>
                <tr><td>Prompt database</td><td>Weak</td><td className="assess-strong">Strong</td><td className="assess-strong">Strong</td><td>None</td></tr>
                <tr><td>Fail-closed remediation</td><td className="assess-strong">Strong</td><td>Limited visibility</td><td>Weak</td><td>Variable</td></tr>
                <tr><td>Reviewer governance / audit trail</td><td className="assess-strong">Strong</td><td>Weak</td><td>Weak</td><td>None</td></tr>
                <tr><td>CI/CD suitability</td><td className="assess-good">Strong</td><td>Weak</td><td>Weak</td><td>Moderate</td></tr>
                <tr><td>Executive dashboard</td><td>Weak</td><td className="assess-strong">Strong</td><td className="assess-strong">Strong</td><td>Moderate</td></tr>
                <tr><td>Local / open deployment</td><td className="assess-strong">Strong</td><td>Weak</td><td>Weak</td><td>Variable</td></tr>
                <tr><td>Content generation</td><td style={{color:'var(--muted)',fontStyle:'italic'}}>Intentionally absent</td><td className="assess-strong">Strong</td><td>Increasing</td><td>None</td></tr>
              </tbody>
            </table>
          </div>

          <div className="panel" style={{marginTop:'16px'}}>
            <p><strong style={{color:'var(--text)'}}>The correct conclusion:</strong> Citable should not copy the dashboard vendors. Its advantage disappears if it becomes another score-and-content product. The strongest path is as a verification and implementation layer used alongside or beneath commercial platforms — not as a replacement for them.</p>
          </div>

          {/* ARCHITECTURE */}
          <hr className="section-divider" />
          <h2 className="citable-h2">Architecture</h2>
          <div className="grid">
            <div className="card">
              <h3 className="citable-h3">Persistent registries</h3>
              <p>19 YAML registries under <code>.citable/</code> — schema-validated on save, with declared cross-registry relationships checked during registry validation. History preserved on every save.</p>
            </div>
            <div className="card">
              <h3 className="citable-h3">Immutable evidence packages</h3>
              <p>Every run captures response bytes, headers, schema, link graph, and SHA-256 checksums. Findings are inspectable and repeatable — not just a score at a point in time.</p>
            </div>
            <div className="card">
              <h3 className="citable-h3">Fail-closed by design</h3>
              <p>Unknown properties rejected. Invalid reference dates fail before evaluation. Claims cannot reach <code>verified</code> without evidence. Missing inputs return a <code>blocked</code> state with exact required inputs — never a guess.</p>
            </div>
            <div className="card">
              <h3 className="citable-h3">Governed remediation</h3>
              <p>Dry-run by default. Each operation is bound to the source run that generated it, hash-locked to the content state, and refused if the source has changed since evaluation.</p>
            </div>
            <div className="card">
              <h3 className="citable-h3">Determinism declared</h3>
              <p>Every detector declares whether its conclusion is deterministic or heuristic. Probabilistic detectors carry explicit false-positive and false-negative conditions.</p>
            </div>
            <div className="card">
              <h3 className="citable-h3">Human-authoritative review</h3>
              <p>Semantic rubrics define where human review is mandatory. Automated inference never silently becomes a confirmed support verdict. Accepted exceptions preserve <code>technical_state: failed</code>.</p>
            </div>
          </div>

          {/* CHANGELOG */}
          <hr className="section-divider" />
          <h2 className="citable-h2">Changelog</h2>
          <p style={{color:'var(--muted)',fontSize:'13px',marginBottom:'16px'}}>Source: <code>CHANGELOG.md</code> from published npm package. <a href="https://github.com/mikeholownych/citable/releases" target="_blank" rel="noopener noreferrer">All releases on GitHub →</a></p>
          <div className="changelog">
            <div className="release latest">
              <div><span className="release-version">v1.12.0</span><span className="release-date">2026-07-19 · latest</span></div>
              <ul>
                <li>Independent desktop, mobile, and JavaScript-disabled Chromium render profiles with raw/rendered parity artifacts and bounded interaction discovery (<code>--interactions</code>)</li>
                <li>Partial-failure evidence and <code>--resume-run</code> recovery that reuses only successful profiles from an immutable source run</li>
                <li>Optional repeated local Lighthouse execution with pinned runtime metadata, per-run artifacts, lab/field separation, and median metric summaries (<code>--lighthouse</code>)</li>
              </ul>
            </div>
            <div className="release">
              <div><span className="release-version">v1.11.0</span><span className="release-date">2026-07-19</span></div>
              <ul>
                <li>Bounded media evidence: local PDF text/metadata with page anchors, transcript cue extraction with provenance, image alt/caption context</li>
                <li>Optional OCR (<code>--ocr</code>, explicit opt-in) and media-to-claim linkage validation</li>
                <li>Explicit evidence contracts: extraction ≠ claim support, reading order, transcription accuracy, or semantic equivalence</li>
              </ul>
            </div>
            <div className="release">
              <div><span className="release-version">v1.10.0</span><span className="release-date">2026-07-19</span></div>
              <ul>
                <li>Version-pinned audit schedules that invoke the canonical audit path</li>
                <li>Hash-bound, non-authoritative GitHub annotation projections from immutable runs (<code>project github</code>)</li>
                <li>Differential comparability dimensions: resource, evidence, detector, configuration, observation method, tool, external-system changes</li>
              </ul>
            </div>
            <div className="release">
              <div><span className="release-version">v1.9.0</span><span className="release-date">2026-07-19</span></div>
              <ul>
                <li>Materiality-ranked semantic review queues with explicit missing-input states, reviewer assignment, hash-bound decisions, independent adjudication</li>
                <li>Reproducible census and seeded random sampling plans with population hashes and extrapolation limits</li>
                <li><code>reviews queue|prioritize|plan|sample|evaluate</code> workflow commands</li>
              </ul>
            </div>
            <div className="release">
              <div><span className="release-version">v1.8.0</span><span className="release-date">2026-07-19</span></div>
              <ul>
                <li>Schema-validated reviewer, review-policy, and governed-exception registries with role authorization, conflict declaration, separation-of-duty, expiry, and audit history</li>
                <li><code>governance validate</code> and <code>governance evaluate</code> commands</li>
                <li>Accepted exceptions no longer alter technical finding state — <code>technical_state: failed</code> is preserved alongside the enforcement disposition</li>
                <li>Node.js 24 minimum runtime floor</li>
              </ul>
            </div>
            <div className="release">
              <div><span className="release-version">v1.7.0</span><span className="release-date">2026-07-19</span></div>
              <ul>
                <li>Multidimensional evidence authority metadata separating source authority, collection authority, authenticity, and representativeness</li>
                <li>Staged crawler-identity evidence contract requiring checksummed range provenance, DNS, edge, and origin evidence before <code>fully_verified</code></li>
                <li>JSON/CSV production-log normalization; Bing Search Performance and AI Performance owner-export observations with explicit interpretation limits</li>
              </ul>
            </div>
            <div className="release">
              <div><span className="release-version">v1.6.0</span><span className="release-date">2026-07-19</span></div>
              <ul>
                <li>Optional read-only connector SDK — Google Search Console and GA4 adapters collecting declared metrics into immutable observations without storing access tokens</li>
              </ul>
            </div>
            <div className="release">
              <div><span className="release-version">v1.5.0</span><span className="release-date">2026-07-18</span></div>
              <ul>
                <li>Installer aliases compatible with common <code>skills</code> CLI interface</li>
                <li>Optional provider-neutral metric, objective, intervention, and connection-state contracts</li>
                <li>Review-gated release preparation and shipping workflows</li>
              </ul>
            </div>
            <div className="release">
              <div><span className="release-version">v1.4.0</span><span className="release-date">2026-07-18</span></div>
              <ul>
                <li>Governed observation envelopes for rendered DOM, search-index exports, controlled citation experiments, production crawler logs, answer passages, and performance data</li>
                <li><code>citable apply</code> and <code>citable monitor</code> commands</li>
              </ul>
            </div>
            <div className="release">
              <div><span className="release-version">v1.3.0</span><span className="release-date">2026-07-18</span></div>
              <ul>
                <li><code>action-plan</code> command converts findings into ordered remediation artifacts with owners, blockers, semantic review gates</li>
                <li>ANS-009/010 and GEO-005/006: prompt-to-page coverage, primary entity mapping, complete prompt evaluation briefs</li>
                <li>Registry entry schemas now reject unknown properties — fail closed on misspelled governance fields</li>
              </ul>
            </div>
            <div className="release">
              <div><span className="release-version">v1.1.0 – v1.2.0</span><span className="release-date">2026-07-18</span></div>
              <ul>
                <li>AGENT namespace — 10 agent-readiness detectors: llms.txt, MCP, A2A, Markdown negotiation, Web Bot Auth, Content-Signals, auth.md, agentic commerce (x402 / MPP / UCP / ACP)</li>
                <li><code>self-upgrade</code> command with <code>--check</code> and <code>--json</code> flags</li>
              </ul>
            </div>
            <div className="release">
              <div><span className="release-version">v1.0.0</span><span className="release-date">2026-07-08</span></div>
              <ul>
                <li>Initial production release — 109 detectors across 17 namespaces</li>
                <li>OIDC trusted publishing on npm, evidence package architecture, persistent registries, JSON Schema validation</li>
              </ul>
            </div>
          </div>

          {/* CTA */}
          <div className="panel" style={{marginTop:'48px',borderColor:'rgba(16,185,129,.3)',textAlign:'center'}}>
            <p style={{fontSize:'18px',color:'var(--text)',fontWeight:'700',margin:'0 0 10px'}}>Built by Nebula Components</p>
            <p style={{margin:'0 0 20px',color:'var(--muted)'}}>Citable is the audit layer behind every Nebula site audit. Free to use, Apache 2.0 licensed. See it applied to a real site.</p>
            <div className="actions" style={{justifyContent:'center'}}>
              <a className="citable-button" href="https://github.com/mikeholownych/citable" target="_blank" rel="noopener noreferrer">GitHub →</a>
              <a className="citable-button secondary" href="/audit">Get a free audit of your site</a>
            </div>
          </div>

        </main>
      </div>
    </>
  )
}
