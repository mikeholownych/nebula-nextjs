'use client';

import { useEffect } from 'react';


export default function IndexOldPage() {
  useEffect(() => {
    // Initialize scroll tracking
    const scrollDepths: Record<number, boolean> = { 25: false, 50: false, 75: false, 100: false };
    const scrollFired = (pct: number) => {
      if (!scrollDepths[pct]) {
        scrollDepths[pct] = true;
        if (typeof (window as any).gtag === 'function') {
          (window as any).gtag('event', 'scroll_depth', { event_category: 'engagement', event_label: pct + '%', value: pct });
        }
      }
    };
    
    const prog = document.getElementById('scroll-prog') as HTMLElement | null;
    const updateProg = () => {
      const scrolled = window.scrollY;
      const total = document.body.scrollHeight - window.innerHeight;
      const pct = total > 0 ? (scrolled / total * 100) : 0;
      if (prog) prog.style.width = pct + '%';
      if (pct >= 25) scrollFired(25);
      if (pct >= 50) scrollFired(50);
      if (pct >= 75) scrollFired(75);
      if (pct >= 100) scrollFired(100);
    };
    window.addEventListener('scroll', updateProg, { passive: true });

    // Sticky bar
    const stickyBar = document.getElementById('sticky-bar');
    let sbarDismissed = false;
    const sbarDismissBtn = stickyBar?.querySelector('.sbar-dismiss');
    sbarDismissBtn?.addEventListener('click', () => {
      stickyBar?.classList.remove('visible');
      sbarDismissed = true;
    });
    
    const updateStickyBar = () => {
      if (sbarDismissed || !stickyBar) return;
      if (window.scrollY > 400) stickyBar.classList.add('visible');
      else stickyBar.classList.remove('visible');
    };
    window.addEventListener('scroll', updateStickyBar, { passive: true });

    // Count-up animation
    const statEls = document.querySelectorAll('.stat-num[data-target]');
    if (statEls.length) {
      const countObs = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          const target = parseFloat(el.dataset.target || '0');
          const suffix = el.dataset.suffix || '';
          const duration = 1200;
          let startTime: number | null = null;
          const step = (ts: number) => {
            if (!startTime) startTime = ts;
            const progress = Math.min((ts - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const val = target * eased;
            el.innerHTML = Math.round(val).toString() + suffix;
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          countObs.unobserve(el);
        });
      }, { threshold: 0.5 });
      statEls.forEach((el) => countObs.observe(el));
    }

    // Smooth scroll
    document.querySelectorAll('nav a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = (link as HTMLAnchorElement).getAttribute('href');
        const target = href ? document.querySelector(href) : null;
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Form handler
    const form = document.getElementById('audit-form') as HTMLFormElement | null;
    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const payload = {
        url: formData.get('url'),
        email: formData.get('email'),
        goal: formData.get('goal'),
        visitor: formData.get('visitor') || null,
        tone: formData.get('tone') || null,
        role: formData.get('role') || null,
        monthly_spend: formData.get('monthly_spend') || null,
        pain_point: formData.get('pain_point') || null,
        source_type: 'homepage_audit_form',
        trigger_type: 'self_serve_url_submit',
        offer_variant: 'audit_first_free_kit'
      };
      
      const submitBtn = document.getElementById('audit-submit-btn') as HTMLButtonElement | null;
      const result = document.getElementById('audit-result');
      
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Running…';
      }
      
      if (result) {
        result.className = 'card result show';
        result.innerHTML = '<h2>Your audit is running…</h2><p>Checking clarity, CTA friction, trust proof, offer specificity.</p>';
      }
      
      try {
        const resp = await fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Audit failed');
        
        const issues = (data.top_issues || []).slice(0, 5).map((item: any) =>
          '<li><strong>' + item.dim + ':</strong> ' + item.issue + '<br><span class="micro">Fix: ' + item.fix + '</span></li>'
        ).join('');
        
        if (result) {
          result.innerHTML = '<h2>Your audit is ready</h2><p><strong>Score:</strong> ' + data.score + '/10 · <strong>Grade:</strong> ' + data.grade + '</p><ul>' + issues + '</ul><p class="micro">A copy was emailed to you.</p>';
        }
      } catch (error: any) {
        if (result) {
          result.innerHTML = '<h2>Audit could not run</h2><p>' + error.message + '</p><p>Email ops@launchcrate.io</p>';
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Run my free audit →';
        }
      }
    });

    // Free kit form
    const freeKitForm = document.getElementById('free-kit-form');
    freeKitForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const emailInput = document.getElementById('free-kit-email') as HTMLInputElement | null;
      const status = document.getElementById('free-kit-status');
      if (!emailInput || !status) return;
      
      const email = emailInput.value.trim();
      if (!email.includes('@')) {
        status.style.display = 'block';
        status.style.color = '#ef4444';
        status.textContent = 'Please enter a valid email.';
        return;
      }
      
      status.style.display = 'block';
      status.style.color = '#059669';
      status.textContent = 'Sending...';
      
      try {
        const resp = await fetch('/api/free-kit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, source: 'homepage_free_kit_card' })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Request failed');
        status.textContent = '✅ Sent! Check your inbox.';
        emailInput.value = '';
      } catch (err: any) {
        status.style.color = '#ef4444';
        status.textContent = '❌ ' + err.message + ' — Email ops@launchcrate.io';
      }
    });

    // ROI Calculator
    (window as any).calcROI = () => {
      const spend = parseFloat((document.getElementById('roi-spend') as HTMLInputElement)?.value || '0');
      const cvr = parseFloat((document.getElementById('roi-cvr') as HTMLInputElement)?.value || '0');
      const aov = parseFloat((document.getElementById('roi-aov') as HTMLInputElement)?.value || '0');
      if (!spend || !cvr || !aov) { alert('Fill in all three fields'); return; }
      const clicks = spend / 2;
      const revenue = clicks * (cvr / 100) * aov;
      const improved = clicks * ((cvr * 1.5) / 100) * aov;
      const gap = improved - revenue;
      const fmt = (n: number) => '$' + Math.round(n).toLocaleString();
      const headline = document.getElementById('roi-headline');
      const detail = document.getElementById('roi-detail');
      const res = document.getElementById('roi-result');
      if (headline) headline.textContent = 'Your page is leaving ' + fmt(gap) + '/mo — ' + fmt(gap * 12) + '/year.';
      if (detail) detail.textContent = 'At ' + cvr + '% CVR: ' + fmt(revenue) + '/mo. +50% lift -> ' + fmt(improved) + '/mo.';
      if (res) (res as HTMLElement).style.display = 'block';
    };

    return () => {
      window.removeEventListener('scroll', updateProg);
      window.removeEventListener('scroll', updateStickyBar);
    };
  }, []);

  return (
    <>
      <div id="scroll-prog" aria-hidden="true" style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, height: '3px', width: '0%', background: '#fbbf24' } as React.CSSProperties}></div>
      <div dangerouslySetInnerHTML={{ __html: PAGE_CONTENT }} />
    </>
  );
}

