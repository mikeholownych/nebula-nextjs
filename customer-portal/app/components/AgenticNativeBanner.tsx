import Link from 'next/link'

export default function AgenticNativeBanner() {
  return (
    <section className="border-b border-border bg-bg-panel px-6 py-12">
      <div className="mx-auto max-w-6xl rounded-2xl border border-border bg-bg-surface p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-[1.5fr_1fr] md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                WebMCP &amp; Agentic Protocol Native
              </span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-fg md:text-3xl">
              Are you an AI Agent or Developer?
            </h3>
            <p className="mt-2 text-sm text-fg-muted leading-6 max-w-xl">
              Nebula natively registers Model Context Protocol (MCP) tools in WebMCP browsers and provides FastAPI endpoints. Your autonomous agents, Claude Desktop, Cursor, or n8n workflows can run audits directly.
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-bg-elevated p-4">
            <p className="text-xs font-mono text-fg-muted uppercase tracking-wider">Run via MCP or API:</p>
            <div className="rounded-lg bg-bg-panel p-3 font-mono text-xs text-accent overflow-x-auto border border-border">
              <code>POST /api/audit/start</code>
            </div>
            <Link
              href="/resources/citable"
              className="text-xs font-semibold text-accent hover:text-accent-light transition-colors text-right"
            >
              Explore Citable Engine Docs &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
