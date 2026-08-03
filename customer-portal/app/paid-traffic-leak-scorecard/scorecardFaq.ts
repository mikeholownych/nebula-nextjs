export interface ScorecardFaqItem {
  question: string
  answer: string
}

export const scorecardFaqItems: ScorecardFaqItem[] = [
  {
    question: 'What does the scorecard measure?',
    answer: 'The scorecard measures seven self-reported conditions that can create conversion friction around paid traffic: active traffic context, ad-to-headline match, above-fold clarity, CTA specificity, proof, mobile flow, and conversion-event measurement.',
  },
  {
    question: 'Is this the same as a Nebula audit?',
    answer: 'No. The scorecard is a self-assessment; a Nebula audit observes the public URL and returns measured findings across the page signals it can inspect.',
  },
  {
    question: 'Does a high risk count prove the page is the problem?',
    answer: 'No. A high risk count identifies conditions worth inspecting and does not prove the page is the only cause of weak conversion, traffic quality, offer, or price problems.',
  },
  {
    question: 'What happens when I run the free audit?',
    answer: 'You submit a public landing-page URL and receive an evidence-backed audit flow that checks observable page conditions before you decide whether a repair is warranted.',
  },
]
