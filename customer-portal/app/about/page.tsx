
export const metadata = {
  title: 'About Nebula Components',
  description: 'Nebula Components diagnoses landing page conversion leaks. Founded by Mike H after running $2.3M+ in ad spend and finding the same 7 leaks repeatedly.',
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-[#f5f7fb] font-sans">
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
          About Nebula Components
        </h1>
        
        <div className="prose prose-invert max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#79f2c0] mb-4">What We Do</h2>
            <p className="text-[#9aa7bd] leading-relaxed mb-4">
              Nebula Components diagnoses landing page conversion leaks. We don't sell optimization packages or monthly retainers. We find the leak, show you the dollar amount it's costing, and offer a $147 fix if you want it implemented.
            </p>
            <p className="text-[#9aa7bd] leading-relaxed">
              Our free audit delivers in 60 seconds. No calls. No email gates. Just paste your URL and see the diagnosis.
            </p>
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#79f2c0] mb-4">Why This Exists</h2>
            <p className="text-[#9aa7bd] leading-relaxed mb-4">
              After diagnosing $2.3M+ in wasted ad spend, we found the same 7 leaks repeatedly:
            </p>
            <ul className="text-[#9aa7bd] space-y-2 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-[#79f2c0]">1.</span>
                <span>Message mismatch (ad promise ≠ landing page headline)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#79f2c0]">2.</span>
                <span>No proof before CTA (visitor doesn't trust you yet)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#79f2c0]">3.</span>
                <span>Multiple CTAs competing (clicks go nowhere)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#79f2c0]">4.</span>
                <span>Mobile breakage (buttons, forms, layout)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#79f2c0]">5.</span>
                <span>Objections not answered (price, risk, credibility)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#79f2c0]">6.</span>
                <span>Slow load speed (bounce before render)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#79f2c0]">7.</span>
                <span>Unclear next step (what do they actually do?)</span>
              </li>
            </ul>
            <p className="text-[#9aa7bd] leading-relaxed">
              Agencies charge $3k-$10k for a landing page audit. We charge $0 because we found a pattern that scales. The $147 Fix Pack pays for implementing the fix.
            </p>
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#79f2c0] mb-4">Company</h2>
            <div className="bg-[#111723] border border-[#253044] rounded-2xl p-6">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#9aa7bd]">Founded</dt>
                  <dd className="text-[#f5f7fb]">2025</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#9aa7bd]">Location</dt>
                  <dd className="text-[#f5f7fb]">Toronto, Canada (Remote-first)</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#9aa7bd]">Pages Audited</dt>
                  <dd className="text-[#f5f7fb]">200+</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#9aa7bd]">Waste Diagnosed</dt>
                  <dd className="text-[#f5f7fb]">$2.3M+</dd>
                </div>
              </dl>
            </div>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-[#79f2c0] mb-4">Contact</h2>
            <p className="text-[#9aa7bd] leading-relaxed mb-4">
              Questions? Email us at{' '}
              <a href="mailto:hello@nebulacomponents.shop" className="text-[#79f2c0] hover:underline">
                hello@nebulacomponents.shop
              </a>
            </p>
            <p className="text-[#9aa7bd] leading-relaxed">
              Or run your free audit first: <a href="/audit" className="text-[#79f2c0] hover:underline">nebulacomponents.shop/audit</a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
