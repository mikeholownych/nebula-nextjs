export default function DemoPage() {
  return (
    <>
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/85 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-bold text-[#e2e8f0]">✦ Nebula</span>
          <nav className="flex gap-6 text-sm text-[#94a3b8]">
            <a href="#hero" className="hover:text-white transition">Hero</a>
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <a href="#testimonials" className="hover:text-white transition">Testimonials</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
            <a href="#cta" className="hover:text-white transition">CTA</a>
            <a href="#footer" className="hover:text-white transition">Footer</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="pt-24 pb-20 bg-[#050505] relative overflow-hidden">
        <div className="absolute w-96 h-96 bg-[#4f46e5] rounded-full blur-[80px] opacity-15 -top-48 -left-24" />
        <div className="absolute w-64 h-64 bg-[#22d3ee] rounded-full blur-[80px] opacity-15 top-1/4 right-8" />
        
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#6366f1]/25 bg-[#6366f1]/8 text-[#818cf8] text-sm font-medium mb-6">
            <span>✦</span> Now in Public Beta
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 max-w-3xl mx-auto">
            Build Faster.
            <br />
            <span className="bg-gradient-to-br from-[#818cf8] to-[#22d3ee] bg-clip-text text-transparent">
              Ship Smarter.
            </span>
          </h1>
          
          <p className="text-lg text-[#94a3b8] max-w-2xl mx-auto mb-10 leading-relaxed">
            The developer platform that handles the boilerplate so you can focus on what matters — building products your users love.
          </p>
          
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button className="px-7 py-4 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white font-semibold shadow-[0_4px_20px_rgba(99,102,241,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(99,102,241,0.4)] transition">
              Start Building Free →
            </button>
            <button className="px-7 py-4 rounded-xl bg-white/6 border border-white/10 text-[#e2e8f0] font-semibold hover:bg-white/10 transition">
              See How It Works
            </button>
          </div>
          
          <div className="mt-12">
            <p className="text-sm text-[#94a3b8] mb-4">Trusted by engineers at</p>
            <div className="flex items-center justify-center gap-10 flex-wrap opacity-40 grayscale">
              <span className="text-lg font-semibold text-[#94a3b8]">Vercel</span>
              <span className="text-lg font-semibold text-[#94a3b8]">Linear</span>
              <span className="text-lg font-semibold text-[#94a3b8]">Stripe</span>
              <span className="text-lg font-semibold text-[#94a3b8]">Raycast</span>
            </div>
          </div>
        </div>
      </section>

      {/* Component Label */}
      <div className="text-center pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
        <span className="bg-[#0d0d1a] px-3 py-1 rounded border border-white/5">✦ Features Grid</span>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 bg-[#0d0d1a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#6366f1]/25 bg-[#6366f1]/8 text-[#818cf8] text-sm font-medium mb-5">
              Features
            </div>
            <h2 className="text-4xl font-bold mb-4">Everything you need to ship</h2>
            <p className="text-lg text-[#94a3b8]">
              No bloat. Just the tools that matter — designed to work together seamlessly.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "⚡", title: "Lightning Deploy", desc: "Deploy to production in under 30 seconds. Zero-config builds that just work.", color: "indigo" },
              { icon: "🔒", title: "Built-in Security", desc: "End-to-end encryption, automatic HTTPS, DDoS protection — included by default.", color: "cyan" },
              { icon: "📊", title: "Real-time Analytics", desc: "Understand your users with privacy-first analytics. No cookies, no tracking scripts.", color: "rose" },
              { icon: "🔌", title: "API-first Design", desc: "Everything is an API. Integrate with your existing tools and workflows.", color: "amber" },
              { icon: "🧩", title: "Plugin Ecosystem", desc: "Extend with 200+ plugins. Auth, payments, email, storage — one install away.", color: "indigo" },
              { icon: "🚀", title: "Edge Runtime", desc: "Run your code at the edge — 300+ locations worldwide. Sub-50ms response times.", color: "cyan" },
            ].map((feature, i) => (
              <div key={i} className="bg-gradient-to-br from-[#13132a] to-[#14142e] border border-white/6 rounded-2xl p-8 hover:border-[#6366f1]/20 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(99,102,241,0.08)] transition">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-4 ${
                  feature.color === "indigo" ? "bg-[#6366f1]/12 text-[#818cf8]" :
                  feature.color === "cyan" ? "bg-[#22d3ee]/10 text-[#22d3ee]" :
                  feature.color === "rose" ? "bg-[#f472b6]/10 text-[#f472b6]" :
                  "bg-[#fbbf24]/10 text-[#fbbf24]"
                }`}>
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2 text-[#e2e8f0]">{feature.title}</h3>
                <p className="text-sm text-[#94a3b8] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Component Label */}
      <div className="text-center py-4 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
        <span className="bg-[#0d0d1a] px-3 py-1 rounded border border-white/5">✦ Pricing Table</span>
      </div>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-[#050505] relative overflow-hidden">
        <div className="absolute w-[500px] h-[500px] bg-[#ec4899] rounded-full blur-[80px] opacity-8 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#6366f1]/25 bg-[#6366f1]/8 text-[#818cf8] text-sm font-medium mb-5">
              Pricing
            </div>
            <h2 className="text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-[#94a3b8]">
              No hidden fees. No surprises. Scale as you grow.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
            {/* Starter */}
            <div className="bg-gradient-to-br from-[#13132a] to-[#14142e] border border-white/6 rounded-2xl p-8">
              <h3 className="font-semibold text-lg mb-1 text-[#e2e8f0]">Starter</h3>
              <p className="text-sm text-[#94a3b8] mb-6">For side projects & prototypes</p>
              <div className="mb-6">
                <span className="text-5xl font-extrabold text-[#f1f5f9]">$19</span>
                <span className="text-[#94a3b8] text-base">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {["3 projects", "10GB bandwidth", "Basic analytics", "Community support"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-[#cbd5e1]">✓ {item}</li>
                ))}
              </ul>
              <button className="w-full py-3 rounded-lg border border-[#6366f1]/30 bg-transparent text-[#818cf8] font-semibold hover:bg-[#6366f1]/10 transition">
                Get Started
              </button>
            </div>
            
            {/* Pro */}
            <div className="bg-gradient-to-br from-[#1a1a3e] to-[#15152e] border border-[#6366f1]/30 rounded-2xl p-8 transform scale-105 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                Most Popular
              </div>
              <h3 className="font-semibold text-lg mb-1 text-[#e2e8f0]">Pro</h3>
              <p className="text-sm text-[#94a3b8] mb-6">For growing teams & startups</p>
              <div className="mb-6">
                <span className="text-5xl font-extrabold text-[#f1f5f9]">$49</span>
                <span className="text-[#94a3b8] text-base">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {["Unlimited projects", "100GB bandwidth", "Advanced analytics + insights", "Priority email support", "Custom domains"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-[#cbd5e1]">✓ {item}</li>
                ))}
              </ul>
              <button className="w-full py-3 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white font-semibold shadow-[0_4px_20px_rgba(99,102,241,0.3)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.4)] transition">
                Start Free Trial →
              </button>
            </div>
            
            {/* Enterprise */}
            <div className="bg-gradient-to-br from-[#13132a] to-[#14142e] border border-white/6 rounded-2xl p-8">
              <h3 className="font-semibold text-lg mb-1 text-[#e2e8f0]">Enterprise</h3>
              <p className="text-sm text-[#94a3b8] mb-6">For large organizations</p>
              <div className="mb-6">
                <span className="text-5xl font-extrabold text-[#f1f5f9]">$149</span>
                <span className="text-[#94a3b8] text-base">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {["Everything in Pro", "500GB bandwidth", "SSO + audit logs", "Dedicated account manager", "99.99% SLA"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-[#cbd5e1]">✓ {item}</li>
                ))}
              </ul>
              <button className="w-full py-3 rounded-lg border border-[#6366f1]/30 bg-transparent text-[#818cf8] font-semibold hover:bg-[#6366f1]/10 transition">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Component Label */}
      <div className="text-center py-4 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
        <span className="bg-[#0d0d1a] px-3 py-1 rounded border border-white/5">✦ Testimonials</span>
      </div>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-[#080812]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#6366f1]/25 bg-[#6366f1]/8 text-[#818cf8] text-sm font-medium mb-5">
              Testimonials
            </div>
            <h2 className="text-4xl font-bold mb-4">Loved by builders</h2>
            <p className="text-lg text-[#94a3b8]">
              Here&apos;s what our users say about shipping with us.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                quote: "Cut our deployment time from hours to seconds. The edge runtime alone saved us thousands in infrastructure costs.",
                name: "Jane Doe",
                role: "CTO, StartupXYZ",
                initials: "JD",
                gradient: "from-[#6366f1] to-[#22d3ee]"
              },
              {
                quote: "We migrated our entire stack in a weekend. The API-first design meant zero vendor lock-in. This is how developer tools should be built.",
                name: "Mike K.",
                role: "Principal Engineer, FinCorp",
                initials: "MK",
                gradient: "from-[#22d3ee] to-[#6366f1]"
              },
              {
                quote: "The plugin ecosystem is a game changer. I had auth, payments, and email set up in 15 minutes. Absolute magic.",
                name: "Alex L.",
                role: "Indie Founder",
                initials: "AL",
                gradient: "from-[#f472b6] to-[#6366f1]"
              }
            ].map((testimonial, i) => (
              <div key={i} className="bg-gradient-to-br from-[#13132a] to-[#14142e] border border-white/6 rounded-2xl p-8 flex flex-col">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, star) => (
                    <span key={star} className="text-[#fbbf24]">★</span>
                  ))}
                </div>
                <p className="text-base text-[#cbd5e1] italic flex-1 leading-relaxed">
                  &quot;{testimonial.quote}&quot;
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center font-bold text-white text-sm`}>
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-[#e2e8f0] text-sm">{testimonial.name}</p>
                    <p className="text-xs text-[#94a3b8]">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-12 flex-wrap">
            <div className="text-center">
              <div className="text-3xl font-extrabold text-[#e2e8f0]">10K+</div>
              <p className="text-xs text-[#94a3b8] mt-1">Active Developers</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold text-[#e2e8f0]">99.9%</div>
              <p className="text-xs text-[#94a3b8] mt-1">Uptime</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold text-[#e2e8f0]">200+</div>
              <p className="text-xs text-[#94a3b8] mt-1">Plugins</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold text-[#e2e8f0]">300ms</div>
              <p className="text-xs text-[#94a3b8] mt-1">Avg Response</p>
            </div>
          </div>
        </div>
      </section>

      {/* Component Label */}
      <div className="text-center py-4 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
        <span className="bg-[#0d0d1a] px-3 py-1 rounded border border-white/5">✦ FAQ Accordion</span>
      </div>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-[#050505]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#6366f1]/25 bg-[#6366f1]/8 text-[#818cf8] text-sm font-medium mb-5">
              FAQ
            </div>
            <h2 className="text-4xl font-bold">Frequently asked questions</h2>
          </div>

          <details className="bg-gradient-to-br from-[#13132a] to-[#14142e] border border-white/6 rounded-2xl p-6 cursor-pointer [&_summary::-webkit-details-marker]:hidden">
            <summary className="font-semibold text-[#e2e8f0] text-base">How does the free trial work? <span className="text-[#a5b4fc] text-xs">▼</span></summary>
            <p className="mt-4 text-sm text-[#94a3b8]">You get a full 14-day free trial with all Pro features. No credit card required. Cancel anytime, no questions asked.</p>
          </details>

          <details className="bg-gradient-to-br from-[#13132a] to-[#14142e] border border-white/6 rounded-2xl p-6 cursor-pointer mt-3 [&_summary::-webkit-details-marker]:hidden">
            <summary className="font-semibold text-[#e2e8f0] text-base">Can I deploy my existing project? <span className="text-[#a5b4fc] text-xs">▼</span></summary>
            <p className="mt-4 text-sm text-[#94a3b8]">Yes. We support all major frameworks — Next.js, Remix, Astro, SvelteKit, and plain HTML/CSS/JS. Just point us at your repo.</p>
          </details>

          <details className="bg-gradient-to-br from-[#13132a] to-[#14142e] border border-white/6 rounded-2xl p-6 cursor-pointer mt-3 [&_summary::-webkit-details-marker]:hidden">
            <summary className="font-semibold text-[#e2e8f0] text-base">What happens when I hit my bandwidth limit? <span className="text-[#a5b4fc] text-xs">▼</span></summary>
            <p className="mt-4 text-sm text-[#94a3b8]">We never shut you down. Your site stays up and we&apos;ll notify you. You can upgrade or purchase additional bandwidth.</p>
          </details>
        </div>
      </section>

      {/* Component Label */}
      <div className="text-center py-4 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
        <span className="bg-[#0d0d1a] px-3 py-1 rounded border border-white/5">✦ Call to Action</span>
      </div>

      {/* CTA Section */}
      <section id="cta" className="py-20 bg-[#0d0d1a] relative overflow-hidden">
        <div className="absolute w-[500px] h-[500px] bg-[#4f46e5] rounded-full blur-[80px] opacity-12 -top-64 left-1/2 -translate-x-1/2" />

        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#6366f1]/25 bg-[#6366f1]/8 text-[#818cf8] text-sm font-medium mb-5">
            Get Started
          </div>
          <h2 className="text-4xl font-bold mb-4">Ready to ship faster?</h2>
          <p className="text-lg text-[#94a3b8] max-w-xl mx-auto mb-8">
            Join 10,000+ developers already building on the platform. Free for 14 days, no credit card required.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button className="px-7 py-4 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white font-semibold shadow-[0_4px_20px_rgba(99,102,241,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(99,102,241,0.4)] transition">
              Start Your Free Trial →
            </button>
            <button className="px-7 py-4 rounded-xl bg-white/6 border border-white/10 text-[#e2e8f0] font-semibold hover:bg-white/10 transition">
              Talk to Sales
            </button>
          </div>
          <p className="text-sm text-[#94a3b8] mt-5">
            No credit card required • Cancel anytime • 14-day free trial
          </p>
        </div>
      </section>

      {/* Component Label */}
      <div className="text-center py-4 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
        <span className="bg-[#0d0d1a] px-3 py-1 rounded border border-white/5">✦ Footer</span>
      </div>

      {/* Footer */}
      <footer id="footer" className="py-16 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-[#6366f1]/20 to-transparent mb-12" />

          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <h3 className="font-bold text-xl mb-3 text-[#e2e8f0]">Nebula</h3>
              <p className="text-sm text-[#94a3b8] max-w-xs leading-relaxed">
                The developer platform built for speed. Deploy, scale, and ship without the overhead.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#e2e8f0] mb-4">Product</h4>
              <ul className="space-y-2">
                {["Features", "Pricing", "Changelog", "Documentation"].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-[#94a3b8] hover:text-[#10b981] cursor-pointer transition">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#e2e8f0] mb-4">Company</h4>
              <ul className="space-y-2">
                {["About", "Blog", "Careers", "Contact"].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-[#94a3b8] hover:text-[#10b981] cursor-pointer transition">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#e2e8f0] mb-4">Legal</h4>
              <ul className="space-y-2">
                {["Privacy", "Terms", "Security", "Cookies"].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-[#94a3b8] hover:text-[#10b981] cursor-pointer transition">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-[#6366f1]/20 to-transparent my-8" />

          <div className="flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm text-[#94a3b8]">
              © 2026 Nebula. All rights reserved.
            </p>
            <div className="flex gap-4 text-sm text-[#94a3b8]">
              <span className="hover:text-[#10b981] cursor-pointer transition">𝕏</span>
              <span className="hover:text-[#10b981] cursor-pointer transition">GitHub</span>
              <span className="hover:text-[#10b981] cursor-pointer transition">Discord</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
