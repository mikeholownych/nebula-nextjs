module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/learning-centre',
        'http://localhost:3000/learning-centre/landing-page-not-converting',
        'http://localhost:3000/resources/citable',
        'http://localhost:3000/resources/citable/jobs/technical-retrieval-audit',
      ],
      numberOfRuns: 3,
      startServerCommand: 'npm run start',
      startServerReadyPattern: '(?:^|\\s)Ready in \\d',
      startServerReadyTimeout: 120_000,
      settings: {
        onlyCategories: ['performance'],
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
