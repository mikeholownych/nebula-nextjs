// Presentation snapshot for the teardowns index: curated display order plus
// card copy (top-finding excerpt, finding count, displayed audit date) that
// predates the API read switch and is not carried by GET /teardowns/. Rows
// still come from the platform API via fetchTeardownList(); this module only
// supplies legacy display fields. Keyed by slug, so teardowns removed from
// the API disappear from the index.
export const CURATED_ORDER: string[] = [
  "carrd",
  "hotjar",
  "kit",
  "beehiiv",
  "unbounce",
  "webflow",
  "framer",
  "basecamp",
  "notion",
  "calendly",
  "postmint",
  "knallhart",
  "hubspot",
  "mailchimp",
  "cloudwise",
  "postdew",
  "smartwatermark",
  "folioverse",
  "asana",
  "canva",
  "figma",
  "intercom",
  "monday",
  "shopify",
  "slack",
  "squarespace",
  "typeform",
  "zapier",
  "linear",
  "loom",
  "miro",
  "clickup",
  "airtable",
  "pipedrive",
  "mixpanel",
  "amplitude",
  "drift"
]

export type CardCopy = {
  urlDisplay?: string
  topFinding: string
  findingCount: number
  auditedAt: string
}

export const CARD_COPY: Record<string, CardCopy> = {
  "carrd": {
    "urlDisplay": "carrd.co",
    "topFinding": "H1 is <h1 className=\"heading-1 tracking-tight text-fg md:text-5xl\">Discover Conversion Leaks from Real SaaS Landing Page Audits</h1> - the brand name only. Zero value prop. Missing og:title, og:description, and all JSON-LD schema.",
    "findingCount": 5,
    "auditedAt": "July 30, 2026"
  },
  "hotjar": {
    "urlDisplay": "hotjar.com",
    "topFinding": "H1 announces an acquisition: \"Hotjar has evolved into something more powerful.\" First-time visitors must decode what Hotjar does before seeing why to convert.",
    "findingCount": 4,
    "auditedAt": "July 30, 2026"
  },
  "kit": {
    "urlDisplay": "kit.com",
    "topFinding": "Meta description is 35 chars. Industry average is 140-155. Google auto-generates the SERP snippet - Kit has ceded their first impression in search entirely.",
    "findingCount": 4,
    "auditedAt": "July 30, 2026"
  },
  "beehiiv": {
    "urlDisplay": "beehiiv.com",
    "topFinding": "4 competing CTAs above fold before the hero. H1 is a product list with no verb, no outcome. 262KB homepage HTML with canonical mismatch.",
    "findingCount": 5,
    "auditedAt": "July 30, 2026"
  },
  "unbounce": {
    "urlDisplay": "unbounce.com",
    "topFinding": "H1: \"Launch faster. Convert more.\" - identical positioning to Leadpages, Instapage, and Swipe Pages. The company that invented the landing page builder has a commodity headline.",
    "findingCount": 4,
    "auditedAt": "July 30, 2026"
  },
  "webflow": {
    "urlDisplay": "webflow.com",
    "topFinding": "Two H1 tags simultaneously in the DOM via A/B test. Google indexes both variants - ranking signal is split between two competing headlines.",
    "findingCount": 4,
    "auditedAt": "July 30, 2026"
  },
  "framer": {
    "urlDisplay": "framer.com",
    "topFinding": "Primary CTA reads \"Start without AI\" on an AI-first product page. Leads with an opt-out of the core differentiator. H1 missing from static HTML - JS-render dependency.",
    "findingCount": 4,
    "auditedAt": "July 30, 2026"
  },
  "basecamp": {
    "urlDisplay": "basecamp.com",
    "topFinding": "<title> is 8 chars. Meta desc truncates at 155. No named proof above fold.",
    "findingCount": 5,
    "auditedAt": "July 29, 2026"
  },
  "notion": {
    "urlDisplay": "notion.so",
    "topFinding": "417KB HTML payload (3.4× heuristic max). H1/title keyword misalignment.",
    "findingCount": 4,
    "auditedAt": "July 29, 2026"
  },
  "calendly": {
    "urlDisplay": "calendly.com",
    "topFinding": "Missing H1 entirely. 1.2MB HTML payload - 10× the heuristic ceiling.",
    "findingCount": 5,
    "auditedAt": "July 29, 2026"
  },
  "postmint": {
    "urlDisplay": "postmint.de",
    "topFinding": "Founder published a full launch autopsy (118 visitors, 0 signups) - both self-diagnosed bugs are fixed. One real defect remains: the JSON-LD @context key is a leaked Blade/PHP template literal, not \"@context\".",
    "findingCount": 2,
    "auditedAt": "July 31, 2026"
  },
  "knallhart": {
    "urlDisplay": "knallhart.dev",
    "topFinding": "Zero social-sharing metadata (0 og: tags, 0 twitter: cards) on a product whose founder's entire distribution is X posts and forum threads - every shared link renders as a bare URL.",
    "findingCount": 3,
    "auditedAt": "July 31, 2026"
  },
  "hubspot": {
    "urlDisplay": "hubspot.com",
    "topFinding": "H1 and title share zero keywords - and the title ends in \"- Homepage\" (a template placeholder). The static H1 search engines index (\"grow scale close retain grow\") differs from the headline human visitors see.",
    "findingCount": 5,
    "auditedAt": "August 4, 2026"
  },
  "mailchimp": {
    "urlDisplay": "mailchimp.com",
    "topFinding": "Six H1s on one page, each telling a different story about what the product is. Plus a first-visit personalization modal that covers the hero before a new visitor reads a single word.",
    "findingCount": 5,
    "auditedAt": "August 4, 2026"
  },
  "cloudwise": {
    "urlDisplay": "cloudcostwise.io",
    "topFinding": "Founder-reported: approximately $2,700 in ad spend, around 6 trial signups, and 0 paid conversions. Current snapshot: strong page fundamentals, but ad-tracking evidence is not visible in static source.",
    "findingCount": 3,
    "auditedAt": "August 3, 2026"
  },
  "postdew": {
    "urlDisplay": "postdew.com",
    "topFinding": "Founder-reported: 0 paying customers, 0 signups from approximately 10 LinkedIn cold DMs, and 0 signups from a flagged Show HN post. Current snapshot: no static H1, CTA, or trust markers.",
    "findingCount": 5,
    "auditedAt": "August 3, 2026"
  },
  "smartwatermark": {
    "urlDisplay": "smartwatermark.app",
    "topFinding": "Founder-reported: 84 landing-page visitors, 24 app visitors, 0 sales, and 79% bounce. Current snapshot: strong headline, CTA, SEO, and proof signals; runtime tracking remains unverified.",
    "findingCount": 2,
    "auditedAt": "August 3, 2026"
  },
  "folioverse": {
    "urlDisplay": "www.folioverse.app",
    "topFinding": "Founder-reported: €100 in Google Ads spend, 91 clicks, 0 signups, and 10-second average paid-visitor sessions. Current snapshot: no static H1 or CTA candidate, with ad tracking unverified.",
    "findingCount": 5,
    "auditedAt": "August 3, 2026"
  },
  "asana": {
    "urlDisplay": "asana.com",
    "topFinding": "Strong above-fold with clear CTA but social proof is generic, no named customer outcomes above the fold.",
    "findingCount": 4,
    "auditedAt": "August 2026"
  },
  "canva": {
    "urlDisplay": "canva.com",
    "topFinding": "Headline is feature-first, not outcome-first. No conversion tracking artifact found in static HTML.",
    "findingCount": 5,
    "auditedAt": "August 2026"
  },
  "figma": {
    "urlDisplay": "figma.com",
    "topFinding": "Above-fold is strong but meta description truncates at 160 chars, topic relevance signal is cut off.",
    "findingCount": 4,
    "auditedAt": "August 2026"
  },
  "intercom": {
    "urlDisplay": "intercom.com",
    "topFinding": "CTA is action-oriented but positioned below a long feature list, most mobile visitors never reach it.",
    "findingCount": 4,
    "auditedAt": "August 2026"
  },
  "monday": {
    "urlDisplay": "monday.com",
    "topFinding": "Social proof is present but proof markers are vague counts, not specific named outcomes.",
    "findingCount": 5,
    "auditedAt": "August 2026"
  },
  "shopify": {
    "urlDisplay": "shopify.com",
    "topFinding": "Strong SEO foundations and load speed but headline is brand-focused, not buyer-outcome focused.",
    "findingCount": 4,
    "auditedAt": "August 2026"
  },
  "slack": {
    "urlDisplay": "slack.com",
    "topFinding": "Message match is weak on paid traffic, the headline does not reflect typical ad copy promises.",
    "findingCount": 5,
    "auditedAt": "August 2026"
  },
  "squarespace": {
    "urlDisplay": "squarespace.com",
    "topFinding": "Above-fold is clean but no analytics tracking artifact detected, paid traffic attribution is unverified.",
    "findingCount": 4,
    "auditedAt": "August 2026"
  },
  "typeform": {
    "urlDisplay": "typeform.com",
    "topFinding": "Headline communicates the product category, not the buyer outcome. No price or effort signal above fold.",
    "findingCount": 5,
    "auditedAt": "August 2026"
  },
  "zapier": {
    "urlDisplay": "zapier.com",
    "topFinding": "Strong overall but Open Graph tags incomplete, social sharing previews are degraded.",
    "findingCount": 3,
    "auditedAt": "August 2026"
  },
  "linear": {
    "urlDisplay": "linear.app",
    "topFinding": "H1 source contains two line-break collapses: \"productdevelopmentsystem\" and \"teamsand\" fused into single words, same defect class as Shopify, Asana, and Squarespace. Invisible in the browser, indexed by search engines as garbled text.",
    "findingCount": 3,
    "auditedAt": "August 2026"
  },
  "loom": {
    "urlDisplay": "loom.com",
    "topFinding": "Title tag, \"Free screen recorder for Mac and PC | Loom\", positions Loom as a screen recorder while the page pitches team communication and async video. Category mismatch between the SERP promise and the page's actual positioning.",
    "findingCount": 3,
    "auditedAt": "August 2026"
  },
  "miro": {
    "urlDisplay": "miro.com",
    "topFinding": "H1 is \"The collaboration layer your AI tools are missing.\", a positioning claim framed as absence. \"Missing\" implies Miro is invisible by default, an unusual negative framing for a primary conversion headline.",
    "findingCount": 3,
    "auditedAt": "August 2026"
  },
  "clickup": {
    "urlDisplay": "clickup.com",
    "topFinding": "H1 is \"Software to replace all software.\", no product category, no audience signal, no outcome. The claim is so broad it carries zero conversion signal for anyone searching for a specific tool.",
    "findingCount": 4,
    "auditedAt": "August 2026"
  },
  "airtable": {
    "urlDisplay": "airtable.com",
    "topFinding": "Title appends \"| Airtable\" after already opening with \"Airtable:\", brand name appears twice in 65 characters. Title reads \"Airtable: Build Enterprise-ready AI Workflows, Apps & Agents | Airtable\". 65 chars also truncates in most SERPs at ~60.",
    "findingCount": 3,
    "auditedAt": "August 2026"
  },
  "pipedrive": {
    "urlDisplay": "pipedrive.com",
    "topFinding": "One of the cleaner above-folds in this batch: H1, proof claim (\"Trusted by over 100,000 companies\"), CTA, and friction-removal copy all in the hero. Primary weakness: email capture field in the hero duplicates the button CTA with no visual hierarchy differentiation.",
    "findingCount": 3,
    "auditedAt": "August 2026"
  },
  "mixpanel": {
    "urlDisplay": "mixpanel.com",
    "topFinding": "H1 is \"Build faster, with direction\", no product category, no audience named. Above-fold also carries the tagline \"Mixpanel is for teams that move. Make your move.\", a second vague statement that also fails to name what the product does.",
    "findingCount": 4,
    "auditedAt": "August 2026"
  },
  "amplitude": {
    "urlDisplay": "amplitude.com",
    "topFinding": "Title is \"Amplitude | A new era for product teams\", 38 characters, generic \"new era\" framing, no product category keyword. The hero opens with a 17-logo trust strip before the value proposition, asking cold visitors to anchor to customer names before understanding the product.",
    "findingCount": 4,
    "auditedAt": "August 2026"
  },
  "drift": {
    "urlDisplay": "drift.com",
    "topFinding": "drift.com now serves a Salesloft/1mind product page with the notice: \"We've transitioned from Drift to 1mind.\" Visitors searching for \"Drift\" land on a different product's pitch with no redirect explanation or legacy-brand acknowledgment above the fold.",
    "findingCount": 4,
    "auditedAt": "August 2026"
  }
}
