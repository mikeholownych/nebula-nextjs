export type ComparisonRow = {
  feature: string
  nebula: string
  competitor: string
  nebulaWins: boolean
}

export type Comparison = {
  slug: string
  competitorName: string
  competitorUrl: string
  tagline: string
  intent: string
  checkedAt: string
  rows: ComparisonRow[]
  verdict: string
  targetQuery: string
}

export const COMPARISONS: Record<string, Comparison> = {
  "pagespeed-insights": {
    slug: "pagespeed-insights",
    competitorName: "PageSpeed Insights",
    competitorUrl: "https://pagespeed.web.dev",
    tagline: "Google PageSpeed Insights vs. Nebula — landing page audit comparison",
    intent: "PageSpeed tells you how fast the page loads. Nebula tells you why visitors are not converting.",
    checkedAt: "August 2026",
    targetQuery: "pagespeed insights alternative landing page audit",
    rows: [
      { feature: "Cost", nebula: "Free audit + $97 fix prompts", competitor: "Free", nebulaWins: false },
      { feature: "Requires signup", nebula: "No", competitor: "No", nebulaWins: true },
      { feature: "Results in under 30 seconds", nebula: "Yes", competitor: "Yes — 10 to 30 seconds", nebulaWins: true },
      { feature: "Checks conversion signals", nebula: "Yes — message match, CTA, trust, mobile CTA, form friction, compliance", competitor: "No — Core Web Vitals and performance only", nebulaWins: true },
      { feature: "Output language", nebula: "Conversion-framed for founders", competitor: "Technical metrics — LCP, CLS, INP, TTFB", nebulaWins: true },
      { feature: "Page-specific findings", nebula: "Yes — evidence from your actual page HTML", competitor: "Yes — performance data for the submitted URL", nebulaWins: true },
      { feature: "Fix path included", nebula: "$97 AI prompts — exact copy, code, or config changes", competitor: "Developer-level suggestions only — no implementation", nebulaWins: true },
      { feature: "Works on any public URL", nebula: "Yes", competitor: "Yes", nebulaWins: true },
    ],
    verdict: "PageSpeed Insights is the right tool if Core Web Vitals are your bottleneck. If your page loads fine but still does not convert, that is a different problem — message match, trust signals, and CTA clarity do not appear in any PageSpeed report. Nebula checks those.",
  },

  "hubspot-website-grader": {
    slug: "hubspot-website-grader",
    competitorName: "HubSpot Website Grader",
    competitorUrl: "https://website.grader.com",
    tagline: "HubSpot Website Grader vs. Nebula — landing page audit comparison",
    intent: "Website Grader gives you a broad health score after capturing your email. Nebula scores conversion signals with no signup required.",
    checkedAt: "August 2026",
    targetQuery: "hubspot website grader alternative landing page audit",
    rows: [
      { feature: "Cost", nebula: "Free audit + $97 fix prompts", competitor: "Free", nebulaWins: false },
      { feature: "Requires email to see results", nebula: "No", competitor: "Yes — email is required before results are shown", nebulaWins: true },
      { feature: "Checks conversion signals", nebula: "Yes — 9 signals including CTA, trust, social proof, message match", competitor: "No — performance, SEO, mobile, security only", nebulaWins: true },
      { feature: "Output specificity", nebula: "Evidence from your actual page HTML per signal", competitor: "Overall grade + 4 category scores — 17 metrics claimed", nebulaWins: true },
      { feature: "Deep landing pages supported", nebula: "Yes — any public URL", competitor: "No — homepage scan only", nebulaWins: true },
      { feature: "Fix path included", nebula: "$97 AI prompts targeted to your specific failing signals", competitor: "Generic tiered recommendations only — no AI prompts", nebulaWins: true },
      { feature: "No sales funnel attached", nebula: "Yes — no upsell", competitor: "No — feeds directly into HubSpot CRM pipeline", nebulaWins: true },
    ],
    verdict: "Website Grader gates results behind an email capture and routes you into the HubSpot marketing funnel. Nebula requires no signup and focuses entirely on whether your landing page is stopping conversions — not whether your site has SSL or a sitemap.",
  },

  "silktide": {
    slug: "silktide",
    competitorName: "Silktide (formerly Nibbler)",
    competitorUrl: "https://silktide.com",
    tagline: "Silktide (formerly Nibbler) vs. Nebula — landing page audit comparison",
    intent: "Silktide is an enterprise website quality platform. Nebula is a free, instant audit for founders whose paid ads are not converting.",
    checkedAt: "August 2026",
    targetQuery: "nibbler site audit alternative conversion audit",
    rows: [
      { feature: "Cost", nebula: "Free audit + $97 one-time fix prompts", competitor: "Custom enterprise pricing — minimum 12-month contract", nebulaWins: true },
      { feature: "Requires sales call", nebula: "No", competitor: "Yes — demo required to get pricing", nebulaWins: true },
      { feature: "Turnaround time", nebula: "Under 2 minutes", competitor: "Weeks — enterprise onboarding required", nebulaWins: true },
      { feature: "Checks conversion signals", nebula: "Yes — 7 specific conversion checks per page", competitor: "No — accessibility, SEO, content quality, legal compliance", nebulaWins: true },
      { feature: "Audience", nebula: "Founders running paid ads on a single landing page", competitor: "Enterprise teams managing large site portfolios", nebulaWins: true },
      { feature: "Evidence per finding", nebula: "Yes — HTML evidence shown per signal", competitor: "Score + audit log per page element", nebulaWins: true },
      { feature: "Fix path", nebula: "$97 targeted AI prompts — implement yourself or with developer", competitor: "Remediation workflow tools inside the platform", nebulaWins: false },
    ],
    verdict: "The original Nibbler free tool is retired — nibbler.silktide.com now redirects to Silktide, an enterprise platform built for teams auditing hundreds of pages for accessibility and compliance. If you are a founder running Google Ads to a single landing page and want to know why it is not converting, Silktide is not designed for that use case. Nebula is.",
  },

  "unbounce": {
    slug: "unbounce",
    competitorName: "Unbounce",
    competitorUrl: "https://unbounce.com",
    tagline: "Unbounce vs. Nebula — landing page builder vs. landing page audit",
    intent: "Unbounce builds and optimizes landing pages you host inside their platform. Nebula audits any existing landing page, on any platform, for free.",
    checkedAt: "August 2026",
    targetQuery: "unbounce alternative landing page audit existing page",
    rows: [
      { feature: "Cost", nebula: "Free audit + $97 one-time fix prompts", competitor: "$29 to $249/month — AI Smart Traffic requires Optimize at $249/mo", nebulaWins: true },
      { feature: "Requires signup and credit card", nebula: "No", competitor: "Yes — 14-day trial requires credit card", nebulaWins: true },
      { feature: "Works on your existing page", nebula: "Yes — paste any public URL", competitor: "No — pages must be built inside Unbounce", nebulaWins: true },
      { feature: "Audits why a page is not converting", nebula: "Yes — 9 conversion signals, evidence per finding", competitor: "No — Smart Traffic routes between variants, it does not diagnose", nebulaWins: true },
      { feature: "Time to first insight", nebula: "Under 2 minutes", competitor: "Days to weeks — Smart Traffic requires 50+ visits to learn", nebulaWins: true },
      { feature: "Platform lock-in", nebula: "None — findings apply to your existing stack", competitor: "Full lock-in — requires migrating pages to Unbounce builder", nebulaWins: true },
      { feature: "Ongoing optimization", nebula: "30-day re-audit included", competitor: "Continuous A/B testing and traffic routing — if you stay on the platform", nebulaWins: false },
    ],
    verdict: "Unbounce is a page builder with built-in traffic optimization — it is a different tool for a different job. If you already have a landing page on Webflow, Framer, Shopify, WordPress, or any other platform and want to know why it is not converting without rebuilding it, Unbounce cannot help. Nebula audits what you already have, in under 2 minutes, for free.",
  },

  "google-lighthouse": {
    slug: "google-lighthouse",
    competitorName: "Google Lighthouse",
    competitorUrl: "https://developer.chrome.com/docs/lighthouse",
    tagline: "Google Lighthouse vs. Nebula — landing page conversion audit comparison",
    intent: "Lighthouse measures technical quality. Nebula measures conversion readiness.",
    checkedAt: "August 2026",
    targetQuery: "google lighthouse alternative conversion audit landing page",
    rows: [
      { feature: "Cost", nebula: "Free audit + $97 fix prompts", competitor: "Free — built into Chrome DevTools or CLI", nebulaWins: false },
      { feature: "Requires install or DevTools access", nebula: "No — paste URL, get results in browser", competitor: "Yes — Chrome DevTools, PageSpeed, or Node CLI", nebulaWins: true },
      { feature: "Checks conversion signals", nebula: "Yes — message match, CTA, trust, mobile CTA, form friction", competitor: "No — performance, accessibility, SEO, PWA only", nebulaWins: true },
      { feature: "Output audience", nebula: "Founders and marketers — plain English", competitor: "Developers — technical audit terminology", nebulaWins: true },
      { feature: "Fix path", nebula: "$97 AI prompts — copy, code, or config changes written for your page", competitor: "Developer-facing suggestions — no implementation path for marketers", nebulaWins: true },
      { feature: "No technical knowledge required", nebula: "Yes", competitor: "No — requires understanding of web performance metrics and dev tooling", nebulaWins: true },
      { feature: "Works on any public URL", nebula: "Yes", competitor: "Yes", nebulaWins: true },
    ],
    verdict: "Lighthouse is the right tool for a developer optimising performance. If you are a founder running Google Ads and the page is loading fine but not converting, Lighthouse will not tell you why. Nebula checks the conversion layer Lighthouse does not reach.",
  },
}
