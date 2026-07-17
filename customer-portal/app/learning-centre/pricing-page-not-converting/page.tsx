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
<p class="eyebrow">Industry Specific · pricing page not converting</p>
<h1>Pricing Page Not Converting? The Tier Structure May Be Wrong</h1>
<p class="lede">Pricing pages confuse instead of guide. Wrong tiers, unclear value, pricing anxiety. Fix the tier structure and proof before the price.</p>
<section class="panel">
<h2>The pricing page leak chain</h2>
<p>Most pricing pages lose visitors before they ever see the price. Confusion comes first. Then comparison paralysis. Then fear. Each stage leaks potential customers who might otherwise buy.</p>
<p>A visitor lands on your pricing page already interested. They scroll looking for clarity. Instead they find tier names that mean nothing, feature lists that blur together, and no clear indication of which option fits them. Confusion turns into comparison paralysis. They can't decide, so they leave "to think about it." They never come back.</p>
</section>
<section class="panel">
<h2>Common tier mistakes</h2>
<ul>
<li><strong>Too many options:</strong> 5 or 6 tiers overwhelm. Decision fatigue sets in. The visitor who could not choose between your product and nothing now cannot choose between your products.</li>
<li><strong>Unclear differences:</strong> Tier names like Bronze, Silver, Gold say nothing about who each tier serves. Feature checkmarks repeat across columns. The buyer cannot translate features into outcomes.</li>
<li><strong>No anchor:</strong> Without a clear recommended option, the visitor must do math and comparison shopping in their head. Most will not bother.</li>
<li><strong>Value hidden behind price:</strong> The price shows first. The value shows later, if at all. This reverses the correct sequence.</li>
</ul>
</section>
<section class="panel">
<h2>Good tier structure</h2>
<p>Three tiers. This is not a rule but a strong default. Three gives enough choice without overwhelming. It creates a natural comparison: good, better, best.</p>
<p>Clear naming. Name tiers after who they serve, not arbitrary labels. Starter, Growth, Enterprise. Solo, Team, Organization. The name should hint at the buyer's situation.</p>
<p>Value per tier. Each tier should have a clear "what you get" that maps to a specific outcome. "Up to 5,000 contacts" is a feature. "Send your monthly newsletter without hitting limits" is the value story.</p>
<p>One tier highlighted. The middle option gets the "Most Popular" or "Recommended" badge. Most buyers will not comparison shop. They will take the suggested option.</p>
</section>
<section class="panel">
<h2>Quick wins</h2>
<ul>
<li><strong>Add feature comparison:</strong> A simple table that shows what each tier includes. Not a wall of checkmarks, but the 4-6 features that actually matter to the decision.</li>
<li><strong>Recommended badge:</strong> Highlight one tier. Put "Most Popular" or "Best for Growing Teams" on the middle option. Remove the need for active comparison.</li>
<li><strong>Annual discount:</strong> Show monthly and annual pricing side by side. Make the savings obvious. Offer a two-month discount for annual. This increases average order value and reduces churn.</li>
<li><strong>Proof before price:</strong> Move testimonials, case results, or trust signals above the pricing table. The visitor should want the outcome before they see the cost.</li>
</ul>
</section>
<section class="panel cta-panel">
<h2>Fix your pricing page</h2>
<p>Run the free Nebula audit to spot tier structure issues. Buy the $147 Fix Pack when you know what to change.</p>
<div class="actions">
<a class="button" href="/audit">Run the free audit</a>
<a class="button secondary" href="/learning-center/landing-page-not-converting">Diagnose landing page leaks</a>
</div>
</section>
<section class="panel">
<h2>Related leak checks</h2>
<div class="related">
<a href="/learning-center/landing-page-not-converting">Landing Page Not Converting? Diagnose These 5 Leaks First</a>
<a href="/learning-center/cta-not-working">CTA Not Working: Why The Button Is Rarely The Problem</a>
</div>
</section>
</main>
</body>` }} />
    </>
  );
}
