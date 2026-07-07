/**
 * WebMCP — Expose Nebula Components site tools to AI agents via the browser.
 * Implements navigator.modelContext.registerTool() per WebMCP spec.
 * @see https://webmachinelearning.github.io/webmcp/
 */
(function () {
  'use strict';

  if (typeof navigator.modelContext === 'undefined' || typeof navigator.modelContext.registerTool !== 'function') {
    return; // Browser doesn't support WebMCP — safe no-op
  }

  const signal = new AbortController();

  // Tool 1: Run a landing page audit
  navigator.modelContext.registerTool({
    name: 'run_audit',
    description: 'Submit a landing page URL for a free conversion audit. Returns an audit_id to check results.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          format: 'uri',
          description: 'The landing page URL to audit'
        }
      },
      required: ['url']
    },
    execute: async ({ url }) => {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      return await res.json();
    }
  }, { signal: signal.signal });

  // Tool 2: Check available pricing plans
  navigator.modelContext.registerTool({
    name: 'get_pricing',
    description: 'Get the current pricing plans and offers available on Nebula Components.',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    execute: async () => {
      const res = await fetch('/pricing.html');
      const text = await res.text();
      // Extract relevant pricing info
      return text.substring(0, 2000);
    }
  }, { signal: signal.signal });

  // Tool 3: Search site content
  navigator.modelContext.registerTool({
    name: 'search_site',
    description: 'Search Nebula Components site content for specific topics or pages.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query to find on the site'
        }
      },
      required: ['query']
    },
    execute: async ({ query }) => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      return await res.json();
    }
  }, { signal: signal.signal });

  // Unregister on page unload
  window.addEventListener('beforeunload', () => signal.abort(), { once: true });
})();
