export type VerticalLink = [href: string, label: string]

export type Vertical = {
  slug: string
  name: string
  headline: string
  subheadline: string
  pain: string
  icp: string
  top_leak: string
  second_leak: string
  benchmark: string
  cta_copy: string
  related_links: VerticalLink[]
}

export const verticals: Record<string, Vertical> = {
  saas: {
    slug: 'saas',
    name: 'SaaS',
    headline: 'Fix Your SaaS Landing Page to Boost Trial Signups',
    subheadline: 'Most SaaS pages explain features. Visitors want to know if the product solves their exact problem before they sign up.',
    pain: "You're spending on Google Ads or LinkedIn. Clicks arrive. Signups don't. The page looks fine, but something between the ad and the form is breaking trust before the visitor reaches the CTA.",
    icp: 'SaaS founders and product marketers running paid acquisition with click-through rates above 2% but trial conversion rates below 3%.',
    top_leak: 'Message match failure. The ad promises a specific outcome; the landing page opens with the product category. That gap is a common failed condition on SaaS pages we audit.',
    second_leak: 'No proof above the fold. SaaS buyers are risk-averse. A logo wall, customer metric, or short quote near the CTA gives cold visitors evidence they can evaluate before committing.',
    benchmark: 'SaaS trial pages in the public teardown set often fail message match and above-fold proof. The audit reports those page conditions. It does not measure or predict trial conversion rate.',
    cta_copy: 'Score your SaaS page',
    related_links: [
      ['/learning-centre/b2b-saas-landing-page-not-converting', 'Why B2B SaaS pages don\'t convert'],
      ['/teardowns/notion', 'Notion teardown'],
      ['/vs/hotjar', 'Nebula vs Hotjar'],
    ],
  },
  ecommerce: {
    slug: 'ecommerce',
    name: 'eCommerce',
    headline: 'Fix Your Product Page to Boost Ecommerce Checkout ROAS',
    subheadline: 'eCommerce pages don\'t fail on traffic. They fail at the moment a visitor needs one more reason to add to cart.',
    pain: "You're running Meta Ads or Google Shopping. Your ROAS looks acceptable. But 94% of visitors leave without buying, and you don't know which page element is the break point.",
    icp: 'eCommerce founders and DTC operators spending $1,000+ per month on paid traffic with a product page conversion rate below 2.5%.',
    top_leak: 'Weak social proof near the add-to-cart button. Reviews exist on the page, but they\'re buried below the fold. Visitors who don\'t scroll convert at 0.3x the rate of those who do.',
    second_leak: 'Unclear value proposition in the hero. Visitors need to know immediately: what is it, who is it for, why now. Most product pages open with a lifestyle image and no copy.',
    benchmark: 'eCommerce product pages frequently fail on trust signals - social proof exists but is buried below the fold. The audit checks whether proof elements are visible near the primary CTA in the first viewport.',
    cta_copy: 'Score your product page',
    related_links: [
      ['/learning-centre/ecommerce-landing-page-not-converting', 'Why eCommerce pages don\'t convert'],
      ['/ecommerce-landing-page-audit', 'eCommerce landing page audit'],
      ['/learning-centre/proof-before-cta', 'Social proof before the CTA'],
    ],
  },
  agencies: {
    slug: 'agencies',
    name: 'Marketing Agencies',
    headline: 'Transform Your Agency Site to Scale Inbound Client Leads',
    subheadline: 'Agencies know conversion. Most agency sites fail the exact audit they\'d run on a client.',
    pain: "Prospects visit after seeing your work or getting a referral. They leave without contacting you. The page communicates what you do, not what outcome they'll get or why you over anyone else.",
    icp: 'Agency founders and business development leads spending on paid or organic acquisition with a consultation conversion rate below 4%.',
    top_leak: 'No proof of results above the fold. Case studies live on a separate page. Visitors evaluating agencies need to see a real before/after within 5 seconds of landing.',
    second_leak: 'Generic positioning. "We help brands grow" describes every agency in your category. Visitors can\'t tell within 10 seconds what makes you the right choice for their specific situation.',
    benchmark: 'Agency service page benchmark: 4-6% consultation request rate from paid traffic. Pages with a named result and a specific niche in the hero outperform generalist positioning by 2.8x.',
    cta_copy: 'Score your agency site',
    related_links: [
      ['/learning-centre/high-cpc-low-conversion', 'High CPC, low conversion'],
      ['/teardowns/hubspot', 'HubSpot teardown'],
      ['/learning-centre/message-match-checklist', 'Message match checklist'],
    ],
  },
  coaching: {
    slug: 'coaching',
    name: 'Coaching & Consulting',
    headline: 'Improve Your Coaching Landing Page to Boost Discovery Calls',
    subheadline: 'The most common mistake on coaching pages: leading with your story instead of the outcome the client will reach.',
    pain: "You're running ads to a page that explains your methodology and background. It's professionally designed. But the calendar stays empty because visitors don't immediately see themselves in the outcome.",
    icp: 'Coaches, consultants, and course creators spending $500+ per month on paid traffic with a discovery call booking rate below 4%.',
    top_leak: 'The hero talks about the coach, not the client. Visitors experiencing a problem want to see their current state and desired state. They don\'t want a bio until after they believe you can help.',
    second_leak: 'No urgency mechanism near the booking CTA. "Book a call" competes with everything on a visitor\'s to-do list. A limited availability signal or a specific outcome attached to the call converts 2-3x better.',
    benchmark: 'Coaching page benchmark: 4% discovery call rate on warm paid traffic. Pages that lead with client transformation and specify the call outcome outperform credential-first pages by a factor of 3.',
    cta_copy: 'Score your coaching page',
    related_links: [
      ['/learning-centre/coach-consultant-landing-page', 'Coaching and consulting landing page guide'],
      ['/learning-centre/cta-not-working', 'When your CTA isn\'t working'],
      ['/score', 'Score your page instantly'],
    ],
  },
  fintech: {
    slug: 'fintech',
    name: 'Fintech & Financial Services',
    headline: 'Add Proven Trust Signals to Boost Fintech Account Conversions',
    subheadline: 'In the fintech pages Nebula has audited, missing trust signals appear more frequently than headline or offer failures.',
    pain: "You're running paid acquisition on a product that solves a real financial problem. Visitors click through, read the page, and leave. The product is legitimate, but the page doesn't prove it at the moment of decision.",
    icp: 'Fintech founders and growth teams spending on paid acquisition for financial products with account-open rates below 3%.',
    top_leak: 'Security and regulatory signals are missing or buried. Visitors considering a financial product want to see regulatory status, security language, or insurance backing within the first scroll. Without it, uncertainty converts to exit.',
    second_leak: 'No specific proof of user outcomes. Aggregate numbers ("10,000 users") are less convincing than specific outcomes ("£312 saved in the first month"). The financial category has high stakes; visitors need evidence, not volume.',
    benchmark: 'Fintech acquisition pages often fail on trust signals - regulatory status, security language, and insurance backing are frequently missing or buried below the fold. The audit checks whether these conditions are observable in your page HTML.',
    cta_copy: 'Score your fintech page',
    related_links: [
      ['/landing-page-trust-signals', 'Trust signals on landing pages'],
      ['/learning-centre/proof-before-cta', 'Proof before the CTA'],
      ['/teardowns/shopify', 'Shopify teardown'],
    ],
  },
  healthtech: {
    slug: 'healthtech',
    name: 'HealthTech & Wellness',
    headline: 'Improve HealthTech Landing Pages to Boost Checkout Conversions',
    subheadline: 'Visitors looking for a health solution don\'t want to understand how it works. They want to know if they\'ll feel better.',
    pain: "You're running Meta Ads to a health product page. Visitors click from ads that show the transformation. The landing page explains the ingredients or the science. The gap between ad promise and page delivery blocks conversion.",
    icp: 'HealthTech and wellness founders spending on paid traffic for supplements, apps, devices, or services with a checkout or signup conversion rate below 2%.',
    top_leak: 'Outcome-to-mechanism inversion. Ads target a specific felt pain; the page pivots to how the product works. Visitors who arrived wanting relief find a product description. The conversion drops before they reach the CTA.',
    second_leak: 'Weak social proof specificity. "I felt better" testimonials are common. Specific testimonials that name the exact problem, the timeframe, and the exact change outperform generic ones by 3-5x in health categories.',
    benchmark: 'Health product page benchmark: 2-3% checkout on paid traffic. Pages that match ad outcome language in the hero and lead with specific testimonials convert closer to 4%.',
    cta_copy: 'Score your health page',
    related_links: [
      ['/learning-centre/landing-page-not-converting', 'Why landing pages don\'t convert'],
      ['/learning-centre/social-proof-backfire', 'When social proof backfires'],
      ['/audit', 'Free landing page audit'],
    ],
  },
  'b2b-software': {
    slug: 'b2b-software',
    name: 'B2B Software',
    headline: 'Optimize B2B Software Landing Pages to Boost Demo Requests',
    subheadline: 'Enterprise buyers don\'t convert from a single landing page visit. The page\'s job is to reduce risk and earn the next step.',
    pain: "You're spending on LinkedIn or Google for a B2B software product with a 3-6 month sales cycle. Your landing page is built like a lead-gen page for a $49/month SaaS. The mismatch in buyer intent versus page architecture shows in your demo request rate.",
    icp: 'B2B software founders and demand gen leads spending on paid acquisition for products in the $500-50,000 ACV range with a demo request rate below 2%.',
    top_leak: 'No qualification signal. Buyers who see a form that asks only for name and email feel like they\'re entering an automated funnel, not starting a real conversation. A single qualifying question increases demo quality.',
    second_leak: 'ROI language is absent. B2B buyers need to justify the purchase internally. A page that states the business outcome and the comparable cost of the status quo converts better than a feature comparison.',
    benchmark: 'B2B software demo pages frequently fail on message match - the page speaks to a generic audience rather than the specific role the ad targeted. The audit checks whether the H1, CTA, and above-fold copy address the buyer role directly.',
    cta_copy: 'Score your B2B page',
    related_links: [
      ['/learning-centre/linkedin-ads-not-converting', 'LinkedIn Ads not converting'],
      ['/learning-centre/form-has-zero-friction', 'Form friction guide'],
      ['/saas-landing-page-audit', 'SaaS landing page audit'],
    ],
  },
  'lead-gen': {
    slug: 'lead-gen',
    name: 'Lead Generation',
    headline: 'Stop Wasting Ad Spend: Boost Lead Gen Landing Page Conversions',
    subheadline: 'The form is the last conversion event. The leaks happen in the 30 seconds before anyone reaches it.',
    pain: "You're running high-volume paid campaigns with a form-fill goal. CPL keeps climbing. You've tested the form, shortened it, changed the button copy. The real bottleneck is earlier, in the headline, the proof structure, or the offer framing.",
    icp: 'Performance marketers and demand gen leads running lead gen campaigns with a CPL above industry benchmark or a form conversion rate below 3%.',
    top_leak: 'The offer is unclear. Visitors reaching a form fill need to know exactly what they\'re getting, when, and at what cost in effort. "Get a free guide" converts less than "Get the 12-page checklist in 2 minutes, no call required."',
    second_leak: 'Above-the-fold friction. The headline promises value but the form requires 2+ scrolls to reach. On mobile, this gap is fatal. Every additional scroll on paid traffic is a conversion you\'re losing.',
    benchmark: 'Lead gen page benchmark: 3-5% form fill on paid traffic. Pages with the form or a pre-fill CTA above the fold and a specific, bounded offer convert at the high end of this range.',
    cta_copy: 'Score your lead gen page',
    related_links: [
      ['/lead-generation-landing-page-audit', 'Lead gen landing page audit'],
      ['/learning-centre/form-has-zero-friction', 'Form friction guide'],
      ['/learning-centre/above-fold-landing-page', 'Above-fold optimization'],
    ],
  },
}

export function getVertical(slug: string): Vertical | undefined {
  return verticals[slug]
}

export function getAllVerticalSlugs(): string[] {
  return Object.keys(verticals)
}
