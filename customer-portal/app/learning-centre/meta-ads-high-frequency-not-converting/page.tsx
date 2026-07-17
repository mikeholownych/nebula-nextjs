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
      `}</style>
      <div dangerouslySetInnerHTML={{ __html: `<body>
<main class="wrap detail">
<a href="/learning-center/">← Learning Centre</a>
<p class="eyebrow">Meta Ads Leaks · meta-ads-high-frequency-not-converting</p>
<h1>Meta Ads High Frequency? The Page May Be Burning Budget</h1>
<p class="lede">When ad frequency climbs, most advertisers assume the audience is exhausted. But if clicks are still coming and conversions have stalled, the leak isn't the ad — it's the landing page failing to close.</p>
<section class="panel">
<h2>When frequency matters</h2>
<p>Frequency indicates how many times the average person has seen your ad. A frequency above 5 with CTR dropping signals genuine audience fatigue — the creative has worn out its welcome.</p>
<ul>
<li>Frequency >5 and CTR declining: Your audience has seen the ad too many times</li>
<li>CTR dropping below 0.8%: The hook no longer captures attention</li>
<li>Cost per click rising: You're paying more for the same impressions</li>
</ul>
<p>In this case, refresh the creative or expand your audience. The ad itself is the bottleneck.</p>
</section>
<section class="panel">
<h2>When the page is the problem</h2>
<p>But here's the leak most miss: frequency high, clicks still strong, but conversions flat or falling. The ad is doing its job — people are clicking. The page is where they lose interest.</p>
<ul>
<li>Frequency >5 but CTR stable: The ad still works, audience isn't fatigued</li>
<li>Clicks consistent but conversions dropping: The page fails to convert interest</li>
<li>High bounce rate on landing page: The message-ad mismatch kills momentum</li>
</ul>
<p>This pattern means your ad spend is working — the page is burning the budget after the click.</p>
</section>
<section class="panel">
<h2>Test: change the page not the ad</h2>
<p>Before you pause a high-performing ad or overhaul your targeting, run this test:</p>
<ul>
<li>Keep the ad running as-is if CTR is above benchmark</li>
<li>Build a new landing page variant that matches the ad hook precisely</li>
<li>Send 50% of traffic to the new page</li>
<li>Measure conversions, not just clicks</li>
</ul>
<p>If the new page converts at a higher rate while frequency remains stable, you've found the leak. The audience was never tired — the page just wasn't closing.</p>
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
<div class="related"><a href="/learning-center/facebook-ads-no-leads">Facebook Ads Getting Clicks But No Leads</a>
<a href="/learning-center/google-ads-clicks-no-sales">Google Ads Clicks But No Sales: Check The Page Before Budget</a>
<a href="/learning-center/landing-page-not-converting">Landing Page Not Converting? Diagnose These 5 Leaks First</a>
<a href="/learning-center/high-cpc-low-conversion">High CPC, Low Conversion: Stop Optimizing The Wrong Layer</a></div>
</section>
</main>
</body>` }} />
    </>
  );
}
