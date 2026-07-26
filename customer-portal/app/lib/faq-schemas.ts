import { createFAQPageSchema } from '@/app/lib/schema';

export const pricingFAQSchema = createFAQPageSchema([
  {
    question: "What's in the free audit?",
    answer: "A 7-point diagnosis scoring message-match, trust signals, mobile layout, load time, CTA clarity, form friction, and compliance. Each point gets a pass/fail with specific findings and prioritized fixes ranked by conversion impact.",
  },
  {
    question: "How is the $97 Fix Pack delivered?",
    answer: "Within minutes of payment. You get a written diagnosis of which of the 7 conversion signals are failing on your page, ranked by impact, plus a tailored AI prompt for every finding — you or your developer implement the fixes.",
  },
  {
    question: "Do I need to share access to my site?",
    answer: "No. Just paste your URL. We audit the public page. No login, no dashboard access, no code repository needed.",
  },
  {
    question: "What if my conversion rate doesn't improve?",
    answer: "We include a 30-day re-audit at no charge if conversion does not improve after fixes are applied. If you want a full refund instead, request it within 30 days.",
  },
  {
    question: "What landing page problems does Nebula diagnose?",
    answer: "Seven recurring failure patterns: message-match failure (ad promise doesn't match page headline), missing trust signals above the fold, mobile layout friction hiding the CTA, slow load time over 3 seconds, unclear or competing CTAs, form friction with too many fields, and compliance gaps blocking the conversion path.",
  },
]);

export const homeFAQSchema = createFAQPageSchema([
  {
    question: "How long does the free landing page audit take?",
    answer: "Under 2 minutes. Paste your URL and get a scored 7-point diagnosis — message-match, trust signals, mobile layout, load time, CTA clarity, form friction, and compliance — with findings ranked by conversion impact.",
  },
  {
    question: "What's included in the $97 Fix Pack?",
    answer: "A complete 7-point landing page audit, a written diagnosis identifying which conversion signals are failing and why, and a tailored AI prompt for every finding, built from your actual page. Delivered by email within minutes of payment. One-time payment, no retainer.",
  },
  {
    question: "Why do landing pages fail to convert paid traffic?",
    answer: "Most landing page failures follow seven diagnosable patterns: the ad promise doesn't match the page headline (message-match failure), no social proof appears above the fold, the CTA is invisible on mobile, the page loads too slowly, the primary action competes with secondary links, forms ask for too much before delivering value, or a GDPR consent banner blocks the conversion path.",
  },
  {
    question: "Do you need access to my website to run the audit?",
    answer: "No. We audit the public page. Just paste your URL — no login, no dashboard access, no code repository needed.",
  },
]);

export const auditPageFAQSchema = createFAQPageSchema([
  {
    question: "What does the free landing page audit check?",
    answer: "Seven conversion signals: message-match (does the ad headline match the page headline), above-fold trust signals, mobile CTA visibility on a 375px viewport, Core Web Vitals (LCP under 2.5s, CLS under 0.1, INP under 200ms), CTA clarity, form friction (five fields or fewer), and GDPR/CCPA compliance without blocking the conversion path.",
  },
  {
    question: "How long does the landing page audit take?",
    answer: "Under 2 minutes. Paste your URL and results appear automatically — no email required to see your score and findings.",
  },
  {
    question: "What happens after the free audit?",
    answer: "You see your 7-point score with specific findings. If the page has fixable issues, the $97 Fix Pack gives you a tailored AI prompt for every finding, delivered by email within minutes of payment.",
  },
  {
    question: "Does the audit require any account or login?",
    answer: "No. Paste your URL and results appear immediately. You only share your email if you want the full written report.",
  },
]);
