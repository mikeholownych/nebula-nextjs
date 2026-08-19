import { createFAQPageSchema } from '@/app/lib/schema'

const repairSprintAnswer =
  'One landing page and one high-confidence audit finding. Nebula sends a tailored repair sprint after successful payment - exact copy, a code snippet, or a configuration change. No site access is required. You implement it yourself or hand it to your developer. Includes one same-scope re-audit within 30 days.'

export const pricingFAQSchema = createFAQPageSchema([
  {
    question: "What's in the free audit?",
    answer: 'A 9-signal audit scoring message match, trust signals, mobile CTA, above the fold, ad signals, SEO foundations, AI readiness, CTA clarity, and load speed. Each signal gets specific findings and prioritized repairs ranked by priority.',
  },
  {
    question: 'How is the $97 One-Leak Repair Sprint delivered?',
    answer: repairSprintAnswer,
  },
  {
    question: 'Do I need to share access to my site?',
    answer: 'No. Nebula does not take access to your site, CMS, or hosting. The paid kit contains implementation instructions you run yourself or hand to your developer.',
  },
  {
    question: 'What if the repair cannot be implemented safely?',
    answer: 'If Nebula cannot generate the promised bounded implementation kit for the selected finding, contact support for a delivery review or refund.',
  },
  {
    question: 'Does the repair guarantee a higher conversion rate?',
    answer: 'No. Nebula delivers the exact fix for your highest-priority failing signal. The 30-day re-audit verifies the condition changed. Traffic quality, offer strength, and measurement windows also affect conversion — no service can guarantee lift without controlled traffic and a measurement window.',
  },
  {
    question: 'What landing page problems does Nebula diagnose?',
    answer: 'Nine recurring signal failures: message-match failure, missing trust signals, mobile CTA hidden below fold, slow load speed, unclear or competing CTAs, above-fold clarity gaps, missing ad tracking signals, weak SEO foundations, and AI readiness gaps.',
  },
])

export const homeFAQSchema = createFAQPageSchema([
  {
    question: 'How long does the free landing page audit take?',
    answer: 'Under 2 minutes. Paste your URL and get a scored 9-signal diagnosis with findings ranked by priority.',
  },
  {
    question: "What's included in the $97 One-Leak Repair Sprint?",
    answer: repairSprintAnswer,
  },
  {
    question: 'Why do landing pages fail to convert paid traffic?',
    answer: 'Most landing page failures follow diagnosable patterns: the ad promise does not match the page headline, no social proof appears above the fold, the CTA is hidden on mobile, the page loads too slowly, the primary action competes with secondary links, or the page lacks signals for AI and search discoverability.',
  },
  {
    question: 'Do you need access to my website to run the audit?',
    answer: 'No. We audit the public page. Just paste your URL - no login, dashboard access, or code repository is needed for the free audit.',
  },
])

// Kept in sync with the rendered FAQ in app/audit/page.tsx.
// Both the JSON-LD (structured search features) and the prose DOM section
// (AI text-layer citations) should reflect the same Q&A.
export const auditPageFAQSchema = createFAQPageSchema([
  {
    question: 'What does the free landing page audit check?',
    answer: 'Seven conversion signals against your actual page: message match (ad promise vs. page headline), trust signals (proof near the CTA), mobile CTA visibility on a 375px viewport, load speed, CTA clarity, SEO foundations (title, meta, H1), and AI readiness. Each returns a pass or fail with the raw evidence from your page.',
  },
  {
    question: 'How long does the audit take?',
    answer: 'Under 2 minutes. Paste your URL and the results appear automatically. No email or account required to see your findings.',
  },
  {
    question: 'Do I need to create an account?',
    answer: 'No. You see your score and initial findings without sharing an email. You only provide an email if you want the full written report saved to a workspace.',
  },
  {
    question: 'What does the $97 One-Leak Repair Sprint include?',
    answer: 'One scoped repair package for the highest-priority failing signal on your page, exact copy, code, or configuration change written for your specific page and sent by email within 48 hours. Includes one same-scope re-audit within 30 days. No site access required. Does not guarantee conversion lift.',
  },
  {
    question: 'Which platforms does the audit work with?',
    answer: 'Any publicly accessible landing page: Webflow, Framer, Shopify, WordPress, Next.js, Squarespace, ClickFunnels, or a hand-coded page. The audit fetches the public HTML and evaluates what a visitor actually sees.',
  },
  {
    question: 'What does the audit not cover?',
    answer: 'The audit cannot observe visitor intent, ad audience quality, offer economics, or post-form conversion flows. It checks observable page conditions, the things a visitor experiences before they decide to act or leave. Business outcomes also depend on traffic quality and offer strength.',
  },
])
