/** @jest-environment node */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const spec = JSON.parse(
  readFileSync(join(process.cwd(), 'public', 'openapi.json'), 'utf8'),
)

const paidRoutes = [
  ['/api/v1', 'get'],
  ['/api/audit/run', 'post'],
] as const

const auditResultSchema = expect.objectContaining({
  type: 'object',
  properties: expect.objectContaining({
    score: expect.any(Object),
    findings: expect.any(Object),
  }),
})

describe('x402scan OpenAPI discovery contract', () => {
  it('publishes ownership contact and agent guidance', () => {
    expect(spec.info.contact.email).toBe('hello@nebulacomponents.shop')
    expect(spec.info['x-guidance']).toEqual(expect.any(String))
    expect(spec.info['x-guidance'].length).toBeGreaterThan(20)
  })

  it.each([
    ...paidRoutes,
  ])('%s declares structured x402 pricing and output schema', (path, method) => {
    const operation = spec.paths[path][method]
    expect(operation['x-payment-info']).toEqual(
      expect.objectContaining({
        price: { mode: 'fixed', currency: 'USD', amount: '0.10' },
        protocols: [{ x402: {} }],
      }),
    )
    expect(operation.responses['402'].description).toBe('Payment Required')
    expect(operation.responses['200'].content['application/json'].schema).toEqual(
      auditResultSchema,
    )
  })

  it('declares an invocable required URL query parameter for GET /v1', () => {
    expect(spec.servers).toEqual([{ url: 'https://nebulacomponents.shop' }])
    const operation = spec.paths['/api/v1'].get
    expect(operation.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'url',
          in: 'query',
          required: true,
          schema: expect.objectContaining({
            type: 'string',
            format: 'uri',
            example: 'https://example.com',
          }),
        }),
      ]),
    )
  })

  it('declares an invocable JSON body for POST /audit/run', () => {
    const body = spec.paths['/api/audit/run'].post.requestBody
    expect(body.required).toBe(true)
    expect(body.content['application/json'].schema).toEqual(
      expect.objectContaining({
        type: 'object',
        required: expect.arrayContaining(['url']),
        properties: expect.objectContaining({
          url: expect.objectContaining({ type: 'string', format: 'uri' }),
        }),
      }),
    )
    expect(body.content['application/json'].example).toEqual({
      url: 'https://example.com',
    })
  })

  it.each([
    ['/api/checkout', 'post'],
    ['/api/audit/start', 'post'],
  ])('%s is explicitly free/non-x402 discovery metadata', (path, method) => {
    const operation = spec.paths[path][method]
    expect(operation.security).toEqual([])
    expect(operation['x-payment-info']).toBeUndefined()
    expect(operation.responses['402']).toBeUndefined()
  })
})
