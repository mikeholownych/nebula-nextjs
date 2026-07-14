'use client'

import '@/public/styles/nebula-design-system.css'
import { useState } from 'react'

export default function PartAfterPage() {
  const [formData, setFormData] = useState({
    url: '',
    email: '',
    goal: 'sales',
    visitor: '',
    tone: '',
    role: '',
    monthly_spend: '',
    pain_point: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // ... form submission logic
  }

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 font-sans antialiased">
      {/* Scroll Progress Bar */}
      <div id="scroll-prog" className="fixed top-0 left-0 w-0 h-1 bg-amber-500 z-50" aria-hidden="true" />
      
      {/* Header */}
      <header className="max-w-4xl mx-auto px-4 pt-6 pb-8">
        {/* Skeptic Disarm Block */}
        <div className="max-w-[680px] mx-auto mb-6 p-5 bg-emerald-950/20 rounded-xl border border-emerald-500/20">
          <p className="text-xs text-gray-500 text-center uppercase tracking-widest mb-3">You're probably thinking</p>
          <div className="flex flex-col gap-2.5 mb-3.5">
            <div className="bg-white/5 rounded-lg p-3 text-sm text-gray-300 italic">
              "This is just another AI tool that gives me a vague score and calls it an audit."
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-sm text-gray-300 italic">
              "I've already tested three different headlines. Nothing moved the number."
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-sm text-gray-300 italic">
              "I paid an agency for 3 months. They said it needed more time. I'm done paying for patience."
            </div>
          </div>
          <p className="text-sm text-gray-400 text-center">
            If any of that landed — <strong className="text-emerald-400">you're exactly who this is for.</strong> 60 seconds. No pitch. The exact leak, ranked by dollar cost. That's it.
          </p>
        </div>

        {/* Hero Section */}
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
          4% CTR. 0% conversion.{' '}
          <span className="relative inline-block">
            <em className="text-amber-400">Here's where it breaks.</em>
            <svg className="absolute -bottom-2 left-0 w-full h-3" viewBox="0 0 180 12" preserveAspectRatio="none" aria-hidden="true">
              <path
                className="text-amber-400"
                d="M2,8 C30,2 60,12 90,6 C120,0 150,10 178,6"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h1>

        <p className="text-center text-gray-400 max-w-2xl mx-auto mb-4">
          Your ad spend is leaking somewhere between the click and the checkout. This finds the exact gap, estimates the monthly dollar cost, and gives you the fix. 60 seconds. $0. No testing phase. No agency.
        </p>

        {/* Stats Band */}
        <div className="flex justify-center gap-6 md:gap-10 py-4 text-center">
          <div>
            <div className="text-2xl font-bold text-emerald-400">40<span className="text-emerald-400">+</span></div>
            <div className="text-xs text-gray-500">pages scored</div>
          </div>
          <div className="w-px bg-gray-800" />
          <div>
            <div className="text-2xl font-bold text-emerald-400">3.1</div>
            <div className="text-xs text-gray-500">avg leak categories</div>
          </div>
          <div className="w-px bg-gray-800" />
          <div>
            <div className="text-2xl font-bold text-emerald-400">&lt;60<span className="text-sm">min</span></div>
            <div className="text-xs text-gray-500">avg response</div>
          </div>
          <div className="w-px bg-gray-800" />
          <div>
            <div className="text-2xl font-bold text-emerald-400">$147</div>
            <div className="text-xs text-gray-500">full implementation</div>
          </div>
        </div>

        {/* Trust Row */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {['No sales call', 'No hidden obligation', 'URL used only for audit', 'Full refund if not satisfied', 'We duplicate your page'].map((pill) => (
            <span key={pill} className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-gray-400">
              {pill}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href="#audit-form-card"
            className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3.5 px-9 rounded-lg text-lg transition-all"
          >
            Run my free audit →
          </a>
          <p className="text-xs text-gray-500 mt-2">Free · 60 seconds · no account required</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 pb-16 space-y-6">
        {/* Without / With Block */}
        <section className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-center mb-6">Sound familiar?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-5">
              <p className="font-bold text-red-400 mb-3">Without a teardown</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>❌ You buy more traffic hoping something changes</li>
                <li>❌ You rewrite the headline. Same result.</li>
                <li>❌ 4% CTR. 0% conversion. No idea why.</li>
                <li>❌ Your agency says "needs more time"</li>
                <li>❌ You kill the campaign before finding the real leak</li>
              </ul>
            </div>
            <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-lg p-5">
              <p className="font-bold text-emerald-400 mb-3">After 60 seconds here</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>✅ Know which fix pays back fastest — ranked priority</li>
                <li>✅ Stop guessing — scored across 5 dimensions</li>
                <li>✅ In your inbox before your next ad spend</li>
              </ul>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-center mb-2">How it works</h2>
          <p className="text-center text-amber-400 text-sm mb-6">Three steps. Under 5 minutes total.</p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { num: '1', title: 'Paste your URL', desc: 'Drop your landing page URL + email below. Takes 30 seconds.' },
              { num: '2', title: 'Get your scored audit', desc: '5 dimensions scored. Top leaks ranked. Free fix kit in 60 seconds.' },
              { num: '3', title: 'Fix it or hand it off', desc: 'Use the free kit yourself — or get the $147 Fix Pack.' }
            ].map((step) => (
              <div key={step.num} className="text-center p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                <div className="w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">
                  {step.num}
                </div>
                <p className="font-semibold text-sm mb-1">{step.title}</p>
                <p className="text-xs text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Audit Form */}
        <section id="audit-form-card" className="bg-[#0a0a0a] border-2 border-emerald-600 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-2">Run the free audit. See exactly where your page leaks.</h2>
          <p className="text-sm text-gray-500 mb-6">Two required fields. Everything else sharpens the diagnosis.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium mb-1.5">
                Landing page URL <span className="text-gray-500 font-normal">(the exact page taking ad traffic)</span>
              </label>
              <input
                id="url"
                name="url"
                type="url"
                placeholder="https://your-landing-page.com"
                required
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                Email for delivery <span className="text-gray-500 font-normal">(audit arrives in &lt;60 seconds)</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="goal" className="block text-sm font-medium mb-1.5">
                What is this page supposed to do?
              </label>
              <select
                id="goal"
                name="goal"
                value={formData.goal}
                onChange={(e) => setFormData({...formData, goal: e.target.value})}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="sales">Get a sale — visitor should pay on this page</option>
                <option value="leads">Capture a lead — visitor should leave an email or number</option>
                <option value="bookings">Book a call — visitor should schedule time</option>
                <option value="signups">Drive a signup — visitor should create an account</option>
              </select>
            </div>

            <div>
              <label htmlFor="visitor" className="block text-sm font-medium mb-1.5">
                Who lands here? <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                id="visitor"
                name="visitor"
                type="text"
                placeholder="e.g. overwhelmed founders running paid ads"
                value={formData.visitor}
                onChange={(e) => setFormData({...formData, visitor: e.target.value})}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="monthly_spend" className="block text-sm font-medium mb-1.5">
                Monthly ad spend <span className="text-gray-500 font-normal">(optional — sizes the waste estimate)</span>
              </label>
              <select
                id="monthly_spend"
                name="monthly_spend"
                value={formData.monthly_spend}
                onChange={(e) => setFormData({...formData, monthly_spend: e.target.value})}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Prefer not to say</option>
                <option value="500">Under $500/mo</option>
                <option value="1000">$500–$1K/mo</option>
                <option value="2500">$1K–$5K/mo</option>
                <option value="7500">$5K–$10K/mo</option>
                <option value="15000">$10K–$20K/mo</option>
                <option value="30000">$20K+/mo</option>
              </select>
            </div>

            <p className="text-xs text-gray-500">
              Your URL and email are used to generate, email, and log the audit. No resale. No spam.
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-semibold py-3.5 rounded-lg text-lg transition-all"
            >
              {isSubmitting ? 'Running…' : 'Run my free audit →'}
            </button>
          </form>

          {result && (
            <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
              <div dangerouslySetInnerHTML={{ __html: result }} />
            </div>
          )}
        </section>

        {/* Pricing Section */}
        <section className="grid md:grid-cols-2 gap-4">
          {/* Free Kit */}
          <div className="bg-[#0a0a0a] border-2 border-emerald-600 rounded-xl p-6">
            <span className="inline-block bg-emerald-900/50 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              Free — instant access
            </span>
            <h3 className="text-lg font-bold mt-3">🎁 Landing Page Fix Kit</h3>
            <div className="text-3xl font-bold text-emerald-400 my-2">$0</div>
            <p className="text-sm text-gray-500 mb-4">DIY implementation checklist in 5 pages.</p>
            <ul className="text-sm text-gray-400 space-y-1 mb-4">
              <li>✓ 5-step audit-to-fix checklist</li>
              <li>✓ Headline rewrite prompts (3 templates)</li>
              <li>✓ CTA and trust-section copy templates</li>
              <li>✓ Delivered instantly</li>
            </ul>
          </div>

          {/* $147 Fix Pack */}
          <div className="bg-[#0a0a0a] border border-amber-600 rounded-xl p-6 relative">
            <span className="inline-block bg-amber-900/50 text-amber-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              Most popular
            </span>
            <h3 className="text-lg font-bold mt-3">💥 Conversion Fix Pack</h3>
            <div className="text-3xl font-bold my-2">
              <span className="line-through text-gray-500 text-lg">$490</span>{' '}
              <span className="text-white">$147</span>
              <span className="text-sm text-gray-500 ml-1">one-time</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Your audit → implementation-ready fixes. Hero, CTA, trust proof, offer.
            </p>
            <a
              href="https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b"
              className="block w-full bg-white text-black font-bold text-center py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Get the $147 Fix Pack →
            </a>
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
              <span>🛡️</span>
              <span>30-min or 30-day refund. No questions.</span>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">You are one audit away from knowing what is broken.</h2>
          <p className="text-gray-400 mb-6">
            Free audit takes 60 seconds. $147 Fix Pack turns it into implementation-ready copy.
          </p>
          <a
            href="#audit-form-card"
            className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3.5 px-10 rounded-lg text-lg transition-all"
          >
            Run my free audit →
          </a>
          <p className="text-xs text-gray-500 mt-3">No account required · No sales call · Unconditional guarantee</p>
        </section>
      </main>
    </div>
  )
}