import { createFAQPageSchema } from '@/app/lib/schema'

const repairSprintAnswer =
  'One landing page and one high-confidence audit finding. Nebula sends a tailored repair sprint after successful payment - exact copy, a code snippet, or a configuration change. No site access is required. You implement it yourself or hand it to your developer. Includes one same-scope re-audit within 30 days.'

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
    answer: 'No. Nebula does not take access to your site, CMS, or hosting. The paid kit contains implementation instructions you run yourself or hand to your developer.',
  },
  {
    question: 'What if the repair cannot be implemented safely?',
    answer: 'If Nebula cannot generate the promised bounded implementation kit for the selected finding, contact support for a delivery review or refund.',
  },
  {
    question: 'Does the repair guarantee a higher conversion rate?',
    answer: 'No. Nebula identifies and delivers fixes for the highest-confidence conversion leak found. Traffic quality, offer strength, campaign changes, and measurement windows also affect business outcomes.',
  },
  {
    question: 'What landing page problems does Nebula diagnose?',
    answer: 'Nine recurring signal failures: message-match failure, missing trust signals, mobile CTA hidden below fold, slow load speed, unclear or competing CTAs, above-fold clarity gaps, missing ad tracking signals, weak SEO foundations, and AI readiness gaps.',
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
    answer: 'Most landing page failures follow diagnosable patterns: the ad promise does not match the page headline, no social proof appears above the fold, the CTA is hidden on mobile, the page loads too slowly, the primary action competes with secondary links, or the page lacks signals for AI and search discoverability.',
  },
  {
    question: 'Do you need access to my website to run the audit?',
    answer: 'No. We audit the public page. Just paste your URL - no login, dashboard access, or code repository is needed for the free audit.',
  },
])

export const auditPageFAQSchema = createFAQPageSchema([
  {
    question: 'What does the free landing page audit check?',
    answer: 'Nine conversion signals: message match, trust signals, mobile CTA visibility, above the fold clarity, ad signals, SEO foundations, AI readiness, CTA clarity, and load speed.',
  },
  {
    question: 'How long does the landing page audit take?',
    answer: 'Under 2 minutes. Paste your URL and results appear automatically - no email required to see your score and initial findings.',
  },
  {
    question: 'What happens after the free audit?',
    answer: 'You see your 9-signal score and initial findings. If the page has a high-confidence conversion leak, the $97 One-Leak Repair Sprint supplies a tailored change for one selected finding.',
  },
  {
    question: 'Does the audit require an account or login?',
    answer: 'No. Paste your URL and results appear automatically. You only share your email if you want the full written report.',
  },
])
