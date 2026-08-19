/**
 * Remediation fixture: CTA Clarity signal
 *
 * Validates that the cta rule correctly identifies FAIL conditions
 * and that prescribed repairs move the condition to PASS.
 */

export const CTA_CLARITY_FIXTURE = {
  signal: 'cta',
  ruleVersion: '2.0',

  failCase: {
    description: 'CTA uses vague label with no outcome language, low contrast',
    html: `<!DOCTYPE html>
<html>
<head><title>Acme Project Tool</title></head>
<body>
  <h1>Welcome to Acme</h1>
  <p>We help teams work better together.</p>
  <a href="/learn-more" style="color: #999; font-size: 12px;">Learn More</a>
  <a href="/contact" style="color: #999; font-size: 12px;">Contact Us</a>
</body>
</html>`,
    expectedResult: 'FAIL',
    expectedEvidence: {
      primaryCtaText: null,
      hasActionVerb: false,
      hasOutcomeLanguage: false,
      visibleInViewport: false,
    },
  },

  passCase: {
    description: 'Clear primary CTA with action + outcome copy, visible above fold',
    html: `<!DOCTYPE html>
<html>
<head><title>Acme — Project Management for Growing Teams</title></head>
<body>
  <h1>Ship projects without the chaos</h1>
  <p>Acme gives your team one place for tasks, docs, and deadlines.</p>
  <a href="/signup" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; font-weight: bold; font-size: 16px;">Start Free — No Credit Card</a>
</body>
</html>`,
    expectedResult: 'PASS',
    expectedEvidence: {
      primaryCtaText: 'Start Free — No Credit Card',
      hasActionVerb: true,
      hasOutcomeLanguage: true,
      visibleInViewport: true,
    },
  },

  remediation: {
    description: 'Replace vague links with single prominent CTA using action + outcome',
    changes: [
      {
        target: 'primary CTA',
        before: '<a href="/learn-more" style="color: #999; font-size: 12px;">Learn More</a>',
        after: '<a href="/signup" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; font-weight: bold; font-size: 16px;">Start Free — No Credit Card</a>',
      },
    ],
  },
}
