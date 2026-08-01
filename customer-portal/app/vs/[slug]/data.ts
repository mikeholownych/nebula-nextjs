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
      { feature: "Results in under 2 min", nebula: "Yes", competitor: "Yes", nebulaWins: true },
      { feature: "Conversion signals checked", nebula: "7 — message match, CTA, trust, mobile, load, form, compliance", competitor: "Load time and Core Web Vitals only", nebulaWins: true },
      { feature: "Output language", nebula: "Conversion-framed for founders", competitor: "Technical metrics — LCP, CLS, INP", nebulaWins: true },
      { feature: "Page-specific findings", nebula: "Yes — evidence from your actual page", competitor: "Yes — performance data only", nebulaWins: true },
      { feature: "Fix path", nebula: "$97 AI prompts — implement yourself", competitor: "Lighthouse suggestions (generic)", nebulaWins: true },
      { feature: "Works on any URL", nebula: "Yes", competitor: "Yes", nebulaWins: true },
    ],
    verdict: "PageSpeed Insights is the right tool if Core Web Vitals are your bottleneck. If your page loads fine but still does not convert, that is a different problem — message match, trust signals, and CTA clarity do not appear in any PageSpeed report. Nebula checks those.",
  },

  "hubspot-website-grader": {
    slug: "hubspot-website-grader",
    competitorName: "HubSpot Website Grader",
    competitorUrl: "https://website.grader.com",
    tagline: "HubSpot Website Grader vs. Nebula — landing page audit comparison",
    intent: "Website Grader gives you a broad health score. Nebula scores the specific signals that determine whether paid traffic converts.",
    checkedAt: "August 2026",
    targetQuery: "hubspot website grader alternative landing page audit",
    rows: [
      { feature: "Cost", nebula: "Free audit + $97 fix prompts", competitor: "Free", nebulaWins: false },
      { feature: "Requires email to see results", nebula: "No", competitor: "Yes — email required", nebulaWins: true },
      { feature: "Conversion-focused signals", nebula: "Yes — 7 signals", competitor: "No — performance, SEO, mobile, security", nebulaWins: true },
      { feature: "Output specificity", nebula: "Evidence from your actual page HTML", competitor: "Generic score across 4 categories", nebulaWins: true },
      { feature: "Fix path included", nebula: "$97 AI prompts for your specific issue", competitor: "Generic recommendations only", nebulaWins: true },
      { feature: "Works on any URL", nebula: "Yes", competitor: "Yes", nebulaWins: true },
      { feature: "No sales funnel attached", nebula: "Yes", competitor: "No — HubSpot CRM upsell", nebulaWins: true },
    ],
    verdict: "Website Grader requires your email and feeds you into the HubSpot marketing funnel. Nebula requires no signup and focuses entirely on whether your landing page is stopping conversions — not whether your site has SSL or a sitemap.",
  },

  "nibbler": {
    slug: "nibbler",
    competitorName: "Nibbler",
    competitorUrl: "https://nibbler.silktide.com",
    tagline: "Nibbler site audit vs. Nebula — landing page conversion audit comparison",
    intent: "Nibbler audits your whole website for SEO and accessibility. Nebula audits one landing page for conversion.",
    checkedAt: "August 2026",
    targetQuery: "nibbler site audit alternative conversion audit",
    rows: [
      { feature: "Cost", nebula: "Free audit + $97 fix prompts", competitor: "Free (limited) or paid plans", nebulaWins: false },
      { feature: "Requires signup for full report", nebula: "No", competitor: "Yes — free tier is limited", nebulaWins: true },
      { feature: "Scope", nebula: "One landing page, conversion signals", competitor: "Whole site — SEO, accessibility, social", nebulaWins: true },
      { feature: "Conversion signals", nebula: "Yes — 7 specific conversion checks", competitor: "No — general site health", nebulaWins: true },
      { feature: "Evidence per finding", nebula: "Yes — actual HTML evidence shown", competitor: "Score with brief note", nebulaWins: true },
      { feature: "Fix path", nebula: "$97 targeted AI prompts", competitor: "Generic tips only", nebulaWins: true },
      { feature: "Audience", nebula: "Founders running paid ads", competitor: "General webmasters and agencies", nebulaWins: true },
    ],
    verdict: "Nibbler is useful for a broad site health scan — good for agencies doing client onboarding. Nebula is purpose-built for founders running paid traffic who need to know if the landing page is the reason the ad spend is not returning.",
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
      { feature: "Cost", nebula: "Free audit + $97 fix prompts", competitor: "Free (built into Chrome DevTools)", nebulaWins: false },
      { feature: "Requires install or DevTools", nebula: "No — paste URL, get results", competitor: "Yes — Chrome DevTools or CLI", nebulaWins: true },
      { feature: "Conversion signals", nebula: "Yes — message match, CTA, trust, mobile CTA, form friction", competitor: "No — performance, accessibility, SEO, PWA", nebulaWins: true },
      { feature: "Audience", nebula: "Founders and marketers", competitor: "Developers", nebulaWins: true },
      { feature: "Output language", nebula: "Plain English — your CTA is not visible above fold", competitor: "Technical auditor output", nebulaWins: true },
      { feature: "Fix path", nebula: "$97 AI prompts — copy, code, or config changes", competitor: "Lighthouse suggestions (developer-facing)", nebulaWins: true },
      { feature: "No technical knowledge needed", nebula: "Yes", competitor: "No — requires understanding of web performance metrics", nebulaWins: true },
    ],
    verdict: "Lighthouse is the right tool for a developer optimising performance. If you are a founder running Google Ads and the page is loading fine but not converting, Lighthouse will not tell you why. Nebula checks the conversion layer Lighthouse does not reach.",
  },
}
