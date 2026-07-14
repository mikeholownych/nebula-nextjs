'use client'

import { useState, useEffect } from 'react'
import './styles.css'

// FAQ Item Component with accessibility features
function FAQItem({
  id,
  question,
  answer,
  expanded,
  onToggle
}: {
  id: string
  question: string
  answer: string
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="faq-item" role="region" aria-labelledby={`${id}-heading`}>
      <button
        className="faq-question"
        aria-expanded={expanded}
        aria-controls={`${id}-answer`}
        id={`${id}-heading`}
        onClick={onToggle}
      >
        {question} {expanded ? '▲' : '▼'}
      </button>
      <div
        id={`${id}-answer`}
        className="faq-answer"
        hidden={!expanded}
        aria-labelledby={`${id}-heading`}
      >
        <p>{answer}</p>
      </div>
    </div>
  )
}

// Component Card Component
function ComponentCard({
  emoji,
  title,
  description
}: {
  emoji: string
  title: string
  description: string
}) {
  return (
    <div className="component-card" tabIndex={0}>
      <h3>{emoji} {title}</h3>
      <p>{description}</p>
    </div>
  )
}

// Stat Component
function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="stat">
      <span className="number">{number}</span>
      <span className="label">{label}</span>
    </div>
  )
}

export default function AccessibleNebulaPage() {
  // FAQ state
  const [faqState, setFaqState] = useState<Record<string, boolean>>({
    faq1: true,
    faq2: false,
    faq3: false,
    faq4: false,
    faq5: false
  })

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    hours: 24,
    minutes: 0,
    seconds: 0
  })

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev
        seconds--
        if (seconds < 0) {
          seconds = 59
          minutes--
        }
        if (minutes < 0) {
          minutes = 59
          hours--
        }
        if (hours < 0) {
          return { hours: 0, minutes: 0, seconds: 0 }
        }
        return { hours, minutes, seconds }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const toggleFaq = (id: string) => {
    setFaqState(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const faqData = [
    { id: 'faq1', question: 'What exactly do I get for $7?', answer: '7 complete HTML component files, a shared CSS design system, and a full demo page. Everything you see in the demo is yours to use, modify, and deploy.' },
    { id: 'faq2', question: 'Do I need React, Vue, or a build tool?', answer: 'No. Pure HTML + CSS. Works in any browser, any host, any framework. Copy the HTML, paste it into your project, done.' },
    { id: 'faq3', question: 'Can I use this for client projects?', answer: 'Yes. Commercial license included. Use in unlimited projects for yourself AND your clients.' },
    { id: 'faq4', question: 'What if I can\'t figure it out?', answer: 'Email ops@launchcrate.io. I\'ll help you personally. If you can\'t ship a landing page in 30 days, I\'ll refund you AND pay you $29.' },
    { id: 'faq5', question: 'How long is the $7 price available?', answer: 'Early adopter pricing runs during the launch period. The price will go to $19 once the early adopter phase ends.' }
  ]

  const components = [
    { emoji: '🦁', title: 'Hero Section', description: 'Full-screen hero with gradient text, animated entrance, dual CTAs, and social proof bar. First impression that converts.' },
    { emoji: '⚡', title: 'Features Grid', description: '3-column responsive grid with icon cards, hover lift effects, and glassmorphic borders. Shows value at a glance.' },
    { emoji: '💰', title: 'Pricing Table', description: '3-tier comparison with "Most Popular" highlight, hover scale, feature checklists, and CTA buttons.' },
    { emoji: '⭐', title: 'Testimonials', description: '3-card social proof layout with star ratings, gradient avatars, and statistics bar. Build trust fast.' },
    { emoji: '❓', title: 'FAQ Accordion', description: 'Accessible expand/collapse with smooth animations. Pure CSS — zero JavaScript needed.' },
    { emoji: '🎯', title: 'CTA Section', description: 'Conversion-focused call-to-action with gradient orb background, dual buttons, and trust indicators.' },
    { emoji: '📋', title: 'Footer', description: 'Complete 4-column footer with nav links, legal section, social icons, and gradient dividers.' }
  ]

  return (
    <>
      {/* Skip Navigation Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header role="banner">
        <div className="container">
          <div className="header-content">
            <h1>
              <a href="#" aria-label="Nebula Components Home">
                Nebula
              </a>
            </h1>
            <nav role="navigation" aria-label="Primary Navigation">
              <ul className="nav-list">
                <li><a href="#components">Components</a></li>
                <li><a href="#tools">Tools</a></li>
                <li><a href="#guarantee">Guarantee</a></li>
                <li><a href="#faq">FAQ</a></li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      <main id="main-content" role="main">
        {/* Hero Section */}
        <section className="hero" aria-labelledby="hero-heading">
          <div className="container">
            <div className="hero-content">
              <h2 id="hero-heading">
                Stop spending weeks on your landing page. Ship in 30 minutes.
              </h2>
              <p>
                7 dark-themed, copy-paste-ready HTML/CSS sections. Hero. Features.
                Pricing. Testimonials. FAQ. CTA. Footer. One design system. Any
                framework. Any host. $29 value — yours for <strong>$7</strong> during the
                launch flash sale.
              </p>

              <div className="timer" aria-live="polite">
                <span id="hours">{String(timeLeft.hours).padStart(2, '0')}</span> Hours{' '}
                <span id="minutes">{String(timeLeft.minutes).padStart(2, '0')}</span>{' '}
                Minutes{' '}
                <span id="seconds">{String(timeLeft.seconds).padStart(2, '0')}</span>{' '}
                Seconds
              </div>

              <div className="badges">
                <span className="badge">✅ Instant digital delivery</span>
                <span className="badge">🔒 Secure checkout</span>
                <span className="badge">📦 30-day risk-free</span>
              </div>

              <a
                href="https://buy.stripe.com/4gMdR9aYkenafup3Ro43S00"
                className="btn btn-primary"
              >
                🛒 Buy Now — $7 →
              </a>
              <a
                href="https://nebulacomponents.shop/ad-burn-leaderboard.html"
                className="btn btn-secondary"
              >
                🔥 See the Ad Burn Leak Board
              </a>
              <a
                href="https://nebulacomponents.shop/demo.html"
                className="btn btn-secondary"
              >
                👀 See the Live Demo First
              </a>
              <a href="#guarantee" className="btn btn-secondary">
                100% Money-Back Guarantee →
              </a>
            </div>
          </div>
        </section>

        {/* Promotional Banner */}
        <section className="promo-banner" aria-hidden="true">
          <div className="container">
            <h3>🎉 $20 OFF Your First Component Pack</h3>
            <p>
              Use code <strong>WEEKLY20</strong> at checkout.
            </p>
          </div>
        </section>

        {/* Components Section */}
        <section
          id="components"
          className="components-section"
          aria-labelledby="components-heading"
        >
          <div className="container">
            <h2 id="components-heading">Everything You Get</h2>
            <p>
              7 professionally designed components. One unified dark theme. Ready
              to deploy.
            </p>

            <div className="components-grid">
              {components.map(comp => (
                <ComponentCard
                  key={comp.title}
                  emoji={comp.emoji}
                  title={comp.title}
                  description={comp.description}
                />
              ))}
            </div>

            <div className="component-stats">
              <Stat number="7" label="Premium Components" />
              <Stat number="0" label="Dependencies / Frameworks" />
              <Stat number="30s" label="Setup Time" />
              <Stat number="$7" label="Launch Price (was $29)" />
            </div>
          </div>
        </section>

        {/* Free Tools Section */}
        <section id="tools" className="tools-section" aria-labelledby="tools-heading">
          <div className="container">
            <h2 id="tools-heading">🔥 Free Tools: Try Before You Buy</h2>
            <p>No signup. No email. Just pick your options and copy the HTML.</p>

            <div className="tool-cards">
              <a
                href="https://nebulacomponents.shop/generator.html"
                className="tool-card"
              >
                <div className="tool-icon">🦁</div>
                <h3>Hero Generator</h3>
                <p>Customize headline, subtitle, CTAs. Live preview. Copy HTML.</p>
              </a>
              <a
                href="https://nebulacomponents.shop/pricing-generator.html"
                className="tool-card"
              >
                <div className="tool-icon">💰</div>
                <h3>Pricing Generator</h3>
                <p>3 tiers, features, toggles. Live preview. Copy HTML.</p>
              </a>
            </div>

            <p className="text-center">⬇ Get the full 7-component pack below ⬇</p>
          </div>
        </section>

        {/* Early Access Section */}
        <section className="early-access" aria-labelledby="early-access-heading">
          <div className="container">
            <h2 id="early-access-heading">Early Access Release</h2>
            <p>
              Nebula Components just launched. Be one of the first to grab it at
              the early adopter price before it goes up.
            </p>
          </div>
        </section>

        {/* Guarantee Section */}
        <section
          id="guarantee"
          className="guarantee-section"
          aria-labelledby="guarantee-heading"
        >
          <div className="container">
            <h2 id="guarantee-heading">🚀 The "Ship or I Pay You" Guarantee</h2>
            <p>
              Buy Nebula. Use it to build your landing page. If you haven't shipped
              a live page in 30 days, I'll refund every penny{' '}
              <strong>AND pay you $29</strong> for wasting your time.
            </p>

            <div className="guarantee-stats">
              <Stat number="30" label="Days to Try" />
              <Stat number="100%" label="Money Back" />
              <Stat number="+$29" label="Penalty If I Fail" />
            </div>

            <div className="trust-badges">
              <img
                src="https://nebulacomponents.shop/images/stripe.svg"
                alt="Secure checkout with Stripe"
              />
              <img
                src="https://nebulacomponents.shop/images/ssl.svg"
                alt="SSL Encrypted"
              />
            </div>

            <a
              href="https://buy.stripe.com/4gMdR9aYkenafup3Ro43S00"
              className="btn btn-primary"
            >
              🛒 Buy Now — $7 →
            </a>
            <a
              href="https://nebulacomponents.shop/demo.html"
              className="btn btn-secondary"
            >
              👀 Or preview the demo first (no email required)
            </a>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="faq-section" aria-labelledby="faq-heading">
          <div className="container">
            <h2 id="faq-heading">Frequently Asked Questions</h2>
            <p>Still on the fence? Here's everything you need to know.</p>

            <div className="faq-list">
              {faqData.map(faq => (
                <FAQItem
                  key={faq.id}
                  id={faq.id}
                  question={faq.question}
                  answer={faq.answer}
                  expanded={faqState[faq.id]}
                  onToggle={() => toggleFaq(faq.id)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="final-cta" aria-labelledby="final-cta-heading">
          <div className="container">
            <h2 id="final-cta-heading">Ship Your Landing Page Tonight</h2>
            <p>
              7 components. 30 minutes. Zero excuses.{' '}
              <strong>$7 for the next 24 hours.</strong>
            </p>

            <a
              href="https://nebulacomponents.shop/checkout.html"
              className="btn btn-primary"
            >
              🛒 Buy Nebula for $7 Now →
            </a>

            <div className="guarantee-badges">
              <span className="badge">✅ Instant download</span>
              <span className="badge">🔒 Secure payment</span>
              <span className="badge">📦 30-day "ship or I pay you" guarantee</span>
            </div>

            <p className="text-center">
              Still deciding? <strong>$20 off</strong> with code{' '}
              <strong>WEEKLY20</strong> →
            </p>

            <button className="dismiss-btn">Dismiss</button>
          </div>
        </section>
      </main>

      <footer role="contentinfo">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <p>© 2026 Nebula Components. Built by someone who ships.</p>
            </div>
            <div className="footer-section">
              <p>
                Questions?{' '}
                <a href="mailto:ops@launchcrate.io">ops@launchcrate.io</a> · Pay
                with ETH: 0x72bB3bad6D2e7cd9Db2f1d17F0928Cd5806FB6c0
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
