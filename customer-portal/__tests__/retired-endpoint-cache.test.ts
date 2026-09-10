/** @jest-environment node */
import config from '../next.config'

describe('retired endpoint cache override', () => {
  it.each(['/api/referral/:path*', '/api/benchmarks/:path*', '/api/share/:path*', '/api/shared', '/api/whitelabel'])('%s overrides the public HTML cache policy', async (source) => {
    const rules = await config.headers!()
    const rule = rules.find(r => r.source === source)
    expect(rule?.headers).toEqual(expect.arrayContaining([
      { key: 'Cache-Control', value: 'no-store' },
      { key: 'CDN-Cache-Control', value: 'no-store' },
      { key: 'Cloudflare-CDN-Cache-Control', value: 'no-store' },
    ]))
    const htmlRule = rules.findIndex(r => r.headers.some(h => h.value.includes('s-maxage=300')))
    expect(rules.indexOf(rule!)).toBeGreaterThan(htmlRule)
  })
})
