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
      { feature: "Cost", nebula: "Free audit + $97 repair sprint", competitor: "Free", nebulaWins: false },
      { feature: "Requires signup", nebula: "No", competitor: "No", nebulaWins: true },
      { feature: "Results in under 30 seconds", nebula: "Yes", competitor: "Yes — 10 to 30 seconds", nebulaWins: true },
      { feature: "Checks conversion criteria", nebula: "Yes — message match, CTA, trust, mobile CTA, form friction, compliance", competitor: "No — Core Web Vitals and performance only", nebulaWins: true },
      { feature: "Output language", nebula: "Conversion-framed for founders", competitor: "Technical metrics — LCP, CLS, INP, TTFB", nebulaWins: true },
      { feature: "Page-specific findings", nebula: "Yes — evidence from your actual page HTML", competitor: "Yes — performance data for the submitted URL", nebulaWins: true },
      { feature: "Fix path included", nebula: "$97 repair sprint — exact copy, code, or config changes", competitor: "Developer-level suggestions only — no implementation", nebulaWins: true },
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
      { feature: "Cost", nebula: "Free audit + $97 repair sprint", competitor: "Free", nebulaWins: false },
      { feature: "Requires email to see results", nebula: "No", competitor: "Yes — email is required before results are shown", nebulaWins: true },
      { feature: "Checks conversion criteria", nebula: "Yes — evidence-backed conversion checks including CTA, trust, social proof, and message match", competitor: "No — performance, SEO, mobile, security only", nebulaWins: true },
      { feature: "Output specificity", nebula: "Evidence from your actual page HTML per signal", competitor: "Overall grade + 4 category scores — 17 metrics claimed", nebulaWins: true },
      { feature: "Deep landing pages supported", nebula: "Yes — any public URL", competitor: "No — homepage scan only", nebulaWins: true },
      { feature: "Fix path included", nebula: "$97 repair sprint targeted to your specific failing signals", competitor: "Generic tiered recommendations only — no implementation instructions", nebulaWins: true },
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
      { feature: "Checks conversion criteria", nebula: "Yes — 9 specific conversion checks per page", competitor: "No — accessibility, SEO, content quality, legal compliance", nebulaWins: true },
      { feature: "Audience", nebula: "Founders running paid ads on a single landing page", competitor: "Enterprise teams managing large site portfolios", nebulaWins: true },
      { feature: "Evidence per finding", nebula: "Yes — HTML evidence shown per signal", competitor: "Score + audit log per page element", nebulaWins: true },
      { feature: "Fix path", nebula: "$97 tailored implementation kit — implement yourself or with developer", competitor: "Remediation workflow tools inside the platform", nebulaWins: false },
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
      { feature: "Audits why a page is not converting", nebula: "Yes — conversion checks with evidence per finding", competitor: "No — Smart Traffic routes between variants, it does not diagnose", nebulaWins: true },
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
      { feature: "Cost", nebula: "Free audit + $97 repair sprint", competitor: "Free — built into Chrome DevTools or CLI", nebulaWins: false },
      { feature: "Requires install or DevTools access", nebula: "No — paste URL, get results in browser", competitor: "Yes — Chrome DevTools, PageSpeed, or Node CLI", nebulaWins: true },
      { feature: "Checks conversion criteria", nebula: "Yes — message match, CTA, trust, mobile CTA, form friction", competitor: "No — performance, accessibility, SEO, PWA only", nebulaWins: true },
      { feature: "Output audience", nebula: "Founders and marketers — plain English", competitor: "Developers — technical audit terminology", nebulaWins: true },
      { feature: "Fix path", nebula: "$97 repair sprint — copy, code, or config changes written for your page", competitor: "Developer-facing suggestions — no implementation path for marketers", nebulaWins: true },
      { feature: "No technical knowledge required", nebula: "Yes", competitor: "No — requires understanding of web performance metrics and dev tooling", nebulaWins: true },
      { feature: "Works on any public URL", nebula: "Yes", competitor: "Yes", nebulaWins: true },
    ],
    verdict: "Lighthouse is the right tool for a developer optimising performance. If you are a founder running Google Ads and the page is loading fine but not converting, Lighthouse will not tell you why. Nebula checks the conversion layer Lighthouse does not reach.",
  },

  "hotjar": {
    slug: "hotjar",
    competitorName: "Hotjar",
    competitorUrl: "https://hotjar.com",
    tagline: "Hotjar vs. Nebula — heatmap tool vs. conversion audit",
    intent: "Hotjar shows you where users click after they land. Nebula shows you why the page was never going to convert in the first place.",
    checkedAt: "August 2026",
    targetQuery: "hotjar alternative conversion audit landing page",
    rows: [
      { feature: "Cost", nebula: "Free audit + $97 repair sprint", competitor: "Free (35 daily sessions), Plus $32/mo, Business $80/mo", nebulaWins: true },
      { feature: "Requires existing traffic", nebula: "No — works on any public URL immediately", competitor: "Yes — needs real user visits to generate heatmap data", nebulaWins: true },
      { feature: "Checks conversion criteria", nebula: "Yes — message match, CTA, trust, above-fold, form friction", competitor: "No — shows click, scroll, and move behaviour only", nebulaWins: true },
      { feature: "Heatmaps and session recordings", nebula: "No", competitor: "Yes — core feature", nebulaWins: false },
      { feature: "Surveys and feedback widgets", nebula: "No", competitor: "Yes — on-site surveys and feedback polls", nebulaWins: false },
      { feature: "Conversion scoring", nebula: "Yes — pass/fail score per conversion signal", competitor: "No — raw behavioural data, no diagnosis", nebulaWins: true },
      { feature: "AI readiness check", nebula: "Yes — checks structured data and AI citation signals", competitor: "No", nebulaWins: true },
      { feature: "Message-match check", nebula: "Yes — verifies ad claim matches page headline", competitor: "No", nebulaWins: true },
      { feature: "Fix path included", nebula: "$97 repair sprint targeted to your specific failing signals", competitor: "No — data only, no remediation guidance", nebulaWins: true },
    ],
    verdict: "Hotjar and Nebula solve different problems at different stages. Hotjar is a post-launch optimisation tool — you need traffic, time, and sessions to get actionable data. Nebula is a pre-conversion diagnostic — it tells you whether the page is structurally ready to convert before you spend another dollar on ads. If your page has a message-match failure or a weak CTA, Hotjar will show you people leaving. Nebula tells you why before they arrive.",
  },

  "semrush-site-audit": {
    slug: "semrush-site-audit",
    competitorName: "SEMrush Site Audit",
    competitorUrl: "https://semrush.com/siteaudit",
    tagline: "SEMrush Site Audit vs. Nebula — technical SEO crawler vs. conversion audit",
    intent: "SEMrush Site Audit finds broken links and crawl errors. Nebula finds why your paid traffic is not converting.",
    checkedAt: "August 2026",
    targetQuery: "semrush site audit alternative conversion audit paid traffic",
    rows: [
      { feature: "Cost", nebula: "Free audit + $97 repair sprint", competitor: "SEMrush Pro $139.95/mo (includes Site Audit)", nebulaWins: true },
      { feature: "Checks conversion criteria", nebula: "Yes — message match, CTA, trust, above-fold, form friction", competitor: "No — 130+ technical SEO checks only", nebulaWins: true },
      { feature: "Technical SEO crawl (broken links, redirects)", nebula: "No", competitor: "Yes — core feature with 130+ checks", nebulaWins: false },
      { feature: "Above-fold analysis", nebula: "Yes — checks what visitors see without scrolling", competitor: "No", nebulaWins: true },
      { feature: "Message-match check", nebula: "Yes — verifies ad claim matches page headline", competitor: "No", nebulaWins: true },
      { feature: "Ad signal detection", nebula: "Yes — checks page readiness for paid traffic", competitor: "No — designed for organic SEO health", nebulaWins: true },
      { feature: "Audience", nebula: "Founders running paid ads on landing pages", competitor: "SEO professionals managing site-wide technical health", nebulaWins: true },
      { feature: "Fix path included", nebula: "$97 repair sprint — conversion-specific remediation", competitor: "Issue list with priority scores — no ad/conversion guidance", nebulaWins: true },
    ],
    verdict: "SEMrush Site Audit is the right tool for an SEO team fixing crawl errors, thin content, and broken internal links across a large site. If you are running Google or Meta ads to a specific landing page and want to know why it is not converting, SEMrush will tell you the page has a missing alt tag — not that your headline does not match your ad copy. Nebula is built for that diagnosis.",
  },

  "crazy-egg": {
    slug: "crazy-egg",
    competitorName: "Crazy Egg",
    competitorUrl: "https://crazyegg.com",
    tagline: "Crazy Egg vs. Nebula — visual analytics vs. conversion audit",
    intent: "Crazy Egg shows you user behaviour data from existing traffic. Nebula diagnoses your conversion structure before you have a single visitor.",
    checkedAt: "August 2026",
    targetQuery: "crazy egg alternative conversion audit no traffic needed",
    rows: [
      { feature: "Cost", nebula: "Free audit + $97 repair sprint", competitor: "Starter $49/mo, Plus $99/mo, Pro $249/mo", nebulaWins: true },
      { feature: "Requires existing traffic", nebula: "No — instant audit on any public URL", competitor: "Yes — heatmaps and recordings require real user visits", nebulaWins: true },
      { feature: "Heatmaps and A/B testing", nebula: "No", competitor: "Yes — snapshots, scrollmaps, A/B testing built in", nebulaWins: false },
      { feature: "Conversion scoring", nebula: "Yes — structured pass/fail per conversion signal", competitor: "No — visual data only, no conversion diagnosis", nebulaWins: true },
      { feature: "Message-match check", nebula: "Yes", competitor: "No", nebulaWins: true },
      { feature: "SEO foundations check", nebula: "Yes — title, meta, schema, canonical", competitor: "No", nebulaWins: true },
      { feature: "AI readiness check", nebula: "Yes — structured data and citation signals", competitor: "No", nebulaWins: true },
      { feature: "Time to first insight", nebula: "Under 2 minutes — no traffic needed", competitor: "Days to weeks — requires traffic volume for statistical data", nebulaWins: true },
      { feature: "Fix path included", nebula: "$97 repair sprint for your specific failing signals", competitor: "No remediation — data visualisation only", nebulaWins: true },
    ],
    verdict: "Crazy Egg is a solid visual analytics tool for teams who already have traffic and want to understand how users interact with a page. The problem: if your page has a structural conversion failure — weak headline, missing trust signals, CTA below the fold — Crazy Egg will confirm people are leaving, but it cannot tell you why before you burn ad spend finding out. Nebula works before you have data.",
  },

  "screaming-frog": {
    slug: "screaming-frog",
    competitorName: "Screaming Frog",
    competitorUrl: "https://screamingfrog.co.uk/seo-spider",
    tagline: "Screaming Frog vs. Nebula — SEO spider vs. conversion audit",
    intent: "Screaming Frog crawls your site for technical SEO issues. Nebula audits a landing page for the conversion signals that determine whether paid traffic turns into customers.",
    checkedAt: "August 2026",
    targetQuery: "screaming frog alternative conversion audit landing page",
    rows: [
      { feature: "Cost", nebula: "Free audit + $97 repair sprint", competitor: "Free (500 URL limit), Paid £199/year", nebulaWins: true },
      { feature: "Requires desktop install", nebula: "No — browser-based, paste URL and go", competitor: "Yes — Windows/Mac desktop application", nebulaWins: true },
      { feature: "Technical site crawl (broken links, redirects, metadata)", nebula: "No", competitor: "Yes — core feature, highly configurable", nebulaWins: false },
      { feature: "Checks conversion criteria", nebula: "Yes — message match, CTA, trust, above-fold, form friction", competitor: "No — technical SEO data only", nebulaWins: true },
      { feature: "Audience", nebula: "Founders and marketers — no technical knowledge required", competitor: "Developers and SEO professionals", nebulaWins: true },
      { feature: "Above-fold and CTA analysis", nebula: "Yes", competitor: "No", nebulaWins: true },
      { feature: "Message-match check", nebula: "Yes", competitor: "No", nebulaWins: true },
      { feature: "Fix path included", nebula: "$97 repair sprint — plain-English conversion fixes", competitor: "Raw data export — requires developer to interpret and act", nebulaWins: true },
    ],
    verdict: "Screaming Frog is the industry-standard site crawler for developers and SEO professionals who need deep technical audits — broken links, redirect chains, duplicate content, hreflang issues. If you are a founder who has just launched a landing page and needs to know why your Google Ads campaign is not converting, Screaming Frog is not the right tool. Nebula is built for that diagnosis, in a browser, in under 2 minutes.",
  },

  "google-analytics": {
    slug: "google-analytics",
    competitorName: "Google Analytics (GA4)",
    competitorUrl: "https://analytics.google.com",
    tagline: "Google Analytics vs. Nebula — traffic analytics vs. conversion audit",
    intent: "GA4 measures what happened after visitors arrived. Nebula diagnoses why they did not convert before you look at a single report.",
    checkedAt: "August 2026",
    targetQuery: "google analytics alternative conversion diagnosis landing page audit",
    rows: [
      { feature: "Cost", nebula: "Free audit + $97 repair sprint", competitor: "Free (GA4); Analytics 360 enterprise pricing", nebulaWins: false },
      { feature: "Requires existing traffic", nebula: "No — instant audit on any public URL", competitor: "Yes — needs visits and event data to provide insights", nebulaWins: true },
      { feature: "Checks conversion criteria", nebula: "Yes — message match, CTA, trust, above-fold, form friction, AI readiness", competitor: "No — measures traffic, events, and goals after the fact", nebulaWins: true },
      { feature: "Page quality scoring", nebula: "Yes — structured pass/fail per conversion signal", competitor: "No — engagement metrics only (bounce rate, session duration)", nebulaWins: true },
      { feature: "Message-match check", nebula: "Yes — verifies ad claim matches page headline", competitor: "No", nebulaWins: true },
      { feature: "Above-fold analysis", nebula: "Yes", competitor: "No", nebulaWins: true },
      { feature: "Shows what happened", nebula: "No — diagnosis, not measurement", competitor: "Yes — complete traffic and conversion funnel measurement", nebulaWins: false },
      { feature: "Time to first insight", nebula: "Under 2 minutes — no setup required", competitor: "Days to weeks — requires tag implementation and data accumulation", nebulaWins: true },
      { feature: "Fix path included", nebula: "$97 repair sprint — targeted to your specific failing signals", competitor: "No — data reporting only, no remediation", nebulaWins: true },
    ],
    verdict: "Google Analytics and Nebula answer different questions. GA4 tells you what happened: how many sessions, which pages had the highest exit rate, which campaigns drove conversions. Nebula tells you why a specific page is not converting — before you have enough data to see it in GA4. If your landing page has a message-match failure or a trust signal gap, GA4 will eventually surface a high bounce rate. Nebula catches it on day one.",
  },
}
