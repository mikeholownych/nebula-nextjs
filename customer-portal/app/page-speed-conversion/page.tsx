const jsonLdArticle = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Page Speed and Conversion Rate",
  "description": "How slow load times kill landing page conversions — and the 3 fastest fixes.",
  "url": "https://nebulacomponents.shop/page-speed-conversion",
  "publisher": {
    "@type": "Organization",
    "name": "Nebula Components",
    "url": "https://nebulacomponents.shop"
  }
}

const jsonLdFaq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much does page speed affect conversion rate?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Google data shows a 1-second delay reduces conversions by 7%. Akamai research found that a 2-second load time has a 103% higher bounce rate than a 1-second load time. On paid ad campaigns, slow load time means paying the same per click to convert half as many visitors."
      }
    },
    {
      "@type": "Question",
      "name": "What is the fastest way to improve landing page load speed?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Compress and convert images to WebP format — this is typically the highest-impact change. Images are responsible for 60–80% of page weight on most landing pages. Next: defer or remove render-blocking JavaScript. Third: check for and remove redundant third-party scripts (chat widgets, analytics, pixel tags that load synchronously)."
      }
    },
    {
      "@type": "Question",
      "name": "What are Core Web Vitals for landing pages?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The three Core Web Vitals are: Largest Contentful Paint (LCP — how fast the main content loads, target under 2.5s), First Input Delay (FID — how fast the page responds to clicks, target under 100ms), and Cumulative Layout Shift (CLS — how much the layout jumps during load, target under 0.1). All three are Google ranking signals."
      }
    },
    {
      "@type": "Question",
      "name": "Does page speed affect Google Ads Quality Score?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Google's landing page experience component of Quality Score includes load speed. A slow landing page lowers your Quality Score, which increases your cost-per-click. A faster page can reduce CPC by 10–30% on the same keywords."
      }
    }
  ]
}

export default function PageSpeedConversion() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdArticle) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />
      <div className="max-w-[720px] mx-auto px-6 py-12 pb-20">
        <header className="border-b border-border pb-6 mb-12 flex justify-between items-center">
          <a className="text-fg font-bold text-sm tracking-wider uppercase no-underline hover:text-accent transition-colors" href="/">● Nebula Components</a>
          <a className="bg-accent text-bg text-[13px] font-semibold px-4 py-2 rounded-md no-underline hover:bg-accent-light transition-colors" href="/audit">Run free audit →</a>
        </header>

        <h1 className="text-[clamp(1.8rem,4vw,2.4rem)] font-extrabold leading-tight text-fg my-8 mb-4">Page Speed and Conversion Rate</h1>
        <p className="text-fg-muted text-[1.05rem] mb-2">Google research shows a 1-second delay in load time reduces conversions by 7%. On paid traffic, you pay the same cost-per-click whether your page loads in 1 second or 6. Every extra second of load time is money you&apos;ve already spent to acquire a visitor — then lost.</p>

        <blockquote className="border border-border py-4 px-5 bg-bg-panel rounded-xl my-6">
          <p className="m-0 text-fg-muted"><strong className="text-fg">Quick Answer:</strong> A 1-second delay cuts conversions by 7%. The 3 fastest fixes are: compress images to WebP (biggest impact, least effort), defer render-blocking JavaScript, and use a CDN for static assets. Check your current speed free at Google PageSpeed Insights — Largest Contentful Paint above 2.5s is a guaranteed conversion leak.</p>
        </blockquote>

        <h2 className="text-[1.4rem] font-bold text-fg my-12 mb-4">Frequently Asked Questions</h2>

        <div className="bg-bg-panel border border-border rounded-[10px] p-5 mb-4">
          <h3 className="m-0 mb-2 text-base font-bold text-fg">How much does page speed affect conversion rate?</h3>
          <p className="m-0 text-[0.95rem] text-fg-muted">Google data shows a 1-second delay reduces conversions by 7%. Akamai research found that a 2-second load time has a 103% higher bounce rate than a 1-second load time. On paid ad campaigns, slow load time means paying the same per click to convert half as many visitors.</p>
        </div>
        <div className="bg-bg-panel border border-border rounded-[10px] p-5 mb-4">
          <h3 className="m-0 mb-2 text-base font-bold text-fg">What is the fastest way to improve landing page load speed?</h3>
          <p className="m-0 text-[0.95rem] text-fg-muted">Compress and convert images to WebP format — this is typically the highest-impact change. Images are responsible for 60–80% of page weight on most landing pages. Next: defer or remove render-blocking JavaScript. Third: check for and remove redundant third-party scripts (chat widgets, analytics, pixel tags that load synchronously).</p>
        </div>
        <div className="bg-bg-panel border border-border rounded-[10px] p-5 mb-4">
          <h3 className="m-0 mb-2 text-base font-bold text-fg">What are Core Web Vitals for landing pages?</h3>
          <p className="m-0 text-[0.95rem] text-fg-muted">The three Core Web Vitals are: Largest Contentful Paint (LCP — how fast the main content loads, target under 2.5s), First Input Delay (FID — how fast the page responds to clicks, target under 100ms), and Cumulative Layout Shift (CLS — how much the layout jumps during load, target under 0.1). All three are Google ranking signals.</p>
        </div>
        <div className="bg-bg-panel border border-border rounded-[10px] p-5 mb-4">
          <h3 className="m-0 mb-2 text-base font-bold text-fg">Does page speed affect Google Ads Quality Score?</h3>
          <p className="m-0 text-[0.95rem] text-fg-muted">Yes. Google&apos;s landing page experience component of Quality Score includes load speed. A slow landing page lowers your Quality Score, which increases your cost-per-click. A faster page can reduce CPC by 10–30% on the same keywords.</p>
        </div>

        <section className="bg-bg-panel border border-border rounded-[10px] p-5 mt-12">
          <h3 className="text-base text-fg-muted m-0 mb-3 uppercase tracking-wider">Related Articles</h3>
          <a className="block text-accent no-underline text-[0.95rem] mb-2 hover:text-accent-light transition-colors" href="/why-landing-pages-dont-convert">Why Your Landing Page Isn&apos;t Converting</a>
          <a className="block text-accent no-underline text-[0.95rem] mb-2 hover:text-accent-light transition-colors" href="/what-is-landing-page-audit">What Is a Landing Page Audit?</a>
        </section>

        <div className="bg-bg-panel border border-border rounded-xl py-10 px-8 text-center mt-14">
          <h2 className="border-none p-0 m-0 mb-3 text-[1.5rem] text-fg font-bold">See exactly where your page leaks.</h2>
          <p className="text-fg-muted mb-6">Automated audit scoring is live and evidence-backed — no signup required.</p>
          <a className="inline-block bg-accent text-bg font-bold text-base py-3.5 px-8 rounded-lg no-underline hover:bg-accent-light transition-colors" href="/audit">Run free audit →</a>
          <p className="text-[13px] text-fg-muted mt-2.5">Free audit live · results in 60 seconds</p>
        </div>

      </div>
    </>
  )
}
