export const AD_TRACKING_FIXTURE = {
  signal: 'ad_signals',
  ruleVersion: '2.0',

  failCase: {
    description: 'No ad tracking pixel or analytics ID detected in HTML',
    html: `<!DOCTYPE html>
<html>
<head>
  <title>Acme Fitness - Online Personal Training</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Get fit with personalized training plans.">
</head>
<body>
  <h1>Your personalized training plan</h1>
  <p>Acme Fitness builds custom workout programs for busy professionals.</p>
  <a href="/start">Start Your Plan</a>
</body>
</html>`,
    expectedResult: 'FAIL',
    expectedEvidence: {
      trackingSignalsFound: 0,
      pixelPresent: false,
      gaIdPresent: false,
    },
  },

  passCase: {
    description: 'GA4 measurement ID present in page HTML',
    html: `<!DOCTYPE html>
<html>
<head>
  <title>Acme Fitness - Online Personal Training</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Get fit with personalized training plans.">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-XXXXXXXXXX');</script>
</head>
<body>
  <h1>Your personalized training plan</h1>
  <p>Acme Fitness builds custom workout programs for busy professionals.</p>
  <a href="/start">Start Your Plan</a>
</body>
</html>`,
    expectedResult: 'PASS',
    expectedEvidence: {
      trackingSignalsFound: 1,
      pixelPresent: false,
      gaIdPresent: true,
    },
  },

  remediation: {
    description: 'Add GA4 tracking snippet to head',
    changes: [
      {
        target: '<head> tracking scripts',
        before: `  <meta name="description" content="Get fit with personalized training plans.">\n</head>`,
        after: `  <meta name="description" content="Get fit with personalized training plans.">\n  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>\n  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-XXXXXXXXXX');</script>\n</head>`,
      },
    ],
  },
}
