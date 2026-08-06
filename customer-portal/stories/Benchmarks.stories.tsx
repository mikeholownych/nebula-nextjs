import type { Meta, StoryObj } from '@storybook/nextjs'
import Benchmarks, { type BenchmarksData } from '@/app/benchmarks/Benchmarks'

const sample: BenchmarksData = { audit_count: 131, avg_score: null, highest: null, lowest: null, avg_failures_per_page: 2.6, top_leak: { label: 'Seo Foundations', failures: 103, avg_impact: 4.2, share: 79 }, generated_at: '2026-08-06T00:00:00Z', components: [{ label: 'Seo Foundations', failures: 103, avg_impact: 4.2, share: 79 }, { label: 'Cta', failures: 50, avg_impact: 2.1, share: 38 }, { label: 'Load Speed', failures: 20, avg_impact: 1.2, share: 15 }], distribution: [] }
const meta = { title: 'Tier 1/Benchmarks', component: Benchmarks, tags: ['autodocs'], parameters: { docs: { description: { component: 'Verified-sample benchmark surface. The story fixture includes only the seven-signal public registry shape and null composite score fields; deprecated keys are intentionally absent.' } } } } satisfies Meta<typeof Benchmarks>
export default meta
type Story = StoryObj<typeof meta>
export const FilteredVerifiedCardSet: Story = { args: { initialData: sample } }
