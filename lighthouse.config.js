// Lighthouse performance budget
module.exports = {
  ci: {
    collect: {
      url: ['https://nebulacomponents.com', 'https://nebulacomponents.com/audit'],
      numberOfRuns: 3,
    },
    assert: {
      assertMatrix: [
        {
          matchingPredicate: 'lcp',
          numericValue: 2500,
          aggregationMethod: 'p75',
          error: true,
        },
        {
          matchingPredicate: 'cls',
          numericValue: 0.1,
          aggregationMethod: 'p75',
          error: true,
        },
        {
          matchingPredicate: 'interactive',
          numericValue: 3800,
          aggregationMethod: 'p75',
          error: true,
        },
      ],
    },
  },
};
