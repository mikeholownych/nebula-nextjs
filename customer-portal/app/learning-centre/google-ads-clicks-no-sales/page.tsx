import { createArticleSchema } from '../../lib/schema';

export const metadata = {
  title: 'Google Ads Clicks But No Sales: Check The Page Before Budget',
  description: 'If Google Ads is producing clicks but no sales, the campaign may be doing its job. The leak usually happens when the landing page breaks the chain.',
  authors: [{ name: 'Mike H', url: 'https://nebulacomponents.shop/about/team' }],
  publishedTime: '2025-07-15',
  modifiedTime: '2026-07-16',
  alternates: {
    canonical: 'https://nebulacomponents.shop/learning-centre/google-ads-clicks-no-sales',
  },
};

const articleSchema = createArticleSchema({
  headline: 'Google Ads Clicks But No Sales: Check The Page Before Budget',
  description: 'If Google Ads is producing clicks but no sales, the campaign may be doing its job. The leak usually happens when the landing page breaks the chain.',
  authorName: 'Mike H',
  authorUrl: 'https://nebulacomponents.shop/about/team',
  publishedDate: '2025-07-15',
  modifiedDate: '2026-07-16',
  url: 'https://nebulacomponents.shop/learning-centre/google-ads-clicks-no-sales',
});

export default function GoogleAdsClicksNoSales() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <main className="min-h-screen bg-bg text-fg font-sans">
        <div className="max-w-4xl mx-auto px-6 py-12">

          <p className="text-accent uppercase tracking-widest text-xs font-extrabold mb-3">
            Google Ads Leaks
          </p>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Google Ads Clicks But No Sales: Check The Page Before Budget
          </h1>

          <p className="text-lg text-fg-muted mb-6 max-w-3xl">
            If Google Ads is producing clicks but no sales, the campaign may be doing its job: creating arrival. The leak usually happens when the first screen does not match the search intent, prove credibility, or make one next step obvious.
          </p>

          {/* Author + Date Attribution */}
          <div className="flex items-center gap-4 text-sm text-fg-muted mb-8 pb-8 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-bg font-bold">
                MH
              </div>
              <div>
                <p className="font-medium text-fg">Mike H</p>
                <p className="text-xs">Founder, Nebula Components</p>
              </div>
            </div>
            <div className="text-xs">
              <p>Published: July 15, 2025</p>
              <p>Updated: July 16, 2026</p>
            </div>
          </div>

          <section className="bg-bg-panel border border-border rounded-2xl p-6 mb-6">
            <h2 className="text-2xl font-bold mb-3">Quick diagnosis</h2>
            <p className="text-fg-muted leading-relaxed">
              If Google Ads is producing clicks but no sales, the campaign may be doing its job: creating arrival. The leak usually happens when the first screen does not match the search intent, prove credibility, or make one next step obvious.
            </p>
          </section>

          <section className="bg-bg-panel border border-border rounded-2xl p-6 mb-6">
            <h2 className="text-2xl font-bold mb-3">Checklist</h2>
            <ul className="text-fg-muted space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Does the hero repeat the exact search/ad promise?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Is proof visible before the primary CTA?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Is there one next step, not three?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Does mobile load and scroll cleanly?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Are objections answered before price or checkout?</span>
              </li>
            </ul>
          </section>

          <section className="bg-bg-panel border border-border rounded-2xl p-6 mb-6">
            <h2 className="text-2xl font-bold mb-3">Example</h2>
            <p className="text-fg-muted leading-relaxed">
              A visitor searches for a fast fix, clicks the ad, then lands on a generic homepage. The click was valid. The page broke the chain.
            </p>
          </section>

          <section className="bg-bg-panel border border-accent/40 rounded-2xl p-6 mb-6">
            <h2 className="text-2xl font-bold mb-3">Find the leak on your page</h2>
            <p className="text-fg-muted mb-4">
              Run the free Nebula audit first. Buy the $147 Fix Pack only when the leak is obvious.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/audit"
                className="inline-flex items-center px-6 py-3 bg-accent text-bg font-bold rounded-xl hover:bg-accent-light transition-colors"
              >
                Run the free audit
              </a>
              <a
                href="/learning-centre/paid-traffic-leak-map"
                className="inline-flex items-center px-6 py-3 border border-border text-fg font-medium rounded-xl hover:border-accent transition-colors"
              >
                Open leak map
              </a>
            </div>
          </section>

          <section className="bg-bg-panel border border-border rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-3">Related leak checks</h2>
            <div className="space-y-3">
              <a href="/learning-centre/facebook-ads-no-leads" className="block py-2 border-b border-border hover:text-accent transition-colors">
                Facebook Ads Getting Clicks But No Leads
              </a>
              <a href="/learning-centre/landing-page-not-converting" className="block py-2 border-b border-border hover:text-accent transition-colors">
                Landing Page Not Converting? Diagnose These 5 Leaks First
              </a>
              <a href="/learning-centre/high-cpc-low-conversion" className="block py-2 border-b border-border hover:text-accent transition-colors">
                High CPC, Low Conversion: Stop Optimizing The Wrong Layer
              </a>
              <a href="/learning-centre/traffic-but-no-form-fills" className="block py-2 hover:text-accent transition-colors">
                Traffic But No Form Fills: The Form Is Usually Not The First Leak
              </a>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
