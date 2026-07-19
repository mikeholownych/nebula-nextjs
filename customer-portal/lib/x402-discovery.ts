import { declareDiscoveryExtension } from '@x402/extensions/bazaar'

const auditInputSchema = {
  type: 'object',
  properties: {
    url: {
      type: 'string',
      format: 'uri',
      minLength: 8,
      description: 'Public HTTP or HTTPS landing-page URL to audit',
    },
  },
  required: ['url'],
  additionalProperties: false,
}

const auditOutputSchema = {
  type: 'object',
  properties: {
    audit_id: { type: 'string' },
    url: { type: 'string', format: 'uri' },
    status: { type: 'string' },
    score: { type: 'number', minimum: 0, maximum: 100 },
    grade: { type: 'string' },
    findings: {
      type: 'array',
      items: { type: 'object', additionalProperties: true },
    },
  },
  required: ['score', 'findings'],
  additionalProperties: true,
}

const auditExample = { url: 'https://example.com' }
const auditOutput = {
  example: {
    audit_id: 'audit_example',
    url: 'https://example.com',
    status: 'completed',
    score: 72,
    grade: 'C',
    findings: [],
  },
  schema: auditOutputSchema,
}

export const auditQueryDiscovery = declareDiscoveryExtension({
  input: auditExample,
  inputSchema: auditInputSchema,
  output: auditOutput,
})

export const auditBodyDiscovery = declareDiscoveryExtension({
  bodyType: 'json',
  input: auditExample,
  inputSchema: auditInputSchema,
  output: auditOutput,
})
