/**
 * GSAP Animations for Nebula Components
 * Premium scroll-triggered animations matching Klaym aesthetic
 *
 * FAIL-SAFE: Content visible by default. Animations are additive only.
 */

document.addEventListener('DOMContentLoaded', function () {
  // If GSAP/ScrollTrigger didn't load, leave everything visible.
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('[anim] GSAP/ScrollTrigger not loaded — content shown without animation');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Reduced-motion: skip animations
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    console.log('[anim] Reduced motion — animations disabled');
    return;
  }

  // ── HERO ENTRANCE ──
  const heroBadge = document.querySelector('.hero-badge');
  const heroH1 = document.querySelector('.hero h1');
  const heroSub = document.querySelector('.hero-sub');
  const heroForm = document.querySelector('.hero-form');
  const heroTrust = document.querySelector('.hero-trust');

  if (heroH1) {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    
    if (heroBadge) tl.from(heroBadge, { opacity: 0, y: 20, duration: 0.6 }, 0);
    tl.from(heroH1, { opacity: 0, y: 40, duration: 0.8 }, 0.1);
    if (heroSub) tl.from(heroSub, { opacity: 0, y: 30, duration: 0.7 }, 0.3);
    if (heroForm) tl.from(heroForm, { opacity: 0, y: 20, duration: 0.6 }, 0.5);
    if (heroTrust) tl.from(heroTrust, { opacity: 0, duration: 0.5 }, 0.7);
  }

  // ── SCROLL REVEALS ──
  function revealOnScroll(selector, vars) {
    const els = gsap.utils.toArray(selector);
    els.forEach((el) => {
      gsap.from(el, Object.assign({
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
        },
        immediateRender: false,
        y: 40,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
      }, vars || {}));
    });
  }

  // Stats row
  revealOnScroll('.stat-item', { y: 30, stagger: 0.1 });

  // Section titles
  revealOnScroll('section h2', { y: 30 });

  // Cards
  revealOnScroll('.shift-card', { y: 50, stagger: 0.15 });
  revealOnScroll('.step', { y: 40, stagger: 0.12 });
  revealOnScroll('.faq-item', { y: 30, stagger: 0.08 });

  // ── BUTTON MICRO-INTERACTIONS ──
  gsap.utils.toArray('.btn-primary, .btn').forEach((btn) => {
    btn.addEventListener('mouseenter', () => gsap.to(btn, { scale: 1.03, duration: 0.25, ease: 'power2.out' }));
    btn.addEventListener('mouseleave', () => gsap.to(btn, { scale: 1, duration: 0.25, ease: 'power2.out' }));
  });

  // ── FORM FIELD FOCUS ──
  gsap.utils.toArray('input').forEach((field) => {
    field.addEventListener('focus', () => gsap.to(field, { scale: 1.01, duration: 0.15, ease: 'power2.out' }));
    field.addEventListener('blur', () => gsap.to(field, { scale: 1, duration: 0.15, ease: 'power2.out' }));
  });

  // ── RECALCULATE after fonts/images load ──
  function refresh() { ScrollTrigger.refresh(); }
  window.addEventListener('load', refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(refresh, 200); });

  console.log('[anim] GSAP animations initialized');
});
