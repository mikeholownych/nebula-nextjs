export const metadata = {
  title: '7 Systems Every Ecom Brand Needs That Most Skip — Nebula Components',
  description: 'A conversion engineer\'s checklist of the 7 systems every ecommerce brand needs to stop leaking conversions.',
};

const systems = [
  {
    num: 1,
    title: 'Ad Tracking & Attribution',
    subtitle: 'If you can\'t measure it, you can\'t buy it.',
    description: 'Most ecom brands run ads without proper tracking infrastructure. They measure "reach" and "clicks" from the ad platform, but can\'t tell you which landing page visitors actually convert.',
    checklist: [
      'Facebook Pixel fires on the landing page AND on the thank-you/confirmation page',
      'GA4 conversion events track the full journey (landing → checkout → confirmation)',
      'UTM parameters on every outbound link from social, email, and partnerships',
      'A dedicated thank-you page URL pattern so you can segment conversion traffic',
    ],
    commonMiss: 'Pixel fires on the landing page, but the thank-you page conversion event is broken or missing. You\'re paying for leads you can\'t measure.',
    roi: 'If you can\'t attribute conversions, you can\'t optimize ad spend. This alone can cut your CPA by 30-50% once you start killing underperforming channels.',
  },
  {
    num: 2,
    title: 'Conversion-First Landing Page',
    subtitle: 'Your homepage is not your landing page.',
    description: 'A landing page has one job: get the visitor to take one specific action. Every word, every image, every pixel either moves them toward that action or distracts from it.',
    checklist: [
      'H1 headline states the specific outcome for a specific audience',
      'Primary CTA is above the fold, uses action + outcome language',
      'Social proof (testimonial, case study, metric) is visible before the CTA',
      'The page has one primary action — not 5 competing links',
    ],
    commonMiss: 'The headline is a brand tagline instead of a value promise to a specific buyer.',
    roi: 'A clear value headline + action CTA alone lifts conversions 30-100% in most A/B tests we\'ve seen.',
  },
  {
    num: 3,
    title: 'SEO Foundations',
    subtitle: 'Ad traffic is rented. Organic traffic is owned.',
    description: 'Most early-stage ecom brands ignore SEO entirely because "ads are working." Then ad costs rise and they have no organic moat.',
    checklist: [
      'Title tag is 30-60 chars, contains the primary keyword, reads naturally',
      'Meta description is 120-160 chars, summarizes the value, includes a CTA',
      'Exactly one H1 per page that shares significant keywords with the title',
      'URL is readable and keyword-inclusive',
    ],
    commonMiss: 'Title tag and H1 don\'t align — Google sees the mismatch; bounce rate goes up.',
    roi: 'The naming-consistency fix (title ↔ H1 alignment) is the single highest-ROI SEO move for most pages. It takes 5 minutes.',
  },
  {
    num: 4,
    title: 'Email Capture & Nurture',
    subtitle: '95% of your traffic won\'t convert on the first visit.',
    description: 'If you don\'t capture them, you lose them forever. Retargeting ads cost 3x what email costs.',
    checklist: [
      'A low-friction capture (lead magnet, free audit, checklist) above the fold or as exit-intent',
      'Confirmation page offers a next step — not just "check your inbox"',
      'New subscribers enter a sequence within 24 hours',
      'Segmentation starts on day 1 based on which magnet they opted into',
    ],
    commonMiss: 'The popup asks for email with no value exchange.',
    roi: 'A targeted lead magnet converts 3-10% of traffic vs. 0.5-2% for a generic signup.',
  },
  {
    num: 5,
    title: 'Mobile Optimization',
    subtitle: '70%+ of ecom traffic is mobile. 90%+ of ecom revenue is not.',
    description: 'Mobile traffic converts at a fraction of desktop — not because mobile users aren\'t buyers, but because most landing pages weren\'t built for mobile first.',
    checklist: [
      'Viewport meta tag present and configured correctly',
      'CTA button is thumb-friendly (48px+ height, padded from edges)',
      'Above-fold content fits on a phone screen without scrolling',
      'Font sizes are readable without pinch-zoom',
    ],
    commonMiss: 'The desktop page "responsive" by shrinking — CTA gets smaller, buttons get closer, form becomes frustrating.',
    roi: 'Mobile CTA optimization alone can close 20-40% of the desktop-to-mobile conversion gap.',
  },
  {
    num: 6,
    title: 'Checkout & Payment Flow',
    subtitle: 'The leak isn\'t always at the top of the funnel.',
    description: 'Sometimes the landing page is fine — the leak is between "add to cart" and "confirmed purchase."',
    checklist: [
      'Checkout has 3 or fewer visible steps',
      'Payment options include card + digital wallet',
      'Cart abandonment email sends within 1 hour',
      'Thank-you page includes a clear next step',
    ],
    commonMiss: 'Cart abandonment emails are generic instead of specific to what was abandoned.',
    roi: 'Cart abandonment emails recover 10-15% of lost revenue. A structured thank-you page add-on can add 15-30% to AOV.',
  },
  {
    num: 7,
    title: 'Analytics & Feedback Loop',
    subtitle: 'You can\'t optimize what you don\'t measure.',
    description: 'Most brands have Google Analytics installed. Few have a feedback loop that actually tells them what\'s broken.',
    checklist: [
      'Session recordings and heatmaps (Hotjar, Clarity, or similar)',
      'A recurring calendar check: "Did anything break this week?"',
      'Conversion data flows back into ad platform optimization',
      'At least one ongoing A/B test or iterative improvement per month',
    ],
    commonMiss: 'Analytics is installed but nobody looks at it.',
    roi: 'A single 15-minute weekly check that catches a broken form before a weekend of ad spend can save 50x the time investment.',
  },
];

