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
<p class="eyebrow">Meta Ads Leaks · retargeting ads not converting</p>
<h1>Retargeting Ads Not Converting? The First Page Failed Them</h1>
<p class="lede">Retargeting fails when the first impression leaked trust. Fix the cold traffic page before blaming retargeting. If visitors didn't convert the first time, the page left a gap—and showing it again won't close it.</p>
<section class="panel">
<h2>The retargeting misconception</h2>
<p>Most teams assume retargeting ads aren't working when conversions stay low. But retargeting doesn't create demand—it reminds. If the first visit didn't move the visitor toward action, the tenth visit won't either.</p>
<p>The problem isn't the ads not working. It's the page not working. Retargeting amplifies what already exists. A broken funnel gets more traffic. A working funnel gets more conversions.</p>
</section>
<section class="panel">
<h2>How the first page affects retargeting</h2>
<p><strong>Trust:</strong> If the first impression felt generic, manipulative, or unclear, retargeting reminds them of that feeling. You're not re-engaging—you're reinforcing distrust.</p>
<p><strong>Memory:</strong> Visitors remember how you made them feel. Confusing navigation, too many form fields, vague headlines—these stick. Retargeting brings them back to the same experience.</p>
<p><strong>Intent:</strong> A clear first page creates clear intent. Visitors know what you offer and whether it's for them. Retargeting then serves as a nudge, not a rescue mission.</p>
</section>
<section class="panel">
<h2>Diagnosing the real leak</h2>
<p>Compare cold traffic vs returning traffic conversion rates:</p>
<ul>
<li>If cold traffic converts below 1%, the landing page is the leak. Retargeting won't fix it.</li>
<li>If cold traffic converts above 2% but returning traffic is flat, the retargeting message might be misaligned.</li>
<li>If both are low, fix the page first. Then test retargeting.</li>
</ul>
<p>The first page does the heavy lifting. Retargeting is the assist. Don't ask the assist to carry the load.</p>
</section>
<section class="panel">
<h2>Quick fix</h2>
<p>Before adjusting retargeting budgets, frequency, or creative:</p>
<ul>
<li>Read the landing page as a first-time visitor. Does the headline match the ad promise?</li>
<li>Check mobile experience. Most retargeting impressions happen on mobile.</li>
<li>Reduce form friction. Ask only what's needed to re-engage.</li>
<li>Add social proof above the fold. Trust signals matter for returning visitors too.</li>
</ul>
<p>Run the page through the Nebula audit. Fix the leaks. Then measure retargeting again.</p>
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
<a href="/learning-center/landing-page-not-converting">Landing Page Not Converting? Diagnose These 5 Leaks First</a>
<a href="/learning-center/google-ads-clicks-no-sales">Google Ads Clicks But No Sales: Check The Page Before Budget</a>
<a href="/learning-center/high-cpc-low-conversion">High CPC, Low Conversion: Stop Optimizing The Wrong Layer</a></div>
</section>
</main>
</body>` }} />
    </>
  );
}
