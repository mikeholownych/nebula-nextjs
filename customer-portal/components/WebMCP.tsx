import { getActiveFixPack } from '@/app/lib/public-facts'

const ACTIVE_FIX_PACK = getActiveFixPack()

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

      context.registerTool({
        name: 'request_audit',
        description: 'Request a free landing page conversion audit from Nebula Components. Provide the landing page URL. Returns audit submission confirmation.',
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
        execute: function (input) {
          var params = new URLSearchParams({ url: input.url });
          if (input.email) params.set('email', input.email);
          var target = '/audit?' + params.toString();
          window.location.href = target;
          return { status: 'redirecting', url: target };
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
              description: 'Automated landing page audit — 9 conversion signals: message match, trust signals, mobile CTA, above the fold, ad signals, SEO foundations, AI readiness, CTA clarity, and load speed.',
              url: 'https://nebulacomponents.com/audit',
            },
            {
              name: 'One-Leak Self-Implementation Kit',
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
