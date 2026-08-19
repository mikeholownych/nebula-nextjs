export const TRUST_SIGNALS_FIXTURE = {
  signal: 'social_proof',
  ruleVersion: '2.0',

  failCase: {
    description: 'No trust signals present near CTA',
    html: `<!DOCTYPE html>
<html>
<head>
  <title>Acme Analytics - Real-Time Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <h1>See your data in real time</h1>
  <p>Acme Analytics gives you a single dashboard for all your metrics.</p>
  <a href="/signup">Start Free</a>
  <section>
    <h2>Features</h2>
    <ul>
      <li>Real-time event streaming</li>
      <li>Custom dashboards</li>
      <li>SQL query editor</li>
    </ul>
  </section>
</body>
</html>`,
    expectedResult: 'FAIL',
    expectedEvidence: {
      proofElementsFound: 0,
      proofNearCta: false,
    },
  },

  passCase: {
    description: 'Named testimonial visible near CTA',
    html: `<!DOCTYPE html>
<html>
<head>
  <title>Acme Analytics - Real-Time Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <h1>See your data in real time</h1>
  <p>Acme Analytics gives you a single dashboard for all your metrics.</p>
  <p class="testimonial">"We cut our reporting time from 4 hours to 10 minutes." - Sarah Chen, VP Engineering at DataCo</p>
  <a href="/signup">Start Free</a>
  <section>
    <h2>Features</h2>
    <ul>
      <li>Real-time event streaming</li>
      <li>Custom dashboards</li>
      <li>SQL query editor</li>
    </ul>
  </section>
</body>
</html>`,
    expectedResult: 'PASS',
    expectedEvidence: {
      proofElementsFound: 1,
      proofNearCta: true,
    },
  },

  remediation: {
    description: 'Add named testimonial above the CTA',
    changes: [
      {
        target: 'testimonial placement',
        before: `  <p>Acme Analytics gives you a single dashboard for all your metrics.</p>\n  <a href="/signup">Start Free</a>`,
        after: `  <p>Acme Analytics gives you a single dashboard for all your metrics.</p>\n  <p class="testimonial">"We cut our reporting time from 4 hours to 10 minutes." - Sarah Chen, VP Engineering at DataCo</p>\n  <a href="/signup">Start Free</a>`,
      },
    ],
  },
}
