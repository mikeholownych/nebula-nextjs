import { getActiveFixPack } from '@/app/lib/public-facts'

const ACTIVE_FIX_PACK = getActiveFixPack()

/**
 * WebMCP - exposes Nebula Components tools to AI agents via navigator.modelContext.
 *
 * Tools:
 *   request_audit      Submit a URL for audit, returns audit_id + synchronous results
 *   get_audit_result   Retrieve findings for a completed audit by ID
 *   get_signals        Return the 9 signals Nebula checks and what each means
 *   get_pricing        Return current offer details
 *   get_repair_sprint  Return what the Repair Sprint delivers (for purchase decisions)
 *
 * Design principles:
 *   - Every tool returns structured data an AI agent can reason over
 *   - No browser redirects - agents need data, not navigation
 *   - Findings include pass/fail, evidence, and the specific fix for each signal
 *   - The repair_sprint tool exists so agents can explain the closed loop to users
 */
export function WEB_MCP_RUNTIME() {
  return String.raw`
    (function () {
      var context = navigator.modelContext;
      if (!context || typeof context.registerTool !== 'function') return;

      // ── Tool 1: analyze_page ────────────────────────────────────────────────
      // Runs a full 9-signal audit synchronously and returns structured findings.
      // This is the primary tool - agents use this to diagnose a page.
      context.registerTool({
        name: 'analyze_page',
        description: 'Run a full Nebula landing page audit and return structured findings. Checks 9 conversion signals against the actual page HTML. Returns pass/fail for each signal with evidence from the page and a specific fix. Use this when a user wants to know what is wrong with their landing page.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The landing page URL to audit. Must be publicly accessible (http or https).'
            }
          },
          required: ['url']
        },
        execute: async function (input) {
          if (!input || typeof input.url !== 'string' || !/^https?:\/\//i.test(input.url.trim())) {
            return { status: 'error', code: 'INVALID_URL', message: 'Provide a public HTTP or HTTPS URL.' };
          }
          var response = await fetch('/api/audit/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: input.url }),
          });
          var data = await response.json().catch(function () { return {}; });
          if (!response.ok) {
            return { status: 'error', code: data.error || 'AUDIT_FAILED', message: 'Audit could not complete. Try again or check the URL is publicly accessible.' };
          }
          return {
            status: 'complete',
            audit_id: data.audit_id,
            url: data.url || input.url,
            score: data.score,
            grade: data.grade,
            findings: data.findings || [],
            results_url: data.audit_id ? ('https://nebulacomponents.com/audit/' + data.audit_id + '/results') : null,
            next_step: data.score < 7 ? 'Page has conversion leaks. See findings for specific fixes. The $97 Repair Sprint at https://nebulacomponents.com/pricing delivers the exact fix for the highest-priority finding.' : 'Page is performing above average. Review findings for any remaining improvement opportunities.'
          };
        }
      });

      // ── Tool 2: get_audit_result ────────────────────────────────────────────
      // Retrieve results for a previously submitted audit by ID.
      context.registerTool({
        name: 'get_audit_result',
        description: 'Retrieve the results of a previously submitted Nebula audit by audit ID. Use this after request_audit to get the full findings, or when a user has an existing audit ID.',
        inputSchema: {
          type: 'object',
          properties: {
            audit_id: {
              type: 'string',
              description: 'The audit ID returned by analyze_page or request_audit.'
            }
          },
          required: ['audit_id']
        },
        execute: async function (input) {
          if (!input || typeof input.audit_id !== 'string') {
            return { status: 'error', code: 'INVALID_ID', message: 'Provide a valid audit_id.' };
          }
          var response = await fetch('/api/audit/' + encodeURIComponent(input.audit_id));
          var data = await response.json().catch(function () { return {}; });
          if (!response.ok) {
            return { status: 'error', code: data.error || 'RESULT_NOT_FOUND', message: 'Could not retrieve audit result. The ID may be invalid or the audit may still be processing.' };
          }
          return {
            status: data.status || 'unknown',
            audit_id: input.audit_id,
            url: data.url,
            score: data.score,
            grade: data.grade,
            findings: data.findings || [],
            results_url: 'https://nebulacomponents.com/audit/' + input.audit_id + '/results'
          };
        }
      });

      // ── Tool 3: get_signals ─────────────────────────────────────────────────
      // Returns the 9 signals Nebula checks - useful for explaining what the audit does.
      context.registerTool({
        name: 'get_signals',
        description: 'Return the 9 conversion signals Nebula checks on every landing page audit, with a description of what each signal measures and why it matters for paid traffic conversion.',
        inputSchema: { type: 'object', properties: {} },
        execute: function () {
          return {
            signals: [
              { key: 'headline', label: 'Headline clarity', description: 'H1 is present, appropriately sized, and contains a value-prop keyword. A weak or missing H1 means visitors cannot immediately understand what the page offers.' },
              { key: 'cta', label: 'CTA presence', description: 'A button or link with an action verb (get, start, buy, try, claim, etc.) is present. No CTA means no clear path to conversion.' },
              { key: 'above_fold', label: 'Above-fold layout', description: 'Both H1 and CTA are present in the first 2000 characters of the page body. Both must be visible before scrolling on most viewports.' },
              { key: 'social_proof', label: 'Social proof', description: 'At least one proof marker is present: testimonial, review count, star rating, logo strip, or press mention. Cold paid traffic requires trust signals.' },
              { key: 'mobile', label: 'Mobile viewport', description: 'The viewport meta tag is present and correctly configured. Missing viewport breaks mobile rendering and is a critical failure for mobile ad traffic.' },
              { key: 'load_speed', label: 'Load speed (TTFB)', description: 'Server response time measured at the origin. Pages over 3 seconds TTFB lose a significant portion of paid traffic before the page loads.' },
              { key: 'ad_signals', label: 'Meta description', description: 'Meta description is present and between 120–160 characters. Controls the preview text in search results and some social sharing contexts.' },
              { key: 'seo_foundations', label: 'SEO foundations', description: 'Title tag, meta description, canonical link, and H1 all present. These are table-stakes for any page receiving organic or paid traffic.' },
              { key: 'ai_readiness', label: 'AI readiness', description: 'JSON-LD structured data is present and heading hierarchy is clean (starts at H1, no skipped levels). Required for AI citation and answer engine visibility.' },
            ],
            total_signals: 9,
            audit_time: 'Under 30 seconds against actual page HTML',
            manual_equivalent: '15–25 minutes in DevTools to check the same signals manually'
          };
        }
      });

      // ── Tool 4: get_pricing ─────────────────────────────────────────────────
      context.registerTool({
        name: 'get_pricing',
        description: 'Return current Nebula Components pricing, offer details, and what is included in each option.',
        inputSchema: { type: 'object', properties: {} },
        execute: function () {
          return {
            offers: [
              {
                name: 'Free Landing Page Audit',
                price: '$0',
                description: 'Checks 9 conversion signals against your actual page HTML. Returns pass/fail with evidence from your page and a specific fix for each failing signal. No signup required.',
                url: 'https://nebulacomponents.com/audit',
                time: 'Under 30 seconds'
              },
              {
                name: 'One-Leak Repair Sprint',
                price: ${JSON.stringify(ACTIVE_FIX_PACK ? `$${ACTIVE_FIX_PACK.priceCents / 100}` : '$97')},
                description: 'Delivers the exact fix for your highest-priority failing signal - the replacement copy, code snippet, or configuration change written for your specific page. Not generic advice. A 30-day re-audit confirms the condition changed.',
                url: 'https://nebulacomponents.com/pricing',
                delivery: '48 hours',
                includes: ['Exact replacement written for your page', '30-day re-audit to verify fix held'],
                stripe_url: 'https://nebulacomponents.com/pricing'
              }
            ]
          };
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
