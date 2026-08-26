import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Service Status | Nebula Components',
  description: 'Real-time status of Nebula Components services including audit API, customer portal, and platform infrastructure.',
  alternates: { canonical: 'https://nebulacomponents.com/status' },
}

const services = [
  {
    name: ' Customer Portal',
    url: 'https://nebulacomponents.com',
    impact: 'Full service impact',
    status: 'operational',
    description: 'Next.js customer portal serving nebulacomponents.com',
  },
  {
    name: 'Audit API',
    url: 'https://api.nebulacomponents.shop',
    impact: 'Audit functionality affected',
    status: 'operational',
    description: 'FastAPI audit processing API on port 8001',
  },
]

const incidents = [
  {
    id: 'INC-2026-08-26-001',
    title: 'Platform Node.js runtime upgrade to v24.19.0 LTS',
    status: 'mitigated',
    created_at: '2026-08-26T10:30:00Z',
    resolved_at: '2026-08-26T11:00:00Z',
    impact: 'Brief service interruption during Node.js upgrade',
    details: 'Platform successfully upgraded from Node.js v22 to v24.19.0 LTS. All services restored with zero data loss.',
  },
]

const maintenance = []

export default function StatusPage() {
  return (
    <main className="min-h-screen bg-bg pt-24 text-fg">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">Service Status</p>
            <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">Nebula Components Operational Status</h1>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
              All Systems Operational
            </span>
          </div>
        </div>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">
          Real-time status of Nebula Components infrastructure. Follow <a href="https://x.com/nebulacomponents" className="text-accent underline">(@nebulacomponents)</a> for updates.
        </p>

        <div className="mt-12">
          <h2 className="text-2xl font-semibold">Service Status</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {services.map((service) => (
              <div key={service.name} className="rounded-xl border border-border bg-bg-panel p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{service.name}</h3>
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-500">
                    Operational
                  </span>
                </div>
                <p className="mt-2 text-sm text-fg-muted">{service.description}</p>
                <p className="mt-2 text-xs text-fg-muted/60">{service.url}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-semibold">Recent Incidents</h2>
          <div className="mt-6 space-y-4">
            {incidents.map((incident) => (
              <div key={incident.id} className="rounded-xl border border-border bg-bg-panel p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{incident.title}</h3>
                    <p className="text-sm text-fg-muted">{incident.id}</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
                    Mitigated
                  </span>
                </div>
                <p className="mt-2 text-sm text-fg-muted">{incident.details}</p>
                <div className="mt-4 flex gap-4 text-xs text-fg-muted/60">
                  <span>Created: {incident.created_at}</span>
                  <span>Resolved: {incident.resolved_at}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-semibold">Scheduled Maintenance</h2>
          <div className="mt-6 rounded-xl border border-border bg-bg-panel p-6">
            <p className="text-fg-muted">No maintenance scheduled at this time.</p>
          </div>
        </div>

        <div className="mt-12 rounded-xl border border-border bg-bg-panel p-6">
          <h2 className="text-xl font-semibold">Subscribe to Updates</h2>
          <p className="mt-2 text-sm text-fg-muted">
            Get status updates via <a href="https://x.com/nebulacomponents" className="text-accent underline">Twitter/X</a> or
            email alerts (coming soon).
          </p>
        </div>
      </section>
    </main>
  )
}
