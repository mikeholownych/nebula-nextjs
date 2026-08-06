import { getActiveFixPack } from '@/app/lib/public-facts'

const ACTIVE_FIX_PACK = getActiveFixPack()
const PUBLIC_SIGNAL_LABELS = [
  'message match',
  'trust signals',
  'mobile CTA',
  'load speed',
  'CTA clarity',
  'SEO foundations',
  'AI readiness',
] as const

/**
 * WebMCP — exposes Nebula Components site tools to supporting browsers without
 * introducing a React client boundary into every route.
 *
 * Tools registered:
 *   - request_audit      Request a free landing page audit
 *   - get_pricing        Return current pricing and offer details
 *   - search_learning    Search the Learning Centre
 */
export function WEB_MCP_RUNTIME() {
  return String.raw`
    (function () {
      var context = navigator.modelContext;
      if (!context || typeof context.registerTool !== 'function') return;
      var publicSignals = ${JSON.stringify(PUBLIC_SIGNAL_LABELS)};

      context.registerTool({
        name: 'request_audit',
        description: 'Request a free evidence-backed landing page audit from Nebula Components. Provide the landing page URL. Returns a stable submission result.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The landing page URL to audit (must be publicly accessible)'
            },
            email: {
              type: 'string',
              description: 'Email address to receive the audit report (optional)'
            }
          },
          required: ['url']
        },
        execute: async function (input) {
          if (!input || typeof input.url !== 'string' || !/^https?:\\/\\//i.test(input.url.trim())) {
            return { status: 'error', code: 'INVALID_URL', message: 'Provide a public HTTP or HTTPS URL.' };
          }
          var response = await fetch('/api/audit/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: input.url, email: input.email || undefined }),
          });
          var data = await response.json().catch(function () { return {}; });
          if (!response.ok || !data.audit_id) {
            return { status: 'error', code: data.error || 'AUDIT_SUBMISSION_FAILED', message: 'The audit could not be submitted. Try again from the audit page.' };
          }
          return { status: 'submitted', audit_id: data.audit_id, url: data.url || input.url };
        }
      });

      context.registerTool({
        name: 'get_pricing',
        description:
          'Return current Nebula Components service pricing, offer details, and what is included.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
        execute: () => ({
          offers: [
            {
              name: 'Free Audit',
              price: '$0',
              description: 'Automated landing page audit — evidence-backed checks for ' + publicSignals.join(', ') + '.',
              url: 'https://nebulacomponents.com/audit',
            },
            {
              name: 'One-Leak Repair Sprint',
              price: ${JSON.stringify(ACTIVE_FIX_PACK ? `$${ACTIVE_FIX_PACK.priceCents / 100}` : 'Unavailable')},
              description: 'Tailored implementation instructions for one verified page condition; re-audit verifies the condition changed, not conversion lift.',
              url: 'https://nebulacomponents.com/pricing',
            },

          ],
        }),
      })

      context.registerTool({
        name: 'search_learning',
        description: 'Search the Nebula Components Learning Centre for articles on landing page conversion, CRO, and ad performance.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query — e.g. "message match", "trust signals", "mobile conversion"'
            }
          },
          required: ['query']
        },
        execute: function (input) {
          var target = '/learning-centre?q=' + encodeURIComponent(input.query);
          window.location.href = target;
          return { status: 'redirecting', url: target };
        }
      });
    })();
  `
}

export default function WebMCP() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: WEB_MCP_RUNTIME() }}
    />
  )
}
