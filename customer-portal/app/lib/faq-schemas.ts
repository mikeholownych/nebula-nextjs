import { createFAQPageSchema } from '@/app/lib/schema';

export const pricingFAQSchema = createFAQPageSchema([
  {
    question: "What's in the free audit?",
    answer: "A full 5-dimension teardown: Clarity, CTA Friction, Trust Gap, Offer Specificity, and Implementation Difficulty. Each dimension gets a score, specific issues, and prioritized fixes with code suggestions.",
  },
  {
    question: "How is the Fix Pack delivered?",
    answer: "Within 24 hours via email. You get rewritten headline copy, optimized CTA placement, trust block recommendations, and ready-to-publish HTML/CSS.",
  },
  {
    question: "Do I need to share access?",
    answer: "No. Just paste your URL. We audit the public page. No login, no dashboard access, no code repository needed.",
  },
  {
    question: "What if it doesn't help?",
    answer: "Request a refund within 30 days. We process it in 30 minutes. No questions asked.",
  },
]);

export const homeFAQSchema = createFAQPageSchema([
  {
    question: "How long does the free audit take?",
    answer: "About 60 seconds. Paste your URL and get a full 5-dimension score with specific fixes.",
  },
  {
    question: "What's included in the $147 Fix Pack?",
    answer: "Rewritten headline, optimized CTA placement, trust block recommendations, mobile check, and ready-to-publish HTML/CSS delivered in 24 hours.",
  },
  {
    question: "Do you need access to my site?",
    answer: "No. We audit the public page. No login, no dashboard access, no code repository needed.",
  },
]);
