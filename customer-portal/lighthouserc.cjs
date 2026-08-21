module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3102/',
        'http://localhost:3102/audit',
        'http://localhost:3102/checkout',
        'http://localhost:3102/learning-centre',
        'http://localhost:3102/learning-centre/landing-page-not-converting',
        'http://localhost:3102/resources/citable',
        'http://localhost:3102/resources/citable/jobs/technical-retrieval-audit',
      ],
      numberOfRuns: 3,
      startServerCommand: 'npm run start -- --port 3102',
      startServerReadyPattern: '(?:^|\\s)Ready in \\d',
      startServerReadyTimeout: 120_000,
      settings: {
        chromeFlags: '--no-sandbox',
        onlyCategories: ['performance'],
        preset: 'desktop',
      },
    },
    assert: {
      assertions: {
        'categories:performance': [
          'error',
          { minScore: 0.9, aggregationMethod: 'median' },
        ],
        'largest-contentful-paint': [
          'error',
          { maxNumericValue: 2_500, aggregationMethod: 'median' },
        ],
        'cumulative-layout-shift': [
          'error',
          { maxNumericValue: 0.1, aggregationMethod: 'median' },
        ],
        'total-blocking-time': [
          'error',
          { maxNumericValue: 200, aggregationMethod: 'median' },
        ],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './lhci-results',
      reportFilenamePattern:
        '%%PATHNAME%%-%%DATETIME%%-lab-report.%%EXTENSION%%',
    },
  },
}
