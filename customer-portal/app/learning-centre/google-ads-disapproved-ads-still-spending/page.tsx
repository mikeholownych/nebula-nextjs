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
<p class="eyebrow">Google Ads Leaks · google ads disapproved ads still spending</p>
<h1>Google Ads Disapproved? Your Page May Be The Hidden Reason</h1>
<p class="lede">When Google Ads disapproves your ad, most advertisers check the ad copy. But the landing page itself can trigger policy violations that not only block the ad—but continue costing you money while the ad runs in a disabled state.</p>
<section class="panel">
<h2>Hidden landing page violations</h2>
<p>Google's landing page policies go beyond what appears on screen. Common hidden triggers include:</p>
<ul>
<li><strong>Redirects:</strong> Destination URLs that redirect through multiple hops—especially if they mask the final destination—violate transparency policies. A clean path from ad click to final page is required.</li>
<li><strong>Bridge pages:</strong> Pages that exist solely to funnel traffic to another site with little or no original content. Affiliate links are fine; pages with no substantive added value are not.</li>
<li><strong>Arbitrage:</strong> Landing pages overloaded with ads where the sole purpose appears to be generating ad revenue rather than providing genuine user value.</li>
<li><strong>Malware or unwanted software:</strong> Even if your site is clean, third-party scripts, expired SSL certificates, or compromised plugins can trigger immediate disapproval.</li>
</ul>
<p>The issue is that these violations are often invisible to the advertiser. The page loads. It looks fine. But Google's automated crawlers detect the underlying policy breach.</p>
</section>
<section class="panel">
<h2>Account-level fallout</h2>
<p>A single landing page violation can cascade beyond the ad itself:</p>
<ul>
<li><strong>Ad disapprovals compound:</strong> Multiple ads pointing to the same violating page all get flagged simultaneously.</li>
<li><strong>Account standing degrades:</strong> Repeated landing page violations lower your account's policy compliance score, leading to stricter scrutiny on future ads.</li>
<li><strong>Budget drain during review:</strong> Some disapproved ads continue accruing costs while under review or appeal—especially if the violation is borderline and being manually evaluated.</li>
<li><strong>Recovery takes time:</strong> Fixing the page doesn't instantly restore the ad. Each disapproved ad must be resubmitted for review, adding days to campaign timelines.</li>
</ul>
<p>The fastest fix is preventing the violation before it triggers review.</p>
</section>
<section class="panel">
<h2>Checklist for the page</h2>
<p>Before launching or troubleshooting a disapproved ad, run through these landing page checks:</p>
<ul>
<li>Does the destination URL load without redirecting through intermediate domains?</li>
<li>Is the page content original and substantial—not just links to somewhere else?</li>
<li>Are affiliate links clearly disclosed and surrounded by genuine added value?</li>
<li>Is SSL valid with no mixed-content warnings or expired certificates?</li>
<li>Do all third-party scripts load from reputable sources?</li>
<li>Is the page free from excessive advertising blocks above the fold?</li>
<li>Does the page load acceptably on mobile devices?</li>
<li>Is there clear contact information and a privacy policy visible?</li>
</ul>
</section>
<section class="panel cta-panel">
<h2>Find the violation before Google does</h2>
<p>Run the free Nebula audit to surface landing page issues that trigger disapprovals. Fix the $147 pack includes policy compliance flags.</p>
<div class="actions">
<a class="button" href="/audit">Run the free audit</a>
<a class="button secondary" href="/learning-center/google-ads-clicks-no-sales">Check clicks no sales</a>
</div>
</section>
<section class="panel">
<h2>Related leak checks</h2>
<div class="related"><a href="/learning-center/google-ads-clicks-no-sales">Google Ads Clicks But No Sales: Check The Page Before Budget</a>
<a href="/learning-center/landing-page-not-converting">Landing Page Not Converting? Diagnose These 5 Leaks First</a>
<a href="/learning-center/high-cpc-low-conversion">High CPC, Low Conversion: Stop Optimizing The Wrong Layer</a>
<a href="/learning-center/traffic-but-no-form-fills">Traffic But No Form Fills: The Form Is Usually Not The First Leak</a></div>
</section>
</main>
</body>` }} />
    </>
  );
}
