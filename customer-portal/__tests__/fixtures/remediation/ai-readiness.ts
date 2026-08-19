export const AI_READINESS_FIXTURE = {
  signal: 'ai_readiness',
  ruleVersion: '2.0',

  failCase: {
    description: 'No JSON-LD structured data and heading hierarchy skips levels',
    html: `<!DOCTYPE html>
<html>
<head>
  <title>Acme CRM — Sales Pipeline Management</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Manage your sales pipeline with Acme CRM.">
</head>
<body>
  <h1>Manage your pipeline</h1>
  <h4>Features</h4>
  <ul>
    <li>Deal tracking</li>
    <li>Contact management</li>
    <li>Email sequences</li>
  </ul>
  <h4>Pricing</h4>
  <p>From $29/month per seat.</p>
  <a href="/signup">Try Free</a>
</body>
</html>`,
    expectedResult: 'FAIL',
    expectedEvidence: {
      jsonLdPresent: false,
      headingHierarchyValid: false,
      skippedLevels: ['h2', 'h3'],
    },
  },

  passCase: {
    description: 'JSON-LD present and heading hierarchy is sequential',
    html: `<!DOCTYPE html>
<html>
<head>
  <title>Acme CRM — Sales Pipeline Management</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Manage your sales pipeline with Acme CRM.">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication","name":"Acme CRM","applicationCategory":"BusinessApplication","offers":{"@type":"Offer","price":"29","priceCurrency":"USD"}}</script>
</head>
<body>
  <h1>Manage your pipeline</h1>
  <h2>Features</h2>
  <ul>
    <li>Deal tracking</li>
    <li>Contact management</li>
    <li>Email sequences</li>
  </ul>
  <h2>Pricing</h2>
  <p>From $29/month per seat.</p>
  <a href="/signup">Try Free</a>
</body>
</html>`,
    expectedResult: 'PASS',
    expectedEvidence: {
      jsonLdPresent: true,
      headingHierarchyValid: true,
      skippedLevels: [],
    },
  },

  remediation: {
    description: 'Add JSON-LD and fix heading hierarchy',
    changes: [
      {
        target: 'JSON-LD in head',
        before: `  <meta name="description" content="Manage your sales pipeline with Acme CRM.">\n</head>`,
        after: `  <meta name="description" content="Manage your sales pipeline with Acme CRM.">\n  <script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication","name":"Acme CRM","applicationCategory":"BusinessApplication","offers":{"@type":"Offer","price":"29","priceCurrency":"USD"}}</script>\n</head>`,
      },
      {
        target: 'heading hierarchy - features',
        before: `<h4>Features</h4>`,
        after: `<h2>Features</h2>`,
      },
      {
        target: 'heading hierarchy - pricing',
        before: `<h4>Pricing</h4>`,
        after: `<h2>Pricing</h2>`,
      },
    ],
  },
}
