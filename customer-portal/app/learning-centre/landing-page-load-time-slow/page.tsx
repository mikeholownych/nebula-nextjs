'use client';

export default function LearningCentrePage() {
  
  return (
    <>
      <style>{`
:root { color-scheme: dark; --bg:#080a0f; --panel:#111723; --text:#f5f7fb; --muted:#9aa7bd; --line:#253044; --hot:#79f2c0; --gold:#ffd166; }
* { box-sizing: border-box; }
body { margin:0; background: radial-gradient(circle at top left,#152033,#080a0f 42%); color:var(--text); font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; }
a { color: var(--hot); text-decoration: none; }
.wrap { width:min(1120px,92vw); margin:0 auto; padding:56px 0; }
.hero { display:grid; gap:22px; padding:42px; border:1px solid var(--line); border-radius:28px; background:linear-gradient(135deg,rgba(17,23,35,.92),rgba(8,10,15,.78)); box-shadow:0 24px 80px rgba(0,0,0,.35); }
.eyebrow { color:var(--gold); text-transform:uppercase; letter-spacing:.12em; font-size:12px; font-weight:800; }
h1 { font-size:clamp(38px,7vw,76px); line-height:.94; margin:0; letter-spacing:-.06em; }
h2 { font-size:32px; margin:48px 0 18px; letter-spacing:-.03em; }
h3 { font-size:22px; margin:10px 0; }
.lede { color:var(--muted); font-size:20px; max-width:760px; line-height:1.45; }
.proof { display:flex; flex-wrap:wrap; gap:10px; padding:0; margin:8px 0 0; list-style:none; }
.proof li,.badge { border:1px solid var(--line); border-radius:999px; padding:8px 12px; color:var(--muted); background:#0c111a; }
.actions { display:flex; flex-wrap:wrap; gap:14px; }
.button { display:inline-flex; align-items:center; justify-content:center; border-radius:999px; padding:13px 18px; background:var(--hot); color:#02100a; font-weight:900; }
.button.secondary { background:transparent; color:var(--text); border:1px solid var(--line); }
.grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(245px,1fr)); gap:16px; }
.card,.panel { background:rgba(17,23,35,.88); border:1px solid var(--line); border-radius:22px; padding:22px; margin:16px 0; }
.card p,.panel li,.panel p { color:var(--muted); line-height:1.55; }
.resource-link { font-weight:900; }
.detail { max-width:860px; }
.related { display:grid; gap:10px; }
.related a { padding:10px 0; border-bottom:1px solid var(--line); }
.cta-panel { border-color:rgba(121,242,192,.45); }
.stat { font-size:48px; font-weight:900; color:var(--gold); margin:0; }
.stat-label { color:var(--muted); font-size:14px; }
      `}</style>
      <div dangerouslySetInnerHTML={{ __html: `<body>
<main class="wrap detail">
<a href="/learning-center/">← Learning Centre</a>
<p class="eyebrow">Landing Page Leaks · load time</p>
<h1>Landing Page Load Time Slow? Every Second Costs Conversions</h1>
<p class="lede">One second of extra load time = 7% conversion drop. If your page makes $100/day, that's $7/day lost. Speed is revenue.</p>

<section class="panel">
<h2>The Real Cost of Slow</h2>
<p>Google's research is clear: every additional second of load time reduces conversions by approximately 7%. This isn't theoretical—it's money walking out the door.</p>
<div style="display:flex; gap:32px; flex-wrap:wrap; margin-top:22px;">
<div>
<p class="stat">7%</p>
<p class="stat-label">conversion drop per second</p>
</div>
<div>
<p class="stat">$7</p>
<p class="stat-label">lost per $100 revenue per day</p>
</div>
<div>
<p class="stat">$2,555</p>
<p class="stat-label">lost per year per $100/day page</p>
</div>
</div>
<p style="margin-top:18px;">A page earning $500/day loses $35/day to a 1-second delay—that's over $12,000 annually. Speed isn't a technical concern. It's a profit concern.</p>
</section>

<section class="panel">
<h2>Largest Contentful Paint (LCP)</h2>
<p>LCP measures when the main content becomes visible. Google considers a "good" LCP to be under 2.5 seconds. Anything above 4 seconds is "poor" and directly hurts both conversions and search rankings.</p>
<ul>
<li><strong>LCP &lt; 2.5s:</strong> Good—most visitors see your offer quickly</li>
<li><strong>LCP 2.5s–4s:</strong> Needs improvement—you're losing impatient visitors</li>
<li><strong>LCP &gt; 4s:</strong> Poor—you're bleeding conversions and SEO</li>
</ul>
<p>Check your LCP in Google PageSpeed Insights or Chrome DevTools. It's free and takes 30 seconds.</p>
</section>

<section class="panel">
<h2>Quick Wins</h2>
<h3>Compress Images</h3>
<p>Uncompressed images are the #1 cause of slow pages. Use WebP format, compress to 80% quality, and serve responsive images. A 2MB hero becomes 200KB with no visible difference.</p>
<h3>Lazy Load Below the Fold</h3>
<p>Images and videos below the initial viewport shouldn't block rendering. Add <code>loading="lazy"</code> to images that aren't immediately visible.</p>
<h3>Reduce Redirect Chains</h3>
<p>Each redirect adds DNS lookup, TLS handshake, and round-trip time. Clean URLs load faster.</p>
<h3>Use a CDN</h3>
<p>Serve assets from edge locations close to your visitors. Cloudflare is free for most small sites.</p>
</section>

<section class="panel">
<h2>The Trade-off</h2>
<p>Speed optimization has diminishing returns. Getting from 6s to 3s is usually straightforward: compress images, add lazy loading, use a CDN. Getting from 3s to 1.5s requires more effort—code splitting, critical CSS, font optimization.</p>
<p>Prioritize the high-impact, low-effort fixes first. A 50% speed improvement often comes from image compression alone. The last 20% might take weeks.</p>
<p>Also consider: a beautiful but slow page converts worse than a simple but fast one. Complexity costs speed. Speed costs conversions.</p>
</section>

<section class="panel cta-panel">
<h2>Find the leak on your page</h2>
<p>Run the free Nebula audit first. Buy the $147 Fix Pack only when the leak is obvious.</p>
<div class="actions">
<a class="button" href="/audit">Run the free audit</a>
<a class="button secondary" href="/learning-center/paid-traffic-leak-map">Open leak map</a>
</div>
</section>

<section class="panel">
<h2>Related leak checks</h2>
<div class="related">
<a href="/learning-center/mobile-landing-page-leaks">Mobile Landing Page Leaks That Kill Paid Traffic</a>
<a href="/learning-center/landing-page-not-converting">Landing Page Not Converting? Diagnose These 5 Leaks First</a>
<a href="/learning-center/before-you-raise-ad-budget">Before You Raise Ad Budget: Check These 5 Landing Page Leaks</a>
<a href="/learning-center/traffic-but-no-form-fills">Traffic But No Form Fills? Find the Leak</a>
</div>
</section>
</main>
</body>` }} />
    </>
  );
}
