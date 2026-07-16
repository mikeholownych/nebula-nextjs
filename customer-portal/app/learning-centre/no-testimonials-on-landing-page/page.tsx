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
<p class="eyebrow">Trust Leaks · no testimonials on landing page</p>
<h1>No Testimonials On Landing Page? Add Proof Before CTA</h1>
<p class="lede">Pages ask before they prove. No testimonials means no trust. Add social proof above the CTA to earn the ask.</p>
<section class="panel">
<h2>The Proof-First Principle</h2>
<p>Trust before ask. A visitor who has seen no evidence that you deliver results will not hand over their email, phone number, or credit card. Every landing page makes a promise. The testimonials are the receipt. Without them, the promise feels like risk.</p>
<p>Most pages put the CTA above the fold and bury the proof somewhere below. That backwards loading order creates friction. The visitor sees the ask before they see the reason to say yes.</p>
</section>
<section class="panel">
<h2>What Counts as Proof</h2>
<ul>
<li><strong>Testimonials:</strong> Real quotes from named customers with specific results. "Great to work with" proves nothing. "Cut our cost per lead by 62% in 3 weeks" proves everything.</li>
<li><strong>Logos:</strong> Recognizable brand badges signal that others trusted you. Best for B2B where the buyer knows the names.</li>
<li><strong>Case results:</strong> Before/after metrics, screenshots, or outcome snapshots that show the transformation.</li>
<li><strong>Numbers:</strong> "47 companies fixed this leak last month" beats vague claims of being an expert.</li>
</ul>
<p>The best proof is specific, verifiable, and relevant to the problem your visitor has right now.</p>
</section>
<section class="panel">
<h2>Where to Place It</h2>
<ul>
<li><strong>Above the CTA:</strong> The visitor should see at least one proof element before the first major ask.</li>
<li><strong>Near objection points:</strong> If price is a concern, show ROI proof nearby. If credibility is a concern, show logos or accreditations.</li>
<li><strong>In the confirmation zone:</strong> Right before the final CTA, remind them why others said yes.</li>
</ul>
<p>Placement is not about decoration. It is about answering the silent "Why should I trust you?" that plays in the background of every landing page visit.</p>
</section>
<section class="panel">
<h2>Quick Wins</h2>
<ul>
<li>Add 3 testimonials with specific results, not generic praise.</li>
<li>Put the strongest proof element above the fold if possible.</li>
<li>Use real names and companies. "Marketing Director at SaaS company" is weaker than "Sarah Chen, VP Marketing at Vercel."</li>
<li>If you have no testimonials yet, use numbers: "X customers," "Y results delivered," or "Z years of fixing this exact problem."</li>
</ul>
<p>A page with proof above the CTA converts higher than a page that asks first and explains later.</p>
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
<div class="related"><a href="/learning-center/proof-before-cta">Proof Before CTA: The Simple Fix Most Landing Pages Miss</a>
<a href="/learning-center/landing-page-not-converting">Landing Page Not Converting? Diagnose These 5 Leaks First</a></div>
</section>
</main>
</body>` }} />
    </>
  );
}
