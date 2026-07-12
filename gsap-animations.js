/**
 * GSAP Animations for Nebula Components
 * Premium scroll-triggered animations matching Linear/Vercel aesthetic
 */

// Wait for GSAP and ScrollTrigger to load
document.addEventListener('DOMContentLoaded', function() {
  // Verify GSAP loaded
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('GSAP or ScrollTrigger not loaded');
    return;
  }

  // Register ScrollTrigger plugin
  gsap.registerPlugin(ScrollTrigger);

  // ══════════════════════════════════════════════════════════
  // HERO ENTRANCE ANIMATION
  // ══════════════════════════════════════════════════════════

  // Animate hero on load
  const heroTimeline = gsap.timeline();

  // Check if we're on index.html (has header) or audit-lander (has .hero)
  const header = document.querySelector('header');
  const hero = document.querySelector('.hero');

  if (header) {
    // Index.html hero animations
    heroTimeline
      .from("header .skeptic-disarm", {
        opacity: 0,
        y: -20,
        duration: 0.6,
        ease: "power2.out"
      })
      .from("header h1", {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: "power2.out"
      }, "-=0.3")
      .from("header .sub", {
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: "power2.out"
      }, "-=0.5")
      .from("header .trust-row", {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out"
      }, "-=0.5")
      .from("header .btn", {
        opacity: 0,
        scale: 0.9,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.3");
  } else if (hero) {
    // Audit-lander hero animations
    heroTimeline
      .from(".hero h1", {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: "power2.out"
      })
      .from(".hero .sub", {
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: "power2.out"
      }, "-=0.4")
      .from(".hero .stat, .hero .trust-row", {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out"
      }, "-=0.4");
  }

  // ══════════════════════════════════════════════════════════
  // SCROLL-TRIGGERED ANIMATIONS
  // ══════════════════════════════════════════════════════════

  // Cards fade up on scroll
  gsap.utils.toArray(".card").forEach(card => {
    gsap.from(card, {
      scrollTrigger: {
        trigger: card,
        start: "top 85%",
        toggleActions: "play none none reverse"
      },
      opacity: 0,
      y: 60,
      duration: 0.8,
      ease: "power2.out"
    });
  });

  // Section headings fade in
  gsap.utils.toArray("section > h2, section > p").forEach(elem => {
    gsap.from(elem, {
      scrollTrigger: {
        trigger: elem,
        start: "top 85%",
        toggleActions: "play none none reverse"
      },
      opacity: 0,
      y: 40,
      duration: 0.6,
      ease: "power2.out"
    });
  });

  // How-it-works steps stagger
  const howSteps = document.querySelectorAll(".how-step");
  if (howSteps.length > 0) {
    gsap.from(".how-step", {
      scrollTrigger: {
        trigger: ".how-step",
        start: "top 80%"
      },
      opacity: 0,
      y: 40,
      duration: 0.6,
      stagger: 0.15,
      ease: "power2.out"
    });
  }

  // ══════════════════════════════════════════════════════════
  // COUNTER ANIMATION (index.html)
  // ══════════════════════════════════════════════════════════

  // Animate stat numbers with data-target attribute
  gsap.utils.toArray(".stat-num[data-target]").forEach(num => {
    const target = parseInt(num.getAttribute("data-target"));

    gsap.from(num, {
      scrollTrigger: {
        trigger: num,
        start: "top 85%"
      },
      textContent: 0,
      duration: 2,
      ease: "power2.out",
      snap: { textContent: 1 },
      onUpdate: function() {
        num.textContent = Math.floor(this.targets()[0].textContent);
      }
    });
  });

  // ══════════════════════════════════════════════════════════
  // PRICING CARD ANIMATION
  // ══════════════════════════════════════════════════════════

  // Pricing cards stagger in
  const pricing = document.querySelector("#pricing");
  if (pricing) {
    gsap.from("#pricing .card", {
      scrollTrigger: {
        trigger: "#pricing",
        start: "top 70%"
      },
      opacity: 0,
      y: 80,
      duration: 0.8,
      stagger: 0.1,
      ease: "power2.out"
    });
  }

  // ══════════════════════════════════════════════════════════
  // BUTTON MICRO-INTERACTIONS
  // ══════════════════════════════════════════════════════════

  // Hover effects for primary buttons
  gsap.utils.toArray(".btn-primary, .btn, button[type='submit']").forEach(btn => {
    btn.addEventListener("mouseenter", () => {
      gsap.to(btn, {
        scale: 1.05,
        duration: 0.3,
        ease: "power2.out"
      });
    });

    btn.addEventListener("mouseleave", () => {
      gsap.to(btn, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      });
    });
  });

  // ══════════════════════════════════════════════════════════
  // FORM FIELD ANIMATIONS (audit-lander)
  // ══════════════════════════════════════════════════════════

  // Animate form fields on focus
  gsap.utils.toArray("input, select, textarea").forEach(field => {
    field.addEventListener("focus", () => {
      gsap.to(field, {
        scale: 1.02,
        duration: 0.2,
        ease: "power2.out"
      });
    });

    field.addEventListener("blur", () => {
      gsap.to(field, {
        scale: 1,
        duration: 0.2,
        ease: "power2.out"
      });
    });
  });

  // ══════════════════════════════════════════════════════════
  // REDUCED MOTION SUPPORT (WCAG)
  // ══════════════════════════════════════════════════════════

  // Respect user preference
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    console.log("Reduced motion preference detected — animations disabled");
    gsap.globalTimeline.clear();
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }

  console.log("✅ GSAP animations initialized");
});
