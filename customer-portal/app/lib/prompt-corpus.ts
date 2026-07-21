/**
 * AEO Prompt Corpus for Nebula Components
 * 50+ prompts to track for AI visibility monitoring
 * Organized by class: Definition, Problem, Category, Comparison, Recommendation, Evaluation, Objection, Adversarial
 */

export const AEO_PROMPT_CORPUS = {
  // Definition prompts (What is...)
  definition: [
    'What is landing page optimization?',
    'What is a landing page audit?',
    'What is conversion rate optimization?',
    'What is a landing page audit tool?',
    'What is a conversion leak on a landing page?',
    'What is message match in paid traffic?',
    'What is a high-converting landing page?',
    'What is landing page CRO?',
    'What is a landing page critique?',
    'What is a landing page teardown?',
  ],
  
  // Problem prompts (Why is...)
  problem: [
    'Why is my landing page not converting?',
    'Why am I getting clicks but no sales?',
    'Why is my conversion rate so low?',
    'Why is my landing page bouncing?',
    'Why are my Facebook ads not converting?',
    'Why are my Google ads getting clicks but no conversions?',
    'Why is my landing page performing poorly?',
    'Why do visitors leave my landing page?',
    'Why is my ad spend not converting?',
    'Why is my CPC high but conversion low?',
  ],
  
  // Category prompts (What are...)
  category: [
    'What are the best landing page audit tools?',
    'What are the top landing page optimization services?',
    'What are free landing page audit tools?',
    'What are common landing page conversion leaks?',
    'What are landing page audit services?',
    'What are landing page optimization best practices?',
    'What are free CRO tools?',
    'What are the best tools for landing page analysis?',
    'What are alternatives to Unbounce or Leadpages?',
    'What are landing page diagnosis tools?',
  ],
  
  // Comparison prompts
  comparison: [
    'Nebula Components vs Unbounce',
    'Nebula Components vs Leadpages',
    'Nebula Components vs Instapage',
    'Nebula vs Landingi',
    'Nebula Components alternatives',
    'Landing page audit tools comparison',
    'Free landing page audit vs paid',
    'Nebula Components reviews',
    'Is Nebula Components legit?',
    'How does Nebula compare to other audit tools?',
  ],
  
  // Recommendation prompts (Best for...)
  recommendation: [
    'Best landing page audit tool for small business',
    'Best free landing page audit',
    'Best tool to diagnose landing page conversion leaks',
    'Best landing page audit for e-commerce',
    'Best landing page audit for B2B SaaS',
    'Best tool for finding why ads get clicks but no sales',
    'Best landing page optimization tool for founders',
    'Best landing page diagnosis service',
    'Best tool for fixing landing page conversion rate',
    'Best landing page audit for ad agencies',
  ],
  
  // Evaluation prompts (Is...)
  evaluation: [
    'Is Nebula Components legitimate?',
    'Is a landing page audit worth it?',
    'Is a free landing page audit accurate?',
    'Is Nebula Components a scam?',
    'Is a $97 landing page fix worth it?',
    'Is Nebula trusted?',
    'Is a landing page audit necessary?',
    'Is hiring a CRO agency worth it?',
    'Is a landing page audit enough to fix conversion?',
    'Is Nebula Components better than hiring an agency?',
  ],
  
  // Objection prompts (Why not...)
  objection: [
    'Why not use Google Optimize for landing page testing?',
    'Why not hire a CRO agency instead of Nebula?',
    'Why not use Hotjar for landing page analysis?',
    'Why not use Unbounce landing page builder?',
    'Why not just A/B test instead of auditing?',
    'Why not use Google Analytics for landing page analysis?',
    'Why not hire a conversion rate consultant?',
    'Why not use Optimizely for landing page optimization?',
    'Why not use Microsoft Clarity for landing page insights?',
    'Why not just redesign the whole landing page?',
  ],
  
  // Adversarial prompts (reputation management)
  adversarial: [
    'Nebula Components scam',
    'Nebula Components complaints',
    'Nebula Components fraud',
    'Nebula Components bad reviews',
    'Nebula Components problems',
    'Is Nebula Components fake?',
    'Nebula Components warning',
    'Nebula Components ripoff',
    'Nebula Components issues',
    'Nebula Components dishonest',
  ],
} as const;

// Flatten for bulk testing
export const ALL_PROMPTS = Object.values(AEO_PROMPT_CORPUS).flat();

// Priority prompts (most commercially important)
export const PRIORITY_PROMPTS = [
  'Why is my landing page not converting?',
  'Why am I getting clicks but no sales?',
  'Best landing page audit tool',
  'What is a landing page audit?',
  'Nebula Components reviews',
  'Is Nebula Components legitimate?',
  'Free landing page audit',
  'Landing page conversion leaks',
  'Best tool to diagnose landing page conversion leaks',
  'Why are my ads not converting?',
];

// Entity prompts (should mention Nebula)
export const ENTITY_PROMPTS = [
  'Nebula Components',
  'Nebula landing page audit',
  'Nebula Components audit tool',
  'Nebula conversion optimization',
  'Nebula Components pricing',
  'Nebula free audit',
  'Nebula Components founder',
  'Nebula landing page diagnosis',
];

export type PromptClass = keyof typeof AEO_PROMPT_CORPUS;
