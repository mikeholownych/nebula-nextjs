import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://nebulacomponents.shop';
test.setTimeout(60_000);
const BUYER_PAGES = [
  '/',
  '/audit',
  '/audit.html',
  '/checkout.html',
  '/thank-you.html',
  '/primer.html',
  '/ai-ops-retainer.html',
  '/agency-partner.html',
  '/growth-launch.html',
  '/learning-center/',
  '/case-studies/',
];

for (const route of BUYER_PAGES) {
  test(`mobile contract ${route}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: 375, height: 812 });
    const response = await page.goto(BASE_URL + route, { waitUntil: 'domcontentloaded' });
    expect(response?.status(), `${route} response`).toBeLessThan(400);
    await expect(page.locator('h1')).toHaveCount(1);
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth, `${route} horizontal overflow`).toBeLessThanOrEqual(overflow.clientWidth + 1);
    expect(errors.filter(error => !error.includes('rb2b') && !error.includes('ERR_NAME_NOT_RESOLVED'))).toEqual([]);
  });
}

test('health and audit APIs work while private targets are blocked', async ({ request }) => {
  const health = await request.get(BASE_URL + '/api/health');
  expect(health.status()).toBe(200);
  expect((await health.json()).status).toBe('ok');

  const audit = await request.post(BASE_URL + '/api/audit', {
    data: { url: 'https://example.com/' },
  });
  expect(audit.status()).toBe(200);
  const result = await audit.json();
  expect(typeof result.score).toBe('number');
  expect(Array.isArray(result.top_issues)).toBeTruthy();

  const ssrf = await request.post(BASE_URL + '/api/audit', {
    data: { url: 'http://127.0.0.1:9000/api/stats' },
  });
  expect(ssrf.status()).toBe(400);
});

test('administrative CRM and lead dashboard are private', async ({ request }) => {
  for (const route of ['/api/crm/leads', '/api/crm/clients', '/api/crm/stats', '/lead-dashboard.html']) {
    const response = await request.get(BASE_URL + route);
    expect(response.status(), route).toBe(401);
  }
  for (const route of ['/HOT_LEAD.json', '/audit_leads.jsonl', '/ops/company_brain.json', '/agentic_server.py', '/.git/config', '/governance/ECONOMICS.md']) {
    const response = await request.get(BASE_URL + route);
    expect(response.status(), route).toBe(404);
  }
});

test('canonical routes and checkout variants redirect correctly', async ({ request }) => {
  const aliases: Record<string, string> = {
    '/privacy-policy': '/privacy-policy.html',
    '/learning-center/paid-traffic-leak-map': '/lead-magnets/paid-traffic-leak-checklist',
    '/create_97_checkout.html': '/checkout.html',
    '/checkout_v2.html': '/checkout.html',
  };
  for (const [source, target] of Object.entries(aliases)) {
    const response = await request.get(BASE_URL + source, { maxRedirects: 0 });
    expect(response.status(), source).toBe(301);
    expect(response.headers().location, source).toBe(target);
  }
});

test('interactive controls have accessible names', async ({ page }) => {
  for (const route of ['/', '/checkout.html', '/generator.html', '/pricing-generator.html']) {
    await page.goto(BASE_URL + route, { waitUntil: 'domcontentloaded' });
    const unnamed = await page.locator('input, textarea, select').evaluateAll((nodes) => {
      const controls = nodes as HTMLInputElement[];
      return controls
        .filter((control) => !['hidden', 'submit', 'button'].includes(control.type))
        .filter((control) => {
          const labels = control.labels;
          return !(control.getAttribute('aria-label') || control.getAttribute('aria-labelledby') || (labels && labels.length));
        })
        .map((control) => control.id || control.name || control.tagName);
    });
    expect(unnamed, route).toEqual([]);
  }
});

test('buyer pages expose only the active Stripe checkout links', async ({ page }) => {
  const expected = new Set([
    'https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b',
    'https://buy.stripe.com/00w5kD1nK0wkaa573A43S0c',
    'https://buy.stripe.com/aFa8wPc2o7YM9613Ro43S0d',
  ]);
  for (const route of ['/', '/checkout.html', '/ai-ops-retainer.html', '/agency-partner.html']) {
    await page.goto(BASE_URL + route, { waitUntil: 'domcontentloaded' });
    const links = await page.locator('a[href*="buy.stripe.com"]').evaluateAll(nodes => nodes.map(node => (node as HTMLAnchorElement).href));
    for (const link of links) expect(expected.has(link), `${route}: ${link}`).toBeTruthy();
  }
});

test('invalid lead-capture payloads fail closed', async ({ request }) => {
  const expected: Record<string, number> = {
    '/api/audit': 400,
    '/api/free-kit': 400,
    '/api/leaderboard-submit': 400,
    '/api/book-demo': 400,
    '/newsletter': 400,
  };
  for (const [route, status] of Object.entries(expected)) {
    const response = route === '/newsletter'
      ? await request.post(BASE_URL + route, { form: { email: 'invalid' } })
      : await request.post(BASE_URL + route, { data: {} });
    expect(response.status(), route).toBe(status);
  }
});