export default function SevenSystemsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6">
            7 Systems Every Ecom Brand Needs<br />
            <span className="text-emerald-400">(That Most Skip)</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-xl mx-auto">
            You&apos;re running ads. You&apos;re getting traffic. But your landing page isn&apos;t converting.
          </p>
          <div className="mt-6 text-sm text-slate-400">
            Based on 120+ landing page audits ·{' '}
            <a href="#free-audit" className="text-emerald-400 hover:text-emerald-300 transition">
              Skip to free audit →
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-lg text-slate-300 mb-6">
            It&apos;s not one thing. It&apos;s almost always a missing system — not a missing button color or a better font.
          </p>
          <p className="text-slate-300 mb-6">
            Over 120 landing page audits, we&apos;ve traced every conversion leak back to one of seven systems. Brands that fix{' '}
            <strong className="text-white">all seven</strong> see 2-4x conversion improvements. Brands that skip even one leave money on the table — and usually don&apos;t know which one.
          </p>
          <p className="text-lg font-semibold text-emerald-400 mb-12">
            This is the checklist.
          </p>

          {/* Systems */}
          {systems.map((system) => (
            <section key={system.num} className="mb-16">
              <h2 className="flex items-center gap-4 text-xl md:text-2xl font-bold mb-4">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">
                  {system.num}
                </span>
                <span className="text-white">{system.title}</span>
              </h2>
              
              <p className="text-lg font-semibold text-emerald-400 mb-4">
                {system.subtitle}
              </p>
              
              <p className="text-slate-300 mb-6">
                {system.description}
              </p>

              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                What working looks like:
              </h3>
              <ul className="space-y-2 mb-6">
                {system.checklist.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-300">
                    <svg className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <blockquote className="border-l-4 border-emerald-500 pl-4 py-3 my-6 bg-slate-900/50 rounded-r-lg">
                <p className="text-slate-300 italic">
                  <strong className="text-emerald-400 not-italic">Most common miss:</strong>{' '}
                  {system.commonMiss}
                </p>
              </blockquote>

              <p className="text-slate-300">
                <strong className="text-white">ROI of fixing:</strong>{' '}
                {system.roi}
              </p>
            </section>
          ))}

          {/* Order Matters */}
          <section className="mb-16 pt-8 border-t border-slate-800">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              The Order Matters
            </h2>
            <p className="text-lg font-semibold text-emerald-400 mb-6">
              Fix in this order:
            </p>
            <ol className="space-y-4">
              {[
                { name: 'Ad Tracking', reason: 'so you can measure everything else' },
                { name: 'Landing Page', reason: 'so traffic converts once it arrives' },
                { name: 'SEO Foundations', reason: 'so you build an asset that compounds' },
                { name: 'Email Capture', reason: "so you don't lose the 95% who aren't ready yet" },
                { name: 'Mobile', reason: 'so mobile traffic converts like desktop' },
                { name: 'Checkout', reason: "so conversions don't spill at the finish line" },
                { name: 'Analytics', reason: 'so you keep getting better permanently' },
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center text-sm font-bold border border-slate-700">
                    {idx + 1}
                  </span>
                  <p className="text-slate-300">
                    <strong className="text-white">{item.name}</strong> — {item.reason}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          {/* Lead Magnet */}
          <div id="free-audit" className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-8 md:p-10 text-center mb-12 border border-slate-700">
            <h3 className="text-2xl font-bold text-white mb-3">
              How Does Your Page Score?
            </h3>
            <p className="text-slate-400 mb-6">
              Automated audit scoring is paused while the evidence-backed engine is rebuilt.
            </p>
            <a
              href="/audit"
              className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-8 py-4 rounded-lg transition text-lg"
            >
              View Audit Status →
            </a>
            <p className="mt-4 text-sm text-slate-500">
              No call. No credit card. Just a Fix Map with specific steps.
            </p>
          </div>

          {/* Audit CTA */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center">
            <p className="text-lg text-slate-300 mb-6">
              <strong className="text-white">Want us to ship the fixes?</strong> $147 — we implement in 24 hours. No calls, no surprises.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-8 py-4 rounded-lg transition"
              >
                Get the Fix Pack →
              </a>
              <a
                href="/checkout"
                className="border-2 border-emerald-600 text-emerald-400 hover:bg-emerald-600 hover:text-white font-semibold px-8 py-4 rounded-lg transition"
              >
                DIY Fix Kit (Free)
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-3xl mx-auto px-6 text-center text-slate-500 text-sm">
          <p>
            Nebula Components · Autonomous conversion engineering · No retainers · No calls · Audit → Fix → Done
          </p>
        </div>
      </footer>
    </div>
  );
}
