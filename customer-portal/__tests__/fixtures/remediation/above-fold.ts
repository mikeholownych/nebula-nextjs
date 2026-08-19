export const ABOVE_FOLD_FIXTURE = {
  signal: 'above_fold',
  ruleVersion: '2.0',

  failCase: {
    description: 'CTA not visible above fold — buried below 3 sections of content',
    html: `<!DOCTYPE html>
<html>
<head>
  <title>Acme — Project Management Software</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <h1>Ship faster with Acme project management</h1>
  <p>Acme helps teams ship software faster with integrated sprint planning, code review, and deployment pipelines.</p>
  <section>
    <h2>Features</h2>
    <p>Sprint boards, burndown charts, and velocity tracking.</p>
  </section>
  <section>
    <h2>Integrations</h2>
    <p>Works with GitHub, GitLab, Bitbucket, and Jira.</p>
  </section>
  <section>
    <h2>Pricing</h2>
    <p>Free for teams of up to 5. Pro starts at $12/user/month.</p>
    <a href="/signup" class="btn-primary">Start Free Trial</a>
  </section>
</body>
</html>`,
    expectedResult: 'FAIL',
    expectedEvidence: {
      ctaInFirstViewport: false,
      ctaPosition: 'below fold',
    },
  },

  passCase: {
    description: 'CTA visible above fold with headline and proof',
    html: `<!DOCTYPE html>
<html>
<head>
  <title>Acme — Project Management Software</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <h1>Ship faster with Acme project management</h1>
  <p>Trusted by 2,000+ engineering teams. Free for teams of 5.</p>
  <a href="/signup" class="btn-primary">Start Free Trial</a>
  <section>
    <h2>Features</h2>
    <p>Sprint boards, burndown charts, and velocity tracking.</p>
  </section>
</body>
</html>`,
    expectedResult: 'PASS',
    expectedEvidence: {
      ctaInFirstViewport: true,
      ctaPosition: 'above fold',
    },
  },

  remediation: {
    description: 'Move CTA to immediately after headline and proof',
    changes: [
      {
        target: 'CTA placement',
        before: `  <section>\n    <h2>Pricing</h2>\n    <p>Free for teams of up to 5. Pro starts at $12/user/month.</p>\n    <a href="/signup" class="btn-primary">Start Free Trial</a>\n  </section>`,
        after: `  <section>\n    <h2>Pricing</h2>\n    <p>Free for teams of up to 5. Pro starts at $12/user/month.</p>\n  </section>`,
      },
      {
        target: 'CTA after headline',
        before: `  <p>Acme helps teams ship software faster with integrated sprint planning, code review, and deployment pipelines.</p>`,
        after: `  <p>Trusted by 2,000+ engineering teams. Free for teams of 5.</p>\n  <a href="/signup" class="btn-primary">Start Free Trial</a>`,
      },
    ],
  },
}
