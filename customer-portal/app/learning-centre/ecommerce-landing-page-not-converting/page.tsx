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
<p class="eyebrow">Industry Specific · ecommerce landing page not converting</p>
<h1>Ecommerce Landing Page Not Converting? The Product Page Is A Leak</h1>
<p class="lede">Ecommerce product pages often have trust gaps, unclear value props, or hidden CTAs. Fix the product page before running more ads.</p>
<section class="panel">
<h2>The Product Page Leak Chain</h2>
<p>Every product page is a conversion sequence. Break one link and the chain fails. The sequence runs: photos → copy → reviews → add-to-cart. If any link is weak, visitors drop before checkout.</p>
<ul>
<li><strong>Photos:</strong> Poor quality, missing angles, no lifestyle shots</li>
<li><strong>Copy:</strong> Generic descriptions, no benefits, unclear sizing</li>
<li><strong>Reviews:</strong> None visible, no star rating, buried below fold</li>
<li><strong>Add-to-cart:</strong> Hidden button, unclear CTA, friction-heavy process</li>
</ul>
</section>
<section class="panel">
<h2>Common Ecommerce Leaks</h2>
<ul>
<li><strong>No social proof:</strong> Zero reviews or testimonials visible near the product</li>
<li><strong>Hidden shipping:</strong> Shipping costs surprise them at checkout, not before</li>
<li><strong>Unclear returns:</strong> Return policy buried or confusing, creates purchase anxiety</li>
<li><strong>Missing urgency:</strong> No reason to buy now versus later</li>
<li><strong>Stock opacity:</strong> No indication if item is in stock or ships soon</li>
</ul>
</section>
<section class="panel">
<h2>Quick Wins</h2>
<ul>
<li><strong>Add review count:</strong> Display "247 reviews" or "4.8 stars" above the fold</li>
<li><strong>Shipping clarity:</strong> Show shipping cost and delivery estimate before checkout</li>
<li><strong>Urgency elements:</strong> "Only 3 left" or "Ships within 24 hours" creates action</li>
<li><strong>Trust badges:</strong> Payment icons, security seals, guarantee near the add-to-cart</li>
<li><strong>Mobile CTA:</strong> Sticky add-to-cart button that scrolls with mobile users</li>
</ul>
</section>
<section class="panel">
<h2>When to Test Price vs Page</h2>
<p>Is it the offer or the page? If your product page has strong proof, clear value, and smooth checkout, test pricing. If the page has leaks, fix those first. A lower price cannot compensate for a broken funnel.</p>
<ul>
<li>Strong reviews + low conversion → Test pricing or shipping</li>
<li>Weak reviews + low conversion → Get more proof first</li>
<li>High cart abandonment → Check shipping clarity and checkout friction</li>
<li>High bounce rate → Check headline, photos, and load speed</li>
</ul>
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
<a href="/learning-center/landing-page-not-converting">Landing Page Not Converting? Diagnose These 5 Leaks First</a>
<a href="/learning-center/mobile-landing-page-leaks">Mobile Landing Page Leaks That Kill Paid Traffic</a>
<a href="/learning-center/google-ads-clicks-no-sales">Google Ads Clicks But No Sales: Check The Page Before Budget</a>
<a href="/learning-center/high-cpc-low-conversion">High CPC, Low Conversion: Stop Optimizing The Wrong Layer</a>
</div>
</section>
</main>
</body>` }} />
    </>
  );
}
