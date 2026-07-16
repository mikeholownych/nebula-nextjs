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
<p class="eyebrow">Google Ads Leaks · google ads quality score low</p>
<h1>Google Ads Quality Score Low? Fix The Page Before The Account</h1>
<p class="lede">Quality Score is not a medal. It is a diagnostic: Google telling you the landing page does not match what the searcher expected. Most accounts try to fix the ad. The real leak is almost always on the page.</p>
<section class="panel">
<h2>What Quality Score actually measures</h2>
<p>Quality Score is Google's prediction of how relevant your ad and landing page are to the person searching. It is not a judgment of your business—it is a signal about match quality between search intent and arrival experience.</p>
<p>The score is calculated from three components:</p>
<ul>
<li><strong>Ad relevance:</strong> Does your ad copy match the keyword?</li>
<li><strong>Expected click-through rate:</strong> Do people click when they see your ad?</li>
<li><strong>Landing page experience:</strong> Does the page deliver on the ad's promise?</li>
</ul>
<p>Most advertisers obsess over the first two. But the third—the landing page—is where the real leverage lives. If the page breaks the chain, relevance and CTR will also suffer over time.</p>
</section>
<section class="panel">
<h2>The page factors that tank Quality Score</h2>
<p>Google evaluates your landing page on factors you can actually control:</p>
<ul>
<li><strong>Load speed:</strong> If the page takes more than 3 seconds, mobile searchers bounce before it renders. Speed is not just UX—it is eligibility.</li>
<li><strong>Content match:</strong> Does the first screen repeat the promise from the ad? If someone searches "emergency plumber same day" and lands on a generic "About Us" page, the match is broken.</li>
<li><strong>Click-through behavior:</strong> Do people who land stay long enough to take action? If they bounce in under 5 seconds, Google lowers the score for that keyword-page pair.</li>
</ul>
<p>The pattern: searcher picks an ad based on a promise, arrives, does not see that promise reflected immediately, and leaves. The page leaked the click.</p>
</section>
<section class="panel">
<h2>Quick wins: match the headline to the keyword</h2>
<p>The fastest Quality Score improvement is also the simplest: make the hero headline repeat the exact keyword phrase the searcher used.</p>
<p>Example:</p>
<ul>
<li><strong>Search:</strong> "google ads quality score low"</li>
<li><strong>Ad promise:</strong> "Quality Score tanking? Fix the page, not the account"</li>
<li><strong>Landing page headline:</strong> "Google Ads Quality Score Low? Fix The Page Before The Account"</li>
</ul>
<p>This is not clever copywriting. It is mechanical match reinforcement. When the searcher sees their exact intent reflected back, they stay. When they stay, Google raises the Quality Score.</p>
<p>Other quick wins:</p>
<ul>
<li>Put the main benefit in the first 100 visible pixels</li>
<li>Remove any auto-play video or aggressive popups that delay reading</li>
<li>Make the primary CTA visible without scrolling on mobile</li>
<li>Match the ad's specific offer to the page's specific page—not a generic homepage</li>
</ul>
</section>
<section class="panel">
<h2>When to give up on the keyword</h2>
<p>Not every keyword deserves to be saved. Some Quality Score problems are symptoms of a deeper mismatch: the keyword does not align with what you actually offer.</p>
<p>Signs it is time to pause or negative-match the keyword:</p>
<ul>
<li><strong>Quality Score below 3 for 30+ days</strong> despite headline and content fixes</li>
<li><strong>Consistently high bounce rate</strong> (over 70%) from that keyword's traffic</li>
<li><strong>Sales or leads do not match search intent</strong>—e.g., searchers want information, you offer a service</li>
<li><strong>The page converts for other keywords</strong> but not this one</li>
</ul>
<p>In these cases, the leak is not on the page. The leak is targeting the wrong intent. Better to cut the keyword and reallocate budget to terms that match what searchers actually want.</p>
</section>
<section class="panel cta-panel">
<h2>Find the page leak first</h2>
<p>Before you rewrite ads or restructure campaigns, run the free Nebula audit. It will show you exactly where the landing page breaks the chain from click to conversion.</p>
<div class="actions">
<a class="button" href="/audit">Run the free audit</a>
<a class="button secondary" href="/learning-center/message-match-checklist">Open message match checklist</a>
</div>
</section>
<section class="panel">
<h2>Related leak checks</h2>
<div class="related"><a href="/learning-center/google-ads-clicks-no-sales">Google Ads Clicks But No Sales: Check The Page Before Budget</a>
<a href="/learning-center/message-match-checklist">Message Match Checklist: Align Ad, Page, and Intent</a>
<a href="/learning-center/landing-page-not-converting">Landing Page Not Converting? Diagnose These 5 Leaks First</a>
<a href="/learning-center/high-cpc-low-conversion">High CPC, Low Conversion: Stop Optimizing The Wrong Layer</a></div>
</section>
</main>
</body>` }} />
    </>
  );
}
