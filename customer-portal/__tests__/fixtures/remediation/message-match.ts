/**
 * Remediation fixture: Message Match signal
 *
 * Validates that the message_match rule correctly identifies FAIL conditions
 * and that prescribed repairs move the condition to PASS.
 */

export const MESSAGE_MATCH_FIXTURE = {
  signal: 'message_match',
  ruleVersion: '2.0',

  failCase: {
    description: 'Ad headline and page headline have no semantic overlap',
    html: `<!DOCTYPE html>
<html>
<head>
  <title>Acme Platform</title>
  <meta name="description" content="The all-in-one platform for modern teams">
</head>
<body>
  <h1>Welcome to Acme</h1>
  <p>We build tools for the future of work.</p>
</body>
</html>`,
    adContext: {
      headline: 'Cut project delays by 40% — Start free trial',
      targetKeyword: 'project management tool',
    },
    expectedResult: 'FAIL',
    expectedEvidence: {
      adHeadline: 'Cut project delays by 40% — Start free trial',
      pageH1: 'Welcome to Acme',
      semanticOverlap: 0,
      outcomeMentioned: false,
    },
  },

  passCase: {
    description: 'Page headline mirrors ad promise and names buyer outcome',
    html: `<!DOCTYPE html>
<html>
<head>
  <title>Acme — Cut Project Delays, Ship Faster</title>
  <meta name="description" content="Teams using Acme ship 40% faster. Free trial, no credit card.">
</head>
<body>
  <h1>Cut project delays — ship what matters, on time</h1>
  <p>Acme keeps your team aligned with one source of truth for tasks, deadlines, and docs.</p>
  <a href="/trial">Start Free Trial</a>
</body>
</html>`,
    adContext: {
      headline: 'Cut project delays by 40% — Start free trial',
      targetKeyword: 'project management tool',
    },
    expectedResult: 'PASS',
    expectedEvidence: {
      adHeadline: 'Cut project delays by 40% — Start free trial',
      pageH1: 'Cut project delays — ship what matters, on time',
      semanticOverlap: 1,
      outcomeMentioned: true,
    },
  },

  remediation: {
    description: 'Rewrite H1 to mirror ad promise and name buyer outcome',
    changes: [
      {
        target: '<h1>',
        before: 'Welcome to Acme',
        after: 'Cut project delays — ship what matters, on time',
      },
      {
        target: '<title>',
        before: 'Acme Platform',
        after: 'Acme — Cut Project Delays, Ship Faster',
      },
    ],
  },
}
