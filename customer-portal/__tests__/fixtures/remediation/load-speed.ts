export const LOAD_SPEED_FIXTURE = {
  signal: 'load_time',
  ruleVersion: '2.0',

  failCase: {
    description: 'Render-blocking scripts in head delay FCP',
    html: `<!DOCTYPE html>
<html>
<head>
  <title>Acme Store - Premium Goods</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.example.com/analytics.js"></script>
  <script src="https://cdn.example.com/ab-testing.js"></script>
  <script src="https://cdn.example.com/chat-widget.js"></script>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <h1>Premium goods, delivered fast</h1>
  <a href="/shop">Shop Now</a>
</body>
</html>`,
    expectedResult: 'FAIL',
    expectedEvidence: {
      renderBlockingScripts: 3,
      estimatedBlockTime: 'high',
    },
  },

  passCase: {
    description: 'Scripts deferred, no render blocking',
    html: `<!DOCTYPE html>
<html>
<head>
  <title>Acme Store - Premium Goods</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.example.com/analytics.js" defer></script>
  <script src="https://cdn.example.com/ab-testing.js" defer></script>
  <script src="https://cdn.example.com/chat-widget.js" defer></script>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <h1>Premium goods, delivered fast</h1>
  <a href="/shop">Shop Now</a>
</body>
</html>`,
    expectedResult: 'PASS',
    expectedEvidence: {
      renderBlockingScripts: 0,
      estimatedBlockTime: 'none',
    },
  },

  remediation: {
    description: 'Add defer attribute to render-blocking scripts',
    changes: [
      {
        target: 'analytics script',
        before: `<script src="https://cdn.example.com/analytics.js"></script>`,
        after: `<script src="https://cdn.example.com/analytics.js" defer></script>`,
      },
      {
        target: 'ab-testing script',
        before: `<script src="https://cdn.example.com/ab-testing.js"></script>`,
        after: `<script src="https://cdn.example.com/ab-testing.js" defer></script>`,
      },
      {
        target: 'chat-widget script',
        before: `<script src="https://cdn.example.com/chat-widget.js"></script>`,
        after: `<script src="https://cdn.example.com/chat-widget.js" defer></script>`,
      },
    ],
  },
}
