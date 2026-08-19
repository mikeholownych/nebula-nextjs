/**
 * Remediation fixture: SEO Foundations signal
 *
 * Validates that the seo_foundations rule correctly identifies FAIL conditions
 * and that prescribed repairs move the condition to PASS.
 */

export const SEO_FOUNDATIONS_FIXTURE = {
  signal: 'seo_foundations',
  ruleVersion: '2.0',

  failCase: {
    description: 'Title too short, meta desc too long, H1 too long',
    html: `<!DOCTYPE html>
<html>
<head>
  <title>Acme</title>
  <meta name="description" content="${'A'.repeat(185)}">
</head>
<body>
  <h1>${'Acme provides the most comprehensive enterprise-grade solution for all your workflow automation needs today'.slice(0, 95)}</h1>
  <a href="/signup">Sign Up</a>
</body>
</html>`,
    expectedResult: 'FAIL',
    expectedEvidence: {
      titleLength: 4,
      metaDescLength: 185,
      h1Length: 95,
      h1Count: 1,
    },
  },

  passCase: {
    description: 'Title 30-60 chars, meta desc <=155, H1 under 90',
    html: `<!DOCTYPE html>
<html>
<head>
  <title>Acme — Workflow Automation for Enterprise Teams</title>
  <meta name="description" content="Acme automates your team workflows. Used by 500+ companies. Start free — no credit card required.">
</head>
<body>
  <h1>Automate workflows your team actually uses</h1>
  <a href="/signup">Start Free</a>
</body>
</html>`,
    expectedResult: 'PASS',
    expectedEvidence: {
      titleLength: 49,
      metaDescLength: 97,
      h1Length: 43,
      h1Count: 1,
    },
  },

  remediation: {
    description: 'Apply prescribed repair to FAIL fixture — should produce PASS',
    changes: [
      { target: '<title>', before: '<title>Acme</title>', after: '<title>Acme — Workflow Automation for Enterprise Teams</title>' },
      { target: '<meta name="description">', before: `<meta name="description" content="${'A'.repeat(185)}">`, after: '<meta name="description" content="Acme automates your team workflows. Used by 500+ companies. Start free — no credit card required.">' },
      { target: '<h1>', before: `<h1>${'Acme provides the most comprehensive enterprise-grade solution for all your workflow automation needs today'.slice(0, 95)}</h1>`, after: '<h1>Automate workflows your team actually uses</h1>' },
    ],
  },
}
