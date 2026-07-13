/**
 * GSAP Animations for Nebula Components
 * Premium scroll-triggered animations matching Linear/Vercel aesthetic
 *
 * FAIL-SAFE DESIGN: Content is visible by default (opacity:1 in CSS).
 * Scroll reveals animate TRANSFORM ONLY (y / translate), never opacity.
 * This guarantees no revenue-critical section can ever be "empty" or
 * stuck hidden — if GSAP fails, ScrollTrigger miscalculates, or JS errors,
 * all content remains fully visible. Animations are purely additive.
 */

document.addEventListener('DOMContentLoaded', function () {
  // If GSAP/ScrollTrigger didn't load, leave everything visible (default state).
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('[anim] GSAP/ScrollTrigger not loaded — content shown without animation');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Reduced-motion users: skip all animations, keep content visible.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    console.log('[anim] Reduced motion — animations disabled, content visible');
    return;
  }

  // Helper: slide elements UP into view on scroll. Animates transform ONLY,
  // so content is never hidden. immediateRender:false prevents a pre-jump.
  function revealOnScroll(selector, vars) {
    const els = gsap.utils.toArray(selector);
    els.forEach((el) => {
      gsap.from(el, Object.assign({
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          once: true,            // play a single time, then kill — never reverse
        },
        immediateRender: false,  // do NOT pre-set transform before trigger fires
        y: 50,
        opacity: 1,             // EXPLICIT: never animate opacity away from 1
        duration: 0.7,
        ease: 'power2.out',
      }, vars || {}));
    });
  }

  // ── HERO ENTRANCE (plays on load, not scroll) ──
  const header = document.querySelector('header');
  const hero = document.querySelector('.hero');

  if (header) {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    tl.from('header .skeptic-disarm', { opacity: 0, y: -20, duration: 0.6 })
      .from('header h1', { opacity: 0, y: 30, duration: 0.8 }, '-=0.3')
      .from('header .sub', { opacity: 0, y: 20, duration: 0.8 }, '-=0.5')
      .from('header .trust-row', { opacity: 0, y: 20, duration: 0.6, stagger: 0.1 }, '-=0.5')
      .from('header .btn', { opacity: 0, scale: 0.9, duration: 0.6 }, '-=0.3');
  } else if (hero) {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    tl.from('.hero h1', { opacity: 0, y: 30, duration: 0.8 })
      .from('.hero .sub', { opacity: 0, y: 20, duration: 0.8 }, '-=0.4')
      .from('.hero .stat, .hero .trust-row', { opacity: 0, y: 20, duration: 0.6, stagger: 0.1 }, '-=0.4');
  }

  // ── SCROLL REVEALS (transform-only, content always visible) ──
  revealOnScroll('.card');
  revealOnScroll('section > h2, section > p');
  revealOnScroll('.how-step', { y: 40, stagger: 0.15 });

  // Pricing cards are covered by the '.card' selector above — no separate
  // (duplicate) tween, which previously caused competing from-states.

  // ── COUNT-UP STATS ──
  gsap.utils.toArray('.stat-num[data-target]').forEach((num) => {
    const target = parseInt(num.getAttribute('data-target'), 10);
    gsap.from(num, {
      scrollTrigger: { trigger: num, start: 'top 90%', once: true },
      immediateRender: false,
      textContent: 0,
      duration: 2,
      ease: 'power2.out',
      snap: { textContent: 1 },
      onUpdate: function () {
        num.textContent = Math.floor(this.targets()[0].textContent);
      },
    });
  });

  // ── BUTTON MICRO-INTERACTIONS ──
  gsap.utils.toArray('.btn-primary, .btn, button[type="submit"]').forEach((btn) => {
    btn.addEventListener('mouseenter', () => gsap.to(btn, { scale: 1.05, duration: 0.3, ease: 'power2.out' }));
    btn.addEventListener('mouseleave', () => gsap.to(btn, { scale: 1, duration: 0.3, ease: 'power2.out' }));
  });

  // ── FORM FIELD FOCUS ──
  gsap.utils.toArray('input, select, textarea').forEach((field) => {
    field.addEventListener('focus', () => gsap.to(field, { scale: 1.02, duration: 0.2, ease: 'power2.out' }));
    field.addEventListener('blur', () => gsap.to(field, { scale: 1, duration: 0.2, ease: 'power2.out' }));
  });

  // ── RECALCULATE trigger positions after fonts/images load ──
  function refresh() { ScrollTrigger.refresh(); }
  window.addEventListener('load', refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(refresh, 200); });

  // ── SAFETY NET: at 4s, force every animated element to its resting
  // ── SAFETY NET: at 4s, KILL all scroll tweens and force every animated
  //     element fully visible. This guarantees content is never left hidden
  //     by a miscalculated ScrollTrigger or a paused tween. Hero CTAs
  //     (opacity:0 from the entrance timeline) are forced visible too. ──
  setTimeout(() => {
    try {
      ScrollTrigger.getAll().forEach((st) => st.kill());
      gsap.utils.toArray('.card, section > h2, section > p, .how-step, .stat-num, .btn, a, button')
        .forEach((el) => {
          gsap.killTweensOf(el);
          gsap.set(el, { opacity: 1, clearProps: 'transform' });
        });
      console.log('[anim] Safety net: forced all elements visible');
    } catch (e) {
      console.warn('[anim] Safety net error:', e);
    }
  }, 4000);

  console.log('[anim] GSAP animations initialized (fail-safe mode)');
});