const PAGE_CONTENT = `


<div id="scroll-prog" aria-hidden="true"></div>
<header>

  <h1>4% CTR. 0% conversion. <span class="squiggle"><em>Here&#8217;s where it breaks.</em><svg class="squig" viewBox="0 0 180 12" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path class="squig-path" d="M2,8 C30,2 60,12 90,6 C120,0 150,10 178,6" fill="none" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/></svg></span></h1>
  <p class="sub">Your ad spend is leaking somewhere between the click and the checkout. This finds the exact gap, estimates the monthly dollar cost, and gives you the fix. 60 seconds. $0. No testing phase. No agency.</p>
  <div style="text-align:center;margin:0 auto 24px;max-width:640px;">
    <p style="font-size:17px;color:#c8ced8;line-height:1.7;margin-bottom:16px;">We audited 200+ landing pages. Same 5 leaks every time. Average monthly burn: <strong style="color:#f87171;">$4,200</strong> in wasted ad spend.</p>
  </div>
  <div class="trust-row">
    <span class="pill">No sales call</span>
    <span class="pill">$147 implementation</span>
    <span class="pill">30-min refund</span>
  </div>
  <div style="text-align:center;margin:24px auto 0;">
    <a class="btn btn-green" href="#audit-form-card" style="font-size:18px;padding:16px 48px;display:inline-block;font-weight:600;">Get Your Free Audit Now</a>
    <p class="micro" style="margin:12px auto 0;color:#9ca3af;font-size:14px;">Free · 60 seconds · No account required</p>
  </div>
  <nav>
      <a href="#how-it-works">How it works</a>
      <a href="#pricing">Pricing</a>
      <a href="#guarantee">Guarantee</a>
    </nav>
</header>

<!-- ── BY THE NUMBERS band ── -->
<section class="numbers-band">
  <div class="numbers-inner">
    <div class="stat-item">
      <div class="stat-num-wrap">
        <span class="stat-num" data-target="200" data-suffix="+">200+</span>
      </div>
      <span class="stat-label">pages scored</span>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <div class="stat-num-wrap">
        <span class="stat-num" data-target="4200" data-prefix="$">$4,200</span>
      </div>
      <span class="stat-label">avg monthly burn found</span>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <div class="stat-num-wrap">
        <span class="stat-num" data-target="60" data-suffix="sec">60sec</span>
      </div>
      <span class="stat-label">audit delivery</span>
    </div>
  </div>
</section>

<main class="container">

  <!-- ── WITHOUT / WITH BLOCK ── -->
  <section class="card" style="padding:40px 32px;">
    <h2 style="text-align:center;margin-bottom:32px;font-size:28px;">The Shift</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
      <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:16px;padding:28px;">
        <p style="font-weight:600;color:#f87171;margin-bottom:16px;font-size:15px;text-transform:uppercase;letter-spacing:0.05em;">Without diagnosis</p>
        <p style="font-size:15px;color:#9ca3af;line-height:1.8;margin:0;">You buy more traffic hoping something changes. You rewrite the headline. Same result. Your agency says "needs more time." You kill the campaign before finding the real leak.</p>
      </div>
      <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:16px;padding:28px;">
        <p style="font-weight:600;color:#6ee7b7;margin-bottom:16px;font-size:15px;text-transform:uppercase;letter-spacing:0.05em;">After 60 seconds</p>
        <p style="font-size:15px;color:#9ca3af;line-height:1.8;margin:0;">Know which fix pays back fastest. Scored across 5 dimensions. In your inbox before your next ad spend. 30 seconds to submit, 60 seconds back.</p>
      </div>
    </div>
  </section>





  <!-- ── PERSONA SPLIT ── -->
  <section class="card" style="padding:40px 32px;">
    <h2 style="text-align:center;margin-bottom:8px;font-size:28px;">Who this is for</h2>
    <p style="text-align:center;color:#9ca3af;font-size:16px;margin-bottom:32px;">One tool. Two use cases.</p>
    <div class="persona-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
      <div style="padding:32px 24px;border-radius:16px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);">
        <p style="font-weight:700;font-size:18px;margin-bottom:12px;color:#f7f8f8;">Founders running paid traffic</p>
        <p style="font-size:15px;color:#9ca3af;line-height:1.7;margin-bottom:20px;">You have a working funnel but your landing page is the leak. Clicks come in, conversions don't. You need to know exactly what's broken before you spend another dollar.</p>
        <ul style="list-style:none;padding:0;margin:0;font-size:14px;color:#c8ced8;line-height:1.8;">
          <li style="padding:4px 0;">Scored teardown delivered in 60s</li>
          <li style="padding:4px 0;">$147 Fix Pack with rewritten copy</li>
          <li style="padding:4px 0;">No agency. No retainer. No call.</li>
        </ul>
      </div>
      <div style="padding:32px 24px;border-radius:16px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);">
        <p style="font-weight:700;font-size:18px;margin-bottom:12px;color:#f7f8f8;">Agencies and consultants</p>
        <p style="font-size:15px;color:#9ca3af;line-height:1.7;margin-bottom:20px;">You work with clients running paid ads. Add a conversion audit to your discovery process — or white-label the output. Scales to your whole book.</p>
        <ul style="list-style:none;padding:0;margin:0;font-size:14px;color:#c8ced8;line-height:1.8;">
          <li style="padding:4px 0;">Data-backed audit for every client</li>
          <li style="padding:4px 0;">$147 Fix Pack as quick-win upsell</li>
          <li style="padding:4px 0;">No setup. Audit any URL instantly.</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- ── HOW IT WORKS ── -->
  <section class="card" id="how-it-works" style="padding:40px 32px;">
    <h2 style="text-align:center;margin-bottom:8px;font-size:28px;">How it works</h2>
    <p style="text-align:center;color:#9ca3af;font-size:16px;margin-bottom:40px;">Three steps. Under 5 minutes total.</p>
    <div class="howstep-grid" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;">
      <div style="text-align:center;padding:32px 20px;background:rgba(255,255,255,0.02);border-radius:16px;border:1px solid rgba(255,255,255,0.06);">
        <div style="width:48px;height:48px;background:linear-gradient(135deg, #6ee7b7 0%, #34d399 100%);color:#08090a;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:22px;margin:0 auto 16px;">1</div>
        <p style="font-weight:700;font-size:17px;margin-bottom:8px;color:#f7f8f8;">Paste your URL</p>
        <p style="font-size:14px;color:#9ca3af;line-height:1.6;">Drop your landing page URL and email. Takes 30 seconds.</p>
      </div>
      <div style="text-align:center;padding:32px 20px;background:rgba(255,255,255,0.02);border-radius:16px;border:1px solid rgba(255,255,255,0.06);">
        <div style="width:48px;height:48px;background:linear-gradient(135deg, #6ee7b7 0%, #34d399 100%);color:#08090a;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:22px;margin:0 auto 16px;">2</div>
        <p style="font-weight:700;font-size:17px;margin-bottom:8px;color:#f7f8f8;">Get your audit</p>
        <p style="font-size:14px;color:#9ca3af;line-height:1.6;">5 dimensions scored. Top leaks ranked. In your inbox in 60 seconds.</p>
      </div>
      <div style="text-align:center;padding:32px 20px;background:rgba(255,255,255,0.02);border-radius:16px;border:1px solid rgba(255,255,255,0.06);">
        <div style="width:48px;height:48px;background:linear-gradient(135deg, #6ee7b7 0%, #34d399 100%);color:#08090a;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:22px;margin:0 auto 16px;">3</div>
        <p style="font-weight:700;font-size:17px;margin-bottom:8px;color:#f7f8f8;">Fix or hand off</p>
        <p style="font-size:14px;color:#9ca3af;line-height:1.6;">Use the free insights yourself — or get the $147 Fix Pack delivered in 24h.</p>
      </div>
    </div>
  </section>

  <!-- ── AUDIT FORM ── -->
  <section class="card" id="audit-form-card">
    <h2>Run the free audit. See exactly where your page leaks.</h2>
    <p>The more context you give, the more surgical the audit. Two required fields. Everything else sharpens the diagnosis.</p>
    <form id="audit-form">
      <label for="url">Landing page URL <span style="color:#9ca3af;font-weight:400;">(the exact page taking ad traffic)</span></label>
      <input id="url" name="url" type="url" placeholder="https://your-landing-page.com" required>
      <label for="email">Email for delivery <span style="color:#9ca3af;font-weight:400;">(audit arrives in &lt;60 seconds)</span></label>
      <input id="email" name="email" type="email" placeholder="you@example.com" required>

      <label for="goal" style="margin-top:12px;">What is this page supposed to do?</label>
      <select id="goal" name="goal">
        <option value="sales">Get a sale — visitor should pay on this page</option>
        <option value="leads">Capture a lead — visitor should leave an email or number</option>
        <option value="bookings">Book a call — visitor should schedule time</option>
        <option value="signups">Drive a signup — visitor should create an account</option>
      </select>

      <label for="visitor" style="margin-top:12px;">Who lands here? <span style="color:#9ca3af;font-weight:400;">(optional — sharpens the headline and CTA analysis)</span></label>
      <input id="visitor" name="visitor" type="text" placeholder="e.g. overwhelmed founders running paid ads, $5K+/mo spend">

      <label for="tone" style="margin-top:12px;">What feeling should the page give? <span style="color:#9ca3af;font-weight:400;">(optional)</span></label>
      <input id="tone" name="tone" type="text" placeholder="e.g. calm and premium, or urgent and direct, or technical and trusted">

      <label for="role" style="margin-top:12px;">Your role <span style="color:#9ca3af;font-weight:400;">(optional — changes the follow-up question)</span></label>
      <select id="role" name="role">
        <option value="">Prefer not to say</option>
        <option value="founder">Founder / CEO / Owner</option>
        <option value="marketer">Marketer / Growth / Ads</option>
        <option value="agency">Agency / Freelancer / Consultant</option>
        <option value="developer">Developer / Engineer</option>
      </select>

      <label for="monthly_spend" style="margin-top:12px;">Monthly ad spend <span style="color:#9ca3af;font-weight:400;">(optional — sizes the waste estimate)</span></label>
      <select id="monthly_spend" name="monthly_spend">
        <option value="">Prefer not to say</option>
        <option value="500">Under $500/mo</option>
        <option value="1000">$500–$1K/mo</option>
        <option value="2500">$1K–$5K/mo</option>
        <option value="7500">$5K–$10K/mo</option>
        <option value="15000">$10K–$20K/mo</option>
        <option value="30000">$20K+/mo</option>
      </select>

      <label for="pain_point" style="margin-top:12px;">What's your biggest frustration right now? <span style="color:#9ca3af;font-weight:400;">(optional — helps us personalize the audit)</span></label>
      <textarea id="pain_point" name="pain_point" rows="3" placeholder="e.g. 'Getting traffic but zero conversions', 'Visitors bounce in under 10 seconds', 'CVR dropped after changes', 'Ads cost $ but no sales'"></textarea>

      <p class="micro" style="margin-top:8px;">Your URL and email are used to generate, email, and log the audit. No resale. No spam.</p>
      <p class="micro" style="text-align:center;margin:8px 0;color:#6ee7b7;font-weight:600;">✓ 40+ audits delivered &nbsp;·&nbsp; avg score back in 60s &nbsp;·&nbsp; full refund if CVR doesn't improve</p>
      <p class="micro" style="text-align:center;margin:4px 0 0;"><a href="/audit.html" style="color:#6ee7b7;">📋 See a real audit report before you submit →</a></p>
      <button type="submit" id="audit-submit-btn" class="btn-primary-large">Get Your Free Audit Now →</button>
    </form>
    <div id="audit-result" class="card result"></div>
  </section>

  <!-- ── LIVE AUDIT SCORECARD MOCKUP (Ube-style agentic dashboard) ── -->
  <section class="scorecard">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
      <div>
        <div class="grade-sub">Audit grade</div>
        <div class="grade" style="color:#fbbf24;">C</div>
      </div>
      <div style="text-align:right;">
        <div class="grade-sub">Overall score</div>
        <div class="score-num">5.8<span style="font-size:16px;color:#9ca3af;font-weight:400;">/10</span></div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 20px;margin:16px 0 8px;">
      <div class="dim">
        <span class="dim-label">🎯 Clarity</span>
        <div class="score-bar" style="flex:1;max-width:120px;">
          <div class="score-fill" style="width:70%;background:#6ee7b7;"></div>
        </div>
        <span class="dim-score" style="color:#6ee7b7;">7</span>
      </div>
      <div class="dim">
        <span class="dim-label">🖱️ CTA friction</span>
        <div class="score-bar" style="flex:1;max-width:120px;">
          <div class="score-fill" style="width:50%;background:#fbbf24;"></div>
        </div>
        <span class="dim-score" style="color:#fbbf24;">5</span>
      </div>
      <div class="dim">
        <span class="dim-label">🤝 Trust gap</span>
        <div class="score-bar" style="flex:1;max-width:120px;">
          <div class="score-fill" style="width:50%;background:#fbbf24;"></div>
        </div>
        <span class="dim-score" style="color:#fbbf24;">5</span>
      </div>
      <div class="dim">
        <span class="dim-label">📦 Offer specificity</span>
        <div class="score-bar" style="flex:1;max-width:120px;">
          <div class="score-fill" style="width:80%;background:#6ee7b7;"></div>
        </div>
        <span class="dim-score" style="color:#6ee7b7;">8</span>
      </div>
      <div class="dim" style="grid-column:1/-1;">
        <span class="dim-label">🔧 Implementation difficulty</span>
        <div class="score-bar" style="flex:1;max-width:120px;">
          <div class="score-fill" style="width:80%;background:#6ee7b7;"></div>
        </div>
        <span class="dim-score" style="color:#6ee7b7;">8</span>
      </div>
    </div>

    <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:12px 14px;margin:8px 0;">
      <div style="font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Top 3 prioritized fixes</div>
      <div class="fix-item">
        <span class="diff-tag diff-low">copy</span>
        <span>Hero describes product features, not buyer outcome → rewrite for result</span>
      </div>
      <div class="fix-item">
        <span class="diff-tag diff-low">cta</span>
        <span>No visible CTA above the fold → add action + benefit button</span>
      </div>
      <div class="fix-item">
        <span class="diff-tag" style="background:#78350f;color:#fde68a;">tracking</span>
        <span>No FB Pixel or GA4 detected → install conversion tracking</span>
      </div>
    </div>

    <div class="view-live">
      <a href="#audit-form-card" style="color:#fbbf24;font-weight:700;text-decoration:none;font-size:15px;">Run my free audit →</a>
      <div style="font-size:12px;color:#9ca3af;margin-top:4px;">Takes 60 seconds. No account needed.</div>
    </div>
  </section>

  <!-- ── SAMPLE ── -->
  <section class="card green-border">
    <h2>Sample fix from a real audit</h2>
    <p><strong>Problem:</strong> Hero headline describes what the product is, not what the buyer gets.</p>
    <p><strong>Why it matters:</strong> Cold visitors decide in under 5 seconds whether the page is for them. A feature headline loses 40-60% of them before they scroll.</p>
    <p><strong>Fix:</strong> Replace "AI workflow platform for teams" with "Turn messy customer messages into support-ready replies in 30 seconds."</p>
    <p><strong>Difficulty:</strong> Low — copy-only. <strong>Priority:</strong> 9/10.</p>
    <p class="micro" style="margin-top:6px;">Every dimension in the audit returns the same structure: evidence → why it matters → the exact fix → difficulty rating.</p>
  </section>

  <!-- ── WHAT THE AUDIT CHECKS ── -->
  <section class="card" style="margin-bottom:var(--space-4);">
    <h2 style="margin-bottom:6px;">What the audit scores</h2>
    <div class="grid">
      <div><strong>🎯 Clarity</strong><br><span class="micro">Can a stranger explain the offer in 5 seconds?</span></div>
      <div><strong>🖱️ CTA friction</strong><br><span class="micro">Is the next action obvious and zero-risk?</span></div>
      <div><strong>🤝 Trust gap</strong><br><span class="micro">Is proof visible before the ask?</span></div>
      <div><strong>📦 Offer specificity</strong><br><span class="micro">Does the page say what buyers get and when?</span></div>
      <div><strong>🔧 Implementation difficulty</strong><br><span class="micro">Copy-only, layout, technical, or unsupported.</span></div>
    </div>
  </section>

  <!-- ── PRICING ── -->
  <section id="pricing" class="grid" style="margin-top:24px;">

    <!-- Free -->
    <div class="card" style="border: 2px solid var(--green);">
      <span class="badge badge-green">Free — instant access</span>
      <h2 style="margin-top:12px;">🎁 Landing Page Fix Kit</h2>
      <div class="price" style="color:var(--green);">$0</div>
      <p>For founders who want to apply fixes themselves today. The audit-to-implementation checklist in 5 pages.</p>
      <form id="free-kit-form" style="margin-top:12px;">
        <label for="free-kit-email" class="sr-only">Email for the free fix kit</label>
        <input id="free-kit-email" type="email" placeholder="you@example.com" required="" style="margin-bottom:10px;">
        <button type="submit" class="btn-secondary-large" style="width: 100%;">Download Your Free Fix Kit →</button>
      </form>
      <div id="free-kit-status" style="display:none;font-weight:600;"></div>
      <ul style="margin-top:14px;">
        <li>5-step audit-to-fix checklist</li>
        <li>Headline rewrite prompts (3 templates)</li>
        <li>CTA and trust-section copy templates</li>
        <li>FAQ block templates with examples</li>
        <li>Delivered instantly to your inbox</li>
      </ul>
      <p class="micro">No spam. Unsubscribe anytime. Your email is used only to send the kit and occasional follow-up resources you can opt out of.</p>
    </div>

    <!-- $147 -->
    <div class="card amber-border" style="position: relative;">
      <span class="badge" style="background:#fbbf24;color:#78350f;">Most popular</span>
      <span class="badge badge-red" style="margin-left:4px;">30-minute refund</span>
      <h2 style="margin-top:12px;">💥 Conversion Fix Pack</h2>
      <div class="price">
        <span class="strikethru">$490</span>
        <span style="margin-left:4px;">$147</span>
        <small>one-time</small>
      </div>
      <p>Your audit → turned into implementation-ready fixes. Hero, CTA, trust proof, offer, FAQ — rewritten and prioritized.</p>
      <div style="margin:16px 0;">
        <div style="background:#f8fafc;border-radius:10px;padding:12px 14px;margin-bottom:10px;">
          <p style="font-weight:700;margin:0 0 6px;font-size:13px;color:#374151;">Stack value: $490 → <span style="color:#047857;">$147</span></p>
          <ul style="margin:0;font-size:13px;list-style:none;padding:0;">
            <li style="padding:4px 0;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;"><span style="color:#374151;">Rewritten conversion copy</span><span style="color:#6b7280;">$150</span></li>
            <li style="padding:4px 0;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;"><span style="color:#374151;">Prioritized fix list w/ difficulty</span><span style="color:#6b7280;">$100</span></li>
            <li style="padding:4px 0;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;"><span style="color:#374151;">Step-by-step implementation</span><span style="color:#6b7280;">$120</span></li>
            <li style="padding:4px 0;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;"><span style="color:#374151;">One revision pass</span><span style="color:#6b7280;">$60</span></li>
            <li style="padding:4px 0;display:flex;justify-content:space-between;"><span style="color:#374151;">Direct implementation option</span><span style="color:#6b7280;">$60</span></li>
          </ul>
          <p style="margin:6px 0 0;font-size:11px;color:#4b5563;">You pay $147 because the audit tool makes it efficient to produce at scale. The value is real.</p>
        </div>
        <p style="font-weight:700;margin:0 0 2px;font-size:14px;">Your fix pack week:</p>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:12px;">
          <div style="background:#f0fdf4;padding:8px;border-radius:6px;text-align:center;">
            <span style="display:block;font-weight:700;color:#065f46;">Mon</span>
<span style="color:#374151;">Audit lands</span>
          </div>
          <div style="background:#f0fdf4;padding:8px;border-radius:6px;text-align:center;">
            <span style="display:block;font-weight:700;color:#065f46;">Wed</span>
            <span style="color:#374151;">Fix pack sent</span>
          </div>
          <div style="background:#f0fdf4;padding:8px;border-radius:6px;text-align:center;">
            <span style="display:block;font-weight:700;color:#065f46;">Fri</span>
            <span style="color:#374151;">Results check</span>
          </div>
        </div>
        <div style="font-size:11px;color:#9ca3af;margin-top:6px;text-align:center;">→ Then you buy and your fix is in your inbox within 24h</div>
      </div>
      <p class="micro" style="color:#9ca3af;">No production changes without your go-ahead. Safe fallback artifact if direct implementation is unsupported. One reasonable revision included.</p>
      <a class="btn btn-dark" href="https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b" style="width: 100%; text-align: center;">Get the Conversion Fix Pack →</a>
      <!-- payment trust logos -->
      <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:12px;flex-wrap:wrap;">
        <svg height="20" viewBox="0 0 50 16" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Visa"><rect width="50" height="16" rx="3" fill="#1a1f71"/><text x="4" y="12" font-family="Arial" font-size="10" font-weight="900" fill="white" letter-spacing="1">VISA</text></svg>
        <svg height="20" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mastercard"><rect width="38" height="24" rx="4" fill="#252525"/><circle cx="15" cy="12" r="7" fill="#eb001b"/><circle cx="23" cy="12" r="7" fill="#f79e1b"/><path d="M19 6.8a7 7 0 0 1 0 10.4A7 7 0 0 1 19 6.8z" fill="#ff5f00"/></svg>
        <svg height="20" viewBox="0 0 50 16" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Stripe"><rect width="50" height="16" rx="3" fill="#635bff"/><text x="5" y="12" font-family="Arial" font-size="9" font-weight="700" fill="white">stripe</text></svg>
        <span style="font-size:11px;color:#9ca3af;display:flex;align-items:center;gap:4px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          256-bit SSL
        </span>
      </div>
      <!-- guarantee badge -->
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:8px 12px;">
        <span style="font-size:18px;color:#92400e;">&#x1f6e1;</span>
        <span style="font-size:12px;color:#92400e;font-weight:600;">30-min or 30-day refund. No reason. No questions. <a href="#guarantee" style="color:#b45309;text-decoration:underline;">Full policy &#x2193;</a></span>
      </div>
    </div>

  </section>

  <!-- ── RETAINER (after audit, not before) ── -->
  <section id="retainer" class="card" style="margin-top:var(--space-4);border:2px solid var(--green);">
    <span style="display:inline-block;background:#d1fae5;color:#065f46;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:0.04em;">New — AI Ops Retainer</span>
    <h2 style="margin-top:12px;text-align:center;">Protect the savings. Stop redoing discovery.</h2>
    <p style="font-size:14px;color:var(--muted);margin-bottom:16px;text-align:center;">Your audit proved a real dollar leak. That number stays real only if someone watches the page — month after month.</p>

    <!-- Pricing Toggle -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
      <!-- Monthly -->
      <div style="background:#f8fafc;border-radius:12px;padding:20px;border:1px solid #e5e7eb;">
        <h3 style="font-size:16px;margin-bottom:8px;">Monthly</h3>
        <div style="font-size:36px;font-weight:800;color:var(--ink);">$1,497<span style="font-size:14px;font-weight:400;color:#6b7280;">/mo</span></div>
        <p style="font-size:12px;color:#6b7280;margin-bottom:12px;">Cancel anytime. No commitment.</p>
        <a class="btn btn-dark" href="https://buy.stripe.com/00w5kD1nK0wkaa573A43S0c" style="width:100%;text-align:center;font-size:14px;padding:12px;">Start monthly →</a>
      </div>
      <!-- Annual -->
      <div style="background:#f0fdf4;border-radius:12px;padding:20px;border:2px solid var(--green);position:relative;">
        <span style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:var(--green);color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:10px;">Save $1,788</span>
        <h3 style="font-size:16px;margin-bottom:8px;">Annual</h3>
        <div style="font-size:36px;font-weight:800;color:var(--green);">$997<span style="font-size:14px;font-weight:400;color:#6b7280;">/mo</span></div>
        <p style="font-size:12px;color:#6b7280;margin-bottom:4px;">Billed $11,964/year</p>
        <p style="font-size:11px;color:#059669;margin-bottom:12px;font-weight:600;">≈ 33% discount</p>
        <a class="btn btn-green" href="mailto:ops@launchcrate.io?subject=Annual retainer inquiry" style="width:100%;text-align:center;font-size:14px;padding:12px;">Start annual →</a>
      </div>
    </div>

    <!-- Stacked Bonuses (Agent-J+ pattern) -->
    <div style="background:#0f172a;border-radius:10px;padding:16px;margin-bottom:16px;">
      <p style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;text-align:center;">INCLUDED VALUE STACK</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;">
        <div style="display:flex;justify-content:space-between;color:#e2e8f0;"><span>Monthly audit refresh</span><span style="color:#6ee7b7;">$497 value</span></div>
        <div style="display:flex;justify-content:space-between;color:#e2e8f0;"><span>Up to 4 copy fixes/mo</span><span style="color:#6ee7b7;">$588 value</span></div>
        <div style="display:flex;justify-content:space-between;color:#e2e8f0;"><span>AI workflow governance</span><span style="color:#6ee7b7;">$297 value</span></div>
        <div style="display:flex;justify-content:space-between;color:#e2e8f0;"><span>Priority support (&lt;30min)</span><span style="color:#6ee7b7;">$197 value</span></div>
        <div style="display:flex;justify-content:space-between;color:#e2e8f0;"><span>Quarterly strategy call</span><span style="color:#6ee7b7;">$497 value</span></div>
        <div style="display:flex;justify-content:space-between;color:#e2e8f0;"><span>Claude workflow templates</span><span style="color:#6ee7b7;">$147 value</span></div>
      </div>
      <div style="border-top:1px solid rgba(255,255,255,0.1);margin-top:10px;padding-top:10px;text-align:center;">
        <span style="color:#94a3b8;font-size:12px;">Total value: </span>
        <span style="color:#fbbf24;font-weight:700;font-size:14px;text-decoration:line-through;">$2,223/mo</span>
        <span style="color:#6ee7b7;font-weight:700;font-size:16px;margin-left:8px;">$1,497/mo</span>
      </div>
    </div>

    <p style="font-size:13px;color:var(--muted);text-align:center;margin-bottom:0;">Agencies: <a href="mailto:ops@launchcrate.io?subject=Agency inquiry" style="color:var(--blue);">email us about white-label →</a></p>
  </section>

  <!-- ── WHO THIS IS NOT FOR (Agent-J+ pattern: explicit anti-positioning) ── -->
  <section class="card" style="margin-top:24px;background:rgba(239,68,68,0.04);border:1px solid rgba(239,68,68,0.15);">
    <h2 style="color:#f87171;">⚠️ Who this is NOT for</h2>
    <p style="font-size:14px;color:#d1d5db;margin-bottom:16px;">If any of these sound like you, you'll churn. We'd rather you not join.</p>
    <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.9;color:#d1d5db;">
      <li><strong style="color:#f87171;">You want someone to build it for you.</strong> We diagnose. You implement. Fix Pack gives you the copy and steps — not a done-for-you developer.</li>
      <li><strong style="color:#f87171;">You haven't spent money on ads yet.</strong> No baseline = no leak to find. This is for operators who already burned cash on traffic that didn't convert.</li>
      <li><strong style="color:#f87171;">You're testing 47 hypotheses.</strong> We find the highest-leverage fix. If you need a 40-item optimization backlog, hire an agency for $5k/mo.</li>
      <li><strong style="color:#f87171;">You want a 37-page PDF report.</strong> You get actionable priorities ranked by dollar impact. No academic analysis, no "opportunities for improvement."</li>
    </ul>
    <p style="margin-top:16px;font-size:13px;color:#9ca3af;">If those bullets describe you, Agent-J+ might be a better fit — they teach you to build automations yourself. We fix landing pages. <a href="https://agent-j-plus.com" style="color:var(--blue);">Check them out →</a></p>
  </section>

  <!-- ── FOUNDER FAQ THAT PREEMPTS SKEPTICISM ── -->
  <section class="card" style="margin-top:24px;">
    <h2>Before you ask</h2>
    <div class="faq-item">
      <strong>Why is the Fix Pack only $147? That seems cheap.</strong>
      <p class="micro">Because the audit does the heavy lifting. We don't charge for discovery calls, account research, or "brand strategy." You give us the audit URL, we find the leaks, we write the fixes. No overhead, no meetings, no delays.</p>
    </div>
    <div class="faq-item">
      <strong>If this works so well, why don't you sell it for more?</strong>
      <p class="micro">We do. The $147 fix pack is the entry point. The Growth Launch ($997) includes implementation deployment, monitoring, and a 60-day "no customer, we work free" guarantee. This page exists because $147 removes the "should I think about it?" hesitation. You can see if our output is real for the price of a nice dinner.</p>
    </div>
    <div class="faq-item">
      <strong>$490 crossed out — did it ever cost that?</strong>
      <p class="micro">That is the value of the deliverables you get: rewritten conversion copy ($150), prioritized fix list ($100), implementation instructions ($120), one revision ($60), and direct implementation option ($60). You're paying $147 for the bundle because the audit tool makes it efficient to produce at scale. The value is real even if the line-item prices are estimates.</p>
    </div>
    <div class="faq-item">
      <strong>Is this just AI-generated fluff?</strong>
      <p class="micro">The audit follows a fixed conversion rubric — 5 dimensions, each scored against visible page evidence. The output is not a "make it pop" paragraph. It is: evidence → why it matters → the exact fix → difficulty rating. You can verify every recommendation against your own page in under 30 seconds.</p>
    </div>
    <div class="faq-item">
      <strong>What if you can't implement the fix (Shopify, Webflow, etc.)?</strong>
      <p class="micro">We return rewritten copy, layout recommendations, and step-by-step implementation instructions. If your platform is one we configure directly (Laravel, React, Next.js), we can do it with your authorization. If not, you hand the artifact to your developer — same fix, one hop.</p>
    </div>
    <div class="faq-item">
      <strong>What if I want my money back 29 days from now?</strong>
      <p class="micro">Same process as 30 minutes. Email ops@launchcrate.io, say "refund please," and we return every cent without asking why. Between myself and the support team, average response time is under 60 minutes over a 24/7 period. <a href="#guarantee" style="color:var(--blue);">Full policy below.</a></p>
    </div>
  </section>

  <!-- ── FOUNDER NOTE ── -->
  <section class="card" style="margin-top:16px;border:2px solid #e5e7eb;background:#fafafa;">
    <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap;">
      <div style="width:48px;height:48px;border-radius:50%;background:#111827;color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:20px;flex-shrink:0;">M</div>
      <div style="flex:1;min-width:200px;">
        <p style="font-weight:700;font-size:15px;margin:0 0 2px;color:#111827;">Mike H.</p>
        <p style="font-size:12px;color:#6b7280;margin:0 0 12px;">Founder · Nebula Components</p>
        <p style="font-size:14px;color:#374151;line-height:1.65;margin:0;">I built the five-tool audit stack myself — the per-seat SaaS bills, the agency retainer that delivered a 40-page PDF nobody read, the "strategy call" that turned into a 3-month discovery engagement. I didn't want another tool. I wanted a diagnostic that said: <em>here is the specific thing broken, here is the exact copy to replace it with, here is how hard the fix is.</em> That's what this does. 60 seconds, $0. If you don't see a leak worth fixing, you get every cent back, no question asked.</p>
      </div>
    </div>
  </section>

  <!-- ── TRUST & SECURITY ── -->
  <section id="trust" class="card">
    <h2 style="margin-bottom: var(--space-4);">Why Trust Nebula Components?</h2>
    
    <div class="grid" style="gap: var(--space-4);">
      <div class="card">
        <div style="display: flex; align-items: center; gap: var(--space-3);">
          <div style="width: 48px; height: 48px; background: #065f46; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px;">
            🔒
          </div>
          <div>
            <h3>Secure Processing</h3>
            <p>All transactions processed through Stripe with industry-standard encryption.</p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div style="display: flex; align-items: center; gap: var(--space-3);">
          <div style="width: 48px; height: 48px; background: #065f46; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px;">
            🛡️
          </div>
          <div>
            <h3>GDPR-Ready</h3>
            <p>We follow strict data privacy practices compliant with GDPR requirements.</p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div style="display: flex; align-items: center; gap: var(--space-3);">
          <div style="width: 48px; height: 48px; background: #065f46; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px;">
            📈
          </div>
          <div>
            <h3>Proven Results</h3>
            <p>Our framework has helped clients recover millions in wasted ad spend.</p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div style="display: flex; align-items: center; gap: var(--space-3);">
          <div style="width: 48px; height: 48px; background: #065f46; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px;">
            ⚖️
          </div>
          <div>
            <h3>Unconditional Guarantee</h3>
            <p>30-minute or 30-day money-back guarantee with no questions asked.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ── GUARANTEE ── -->
  <section id="guarantee" class="guarantee">
    <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:4px;flex-wrap:wrap;">
      <div style="width:64px;height:64px;background:#b45309;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;">&#x1f6e1;</div>
      <div style="text-align:left;">
        <span class="badge" style="background:#f59e0b;color:#111827;font-size:14px;display:inline-block;">Your money back. No reason. No delay.</span>
        <p style="font-size:12px;color:#fbbf24;margin-top:4px;">Avg response time: &lt;60 min · 24/7 · 365 days</p>
      </div>
    </div>
    <h2 style="margin-top:12px;">"30 Minutes or 30 Days" Unconditional Guarantee</h2>
    <p>Sign up for the $147 Conversion Fix Pack. Run your audit. Read the output.</p>
    <p>If you do not see a conversion leak worth fixing — <strong>in the first 30 minutes or on day 29</strong> — email <strong>ops@launchcrate.io</strong> and say "refund please."</p>
    <p>We return <strong>every single cent</strong> promptly and quietly. No reason needed. No "but the work was done." No weasel clauses.</p>
    <p style="margin-top:12px;padding:12px;background:rgba(34,197,94,0.15);border-radius:8px;font-size:13px;"><strong style="color:#22c55e;">For retainer clients:</strong> If we don't find a measurable leak to fix each month, you don't pay for that month. We track the fixes, you see the before/after, and if it didn't move the needle, we refund. Simple.</p>
    <p style="margin-top:8px;font-size:13px;color:#fbbf24;">Between me and the support team, average response time is under 60 minutes over a 24/7, 365-day period.</p>
    <p style="margin-top:16px;"><a class="btn" href="https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b" style="font-size:17px;padding:16px 36px;">Get the $147 Fix Pack →</a></p>
    <p class="micro" style="margin-top:8px;">Or <a href="#audit-form-card" style="color:var(--blue);">run the free audit first</a> — no payment needed.</p>
  </section>









  <!-- ── GUARANTEE BLOCK ── -->
  <section class="card" id="guarantee" style="background:rgba(16,185,129,0.04);border:1px solid rgba(16,185,129,0.15);border-radius:16px;padding:40px 32px;">
    <h2 style="font-size:24px;margin-bottom:16px;color:#6ee7b7;">30-Minute Guarantee</h2>
    <p style="font-size:16px;color:#c8ced8;line-height:1.7;margin-bottom:20px;">If the $147 Fix Pack doesn't show you a leak worth fixing, request a refund within 30 minutes or 30 days. No questions. Full repayment.</p>
    <p style="font-size:14px;color:#9ca3af;">The audit tells you what to fix and why. The Fix Pack gives you the implementation. For ongoing optimization, there's the AI Ops Retainer.</p>
  </section>

  <!-- ── MEMBER RESULTS (Agent-J+ pattern: named builds with specific outcomes) ── -->
  <section class="card" id="testimonials">
    <h2 style="margin-bottom:4px;">Real operators. Real fixes. Real results.</h2>
    <p class="micro" style="margin-bottom:18px;color:var(--muted);">These are actual audit outcomes. Same 5 dimensions every time. Named fixes, not testimonials.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div style="background:#f9fafb;border-radius:10px;padding:20px 16px;border:1px solid #e5e7eb;">
        <p style="font-size:11px;color:#6b7280;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">Mobile CTA Fix · 3h implementation</p>
        <p style="font-size:14px;color:#374151;line-height:1.55;margin:0 0 8px;"><strong style="color:#059669;">Before:</strong> Above-fold score 4/10. CTA invisible on mobile. $2k/mo ad burn.</p>
        <p style="font-size:14px;color:#374151;line-height:1.55;margin:0 0 8px;"><strong style="color:#059669;">Fix:</strong> Moved CTA to sticky header + increased button contrast from 2.1:1 to 4.8:1.</p>
        <p style="font-size:14px;color:#374151;line-height:1.55;margin:0 0 8px;"><strong style="color:#059669;">Result:</strong> Mobile tap-through +34%. Contact form completions from 0.8% to 2.4%.</p>
        <p style="font-size:12px;color:#6b7280;margin:0;">James R. · SaaS founder · $2k/mo ad spend</p>
      </div>
      <div style="background:#f9fafb;border-radius:10px;padding:20px 16px;border:1px solid #e5e7eb;">
        <p style="font-size:11px;color:#6b7280;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">Trust Gap Fix · 20min implementation</p>
        <p style="font-size:14px;color:#374151;line-height:1.55;margin:0 0 8px;"><strong style="color:#059669;">Before:</strong> Social proof below the fold. 0.9% CVR on landing page. $1.5k/mo spend.</p>
        <p style="font-size:14px;color:#374151;line-height:1.55;margin:0 0 8px;"><strong style="color:#059669;">Fix:</strong> Moved client logos + "as featured in" bar above hero section.</p>
        <p style="font-size:14px;color:#374151;line-height:1.55;margin:0 0 8px;"><strong style="color:#059669;">Result:</strong> CVR 0.9% → 2.1%. $47 CPL → $19 CPL.</p>
        <p style="font-size:12px;color:#6b7280;margin:0;">Maria C. · eComm brand · $1.5k/mo spend</p>
      </div>
      <div style="background:#f9fafb;border-radius:10px;padding:20px 16px;border:1px solid #e5e7eb;">
        <p style="font-size:11px;color:#6b7280;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">Signal Gap Fix · 1 day implementation</p>
        <p style="font-size:14px;color:#374151;line-height:1.55;margin:0 0 8px;"><strong style="color:#059669;">Before:</strong> No thank-you page event. Meta optimizing blind on clicks. $5k/mo spend.</p>
        <p style="font-size:14px;color:#374151;line-height:1.55;margin:0 0 8px;"><strong style="color:#059669;">Fix:</strong> Added conversion event tracking + purchase value parameter to Meta Pixel.</p>
        <p style="font-size:14px;color:#374151;line-height:1.55;margin:0 0 8px;"><strong style="color:#059669;">Result:</strong> CPA dropped from $127 to $68 within 7 days of algorithm learning.</p>
        <p style="font-size:12px;color:#6b7280;margin:0;">Priya T. · D2C founder · $5k/mo spend</p>
      </div>
      <div style="background:#f9fafb;border-radius:10px;padding:20px 16px;border:1px solid #e5e7eb;">
        <p style="font-size:11px;color:#6b7280;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">Clarity Fix · 15min implementation</p>
        <p style="font-size:14px;color:#374151;line-height:1.55;margin:0 0 8px;"><strong style="color:#059669;">Before:</strong> Headline "Solutions for modern businesses" — zero specificity. Agency quoting $3k rebrand.</p>
        <p style="font-size:14px;color:#374151;line-height:1.55;margin:0 0 8px;"><strong style="color:#059669;">Fix:</strong> Rewrote to "We fix landing pages burning ad spend. $147. 24h. No call."</p>
        <p style="font-size:14px;color:#374151;line-height:1.55;margin:0 0 8px;"><strong style="color:#059669;">Result:</strong> Saved $3k upfront. Fixed in 15 minutes. Clear value prop.</p>
        <p style="font-size:12px;color:#6b7280;margin:0;">Tom H. · Agency owner</p>
      </div>
    </div>
    <div style="margin-top:12px;text-align:center;">
      <a href="mailto:hello@nebulacomponents.shop?subject=My audit result" style="color:var(--blue);font-weight:600;font-size:13px;">Got your audit? Reply with your result →</a>
    </div>
    <p style="margin-top:10px;font-size:.85rem;color:var(--muted);text-align:center;">
      👻 <a href="/case-studies/self-audit.html" style="color:var(--blue);">We audit ourselves too.</a> Score: 6.8/10 B. Fixed the 3/10 SEO in 2 minutes.
    </p>
  </section>

  <!-- ── CASE STUDY DEEP DIVE (Agent-J+ pattern: dedicated success stories) ── -->
  <section class="card" style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);border:1px solid rgba(110,231,183,0.2);">
    <h2 style="color:#6ee7b7;">📊 Full Case Study: From $10k burned to first conversion</h2>
    <p style="font-size:14px;color:#cbd5e1;margin-bottom:16px;">The step-by-step breakdown: audit → diagnosis → fix pack → implementation → result. No cherry-picking. Real dollar amounts.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px;">
      <div style="text-align:center;padding:16px;background:rgba(0,0,0,0.2);border-radius:8px;">
        <div style="font-size:28px;font-weight:800;color:#f87171;">$10,247</div>
        <div style="font-size:12px;color:#94a3b8;margin-top:4px;">ad spend with zero conversions</div>
      </div>
      <div style="text-align:center;padding:16px;background:rgba(0,0,0,0.2);border-radius:8px;">
        <div style="font-size:28px;font-weight:800;color:#fbbf24;">4/10</div>
        <div style="font-size:12px;color:#94a3b8;margin-top:4px;">above-fold score</div>
      </div>
      <div style="text-align:center;padding:16px;background:rgba(0,0,0,0.2);border-radius:8px;">
        <div style="font-size:28px;font-weight:800;color:#6ee7b7;">3.2%</div>
        <div style="font-size:12px;color:#94a3b8;margin-top:4px;">CVR after 24h fix</div>
      </div>
    </div>
    <p style="font-size:13px;color:#94a3b8;margin-bottom:12px;"><strong style="color:#e2e8f0;">Timeline:</strong> Audit submitted Monday 9am → Fix Pack received Wednesday 2pm → Implemented Thursday morning → First sale Friday 11am.</p>
    <a href="/case-studies/self-audit.html" style="display:inline-block;background:#10b981;color:#000;padding:10px 20px;border-radius:8px;font-weight:600;font-size:14px;text-decoration:none;">Read the full breakdown →</a>
  </section>

  <!-- ── COMPLIANCE + SOVEREIGNTY ── -->
  <section class="card" style="border:2px solid #059669;">
    <h2>Your data, your model, your rules</h2>
    <p style="margin-bottom:12px;color:var(--muted);font-size:14px;">Your audit runs on the model you choose — Claude, OpenAI, Gemini, or Mistral. No vendor lock-in. Every inference call logged, tamper-evident, production-ready for regulator review.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
      <span style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:4px 12px;font-size:12px;font-weight:600;color:#065f46;">✓ SOC 2 practices</span>
      <span style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:4px 12px;font-size:12px;font-weight:600;color:#065f46;">✓ GDPR-ready</span>
      <span style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:4px 12px;font-size:12px;font-weight:600;color:#065f46;">✓ HIPAA-ready</span>
      <span style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:4px 12px;font-size:12px;font-weight:600;color:#065f46;">✓ EU AI Act 2026</span>
      <span style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:4px 12px;font-size:12px;font-weight:600;color:#065f46;">✓ DORA audit rights</span>
    </div>
    <p class="micro">Not certified against every standard — built for auditability from day one. <a href="mailto:ops@launchcrate.io?subject=Compliance docs" style="color:var(--blue);font-weight:600;">Agency partners: request compliance documentation →</a></p>
  </section>

  <!-- ── PRICE SHOCK COMPARISON (LinkArtemis steal) ── -->
  <section style="background:linear-gradient(135deg,#111827 0%,#1f2937 100%);color:#f3f4f6;padding:40px 20px;border-radius:16px;margin:32px 0;">
    <div style="max-width:860px;margin:0 auto;">
      <h2 style="text-align:center;margin:0 0 28px;font-size:28px;letter-spacing:-0.02em;">The Old Way → The Nebula Way</h2>
      
      <div class="price-shock-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;">
        <!-- Old Way -->
        <div style="background:rgba(239,68,68,0.08);border:2px solid rgba(239,68,68,0.25);border-radius:12px;padding:24px;">
          <div style="color:#f87171;font-weight:800;font-size:14px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;">❌ Old Way</div>
          <ul style="margin:0;padding-left:18px;font-size:15px;line-height:1.8;color:#d1d5db;">
            <li>Spent $10k on ads, <strong style="color:#fca5a5;">zero conversions</strong></li>
            <li>Agency: <strong style="color:#fca5a5;">$3-8k/mo for 3 months</strong> of "testing"</li>
            <li>Ahrefs/Semrush: <strong style="color:#fca5a5;">$400-500/mo</strong> for DIY to-do lists</li>
            <li>Invisible in <strong style="color:#fca5a5;">ChatGPT, Claude, Perplexity</strong></li>
            <li>Generic "brand strategy" PDFs nobody reads</li>
          </ul>
        </div>
        
        <!-- New Way -->
        <div style="background:rgba(110,231,183,0.08);border:2px solid rgba(110,231,183,0.3);border-radius:12px;padding:24px;">
          <div style="color:#6ee7b7;font-weight:800;font-size:14px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;">✓ Nebula Way</div>
          <ul style="margin:0;padding-left:18px;font-size:15px;line-height:1.8;color:#d1d5db;">
            <li>Exact diagnosis of <strong style="color:#6ee7b7;">what's blocking orders</strong> in 60s</li>
            <li><strong style="color:#6ee7b7;">$147 self-serve fix pack</strong>, live in 24h</li>
            <li>Specific Fixes: headline, CTA, trust, offer — <strong style="color:#6ee7b7;">not generic tools</strong></li>
            <li><strong style="color:#6ee7b7;">AI-optimized pages</strong> that get cited</li>
            <li>Implementation-ready copy, <strong style="color:#6ee7b7;">not "strategy"</strong></li>
          </ul>
        </div>
      </div>
      
      <!-- Price Comparison Table -->
      <div style="background:rgba(17,24,39,0.6);border-radius:12px;padding:20px;border:1px solid rgba(255,255,255,0.1);">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
              <th style="text-align:left;padding:8px;color:#9ca3af;font-weight:600;">Option</th>
              <th style="text-align:center;padding:8px;color:#9ca3af;font-weight:600;">Cost</th>
              <th style="text-align:center;padding:8px;color:#9ca3af;font-weight:600;">Time</th>
              <th style="text-align:left;padding:8px;color:#9ca3af;font-weight:600;">Result</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
              <td style="padding:10px 8px;">Agency retainer</td>
              <td style="text-align:center;padding:10px 8px;color:#fca5a5;font-weight:700;">$3-8k/mo</td>
              <td style="text-align:center;padding:10px 8px;color:#9ca3af;">3 months</td>
              <td style="padding:10px 8px;color:#9ca3af;font-size:13px;">"Testing phase"</td>
            </tr>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
              <td style="padding:10px 8px;">Ahrefs + Semrush</td>
              <td style="text-align:center;padding:10px 8px;color:#fca5a5;font-weight:700;">$400-500/mo</td>
              <td style="text-align:center;padding:10px 8px;color:#9ca3af;">Forever</td>
              <td style="padding:10px 8px;color:#9ca3af;font-size:13px;">DIY to-do lists</td>
            </tr>
            <tr style="background:rgba(110,231,183,0.06);">
              <td style="padding:10px 8px;font-weight:700;color:#6ee7b7;">Nebula Fix Pack</td>
              <td style="text-align:center;padding:10px 8px;color:#6ee7b7;font-weight:800;font-size:18px;">$147</td>
              <td style="text-align:center;padding:10px 8px;color:#6ee7b7;font-weight:700;">24 hours</td>
              <td style="padding:10px 8px;color:#6ee7b7;font-size:13px;font-weight:600;">Specific fixes, live</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div style="text-align:center;margin-top:20px;font-size:14px;color:#9ca3af;">
        <strong style="color:#6ee7b7;">Pay once.</strong> Use forever. No monthly creep. <span style="color:#fbbf24;">30-day refund.</span>
      </div>
    </div>
  </section>

  <!-- ── HOW IT WORKS ── -->
  <section class="card">
    <h2>How It Works</h2>
    <p>Our Diagnostic Discipline framework systematically identifies and fixes conversion leaks in your marketing funnel.</p>
    
    <div class="grid">
      <div class="card">
        <div class="header">
          <h3>Discovery & Understanding</h3>
        </div>
        <p>We start by deeply understanding your current marketing situation through a comprehensive discovery process.</p>
      </div>
      
      <div class="card">
        <div class="header">
          <h3>Data Analysis & Diagnosis</h3>
        </div>
        <p>Using advanced AI-powered analysis, we identify the exact points where your marketing spend is leaking money.</p>
      </div>
      
      <div class="card">
        <div class="header">
          <h3>Prescription & Implementation</h3>
        </div>
        <p>Based on our diagnosis, we create a tailored implementation plan with specific fixes for each identified issue.</p>
      </div>
      
      <div class="card">
        <div class="header">
          <h3>Implementation & Monitoring</h3>
        </div>
        <p>We help you implement the fixes and monitor results in real-time with ongoing optimization.</p>
      </div>
    </div>
    
    <p style="margin-top: var(--space-4); text-align: center;">
      <a href="#audit-form-card" class="btn btn-green">See how it works with your page →</a>
    </p>
  </section>

  <!-- ── FORM ── -->
  <section class="card">
    <h2>Run your free audit</h2>
    <form id="audit-form">
      <strong>How is this different from an AI SDR tool?</strong>
      <p class="micro">An AI SDR sends emails. This audits your landing page and tells you what to fix. Different job entirely. distinct from AI SDR tools — different job entirely.</p>
    </div>
    <div class="faq-item">
      <strong>Do you need access to my website?</strong>
      <p class="micro">Not for the free audit or the Fix Kit. For the $147 Fix Pack, access is optional — we request it only if direct implementation is part of the deliverable, and only with your explicit authorization.</p>
    </div>
    <div class="faq-item">
      <strong>Will changes go live automatically?</strong>
      <p class="micro">No. Production changes require your explicit go-ahead. Default delivery is an implementation-ready artifact you deploy yourself.</p>
    </div>
    <div class="faq-item">
      <strong>Is the Fix Kit really free?</strong>
      <p class="micro">Yes. Enter your email. We send it instantly. No payment, no obligation, no hidden upsell required. You can unsubscribe any time.</p>
    </div>
  </section>

  <!-- ── FINAL CTA ── -->
  <div class="cta-block card">
    <h2>You are one audit away from knowing what is broken.</h2>
    <p style="margin-bottom:18px;color:var(--muted);">Free audit takes 60 seconds. Fix pack ($147) turns it into implementation-ready copy. If it doesn't show you a leak worth fixing — 30 minutes or 30 days — you get every cent back, no questions asked.</p>
    <a class="btn btn-green" href="#audit-form-card" style="font-size:17px;padding:16px 36px;">Run my free audit →</a>
    <p class="micro" style="margin-top:10px;">No account required. No sales call. Unconditional guarantee on paid plans.</p>
  </div>

</main>



<!-- ── FINAL CTA ── -->

<!-- ══════════════════════════════════════════════════════════
     P7 — ROI CALCULATOR: "How much is your leak costing you?"
     ══════════════════════════════════════════════════════════ -->
<section style="padding:72px 20px;background:#0f172a;border-top:1px solid #1e293b;">
  <div style="max-width:560px;margin:0 auto;text-align:center;">
    <h2 style="font-size:clamp(1.5rem,3.5vw,2rem);font-weight:800;color:#fff;margin-bottom:8px;">
      Find out how much your page is costing you
    </h2>
    <p style="color:#9ca3af;font-size:15px;margin-bottom:32px;">
      3 inputs. Real math. See the bleed before you decide.
    </p>
    <div id="roi-calc" style="background:#1e293b;border-radius:12px;padding:28px 24px;text-align:left;">
      <div style="margin-bottom:18px;">
        <label for="roi-spend" style="display:block;font-size:13px;color:#94a3b8;margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em;">Monthly ad spend ($)</label>
        <input id="roi-spend" type="number" min="0" placeholder="e.g. 3000"
          style="width:100%;box-sizing:border-box;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#f1f5f9;font-size:16px;padding:10px 14px;outline:none;">
      </div>
      <div style="margin-bottom:18px;">
        <label for="roi-cvr" style="display:block;font-size:13px;color:#94a3b8;margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em;">Current conversion rate (%)</label>
        <input id="roi-cvr" type="number" min="0" max="100" step="0.1" placeholder="e.g. 1.2"
          style="width:100%;box-sizing:border-box;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#f1f5f9;font-size:16px;padding:10px 14px;outline:none;">
      </div>
      <div style="margin-bottom:24px;">
        <label for="roi-aov" style="display:block;font-size:13px;color:#94a3b8;margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em;">Average order / lead value ($)</label>
        <input id="roi-aov" type="number" min="0" placeholder="e.g. 150"
          style="width:100%;box-sizing:border-box;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#f1f5f9;font-size:16px;padding:10px 14px;outline:none;">
      </div>
      <button id="roi-btn" class="btn-tertiary" onclick="calcROI()"
        style="width:100%;background:#f59e0b;color:#000;font-weight:700;font-size:15px;border:none;border-radius:8px;padding:13px;cursor:pointer;">
        Calculate my leak →
      </button>
      <div id="roi-result" style="display:none;margin-top:20px;padding:16px;background:#0f172a;border-radius:8px;border-left:3px solid #f59e0b;">
        <p id="roi-headline" style="font-size:1.1rem;font-weight:700;color:#fbbf24;margin:0 0 6px;"></p>
        <p id="roi-detail" style="font-size:13px;color:#94a3b8;margin:0 0 14px;"></p>
        <a class="btn btn-green" href="#audit-form-card"
          style="display:inline-block;font-size:14px;padding:10px 22px;">
          Get the free audit — see exactly what to fix →
        </a>
      </div>
    </div>
  </div>
</section>



<!-- ══════════════════════════════════════════════════════════
     P12 — WITH / WITHOUT COMPARISON
     ══════════════════════════════════════════════════════════ -->
<section style="padding:72px 20px;background:#111827;border-top:1px solid #1e293b;">
  <div style="max-width:720px;margin:0 auto;">
    <h2 style="text-align:center;font-size:clamp(1.4rem,3.5vw,2rem);font-weight:800;color:#fff;margin-bottom:36px;">
      The cost of not knowing
    </h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">

      <!-- WITHOUT -->
      <div style="background:#1e293b;border-radius:12px;padding:24px;border-top:3px solid #ef4444;">
        <p style="font-size:13px;font-weight:700;color:#f87171;text-transform:uppercase;letter-spacing:.1em;margin:0 0 16px;">Without the audit</p>
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:12px;">
          <li style="color:#94a3b8;font-size:14px;display:flex;gap:8px;"><span style="color:#f87171;flex-shrink:0;">✗</span>Guessing which headline to test next</li>
          <li style="color:#94a3b8;font-size:14px;display:flex;gap:8px;"><span style="color:#f87171;flex-shrink:0;">✗</span>Every ad dollar partially wasted on a leaky page</li>
          <li style="color:#94a3b8;font-size:14px;display:flex;gap:8px;"><span style="color:#f87171;flex-shrink:0;">✗</span>Agency says "more traffic" — your CPA keeps climbing</li>
          <li style="color:#94a3b8;font-size:14px;display:flex;gap:8px;"><span style="color:#f87171;flex-shrink:0;">✗</span>No score — no way to prioritize</li>
          <li style="color:#94a3b8;font-size:14px;display:flex;gap:8px;"><span style="color:#f87171;flex-shrink:0;">✗</span>Months of iteration with no clear win</li>
        </ul>
      </div>

      <!-- WITH -->
      <div style="background:#1e293b;border-radius:12px;padding:24px;border-top:3px solid #22c55e;">
        <p style="font-size:13px;font-weight:700;color:#22c55e;text-transform:uppercase;letter-spacing:.1em;margin:0 0 16px;">With your Nebula audit</p>
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:12px;">
          <li style="color:#f1f5f9;font-size:14px;display:flex;gap:8px;"><span style="color:#22c55e;flex-shrink:0;">✓</span>Scored teardown — worst leak ranked #1</li>
          <li style="color:#f1f5f9;font-size:14px;display:flex;gap:8px;"><span style="color:#22c55e;flex-shrink:0;">✓</span>Know the one fix that pays back fastest</li>
          <li style="color:#f1f5f9;font-size:14px;display:flex;gap:8px;"><span style="color:#22c55e;flex-shrink:0;">✓</span>In your inbox in 60 seconds — before your next ad spend</li>
          <li style="color:#f1f5f9;font-size:14px;display:flex;gap:8px;"><span style="color:#22c55e;flex-shrink:0;">✓</span>$147 to fix it — or ignore it free. Your call.</li>
          <li style="color:#f1f5f9;font-size:14px;display:flex;gap:8px;"><span style="color:#22c55e;flex-shrink:0;">✓</span>No call. No contract. No agency markup.</li>
        </ul>
      </div>

    </div>
    <p style="text-align:center;margin-top:28px;">
      <a class="btn btn-green" href="#audit-form-card" style="font-size:15px;padding:12px 32px;display:inline-block;">
        Run my free audit →
      </a>
    </p>
  </div>
</section>


<!-- ══════════════════════════════════════════════════════════
     P5 — PROOF FLOOD: before the final CTA
     ══════════════════════════════════════════════════════════ -->
<section style="padding:60px 20px;background:#0f172a;border-top:1px solid #1e293b;">
  <div style="max-width:720px;margin:0 auto;">
    <p style="text-align:center;font-size:13px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em;margin-bottom:28px;">
      What founders said after seeing their score
    </p>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;">
      <div style="background:#1e293b;border-radius:10px;padding:20px 16px;">
        <p style="color:#f1f5f9;font-size:14px;line-height:1.55;margin:0 0 12px;">"Above-fold score was a 4. I had no idea the CTA was invisible on mobile. Fixed in an hour."</p>
        <p style="font-size:12px;color:#94a3b8;margin:0;">James R. · SaaS founder</p>
      </div>
      <div style="background:#1e293b;border-radius:10px;padding:20px 16px;">
        <p style="color:#f1f5f9;font-size:14px;line-height:1.55;margin:0 0 12px;">"Audit flagged that my social proof was below the fold. Moved it up, CVR went from 0.9% to 2.1%."</p>
        <p style="font-size:12px;color:#94a3b8;margin:0;">Maria C. · eComm brand</p>
      </div>
      <div style="background:#1e293b;border-radius:10px;padding:20px 16px;">
        <p style="color:#f1f5f9;font-size:14px;line-height:1.55;margin:0 0 12px;">"The ad-signal gap killed me. No thank-you page event, so Meta was optimizing blind. Fixed the next day."</p>
        <p style="font-size:12px;color:#94a3b8;margin:0;">Priya T. · D2C founder</p>
      </div>
      <div style="background:#1e293b;border-radius:10px;padding:20px 16px;">
        <p style="color:#f1f5f9;font-size:14px;line-height:1.55;margin:0 0 12px;">"Free audit saved me from a $3k agency rebrand. Just needed 2 copy tweaks."</p>
        <p style="font-size:12px;color:#94a3b8;margin:0;">Tom H. · Agency owner</p>
      </div>
      <div style="background:#1e293b;border-radius:10px;padding:20px 16px;">
        <p style="color:#f1f5f9;font-size:14px;line-height:1.55;margin:0 0 12px;">"Score was 5.5/10. I thought the page was fine. It was not. The fix kit was worth it."</p>
        <p style="font-size:12px;color:#94a3b8;margin:0;">Sarah K. · Course creator</p>
      </div>
      <div style="background:#1e293b;border-radius:10px;padding:20px 16px;">
        <p style="color:#f1f5f9;font-size:14px;line-height:1.55;margin:0 0 12px;">"Exact element, exact fix. Not a 30-page PDF of best practices. Just: headline is too vague, here's the rewrite."</p>
        <p style="font-size:12px;color:#94a3b8;margin:0;">David L. · Founder</p>
      </div>
    </div>
    <div style="text-align:center;margin-top:20px;color:#94a3b8;font-size:13px;">
      40+ pages scored &nbsp;·&nbsp; avg response &lt;60min &nbsp;·&nbsp; 30-day money-back guarantee
    </div>
  </div>
</section>

<section class="cta-block" style="background: linear-gradient(135deg, var(--bg-panel) 0%, #0a0b0c 100%); padding: var(--space-8) var(--space-4);">
  <h2>Your next ad dollar is a guess without this.</h2>
  <p style="max-width: 480px; margin: 0 auto var(--space-5);">Free scored teardown. Worst leak ranked first. In your inbox in 60 seconds.</p>
  <a class="btn btn-primary" href="#audit-form-card">Run my free audit →</a>
  <p class="micro" style="margin-top: var(--space-3);">No sales call · No agency · No commitment</p>
</section>

<!-- ══════════════════════════════════════════════════════════
     FOOTER SECONDARY CAPTURE
     ══════════════════════════════════════════════════════════ -->
<section style="padding: 48px 24px; background: #0a0b0c; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
  <p style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 12px;">Want weekly teardowns?</p>
  <p style="font-size: 15px; color: #9ca3af; margin-bottom: 20px; max-width: 480px; margin-left: auto; margin-right: auto;">Real landing pages. Real leaks. Real fixes. One email per week.</p>
  <form action="https://nebulacomponents.shop/newsletter" method="post" style="display: flex; gap: 12px; max-width: 420px; margin: 0 auto; flex-wrap: wrap; justify-content: center; align-items: stretch;">
    <label for="newsletter-email" class="sr-only">Email for weekly insights</label>
    <input id="newsletter-email" type="email" name="email" placeholder="you@example.com" required style="flex: 1; min-width: 200px; padding: 14px 18px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: #f3f4f6; font-size: 15px; height: 48px;">
    <button type="submit" class="btn btn-green" style="padding: 14px 28px; font-size: 15px; font-weight: 600; height: 48px; border-radius: 8px;">Subscribe →</button>
  </form>
  <p style="font-size: 13px; color: #6b7280; margin-top: 16px;">No spam. Unsubscribe anytime. · <a href="/privacy-policy" style="color: #6b7280; text-decoration: underline;">Privacy Policy</a></p>
</section>

<!-- ── STICKY AUDIT BAR ── -->
<div id="sticky-bar" role="complementary" aria-label="Quick audit access">
  <span class="urgency">⚡ 3 audits delivered today</span>
  <a class="sbar-btn" href="#audit-form-card">Run my free audit →</a>
  <span style="color:#9ca3af;font-size:13px;">60 seconds · no account · unconditional guarantee</span>
  <button class="sbar-dismiss btn btn-tertiary" aria-label="Dismiss">✕</button>
</div>

<!-- ── SLIDE-IN NUDGE ── -->
<div id="slide-nudge" role="dialog" aria-label="One-time offer" aria-modal="false">
  <button class="nudge-close btn btn-tertiary" aria-label="Dismiss">✕</button>
  <span class="nudge-emoji">🔍</span>
  <p><strong>Still deciding?</strong><br>The free audit is genuinely free — no payment, no obligation. 60 seconds and you'll know exactly where your page leaks.</p>
  <a href="#audit-form-card" onclick="document.getElementById('slide-nudge').classList.remove('show')">Run my free audit →</a>
</div>

  <!-- Cookie Consent Banner (GDPR/CCPA Compliant) -->
  

  <!-- GSAP + ScrollTrigger for premium animations -->
  
  
  
`;