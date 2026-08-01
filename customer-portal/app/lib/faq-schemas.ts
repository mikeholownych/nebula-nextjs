import { createFAQPageSchema } from '@/app/lib/schema'

const repairSprintAnswer =
  'One landing page and one high-confidence page-level repair selected from the audit. Nebula records the baseline, confirms the scope with you, implements the approved repair, verifies production, and runs a same-scope re-audit. The service does not guarantee conversion lift.'

export const pricingFAQSchema = createFAQPageSchema([
  {
    question: "What's in the free audit?",
    answer: 'A 9-signal audit scoring message match, trust signals, mobile CTA, above the fold, ad signals, SEO foundations, AI readiness, CTA clarity, and load speed. Each signal gets specific findings and prioritized repairs ranked by likely conversion impact.',
  },
  {
    question: 'How is the $97 One-Leak Repair Sprint delivered?',
    answer: repairSprintAnswer,
  },
  {
    question: 'Do I need to share access to my site?',
    answer: 'Not for the free audit. For paid implementation, you approve the scope and grant temporary collaborator access or approve a buyer-controlled patch handoff. Never send passwords by email.',
  },
  {
    question: 'What if the repair cannot be implemented safely?',
    answer: 'If the page or available access path cannot support a safe bounded repair, Nebula refunds the purchase in full before work begins.',
  },
  {
    question: 'Does the repair guarantee a higher conversion rate?',
    answer: 'No. Nebula verifies the observed page condition, implementation, and same-scope re-audit. Traffic quality, offer strength, campaign changes, and measurement windows also affect business outcomes.',
  },
  {
    question: 'What landing page problems does Nebula diagnose?',
    answer: "Seven recurring failure patterns: message-match failure, missing trust signals above the fold, mobile layout friction hiding the CTA, slow load time, unclear or competing CTAs, form friction, and compliance gaps blocking the conversion path.",
  },
])

export const homeFAQSchema = createFAQPageSchema([
  {
    question: 'How long does the free landing page audit take?',
    answer: 'Under 2 minutes. Paste your URL and get a scored 9-signal diagnosis with findings ranked by likely conversion impact.',
  },
  {
    question: "What's included in the $97 One-Leak Repair Sprint?",
    answer: repairSprintAnswer,
  },
  {
    question: 'Why do landing pages fail to convert paid traffic?',
    answer: "Most landing page failures follow seven diagnosable patterns: the ad promise does not match the page headline, no social proof appears above the fold, the CTA is invisible on mobile, the page loads too slowly, the primary action competes with secondary links, forms ask for too much before delivering value, or a consent layer blocks the conversion path.",
  },
  {
    question: 'Do you need access to my website to run the audit?',
    answer: 'No. We audit the public page. Just paste your URL — no login, dashboard access, or code repository is needed for the free audit.',
  },
])

export const auditPageFAQSchema = createFAQPageSchema([
  {
    question: 'What does the free landing page audit check?',
    answer: 'Seven conversion signals: message-match, above-fold trust, mobile CTA visibility, Core Web Vitals, CTA clarity, form friction, and compliance conditions affecting the conversion path.',
  },
  {
    question: 'How long does the landing page audit take?',
    answer: 'Under 2 minutes. Paste your URL and results appear automatically — no email required to see your score and initial findings.',
  },
  {
    question: 'What happens after the free audit?',
    answer: 'You see your 7-point score and specific findings. If the page has a high-confidence page-level leak, the $97 One-Leak Repair Sprint can implement and verify one buyer-approved repair.',
  },
  {
    question: 'Does the audit require an account or login?',
    answer: 'No. Paste your URL and results appear automatically. You only share your email if you want the full written report.',
  },
])
