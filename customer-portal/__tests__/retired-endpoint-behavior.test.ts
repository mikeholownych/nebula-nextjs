/** @jest-environment node */
import * as route0 from '@/app/api/referral/[code]/route'
import * as route1 from '@/app/api/referral/route'
import * as route2 from '@/app/api/referral/summary/[code]/route'
import * as route3 from '@/app/api/referral/validate/[code]/route'
import * as route4 from '@/app/api/benchmarks/compare/route'
import * as route5 from '@/app/api/benchmarks/industries/[industry]/route'
import * as route6 from '@/app/api/benchmarks/industries/route'
import * as route7 from '@/app/api/benchmarks/summary/route'
import * as route8 from '@/app/api/share/audit/[auditId]/route'
import * as route9 from '@/app/api/share/iframe/[auditId]/route'
import * as route10 from '@/app/api/share/widget/[auditId]/route'
import * as route11 from '@/app/api/shared/route'
import * as route12 from '@/app/api/whitelabel/route'

const cases = [  { name: "app/api/referral/[code]/route.ts", handler: route0.GET, method: 'GET' },
  { name: "app/api/referral/[code]/route.ts", handler: route0.POST, method: 'POST' },
  { name: "app/api/referral/route.ts", handler: route1.GET, method: 'GET' },
  { name: "app/api/referral/route.ts", handler: route1.POST, method: 'POST' },
  { name: "app/api/referral/summary/[code]/route.ts", handler: route2.GET, method: 'GET' },
  { name: "app/api/referral/validate/[code]/route.ts", handler: route3.GET, method: 'GET' },
  { name: "app/api/benchmarks/compare/route.ts", handler: route4.POST, method: 'POST' },
  { name: "app/api/benchmarks/industries/[industry]/route.ts", handler: route5.GET, method: 'GET' },
  { name: "app/api/benchmarks/industries/route.ts", handler: route6.GET, method: 'GET' },
  { name: "app/api/benchmarks/summary/route.ts", handler: route7.GET, method: 'GET' },
  { name: "app/api/share/audit/[auditId]/route.ts", handler: route8.GET, method: 'GET' },
  { name: "app/api/share/iframe/[auditId]/route.ts", handler: route9.GET, method: 'GET' },
  { name: "app/api/share/widget/[auditId]/route.ts", handler: route10.GET, method: 'GET' },
  { name: "app/api/shared/route.ts", handler: route11.GET, method: 'GET' },
  { name: "app/api/whitelabel/route.ts", handler: route12.POST, method: 'POST' }]
describe('public endpoint containment behavior', () => {
  it.each(cases)('$method $name fails closed without parsing or fetching', async ({ handler, method }) => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('upstream forbidden'))
    try {
      const request = new Request('https://nebulacomponents.com/api/retired?user=admin&token=test', {
        method,
        headers: { authorization: 'Bearer untrusted', 'content-type': 'application/json' },
        ...(method === 'POST' ? { body: '{invalid-json' } : {}),
      })
      const response = await handler(request, { params: Promise.resolve({ code: 'x', auditId: 'x', industry: 'x' }) })
      expect(response.status).toBe(410)
      expect(await response.json()).toEqual({ error: 'Endpoint unavailable', code: 'ENDPOINT_RETIRED' })
      expect(response.headers.get('cache-control')).toBe('no-store')
      expect(response.headers.get('x-robots-tag')).toBe('noindex')
      expect(fetchSpy).not.toHaveBeenCalled()
    } finally { fetchSpy.mockRestore() }
  })
})
