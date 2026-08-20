import React from 'react'
import { Check, Minus } from 'lucide-react'

interface FeatureRow {
  name: string
  free: string | boolean
  pro: string | boolean
  growth: string | boolean
  agency: string | boolean
}

interface FeatureCategory {
  category: string
  rows: FeatureRow[]
}

const COMPARISON_DATA: FeatureCategory[] = [
  {
    category: 'Audits & Capacity',
    rows: [
      {
        name: 'Monthly audits',
        free: '1 / month',
        pro: '20 / month',
        growth: 'Unlimited',
        agency: 'Unlimited',
      },
      {
        name: 'Monitored URLs',
        free: false,
        pro: '3 URLs (weekly)',
        growth: '10 URLs (weekly)',
        agency: 'Unlimited',
      },
      {
        name: 'Team seats',
        free: '1 seat',
        pro: '1 seat',
        growth: '5 seats',
        agency: 'Unlimited',
      },
      {
        name: 'Client workspaces',
        free: false,
        pro: false,
        growth: false,
        agency: '25 isolated workspaces',
      },
    ],
  },
  {
    category: 'Diagnostics & Evidence',
    rows: [
      {
        name: '9-Signal diagnosis & score',
        free: true,
        pro: true,
        growth: true,
        agency: true,
      },
      {
        name: 'Full HTML evidence & selectors',
        free: false,
        pro: true,
        growth: true,
        agency: true,
      },
      {
        name: 'Regression alerts & weekly monitoring',
        free: false,
        pro: true,
        growth: true,
        agency: true,
      },
      {
        name: 'Historical score tracking',
        free: false,
        pro: true,
        growth: true,
        agency: true,
      },
      {
        name: 'Before / after re-audit compare',
        free: false,
        pro: true,
        growth: true,
        agency: true,
      },
      {
        name: 'Competitor page monitoring',
        free: false,
        pro: false,
        growth: '3 URLs',
        agency: 'Unlimited',
      },
    ],
  },
  {
    category: 'Exports, Branding & API',
    rows: [
      {
        name: 'PDF report export',
        free: false,
        pro: true,
        growth: true,
        agency: true,
      },
      {
        name: 'White-label PDF reports',
        free: false,
        pro: false,
        growth: true,
        agency: true,
      },
      {
        name: 'Custom report domain & branding',
        free: false,
        pro: false,
        growth: false,
        agency: true,
      },
      {
        name: 'API access & bulk CSV import/export',
        free: false,
        pro: false,
        growth: true,
        agency: true,
      },
    ],
  },
  {
    category: 'Support & Onboarding',
    rows: [
      {
        name: 'Support channel',
        free: 'Community',
        pro: 'Email support',
        growth: 'Priority email',
        agency: 'Same-day + Onboarding',
      },
      {
        name: 'Repair Sprint ($97 one-time fix)',
        free: 'Add-on',
        pro: 'Add-on',
        growth: 'Add-on',
        agency: 'Reseller margin',
      },
    ],
  },
]

function renderCell(val: string | boolean) {
  if (typeof val === 'boolean') {
    return val ? (
      <Check className="mx-auto h-4 w-4 text-accent" />
    ) : (
      <Minus className="mx-auto h-4 w-4 text-fg-muted/40" />
    )
  }
  return <span className="text-xs sm:text-sm">{val}</span>
}

export default function PricingComparisonTable() {
  return (
    <section aria-labelledby="plan-comparison" className="mt-16">
      <div className="mb-8 text-center">
        <h2 id="plan-comparison" className="text-2xl font-bold text-fg">
          Compare membership plans
        </h2>
        <p className="mt-2 text-sm text-fg-muted">
          Full side-by-side breakdown of quotas, diagnostics, and white-label capabilities.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-bg-surface/50">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-panel/80">
              <th className="p-4 font-semibold text-fg min-w-[200px]">Feature</th>
              <th className="p-4 text-center font-semibold text-fg min-w-[120px]">
                Free
                <span className="block text-xs font-normal text-fg-muted">$0</span>
              </th>
              <th className="p-4 text-center font-semibold text-fg min-w-[120px]">
                Pro
                <span className="block text-xs font-normal text-fg-muted">$29/mo</span>
              </th>
              <th className="p-4 text-center font-semibold text-accent min-w-[120px] bg-accent/5">
                Growth
                <span className="block text-xs font-normal text-accent/80">$79/mo</span>
              </th>
              <th className="p-4 text-center font-semibold text-fg min-w-[120px]">
                Agency
                <span className="block text-xs font-normal text-fg-muted">$199/mo</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-fg-muted">
            {COMPARISON_DATA.map((cat) => (
              <React.Fragment key={cat.category}>
                <tr className="bg-bg-muted/30">
                  <td
                    colSpan={5}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-fg"
                  >
                    {cat.category}
                  </td>
                </tr>
                {cat.rows.map((row) => (
                  <tr key={row.name} className="hover:bg-bg-panel/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-fg text-xs sm:text-sm">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 text-center">{renderCell(row.free)}</td>
                    <td className="px-4 py-3 text-center">{renderCell(row.pro)}</td>
                    <td className="px-4 py-3 text-center bg-accent/5 font-medium text-fg">
                      {renderCell(row.growth)}
                    </td>
                    <td className="px-4 py-3 text-center">{renderCell(row.agency)}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
