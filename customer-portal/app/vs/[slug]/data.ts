export type ComparisonRow = {
  feature: string
  nebula: string
  competitor: string
  nebulaWins: boolean
}

export type ComparisonFaq = {
  q: string
  a: string
}

export type Comparison = {
  slug: string
  competitorName: string
  competitorUrl: string
  tagline: string
  intent: string
  /** Bottom Line Up Front - 2-3 sentence summary placed at the TOP of the
   *  page so AI engines and skimming readers can pull the answer as a snippet
   *  (Breaking B2B MoltSets playbook: "AI tools only pull snippets"). */
  bluf: string
  checkedAt: string
  rows: ComparisonRow[]
  faqs: ComparisonFaq[]
  verdict: string
  targetQuery: string
}

export const COMPARISONS: Record<string, Comparison> = {
  "pagespeed-insights": {
    slug: "pagespeed-insights",
    competitorName: "PageSpeed Insights",
    competitorUrl: "https://pagespeed.web.dev",
    tagline: "Google PageSpeed Insights vs. Nebula - landing page audit comparison",
    intent: "PageSpeed tells you how fast the page loads. Nebula tells you why visitors are not converting.",
    bluf: "Nebula and Google PageSpeed Insights both audit a public URL in seconds, but they measure different things. PageSpeed scores Core Web Vitals; Nebula scores the conversion layer PageSpeed does not reach - headline message match, CTA clarity, trust signals, and above-fold structure. If your page loads fast but still does not convert, PageSpeed will not tell you why; Nebula will, in under 2 minutes, for free.",
    checkedAt: "August 2026",
    targetQuery: "pagespeed insights alternative landing page audit",
    rows: [
      { feature: "Cost", nebula: "Free audit + $97 repair sprint", competitor: "Free", nebulaWins: false },
      { feature: "Requires signup", nebula: "No", competitor: "No", nebulaWins: true },
      { feature: "Results in under 2 minutes", nebula: "Yes", competitor: "Yes - 10 to 30 seconds", nebulaWins: true },
      { feature: "Checks conversion criteria", nebula: "Yes - message match, CTA, trust, mobile CTA, form friction, compliance", competitor: "No - Core Web Vitals and performance only", nebulaWins: true },
      { feature: "Output language", nebula: "Conversion-framed for founders", competitor: "Technical metrics - LCP, CLS, INP, TTFB", nebulaWins: true },
      { feature: "Page-specific findings", nebula: "Yes - evidence from your actual page HTML", competitor: "Yes - performance data for the submitted URL", nebulaWins: true },
      { feature: "Fix path included", nebula: "$97 repair sprint - exact copy, code, or config changes", competitor: "Developer-level suggestions only - no implementation", nebulaWins: true },
      { feature: "Works on any public URL", nebula: "Yes", competitor: "Yes", nebulaWins: true },
    ],
    faqs: [
      { q: "What does Google PageSpeed Insights check?", a: "PageSpeed Insights checks Core Web Vitals and performance metrics: Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), Interaction to Next Paint (INP), and Time to First Byte (TTFB). It does not check headline message match, CTA clarity, trust signals, or any conversion criterion." },
      { q: "Why does my page load fast but not convert?", a: "Speed is one input to conversion, not the cause of it. A fast page can still fail on message match - the headline does not say what the ad promised - or lack proof near the CTA, or bury the action below the fold. Nebula checks those conversion signals; PageSpeed cannot see them." },
      { q: "Does Nebula check page speed too?", a: "Yes - Nebula includes a load-speed check (Lighthouse mobile performance when available, with an HTML-size fallback) as one of its 9 conversion signals. The difference: Nebula pairs speed with the conversion checks PageSpeed does not have." },
    ],
    verdict: "PageSpeed Insights is the right tool if Core Web Vitals are your bottleneck. If your page loads fine but still does not convert, that is a different problem - message match, trust signals, and CTA clarity do not appear in any PageSpeed report. Nebula checks those.",
  },

  "hubspot-website-grader": {
    slug: "hubspot-website-grader",
    competitorName: "HubSpot Website Grader",
    competitorUrl: "https://website.grader.com",
    tagline: "HubSpot Website Grader vs. Nebula - landing page audit comparison",
    intent: "Website Grader gives you a broad health score after capturing your email. Nebula scores conversion signals with no signup required.",
    bluf: "HubSpot Website Grader gives a free website health score but requires your email first and scans the homepage only. Nebula audits any landing page with no signup and scores the conversion signals Website Grader ignores - CTA clarity, trust evidence, message match, and above-fold structure. Same instant format, built for the conversion question.",
    checkedAt: "August 2026",
    targetQuery: "hubspot website grader alternative landing page audit",
    rows: [
      { feature: "Cost", nebula: "Free audit + $97 repair sprint", competitor: "Free", nebulaWins: false },
      { feature: "Requires email to see results", nebula: "No", competitor: "Yes - email is required before results are shown", nebulaWins: true },
      { feature: "Checks conversion criteria", nebula: "Yes - evidence-backed conversion checks including CTA, trust, social proof, and message match", competitor: "No - performance, SEO, mobile, security only", nebulaWins: true },
      { feature: "Output specificity", nebula: "Evidence from your actual page HTML per signal", competitor: "Overall grade + 4 category scores - 17 metrics claimed", nebulaWins: true },
      { feature: "Deep landing pages supported", nebula: "Yes - any public URL", competitor: "No - homepage scan only", nebulaWins: true },
      { feature: "Fix path included", nebula: "$97 repair sprint targeted to your specific failing signals", competitor: "Generic tiered recommendations only - no implementation instructions", nebulaWins: true },
      { feature: "No sales funnel attached", nebula: "Yes - no upsell", competitor: "No - feeds directly into HubSpot CRM pipeline", nebulaWins: true },
    ],
    faqs: [
      { q: "Does HubSpot Website Grader require an email?", a: "Yes - Website Grader captures your email before showing results and routes you into the HubSpot marketing funnel. Nebula shows full results with no signup and no email capture." },
      { q: "Can Website Grader audit a landing page?", a: "No - Website Grader scans the homepage URL only and reports broad site health (performance, SEO, mobile, security). It cannot audit a deep landing page you are running ads to. Nebula accepts any public URL, including deep landing pages." },
      { q: "What does Nebula check that Website Grader does not?", a: "Nebula checks conversion signals: headline message match against your ad, CTA clarity and placement, trust/social proof evidence, above-fold structure, ad-signal readiness, and AI citation readiness - each with evidence from the page HTML." },
    ],
    verdict: "Website Grader gates results behind an email capture and routes you into the HubSpot marketing funnel. Nebula requires no signup and focuses entirely on whether your landing page is stopping conversions - not whether your site has SSL or a sitemap.",
  },

  "silktide": {
    slug: "silktide",
    competitorName: "Silktide (formerly Nibbler)",
    competitorUrl: "https://silktide.com",
    tagline: "Silktide (formerly Nibbler) vs. Nebula - landing page audit comparison",
    intent: "Silktide is an enterprise website quality platform. Nebula is a free, instant audit for founders whose paid ads are not converting.",
    bluf: "Silktide (formerly Nibbler) is an enterprise website quality platform with custom pricing and a sales demo. Nebula is a free, instant landing page audit for founders whose paid ads are not converting. If you need accessibility and compliance checks across a large site, Silktide fits; if you need to know why one landing page is not converting, Nebula answers in under 2 minutes.",
    checkedAt: "August 2026",
    targetQuery: "nibbler site audit alternative conversion audit",
    rows: [
      { feature: "Cost", nebula: "Free audit + $97 one-time fix prompts", competitor: "Custom enterprise pricing - minimum 12-month contract", nebulaWins: true },
      { feature: "Requires sales call", nebula: "No", competitor: "Yes - demo required to get pricing", nebulaWins: true },
      { feature: "Turnaround time", nebula: "Under 2 minutes", competitor: "Weeks - enterprise onboarding required", nebulaWins: true },
      { feature: "Checks conversion criteria", nebula: "Yes - 9 specific conversion checks per page", competitor: "No - accessibility, SEO, content quality, legal compliance", nebulaWins: true },
      { feature: "Audience", nebula: "Founders running paid ads on a single landing page", competitor: "Enterprise teams managing large site portfolios", nebulaWins: true },
      { feature: "Evidence per finding", nebula: "Yes - HTML evidence shown per signal", competitor: "Score + audit log per page element", nebulaWins: true },
      { feature: "Fix path", nebula: "$97 tailored implementation kit - implement yourself or with developer", competitor: "Remediation workflow tools inside the platform", nebulaWins: false },
    ],
    faqs: [
      { q: "Is Nibbler still free?", a: "No - the original free Nibbler tool is retired. nibbler.silktide.com now redirects to Silktide, an enterprise platform with custom pricing and a minimum 12-month contract. Nebula is free for the audit and does not require a contract." },
      { q: "What is Silktide used for?", a: "Silktide is an enterprise website quality platform used to audit accessibility, SEO, content quality, and legal compliance across large site portfolios. It is not designed to diagnose why a single landing page running paid traffic is not converting." },
      { q: "Does Nebula require a demo or contract?", a: "No - Nebula audits any public URL instantly, no signup, no sales call. The optional $97 repair sprint is a one-time implementation kit, not a subscription." },
    ],
    verdict: "The original Nibbler free tool is retired - nibbler.silktide.com now redirects to Silktide, an enterprise platform built for teams auditing hundreds of pages for accessibility and compliance. If you are a founder running Google Ads to a single landing page and want to know why it is not converting, Silktide is not designed for that use case. Nebula is.",
  },

  "unbounce": {
    slug: "unbounce",
    competitorName: "Unbounce",
    competitorUrl: "https://unbounce.com",
    tagline: "Unbounce vs. Nebula - landing page builder vs. landing page audit",
    intent: "Unbounce builds and optimizes landing pages you host inside their platform. Nebula audits any existing landing page, on any platform, for free.",
    bluf: "Unbounce is a landing page builder with built-in A/B testing starting at $29/month. Nebula is a free conversion audit that works on the landing page you already have - Webflow, Framer, Shopify, WordPress, anything. You do not rebuild the page; Nebula identifies which conversion signals are failing and what to fix, in under 2 minutes.",
    checkedAt: "August 2026",
    targetQuery: "unbounce alternative landing page audit existing page",
    rows: [
      { feature: "Cost", nebula: "Free audit + $97 one-time fix prompts", competitor: "$29 to $249/month - AI Smart Traffic requires Optimize at $249/mo", nebulaWins: true },
      { feature: "Requires signup and credit card", nebula: "No", competitor: "Yes - 14-day trial requires credit card", nebulaWins: true },
      { feature: "Works on your existing page", nebula: "Yes - paste any public URL", competitor: "No - pages must be built inside Unbounce", nebulaWins: true },
      { feature: "Identifies failed conversion signals", nebula: "Yes - 9 checks with evidence per finding", competitor: "No - Smart Traffic routes between variants, it does not audit", nebulaWins: true },
      { feature: "Time to first insight", nebula: "Under 2 minutes", competitor: "Days to weeks - Smart Traffic requires 50+ visits to learn", nebulaWins: true },
      { feature: "Platform lock-in", nebula: "None - findings apply to your existing stack", competitor: "Full lock-in - requires migrating pages to Unbounce builder", nebulaWins: true },
      { feature: "Ongoing optimization", nebula: "30-day re-audit included", competitor: "Continuous A/B testing and traffic routing - if you stay on the platform", nebulaWins: false },
    ],
    faqs: [
      { q: "How much does Unbounce cost?", a: "Unbounce plans start at $29/month (Launch), with Smart Traffic requiring the Optimize plan at $249/month. A 14-day trial requires a credit card. Nebula's audit is free with no card; the optional repair sprint is a one-time $97." },
      { q: "Can Unbounce audit my existing landing page?", a: "No - Unbounce only optimizes pages built inside its builder. If your page lives on Webflow, Framer, Shopify, WordPress, or any other platform, Unbounce cannot analyze it. Nebula audits any public URL regardless of platform." },
      { q: "What is a cheaper alternative to Unbounce for conversion help?", a: "If you need to know why an existing page is not converting without rebuilding it, Nebula is the direct alternative: free audit, evidence per finding, and a $97 one-time fix kit instead of a $249/month subscription." },
    ],
    verdict: "Unbounce is a page builder with built-in traffic optimization - it is a different tool for a different job. If you already have a landing page on Webflow, Framer, Shopify, WordPress, or any other platform and want to know why it is not converting without rebuilding it, Unbounce cannot help. Nebula audits what you already have, in under 2 minutes, for free.",
  },

  "google-lighthouse": {
    slug: "google-lighthouse",
    competitorName: "Google Lighthouse",
    competitorUrl: "https://developer.chrome.com/docs/lighthouse",
    tagline: "Google Lighthouse vs. Nebula - landing page conversion audit comparison",
    intent: "Lighthouse measures technical quality. Nebula measures conversion readiness.",
    bluf: "Google Lighthouse measures technical quality - performance, accessibility, SEO. Nebula measures conversion readiness - message match, CTA, trust, above-fold. For a founder whose page loads fine but does not convert, Lighthouse points at LCP; Nebula points at the headline that does not match the ad.",
    checkedAt: "August 2026",
    targetQuery: "google lighthouse alternative conversion audit landing page",
    rows: [
      { feature: "Cost", nebula: "Free audit + $97 repair sprint", competitor: "Free - built into Chrome DevTools or CLI", nebulaWins: false },
      { feature: "Requires install or DevTools access", nebula: "No - paste URL, get results in browser", competitor: "Yes - Chrome DevTools, PageSpeed, or Node CLI", nebulaWins: true },
      { feature: "Checks conversion criteria", nebula: "Yes - message match, CTA, trust, mobile CTA, form friction", competitor: "No - performance, accessibility, SEO, PWA only", nebulaWins: true },
      { feature: "Output audience", nebula: "Founders and marketers - plain English", competitor: "Developers - technical audit terminology", nebulaWins: true },
      { feature: "Fix path", nebula: "$97 repair sprint - copy, code, or config changes written for your page", competitor: "Developer-facing suggestions - no implementation path for marketers", nebulaWins: true },
      { feature: "No technical knowledge required", nebula: "Yes", competitor: "No - requires understanding of web performance metrics and dev tooling", nebulaWins: true },
      { feature: "Works on any public URL", nebula: "Yes", competitor: "Yes", nebulaWins: true },
    ],
    faqs: [
      { q: "Is Google Lighthouse free?", a: "Yes - Lighthouse is free and built into Chrome DevTools, PageSpeed Insights, and the Node CLI. Nebula's audit is also free, with the optional $97 repair sprint as the paid upgrade." },
      { q: "What does Lighthouse not check?", a: "Lighthouse does not check conversion criteria: headline message match against your ad, CTA clarity or placement, trust/social proof evidence, or above-fold structure. It measures technical quality only." },
      { q: "Does Nebula check performance?", a: "Yes - Nebula includes a load-speed signal (Lighthouse mobile performance when available, HTML-size fallback) as one of its 9 conversion signals, and pairs it with the conversion checks Lighthouse does not have." },
    ],
    verdict: "Lighthouse is the right tool for a developer optimising performance. If you are a founder running Google Ads and the page is loading fine but not converting, Lighthouse will not tell you why. Nebula checks the conversion layer Lighthouse does not reach.",
  },

  "hotjar": {
    slug: "hotjar",
    competitorName: "Hotjar",
    competitorUrl: "https://hotjar.com",
    tagline: "Hotjar vs. Nebula - heatmap tool vs. conversion audit",
    intent: "Hotjar shows you where users click after they land. Nebula shows you why the page was never going to convert in the first place.",
    bluf: "Hotjar shows you where visitors click after they arrive. Nebula tells you whether the page was structurally ready to convert before you spend another dollar on ads. Hotjar needs traffic and time; Nebula needs a URL and 2 minutes.",
    checkedAt: "August 2026",
    targetQuery: "hotjar alternative conversion audit landing page",
    rows: [
      { feature: "Cost", nebula: "Free audit + $97 repair sprint", competitor: "Free (35 daily sessions), Plus $32/mo, Business $80/mo", nebulaWins: true },
      { feature: "Requires existing traffic", nebula: "No - works on any public URL immediately", competitor: "Yes - needs real user visits to generate heatmap data", nebulaWins: true },
      { feature: "Checks conversion criteria", nebula: "Yes - message match, CTA, trust, above-fold, form friction", competitor: "No - shows click, scroll, and move behaviour only", nebulaWins: true },
      { feature: "Heatmaps and session recordings", nebula: "No", competitor: "Yes - core feature", nebulaWins: false },
      { feature: "Surveys and feedback widgets", nebula: "No", competitor: "Yes - on-site surveys and feedback polls", nebulaWins: false },
      { feature: "Conversion scoring", nebula: "Yes - pass/fail score per conversion signal", competitor: "No - raw behavioural data, no diagnosis", nebulaWins: true },
      { feature: "AI readiness check", nebula: "Yes - checks structured data and AI citation signals", competitor: "No", nebulaWins: true },
      { feature: "Message-match check", nebula: "Yes - verifies ad claim matches page headline", competitor: "No", nebulaWins: true },
      { feature: "Fix path included", nebula: "$97 repair sprint targeted to your specific failing signals", competitor: "No - data only, no remediation guidance", nebulaWins: true },
    ],
    faqs: [
      { q: "Does Hotjar require existing traffic?", a: "Yes - heatmaps, recordings, and scrollmaps only generate from real visitor sessions. A new landing page with little traffic produces little data. Nebula audits any public URL immediately, with no traffic required." },
      { q: "Can Hotjar tell me why my page does not convert?", a: "Hotjar shows behavior - where people click, scroll, and leave - but does not diagnose the cause. If the headline does not match the ad, Hotjar shows visitors leaving; Nebula names the message-match failure and the fix." },
      { q: "What is the difference between Hotjar and Nebula?", a: "Hotjar is a post-launch behavior tool (heatmaps, recordings, surveys) that needs traffic and time. Nebula is a pre-conversion diagnostic that scores the page's conversion structure - message match, CTA, trust, above-fold - before you burn ad spend." },
    ],
    verdict: "Hotjar and Nebula solve different problems at different stages. Hotjar is a post-launch optimisation tool - you need traffic, time, and sessions to get actionable data. Nebula is a pre-conversion diagnostic - it checks whether the page's conversion signals pass before you spend another dollar on ads. If your page has a message-match failure or a weak CTA, Hotjar will show you people leaving. Nebula identifies the failing signal before they arrive.",
  },

  "semrush-site-audit": {
    slug: "semrush-site-audit",
    competitorName: "SEMrush Site Audit",
    competitorUrl: "https://semrush.com/siteaudit",
    tagline: "SEMrush Site Audit vs. Nebula - technical SEO crawler vs. conversion audit",
    intent: "SEMrush Site Audit finds broken links and crawl errors. Nebula checks which conversion signals your landing page is failing.",
    bluf: "SEMrush Site Audit is a technical SEO crawler for whole sites - broken links, redirects, crawl errors. Nebula is a conversion audit for a single landing page. SEMrush finds missing alt tags; Nebula finds a headline that does not match the ad. The difference is crawling versus converting.",
    checkedAt: "August 2026",
    targetQuery: "semrush site audit alternative conversion audit paid traffic",
    rows: [
      { feature: "Cost", nebula: "Free audit + $97 repair sprint", competitor: "SEMrush Pro $139.95/mo (includes Site Audit)", nebulaWins: true },
      { feature: "Checks conversion criteria", nebula: "Yes - message match, CTA, trust, above-fold, form friction", competitor: "No - 130+ technical SEO checks only", nebulaWins: true },
      { feature: "Technical SEO crawl (broken links, redirects)", nebula: "No", competitor: "Yes - core feature with 130+ checks", nebulaWins: false },
      { feature: "Above-fold analysis", nebula: "Yes - checks what visitors see without scrolling", competitor: "No", nebulaWins: true },
      { feature: "Message-match check", nebula: "Yes - verifies ad claim matches page headline", competitor: "No", nebulaWins: true },
      { feature: "Ad signal detection", nebula: "Yes - checks page readiness for paid traffic", competitor: "No - designed for organic SEO health", nebulaWins: true },
      { feature: "Audience", nebula: "Founders running paid ads on landing pages", competitor: "SEO professionals managing site-wide technical health", nebulaWins: true },
      { feature: "Fix path included", nebula: "$97 repair sprint - conversion-specific remediation", competitor: "Issue list with priority scores - no ad/conversion guidance", nebulaWins: true },
    ],
    faqs: [
      { q: "How much does SEMrush cost?", a: "SEMrush Pro starts at $139.95/month and includes Site Audit as one module. Nebula's audit is free with no subscription; the optional repair sprint is a one-time $97." },
      { q: "Does SEMrush check conversions?", a: "No - SEMrush Site Audit runs 130+ technical SEO checks (crawl errors, broken links, metadata, Core Web Vitals) across a whole site. It does not check headline message match, CTA clarity, trust evidence, or above-fold structure on a landing page." },
      { q: "What is a cheap landing page audit alternative to SEMrush?", a: "For a single landing page conversion diagnosis, Nebula is the direct alternative: free instant audit with evidence per finding, plus a $97 one-time fix kit - versus $139.95/month for SEMrush's site-wide technical crawler." },
    ],
    verdict: "SEMrush Site Audit is the right tool for an SEO team fixing crawl errors, thin content, and broken internal links across a large site. If you are running Google or Meta ads to a specific landing page and want to know why it is not converting, SEMrush will tell you the page has a missing alt tag - not that your headline does not match your ad copy. Nebula is built for that diagnosis.",
  },

  "crazy-egg": {
    slug: "crazy-egg",
    competitorName: "Crazy Egg",
    competitorUrl: "https://crazyegg.com",
    tagline: "Crazy Egg vs. Nebula - visual analytics vs. conversion audit",
    intent: "Crazy Egg shows you user behaviour data from existing traffic. Nebula diagnoses your conversion structure before you have a single visitor.",
    bluf: "Crazy Egg visualizes actual user behavior with heatmaps once you have traffic. Nebula evaluates page-side structural conditions without requiring traffic. Crazy Egg shows where people leave; Nebula checks whether observable conversion signals pass or fail before you have visitors.",
    checkedAt: "August 2026",
    targetQuery: "crazy egg alternative conversion audit no traffic needed",
    rows: [
      { feature: "Cost", nebula: "Free audit + $97 repair sprint", competitor: "Starter $49/mo, Plus $99/mo, Pro $249/mo", nebulaWins: true },
      { feature: "Requires existing traffic", nebula: "No - instant audit on any public URL", competitor: "Yes - heatmaps and recordings require real user visits", nebulaWins: true },
      { feature: "Heatmaps and A/B testing", nebula: "No", competitor: "Yes - snapshots, scrollmaps, A/B testing built in", nebulaWins: false },
      { feature: "Conversion scoring", nebula: "Yes - structured pass/fail per conversion signal", competitor: "No - visual data only, no conversion diagnosis", nebulaWins: true },
      { feature: "Message-match check", nebula: "Yes", competitor: "No", nebulaWins: true },
      { feature: "SEO foundations check", nebula: "Yes - title, meta, schema, canonical", competitor: "No", nebulaWins: true },
      { feature: "AI readiness check", nebula: "Yes - structured data and citation signals", competitor: "No", nebulaWins: true },
      { feature: "Time to first insight", nebula: "Under 2 minutes - no traffic needed", competitor: "Days to weeks - requires traffic volume for statistical data", nebulaWins: true },
      { feature: "Fix path included", nebula: "$97 repair sprint for your specific failing signals", competitor: "No remediation - data visualisation only", nebulaWins: true },
    ],
    faqs: [
      { q: "Does Crazy Egg work without traffic?", a: "No - heatmaps, scrollmaps, and recordings only generate from real visitor sessions. A page without traffic produces no data. Nebula audits any public URL instantly, traffic or not." },
      { q: "Can Crazy Egg diagnose conversion problems?", a: "Crazy Egg shows behavior data - where people click, scroll, and leave. Nebula evaluates structural conditions - whether specific signals pass or fail - with evidence from your page HTML. Different approaches: one observes users, the other evaluates page structure." },
      { q: "What does Nebula check that Crazy Egg does not?", a: "Nebula checks conversion structure: headline message match, CTA clarity, trust evidence, above-fold placement, ad-signal readiness, and AI citation readiness - each scored pass/fail with evidence, before you have any traffic." },
    ],
    verdict: "Crazy Egg is a solid visual analytics tool for teams who already have traffic and want to understand how users interact with a page. It observes actual user behavior. Nebula evaluates page-side structural conditions - whether the headline matches the ad, whether trust signals are visible, whether the CTA is above the fold - without requiring traffic data. Crazy Egg confirms that people leave; Nebula checks which structural conditions are failing. Different evidence, different timing.",
  },

  "screaming-frog": {
    slug: "screaming-frog",
    competitorName: "Screaming Frog",
    competitorUrl: "https://screamingfrog.co.uk/seo-spider",
    tagline: "Screaming Frog vs. Nebula - SEO spider vs. conversion audit",
    intent: "Screaming Frog crawls your site for technical SEO issues. Nebula audits a landing page for observable conversion conditions on the public HTML.",
    bluf: "Screaming Frog is a desktop crawler for deep technical SEO audits. Nebula is a browser-based conversion audit for one landing page. One finds broken links and redirect chains; the other finds why paid traffic is not converting - in under 2 minutes, no install.",
    checkedAt: "August 2026",
    targetQuery: "screaming frog alternative conversion audit landing page",
    rows: [
      { feature: "Cost", nebula: "Free audit + $97 repair sprint", competitor: "Free (500 URL limit), Paid £199/year", nebulaWins: true },
      { feature: "Requires desktop install", nebula: "No - browser-based, paste URL and go", competitor: "Yes - Windows/Mac desktop application", nebulaWins: true },
      { feature: "Technical site crawl (broken links, redirects, metadata)", nebula: "No", competitor: "Yes - core feature, highly configurable", nebulaWins: false },
      { feature: "Checks conversion criteria", nebula: "Yes - message match, CTA, trust, above-fold, form friction", competitor: "No - technical SEO data only", nebulaWins: true },
      { feature: "Audience", nebula: "Founders and marketers - no technical knowledge required", competitor: "Developers and SEO professionals", nebulaWins: true },
      { feature: "Above-fold and CTA analysis", nebula: "Yes", competitor: "No", nebulaWins: true },
      { feature: "Message-match check", nebula: "Yes", competitor: "No", nebulaWins: true },
      { feature: "Fix path included", nebula: "$97 repair sprint - plain-English conversion fixes", competitor: "Raw data export - requires developer to interpret and act", nebulaWins: true },
    ],
    faqs: [
      { q: "Is Screaming Frog free?", a: "Screaming Frog has a free version limited to 500 URLs and a paid license at £199/year. Nebula's audit is free for any public URL with no install and no URL cap per audit." },
      { q: "Does Screaming Frog check conversions?", a: "No - Screaming Frog is a technical SEO spider: broken links, redirects, duplicate content, metadata, hreflang. It does not check headline message match, CTA clarity, trust evidence, or above-fold structure on a landing page." },
      { q: "What is a no-install alternative to Screaming Frog for landing pages?", a: "For a single landing page conversion diagnosis, Nebula is the direct alternative: paste a URL in the browser, get conversion findings with evidence in under 2 minutes, plus a $97 fix kit - no desktop software, no technical SEO knowledge." },
    ],
    verdict: "Screaming Frog is the industry-standard site crawler for developers and SEO professionals who need deep technical audits - broken links, redirect chains, duplicate content, hreflang issues. If you are a founder who has just launched a landing page and needs to know why your Google Ads campaign is not converting, Screaming Frog is not the right tool. Nebula is built for that diagnosis, in a browser, in under 2 minutes.",
  },

  "google-analytics": {
    slug: "google-analytics",
    competitorName: "Google Analytics (GA4)",
    competitorUrl: "https://analytics.google.com",
    tagline: "Google Analytics vs. Nebula - traffic analytics vs. conversion audit",
    intent: "GA4 measures what happened after visitors arrived. Nebula diagnoses why they did not convert before you look at a single report.",
    bluf: "GA4 measures what happened after visitors arrived. Nebula diagnoses why a page will not convert before you have enough data to see it in GA4. GA4 surfaces a high bounce rate eventually; Nebula catches the cause on day one.",
    checkedAt: "August 2026",
    targetQuery: "google analytics alternative conversion diagnosis landing page audit",
    rows: [
      { feature: "Cost", nebula: "Free audit + $97 repair sprint", competitor: "Free (GA4); Analytics 360 enterprise pricing", nebulaWins: false },
      { feature: "Requires existing traffic", nebula: "No - instant audit on any public URL", competitor: "Yes - needs visits and event data to provide insights", nebulaWins: true },
      { feature: "Checks conversion criteria", nebula: "Yes - message match, CTA, trust, above-fold, form friction, AI readiness", competitor: "No - measures traffic, events, and goals after the fact", nebulaWins: true },
      { feature: "Page quality scoring", nebula: "Yes - structured pass/fail per conversion signal", competitor: "No - engagement metrics only (bounce rate, session duration)", nebulaWins: true },
      { feature: "Message-match check", nebula: "Yes - verifies ad claim matches page headline", competitor: "No", nebulaWins: true },
      { feature: "Above-fold analysis", nebula: "Yes", competitor: "No", nebulaWins: true },
      { feature: "Shows what happened", nebula: "No - diagnosis, not measurement", competitor: "Yes - complete traffic and conversion funnel measurement", nebulaWins: false },
      { feature: "Time to first insight", nebula: "Under 2 minutes - no setup required", competitor: "Days to weeks - requires tag implementation and data accumulation", nebulaWins: true },
      { feature: "Fix path included", nebula: "$97 repair sprint - targeted to your specific failing signals", competitor: "No - data reporting only, no remediation", nebulaWins: true },
    ],
    faqs: [
      { q: "Does GA4 tell me why a page does not convert?", a: "GA4 measures what happened - sessions, bounce rate, exits, conversions - but does not diagnose the cause. A message-match failure or missing trust signal shows up as a high bounce rate, with no explanation. Nebula names the failing signal and the fix." },
      { q: "How long does GA4 take to show useful data?", a: "GA4 needs tag implementation plus weeks of accumulated traffic before engagement metrics become meaningful. Nebula returns findings on any public URL in under 2 minutes, with no tag and no waiting." },
      { q: "What does Nebula check that GA4 does not?", a: "Nebula checks conversion structure: headline message match, CTA clarity, trust evidence, above-fold placement, ad-signal readiness, and AI citation readiness - scored pass/fail with evidence from the page, before you have traffic data." },
    ],
    verdict: "Google Analytics and Nebula answer different questions. GA4 tells you what happened: how many sessions, which pages had the highest exit rate, which campaigns drove conversions. Nebula tells you why a specific page is not converting - before you have enough data to see it in GA4. If your landing page has a message-match failure or a trust signal gap, GA4 will eventually surface a high bounce rate. Nebula catches it on day one.",
  },

  "fixroast": {
    slug: "fixroast",
    competitorName: "FixRoast",
    competitorUrl: "https://fixroast.com",
    tagline: "FixRoast vs. Nebula - AI website roaster vs. deterministic conversion audit",
    intent: "FixRoast generates AI feedback and roasts based on LLM prompts. Nebula inspects the actual HTML DOM against 9 deterministic conversion signals.",
    bluf: "FixRoast is an AI-powered website roaster that scores landing pages across conversion and AI search visibility using LLM evaluation. Nebula is a deterministic conversion diagnostic engine that inspects the raw HTML DOM, validates ad-to-page message match, and delivers bounded $97 repair sprints with a 30-day verified re-audit.",
    checkedAt: "August 2026",
    targetQuery: "fixroast alternative landing page audit conversion roast",
    rows: [
      { feature: "Diagnostic engine", nebula: "Deterministic DOM inspection (Citable CLI, 123 detectors)", competitor: "Probabilistic LLM evaluation (AI model prompts)", nebulaWins: true },
      { feature: "Ad-to-page message match", nebula: "Yes - inspects headline vs ad copy alignment and UTMs", competitor: "No - evaluates landing page in isolation", nebulaWins: true },
      { feature: "Inspectable evidence", nebula: "Raw DOM selectors, distances, load times, and markup", competitor: "Generated AI commentary and roast text", nebulaWins: true },
      { feature: "Open-source core", nebula: "Yes - Citable CLI (Apache 2.0, npm: @nebulacomponents/citable)", competitor: "No - closed proprietary AI wrapper", nebulaWins: true },
      { feature: "Human repair service", nebula: "Yes - $97 One-Leak Repair Sprint (48h delivery, 30-day re-audit)", competitor: "No - automated copy rewrites only", nebulaWins: true },
      { feature: "Cost", nebula: "Free audit + $97 one-time repair sprint", competitor: "2 free roasts; credit packs from $5; subscriptions $12-$79/mo", nebulaWins: true },
      { feature: "AEO & GEO search scoring", nebula: "Yes - structured data, schema validation, and entity graphs", competitor: "Yes - AEO/GEO scoring and LLM citation test", nebulaWins: false },
      { feature: "AI Agent protocol (WebMCP)", nebula: "Yes - Model Context Protocol for coding agents (Cursor, Claude)", competitor: "No - browser-only dashboard", nebulaWins: true },
    ],
    faqs: [
      { q: "How does Nebula differ from FixRoast?", a: "FixRoast uses LLM prompts to generate subjective feedback and 'roasts' of a webpage. Nebula uses deterministic HTML inspection to check observable failure conditions (message match, CTA positioning, trust proximity, mobile viewport leaks) with exact DOM selectors and measured evidence." },
      { q: "Why is deterministic inspection important for landing page CRO?", a: "LLM-only roasters can hallucinate or misclassify page categories (for instance, mistaking an audit platform for a UI component library). Deterministic DOM inspection tests the exact code your visitors and ad crawlers interact with, ensuring every finding is reproducible and actionable." },
      { q: "Can I use both Nebula and FixRoast?", a: "Yes. You can use FixRoast for creative headline brainstorming and AEO search score checks, and Nebula for verifiable, technical conversion leak detection and guaranteed single-leak implementation." },
    ],
    verdict: "FixRoast is an engaging, AI-driven roasting tool that offers quick subjective feedback and LLM search scoring. Nebula is a deterministic conversion instrument built for operators spending real ad dollars who need exact, reproducible HTML evidence, ad message match verification, and guaranteed remediation.",
  },
  "optimizely": {
    slug: "optimizely",
    competitorName: "Optimizely",
    competitorUrl: "https://optimizely.com",
    tagline: "Optimizely vs. Nebula - A/B testing platform vs. instant conversion diagnostic",
    intent: "Optimizely runs controlled A/B experiments to measure which variant converts better. Nebula diagnoses why a page is not converting before you spend traffic on experiments.",
    bluf: "Optimizely is an enterprise A/B testing and experimentation platform. It requires code installation on your site, a statistically significant traffic volume, and weeks to produce a result. Nebula is a conversion diagnostic that inspects the HTML of any public URL in under 2 minutes, identifies the highest-priority conversion leak, and delivers an exact repair artifact for $97. If you have not yet diagnosed what is broken on your page, Optimizely will help you measure the wrong hypothesis. Nebula tells you what to test before you run the experiment.",
    checkedAt: "September 2026",
    targetQuery: "best tools for landing page optimization conversion diagnostic",
    rows: [
      { feature: "Time to first insight", nebula: "Under 2 minutes on any public URL", competitor: "Weeks - requires experiment setup, traffic, and statistical significance", nebulaWins: true },
      { feature: "Requires code install", nebula: "No - audits any public URL with no site access", competitor: "Yes - JavaScript snippet required on every page", nebulaWins: true },
      { feature: "Requires existing traffic", nebula: "No - works on day 1 before any paid spend", competitor: "Yes - needs sufficient visitors to reach significance", nebulaWins: true },
      { feature: "Cost", nebula: "Free audit + $97 one-time repair sprint", competitor: "Enterprise pricing, typically $50k+/year", nebulaWins: true },
      { feature: "Diagnoses root cause", nebula: "Yes - identifies the specific failing condition on your page", competitor: "No - measures outcome variance between variants, not root cause", nebulaWins: true },
      { feature: "Checks message match", nebula: "Yes - ad-to-page headline alignment, UTM context", competitor: "No - evaluates conversion rate, not message quality", nebulaWins: true },
      { feature: "Fix path included", nebula: "Yes - $97 repair sprint delivers exact copy, code, or config change", competitor: "No - platform only; implementation is on your team", nebulaWins: true },
      { feature: "Best for", nebula: "Founders spending on ads who need to know what to fix before scaling", competitor: "Enterprise teams running high-volume multivariate experiments", nebulaWins: true },
    ],
    faqs: [
      {
        q: "Should I use Optimizely or Nebula for landing page optimization?",
        a: "Use Nebula first. Optimizely is an experimentation platform - it measures which of two variants converts better, but only after you have built both variants, installed tracking, and accumulated enough traffic for statistical significance. Nebula identifies the highest-priority conversion leak on your existing page in under 2 minutes, before you write a single variant. Run the free audit to find out what to test, then use Optimizely to validate the fix at scale if you have the traffic volume to justify it.",
      },
      {
        q: "Does Optimizely audit landing pages?",
        a: "No. Optimizely does not audit a page for conversion failures. It provides an experimentation framework for running controlled A/B and multivariate tests. You still need to form a hypothesis about what to change - Nebula produces that hypothesis by inspecting observable conversion conditions on your actual page HTML.",
      },
      {
        q: "Can a small team or founder use Optimizely?",
        a: "In practice, no. Optimizely is priced for enterprise teams (typically $50k+/year) and requires engineering resources to install and maintain the tracking snippet. For founders running paid campaigns who need to understand why their page is not converting, the Nebula free audit and $97 repair sprint are the practical alternative.",
      },
      {
        q: "What does Nebula check that Optimizely does not?",
        a: "Nebula checks observable page conditions against 9 conversion signals: headline-to-ad message match, above-the-fold CTA clarity, trust signal placement, mobile CTA visibility, form friction, load speed, social proof presence, structured data completeness, and AI readiness. These are the failure conditions that prevent conversion before any experiment can succeed. Optimizely measures conversion rate variance between variants - it does not inspect these underlying conditions.",
      },
    ],
    verdict: "Optimizely is the right tool for teams with enterprise budgets, installed tracking, and sufficient traffic to run controlled experiments. Nebula is the right tool for founders and growth teams who need to know what is broken on their landing page today, without code installs, without traffic minimums, and without waiting weeks for results.",
  },
}
