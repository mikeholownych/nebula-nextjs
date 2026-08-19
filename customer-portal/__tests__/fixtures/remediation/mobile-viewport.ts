export const MOBILE_VIEWPORT_FIXTURE = {
  signal: 'mobile',
  ruleVersion: '2.0',

  failCase: {
    description: 'Missing viewport meta tag — page renders at desktop width on mobile',
    html: `<!DOCTYPE html>
<html>
<head>
  <title>Acme Consulting — Strategy & Execution</title>
  <meta name="description" content="Acme Consulting helps B2B companies grow revenue.">
</head>
<body>
  <h1>Strategy that drives revenue</h1>
  <p>We help B2B SaaS companies scale from $1M to $10M ARR.</p>
  <a href="/book-call">Book a Strategy Call</a>
</body>
</html>`,
    expectedResult: 'FAIL',
    expectedEvidence: {
      viewportMetaPresent: false,
    },
  },

  passCase: {
    description: 'Viewport meta present and correctly configured',
    html: `<!DOCTYPE html>
<html>
<head>
  <title>Acme Consulting — Strategy & Execution</title>
  <meta name="description" content="Acme Consulting helps B2B companies grow revenue.">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <h1>Strategy that drives revenue</h1>
  <p>We help B2B SaaS companies scale from $1M to $10M ARR.</p>
  <a href="/book-call">Book a Strategy Call</a>
</body>
</html>`,
    expectedResult: 'PASS',
    expectedEvidence: {
      viewportMetaPresent: true,
    },
  },

  remediation: {
    description: 'Add viewport meta tag to head',
    changes: [
      {
        target: '<head> meta tags',
        before: `  <meta name="description" content="Acme Consulting helps B2B companies grow revenue.">\n</head>`,
        after: `  <meta name="description" content="Acme Consulting helps B2B companies grow revenue.">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n</head>`,
      },
    ],
  },
}
